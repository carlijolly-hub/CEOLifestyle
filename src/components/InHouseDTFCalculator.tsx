import React, { useState, useEffect, useMemo } from "react";
import { 
  Printer, 
  Layers, 
  DollarSign, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  RefreshCw, 
  Sparkles, 
  RotateCw, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Settings, 
  Sliders, 
  ArrowRight, 
  Scissors, 
  BookmarkCheck,
  Save,
  Square,
  LayoutGrid,
  User,
  SlidersHorizontal,
  ChevronDown,
  Maximize2
} from "lucide-react";
import { SystemSettings, SavedQuotation, DTFSupplier } from "../types";
import { 
  ArtworkInputItem, 
  ARTWORK_COLORS 
} from "../utils/dtfPackingEngine";
import { 
  calculateDTFSheetPacking, 
  calculateSingleDesignPacking, 
  DTFSheetPackingResult,
  DiscreteDesignInput,
  EMPTY_PACKING_RESULT
} from "../utils/dtfSheetPackingEngine";
import { 
  MeasurementUnit, 
  toInches, 
  fromInches, 
  formatMeasurement, 
  formatDimensionPair, 
  formatAreaSquareFeet 
} from "../utils/measurementUtils";
import DTFDiscreteSheetDiagram from "./DTFDiscreteSheetDiagram";
import TemplateBlockViewer from "./common/TemplateBlockViewer";
import { loadEnvironmentQuotations, saveEnvironmentQuotations } from "../utils/environmentUtils";

interface InHouseDTFCalculatorProps {
  settings?: SystemSettings;
}

type CalculationMode = "single_design" | "multiple_logo";

interface SheetPreset {
  id: string;
  name: string;
  widthInches: number;
  heightInches: number;
  costPerSheetJMD: number;
  isCustom?: boolean;
}

const DEFAULT_SHEET_PRESETS: SheetPreset[] = [
  { id: "std-11x16", name: "Standard DTF Sheet (11 in × 16 in)", widthInches: 11, heightInches: 16, costPerSheetJMD: 800 },
  { id: "krz-12x17", name: "KRZ Prints Standard (12 in × 17 in)", widthInches: 12, heightInches: 17, costPerSheetJMD: 800 },
  { id: "earl-12x12", name: "Earl Prints Sheet (12 in × 12 in)", widthInches: 12, heightInches: 12, costPerSheetJMD: 2000 },
  { id: "large-22x14", name: "Large Format Sheet (22 in × 14 in)", widthInches: 22, heightInches: 14, costPerSheetJMD: 1700 },
  { id: "roll-22x36", name: "Large Gang Roll (22 in × 36 in)", widthInches: 22, heightInches: 36, costPerSheetJMD: 3500 },
  { id: "custom", name: "Custom Sheet Dimensions...", widthInches: 11, heightInches: 16, costPerSheetJMD: 800, isCustom: true }
];

