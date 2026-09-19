import React, { useState, useMemo } from "react";
import { Client, ClientPromise, PromiseStatus } from "../types";
import { getClientPromises, getOpenPromisesCount } from "../utils/clientTierUtils";
import { 
  HeartHandshake, 
  Plus, 
  X, 
  Check, 
  CheckCircle2, 
  Calendar, 
  Edit, 
  Trash2, 
  User, 
  Search, 
  Filter,
  ExternalLink
} from "lucide-react";

interface CmtManagementModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  clients: Client[];
  onUpdateClients: (updatedClients: Client[]) => void;
  onNavigateToClient?: (clientId: string) => void;
  isEmbeddedInSettings?: boolean;
}

export function CmtManagementModal({
  isOpen = true,
  onClose,
  clients,
  onUpdateClients,
  onNavigateToClient,
  isEmbeddedInSettings = false
}: CmtManagementModalProps) {
  const [filterStatus, setFilterStatus] = useState<"All" | "Open" | "Fulfilled" | "Cancelled">("Open");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  // Create / Edit Form state
  const [showForm, setShowForm] = useState(false);
  const [editingCmt, setEditingCmt] = useState<{ clientId: string; cmt: ClientPromise } | null>(null);
  const [formClientId, setFormClientId] = useState<string>("");
  const [formCommitment, setFormCommitment] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formStatus, setFormStatus] = useState<PromiseStatus>("Open");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");

  if (!isOpen && !isEmbeddedInSettings) return null;

  // Flatten all CMTs across all clients with client metadata
  const allCmts = useMemo(() => {
    const list: Array<{
      client: Client;
      cmt: ClientPromise;
    }> = [];

    clients.forEach(client => {
      const promises = getClientPromises(client);
      promises.forEach(cmt => {
        list.push({ client, cmt });
      });
    });

    return list;
  }, [clients]);

  // Filtered CMTs
  const filteredCmts = useMemo(() => {
    return allCmts.filter(({ client, cmt }) => {
      // Status filter
      if (filterStatus === "Open" && (cmt.status !== "Open" && (cmt.status as any) !== "Pending")) return false;
      if (filterStatus === "Fulfilled" && (cmt.status !== "Fulfilled" && cmt.status !== "Completed")) return false;
      if (filterStatus === "Cancelled" && cmt.status !== "Cancelled") return false;

      // Client filter
      if (selectedClientId && client.id !== selectedClientId) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const company = (client as any).companyName || (client as any).company || "";
        const clientName = `${client.firstName || ""} ${client.lastName || ""} ${company}`.toLowerCase();
        const text = (cmt.promise || cmt.commitment || "").toLowerCase();
        const notes = (cmt.notes || "").toLowerCase();
        return clientName.includes(q) || text.includes(q) || notes.includes(q);
      }

      return true;
    });
  }, [allCmts, filterStatus, selectedClientId, searchQuery]);

  const openCount = useMemo(() => {
    return allCmts.filter(({ cmt }) => cmt.status === "Open" || (cmt.status as any) === "Pending").length;
  }, [allCmts]);

  const openCreateForm = () => {
    setEditingCmt(null);
    setFormClientId(clients[0]?.id || "");
    setFormCommitment("");
    setFormDueDate("");
    setFormStatus("Open");
    setFormNotes("");
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (client: Client, cmt: ClientPromise) => {
    setEditingCmt({ clientId: client.id, cmt });
    setFormClientId(client.id);
    setFormCommitment(cmt.promise || cmt.commitment || "");
    setFormDueDate(cmt.dueDate || "");
    setFormStatus(cmt.status === "Completed" ? "Fulfilled" : cmt.status);
    setFormNotes(cmt.notes || "");
    setFormError("");
    setShowForm(true);
  };

  const handleSaveCmt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientId) {
      setFormError("Please select a client to associate with this CMT.");
      return;
    }
    if (!formCommitment.trim()) {
      setFormError("Please enter the commitment description.");
      return;
    }

    const updatedClients = clients.map(c => {
      if (c.id !== formClientId) {
        // If we moved a CMT from one client to another
        if (editingCmt && editingCmt.clientId === c.id && editingCmt.clientId !== formClientId) {
          const current = getClientPromises(c);
          const filtered = current.filter(p => p.id !== editingCmt.cmt.id);
          return { ...c, promises: filtered, commitments: filtered };
        }
        return c;
      }

      const currentPromises = getClientPromises(c);
      let updatedPromises: ClientPromise[];

      if (editingCmt && editingCmt.clientId === formClientId) {
        // Update existing CMT
        updatedPromises = currentPromises.map(p =>
          p.id === editingCmt.cmt.id
            ? {
                ...p,
                promise: formCommitment.trim(),
                commitment: formCommitment.trim(),
                dueDate: formDueDate.trim() || undefined,
                status: formStatus,
                notes: formNotes.trim() || undefined,
                fulfilledDate: (formStatus === "Fulfilled" || formStatus === "Completed") ? (p.fulfilledDate || p.completedDate || new Date().toISOString().split("T")[0]) : undefined,
                completedDate: (formStatus === "Fulfilled" || formStatus === "Completed") ? (p.completedDate || p.fulfilledDate || new Date().toISOString().split("T")[0]) : undefined
              }
            : p
        );
      } else {
        // Create new CMT
        const newCmt: ClientPromise = {
          id: `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          promise: formCommitment.trim(),
          commitment: formCommitment.trim(),
          dueDate: formDueDate.trim() || undefined,
          status: formStatus,
          notes: formNotes.trim() || undefined,
          createdDate: new Date().toISOString().split("T")[0],
          fulfilledDate: (formStatus === "Fulfilled" || formStatus === "Completed") ? new Date().toISOString().split("T")[0] : undefined,
          completedDate: (formStatus === "Fulfilled" || formStatus === "Completed") ? new Date().toISOString().split("T")[0] : undefined
        };
        updatedPromises = [newCmt, ...currentPromises];
      }

      return {
        ...c,
        promises: updatedPromises,
        commitments: updatedPromises
      };
    });

    onUpdateClients(updatedClients);
    setShowForm(false);
    setEditingCmt(null);
  };

  const handleToggleStatus = (client: Client, cmt: ClientPromise) => {
    const nextStatus: PromiseStatus = (cmt.status === "Open" || (cmt.status as any) === "Pending") ? "Fulfilled" : "Open";
    const today = new Date().toISOString().split("T")[0];

    const updatedClients = clients.map(c => {
      if (c.id !== client.id) return c;
      const current = getClientPromises(c);
      const updated = current.map(p => 
        p.id === cmt.id 
          ? {
              ...p,
              status: nextStatus,
              fulfilledDate: nextStatus === "Fulfilled" ? today : undefined,
              completedDate: nextStatus === "Fulfilled" ? today : undefined
            }
          : p
      );
      return { ...c, promises: updated, commitments: updated };
    });

    onUpdateClients(updatedClients);
  };

  const handleDeleteCmt = (client: Client, cmtId: string) => {
    if (!confirm("Are you sure you want to delete this Client Commitment (CMT)?")) return;

    const updatedClients = clients.map(c => {
      if (c.id !== client.id) return c;
      const current = getClientPromises(c);
      const filtered = current.filter(p => p.id !== cmtId);
      return { ...c, promises: filtered, commitments: filtered };
    });

    onUpdateClients(updatedClients);
  };

  const content = (
    <div className={`bg-white text-left ${isEmbeddedInSettings ? "p-6 rounded-3xl border border-slate-200/80 shadow-sm" : "rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col relative animate-fade-in"}`}>
      
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-amber-100 text-amber-900 rounded-2xl shadow-2xs">
            <HeartHandshake className="w-5 h-5 text-amber-600" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">CMT Management (Client Commitments)</h3>
            <p className="text-xs text-slate-500 font-medium">
              Client Promises & Obligations • {openCount} Open CMTs Across {clients.length} Clients
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Prominent + CREATE CMT Button */}
          <button
            type="button"
            onClick={openCreateForm}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ CREATE CMT</span>
          </button>

          {!isEmbeddedInSettings && onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Inline Create/Edit Form Card */}
      {showForm && (
        <form onSubmit={handleSaveCmt} className="mb-5 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-3.5 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
              {editingCmt ? "Edit Client Commitment (CMT)" : "Create New Client Commitment (CMT)"}
            </h4>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1 hover:bg-amber-200/60 rounded-lg text-amber-800 transition-colors text-xs font-bold"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold">
              ⚠️ {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Select Client */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                Associated Client <span className="text-rose-500">*</span>
              </label>
              <select
                value={formClientId}
                onChange={e => setFormClientId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Select Client from Directory --</option>
                {clients.map(c => {
                  const company = (c as any).companyName || (c as any).company || "";
                  return (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} {company ? `(${company})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                CMT Status
              </label>
              <select
                value={formStatus}
                onChange={e => setFormStatus(e.target.value as PromiseStatus)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Open">Open (Outstanding)</option>
                <option value="Fulfilled">Fulfilled (Completed)</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Commitment Description */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
              Commitment / Promise Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formCommitment}
              onChange={e => setFormCommitment(e.target.value)}
              placeholder="e.g. Free delivery on next order, 10% loyalty gift voucher, replacement leather journal"
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Due Date */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                Due / Target Date (Optional)
              </label>
              <input
                type="date"
                value={formDueDate}
                onChange={e => setFormDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">
                Operator Notes / Context (Optional)
              </label>
              <input
                type="text"
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                placeholder="e.g. Agreed during VIP meeting on July 15th"
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-slate-950 hover:bg-slate-800 text-amber-300 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {editingCmt ? "Update CMT" : "Save CMT to Client"}
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 shrink-0">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(["All", "Open", "Fulfilled", "Cancelled"] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                filterStatus === st
                  ? "bg-white text-slate-950 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {st} {st === "Open" && `(${openCount})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search CMTs or client names..."
              className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* CMT List View */}
      <div className={`overflow-y-auto space-y-2.5 pr-1 ${isEmbeddedInSettings ? "max-h-[500px]" : "flex-1"}`}>
        {filteredCmts.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No CMTs Found</p>
            <p className="text-xs text-slate-500">
              {filterStatus === "Open" 
                ? "No outstanding client commitments recorded." 
                : "No client commitments match your active filters."}
            </p>
            <button
              type="button"
              onClick={openCreateForm}
              className="mt-2 px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First CMT</span>
            </button>
          </div>
        ) : (
          filteredCmts.map(({ client, cmt }) => {
            const isOpenCmt = cmt.status === "Open" || (cmt.status as any) === "Pending";
            const isFulfilledCmt = cmt.status === "Fulfilled" || cmt.status === "Completed";

            return (
              <div
                key={`${client.id}-${cmt.id}`}
                className={`p-3.5 rounded-2xl border transition-all text-left ${
                  isOpenCmt
                    ? "bg-amber-50/60 border-amber-200/90 hover:bg-amber-50"
                    : isFulfilledCmt
                      ? "bg-emerald-50/40 border-emerald-200/70 opacity-80"
                      : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(client, cmt)}
                      title={isOpenCmt ? "Mark as Fulfilled" : "Reopen CMT"}
                      className={`mt-0.5 p-1.5 rounded-xl border transition-all shrink-0 cursor-pointer ${
                        isFulfilledCmt
                          ? "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600"
                          : "bg-white text-slate-400 border-slate-300 hover:border-amber-500 hover:text-amber-600"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="space-y-1 flex-1 min-w-0">
                      {/* Client Badge with Link to Client Directory */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (onClose) onClose();
                            if (onNavigateToClient) onNavigateToClient(client.id);
                          }}
                          className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1 transition-all cursor-pointer"
                          title="View Client in Directory"
                        >
                          <User className="w-3 h-3 text-amber-700" />
                          <span>Client: {client.firstName} {client.lastName}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                        </button>

                        <span className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                          isOpenCmt
                            ? "bg-amber-200/80 text-amber-950 border-amber-300"
                            : isFulfilledCmt
                              ? "bg-emerald-200/80 text-emerald-950 border-emerald-300"
                              : "bg-rose-200/80 text-rose-950 border-rose-300"
                        }`}>
                          {cmt.status === "Completed" ? "Fulfilled" : cmt.status}
                        </span>
                      </div>

                      <h4 className={`text-xs font-black ${isFulfilledCmt ? "line-through text-slate-500" : "text-slate-900"} break-words`}>
                        • {cmt.promise || cmt.commitment}
                      </h4>

                      {cmt.notes && (
                        <p className="text-xs text-slate-600 italic leading-relaxed break-words">{cmt.notes}</p>
                      )}

                      <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-0.5 flex-wrap font-mono">
                        {cmt.dueDate ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            Due: <strong className="text-slate-800">{cmt.dueDate}</strong>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No fixed due date</span>
                        )}
                        {cmt.createdDate && <span>Created {cmt.createdDate}</span>}
                        {(cmt.fulfilledDate || cmt.completedDate) && (
                          <span className="text-emerald-700 font-bold">Fulfilled {cmt.fulfilledDate || cmt.completedDate}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditForm(client, cmt)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-all cursor-pointer"
                      title="Edit CMT"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCmt(client, cmt.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      title="Delete CMT"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!isEmbeddedInSettings && (
        <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            Close CMT Management
          </button>
        </div>
      )}
    </div>
  );

  if (isEmbeddedInSettings) {
    return content;
  }

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      {content}
    </div>
  );
}
