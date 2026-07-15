import React, { useState, useMemo } from "react";
import { Client, ImportantDate, FollowUpReminder } from "../types";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Gift, 
  Heart, 
  Bell, 
  Search, 
  Filter, 
  Printer, 
  BookOpen,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck
} from "lucide-react";

interface MilestoneCalendarProps {
  clients: Client[];
  onSelectClient: (clientId: string) => void;
  onOpenTask?: (clientId: string, reminderId: string) => void;
}

// Helper to parse date strings into month and day
function parseDateString(dateStr: string): { month: number; day: number; year?: number } | null {
  if (!dateStr) return null;
  
  // Standard format: YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1], 10),
      month: parseInt(isoMatch[2], 10) - 1, // 0-indexed
      day: parseInt(isoMatch[3], 10)
    };
  }

  // Handle format like "March 14, 2018" or "March 14"
  const cleanStr = dateStr.trim();
  const months = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];
  
  const monthMatch = cleanStr.match(/([a-zA-Z]+)/);
  if (monthMatch) {
    const monthName = monthMatch[1].toLowerCase();
    const monthIndex = months.findIndex(m => m.startsWith(monthName.substring(0, 3)));
    if (monthIndex !== -1) {
      // Find day
      const dayMatch = cleanStr.match(/\b(\d{1,2})\b/);
      const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;
      
      // Find year
      const yearMatch = cleanStr.match(/\b(\d{4})\b/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;
      
      return {
        year,
        month: monthIndex,
        day: day
      };
    }
  }

  return null;
}

// System reference date for relative comparisons (July 8, 2026)
const SYSTEM_REFERENCE_YEAR = 2026;
const SYSTEM_REFERENCE_MONTH = 6; // July is index 6
const SYSTEM_REFERENCE_DAY = 8;

