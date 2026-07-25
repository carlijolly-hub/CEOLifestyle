import React, { useState, useEffect } from "react";
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
  Sparkles
} from "lucide-react";
import { SystemSettings, LuxeBookInventoryItem, SavedQuotation } from "../types";
import { INITIAL_QUOTATIONS } from "../data/mockData";
import BookCostCalculator from "./BookCostCalculator";
import LocationCostCalculator from "./LocationCostCalculator";
import TShirtStudioQuoteCalculator from "./TShirtStudioQuoteCalculator";
import ProductionLayoutCalculator from "./ProductionLayoutCalculator";
import DTFPrintingCalculator from "./DTFPrintingCalculator";

interface ProductionToolsProps {
  settings?: SystemSettings;
  inventory?: LuxeBookInventoryItem[];
}

type ToolType = "layout" | "apparel" | "book" | "location" | "dtf";

export default function ProductionTools({ settings, inventory }: ProductionToolsProps) {
  const [activeTool, setActiveTool] = useState<ToolType>(() => {
    return (localStorage.getItem("active_prod_tool") as ToolType) || "layout";
  });

  const [showSavedQuotes, setShowSavedQuotes] = useState<boolean>(false);
  const [quoteSearchQuery, setQuoteSearchQuery] = useState<string>("");
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null);

  // Load or initialize saved quotations
  const [quotations, setQuotations] = useState<SavedQuotation[]>(() => {
    const stored = localStorage.getItem("ceo_saved_quotations");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // Fallback
      }
    }
    return INITIAL_QUOTATIONS;
  });

  useEffect(() => {
    localStorage.setItem("ceo_saved_quotations", JSON.stringify(quotations));
  }, [quotations]);

  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
    localStorage.setItem("active_prod_tool", tool);
  };

  const filteredQuotes = quotations.filter(q => {
    const query = quoteSearchQuery.toLowerCase();
    return (
      q.clientName.toLowerCase().includes(query) ||
      q.title.toLowerCase().includes(query) ||
      q.details.toLowerCase().includes(query) ||
      q.toolType.toLowerCase().includes(query)
    );
  });

  const copyQuoteToClipboard = (quote: SavedQuotation) => {
    const text = `========================================\nOFFICIAL PRODUCTION QUOTATION\nClient: ${quote.clientName}\nJob: ${quote.title}\nDate: ${quote.date}\nTool: ${quote.toolType.toUpperCase()}\n----------------------------------------\nTotal Cost: $${quote.totalCost.toLocaleString()} JMD\nQuoted Price: $${quote.quotedPrice.toLocaleString()} JMD\nDetails: ${quote.details}\n========================================`;
    navigator.clipboard.writeText(text);
    setCopiedQuoteId(quote.id);
    setTimeout(() => setCopiedQuoteId(null), 2000);
  };

  return (
    <div className="space-y-4 text-left animate-fade-in" id="production-tools-module">
      
      {/* Sub-tab Navigation Pills */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl p-2 shadow-xs flex flex-wrap items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {/* 1. Production Layout */}
          <button
            onClick={() => handleToolChange("layout")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTool === "layout"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Production Layout</span>
          </button>

          {/* 2. T-Shirt Studio */}
          <button
            onClick={() => handleToolChange("apparel")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTool === "apparel"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Shirt className="w-3.5 h-3.5 text-rose-400" />
            <span>T-Shirt Studio</span>
          </button>

          {/* 3. Book Cost Calculator */}
          <button
            onClick={() => handleToolChange("book")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTool === "book"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span>Book Cost Calculator</span>
          </button>

          {/* 4. Location Logistics */}
          <button
            onClick={() => handleToolChange("location")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTool === "location"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span>Location Logistics</span>
          </button>

          {/* 5. DTF Printing Calculator */}
          <button
            onClick={() => handleToolChange("dtf")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTool === "dtf"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-indigo-400" />
            <span>DTF Printing Calculator</span>
          </button>
        </div>

        {/* Saved Quotations Log Toggle Button */}
        <button
          onClick={() => setShowSavedQuotes(!showSavedQuotes)}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap border ${
            showSavedQuotes
              ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs"
              : "bg-slate-900 text-amber-400 border-slate-800 hover:bg-slate-800"
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>Saved Quotations ({quotations.length})</span>
        </button>
      </div>

      {/* Saved Quotations View Drawer / Panel */}
      {showSavedQuotes && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-amber-300">Saved Production Quotations Log</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized registry of saved customer quotes across all 5 calculators.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search quotes or clients..."
                value={quoteSearchQuery}
                onChange={(e) => setQuoteSearchQuery(e.target.value)}
                className="w-full bg-slate-800/90 text-xs text-white placeholder-slate-400 pl-8 pr-3 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
            {filteredQuotes.map((q) => (
              <div key={q.id} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 hover:border-amber-500/50 transition-all flex flex-col justify-between gap-2 text-left">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {q.toolType}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {q.date}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{q.title}</h4>
                  <p className="text-[11px] text-amber-200/90 flex items-center gap-1 mt-1 font-medium">
                    <User className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">{q.clientName}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {q.details}
                  </p>
                </div>

                <div className="border-t border-slate-700/50 pt-2.5 mt-1 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Quoted Price</span>
                    <span className="text-xs font-extrabold text-emerald-400">$${q.quotedPrice.toLocaleString()} JMD</span>
                  </div>
                  <button
                    onClick={() => copyQuoteToClipboard(q)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
                  >
                    {copiedQuoteId === q.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copy Quote</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Calculator Component View */}
      <div className="transition-all duration-300">
        {activeTool === "layout" && (
          <ProductionLayoutCalculator settings={settings} />
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
          <DTFPrintingCalculator settings={settings} />
        )}
      </div>

    </div>
  );
}

