import React, { useState, useEffect } from "react";
import { 
  Calculator, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  DollarSign, 
  Layers, 
  Grid, 
  Maximize2, 
  Info,
  FileText
} from "lucide-react";
import { SystemSettings, SavedQuotation } from "../types";
import { DEFAULT_QUOTE_TEMPLATES, formatQuoteTemplate } from "../utils/settingsHelper";
import { normalizeQuotation } from "../utils/quotationUtils";
import { loadEnvironmentQuotations, saveEnvironmentQuotations } from "../utils/environmentUtils";

interface AdditionalCharge {
  id: string;
  name: string;
  amount: string;
}

interface StandardMaterial {
  id: string;
  name: string;
  width: number;
  height: number;
  cost: number;
}

const STANDARD_MATERIALS: StandardMaterial[] = [
  { id: "crack_peel", name: 'Crack & Peel Sticker Sheet', width: 11, height: 8.5, cost: 375 },
  { id: "card_a4", name: 'Card Stock (A4)', width: 11, height: 8.5, cost: 375 },
  { id: "card_legal", name: 'Card Stock (Legal)', width: 14, height: 8.5, cost: 450 },
  { id: "custom", name: 'Custom Material', width: 11, height: 8.5, cost: 375 },
];

interface ProductionLayoutCalculatorProps {
  settings?: SystemSettings;
}

