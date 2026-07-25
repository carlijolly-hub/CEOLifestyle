import React, { useState, useEffect } from "react";
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
  Award
} from "lucide-react";
import { AspiringClient, AspiringClientStatus, Client } from "../types";

interface AspiringClientsProps {
  aspiringClients: AspiringClient[];
  setAspiringClients: React.Dispatch<React.SetStateAction<AspiringClient[]>>;
  onConvertToClient: (aspiringClient: AspiringClient) => void;
  onNavigateToCalendar?: () => void;
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
    followUpDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`
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
    followUpDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(Math.min(28, new Date().getDate() + 3)).padStart(2, "0")}`
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
    followUpDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(Math.min(28, new Date().getDate() + 5)).padStart(2, "0")}`
  }
];

export default function AspiringClients({
  aspiringClients,
  setAspiringClients,
  onConvertToClient,
  onNavigateToCalendar
}: AspiringClientsProps) {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<AspiringClient | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState<AspiringClient | null>(null);
  const [newFollowUpDate, setNewFollowUpDate] = useState("");

  // Form fields
  const [formData, setFormData] = useState<Omit<AspiringClient, "id">>({
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
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.serviceInterestedIn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactInfo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.notes.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesSource = sourceFilter === "all" || c.sourceOfInquiry === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  // Handle Save (Add or Edit)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingClient) {
      setAspiringClients(prev => prev.map(item => item.id === editingClient.id ? { ...editingClient, ...formData } : item));
      setEditingClient(null);
    } else {
      const newEntry: AspiringClient = {
        id: `ASP${String(Date.now()).slice(-4)}`,
        ...formData
      };
      setAspiringClients(prev => [newEntry, ...prev]);
    }

    setShowAddModal(false);
    // Reset form
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
  };

  const handleOpenEdit = (client: AspiringClient) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      contactInfo: client.contactInfo,
      sourceOfInquiry: client.sourceOfInquiry,
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
    <div className="space-y-6 animate-fade-in text-left pb-10">
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
      <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by prospect name, service, contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
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

                  {/* Contact Info */}
                  <div className="text-xs text-slate-600 font-medium space-y-1 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                      <Tag className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{client.serviceInterestedIn}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{client.contactInfo}</span>
                    </div>
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

                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <button
                      onClick={() => {
                        setShowScheduleModal(client);
                        setNewFollowUpDate(client.followUpDate || realTodayStr);
                      }}
                      className="text-slate-600 hover:text-indigo-600 font-bold flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Schedule Follow-Up
                    </button>

                    <div className="flex items-center gap-1">
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
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingClient ? "Edit Aspiring Prospect" : "New Aspiring Prospect"}
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Samantha Wright"
                  className="w-full bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Source of Inquiry
                  </label>
                  <select
                    value={formData.sourceOfInquiry}
                    onChange={(e) => setFormData({ ...formData, sourceOfInquiry: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
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
                    Current Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as AspiringClientStatus })}
                    className="w-full bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
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

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Service / Product Interested In
                </label>
                <input
                  type="text"
                  value={formData.serviceInterestedIn}
                  onChange={(e) => setFormData({ ...formData, serviceInterestedIn: e.target.value })}
                  placeholder="e.g. Custom Polos, Rare Books, Printing"
                  className="w-full bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Contact Info (Phone / Email)
                </label>
                <input
                  type="text"
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  placeholder="e.g. +1 (876) 555-0192 | email@domain.com"
                  className="w-full bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Date Contacted
                  </label>
                  <input
                    type="date"
                    value={formData.dateContacted}
                    onChange={(e) => setFormData({ ...formData, dateContacted: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Follow-Up Schedule Date
                  </label>
                  <input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Assigned Team Member
                </label>
                <input
                  type="text"
                  value={formData.assignedUser}
                  onChange={(e) => setFormData({ ...formData, assignedUser: e.target.value })}
                  placeholder="e.g. Chief Executive Officer"
                  className="w-full bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Notes &amp; Inquiry Details
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Record key request requirements, pricing quotes provided..."
                  className="w-full bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all cursor-pointer"
                >
                  {editingClient ? "Save Changes" : "Create Prospect Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Follow-Up Quick Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
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
        </div>
      )}
    </div>
  );
}
