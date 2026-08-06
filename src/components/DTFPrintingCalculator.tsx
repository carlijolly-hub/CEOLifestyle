import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { 
  Printer, 
  Building, 
  DollarSign, 
  Layers, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  HelpCircle, 
  TrendingUp, 
  Sparkles, 
  Calculator, 
  RotateCw, 
  Tag, 
  Award,
  FileText,
  AlertCircle
} from "lucide-react";
import { SystemSettings, DTFSupplier, DTFPricingPreset, SavedQuotation } from "../types";
import { DEFAULT_DTF_SUPPLIERS, DEFAULT_DTF_PRICING, DEFAULT_QUOTE_TEMPLATES, formatQuoteTemplate } from "../utils/settingsHelper";
import { normalizeQuotation } from "../utils/quotationUtils";
import { loadEnvironmentQuotations, saveEnvironmentQuotations } from "../utils/environmentUtils";

interface DTFPrintingCalculatorProps {
  settings?: SystemSettings;
}

interface AdditionalFeeItem {
  id: string;
  name: string;
  amount: number;
}

export default function DTFPrintingCalculator({ settings }: DTFPrintingCalculatorProps) {
  // Load suppliers and pricing presets from settings or fallbacks
  const dtfSuppliers = useMemo(() => {
    const list = settings?.dtfSuppliers || DEFAULT_DTF_SUPPLIERS;
    return list.filter(s => s.active);
  }, [settings]);

  const dtfPricingPresets = useMemo(() => {
    const list = settings?.dtfPricingPresets || DEFAULT_DTF_PRICING;
    return list.filter(p => p.active);
  }, [settings]);

  // Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(() => {
    return dtfSuppliers[0]?.id || "krz_prints";
  });

  const [selectedPricingId, setSelectedPricingId] = useState<string>(() => {
    return dtfPricingPresets[0]?.id || "dtf_p_4x4";
  });

  // Custom measurements
  const [customWidth, setCustomWidth] = useState<number>(4);
  const [customHeight, setCustomHeight] = useState<number>(4);
  const [customSellingPrice, setCustomSellingPrice] = useState<number>(1500);

  // Quantity required
  const [quantity, setQuantity] = useState<number>(50);

  // Additional Fees list
  const [additionalFees, setAdditionalFees] = useState<AdditionalFeeItem[]>([]);
  const [feePresetName, setFeePresetName] = useState<string>("Design Fee");
  const [customFeeName, setCustomFeeName] = useState<string>("");
  const [feeAmountInput, setFeeAmountInput] = useState<string>("");

  // Job Notes
  const [notes, setNotes] = useState<string>("");

  // Copy quote feedback state
  const [copiedQuote, setCopiedQuote] = useState<boolean>(false);

  // Supplier Comparison Modal
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);
  useBodyScrollLock(showCompareModal);

  // Active Selected Supplier
  const activeSupplier = useMemo(() => {
    return dtfSuppliers.find(s => s.id === selectedSupplierId) || dtfSuppliers[0] || {
      id: "fallback",
      name: "Default Supplier",
      sheetWidth: 12,
      sheetHeight: 17,
      costPerSheet: 800,
      deliveryCost: 0,
      notes: "",
      active: true
    };
  }, [dtfSuppliers, selectedSupplierId]);

  // Selected Pricing Preset or Custom
  const selectedPreset = useMemo(() => {
    if (selectedPricingId === "custom") return null;
    return dtfPricingPresets.find(p => p.id === selectedPricingId) || null;
  }, [dtfPricingPresets, selectedPricingId]);

  // Effective Print Dimensions & Unit Selling Price
  const effectiveDimensions = useMemo(() => {
    if (selectedPricingId === "custom" || !selectedPreset) {
      return {
        width: Math.max(0.1, customWidth || 1),
        height: Math.max(0.1, customHeight || 1),
        sellingPrice: Math.max(0, customSellingPrice || 0),
        sizeLabel: `Custom (${customWidth}" × ${customHeight}")`
      };
    }

    return {
      width: selectedPreset.width || customWidth || 12,
      height: selectedPreset.height || customHeight || 10,
      sellingPrice: selectedPreset.sellingPrice,
      sizeLabel: selectedPreset.sizeLabel
    };
  }, [selectedPricingId, selectedPreset, customWidth, customHeight, customSellingPrice]);

  // Layout Calculation Helper Function
  const calculateLayout = (sheetW: number, sheetH: number, printW: number, printH: number, qty: number, sheetCost: number, delivery: number) => {
    if (sheetW <= 0 || sheetH <= 0 || printW <= 0 || printH <= 0) {
      return {
        fitsPerSheet: 0,
        orientation: "Invalid",
        cols: 0,
        rows: 0,
        sheetsNeeded: 0,
        materialCost: 0,
        deliveryCost: delivery,
        totalProductionCost: delivery
      };
    }

    // 1. Normal orientation
    const colsNormal = Math.floor(sheetW / printW);
    const rowsNormal = Math.floor(sheetH / printH);
    const fitNormal = (colsNormal > 0 && rowsNormal > 0) ? colsNormal * rowsNormal : 0;

    // 2. Rotated orientation (90 deg)
    const colsRotated = Math.floor(sheetW / printH);
    const rowsRotated = Math.floor(sheetH / printW);
    const fitRotated = (colsRotated > 0 && rowsRotated > 0) ? colsRotated * rowsRotated : 0;

    const useRotated = fitRotated > fitNormal;
    const fitsPerSheet = useRotated ? fitRotated : fitNormal;
    const orientation = useRotated ? "Rotated (90°)" : "Standard";
    const cols = useRotated ? colsRotated : colsNormal;
    const rows = useRotated ? rowsRotated : rowsNormal;

    const sheetsNeeded = fitsPerSheet > 0 ? Math.ceil(qty / fitsPerSheet) : 0;
    const materialCost = sheetsNeeded * sheetCost;
    const totalProductionCost = materialCost + delivery;

    return {
      fitsPerSheet,
      orientation,
      cols,
      rows,
      sheetsNeeded,
      materialCost,
      deliveryCost: delivery,
      totalProductionCost
    };
  };

  // Main Calculation Result for Selected Supplier
  const calculationResult = useMemo(() => {
    return calculateLayout(
      activeSupplier.sheetWidth,
      activeSupplier.sheetHeight,
      effectiveDimensions.width,
      effectiveDimensions.height,
      Math.max(1, quantity || 1),
      activeSupplier.costPerSheet,
      activeSupplier.deliveryCost
    );
  }, [activeSupplier, effectiveDimensions, quantity]);

  // Financial Analysis
  const totalAdditionalFees = useMemo(() => {
    return additionalFees.reduce((acc, f) => acc + (f.amount || 0), 0);
  }, [additionalFees]);

  const baseCustomerRevenue = useMemo(() => {
    return (quantity || 0) * (effectiveDimensions.sellingPrice || 0);
  }, [quantity, effectiveDimensions.sellingPrice]);

  const totalCustomerPrice = useMemo(() => {
    return baseCustomerRevenue + totalAdditionalFees;
  }, [baseCustomerRevenue, totalAdditionalFees]);

  const grossProfit = useMemo(() => {
    return totalCustomerPrice - calculationResult.totalProductionCost;
  }, [totalCustomerPrice, calculationResult.totalProductionCost]);

  const profitMarginPercent = useMemo(() => {
    if (totalCustomerPrice <= 0) return 0;
    return Math.round((grossProfit / totalCustomerPrice) * 100);
  }, [grossProfit, totalCustomerPrice]);

  // Supplier Comparisons List
  const supplierComparisons = useMemo(() => {
    return dtfSuppliers.map(sup => {
      const layout = calculateLayout(
        sup.sheetWidth,
        sup.sheetHeight,
        effectiveDimensions.width,
        effectiveDimensions.height,
        Math.max(1, quantity || 1),
        sup.costPerSheet,
        sup.deliveryCost
      );

      const profit = totalCustomerPrice - layout.totalProductionCost;
      const margin = totalCustomerPrice > 0 ? Math.round((profit / totalCustomerPrice) * 100) : 0;

      return {
        supplier: sup,
        layout,
        profit,
        margin
      };
    }).sort((a, b) => a.layout.totalProductionCost - b.layout.totalProductionCost); // Lowest cost first
  }, [dtfSuppliers, effectiveDimensions, quantity, totalCustomerPrice]);

  const recommendedSupplier = supplierComparisons[0]?.supplier || activeSupplier;

  // Additional Fees Handlers
  const handleAddFee = () => {
    const feeName = feePresetName === "Custom Fee" ? (customFeeName.trim() || "Custom Fee") : feePresetName;
    const feeAmount = parseFloat(feeAmountInput) || 0;

    if (feeAmount <= 0) return;

    setAdditionalFees(prev => [
      ...prev,
      {
        id: `fee-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: feeName,
        amount: feeAmount
      }
    ]);

    setFeeAmountInput("");
    setCustomFeeName("");
  };

  const handleRemoveFee = (id: string) => {
    setAdditionalFees(prev => prev.filter(f => f.id !== id));
  };

  // Generate Copy Quote Text
  const generateQuoteText = () => {
    const dtfTemplate = settings?.quoteTemplates?.find(t => t.active && (t.toolKey === "dtf" || t.id === "tpl_dtf_quote"))
      || DEFAULT_QUOTE_TEMPLATES.find(t => t.id === "tpl_dtf_quote");

    const customerRespTpl = settings?.quoteTemplates?.find(t => t.active && (t.id === "tpl_customer_response" || t.name === "Customer Response"))
      || DEFAULT_QUOTE_TEMPLATES.find(t => t.id === "tpl_customer_response");
    const customerResponseStr = customerRespTpl?.content.trim() || "Thank you so much for providing those details.\n\nHere is your personalized quotation based on your request.";

    const isItemValid = (quantity || 0) > 0 && (effectiveDimensions.sellingPrice || 0) > 0;

    // Additional Fees
    const feeLines: string[] = [];
    additionalFees.forEach(f => {
      if (f.amount > 0) {
        feeLines.push(`* ${f.name} – JMD $${f.amount.toLocaleString()}`);
      }
    });

    const addChargesStr = feeLines.join("\n");
    const activeDeliveryMethod = settings?.deliveryMethods?.find(m => m.active) || { name: "Knutsford Express", messageTemplate: "Your order will be dispatched via Knutsford Express once production has been completed. Tracking details will be provided once your order is ready for shipment.", defaultCost: 0 };
    const deliveryMethodName = activeDeliveryMethod.name;
    const deliveryMsg = activeDeliveryMethod.messageTemplate.trim();

    if (dtfTemplate) {
      return formatQuoteTemplate(dtfTemplate.content, {
        CustomerResponse: customerResponseStr,
        PrintSize: effectiveDimensions.sizeLabel,
        Quantity: isItemValid ? quantity : "",
        UnitPrice: isItemValid ? `JMD $${effectiveDimensions.sellingPrice.toLocaleString()}` : "",
        Subtotal: isItemValid ? `JMD $${baseCustomerRevenue.toLocaleString()}` : "",
        AdditionalCharges: addChargesStr,
        DeliveryMethod: deliveryMethodName,
        DeliveryCharge: (activeDeliveryMethod.defaultCost && activeDeliveryMethod.defaultCost > 0) ? `JMD $${activeDeliveryMethod.defaultCost.toLocaleString()}` : "",
        DiscountPercent: 0,
        DiscountAmount: "",
        GrandTotal: `JMD $${totalCustomerPrice.toLocaleString()}`,
        DeliveryMessage: deliveryMsg,
        BusinessName: settings?.companyName || "CEO Lifestyle"
      });
    }

    const sections: string[] = [];
    sections.push("Thank you so much for providing those details. Here is your personalized quote based on your request:");

    if (isItemValid) {
      sections.push(`Print Details:\n* Size: ${effectiveDimensions.sizeLabel}\n* Quantity: ${quantity} prints @ JMD $${effectiveDimensions.sellingPrice.toLocaleString()} each = JMD $${baseCustomerRevenue.toLocaleString()}`);
    }

    if (addChargesStr) {
      sections.push(`Additional Charges\n${addChargesStr}`);
    }

    sections.push(`Total: JMD $${totalCustomerPrice.toLocaleString()}\n(Includes DTF printing unless otherwise stated.)`);

    sections.push(`Delivery Method: ${deliveryMethodName}\n${deliveryMsg}`);

    sections.push("Let me know if you would like to proceed.");

    return sections.join("\n\n");
  };

  const handleCopyQuote = () => {
    const quoteText = generateQuoteText();
    navigator.clipboard.writeText(quoteText);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 3000);
  };

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveQuotation = () => {
    const newQuote: SavedQuotation = normalizeQuotation({
      id: "quote_" + Date.now(),
      quoteNumber: `DTF-QT-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: "DTF Print Client",
      toolType: "dtf",
      title: `DTF Printing (${quantity} Units / ${calculationResult.sheetsNeeded} Gang Sheets)`,
      date: new Date().toISOString().split("T")[0],
      totalCost: calculationResult.totalProductionCost,
      quotedPrice: totalCustomerPrice,
      details: `DTF Transfers - Qty: ${quantity}, Size: ${effectiveDimensions.sizeLabel}, Gang Sheets: ${calculationResult.sheetsNeeded}. Total: $${totalCustomerPrice.toLocaleString()} JMD.`,
      summaryText: `DTF Printing (${quantity} units - ${effectiveDimensions.sizeLabel})`,
      subtotalJMD: baseCustomerRevenue,
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
    <div className="space-y-6 text-left animate-fade-in">
      
      {/* Module Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-900/50">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Printer className="w-3.5 h-3.5" /> Production Tools • DTF Printing
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">DTF Printing Production &amp; Quote Calculator</h2>
            <p className="text-indigo-200 text-xs md:text-sm max-w-2xl font-medium leading-relaxed">
              Calculate sheet efficiency layouts, true production costs, supplier margins, customer selling prices, and generate instant client quotes.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowCompareModal(true)}
              className="px-4 py-2.5 bg-indigo-600/80 hover:bg-indigo-600 text-white border border-indigo-400/40 font-bold rounded-2xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/25"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>Compare Suppliers</span>
            </button>

            <button
              onClick={handleCopyQuote}
              className={`px-4 py-2.5 font-bold rounded-2xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                copiedQuote
                  ? "bg-emerald-600 text-white border border-emerald-400"
                  : "bg-white text-slate-900 hover:bg-indigo-50 border border-white"
              }`}
            >
              {copiedQuote ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Quote Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-indigo-600" />
                  <span>Copy Customer Quote</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Workflow Inputs & Calculations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Configurator Steps (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* STEP 1: SELECT SUPPLIER */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs border border-indigo-100">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Step 1 – Select DTF Supplier</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Load sheet dimensions and supplier per-sheet manufacturing cost</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                {dtfSuppliers.length} Active Supplier{dtfSuppliers.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                  DTF Supplier Dropdown
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                >
                  {dtfSuppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.sheetWidth}" × {sup.sheetHeight}" — ${sup.costPerSheet.toLocaleString()} JMD/sheet)
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Supplier Parameters Box */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1.5 text-xs font-medium">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Sheet Dimensions:</span>
                  <span className="font-bold text-slate-900 font-mono">{activeSupplier.sheetWidth}" × {activeSupplier.sheetHeight}"</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Sheet Cost:</span>
                  <span className="font-bold text-slate-900 font-mono">${activeSupplier.costPerSheet.toLocaleString()} JMD</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Delivery Fee:</span>
                  <span className="font-bold text-slate-900 font-mono">${activeSupplier.deliveryCost.toLocaleString()} JMD</span>
                </div>
                {activeSupplier.notes && (
                  <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-200/60">
                    "{activeSupplier.notes}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2 & 3: PRINT SIZE & CUSTOM MEASUREMENTS */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs border border-indigo-100">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Step 2 – Print Size &amp; Pricing Selection</h3>
                <p className="text-[11px] text-slate-400 font-medium">Choose standard selling preset or enter custom dimensions</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                  DTF Print Size Preset
                </label>
                <select
                  value={selectedPricingId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedPricingId(val);
                    if (val !== "custom") {
                      const p = dtfPricingPresets.find(item => item.id === val);
                      if (p) {
                        if (p.width) setCustomWidth(p.width);
                        if (p.height) setCustomHeight(p.height);
                        setCustomSellingPrice(p.sellingPrice);
                      }
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                >
                  {dtfPricingPresets.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {preset.sizeLabel} — ${preset.sellingPrice.toLocaleString()} JMD per print
                    </option>
                  ))}
                  <option value="custom">⚙️ Custom Size &amp; Price</option>
                </select>
              </div>

              {/* Custom Measurements Inputs */}
              {(selectedPricingId === "custom" || true) && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-900 tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-600" /> Print Dimensions &amp; Customer Selling Price
                    </span>
                    {selectedPricingId !== "custom" && (
                      <span className="text-[10px] text-indigo-600 font-bold italic">Preset parameters auto-loaded</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                        Width (inches)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                        placeholder="E.g. 12"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                        Height (inches)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                        placeholder="E.g. 10"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                        Selling Price per Print ($)
                      </label>
                      <input
                        type="number"
                        step="50"
                        min="0"
                        value={customSellingPrice}
                        onChange={(e) => setCustomSellingPrice(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                        placeholder="E.g. 1750"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STEP 4 & 5: QUANTITY & ADDITIONAL FEES */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs border border-indigo-100">
                3
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Step 3 – Quantity &amp; Additional Fees</h3>
                <p className="text-[11px] text-slate-400 font-medium">Specify production run count and optional job fees</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">
                  Prints Required (Quantity) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono font-extrabold text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                    placeholder="E.g. 50"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                    Prints
                  </span>
                </div>
              </div>

              {/* Add Additional Fee Drawer */}
              <div className="space-y-2 bg-slate-50/80 border border-slate-200/80 p-3 rounded-2xl">
                <label className="text-[10px] font-extrabold uppercase text-slate-600 tracking-wider block">
                  Add Additional Job Fee
                </label>

                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <select
                    value={feePresetName}
                    onChange={(e) => setFeePresetName(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="Design Fee">🎨 Design Fee</option>
                    <option value="Delivery Fee">🚚 Delivery Fee</option>
                    <option value="Setup Fee">⚡ Setup Fee</option>
                    <option value="Rush Fee">🚨 Rush Fee</option>
                    <option value="Custom Fee">➕ Custom Fee</option>
                  </select>

                  {feePresetName === "Custom Fee" && (
                    <input
                      type="text"
                      placeholder="Fee Name..."
                      value={customFeeName}
                      onChange={(e) => setCustomFeeName(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium flex-1"
                    />
                  )}

                  <input
                    type="number"
                    placeholder="$ Amount"
                    value={feeAmountInput}
                    onChange={(e) => setFeeAmountInput(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold w-24"
                  />

                  <button
                    type="button"
                    onClick={handleAddFee}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* List of active additional fees */}
            {additionalFees.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                  Applied Additional Fees ({additionalFees.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {additionalFees.map(fee => (
                    <div key={fee.id} className="bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl flex items-center gap-2 text-xs font-semibold text-indigo-950">
                      <span>{fee.name}: <strong>${fee.amount.toLocaleString()} JMD</strong></span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFee(fee.id)}
                        className="text-indigo-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* STEP 6: JOB NOTES */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-2">
            <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
              Job Notes &amp; Special Instructions
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-indigo-600 focus:bg-white leading-relaxed"
              placeholder="Record customer preferences, supplier choice reasoning, packaging details, turn-around deadlines..."
            />
          </div>

        </div>

        {/* Right Column: Output Metrics, Layout Math & Quote Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* PROFIT & REVENUE METRICS SUMMARY CARD */}
          <div className="bg-gradient-to-b from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-900/60 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-800/60">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-extrabold tracking-tight">Job Profitability Analysis</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                profitMarginPercent >= 50
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                  : profitMarginPercent >= 25
                  ? "bg-sky-500/20 text-sky-300 border border-sky-400/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-400/30"
              }`}>
                {profitMarginPercent}% Margin
              </span>
            </div>

            {/* Financial Metrics Numbers Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-indigo-300 tracking-wider block">
                  Customer Price
                </span>
                <p className="text-xl font-extrabold text-white font-mono">
                  ${totalCustomerPrice.toLocaleString('en-US')}
                </p>
                <span className="text-[9px] text-indigo-300/80 block">
                  {quantity} prints @ ${effectiveDimensions.sellingPrice.toLocaleString()}/ea
                </span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-indigo-300 tracking-wider block">
                  Production Cost
                </span>
                <p className="text-xl font-extrabold text-indigo-200 font-mono">
                  ${calculationResult.totalProductionCost.toLocaleString('en-US')}
                </p>
                <span className="text-[9px] text-indigo-300/80 block">
                  Material + Supplier Delivery
                </span>
              </div>

              <div className="col-span-2 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider block">
                    Gross Profit
                  </span>
                  <p className="text-2xl font-black text-emerald-300 font-mono">
                    ${grossProfit.toLocaleString('en-US')} JMD
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider block">
                    Profit Margin
                  </span>
                  <p className="text-2xl font-black text-emerald-200 font-mono">
                    {profitMarginPercent}%
                  </p>
                </div>
              </div>
            </div>

            {/* Break-down of Costs */}
            <div className="space-y-2 pt-2 border-t border-indigo-800/60 text-xs text-indigo-200">
              <div className="flex justify-between">
                <span className="text-indigo-300">Base Print Revenue:</span>
                <span className="font-mono font-bold text-white">${baseCustomerRevenue.toLocaleString()} JMD</span>
              </div>
              {totalAdditionalFees > 0 && (
                <div className="flex justify-between">
                  <span className="text-indigo-300">Additional Fees Total:</span>
                  <span className="font-mono font-bold text-emerald-300">+${totalAdditionalFees.toLocaleString()} JMD</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-indigo-300">Material Sheet Cost ({calculationResult.sheetsNeeded} sheets):</span>
                <span className="font-mono font-bold text-rose-300">-${calculationResult.materialCost.toLocaleString()} JMD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-300">Supplier Delivery Fee:</span>
                <span className="font-mono font-bold text-rose-300">-${calculationResult.deliveryCost.toLocaleString()} JMD</span>
              </div>
            </div>
          </div>

          {/* AUTOMATIC SHEET LAYOUT CALCULATION CARD */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Sheet Layout &amp; Efficiency</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 flex items-center gap-1">
                <RotateCw className="w-3 h-3 text-indigo-500" /> {calculationResult.orientation}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">
                  Prints Per Sheet
                </span>
                <p className="text-lg font-mono font-extrabold text-slate-900">
                  {calculationResult.fitsPerSheet} <span className="text-xs text-slate-500 font-normal">prints/sheet</span>
                </p>
                <span className="text-[9px] text-slate-500 block mt-1">
                  Grid: {calculationResult.cols} × {calculationResult.rows}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">
                  Sheets Required
                </span>
                <p className="text-lg font-mono font-extrabold text-slate-900">
                  {calculationResult.sheetsNeeded} <span className="text-xs text-slate-500 font-normal">sheets</span>
                </p>
                <span className="text-[9px] text-slate-500 block mt-1">
                  Sheet Size: {activeSupplier.sheetWidth}" × {activeSupplier.sheetHeight}"
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              💡 The layout engine automatically tested standard orientation ({activeSupplier.sheetWidth}" × {activeSupplier.sheetHeight}") vs rotated 90° orientation to pick the highest material yield.
            </p>
          </div>

          {/* CUSTOMER QUOTE PREVIEW CARD */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Generated Customer Quote</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveQuotation}
                  className={`px-3 py-1.5 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border ${
                    savedSuccess
                      ? "bg-emerald-500/20 text-emerald-700 border-emerald-400"
                      : "bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400"
                  }`}
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-extrabold">Saved to Log!</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-slate-950" />
                      <span>Save Quotation</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopyQuote}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  {copiedQuote ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedQuote ? "Copied" : "Copy Quote"}</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800">
              {generateQuoteText()}
            </div>
          </div>

        </div>

      </div>

      {/* SUPPLIER COMPARISON MODAL */}
      {showCompareModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto animate-in fade-in zoom-in duration-200 text-left">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-300">
                  <Award className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">Supplier Comparison Analysis</h3>
                  <p className="text-xs text-indigo-200 font-medium">
                    Job Parameters: {quantity} Prints ({effectiveDimensions.sizeLabel})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Comparison Cards Grid */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-indigo-950">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <span className="font-extrabold text-indigo-900">Recommended Supplier: </span>
                  <span className="font-bold underline">{recommendedSupplier.name}</span>
                  <span className="text-indigo-800"> — Offers the lowest production cost while maintaining optimal profit margins.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {supplierComparisons.map(({ supplier, layout, profit, margin }, idx) => {
                  const isRecommended = idx === 0;
                  const isSelected = supplier.id === selectedSupplierId;

                  return (
                    <div
                      key={supplier.id}
                      className={`rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-4 ${
                        isRecommended
                          ? "bg-gradient-to-b from-indigo-50/90 to-white border-indigo-300 shadow-md ring-2 ring-indigo-500/20"
                          : "bg-white border-slate-200/80 shadow-xs"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-slate-900 text-sm">{supplier.name}</h4>
                          {isRecommended && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-amber-900 bg-amber-300 border border-amber-400">
                              ★ Best Price
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 text-xs font-medium text-slate-600">
                          <div className="flex justify-between">
                            <span>Sheet Size:</span>
                            <span className="font-bold text-slate-900 font-mono">{supplier.sheetWidth}" × {supplier.sheetHeight}"</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cost / Sheet:</span>
                            <span className="font-bold text-slate-900 font-mono">${supplier.costPerSheet.toLocaleString()} JMD</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Delivery Fee:</span>
                            <span className="font-bold text-slate-900 font-mono">${supplier.deliveryCost.toLocaleString()} JMD</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sheets Required:</span>
                            <span className="font-bold text-slate-900 font-mono">{layout.sheetsNeeded} sheets</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 space-y-2">
                        <div className="bg-slate-50 p-2.5 rounded-xl space-y-1 text-xs">
                          <div className="flex justify-between font-bold text-slate-700">
                            <span>Total Production Cost:</span>
                            <span className="text-slate-900 font-mono">${layout.totalProductionCost.toLocaleString()} JMD</span>
                          </div>
                          <div className="flex justify-between font-bold text-emerald-700">
                            <span>Gross Profit:</span>
                            <span className="font-mono">${profit.toLocaleString()} JMD ({margin}%)</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSupplierId(supplier.id);
                            setShowCompareModal(false);
                          }}
                          className={`w-full py-2 font-extrabold rounded-xl text-xs transition-all cursor-pointer ${
                            isSelected
                              ? "bg-slate-900 text-white cursor-default"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                          }`}
                        >
                          {isSelected ? "Currently Selected" : "Use This Supplier"}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
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
