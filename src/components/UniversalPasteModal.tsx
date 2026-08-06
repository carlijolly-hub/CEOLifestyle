import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  FileSpreadsheet, 
  Clipboard, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  RefreshCw,
  Table,
  Eye,
  Info
} from "lucide-react";
import { 
  parseSpreadsheetClipboardText, 
  processPastedDomainRows, 
  ParsedPasteResult 
} from "../utils/universalPasteUtils";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

interface ModeOption {
  value: string;
  label: string;
  description: string;
}

interface UniversalPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  templateType: "clients" | "aspiring" | "tier_register" | "inventory" | "sales" | "operations" | "milestones";
  sampleHeaders?: string[];
  modeOptions?: ModeOption[];
  onConfirmImport: (mappedItems: any[], rawRows: any[], mode: string) => void;
}

export default function UniversalPasteModal({
  isOpen,
  onClose,
  title,
  subtitle,
  templateType,
  sampleHeaders = [],
  modeOptions,
  onConfirmImport
}: UniversalPasteModalProps) {
  useBodyScrollLock(isOpen);
  const [pastedText, setPastedText] = useState("");
  const [selectedMode, setSelectedMode] = useState(modeOptions?.[0]?.value || "update");
  const [parsedResult, setParsedResult] = useState<ParsedPasteResult | null>(null);
  const [isClipboardSupported, setIsClipboardSupported] = useState(false);
  const [clipboardError, setClipboardError] = useState("");
  const [activeTab, setActiveTab] = useState<"paste" | "preview">("paste");

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.readText) {
      setIsClipboardSupported(true);
    }
  }, []);

  // Parse text whenever pastedText changes
  useEffect(() => {
    if (!pastedText.trim()) {
      setParsedResult(null);
      return;
    }
    const { rawRows } = parseSpreadsheetClipboardText(pastedText);
    const result = processPastedDomainRows(templateType, rawRows);
    setParsedResult(result);
    if (result.totalRows > 0) {
      setActiveTab("preview");
    }
  }, [pastedText, templateType]);

  if (!isOpen) return null;

  const handleClipboardPaste = async () => {
    setClipboardError("");
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setClipboardError("Clipboard is empty or contains non-text content.");
        return;
      }
      setPastedText(text);
    } catch (err: any) {
      console.warn("Clipboard read error:", err);
      setClipboardError("Unable to access system clipboard directly. Please click inside the box below and press Ctrl+V (or ⌘+V).");
    }
  };

  const handleConfirm = () => {
    if (!parsedResult || parsedResult.mappedItems.length === 0) return;
    onConfirmImport(parsedResult.mappedItems, parsedResult.rawRows, selectedMode);
    onClose();
    // Reset state
    setPastedText("");
    setParsedResult(null);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in text-slate-800">
      <div className="bg-white border border-slate-200/80 rounded-3xl w-full max-w-4xl max-h-[90vh] my-auto flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
              <Clipboard className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                  Universal Spreadsheet Ingestion
                </span>
                <span className="text-[9px] font-bold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full">
                  Excel / Google Sheets / Numbers
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">{title}</h2>
              {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-left">

          {/* Guidance Steps Banner */}
          <div className="bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-slate-50 p-4 rounded-2xl border border-emerald-200/60 flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 space-y-1">
              <p className="font-extrabold text-slate-900">How to Paste Directly From Spreadsheets:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-600 font-medium">
                <li>Select and copy rows (including column headers) in <strong>Microsoft Excel</strong>, <strong>Google Sheets</strong>, or <strong>Apple Numbers</strong> (<kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono">Ctrl + C</kbd> / <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono">⌘ + C</kbd>).</li>
                <li>Click <strong>Paste from Clipboard</strong> below, or click inside the text box and press <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono">Ctrl + V</kbd> / <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono">⌘ + V</kbd>.</li>
                <li>Review the parsed data table, verify matched columns, and confirm import!</li>
              </ol>
            </div>
          </div>

          {/* Tab Navigation: Paste Input vs Live Preview */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("paste")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                  activeTab === "paste"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Clipboard className="w-3.5 h-3.5" />
                Paste Area
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                disabled={!parsedResult || parsedResult.totalRows === 0}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                  activeTab === "preview"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Data Preview
                {parsedResult && parsedResult.totalRows > 0 && (
                  <span className="ml-1 bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {parsedResult.totalRows}
                  </span>
                )}
              </button>
            </div>

            {/* Direct Clipboard Button */}
            {isClipboardSupported && (
              <button
                onClick={handleClipboardPaste}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Clipboard className="w-3.5 h-3.5" />
                Paste From Clipboard
              </button>
            )}
          </div>

          {clipboardError && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{clipboardError}</span>
            </div>
          )}

          {/* Paste Input View */}
          {activeTab === "paste" && (
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Click here and press Ctrl+V (⌘+V on Mac) to paste spreadsheet data...\n\nExample:\nCL ID\tClient Full Name\tPhone Number\tCity\nCL001\tSamantha Wright\t+1 (876) 555-0192\tKingston`}
                  rows={8}
                  className="w-full p-4 bg-slate-50 border border-slate-300 focus:border-slate-900 focus:bg-white focus:outline-none rounded-2xl text-xs font-mono text-slate-800 placeholder-slate-400 shadow-inner resize-y transition-all"
                />
                {pastedText && (
                  <button
                    onClick={() => { setPastedText(""); setParsedResult(null); }}
                    className="absolute top-3 right-3 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2.5 py-1 rounded-lg transition-colors"
                  >
                    Clear Text
                  </button>
                )}
              </div>

              {sampleHeaders.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Recommended Column Headings (Automatic Matching Supported):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {sampleHeaders.slice(0, 10).map((sh, idx) => (
                      <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono font-medium">
                        {sh}
                      </span>
                    ))}
                    {sampleHeaders.length > 10 && (
                      <span className="text-[10px] text-slate-400 self-center font-bold">
                        +{sampleHeaders.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview Tab & Table */}
          {parsedResult && parsedResult.totalRows > 0 && (
            <div className="space-y-4">
              
              {/* Parse Summary Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-2xl">
                  <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Total Rows Detected</span>
                  <span className="text-xl font-black text-emerald-950 mt-0.5 block">{parsedResult.totalRows} Rows</span>
                </div>
                <div className="bg-indigo-50/80 border border-indigo-200 p-3 rounded-2xl">
                  <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">Columns Matched</span>
                  <span className="text-xl font-black text-indigo-950 mt-0.5 block">{parsedResult.headers.length} Columns</span>
                </div>
                <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-2xl">
                  <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">Validation Status</span>
                  <span className="text-xl font-black text-amber-950 mt-0.5 block">
                    {parsedResult.warningCount === 0 ? "100% Ready" : `${parsedResult.warningCount} Warnings`}
                  </span>
                </div>
              </div>

              {/* Mode Selection Options (if provided) */}
              {modeOptions && modeOptions.length > 0 && (
                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Choose Import Execution Strategy:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {modeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedMode(opt.value)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedMode === opt.value
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-white text-slate-800 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span className="text-xs font-bold block">{opt.label}</span>
                        <span className={`text-[10px] block mt-0.5 ${selectedMode === opt.value ? "text-slate-300" : "text-slate-500"}`}>
                          {opt.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-emerald-400" />
                    <span>Tabular Data Preview (First 50 Rows)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Showing {Math.min(50, parsedResult.mappedItems.length)} of {parsedResult.totalRows}
                  </span>
                </div>

                <div className="max-h-[280px] overflow-x-auto overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600">
                        <th className="p-2 border-r border-slate-200 w-10 text-center">#</th>
                        {parsedResult.headers.map((h, i) => (
                          <th key={i} className="p-2 border-r border-slate-200 whitespace-nowrap min-w-[120px]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedResult.rawRows.slice(0, 50).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-2 border-r border-slate-100 text-center font-mono text-[10px] text-slate-400 font-bold">
                            {rIdx + 1}
                          </td>
                          {parsedResult.headers.map((h, cIdx) => (
                            <td key={cIdx} className="p-2 border-r border-slate-100 whitespace-nowrap text-slate-800 font-medium truncate max-w-[200px]">
                              {String(row[h] !== undefined ? row[h] : "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Validation Warnings (if any) */}
              {parsedResult.errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Parsing Notes & Field Warnings ({parsedResult.errors.length}):</span>
                  </div>
                  <ul className="text-[11px] text-amber-800 space-y-0.5 list-disc list-inside max-h-24 overflow-y-auto font-medium">
                    {parsedResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={!parsedResult || parsedResult.mappedItems.length === 0}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Confirm & Import {parsedResult?.totalRows || 0} Records</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
