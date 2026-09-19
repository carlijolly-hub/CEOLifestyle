import React, { useState, useMemo } from "react";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Package, 
  RotateCcw, 
  Info,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  PlusCircle,
  Layers,
  ShoppingBag
} from "lucide-react";
import { 
  PeakPlannerRecord, 
  PeakProductMixItem, 
  SystemSettings 
} from "../types";
import { 
  calculatePeakProjectedRequirements, 
  DEFAULT_PEAK_PLANNER_RECORDS
} from "../utils/settingsHelper";

interface PeakPlannerManagerProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onCloseModal?: () => void;
  selectedPeakId?: string;
}

const DEFAULT_EMOJIS = ["❤️", "🌹", "👔", "🎓", "🎄", "🎁", "🎉", "💐", "🌟", "🎂"];
const INITIAL_PLANNING_YEARS = [2027, 2028, 2029, 2030, 2031, 2032];

export default function PeakPlannerManager({
  settings,
  onUpdateSettings,
  onCloseModal,
  selectedPeakId
}: PeakPlannerManagerProps) {
  // Peak Planner Records
  const peaks = useMemo(() => {
    return settings.peakPlannerRecords && settings.peakPlannerRecords.length > 0
      ? settings.peakPlannerRecords
      : DEFAULT_PEAK_PLANNER_RECORDS;
  }, [settings.peakPlannerRecords]);

  const fulfillmentTemplates = useMemo(() => {
    return settings.fulfillmentTemplates || [];
  }, [settings.fulfillmentTemplates]);

  const [activePeakId, setActivePeakId] = useState<string | null>(selectedPeakId || peaks[0]?.id || null);
  const [editingPeak, setEditingPeak] = useState<PeakPlannerRecord | null>(null);
  const [isCreatingPeak, setIsCreatingPeak] = useState(false);

  // Active Planning Year state (defaults to 2027)
  const [planningYear, setPlanningYear] = useState<number>(2027);

  // Horizontal sliding window start year (timeline starts at 2024)
  const [windowStartYear, setWindowStartYear] = useState<number>(2024);

  // Custom Planning Years list state
  const [availableYears, setAvailableYears] = useState<number[]>(INITIAL_PLANNING_YEARS);
  const [isAddYearModalOpen, setIsAddYearModalOpen] = useState(false);
  const [customYearInput, setCustomYearInput] = useState<string>("2029");

  // New product addition state
  const [newProductName, setNewProductName] = useState<string>("");
  const [newProductQty, setNewProductQty] = useState<number>(10);

  const currentPeak = useMemo(() => {
    return peaks.find(p => p.id === activePeakId) || peaks[0] || null;
  }, [peaks, activePeakId]);

  const savePeaksList = (updatedList: PeakPlannerRecord[]) => {
    onUpdateSettings({
      ...settings,
      peakPlannerRecords: updatedList
    });
  };

  // Ensure available planning years dropdown includes all known years
  const allKnownPlanningYears = useMemo(() => {
    const set = new Set<number>(availableYears);
    set.add(2027);
    peaks.forEach(p => {
      if (p.planningYear) set.add(p.planningYear);
      if (p.orderYearPlans) {
        Object.keys(p.orderYearPlans).forEach(y => set.add(Number(y)));
      }
      (p.expectedProductMix || []).forEach(item => {
        if (item.yearPlans) {
          Object.keys(item.yearPlans).forEach(y => set.add(Number(y)));
        }
      });
    });
    return Array.from(set).filter(y => !isNaN(y) && y >= 2025).sort((a, b) => a - b);
  }, [availableYears, peaks]);

  // Three visible year columns in sliding window
  const visibleYears = useMemo(() => {
    return [windowStartYear, windowStartYear + 1, windowStartYear + 2];
  }, [windowStartYear]);

  // Sliding window navigation handlers
  const handleSlideLeft = () => {
    setWindowStartYear(prev => Math.max(2024, prev - 1));
  };

  const handleSlideRight = () => {
    setWindowStartYear(prev => prev + 1);
  };

  // Calculate average from ALL available actual data PRIOR to the active planning year
  const calculatePriorHistoricalAverage = (
    salesMap: Record<number, number> | undefined,
    targetPlanningYear: number
  ) => {
    if (!salesMap) return { average: 0, count: 0 };
    let sum = 0;
    let count = 0;

    // Collect all historical years before targetPlanningYear (starting from 2024 up to targetPlanningYear - 1)
    const candidateYears = Array.from(
      new Set([
        ...Object.keys(salesMap).map(Number),
        ...Array.from({ length: Math.max(0, targetPlanningYear - 2024) }, (_, i) => 2024 + i)
      ])
    ).filter(y => !isNaN(y) && y < targetPlanningYear).sort((a, b) => a - b);

    candidateYears.forEach(y => {
      const val = salesMap[y];
      if (val !== undefined && val !== null && !isNaN(val) && (val as any) !== "") {
        sum += Number(val);
        count++;
      }
    });

    if (count === 0) return { average: 0, count: 0 };
    const rawAvg = sum / count;
    const rounded = Number.isInteger(rawAvg) ? rawAvg : Math.round(rawAvg * 100) / 100;
    return { average: rounded, count };
  };

  // Update Total Orders historical actual for a year
  const handleUpdateTotalOrdersActual = (year: number, val: number) => {
    if (!currentPeak) return;
    const num = Math.max(0, isNaN(val) ? 0 : val);
    const updatedHistOrders = { ...(currentPeak.historicalEventOrders || {}), [year]: num };
    const updatedPeak: PeakPlannerRecord = {
      ...currentPeak,
      historicalEventOrders: updatedHistOrders,
      updatedDate: new Date().toISOString()
    };
    const updatedPeaks = peaks.map(p => p.id === currentPeak.id ? updatedPeak : p);
    savePeaksList(updatedPeaks);
  };

  // Update Total Orders manual plan for active planning year
  const handleUpdateTotalOrdersPlan = (val: number) => {
    if (!currentPeak) return;
    const num = Math.max(0, isNaN(val) ? 0 : val);
    const updatedOrderPlans = { ...(currentPeak.orderYearPlans || {}), [planningYear]: num };
    const updatedPeak: PeakPlannerRecord = {
      ...currentPeak,
      expectedOrders: num, // Sync expectedOrders for active planning year
      orderYearPlans: updatedOrderPlans,
      updatedDate: new Date().toISOString()
    };
    const updatedPeaks = peaks.map(p => p.id === currentPeak.id ? updatedPeak : p);
    savePeaksList(updatedPeaks);
  };

  // Helper to get manual plan for product
  const getProductPlanForYear = (item: PeakProductMixItem, year: number): number => {
    if (item.yearPlans && item.yearPlans[year] !== undefined) {
      return item.yearPlans[year];
    }
    return item.quantity || 0;
  };

  // Update product historical actual for a year
  const handleUpdateProductActual = (mixId: string, year: number, val: number) => {
    if (!currentPeak) return;
    const num = Math.max(0, isNaN(val) ? 0 : val);
    const updatedMix = (currentPeak.expectedProductMix || []).map(item => {
      if (item.id !== mixId) return item;
      const updatedHistSales = { ...(item.historicalEventSales || {}), [year]: num };
      return {
        ...item,
        historicalEventSales: updatedHistSales
      };
    });
    const updatedPeak = { ...currentPeak, expectedProductMix: updatedMix, updatedDate: new Date().toISOString() };
    const updatedPeaks = peaks.map(p => p.id === currentPeak.id ? updatedPeak : p);
    savePeaksList(updatedPeaks);
  };

  // Update product manual plan for active planning year
  const handleUpdateProductPlan = (mixId: string, newPlanVal: number) => {
    if (!currentPeak) return;
    const val = Math.max(0, isNaN(newPlanVal) ? 0 : newPlanVal);
    const updatedMix = (currentPeak.expectedProductMix || []).map(item => {
      if (item.id !== mixId) return item;
      const updatedYearPlans = { ...(item.yearPlans || {}), [planningYear]: val };
      return {
        ...item,
        quantity: val, // Sync quantity for backwards compatibility
        yearPlans: updatedYearPlans
      };
    });

    const updatedPeak = { 
      ...currentPeak, 
      planningYear,
      expectedProductMix: updatedMix, 
      updatedDate: new Date().toISOString() 
    };
    const updatedPeaks = peaks.map(p => p.id === currentPeak.id ? updatedPeak : p);
    savePeaksList(updatedPeaks);
  };

  // Remove a product row
  const handleRemoveProductFromPeak = (mixId: string) => {
    if (!currentPeak) return;
    const updatedMix = (currentPeak.expectedProductMix || []).filter(item => item.id !== mixId);
    const updatedPeak = { ...currentPeak, expectedProductMix: updatedMix, updatedDate: new Date().toISOString() };
    const updatedPeaks = peaks.map(p => p.id === currentPeak.id ? updatedPeak : p);
    savePeaksList(updatedPeaks);
  };

  // Add a new product to active peak
  const handleAddProductToActivePeak = () => {
    if (!currentPeak || !newProductName.trim()) return;
    const initPlan = Math.max(0, newProductQty || 10);
    const newItem: PeakProductMixItem = {
      id: `pm-${Date.now()}`,
      productName: newProductName.trim(),
      quantity: initPlan,
      yearPlans: { [planningYear]: initPlan },
      historicalEventSales: {}
    };
    const updatedPeak = {
      ...currentPeak,
      expectedProductMix: [...(currentPeak.expectedProductMix || []), newItem],
      updatedDate: new Date().toISOString()
    };
    const updatedPeaks = peaks.map(p => p.id === currentPeak.id ? updatedPeak : p);
    savePeaksList(updatedPeaks);
    setNewProductName("");
    setNewProductQty(10);
  };

  // Add custom planning year
  const handleAddCustomYear = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customYearInput.trim());
    if (!parsed || isNaN(parsed) || parsed < 2025 || parsed > 2050) {
      alert("Please enter a valid future planning year between 2025 and 2050.");
      return;
    }
    if (!availableYears.includes(parsed)) {
      setAvailableYears(prev => [...prev, parsed].sort((a, b) => a - b));
    }
    setPlanningYear(parsed);
    setIsAddYearModalOpen(false);
  };

  // Edit peak handlers
  const handleStartEditPeak = (peak: PeakPlannerRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPeak(JSON.parse(JSON.stringify(peak)));
    setIsCreatingPeak(false);
  };

  const handleStartNewPeak = () => {
    const newPeak: PeakPlannerRecord = {
      id: `peak-custom-${Date.now()}`,
      name: "",
      emoji: "🎁",
      peakDate: new Date().toISOString().split("T")[0],
      prepStartDate: new Date().toISOString().split("T")[0],
      planningYear,
      expectedOrders: 25,
      historicalEventOrders: {},
      orderYearPlans: { [planningYear]: 25 },
      expectedProductMix: [
        { 
          id: `mix-${Date.now()}-1`, 
          productName: fulfillmentTemplates[0]?.productName || "Custom Gift Box", 
          quantity: 10, 
          yearPlans: { [planningYear]: 10 },
          historicalEventSales: {} 
        }
      ],
      notes: "",
      active: true,
      isDefaultPreset: false
    };
    setEditingPeak(newPeak);
    setIsCreatingPeak(true);
  };

  const handleSaveEditingPeak = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPeak) return;

    if (!editingPeak.name.trim()) {
      alert("Please enter a Peak Event Name.");
      return;
    }

    const cleanedMix = (editingPeak.expectedProductMix || [])
      .filter(item => item.productName.trim() !== "")
      .map(item => ({
        ...item,
        quantity: Math.max(0, Number(item.quantity) || 0)
      }));

    const finalRecord: PeakPlannerRecord = {
      ...editingPeak,
      name: editingPeak.name.trim(),
      expectedProductMix: cleanedMix,
      updatedDate: new Date().toISOString()
    };

    if (isCreatingPeak) {
      savePeaksList([...peaks, finalRecord]);
      setActivePeakId(finalRecord.id);
    } else {
      const updated = peaks.map(p => p.id === finalRecord.id ? finalRecord : p);
      savePeaksList(updated);
      setActivePeakId(finalRecord.id);
    }

    setEditingPeak(null);
    setIsCreatingPeak(false);
  };

  const handleDeletePeak = (peakId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this Peak Event record?")) {
      const updated = peaks.filter(p => p.id !== peakId);
      savePeaksList(updated);
      if (activePeakId === peakId) {
        setActivePeakId(updated[0]?.id || null);
      }
      setEditingPeak(null);
    }
  };

  const handleResetPeakDefaults = () => {
    if (window.confirm("Reset all peak planner records to default seasonal presets? Custom edits will be reset.")) {
      savePeaksList(DEFAULT_PEAK_PLANNER_RECORDS);
      setActivePeakId(DEFAULT_PEAK_PLANNER_RECORDS[0].id);
      setEditingPeak(null);
    }
  };

  // Projected Component & BOM requirements for active planning year
  const activeRequirements = useMemo(() => {
    if (!currentPeak) return [];
    return calculatePeakProjectedRequirements(currentPeak, fulfillmentTemplates, planningYear);
  }, [currentPeak, fulfillmentTemplates, planningYear]);

  // Lead time calculation
  const leadTimeDays = useMemo(() => {
    if (!currentPeak) return 0;
    const peakD = new Date(currentPeak.peakDate);
    const prepD = new Date(currentPeak.prepStartDate);
    const diffTime = peakD.getTime() - prepD.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, [currentPeak]);

  // Total Orders numbers for current peak
  const totalOrdersHist = currentPeak?.historicalEventOrders || {};
  const totalOrdersAvg = calculatePriorHistoricalAverage(totalOrdersHist, planningYear);
  const totalOrdersPlan = currentPeak?.orderYearPlans?.[planningYear] ?? currentPeak?.expectedOrders ?? 0;

  return (
    <div className="space-y-6 text-xs text-slate-800 text-left font-sans">
      
      {/* Top Banner Header */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <CalendarIcon className="w-32 h-32 text-amber-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Seasonal Planning Tool
              </span>
              <span className="text-slate-400 text-[11px]">• Peak Planner</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Seasonal Event Planner</span>
            </h2>
            <p className="text-slate-300 text-[11px] mt-1 max-w-2xl leading-relaxed">
              Review historical event actuals, automatically calculate visible 3-year rolling averages, and manually establish your target plan for any future year.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartNewPeak}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition-all text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Peak Event</span>
            </button>
            <button
              onClick={handleResetPeakDefaults}
              title="Reset default seasonal presets"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Seasonal Event Selector & Planning Year Control */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Seasonal Event Selection</span>
            <span className="text-[10px] text-slate-400 font-normal">Select an event to view historical figures and set manual target plans</span>
          </div>

          {/* Flexible Planning Year Selector */}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wide">Planning Year:</span>
            <select
              value={planningYear}
              onChange={e => {
                if (e.target.value === "ADD_CUSTOM_YEAR") {
                  setIsAddYearModalOpen(true);
                } else {
                  setPlanningYear(parseInt(e.target.value) || 2027);
                }
              }}
              className="bg-white border border-amber-300 font-extrabold text-slate-900 text-xs rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-amber-500 shadow-2xs"
            >
              {allKnownPlanningYears.map(yr => (
                <option key={yr} value={yr}>
                  {yr} PLAN
                </option>
              ))}
              <option value="ADD_CUSTOM_YEAR">+ Add Planning Year...</option>
            </select>
            <button
              onClick={() => setIsAddYearModalOpen(true)}
              title="Add a custom future planning year"
              className="p-1 hover:bg-amber-200/60 text-amber-900 rounded-lg transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-amber-700" />
            </button>
          </div>
        </div>

        {/* Event Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {peaks.map(p => {
            const isActive = p.id === activePeakId;
            return (
              <button
                key={p.id}
                onClick={() => setActivePeakId(p.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border font-medium text-xs whitespace-nowrap transition-all shadow-xs ${
                  isActive
                    ? "bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-md scale-[1.01]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <span className="text-base">{p.emoji || "🎁"}</span>
                <span>{p.name}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                  isActive ? "bg-slate-950/15 text-slate-950" : "bg-slate-200 text-slate-600"
                }`}>
                  {p.orderYearPlans?.[planningYear] ?? p.expectedOrders ?? 0} orders
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Peak Summary Card & Interactive Table */}
      {currentPeak && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Card Top Header */}
          <div className="bg-slate-900 text-white p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
                {currentPeak.emoji || "❤️"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{currentPeak.name}</h3>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">{currentPeak.notes || "No event notes provided."}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs shrink-0 flex-wrap">
              <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Prep Start</span>
                <span className="font-bold text-amber-300">{currentPeak.prepStartDate}</span>
              </div>
              <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Peak Date</span>
                <span className="font-bold text-rose-300">{currentPeak.peakDate}</span>
              </div>
              <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Lead Time</span>
                <span className="font-bold text-white">{leadTimeDays} Days</span>
              </div>
              <button
                onClick={(e) => handleStartEditPeak(currentPeak, e)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-colors font-medium text-xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit Details</span>
              </button>
            </div>
          </div>

          {/* Table Toolbar & Controls */}
          <div className="p-3 px-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Left: Clean Planning Year Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Target Year:</span>
              <select
                value={planningYear}
                onChange={e => {
                  if (e.target.value === "ADD_CUSTOM_YEAR") {
                    setIsAddYearModalOpen(true);
                  } else {
                    setPlanningYear(parseInt(e.target.value) || 2027);
                  }
                }}
                className="bg-white border border-slate-300 font-extrabold text-slate-900 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
              >
                {allKnownPlanningYears.map(yr => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
                <option value="ADD_CUSTOM_YEAR">+ Custom Year...</option>
              </select>
            </div>

            {/* Right: Inline Product Creator */}
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="text"
                placeholder="Product name..."
                value={newProductName}
                onChange={e => setNewProductName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddProductToActivePeak();
                  }
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 w-36 sm:w-44"
              />
              <input
                type="number"
                placeholder="Qty"
                value={newProductQty === 0 ? "" : (newProductQty || "")}
                onChange={e => setNewProductQty(e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 w-20 text-center"
              />
              <button
                onClick={handleAddProductToActivePeak}
                disabled={!newProductName.trim()}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* MAIN PEAK PLANNER TABLE (Fixed Left, 3-Year Sliding Center, Fixed Right, Sticky Header & Sticky First Column) */}
          <div className="overflow-auto max-h-[600px] relative border border-slate-200/80 rounded-b-2xl bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse min-w-[750px]">
              <thead className="sticky top-0 z-30 bg-slate-100 shadow-2xs">
                {/* Single Clean Table Header Row */}
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  
                  {/* FIXED STICKY LEFT: TRACKING ITEM */}
                  <th className="sticky left-0 z-40 bg-slate-100 py-3.5 px-4 min-w-[220px] border-r border-slate-300 font-extrabold text-slate-900 uppercase tracking-wider text-[11px] shadow-2xs">
                    TRACKING ITEM
                  </th>

                  {/* 3 VISIBLE HISTORICAL YEARS WITH EMBEDDED SLIDING CHEVRONS */}
                  {visibleYears.map((yr, idx) => (
                    <th key={yr} className="py-3 px-3 text-center border-r border-slate-300 min-w-[105px] font-extrabold text-slate-900 bg-slate-100 text-xs">
                      <div className="flex items-center justify-between gap-1">
                        {idx === 0 ? (
                          <button
                            onClick={handleSlideLeft}
                            disabled={windowStartYear <= 2024}
                            title="Slide backward"
                            className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        ) : <div className="w-4" />}

                        <span>{yr}</span>

                        {idx === 2 ? (
                          <button
                            onClick={handleSlideRight}
                            title="Slide forward"
                            className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : <div className="w-4" />}
                      </div>
                    </th>
                  ))}

                  {/* FIXED RIGHT: AVERAGE */}
                  <th className="py-3.5 px-4 text-center bg-slate-200/90 text-slate-900 font-extrabold min-w-[110px] border-r border-slate-300 text-[11px] uppercase tracking-wider">
                    AVERAGE
                  </th>

                  {/* FIXED RIGHT: MANUAL PLAN */}
                  <th className="py-3.5 px-4 text-center bg-amber-100 text-amber-950 font-black min-w-[120px] border-r border-amber-300 text-xs uppercase tracking-wider">
                    PLAN
                  </th>

                  {/* FIXED RIGHT: DELETE / ACTION COLUMN (COMPACT BIN HEADER) */}
                  <th className="py-3.5 px-2 text-center bg-slate-100 w-10 min-w-[40px] text-slate-500 text-sm">
                    🗑
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                
                {/* 1. PERMANENT SYSTEM-LEVEL ROW: TOTAL ORDERS */}
                <tr className="bg-slate-900/5 hover:bg-slate-900/10 transition-colors border-b-2 border-slate-300 font-medium">
                  
                  {/* Tracking Item Label (Sticky Left Column) */}
                  <td className="sticky left-0 z-20 bg-slate-100 font-bold text-slate-900 border-r border-slate-200 py-3.5 px-4 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-extrabold text-slate-950 text-xs block">TOTAL ORDERS</span>
                      </div>
                    </div>
                  </td>

                  {/* 3 Visible Year Cells for TOTAL ORDERS */}
                  {visibleYears.map(yr => {
                    const actualVal = totalOrdersHist[yr];
                    return (
                      <td key={yr} className="py-2.5 px-2 text-center border-r border-slate-200 bg-slate-50/50">
                        <input
                          type="number"
                          min={0}
                          placeholder="—"
                          value={actualVal !== undefined && actualVal !== null && actualVal !== 0 ? actualVal : (actualVal === 0 ? 0 : "")}
                          onChange={e => handleUpdateTotalOrdersActual(yr, e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0)}
                          className="w-16 text-center py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </td>
                    );
                  })}

                  {/* Automatic Average for TOTAL ORDERS */}
                  <td className="py-3 px-3 text-center border-r border-slate-300 bg-slate-100 font-extrabold text-slate-950 text-xs">
                    {totalOrdersAvg.count > 0 ? (
                      <span className="font-mono text-slate-900">
                        {totalOrdersAvg.average}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">—</span>
                    )}
                  </td>

                  {/* Manual Plan for TOTAL ORDERS */}
                  <td className="py-2 px-3 text-center border-r border-amber-200 bg-amber-50">
                    <div className="inline-flex items-center justify-center bg-white border-2 border-amber-400 rounded-lg px-2.5 py-1 shadow-2xs focus-within:ring-2 focus-within:ring-amber-500">
                      <input
                        type="number"
                        min={0}
                        value={totalOrdersPlan === 0 ? "" : (totalOrdersPlan ?? "")}
                        onChange={e => handleUpdateTotalOrdersPlan(e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0)}
                        className="w-16 text-center font-extrabold text-slate-950 text-sm focus:outline-none"
                      />
                    </div>
                  </td>

                  {/* Delete Column: Empty for TOTAL ORDERS (Cannot be deleted) */}
                  <td className="py-3 px-2 text-center bg-slate-50"></td>
                </tr>

                {/* 2. PRODUCT ROWS */}
                {(!currentPeak.expectedProductMix || currentPeak.expectedProductMix.length === 0) ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No product rows added yet. Enter a product name above to add one.
                    </td>
                  </tr>
                ) : (
                  currentPeak.expectedProductMix.map(item => {
                    const hist = item.historicalEventSales || {};
                    const avgRes = calculatePriorHistoricalAverage(hist, planningYear);
                    const currentPlan = getProductPlanForYear(item, planningYear);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-200">
                        
                        {/* Product Name (Sticky Left Column) */}
                        <td className="sticky left-0 z-20 bg-white hover:bg-slate-50 font-semibold text-slate-900 border-r border-slate-200 py-3 px-4 shadow-2xs">
                          <span className="block text-xs font-bold text-slate-900">{item.productName}</span>
                        </td>

                        {/* 3 Visible Year Cells for Product */}
                        {visibleYears.map(yr => {
                          const val = hist[yr];
                          return (
                            <td key={yr} className="py-2 px-2 text-center border-r border-slate-200 bg-white">
                              <div className="inline-flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  placeholder="—"
                                  value={val !== undefined && val !== null && val !== 0 ? val : (val === 0 ? 0 : "")}
                                  onChange={e => handleUpdateProductActual(item.id, yr, e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0)}
                                  className="w-14 text-center py-1 bg-slate-50 hover:bg-white border border-slate-200 focus:border-slate-400 rounded-lg font-mono font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-500 font-medium">PCS</span>
                              </div>
                            </td>
                          );
                        })}

                        {/* Automatic Average for Product */}
                        <td className="py-3 px-3 text-center border-r border-slate-300 bg-slate-100/60 font-bold text-slate-900 text-xs">
                          {avgRes.count > 0 ? (
                            <span className="font-mono">{avgRes.average} PCS</span>
                          ) : (
                            <span className="text-slate-400 font-normal">—</span>
                          )}
                        </td>

                        {/* Manual Plan for Product */}
                        <td className="py-2 px-3 text-center border-r border-amber-200 bg-amber-50/60">
                          <div className="inline-flex items-center justify-center gap-1 bg-white border-2 border-amber-400 rounded-lg px-2 py-1 shadow-2xs focus-within:ring-2 focus-within:ring-amber-500">
                            <input
                              type="number"
                              min={0}
                              value={currentPlan === 0 ? "" : (currentPlan ?? "")}
                              onChange={e => handleUpdateProductPlan(item.id, e.target.value === "" ? 0 : parseInt(e.target.value, 10) || 0)}
                              className="w-16 text-center font-extrabold text-slate-950 text-sm focus:outline-none"
                            />
                            <span className="text-[11px] text-amber-900 font-bold">PCS</span>
                          </div>
                        </td>

                        {/* Compact Bin Delete Control */}
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => handleRemoveProductFromPeak(item.id)}
                            title="Delete product row"
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Explanatory Footer Banner */}
          <div className="bg-slate-50 border-t border-slate-200 p-3 px-5 flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Rules:</strong> Historical actuals before <strong>{planningYear}</strong> contribute to the automatic Average. Your Plan for <strong>{planningYear}</strong> is strictly manual and feeds into fulfillment requirements.
              </span>
            </div>
            <div className="font-mono text-[10px] text-slate-400">
              Total Product Pcs: {(currentPeak.expectedProductMix || []).reduce((sum, item) => sum + getProductPlanForYear(item, planningYear), 0)} Pcs
            </div>
          </div>

          {/* Component & BOM Requirements derived from Active Year Plan */}
          <div className="bg-slate-100/60 border-t border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span>Component &amp; BOM Requirements ({planningYear} Plan)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Connected directly to existing fulfillment templates and inventory rules based on your manual <strong>{planningYear} PLAN</strong>.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Target {planningYear} Pcs</span>
                <span className="text-sm font-bold text-slate-900">
                  {(currentPeak.expectedProductMix || []).reduce((sum, item) => sum + getProductPlanForYear(item, planningYear), 0)} Pcs
                </span>
              </div>
            </div>

            {activeRequirements.length === 0 ? (
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-slate-400">
                No component requirements generated. Assign fulfillment templates to products or add quantities above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeRequirements.map((req, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-900 text-xs">{req.componentName}</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md font-bold text-xs shrink-0">
                          {req.purchaseQty} {req.bulkUnitLabel || req.unitLabel || "units"}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Exact Required: <strong className="text-slate-700">{req.totalRequiredQty} {req.unitLabel || "units"}</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 space-y-1">
                      <div>
                        Rule: <span className="text-slate-600 font-medium">{req.ruleDescription}</span>
                      </div>
                      <div className="truncate">
                        Derived from: {req.derivedFromProducts.map(dp => `${dp.productName} (${dp.qty})`).join(", ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Custom Planning Year */}
      {isAddYearModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleAddCustomYear}>
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm">Add Planning Year</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddYearModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3 text-xs text-slate-800">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Enter any future year you want to prepare for early. Historical figures will remain separate actuals.
                </p>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Target Planning Year</label>
                  <input
                    type="number"
                    min={2025}
                    max={2050}
                    required
                    value={customYearInput}
                    onChange={e => setCustomYearInput(e.target.value)}
                    placeholder="e.g. 2029, 2030"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddYearModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-2xs transition-colors"
                >
                  Set Planning Year
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Peak Event Details */}
      {editingPeak && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleSaveEditingPeak}>
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm">
                    {isCreatingPeak ? "Create New Peak Event" : `Edit Event: ${editingPeak.name}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPeak(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs text-slate-800 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Emoji</label>
                    <select
                      value={editingPeak.emoji || "🎁"}
                      onChange={e => setEditingPeak({ ...editingPeak, emoji: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-base"
                    >
                      {DEFAULT_EMOJIS.map(em => (
                        <option key={em} value={em}>{em}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Peak Event Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Valentine's Day, Mother's Day"
                      value={editingPeak.name}
                      onChange={e => setEditingPeak({ ...editingPeak, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Preparation Start Date</label>
                    <input
                      type="date"
                      required
                      value={editingPeak.prepStartDate}
                      onChange={e => setEditingPeak({ ...editingPeak, prepStartDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Peak Event Date</label>
                    <input
                      type="date"
                      required
                      value={editingPeak.peakDate}
                      onChange={e => setEditingPeak({ ...editingPeak, peakDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Event Notes &amp; Strategy</label>
                  <textarea
                    rows={3}
                    placeholder="Strategy notes for this event..."
                    value={editingPeak.notes || ""}
                    onChange={e => setEditingPeak({ ...editingPeak, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
                {!isCreatingPeak ? (
                  <button
                    type="button"
                    onClick={() => handleDeletePeak(editingPeak.id)}
                    className="text-rose-600 hover:text-rose-700 font-medium text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Peak</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPeak(null)}
                    className="px-3.5 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-2xs transition-colors"
                  >
                    Save Peak Event
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