export default function MilestoneCalendar({ clients, onSelectClient, onOpenTask }: MilestoneCalendarProps) {
  // Navigation State
  const [currentYear, setCurrentYear] = useState(SYSTEM_REFERENCE_YEAR);
  const [currentMonth, setCurrentMonth] = useState(SYSTEM_REFERENCE_MONTH); // July (0-indexed)
  const [selectedDay, setSelectedDay] = useState<number | null>(SYSTEM_REFERENCE_DAY);
  
  // Business events state synced to localStorage
  const [businessEvents, setBusinessEvents] = useState<Array<{
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    type: "Client Event" | "CEO Day" | "Librarium Luxe Day" | "General Business Day";
    description?: string;
    associatedClientId?: string;
  }>>(() => {
    const stored = localStorage.getItem("ceo_crm_business_events");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (err) {
        console.error(err);
      }
    }
    return [
      { id: "be-1", title: "Annual CEO Day Celebration", date: "2026-07-10", type: "CEO Day", description: "All brand managers assemble." },
      { id: "be-2", title: "Librarium Luxe Literary Gala", date: "2026-07-25", type: "Librarium Luxe Day", description: "Gala evening celebrating rare books." },
      { id: "be-3", title: "General Mid-Year Alignment Review", date: "2026-07-08", type: "General Business Day", description: "Review overall CRM progress." }
    ];
  });

  React.useEffect(() => {
    localStorage.setItem("ceo_crm_business_events", JSON.stringify(businessEvents));
  }, [businessEvents]);

  // Visual filter toggle: "both" | "client_only" | "business_only"
  const [displayToggle, setDisplayToggle] = useState<"both" | "client_only" | "business_only">("both");

  // Create event states
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [eventCategory, setEventCategory] = useState<"Client Event" | "CEO Day" | "Librarium Luxe Day" | "General Business Day">("Client Event");
  const [eventClientId, setEventClientId] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("2026-07-08");
  const [eventNotes, setEventNotes] = useState("");

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate) return;

    const newEv = {
      id: `custom-evt-${Date.now()}`,
      title: eventTitle.trim(),
      date: eventDate,
      type: eventCategory,
      description: eventNotes.trim() || undefined,
      associatedClientId: eventCategory === "Client Event" ? eventClientId : undefined
    };

    setBusinessEvents(prev => [...prev, newEv]);

    // Reset fields
    setEventTitle("");
    setEventNotes("");
    setEventClientId("");
  };

  // Filters
  const [brandFilter, setBrandFilter] = useState<"all" | "CEO Printing Services" | "Librarium Luxe">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "birthday" | "anniversary" | "reminder">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Aggregate all events across all clients
  const allEvents = useMemo(() => {
    const eventsList: Array<{
      id: string;
      client: Client;
      type: "birthday" | "anniversary" | "custom_milestone" | "reminder";
      label: string;
      dateStr: string;
      parsedMonth: number;
      parsedDay: number;
      parsedYear?: number;
      isVip: boolean;
    }> = [];

    clients.forEach(client => {
      // 1. Process standard important dates
      client.importantDates.forEach((dateObj, idx) => {
        const parsed = parseDateString(dateObj.date);
        if (!parsed) return;

        const isBday = dateObj.label.toLowerCase().includes("birth");
        const isAnniv = dateObj.label.toLowerCase().includes("anniv") || dateObj.label.toLowerCase().includes("wed");
        
        eventsList.push({
          id: `imp-${client.id}-${idx}`,
          client,
          type: isBday ? "birthday" : isAnniv ? "anniversary" : "custom_milestone",
          label: dateObj.label,
          dateStr: dateObj.date,
          parsedMonth: parsed.month,
          parsedDay: parsed.day,
          parsedYear: parsed.year,
          isVip: client.tier === "Gold" || client.tier === "Platinum"
        });
      });

      // 1.5 Process all family member birthdays directly
      const familyBirthdays: { label: string; date?: string }[] = [];
      if (client.profile.motherName && client.profile.motherBirthday && !client.profile.motherDeceased) {
        familyBirthdays.push({ label: `${client.profile.motherName} (Mother)`, date: client.profile.motherBirthday });
      }
      if (client.profile.fatherName && client.profile.fatherBirthday && !client.profile.fatherDeceased) {
        familyBirthdays.push({ label: `${client.profile.fatherName} (Father)`, date: client.profile.fatherBirthday });
      }
      if (client.profile.wifeName && client.profile.wifeBirthday && !client.profile.wifeDeceased) {
        familyBirthdays.push({ label: `${client.profile.wifeName} (Partner/Wife)`, date: client.profile.wifeBirthday });
      }
      if (client.profile.husbandName && client.profile.husbandBirthday && !client.profile.husbandDeceased) {
        familyBirthdays.push({ label: `${client.profile.husbandName} (Partner/Husband)`, date: client.profile.husbandBirthday });
      }
      if (client.profile.children) {
        client.profile.children.forEach(child => {
          if (child.name && child.birthday && !child.deceased) {
            familyBirthdays.push({ label: `${child.name} (Child)`, date: child.birthday });
          }
        });
      }
      if (client.profile.otherFamilyMembers) {
        client.profile.otherFamilyMembers.forEach(member => {
          if (member.name && member.birthday && !member.deceased) {
            familyBirthdays.push({ label: `${member.name} (${member.relationship})`, date: member.birthday });
          }
        });
      }

      familyBirthdays.forEach((bday, bidx) => {
        if (!bday.date) return;
        const parsed = parseDateString(bday.date);
        if (!parsed) return;
        
        // Prevent duplicate birthday entries if they already exist in client.importantDates
        const alreadyInDates = client.importantDates.some(d => 
          d.label.toLowerCase().includes(bday.label.toLowerCase()) || 
          bday.label.toLowerCase().includes(d.label.toLowerCase())
        );
        if (alreadyInDates) return;

        eventsList.push({
          id: `fambday-${client.id}-${bidx}-${bday.label.replace(/\s+/g, '-')}`,
          client,
          type: "birthday",
          label: `${bday.label}'s Birthday`,
          dateStr: bday.date,
          parsedMonth: parsed.month,
          parsedDay: parsed.day,
          parsedYear: parsed.year,
          isVip: client.tier === "Gold" || client.tier === "Platinum"
        });
      });

      // 2. Process follow-up reminders
      client.reminders.forEach(reminder => {
        const parsed = parseDateString(reminder.date);
        if (!parsed) return;

        eventsList.push({
          id: `rem-${client.id}-${reminder.id}`,
          client,
          type: "reminder",
          label: reminder.task,
          dateStr: reminder.date,
          parsedMonth: parsed.month,
          parsedDay: parsed.day,
          parsedYear: parsed.year,
          isVip: client.tier === "Gold" || client.tier === "Platinum"
        });
      });
    });

    return eventsList;
  }, [clients]);

  // Parse business events
  const parsedBusinessEvents = useMemo(() => {
    return businessEvents.map(be => {
      const parsed = parseDateString(be.date);
      const associatedClient = be.associatedClientId ? clients.find(c => c.id === be.associatedClientId) : null;
      return {
        id: be.id,
        client: associatedClient || ({ id: "business-entity", firstName: "Business", lastName: "Event", homeBrand: "CEO Lifestyle" } as any),
        type: (be.type === "Client Event" && associatedClient) ? ("custom_milestone" as const) : ("business" as const),
        businessType: be.type,
        label: be.title,
        dateStr: be.date,
        parsedMonth: parsed ? parsed.month : -1,
        parsedDay: parsed ? parsed.day : -1,
        parsedYear: parsed ? parsed.year : undefined,
        isVip: associatedClient ? (associatedClient.tier === "Gold" || associatedClient.tier === "Platinum") : false,
        description: be.description
      };
    }).filter(e => e.parsedMonth !== -1);
  }, [businessEvents, clients]);

  // Filter events based on criteria and toggles
  const filteredEvents = useMemo(() => {
    // Combine lists based on displayToggle
    let list: Array<{
      id: string;
      client: Client;
      type: "birthday" | "anniversary" | "custom_milestone" | "reminder" | "business";
      businessType?: "Client Event" | "CEO Day" | "Librarium Luxe Day" | "General Business Day";
      label: string;
      dateStr: string;
      parsedMonth: number;
      parsedDay: number;
      parsedYear?: number;
      isVip: boolean;
      description?: string;
    }> = [];

    if (displayToggle === "both" || displayToggle === "client_only") {
      list = [...list, ...allEvents];
    }
    if (displayToggle === "both" || displayToggle === "business_only") {
      list = [...list, ...parsedBusinessEvents];
    }

    return list.filter(ev => {
      // Brand filter (only apply to non-business events or business events matching the relevant brands)
      if (brandFilter !== "all") {
        if (ev.type === "business") {
          if (brandFilter === "Librarium Luxe" && ev.businessType !== "Librarium Luxe Day") return false;
          if (brandFilter === "CEO Printing Services" && ev.businessType !== "CEO Day") return false;
        } else {
          if (ev.client.homeBrand !== "CEO Lifestyle" && ev.client.homeBrand !== brandFilter) {
            return false;
          }
        }
      }

      // Event Type filter
      if (typeFilter !== "all") {
        if (typeFilter === "birthday" && ev.type !== "birthday") return false;
        if (typeFilter === "anniversary" && ev.type !== "anniversary") return false;
        if (typeFilter === "reminder" && ev.type !== "reminder") return false;
        if (ev.type === "business") return false; // Hide business events if looking for client birthdays/reminders
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullName = `${ev.client.firstName} ${ev.client.lastName}`.toLowerCase();
        const label = ev.label.toLowerCase();
        const desc = ev.description ? ev.description.toLowerCase() : "";
        const city = ev.client.contact ? ev.client.contact.city.toLowerCase() : "";
        const bType = ev.businessType ? ev.businessType.toLowerCase() : "";
        return fullName.includes(query) || label.includes(query) || desc.includes(query) || city.includes(query) || bType.includes(query);
      }

      return true;
    });
  }, [allEvents, parsedBusinessEvents, displayToggle, brandFilter, typeFilter, searchQuery]);

  // Build Calendar grid cells
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const cells: Array<{
      dayNumber: number | null;
      isToday: boolean;
      events: typeof filteredEvents;
    }> = [];

    // Padding for days before the first of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push({ dayNumber: null, isToday: false, events: [] });
    }

    // Days in the active month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = 
        currentYear === SYSTEM_REFERENCE_YEAR && 
        currentMonth === SYSTEM_REFERENCE_MONTH && 
        day === SYSTEM_REFERENCE_DAY;

      // Find events matching this month and day
      const dayEvents = filteredEvents.filter(ev => ev.parsedMonth === currentMonth && ev.parsedDay === day);

      cells.push({
        dayNumber: day,
        isToday,
        events: dayEvents
      });
    }

    return cells;
  }, [currentYear, currentMonth, filteredEvents]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDay(null);
  };

  const handleResetToToday = () => {
    setCurrentYear(SYSTEM_REFERENCE_YEAR);
    setCurrentMonth(SYSTEM_REFERENCE_MONTH);
    setSelectedDay(SYSTEM_REFERENCE_DAY);
  };

  // Get active day events to show in details list
  const activeDayEvents = useMemo(() => {
    if (selectedDay === null) return [];
    return filteredEvents.filter(ev => ev.parsedMonth === currentMonth && ev.parsedDay === selectedDay);
  }, [selectedDay, currentMonth, filteredEvents]);

  // Upcoming Milestones Sidebar (Next 30 Days)
  const upcomingMilestones = useMemo(() => {
    // July 8, 2026 reference
    const refDateObj = new Date(SYSTEM_REFERENCE_YEAR, SYSTEM_REFERENCE_MONTH, SYSTEM_REFERENCE_DAY);
    
    return allEvents.map(ev => {
      // Calculate days remaining in 2026
      let eventYear = SYSTEM_REFERENCE_YEAR;
      // If event month is earlier than July, it might have passed, but for annual triggers we show nearest
      let targetDate = new Date(eventYear, ev.parsedMonth, ev.parsedDay);
      
      // If the date passed by more than 30 days, represent it in the future or next year
      if (targetDate.getTime() - refDateObj.getTime() < -1000 * 60 * 60 * 24 * 5) {
        eventYear += 1;
        targetDate = new Date(eventYear, ev.parsedMonth, ev.parsedDay);
      }

      const diffTime = targetDate.getTime() - refDateObj.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...ev,
        daysRemaining: diffDays,
        targetDate
      };
    })
    .filter(ev => ev.daysRemaining >= 0 && ev.daysRemaining <= 30)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [allEvents]);

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in">
      
      {/* 1. Header and quick date summary */}
      <div className="text-left pb-6 border-b border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold tracking-widest text-slate-300 uppercase bg-slate-900/40 backdrop-blur-md px-2.5 py-1 rounded border border-slate-700/50">
              Interactive Milestone Calendar
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-white drop-shadow-sm">
            Milestone Hub
          </h1>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2xl font-medium">
            Review critical touchpoints, birthdays, and anniversaries from our unified CRM files on a navigable schedule.
          </p>
        </div>

        {/* Ref Date Card */}
        <div className="px-4 py-2.5 bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl text-left flex items-center gap-3">
          <div className="p-1.5 bg-white/10 rounded-lg border border-white/5 text-amber-300">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">System Reference Date</span>
            <span className="text-xs font-bold text-white font-mono">July 8, 2026 (Wed)</span>
          </div>
        </div>
      </div>

      {/* 2. Control Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/85 backdrop-blur-md border border-slate-200/50 p-4 rounded-2xl shadow-sm items-center text-left">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search client or event..."
            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold focus:outline-none transition-colors"
          />
        </div>

        {/* Brand filter */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Home Brand</label>
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs font-bold focus:outline-none cursor-pointer appearance-none"
            >
              <option value="all">All Brands</option>
              <option value="CEO Printing Services">CEO Printing Services Only</option>
              <option value="Librarium Luxe">Librarium Luxe Only</option>
            </select>
          </div>
        </div>

        {/* Type filter */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Event Category</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs font-bold focus:outline-none cursor-pointer appearance-none"
            >
              <option value="all">All Occasions</option>
              <option value="birthday">Birthdays</option>
              <option value="anniversary">Wedding Anniversaries</option>
              <option value="reminder">Follow-up Tasks</option>
            </select>
          </div>
        </div>

        {/* Shortcuts */}
        <div className="flex gap-2 h-full items-end pt-3 md:pt-0">
          <button
            onClick={handleResetToToday}
            className="flex-1 text-center py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
          >
            Go to July 2026
          </button>
          <button
            onClick={() => {
              setBrandFilter("all");
              setTypeFilter("all");
              setSearchQuery("");
            }}
            className="flex-1 text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* 3. Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 8-columns: Interactive Grid Calendar */}
        <div className="lg:col-span-8 bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-3xl p-6 shadow-md space-y-6">
          
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h2 className="text-xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <p className="text-xs text-slate-400">Click a day to explore scheduled client dates</p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 p-1 border border-slate-200/50 rounded-xl">
              <button 
                onClick={handlePrevMonth}
                className="p-2 hover:bg-white text-slate-700 hover:text-slate-950 rounded-lg transition-all shadow-xs"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 px-2 tracking-widest">NAVIGATE</span>
              <button 
                onClick={handleNextMonth}
                className="p-2 hover:bg-white text-slate-700 hover:text-slate-950 rounded-lg transition-all shadow-xs"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2.5 text-center text-xs font-extrabold text-slate-400 tracking-widest uppercase">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2.5">
            {calendarCells.map((cell, idx) => {
              if (cell.dayNumber === null) {
                return (
                  <div 
                    key={`empty-${idx}`} 
                    className="aspect-square bg-slate-50/30 rounded-xl border border-transparent" 
                  />
                );
              }

              const isSelected = selectedDay === cell.dayNumber;
              const hasEvents = cell.events.length > 0;

              // Color dot categorizations
              const hasVipEvent = cell.events.some(e => e.isVip);
              const hasCeoEvent = cell.events.some(e => !e.isVip && e.type !== "business" && (e.client.homeBrand === "CEO Printing Services" || e.client.homeBrand === "CEO Lifestyle"));
              const hasLibrariumEvent = cell.events.some(e => !e.isVip && e.type !== "business" && (e.client.homeBrand === "Librarium Luxe" || e.client.homeBrand === "CEO Lifestyle"));

              // Business Event indicators
              const hasCeoDay = cell.events.some(e => e.type === "business" && e.businessType === "CEO Day");
              const hasLuxeDay = cell.events.some(e => e.type === "business" && e.businessType === "Librarium Luxe Day");
              const hasGenDay = cell.events.some(e => e.type === "business" && e.businessType === "General Business Day");
              const hasClientEvent = cell.events.some(e => (e.type === "business" && e.businessType === "Client Event") || (e.type === "custom_milestone" && e.businessType === "Client Event"));

              // Determine non-selected, non-today cell colors based on business events
              let cellBgClass = "bg-white border-slate-200/70 text-slate-900 hover:bg-slate-50 hover:border-slate-300";
              if (!cell.isToday && !isSelected) {
                if (hasCeoDay) {
                  cellBgClass = "bg-purple-50/70 border-purple-200 text-purple-950 hover:bg-purple-100/50 hover:border-purple-300";
                } else if (hasLuxeDay) {
                  cellBgClass = "bg-amber-50/60 border-amber-200 text-amber-950 hover:bg-amber-100/40 hover:border-amber-300";
                } else if (hasClientEvent) {
                  cellBgClass = "bg-emerald-50/60 border-emerald-200 text-emerald-950 hover:bg-emerald-100/40 hover:border-emerald-300";
                } else if (hasGenDay) {
                  cellBgClass = "bg-teal-50/60 border-teal-200 text-teal-950 hover:bg-teal-100/40 hover:border-teal-300";
                }
              }

              return (
                <button
                  key={`day-${cell.dayNumber}`}
                  onClick={() => setSelectedDay(cell.dayNumber)}
                  className={`aspect-square rounded-2xl p-2 flex flex-col justify-between items-stretch border transition-all text-left group relative ${
                    cell.isToday 
                      ? "bg-slate-950 text-white border-transparent shadow-md" 
                      : isSelected
                        ? "bg-indigo-50 border-indigo-500 text-indigo-950 shadow-xs ring-1 ring-indigo-500"
                        : cellBgClass
                  }`}
                >
                  {/* Day Number */}
                  <span className={`text-sm sm:text-base font-black leading-none ${cell.isToday ? "text-amber-300" : "text-slate-950"}`}>
                    {cell.dayNumber}
                  </span>

                  {/* Indicator labels/dots at bottom */}
                  <div className="flex flex-col gap-1 mt-auto">
                    {/* Events Mini labels */}
                    {cell.events.length > 0 && (
                      <div className="hidden md:block truncate text-[8px] font-bold tracking-tight uppercase leading-none text-slate-500 group-hover:text-slate-800">
                        {cell.events.length} {cell.events.length === 1 ? "Event" : "Events"}
                      </div>
                    )}

                    {/* Miniature Dots */}
                    {hasEvents && (
                      <div className="flex flex-wrap gap-1 items-center min-h-[10px] mt-1 pb-0.5">
                        {/* Gold/Platinum Elite Event Dot - Shiny Gold */}
                        {hasVipEvent && (
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white animate-pulse shadow-xs shrink-0" title="Gold/Platinum Elite Event" />
                        )}
                        {/* CEO Printing Event Dot - Blue */}
                        {hasCeoEvent && (
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white shadow-xs shrink-0" title="CEO Printing Services Date" />
                        )}
                        {/* Librarium Luxe Event Dot - Velvet/Rose */}
                        {hasLibrariumEvent && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-700 ring-2 ring-white shadow-xs shrink-0" title="Librarium Luxe Date" />
                        )}
                        {/* Business Events Dots */}
                        {hasCeoDay && (
                          <span className="w-2.5 h-2.5 rounded bg-purple-600 ring-2 ring-white shadow-xs shrink-0" title="CEO Day" />
                        )}
                        {hasLuxeDay && (
                          <span className="w-2.5 h-2.5 rounded bg-amber-600 ring-2 ring-white shadow-xs shrink-0" title="Librarium Luxe Day" />
                        )}
                        {hasClientEvent && (
                          <span className="w-2.5 h-2.5 rounded bg-emerald-600 ring-2 ring-white shadow-xs shrink-0" title="Client Event" />
                        )}
                        {hasGenDay && (
                          <span className="w-2.5 h-2.5 rounded bg-teal-600 ring-2 ring-white shadow-xs shrink-0" title="General Business Day" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tiny background outline if active */}
                  {cell.isToday && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Calendar Legend */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 border border-amber-600/30" />
              <span>Gold / Platinum Event</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>CEO Blue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-700" />
              <span>Velvet Luxe</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-purple-600" />
              <span>CEO Day (Purple)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-amber-600" />
              <span>Luxe Day (Gold)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-emerald-600" />
              <span>Client Event (Green)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-teal-600" />
              <span>Business Day (Teal)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded border border-slate-400 bg-slate-950" />
              <span>Reference Today (July 8)</span>
            </div>
          </div>
        </div>

        {/* Right 4-columns: Date Details Panel */}
        <div className="lg:col-span-4 space-y-6 text-left">
          
          {/* Day Detail card */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-3xl p-6 shadow-md space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-widest block">
                Occasions On Selected Date
              </span>
              <h3 className="text-base font-bold text-slate-950 mt-1">
                {selectedDay === null 
                  ? "Select a Day" 
                  : `${monthNames[currentMonth]} ${selectedDay}, ${currentYear}`}
              </h3>
            </div>

            {selectedDay === null ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">Click any day on the schedule grid to load specific events and details.</p>
            ) : activeDayEvents.length === 0 ? (
              <div className="text-center py-6 text-slate-400 space-y-2">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs italic">No client milestones or follow-up events scheduled for this day.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {activeDayEvents.map(ev => {
                  const isCeo = ev.client.homeBrand === "CEO Printing Services" || ev.client.homeBrand === "CEO Lifestyle";
                  const isLuxe = ev.client.homeBrand === "Librarium Luxe" || ev.client.homeBrand === "CEO Lifestyle";
                  
                  // Detail card branding color scheme
                  let themeCardClass = "bg-slate-50 border-slate-200/60";
                  let tagText = "text-slate-500 bg-slate-100 border-slate-200";
                  
                  if (ev.type === "birthday") {
                    themeCardClass = "bg-amber-50/40 border-amber-200/50";
                    tagText = "text-amber-800 bg-amber-100 border-amber-200";
                  } else if (ev.type === "anniversary") {
                    themeCardClass = "bg-rose-50/40 border-rose-200/50";
                    tagText = "text-rose-800 bg-rose-100 border-rose-200";
                  } else if (ev.type === "reminder") {
                    themeCardClass = "bg-blue-50/40 border-blue-200/50";
                    tagText = "text-blue-800 bg-blue-100 border-blue-200";
                  } else if (ev.type === "business" || ev.type === "custom_milestone") {
                    if (ev.businessType === "CEO Day") {
                      themeCardClass = "bg-purple-50/50 border-purple-200/50";
                      tagText = "text-purple-800 bg-purple-100 border-purple-200";
                    } else if (ev.businessType === "Librarium Luxe Day") {
                      themeCardClass = "bg-amber-50/40 border-amber-200/50";
                      tagText = "text-amber-800 bg-amber-100 border-amber-200";
                    } else if (ev.businessType === "Client Event") {
                      themeCardClass = "bg-emerald-50/50 border-emerald-200/50";
                      tagText = "text-emerald-800 bg-emerald-100 border-emerald-200";
                    } else {
                      themeCardClass = "bg-teal-50/40 border-teal-200/50";
                      tagText = "text-teal-800 bg-teal-100 border-teal-200";
                    }
                  }

                  return (
                    <div 
                      key={ev.id}
                      className={`p-3.5 rounded-2xl border transition-all hover:shadow-xs text-left space-y-2.5 relative ${themeCardClass}`}
                    >
                      {/* Header Row */}
                      <div className="flex justify-between items-start">
                        <div>
                          {ev.type === "business" && ev.businessType !== "Client Event" ? (
                            <p className="font-extrabold text-xs text-purple-950 flex items-center gap-1.5">
                              💼 {ev.businessType || "Corporate Event"}
                            </p>
                          ) : (
                            <p 
                              onClick={() => {
                                if (ev.client && ev.client.id !== "business-entity") {
                                  onSelectClient(ev.client.id);
                                }
                              }}
                              className="font-extrabold text-xs text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer flex items-center gap-1.5"
                            >
                              {ev.client.firstName} {ev.client.lastName}
                              {ev.client.tier === "Gold" && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-amber-950 font-black uppercase tracking-wider">
                                  Gold
                                </span>
                              )}
                              {ev.client.tier === "Platinum" && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-900 text-slate-100 border border-slate-950 font-black uppercase tracking-wider">
                                  Platinum
                                </span>
                              )}
                            </p>
                          )}
                          {ev.type === "business" && ev.businessType !== "Client Event" ? (
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Corporate Headquarters • Kingston, JM</p>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {ev.client.id} • {ev.client.contact?.city || "Jamaica"}</p>
                          )}
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border ${tagText}`}>
                          {ev.businessType === "Client Event" ? "Client Event" : ev.type === "custom_milestone" ? "Milestone" : ev.type === "business" ? "Business" : ev.type}
                        </span>
                      </div>

                      {/* Content Description */}
                      <div className="text-xs text-slate-700 leading-relaxed font-medium bg-white/75 p-2 rounded-xl border border-slate-100">
                        {ev.type === "birthday" && <Gift className="w-3.5 h-3.5 text-amber-500 inline mr-1.5 align-middle" />}
                        {ev.type === "anniversary" && <Heart className="w-3.5 h-3.5 text-rose-500 inline mr-1.5 align-middle" />}
                        {ev.type === "reminder" && <Bell className="w-3.5 h-3.5 text-blue-500 inline mr-1.5 align-middle" />}
                        {ev.businessType === "Client Event" && <span className="inline mr-1.5 align-middle">👤</span>}
                        {ev.type === "business" && ev.businessType !== "Client Event" && <CalendarIcon className="w-3.5 h-3.5 text-purple-500 inline mr-1.5 align-middle" />}
                        <span className="align-middle">{ev.label}</span>
                        {ev.description && (
                          <p className="text-[11px] text-slate-500 mt-1 font-normal italic">{ev.description}</p>
                        )}
                      </div>

                      {/* Home brand footer indicators */}
                      <div className="flex items-center justify-between pt-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                          {isCeo && ev.type !== "business" && ev.businessType !== "Client Event" && (
                            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                              <Printer className="w-3 h-3" /> CEO Blue
                            </span>
                          )}
                          {isLuxe && ev.type !== "business" && ev.businessType !== "Client Event" && (
                            <span className="flex items-center gap-1 bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded">
                              <BookOpen className="w-3 h-3" /> Velvet Luxe
                            </span>
                          )}
                          {ev.businessType === "Client Event" && (
                            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-100">
                              Client Care Event
                            </span>
                          )}
                          {ev.type === "business" && ev.businessType !== "Client Event" && (
                            <span className="flex items-center gap-1 bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded border border-purple-100">
                              <ShieldCheck className="w-3 h-3" /> Management
                            </span>
                          )}
                        </div>

                        {ev.id.startsWith("custom-evt-") ? (
                          <button
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this custom event?")) {
                                setBusinessEvents(prev => prev.filter(b => b.id !== ev.id));
                              }
                            }}
                            className="text-red-600 hover:text-red-700 font-extrabold flex items-center gap-0.5 transition-colors uppercase tracking-wider cursor-pointer"
                          >
                            Delete Event
                          </button>
                        ) : ev.type === "business" && ev.businessType !== "Client Event" ? (
                          <span className="text-[9px] text-indigo-700 font-bold tracking-wider uppercase">Enterprise event</span>
                        ) : (
                          <button
                            onClick={() => {
                              if (ev.client && ev.client.id !== "business-entity") {
                                onSelectClient(ev.client.id);
                              }
                            }}
                            className="text-slate-500 hover:text-slate-900 flex items-center gap-0.5 transition-colors font-bold uppercase tracking-wider cursor-pointer"
                          >
                            View Profile <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Create Calendar Event Card */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-3xl p-5 shadow-md space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-widest block">Schedule Creator</span>
                <h3 className="text-xs font-bold text-slate-950 mt-0.5">Add Calendar Event</h3>
              </div>
              <button
                onClick={() => setShowAddEventForm(!showAddEventForm)}
                className="text-[10px] bg-slate-900 text-white hover:bg-slate-800 px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer"
              >
                {showAddEventForm ? "Close Creator" : "Create Custom Event"}
              </button>
            </div>

            {showAddEventForm && (
              <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Event Category</label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-850 rounded-xl px-3 py-1.5 focus:outline-none transition-colors text-xs font-semibold"
                  >
                    <option value="Client Event">👤 Client Event</option>
                    <option value="CEO Day">💜 CEO Day</option>
                    <option value="Librarium Luxe Day">💛 Librarium Luxe Day</option>
                    <option value="General Business Day">💚 General Business Day</option>
                  </select>
                </div>

                {eventCategory === "Client Event" && (
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Associate Client</label>
                    <select
                      value={eventClientId}
                      onChange={(e) => setEventClientId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-850 rounded-xl px-3 py-1.5 focus:outline-none transition-colors text-xs font-semibold"
                    >
                      <option value="">-- Choose Client Profile --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName} ({c.tier})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP Consultation Dinner"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-850 rounded-xl px-3 py-1.5 focus:outline-none transition-colors text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-850 rounded-xl px-3 py-1.5 focus:outline-none transition-colors text-xs font-semibold"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedDay) {
                          const mStr = String(currentMonth + 1).padStart(2, "0");
                          const dStr = String(selectedDay).padStart(2, "0");
                          setEventDate(`${currentYear}-${mStr}-${dStr}`);
                        }
                      }}
                      className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[9px] text-center border border-slate-200/50 cursor-pointer"
                      title="Use the currently selected calendar date"
                    >
                      Use Selected Day
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes / Description</label>
                  <textarea
                    rows={2}
                    placeholder="Provide details or preparation steps..."
                    value={eventNotes}
                    onChange={(e) => setEventNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-850 rounded-xl px-3 py-1.5 focus:outline-none transition-colors text-xs font-semibold resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Create Event
                </button>
              </form>
            )}
          </div>

          {/* Upcoming 30-Day Client Events */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-3xl p-6 shadow-md space-y-4">
            <div className="pb-3 border-b border-slate-100 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-extrabold text-amber-600 uppercase tracking-widest block">
                  Upcoming Agenda
                </span>
                <h3 className="text-sm font-bold text-slate-950">
                  Next 30 Days Milestones
                </h3>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-xl text-slate-600">
                {upcomingMilestones.length} Found
              </span>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {upcomingMilestones.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No major milestones or reminders found inside the next 30 days.</p>
              ) : (
                upcomingMilestones.map((ev, idx) => {
                  let badgeColor = "bg-slate-100 text-slate-600";
                  if (ev.daysRemaining === 0) badgeColor = "bg-rose-500 text-white animate-pulse";
                  else if (ev.daysRemaining === 1) badgeColor = "bg-amber-500 text-white";
                  else if (ev.daysRemaining <= 5) badgeColor = "bg-indigo-600 text-white";

                  return (
                    <div
                      key={`upc-${idx}`}
                      onClick={() => onSelectClient(ev.client.id)}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/40 hover:border-slate-300 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs group"
                    >
                      <div className="text-left space-y-0.5 max-w-[70%]">
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 group-hover:underline flex items-center gap-1">
                          {ev.client.firstName} {ev.client.lastName}
                          {ev.isVip && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          )}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate italic">
                          {ev.type === "birthday" ? "🎁 Birthday" : ev.type === "anniversary" ? "💍 Anniversary" : "📌 " + ev.label}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                          {ev.dateStr}
                        </p>
                      </div>

                      <span className={`text-[9px] font-mono font-bold px-2 py-1 rounded-lg ${badgeColor}`}>
                        {ev.daysRemaining === 0 ? "TODAY" : ev.daysRemaining === 1 ? "1 day" : `${ev.daysRemaining} days`}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

// ==========================================
// COMPACT INTERACTIVE WIDGET EXPORT
// ==========================================
interface CompactCalendarWidgetProps {
  clients: Client[];
  onSelectClient: (clientId: string) => void;
  onOpenTask?: (clientId: string, reminderId: string) => void;
}

export function SmallCalendarWidget({ clients, onSelectClient, onOpenTask }: CompactCalendarWidgetProps) {
  const [currentYear, setCurrentYear] = useState(SYSTEM_REFERENCE_YEAR);
  const [currentMonth, setCurrentMonth] = useState(SYSTEM_REFERENCE_MONTH); // July (0-indexed)
  const [selectedDay, setSelectedDay] = useState<number | null>(SYSTEM_REFERENCE_DAY);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Aggregate events for compact display
  const events = useMemo(() => {
    const list: Array<{
      clientId: string;
      clientName: string;
      isVip: boolean;
      homeBrand: string;
      label: string;
      type: "birthday" | "anniversary" | "reminder";
      month: number;
      day: number;
      reminderId?: string;
    }> = [];

    clients.forEach(c => {
      c.importantDates.forEach(d => {
        const parsed = parseDateString(d.date);
        if (!parsed) return;
        const isBday = d.label.toLowerCase().includes("birth");
        const isAnniv = d.label.toLowerCase().includes("ann") || d.label.toLowerCase().includes("wed");
        list.push({
          clientId: c.id,
          clientName: `${c.firstName} ${c.lastName}`,
          isVip: c.tier === "Gold" || c.tier === "Platinum",
          homeBrand: c.homeBrand,
          label: d.label,
          type: isBday ? "birthday" : isAnniv ? "anniversary" : "reminder",
          month: parsed.month,
          day: parsed.day
        });
      });

      c.reminders.forEach(r => {
        const parsed = parseDateString(r.date);
        if (!parsed) return;
        list.push({
          clientId: c.id,
          clientName: `${c.firstName} ${c.lastName}`,
          isVip: c.tier === "Gold" || c.tier === "Platinum",
          homeBrand: c.homeBrand,
          label: r.task,
          type: "reminder",
          month: parsed.month,
          day: parsed.day,
          reminderId: r.id
        });
      });
    });

    return list;
  }, [clients]);

  // Calendar cells calculation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const cells = useMemo(() => {
    const arr: Array<{ dayNum: number | null; isToday: boolean; hasEvents: boolean }> = [];
    for (let i = 0; i < firstDayIndex; i++) {
      arr.push({ dayNum: null, isToday: false, hasEvents: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = currentYear === SYSTEM_REFERENCE_YEAR && currentMonth === SYSTEM_REFERENCE_MONTH && d === SYSTEM_REFERENCE_DAY;
      const dayHasEvents = events.some(e => e.month === currentMonth && e.day === d);
      arr.push({
        dayNum: d,
        isToday,
        hasEvents: dayHasEvents
      });
    }
    return arr;
  }, [currentYear, currentMonth, daysInMonth, firstDayIndex, events]);

  // Month navigations
  const handlePrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
    setSelectedDay(null);
  };

  const handleNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
    setSelectedDay(null);
  };

  const selectedDayEvents = useMemo(() => {
    if (selectedDay === null) return [];
    return events.filter(e => e.month === currentMonth && e.day === selectedDay);
  }, [selectedDay, currentMonth, events]);

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm space-y-4 text-left">
      <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-extrabold text-slate-400 tracking-wider uppercase block">Interactive Agenda</h3>
          <span className="text-sm font-bold text-slate-900 mt-0.5 block">{monthNames[currentMonth]} {currentYear}</span>
        </div>

        <div className="flex gap-1 bg-slate-50 p-0.5 border border-slate-200/40 rounded-lg">
          <button onClick={handlePrev} className="p-1 hover:bg-white rounded text-slate-500 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleNext} className="p-1 hover:bg-white rounded text-slate-500 transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Week days labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
        <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
      </div>

      {/* Monthly grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (cell.dayNum === null) return <div key={`empty-${idx}`} className="aspect-square" />;

          const isSelected = selectedDay === cell.dayNum;
          return (
            <button
              key={`compact-day-${cell.dayNum}`}
              onClick={() => setSelectedDay(cell.dayNum)}
              className={`aspect-square text-[11px] font-black rounded-lg relative flex flex-col items-center justify-center border transition-all ${
                cell.isToday 
                  ? "bg-slate-950 text-amber-300 border-transparent font-black shadow-xs text-xs"
                  : isSelected
                    ? "bg-indigo-50 border-indigo-500 text-indigo-950 ring-2 ring-indigo-500 font-black"
                    : "bg-white border-slate-200/60 text-slate-900 hover:bg-slate-50 font-black"
              }`}
            >
              <span>{cell.dayNum}</span>
              {cell.hasEvents && (
                <span className={`w-2.5 h-2.5 rounded-full absolute bottom-0.5 border border-white shadow-xs ${cell.isToday ? "bg-amber-400 animate-pulse" : "bg-indigo-600 animate-pulse"}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day milestones feed lists */}
      {selectedDay !== null && (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Occasions on {monthNames[currentMonth]} {selectedDay}:
          </p>
          {selectedDayEvents.length === 0 ? (
            <p className="text-[10px] text-slate-400 italic">No scheduled milestones or call tasks.</p>
          ) : (
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {selectedDayEvents.map((ev, i) => {
                const clientObj = clients.find(c => c.id === ev.clientId);
                const tier = clientObj?.tier || "Silver";
                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (ev.type === "reminder" && ev.reminderId && onOpenTask) {
                        onOpenTask(ev.clientId, ev.reminderId);
                      } else {
                        onSelectClient(ev.clientId);
                      }
                    }}
                    className={`p-2 border rounded-xl cursor-pointer flex justify-between items-center text-[10px] group transition-all hover:-translate-y-0.5 ${
                      tier === "Gold"
                        ? "bg-amber-50/30 border-amber-200/70 hover:bg-amber-50/60 border-l-4 border-l-amber-500"
                        : tier === "Platinum"
                          ? "bg-slate-50 border-slate-200 hover:bg-slate-100 border-l-4 border-l-slate-900"
                          : "bg-slate-50/50 border-slate-200/40 hover:bg-slate-50 border-l-4 border-l-slate-300"
                    }`}
                  >
                    <div className="text-left truncate max-w-[80%]">
                      <p className="font-extrabold text-slate-900 group-hover:text-indigo-600 truncate">
                        {ev.clientName}
                      </p>
                      <p className="text-[9px] text-slate-500 truncate italic">
                        {ev.type === "birthday" ? "🎁 Birthday" : ev.type === "anniversary" ? "💍 Anniversary" : "📌 " + ev.label}
                      </p>
                    </div>
                    {tier === "Gold" && (
                      <span className="text-[7px] font-black uppercase bg-amber-100 text-amber-800 px-1 py-0.5 rounded leading-none">
                        Gold
                      </span>
                    )}
                    {tier === "Platinum" && (
                      <span className="text-[7px] font-black uppercase bg-slate-900 text-slate-100 px-1 py-0.5 rounded leading-none">
                        Plat
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
