import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { 
  Star, 
  Eye, 
  Copy, 
  Check, 
  CopyPlus, 
  ExternalLink, 
  Calendar, 
  User, 
  DollarSign, 
  Tag, 
  X,
  Shirt,
  BookOpen,
  MapPin,
  Printer,
  Layers
} from "lucide-react";
import { SavedQuotation } from "../types";
import { loadEnvironmentQuotations, saveEnvironmentQuotations } from "../utils/environmentUtils";

interface FavoriteQuotesWidgetProps {
  onNavigateToTab?: (tab: string) => void;
}

export default function FavoriteQuotesWidget({ onNavigateToTab }: FavoriteQuotesWidgetProps) {
  const [favoriteQuotes, setFavoriteQuotes] = useState<SavedQuotation[]>([]);
  const [selectedQuoteForModal, setSelectedQuoteForModal] = useState<SavedQuotation | null>(null);
  useBodyScrollLock(!!selectedQuoteForModal);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const refreshQuotes = () => {
    const all = loadEnvironmentQuotations();
    const favs = all.filter(q => q.isFavorite);
    // Sort most recently favorited first
    favs.sort((a, b) => {
      const timeA = a.favoritedAt ? new Date(a.favoritedAt).getTime() : 0;
      const timeB = b.favoritedAt ? new Date(b.favoritedAt).getTime() : 0;
      return timeB - timeA;
    });
    setFavoriteQuotes(favs);
  };

  useEffect(() => {
    refreshQuotes();

    const handleDataChanged = () => refreshQuotes();
    window.addEventListener("ceo_saved_quotations_changed", handleDataChanged);
    window.addEventListener("ceo_environment_changed", handleDataChanged);

    return () => {
      window.removeEventListener("ceo_saved_quotations_changed", handleDataChanged);
      window.removeEventListener("ceo_environment_changed", handleDataChanged);
    };
  }, []);

  const handleUnfavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const all = loadEnvironmentQuotations();
    const updated = all.map(q => q.id === id ? { ...q, isFavorite: false, favoritedAt: undefined } : q);
    saveEnvironmentQuotations(updated);
    refreshQuotes();
    if (selectedQuoteForModal?.id === id) {
      setSelectedQuoteForModal(null);
    }
  };

  const handleCopyQuote = (q: SavedQuotation, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const quoteText = q.formattedResponseText || q.details || `${q.title} - ${q.clientName}: $${(q.quotedPrice || q.totalJMD || 0).toLocaleString()} JMD`;
    try {
      navigator.clipboard.writeText(quoteText);
      setCopiedId(q.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy quote:", err);
    }
  };

  const handleDuplicateQuote = (q: SavedQuotation, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const all = loadEnvironmentQuotations();
    const duplicate: SavedQuotation = {
      ...q,
      id: `quote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `${q.title || "Quotation"} (Copy)`,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0],
      isFavorite: false,
      favoritedAt: undefined
    };
    const updated = [duplicate, ...all];
    saveEnvironmentQuotations(updated);
    refreshQuotes();
    setActionNotice(`Duplicated "${q.title}" to Saved Quotations.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const getToolIcon = (toolType?: string) => {
    switch (toolType) {
      case "apparel": return <Shirt className="w-3 h-3 text-rose-500" />;
      case "book": return <BookOpen className="w-3 h-3 text-emerald-500" />;
      case "location": return <MapPin className="w-3 h-3 text-sky-500" />;
      case "dtf": return <Printer className="w-3 h-3 text-amber-500" />;
      default: return <Layers className="w-3 h-3 text-indigo-500" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4 text-left animate-fade-in" id="dashboard-favorite-quotes-carousel">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3 border-slate-100">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          Favorite Quotes
        </span>
        <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
          <span>⭐ {favoriteQuotes.length} / 5 Saved</span>
        </span>
      </div>

      {actionNotice && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-xl animate-fade-in flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Quote List (Top 3-5) */}
      {favoriteQuotes.length === 0 ? (
        <div className="text-center py-6 px-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-full bg-amber-100/80 border border-amber-200 flex items-center justify-center mx-auto text-amber-500">
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">No Favorite Quotes Saved Yet</p>
            <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Star up to 5 quotations in Saved Quotations to feature them here for rapid executive access.
            </p>
          </div>
          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab("production_tools")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <span>Open Saved Quotations</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
          {favoriteQuotes.slice(0, 5).map((q, idx) => {
            const isCopied = copiedId === q.id;
            const formattedPrice = (q.quotedPrice || q.totalJMD || 0).toLocaleString();

            return (
              <div 
                key={q.id}
                className="p-3 bg-gradient-to-r from-slate-50 via-amber-50/20 to-slate-50 border border-slate-200/80 rounded-2xl shadow-3xs hover:border-amber-400/60 transition-all flex flex-col gap-2 group"
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-[10px] font-mono font-extrabold text-amber-600 bg-amber-100/80 px-1.5 py-0.5 rounded shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="font-extrabold text-xs text-slate-900 truncate group-hover:text-amber-800 transition-colors">
                      {q.title || "Untitled Quotation"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleUnfavorite(q.id, e)}
                    className="p-1 rounded-md text-amber-400 hover:text-slate-400 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
                    title="Remove from Favorites"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                  </button>
                </div>

                {/* Info row */}
                <div className="flex items-center justify-between text-[11px] gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex items-center gap-1 text-slate-600 font-semibold truncate">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{q.clientName || "General Client"}</span>
                    </span>

                    {(q.clientType || q.toolType) && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 shrink-0 flex items-center gap-1">
                        {getToolIcon(q.toolType)}
                        <span>{q.clientType || q.toolType}</span>
                      </span>
                    )}
                  </div>

                  <span className="font-mono font-extrabold text-emerald-700 text-xs shrink-0 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                    ${formattedPrice} JMD
                  </span>
                </div>

                {/* Actions row */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {q.favoritedAt ? new Date(q.favoritedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : q.date || "Saved"}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedQuoteForModal(q)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="View Full Quote Details"
                    >
                      <Eye className="w-3 h-3 text-indigo-600" />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleCopyQuote(q, e)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Copy Quote Summary"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDuplicateQuote(q, e)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Duplicate Quote"
                    >
                      <CopyPlus className="w-3 h-3 text-amber-600" />
                      <span>Duplicate</span>
                    </button>

                    {onNavigateToTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTab("production_tools")}
                        className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Open in Production Tools"
                      >
                        <ExternalLink className="w-3 h-3 text-amber-300" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quote Details View Modal */}
      {selectedQuoteForModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full space-y-4 text-left shadow-2xl relative my-auto animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-extrabold text-white">{selectedQuoteForModal.title}</h3>
                  <p className="text-[10px] text-amber-300 font-mono">
                    Client: {selectedQuoteForModal.clientName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedQuoteForModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Quoted Price</span>
                  <span className="text-base font-mono font-black text-emerald-400">
                    ${(selectedQuoteForModal.quotedPrice || selectedQuoteForModal.totalJMD || 0).toLocaleString()} JMD
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Date</span>
                  <span className="text-xs font-mono font-semibold text-slate-200">
                    {selectedQuoteForModal.date || "N/A"}
                  </span>
                </div>
              </div>

              {selectedQuoteForModal.details && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Details & Description</span>
                  <p className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {selectedQuoteForModal.details}
                  </p>
                </div>
              )}

              {selectedQuoteForModal.formattedResponseText && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Full Quotation Summary</span>
                  <pre className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 text-amber-200/90 font-mono text-[11px] whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {selectedQuoteForModal.formattedResponseText}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleCopyQuote(selectedQuoteForModal)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Text</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedQuoteForModal(null)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
