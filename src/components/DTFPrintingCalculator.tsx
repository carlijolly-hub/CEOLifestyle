import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { 
  Printer, 
  DollarSign, 
  Layers, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  Award,
  AlertCircle,
  User,
  SlidersHorizontal,
  X,
  PlusCircle,
  CheckCircle2,
  TrendingUp,
  Truck,
  BookmarkPlus,
  Info
} from "lucide-react";
import { SystemSettings, DTFSupplier, SavedQuotation } from "../types";
import { DEFAULT_DTF_SUPPLIERS, DEFAULT_QUOTE_TEMPLATES, formatQuoteTemplate, saveSystemSettings } from "../utils/settingsHelper";
import { normalizeQuotation } from "../utils/quotationUtils";
import { loadEnvironmentQuotations, saveEnvironmentQuotations } from "../utils/environmentUtils";
import { formatDimensionPair } from "../utils/measurementUtils";

interface DTFPrintingCalculatorProps {
  settings?: SystemSettings;
  onUpdateSettings?: (settings: SystemSettings) => void;
}

interface AdditionalFeeItem {
  id: string;
  name: string;
  amount: number;
}

export default function DTFPrintingCalculator({ settings, onUpdateSettings }: DTFPrintingCalculatorProps) {
  // Master Supplier List from settings or defaults
  const masterSuppliers = useMemo(() => {
    return settings?.dtfSuppliers || DEFAULT_DTF_SUPPLIERS;
  }, [settings?.dtfSuppliers]);

  // Active suppliers for sourcing evaluation
  const activeSuppliers = useMemo(() => {
    const list = masterSuppliers.filter(s => s.active);
    return list.length > 0 ? list : masterSuppliers;
  }, [masterSuppliers]);

  // Optional Client & Order Information
  const [clientName, setClientName] = useState<string>(() => {
    return localStorage.getItem("calc_sourced_dtf_client") || "";
  });

  const [orderTitle, setOrderTitle] = useState<string>(() => {
    return localStorage.getItem("calc_sourced_dtf_title") || "";
  });

  // Required Job Dimensions (Inputs)
  const [requiredWidthInput, setRequiredWidthInput] = useState<string>(() => {
    return localStorage.getItem("calc_sourced_dtf_req_w") || "22";
  });

  const [requiredLengthInput, setRequiredLengthInput] = useState<string>(() => {
    return localStorage.getItem("calc_sourced_dtf_req_l") || "90";
  });

  // Parse numeric values
  const numReqWidth = parseFloat(requiredWidthInput) || 0;
  const numReqLength = parseFloat(requiredLengthInput) || 0;
  const isJobValid = numReqWidth > 0 && numReqLength > 0;

  // Area Calculations for the Required Job
  // Required Area in Square Inches = Width × Length
  const requiredAreaSqIn = isJobValid ? numReqWidth * numReqLength : 0;
  // Required Job Area in Square Feet = (Width × Length) ÷ 144
  const requiredAreaSqFt = isJobValid ? requiredAreaSqIn / 144 : 0;

  // Selected supplier ID (defaults to lowest-cost best option)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  // Commercial Pricing / Markup state
  const [markupPercent, setMarkupPercent] = useState<number>(() => {
    const saved = localStorage.getItem("calc_sourced_dtf_markup");
    return saved !== null ? parseFloat(saved) : 50;
  });

  const [pricingMode, setPricingMode] = useState<"markup" | "custom">("markup");
  const [customPriceInput, setCustomPriceInput] = useState<string>("");

  // Additional Fees State
  const [additionalFees, setAdditionalFees] = useState<AdditionalFeeItem[]>(() => {
    try {
      const saved = localStorage.getItem("calc_sourced_dtf_fees");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [feePresetName, setFeePresetName] = useState<string>("Setup & File Prep Fee");
  const [customFeeName, setCustomFeeName] = useState<string>("");
  const [feeAmountInput, setFeeAmountInput] = useState<string>("");

  // Client Delivery Method selection
  const [selectedDeliveryMethodId, setSelectedDeliveryMethodId] = useState<string>(() => {
    return settings?.deliveryMethods?.find(m => m.active)?.id || "del_knutsford";
  });

  // Modals & Feedback
  const [showSupplierModal, setShowSupplierModal] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<DTFSupplier | null>(null);
  const [copiedQuote, setCopiedQuote] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useBodyScrollLock(showSupplierModal);

  // Persist input values
  const handleClientNameChange = (val: string) => {
    setClientName(val);
    localStorage.setItem("calc_sourced_dtf_client", val);
  };

  const handleOrderTitleChange = (val: string) => {
    setOrderTitle(val);
    localStorage.setItem("calc_sourced_dtf_title", val);
  };

  const handleWidthChange = (val: string) => {
    setRequiredWidthInput(val);
    localStorage.setItem("calc_sourced_dtf_req_w", val);
  };

  const handleLengthChange = (val: string) => {
    setRequiredLengthInput(val);
    localStorage.setItem("calc_sourced_dtf_req_l", val);
  };

  const handleMarkupChange = (val: number) => {
    setMarkupPercent(val);
    localStorage.setItem("calc_sourced_dtf_markup", String(val));
  };

  // Sourcing Evaluation for All Active Suppliers
  const supplierAnalysisList = useMemo(() => {
    return activeSuppliers.map(sup => {
      const sheetW = Math.max(0.1, Number(sup.sheetWidth) || 1);
      const sheetH = Math.max(0.1, Number(sup.sheetHeight) || 1);
      const costPerSheet = Math.max(0, Number(sup.costPerSheet) || 0);
      const deliveryCost = Math.max(0, Number(sup.deliveryCost) || 0);

      // Supplier Sheet Area in Sq Ft = Width × Height ÷ 144
      const sheetAreaSqFt = (sheetW * sheetH) / 144;

      // Supplier $/Sq Ft = Cost / Sheet ÷ Sheet Area
      // Delivery Fee is strictly EXCLUDED from $/sq ft!
      const pricePerSqFt = sheetAreaSqFt > 0 ? costPerSheet / sheetAreaSqFt : 0;

      // New Intelligence: Convert the SAME area to each supplier's width
      // Equivalent Supplier Length = Required Area in Square Inches ÷ Supplier Sheet Width
      const equivalentLength = isJobValid && sheetW > 0 ? requiredAreaSqIn / sheetW : 0;
      const equivalentSheetDisplay = formatDimensionPair(sheetW, equivalentLength, "in");

      // Supplier Job Cost = Required Job Square Footage × Supplier $/Sq Ft
      const jobCost = requiredAreaSqFt * pricePerSqFt;

      // Total Sourcing Cost = Supplier Job Cost + Delivery Fee
      const totalSourcingCost = jobCost + deliveryCost;

      return {
        supplier: sup,
        sheetWidth: sheetW,
        sheetHeight: sheetH,
        sheetAreaSqFt,
        pricePerSqFt,
        equivalentLength,
        equivalentSheetDisplay,
        jobCost,
        deliveryFee: deliveryCost,
        totalSourcingCost
      };
    }).sort((a, b) => a.totalSourcingCost - b.totalSourcingCost); // Lowest total sourcing cost first!
  }, [activeSuppliers, isJobValid, requiredAreaSqIn, requiredAreaSqFt]);

  // Identify Best Option (Lowest Total Sourcing Cost)
  const bestOption = supplierAnalysisList[0] || null;

  // Savings vs Next Best
  const savingsVsNextBest = useMemo(() => {
    if (supplierAnalysisList.length <= 1 || !bestOption) return 0;
    const nextBest = supplierAnalysisList[1];
    return Math.max(0, nextBest.totalSourcingCost - bestOption.totalSourcingCost);
  }, [supplierAnalysisList, bestOption]);

  // Currently selected supplier for quote generation (defaults to bestOption)
  const selectedSupplierAnalysis = useMemo(() => {
    if (!selectedSupplierId) return bestOption;
    return supplierAnalysisList.find(s => s.supplier.id === selectedSupplierId) || bestOption;
  }, [selectedSupplierId, supplierAnalysisList, bestOption]);

  // Financial Calculations for Client Quoting
  const totalAdditionalFees = useMemo(() => {
    return additionalFees.reduce((acc, f) => acc + (f.amount || 0), 0);
  }, [additionalFees]);

  const activeDeliveryMethod = useMemo(() => {
    const list = settings?.deliveryMethods || [];
    return list.find(m => m.id === selectedDeliveryMethodId) || list[0] || {
      id: "default_knutsford",
      name: "Knutsford Express",
      defaultCost: 0,
      messageTemplate: "Dispatched via Knutsford Express once production completes. Tracking will be shared."
    };
  }, [settings?.deliveryMethods, selectedDeliveryMethodId]);

  const clientDeliveryFee = Number(activeDeliveryMethod.defaultCost) || 0;

  // Base Customer Price (before additional fees & delivery)
  const baseCustomerQuotedPrice = useMemo(() => {
    if (!selectedSupplierAnalysis) return 0;
    if (pricingMode === "custom") {
      return Math.max(0, parseFloat(customPriceInput) || 0);
    }
    // Markup based on Job Cost
    const markupFactor = 1 + (markupPercent / 100);
    return Math.round(selectedSupplierAnalysis.jobCost * markupFactor);
  }, [selectedSupplierAnalysis, pricingMode, customPriceInput, markupPercent]);

  // Total Quoted to Client
  const totalCustomerPrice = useMemo(() => {
    return baseCustomerQuotedPrice + totalAdditionalFees + clientDeliveryFee;
  }, [baseCustomerQuotedPrice, totalAdditionalFees, clientDeliveryFee]);

  // Gross Profit & Margin
  const totalSourcingCostForSelected = selectedSupplierAnalysis?.totalSourcingCost || 0;
  const grossProfit = totalCustomerPrice - totalSourcingCostForSelected;
  const profitMarginPercent = totalCustomerPrice > 0 
    ? Math.round((grossProfit / totalCustomerPrice) * 100) 
    : 0;

  // Additional Fees Handlers
  const handleAddFee = () => {
    const feeName = feePresetName === "Custom Fee" ? (customFeeName.trim() || "Custom Fee") : feePresetName;
    const feeAmount = parseFloat(feeAmountInput) || 0;
    if (feeAmount <= 0) return;

    const updated = [
      ...additionalFees,
      {
        id: `fee-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: feeName,
        amount: feeAmount
      }
    ];
    setAdditionalFees(updated);
    localStorage.setItem("calc_sourced_dtf_fees", JSON.stringify(updated));
    setFeeAmountInput("");
    setCustomFeeName("");
  };

  const handleRemoveFee = (id: string) => {
    const updated = additionalFees.filter(f => f.id !== id);
    setAdditionalFees(updated);
    localStorage.setItem("calc_sourced_dtf_fees", JSON.stringify(updated));
  };

  // Supplier Management Helpers (Master Admin)
  const handleSaveSupplier = (supplierToSave: DTFSupplier) => {
    const current = settings?.dtfSuppliers || DEFAULT_DTF_SUPPLIERS;
    const exists = current.some(s => s.id === supplierToSave.id);
    const updated = exists
      ? current.map(s => s.id === supplierToSave.id ? supplierToSave : s)
      : [...current, supplierToSave];

    if (onUpdateSettings && settings) {
      onUpdateSettings({ ...settings, dtfSuppliers: updated });
    } else {
      saveSystemSettings({ ...(settings || ({} as SystemSettings)), dtfSuppliers: updated });
    }

    setEditingSupplier(null);
  };

  const handleDeleteSupplier = (id: string) => {
    const current = settings?.dtfSuppliers || DEFAULT_DTF_SUPPLIERS;
    if (current.length <= 1) {
      alert("At least one supplier must remain in the system.");
      return;
    }
    const updated = current.filter(s => s.id !== id);

    if (onUpdateSettings && settings) {
      onUpdateSettings({ ...settings, dtfSuppliers: updated });
    } else {
      saveSystemSettings({ ...(settings || ({} as SystemSettings)), dtfSuppliers: updated });
    }

    if (selectedSupplierId === id) {
      setSelectedSupplierId(null);
    }
  };

  const handleToggleSupplierActive = (id: string) => {
    const current = settings?.dtfSuppliers || DEFAULT_DTF_SUPPLIERS;
    const updated = current.map(s => s.id === id ? { ...s, active: !s.active } : s);

    if (onUpdateSettings && settings) {
      onUpdateSettings({ ...settings, dtfSuppliers: updated });
    } else {
      saveSystemSettings({ ...(settings || ({} as SystemSettings)), dtfSuppliers: updated });
    }
  };

  // Quote Generation Text
  const generateQuoteText = () => {
    if (!selectedSupplierAnalysis) return "";

    const customerRespTpl = settings?.quoteTemplates?.find(t => t.active && (t.id === "tpl_customer_response" || t.name === "Customer Response"))
      || DEFAULT_QUOTE_TEMPLATES.find(t => t.id === "tpl_customer_response");
    const customerResponseStr = customerRespTpl?.content.trim() || "Thank you so much for providing those details.\n\nHere is your quotation based on your requested job specifications.";

    const feeLines: string[] = [];
    additionalFees.forEach(f => {
      if (f.amount > 0) {
        feeLines.push(`* ${f.name} – JMD $${f.amount.toLocaleString()}`);
      }
    });
    const addChargesStr = feeLines.join("\n");

    const deliveryMethodName = activeDeliveryMethod.name;
    const deliveryMsg = (activeDeliveryMethod.messageTemplate || "").trim();

    // Check custom quote template
    const dtfTemplate = settings?.quoteTemplates?.find(t => t.active && (t.toolKey === "dtf" || t.id === "tpl_dtf_quote"))
      || DEFAULT_QUOTE_TEMPLATES.find(t => t.id === "tpl_dtf_quote");

    const sizeLabel = `${formatDimensionPair(numReqWidth, numReqLength, "in", 2, true)} (${requiredAreaSqFt.toFixed(2)} sq ft)`;

    if (dtfTemplate) {
      return formatQuoteTemplate(dtfTemplate.content, {
        CustomerResponse: customerResponseStr,
        CustomerName: clientName.trim(),
        ClientName: clientName.trim(),
        OrderTitle: orderTitle.trim(),
        Personalization: orderTitle.trim(),
        PrintSize: sizeLabel,
        Quantity: 1,
        UnitPrice: `JMD $${baseCustomerQuotedPrice.toLocaleString()}`,
        Subtotal: `JMD $${baseCustomerQuotedPrice.toLocaleString()}`,
        AdditionalCharges: addChargesStr,
        DeliveryMethod: deliveryMethodName,
        DeliveryCharge: clientDeliveryFee > 0 ? `JMD $${clientDeliveryFee.toLocaleString()}` : "",
        DiscountPercent: 0,
        DiscountAmount: "",
        GrandTotal: `JMD $${totalCustomerPrice.toLocaleString()}`,
        DeliveryMessage: deliveryMsg,
        BusinessName: settings?.companyName || "CEO Lifestyle"
      });
    }

    const sections: string[] = [];
    const greeting = clientName.trim()
      ? `Hi ${clientName.trim()},\n\nThank you so much for providing those details. Here is your personalized quotation based on your request:`
      : "Thank you so much for providing those details. Here is your quotation based on your request:";
    sections.push(greeting);

    if (clientName.trim()) {
      sections.push(`Client: ${clientName.trim()}`);
    }

    if (orderTitle.trim()) {
      sections.push(`Job / Order Reference: ${orderTitle.trim()}`);
    }

    sections.push(`Required Job Specifications:\n* Dimensions: ${formatDimensionPair(numReqWidth, numReqLength, "in", 2, true)}\n* Total Print Area: ${requiredAreaSqFt.toFixed(2)} sq ft (${requiredAreaSqIn.toLocaleString()} sq in)\n* Quoted Print Price: JMD $${baseCustomerQuotedPrice.toLocaleString()}`);

    if (addChargesStr) {
      sections.push(`Additional Charges:\n${addChargesStr}`);
    }

    if (clientDeliveryFee > 0) {
      sections.push(`Delivery Method: ${deliveryMethodName} – JMD $${clientDeliveryFee.toLocaleString()}\n${deliveryMsg}`);
    } else {
      sections.push(`Delivery Method: ${deliveryMethodName}\n${deliveryMsg}`);
    }

    sections.push(`Grand Total: JMD $${totalCustomerPrice.toLocaleString()}\n(Includes sourced DTF production unless otherwise stated.)`);
    sections.push("Let me know if you would like to proceed.");

    return sections.join("\n\n");
  };

  const handleCopyQuote = () => {
    const quoteText = generateQuoteText();
    if (!quoteText) return;
    navigator.clipboard.writeText(quoteText);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 3000);
  };

  const handleSaveQuotation = () => {
    if (!selectedSupplierAnalysis) return;

    const newQuote: SavedQuotation = normalizeQuotation({
      id: "quote_" + Date.now(),
      quoteNumber: `SDTF-QT-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: clientName.trim() || "Sourced DTF Client",
      toolType: "dtf",
      title: orderTitle.trim() 
        ? `Sourced DTF: ${orderTitle.trim()} (${numReqWidth}" × ${numReqLength}")` 
        : `Sourced DTF Transfer (${numReqWidth}" × ${numReqLength}")`,
      date: new Date().toISOString().split("T")[0],
      totalCost: selectedSupplierAnalysis.totalSourcingCost,
      quotedPrice: totalCustomerPrice,
      details: `Required Job: ${numReqWidth}" × ${numReqLength}" (${requiredAreaSqFt.toFixed(2)} sq ft). Sourced via ${selectedSupplierAnalysis.supplier.name} (${selectedSupplierAnalysis.equivalentSheetDisplay}). Sourcing Cost: $${selectedSupplierAnalysis.totalSourcingCost.toLocaleString()} JMD. Quoted: $${totalCustomerPrice.toLocaleString()} JMD.`,
      summaryText: `Sourced DTF (${numReqWidth}" × ${numReqLength}" - ${requiredAreaSqFt.toFixed(2)} sq ft)`,
      subtotalJMD: baseCustomerQuotedPrice,
      totalJMD: totalCustomerPrice,
      formattedResponseText: generateQuoteText(),
      createdAt: new Date().toISOString(),
      createdBy: "Master Administrator",
      status: "Active"
    });

    const existing = loadEnvironmentQuotations();
    const updated = [newQuote, ...existing];
    saveEnvironmentQuotations(updated);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="bg-white border border-slate-200/70 rounded-3xl p-5 sm:p-7 shadow-xs space-y-7 text-left animate-fade-in" id="sourced-dtf-calculator-widget">
      
      {/* 1. Header: Sourced DTF — Supplier Comparison Analysis */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 shadow-2xs">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800 rounded-md">
                Sourced DTF
              </span>
              <span className="text-[11px] font-semibold text-slate-400">Production Sourcing</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-0.5">
              Supplier Comparison Analysis
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowSupplierModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Manage Supplier Sheet Sizes, Costs & Delivery Fees"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Manage Suppliers</span>
          </button>

          <button
            type="button"
            onClick={handleSaveQuotation}
            disabled={!isJobValid}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs ${
              savedSuccess
                ? "bg-emerald-600 text-white"
                : !isJobValid
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-800 hover:bg-slate-700 text-white"
            }`}
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                <span>Quotation Saved!</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-3.5 h-3.5 text-slate-300" />
                <span>Save Quote</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopyQuote}
            disabled={!isJobValid}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs ${
              copiedQuote
                ? "bg-emerald-600 text-white"
                : !isJobValid
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            {copiedQuote ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-200" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-indigo-200" />
                <span>Copy Quote</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Top Grid: Order & Client (Optional) + Required Job (Inputs) + Best Option Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Job Specifications (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Section A: Order & Client Information — Optional */}
          <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Order &amp; Client Information</span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Optional
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Client / Customer Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => handleClientNameChange(e.target.value)}
                  placeholder="E.g. Alexander Vance"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-300 focus:outline-hidden focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Job Reference / Personalization
                </label>
                <input
                  type="text"
                  value={orderTitle}
                  onChange={(e) => handleOrderTitleChange(e.target.value)}
                  placeholder="E.g. Corporate Gala Transfers"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-300 focus:outline-hidden focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section B: Required Job (The Original Customer Job Dimensions) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Required Job
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                Common comparison baseline
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                  <span>Required Width (in)</span>
                  <span className="text-slate-400 font-normal">e.g. 22</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={requiredWidthInput}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-all"
                    placeholder="22"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">in</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                  <span>Required Length (in)</span>
                  <span className="text-slate-400 font-normal">e.g. 90</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={requiredLengthInput}
                    onChange={(e) => handleLengthChange(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500 transition-all"
                    placeholder="90"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">in</span>
                </div>
              </div>
            </div>

            {/* Validation Feedback if invalid */}
            {!isJobValid ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Please enter valid positive dimensions for required width and length.</span>
              </div>
            ) : (
              /* Computed Required Area Highlight Card */
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-700 block mb-0.5">
                    Job Specification
                  </span>
                  <div className="text-sm font-extrabold text-slate-900 flex items-baseline gap-1.5">
                    <span>Required Job:</span>
                    <span className="font-mono text-indigo-950 text-base">{numReqWidth}" × {numReqLength}"</span>
                  </div>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-indigo-200/60 pt-2 sm:pt-0 sm:pl-4">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-700 block mb-0.5">
                    Total Required Area
                  </span>
                  <div className="text-base font-extrabold text-indigo-900 font-mono">
                    {requiredAreaSqFt.toFixed(2)} <span className="text-xs font-bold">sq ft</span>
                    <span className="text-[11px] font-normal text-slate-500 ml-1.5">
                      ({requiredAreaSqIn.toLocaleString()} sq in)
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Original job dimensions remain fixed. Suppliers convert this exact square footage to their sheet width.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Best Option Presentation & Quick Metrics (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          
          {/* Best Option Card */}
          {bestOption ? (
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden flex flex-col justify-between h-full space-y-4">
              {/* Decorative background glow */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-400/20 border border-amber-400/30 rounded-lg text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Best Option</span>
                  </div>

                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Lowest Total Sourcing Cost
                  </span>
                </div>

                <div>
                  <h4 className="text-xl font-black text-white tracking-tight">
                    {bestOption.supplier.name}
                  </h4>
                  <p className="text-xs text-indigo-200/80 font-mono mt-0.5">
                    Equivalent Roll: {bestOption.equivalentSheetDisplay}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Total Sourcing Cost
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                    JMD ${bestOption.totalSourcingCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Sourcing Cost Breakdown */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono text-slate-300">
                  <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60">
                    <span className="text-[9px] font-sans font-bold uppercase text-slate-400 block">Job Cost</span>
                    <span className="font-bold text-white">
                      ${bestOption.jobCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] text-slate-400 font-sans block mt-0.5">
                      @ ${bestOption.pricePerSqFt.toFixed(2)}/sq ft
                    </span>
                  </div>

                  <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60">
                    <span className="text-[9px] font-sans font-bold uppercase text-slate-400 block">Delivery Fee</span>
                    <span className="font-bold text-white">
                      ${bestOption.deliveryFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] text-slate-400 font-sans block mt-0.5">
                      Kept separate
                    </span>
                  </div>
                </div>
              </div>

              {/* Savings vs Next Best Option */}
              {savingsVsNextBest > 0 && (
                <div className="relative z-10 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Savings vs. Next Best:</span>
                  <span className="font-bold font-mono text-amber-300">
                    JMD ${savingsVsNextBest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-full">
              <AlertCircle className="w-6 h-6 text-slate-300 mb-2" />
              <span>No active suppliers configured. Click "Manage Suppliers" to add one.</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Full-Width Supplier Comparison Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Supplier Comparison Analysis
            </h4>
            <p className="text-[11px] text-slate-400">
              Every supplier is evaluated against the exact same required {requiredAreaSqFt.toFixed(2)} sq ft. Best option selected by lowest total cost.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">
              {supplierAnalysisList.length} Active Supplier{supplierAnalysisList.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* Responsive Table Container */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold">
                <th className="py-3 px-3.5">Supplier</th>
                <th className="py-3 px-3">Supplier Sheet</th>
                <th className="py-3 px-3">$/Sq Ft</th>
                <th className="py-3 px-3">Required Job</th>
                <th className="py-3 px-3">Equivalent Supplier Sheet</th>
                <th className="py-3 px-3 text-right">Job Cost</th>
                <th className="py-3 px-3 text-right">Delivery</th>
                <th className="py-3 px-3.5 text-right">Total Sourcing Cost</th>
                <th className="py-3 px-3 text-center">Quote With</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {supplierAnalysisList.map((item, idx) => {
                const isBest = idx === 0;
                const isSelected = selectedSupplierAnalysis?.supplier.id === item.supplier.id;

                return (
                  <tr
                    key={item.supplier.id}
                    onClick={() => setSelectedSupplierId(item.supplier.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/60 font-semibold"
                        : isBest
                        ? "bg-amber-50/30 hover:bg-amber-50/60"
                        : "hover:bg-slate-50/70"
                    }`}
                  >
                    {/* 1. Supplier Name & Badge */}
                    <td className="py-3 px-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{item.supplier.name}</span>
                        {isBest && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-black uppercase bg-amber-100 text-amber-900 rounded-md border border-amber-200/80">
                            <Award className="w-3 h-3 text-amber-600" />
                            <span>Best</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Supplier Sheet Dimensions */}
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {formatDimensionPair(item.sheetWidth, item.sheetHeight, "in")}
                      <span className="text-[10px] text-slate-400 block">
                        ({item.sheetAreaSqFt.toFixed(2)} sq ft)
                      </span>
                    </td>

                    {/* 3. Auto $/Sq Ft (Delivery fee separate) */}
                    <td className="py-3 px-3 font-mono text-slate-700">
                      <span className="font-bold text-indigo-900">
                        ${item.pricePerSqFt.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans block">/ sq ft</span>
                    </td>

                    {/* 4. Required Job (Fixed customer request across all rows) */}
                    <td className="py-3 px-3 font-mono text-slate-700 bg-slate-50/40">
                      <span className="font-bold text-slate-900">
                        {formatDimensionPair(numReqWidth, numReqLength, "in")}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        ({requiredAreaSqFt.toFixed(2)} sq ft)
                      </span>
                    </td>

                    {/* 5. Equivalent Supplier Sheet */}
                    <td className="py-3 px-3 font-mono text-indigo-950">
                      <span className="font-bold text-indigo-700">
                        {item.equivalentSheetDisplay}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-sans">
                        Same {requiredAreaSqFt.toFixed(2)} sq ft
                      </span>
                    </td>

                    {/* 6. Job Cost */}
                    <td className="py-3 px-3 font-mono text-right text-slate-800">
                      ${item.jobCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* 7. Delivery Fee */}
                    <td className="py-3 px-3 font-mono text-right text-slate-600">
                      {item.deliveryFee > 0 ? (
                        `$${item.deliveryFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      ) : (
                        <span className="text-slate-400 font-sans italic">Free / $0</span>
                      )}
                    </td>

                    {/* 8. Total Sourcing Cost */}
                    <td className="py-3 px-3.5 font-mono font-black text-right text-slate-950 text-sm">
                      <span className={isBest ? "text-emerald-600" : "text-slate-900"}>
                        JMD ${item.totalSourcingCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* 9. Select indicator */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSupplierId(item.supplier.id);
                        }}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-2xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                        title="Use this supplier for client quote"
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px] px-1">Select</span>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Commercial Pricing, Additional Fees & Customer Quotation Engine */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-4">
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Commercial Quotation &amp; Margin Calculator
            </h4>
            <div className="label-value-row text-[11px] text-slate-400 mt-0.5">
              <span className="label-value-label font-medium">Selected Supplier:</span>
              <span className="label-value-val">
                <strong className="text-slate-700">{selectedSupplierAnalysis?.supplier.name}</strong> (Sourcing Cost: JMD ${totalSourcingCostForSelected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              </span>
            </div>
          </div>

          {/* Pricing Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setPricingMode("markup")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                pricingMode === "markup"
                  ? "bg-white text-indigo-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Markup %
            </button>
            <button
              type="button"
              onClick={() => setPricingMode("custom")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                pricingMode === "custom"
                  ? "bg-white text-indigo-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Custom Selling Price
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Markup Controls */}
            {pricingMode === "markup" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold uppercase tracking-wider text-slate-600 text-[10px]">
                    Markup on Job Sourcing Cost
                  </span>
                  <span className="font-mono font-bold text-indigo-900">{markupPercent}%</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="150"
                    step="5"
                    value={markupPercent}
                    onChange={(e) => handleMarkupChange(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {[30, 40, 50, 60, 75, 100].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleMarkupChange(pct)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        markupPercent === pct
                          ? "bg-indigo-600 text-white"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                  Custom Customer Selling Price (JMD)
                </label>
                <input
                  type="number"
                  value={customPriceInput}
                  onChange={(e) => setCustomPriceInput(e.target.value)}
                  placeholder={`E.g. ${Math.round(totalSourcingCostForSelected * 1.5)}`}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            )}

            {/* Additional Fees Accordion/Section */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  Additional Fees &amp; Services
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  +{additionalFees.length} Added
                </span>
              </div>

              {/* Fee Input Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-6">
                  <select
                    value={feePresetName}
                    onChange={(e) => setFeePresetName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    <option value="Setup & File Prep Fee">Setup &amp; File Prep Fee</option>
                    <option value="Design & Artwork Digitizing">Design &amp; Artwork Digitizing</option>
                    <option value="Rush Expedited Production">Rush Expedited Production</option>
                    <option value="Packaging & Handling">Packaging &amp; Handling</option>
                    <option value="Custom Fee">Custom Fee...</option>
                  </select>
                </div>

                {feePresetName === "Custom Fee" && (
                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      value={customFeeName}
                      onChange={(e) => setCustomFeeName(e.target.value)}
                      placeholder="Fee Name..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                  </div>
                )}

                <div className={feePresetName === "Custom Fee" ? "sm:col-span-8" : "sm:col-span-4"}>
                  <input
                    type="number"
                    value={feeAmountInput}
                    onChange={(e) => setFeeAmountInput(e.target.value)}
                    placeholder="Amount ($ JMD)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                  />
                </div>

                <div className={feePresetName === "Custom Fee" ? "sm:col-span-4" : "sm:col-span-2"}>
                  <button
                    type="button"
                    onClick={handleAddFee}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Added Fees List */}
              {additionalFees.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  {additionalFees.map(f => (
                    <div key={f.id} className="flex items-center justify-between text-xs py-1 px-2.5 bg-slate-50 rounded-lg">
                      <span className="text-slate-700">{f.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          JMD ${f.amount.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFee(f.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delivery Method Selection for Customer */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  Client Delivery Method
                </span>
                <span className="text-[11px] font-mono text-slate-600">
                  {clientDeliveryFee > 0 ? `JMD $${clientDeliveryFee.toLocaleString()}` : "Free / Included"}
                </span>
              </div>

              <select
                value={selectedDeliveryMethodId}
                onChange={(e) => setSelectedDeliveryMethodId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
              >
                {(settings?.deliveryMethods || []).map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.defaultCost > 0 ? `(+JMD $${m.defaultCost.toLocaleString()})` : "(No Delivery Charge)"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Financial Summary & Quote Preview (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block border-b border-slate-100 pb-2">
                Commercial Summary
              </span>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Print Selling Price:</span>
                  <span className="font-mono font-bold text-slate-900">
                    JMD ${baseCustomerQuotedPrice.toLocaleString()}
                  </span>
                </div>

                {totalAdditionalFees > 0 && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Additional Fees:</span>
                    <span className="font-mono font-bold text-slate-900">
                      +JMD ${totalAdditionalFees.toLocaleString()}
                    </span>
                  </div>
                )}

                {clientDeliveryFee > 0 && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Client Delivery Fee:</span>
                    <span className="font-mono font-bold text-slate-900">
                      +JMD ${clientDeliveryFee.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-sm font-extrabold text-slate-900">
                  <span>Total Quoted to Client:</span>
                  <span className="font-mono text-base text-indigo-950">
                    JMD ${totalCustomerPrice.toLocaleString()}
                  </span>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-200 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">Total Sourcing Cost:</span>
                  <span className="font-mono text-slate-700">
                    -JMD ${totalSourcingCostForSelected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                      Estimated Profit
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-700">
                      JMD ${grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                      Margin
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-700">
                      {profitMarginPercent}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Copy / Save Bar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyQuote}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                {copiedQuote ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                <span>{copiedQuote ? "Copied!" : "Copy Quotation"}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveQuotation}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* 5. Supplier Management Modal (Master Admin) */}
      {showSupplierModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in text-left">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  Manage Sourced DTF Suppliers
                </h3>
                <p className="text-xs text-slate-400">
                  Configure supplier sheet dimensions, cost per sheet, and delivery fees. System automatically calculates $/Sq Ft based on sheet area.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSupplierModal(false);
                  setEditingSupplier(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add / Edit Form */}
            {editingSupplier ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <h4 className="text-xs font-bold text-slate-900">
                    {editingSupplier.id.startsWith("new_") ? "Add New Supplier" : `Edit Supplier: ${editingSupplier.name}`}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingSupplier(null)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Supplier Name</label>
                    <input
                      type="text"
                      value={editingSupplier.name}
                      onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                      placeholder="E.g. Large Format DTF Co."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Sheet Width (in)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editingSupplier.sheetWidth}
                      onChange={(e) => setEditingSupplier({ ...editingSupplier, sheetWidth: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Sheet Height (in)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editingSupplier.sheetHeight}
                      onChange={(e) => setEditingSupplier({ ...editingSupplier, sheetHeight: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Cost / Sheet ($ JMD)</label>
                    <input
                      type="number"
                      value={editingSupplier.costPerSheet}
                      onChange={(e) => setEditingSupplier({ ...editingSupplier, costPerSheet: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Delivery Fee ($ JMD)</label>
                    <input
                      type="number"
                      value={editingSupplier.deliveryCost}
                      onChange={(e) => setEditingSupplier({ ...editingSupplier, deliveryCost: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Auto Calculated $/Sq Ft Display */}
                {(() => {
                  const areaSqFt = (editingSupplier.sheetWidth * editingSupplier.sheetHeight) / 144;
                  const autoPricePerSqFt = areaSqFt > 0 ? editingSupplier.costPerSheet / areaSqFt : 0;
                  return (
                    <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs flex items-center justify-between">
                      <span className="text-slate-600">
                        Sheet Area: <strong className="font-mono text-slate-900">{areaSqFt > 0 ? areaSqFt.toFixed(2) : "0.00"} sq ft</strong>
                      </span>
                      <span className="text-indigo-900">
                        Auto $/Sq Ft: <strong className="font-mono font-bold text-indigo-700">${autoPricePerSqFt.toFixed(2)} / sq ft</strong>
                      </span>
                    </div>
                  );
                })()}

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Supplier Notes</label>
                  <input
                    type="text"
                    value={editingSupplier.notes || ""}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, notes: e.target.value })}
                    placeholder="E.g. Express same-day turnaround available..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSupplier(null)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveSupplier(editingSupplier)}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                  >
                    Save Supplier
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSupplier({
                      id: "dtf_sup_" + Date.now(),
                      name: "New DTF Supplier",
                      sheetWidth: 22,
                      sheetHeight: 100,
                      costPerSheet: 1500,
                      deliveryCost: 500,
                      notes: "",
                      active: true
                    });
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add New Supplier</span>
                </button>
              </div>
            )}

            {/* Supplier List */}
            <div className="space-y-3">
              {masterSuppliers.map((sup) => {
                const areaSqFt = (sup.sheetWidth * sup.sheetHeight) / 144;
                const pricePerSqFt = areaSqFt > 0 ? sup.costPerSheet / areaSqFt : 0;

                return (
                  <div key={sup.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{sup.name}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md ${
                          sup.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                        }`}>
                          {sup.active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="text-xs font-mono text-slate-600 flex items-center gap-2 flex-wrap">
                        <span>Sheet: {sup.sheetWidth}" × {sup.sheetHeight}"</span>
                        <span className="text-slate-300">•</span>
                        <span>Cost: ${sup.costPerSheet}</span>
                        <span className="text-slate-300">•</span>
                        <span>Delivery: ${sup.deliveryCost}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-indigo-700 font-bold">${pricePerSqFt.toFixed(2)} / sq ft</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleToggleSupplierActive(sup.id)}
                        className={`px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          sup.active
                            ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        }`}
                      >
                        {sup.active ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingSupplier({ ...sup })}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSupplier(sup.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Delete Supplier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowSupplierModal(false);
                  setEditingSupplier(null);
                }}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
