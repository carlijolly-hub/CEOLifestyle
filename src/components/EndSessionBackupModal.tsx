import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { ShieldCheck, Download, LogOut, X, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { exportExcelBackup } from "../utils/backupUtils";

interface EndSessionBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
  userFullName?: string;
}

export default function EndSessionBackupModal({
  isOpen,
  onClose,
  onConfirmLogout,
  userFullName = "Master Administrator"
}: EndSessionBackupModalProps) {
  useBodyScrollLock(isOpen);
  const [backupNotes, setBackupNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleCreateBackupAndLogout = async () => {
    setIsGenerating(true);
    setSuccessMsg("");
    try {
      // Small timeout to allow UI loading state
      await new Promise(res => setTimeout(res, 300));
      exportExcelBackup(backupNotes, userFullName);
      setSuccessMsg("Backup downloaded successfully! Signing out...");
      setTimeout(() => {
        onConfirmLogout();
      }, 800);
    } catch (err: any) {
      console.error("Backup creation error:", err);
      alert(`Backup error: ${err.message || String(err)}`);
      setIsGenerating(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden text-left transform transition-all my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 block">
                Data Protection Protocol
              </span>
              <h3 className="text-lg font-black text-white leading-tight">
                End-of-Session Backup Confirmation
              </h3>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="bg-indigo-50/60 border border-indigo-100/80 p-4 rounded-2xl flex items-start gap-3">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-900">
                Would you like to create today's backup before leaving?
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Generating an Excel backup ensures all recent client updates, aspiring leads, inventory movements, and system preferences are safely preserved locally on your device.
              </p>
            </div>
          </div>

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-extrabold animate-fade-in">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Backup Notes Field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
              Backup Notes / Changes Made Today <span className="text-slate-400 font-medium">(Optional)</span>
            </label>
            <textarea
              value={backupNotes}
              onChange={(e) => setBackupNotes(e.target.value)}
              placeholder="E.g., Updated client reminders, logged new aspiring leads, adjusted book pricing."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
            />
            <p className="text-[10px] text-slate-400 font-medium">
              Notes are recorded inside the Master Backup Report worksheet for future auditing.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 p-5 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5 sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirmLogout}
            disabled={isGenerating}
            className="px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100/70 bg-rose-50 border border-rose-200/80 rounded-xl transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            Continue Without Backup
          </button>

          <button
            type="button"
            onClick={handleCreateBackupAndLogout}
            disabled={isGenerating}
            className="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {isGenerating ? "Generating Backup..." : "Create Backup & Sign Out"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
