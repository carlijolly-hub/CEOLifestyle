import React, { useState, useEffect, useMemo } from "react";
import { 
  RefreshCw, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  DollarSign, 
  CircleDot, 
  Square, 
  Info,
  FileText,
  Layers,
  ArrowRight
} from "lucide-react";
import { SystemSettings, SavedQuotation } from "../types";
import { DEFAULT_QUOTE_TEMPLATES, formatQuoteTemplate } from "../utils/settingsHelper";
import { normalizeQuotation } from "../utils/quotationUtils";
import { loadEnvironmentQuotations, saveEnvironmentQuotations } from "../utils/environmentUtils";
import { calculateCircularLayout } from "../utils/circularLayoutEngine";
import { formatDimensionPair, formatMeasurement, formatDiameter } from "../utils/measurementUtils";

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
  { id: "crack_peel", name: "Crack & Peel Sticker Sheet (Letter)", width: 11, height: 8.5, cost: 375 },
  { id: "card_a4", name: "Card Stock (Letter 11\" × 8.5\")", width: 11, height: 8.5, cost: 375 },
  { id: "card_legal", name: "Card Stock (Legal 14\" × 8.5\")", width: 14, height: 8.5, cost: 450 },
  { id: "custom", name: "Custom Material", width: 11, height: 8.5, cost: 375 },
];

interface CircularProductionLayoutCalculatorProps {
  settings?: SystemSettings;
}