export default function ProductionLayoutCalculator({ settings }: ProductionLayoutCalculatorProps) {
  // Product Type state
  const [productType, setProductType] = useState(() => {
    return localStorage.getItem("calc_prod_type") || "Business Cards";
  });
  const [customProductType, setCustomProductType] = useState(() => {
    return localStorage.getItem("calc_prod_custom_type") || "";
  });

  // Material state
  const [materialId, setMaterialId] = useState(() => {
    return localStorage.getItem("calc_prod_material_id") || "card_a4";
  });
  const [materialName, setMaterialName] = useState(() => {
    return localStorage.getItem("calc_prod_material_name") || "Card Stock (A4)";
  });
  const [sheetWidth, setSheetWidth] = useState(() => {
    return localStorage.getItem("calc_prod_sheet_w") || "11";
  });
  const [sheetHeight, setSheetHeight] = useState(() => {
    return localStorage.getItem("calc_prod_sheet_h") || "8.5";
  });
  const [costPerSheet, setCostPerSheet] = useState(() => {
    return localStorage.getItem("calc_prod_sheet_cost") || "375";
  });

  // Finished Product Dimensions
  const [prodWidth, setProdWidth] = useState(() => {
    return localStorage.getItem("calc_prod_item_w") || "4";
  });
  const [prodHeight, setProdHeight] = useState(() => {
    return localStorage.getItem("calc_prod_item_h") || "4";
  });

  // Customer Quantity
  const [customerQty, setCustomerQty] = useState(() => {
    return localStorage.getItem("calc_prod_customer_qty") || "100";
  });

  // Production Margin / Waste
  const [productionMargin, setProductionMargin] = useState(() => {
    return localStorage.getItem("calc_prod_margin") || "0";
  });

  // Additional Charges
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>(() => {
    const stored = localStorage.getItem("calc_prod_additional_charges");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // Fallback
      }
    }
    return [{ id: "1", name: "Design Fee", amount: "1000" }];
  });

  // Manual Customer Quote Override
  const [isQuoteOverridden, setIsQuoteOverridden] = useState(false);
  const [manualQuote, setManualQuote] = useState("");
  const [discountPercent, setDiscountPercent] = useState(() => {
    return localStorage.getItem("calc_prod_discount") || "0";
  });

  // UI state
  const [showAdditional, setShowAdditional] = useState(true);
  const [newChargeName, setNewChargeName] = useState("");
  const [newChargeAmount, setNewChargeAmount] = useState("");
  const [copied, setCopied] = useState(false);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem("calc_prod_type", productType);
    localStorage.setItem("calc_prod_custom_type", customProductType);
    localStorage.setItem("calc_prod_material_id", materialId);
    localStorage.setItem("calc_prod_material_name", materialName);
    localStorage.setItem("calc_prod_sheet_w", sheetWidth);
    localStorage.setItem("calc_prod_sheet_h", sheetHeight);
    localStorage.setItem("calc_prod_sheet_cost", costPerSheet);
    localStorage.setItem("calc_prod_item_w", prodWidth);
    localStorage.setItem("calc_prod_item_h", prodHeight);
    localStorage.setItem("calc_prod_customer_qty", customerQty);
    localStorage.setItem("calc_prod_margin", productionMargin);
    localStorage.setItem("calc_prod_discount", discountPercent);
    localStorage.setItem("calc_prod_additional_charges", JSON.stringify(additionalCharges));
  }, [
    productType, customProductType, materialId, materialName,
    sheetWidth, sheetHeight, costPerSheet, prodWidth, prodHeight,
    customerQty, productionMargin, discountPercent, additionalCharges
  ]);

  // Dynamic Materials list based on Centralized System Settings
  const materialsList: StandardMaterial[] = React.useMemo(() => {
    if (settings?.productionMaterials && settings.productionMaterials.length > 0) {
      return [
        ...settings.productionMaterials.map(m => ({
          id: m.id,
          name: m.name,
          width: m.width,
          height: m.height,
          cost: m.cost
        })),
        { id: "custom", name: 'Custom Material', width: 11, height: 8.5, cost: 375 }
      ];
    }
    return STANDARD_MATERIALS;
  }, [settings?.productionMaterials]);

  // Handle Material Preset Select
  const handleMaterialSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setMaterialId(selectedId);
    const mat = materialsList.find(m => m.id === selectedId);
    if (mat) {
      setMaterialName(mat.name);
      if (selectedId !== "custom") {
        setSheetWidth(mat.width.toString());
        setSheetHeight(mat.height.toString());
        setCostPerSheet(mat.cost.toString());
      }
    }
  };

  // Parsed Numeric Inputs
  const sw = Math.max(0.1, parseFloat(sheetWidth) || 11);
  const sh = Math.max(0.1, parseFloat(sheetHeight) || 8.5);
  const pw = Math.max(0.1, parseFloat(prodWidth) || 1);
  const ph = Math.max(0.1, parseFloat(prodHeight) || 1);
  const reqQty = Math.max(1, parseInt(customerQty, 10) || 1);
  const sheetCost = Math.max(0, parseFloat(costPerSheet) || 0);
  const margin = Math.max(0, parseInt(productionMargin, 10) || 0);

  // Layout calculations
  // 1. Normal Orientation
  const colsNormal = Math.floor(sw / pw);
  const rowsNormal = Math.floor(sh / ph);
  const totalNormal = (colsNormal > 0 && rowsNormal > 0) ? (colsNormal * rowsNormal) : 0;

  // 2. Rotated Orientation (90 deg)
  const colsRotated = Math.floor(sw / ph);
  const rowsRotated = Math.floor(sh / pw);
  const totalRotated = (colsRotated > 0 && rowsRotated > 0) ? (colsRotated * rowsRotated) : 0;

  // Best layout selection
  const isRotated = totalRotated > totalNormal;
  const rawPiecesPerSheet = isRotated ? totalRotated : totalNormal;
  const gridCols = isRotated ? colsRotated : colsNormal;
  const gridRows = isRotated ? rowsRotated : rowsNormal;
  const activeOrientationText = isRotated ? "Rotated (90°)" : "Standard Normal";

  // Usable pieces per sheet after production margin
  const usablePiecesPerSheet = rawPiecesPerSheet > 0 ? Math.max(1, rawPiecesPerSheet - margin) : 0;

  // Production quantities
  const sheetsRequired = usablePiecesPerSheet > 0 ? Math.ceil(reqQty / usablePiecesPerSheet) : 0;
  const actualProductionQty = sheetsRequired * usablePiecesPerSheet;
  const productionSurplus = Math.max(0, actualProductionQty - reqQty);

  // Production Cost
  const productionCost = sheetsRequired * sheetCost;

  // Additional Charges Total
  const totalAdditionalCharges = additionalCharges.reduce((sum, item) => {
    return sum + (parseFloat(item.amount) || 0);
  }, 0);

  const totalCostBeforeQuote = productionCost + totalAdditionalCharges;

  // Customer Quote logic
  // Small Job Pricing Rule: Apply JMD $500 rounding rule only when Production Cost is below JMD $2,750
  const isSmallJob = productionCost < 2750;
  let recommendedQuote = totalCostBeforeQuote;
  if (isSmallJob && totalCostBeforeQuote > 0) {
    recommendedQuote = Math.ceil(totalCostBeforeQuote / 500) * 500;
  }

  const baseQuoteBeforeDiscount = isQuoteOverridden && manualQuote !== "" ? (parseFloat(manualQuote) || 0) : recommendedQuote;
  const parsedDiscount = Math.min(100, Math.max(0, parseFloat(discountPercent) || 0));
  const discountAmount = baseQuoteBeforeDiscount * (parsedDiscount / 100);
  const finalQuote = Math.max(0, baseQuoteBeforeDiscount - discountAmount);

  // Add charge handler
  const handleAddCharge = () => {
    if (!newChargeName.trim()) return;
    const newEntry: AdditionalCharge = {
      id: Date.now().toString(),
      name: newChargeName.trim(),
      amount: newChargeAmount.trim() || "0"
    };
    setAdditionalCharges([...additionalCharges, newEntry]);
    setNewChargeName("");
    setNewChargeAmount("");
  };

  // Remove charge handler
  const handleRemoveCharge = (id: string) => {
    setAdditionalCharges(additionalCharges.filter(c => c.id !== id));
  };

  // Reset to default presets
  const handleReset = () => {
    setProductType("Business Cards");
    setCustomProductType("");
    setMaterialId("card_a4");
    setMaterialName("Card Stock (A4)");
    setSheetWidth("11");
    setSheetHeight("8.5");
    setCostPerSheet("375");
    setProdWidth("4");
    setProdHeight("4");
    setCustomerQty("100");
    setProductionMargin("0");
    setDiscountPercent("0");
    setAdditionalCharges([{ id: "1", name: "Design Fee", amount: "1000" }]);
    setIsQuoteOverridden(false);
    setManualQuote("");
  };

  // Formatted display text for copying quote
  const displayProductTitle = productType === "Custom Product" && customProductType.trim() 
    ? customProductType.trim() 
    : productType;

  const getGeneratedQuoteText = () => {
    const prodTemplate = settings?.quoteTemplates?.find(t => t.active && (t.toolKey === "production_layout" || t.id === "tpl_production_layout_quote" || t.id === "tpl_production_layout"))
      || DEFAULT_QUOTE_TEMPLATES.find(t => t.id === "tpl_production_layout_quote");

    const customerRespTpl = settings?.quoteTemplates?.find(t => t.active && (t.id === "tpl_customer_response" || t.name === "Customer Response"))
      || DEFAULT_QUOTE_TEMPLATES.find(t => t.id === "tpl_customer_response");
    const customerResponseStr = customerRespTpl?.content.trim() || "Thank you so much for providing those details.\n\nHere is your personalized quotation based on your request.";

    const isItemValid = reqQty > 0 && finalQuote > 0;

    // Filter out zero-cost charges
    const validCharges = additionalCharges.filter(c => (parseFloat(c.amount) || 0) > 0);
    const addChargesStr = validCharges
      .map(c => `* ${c.name} – JMD $${(parseFloat(c.amount) || 0).toLocaleString()}`)
      .join("\n");

    const hasDiscount = parsedDiscount > 0 && discountAmount > 0;
    const activeDeliveryMethod = settings?.deliveryMethods?.find(m => m.active) || { name: "Knutsford Express", messageTemplate: "Your order will be dispatched via Knutsford Express once production has been completed. Tracking details will be provided once your order is ready for shipment." };
    const deliveryMethodName = activeDeliveryMethod.name;
    const deliveryMsgStr = activeDeliveryMethod.messageTemplate.trim();

    if (prodTemplate) {
      return formatQuoteTemplate(prodTemplate.content, {
        CustomerResponse: customerResponseStr,
        MaterialName: materialName,
        SheetSpecs: `${pw}" × ${ph}"`,
        Quantity: isItemValid ? reqQty : "",
        UnitPrice: isItemValid ? `JMD $${(finalQuote / reqQty).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "",
        Subtotal: isItemValid ? `JMD $${baseQuoteBeforeDiscount.toLocaleString()}` : "",
        AdditionalCharges: addChargesStr,
        DeliveryMethod: deliveryMethodName,
        DeliveryCharge: "",
        DiscountPercent: hasDiscount ? parsedDiscount : 0,
        DiscountAmount: hasDiscount ? `JMD $${discountAmount.toLocaleString()}` : "",
        GrandTotal: `JMD $${finalQuote.toLocaleString()}`,
        DeliveryMessage: deliveryMsgStr,
        BusinessName: settings?.companyName || "CEO Lifestyle"
      });
    }

    const sections: string[] = [];
    sections.push("Thank you so much for providing those details. Here is your personalized quote based on your request:");

    if (isItemValid) {
      sections.push(`Production Details:\n* Item: ${reqQty} ${displayProductTitle} (${pw}" × ${ph}")\n* Material: ${materialName}`);
    }

    if (addChargesStr) {
      sections.push(`Additional Charges\n${addChargesStr}`);
    }

    if (hasDiscount) {
      sections.push(`Discount\n* You save ${parsedDiscount}% = JMD $${discountAmount.toLocaleString()}`);
    }

    sections.push(`Total: JMD $${finalQuote.toLocaleString()}\n(Includes printing and design unless otherwise stated.)`);

    sections.push(`Delivery Method: ${deliveryMethodName}\n${deliveryMsgStr}`);

    sections.push("Let me know if you would like to proceed.");

    return sections.join("\n\n");
  };

  const handleCopyQuote = () => {
    const quoteText = getGeneratedQuoteText();

    navigator.clipboard.writeText(quoteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveQuotation = () => {
    const prodName = productType === "Custom" ? (customProductType || "Custom Item") : productType;
    const newQuote: SavedQuotation = normalizeQuotation({
      id: "quote_" + Date.now(),
      quoteNumber: `LAY-QT-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: "Layout Print Order",
      toolType: "layout",
      title: `${reqQty} Units ${prodName} (${materialName})`,
      date: new Date().toISOString().split("T")[0],
      totalCost: totalCostBeforeQuote,
      quotedPrice: finalQuote,
      details: `${prodName} - Qty: ${reqQty}, Material: ${materialName}, Sheet size: ${sw}"x${sh}". Total: $${finalQuote.toLocaleString()} JMD.`,
      summaryText: `${reqQty} Units ${prodName} on ${materialName}`,
      subtotalJMD: baseQuoteBeforeDiscount,
      discountPercent: parsedDiscount,
      discountAmountJMD: discountAmount,
      totalJMD: finalQuote,
      formattedResponseText: getGeneratedQuoteText(),
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
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-6 text-left animate-fade-in" id="production-layout-calculator-widget">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Production Layout Calculator</h3>
            <p className="text-[10px] font-medium text-slate-500">Calculate print sheet layout efficiency, production yield, &amp; customer quote</p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors rounded-lg hover:bg-slate-100 cursor-pointer flex items-center gap-1 text-[11px] font-bold"
          title="Reset to Defaults"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Main Grid: Inputs vs. Visual Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Section 1: Product Type & Material Selection */}
          <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>1. Product &amp; Material Selection</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Product Type Dropdown */}
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Product Type
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500 transition-all"
                >
                  <option value="Stickers">Stickers</option>
                  <option value="Business Cards">Business Cards</option>
                  <option value="Flyers">Flyers</option>
                  <option value="Custom Product">Custom Printable Product</option>
                </select>
              </div>

              {/* Custom Product Name Input if selected */}
              {productType === "Custom Product" ? (
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Custom Category / Title
                  </label>
                  <input
                    type="text"
                    value={customProductType}
                    onChange={(e) => setCustomProductType(e.target.value)}
                    placeholder="E.g. Labels, Bookmarks..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500 transition-all"
                  />
                </div>
              ) : (
                /* Sheet Material Preset Dropdown */
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Sheet Material Preset
                  </label>
                  <select
                    value={materialId}
                    onChange={handleMaterialSelect}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500 transition-all"
                  >
                    {materialsList.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.width}"×{m.height}" @ ${m.cost})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Custom Product selected material dropdown row if not shown above */}
            {productType === "Custom Product" && (
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Sheet Material Preset
                </label>
                <select
                  value={materialId}
                  onChange={handleMaterialSelect}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500 transition-all"
                >
                  {materialsList.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.width}"×{m.height}" @ ${m.cost})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sheet Dimensions & Cost (Editable) */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Sheet Width (in)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={sheetWidth}
                  onChange={(e) => {
                    setSheetWidth(e.target.value);
                    setMaterialId("custom");
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Sheet Height (in)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={sheetHeight}
                  onChange={(e) => {
                    setSheetHeight(e.target.value);
                    setMaterialId("custom");
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Cost / Sheet (JMD)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                  <input
                    type="number"
                    value={costPerSheet}
                    onChange={(e) => setCostPerSheet(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-6 pr-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Product Dimensions & Customer Quantity */}
          <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>2. Item Dimensions &amp; Order Quantity</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Item Width (in)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={prodWidth}
                  onChange={(e) => setProdWidth(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Item Height (in)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={prodHeight}
                  onChange={(e) => setProdHeight(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Requested Qty
                </label>
                <input
                  type="number"
                  value={customerQty}
                  onChange={(e) => setCustomerQty(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block" title="Production Waste / Edge Margin Allowance">
                  Waste Margin
                </label>
                <input
                  type="number"
                  value={productionMargin}
                  onChange={(e) => setProductionMargin(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="text-[10px] text-slate-500 font-medium flex items-center justify-between bg-white/60 p-2 rounded-xl border border-slate-200/40">
              <span className="flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400" />
                Yield: <strong className="text-slate-800">{usablePiecesPerSheet} items/sheet</strong>
              </span>
              <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                Auto-Orientation: {activeOrientationText}
              </span>
            </div>
          </div>

          {/* Section 3: Additional Charges */}
          <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                <span>3. Additional Fees &amp; Setup Charges</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAdditional(!showAdditional)}
                className="text-[10px] font-extrabold text-indigo-600 hover:underline cursor-pointer"
              >
                {showAdditional ? "Collapse Fees" : `Expand Fees (${additionalCharges.length})`}
              </button>
            </div>

            {showAdditional && (
              <div className="space-y-2.5 animate-fade-in">
                {additionalCharges.map((charge) => (
                  <div key={charge.id} className="flex items-center gap-2 bg-white border border-slate-200/70 rounded-xl p-2 shadow-2xs">
                    <input
                      type="text"
                      value={charge.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAdditionalCharges(additionalCharges.map(c => c.id === charge.id ? { ...c, name: val } : c));
                      }}
                      className="flex-1 text-xs font-semibold text-slate-800 focus:outline-hidden"
                      placeholder="Fee Name (Design, Setup...)"
                    />
                    <div className="relative w-28">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                      <input
                        type="number"
                        value={charge.amount}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAdditionalCharges(additionalCharges.map(c => c.id === charge.id ? { ...c, amount: val } : c));
                        }}
                        className="w-full pl-5 pr-2 py-1 text-xs font-mono font-bold text-slate-800 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                        placeholder="0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCharge(charge.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                      title="Remove Charge"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add New Fee Inline */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newChargeName}
                    onChange={(e) => setNewChargeName(e.target.value)}
                    placeholder="New Charge Name (e.g. Artwork Fee, Delivery...)"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                    <input
                      type="number"
                      value={newChargeAmount}
                      onChange={(e) => setNewChargeAmount(e.target.value)}
                      placeholder="Amount"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-5 pr-2 py-1.5 text-xs font-mono text-slate-800 focus:outline-hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCharge}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Production Yield Summary & Interactive Layout Canvas (5 cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          
          {/* Visual Sheet Layout Diagram */}
          <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between text-xs font-bold border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5 text-indigo-300">
                <Grid className="w-4 h-4" /> Visual Sheet Layout
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {sw}" × {sh}" Sheet
              </span>
            </div>

            {/* Interactive Grid Canvas Preview */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center min-h-[170px]">
              {usablePiecesPerSheet > 0 ? (
                <div className="w-full flex flex-col items-center justify-center">
                  <div 
                    className="border border-indigo-400/40 bg-indigo-950/30 rounded-lg p-2 max-w-[240px] w-full grid gap-1.5 shadow-inner"
                    style={{
                      gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: Math.min(64, usablePiecesPerSheet) }).map((_, idx) => (
                      <div 
                        key={idx}
                        className="bg-indigo-500/25 border border-indigo-400/60 rounded-xs flex items-center justify-center py-1 text-[8px] font-mono font-bold text-indigo-200 truncate"
                        title={`Item #${idx + 1}`}
                      >
                        {pw}×{ph}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-indigo-300 font-mono mt-2 font-bold">
                    Fits {rawPiecesPerSheet} max ({usablePiecesPerSheet} usable) • {gridCols} col × {gridRows} row
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs font-medium">
                  Item dimensions exceeds sheet size.
                </div>
              )}
            </div>

            {/* Metrics Breakdown Cards */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider">Sheets Required</span>
                <span className="text-lg font-mono font-bold text-indigo-300">{sheetsRequired} sheets</span>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 block tracking-wider">Actual Yield</span>
                <span className="text-lg font-mono font-bold text-emerald-400">{actualProductionQty} units</span>
                {productionSurplus > 0 && (
                  <span className="text-[9px] font-semibold text-amber-400 block">+ {productionSurplus} extra surplus</span>
                )}
              </div>
            </div>
          </div>

          {/* Customer Quotation Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-4 space-y-3.5 border border-indigo-800/60 shadow-md">
            <div className="flex items-center justify-between border-b border-indigo-800/80 pb-2.5">
              <span className="text-xs font-extrabold tracking-wider uppercase text-indigo-200">Financial Quotation</span>
              {isSmallJob && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full text-[9px] font-bold">
                  Small Job ($500 Rule)
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-indigo-200/90 font-medium">
                <span>Production Cost ({sheetsRequired} sheets @ ${sheetCost}):</span>
                <span className="font-mono font-bold text-white">${productionCost.toLocaleString()}</span>
              </div>

              {additionalCharges.length > 0 && (
                <div className="flex justify-between text-indigo-200/90 font-medium">
                  <span>Additional Fees ({additionalCharges.length}):</span>
                  <span className="font-mono font-bold text-white">${totalAdditionalCharges.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-indigo-200/90 font-medium pt-1 border-t border-indigo-800/60">
                <span>Total Base Cost:</span>
                <span className="font-mono font-bold text-white">${totalCostBeforeQuote.toLocaleString()}</span>
              </div>

              {/* Discount (%) Field */}
              <div className="pt-2 border-t border-indigo-800/60">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-extrabold uppercase text-indigo-300 tracking-wider">
                    Discount (%)
                  </label>
                  {parsedDiscount > 0 && (
                    <span className="text-[9px] font-extrabold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Saving {parsedDiscount}% (${discountAmount.toLocaleString()})
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950/80 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-hidden focus:border-indigo-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-300">
                    %
                  </span>
                </div>
              </div>

              {/* Editable Customer Quote Field */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-extrabold uppercase text-indigo-300 tracking-wider">
                    Customer Quotation (JMD)
                  </label>
                  {isQuoteOverridden && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsQuoteOverridden(false);
                        setManualQuote("");
                      }}
                      className="text-[9px] text-amber-300 hover:underline cursor-pointer"
                    >
                      Reset to Recommended (${recommendedQuote.toLocaleString()})
                    </button>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300 text-sm font-bold">$</span>
                  <input
                    type="number"
                    value={isQuoteOverridden ? manualQuote : recommendedQuote}
                    onChange={(e) => {
                      setIsQuoteOverridden(true);
                      setManualQuote(e.target.value);
                    }}
                    className="w-full bg-slate-950/80 border border-indigo-500/50 rounded-xl pl-7 pr-3 py-2 text-base font-mono font-extrabold text-emerald-400 focus:outline-hidden focus:border-emerald-400"
                  />
                </div>
              </div>

              {parsedDiscount > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-emerald-300 pt-1">
                  <span>Final Price After {parsedDiscount}% Discount:</span>
                  <span className="font-mono text-sm">${finalQuote.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Action Buttons: Copy Quote & Save Quote */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleCopyQuote}
                className={`py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  copied 
                    ? "bg-emerald-600 text-white" 
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm hover:shadow-indigo-500/25"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Quotation Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Quotation</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSaveQuotation}
                className={`py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  savedSuccess
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                    : "bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-sm"
                }`}
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300 font-extrabold">Saved to Log!</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-slate-950" />
                    <span>Save Quotation</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
