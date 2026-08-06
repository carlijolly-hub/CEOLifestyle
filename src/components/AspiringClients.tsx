import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Calendar, 
  Phone, 
  Mail, 
  Tag, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Edit, 
  Trash2, 
  UserCheck, 
  MessageSquare, 
  X,
  ChevronDown,
  RefreshCw,
  Award,
  AtSign,
  Instagram,
  MessageCircle,
  Globe,
  Archive,
  History,
  FileText,
  Clipboard,
  AlertTriangle
} from "lucide-react";
import UniversalPasteModal from "./UniversalPasteModal";
import { AspiringClient, AspiringClientStatus, Client, FollowUpRecord } from "../types";
import { formatInstagramUsername, getAspiringContactDisplay } from "../utils/contactUtils";
import AddAspiringClientModal from "./AddAspiringClientModal";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

interface AspiringClientsProps {
  aspiringClients: AspiringClient[];
  setAspiringClients: React.Dispatch<React.SetStateAction<AspiringClient[]>>;
  onConvertToClient: (aspiringClient: AspiringClient) => void;
  onNavigateToCalendar?: () => void;
  autoOpenAddModal?: boolean;
  onResetAutoOpenAdd?: () => void;
}

const DEFAULT_ASPIRING_CLIENTS: AspiringClient[] = [
  {
    id: "ASP001",
    name: "Samantha Wright",
    contactInfo: "+1 (876) 555-0192 | samantha.w@example.com",
    sourceOfInquiry: "Instagram",
    serviceInterestedIn: "Custom Executive T-Shirts & Polos",
    dateContacted: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`,
    notes: "Requested a quote for 50 corporate embroidery polo shirts for annual retreat.",
    assignedUser: "Chief Executive Officer",
    status: "Follow Up Required",
    followUpDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`,
    followUpCount: 1,
    lastContactDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`
  },
  {
    id: "ASP002",
    name: "Marcus Sterling",
    contactInfo: "+1 (876) 555-0841 | m.sterling@luxeholdings.com",
    sourceOfInquiry: "Referral",
    serviceInterestedIn: "Librarium Luxe Bespoke Hardcover Set",
    dateContacted: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-10`,
    notes: "Inquired about custom leather-bound edition of 10 collector books for private library.",
    assignedUser: "Librarium Specialist",
    status: "Interested",
    followUpDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(Math.min(28, new Date().getDate() + 3)).padStart(2, "0")}`,
    followUpCount: 2,
    lastContactDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-10`
  },
  {
    id: "ASP003",
    name: "Dr. Aris Thorne",
    contactInfo: "+1 (876) 555-9201 | dr.thorne@medtech.jm",
    sourceOfInquiry: "Website",
    serviceInterestedIn: "Location Delivery & Production Printing",
    dateContacted: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-05`,
    notes: "Inquired regarding large format print layout and delivery to Montego Bay facility.",
    assignedUser: "Logistics Manager",
    status: "Awaiting Response",
    followUpDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(Math.min(28, new Date().getDate() + 5)).padStart(2, "0")}`,
    followUpCount: 0
  }
];

