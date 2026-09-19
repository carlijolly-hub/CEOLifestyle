import React from "react";
import { Undo2, X, CheckCircle2 } from "lucide-react";

export interface UndoAction {
  id: string;
  message: string;
  onUndo: () => void;
}

interface UndoToastProps {
  action: UndoAction | null;
  onDismiss: () => void;
}

export default function UndoToast({ action, onDismiss }: UndoToastProps) {
  if (!action) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce-in max-w-md w-full px-4">
      <div className="bg-slate-950 text-white border border-slate-800 shadow-2xl rounded-2xl p-3.5 flex items-center justify-between gap-3 backdrop-blur-md bg-opacity-95">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-slate-200 truncate leading-snug">
            {action.message}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              action.onUndo();
              onDismiss();
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>UNDO</span>
          </button>
          
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
