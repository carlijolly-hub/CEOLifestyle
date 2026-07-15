import React, { useState, useMemo } from "react";
import { Client, FollowUpReminder, TimelineEvent, LuxeBookInventoryItem } from "../types";
import { 
  Users, 
  Printer, 
  BookOpen, 
  Globe, 
  Award, 
  Calendar, 
  DollarSign, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Package,
  Clock,
  AlertCircle,
  Gift,
  MessageSquare,
  Notebook,
  Heart,
  Sparkles,
  Search,
  Activity,
  CheckCircle2,
  Smartphone,
  Mail
} from "lucide-react";
import { SmallCalendarWidget } from "./MilestoneCalendar";

interface DashboardProps {
  clients: Client[];
  inventory?: LuxeBookInventoryItem[];
  onSelectClient: (clientId: string) => void;
  onNavigateToTab: (tab: string) => void;
  onOpenTask?: (clientId: string, reminderId: string) => void;
}

const MONTH_MAP: { [key: string]: number } = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11
};

// Simulation Date: July 8, 2026
const CURRENT_YEAR = 2026;
const CURRENT_MONTH = 6; // July
const CURRENT_DAY = 8;
const CURRENT_SIM_DATE = new Date(CURRENT_YEAR, CURRENT_MONTH, CURRENT_DAY);

// 1. Robust Date Parsing
function parseDateString(dateStr: string): { month: number; day: number; year?: number } | null {
  if (!dateStr) return null;
  const s = dateStr.trim();
  
  // Try YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1], 10),
      month: parseInt(isoMatch[2], 10) - 1,
      day: parseInt(isoMatch[3], 10)
    };
  }

  // Clean strings like "August 22, 2018"
  const cleaned = s.toLowerCase().replace(/,/g, "").replace(/:/g, " ").trim();
  const tokens = cleaned.split(/\s+/);
  
  let month = -1;
  let day = -1;
  let year: number | undefined = undefined;

  for (const token of tokens) {
    if (MONTH_MAP[token] !== undefined) {
      month = MONTH_MAP[token];
    } else {
      const parsedVal = parseInt(token, 10);
      if (!isNaN(parsedVal)) {
        if (parsedVal > 1900 && parsedVal < 2100) {
          year = parsedVal;
        } else if (parsedVal >= 1 && parsedVal <= 31) {
          if (day === -1) {
            day = parsedVal;
          } else {
            if (parsedVal > 100) {
              year = parsedVal;
            }
          }
        }
      }
    }
  }

  if (month !== -1 && day !== -1) {
    return { month, day, year };
  }
  return null;
}