export default function AspiringClients({
  aspiringClients,
  setAspiringClients,
  onConvertToClient,
  onNavigateToCalendar,
  autoOpenAddModal,
  onResetAutoOpenAdd
}: AspiringClientsProps) {
  // Always reset scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [preferredContactFilter, setPreferredContactFilter] = useState<string>("all");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<AspiringClient | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState<AspiringClient | null>(null);
  const [newFollowUpDate, setNewFollowUpDate] = useState("");
  const [formError, setFormError] = useState<string>("");
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);

  const handleConfirmPasteLeads = (pastedLeads: AspiringClient[]) => {
    if (pastedLeads.length === 0) return;
    setAspiringClients(prev => [...pastedLeads, ...prev]);
  };

  // Follow-Up Lifecycle Modals
  const [loggingFollowUpClient, setLoggingFollowUpClient] = useState<AspiringClient | null>(null);
  const [followUpMethod, setFollowUpMethod] = useState<string>("Phone Call");
  const [followUpNotes, setFollowUpNotes] = useState<string>("");
  const [followUpNextDate, setFollowUpNextDate] = useState<string>("");

  const [archivingClient, setArchivingClient] = useState<AspiringClient | null>(null);
  const [archiveReasonSelected, setArchiveReasonSelected] = useState<string>("No Response");

  const [viewHistoryClient, setViewHistoryClient] = useState<AspiringClient | null>(null);

  const isAnyModalOpen = !!(showAddModal || editingClient || showScheduleModal || isPasteModalOpen || loggingFollowUpClient || archivingClient || viewHistoryClient);
  useBodyScrollLock(isAnyModalOpen);

  useEffect(() => {
    if (autoOpenAddModal) {
      setEditingClient(null);
      setShowAddModal(true);
      if (onResetAutoOpenAdd) {
        onResetAutoOpenAdd();
      }
    }
  }, [autoOpenAddModal, onResetAutoOpenAdd]);

  // Form fields
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
    followUpDate: new Date().toISOString().split("T")[0]
  });

  const realTodayStr = new Date().toISOString().split("T")[0];

  // Helper status color styling
  const getStatusBadge = (status: AspiringClientStatus) => {
    switch (status) {
      case "New Inquiry":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "Follow Up Required":
        return "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
      case "Awaiting Response":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Interested":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Converted to Client":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 font-black";
      case "Not Interested":
        return "bg-slate-100 text-slate-500 border-slate-200";
      case "Archived":
        return "bg-slate-100 text-slate-400 border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // Metrics
  const totalLeads = aspiringClients.length;
  const pendingFollowUps = aspiringClients.filter(c => 
    c.followUpDate <= realTodayStr && 
    c.status !== "Converted to Client" && 
    c.status !== "Archived" &&
    c.status !== "Not Interested"
  ).length;
  const interestedLeads = aspiringClients.filter(c => c.status === "Interested").length;
  const convertedLeads = aspiringClients.filter(c => c.status === "Converted to Client").length;

  // Filtered List
  const filteredClients = aspiringClients.filter(c => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      c.name.toLowerCase().includes(query) ||
      c.serviceInterestedIn.toLowerCase().includes(query) ||
      c.contactInfo.toLowerCase().includes(query) ||
      (c.phoneNumber && c.phoneNumber.toLowerCase().includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.instagramUsername && c.instagramUsername.toLowerCase().includes(query)) ||
      c.notes.toLowerCase().includes(query);

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesSource = sourceFilter === "all" || c.sourceOfInquiry === sourceFilter;
    const matchesPreferredContact = preferredContactFilter === "all" || 
      (c.preferredContactMethod || "Instagram") === preferredContactFilter;

    return matchesSearch && matchesStatus && matchesSource && matchesPreferredContact;
  });

  // Handle Save (Add or Edit)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Full Name is required.");
      return;
    }

    const phone = (formData.phoneNumber || "").trim();
    const email = (formData.email || "").trim();
    const rawIg = (formData.instagramUsername || "").trim();
    const formattedIg = formatInstagramUsername(rawIg);
    const legacyContact = (formData.contactInfo || "").trim();

    // Mandatory contact validation: At least one contact method must be provided
    if (!phone && !email && !formattedIg && !legacyContact) {
      setFormError("At least ONE contact method (Phone Number, Email Address, or Instagram Username) must be provided.");
      return;
    }

    // Build contactInfo summary for backwards compatibility
    let summaryContact = legacyContact;
    if (!summaryContact) {
      const parts = [];
      if (phone) parts.push(phone);
      if (email) parts.push(email);
      if (formattedIg) parts.push(formattedIg);
      summaryContact = parts.join(" | ");
    }

    const updatedPayload = {
      ...formData,
      phoneNumber: phone,
      email: email,
      instagramUsername: formattedIg,
      contactInfo: summaryContact
    };

    if (editingClient) {
      setAspiringClients(prev => prev.map(item => item.id === editingClient.id ? { ...editingClient, ...updatedPayload } : item));
      setEditingClient(null);
    } else {
      const newEntry: AspiringClient = {
        id: `ASP${String(Date.now()).slice(-4)}`,
        ...updatedPayload
      };
      setAspiringClients(prev => [newEntry, ...prev]);
    }

    setShowAddModal(false);
    // Reset form
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
      followUpDate: new Date().toISOString().split("T")[0]
    });
  };

  const handleOpenEdit = (client: AspiringClient) => {
    setEditingClient(client);
    setFormError("");
    setFormData({
      name: client.name,
      phoneNumber: client.phoneNumber || "",
      email: client.email || "",
      instagramUsername: client.instagramUsername || "",
      preferredContactMethod: client.preferredContactMethod || (client.sourceOfInquiry === "Instagram" ? "Instagram" : "Phone Call"),
      contactInfo: client.contactInfo || "",
      sourceOfInquiry: client.sourceOfInquiry || "Instagram",
      serviceInterestedIn: client.serviceInterestedIn,
      dateContacted: client.dateContacted,
      notes: client.notes,
      assignedUser: client.assignedUser,
      status: client.status,
      followUpDate: client.followUpDate
    });
    setShowAddModal(true);
  };

  const handleStatusChange = (clientId: string, newStatus: AspiringClientStatus) => {
    setAspiringClients(prev => prev.map(c => c.id === clientId ? { ...c, status: newStatus } : c));
  };

  const handleLogFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggingFollowUpClient) return;

    const newCount = (loggingFollowUpClient.followUpCount || 0) + 1;
    const newRecord: FollowUpRecord = {
      id: `FU_${Date.now()}`,
      attemptNumber: newCount,
      date: realTodayStr,
      method: followUpMethod,
      notes: followUpNotes.trim() || `Attempt ${newCount} logged via ${followUpMethod}.`,
      recordedBy: "Master Administrator"
    };

    setAspiringClients(prev => prev.map(c => {
      if (c.id === loggingFollowUpClient.id) {
        return {
          ...c,
          followUpCount: newCount,
          lastContactDate: realTodayStr,
          followUpDate: followUpNextDate || c.followUpDate,
          followUpHistory: [...(c.followUpHistory || []), newRecord],
          status: newCount >= 3 ? "Follow Up Required" : c.status
        };
      }
      return c;
    }));

    setLoggingFollowUpClient(null);
    setFollowUpNotes("");
    setFollowUpNextDate("");
  };

  const handleArchiveClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivingClient) return;

    if (archiveReasonSelected === "Keep Active") {
      handleKeepActive(archivingClient);
      setArchivingClient(null);
      return;
    }

    setAspiringClients(prev => prev.map(c => {
      if (c.id === archivingClient.id) {
        return {
          ...c,
          status: archiveReasonSelected === "Not Interested" ? "Not Interested" : "Archived",
          archiveReason: archiveReasonSelected,
          archivedDate: realTodayStr
        };
      }
      return c;
    }));

    setArchivingClient(null);
  };

  const handleKeepActive = (client: AspiringClient) => {
    setAspiringClients(prev => prev.map(c => {
      if (c.id === client.id) {
        return {
          ...c,
          followUpCount: 0,
          status: "Interested",
          notes: `${c.notes || ''}\n[${realTodayStr}] Extended active pipeline by Master Administrator.`
        };
      }
      return c;
    }));
  };

  const handleScheduleFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showScheduleModal || !newFollowUpDate) return;

    setAspiringClients(prev => prev.map(c => {
      if (c.id === showScheduleModal.id) {
        return {
          ...c,
          followUpDate: newFollowUpDate,
          status: c.status === "New Inquiry" ? "Follow Up Required" : c.status
        };
      }
      return c;
    }));

    setShowScheduleModal(null);
    setNewFollowUpDate("");
  };

  const handleDeleteClient = (clientId: string) => {
    if (confirm("Are you sure you want to remove this aspiring client lead?")) {
      setAspiringClients(prev => prev.filter(c => c.id !== clientId));
    }
  };

  return (
    <div id="aspiring-clients-header-section" className="space-y-6 animate-fade-in text-left pb-10 scroll-mt-28">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
                <Sparkles className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                Opportunity Pipeline
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Aspiring Clients &amp; Leads
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl font-medium">
              Track potential future customers, manage follow-up schedules, sync calendar reminders, and convert leads into active portfolio clients.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPasteModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Clipboard className="w-4 h-4 text-emerald-200" />
              Paste From Excel
            </button>
            <button
              onClick={() => {
                setEditingClient(null);
                setFormData({
                  name: "",
                  contactInfo: "",
                  sourceOfInquiry: "Instagram",
                  serviceInterestedIn: "Custom T-Shirts & Apparel",
                  dateContacted: new Date().toISOString().split("T")[0],
                  notes: "",
                  assignedUser: "Chief Executive Officer",
                  status: "New Inquiry",
                  followUpDate: new Date().toISOString().split("T")[0]
                });
                setShowAddModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg hover:shadow-indigo-500/30 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Add Aspiring Prospect
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold mb-1">
            <span>Total Prospects</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalLeads}</div>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Active opportunity pipeline</p>
        </div>

        <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold mb-1">
            <span>Follow-Ups Due</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{pendingFollowUps}</div>
          <p className="text-[10px] text-amber-600/80 font-bold mt-0.5">Scheduled for today or overdue</p>
        </div>

        <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold mb-1">
            <span>Interested Leads</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{interestedLeads}</div>
          <p className="text-[10px] text-emerald-600/80 font-bold mt-0.5">High conversion probability</p>
        </div>

        <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold mb-1">
            <span>Converted Clients</span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600">{convertedLeads}</div>
          <p className="text-[10px] text-indigo-600/80 font-bold mt-0.5">Transferred to main CRM</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, @instagram, phone, email, service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
          >
            <option value="all">All Statuses</option>
            <option value="New Inquiry">New Inquiry</option>
            <option value="Follow Up Required">Follow Up Required</option>
            <option value="Awaiting Response">Awaiting Response</option>
            <option value="Interested">Interested</option>
            <option value="Converted to Client">Converted to Client</option>
            <option value="Not Interested">Not Interested</option>
            <option value="Archived">Archived</option>
          </select>

          {/* Preferred Contact Method Filter */}
          <select
            value={preferredContactFilter}
            onChange={(e) => setPreferredContactFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
          >
            <option value="all">All Contact Methods</option>
            <option value="Instagram">Preferred: Instagram</option>
            <option value="Phone Call">Preferred: Phone Call</option>
            <option value="WhatsApp">Preferred: WhatsApp</option>
            <option value="SMS">Preferred: SMS</option>
            <option value="Email">Preferred: Email</option>
            <option value="In Person">Preferred: In Person</option>
            <option value="Other">Preferred: Other</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
          >
            <option value="all">All Inquiry Sources</option>
            <option value="Instagram">Instagram</option>
            <option value="Referral">Referral</option>
            <option value="Website">Website</option>
            <option value="Walk-in">Walk-in</option>
            <option value="Phone Call">Phone Call</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Prospect Cards Grid */}
      {filteredClients.length === 0 ? (
        <div className="bg-white border border-slate-200/70 rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Aspiring Clients Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No prospect records match your current filters. Add a new aspiring client or clear filters to view existing leads.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const isFollowUpDue = client.followUpDate <= realTodayStr && client.status !== "Converted to Client" && client.status !== "Archived";
            const contactInfoDisp = getAspiringContactDisplay(client);

            return (
              <div 
                key={client.id}
                className={`bg-white border rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative ${
                  isFollowUpDue ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200/70"
                }`}
              >
                {/* Header info */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[9px] font-black font-mono text-slate-400 uppercase tracking-widest block">
                        {client.id}
                      </span>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">
                        {client.name}
                      </h3>
                    </div>

                    <select
                      value={client.status}
                      onChange={(e) => handleStatusChange(client.id, e.target.value as AspiringClientStatus)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer ${getStatusBadge(client.status)}`}
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

                  {/* Primary Service Interested In */}
                  <div className="flex items-center gap-1.5 text-xs text-indigo-900 font-bold bg-indigo-50/70 px-3 py-1.5 rounded-xl border border-indigo-100">
                    <Tag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">{client.serviceInterestedIn}</span>
                  </div>

                  {/* Preferred Contact Badge & Details */}
                  <div className="text-xs text-slate-600 font-medium space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-400 uppercase tracking-wider text-[9px]">Preferred Contact</span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-extrabold flex items-center gap-1">
                        {contactInfoDisp.preferredMethod === "Instagram" && <Instagram className="w-3 h-3 text-pink-600" />}
                        {contactInfoDisp.preferredMethod === "WhatsApp" && <MessageCircle className="w-3 h-3 text-emerald-600" />}
                        {(contactInfoDisp.preferredMethod === "Phone Call" || contactInfoDisp.preferredMethod === "SMS") && <Phone className="w-3 h-3 text-blue-600" />}
                        {contactInfoDisp.preferredMethod === "Email" && <Mail className="w-3 h-3 text-amber-600" />}
                        {contactInfoDisp.preferredMethod}
                      </span>
                    </div>

                    {/* Social / Direct Handle if available */}
                    {client.instagramUsername && (
                      <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs pt-0.5">
                        <Instagram className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                        <span className="text-pink-700 bg-pink-50 px-2 py-0.5 rounded-lg border border-pink-100 font-mono">
                          {client.instagramUsername}
                        </span>
                      </div>
                    )}

                    {/* Phone Number */}
                    {client.phoneNumber && (
                      <div className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{client.phoneNumber}</span>
                      </div>
                    )}

                    {/* Email */}
                    {client.email && (
                      <div className="flex items-center gap-1.5 text-slate-700 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}

                    {/* Fallback legacy string if no specific fields exist */}
                    {!client.instagramUsername && !client.phoneNumber && !client.email && client.contactInfo && (
                      <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{client.contactInfo}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes & Source */}
                  {client.notes && (
                    <p className="text-xs text-slate-600 italic line-clamp-2 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/60">
                      "{client.notes}"
                    </p>
                  )}

                  {/* Metadata pills */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block font-bold uppercase">Source</span>
                      <span className="font-bold text-slate-800">{client.sourceOfInquiry}</span>
                    </div>
                    <div className={`p-2 rounded-lg border ${isFollowUpDue ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-slate-50 border-slate-100 text-slate-800"}`}>
                      <span className="text-slate-400 block font-bold uppercase flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Follow-Up
                      </span>
                      <span className="font-bold">{client.followUpDate}</span>
                    </div>
                  </div>

                  {/* Follow-Up Attempts Tracker */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-indigo-600" />
                        Follow-Up Attempts
                      </span>
                      <span className={`px-2 py-0.5 rounded font-mono font-black ${
                        (client.followUpCount || 0) >= 3 
                          ? "bg-rose-100 text-rose-800 border border-rose-200" 
                          : "bg-indigo-100 text-indigo-800"
                      }`}>
                        {client.followUpCount || 0} / 3
                      </span>
                    </div>
                    
                    {client.lastContactDate && (
                      <span className="text-[9px] text-slate-400 font-medium block">
                        Last Contact: {client.lastContactDate}
                      </span>
                    )}

                    {/* Progress Dots */}
                    <div className="flex gap-1 pt-0.5">
                      {[1, 2, 3].map((num) => (
                        <div 
                          key={num}
                          className={`h-1.5 flex-1 rounded-full ${
                            (client.followUpCount || 0) >= num 
                              ? (num === 3 ? "bg-rose-500" : "bg-indigo-600") 
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Follow-Up Limit Reached Warning Notice */}
                  {(client.followUpCount || 0) >= 3 && client.status !== "Converted to Client" && client.status !== "Archived" && client.status !== "Not Interested" && (
                    <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-3 space-y-2 text-xs text-rose-900 animate-fade-in">
                      <div className="flex items-center gap-1.5 font-black text-rose-800">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Follow-Up Limit Reached</span>
                      </div>
                      <p className="text-[11px] text-rose-700 font-medium leading-relaxed">
                        This aspiring client has received 3 follow-up attempts. Review history and decide whether to archive.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setArchivingClient(client);
                            setArchiveReasonSelected("No Response");
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-extrabold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <Archive className="w-3 h-3" />
                          <span>Archive Lead</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleKeepActive(client)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer"
                        >
                          Keep Active
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {client.status !== "Converted to Client" && (
                    <button
                      onClick={() => onConvertToClient(client)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      title="Convert lead to official client portfolio"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Convert to Client Portfolio
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold">
                    <button
                      onClick={() => {
                        setLoggingFollowUpClient(client);
                        setFollowUpMethod(client.preferredContactMethod || "Phone Call");
                        setFollowUpNotes("");
                        setFollowUpNextDate(client.followUpDate || realTodayStr);
                      }}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer border border-indigo-200/60"
                      title="Log contact attempt"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Log Attempt</span>
                    </button>

                    <button
                      onClick={() => setViewHistoryClient(client)}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-700 py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer border border-slate-200/60"
                      title="View follow-up log history"
                    >
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>History ({client.followUpHistory?.length || 0})</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px] pt-1 border-t border-slate-100/60">
                    <button
                      onClick={() => {
                        setShowScheduleModal(client);
                        setNewFollowUpDate(client.followUpDate || realTodayStr);
                      }}
                      className="text-slate-600 hover:text-indigo-600 font-bold flex items-center gap-1 py-1 px-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-[10px]"
                    >
                      <Clock className="w-3 h-3 text-amber-500" />
                      Reschedule
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setArchivingClient(client);
                          setArchiveReasonSelected("No Response");
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Archive lead"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(client)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit prospect"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Delete prospect"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Prospect Modal */}
      <AddAspiringClientModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingClient(null);
        }}
        editingClient={editingClient}
        onSave={(newClientData) => {
          let summaryContact = newClientData.contactInfo || "";
          if (newClientData.phoneNumber || newClientData.email) {
            summaryContact = [newClientData.phoneNumber, newClientData.email].filter(Boolean).join(" | ");
          }

          const newEntry: AspiringClient = {
            id: `ASP${String(Date.now()).slice(-4)}`,
            ...newClientData,
            contactInfo: summaryContact
          };
          setAspiringClients(prev => [newEntry, ...prev]);
        }}
        onUpdate={(updatedClient) => {
          let summaryContact = updatedClient.contactInfo || "";
          if (updatedClient.phoneNumber || updatedClient.email) {
            summaryContact = [updatedClient.phoneNumber, updatedClient.email].filter(Boolean).join(" | ");
          }

          const finalUpdated = {
            ...updatedClient,
            contactInfo: summaryContact
          };
          setAspiringClients(prev => prev.map(item => item.id === finalUpdated.id ? finalUpdated : item));
          setEditingClient(null);
        }}
      />

      {/* Schedule Follow-Up Quick Modal */}
      {showScheduleModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative my-auto">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900">Schedule Follow-Up</h3>
              </div>
              <button 
                onClick={() => setShowScheduleModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Set the next follow-up date for <strong className="text-slate-900">{showScheduleModal.name}</strong>. This date will be added to the Calendar and Dashboard action items.
            </p>

            <form onSubmit={handleScheduleFollowUp} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Follow-Up Date
                </label>
                <input
                  type="date"
                  required
                  value={newFollowUpDate}
                  onChange={(e) => setNewFollowUpDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(null)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all cursor-pointer"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* LOG FOLLOW-UP ATTEMPT MODAL */}
      {loggingFollowUpClient && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Log Follow-Up Attempt</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {loggingFollowUpClient.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setLoggingFollowUpClient(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Attempt Counter Notice */}
            <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-3 flex items-center justify-between text-indigo-950">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 block">
                  Current Lifecycle Progress
                </span>
                <span className="text-sm font-extrabold text-indigo-900">
                  Attempt {(loggingFollowUpClient.followUpCount || 0) + 1} of 3
                </span>
              </div>
              <span className="text-xs font-black bg-indigo-600 text-white px-3 py-1 rounded-xl">
                {(loggingFollowUpClient.followUpCount || 0) + 1 >= 3 ? "Final Attempt" : `Attempt #${(loggingFollowUpClient.followUpCount || 0) + 1}`}
              </span>
            </div>

            <form onSubmit={handleLogFollowUpSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Contact Method
                  </label>
                  <select
                    value={followUpMethod}
                    onChange={(e) => setFollowUpMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="Instagram">Instagram Direct Message</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="SMS">SMS Text Message</option>
                    <option value="Email">Email Communication</option>
                    <option value="In Person">In Person Consultation</option>
                    <option value="Other">Other Channel</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Next Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={followUpNextDate}
                    onChange={(e) => setFollowUpNextDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Follow-Up Notes &amp; Outcome
                </label>
                <textarea
                  rows={3}
                  required
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="Record summary of discussion, client response, or specific requests..."
                  className="w-full bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLoggingFollowUpClient(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Log Attempt Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ARCHIVE LEAD MODAL */}
      {archivingClient && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative my-auto">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                  <Archive className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Archive Aspiring Client</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {archivingClient.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setArchivingClient(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Select the administrative reason for archiving <strong className="text-slate-900">{archivingClient.name}</strong>. Archived leads remain preserved in system history and backup exports.
            </p>

            <form onSubmit={handleArchiveClientSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Select Archive Reason
                </label>
                
                <div className="space-y-2">
                  {[
                    { id: "No Response", title: "No Response (3 Attempts Reached)", desc: "Client remained unresponsive after max follow-ups." },
                    { id: "Not Interested", title: "Not Interested", desc: "Client explicitly requested not to be contacted." },
                    { id: "Converted to Client", title: "Converted to Client", desc: "Successfully onboarded into main client directory." },
                    { id: "Keep Active", title: "Keep Active (Reset Follow-Up Limit)", desc: "Extend pipeline and reset attempt counter." }
                  ].map(option => (
                    <label 
                      key={option.id}
                      className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                        archiveReasonSelected === option.id 
                          ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-100" 
                          : "bg-slate-50 border-slate-200/70 hover:bg-slate-100/70"
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="archiveReason" 
                        value={option.id}
                        checked={archiveReasonSelected === option.id}
                        onChange={(e) => setArchiveReasonSelected(e.target.value)}
                        className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{option.title}</span>
                        <span className="text-[10px] text-slate-500 font-medium block">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setArchivingClient(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Confirm Decision</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* VIEW FOLLOW-UP HISTORY MODAL */}
      {viewHistoryClient && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <History className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Follow-Up History Log</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {viewHistoryClient.name} • {viewHistoryClient.id}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setViewHistoryClient(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary Header */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Total Logged Attempts</span>
                <span className="text-sm font-black text-slate-900">{viewHistoryClient.followUpCount || 0} / 3</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Last Contact Date</span>
                <span className="text-sm font-black text-indigo-600">{viewHistoryClient.lastContactDate || viewHistoryClient.dateContacted}</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3 pt-1">
              {(!viewHistoryClient.followUpHistory || viewHistoryClient.followUpHistory.length === 0) ? (
                <div className="p-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No individual attempt records logged yet for this prospect.
                </div>
              ) : (
                viewHistoryClient.followUpHistory.map((rec, idx) => (
                  <div key={rec.id || idx} className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 bg-indigo-600 text-white rounded-full text-[10px] flex items-center justify-center font-black">
                          #{rec.attemptNumber || idx + 1}
                        </span>
                        <span>Attempt via {rec.method}</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{rec.date}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium bg-white p-2.5 rounded-xl border border-slate-100">
                      "{rec.notes}"
                    </p>
                    {rec.recordedBy && (
                      <span className="text-[9px] text-slate-400 font-bold block text-right">
                        Logged by {rec.recordedBy}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewHistoryClient(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close History
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
        title="Paste Aspiring Clients & Lead Prospects"
        subtitle="Copy rows directly from Microsoft Excel or Google Sheets (Ctrl+C) and paste them into your opportunity pipeline"
        templateType="aspiring"
        onConfirmImport={(pastedLeads) => handleConfirmPasteLeads(pastedLeads)}
      />
    </div>
  );
}