export default function InHouseDTFCalculator({ settings }: InHouseDTFCalculatorProps) {
  // --- 1. CALCULATION MODE: SINGLE DESIGN vs MULTIPLE LOGO EDITION ---
  const [calcMode, setCalcMode] = useState<CalculationMode>(() => {
    const saved = localStorage.getItem("ceo_inhouse_dtf_calc_type");
    if (saved === "print_only" || saved === "single_design") return "single_design";
    return "multiple_logo";
  });

  const handleCalcModeChange = (mode: CalculationMode) => {
    setCalcMode(mode);
    localStorage.setItem("ceo_inhouse_dtf_calc_type", mode);
  };

  // --- 2. MEASUREMENT UNIT STATE ---
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>(() => {
    const saved = localStorage.getItem("ceo_dtf_measurement_unit");
    if (saved === "cm" || saved === "ft") return saved;
    return "in";
  });

  const handleUnitChange = (newUnit: MeasurementUnit) => {
    if (newUnit === measurementUnit) return;
    
    // Smoothly convert existing input values to new unit
    const prevUnit = measurementUnit;
    
    // Convert single design dimensions
    setSingleWidth(prev => {
      const num = parseFloat(prev);
      if (isNaN(num) || num <= 0) return prev;
      const inInches = toInches(num, prevUnit);
      return fromInches(inInches, newUnit).toFixed(2);
    });
    setSingleHeight(prev => {
      const num = parseFloat(prev);
      if (isNaN(num) || num <= 0) return prev;
      const inInches = toInches(num, prevUnit);
      return fromInches(inInches, newUnit).toFixed(2);
    });

    // Convert sheet custom dimensions
    setCustomSheetWidth(prev => {
      const num = parseFloat(prev);
      if (isNaN(num) || num <= 0) return prev;
      const inInches = toInches(num, prevUnit);
      return fromInches(inInches, newUnit).toFixed(2);
    });
    setCustomSheetHeight(prev => {
      const num = parseFloat(prev);
      if (isNaN(num) || num <= 0) return prev;
      const inInches = toInches(num, prevUnit);
      return fromInches(inInches, newUnit).toFixed(2);
    });

    // Convert multiple designs list
    setDesignList(prev => prev.map(d => {
      const wIn = toInches(d.width, prevUnit);
      const hIn = toInches(d.height, prevUnit);
      return {
        ...d,
        width: parseFloat(fromInches(wIn, newUnit).toFixed(2)),
        height: parseFloat(fromInches(hIn, newUnit).toFixed(2))
      };
    }));

    setMeasurementUnit(newUnit);
    localStorage.setItem("ceo_dtf_measurement_unit", newUnit);
  };

  // --- 3. SHEET / MATERIAL SELECTION ---
  // Combine default presets with active suppliers from settings
  const availablePresets: SheetPreset[] = useMemo(() => {
    const list: SheetPreset[] = [...DEFAULT_SHEET_PRESETS];
    if (settings?.dtfSuppliers && settings.dtfSuppliers.length > 0) {
      settings.dtfSuppliers.forEach((sup: DTFSupplier) => {
        if (!list.some(p => p.id === sup.id)) {
          list.splice(list.length - 1, 0, {
            id: sup.id,
            name: `${sup.name} (${sup.sheetWidth} in × ${sup.sheetHeight} in)`,
            widthInches: sup.sheetWidth,
            heightInches: sup.sheetHeight,
            costPerSheetJMD: sup.costPerSheet || 800
          });
        }
      });
    }
    return list;
  }, [settings?.dtfSuppliers]);

  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => {
    return localStorage.getItem("ceo_dtf_selected_preset_id") || "std-11x16";
  });

  const activePreset = useMemo(() => {
    return availablePresets.find(p => p.id === selectedPresetId) || availablePresets[0];
  }, [availablePresets, selectedPresetId]);

  const [customSheetWidth, setCustomSheetWidth] = useState<string>(() => {
    return localStorage.getItem("ceo_dtf_custom_sheet_w") || "11";
  });
  const [customSheetHeight, setCustomSheetHeight] = useState<string>(() => {
    return localStorage.getItem("ceo_dtf_custom_sheet_h") || "16";
  });
  const [customCostPerSheet, setCustomCostPerSheet] = useState<string>(() => {
    return localStorage.getItem("ceo_dtf_custom_sheet_cost") || "800";
  });

  // Calculate physical sheet width and height in normalized INCHES
  const sheetWidthInches = useMemo(() => {
    if (activePreset.isCustom) {
      const val = parseFloat(customSheetWidth) || 11;
      return toInches(val, measurementUnit);
    }
    return activePreset.widthInches;
  }, [activePreset, customSheetWidth, measurementUnit]);

  const sheetHeightInches = useMemo(() => {
    if (activePreset.isCustom) {
      const val = parseFloat(customSheetHeight) || 16;
      return toInches(val, measurementUnit);
    }
    return activePreset.heightInches;
  }, [activePreset, customSheetHeight, measurementUnit]);

  const sheetCostPerUnitJMD = useMemo(() => {
    if (activePreset.isCustom) {
      return Math.max(0, parseFloat(customCostPerSheet) || 800);
    }
    return activePreset.costPerSheetJMD;
  }, [activePreset, customCostPerSheet]);

  // --- 4. BUSINESS PRICING & RATE PARAMETERS ---
  const [pricePerSqFt, setPricePerSqFt] = useState<string>(() => {
    return localStorage.getItem("ceo_dtf_default_rate_sqft") || "1500";
  });
  const [additionalFees, setAdditionalFees] = useState<string>("0");
  const [feeDescription, setFeeDescription] = useState<string>("File prep / Setup fee");

  // --- 5. PHYSICAL PACKING PARAMETERS ---
  const [transferSpacing, setTransferSpacing] = useState<string>(() => {
    return localStorage.getItem("ceo_dtf_default_spacing") || "0.25";
  });
  const [edgeMargin, setEdgeMargin] = useState<string>(() => {
    return localStorage.getItem("ceo_dtf_default_margin") || "0.25";
  });
  const [allowRotation, setAllowRotation] = useState<boolean>(() => {
    const saved = localStorage.getItem("ceo_dtf_default_rotation");
    return saved !== null ? saved === "true" : true;
  });

  // --- 6. SINGLE DESIGN MODE INPUTS ---
  const [singleDesignName, setSingleDesignName] = useState<string>("Primary Graphic");
  const [singleWidth, setSingleWidth] = useState<string>("11");
  const [singleHeight, setSingleHeight] = useState<string>("16");
  const [singleQuantity, setSingleQuantity] = useState<string>("2");

  // --- 7. MULTIPLE LOGO EDITION MODE INPUTS ---
  const [designList, setDesignList] = useState<DiscreteDesignInput[]>(() => {
    const saved = localStorage.getItem("ceo_dtf_multi_design_list");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { id: "des-1", designName: "Logo A", width: 4, height: 4, quantity: 10, color: ARTWORK_COLORS[0], notes: "Chest Pocket" },
      { id: "des-2", designName: "Logo B", width: 8, height: 6, quantity: 4, color: ARTWORK_COLORS[1], notes: "Full Back" },
      { id: "des-3", designName: "Logo C", width: 3, height: 5, quantity: 6, color: ARTWORK_COLORS[2], notes: "Sleeve Badge" },
    ];
  });

  useEffect(() => {
    localStorage.setItem("ceo_dtf_multi_design_list", JSON.stringify(designList));
  }, [designList]);

  // --- 8. CLIENT & ORDER DETAILS ---
  const [clientName, setClientName] = useState<string>("");
  const [orderTitle, setOrderTitle] = useState<string>("");
  const [copiedCustomerQuote, setCopiedCustomerQuote] = useState<boolean>(false);
  const [copiedProductionOrder, setCopiedProductionOrder] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [defaultsSavedNotice, setDefaultsSavedNotice] = useState<boolean>(false);
  const [activeTemplateTab, setActiveTemplateTab] = useState<"customer" | "production">("customer");

  // --- ROUNDING HELPER: CEILING(Raw / 100) * 100 ---
  const roundUpToNearest100 = (amount: number): number => {
    if (amount <= 0) return 0;
    const normalized = Math.round(amount * 10000) / 10000;
    return Math.ceil(normalized / 100) * 100;
  };

  const formatMoney = (val: number) => {
    if (Number.isInteger(val)) {
      return `JMD $${val.toLocaleString()}`;
    }
    return `JMD $${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // --- COMPUTED PACKING RESULTS ---
  const numTransferSpacingInches = toInches(Math.max(0, parseFloat(transferSpacing) || 0), measurementUnit);
  const numEdgeMarginInches = toInches(Math.max(0, parseFloat(edgeMargin) || 0), measurementUnit);
  const numPricePerSqFt = Math.max(0, parseFloat(pricePerSqFt) || 0);
  const numAdditionalFees = Math.max(0, parseFloat(additionalFees) || 0);

  // Packing result for Single Design Mode
  const singlePackingResult: DTFSheetPackingResult = useMemo(() => {
    if (calcMode !== "single_design") {
      return EMPTY_PACKING_RESULT;
    }

    const wIn = toInches(Math.max(0.1, parseFloat(singleWidth) || 0), measurementUnit);
    const hIn = toInches(Math.max(0.1, parseFloat(singleHeight) || 0), measurementUnit);
    const qty = Math.max(1, parseInt(singleQuantity, 10) || 1);

    return calculateSingleDesignPacking(wIn, hIn, qty, {
      sheetWidth: sheetWidthInches,
      sheetHeight: sheetHeightInches,
      transferSpacing: numTransferSpacingInches,
      edgeMargin: numEdgeMarginInches,
      allowRotation,
      designName: singleDesignName.trim() || "Design #1"
    });
  }, [
    calcMode,
    singleWidth,
    singleHeight,
    singleQuantity,
    singleDesignName,
    sheetWidthInches,
    sheetHeightInches,
    numTransferSpacingInches,
    numEdgeMarginInches,
    allowRotation,
    measurementUnit
  ]);

  // Packing result for Multiple Logo Edition Mode
  const multiPackingResult: DTFSheetPackingResult = useMemo(() => {
    if (calcMode !== "multiple_logo") {
      return EMPTY_PACKING_RESULT;
    }

    // Convert each design from active unit to normalized inches
    const normalizedDesigns: DiscreteDesignInput[] = designList.map(d => ({
      ...d,
      width: toInches(Math.max(0.1, d.width || 0), measurementUnit),
      height: toInches(Math.max(0.1, d.height || 0), measurementUnit),
      quantity: Math.max(1, d.quantity || 1)
    }));

    return calculateDTFSheetPacking(normalizedDesigns, {
      sheetWidth: sheetWidthInches,
      sheetHeight: sheetHeightInches,
      transferSpacing: numTransferSpacingInches,
      edgeMargin: numEdgeMarginInches,
      allowRotation
    });
  }, [
    calcMode,
    designList,
    sheetWidthInches,
    sheetHeightInches,
    numTransferSpacingInches,
    numEdgeMarginInches,
    allowRotation,
    measurementUnit
  ]);

  // Unified Active Packing Result
  const activePackingResult = calcMode === "single_design" ? singlePackingResult : multiPackingResult;

  // --- COMMERCIAL FINANCIAL CALCULATIONS ---
  // 1. Total Sheets Required
  const sheetsRequired = activePackingResult.sheetsRequired;

  // 2. Production Material Cost = sheetsRequired × sheetCostPerUnitJMD
  const totalProductionCost = sheetsRequired * sheetCostPerUnitJMD;

  // 3. Square Footage of required sheets
  const singleSheetSqFt = (sheetWidthInches * sheetHeightInches) / 144;
  const totalSquareFootage = sheetsRequired * singleSheetSqFt;

  // 4. Base Customer Charge (Rate per sq ft, rounded up to nearest $100)
  const rawCustomerCharge = totalSquareFootage * numPricePerSqFt;
  const baseCustomerCharge = roundUpToNearest100(rawCustomerCharge);

  // 5. Final Customer Price = Base Customer Charge + Additional Fees
  const finalCustomerPrice = baseCustomerCharge + numAdditionalFees;

  // 6. Gross Profit & Profit Margin
  const grossProfit = Math.max(0, finalCustomerPrice - totalProductionCost);
  const profitMarginPercent = finalCustomerPrice > 0 ? (grossProfit / finalCustomerPrice) * 100 : 0;

  // Display unit values for the active sheet size
  const displaySheetW = fromInches(sheetWidthInches, measurementUnit);
  const displaySheetH = fromInches(sheetHeightInches, measurementUnit);

  // --- ACTIONS: MULTIPLE LOGOS MANAGEMENT ---
  const handleAddDesign = () => {
    const nextIdx = designList.length;
    const newDesign: DiscreteDesignInput = {
      id: `des-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      designName: `Logo ${String.fromCharCode(65 + (nextIdx % 26))}`,
      width: parseFloat(fromInches(4, measurementUnit).toFixed(2)),
      height: parseFloat(fromInches(4, measurementUnit).toFixed(2)),
      quantity: 5,
      color: ARTWORK_COLORS[nextIdx % ARTWORK_COLORS.length],
      notes: ""
    };
    setDesignList([...designList, newDesign]);
  };

  const handleUpdateDesign = (id: string, field: keyof DiscreteDesignInput, value: any) => {
    setDesignList(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, [field]: value };
    }));
  };

  const handleDuplicateDesign = (item: DiscreteDesignInput) => {
    const duplicated: DiscreteDesignInput = {
      ...item,
      id: `des-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      designName: `${item.designName} (Copy)`,
      color: ARTWORK_COLORS[designList.length % ARTWORK_COLORS.length]
    };
    setDesignList([...designList, duplicated]);
  };

  const handleDeleteDesign = (id: string) => {
    if (designList.length <= 1) return;
    setDesignList(prev => prev.filter(item => item.id !== id));
  };

  // --- ACTION: SAVE DEFAULTS ---
  const handleSaveDefaults = () => {
    localStorage.setItem("ceo_dtf_selected_preset_id", selectedPresetId);
    localStorage.setItem("ceo_dtf_custom_sheet_w", customSheetWidth);
    localStorage.setItem("ceo_dtf_custom_sheet_h", customSheetHeight);
    localStorage.setItem("ceo_dtf_custom_sheet_cost", customCostPerSheet);
    localStorage.setItem("ceo_dtf_default_rate_sqft", pricePerSqFt);
    localStorage.setItem("ceo_dtf_default_spacing", transferSpacing);
    localStorage.setItem("ceo_dtf_default_margin", edgeMargin);
    localStorage.setItem("ceo_dtf_default_rotation", String(allowRotation));
    localStorage.setItem("ceo_dtf_measurement_unit", measurementUnit);

    setDefaultsSavedNotice(true);
    setTimeout(() => setDefaultsSavedNotice(false), 3000);
  };

  // --- ACTION: CLEAR CURRENT CALCULATION ---
  const handleClearCalculation = () => {
    if (calcMode === "single_design") {
      setSingleDesignName("Primary Graphic");
      setSingleWidth(fromInches(11, measurementUnit).toFixed(2));
      setSingleHeight(fromInches(16, measurementUnit).toFixed(2));
      setSingleQuantity("2");
    } else {
      setDesignList([
        {
          id: `des-${Date.now()}`,
          designName: "Logo A",
          width: parseFloat(fromInches(4, measurementUnit).toFixed(2)),
          height: parseFloat(fromInches(4, measurementUnit).toFixed(2)),
          quantity: 10,
          color: ARTWORK_COLORS[0],
          notes: ""
        }
      ]);
    }
    setClientName("");
    setOrderTitle("");
    setAdditionalFees("0");
  };

  // --- TEMPLATE GENERATION (FULL UNIT NAMES FOR TEMPLATES) ---
  const customerTemplateText = useMemo(() => {
    const clientLine = clientName.trim() ? `Client: ${clientName.trim()}\n` : "";
    const orderLine = orderTitle.trim() ? `Job: ${orderTitle.trim()}\n` : "";

    let printsSummary = "";
    if (calcMode === "single_design") {
      const wDisplay = parseFloat(singleWidth) || 0;
      const hDisplay = parseFloat(singleHeight) || 0;
      printsSummary = `* ${singleQuantity} × ${formatDimensionPair(wDisplay, hDisplay, measurementUnit, 2, true)} (${singleDesignName.trim() || "Print"})`;
    } else {
      printsSummary = designList.map(d => 
        `* ${d.designName}: ${d.quantity} × ${formatDimensionPair(d.width, d.height, measurementUnit, 2, true)}${d.notes ? ` (${d.notes})` : ""}`
      ).join("\n");
      printsSummary += `\n\nTotal Prints: ${activePackingResult.totalAllocatedPieces} pieces (${sheetsRequired} DTF sheets)`;
    }

    const additionalFeesLine = numAdditionalFees > 0 
      ? `\nAdditional Services (${feeDescription}): JMD $${numAdditionalFees.toLocaleString()}`
      : "";

    return `*IN-HOUSE DTF PRINTING QUOTE*
----------------------------------------
${clientLine}${orderLine}
DTF Printing:
${printsSummary}${additionalFeesLine}

*Total: ${formatMoney(finalCustomerPrice)}*

Turnaround: Standard production 2-3 business days upon file approval.
Let me know if you would like to proceed!
----------------------------------------
*CEO Print - Premium Custom Transfers*`;
  }, [clientName, orderTitle, calcMode, singleQuantity, singleWidth, singleHeight, measurementUnit, singleDesignName, designList, activePackingResult.totalAllocatedPieces, sheetsRequired, numAdditionalFees, feeDescription, finalCustomerPrice]);

  const productionTemplateText = useMemo(() => {
    const clientLine = clientName.trim() ? `Client: ${clientName.trim()}\n` : "";
    const orderLine = orderTitle.trim() ? `Job: ${orderTitle.trim()}\n` : "";

    let designBreakdownText = "";
    if (calcMode === "single_design") {
      const wDisplay = parseFloat(singleWidth) || 0;
      const hDisplay = parseFloat(singleHeight) || 0;
      designBreakdownText = `* Design: ${singleDesignName.trim() || "Primary"} (${formatDimensionPair(wDisplay, hDisplay, measurementUnit, 2, true)}) - Requested: ${singleQuantity}, Allocated: ${activePackingResult.totalAllocatedPieces}`;
    } else {
      designBreakdownText = activePackingResult.designBreakdown.map(d => {
        const wDisplay = fromInches(d.width, measurementUnit);
        const hDisplay = fromInches(d.height, measurementUnit);
        return `* ${d.designName}: ${formatDimensionPair(wDisplay, hDisplay, measurementUnit, 2, true)} • Requested: ${d.requestedQty} • Placed: ${d.allocatedQty}`;
      }).join("\n");
    }

    const sheetAllocationText = activePackingResult.sheets.map(s => {
      const countsStr = Object.entries(s.allocatedCounts)
        .map(([name, count]) => `${count} × ${name}`)
        .join(", ");
      return `* Sheet #${s.sheetIndex}: ${countsStr || "0 pieces"} (${Math.round(s.utilizationPercent)}% utilized)`;
    }).join("\n");

    return `*IN-HOUSE DTF PRODUCTION ORDER*
----------------------------------------
${clientLine}${orderLine}Mode: ${calcMode === "single_design" ? "Single Design" : "Multiple Logo Edition"}
Date: ${new Date().toLocaleDateString()}

*Production Specifications:*
* Sheet Size: ${formatDimensionPair(displaySheetW, displaySheetH, measurementUnit, 2, true)}
* Sheets Required: ${sheetsRequired} sheets
* Total Pieces: ${activePackingResult.totalAllocatedPieces} of ${activePackingResult.totalRequestedPieces} placed
* Overall Sheet Utilization: ${Math.round(activePackingResult.overallUtilizationPercent)}%
* Total Film Area: ${totalSquareFootage.toFixed(2)} sq ft

*Design Breakdown:*
${designBreakdownText}

*Sheet Allocation:*
${sheetAllocationText}

*Cost & Financial Summary:*
* Sheet Supplier / Material Cost: ${formatMoney(sheetCostPerUnitJMD)} / sheet
* Total Production Cost: ${formatMoney(totalProductionCost)}
* Quoted Customer Price: ${formatMoney(finalCustomerPrice)}
* Estimated Gross Profit: ${formatMoney(grossProfit)} (${profitMarginPercent.toFixed(1)}% margin)
----------------------------------------
*CEO Print Internal Production*`;
  }, [clientName, orderTitle, calcMode, singleWidth, singleHeight, measurementUnit, singleDesignName, singleQuantity, activePackingResult, displaySheetW, displaySheetH, sheetsRequired, totalSquareFootage, sheetCostPerUnitJMD, totalProductionCost, finalCustomerPrice, grossProfit, profitMarginPercent]);

  // --- ACTION: COPY CUSTOMER TEMPLATE ---
  const handleCopyCustomerTemplate = () => {
    navigator.clipboard.writeText(customerTemplateText);
    setCopiedCustomerQuote(true);
    setTimeout(() => setCopiedCustomerQuote(false), 2500);
  };

  // --- ACTION: COPY PRODUCTION TEMPLATE ---
  const handleCopyProductionTemplate = () => {
    navigator.clipboard.writeText(productionTemplateText);
    setCopiedProductionOrder(true);
    setTimeout(() => setCopiedProductionOrder(false), 2500);
  };

  // --- ACTION: SAVE TO QUOTATIONS LOG ---
  const handleSaveToQuotationsLog = () => {
    const quoteTitle = orderTitle.trim() 
      ? `DTF: ${orderTitle.trim()} (${clientName.trim() || "Customer"})`
      : calcMode === "single_design"
        ? `In-House DTF: ${singleQuantity} × ${formatDimensionPair(parseFloat(singleWidth) || 0, parseFloat(singleHeight) || 0, measurementUnit)}`
        : `In-House DTF Multi-Logo: ${activePackingResult.totalAllocatedPieces} Prints on ${sheetsRequired} Sheets`;

    let formattedDetails = "";
    let itemDetailsArr: any[] = [];

    if (calcMode === "single_design") {
      formattedDetails = `Single Design DTF: ${singleQuantity} × ${formatDimensionPair(parseFloat(singleWidth) || 0, parseFloat(singleHeight) || 0, measurementUnit)} on ${sheetsRequired} sheet(s) (${formatDimensionPair(displaySheetW, displaySheetH, measurementUnit)}). Utilization: ${Math.round(activePackingResult.overallUtilizationPercent)}%. Customer Charge: ${formatMoney(finalCustomerPrice)}.`;
      itemDetailsArr = [{
        name: `${singleDesignName} (${formatDimensionPair(parseFloat(singleWidth) || 0, parseFloat(singleHeight) || 0, measurementUnit)})`,
        quantity: parseInt(singleQuantity, 10) || 1,
        unitPriceJMD: finalCustomerPrice / (parseInt(singleQuantity, 10) || 1),
        subtotalJMD: finalCustomerPrice,
      }];
    } else {
      const summaryDesigns = designList.map(d => `${d.quantity} × ${d.designName}`).join(", ");
      formattedDetails = `Multiple Logo Edition: ${summaryDesigns} placed across ${sheetsRequired} sheet(s) (${formatDimensionPair(displaySheetW, displaySheetH, measurementUnit)}). Overall Utilization: ${Math.round(activePackingResult.overallUtilizationPercent)}%. Customer Charge: ${formatMoney(finalCustomerPrice)}.`;
      itemDetailsArr = designList.map(d => ({
        name: `${d.designName} (${formatDimensionPair(d.width, d.height, measurementUnit)})`,
        quantity: d.quantity,
        unitPriceJMD: 0,
        subtotalJMD: 0,
      }));
    }

    const newQuote: SavedQuotation = {
      id: `quote-dtf-${Date.now()}`,
      toolType: "inhouse_dtf",
      clientName: clientName.trim() || "Customer Inquiry",
      title: quoteTitle,
      date: new Date().toISOString(),
      quotedPrice: finalCustomerPrice,
      totalJMD: finalCustomerPrice,
      totalCost: totalProductionCost,
      details: formattedDetails,
      summaryText: `DTF ${sheetsRequired} Sheet(s) • ${formatDimensionPair(displaySheetW, displaySheetH, measurementUnit)} • Charge: ${formatMoney(finalCustomerPrice)}`,
      itemDetails: itemDetailsArr,
      createdAt: new Date().toISOString(),
      isFavorite: false,
    };

    const existing = loadEnvironmentQuotations();
    saveEnvironmentQuotations([newQuote, ...existing]);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-6 text-left animate-fade-in" id="inhouse-dtf-calculator-widget">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">In-House DTF Printing Calculator</h3>
            <p className="text-xs text-slate-500">Physical rectangular sheet optimization & commercial quoting</p>
          </div>
        </div>

        {/* Header Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSaveDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            title="Save current sheet size, rates, and unit as defaults"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>{defaultsSavedNotice ? "Saved!" : "Save Defaults"}</span>
          </button>

          <button
            type="button"
            onClick={handleClearCalculation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 rounded-xl transition-all cursor-pointer"
            title="Clear current calculation"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Top Configuration Controls: Mode Selector & Measurement Unit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 1. CALCULATION MODE SELECTOR */}
        <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Mode:
          </span>
          <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => handleCalcModeChange("single_design")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                calcMode === "single_design"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>Single Design</span>
            </button>
            <button
              type="button"
              onClick={() => handleCalcModeChange("multiple_logo")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                calcMode === "multiple_logo"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
              <span>Multiple Logo Edition</span>
            </button>
          </div>
        </div>

        {/* 2. MEASUREMENT UNIT SELECTOR */}
        <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Measurement Unit:
          </span>
          <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => handleUnitChange("in")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                measurementUnit === "in"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Inches (in)
            </button>
            <button
              type="button"
              onClick={() => handleUnitChange("cm")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                measurementUnit === "cm"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Centimeters (cm)
            </button>
            <button
              type="button"
              onClick={() => handleUnitChange("ft")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                measurementUnit === "ft"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Feet (ft)
            </button>
          </div>
        </div>
      </div>

      {/* Validation Alert (if any design cannot fit on the sheet) */}
      {activePackingResult.unplaceableItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-200/90 rounded-2xl p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Design dimensions exceed available physical sheet size!</span>
          </div>
          <ul className="text-xs text-rose-700 space-y-1 list-disc list-inside pl-1">
            {activePackingResult.unplaceableItems.map((msg, i) => (
              <li key={i} className="leading-relaxed">{msg}</li>
            ))}
          </ul>
          <p className="text-[11px] text-rose-600 italic">
            Physical sheet size is {formatDimensionPair(displaySheetW, displaySheetH, measurementUnit)}. Designs must fit inside this boundary after margins.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN TWO-COLUMN LAYOUT: LEFT CONTROLS vs. RIGHT STICKY PREVIEW            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
        
        {/* ======================================================================= */}
        {/* LEFT COLUMN: INPUTS & PARAMETERS                                        */}
        {/* ======================================================================= */}
        <div className="lg:col-span-7 space-y-5">

          {/* Client & Order Reference (Optional) */}
          <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Order &amp; Client Information <span className="text-[10px] font-normal text-slate-400">— Optional</span></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Client / Customer Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Acme Corp / John Doe"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Order / Job Reference
                </label>
                <input
                  type="text"
                  value={orderTitle}
                  onChange={(e) => setOrderTitle(e.target.value)}
                  placeholder="e.g. Summer Merch / Chest + Back"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Sheet / Material Size Selection */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 break-words">DTF Sheet / Material Size</h3>
                  <p className="text-xs text-slate-500 break-words">Physical sheet size used for printing</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 break-words text-right">
                {formatDimensionPair(displaySheetW, displaySheetH, measurementUnit)}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Production Sheet Preset
                </label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => setSelectedPresetId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                >
                  {availablePresets.map(preset => {
                    const pwDisplay = fromInches(preset.widthInches, measurementUnit);
                    const phDisplay = fromInches(preset.heightInches, measurementUnit);
                    return (
                      <option key={preset.id} value={preset.id}>
                        {preset.name} — {formatDimensionPair(pwDisplay, phDisplay, measurementUnit)} ({formatMoney(preset.costPerSheetJMD)}/sheet)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* If Custom preset is selected, show custom dimension inputs */}
              {activePreset.isCustom && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Custom Width ({measurementUnit})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={customSheetWidth}
                      onChange={(e) => setCustomSheetWidth(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Custom Height ({measurementUnit})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={customSheetHeight}
                      onChange={(e) => setCustomSheetHeight(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Cost per Sheet (JMD)
                    </label>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={customCostPerSheet}
                      onChange={(e) => setCustomCostPerSheet(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* MODE A: SINGLE DESIGN INPUTS                                      */}
          {/* ----------------------------------------------------------------- */}
          {calcMode === "single_design" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Single Design Specifications</h3>
                    <p className="text-xs text-slate-500">Dimensions &amp; quantity for repeated design jobs</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Design Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Design / Artwork Name
                  </label>
                  <input
                    type="text"
                    value={singleDesignName}
                    onChange={(e) => setSingleDesignName(e.target.value)}
                    placeholder="e.g. Primary Graphic / Chest Logo"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Width */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Width ({measurementUnit})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={singleWidth}
                      onChange={(e) => setSingleWidth(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-hidden"
                      placeholder="e.g. 11"
                    />
                  </div>

                  {/* Height */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Height ({measurementUnit})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={singleHeight}
                      onChange={(e) => setSingleHeight(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-hidden"
                      placeholder="e.g. 16"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Quantity (Pieces)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={singleQuantity}
                      onChange={(e) => setSingleQuantity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-hidden"
                      placeholder="e.g. 2"
                    />
                  </div>
                </div>

                {/* Example Quick Presets */}
                <div className="flex flex-wrap gap-2 pt-1 text-xs">
                  <span className="text-slate-400 text-[11px] self-center">Quick Examples:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSingleWidth(fromInches(11, measurementUnit).toFixed(2));
                      setSingleHeight(fromInches(16, measurementUnit).toFixed(2));
                      setSingleQuantity("2");
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
                  >
                    2 × 11" × 16"
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSingleWidth(fromInches(5, measurementUnit).toFixed(2));
                      setSingleHeight(fromInches(7, measurementUnit).toFixed(2));
                      setSingleQuantity("10");
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
                  >
                    10 × 5" × 7"
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSingleWidth(fromInches(4, measurementUnit).toFixed(2));
                      setSingleHeight(fromInches(4, measurementUnit).toFixed(2));
                      setSingleQuantity("20");
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
                  >
                    20 × 4" × 4"
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* MODE B: MULTIPLE LOGO EDITION INPUTS                              */}
          {/* ----------------------------------------------------------------- */}
          {calcMode === "multiple_logo" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Multiple Logo / Design Roster</h3>
                    <p className="text-xs text-slate-500">Add multiple designs with independent dimensions &amp; quantities</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddDesign}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Design</span>
                </button>
              </div>

              {/* Design Entry Cards */}
              <div className="space-y-2.5">
                {designList.map((design, idx) => (
                  <div
                    key={design.id}
                    className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl hover:border-slate-300 transition-all space-y-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      
                      {/* Color indicator & Design Name */}
                      <div className="sm:col-span-5 flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs border border-white"
                          style={{ backgroundColor: design.color }}
                        />
                        <input
                          type="text"
                          value={design.designName}
                          onChange={(e) => handleUpdateDesign(design.id, "designName", e.target.value)}
                          placeholder="Design Name"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden"
                        />
                      </div>

                      {/* Dimensions: Width × Height */}
                      <div className="sm:col-span-4 flex items-center gap-1">
                        <div className="relative w-1/2">
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={design.width || ""}
                            onChange={(e) => handleUpdateDesign(design.id, "width", parseFloat(e.target.value) || 0)}
                            placeholder="W"
                            className="w-full pl-2 pr-5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-right"
                          />
                          <span className="absolute right-1.5 top-1.5 text-[9px] text-slate-400 font-bold">
                            {measurementUnit}
                          </span>
                        </div>
                        <span className="text-slate-400 text-xs font-bold">×</span>
                        <div className="relative w-1/2">
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={design.height || ""}
                            onChange={(e) => handleUpdateDesign(design.id, "height", parseFloat(e.target.value) || 0)}
                            placeholder="H"
                            className="w-full pl-2 pr-5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-right"
                          />
                          <span className="absolute right-1.5 top-1.5 text-[9px] text-slate-400 font-bold">
                            {measurementUnit}
                          </span>
                        </div>
                      </div>

                      {/* Quantity & Actions */}
                      <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-1.5">
                        <div className="relative w-18">
                          <input
                            type="number"
                            step="1"
                            min="1"
                            value={design.quantity}
                            onChange={(e) => handleUpdateDesign(design.id, "quantity", parseInt(e.target.value, 10) || 0)}
                            placeholder="Qty"
                            className="w-full pl-2 pr-6 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-right"
                          />
                          <span className="absolute right-1.5 top-1.5 text-[9px] text-slate-400">pcs</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDuplicateDesign(design)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Duplicate design"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDesign(design.id)}
                            disabled={designList.length <= 1}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                            title="Delete design"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Optional notes line */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400">Notes:</span>
                      <input
                        type="text"
                        value={design.notes || ""}
                        onChange={(e) => handleUpdateDesign(design.id, "notes", e.target.value)}
                        placeholder="e.g. Chest Pocket / Left Sleeve / Heat Press at 310°F"
                        className="w-full bg-transparent text-[11px] text-slate-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Roster Summary */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>{designList.length} distinct designs</span>
                <span>
                  <strong>{activePackingResult.totalAllocatedPieces}</strong> total transfers to pack
                </span>
              </div>
            </div>
          )}

          {/* Physical Spacing, Edge Margins & Rotation Rules */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Physical Layout Rules</h3>
                  <p className="text-xs text-slate-500">Transfer spacing, margins, and orientation</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Spacing */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cutting Gap / Spacing
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={transferSpacing}
                    onChange={(e) => setTransferSpacing(e.target.value)}
                    className="w-full pl-3 pr-7 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-slate-400 font-bold">{measurementUnit}</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">Between adjacent logos</span>
              </div>

              {/* Margin */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sheet Edge Margin
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={edgeMargin}
                    onChange={(e) => setEdgeMargin(e.target.value)}
                    className="w-full pl-3 pr-7 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-slate-400 font-bold">{measurementUnit}</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">Around sheet perimeter</span>
              </div>

              {/* Rotation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Auto-Rotation
                </label>
                <button
                  type="button"
                  onClick={() => setAllowRotation(!allowRotation)}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    allowRotation
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                      : "bg-slate-50 border-slate-300 text-slate-600"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{allowRotation ? "Enabled" : "Disabled"}</span>
                  </span>
                  <span className="text-[10px] font-mono">90°</span>
                </button>
                <span className="text-[10px] text-slate-400 block mt-1">Rotates if it fits more</span>
              </div>
            </div>
          </div>

          {/* Customer Charging Rate & Commercial Pricing */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Commercial Rates &amp; Additional Fees</h3>
                  <p className="text-xs text-slate-500">Customer charge rate per square foot and extra fees</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Rate Per Sq. Ft. (JMD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="50"
                    min="0"
                    value={pricePerSqFt}
                    onChange={(e) => setPricePerSqFt(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Standard commercial charging rate.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Fees (JMD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={additionalFees}
                    onChange={(e) => setAdditionalFees(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-hidden"
                  />
                </div>
                <input
                  type="text"
                  value={feeDescription}
                  onChange={(e) => setFeeDescription(e.target.value)}
                  placeholder="Fee description (e.g. Rush fee)"
                  className="w-full mt-1.5 px-2.5 py-1 bg-transparent border-b border-slate-200 text-[11px] text-slate-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: STICKY RESULTS, QUOTATIONS & VISUAL LAYOUT                */}
        {/* ======================================================================= */}
        <div className="lg:col-span-5 lg:sticky lg:top-4 space-y-5">

          {/* 1. COMMERCIAL SUMMARY HERO CARD */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-5 md:p-6 shadow-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  Customer Quoted Total
                </span>
                <h3 className="text-sm font-bold text-white mt-1">
                  {calcMode === "single_design" ? "Single Design DTF Quote" : "Multiple Logo Edition Quote"}
                </h3>
              </div>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>

            {/* Customer Charge Display */}
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 text-center space-y-1 shadow-inner">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Customer Price
              </span>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight font-mono">
                {formatMoney(finalCustomerPrice)}
              </div>
              <span className="text-[11px] text-slate-400">
                {sheetsRequired} DTF Sheet{sheetsRequired !== 1 ? "s" : ""} Required • {activePackingResult.totalAllocatedPieces} Prints
              </span>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 min-w-0">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Sheet Size
                </span>
                <span className="text-white font-bold font-mono text-xs mt-0.5 block break-words">
                  {formatDimensionPair(displaySheetW, displaySheetH, measurementUnit)}
                </span>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Sheet Utilization
                </span>
                <span className="text-emerald-400 font-bold font-mono text-xs mt-0.5 block">
                  {Math.round(activePackingResult.overallUtilizationPercent)}% Efficiency
                </span>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Total Square Footage
                </span>
                <span className="text-slate-200 font-bold font-mono text-xs mt-0.5 block">
                  {totalSquareFootage.toFixed(2)} sq. ft.
                </span>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Internal Production Cost
                </span>
                <span className="text-slate-300 font-bold font-mono text-xs mt-0.5 block">
                  {formatMoney(totalProductionCost)}
                </span>
              </div>
            </div>

            {/* Financial Margin Callout (Internal Operational Visibility) */}
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Estimated Gross Profit:</span>
              <div className="flex items-center space-x-2">
                <strong className="text-emerald-400 font-mono">{formatMoney(grossProfit)}</strong>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  {profitMarginPercent.toFixed(1)}% margin
                </span>
              </div>
            </div>
          </div>

          {/* 2. LIVE VISUAL SHEET DIAGRAM */}
          {sheetsRequired > 0 && (
            <DTFDiscreteSheetDiagram
              packingResult={activePackingResult}
              measurementUnit={measurementUnit}
              sheetWidthNormalized={sheetWidthInches}
              sheetHeightNormalized={sheetHeightInches}
            />
          )}

          {/* 3. QUOTATION TEMPLATES & EXPORT TABS */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold text-slate-900">Quotation &amp; Production Export</h4>
              </div>

              {/* Template Tab Selector */}
              <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTemplateTab("customer")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    activeTemplateTab === "customer"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Customer Template
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTemplateTab("production")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    activeTemplateTab === "production"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Production Template
                </button>
              </div>
            </div>

            {/* Customer Template View */}
            {activeTemplateTab === "customer" && (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500">
                  Clean customer-facing quotation with zero internal costs or markups exposed.
                </p>

                <TemplateBlockViewer
                  text={customerTemplateText}
                  theme="light"
                />

                <button
                  type="button"
                  onClick={handleCopyCustomerTemplate}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  {copiedCustomerQuote ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Copied Customer Quote to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white" />
                      <span>Copy Customer Quote (WhatsApp / Email)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Production Template View */}
            {activeTemplateTab === "production" && (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500">
                  Internal operational specifications including physical sheet allocations and material costing.
                </p>

                <TemplateBlockViewer
                  text={productionTemplateText}
                  theme="dark"
                  className="max-h-64 overflow-y-auto"
                />

                <button
                  type="button"
                  onClick={handleCopyProductionTemplate}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  {copiedProductionOrder ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Copied Production Order!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white" />
                      <span>Copy Production Order (Workshop)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Save to Quotations Registry Button */}
            <button
              type="button"
              onClick={handleSaveToQuotationsLog}
              className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Saved to Quotations Registry!</span>
                </>
              ) : (
                <>
                  <BookmarkCheck className="w-4 h-4 text-slate-500" />
                  <span>Save to Saved Quotations Log</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
