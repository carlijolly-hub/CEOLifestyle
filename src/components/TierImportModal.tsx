import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { 
  X, 
  Crown, 
  AlertTriangle, 
  CheckCircle2, 
  UserPlus, 
  RefreshCw, 
  Download, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  ChevronDown
} from "lucide-react";
import { Client, ClientTierRecord } from "../types";
import { 
  TierImportValidationSummary, 
  TierImportExecutionResult, 
  executeTierImport, 
  generateImportReportText,
  DuplicateAction
} from "../utils/tierImportEngine";

interface TierImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: TierImportValidationSummary | null;
  existingClients: Client[];
  existingRegister: ClientTierRecord[];
  onCompleteImport: (
    updatedClients: Client[], 
    updatedRegister: ClientTierRecord[], 
    report: TierImportExecutionResult["reportStats"]
  ) => void;
}

export default function TierImportModal({
  isOpen,
  onClose,
  summary,
  existingClients,
  existingRegister,
  onCompleteImport
}: TierImportModalProps) {
  useBodyScrollLock(isOpen);
  const [currentStep, setCurrentStep] = useState<"summary" | "complete">("summary");
  const [validationSummary, setValidationSummary] = useState<TierImportValidationSummary | null>(summary);
  const [executionResult, setExecutionResult] = useState<TierImportExecutionResult | null>(null);

  // Sync prop summary when opened or updated
  React.useEffect(() => {
    if (summary) {
      setValidationSummary(summary);
      setCurrentStep("summary");
      setExecutionResult(null);
    }
  }, [summary, isOpen]);

  if (!isOpen || !validationSummary) return null;

  const handleActionChange = (index: number, newAction: DuplicateAction) => {
    if (!validationSummary) return;
    const updatedItems = [...validationSummary.items];
    updatedItems[index] = {
      ...updatedItems[index],
      selectedAction: newAction
    };

    // Recalculate stats
    let newProfiles = 0;
    let updatedProfiles = 0;
    updatedItems.forEach(item => {
      if (item.selectedAction === "create_new") newProfiles++;
      else if (item.selectedAction === "merge") updatedProfiles++;
    });

    setValidationSummary({
      ...validationSummary,
      newProfilesCount: newProfiles,
      updatedProfilesCount: updatedProfiles,
      items: updatedItems
    });
  };

  const handleConfirmImport = () => {
    if (!validationSummary) return;
    const result = executeTierImport(validationSummary, existingClients, existingRegister);
    setExecutionResult(result);
    setCurrentStep("complete");
    onCompleteImport(result.updatedClients, result.updatedRegister, result.reportStats);
  };

  const handleDownloadReport = () => {
    if (!executionResult) return;
    const reportText = generateImportReportText(executionResult.reportStats);
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CEO_Lifestyle_Tier_Import_Report_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200 text-left">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] my-auto flex flex-col shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-6 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Smart CRM Onboarding Engine
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                {currentStep === "summary" ? "Import Validation & Duplicate Check" : "Import Complete"}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300">

          {/* STEP 1: SUMMARY & DUPLICATE RESOLUTION */}
          {currentStep === "summary" && (
            <>
              {/* TOP SUMMARY STATS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Records Found</div>
                  <div className="text-2xl font-black text-white">{validationSummary.totalRecords}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Total Rows</div>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl">
                  <div className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider mb-1">New Profiles</div>
                  <div className="text-2xl font-black text-emerald-300">✓ {validationSummary.newProfilesCount}</div>
                  <div className="text-[10px] text-emerald-400/80 mt-0.5">Auto-Created</div>
                </div>

                <div className="bg-blue-950/20 border border-blue-500/30 p-4 rounded-2xl">
                  <div className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider mb-1">Profiles Updated</div>
                  <div className="text-2xl font-black text-blue-300">✓ {validationSummary.updatedProfilesCount}</div>
                  <div className="text-[10px] text-blue-400/80 mt-0.5">Merged / Updated</div>
                </div>

                <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-2xl">
                  <div className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider mb-1">Name Warnings</div>
                  <div className="text-2xl font-black text-amber-300">⚠ {validationSummary.possibleDuplicateNamesCount}</div>
                  <div className="text-[10px] text-amber-400/80 mt-0.5">Needs Review</div>
                </div>
              </div>

              {/* DUPLICATE CL ID MATCHES BANNER */}
              {validationSummary.exactIdMatchesCount > 0 && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-200">
                      Exact CL ID Matches Detected ({validationSummary.exactIdMatchesCount})
                    </h4>
                    <p className="text-xs text-blue-300/80 mt-0.5">
                      Matched existing client profiles by CL ID. The engine will update lifetime metrics, order counts, and tiers while preserving all personal notes, contacts, and custom CRM histories.
                    </p>
                  </div>
                </div>
              )}

              {/* POSSIBLE DUPLICATE NAME RESOLUTION LIST */}
              {validationSummary.possibleDuplicateNamesCount > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Possible Duplicate Client Names ({validationSummary.possibleDuplicateNamesCount})
                    </h4>
                    <span className="text-[10px] text-slate-400">Select resolution for each conflict</span>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {validationSummary.items
                      .map((item, originalIndex) => ({ item, originalIndex }))
                      .filter(({ item }) => item.status === "possible_duplicate_name")
                      .map(({ item, originalIndex }) => (
                        <div 
                          key={originalIndex}
                          className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                            <div>
                              <span className="text-xs font-bold text-white block">
                                Client Name: <span className="text-amber-300">{item.parsedRow.fullName}</span>
                              </span>
                              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                                <span>Existing ID: <strong className="text-slate-200">{item.existingClient?.id}</strong></span>
                                <span>•</span>
                                <span>Imported ID: <strong className="text-amber-200">{item.parsedRow.clId}</strong></span>
                              </div>
                            </div>
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full font-bold border border-amber-500/30 self-start sm:self-center">
                              Tier: {item.parsedRow.finalTier}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-xs text-slate-300 font-medium">Select Action:</span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleActionChange(originalIndex, "merge")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  item.selectedAction === "merge"
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-slate-800 text-slate-400 hover:text-white"
                                }`}
                              >
                                Merge with existing ({item.existingClient?.id})
                              </button>

                              <button
                                type="button"
                                onClick={() => handleActionChange(originalIndex, "create_new")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  item.selectedAction === "create_new"
                                    ? "bg-emerald-600 text-white shadow-sm"
                                    : "bg-slate-800 text-slate-400 hover:text-white"
                                }`}
                              >
                                Create as new ({item.parsedRow.clId})
                              </button>

                              <button
                                type="button"
                                onClick={() => handleActionChange(originalIndex, "skip")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  item.selectedAction === "skip"
                                    ? "bg-rose-600 text-white shadow-sm"
                                    : "bg-slate-800 text-slate-400 hover:text-white"
                                }`}
                              >
                                Skip Row
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* OVERVIEW TABLE OF IMPORT RECORDS */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Import Spreadsheet Records Preview ({validationSummary.items.length})
                </h4>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold sticky top-0">
                      <tr>
                        <th className="p-3">CL ID</th>
                        <th className="p-3">Client Name</th>
                        <th className="p-3">Client Home</th>
                        <th className="p-3">Orders</th>
                        <th className="p-3">Spend (JMD)</th>
                        <th className="p-3">Final Tier</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                      {validationSummary.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="p-3 font-mono text-amber-300">{item.parsedRow.clId}</td>
                          <td className="p-3 font-bold text-white">{item.parsedRow.fullName}</td>
                          <td className="p-3 text-slate-400">{item.parsedRow.businessRelationship}</td>
                          <td className="p-3">{item.parsedRow.totalOrders}</td>
                          <td className="p-3 text-emerald-300 font-bold">${item.parsedRow.lifetimeSpend.toLocaleString()}</td>
                          <td className="p-3 font-bold text-amber-400">{item.parsedRow.finalTier}</td>
                          <td className="p-3">
                            {item.selectedAction === "merge" && (
                              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">
                                Update Existing
                              </span>
                            )}
                            {item.selectedAction === "create_new" && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                                Create New
                              </span>
                            )}
                            {item.selectedAction === "skip" && (
                              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                                Skip Row
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: IMPORT COMPLETE & FINAL REPORT */}
          {currentStep === "complete" && executionResult && (
            <div className="space-y-6">
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">
                    Import Processed Successfully
                  </h4>
                  <p className="text-xs text-emerald-300/80 mt-1">
                    All client profiles and tier register entries have been synchronized with the master database.
                  </p>
                </div>
              </div>

              {/* STATS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Profiles Created</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{executionResult.reportStats.createdCount}</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Profiles Updated</div>
                  <div className="text-2xl font-black text-blue-400 mt-1">{executionResult.reportStats.updatedCount}</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Duplicates Skipped</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">{executionResult.reportStats.skippedCount}</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Errors</div>
                  <div className="text-2xl font-black text-rose-400 mt-1">{executionResult.reportStats.errorsCount}</div>
                </div>
              </div>

              {/* AUDIT LOG TEXT BOX */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    System Audit Trail Log
                  </span>
                  <button
                    onClick={handleDownloadReport}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Full Report (.txt)
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-slate-300 h-44 overflow-y-auto space-y-1">
                  {executionResult.reportStats.logDetails.map((log, i) => (
                    <div key={i} className={
                      log.startsWith("[CREATED]") ? "text-emerald-400" :
                      log.startsWith("[UPDATED]") ? "text-blue-400" :
                      log.startsWith("[SKIPPED]") ? "text-amber-400" :
                      log.startsWith("[ERROR]") ? "text-rose-400" : "text-slate-300"
                    }>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-6 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between shrink-0">
          {currentStep === "summary" ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                Ready to Import ({validationSummary.items.length} Records)
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleDownloadReport}
                className="px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Import Report
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black transition-all cursor-pointer"
              >
                Close & Return to CRM
              </button>
            </>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
