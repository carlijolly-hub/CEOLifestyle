import React, { useState, useMemo } from "react";
import { 
  Users, 
  MessageSquare, 
  RotateCcw, 
  AlertTriangle, 
  Check, 
  ShieldCheck, 
  ArrowRight,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  PhoneCall
} from "lucide-react";
import { Client } from "../types";

interface ClientManagementSettingsProps {
  clients?: Client[];
  onUpdateClients?: (updatedClients: Client[]) => void;
  onNavigateToTab?: (tab: "dashboard" | "directory" | "excel" | "calendar" | "inventory" | "branding" | "users") => void;
  onNavigateToClient?: (clientId: string) => void;
}

export const ClientManagementSettings: React.FC<ClientManagementSettingsProps> = ({
  clients = [],
  onUpdateClients,
  onNavigateToTab,
  onNavigateToClient
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"All" | "Not Checked In" | "Checked In">("All");

  // Calculations
  const activeClients = useMemo(() => clients.filter(c => !c.deactivated), [clients]);
  const checkedInCount = useMemo(() => activeClients.filter(c => !!c.checkedIn).length, [activeClients]);
  const notCheckedInCount = useMemo(() => activeClients.filter(c => !c.checkedIn).length, [activeClients]);
  const totalCount = clients.length;
  const checkedInPercentage = activeClients.length > 0 
    ? Math.round((checkedInCount / activeClients.length) * 100) 
    : 0;

  // Execute Bulk Reset
  const handleExecuteResetAll = () => {
    if (!onUpdateClients) return;

    // Preserves ALL client data, strictly resets checkedIn to false for ACTIVE clients only
    const updatedList = clients.map(client => {
      if (client.deactivated) return client;
      return {
        ...client,
        checkedIn: false
      };
    });

    onUpdateClients(updatedList);
    setShowConfirmModal(false);
    setSuccessMessage(`WhatsApp Check-In status successfully reset for all ${activeClients.length} active clients. All active clients now appear as "Not Checked In".`);
  };

  // Quick single client toggle from admin table
  const handleToggleSingleClient = (clientId: string, nextStatus: boolean) => {
    if (!onUpdateClients) return;
    const updated = clients.map(c => c.id === clientId ? { ...c, checkedIn: nextStatus } : c);
    onUpdateClients(updated);
  };

  // Filtered preview list
  const filteredPreview = useMemo(() => {
    return activeClients.filter(client => {
      const matchesSearch = 
        `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.contact.phoneNumber && client.contact.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterMode === "Not Checked In") return !client.checkedIn;
      if (filterMode === "Checked In") return !!client.checkedIn;
      return true;
    });
  }, [activeClients, searchQuery, filterMode]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-xs text-left space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="pb-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
            <Users className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
                Client Management & Reconnection
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Master Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Administrative controls for client directory state, WhatsApp connection tracking, and reconnection cycles.
            </p>
          </div>
        </div>

        {onNavigateToTab && (
          <button
            type="button"
            onClick={() => onNavigateToTab("directory")}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl transition-all"
          >
            <span>Open Client Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3 text-emerald-900 animate-fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold">{successMessage}</p>
              <p className="text-[11px] text-emerald-700 mt-1">
                You can now filter the Client Directory by <strong>"Not Checked In"</strong> to start confirming clients as they reconnect with the new number.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab("directory")}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                Go to Directory
              </button>
            )}
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Live Status Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Clients</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
          <span className="text-[10px] text-slate-500 font-medium">In CRM Database</span>
        </div>

        <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Profiles</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{activeClients.length}</p>
          <span className="text-[10px] text-emerald-600 font-bold">Non-deactivated</span>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block">Checked In</span>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
              {checkedInPercentage}%
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-800 mt-1">{checkedInCount}</p>
          <div className="w-full bg-emerald-200/60 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${checkedInPercentage}%` }} 
            />
          </div>
        </div>

        <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-4">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block">Not Checked In</span>
          <p className="text-2xl font-black text-amber-800 mt-1">{notCheckedInCount}</p>
          <span className="text-[10px] text-amber-600 font-bold">Awaiting Reconnection</span>
        </div>
      </div>

      {/* Primary Action Card: Reset All WhatsApp Check-Ins */}
      <div className="border-2 border-amber-200 bg-linear-to-br from-amber-50/40 via-white to-orange-50/20 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              </div>
              <h3 className="text-base md:text-lg font-black text-slate-900">
                Reset All WhatsApp Check-Ins
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                Bulk Action
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              This action is designed for situations where the business changes its <strong>WhatsApp / contact phone number</strong>, experiences a major communication outage, or needs every client to reconnect from scratch.
            </p>

            <p className="text-xs text-slate-700 leading-relaxed">
              When triggered, it changes every client profile from <strong>☑ Checked In</strong> to <strong>☐ Checked In</strong>. All clients will instantly appear as <strong>Not Checked In</strong> in the Client Directory so the team can confirm and check off each client as they reconnect using the new contact number.
            </p>

            {/* Non-destructive guarantee callout */}
            <div className="p-3.5 bg-white/90 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-700 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">Zero Data Loss Guarantee:</strong>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  This reset <strong>ONLY</strong> resets the WhatsApp Check-In status. It does <strong>NOT</strong> delete or alter client names, phone numbers, email addresses, client tiers, order history, events, milestones, notes, special dates, client status, or any other CRM data.
                </p>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center md:items-end justify-center">
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-black text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset All WhatsApp Check-Ins</span>
            </button>
            <span className="text-[10px] text-slate-400 font-semibold mt-2 text-center md:text-right">
              Will reset {activeClients.length} active client profiles
            </span>
          </div>
        </div>
      </div>

      {/* Live Directory Preview & Individual Toggle Control */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Client Check-In Status Directory</h4>
            <p className="text-[11px] text-slate-500">Review or individually toggle client check-in statuses without leaving Settings.</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 w-44"
              />
            </div>

            {/* Filter Mode */}
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-slate-800"
            >
              <option value="All">All ({activeClients.length})</option>
              <option value="Not Checked In">Not Checked In ({notCheckedInCount})</option>
              <option value="Checked In">Checked In ({checkedInCount})</option>
            </select>
          </div>
        </div>

        {/* Clients Table Preview */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filteredPreview.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No client profiles found matching criteria.
              </div>
            ) : (
              filteredPreview.map((client) => (
                <div 
                  key={client.id}
                  className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-700 shrink-0">
                      {client.firstName[0]}{client.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {client.firstName} {client.lastName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          #{client.id}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {client.tier}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {client.contact.phoneNumber || "No phone registered"} • {client.contact.city}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleSingleClient(client.id, !client.checkedIn)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold border transition-all ${
                        client.checkedIn
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs"
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 text-slate-800"
                      }`}
                      title={client.checkedIn ? "Click to mark as Not Checked In" : "Click to mark as Checked In"}
                    >
                      <span className="font-mono text-xs">{client.checkedIn ? "☑" : "☐"}</span>
                      <span>{client.checkedIn ? "Checked In" : "Not Checked In"}</span>
                    </button>

                    {onNavigateToClient && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigateToTab) onNavigateToTab("directory");
                          onNavigateToClient(client.id);
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-900 p-1 rounded hover:bg-slate-200/60"
                        title="View Full Profile in Directory"
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6 text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  Reset All WhatsApp Check-Ins?
                </h3>
                <span className="text-xs text-amber-700 font-bold">
                  Affects {activeClients.length} active client profiles
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="font-bold text-slate-900">
                This will mark all active clients as <span className="text-amber-800 font-black">Not Checked In</span>.
              </p>
              <p>
                This action will not delete or modify any other client information.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
                <li>Client names, phones, emails, and tiers remain untouched</li>
                <li>Notes, CMTs, order history, and dates remain untouched</li>
                <li>Archived client profiles are not modified</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteResetAll}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Check-Ins</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