// 2. Days until next occurrence (for recurring events like birthdays)
function getDaysUntilNext(month: number, day: number): number {
  const current = new Date(CURRENT_YEAR, CURRENT_MONTH, CURRENT_DAY);
  let target = new Date(CURRENT_YEAR, month, day);
  
  if (target.getTime() < current.getTime()) {
    target = new Date(CURRENT_YEAR + 1, month, day);
  }
  
  const diffTime = target.getTime() - current.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 3. Days since a historical date (can return negative values if the date is in the future)
function getDaysSince(dateStr: string): number {
  if (!dateStr) return 9999;
  const parsed = parseDateString(dateStr);
  if (!parsed) return 9999;
  
  const year = parsed.year || CURRENT_YEAR;
  const dateObj = new Date(year, parsed.month, parsed.day);
  const diffTime = CURRENT_SIM_DATE.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

interface TriggerItem {
  type: "birthday" | "anniversary" | "child_birthday" | "order_anniversary" | "reminder" | "no_contact" | "no_order";
  priority: 1 | 2 | 3 | 4;
  reason: string;
  daysRemaining?: number;
  metadata?: any;
}

interface FocusProfile {
  client: Client;
  highestPriority: number;
  triggers: TriggerItem[];
}

export default function Dashboard({ clients, inventory = [], onSelectClient, onNavigateToTab, onOpenTask }: DashboardProps) {
  const [focusFilter, setFocusFilter] = useState<"all" | "urgent" | "milestones" | "dormant" | "tasks">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [summaryTab, setSummaryTab] = useState<"today" | "this_week" | "overview">("today");
  const [expandedAttentionId, setExpandedAttentionId] = useState<string | null>(null);

  // Luxe Inventory Alerts
  const inventoryAlerts = useMemo(() => {
    const outOfStock = inventory.filter(item => item.quantity <= 0);
    const lowStock = inventory.filter(item => item.quantity > 0 && item.quantity <= 5);
    const urgentRestock = inventory.filter(item => item.rankingStatus === "Urgent Restock" && item.quantity > 0);
    const activeAlertsList = inventory.filter(item => item.quantity <= 5 || item.rankingStatus === "Urgent Restock");
    return {
      outOfStock,
      lowStock,
      urgentRestock,
      activeAlertsList,
      totalAlerts: activeAlertsList.length
    };
  }, [inventory]);

  // Format currency beautifully (JMD)
  const formatCurrency = (val: number) => {
    return `J$${Math.round(val).toLocaleString()}`;
  };

  const getBrandCardClasses = (homeBrand: string) => {
    if (homeBrand === "CEO Printing Services") {
      return "bg-blue-50/45 border-blue-200/85 hover:bg-blue-50/70 border-l-4 border-l-blue-600";
    }
    if (homeBrand === "Librarium Luxe") {
      return "bg-rose-50/35 border-[#5C1A24]/30 hover:bg-rose-50/70 border-l-4 border-l-[#5C1A24]";
    }
    if (homeBrand === "CEO Lifestyle") {
      return "bg-purple-50/35 border-purple-200/80 hover:bg-purple-50/70 border-l-4 border-l-purple-700";
    }
    return "bg-slate-50 border-slate-200 hover:bg-slate-100 border-l-4 border-l-slate-400";
  };

  // 4. GENERATE INTELLIGENT RELATIONSHIP FOCUS PROFILES
  const focusProfiles = useMemo(() => {
    const profiles: FocusProfile[] = [];

    clients.forEach(client => {
      const triggers: TriggerItem[] = [];
      const isGold = client.tier === "Gold" || client.tier === "Platinum";

      // A. Upcoming Personal Dates (Birthday, Anniversaries)
      client.importantDates.forEach(d => {
        const parsed = parseDateString(d.date);
        if (!parsed) return;

        const days = getDaysUntilNext(parsed.month, parsed.day);
        
        if (days >= 0 && days <= 30) {
          const isBirthday = d.label.toLowerCase() === "birthday";
          const labelLower = d.label.toLowerCase();
          const isAnniversary = labelLower.includes("anniversary") || labelLower.includes("wedding") || labelLower.includes("proposal");
          
          let type: TriggerItem["type"] = "anniversary";
          if (isBirthday) type = "birthday";

          // Priority Rules:
          // 1. Gold client + event within 30 days -> Priority 1
          // 3. Repeat/Standard client + upcoming event -> Priority 3
          const priority = isGold ? 1 : 3;

          let reason = "";
          if (days === 0) {
            reason = `${d.label} is TODAY! Send immediate personalized greetings.`;
          } else {
            reason = `${d.label} is approaching in ${days} day${days > 1 ? 's' : ''} (${d.date}).`;
          }

          triggers.push({ type, priority, reason, daysRemaining: days, metadata: { date: d.date, label: d.label } });
        }
      });

      // B. Upcoming Child Birthdays
      if (client.profile.children) {
        client.profile.children.forEach(child => {
          if (!child.birthday) return;
          const parsed = parseDateString(child.birthday);
          if (!parsed) return;

          const days = getDaysUntilNext(parsed.month, parsed.day);
          if (days >= 0 && days <= 30) {
            const priority = isGold ? 1 : 3;
            const reason = days === 0 
              ? `Child ${child.name}'s Birthday is TODAY! Consider a personal touch.` 
              : `Child ${child.name}'s Birthday is in ${days} days (${child.birthday}).`;

            triggers.push({
              type: "child_birthday",
              priority,
              reason,
              daysRemaining: days,
              metadata: { name: child.name, date: child.birthday }
            });
          }
        });
      }

      // C. Previous Order Anniversaries (Re-purchase reminders)
      client.timeline.forEach(event => {
        if (event.type === "Order" && event.date) {
          const parsed = parseDateString(event.date);
          if (!parsed || !parsed.year) return;

          const days = getDaysUntilNext(parsed.month, parsed.day);
          const yearsAgo = CURRENT_YEAR - parsed.year;

          if (days >= 0 && days <= 30 && yearsAgo > 0) {
            // Repeat client with event -> Priority 3
            triggers.push({
              type: "order_anniversary",
              priority: 3,
              reason: days === 0
                ? `Purchase Anniversary: Ordered "${event.content}" exactly ${yearsAgo} year${yearsAgo > 1 ? 's' : ''} ago today!`
                : `Purchase Anniversary approaching: Bought "${event.content}" ${yearsAgo} year${yearsAgo > 1 ? 's' : ''} ago on this date. Good moment to follow up.`,
              daysRemaining: days,
              metadata: { item: event.content, date: event.date, yearsAgo }
            });
          }
        }
      });

      // D. Follow-up Reminders / Pending Tasks
      client.reminders.forEach(reminder => {
        if (!reminder.completed) {
          const daysDiff = -getDaysSince(reminder.date); // Negative if overdue, positive if upcoming
          
          // If the date has passed (daysDiff < 0), it should never be an urgent task regardless of the year
          if (daysDiff < 0) return;

          if (daysDiff <= 15) { // Due within next 15 days, or overdue
            // Priority Rules:
            // 1. Gold client + task within 30 days/overdue -> Priority 1
            // 4. Standard client follow-up -> Priority 4
            const priority = isGold ? 1 : 4;

            let reason = "";
            if (daysDiff < 0) {
              reason = `Overdue task: "${reminder.task}" was due ${Math.abs(daysDiff)} day${Math.abs(daysDiff) > 1 ? 's' : ''} ago!`;
            } else if (daysDiff === 0) {
              reason = `Task due TODAY: "${reminder.task}"`;
            } else {
              reason = `Task: "${reminder.task}" is due in ${daysDiff} day${daysDiff > 1 ? 's' : ''}.`;
            }

            triggers.push({
              type: "reminder",
              priority,
              reason,
              daysRemaining: daysDiff,
              metadata: reminder
            });
          }
        }
      });

      // E. Gold/VIP Relationship Attention (no contact in 90 days)
      if (isGold) {
        const daysSinceContact = getDaysSince(client.lastContactedDate);
        if (daysSinceContact > 90) {
          triggers.push({
            type: "no_contact",
            priority: 2, // Gold client + no recent interaction
            reason: `Elite Account Inactivity: No personal contact logged in ${daysSinceContact} days (Last touch: ${client.lastContactedDate || "Never"}).`
          });
        }

        // F. Gold/VIP Dormant Purchaser (no orders in 180 days)
        const daysSinceOrder = getDaysSince(client.history.lastOrderDate);
        if (daysSinceOrder > 180) {
          triggers.push({
            type: "no_order",
            priority: 2, // Gold client + no recent interaction
            reason: `Dormant Account: No purchase transactions recorded in ${daysSinceOrder} days (Last order: ${client.history.lastOrderDate || "Never"}).`
          });
        }
      }

      // If they have any active focus triggers, compile them into a profile
      if (triggers.length > 0) {
        const highestPriority = Math.min(...triggers.map(t => t.priority)) as FocusProfile["highestPriority"];
        
        // Sort triggers inside the profile: urgent priority first, then closest days remaining
        const sortedTriggers = [...triggers].sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          return (a.daysRemaining || 0) - (b.daysRemaining || 0);
        });

        profiles.push({
          client,
          highestPriority,
          triggers: sortedTriggers
        });
      }
    });

    // Main focus profiles sort order:
    // 1. Highest Priority level (Priority 1 first, then 2, 3, 4)
    // 2. Gold/VIP clients rank higher within same priority levels
    // 3. Alphabetical by last name
    return profiles.sort((a, b) => {
      if (a.highestPriority !== b.highestPriority) {
        return a.highestPriority - b.highestPriority;
      }
      const aIsGold = a.client.tier === "Gold" || a.client.tier === "Platinum" ? 1 : 0;
      const bIsGold = b.client.tier === "Gold" || b.client.tier === "Platinum" ? 1 : 0;
      if (aIsGold !== bIsGold) return bIsGold - aIsGold; // Gold first
      return `${a.client.firstName} ${a.client.lastName}`.localeCompare(`${b.client.firstName} ${b.client.lastName}`);
    });
  }, [clients]);

  // 5. FILTER focus profiles by state selections & search query
  const filteredFocusProfiles = useMemo(() => {
    return focusProfiles.filter(profile => {
      // Apply Search filter
      const fullName = `${profile.client.firstName} ${profile.client.lastName}`.toLowerCase();
      if (searchQuery && !fullName.includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Apply Focus Category Filter
      if (focusFilter === "urgent") {
        return profile.highestPriority === 1;
      }
      if (focusFilter === "milestones") {
        return profile.triggers.some(t => ["birthday", "anniversary", "child_birthday", "order_anniversary"].includes(t.type));
      }
      if (focusFilter === "dormant") {
        return profile.triggers.some(t => ["no_contact", "no_order"].includes(t.type));
      }
      if (focusFilter === "tasks") {
        return profile.triggers.some(t => t.type === "reminder");
      }
      return true;
    });
  }, [focusProfiles, focusFilter, searchQuery]);

  // 6. GOLD / VIP CLIENT METRICS & ALERTS
  const goldMetrics = useMemo(() => {
    const goldList = clients.filter(c => c.tier === "Gold" || c.tier === "Platinum");
    const needingAttention = focusProfiles.filter(p => 
      (p.client.tier === "Gold" || p.client.tier === "Platinum") && 
      (p.highestPriority === 1 || p.highestPriority === 2)
    );
    
    // Gold events within 30 days
    const upcomingGoldEvents = goldList.flatMap(c => 
      c.importantDates.filter(d => {
        const parsed = parseDateString(d.date);
        if (!parsed) return false;
        const days = getDaysUntilNext(parsed.month, parsed.day);
        return days >= 0 && days <= 30;
      }).map(d => ({
        client: c,
        event: d,
        days: getDaysUntilNext(parseDateString(d.date)!.month, parseDateString(d.date)!.day)
      }))
    ).sort((a, b) => a.days - b.days);

    // Aggregate preferences of Gold Clients
    const preferencesList = Array.from(
      new Set(goldList.flatMap(c => c.history.clientPreferences))
    ).slice(0, 5);

    return {
      totalGold: goldList.length,
      needingAttentionCount: needingAttention.length,
      upcomingEvents: upcomingGoldEvents.slice(0, 4),
      preferences: preferencesList,
      list: goldList
    };
  }, [clients, focusProfiles]);

  // 7. TIME-BASED WORKSPACE SUMMARIES (TODAY vs THIS WEEK vs OVERVIEW)
  const summaries = useMemo(() => {
    // TODAY Computations
    const contactToday = focusProfiles.filter(p => 
      p.highestPriority === 1 || 
      p.triggers.some(t => t.daysRemaining === 0)
    ).slice(0, 5);

    const eventsToday = focusProfiles.flatMap(p => 
      p.triggers
        .filter(t => t.daysRemaining !== undefined && t.daysRemaining >= 0 && t.daysRemaining <= 2 && ["birthday", "anniversary", "child_birthday"].includes(t.type))
        .map(t => ({ client: p.client, trigger: t }))
    ).sort((a, b) => (a.trigger.daysRemaining || 0) - (b.trigger.daysRemaining || 0)).slice(0, 5);

    const pendingRemindersToday = clients.flatMap(c => 
      c.reminders
        .filter(r => !r.completed && getDaysSince(r.date) === 0) // Only due today (past dates are excluded)
        .map(r => ({ client: c, reminder: r, overdueBy: 0 }))
    ).slice(0, 5);

    const activeOrdersLast30 = clients.flatMap(c => 
      c.timeline
        .filter(e => e.type === "Order" && getDaysSince(e.date) <= 30)
        .map(e => ({ client: c, event: e, daysAgo: getDaysSince(e.date) }))
    ).sort((a, b) => a.daysAgo - b.daysAgo).slice(0, 5);

    // THIS WEEK Computations (next 7 days)
    const birthdaysThisWeek = focusProfiles.flatMap(p => 
      p.triggers
        .filter(t => t.type === "birthday" && t.daysRemaining !== undefined && t.daysRemaining >= 0 && t.daysRemaining <= 7)
        .map(t => ({ client: p.client, trigger: t }))
    ).sort((a, b) => (a.trigger.daysRemaining || 0) - (b.trigger.daysRemaining || 0));

    const anniversariesThisWeek = focusProfiles.flatMap(p => 
      p.triggers
        .filter(t => t.type === "anniversary" && t.daysRemaining !== undefined && t.daysRemaining >= 0 && t.daysRemaining <= 7)
        .map(t => ({ client: p.client, trigger: t }))
    ).sort((a, b) => (a.trigger.daysRemaining || 0) - (b.trigger.daysRemaining || 0));

    const vipAttentionThisWeek = focusProfiles.filter(p => 
      (p.client.tier === "Gold" || p.client.tier === "Platinum") &&
      p.triggers.some(t => t.daysRemaining !== undefined && t.daysRemaining >= 0 && t.daysRemaining <= 7)
    ).slice(0, 5);

    // Filter reminders mentioning delivery keywords
    const deliveryRemindersThisWeek = clients.flatMap(c => 
      c.reminders
        .filter(r => {
          if (r.completed) return false;
          const daysDiff = -getDaysSince(r.date);
          const hasKeyword = ["deliver", "send", "ship", "box", "apparel", "gift", "shirts"].some(kw => r.task.toLowerCase().includes(kw));
          return daysDiff >= 0 && daysDiff <= 7 && hasKeyword;
        })
        .map(r => ({ client: c, reminder: r, daysLeft: -getDaysSince(r.date) }))
    ).sort((a, b) => a.daysLeft - b.daysLeft);

    // GENERAL OVERVIEW CALCULATIONS
    const totalRevenue = clients.reduce((sum, c) => sum + c.history.lifetimeRevenue, 0);
    const totalStandard = clients.filter(c => c.tier === "Silver").length;
    const totalVIP = clients.filter(c => c.tier === "Gold").length;
    const totalCorporate = clients.filter(c => c.tier === "Platinum").length;
    const totalAbroad = clients.filter(c => c.contact.country !== "Jamaica").length;
    
    const totalCeo = clients.filter(c => c.homeBrand === "CEO Printing Services" || c.homeBrand === "CEO Lifestyle").length;
    const totalLibrarium = clients.filter(c => c.homeBrand === "Librarium Luxe" || c.homeBrand === "CEO Lifestyle").length;
    const totalShared = clients.filter(c => c.homeBrand === "CEO Lifestyle").length;

    return {
      today: {
        contact: contactToday,
        events: eventsToday,
        reminders: pendingRemindersToday,
        activeOrders: activeOrdersLast30
      },
      thisWeek: {
        birthdays: birthdaysThisWeek,
        anniversaries: anniversariesThisWeek,
        vip: vipAttentionThisWeek,
        deliveries: deliveryRemindersThisWeek
      },
      overview: {
        totalRevenue,
        totalStandard,
        totalVIP,
        totalCorporate,
        totalAbroad,
        totalCeo,
        totalLibrarium,
        totalShared
      }
    };
  }, [clients, focusProfiles]);

  return (
    <div className="space-y-10 animate-fade-in text-slate-800">
      
      {/* 1. Header Banner */}
      <div className="text-left pb-6 border-b border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold tracking-widest text-slate-300 uppercase bg-slate-900/40 backdrop-blur-md px-2.5 py-1 rounded border border-slate-700/50">
              Personal Client Assistant
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-white drop-shadow-sm">
            Client Watchtower
          </h1>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2xl font-medium">
            Good evening, Manager. Let's look at who needs your personal attention today to foster authentic, high-value client experiences.
          </p>
        </div>
        
        {/* Sim Date Flag */}
        <div className="px-4 py-2.5 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl text-left">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">SYSTEM REFERENCE DATE</span>
          <span className="text-xs font-semibold text-white font-mono">July 8, 2026 (Wednesday)</span>
        </div>
      </div>

      {/* Luxe Inventory Deficit Alert Banner */}
      {inventoryAlerts.totalAlerts > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left shadow-[0_4px_20px_rgba(239,68,68,0.08)]">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-red-500/15 rounded-2xl border border-red-500/25">
              <Package className="w-5 h-5 text-red-400 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-200">Librarium Luxe Deficit Warning</h4>
              <p className="text-xs text-red-300/85 mt-0.5 leading-relaxed">
                {inventoryAlerts.totalAlerts} premium book edition{inventoryAlerts.totalAlerts > 1 ? 's are' : ' is'} out of stock, running low, or flagged for <strong>Urgent Restock</strong>.
              </p>
            </div>
          </div>
          <button 
            onClick={() => onNavigateToTab("inventory")}
            className="px-4 py-2 bg-red-900 hover:bg-red-800 text-red-100 text-xs font-bold rounded-xl border border-red-600/30 hover:border-red-500/50 transition-all shrink-0 self-start sm:self-center cursor-pointer shadow-xs"
          >
            Open Inventory Watchtower
          </button>
        </div>
      )}

      {/* 2. Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 8-columns: Daily Client Focus Center */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-left">
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                Clients Needing Attention Today
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">Identified automatically from personal events, purchase history, and touchpoint timelines.</p>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients..."
                className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Filter Bar Chips */}
          <div className="flex flex-wrap gap-2 pb-1 border-b border-slate-100">
            <button
              onClick={() => setFocusFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                focusFilter === "all" 
                  ? "bg-slate-900 text-white border-transparent" 
                  : "bg-white text-slate-500 border-slate-200/60 hover:border-slate-300"
              }`}
            >
              All Needs ({focusProfiles.length})
            </button>
            <button
              onClick={() => setFocusFilter("urgent")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${
                focusFilter === "urgent" 
                  ? "bg-red-600 text-white border-transparent shadow-[0_2px_8px_rgba(220,38,38,0.25)]" 
                  : "bg-white text-slate-500 border-slate-200/60 hover:border-slate-300 hover:text-red-600"
              }`}
            >
              <AlertCircle className={`w-3.5 h-3.5 ${focusFilter === "urgent" ? "text-white" : "text-red-500 animate-pulse"}`} /> Urgent Only ({focusProfiles.filter(p => p.highestPriority === 1).length})
            </button>
            <button
              onClick={() => setFocusFilter("milestones")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                focusFilter === "milestones" 
                  ? "bg-slate-900 text-white border-transparent" 
                  : "bg-white text-slate-500 border-slate-200/60 hover:border-slate-300"
              }`}
            >
              Milestones ({focusProfiles.filter(p => p.triggers.some(t => ["birthday", "anniversary", "child_birthday", "order_anniversary"].includes(t.type))).length})
            </button>
            <button
              onClick={() => setFocusFilter("dormant")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                focusFilter === "dormant" 
                  ? "bg-slate-900 text-white border-transparent" 
                  : "bg-white text-slate-500 border-slate-200/60 hover:border-slate-300"
              }`}
            >
              Dormant Contacts ({focusProfiles.filter(p => p.triggers.some(t => ["no_contact", "no_order"].includes(t.type))).length})
            </button>
            <button
              onClick={() => setFocusFilter("tasks")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                focusFilter === "tasks" 
                  ? "bg-slate-900 text-white border-transparent" 
                  : "bg-white text-slate-500 border-slate-200/60 hover:border-slate-300"
              }`}
            >
              Tasks due ({focusProfiles.filter(p => p.triggers.some(t => t.type === "reminder")).length})
            </button>
          </div>

          {/* Cards Focus Grid */}
          <div className="space-y-3">
            {filteredFocusProfiles.length === 0 ? (
              <div className="bg-white border border-slate-200/50 rounded-2xl p-12 text-center shadow-xs">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-800">No clients require focus under this filter</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Everyone is engaged, and dates are completely clear of alerts. Great work maintaining client touchpoints!</p>
              </div>
            ) : (
              filteredFocusProfiles.map((profile) => {
                const { client, highestPriority, triggers } = profile;
                const isOverseas = client.contact.country !== "Jamaica";
                const isExpanded = expandedAttentionId === client.id;

                return (
                  <div
                    key={client.id}
                    onClick={() => setExpandedAttentionId(isExpanded ? null : client.id)}
                    className={`bg-white border text-left rounded-2xl cursor-pointer hover:shadow-md transition-all relative overflow-hidden flex flex-col ${
                      isExpanded 
                        ? "ring-1 ring-slate-900 border-transparent shadow-md" 
                        : "border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.015)]"
                    }`}
                  >
                    {/* Compact List Header Row (always visible) */}
                    <div className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Elegant Initials Circle */}
                        <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shadow-xs flex-shrink-0">
                          {client.firstName[0]}{client.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-950 truncate">
                              {client.firstName} {client.lastName}
                            </h3>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest border ${
                              client.tier === "Gold" 
                                ? "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-amber-950 border-amber-600 shadow-[0_1px_4px_rgba(245,158,11,0.2)]" 
                                : client.tier === "Platinum" 
                                  ? "bg-slate-900 text-slate-100 border-slate-950 font-extrabold shadow-[0_1px_4px_rgba(0,0,0,0.1)]" 
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}>
                              {client.tier}
                            </span>
                            {isOverseas && (
                              <span className="bg-slate-50 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest">
                                Overseas
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-semibold truncate flex-wrap">
                            <span className="font-bold uppercase tracking-wider">ID: {client.id}</span>
                            <span>•</span>
                            <span className="uppercase tracking-widest">{client.homeBrand}</span>
                            <span>•</span>
                            <span className="text-indigo-600 font-bold">
                              Avg Order: {formatCurrency(client.history.averageOrderValue || (client.history.totalOrders > 0 ? Math.round(client.history.lifetimeRevenue / client.history.totalOrders) : 0))}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Primary Trigger Preview in compact view */}
                      {!isExpanded && triggers.length > 0 && (
                        <div className="hidden lg:flex items-center gap-2 max-w-sm text-xs text-slate-500 truncate flex-1 justify-center px-4">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" />
                          <span className="truncate italic font-medium">"{triggers[0].reason}"</span>
                          {triggers.length > 1 && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold font-mono ml-1 flex-shrink-0">
                              +{triggers.length - 1} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Right side controls */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0">
                        {/* Desktop Average Order Value display */}
                        <div className="hidden md:block text-right pr-2">
                          <span className="text-slate-400 block font-extrabold uppercase text-[7px] tracking-wider">Avg Order</span>
                          <span className="text-indigo-600 font-bold text-xs block font-mono">
                            {formatCurrency(client.history.averageOrderValue || (client.history.totalOrders > 0 ? Math.round(client.history.lifetimeRevenue / client.history.totalOrders) : 0))}
                          </span>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${
                          highestPriority === 1 
                            ? "bg-red-600 text-white border-transparent shadow-[0_2px_8px_rgba(220,38,38,0.25)] animate-pulse" 
                            : highestPriority === 2
                              ? "bg-amber-50 text-amber-900 border-amber-200"
                              : "bg-slate-100 text-slate-800 border-slate-200"
                        }`}>
                          {highestPriority === 1 ? "⚠️ URGENT" : `Priority ${highestPriority}`}
                        </span>

                        <div className="text-slate-400 hover:text-slate-700 p-1 rounded-full transition-colors">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                        </div>
                      </div>
                    </div>

                    {/* Compact Metric Dashboard Summary (Always Visible, Optimized for Laptop/Desktop) */}
                    <div className="px-4 pb-4 md:px-5">
                      <div className="grid grid-cols-4 gap-1 p-1.5 bg-slate-50/50 rounded-xl border border-slate-100">
                        <div className="text-left min-w-0">
                          <span className="text-slate-400 block font-bold uppercase text-[6.5px] sm:text-[7px] tracking-tight truncate">Lifetime Value</span>
                          <span className="text-slate-900 font-extrabold text-[9px] sm:text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight font-mono">
                            {formatCurrency(client.history.lifetimeRevenue)}
                          </span>
                        </div>
                        <div className="text-left min-w-0">
                          <span className="text-slate-400 block font-bold uppercase text-[6.5px] sm:text-[7px] tracking-tight truncate">Total Orders</span>
                          <span className="text-slate-900 font-extrabold text-[9px] sm:text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight font-mono">
                            {client.history.totalOrders}
                          </span>
                        </div>
                        <div className="text-left min-w-0">
                          <span className="text-slate-400 block font-bold uppercase text-[6.5px] sm:text-[7px] tracking-tight truncate">Avg Order Value</span>
                          <span className="text-indigo-600 font-extrabold text-[9px] sm:text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight font-mono">
                            {formatCurrency(client.history.averageOrderValue || (client.history.totalOrders > 0 ? Math.round(client.history.lifetimeRevenue / client.history.totalOrders) : 0))}
                          </span>
                        </div>
                        <div className="text-left min-w-0">
                          <span className="text-slate-400 block font-bold uppercase text-[6.5px] sm:text-[7px] tracking-tight truncate">Rel. Span</span>
                          <span className="text-slate-800 font-bold text-[9px] sm:text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight">
                            Since {client.history.firstOrderDate ? client.history.firstOrderDate.slice(0, 4) : "2024"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details Container */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/30 p-5 md:p-6 space-y-5">
                        {/* Reasons list (Triggers block) */}
                        <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">ATTENTION TRIGGERS:</span>
                          {triggers.map((trig, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs relative">
                              {/* Dot marker */}
                              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                trig.priority === 1 
                                  ? "bg-red-600 animate-ping" 
                                  : trig.priority === 2 
                                    ? "bg-amber-500" 
                                    : "bg-slate-400"
                              }`} />
                              {trig.priority === 1 && (
                                <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-red-600 absolute" />
                              )}
                              <div className="text-left pl-1">
                                <p className={`font-semibold leading-normal ${trig.priority === 1 ? "text-red-600 font-extrabold" : "text-slate-800"}`}>
                                  {trig.reason}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Preferences & Quick Context info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                          <div className="space-y-1.5 text-left">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">CLIENT TASTES & NOTES:</span>
                            <p className="text-slate-500 leading-relaxed font-semibold">
                              {client.history.clientPreferences.length > 0 
                                ? `Likes: ${client.history.clientPreferences.join(", ")}` 
                                : "No preference tags on file."}
                            </p>
                            <p className="text-slate-400 text-[11px] italic leading-normal">
                              "{client.profile.personalNotes || "No specific relationship guidelines cataloged."}"
                            </p>
                          </div>

                          <div className="space-y-1.5 text-left md:text-right flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">PREVIOUS ORDERS:</span>
                              <p className="text-slate-500 font-semibold leading-relaxed">
                                {client.history.productsPurchased.slice(0, 3).join(", ") || "No recorded history."}
                              </p>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">AVERAGE ORDER VALUE:</span>
                              <p className="text-indigo-600 font-extrabold leading-normal text-[11px] font-mono">
                                {formatCurrency(client.history.averageOrderValue || (client.history.totalOrders > 0 ? Math.round(client.history.lifetimeRevenue / client.history.totalOrders) : 0))}
                              </p>
                            </div>
                            
                            {/* Preferred Communication */}
                            <div className="flex items-center gap-1.5 justify-start md:justify-end text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2">
                              <span className="text-[9px] font-bold">PREFERRED:</span>
                              <span className="text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                                <Smartphone className="w-3 h-3 text-slate-500" /> {client.preferredCommunication || "WhatsApp"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions Footer */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            LAST CONTACT LOGGED: {client.lastContactedDate || "NEVER"}
                          </span>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectClient(client.id);
                            }}
                            className="flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-slate-700 transition-colors cursor-pointer hover:translate-x-1 duration-200"
                          >
                            Launch Client File
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div></div>

        {/* Right 4-columns: Gold Clients & Smart Date Agenda */}
        <div className="lg:col-span-4 space-y-8 text-left">
          
          {/* Luxe Inventory Simplified Watchtower Widget */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4 text-left">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-slate-800" />
                Librarium Luxe Inventory
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/60">
                Quick Glance
              </span>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {inventory.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No inventory items loaded.</p>
              ) : (
                inventory.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0 text-xs">
                    <span className="font-semibold text-slate-800 truncate pr-3">{item.title}</span>
                    {item.quantity === 0 ? (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                        Out of Stock
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                        {item.quantity} units
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => onNavigateToTab("inventory")}
              className="w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2 rounded-xl transition-all shadow-xs block"
            >
              Manage Inventory
            </button>
          </div>

          {/* Gold Client Watch Box */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-lg border border-slate-800 space-y-6">
            <div className="space-y-1 pb-3 border-b border-slate-800/80">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-slate-300" /> Elite Relationship Watch
              </span>
              <h3 className="text-lg font-bold tracking-tight text-white">Gold & Platinum Clients</h3>
            </div>

            {/* Micro Gold Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-widest">Total Active</span>
                <span className="text-3xl font-light text-white block mt-1">{goldMetrics.totalGold}</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-widest">Needs Contact</span>
                <span className="text-3xl font-light text-amber-400 block mt-1">{goldMetrics.needingAttentionCount}</span>
              </div>
            </div>

            {/* Upcoming Gold Events Agenda */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">UPCOMING ELITE EVENTS:</span>
              
              {goldMetrics.upcomingEvents.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No key elite milestones in next 30 days.</p>
              ) : (
                <div className="space-y-2.5">
                  {goldMetrics.upcomingEvents.map((item, idx) => {
                    const clientAOV = item.client.history.averageOrderValue || (item.client.history.totalOrders > 0 ? Math.round(item.client.history.lifetimeRevenue / item.client.history.totalOrders) : 0);
                    return (
                      <div 
                        key={idx}
                        onClick={() => onSelectClient(item.client.id)}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all cursor-pointer flex justify-between items-center text-xs"
                      >
                        <div>
                          <p className="font-bold text-white">{item.client.firstName} {item.client.lastName}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.event.label} ({item.event.date})</p>
                          <p className="text-[10px] text-amber-300 font-mono mt-1 font-bold">AOV: {formatCurrency(clientAOV)}</p>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-white/10 text-white px-2 py-0.5 rounded">
                          {item.days === 0 ? "Today" : `${item.days}d`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Elite Preference Summary */}
            <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">SHARED GOLD/PLAT PREFERENCES:</span>
              <div className="flex flex-wrap gap-1.5">
                {goldMetrics.preferences.map((p, i) => (
                  <span key={i} className="text-[10px] bg-slate-850 border border-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Date Engine Calendar Feed */}
          <SmallCalendarWidget 
            clients={clients}
            onSelectClient={onSelectClient}
            onOpenTask={onOpenTask}
          />

        </div>

      </div>

      {/* 3. Bottom Interactive Workspace Summary Section */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="text-left">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-800" />
              Dynamic Relationship Intel
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Toggle workspaces to inspect immediate tasks, milestones, or high-level portfolio reports.</p>
          </div>

          {/* Interactive Workspace Segment Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 self-start sm:self-center">
            <button
              onClick={() => setSummaryTab("today")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                summaryTab === "today" 
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/40" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSummaryTab("this_week")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                summaryTab === "this_week" 
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/40" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setSummaryTab("overview")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                summaryTab === "overview" 
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/40" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Metrics Overview
            </button>
          </div>
        </div>

        {/* Dynamic Summary Panels */}
        <div className="animate-fade-in text-left">
          
          {/* TAB A: TODAY PANEL */}
          {summaryTab === "today" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Box 1: Contact list */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase block border-b border-slate-100 pb-1.5">Focus Contacts</span>
                {summaries.today.contact.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No urgent contacts due today.</p>
                ) : (
                  summaries.today.contact.map(p => (
                    <div 
                      key={p.client.id}
                      onClick={() => onSelectClient(p.client.id)}
                      className={`p-3 border rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 ${getBrandCardClasses(p.client.homeBrand)}`}
                    >
                      <p className="font-bold text-xs text-slate-800">{p.client.firstName} {p.client.lastName}</p>
                      <div className="flex items-center justify-between gap-1.5 mt-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1 rounded text-[7px] font-black uppercase tracking-wider ${
                            p.client.tier === "Gold"
                              ? "bg-amber-100 text-amber-800"
                              : p.client.tier === "Platinum"
                                ? "bg-slate-900 text-slate-100"
                                : "bg-slate-200 text-slate-600"
                          }`}>
                            {p.client.tier}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">• {p.client.preferredCommunication}</span>
                        </div>
                        <span className="text-[10px] text-indigo-600 font-mono font-bold">AOV: {formatCurrency(p.client.history.averageOrderValue || (p.client.history.totalOrders > 0 ? Math.round(p.client.history.lifetimeRevenue / p.client.history.totalOrders) : 0))}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Box 2: Events Today */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase block border-b border-slate-100 pb-1.5">Events Today / Tomorrow</span>
                {summaries.today.events.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No major personal events today.</p>
                ) : (
                  summaries.today.events.map(item => (
                    <div 
                      key={`${item.client.id}-${item.trigger.reason}`}
                      onClick={() => onSelectClient(item.client.id)}
                      className={`p-3 border rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 flex items-center justify-between gap-2 ${getBrandCardClasses(item.client.homeBrand)}`}
                    >
                      <div className="text-left">
                        <p className="font-bold text-xs text-slate-800">{item.client.firstName} {item.client.lastName}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`px-1 rounded text-[7px] font-black uppercase tracking-wider ${
                            item.client.tier === "Gold"
                              ? "bg-amber-100 text-amber-800"
                              : item.client.tier === "Platinum"
                                ? "bg-slate-900 text-slate-100"
                                : "bg-slate-200 text-slate-600"
                          }`}>
                            {item.client.tier}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[120px]">
                            {item.trigger.metadata?.label || "Event"}
                          </span>
                        </div>
                        <p className="text-[10px] text-indigo-600 font-mono font-bold mt-1">AOV: {formatCurrency(item.client.history.averageOrderValue || (item.client.history.totalOrders > 0 ? Math.round(item.client.history.lifetimeRevenue / item.client.history.totalOrders) : 0))}</p>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-700 whitespace-nowrap">
                        {item.trigger.daysRemaining === 0 ? "Today" : `${item.trigger.daysRemaining}d`}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Box 3: Pending Reminders */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase block border-b border-slate-100 pb-1.5">Overdue / Pending Tasks</span>
                {summaries.today.reminders.length === 0 ? (
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 py-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> All daily tasks completed!
                  </p>
                ) : (
                  summaries.today.reminders.map(item => (
                    <div 
                      key={item.reminder.id}
                      onClick={() => onOpenTask ? onOpenTask(item.client.id, item.reminder.id) : onSelectClient(item.client.id)}
                      className={`p-3 border rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 space-y-1.5 ${getBrandCardClasses(item.client.homeBrand)}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-bold text-xs text-slate-800">{item.client.firstName} {item.client.lastName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`px-1 rounded text-[7px] font-black uppercase tracking-wider ${
                              item.client.tier === "Gold"
                                ? "bg-amber-100 text-amber-800"
                                : item.client.tier === "Platinum"
                                  ? "bg-slate-900 text-slate-100"
                                  : "bg-slate-200 text-slate-600"
                            }`}>
                              {item.client.tier}
                            </span>
                            <span className="text-[10px] text-indigo-600 font-mono font-bold">AOV: {formatCurrency(item.client.history.averageOrderValue || (item.client.history.totalOrders > 0 ? Math.round(item.client.history.lifetimeRevenue / item.client.history.totalOrders) : 0))}</span>
                          </div>
                        </div>
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap border ${
                          item.overdueBy > 0 
                            ? "bg-red-600 text-white border-red-600 shadow-[0_0_8px_rgba(220,38,38,0.3)] animate-pulse" 
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {item.overdueBy > 0 ? `URGENT Overdue ${item.overdueBy}d` : "Today"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 italic leading-snug">"{item.reminder.task}"</p>
                    </div>
                  ))
                )}
              </div>

              {/* Box 4: Active Orders (last 30 days) */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase block border-b border-slate-100 pb-1.5">Recent orders (last 30 days)</span>
                {summaries.today.activeOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No recent purchase transactions.</p>
                ) : (
                  summaries.today.activeOrders.map(item => (
                    <div 
                      key={item.event.id}
                      onClick={() => onSelectClient(item.client.id)}
                      className={`p-3 border rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 space-y-1.5 ${getBrandCardClasses(item.client.homeBrand)}`}
                    >
                      <div className="flex justify-between items-center text-xs gap-2">
                        <div className="text-left">
                          <p className="font-bold text-slate-800">{item.client.firstName} {item.client.lastName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`px-1 rounded text-[7px] font-black uppercase tracking-wider ${
                              item.client.tier === "Gold"
                                ? "bg-amber-100 text-amber-800"
                                : item.client.tier === "Platinum"
                                  ? "bg-slate-900 text-slate-100"
                                  : "bg-slate-200 text-slate-600"
                            }`}>
                              {item.client.tier}
                            </span>
                            <span className="text-[10px] text-indigo-600 font-mono font-bold">AOV: {formatCurrency(item.client.history.averageOrderValue || (item.client.history.totalOrders > 0 ? Math.round(item.client.history.lifetimeRevenue / item.client.history.totalOrders) : 0))}</span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-slate-950 whitespace-nowrap bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">{formatCurrency(item.event.amount || 0)}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">"{item.event.content}"</p>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB B: THIS WEEK PANEL */}
          {summaryTab === "this_week" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Box 1: Birthdays this week */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase block border-b border-slate-100 pb-1.5">Birthdays This Week</span>
                {summaries.thisWeek.birthdays.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No client birthdays this week.</p>
                ) : (
                  summaries.thisWeek.birthdays.map(item => (
                    <div 
                      key={item.client.id}
                      onClick={() => onSelectClient(item.client.id)}
                      className={`p-3 border rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 flex items-center justify-between gap-2 ${getBrandCardClasses(item.client.homeBrand)}`}
                    >
                      <div className="text-left">
                        <p className="font-bold text-xs text-slate-800">{item.client.firstName} {item.client.lastName}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`px-1 rounded text-[7px] font-black uppercase tracking-wider ${
                            item.client.tier === "Gold"
                              ? "bg-amber-100 text-amber-800"
                              : item.client.tier === "Platinum"
                                ? "bg-slate-900 text-slate-100"
                                : "bg-slate-200 text-slate-600"
                          }`}>
                            {item.client.tier}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[120px]">
                            Bday: {item.trigger.metadata?.date}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-slate-200/85 px-1.5 py-0.5 rounded text-slate-700 whitespace-nowrap">
                        {item.trigger.daysRemaining === 0 ? "Today" : `${item.trigger.daysRemaining}d`}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Box 2: Anniversaries this week */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase block border-b border-slate-100 pb-1.5">Anniversaries This Week</span>
                {summaries.thisWeek.anniversaries.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No major wedding/personal anniversaries.</p>
                ) : (
                  summaries.thisWeek.anniversaries.map(item => (
                    <div 
                      key={item.client.id}
                      onClick={() => onSelectClient(item.client.id)}
                      className={`p-3 border rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 flex items-center justify-between gap-2 ${getBrandCardClasses(item.client.homeBrand)}`}
                    >
                      <div className="text-left">
                        <p className="font-bold text-xs text-slate-800">{item.client.firstName} {item.client.lastName}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`px-1 rounded text-[7px] font-black uppercase tracking-wider ${
                            item.client.tier === "Gold"
                              ? "bg-amber-100 text-amber-800"
                              : item.client.tier === "Platinum"
                                ? "bg-slate-900 text-slate-100"
                                : "bg-slate-200 text-slate-600"
                          }`}>
                            {item.client.tier}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[120px]">
                            {item.trigger.metadata?.label}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-slate-200/85 px-1.5 py-0.5 rounded text-slate-700 whitespace-nowrap">
                        {item.trigger.daysRemaining === 0 ? "Today" : `${item.trigger.daysRemaining}d`}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Box 3: Gold & Plat Priority Touchpoints */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase block border-b border-slate-100 pb-1.5">Gold & Plat Touchpoints This Week</span>
                {summaries.thisWeek.vip.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No Gold or Plat attention triggers this week.</p>
                ) : (
                  summaries.thisWeek.vip.map(p => (
                    <div 
                      key={p.client.id}
                      onClick={() => onSelectClient(p.client.id)}
                      className={`p-3 border rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 ${getBrandCardClasses(p.client.homeBrand)}`}
                    >
                      <p className="font-bold text-xs text-slate-800">{p.client.firstName} {p.client.lastName}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`px-1 rounded text-[7px] font-black uppercase tracking-wider ${
                          p.client.tier === "Gold"
                            ? "bg-amber-100 text-amber-800"
                            : p.client.tier === "Platinum"
                              ? "bg-slate-900 text-slate-100"
                              : "bg-slate-200 text-slate-600"
                        }`}>
                          {p.client.tier}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">• {p.client.contact.city}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Box 4: Delivery / Fulfillment Reminders */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase block border-b border-slate-100 pb-1.5">Deliveries & Gifts This Week</span>
                {summaries.thisWeek.deliveries.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No packaging or delivery tasks scheduled.</p>
                ) : (
                  summaries.thisWeek.deliveries.map(item => (
                    <div 
                      key={item.reminder.id}
                      onClick={() => onOpenTask ? onOpenTask(item.client.id, item.reminder.id) : onSelectClient(item.client.id)}
                      className={`p-3 border rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 space-y-1.5 ${getBrandCardClasses(item.client.homeBrand)}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-bold text-xs text-slate-800">{item.client.firstName} {item.client.lastName}</p>
                          <span className={`px-1 rounded text-[7px] font-black uppercase tracking-wider inline-block mt-0.5 ${
                            item.client.tier === "Gold"
                              ? "bg-amber-100 text-amber-800"
                              : item.client.tier === "Platinum"
                                ? "bg-slate-900 text-slate-100"
                                : "bg-slate-200 text-slate-600"
                          }`}>
                            {item.client.tier}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1 rounded whitespace-nowrap">
                          {item.daysLeft === 0 ? "Today" : `${item.daysLeft}d`}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 italic mt-0.5">"{item.reminder.task}"</p>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB C: OVERVIEW METRICS PANEL */}
          {summaryTab === "overview" && (
            <div className="space-y-6">
              
              {/* Top Row Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200/40 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Accounts</span>
                  <p className="text-2xl font-light text-slate-900 mt-1">{clients.length}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200/40 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gold Clients</span>
                  <p className="text-2xl font-light text-slate-900 mt-1">{summaries.overview.totalVIP}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200/40 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platinum Clients</span>
                  <p className="text-2xl font-light text-slate-900 mt-1">{summaries.overview.totalCorporate}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200/40 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overseas Clients</span>
                  <p className="text-2xl font-light text-slate-900 mt-1">{summaries.overview.totalAbroad}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200/40 rounded-2xl col-span-2 md:col-span-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Valuation</span>
                  <p className="text-xl font-bold text-slate-950 mt-1 truncate">{formatCurrency(summaries.overview.totalRevenue)}</p>
                </div>
              </div>

              {/* Segment distributions bars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Brand segments distribution */}
                <div className="bg-slate-50 border border-slate-200/40 p-4 rounded-2xl space-y-3.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Brand Affinity Distribution</span>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mb-1">
                        <span>CEO Printing Services Only</span>
                        <span>{summaries.overview.totalCeo - summaries.overview.totalShared}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-900 h-full" style={{ width: `${((summaries.overview.totalCeo - summaries.overview.totalShared)/clients.length)*100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mb-1">
                        <span>Librarium Luxe Only</span>
                        <span>{summaries.overview.totalLibrarium - summaries.overview.totalShared}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-700 h-full" style={{ width: `${((summaries.overview.totalLibrarium - summaries.overview.totalShared)/clients.length)*100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mb-1">
                        <span>CEO Lifestyle (Shared)</span>
                        <span>{summaries.overview.totalShared}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-500 h-full" style={{ width: `${(summaries.overview.totalShared/clients.length)*100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account status mix */}
                <div className="bg-slate-50 border border-slate-200/40 p-4 rounded-2xl space-y-3.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Client Level Mix</span>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mb-1">
                        <span>Gold Elite</span>
                        <span>{summaries.overview.totalVIP}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-950 h-full" style={{ width: `${(summaries.overview.totalVIP/clients.length)*100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mb-1">
                        <span>Platinum Elite</span>
                        <span>{summaries.overview.totalCorporate}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-800 h-full" style={{ width: `${(summaries.overview.totalCorporate/clients.length)*100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mb-1">
                        <span>Silver Directory</span>
                        <span>{summaries.overview.totalStandard}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-500 h-full" style={{ width: `${(summaries.overview.totalStandard/clients.length)*100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Geography summary */}
                <div className="bg-slate-50 border border-slate-200/40 p-4 rounded-2xl space-y-3.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Geographic Reach</span>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mb-1">
                        <span>Jamaica Local Delivery</span>
                        <span>{clients.length - summaries.overview.totalAbroad}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-900 h-full" style={{ width: `${((clients.length - summaries.overview.totalAbroad)/clients.length)*100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mb-1">
                        <span>International Delivery</span>
                        <span>{summaries.overview.totalAbroad}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-500 h-full" style={{ width: `${(summaries.overview.totalAbroad/clients.length)*100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
