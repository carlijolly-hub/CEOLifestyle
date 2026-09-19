import React, { useState, useMemo } from "react";
import { Client, TimelineEvent, FollowUpReminder, ClientPromise, PromiseStatus, ClientHome } from "../types";
import { getClientMilestones, getFollowUpActionState, getDaysSince } from "../utils/dateHelpers";
import { getClientHome, getClientPromises, getOpenPromisesCount } from "../utils/clientTierUtils";
import { isAdventistCommunicationRestricted } from "../utils/adventistGuard";
import AdventistWarningModal from "./AdventistWarningModal";
import AdventistAlert from "./AdventistAlert";
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
  AlertCircle,
  Trophy, 
  Activity, 
  Edit, 
  Trash2, 
  Plus, 
  Check, 
  Circle, 
  Globe2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShoppingBag,
  Bell,
  X,
  Archive,
  RefreshCw,
  Shirt,
  HeartHandshake,
  Building2,
  Sliders
} from "lucide-react";

interface ClientDetailProps {
  customer: Client;
  operationsOrders?: any[];
  onEdit: (customer: Client) => void;
  onDelete: (customerId: string) => void;
  onUpdateCustomer: (updatedCustomer: Client) => void;
}

export default function ClientDetail({ 
  customer, 
  operationsOrders = [],
  onEdit, 
  onDelete, 
  onUpdateCustomer 
}: ClientDetailProps) {
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isAdventistModalOpen, setIsAdventistModalOpen] = useState(false);

  // Timeline Event Form State
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventChannel, setEventChannel] = useState<string>("WhatsApp");
  const [eventContent, setEventContent] = useState("");
  const [eventAmount, setEventAmount] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [timelineFilter, setTimelineFilter] = useState<string>("All");

  // Reminder Form State
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [reminderTask, setReminderTask] = useState("");
  const [reminderDate, setReminderDate] = useState(new Date().toISOString().split("T")[0]);

  // Promise Form & Management State
  const [showAddCommitmentModal, setShowAddCommitmentModal] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<ClientPromise | null>(null);
  const [commitmentText, setCommitmentText] = useState("");
  const [commitmentDueDate, setCommitmentDueDate] = useState(""); // Optional by default!
  const [commitmentStatus, setCommitmentStatus] = useState<PromiseStatus>("Open");
  const [commitmentNotes, setCommitmentNotes] = useState("");
  const [commitmentFilter, setCommitmentFilter] = useState<"All" | PromiseStatus>("Open");
  const [isSecondaryExpanded, setIsSecondaryExpanded] = useState(false);

  const handleSaveCommitment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitmentText.trim()) return;

    const currentPromises = getClientPromises(customer);
    let updatedPromises: ClientPromise[];

    if (editingCommitment) {
      updatedPromises = currentPromises.map(p => 
        p.id === editingCommitment.id 
          ? {
              ...p,
              promise: commitmentText.trim(),
              commitment: commitmentText.trim(),
              dueDate: commitmentDueDate.trim() || undefined,
              status: commitmentStatus,
              notes: commitmentNotes.trim() || undefined,
              fulfilledDate: (commitmentStatus === "Fulfilled" || commitmentStatus === "Completed") ? (p.fulfilledDate || p.completedDate || new Date().toISOString().split("T")[0]) : undefined,
              completedDate: (commitmentStatus === "Fulfilled" || commitmentStatus === "Completed") ? (p.completedDate || p.fulfilledDate || new Date().toISOString().split("T")[0]) : undefined
            }
          : p
      );
    } else {
      const newPromise: ClientPromise = {
        id: `prm_${Date.now()}`,
        promise: commitmentText.trim(),
        commitment: commitmentText.trim(),
        dueDate: commitmentDueDate.trim() || undefined,
        status: commitmentStatus,
        notes: commitmentNotes.trim() || undefined,
        createdDate: new Date().toISOString().split("T")[0],
        fulfilledDate: (commitmentStatus === "Fulfilled" || commitmentStatus === "Completed") ? new Date().toISOString().split("T")[0] : undefined,
        completedDate: (commitmentStatus === "Fulfilled" || commitmentStatus === "Completed") ? new Date().toISOString().split("T")[0] : undefined
      };
      updatedPromises = [newPromise, ...currentPromises];
    }

    onUpdateCustomer({
      ...customer,
      promises: updatedPromises,
      commitments: updatedPromises
    });

    setCommitmentText("");
    setCommitmentDueDate("");
    setCommitmentStatus("Open");
    setCommitmentNotes("");
    setEditingCommitment(null);
    setShowAddCommitmentModal(false);
  };

  const handleToggleCommitmentStatus = (commId: string, currentStatus: PromiseStatus) => {
    const nextStatus: PromiseStatus = (currentStatus === "Open") ? "Fulfilled" : "Open";
    const updatedPromises = getClientPromises(customer).map(p => 
      p.id === commId 
        ? { 
            ...p, 
            status: nextStatus,
            fulfilledDate: nextStatus === "Fulfilled" ? new Date().toISOString().split("T")[0] : undefined,
            completedDate: nextStatus === "Fulfilled" ? new Date().toISOString().split("T")[0] : undefined 
          } 
        : p
    );
    onUpdateCustomer({
      ...customer,
      promises: updatedPromises,
      commitments: updatedPromises
    });
  };

  const handleDeleteCommitment = (commId: string) => {
    const updatedPromises = getClientPromises(customer).filter(p => p.id !== commId);
    onUpdateCustomer({
      ...customer,
      promises: updatedPromises,
      commitments: updatedPromises
    });
  };

  const handleOpenEditCommitment = (comm: ClientPromise) => {
    setEditingCommitment(comm);
    setCommitmentText(comm.promise || comm.commitment || "");
    setCommitmentDueDate(comm.dueDate || "");
    setCommitmentStatus(comm.status === "Completed" ? "Fulfilled" : comm.status);
    setCommitmentNotes(comm.notes || "");
    setShowAddCommitmentModal(true);
  };

  // Handle checking/unchecking a reminder
  const toggleReminder = (reminderId: string) => {
    const updatedReminders = customer.reminders.map(r => {
      if (r.id === reminderId) {
        const nextCompleted = !r.completed;
        return {
          ...r,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined
        };
      }
      return r;
    });
    onUpdateCustomer({
      ...customer,
      reminders: updatedReminders
    });
  };

  // Add a new timeline event
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventContent.trim()) return;

    if ((eventChannel === "WhatsApp" || eventChannel === "Phone Call") && isAdventistCommunicationRestricted(customer.adventist)) {
      setIsAdventistModalOpen(true);
      return;
    }

    const newEvent: TimelineEvent = {
      id: `e_${Date.now()}`,
      type: eventChannel,
      method: eventChannel,
      date: eventDate,
      content: eventContent.trim(),
      amount: eventAmount ? Number(eventAmount) : undefined
    };

    // Auto update last contacted date
    let lastContacted = customer.lastContactedDate;
    if (["WhatsApp", "Phone Call", "Customer Response", "In-Person", "Conversation"].includes(eventChannel)) {
      lastContacted = eventDate;
    }

    onUpdateCustomer({
      ...customer,
      timeline: [newEvent, ...(customer.timeline || [])],
      lastContactedDate: lastContacted
    });

    setEventContent("");
    setEventAmount("");
    setShowAddEvent(false);
  };

  // Chronological unified interaction & activity timeline
  const combinedTimeline = useMemo(() => {
    const eventsMap = new Map<string, TimelineEvent>();

    // 1. Existing stored timeline events
    (customer.timeline || []).forEach(evt => {
      eventsMap.set(evt.id, evt);
    });

    // 2. Synthesize order activity from operationsOrders if any order event missing
    if (operationsOrders && operationsOrders.length > 0) {
      const clientOrders = operationsOrders.filter(o => {
        if (o.clientId && customer.id && o.clientId === customer.id) return true;
        const ordName = (o.clientName || "").trim().toLowerCase();
        if (!ordName) return false;
        const cName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim().toLowerCase();
        if (cName && cName === ordName) return true;
        const cFull = `${customer.firstName || ""} ${customer.lastName || ""}`.trim().toLowerCase();
        if (cFull && cFull === ordName) return true;
        return false;
      });

      clientOrders.forEach(ord => {
        const itemText = typeof ord.items === "string" 
          ? ord.items 
          : ord.items.map((i: any) => `${i.quantity}x ${i.productName}`).join(", ");

        const ordKey = `synth_ord_${ord.id}`;
        if (!Array.from(eventsMap.values()).some(e => (e.orderNumber && ord.orderNumber && e.orderNumber === ord.orderNumber) || (e.content && ord.orderNumber && e.content.includes(ord.orderNumber)))) {
          eventsMap.set(ordKey, {
            id: ordKey,
            type: "Order Created",
            method: "Operations Hub",
            date: ord.orderDate || ord.createdDate || new Date().toISOString().split("T")[0],
            content: `Order Created — ${ord.orderNumber} (${itemText || "Custom Order"})${ord.expressOrder === "Yes" ? " [⚡ EXPRESS]" : ""}`,
            amount: ord.totalAmount,
            orderId: ord.id,
            orderNumber: ord.orderNumber
          });

          if (ord.productionStatus === "Completed") {
            const compKey = `synth_comp_${ord.id}`;
            eventsMap.set(compKey, {
              id: compKey,
              type: "Order Completed",
              method: "Operations Hub",
              date: ord.updatedDate || ord.dueDate || new Date().toISOString().split("T")[0],
              content: `Order Completed — ${ord.orderNumber}`,
              amount: ord.totalAmount,
              orderId: ord.id,
              orderNumber: ord.orderNumber
            });
          }
        }
      });
    }

    const list = Array.from(eventsMap.values());
    // Sort reverse chronological
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [customer, operationsOrders]);

  // Filtered timeline based on user selected pill
  const filteredTimeline = useMemo(() => {
    if (timelineFilter === "All") return combinedTimeline;
    if (timelineFilter === "Communications") {
      return combinedTimeline.filter(e => 
        ["WhatsApp", "Phone Call", "Customer Response", "In-Person", "Conversation", "Email", "Follow-up"].includes(e.type) ||
        (e.method && ["WhatsApp", "Phone Call", "In-Person", "Email"].includes(e.method))
      );
    }
    if (timelineFilter === "Orders") {
      return combinedTimeline.filter(e => 
        ["Order Created", "Order Status Changed", "Order Completed", "Order Cancelled", "Order", "Order Placement"].includes(e.type) ||
        !!e.orderNumber
      );
    }
    if (timelineFilter === "Notes & Milestones") {
      return combinedTimeline.filter(e => 
        ["Note", "Milestone", "Tier Changed", "Client Info Updated", "Gift"].includes(e.type)
      );
    }
    return combinedTimeline;
  }, [combinedTimeline, timelineFilter]);

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

  const clientHomeValue: ClientHome = getClientHome(customer);

  const isLibrarium = clientHomeValue === "Librarium Luxe";
  const isDual = clientHomeValue === "CEO Lifestyle | Librarium Luxe";
  const isCeo = clientHomeValue === "CEO Lifestyle";

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
    <div className="glass-workspace overflow-hidden animate-fade-in text-slate-800">
      
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
          <div className="flex items-center gap-4 text-left min-w-0 flex-1">
            <div className={`w-14 h-14 rounded-full ${initialsCircleBgClass} font-extrabold flex items-center justify-center text-lg shadow-md shrink-0`}>
              {customer.firstName[0]}{customer.lastName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={`text-xl font-bold ${titleTextClass} break-words`}>
                  {customer.firstName} {customer.lastName}
                </h1>
                {getOpenPromisesCount(customer) > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("client-promises-section");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-black tracking-wider transition-all cursor-pointer shadow-xs"
                    title={`${getOpenPromisesCount(customer)} Open Client Promises - Click to view`}
                  >
                    ({getOpenPromisesCount(customer)} {getOpenPromisesCount(customer) === 1 ? "CMT" : "CMTs"})
                  </button>
                )}
                <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border ${getTierBadgeClass(customer.tier)}`}>
                  {customer.tier === "Founders Family" ? "Priority Client – Founders Family" : `${customer.tier} Tier`}
                </span>
                {customer.adventist === "Yes" && (
                  <div className="w-full mt-2">
                    <AdventistAlert adventist={customer.adventist} />
                  </div>
                )}
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
              title="Edit Profile"
            >
              <span className="text-sm leading-none font-bold select-none">✎</span>
              <span>Edit Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSecondaryExpanded(!isSecondaryExpanded)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-xs border bg-white/10 hover:bg-white/20 text-white border-white/20 cursor-pointer"
              title="Toggle Secondary Operational Details"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-300" />
              <span>Operational Info</span>
              {isSecondaryExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5 text-slate-300" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-slate-300" />}
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

        {/* Quick Client Home Bar */}
        <div className={`flex flex-wrap items-center gap-3 mt-6 pt-5 border-t ${isCeo || isLibrarium || isDual ? "border-white/10" : "border-slate-200/60"}`}>
          <div className="label-value-row items-center">
            <span className={`label-value-label text-[10px] font-bold uppercase tracking-widest ${brandTextLightClass}`}>Client Home:</span>
            <span className={`label-value-val px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border shadow-xs ${
              clientHomeValue === "CEO Lifestyle | Librarium Luxe"
                ? "bg-purple-900/90 text-purple-200 border-purple-500"
                : clientHomeValue === "Librarium Luxe"
                  ? "bg-rose-850 text-white border-rose-600/50"
                  : "bg-blue-600 text-white border-blue-400/50"
            }`}>
              <Building2 className="w-3.5 h-3.5 shrink-0" /> <span className="break-words">{clientHomeValue}</span>
            </span>
          </div>

          <div className={`md:ml-auto flex items-center gap-4 text-xs font-bold ${subtitleTextClass}`}>
            {getOpenPromisesCount(customer) > 0 && (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("client-promises-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-1.5 text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-700/80 px-2.5 py-0.5 rounded text-[11px] font-extrabold transition-all cursor-pointer shadow-xs"
                title={`${getOpenPromisesCount(customer)} Open Client Promises - Click to view`}
              >
                <span>({getOpenPromisesCount(customer)} {getOpenPromisesCount(customer) === 1 ? "CMT" : "CMTs"})</span>
              </button>
            )}
            {customer.adventist === "Yes" && (
              <div className="flex items-center gap-1 font-bold text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded border border-amber-700 shadow-xs">
                <span>Adventist ✝</span>
              </div>
            )}
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

      {/* SECONDARY PROFILE DROPDOWN / EXPANDABLE CLIENT INFORMATION AREA */}
      <div className="px-6 md:px-8 pt-6">
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-sm overflow-hidden text-left">
          <button
            type="button"
            onClick={() => setIsSecondaryExpanded(!isSecondaryExpanded)}
            className="w-full flex items-center justify-between p-4 bg-slate-850 hover:bg-slate-800/90 transition-all cursor-pointer select-none text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-slate-800 text-slate-300 rounded-lg">
                <Sliders className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  Secondary Profile & Operational Details
                  {customer.checkedIn && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      WhatsApp Checked In
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Expand to access WhatsApp Check-In status, communication preferences, and secondary operational details
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
                {isSecondaryExpanded ? "Hide Details" : "Expand Details"}
              </span>
              {isSecondaryExpanded ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
            </div>
          </button>

          {isSecondaryExpanded && (
            <div className="p-5 border-t border-slate-800 space-y-5 bg-slate-900/95">
              {/* WhatsApp Check-In Status & Action */}
              <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      WhatsApp Check-In Status
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                      customer.checkedIn
                        ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                        : "bg-slate-700 text-slate-300 border-slate-600"
                    }`}>
                      {customer.checkedIn ? "☑ Checked In" : "☐ Not Checked In"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed max-w-xl">
                    Mark when you have successfully reached out and reconnected with this client on WhatsApp. The directory filter and bulk reset tools remain synchronized.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextStatus = !customer.checkedIn;
                    onUpdateCustomer({ ...customer, checkedIn: nextStatus });
                    setSuccessMsg(nextStatus ? `Marked ${customer.firstName} ${customer.lastName} as Checked In via WhatsApp.` : `Marked ${customer.firstName} ${customer.lastName} as Not Checked In.`);
                  }}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border cursor-pointer ${
                    customer.checkedIn
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400"
                      : "bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                  }`}
                  title="Toggle WhatsApp Check-In Status"
                >
                  <span className="font-mono text-sm">{customer.checkedIn ? "☑" : "☐"}</span>
                  <span>{customer.checkedIn ? "Mark as Not Checked In" : "Mark as Checked In"}</span>
                </button>
              </div>

              {/* Supporting Secondary Operational Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Communication Status</span>
                  <span className="text-white font-extrabold block">{customer.communicationStatus || "Active"}</span>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Preferred Channel</span>
                  <span className="text-white font-extrabold block">{customer.preferredCommunication || "WhatsApp"}</span>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Marketing Permission</span>
                  <span className="text-white font-extrabold block">{customer.marketingPermission !== "No" ? "Marketing Active" : "Opted Out"}</span>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Account Operational Status</span>
                  <span className="text-white font-extrabold block">{customer.deactivated ? "Archived / Inactive" : (customer.accountStatus || "Active")}</span>
                </div>
              </div>
            </div>
          )}
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
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Personal Identity & Intelligence Profile</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded">V2.1 Intelligence</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* 1. Client Full Name */}
              <div className="sm:col-span-2 space-y-1 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Client Full Name</span>
                <span className="text-base font-black text-white block">{customer.firstName} {customer.lastName}</span>
                <span className="text-[10px] font-mono text-slate-400 block">CL ID: {customer.id}</span>
              </div>

              {/* 2. Gender */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gender</span>
                <span className="text-xs font-extrabold text-white block">{customer.gender || "N/A"}</span>
              </div>

              {/* 3. Drive */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Drive</span>
                <span className="text-xs font-extrabold text-white block">{customer.drive || "No"}</span>
              </div>

              {/* 4. Last Contact */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Contact</span>
                <span className="text-xs font-extrabold text-white block">
                  {customer.lastContactedDate ? `${customer.lastContactedDate} (${customer.preferredCommunication || "WhatsApp"})` : "Never / Recent"}
                </span>
              </div>

              {/* 5. Adventist */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Adventist</span>
                <span className="text-xs font-bold text-slate-100 block">
                  {customer.adventist === "Yes" ? "Adventist ✝" : "No"}
                </span>
              </div>

              {/* 6. Google Review */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Google Review</span>
                <span className="text-xs font-extrabold text-white block">
                  {customer.googleReview === "Yes" ? "⭐ Yes (Provided)" : "No"}
                </span>
              </div>

              {/* 7. Consolidated Client Home */}
              <div className="space-y-1 sm:col-span-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Client Home</span>
                  <span className="text-xs text-slate-300 font-medium">Primary Brand Connection & Relationship</span>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase border tracking-wider flex items-center gap-1.5 ${
                  clientHomeValue === "CEO Lifestyle | Librarium Luxe"
                    ? "bg-purple-950 text-purple-200 border-purple-700"
                    : clientHomeValue === "Librarium Luxe"
                      ? "bg-rose-950 text-rose-200 border-rose-800"
                      : "bg-blue-950 text-blue-200 border-blue-700"
                }`}>
                  <Building2 className="w-3.5 h-3.5" />
                  {clientHomeValue}
                </span>
              </div>

              {/* 8. Relationship Health Score */}
              <div className="space-y-1 sm:col-span-2">
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

          {/* CLIENT PROMISES SECTION */}
          <div id="client-promises-section" className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 text-left space-y-4">
            {/* CLIENT COMMITMENTS (CMT) SECTION */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-200 flex items-center gap-2">
                    Client Commitments (CMT)
                    {getOpenPromisesCount(customer) > 0 && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-extrabold rounded-full border border-amber-500/30">
                        {getOpenPromisesCount(customer)} Open
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Things personally promised, agreed to, or decided to honor for this client</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[10px]">
                  {(["Open", "All", "Completed", "Cancelled"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setCommitmentFilter(st as any)}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        (commitmentFilter === st || (st === "Completed" && commitmentFilter === "Fulfilled"))
                          ? "bg-slate-700 text-white shadow-xs"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCommitment(null);
                    setCommitmentText("");
                    setCommitmentDueDate("");
                    setCommitmentStatus("Open");
                    setCommitmentNotes("");
                    setShowAddCommitmentModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Commitment
                </button>
              </div>
            </div>

            {/* Commitments List */}
            {getClientPromises(customer).length === 0 ? (
              <div className="p-6 text-center bg-slate-800/40 border border-slate-800 rounded-xl space-y-2">
                <HeartHandshake className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-300 font-medium">No client commitments recorded yet.</p>
                <p className="text-[11px] text-slate-400">Record promised discounts, replacement items, free delivery, or special arrangements to ensure client obligations are remembered and honored.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {getClientPromises(customer)
                  .filter(p => {
                    if (commitmentFilter === "All") return true;
                    if (commitmentFilter === "Completed" || commitmentFilter === "Fulfilled") return p.status === "Completed" || p.status === "Fulfilled";
                    return p.status === commitmentFilter;
                  })
                  .map((prm) => (
                    <div 
                      key={prm.id} 
                      className={`p-3.5 rounded-xl border transition-all ${
                        prm.status === "Fulfilled" || prm.status === "Completed"
                          ? "bg-slate-800/30 border-slate-800/80 opacity-75"
                          : prm.status === "Cancelled"
                            ? "bg-slate-800/20 border-slate-800/40 opacity-50"
                            : "bg-slate-800/80 border-slate-700/80 hover:border-amber-500/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleCommitmentStatus(prm.id, prm.status)}
                            title={prm.status === "Open" ? "Mark as Completed" : "Reopen Commitment"}
                            className={`mt-0.5 p-1 rounded-lg border transition-all shrink-0 cursor-pointer ${
                              prm.status === "Fulfilled" || prm.status === "Completed"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30"
                                : "bg-slate-800 text-slate-400 border-slate-700 hover:border-amber-400 hover:text-amber-300"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-bold ${prm.status === "Fulfilled" || prm.status === "Completed" ? "line-through text-slate-400" : "text-white"}`}>
                                {prm.promise || prm.commitment}
                              </span>
                              <span className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                                prm.status === "Open"
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                  : (prm.status === "Fulfilled" || prm.status === "Completed")
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                    : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                              }`}>
                                {prm.status === "Fulfilled" ? "Completed" : prm.status}
                              </span>
                            </div>
                            {prm.notes && (
                              <p className="text-[11px] text-slate-300 leading-relaxed">{prm.notes}</p>
                            )}
                            <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-0.5 flex-wrap">
                              {prm.dueDate ? (
                                <span className="flex items-center gap-1 font-mono">
                                  <Calendar className="w-3 h-3 text-slate-500" />
                                  Due: <strong className="text-slate-200">{prm.dueDate}</strong>
                                </span>
                              ) : (
                                <span className="text-slate-500 italic">No fixed due date</span>
                              )}
                              {prm.createdDate && (
                                <span className="text-slate-500">Created {prm.createdDate}</span>
                              )}
                              {(prm.completedDate || prm.fulfilledDate) && (
                                <span className="text-emerald-400 font-semibold">Completed {prm.completedDate || prm.fulfilledDate}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCommitment(prm)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                            title="Edit Commitment"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCommitment(prm.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                            title="Delete Commitment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* CLIENT HISTORY PRESERVATION TIMELINE */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Client History Preservation</h3>
              <span className="text-[10px] font-bold text-slate-400">Never Deleted</span>
            </div>

            {/* Progression Sequence Display */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 label-value-row items-center text-xs font-bold text-slate-700">
              <span className="label-value-label text-[10px] font-black text-slate-400 uppercase tracking-wider">Status Trail:</span>
              <div className="label-value-val flex items-center gap-2 flex-wrap">
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
                  <a 
                    href={`tel:${customer.contact.phoneNumber}`} 
                    onClick={(e) => {
                      if (isAdventistCommunicationRestricted(customer.adventist)) {
                        e.preventDefault();
                        setIsAdventistModalOpen(true);
                      }
                    }}
                    className="text-slate-900 font-bold flex items-center gap-1.5 mt-1 hover:underline"
                  >
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
                  <a 
                    href={`mailto:${customer.contact.email}`} 
                    onClick={(e) => {
                      if (isAdventistCommunicationRestricted(customer.adventist)) {
                        e.preventDefault();
                        setIsAdventistModalOpen(true);
                      }
                    }}
                    className="text-slate-900 font-bold flex items-center gap-1.5 mt-1 hover:underline"
                  >
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
                      <span className="text-slate-400 font-bold block mb-1.5 text-[9px] uppercase tracking-wider">Favourite Colour</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {Array.from(new Set(customer.interests.favoriteColors || [])).map(col => (
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

          {/* Follow-up Reminders & Active Tasks */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`text-[10px] font-bold uppercase tracking-widest text-left ${sectionTitleClass}`}>Active Reminders & Tasks</h3>
              <button 
                onClick={() => setShowAddReminder(!showAddReminder)}
                className="text-slate-700 hover:text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
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
                    className="px-2.5 py-1.5 text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-[11px] font-bold rounded-md shadow-xs cursor-pointer"
                  >
                    Save Reminder
                  </button>
                </div>
              </form>
            )}

            {/* Active Reminders Box (Active tasks, due today, or scheduled future) */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 text-xs text-left shadow-sm space-y-4">
              {(() => {
                const activeReminders = customer.reminders.filter(rem => {
                  const isOpp = rem.milestone?.triggerType === "advance_opportunity";
                  const isResolved = rem.completed || rem.opportunityStatus === "Resolved" || rem.opportunityStatus === "Converted" || rem.opportunityStatus === "Closed";
                  if (isResolved) return false;

                  const actionDate = rem.nextActionDate || rem.date;
                  const dateState = getFollowUpActionState(actionDate, isResolved, rem.opportunityStatus);

                  if (isOpp && dateState.status === "Missed") {
                    return false; // Missed opportunities move to Missed Opportunities history
                  }
                  return true;
                });

                if (activeReminders.length === 0) {
                  return <p className="text-slate-400 text-center py-2 italic text-[11px]">No pending tasks or active follow-ups.</p>;
                }

                return (
                  <div className="space-y-3">
                    {activeReminders.map(rem => {
                      const isOpp = rem.milestone?.triggerType === "advance_opportunity";
                      const actionDate = rem.nextActionDate || rem.date;
                      const dateState = getFollowUpActionState(actionDate, false, rem.opportunityStatus);
                      const followUpCount = rem.followUpCount || 0;

                      return (
                        <div key={rem.id} className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                          <div className="flex gap-2.5 items-start">
                            <button 
                              onClick={() => toggleReminder(rem.id)}
                              className="mt-0.5 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                            >
                              <Circle className="w-4 h-4" />
                            </button>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-slate-800">
                                  {rem.task}
                                </p>
                                {isOpp && (
                                  <span className="bg-amber-100 text-amber-900 font-extrabold text-[9px] px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wider">
                                    Opportunity • Follow-Up {Math.min(followUpCount + 1, 3)}/3
                                  </span>
                                )}
                                {isOpp && dateState.status === "Due" && (
                                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Due Today
                                  </span>
                                )}
                                {isOpp && dateState.status === "Upcoming" && (
                                  <span className="bg-blue-50 text-blue-800 font-semibold text-[9px] px-2 py-0.5 rounded border border-blue-200">
                                    {dateState.label}
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mt-1 font-mono uppercase tracking-wider">
                                <Clock className="w-3.5 h-3.5 text-slate-400" /> Action Date: {actionDate}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Missed Opportunities History Section */}
          {(() => {
            const missedOpportunities = customer.reminders.filter(rem => {
              const isOpp = rem.milestone?.triggerType === "advance_opportunity";
              if (!isOpp) return false;
              const isResolved = rem.completed || rem.opportunityStatus === "Resolved" || rem.opportunityStatus === "Converted" || rem.opportunityStatus === "Closed";
              if (isResolved) return false;

              const actionDate = rem.nextActionDate || rem.date;
              const dateState = getFollowUpActionState(actionDate, isResolved, rem.opportunityStatus);
              return dateState.status === "Missed" || rem.opportunityStatus === "Missed Opportunity" || rem.opportunityStatus === "Missed";
            });

            if (missedOpportunities.length === 0) return null;

            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className={`text-[10px] font-bold uppercase tracking-widest text-left text-rose-800 flex items-center gap-1.5`}>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Missed Opportunities ({missedOpportunities.length})</span>
                  </h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Historical Log</span>
                </div>

                <div className="bg-rose-50/40 border border-rose-200/70 rounded-2xl p-4 text-xs text-left space-y-3">
                  {missedOpportunities.map(opp => {
                    const actionDate = opp.nextActionDate || opp.date;
                    const daysMissed = getDaysSince(actionDate);
                    const followUpCount = opp.followUpCount || 0;

                    return (
                      <div key={opp.id} className="p-3 bg-white/90 rounded-xl border border-rose-200/80 shadow-2xs space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">{opp.task}</span>
                              <span className="bg-rose-100 text-rose-800 font-extrabold text-[9px] px-2 py-0.5 rounded-full border border-rose-200">
                                Missed Opportunity
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              Target: <span className="font-semibold text-slate-700">{opp.milestone?.personName || customer.firstName}</span> ({opp.milestone?.relationship || "Client"} {opp.milestone?.eventType || "Milestone"})
                            </p>
                          </div>
                          <span className="text-[9px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 whitespace-nowrap">
                            Date: {actionDate} ({daysMissed}d ago)
                          </span>
                        </div>

                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                          <span>Progress: {followUpCount} of 3 follow-ups attempted before date expiration</span>
                          <span className="italic text-slate-400">Archived on client profile</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Resolved & Handled Opportunities History */}
          {(() => {
            const completedOpportunities = customer.reminders.filter(rem => {
              const isOpp = rem.milestone?.triggerType === "advance_opportunity";
              const isResolved = rem.completed || rem.opportunityStatus === "Resolved" || rem.opportunityStatus === "Converted" || rem.opportunityStatus === "Closed";
              return isOpp && isResolved;
            });

            if (completedOpportunities.length === 0) return null;

            return (
              <div className="space-y-3">
                <h3 className={`text-[10px] font-bold uppercase tracking-widest text-left text-emerald-800 flex items-center gap-1.5`}>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Resolved Opportunity History ({completedOpportunities.length})</span>
                </h3>

                <div className="bg-emerald-50/40 border border-emerald-200/70 rounded-2xl p-4 text-xs text-left space-y-2.5">
                  {completedOpportunities.map(opp => (
                    <div key={opp.id} className="p-3 bg-white/90 rounded-xl border border-emerald-200/80 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 text-xs">{opp.task}</span>
                        <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[9px] px-2 py-0.5 rounded-full border border-emerald-200">
                          {opp.opportunityStatus || "Completed"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>Action Date: {opp.nextActionDate || opp.date}</span>
                        {opp.completedAt && <span>Resolved on {new Date(opp.completedAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Interaction & Activity Timeline */}
          <div className="space-y-4 pt-4 border-t border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className={`text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 ${sectionTitleClass}`}>
                  <Activity className="w-4 h-4 text-slate-800" />
                  <span>Interaction & Activity Timeline</span>
                  <span className="bg-slate-200 text-slate-800 text-[10px] font-black px-2 py-0.5 rounded-full ml-1">
                    {filteredTimeline.length}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  Chronological history of communications, orders, status changes, and CRM events.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowAddEvent(!showAddEvent)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Interaction
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[
                { id: "All", label: "All Activity" },
                { id: "Communications", label: "WhatsApp & Calls" },
                { id: "Orders", label: "Orders & Status" },
                { id: "Notes & Milestones", label: "Notes & Milestones" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTimelineFilter(tab.id)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    timelineFilter === tab.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Log Interaction Form */}
            {showAddEvent && (
              <form onSubmit={handleAddEvent} className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 animate-fade-in text-left shadow-sm">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Record New Activity</span>
                  <button type="button" onClick={() => setShowAddEvent(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Communication Channel / Event</label>
                    <select
                      value={eventChannel}
                      onChange={(e) => setEventChannel(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-2 text-xs font-bold text-slate-800"
                    >
                      <option value="WhatsApp">WhatsApp Message / Follow-up</option>
                      <option value="Phone Call">Phone Call</option>
                      <option value="Customer Response">Customer Response</option>
                      <option value="In-Person">In-Person Meeting</option>
                      <option value="Email">Email Communication</option>
                      <option value="General Note">Client Note</option>
                      <option value="Gift">Complimentary Gift</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Event Date</label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-2 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Activity Summary / Discussion Details</label>
                  <textarea
                    required
                    placeholder="E.g., Follow-up sent via WhatsApp regarding book design sample. Customer confirmed approval..."
                    value={eventContent}
                    onChange={(e) => setEventContent(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-2 text-xs font-medium text-slate-800"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button 
                    type="button" 
                    onClick={() => setShowAddEvent(false)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-1.5 text-xs font-extrabold rounded-xl shadow-xs"
                  >
                    Save Activity
                  </button>
                </div>
              </form>
            )}

            {/* Timeline Stream */}
            <div className="relative pl-6 space-y-4 text-left border-l-2 border-slate-200/80 pt-2">
              {filteredTimeline.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-medium">
                  No interaction history recorded for this view.
                </div>
              ) : (
                filteredTimeline.map((evt) => {
                  let icon = <MessageSquare className="w-3.5 h-3.5 text-slate-700" />;
                  let iconBg = "bg-slate-100 border-slate-300";
                  let badgeStyle = "bg-slate-100 text-slate-800 border-slate-200";
                  let channelLabel = evt.method || evt.type;

                  if (evt.type === "WhatsApp" || evt.method === "WhatsApp" || (evt.content && evt.content.toLowerCase().includes("whatsapp"))) {
                    icon = <MessageSquare className="w-3.5 h-3.5 text-emerald-800" />;
                    iconBg = "bg-emerald-100 border-emerald-300";
                    badgeStyle = "bg-emerald-100 text-emerald-950 border-emerald-300";
                    channelLabel = "WhatsApp";
                  } else if (evt.type === "Phone Call" || evt.method === "Phone Call" || (evt.content && evt.content.toLowerCase().includes("call"))) {
                    icon = <Phone className="w-3.5 h-3.5 text-sky-800" />;
                    iconBg = "bg-sky-100 border-sky-300";
                    badgeStyle = "bg-sky-100 text-sky-950 border-sky-300";
                    channelLabel = "Phone Call";
                  } else if (evt.type === "Customer Response") {
                    icon = <MessageSquare className="w-3.5 h-3.5 text-purple-800" />;
                    iconBg = "bg-purple-100 border-purple-300";
                    badgeStyle = "bg-purple-100 text-purple-950 border-purple-300";
                    channelLabel = "Customer Response";
                  } else if (evt.type === "In-Person") {
                    icon = <HeartHandshake className="w-3.5 h-3.5 text-amber-800" />;
                    iconBg = "bg-amber-100 border-amber-300";
                    badgeStyle = "bg-amber-100 text-amber-950 border-amber-300";
                    channelLabel = "In-Person";
                  } else if (evt.type === "Order Created" || evt.type === "Order" || evt.type === "Order Placement") {
                    icon = <ShoppingBag className="w-3.5 h-3.5 text-indigo-900" />;
                    iconBg = "bg-indigo-100 border-indigo-300";
                    badgeStyle = "bg-indigo-100 text-indigo-950 border-indigo-300";
                    channelLabel = "Order Created";
                  } else if (evt.type === "Order Status Changed") {
                    icon = <RefreshCw className="w-3.5 h-3.5 text-amber-900" />;
                    iconBg = "bg-amber-100 border-amber-300";
                    badgeStyle = "bg-amber-100 text-amber-950 border-amber-300";
                    channelLabel = "Status Update";
                  } else if (evt.type === "Order Completed") {
                    icon = <Check className="w-3.5 h-3.5 text-emerald-900" />;
                    iconBg = "bg-emerald-100 border-emerald-300";
                    badgeStyle = "bg-emerald-100 text-emerald-950 border-emerald-300";
                    channelLabel = "Order Completed";
                  } else if (evt.type === "Milestone") {
                    icon = <Trophy className="w-3.5 h-3.5 text-purple-800" />;
                    iconBg = "bg-purple-100 border-purple-300";
                    badgeStyle = "bg-purple-100 text-purple-950 border-purple-300";
                    channelLabel = "Milestone";
                  } else if (evt.type === "Tier Changed") {
                    icon = <Sparkles className="w-3.5 h-3.5 text-amber-800" />;
                    iconBg = "bg-amber-100 border-amber-300";
                    badgeStyle = "bg-amber-100 text-amber-950 border-amber-300";
                    channelLabel = "Tier Update";
                  }

                  return (
                    <div key={evt.id} className="relative group animate-fade-in">
                      {/* Timeline Node Dot */}
                      <div className={`absolute -left-[35px] top-1.5 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${iconBg}`}>
                        {icon}
                      </div>

                      <div className="bg-white hover:bg-slate-50/80 border border-slate-200 p-3.5 rounded-2xl transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider ${badgeStyle}`}>
                              {channelLabel}
                            </span>
                            {evt.orderNumber && (
                              <span className="font-mono font-bold text-slate-800 text-[10px]">
                                {evt.orderNumber}
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 font-bold font-mono text-[10px]">
                            {evt.date}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1">
                          {evt.content}
                        </p>

                        {evt.amount && evt.amount > 0 && (
                          <div className="mt-2 inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-900 font-mono">
                            <span>Amount:</span>
                            <span className="font-extrabold text-slate-950">${evt.amount.toLocaleString()} JMD</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

      {showAddCommitmentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 text-left shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-amber-400" />
                {editingCommitment ? "Edit Client Commitment (CMT)" : "New Client Commitment (CMT)"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddCommitmentModal(false);
                  setEditingCommitment(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCommitment} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Commitment Description <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free delivery on next order, replacement book, 10% discount on reorder..."
                  value={commitmentText}
                  onChange={(e) => setCommitmentText(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Due Date <span className="text-slate-500 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={commitmentDueDate}
                    onChange={(e) => setCommitmentDueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Status
                  </label>
                  <select
                    value={commitmentStatus}
                    onChange={(e) => setCommitmentStatus(e.target.value as PromiseStatus)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Open">Open</option>
                    <option value="Fulfilled">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Notes / Details <span className="text-slate-500 font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Additional context or details regarding this agreement..."
                  value={commitmentNotes}
                  onChange={(e) => setCommitmentNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCommitmentModal(false);
                    setEditingCommitment(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl cursor-pointer"
                >
                  {editingCommitment ? "Save Changes" : "Save Promise"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdventistWarningModal
        isOpen={isAdventistModalOpen}
        onClose={() => setIsAdventistModalOpen(false)}
        clientName={`${customer.firstName} ${customer.lastName}`}
        actionName="Client Communication"
      />

    </div>
  );
}
