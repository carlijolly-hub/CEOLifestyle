import React, { useState, useMemo } from "react";
import { Client, TimelineEvent, FollowUpReminder } from "../types";
import { getClientMilestones } from "../utils/dateHelpers";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Printer, 
  BookOpen, 
  Heart, 
  Calendar, 
  Gift, 
  MessageSquare, 
  Notebook, 
  Clock, 
  Trophy, 
  Activity, 
  Edit, 
  Trash2, 
  Plus, 
  Check, 
  Circle, 
  Globe2,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Bell,
  X,
  Archive,
  RefreshCw,
  Shirt,
  HeartHandshake
} from "lucide-react";

interface ClientDetailProps {
  customer: Client;
  onEdit: (customer: Client) => void;
  onDelete: (customerId: string) => void;
  onUpdateCustomer: (updatedCustomer: Client) => void;
}

export default function ClientDetail({ 
  customer, 
  onEdit, 
  onDelete, 
  onUpdateCustomer 
}: ClientDetailProps) {
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Timeline Event Form State
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventType, setEventType] = useState<TimelineEvent["type"]>("Conversation");
  const [eventContent, setEventContent] = useState("");
  const [eventAmount, setEventAmount] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);

  // Reminder Form State
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [reminderTask, setReminderTask] = useState("");
  const [reminderDate, setReminderDate] = useState(new Date().toISOString().split("T")[0]);

  // Handle checking/unchecking a reminder
  const toggleReminder = (reminderId: string) => {
    const updatedReminders = customer.reminders.map(r => 
      r.id === reminderId ? { ...r, completed: !r.completed } : r
    );
    onUpdateCustomer({
      ...customer,
      reminders: updatedReminders
    });
  };

  // Add a new timeline event
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventContent.trim()) return;

    const newEvent: TimelineEvent = {
      id: `e_${Date.now()}`,
      type: eventType,
      date: eventDate,
      content: eventContent.trim(),
      amount: eventAmount ? Number(eventAmount) : undefined
    };

    // Auto update last contacted date if it's a conversation
    let lastContacted = customer.lastContactedDate;
    if (eventType === "Conversation") {
      lastContacted = eventDate;
    }

    onUpdateCustomer({
      ...customer,
      timeline: [newEvent, ...customer.timeline],
      lastContactedDate: lastContacted
    });

    setEventContent("");
    setEventAmount("");
    setShowAddEvent(false);
  };

  // Add a new reminder
  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTask.trim()) return;

    const newReminder: FollowUpReminder = {
      id: `r_${Date.now()}`,
      date: reminderDate,
      task: reminderTask.trim(),
      completed: false
    };

    onUpdateCustomer({
      ...customer,
      reminders: [...customer.reminders, newReminder]
    });

    setReminderTask("");
    setShowAddReminder(false);
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "JMD",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Check if customer lives overseas but ships/delivers to Jamaica
  const isOverseasBuyer = customer.contact.country !== "Jamaica";

  const integratedMilestones = useMemo(() => {
    return getClientMilestones(customer).map(m => ({
      label: m.label,
      date: m.date
    }));
  }, [customer]);

  const relationship = customer.businessRelationship || (customer.homeBrand === "Librarium Luxe" ? "Librarium Luxe" : "CEO Lifestyle");
  const isLibrarium = relationship === "Librarium Luxe";
  const isDual = relationship === "CEO Lifestyle + Librarium Luxe";
  const isCeo = relationship === "CEO Lifestyle" || (!isLibrarium && !isDual);

  // Brand-based styling definitions: CEO = blue, Librarium = velvet (rich burgundy red), Dual = Burgundy/Blue blend
  let headerBgClass = "bg-gradient-to-tr from-slate-50 via-slate-100/30 to-slate-100/70 border-b border-slate-200/60 text-slate-900";
  let titleTextClass = "text-slate-950";
  let subtitleTextClass = "text-slate-500";
  let linkTextClass = "text-slate-900 hover:underline";
  let brandTextLightClass = "text-slate-400";
  let initialsCircleBgClass = "bg-slate-900 text-white border-2 border-white";
  let actionButtonClass = "flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-xs";
  let sectionTitleClass = "text-slate-400";

  if (isCeo) {
    headerBgClass = "bg-gradient-to-tr from-blue-950 via-blue-900 to-indigo-950 text-white border-b border-blue-900";
    titleTextClass = "text-white";
    subtitleTextClass = "text-blue-100";
    linkTextClass = "text-blue-100 hover:text-white hover:underline";
    brandTextLightClass = "text-blue-200/85";
    initialsCircleBgClass = "bg-blue-600 text-white border-2 border-blue-400";
    actionButtonClass = "flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-800 border border-blue-700 rounded-xl hover:bg-blue-700 transition-all shadow-sm";
    sectionTitleClass = "text-blue-600 font-bold tracking-wider";
  } else if (isLibrarium) {
    headerBgClass = "bg-gradient-to-tr from-[#3B0E14] via-[#5C1A24] to-[#4C1D24] text-white border-b border-rose-950";
    titleTextClass = "text-white";
    subtitleTextClass = "text-rose-100";
    linkTextClass = "text-rose-100 hover:text-white hover:underline";
    brandTextLightClass = "text-rose-200/85";
    initialsCircleBgClass = "bg-rose-800 text-white border-2 border-rose-400";
    actionButtonClass = "flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-900 border border-rose-800 rounded-xl hover:bg-rose-850 transition-all shadow-sm";
    sectionTitleClass = "text-rose-800 font-bold tracking-wider";
  } else if (isDual) {
    headerBgClass = "bg-gradient-to-tr from-blue-950 via-purple-950 to-[#4C1D24] text-white border-b border-purple-950";
    titleTextClass = "text-white";
    subtitleTextClass = "text-purple-100";
    linkTextClass = "text-purple-100 hover:text-white hover:underline";
    brandTextLightClass = "text-purple-200/85";
    initialsCircleBgClass = "bg-purple-800 text-white border-2 border-purple-400";
    actionButtonClass = "flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-900 border border-purple-800 rounded-xl hover:bg-purple-850 transition-all shadow-sm";
    sectionTitleClass = "text-purple-700 font-bold tracking-wider";
  }

  const getTierBadgeClass = (t: string) => {
    switch (t) {
      case "Founders Family":
        return "bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white border-purple-400 font-black shadow-sm";
      case "Platinum":
        return "bg-slate-900 text-slate-100 border-slate-700 font-extrabold shadow-sm";
      case "Gold":
        return "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-amber-950 border-amber-600 font-extrabold shadow-sm";
      case "Silver":
        return "bg-slate-100 text-slate-700 border-slate-300 font-bold";
      case "Delinquent":
        return "bg-rose-600 text-white border-rose-700 font-black animate-pulse shadow-sm";
      case "Problematic":
        return "bg-black text-rose-400 border-rose-900 font-black shadow-sm";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 font-bold";
    }
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl shadow-sm overflow-hidden animate-fade-in text-slate-800">
      
      {/* SUCCESS / ERROR FLASH NOTIFICATIONS */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-700 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="ml-auto text-slate-400 hover:text-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border-b border-rose-500/30 text-rose-700 flex items-center gap-3">
          <X className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-xs font-semibold">{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="ml-auto text-slate-400 hover:text-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detail Header Cover */}
      <div className={`relative ${headerBgClass} p-6 md:p-8`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className={`w-14 h-14 rounded-full ${initialsCircleBgClass} font-extrabold flex items-center justify-center text-lg shadow-md`}>
              {customer.firstName[0]}{customer.lastName[0]}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={`text-xl font-bold ${titleTextClass}`}>
                  {customer.firstName} {customer.lastName}
                </h1>
                <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border ${getTierBadgeClass(customer.tier)}`}>
                  {customer.tier === "Founders Family" ? "Priority Client – Founders Family" : `${customer.tier} Tier`}
                </span>
                {customer.managementClassification && customer.managementClassification !== "Standard" && (
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                    customer.managementClassification === "Problematic"
                      ? "bg-black text-rose-400 border-rose-900"
                      : customer.managementClassification === "Delinquent"
                        ? "bg-rose-600 text-white border-rose-700 animate-pulse"
                        : "bg-purple-900 text-purple-200 border-purple-700"
                  }`}>
                    Status: {customer.managementClassification}
                  </span>
                )}
                {customer.deactivated && (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white border border-rose-500 animate-pulse">
                    📁 Inactive / Deactivated
                  </span>
                )}
              </div>
              <p className={`text-xs ${subtitleTextClass} font-bold mt-1`}>
                {customer.occupation} • CID: <span className="font-mono font-bold">{customer.id}</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 w-full md:w-auto flex-wrap md:flex-nowrap">
            <button
              onClick={() => onEdit(customer)}
              className={actionButtonClass}
            >
              <Edit className="w-3.5 h-3.5" />
              Edit Profile
            </button>

            {customer.deactivated ? (
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to reactivate client profile for ${customer.firstName} {customer.lastName}?`)) {
                    onUpdateCustomer({ ...customer, deactivated: false });
                    setSuccessMsg(`Reactivated client profile for ${customer.firstName} ${customer.lastName}.`);
                  }
                }}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100 rounded-xl transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reactivate
              </button>
            ) : (
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to deactivate and archive client profile for ${customer.firstName} ${customer.lastName}? This preserves historical interaction notes but removes them from the active list.`)) {
                    onUpdateCustomer({ ...customer, deactivated: true });
                    setSuccessMsg(`Deactivated and archived client profile for ${customer.firstName} ${customer.lastName}.`);
                  }
                }}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100/70 border border-amber-100 rounded-xl transition-all"
              >
                <Archive className="w-3.5 h-3.5" />
                Deactivate
              </button>
            )}
          </div>
        </div>

        {/* Quick Brands Bar */}
        <div className={`flex flex-wrap items-center gap-3 mt-6 pt-5 border-t ${isCeo || isLibrarium || isDual ? "border-white/10" : "border-slate-200/60"}`}>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${brandTextLightClass}`}>Home Brand Relationship:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
            customer.homeBrand === "CEO Printing Services" || customer.homeBrand === "CEO Lifestyle"
              ? "bg-blue-600 text-white border-blue-400/30"
              : "bg-slate-50 text-slate-400 border-slate-200/50"
          }`}>
            <Printer className="w-3.5 h-3.5" /> CEO Printing Services
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
            customer.homeBrand === "Librarium Luxe" || customer.homeBrand === "CEO Lifestyle"
              ? "bg-rose-800 text-white border-rose-600/30"
              : "bg-slate-50 text-slate-400 border-slate-200/50"
          }`}>
            <BookOpen className="w-3.5 h-3.5" /> Librarium Luxe
          </span>

          <div className={`md:ml-auto flex gap-4 text-xs font-bold ${subtitleTextClass}`}>
            <div>
              Drive: <span className="font-extrabold">{customer.drive}</span>
            </div>
            {customer.lastContactedDate && (
              <div>
                Last Contact: <span className="font-extrabold">{customer.lastContactedDate} ({customer.preferredCommunication})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-8">
        
        {/* Left column - 7 units width */}
        <div className="lg:col-span-7 space-y-8">

          {/* V2.1 CLIENT INTELLIGENCE PROFILE CARD */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Client Intelligence & Relationship Profile</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded">V2.1 Intelligence</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Client Identity</span>
                <span className="text-sm font-extrabold text-white block">{customer.firstName} {customer.lastName}</span>
                <span className="text-[10px] font-mono text-slate-400 block">CL ID: {customer.id}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Relationship Health Score</span>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-black ${
                    (customer.healthScore ?? 75) >= 80 ? "text-emerald-400" : (customer.healthScore ?? 75) >= 50 ? "text-amber-400" : "text-rose-400"
                  }`}>
                    {customer.healthScore ?? 75}/100
                  </span>
                  <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                    <div 
                      className={`h-full rounded-full ${
                        (customer.healthScore ?? 75) >= 80 ? "bg-emerald-500" : (customer.healthScore ?? 75) >= 50 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, customer.healthScore ?? 75))}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Business Relationship</span>
                <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-extrabold uppercase border ${
                  relationship === "CEO Lifestyle"
                    ? "bg-blue-900/60 text-blue-200 border-blue-700"
                    : relationship === "Librarium Luxe"
                      ? "bg-rose-950/80 text-rose-200 border-rose-800"
                      : "bg-purple-950/80 text-purple-200 border-purple-700"
                }`}>
                  {relationship}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Final Tier (Official)</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider border ${getTierBadgeClass(customer.tier)}`}>
                    {customer.tier === "Founders Family" ? "Priority Client – Founders Family" : customer.tier}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    (customer.tierSource || (["Founders Family", "Delinquent", "Problematic"].includes(customer.tier) ? "Manual" : "Calculated")) === "Manual"
                      ? "bg-purple-950/80 text-purple-300 border-purple-700"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  }`}>
                    Source: {customer.tierSource || (["Founders Family", "Delinquent", "Problematic"].includes(customer.tier) ? "Manual" : "Calculated")}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Relationship Status</span>
                <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase border ${
                  (customer.relationshipStatus || "Active") === "Active"
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                    : (customer.relationshipStatus || "Active") === "Warm"
                      ? "bg-amber-950/80 text-amber-300 border-amber-800"
                      : "bg-rose-950/80 text-rose-300 border-rose-800"
                }`}>
                  {customer.relationshipStatus || "Active"}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Account Operational Status</span>
                <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase border ${
                  customer.deactivated || customer.accountStatus === "Inactive" || customer.accountStatus === "Archived"
                    ? "bg-rose-950/80 text-rose-300 border-rose-800"
                    : "bg-blue-950/80 text-blue-300 border-blue-800"
                }`}>
                  {customer.deactivated ? "Inactive / Archived" : (customer.accountStatus || "Active")}
                </span>
              </div>

              {customer.manualTierReason && (
                <div className="sm:col-span-2 space-y-1 bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">Manual Tier Context</span>
                  <p className="text-xs text-slate-200">{customer.manualTierReason}</p>
                </div>
              )}

              {customer.strategicAssociations && customer.strategicAssociations.length > 0 && (
                <div className="sm:col-span-2 space-y-1 bg-slate-800/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Strategic Associated Relationships</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {customer.strategicAssociations.map((assoc, i) => (
                      <span key={i} className="text-[10.5px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-200 border border-amber-500/30 rounded-lg">
                        🔗 {assoc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="sm:col-span-2 pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lifetime Value</span>
                <span className="text-sm font-mono font-black text-emerald-400">{formatCurrency(customer.history.lifetimeRevenue)}</span>
              </div>

              {/* Discreet Loss Notes */}
              <div className="sm:col-span-2 pt-3 border-t border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Discreet Loss Notes</span>
                {(!customer.remembrances || customer.remembrances.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No personal remembrance notes recorded for this client.</p>
                ) : (
                  <div className="space-y-1.5 pt-0.5">
                    {customer.remembrances.map((rem) => (
                      <div key={rem.id} className="p-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-xs">{rem.relationship}</span>
                          <span className="bg-rose-950/90 text-rose-300 text-[9px] font-extrabold px-2 py-0.5 rounded border border-rose-800/70">
                            {rem.status || "Passed Away"}
                          </span>
                          {rem.dateAdded && (
                            <span className="text-[9.5px] text-slate-400 font-medium ml-auto">Added {rem.dateAdded}</span>
                          )}
                        </div>
                        {rem.notes && (
                          <p className="text-[11px] text-slate-300 leading-relaxed pt-0.5">{rem.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Apparel & Fit Sizes */}
              <div className="sm:col-span-2 pt-3 border-t border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Apparel & Fit Sizes</span>
                {(!customer.apparelInfo || Object.values(customer.apparelInfo).every(v => !v)) ? (
                  <p className="text-xs text-slate-400 italic">No apparel or fitting information saved for this client.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {customer.apparelInfo.tShirtSize && (
                      <div className="bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <span className="text-[9px] font-extrabold uppercase text-indigo-300">Adult T-Shirt:</span>
                        <span className="font-bold text-white text-xs">{customer.apparelInfo.tShirtSize}</span>
                      </div>
                    )}
                    {customer.apparelInfo.poloSize && (
                      <div className="bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <span className="text-[9px] font-extrabold uppercase text-slate-400">Polo:</span>
                        <span className="font-bold text-white text-xs">{customer.apparelInfo.poloSize}</span>
                      </div>
                    )}
                    {customer.apparelInfo.hoodieSize && (
                      <div className="bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <span className="text-[9px] font-extrabold uppercase text-slate-400">Hoodie:</span>
                        <span className="font-bold text-white text-xs">{customer.apparelInfo.hoodieSize}</span>
                      </div>
                    )}
                    {customer.apparelInfo.jerseySize && (
                      <div className="bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <span className="text-[9px] font-extrabold uppercase text-slate-400">Jersey:</span>
                        <span className="font-bold text-white text-xs">{customer.apparelInfo.jerseySize}</span>
                      </div>
                    )}
                    {customer.apparelInfo.jacketSize && (
                      <div className="bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <span className="text-[9px] font-extrabold uppercase text-slate-400">Jacket:</span>
                        <span className="font-bold text-white text-xs">{customer.apparelInfo.jacketSize}</span>
                      </div>
                    )}
                    {customer.apparelInfo.hatSize && (
                      <div className="bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <span className="text-[9px] font-extrabold uppercase text-slate-400">Hat:</span>
                        <span className="font-bold text-white text-xs">{customer.apparelInfo.hatSize}</span>
                      </div>
                    )}
                    {customer.apparelInfo.shoeSize && (
                      <div className="bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <span className="text-[9px] font-extrabold uppercase text-slate-400">Shoe:</span>
                        <span className="font-bold text-white text-xs">{customer.apparelInfo.shoeSize}</span>
                      </div>
                    )}
                    {customer.apparelInfo.ringSize && (
                      <div className="bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <span className="text-[9px] font-extrabold uppercase text-slate-400">Ring:</span>
                        <span className="font-bold text-white text-xs">{customer.apparelInfo.ringSize}</span>
                      </div>
                    )}
                    {customer.apparelInfo.braceletSize && (
                      <div className="bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <span className="text-[9px] font-extrabold uppercase text-slate-400">Bracelet:</span>
                        <span className="font-bold text-white text-xs">{customer.apparelInfo.braceletSize}</span>
                      </div>
                    )}
                    {customer.apparelInfo.necklaceLength && (
                      <div className="bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <span className="text-[9px] font-extrabold uppercase text-slate-400">Necklace:</span>
                        <span className="font-bold text-white text-xs">{customer.apparelInfo.necklaceLength}</span>
                      </div>
                    )}
                    {customer.apparelInfo.dressSize && (
                      <div className="bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <span className="text-[9px] font-extrabold uppercase text-slate-400">Dress:</span>
                        <span className="font-bold text-white text-xs">{customer.apparelInfo.dressSize}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CLIENT HISTORY PRESERVATION TIMELINE */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Client History Preservation</h3>
              <span className="text-[10px] font-bold text-slate-400">Never Deleted</span>
            </div>

            {/* Progression Sequence Display */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2 flex-wrap text-xs font-bold text-slate-700">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Status Trail:</span>
              {(customer.tierHistory && customer.tierHistory.length > 0
                ? customer.tierHistory
                : [
                    { tier: "Silver" },
                    ...(customer.tier !== "Silver" ? [{ tier: customer.tier }] : [])
                  ]
              ).map((h, i, arr) => (
                <React.Fragment key={i}>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border ${getTierBadgeClass(h.tier)}`}>
                    {h.tier}
                  </span>
                  {i < arr.length - 1 && <span className="text-slate-400 font-extrabold">↓</span>}
                </React.Fragment>
              ))}
            </div>

            {/* Detailed Log Table */}
            {customer.tierHistory && customer.tierHistory.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Classification Audit Log</span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto text-[11px]">
                  {customer.tierHistory.map((rec, idx) => (
                    <div key={rec.id || idx} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-slate-500 mr-2">{rec.dateChanged || (rec as any).date}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold border mr-2 ${getTierBadgeClass(rec.tier)}`}>{rec.tier}</span>
                        <span className="text-slate-700">{rec.reason || "Classification update"}</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 shrink-0">{rec.changedBy || "System"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Overseas Buyer Indicator Panel */}
          {isOverseasBuyer && (
            <div className="bg-amber-50/40 border border-amber-200/50 rounded-2xl p-5 flex items-start gap-4">
              <Globe2 className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">International Overseas Purchaser</h4>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  This client resides abroad in <span className="font-bold text-slate-800">{customer.contact.country}</span> ({customer.contact.city}) but frequently processes transactions to surprise their family, partners, or colleagues inside Jamaica. Deliver products directly to their local recipient address in Jamaica below.
                </p>
              </div>
            </div>
          )}

          {/* Contact Details Grid */}
          <div className="space-y-4">
            <h3 className={`text-[10px] font-bold uppercase tracking-widest text-left ${sectionTitleClass}`}>Contact & Delivery Logistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 border border-slate-200/60 rounded-2xl p-5 text-xs text-left">
              <div className="space-y-3">
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Phone Number</span>
                  <a href={`tel:${customer.contact.phoneNumber}`} className="text-slate-900 font-bold flex items-center gap-1.5 mt-1 hover:underline">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {customer.contact.phoneNumber}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Communication Status</span>
                  <span className="text-slate-900 font-bold block mt-1">
                    {customer.communicationStatus || "Unknown"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Email Address</span>
                  <a href={`mailto:${customer.contact.email}`} className="text-slate-900 font-bold flex items-center gap-1.5 mt-1 hover:underline">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {customer.contact.email}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Current Residence</span>
                  <span className="text-slate-900 font-bold flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {customer.contact.city}, {customer.contact.country}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Recipient Delivery Destination</span>
                  <span className="text-slate-900 font-bold flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {customer.contact.deliveryAddress}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Parish (Jamaica Local)</span>
                  <span className="text-slate-900 font-bold mt-1 block">
                    {customer.contact.parish || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider">Delivery Country</span>
                  <span className="text-slate-900 font-bold mt-1 block">
                    {customer.contact.deliveryCountry}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Client History & Financial Contributions */}
          <div className="space-y-4">
            <h3 className={`text-[10px] font-bold uppercase tracking-widest text-left ${sectionTitleClass}`}>Client History & Value Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-left">
              <div className="bg-white border border-slate-200/60 p-3 rounded-xl shadow-xs min-w-0 flex flex-col justify-between">
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase block tracking-wider truncate">Lifetime Value</span>
                <span className="text-xs sm:text-[13px] md:text-sm font-black text-slate-900 block mt-1 font-mono break-words leading-tight">
                  {formatCurrency(customer.history?.lifetimeRevenue || 0)}
                </span>
              </div>
              <div className="bg-white border border-slate-200/60 p-3 rounded-xl shadow-xs min-w-0 flex flex-col justify-between">
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase block tracking-wider truncate">Total Orders</span>
                <span className="text-xs sm:text-[13px] md:text-sm font-black text-slate-900 block mt-1 break-words leading-tight">
                  {customer.history?.totalOrders || 0} {(customer.history?.totalOrders || 0) === 1 ? 'order' : 'orders'}
                </span>
              </div>
              <div className="bg-white border border-slate-200/60 p-3 rounded-xl shadow-xs min-w-0 flex flex-col justify-between">
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase block tracking-wider truncate">Avg Order Value</span>
                <span className="text-xs sm:text-[13px] md:text-sm font-black text-slate-900 block mt-1 font-mono break-words leading-tight">
                  {formatCurrency(customer.history?.averageOrderValue || (customer.history?.totalOrders ? Math.round((customer.history.lifetimeRevenue || 0) / customer.history.totalOrders) : 0))}
                </span>
              </div>
              <div className="bg-white border border-slate-200/60 p-3 rounded-xl shadow-xs min-w-0 flex flex-col justify-between">
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase block tracking-wider truncate">Relationship Span</span>
                <span className="text-xs sm:text-[13px] md:text-sm font-black text-slate-800 block mt-1 break-words leading-tight">
                  Since {customer.history?.firstOrderDate ? customer.history.firstOrderDate.slice(0, 4) : "2024"}
                </span>
              </div>
            </div>

            {/* Products & Preferences detail card */}
            <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-5 text-xs text-left space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider mb-2">Purchased Categories</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(customer.history?.preferredCategories || []).map(cat => (
                      <span key={cat} className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px] border border-slate-200/30">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider mb-2">Products Ordered</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(customer.history?.productsPurchased || []).map(prod => (
                      <span key={prod} className="bg-white border border-slate-200/60 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium shadow-xs">
                        {prod}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider mb-1.5">Bespoke Preferences</span>
                <div className="flex flex-wrap gap-1.5">
                  {(customer.history?.clientPreferences || []).map(pref => (
                    <span key={pref} className="bg-slate-100 text-slate-800 border border-slate-200/60 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                      {pref}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hobbies & Lifestyle */}
          <div className="space-y-4">
            <h3 className={`text-[10px] font-bold uppercase tracking-widest text-left ${sectionTitleClass}`}>Lifestyle & Interests</h3>
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 text-xs text-left space-y-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Sports Profile */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[9px]">Sports Alignments</span>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Sport</span>
                        <span className="text-slate-900 font-bold">{customer.interests.sports.sport || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Favorite Team</span>
                        <span className="text-slate-900 font-bold">{customer.interests.sports.favoriteTeam || "N/A"}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Team One</span>
                        <span className="text-slate-900 font-bold text-[11px]">{customer.interests.sports.teamOne || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Team Two</span>
                        <span className="text-slate-900 font-bold text-[11px]">{customer.interests.sports.teamTwo || "N/A"}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">National Team</span>
                        <span className="text-slate-900 font-bold">{customer.interests.sports.nationalTeam || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Favorite Player</span>
                        <span className="text-slate-900 font-bold">{customer.interests.sports.favoritePlayer || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Other Interests */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[9px]">Aspirational Profile</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-400 font-bold block mb-1 text-[9px] uppercase tracking-wider">Hobbies</span>
                      <p className="text-slate-900 font-bold">{customer.interests.hobbies.join(", ") || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block mb-1.5 text-[9px] uppercase tracking-wider">Favorite Color Palettes</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {customer.interests.favoriteColors.map(col => (
                          <span key={col} className="bg-slate-50 text-slate-850 border border-slate-200 px-2.5 py-0.5 rounded-md font-bold capitalize text-[10px]">
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block mb-1 text-[9px] uppercase tracking-wider">Gift Preferences</span>
                      <p className="text-slate-900 font-bold">{customer.interests.giftPreferences.join(", ") || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block mb-1 text-[9px] uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-amber-600" /> Favourite Authors
                      </span>
                      <div className="flex gap-1.5 flex-wrap">
                        {customer.favouriteAuthors && customer.favouriteAuthors.length > 0 ? (
                          customer.favouriteAuthors.map(author => (
                            <span key={author} className="bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-0.5 rounded-md font-bold text-[10px]">
                              📚 {author}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 font-medium italic text-[11px]">No favourite authors logged yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* Right column - 5 units width */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Family & Key Connections */}
          <div className="space-y-4">
            <h3 className={`text-[10px] font-bold uppercase tracking-widest text-left ${sectionTitleClass}`}>Family & Relations</h3>
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 text-xs text-left space-y-4 shadow-sm">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Mother</span>
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="text-slate-900 font-bold">{customer.profile.motherName || "N/A"}</span>
                    {customer.profile.motherDeceased && (
                      <span className="text-[8px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded-md">Deceased</span>
                    )}
                  </div>
                  {customer.profile.motherBirthday && (
                    <span className="text-slate-500 font-medium block text-[9px] mt-0.5 font-mono">{customer.profile.motherBirthday}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Father</span>
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="text-slate-900 font-bold">{customer.profile.fatherName || "N/A"}</span>
                    {customer.profile.fatherDeceased && (
                      <span className="text-[8px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded-md">Deceased</span>
                    )}
                  </div>
                  {customer.profile.fatherBirthday && (
                    <span className="text-slate-500 font-medium block text-[9px] mt-0.5 font-mono">{customer.profile.fatherBirthday}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Partner/Wife</span>
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="text-slate-900 font-bold">{customer.profile.wifeName || "N/A"}</span>
                    {customer.profile.wifeDeceased && (
                      <span className="text-[8px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded-md">Deceased</span>
                    )}
                  </div>
                  {customer.profile.wifeBirthday && (
                    <span className="text-slate-500 font-medium block text-[9px] mt-0.5 font-mono">{customer.profile.wifeBirthday}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Partner/Husband</span>
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="text-slate-900 font-bold">{customer.profile.husbandName || "N/A"}</span>
                    {customer.profile.husbandDeceased && (
                      <span className="text-[8px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded-md">Deceased</span>
                    )}
                  </div>
                  {customer.profile.husbandBirthday && (
                    <span className="text-slate-500 font-medium block text-[9px] mt-0.5 font-mono">{customer.profile.husbandBirthday}</span>
                  )}
                </div>
              </div>

              <div className="pb-3 border-b border-slate-100">
                <span className="text-slate-400 font-bold block mb-1 text-[9px] uppercase tracking-wider">Children</span>
                {customer.profile.children.length === 0 ? (
                  <span className="text-slate-950 font-bold">None</span>
                ) : (
                  <div className="space-y-1.5 mt-1.5">
                    {customer.profile.children.map((child, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px] bg-slate-50 border border-slate-100 px-2.5 py-1 rounded">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{child.name}</span>
                          {child.deceased && (
                            <span className="text-[8px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded-md">Deceased</span>
                          )}
                        </div>
                        {child.birthday && (
                          <span className="text-slate-500 font-mono text-[9px] font-bold flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" /> {child.birthday}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Other Family Members Display */}
              {customer.profile.otherFamilyMembers && customer.profile.otherFamilyMembers.length > 0 && (
                <div className="pb-3 border-b border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1 text-[9px] uppercase tracking-wider">Other Family Members</span>
                  <div className="space-y-1.5 mt-1.5">
                    {customer.profile.otherFamilyMembers.map((member, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px] bg-slate-50 border border-slate-100 px-2.5 py-1 rounded">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider bg-slate-150 text-slate-700 px-1.5 py-0.5 rounded border border-slate-250">
                            {member.relationship}
                          </span>
                          <span className="font-bold text-slate-800">{member.name}</span>
                          {member.deceased && (
                            <span className="text-[8px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded-md">Deceased</span>
                          )}
                        </div>
                        {member.birthday && (
                          <span className="text-slate-500 font-mono text-[9px] font-bold flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" /> {member.birthday}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Pets</span>
                  <span className="text-slate-900 font-bold">{customer.profile.pets || "None"}</span>
                </div>
              </div>

              {customer.profile.personalNotes && (
                <div>
                  <span className="text-slate-400 font-bold block mb-1 text-[9px] uppercase tracking-wider">Internal Relations Note</span>
                  <p className="text-slate-800 italic bg-amber-50/10 border border-amber-200/50 p-3 rounded-lg leading-relaxed text-[11px]">
                    "{customer.profile.personalNotes}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Important Occasion Dates */}
          <div className="space-y-4">
            <h3 className={`text-[10px] font-bold uppercase tracking-widest text-left ${sectionTitleClass}`}>Bespoke Milestone Calendar</h3>
            <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-5 text-xs text-left space-y-3.5">
              {integratedMilestones.map((dateObj, i) => (
                <div key={i} className="flex items-center justify-between pb-2 border-b border-slate-200/40 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white rounded border border-slate-200">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <span className="font-bold text-slate-700">{dateObj.label}</span>
                  </div>
                  <span className="font-bold text-slate-900 font-mono">{dateObj.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Follow-up Reminders */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`text-[10px] font-bold uppercase tracking-widest text-left ${sectionTitleClass}`}>Reminders & Tasks</h3>
              <button 
                onClick={() => setShowAddReminder(!showAddReminder)}
                className="text-slate-700 hover:text-slate-950 text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> New Task
              </button>
            </div>

            {/* Reminder Input form */}
            {showAddReminder && (
              <form onSubmit={handleAddReminder} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 animate-fade-in text-left shadow-sm">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Task / Reminder</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Suggest customized gifts for birthday..."
                    value={reminderTask}
                    onChange={(e) => setReminderTask(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-lg p-2 text-xs font-medium text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Date</label>
                  <input
                    type="date"
                    required
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-lg p-2 text-xs font-medium text-slate-800"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button 
                    type="button" 
                    onClick={() => setShowAddReminder(false)}
                    className="px-2.5 py-1.5 text-[11px] text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-[11px] font-bold rounded-md shadow-xs"
                  >
                    Save Reminder
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 text-xs text-left shadow-sm space-y-4">
              {customer.reminders.length === 0 ? (
                <p className="text-slate-400 text-center py-2 italic text-[11px]">No active reminders or follow-ups.</p>
              ) : (
                <div className="space-y-3">
                  {customer.reminders.map(rem => (
                    <div key={rem.id} className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="flex gap-2.5 items-start">
                        <button 
                          onClick={() => toggleReminder(rem.id)}
                          className="mt-0.5 text-slate-400 hover:text-slate-800 transition-colors"
                        >
                          {rem.completed ? (
                            <Check className="w-4 h-4 text-emerald-600 bg-emerald-50 rounded" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <div>
                          <p className={`font-bold ${rem.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {rem.task}
                          </p>
                          <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mt-1 font-mono uppercase tracking-wider">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> Due {rem.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Relationship timeline */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`text-[10px] font-bold uppercase tracking-widest font-semibold flex items-center gap-1 ${sectionTitleClass}`}>
                <Activity className="w-3.5 h-3.5" /> Interaction Timeline
              </h3>
              <button 
                onClick={() => setShowAddEvent(!showAddEvent)}
                className="text-slate-700 hover:text-slate-950 text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Log Event
              </button>
            </div>

            {/* Event Form */}
            {showAddEvent && (
              <form onSubmit={handleAddEvent} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 animate-fade-in text-left shadow-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event Type</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-lg p-2 text-xs font-medium text-slate-800"
                    >
                      <option value="Conversation">Conversation</option>
                      <option value="Order">Order Placement</option>
                      <option value="Gift">Complimentary Gift</option>
                      <option value="Note">Note</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Log Date</label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-lg p-2 text-xs font-medium text-slate-800"
                    >
                    </input>
                  </div>
                </div>

                {eventType === "Order" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Value (JMD)</label>
                    <input
                      type="number"
                      placeholder="E.g., 45000"
                      value={eventAmount}
                      onChange={(e) => setEventAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-lg p-2 text-xs font-medium text-slate-800"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description Details</label>
                  <textarea
                    required
                    placeholder="E.g., Spoke with client regarding corporate sample..."
                    value={eventContent}
                    onChange={(e) => setEventContent(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-lg p-2 text-xs font-medium text-slate-800"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button 
                    type="button" 
                    onClick={() => setShowAddEvent(false)}
                    className="px-2.5 py-1.5 text-[11px] text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-[11px] font-bold rounded-md shadow-xs"
                  >
                    Log Event
                  </button>
                </div>
              </form>
            )}

            <div className="relative pl-6 space-y-6 text-left border-l border-slate-200">
              {customer.timeline.map((evt) => {
                // Determine icon and color - premium clean monochrome
                let icon = <MessageSquare className="w-3 h-3 text-slate-600" />;
                let iconBg = "bg-slate-50 border-slate-200";
                
                if (evt.type === "Order") {
                  icon = <ShoppingBag className="w-3 h-3 text-slate-900" />;
                  iconBg = "bg-slate-100 border-slate-200";
                } else if (evt.type === "Gift") {
                  icon = <Gift className="w-3 h-3 text-slate-700" />;
                  iconBg = "bg-slate-50 border-slate-200";
                } else if (evt.type === "Note") {
                  icon = <Notebook className="w-3 h-3 text-slate-600" />;
                  iconBg = "bg-slate-50 border-slate-200";
                }

                return (
                  <div key={evt.id} className="relative group animate-fade-in">
                    {/* timeline node dot */}
                    <div className={`absolute -left-[31px] top-1.5 w-6.5 h-6.5 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${iconBg}`}>
                      {icon}
                    </div>

                    <div className="bg-slate-50/40 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 p-4 rounded-2xl transition-all shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                      <div className="flex justify-between items-center mb-1 text-[11px]">
                        <span className="font-bold text-slate-800 uppercase tracking-wider">{evt.type}</span>
                        <span className="text-slate-400 font-bold font-mono text-[10px]">{evt.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {evt.content}
                      </p>
                      {evt.amount && (
                        <span className="inline-block mt-2 font-mono font-bold text-slate-950 text-[11px]">
                          Liftiver Value: {formatCurrency(evt.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
