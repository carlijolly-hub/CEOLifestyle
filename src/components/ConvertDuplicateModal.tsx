import React, { useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, UserCheck, UserPlus, X, Link, Phone, Mail, Sparkles, Building2 } from "lucide-react";
import { AspiringClient, Client } from "../types";

interface ConvertDuplicateModalProps {
  isOpen: boolean;
  aspiringClient: AspiringClient | null;
  matchedClients: Client[];
  onClose: () => void;
  onLinkToExisting: (targetClient: Client) => void;
  onCreateNew: () => void;
}

export default function ConvertDuplicateModal({
  isOpen,
  aspiringClient,
  matchedClients,
  onClose,
  onLinkToExisting,
  onCreateNew
}: ConvertDuplicateModalProps) {
  const [selectedClientForLinking, setSelectedClientForLinking] = useState<Client | null>(() => {
    return matchedClients.length > 0 ? matchedClients[0] : null;
  });

  if (!isOpen || !aspiringClient) return null;

  const currentSelected = selectedClientForLinking || matchedClients[0];

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div 
        className="bg-white border border-amber-200/80 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-auto text-left transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider border border-amber-200 mb-1">
                Possible Duplicate Client
              </div>
              <h3 className="text-base font-black text-slate-900">Matching Client Profile Found</h3>
              <p className="text-xs text-slate-500 font-medium">
                We found existing client profile(s) matching <strong className="text-slate-800">{aspiringClient.name}</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Summary */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs space-y-1">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Converting Prospect Lead</div>
          <div className="font-bold text-slate-900 text-sm">{aspiringClient.name}</div>
          <div className="text-slate-600 flex flex-wrap gap-x-3 gap-y-1 pt-0.5 text-[11px]">
            {aspiringClient.phoneNumber && <span>📞 {aspiringClient.phoneNumber}</span>}
            {aspiringClient.email && <span>✉️ {aspiringClient.email}</span>}
            {aspiringClient.instagramUsername && <span>📸 {aspiringClient.instagramUsername}</span>}
          </div>
          {aspiringClient.serviceInterestedIn && (
            <div className="text-indigo-700 font-medium pt-1 text-[11px]">
              Interested in: <strong>{aspiringClient.serviceInterestedIn}</strong>
            </div>
          )}
        </div>

        {/* Matched Clients List */}
        <div className="space-y-2">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Existing Client Profile(s) Matched ({matchedClients.length}):
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {matchedClients.map((client) => {
              const isSelected = currentSelected?.id === client.id;
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClientForLinking(client)}
                  className={`border rounded-2xl p-3 text-xs transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected 
                      ? "border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500/20" 
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {client.firstName} {client.lastName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                        {client.id}
                      </span>
                      {client.tier && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                          {client.tier}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 text-[11px] flex flex-wrap gap-x-3 gap-y-0.5">
                      {client.contact?.phoneNumber && (
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {client.contact.phoneNumber}</span>
                      )}
                      {client.contact?.email && (
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {client.contact.email}</span>
                      )}
                      {(client.clientHome || client.homeBrand) && (
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {client.clientHome || client.homeBrand}</span>
                      )}
                    </div>
                  </div>
                  <div className="pt-1">
                    <input
                      type="radio"
                      name="matchedClientSelect"
                      checked={isSelected}
                      onChange={() => setSelectedClientForLinking(client)}
                      className="accent-indigo-600 w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Choices */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-500 text-center font-medium">
            How would you like to handle this conversion?
          </p>

          <button
            type="button"
            onClick={() => currentSelected && onLinkToExisting(currentSelected)}
            disabled={!currentSelected}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Link className="w-4 h-4" />
            Connect & Link History to {currentSelected ? `${currentSelected.firstName} ${currentSelected.lastName}` : "Existing Client"}
          </button>

          <button
            type="button"
            onClick={onCreateNew}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 border border-slate-200 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-slate-600" />
            Create Brand New Client Profile
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-slate-400 hover:text-slate-600 font-medium py-1 text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
