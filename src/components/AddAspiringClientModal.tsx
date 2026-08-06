import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AspiringClient, AspiringClientStatus } from "../types";
import { formatInstagramUsername } from "../utils/contactUtils";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { 
  X, 
  Sparkles, 
  User, 
  Phone, 
  Instagram, 
  Mail, 
  Calendar, 
  Tag, 
  FileText, 
  AlertCircle,
  MessageSquare,
  UserCheck,
  Check
} from "lucide-react";

interface AddAspiringClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newClientData: Omit<AspiringClient, "id">) => void;
  editingClient?: AspiringClient | null;
  onUpdate?: (updatedClient: AspiringClient) => void;
}

export default function AddAspiringClientModal({
  isOpen,
  onClose,
  onSave,
  editingClient,
  onUpdate
}: AddAspiringClientModalProps) {
  useBodyScrollLock(isOpen);
  const [formError, setFormError] = useState<string>("");

  const [formData, setFormData] = useState<Omit<AspiringClient, "id">>({
    name: "",
    phoneNumber: "",
    email: "",
    instagramUsername: "",
    preferredContactMethod: "Instagram",
    contactInfo: "",
    sourceOfInquiry: "Instagram",
    serviceInterestedIn: "Custom T-Shirts & Apparel",
    dateContacted: new Date().toISOString().split("T")[0],
    notes: "",
    assignedUser: "Chief Executive Officer",
    status: "New Inquiry",
    followUpDate: new Date().toISOString().split("T")[0],
    clientHome: "CEO Lifestyle"
  });

  useEffect(() => {
    if (editingClient) {
      setFormData({
        name: editingClient.name || "",
        phoneNumber: editingClient.phoneNumber || "",
        email: editingClient.email || "",
        instagramUsername: editingClient.instagramUsername || "",
        preferredContactMethod: editingClient.preferredContactMethod || "Instagram",
        contactInfo: editingClient.contactInfo || "",
        sourceOfInquiry: editingClient.sourceOfInquiry || "Instagram",
        serviceInterestedIn: editingClient.serviceInterestedIn || "Custom T-Shirts & Apparel",
        dateContacted: editingClient.dateContacted || new Date().toISOString().split("T")[0],
        notes: editingClient.notes || "",
        assignedUser: editingClient.assignedUser || "Chief Executive Officer",
        status: editingClient.status || "New Inquiry",
        followUpDate: editingClient.followUpDate || new Date().toISOString().split("T")[0],
        clientHome: editingClient.clientHome || "CEO Lifestyle"
      });
    } else {
      setFormData({
        name: "",
        phoneNumber: "",
        email: "",
        instagramUsername: "",
        preferredContactMethod: "Instagram",
        contactInfo: "",
        sourceOfInquiry: "Instagram",
        serviceInterestedIn: "Custom T-Shirts & Apparel",
        dateContacted: new Date().toISOString().split("T")[0],
        notes: "",
        assignedUser: "Chief Executive Officer",
        status: "New Inquiry",
        followUpDate: new Date().toISOString().split("T")[0],
        clientHome: "CEO Lifestyle"
      });
    }
    setFormError("");
  }, [editingClient, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Client Full Name is required.");
      return;
    }

    // Format Instagram handle if typed without @
    let formattedInsta = formData.instagramUsername ? formData.instagramUsername.trim() : "";
    if (formattedInsta) {
      formattedInsta = formatInstagramUsername(formattedInsta);
    }

    const payload = {
      ...formData,
      name: formData.name.trim(),
      instagramUsername: formattedInsta
    };

    if (editingClient && onUpdate) {
      onUpdate({
        ...editingClient,
        ...payload
      });
    } else {
      onSave(payload);
    }

    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div 
        className="bg-white border border-slate-200/80 rounded-[2rem] sm:rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto text-left transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-pink-50 text-pink-600 rounded-2xl border border-pink-100/80">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {editingClient ? "Edit Aspiring Prospect" : "➕ Add Aspiring Prospect"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {editingClient ? "Update lead inquiry & schedule details" : "Quick capture new lead inquiry without leaving screen"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-rose-800 text-xs font-bold animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Client Name Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <User className="w-3 h-3 text-indigo-500" /> Client Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Samantha Wright"
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Contact Details Card */}
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70 space-y-3">
            <div className="flex items-center justify-between border-b pb-2 border-slate-200/60">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-indigo-600" /> Contact Channels
              </span>
              <span className="text-[9px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-bold border border-indigo-100">
                Direct Lead Channels
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber || ""}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="e.g. +1 (876) 555-0192"
                  className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Instagram Username */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-pink-600 flex items-center gap-1">
                  <Instagram className="w-3 h-3" /> Instagram Handle (Optional)
                </label>
                <input
                  type="text"
                  value={formData.instagramUsername || ""}
                  onChange={(e) => setFormData({ ...formData, instagramUsername: e.target.value })}
                  onBlur={() => {
                    if (formData.instagramUsername) {
                      setFormData({ ...formData, instagramUsername: formatInstagramUsername(formData.instagramUsername) });
                    }
                  }}
                  placeholder="e.g. @ceoprinter"
                  className="w-full bg-white border border-pink-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:border-pink-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. samantha@example.com"
                  className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Preferred Contact Method */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                  Preferred Contact Method
                </label>
                <select
                  value={formData.preferredContactMethod || "Instagram"}
                  onChange={(e) => setFormData({ ...formData, preferredContactMethod: e.target.value })}
                  className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-none transition-colors"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="Phone Call">Phone Call</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="SMS">SMS</option>
                  <option value="Email">Email</option>
                  <option value="In Person">In Person</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Initial Interest & Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Tag className="w-3 h-3 text-emerald-600" /> Initial Interest / Product *
            </label>
            <input
              type="text"
              required
              value={formData.serviceInterestedIn}
              onChange={(e) => setFormData({ ...formData, serviceInterestedIn: e.target.value })}
              placeholder="e.g. Custom Executive Polos, Librarium Books, Leather Binding"
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Inquiry Source, Client Home & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Client Home
              </label>
              <select
                value={formData.clientHome || "CEO Lifestyle"}
                onChange={(e) => setFormData({ ...formData, clientHome: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
              >
                <option value="CEO Lifestyle">CEO Lifestyle</option>
                <option value="Librarium Luxe">Librarium Luxe</option>
                <option value="CEO Lifestyle | Librarium Luxe">CEO Lifestyle | Librarium Luxe</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Source of Inquiry
              </label>
              <select
                value={formData.sourceOfInquiry}
                onChange={(e) => setFormData({ ...formData, sourceOfInquiry: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
              >
                <option value="Instagram">Instagram</option>
                <option value="Referral">Referral</option>
                <option value="Website">Website</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Phone Call">Phone Call</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Current Lead Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as AspiringClientStatus })}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
              >
                <option value="New Inquiry">New Inquiry</option>
                <option value="Follow Up Required">Follow Up Required</option>
                <option value="Awaiting Response">Awaiting Response</option>
                <option value="Interested">Interested</option>
                <option value="Converted to Client">Converted to Client</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Schedule Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" /> Date Contacted
              </label>
              <input
                type="date"
                value={formData.dateContacted}
                onChange={(e) => setFormData({ ...formData, dateContacted: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-500" /> Follow-Up Schedule Date
              </label>
              <input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                className="w-full bg-slate-50 border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Assigned Team Member */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-slate-500" /> Assigned Executive / Staff
            </label>
            <input
              type="text"
              value={formData.assignedUser}
              onChange={(e) => setFormData({ ...formData, assignedUser: e.target.value })}
              placeholder="e.g. Chief Executive Officer"
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-500" /> Lead Notes &amp; Inquiry Details
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Record initial request details, pricing quote given, preferences..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingClient ? "Save Changes" : "Save Aspiring Client"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
