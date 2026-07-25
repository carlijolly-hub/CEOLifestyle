import React, { useState } from "react";
import { Client } from "../types";
import { exportClientDatabase, ClientExportSummary } from "../utils/backupUtils";
import { 
  Download, 
  FileSpreadsheet, 
  Users, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Sparkles,
  FileText
} from "lucide-react";

interface ClientExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  userFullName?: string;
}

export default function ClientExportModal({
  isOpen,
  onClose,
  clients,
  userFullName = "Master Administrator"
}: ClientExportModalProps) {
  const [fileFormat, setFileFormat] = useState<"xlsx" | "json">("xlsx");
  const [summary, setSummary] = useState<ClientExportSummary | null>(null);

  if (!isOpen) return null;

  const totalCount = clients.length;
  const platinumCount = clients.filter(c => c.tier === "Platinum").length;
  const goldCount = clients.filter(c => c.tier === "Gold").length;
  const silverCount = clients.filter(c => c.tier === "Silver").length;

  const handleExecuteExport = () => {
    const result = exportClientDatabase(clients, fileFormat, userFullName);
    setSummary(result);
  };

  const handleClose = () => {
    setSummary(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 text-slate-800 text-left relative overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {summary ? "Client Export Complete" : "Export Current Client Database"}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                CEO Lifestyle Management • V2.1 Synchronized Profiles
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Confirmation Form */}
        {!summary ? (
          <div className="space-y-6">
            
            {/* Confirmation Alert Message Box */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
              <p className="text-xs font-extrabold text-indigo-950">
                You are about to export {totalCount} client profiles.
              </p>
              <p className="text-xs text-indigo-800/80 font-medium leading-relaxed">
                This file contains current client information from CEO Lifestyle Management.
              </p>
              <p className="text-xs font-bold text-indigo-900 pt-1">
                Continue?
              </p>
            </div>

            {/* Scope Details Preview */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Export Data Breakdown
              </span>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Platinum</span>
                  <span className="text-sm font-black text-amber-600">{platinumCount}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Gold</span>
                  <span className="text-sm font-black text-yellow-600">{goldCount}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Silver</span>
                  <span className="text-sm font-black text-slate-600">{silverCount}</span>
                </div>
              </div>
            </div>

            {/* File Format Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block">
                Select Export File Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFileFormat("xlsx")}
                  className={`p-3.5 rounded-2xl border transition-all text-left flex items-center gap-3 cursor-pointer ${
                    fileFormat === "xlsx"
                      ? "bg-slate-900 border-slate-900 text-white shadow-md"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <FileSpreadsheet className={`w-5 h-5 shrink-0 ${fileFormat === "xlsx" ? "text-emerald-400" : "text-emerald-600"}`} />
                  <div>
                    <span className="text-xs font-bold block">Excel (.xlsx)</span>
                    <span className={`text-[10px] font-medium block mt-0.5 ${fileFormat === "xlsx" ? "text-slate-300" : "text-slate-400"}`}>
                      Formatted Workbook
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFileFormat("json")}
                  className={`p-3.5 rounded-2xl border transition-all text-left flex items-center gap-3 cursor-pointer ${
                    fileFormat === "json"
                      ? "bg-slate-900 border-slate-900 text-white shadow-md"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <FileText className={`w-5 h-5 shrink-0 ${fileFormat === "json" ? "text-indigo-400" : "text-indigo-600"}`} />
                  <div>
                    <span className="text-xs font-bold block">Backup (.json)</span>
                    <span className={`text-[10px] font-medium block mt-0.5 ${fileFormat === "json" ? "text-slate-300" : "text-slate-400"}`}>
                      System JSON Format
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteExport}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Confirm Export
              </button>
            </div>

          </div>
        ) : (
          /* STEP 2: Export Summary Card */
          <div className="space-y-6">
            
            <div className="p-5 bg-emerald-50 border border-emerald-200/80 rounded-2xl space-y-4">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-extrabold text-emerald-950">
                    Client Export Complete
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-700">
                    File Created Successfully.
                  </span>
                </div>
              </div>

              <div className="bg-white border border-emerald-100 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="font-bold text-slate-600">Total Clients Exported:</span>
                  <span className="font-extrabold text-slate-900 font-mono text-sm">{summary.totalClients}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="font-semibold text-slate-600">Platinum Clients:</span>
                  <span className="font-bold text-amber-700 font-mono">{summary.platinumCount}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="font-semibold text-slate-600">Gold Clients:</span>
                  <span className="font-bold text-yellow-700 font-mono">{summary.goldCount}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="font-semibold text-slate-600">Silver Clients:</span>
                  <span className="font-bold text-slate-700 font-mono">{summary.silverCount}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-100/60 border border-emerald-200 rounded-xl">
                <span className="text-[10px] font-extrabold uppercase text-emerald-900 block">Generated File Name:</span>
                <code className="text-xs font-mono font-bold text-emerald-950 break-all block mt-0.5">
                  {summary.fileName}
                </code>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                Close Summary
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