export default function CircularProductionLayoutCalculator({ settings }: CircularProductionLayoutCalculatorProps) {
  // Product Type state
  const [productType, setProductType] = useState(() => {
    return localStorage.getItem("calc_circ_type") || "Circular Stickers";
  });
  const [customProductType, setCustomProductType] = useState(() => {
    return localStorage.getItem("calc_circ_custom_type") || "";
  });

  // Material state
  const [materialId, setMaterialId] = useState(() => {
    return localStorage.getItem("calc_circ_material_id") || "crack_peel";
  });
  const [materialName, setMaterialName] = useState(() => {
    return localStorage.getItem("calc_circ_material_name") || "Crack & Peel Sticker Sheet (Letter)";
  });
  const [sheetWidth, setSheetWidth] = useState(() => {
    return localStorage.getItem("calc_circ_sheet_w") || "11";
  });
  const [sheetHeight, setSheetHeight] = useState(() => {
    return localStorage.getItem("calc_circ_sheet_h") || "8.5";
  });
  const [costPerSheet, setCostPerSheet] = useState(() => {
    return localStorage.getItem("calc_circ_sheet_cost") || "375";
  });

  // Finished Circular Product Dimension: Diameter of one circle (inches)
  // When user says "4 x 4 circle", it means 4-inch diameter circle which requires a 4" x 4" square cutting area
  const [circleDiameter, setCircleDiameter] = useState(() => {
    return localStorage.getItem("calc_circ_diameter") || "4.0";
  });

  // Cutting Gap between individual square cutting areas (inches)
  const [cuttingGap, setCuttingGap] = useState(() => {
    return localStorage.getItem("calc_circ_cutting_gap") || "0.25";
  });

  // Waste Margin around the sheet (inches)
  const [wasteMargin, setWasteMargin] = useState(() => {
    return localStorage.getItem("calc_circ_waste_margin") || "0.25";
  });

  // Customer Quantity
  const [customerQty, setCustomerQty] = useState(() => {
    return localStorage.getItem("calc_circ_customer_qty") || "100";
  });

  // Additional Charges
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>(() => {
    const stored = localStorage.getItem("calc_circ_additional_charges");
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
    return localStorage.getItem("calc_circ_discount") || "0";
  });

  // UI state
  const [showAdditional, setShowAdditional] = useState(true);
  const [newChargeName, setNewChargeName] = useState("");
  const [newChargeAmount, setNewChargeAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [hoveredUnitIndex, setHoveredUnitIndex] = useState<number | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem("calc_circ_type", productType);
    localStorage.setItem("calc_circ_custom_type", customProductType);
    localStorage.setItem("calc_circ_material_id", materialId);
    localStorage.setItem("calc_circ_material_name", materialName);
    localStorage.setItem("calc_circ_sheet_w", sheetWidth);
    localStorage.setItem("calc_circ_sheet_h", sheetHeight);
    localStorage.setItem("calc_circ_sheet_cost", costPerSheet);
    localStorage.setItem("calc_circ_diameter", circleDiameter);
    localStorage.setItem("calc_circ_cutting_gap", cuttingGap);
    localStorage.setItem("calc_circ_waste_margin", wasteMargin);
    localStorage.setItem("calc_circ_customer_qty", customerQty);
    localStorage.setItem("calc_circ_discount", discountPercent);
    localStorage.setItem("calc_circ_additional_charges", JSON.stringify(additionalCharges));
  }, [
    productType, customProductType, materialId, materialName,
    sheetWidth, sheetHeight, costPerSheet, circleDiameter,
    cuttingGap, wasteMargin, customerQty, discountPercent, additionalCharges
  ]);

  // Materials list based on Centralized System Settings
  const materialsList: StandardMaterial[] = useMemo(() => {
    if (settings?.productionMaterials && settings.productionMaterials.length > 0) {
      return [
        ...settings.productionMaterials.map(m => ({
          id: m.id,
          name: m.name,
          width: m.width,
          height: m.height,
          cost: m.cost
        })),
        { id: "custom", name: "Custom Material", width: 11, height: 8.5, cost: 375 }
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
  const diam = Math.max(0.01, parseFloat(circleDiameter) || 4);
  const gap = Math.max(0, parseFloat(cuttingGap) || 0);
  const parsedWasteMargin = Math.max(0, parseFloat(wasteMargin) || 0);
  const reqQty = Math.max(1, parseInt(customerQty, 10) || 1);
  const sheetCost = Math.max(0, parseFloat(costPerSheet) || 0);

  // Circular Layout Calculation using Square Cutting Area Engine
  const layoutResult = useMemo(() => {
    return calculateCircularLayout(sw, sh, diam, gap, parsedWasteMargin);
  }, [sw, sh, diam, gap, parsedWasteMargin]);

  const usablePiecesPerSheet = layoutResult.itemsPerSheet;

  // Production Quantities
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
    setProductType("Circular Stickers");
    setCustomProductType("");
    setMaterialId("crack_peel");
    setMaterialName("Crack & Peel Sticker Sheet (Letter)");
    setSheetWidth("11");
    setSheetHeight("8.5");
    setCostPerSheet("375");
    setCircleDiameter("4.0");
    setCuttingGap("0.25");
    setWasteMargin("0.25");
    setCustomerQty("100");
    setDiscountPercent("0");
    setAdditionalCharges([{ id: "1", name: "Design Fee", amount: "1000" }]);
    setIsQuoteOverridden(false);
    setManualQuote("");
  };

  // Formatted display text for copying quote
  const displayProductTitle = productType === "Custom Circular Product" && customProductType.trim()
    ? customProductType.trim()
    : productType;

  const getGeneratedQuoteText = () => {
    const prodTemplate = settings?.quoteTemplates?.find(t => t.active && (
      t.toolKey === "circular_layout" || 
      t.id === "tpl_circular_layout_quote" ||
      t.toolKey === "production_layout" || 
      t.id === "tpl_production_layout_quote"
    )) || DEFAULT_QUOTE_TEMPLATES.find(t => t.id === "tpl_production_layout_quote");

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
    const activeDeliveryMethod = settings?.deliveryMethods?.find(m => m.active) || { 
      name: "Knutsford Express", 
      messageTemplate: "Your order will be dispatched via Knutsford Express once production has been completed. Tracking details will be provided once your order is ready for shipment." 
    };
    const deliveryMethodName = activeDeliveryMethod.name;
    const deliveryMsgStr = activeDeliveryMethod.messageTemplate.trim();

    if (prodTemplate) {
      return formatQuoteTemplate(prodTemplate.content, {
        CustomerResponse: customerResponseStr,
        MaterialName: materialName,
        SheetSpecs: `${formatDiameter(diam, "in", 2, true)} Circle (${formatDimensionPair(diam, diam, "in", 2, true)} Cutting Square with ${formatMeasurement(gap, "in", 2, true)} gap) on ${formatDimensionPair(sw, sh, "in", 2, true)} Sheet`,
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
      sections.push(
        `Production Details:\n* Item: ${reqQty} ${displayProductTitle} (${formatDiameter(diam, "in", 2, true)})\n* Cutting Area: ${formatDimensionPair(diam, diam, "in", 2, true)} Square with ${formatMeasurement(gap, "in", 2, true)} Spacing Gap\n* Material: ${materialName} (${formatDimensionPair(sw, sh, "in", 2, true)})\n* Layout: ${layoutResult.columns} Columns × ${layoutResult.rows} Rows = ${usablePiecesPerSheet} circles/sheet\n* Production: ${sheetsRequired} sheets required (${actualProductionQty} units yield)`
      );
    }

    if (addChargesStr) {
      sections.push(`Additional Charges\n${addChargesStr}`);
    }

    if (hasDiscount) {
      sections.push(`Discount\n* You save ${parsedDiscount}% = JMD $${discountAmount.toLocaleString()}`);
    }

    sections.push(`Total: JMD $${finalQuote.toLocaleString()}\n(Includes printing and cutting unless otherwise stated.)`);
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

  const handleSaveQuotation = () => {
    const prodName = productType === "Custom Circular Product" ? (customProductType || "Custom Circular Item") : productType;
    const newQuote: SavedQuotation = normalizeQuotation({
      id: "quote_" + Date.now(),
      quoteNumber: `CIR-QT-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: "Circular Print Order",
      toolType: "circular_layout",
      title: `${reqQty} Units ${prodName} (${diam}" Ø on ${materialName})`,
      date: new Date().toISOString().split("T")[0],
      totalCost: totalCostBeforeQuote,
      quotedPrice: finalQuote,
      details: `${prodName} - Qty: ${reqQty}, Diam: ${diam}" (${diam}"x${diam}" square cutting area, ${gap}" gap), Material: ${materialName}, Sheet: ${sw}"x${sh}", Yield: ${usablePiecesPerSheet}/sheet (${layoutResult.columns}x${layoutResult.rows}, ${sheetsRequired} sheets). Total: $${finalQuote.toLocaleString()} JMD.`,
      summaryText: `${reqQty} Units ${prodName} (${diam}" Diameter Circle)`,
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
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-6 text-left animate-fade-in" id="circular-production-layout-calculator-widget">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700">
            <CircleDot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Circular Production Layout Calculator</h3>
              <span className="bg-indigo-100/70 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-200/60">
                Square Cutting Area Model
              </span>
            </div>
            <p className="text-[10px] font-medium text-slate-500">
              Each circle requires an individual square cutting area with spacing gaps between squares
            </p>
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

      {/* Fundamental Principle Banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-emerald-50/50 border border-indigo-100 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0">
            <Square className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>{formatDiameter(diam, "in")} Circle</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-500 inline" />
              <span className="text-indigo-700 font-extrabold">{formatDimensionPair(diam, diam, "in")} Square Cutting Area</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Cutting Gap ({formatMeasurement(gap, "in")}) is applied between neighboring individual squares. Result: <strong>{layoutResult.columns} Columns × {layoutResult.rows} Rows = {usablePiecesPerSheet} Circles Per Sheet</strong>.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2 bg-white/80 border border-indigo-200/60 px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold text-indigo-900">
          <span>{layoutResult.columns} col × {layoutResult.rows} row</span>
          <span className="text-indigo-400">•</span>
          <span className="text-emerald-700">{usablePiecesPerSheet} circles</span>
        </div>
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
                  <option value="Circular Stickers">Circular Stickers</option>
                  <option value="Circular Labels">Circular Labels</option>
                  <option value="Round Printed Products">Round Printed Products</option>
                  <option value="Circular Crack & Peel">Circular Crack &amp; Peel</option>
                  <option value="Circular Cardstock Tags">Circular Cardstock Tags</option>
                  <option value="Custom Circular Product">Custom Circular Product</option>
                </select>
              </div>

              {/* Custom Product Name Input if selected */}
              {productType === "Custom Circular Product" ? (
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Custom Category / Title
                  </label>
                  <input
                    type="text"
                    value={customProductType}
                    onChange={(e) => setCustomProductType(e.target.value)}
                    placeholder="E.g. Round Coasters, Badges..."
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
                        {m.name} ({formatDimensionPair(m.width, m.height, "in")} @ ${m.cost})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Custom Product selected material dropdown row if not shown above */}
            {productType === "Custom Circular Product" && (
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
                      {m.name} ({formatDimensionPair(m.width, m.height, "in")} @ ${m.cost})
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

          {/* Section 2: Circular Dimensions, Cutting Gap & Order Quantity */}
          <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <CircleDot className="w-3.5 h-3.5 text-indigo-600" />
                <span>2. Circle Diameter, Cutting Gap &amp; Order Quantity</span>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                Cutting Area: {formatDimensionPair(diam, diam, "in")}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Circle Diameter */}
              <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-600 block">
                    Circle Diameter (in)
                  </label>
                  <span className="text-[9px] font-mono text-indigo-600 font-bold">1 circle</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    value={circleDiameter}
                    onChange={(e) => setCircleDiameter(e.target.value)}
                    placeholder="4.0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-mono font-extrabold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Requires <strong>{diam}" × {diam}" square</strong> cutting area
                </p>
              </div>

              {/* Cutting Gap between individual squares */}
              <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-600 block">
                    Cutting Gap Between Squares (in)
                  </label>
                  <span className="text-[9px] font-mono text-slate-500 font-bold">spacing</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={cuttingGap}
                    onChange={(e) => setCuttingGap(e.target.value)}
                    placeholder="0.25"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-mono font-extrabold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Two squares occupy: {diam}" + {gap}" + {diam}" = <strong>{(diam * 2 + gap).toFixed(2)}"</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Requested Quantity */}
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Customer Requested Quantity (Units)
                </label>
                <input
                  type="number"
                  min="1"
                  value={customerQty}
                  onChange={(e) => setCustomerQty(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Waste Margin (in) */}
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block" title="Non-printable safety border inset from physical sheet edge">
                  Waste Margin on Sheet (in)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={wasteMargin}
                  onChange={(e) => setWasteMargin(e.target.value)}
                  placeholder="0.25"
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Layout Diagnostic Summary */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span className="flex items-center gap-1.5 text-indigo-600">
                  <Layers className="w-4 h-4" /> Layout Calculation Result
                </span>
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-extrabold">
                  {usablePiecesPerSheet} Circles / Sheet
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Columns</span>
                  <span className="text-sm font-extrabold font-mono text-slate-900">{layoutResult.columns}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Rows</span>
                  <span className="text-sm font-extrabold font-mono text-slate-900">{layoutResult.rows}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Occupied Footprint</span>
                  <span className="text-xs font-extrabold font-mono text-indigo-700">
                    {layoutResult.occupiedWidth.toFixed(2)}" × {layoutResult.occupiedHeight.toFixed(2)}"
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium text-center">
                {layoutResult.columns} columns × {layoutResult.rows} rows = <strong>{usablePiecesPerSheet} individual {diam}" × {diam}" cutting squares</strong> with {gap}" cutting gap.
              </p>
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
                      placeholder="Fee Name (Design, Setup, Die Cut...)"
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
                    placeholder="New Charge Name (e.g. Die Cutting, Setup...)"
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
                <Square className="w-4 h-4 text-sky-400" />
                <span>Visual Sheet Layout</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {formatDimensionPair(sw, sh, "in")} Sheet • {formatDiameter(diam, "in")} Circle
              </span>
            </div>

            {/* Interactive SVG Preview Canvas */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center min-h-[220px] overflow-hidden">
              {layoutResult.isValid && usablePiecesPerSheet > 0 ? (
                <div className="w-full flex flex-col items-center justify-center space-y-2.5">
                  <div className="w-full max-w-[340px] aspect-auto flex items-center justify-center">
                    <svg
                      viewBox={`0 0 ${sw} ${sh}`}
                      className="w-full h-auto max-h-[230px] rounded-lg shadow-inner border border-slate-800 bg-slate-950"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      {/* Physical Sheet Background */}
                      <rect
                        x={0}
                        y={0}
                        width={sw}
                        height={sh}
                        fill="#090d16"
                        stroke="#334155"
                        strokeWidth={Math.min(0.04, sw * 0.005)}
                      />

                      {/* Waste Margin Outer Safety Boundary (if > 0) */}
                      {parsedWasteMargin > 0 && (
                        <rect
                          x={parsedWasteMargin / 2}
                          y={parsedWasteMargin / 2}
                          width={Math.max(0, sw - parsedWasteMargin)}
                          height={Math.max(0, sh - parsedWasteMargin)}
                          fill="none"
                          stroke="rgba(239, 68, 68, 0.35)"
                          strokeWidth={Math.min(0.025, sw * 0.003)}
                          strokeDasharray={`${sw * 0.02} ${sw * 0.015}`}
                        />
                      )}

                      {/* Rendered Individual Cutting Units: Square Cutting Area + Inscribed Circle */}
                      {layoutResult.units.map((unit) => {
                        const isHovered = hoveredUnitIndex === unit.index;
                        return (
                          <g
                            key={unit.index}
                            onMouseEnter={() => setHoveredUnitIndex(unit.index)}
                            onMouseLeave={() => setHoveredUnitIndex(null)}
                            className="cursor-pointer transition-all"
                          >
                            {/* 1. Individual Square Cutting Area (D x D) */}
                            <rect
                              x={unit.squareX}
                              y={unit.squareY}
                              width={unit.squareSize}
                              height={unit.squareSize}
                              fill={isHovered ? "rgba(56, 189, 248, 0.15)" : "rgba(30, 41, 59, 0.5)"}
                              stroke={isHovered ? "#38bdf8" : "#475569"}
                              strokeWidth={Math.min(0.03, unit.squareSize * 0.015)}
                              strokeDasharray={isHovered ? "none" : `${unit.squareSize * 0.08} ${unit.squareSize * 0.04}`}
                            />

                            {/* 2. Inscribed Circle inside the Square */}
                            <circle
                              cx={unit.centerX}
                              cy={unit.centerY}
                              r={unit.radius}
                              fill={isHovered ? "rgba(16, 185, 129, 0.4)" : "rgba(99, 102, 241, 0.28)"}
                              stroke={isHovered ? "#34d399" : "#818cf8"}
                              strokeWidth={Math.min(0.035, unit.radius * 0.07)}
                            />

                            {/* 3. Subtle Inner Accent Ring */}
                            <circle
                              cx={unit.centerX}
                              cy={unit.centerY}
                              r={unit.radius * 0.72}
                              fill="none"
                              stroke={isHovered ? "rgba(52, 211, 153, 0.3)" : "rgba(129, 140, 248, 0.15)"}
                              strokeWidth={Math.min(0.015, unit.radius * 0.035)}
                            />

                            {/* 4. Center Label / Index Indicator */}
                            {unit.radius >= 0.4 && (
                              <text
                                x={unit.centerX}
                                y={unit.centerY}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize={Math.min(unit.radius * 0.45, 0.4)}
                                fill={isHovered ? "#ffffff" : "#c7d2fe"}
                                fontWeight="bold"
                                fontFamily="monospace"
                              >
                                {unit.diameter}" Ø
                              </text>
                            )}

                            {/* 5. Square Dimension Corner Tag */}
                            {unit.squareSize >= 1.5 && (
                              <text
                                x={unit.squareX + unit.squareSize * 0.06}
                                y={unit.squareY + unit.squareSize * 0.12}
                                fontSize={Math.min(unit.squareSize * 0.14, 0.22)}
                                fill={isHovered ? "#38bdf8" : "#94a3b8"}
                                fontFamily="sans-serif"
                                fontWeight="600"
                              >
                                #{unit.index} ({unit.squareSize}"×{unit.squareSize}")
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Canvas Legend & Separation Clarification */}
                  <div className="w-full bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-center text-[10px] space-y-1">
                    <div className="flex items-center justify-center gap-3 text-slate-300 font-mono font-bold">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-xs border border-sky-400 bg-sky-500/20 inline-block" />
                        {diam}" × {diam}" Cutting Square
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full border border-indigo-400 bg-indigo-500/20 inline-block" />
                        {diam}" Ø Circle
                      </span>
                      <span className="text-emerald-400 font-extrabold">
                        Gap: {gap}"
                      </span>
                    </div>
                    <p className="text-slate-400 text-[9px]">
                      {layoutResult.columns} Columns × {layoutResult.rows} Rows • Four separate cutting squares separated by {gap}" cutting gap
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 px-4 text-slate-400 text-xs font-medium space-y-1">
                  <p className="font-bold text-rose-300">No complete cutting squares fit on sheet.</p>
                  <p className="text-[10px] text-slate-500">
                    {layoutResult.validationMessage || `Square cutting area (${diam}" × ${diam}") exceeds sheet area.`}
                  </p>
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
