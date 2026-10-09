import React from "react";
import { createPortal } from "react-dom";
import { ShieldAlert, X, Clock, Calendar } from "lucide-react";

interface AdventistWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName?: string;
  actionName?: string;
}

export default function AdventistWarningModal({
  isOpen,
  onClose,
  clientName,
  actionName = "Messaging / Outreach",
}: AdventistWarningModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] animate-fade-in text-slate-800">
      <div className="bg-white border border-amber-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative my-auto">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-amber-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-200/80 shadow-xs">
              <ShieldAlert className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-rose-700 flex items-center gap-1.5">
                Communication Restricted
              </h3>
              <p className="text-xs font-bold text-slate-700">Adventist ✝</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Message */}
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 space-y-3">
          <div className="text-rose-700 font-black text-xs sm:text-sm tracking-tight flex items-center gap-1.5 bg-white border border-rose-200 rounded-xl p-2.5 shadow-xs">
            <span>🔴 DO NOT MESSAGE FRIDAY 5 PM OR SATURDAY</span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {clientName ? (
              <>
                <strong className="text-slate-900">{clientName}</strong> is marked <strong className="text-slate-900">Adventist ✝</strong>.
              </>
            ) : (
              <>This client is marked <strong className="text-slate-900">Adventist ✝</strong>.</>
            )}{" "}
            Outreach and messaging are automatically blocked during this restricted window.
          </p>

          <div className="space-y-1.5 text-[11px] font-semibold text-rose-900 pt-1 border-t border-rose-200/60">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span><strong>Restricted Window:</strong> Friday 5:00 PM through Saturday (Jamaica Time)</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Please resume communication on Sunday.</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
