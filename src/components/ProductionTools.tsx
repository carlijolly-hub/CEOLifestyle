import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { 
  Calculator, 
  Layers, 
  Shirt, 
  MapPin,
  Printer,
  FileText,
  Copy,
  Check,
  Search,
  DollarSign,
  User,
  Calendar,
  Sparkles,
  AlertTriangle,
  Bug,
  X,
  Eye,
  Trash2,
  RefreshCw,
  Filter,
  ShieldAlert,
  Star,
  CircleDot,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { SystemSettings, LuxeBookInventoryItem, SavedQuotation } from "../types";
import { INITIAL_QUOTATIONS } from "../data/mockData";
import { normalizeQuotation, validateQuotation } from "../utils/quotationUtils";
import { loadEnvironmentQuotations, saveEnvironmentQuotations } from "../utils/environmentUtils";
import BookCostCalculator from "./BookCostCalculator";
import LocationCostCalculator from "./LocationCostCalculator";
import TShirtStudioQuoteCalculator from "./TShirtStudioQuoteCalculator";
import ProductionLayoutCalculator from "./ProductionLayoutCalculator";
import CircularProductionLayoutCalculator from "./CircularProductionLayoutCalculator";
import DTFPrintingCalculator from "./DTFPrintingCalculator";
import InHouseDTFCalculator from "./InHouseDTFCalculator";

interface ProductionToolsProps {
  settings?: SystemSettings;
  inventory?: LuxeBookInventoryItem[];
  onUpdateSettings?: (settings: SystemSettings) => void;
}

type ToolType = "layout" | "circular_layout" | "apparel" | "book" | "location" | "dtf" | "inhouse_dtf";

const PRODUCTION_TOOL_ITEMS: {
  id: ToolType;
  label: string;
  fullName: string;
  icon: React.ElementType;
  iconColor: string;
  badge?: string;
}[] = [
  { id: "layout", label: "Production Layout", fullName: "Production Layout Calculator", icon: Layers, iconColor: "text-indigo-400" },
  { id: "circular_layout", label: "Circular Layout", fullName: "Circular Production Layout Calculator", icon: CircleDot, iconColor: "text-emerald-400" },
  { id: "inhouse_dtf", label: "In-House DTF", fullName: "In-House DTF Printing Calculator", icon: Sparkles, iconColor: "text-emerald-400", badge: "NEW" },
  { id: "dtf", label: "Sourced DTF", fullName: "Supplier Comparison Analysis", icon: Printer, iconColor: "text-indigo-400" },
  { id: "apparel", label: "T-Shirt Studio", fullName: "T-Shirt Studio Quote Calculator", icon: Shirt, iconColor: "text-rose-400" },
  { id: "book", label: "Book Cost Calculator", fullName: "Book Cost Calculator", icon: Calculator, iconColor: "text-amber-400" },
  { id: "location", label: "Location Logistics", fullName: "Location Logistics Calculator", icon: MapPin, iconColor: "text-sky-400" },
];

export default function ProductionTools({ settings, inventory, onUpdateSettings }: ProductionToolsProps) {
  const [activeTool, setActiveTool] = useState<ToolType>(() => {
    return (localStorage.getItem("active_prod_tool") as ToolType) || "layout";
  });

  // Carousel ref and scroll states
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

  const checkCarouselScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  };

  useEffect(() => {
    checkCarouselScroll();
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkCarouselScroll, { passive: true });
    window.addEventListener("resize", checkCarouselScroll);
    return () => {
      el.removeEventListener("scroll", checkCarouselScroll);
      window.removeEventListener("resize", checkCarouselScroll);
    };
  }, []);

  // When activeTool changes, smoothly bring it into view if needed
  useEffect(() => {
    if (!carouselRef.current) return;
    const activeBtn = carouselRef.current.querySelector<HTMLElement>(`[data-tool-id="${activeTool}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
    const timer = setTimeout(checkCarouselScroll, 300);
    return () => clearTimeout(timer);
  }, [activeTool]);

  const handleScrollCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const scrollAmount = 240;
    carouselRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
    setTimeout(checkCarouselScroll, 250);
  };

  const [showSavedQuotes, setShowSavedQuotes] = useState<boolean>(false);
  const [quoteSearchQuery, setQuoteSearchQuery] = useState<string>("");
  const [quoteCategoryFilter, setQuoteCategoryFilter] = useState<string>("all");
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null);
  const [selectedQuoteForModal, setSelectedQuoteForModal] = useState<SavedQuotation | null>(null);
  const [showDebugDrawer, setShowDebugDrawer] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<{ message: string; stack?: string; time: string; recordCount: number } | null>(null);
  const [maxFavoritesModalOpen, setMaxFavoritesModalOpen] = useState<boolean>(false);

  const isAnyModalOpen = !!(selectedQuoteForModal || maxFavoritesModalOpen);
  useBodyScrollLock(isAnyModalOpen);

  // Raw quotations loaded from environment-aware storage
  const [rawQuotations, setRawQuotations] = useState<SavedQuotation[]>(() => {
    return loadEnvironmentQuotations();
  });

  // Keep state synchronized with storage events
  const syncWithLocalStorage = () => {
    setRawQuotations(loadEnvironmentQuotations());
  };

  useEffect(() => {
    const handleSync = () => syncWithLocalStorage();
    window.addEventListener("ceo_saved_quotations_changed", handleSync);
    window.addEventListener("ceo_environment_changed", handleSync);
    return () => {
      window.removeEventListener("ceo_saved_quotations_changed", handleSync);
      window.removeEventListener("ceo_environment_changed", handleSync);
    };
  }, []);

  const handleToggleFavorite = (id: string) => {
    const currentList = loadEnvironmentQuotations();
    const target = currentList.find(q => q.id === id);
    if (!target) return;

    if (!target.isFavorite) {
      const favCount = currentList.filter(q => q.isFavorite).length;
      if (favCount >= 5) {
        setMaxFavoritesModalOpen(true);
        return;
      }
    }

    const updated = currentList.map(q => {
      if (q.id === id) {
        const isFav = !q.isFavorite;
        return {
          ...q,
          isFavorite: isFav,
          favoritedAt: isFav ? new Date().toISOString() : undefined
        };
      }
      return q;
    });

    setRawQuotations(updated);
    saveEnvironmentQuotations(updated);
  };

  // Handle active tool switching
  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    localStorage.setItem("active_prod_tool", tool);
  };

  // Safe Quotation Filtering & Normalization Protection
  const { safeQuotations, invalidQuotationsCount } = useMemo(() => {
    let invalidCount = 0;
    const safe: SavedQuotation[] = [];

    rawQuotations.forEach((item) => {
      try {
        const normalized = normalizeQuotation(item);
        const validation = validateQuotation(normalized);
        if (validation.valid) {
          safe.push(normalized);
        } else {
          // Attempt repair
          safe.push(normalized);
          invalidCount++;
        }
      } catch (err) {
        invalidCount++;
      }
    });

    return { safeQuotations: safe, invalidQuotationsCount: invalidCount };
  }, [rawQuotations]);

  // Filtered Quotations based on search and tool category
  const filteredQuotes = useMemo(() => {
    try {
      const query = (quoteSearchQuery || "").toLowerCase().trim();
      return safeQuotations.filter((q) => {
        // Category filter
        if (quoteCategoryFilter !== "all" && q.toolType !== quoteCategoryFilter) {
          return false;
        }

        // Search query filter
        if (!query) return true;

        const safeTitle = (q.title || "").toLowerCase();
        const safeClient = (q.clientName || "").toLowerCase();
        const safeDetails = (q.details || "").toLowerCase();
        const safeQuoteNum = (q.quoteNumber || "").toLowerCase();
        const safeTool = (q.toolType || "").toLowerCase();

        return (
          safeTitle.includes(query) ||
          safeClient.includes(query) ||
          safeDetails.includes(query) ||
          safeQuoteNum.includes(query) ||
          safeTool.includes(query)
        );
      });
    } catch (err) {
      console.error("Error filtering saved quotations:", err);
      return [];
    }
  }, [safeQuotations, quoteSearchQuery, quoteCategoryFilter]);

  // Statistics
  const totalQuotedValue = useMemo(() => {
    return safeQuotations.reduce((acc, curr) => acc + (curr.quotedPrice || curr.totalJMD || 0), 0);
  }, [safeQuotations]);

  // Copy Quote Helper
  const copyQuoteToClipboard = (quote: SavedQuotation) => {
    try {
      const text = quote.formattedResponseText || 
        `========================================\nOFFICIAL PRODUCTION QUOTATION\nClient: ${quote.clientName}\nJob: ${quote.title}\nDate: ${quote.date}\nTool: ${quote.toolType.toUpperCase()}\n----------------------------------------\nTotal Cost: $${(quote.totalCost || 0).toLocaleString()} JMD\nQuoted Price: $${(quote.quotedPrice || 0).toLocaleString()} JMD\nDetails: ${quote.details}\n========================================`;
      navigator.clipboard.writeText(text);
      setCopiedQuoteId(quote.id);
      setTimeout(() => setCopiedQuoteId(null), 2000);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  // Delete Quote Handler
  const handleDeleteQuote = (id: string, title?: string) => {
    if (window.confirm(`Are you sure you want to delete quotation "${title || "this quotation"}"?`)) {
      const updated = rawQuotations.filter((q) => q.id !== id);
      setRawQuotations(updated);
      saveEnvironmentQuotations(updated);
      if (selectedQuoteForModal?.id === id) {
        setSelectedQuoteForModal(null);
      }
    }
  };

  // Render Quote Item Safely
  const renderQuoteCard = (q: SavedQuotation) => {
    try {
      const isSelected = selectedQuoteForModal?.id === q.id;
      const isCopied = copiedQuoteId === q.id;
      const isFav = Boolean(q.isFavorite);

      return (
        <div 
          key={q.id} 
          className={`border rounded-2xl p-4 transition-all flex flex-col justify-between gap-3 text-left shadow-sm group ${
            isFav 
              ? "bg-slate-800/95 border-amber-500/60 shadow-amber-500/10" 
              : "bg-slate-800/80 border-slate-700/80 hover:border-amber-400/60"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {q.toolType || "quote"}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(q.id);
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                    isFav
                      ? "bg-amber-500/30 border-amber-400/80 text-amber-300 hover:bg-amber-500/40"
                      : "bg-slate-700/60 border-slate-600/60 text-slate-400 hover:text-amber-300 hover:bg-slate-700"
                  }`}
                  title={isFav ? "⭐ Favorited Quote (Click to remove)" : "☆ Star Favorite Quote"}
                >
                  <Star className={`w-3 h-3 ${isFav ? "text-amber-400 fill-amber-400" : "text-slate-400"}`} />
                  <span className="font-mono">{isFav ? "Favorited" : "Star"}</span>
                </button>
              </div>

              <span className="text-[10px] text-slate-400 font-mono font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                {q.date || "N/A"}
              </span>
            </div>

            <div>
              <h4 className="text-xs font-extrabold text-slate-100 line-clamp-1 group-hover:text-amber-300 transition-colors">
                {q.title || "Untitled Quotation"}
              </h4>
              <p className="text-[11px] text-amber-200/90 font-semibold flex items-center gap-1 mt-0.5">
                <User className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{q.clientName || "General Client"}</span>
              </p>
            </div>

            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed bg-slate-900/50 p-2 rounded-xl border border-slate-800/80">
              {q.details || "No details specified."}
            </p>
          </div>

          <div className="border-t border-slate-700/60 pt-3 flex items-center justify-between gap-2">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Quoted Total</span>
              <span className="text-xs font-mono font-extrabold text-emerald-400">
                ${(q.quotedPrice || q.totalJMD || 0).toLocaleString()} JMD
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedQuoteForModal(q)}
                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
                title="View Full Details"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-300" />
              </button>

              <button
                type="button"
                onClick={() => copyQuoteToClipboard(q)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDeleteQuote(q.id, q.title)}
                className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                title="Delete Record"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      );
    } catch (err) {
      return (
        <div key={q.id || Math.random()} className="bg-rose-950/30 border border-rose-800/50 rounded-2xl p-3 text-left">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Record Requires Attention (ID: #{q.id ? q.id.slice(-6) : 'Unknown'})</span>
          </div>
          <p className="text-[10px] text-rose-200/70 mt-1">
            This record contained corrupted data structure and was isolated safely.
          </p>
          <button
            onClick={() => handleDeleteQuote(q.id, "Corrupted Record")}
            className="mt-2 text-[10px] text-rose-300 font-bold underline hover:text-white"
          >
            Remove Record
          </button>
        </div>
      );
    }
  };

  return (
    <div className="space-y-4 text-left animate-fade-in" id="production-tools-module">
      
      {/* Sub-tab Navigation Carousel & Saved Quotations Toggle */}
      <div className="glass-workspace p-2 sm:p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        
        {/* Carousel-Style Tool Navigation */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {/* Left Navigation Arrow */}
          <button
            type="button"
            onClick={() => handleScrollCarousel("left")}
            disabled={!canScrollLeft}
            aria-label="Previous production tool"
            className="p-2 text-slate-600 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 disabled:opacity-25 disabled:pointer-events-none rounded-xl transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Carousel Track without visible scrollbar */}
          <div
            ref={carouselRef}
            className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth py-0.5 px-0.5 flex-1 min-w-0"
          >
            {PRODUCTION_TOOL_ITEMS.map((tool) => {
              const isActive = activeTool === tool.id;
              const ToolIcon = tool.icon;
              return (
                <button
                  key={tool.id}
                  id={`prod-tool-tab-${tool.id}`}
                  data-tool-id={tool.id}
                  onClick={() => handleToolChange(tool.id)}
                  title={tool.fullName}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? "bg-slate-900 text-white font-extrabold shadow-sm ring-2 ring-slate-900/10 scale-[1.01]"
                      : "bg-white/90 hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-bold border border-slate-200/80 shadow-2xs"
                  }`}
                >
                  <ToolIcon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : tool.iconColor}`} />
                  <span>{tool.label}</span>
                  {tool.badge && (
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-emerald-400 text-slate-950" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {tool.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Navigation Arrow */}
          <button
            type="button"
            onClick={() => handleScrollCarousel("right")}
            disabled={!canScrollRight}
            aria-label="Next production tool"
            className="p-2 text-slate-600 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 disabled:opacity-25 disabled:pointer-events-none rounded-xl transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center"
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Saved Quotations Log Toggle Button */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200/80 pt-2 sm:pt-0 sm:pl-3">
          <button
            type="button"
            onClick={syncWithLocalStorage}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Sync Latest Saved Quotations"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              syncWithLocalStorage();
              setShowSavedQuotes(!showSavedQuotes);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap border shadow-2xs ${
              showSavedQuotes
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                : "bg-slate-900 text-amber-400 border-slate-800 hover:bg-slate-800 shadow-xs"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Saved Quotations ({safeQuotations.length})</span>
          </button>
        </div>
      </div>

      {/* Saved Quotations View Drawer / Panel */}
      {showSavedQuotes && (
        <div className="bg-slate-900 text-white rounded-3xl p-5 md:p-6 border border-slate-800 shadow-2xl space-y-5 animate-fade-in relative overflow-hidden">
          
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-amber-300 tracking-tight">
                    Centralized Saved Quotations Registry
                  </h3>
                  <p className="text-xs text-slate-400">
                    Showing <span className="text-white font-bold">{filteredQuotes.length}</span> of <span className="text-white font-bold">{safeQuotations.length}</span> total saved customer quotations.
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics Overview */}
            <div className="flex items-center gap-3 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/80 text-xs">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Records</span>
                <span className="text-sm font-mono font-black text-amber-300">{safeQuotations.length} Quotes</span>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Quoted Value</span>
                <span className="text-sm font-mono font-black text-emerald-400">${totalQuotedValue.toLocaleString()} JMD</span>
              </div>
            </div>
          </div>

          {/* Admin Warning Banner if corrupted items isolated */}
          {invalidQuotationsCount > 0 && (
            <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Administrator Warning:</strong> Displaying {safeQuotations.length} valid quotations. {invalidQuotationsCount} record required normalization repair.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDebugDrawer(!showDebugDrawer)}
                className="text-[10px] font-bold underline hover:text-white cursor-pointer"
              >
                {showDebugDrawer ? "Hide Debug Info" : "View Debug Details"}
              </button>
            </div>
          )}

          {/* Controlled Error Screen Handler if an unhandled error happens */}
          {renderError ? (
            <div className="bg-rose-950/80 border border-rose-800 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-900/50 rounded-2xl flex items-center justify-center mx-auto text-rose-400 border border-rose-700/50">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-base font-extrabold text-white">Unable to load saved quotations.</h4>
                <p className="text-xs text-rose-200/90 leading-relaxed">
                  An unexpected issue occurred while loading quotation records. Please try again or contact the Master Administrator if the issue continues.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRenderError(null);
                    syncWithLocalStorage();
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Retry Loading
                </button>
                <button
                  type="button"
                  onClick={() => setShowDebugDrawer(!showDebugDrawer)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer border border-slate-700"
                >
                  {showDebugDrawer ? "Hide Debug Log" : "Developer Debug Info"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/50 p-3 rounded-2xl border border-slate-800">
                
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Filter:</span>
                  {[
                    { id: "all", label: `All (${safeQuotations.length})` },
                    { id: "layout", label: "Layout" },
                    { id: "circular_layout", label: "Circular" },
                    { id: "apparel", label: "Apparel" },
                    { id: "book", label: "Book" },
                    { id: "location", label: "Location" },
                    { id: "dtf", label: "Sourced DTF" },
                    { id: "inhouse_dtf", label: "In-House DTF" },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setQuoteCategoryFilter(cat.id)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                        quoteCategoryFilter === cat.id
                          ? "bg-amber-400 text-slate-950 shadow-xs font-black"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search titles, clients, IDs..."
                    value={quoteSearchQuery}
                    onChange={(e) => setQuoteSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/90 text-xs text-white placeholder-slate-400 pl-9 pr-8 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:border-amber-400"
                  />
                  {quoteSearchQuery && (
                    <button
                      onClick={() => setQuoteSearchQuery("")}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quotations Grid Container */}
              {filteredQuotes.length === 0 ? (
                <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-300">No Quotations Found</h4>
                  <p className="text-xs text-slate-500">
                    {quoteSearchQuery ? `No saved quotes match "${quoteSearchQuery}".` : "No saved quotes in this category yet."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
                  {filteredQuotes.map((q) => renderQuoteCard(q))}
                </div>
              )}
            </>
          )}

          {/* Developer Debug Information Drawer (Controlled Report) */}
          {showDebugDrawer && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-xs text-slate-300 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Bug className="w-4 h-4" />
                  <span>Developer Debug Information &amp; System Telemetry</span>
                </div>
                <button
                  onClick={() => setShowDebugDrawer(false)}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Action Event:</span>
                  <span className="text-amber-300 font-bold">Opening Saved Quotations Log</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">System Date/Time:</span>
                  <span className="text-slate-200">{new Date().toLocaleString()}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Records Loading:</span>
                  <span className="text-emerald-400 font-bold">{rawQuotations.length} records</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Data Source Key:</span>
                  <span className="text-indigo-300 font-bold">localStorage["ceo_saved_quotations"]</span>
                </div>
              </div>

              {renderError && (
                <div className="bg-rose-950/50 p-3 rounded-xl border border-rose-800/80 text-[11px] space-y-1">
                  <span className="text-rose-400 font-bold block">Captured Stack Trace:</span>
                  <p className="text-rose-200 whitespace-pre-wrap">{renderError.message}</p>
                  {renderError.stack && (
                    <p className="text-rose-400/70 text-[9px] overflow-x-auto">{renderError.stack}</p>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Full Quotation View Modal */}
      {selectedQuoteForModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-2xl w-full shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-150 text-left relative my-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {selectedQuoteForModal.toolType} • #{selectedQuoteForModal.quoteNumber || selectedQuoteForModal.id.slice(-6)}
                  </span>
                  <h3 className="text-base font-extrabold text-white tracking-tight mt-1">
                    {selectedQuoteForModal.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedQuoteForModal(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Client Name</span>
                <span className="font-extrabold text-amber-300">{selectedQuoteForModal.clientName}</span>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Date Saved</span>
                <span className="font-mono text-slate-200">{selectedQuoteForModal.date}</span>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 col-span-2 sm:col-span-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Quoted Price</span>
                <span className="font-mono font-extrabold text-emerald-400 text-sm">
                  ${(selectedQuoteForModal.quotedPrice || selectedQuoteForModal.totalJMD || 0).toLocaleString()} JMD
                </span>
              </div>
            </div>

            {/* Formatted Customer Response Text */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Customer Response Message</span>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed shadow-inner select-all">
                {selectedQuoteForModal.formattedResponseText || selectedQuoteForModal.details}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleDeleteQuote(selectedQuoteForModal.id, selectedQuoteForModal.title)}
                className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 font-bold text-xs rounded-xl border border-rose-800/50 transition-colors cursor-pointer"
              >
                Delete Quote
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyQuoteToClipboard(selectedQuoteForModal)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-950" />
                  <span>Copy Full Message</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedQuoteForModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Max Favorites Reached Alert Modal */}
      {maxFavoritesModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 max-w-sm w-full space-y-4 text-left shadow-2xl relative my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <Star className="w-6 h-6 fill-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Favorite Limit Reached</h3>
                <span className="text-[10px] font-mono text-amber-300">Maximum 5 Favorites Allowed</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed font-medium">
              <p className="font-extrabold text-amber-300">Maximum favorite quotes reached.</p>
              <p className="text-slate-400">Remove an existing favorite before adding another.</p>
            </div>

            <button
              type="button"
              onClick={() => setMaxFavoritesModalOpen(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
            >
              Understood
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Active Calculator Component View */}
      <div className="transition-all duration-300">
        {activeTool === "layout" && (
          <ProductionLayoutCalculator settings={settings} />
        )}

        {activeTool === "circular_layout" && (
          <CircularProductionLayoutCalculator settings={settings} />
        )}

        {activeTool === "apparel" && (
          <TShirtStudioQuoteCalculator settings={settings} />
        )}

        {activeTool === "book" && (
          <BookCostCalculator settings={settings} inventory={inventory} />
        )}

        {activeTool === "location" && (
          <LocationCostCalculator settings={settings} />
        )}

        {activeTool === "dtf" && (
          <DTFPrintingCalculator settings={settings} onUpdateSettings={onUpdateSettings} />
        )}

        {activeTool === "inhouse_dtf" && (
          <InHouseDTFCalculator settings={settings} />
        )}
      </div>

    </div>
  );
}
