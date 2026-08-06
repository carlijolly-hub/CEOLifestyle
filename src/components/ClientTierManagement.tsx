import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { 
  Award, 
  Crown, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  UploadCloud, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Edit3, 
  ArrowUpRight, 
  Info,
  SlidersHorizontal,
  Clipboard
} from "lucide-react";
import UniversalPasteModal from "./UniversalPasteModal";
import TierImportModal from "./TierImportModal";
import { Client, ClientTier, ClientTierRecord, PromotionOpportunity } from "../types";
import { 
  getClientTierRegister, 
  saveClientTierRegister, 
  evaluateClientPromotions, 
  approveClientPromotion, 
  exportClientTierRegisterExcel, 
  parseClientTierRegisterExcel,
  parseRawExcelFile
} from "../utils/clientTierUtils";
import {
  parseTierImportRows,
  validateTierImport,
  TierImportValidationSummary,
  TierImportExecutionResult
} from "../utils/tierImportEngine";

interface ClientTierManagementProps {
  clients: Client[];
  onUpdateClients?: (updatedClients: Client[]) => void;
  onNavigateToClient?: (clientId: string) => void;
}

export default function ClientTierManagement({
  clients,
  onUpdateClients,
  onNavigateToClient
}: ClientTierManagementProps) {
  const [register, setRegister] = useState<ClientTierRecord[]>(() => getClientTierRegister(clients));
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("All");
  
  // Modals state
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionOpportunity | null>(null);
  const [editingRecord, setEditingRecord] = useState<ClientTierRecord | null>(null);
  const [editTierValue, setEditTierValue] = useState<ClientTier | "">("");
  const [editNotesValue, setEditNotesValue] = useState<string>("");
  const [showImportConfirmModal, setShowImportConfirmModal] = useState(false);
  const [pendingImportRecords, setPendingImportRecords] = useState<ClientTierRecord[] | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);

  // Smart Tier Import Engine state
  const [importValidationSummary, setImportValidationSummary] = useState<TierImportValidationSummary | null>(null);
  const [isTierImportModalOpen, setIsTierImportModalOpen] = useState(false);

  const isAnyModalOpen = !!(selectedPromotion || editingRecord || showImportConfirmModal || isPasteModalOpen || isTierImportModalOpen);
  useBodyScrollLock(isAnyModalOpen);

  const handleConfirmPasteTierRegister = (pastedRecords: any[], rawRows: any[]) => {
    const rowsToProcess = (rawRows && rawRows.length > 0) ? rawRows : pastedRecords;
    if (!rowsToProcess || rowsToProcess.length === 0) return;
    
    const parsedTierRows = parseTierImportRows(rowsToProcess);
    const summary = validateTierImport(parsedTierRows, clients);
    setImportValidationSummary(summary);
    setIsTierImportModalOpen(true);
  };

  // Sync state when clients change
  useEffect(() => {
    const updated = getClientTierRegister(clients);
    setRegister(updated);
  }, [clients]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Evaluate promotion opportunities with No Demotion Policy
  const promotions = useMemo(() => {
    return evaluateClientPromotions(clients, register);
  }, [clients, register]);

  // Executive Tier Statistics
  const stats = useMemo(() => {
    const totalReviewed = clients.length;
    let platinum = 0;
    let gold = 0;
    let silver = 0;

    // Reg map
    const regMap = new Map<string, ClientTierRecord>();
    register.forEach(r => {
      if (r.ceoId) regMap.set(r.ceoId.toLowerCase(), r);
      if (r.customerFullName) regMap.set(r.customerFullName.toLowerCase(), r);
    });

    clients.forEach(c => {
      const rec = regMap.get(c.id.toLowerCase()) || regMap.get(`${c.firstName} ${c.lastName}`.toLowerCase().trim());
      const activeTier = rec?.manualTier || c.tier || "Silver";
      if (activeTier === "Platinum") platinum++;
      else if (activeTier === "Gold") gold++;
      else silver++;
    });

    return { totalReviewed, platinum, gold, silver, pendingPromotions: promotions.length };
  }, [clients, register, promotions]);

  // Filtered Register Records for table view
  const filteredRegister = useMemo(() => {
    return register.filter(rec => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        rec.ceoId.toLowerCase().includes(q) || 
        rec.customerFullName.toLowerCase().includes(q) ||
        rec.promotionNotes.toLowerCase().includes(q);

      const matchesTier = tierFilter === "All" || rec.manualTier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [register, searchQuery, tierFilter]);

  // Handle Promotion Approval
  const handleApprovePromotion = (promo: PromotionOpportunity, notes: string = "Approved by Master Administrator") => {
    const result = approveClientPromotion(promo.client, promo.calculatedTier, notes, clients);
    setRegister(result.updatedRegister);
    if (onUpdateClients && result.updatedClients.length > 0) {
      onUpdateClients(result.updatedClients);
    }
    setSelectedPromotion(null);
    showToast(`Successfully promoted ${promo.customerFullName} to ${promo.calculatedTier}!`);
  };

  // Handle Manual Edit Save
  const handleSaveEditRecord = () => {
    if (!editingRecord) return;
    const today = new Date();
    const dateFormatted = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

    const updated = register.map(r => {
      if (r.ceoId === editingRecord.ceoId) {
        return {
          ...r,
          previousTier: r.manualTier || "Silver",
          manualTier: editTierValue,
          datePromoted: dateFormatted,
          promotionNotes: editNotesValue
        };
      }
      return r;
    });

    saveClientTierRegister(updated);
    setRegister(updated);

    // Sync to clients
    if (editTierValue && onUpdateClients) {
      const updatedClients = clients.map(c => 
        (c.id === editingRecord.ceoId || `${c.firstName} ${c.lastName}`.trim().toLowerCase() === editingRecord.customerFullName.toLowerCase())
          ? { ...c, tier: editTierValue }
          : c
      );
      onUpdateClients(updatedClients);
      try {
        localStorage.setItem("ceo_client_management_data", JSON.stringify(updatedClients));
      } catch (e) {}
    }

    setEditingRecord(null);
    showToast(`Updated Client Tier Register for ${editingRecord.customerFullName}`);
  };

  // Excel Upload Handler (Smart Engine)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rawRows = await parseRawExcelFile(file);
      if (rawRows.length === 0) {
        alert("No valid client records found in the uploaded spreadsheet.");
        return;
      }
      const parsedTierRows = parseTierImportRows(rawRows);
      const summary = validateTierImport(parsedTierRows, clients);
      setImportValidationSummary(summary);
      setIsTierImportModalOpen(true);
    } catch (err) {
      console.error("Failed to parse Client Tier Register Excel:", err);
      alert("Error parsing spreadsheet. Please ensure it uses standard column headers.");
    }
    e.target.value = "";
  };

  const handleCompleteTierImport = (
    updatedClients: Client[],
    updatedRegister: ClientTierRecord[],
    report: TierImportExecutionResult["reportStats"]
  ) => {
    saveClientTierRegister(updatedRegister);
    setRegister(updatedRegister);
    if (onUpdateClients) {
      onUpdateClients(updatedClients);
    }
    try {
      localStorage.setItem("ceo_client_management_data", JSON.stringify(updatedClients));
    } catch (e) {}
    showToast(`Smart CRM Tier Import Complete! Created ${report.createdCount} client profiles, updated ${report.updatedCount}.`);
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-amber-500/40 text-amber-200 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Module Title & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Master Administrator System
            </span>
            <span className="text-xs text-slate-400">• Independent Register</span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400 shrink-0" />
            Client Tier Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Protects approved VIP client classifications with strict permanent tier protection (No Demotion Policy).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Excel Export */}
          <button
            type="button"
            onClick={() => exportClientTierRegisterExcel(register)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Download CEO_Client_Tier_Register_V2.1.xlsx"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export Register (.xlsx)
          </button>

          {/* Excel Import */}
          <label className="flex items-center gap-2 px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer">
            <UploadCloud className="w-4 h-4 text-amber-400" />
            Upload File
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileUpload}
              className="hidden" 
            />
          </label>

          {/* Universal Paste Option */}
          <button
            type="button"
            onClick={() => setIsPasteModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Clipboard className="w-4 h-4 text-emerald-200" />
            Paste From Excel
          </button>
        </div>
      </div>

      {/* Executive Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Reviewed */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Reviewed</div>
          <div className="text-2xl font-black text-slate-900">{stats.totalReviewed}</div>
          <div className="text-[11px] text-slate-500 font-medium">Clients Monitored</div>
        </div>

        {/* Platinum */}
        <div className="bg-white border border-amber-200/80 rounded-2xl p-4 shadow-sm space-y-1 bg-gradient-to-br from-amber-50/40 to-white">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 flex items-center gap-1">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            Platinum
          </div>
          <div className="text-2xl font-black text-amber-900">{stats.platinum}</div>
          <div className="text-[11px] text-amber-700 font-medium">VIP Executive Status</div>
        </div>

        {/* Gold */}
        <div className="bg-white border border-yellow-200/80 rounded-2xl p-4 shadow-sm space-y-1 bg-gradient-to-br from-yellow-50/40 to-white">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-yellow-700 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-yellow-500" />
            Gold
          </div>
          <div className="text-2xl font-black text-yellow-900">{stats.gold}</div>
          <div className="text-[11px] text-yellow-700 font-medium">Core Enterprise Tiers</div>
        </div>

        {/* Silver */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            Silver
          </div>
          <div className="text-2xl font-black text-slate-700">{stats.silver}</div>
          <div className="text-[11px] text-slate-500 font-medium">Standard Relationship</div>
        </div>

        {/* Pending Promotions */}
        <div className="col-span-2 md:col-span-1 bg-slate-900 border border-amber-500/40 rounded-2xl p-4 shadow-md space-y-1 text-white">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Promotions Ready
          </div>
          <div className="text-2xl font-black text-amber-300">{stats.pendingPromotions}</div>
          <div className="text-[11px] text-slate-400 font-medium">Qualified for Review</div>
        </div>
      </div>

      {/* Promotion Opportunities Section */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              🏅 Client Tier Promotion Opportunities
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identified upward tier promotions based on order history and spending thresholds. System never demotes clients.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-900 rounded-full shrink-0">
            {promotions.length} Ready for Approval
          </span>
        </div>

        {promotions.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-xs font-bold text-slate-700">All Client Tiers are Up to Date</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
              No clients currently meet higher promotional thresholds than their approved manual tier.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promotions.map(promo => (
              <div 
                key={promo.ceoId}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 shadow-md space-y-3 transition-all relative overflow-hidden group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      {promo.ceoId}
                    </span>
                    <h4 className="text-sm font-black text-white truncate max-w-[180px]">
                      {promo.customerFullName}
                    </h4>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                    promo.calculatedTier === "Platinum"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                  }`}>
                    {promo.calculatedTier === "Platinum" ? "💎 Ready for Platinum" : "🥇 Ready for Gold"}
                  </span>
                </div>

                <div className="bg-slate-800/60 rounded-xl p-2.5 text-xs space-y-1 border border-slate-800">
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Current Final Tier:</span>
                    <span className="font-bold text-slate-200">{promo.currentTier}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Lifetime Spend:</span>
                    <span className="font-bold text-amber-300">${promo.lifetimeSpend.toLocaleString()} JMD</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Total Orders:</span>
                    <span className="font-bold text-slate-200">{promo.totalOrders}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedPromotion(promo)}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-colors cursor-pointer text-center"
                  >
                    Review Promotion
                  </button>
                  {onNavigateToClient && (
                    <button
                      type="button"
                      onClick={() => onNavigateToClient(promo.client.id)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                      title="View Client Detail"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Client Tier Register Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Official Client Tier Register
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Master record of approved client tiers, promotion dates, and relationship history notes.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Search register..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-amber-500"
            >
              <option value="All">All Tiers</option>
              <option value="Platinum">Platinum</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">CEO ID</th>
                <th className="py-3 px-4">Customer Full Name</th>
                <th className="py-3 px-4">Manual Tier</th>
                <th className="py-3 px-4">Date Promoted</th>
                <th className="py-3 px-4">Previous Tier</th>
                <th className="py-3 px-4">Promotion Notes</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRegister.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No matching records in Client Tier Register.
                  </td>
                </tr>
              ) : (
                filteredRegister.map((rec) => (
                  <tr key={rec.ceoId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-extrabold text-slate-900">{rec.ceoId}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{rec.customerFullName}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 font-extrabold px-2.5 py-0.5 rounded-full text-[11px] ${
                        rec.manualTier === "Platinum"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : rec.manualTier === "Gold"
                          ? "bg-yellow-100 text-yellow-900 border border-yellow-300"
                          : "bg-slate-100 text-slate-700 border border-slate-300"
                      }`}>
                        {rec.manualTier === "Platinum" && "💎 "}
                        {rec.manualTier === "Gold" && "🥇 "}
                        {rec.manualTier || "Silver"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{rec.datePromoted || "—"}</td>
                    <td className="py-3 px-4 text-slate-500">{rec.previousTier || "N/A"}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={rec.promotionNotes}>
                      {rec.promotionNotes || "Official approved client tier"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRecord(rec);
                          setEditTierValue(rec.manualTier || "Silver");
                          setEditNotesValue(rec.promotionNotes || "");
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Review Promotion Detail */}
      {selectedPromotion && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Master Administrator Promotion Approval
              </span>
              <button
                type="button"
                onClick={() => setSelectedPromotion(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Client Name:</span>
                  <span className="font-extrabold text-white text-sm">{selectedPromotion.customerFullName}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>CEO Identifier:</span>
                  <span className="font-bold text-slate-300">{selectedPromotion.ceoId}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-700/60">
                  <span>Current Approved Tier:</span>
                  <span className="font-bold text-slate-300 px-2 py-0.5 bg-slate-700 rounded-md">
                    {selectedPromotion.currentTier}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Calculated Target Tier:</span>
                  <span className="font-black text-amber-300 px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-md">
                    {selectedPromotion.calculatedTier}
                  </span>
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Performance Metrics & Reasoning
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Lifetime Spend</span>
                    <span className="font-bold text-amber-300">${selectedPromotion.lifetimeSpend.toLocaleString()} JMD</span>
                  </div>
                  <div className="bg-slate-800 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Total Orders</span>
                    <span className="font-bold text-white">{selectedPromotion.totalOrders}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 pt-1 font-medium">
                  {selectedPromotion.recommendation}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPromotion(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApprovePromotion(selectedPromotion)}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-colors cursor-pointer shadow-md"
              >
                Approve Promotion
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Edit Tier Record */}
      {editingRecord && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-900 space-y-4 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-500" />
                Edit Approved Client Tier
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                  Client Name
                </label>
                <input 
                  type="text" 
                  disabled 
                  value={`${editingRecord.customerFullName} (${editingRecord.ceoId})`}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                  Official Approved Manual Tier
                </label>
                <select
                  value={editTierValue}
                  onChange={(e) => setEditTierValue(e.target.value as ClientTier)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-extrabold text-slate-900 focus:outline-hidden focus:border-amber-500"
                >
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                  Promotion Notes / Executive Justification
                </label>
                <textarea
                  rows={3}
                  value={editNotesValue}
                  onChange={(e) => setEditNotesValue(e.target.value)}
                  placeholder="E.g., Approved manually based on long-standing executive partnership"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditRecord}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-colors cursor-pointer shadow-xs"
              >
                Save Tier Entry
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* UNIVERSAL PASTE MODAL */}
      <UniversalPasteModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        title="Paste Client Tier Register Records"
        subtitle="Copy rows directly from Excel, Google Sheets, or Numbers and paste them here to simultaneously update VIP tiers and create client profiles"
        templateType="tier_register"
        onConfirmImport={(pastedRecords, rawRows) => handleConfirmPasteTierRegister(pastedRecords, rawRows)}
      />

      {/* SMART CRM TIER IMPORT RESOLUTION MODAL */}
      <TierImportModal
        isOpen={isTierImportModalOpen}
        onClose={() => setIsTierImportModalOpen(false)}
        summary={importValidationSummary}
        existingClients={clients}
        existingRegister={register}
        onCompleteImport={handleCompleteTierImport}
      />
    </div>
  );
}
