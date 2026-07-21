import React, { useState, useMemo } from "react";
import { Client, ImportantDate, FollowUpReminder, BusinessEvent } from "../types";
import { getRelationshipEventTitle, getClientMilestones, parseDateString } from "../utils/dateHelpers";
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

// System reference date for relative comparisons (Dynamic Current Date)
const realToday = new Date();
const SYSTEM_REFERENCE_YEAR = realToday.getFullYear();
const SYSTEM_REFERENCE_MONTH = realToday.getMonth(); // 0-indexed
const SYSTEM_REFERENCE_DAY = realToday.getDate();

export default function MilestoneCalendar({ clients, onSelectClient, onOpenTask }: MilestoneCalendarProps) {
  // Navigation State
  const [currentYear, setCurrentYear] = useState(SYSTEM_REFERENCE_YEAR);
  const [currentMonth, setCurrentMonth] = useState(SYSTEM_REFERENCE_MONTH); // July (0-indexed)
  const [selectedDay, setSelectedDay] = useState<number | null>(SYSTEM_REFERENCE_DAY);
  
  // Business events state synced to localStorage
  const [businessEvents, setBusinessEvents] = useState<BusinessEvent[]>(() => {
    const stored = localStorage.getItem("ceo_crm_business_events");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (err) {
        console.error(err);
      }
    }
    return [
      { id: "be-1", title: "Annual CEO Day Celebration", date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-10`, type: "CEO Day", description: "All brand managers assemble." },
      { id: "be-2", title: "Librarium Luxe Literary Gala", date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-25`, type: "Librarium Luxe Day", description: "Gala evening celebrating rare books." },
      { id: "be-3", title: "General Mid-Year Alignment Review", date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-08`, type: "General Business Day", description: "Review overall CRM progress." }
    ];
  });

  React.useEffect(() => {
    localStorage.setItem("ceo_crm_business_events", JSON.stringify(businessEvents));
  }, [businessEvents]);

  // Visual filter toggle: "both" | "client_only" | "business_only"
  const [displayToggle, setDisplayToggle] = useState<"both" | "client_only" | "business_only">("both");

  // Create event states
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [eventCategory, setEventCategory] = useState<BusinessEvent["type"]>("Gold Client Events");
  const [eventClientId, setEventClientId] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [eventNotes, setEventNotes] = useState("");

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate) return;

    const newEv: BusinessEvent = {
      id: `custom-evt-${Date.now()}`,
      title: eventTitle.trim(),
      date: eventDate,
      type: eventCategory,
      description: eventNotes.trim() || undefined,
      associatedClientId: (eventCategory === "Gold / Platinum Client Events" || eventCategory === "Gold Client Events" || eventCategory === "Platinum Client Events" || eventCategory === "Silver Client Events") ? eventClientId : undefined
    };

    setBusinessEvents(prev => [...prev, newEv]);

    // Reset fields
    setEventTitle("");
    setEventNotes("");
    setEventClientId("");
  };

  // Filters
  const [brandFilter, setBrandFilter] = useState<"all" | "CEO Printing Services" | "Librarium Luxe">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | BusinessEvent["type"]>("all");
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
      businessType: BusinessEvent["type"];
      label: string;
      dateStr: string;
      parsedMonth: number;
      parsedDay: number;
      parsedYear?: number;
      isVip: boolean;
    }> = [];

    clients.forEach(client => {
      // 1. Process unified milestone events
      const milestones = getClientMilestones(client);
      milestones.forEach((m, idx) => {
        const parsed = parseDateString(m.date);
        if (!parsed) return;

        eventsList.push({
          id: `milestone-${client.id}-${idx}-${m.type}`,
          client,
          type: m.type,
          businessType: client.tier === "Gold" ? "Gold Client Events" : client.tier === "Platinum" ? "Platinum Client Events" : "Silver Client Events",
          label: m.label,
          dateStr: m.date,
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
          businessType: client.tier === "Gold" ? "Gold Client Events" : client.tier === "Platinum" ? "Platinum Client Events" : "Silver Client Events",
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
      const isClientRelated = be.type === "Gold / Platinum Client Events" || be.type === "Gold Client Events" || be.type === "Platinum Client Events" || be.type === "Silver Client Events";
      return {
        id: be.id,
        client: associatedClient || ({ id: "business-entity", firstName: "Business", lastName: "Event", homeBrand: "CEO Lifestyle" } as any),
        type: (isClientRelated && associatedClient) ? ("custom_milestone" as const) : ("business" as const),
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
      businessType?: BusinessEvent["type"];
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
        const itemBrand = ev.client && ev.client.id !== "business-entity" ? ev.client.homeBrand : null;
        if (itemBrand) {
          if (itemBrand !== "CEO Lifestyle" && itemBrand !== brandFilter) {
            return false;
          }
        } else {
          // If it's a pure business event without a client, check businessType
          if (brandFilter === "Librarium Luxe" && ev.businessType !== "Librarium Luxe Day") return false;
          if (brandFilter === "CEO Printing Services" && ev.businessType !== "CEO Day") return false;
        }
      }

      // Event Type filter
      if (typeFilter !== "all") {
        if (ev.businessType !== typeFilter) return false;
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
            <span className="text-xs font-bold text-white font-mono">
              {new Date(SYSTEM_REFERENCE_YEAR, SYSTEM_REFERENCE_MONTH, SYSTEM_REFERENCE_DAY).toLocaleDateString("en-US", {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                weekday: 'short'
              })}
            </span>
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
              <option value="all">All Categories</option>
              <option value="Gold Client Events">Gold Client Events</option>
              <option value="Platinum Client Events">Platinum Client Events</option>
              <option value="Silver Client Events">Silver Client Events</option>
              <option value="CEO Day">CEO Day</option>
              <option value="Librarium Luxe Day">Librarium Luxe Day</option>
              <option value="General Business Day">General Business Day</option>
            </select>
          </div>
        </div>

        {/* Shortcuts */}
        <div className="flex gap-2 h-full items-end pt-3 md:pt-0">
          <button
            onClick={handleResetToToday}
            className="flex-1 text-center py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
          >
            Go to Today
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

              // Color dot categorizations based on separate categories
              const hasGold = cell.events.some(e => e.businessType === "Gold Client Events" || e.businessType === "Gold / Platinum Client Events");
              const hasPlatinum = cell.events.some(e => e.businessType === "Platinum Client Events");
              const hasSilver = cell.events.some(e => e.businessType === "Silver Client Events");
              const hasCeoDay = cell.events.some(e => e.businessType === "CEO Day");
              const hasLuxeDay = cell.events.some(e => e.businessType === "Librarium Luxe Day");
              const hasGenDay = cell.events.some(e => e.businessType === "General Business Day");

              // Determine non-selected, non-today cell colors based on business events
              let cellBgClass = "bg-white border-slate-200/70 text-slate-900 hover:bg-slate-50 hover:border-slate-300";
              if (!cell.isToday && !isSelected && cell.events.length > 0) {
                if (hasPlatinum) {
                  cellBgClass = "bg-slate-900/10 border-slate-950 text-slate-950 hover:bg-slate-900/20 hover:border-slate-950/80";
                } else if (hasGold) {
                  cellBgClass = "bg-amber-50/60 border-amber-200 text-amber-950 hover:bg-amber-100/40 hover:border-amber-300";
                } else if (hasCeoDay) {
                  cellBgClass = "bg-blue-50/60 border-blue-200 text-blue-950 hover:bg-blue-100/40 hover:border-blue-300";
                } else if (hasLuxeDay) {
                  cellBgClass = "bg-rose-50/60 border-rose-200 text-rose-950 hover:bg-rose-100/40 hover:border-rose-300";
                } else if (hasGenDay) {
                  cellBgClass = "bg-emerald-50/60 border-emerald-200 text-emerald-950 hover:bg-emerald-100/40 hover:border-emerald-300";
                } else if (hasSilver) {
                  cellBgClass = "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300";
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
                        {hasPlatinum && (
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-950 ring-2 ring-white animate-pulse shadow-xs shrink-0" title="Platinum Client Events" />
                        )}
                        {hasGold && (
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white animate-pulse shadow-xs shrink-0" title="Gold Client Events" />
                        )}
                        {hasSilver && (
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 ring-2 ring-white shadow-xs shrink-0" title="Silver Client Events" />
                        )}
                        {hasCeoDay && (
                          <span className="w-2.5 h-2.5 rounded bg-blue-600 ring-2 ring-white shadow-xs shrink-0" title="CEO Day" />
                        )}
                        {hasLuxeDay && (
                          <span className="w-2.5 h-2.5 rounded bg-rose-600 ring-2 ring-white shadow-xs shrink-0" title="Librarium Luxe Day" />
                        )}
                        {hasGenDay && (
                          <span className="w-2.5 h-2.5 rounded bg-emerald-600 ring-2 ring-white shadow-xs shrink-0" title="General Business Day" />
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
              <span className="w-2.5 h-2.5 rounded-full bg-slate-950 ring-1 ring-slate-950/30" />
              <span>Platinum Client</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-1 ring-amber-500/30" />
              <span>Gold Client</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 ring-1 ring-slate-500/30" />
              <span>Silver Client</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-blue-600" />
              <span>CEO Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-rose-600" />
              <span>Librarium Luxe Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-emerald-600" />
              <span>General Business Day</span>
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
                  
                  // Detail card branding color scheme based on 6 unified categories
                  let themeCardClass = "bg-slate-50 border-slate-200/60";
                  let tagText = "text-slate-500 bg-slate-100 border-slate-200";
                  
                  if (ev.businessType === "Platinum Client Events") {
                    themeCardClass = "bg-slate-50 border-slate-950/80 shadow-xs";
                    tagText = "text-white bg-slate-950 border-slate-900";
                  } else if (ev.businessType === "Gold Client Events" || ev.businessType === "Gold / Platinum Client Events") {
                    themeCardClass = "bg-amber-50/40 border-amber-200/50";
                    tagText = "text-amber-800 bg-amber-100 border-amber-200";
                  } else if (ev.businessType === "Silver Client Events") {
                    themeCardClass = "bg-slate-50 border-slate-200/60";
                    tagText = "text-slate-700 bg-slate-100 border-slate-200";
                  } else if (ev.businessType === "CEO Day") {
                    themeCardClass = "bg-blue-50/50 border-blue-200/50";
                    tagText = "text-blue-800 bg-blue-100 border-blue-200";
                  } else if (ev.businessType === "Librarium Luxe Day") {
                    themeCardClass = "bg-rose-50/40 border-rose-200/50";
                    tagText = "text-rose-800 bg-rose-100 border-rose-200";
                  } else if (ev.businessType === "General Business Day") {
                    themeCardClass = "bg-emerald-50/50 border-emerald-200/50";
                    tagText = "text-emerald-800 bg-emerald-100 border-emerald-200";
                  }

                  const isClientEvent = ev.businessType === "Gold / Platinum Client Events" || ev.businessType === "Gold Client Events" || ev.businessType === "Platinum Client Events" || ev.businessType === "Silver Client Events";

                  return (
                    <div 
                      key={ev.id}
                      className={`p-3.5 rounded-2xl border transition-all hover:shadow-xs text-left space-y-2.5 relative ${themeCardClass}`}
                    >
                      {/* Header Row */}
                      <div className="flex justify-between items-start">
                        <div>
                          {isClientEvent && ev.client && ev.client.id !== "business-entity" ? (
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
                          ) : (
                            <p className="font-extrabold text-xs text-purple-950 flex items-center gap-1.5">
                              💼 {ev.businessType || "Corporate Event"}
                            </p>
                          )}
                          {isClientEvent && ev.client && ev.client.id !== "business-entity" ? (
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {ev.client.id} • {ev.client.contact?.city || "Jamaica"}</p>
                          ) : (
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Corporate Headquarters • Kingston, JM</p>
                          )}
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border ${tagText}`}>
                          {ev.businessType}
                        </span>
                      </div>
 
                      {/* Content Description */}
                      <div className="text-xs text-slate-700 leading-relaxed font-medium bg-white/75 p-2 rounded-xl border border-slate-100">
                        {ev.type === "birthday" && <Gift className="w-3.5 h-3.5 text-amber-500 inline mr-1.5 align-middle" />}
                        {ev.type === "anniversary" && <Heart className="w-3.5 h-3.5 text-rose-500 inline mr-1.5 align-middle" />}
                        {ev.type === "reminder" && <Bell className="w-3.5 h-3.5 text-blue-500 inline mr-1.5 align-middle" />}
                        {isClientEvent && <span className="inline mr-1.5 align-middle">👤</span>}
                        {ev.type === "business" && !isClientEvent && <CalendarIcon className="w-3.5 h-3.5 text-purple-500 inline mr-1.5 align-middle" />}
                        <span className="align-middle">{ev.label}</span>
                        {ev.description && (
                          <p className="text-[11px] text-slate-500 mt-1 font-normal italic">{ev.description}</p>
                        )}
                      </div>
 
                      {/* Home brand footer indicators */}
                      <div className="flex items-center justify-between pt-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                          {isCeo && !isClientEvent && (
                            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                              <Printer className="w-3 h-3" /> CEO Blue
                            </span>
                          )}
                          {isLuxe && !isClientEvent && (
                            <span className="flex items-center gap-1 bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded">
                              <BookOpen className="w-3 h-3" /> Velvet Luxe
                            </span>
                          )}
                          {isClientEvent && (
                            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-100">
                              Client Care Event
                            </span>
                          )}
                          {(ev.businessType === "CEO Day" || ev.businessType === "Librarium Luxe Day" || ev.businessType === "General Business Day") && (
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
                        ) : ev.type === "business" && !isClientEvent ? (
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
                    <option value="Gold Client Events">🏆 Gold Client Events</option>
                    <option value="Platinum Client Events">🖤 Platinum Client Events</option>
                    <option value="Silver Client Events">🥈 Silver Client Events</option>
                    <option value="CEO Day">💙 CEO Day</option>
                    <option value="Librarium Luxe Day">💛 Librarium Luxe Day</option>
                    <option value="General Business Day">💚 General Business Day</option>
                  </select>
                </div>

                {(eventCategory === "Gold / Platinum Client Events" || eventCategory === "Gold Client Events" || eventCategory === "Platinum Client Events" || eventCategory === "Silver Client Events") && (
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
      isBusiness?: boolean;
      businessType?: string;
    }> = [];

    clients.forEach(c => {
      const milestones = getClientMilestones(c);
      milestones.forEach((m) => {
        const parsed = parseDateString(m.date);
        if (!parsed) return;
        list.push({
          clientId: c.id,
          clientName: `${c.firstName} ${c.lastName}`,
          isVip: c.tier === "Gold" || c.tier === "Platinum",
          homeBrand: c.homeBrand,
          label: m.label,
          type: m.type === "custom_milestone" ? "reminder" : m.type,
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

    // Load business events
    const businessEvents = (() => {
      const stored = localStorage.getItem("ceo_crm_business_events");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (err) {
          console.error(err);
        }
      }
      return [];
    })();

    businessEvents.forEach((be: any) => {
      const parsed = parseDateString(be.date);
      if (!parsed) return;

      const associatedClient = be.associatedClientId ? clients.find(c => c.id === be.associatedClientId) : null;
      list.push({
        clientId: associatedClient ? associatedClient.id : "business-entity",
        clientName: associatedClient ? `${associatedClient.firstName} ${associatedClient.lastName}` : "Corporate Headquarters",
        isVip: associatedClient ? (associatedClient.tier === "Gold" || associatedClient.tier === "Platinum") : false,
        homeBrand: associatedClient ? associatedClient.homeBrand : "CEO Lifestyle",
        label: be.title,
        type: "reminder",
        month: parsed.month,
        day: parsed.day,
        reminderId: be.id,
        isBusiness: true,
        businessType: be.type
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
                const isCorp = ev.clientId === "business-entity";
                const isBusiness = (ev as any).isBusiness;
                const businessType = isBusiness ? (ev as any).businessType : "";
                const clientObj = clients.find(c => c.id === ev.clientId);
                const tier = clientObj?.tier || "Silver";

                // Corporate event custom classes
                let cardClass = `p-2 border rounded-xl flex justify-between items-center text-[10px] group transition-all hover:-translate-y-0.5 `;
                if (isCorp) {
                  cardClass += "bg-purple-50/50 border-purple-200 hover:bg-purple-100/50 border-l-4 border-l-purple-600";
                } else if (tier === "Gold") {
                  cardClass += "bg-amber-50/30 border-amber-200/70 hover:bg-amber-50/60 border-l-4 border-l-amber-500 cursor-pointer";
                } else if (tier === "Platinum") {
                  cardClass += "bg-slate-50 border-slate-200 hover:bg-slate-100 border-l-4 border-l-slate-900 cursor-pointer";
                } else {
                  cardClass += "bg-slate-50/50 border-slate-200/40 hover:bg-slate-50 border-l-4 border-l-slate-300 cursor-pointer";
                }

                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (isCorp) return;
                      if (ev.type === "reminder" && ev.reminderId && onOpenTask) {
                        onOpenTask(ev.clientId, ev.reminderId);
                      } else {
                        onSelectClient(ev.clientId);
                      }
                    }}
                    className={cardClass}
                  >
                    <div className="text-left truncate max-w-[80%]">
                      <p className="font-extrabold text-slate-900 group-hover:text-indigo-600 truncate">
                        {isCorp ? `💼 ${businessType}` : ev.clientName}
                      </p>
                      <p className="text-[9px] text-slate-500 truncate italic">
                        {isCorp ? ev.label : ev.type === "birthday" ? `🎁 ${ev.label}` : ev.type === "anniversary" ? `💍 ${ev.label}` : `📌 ${ev.label}`}
                      </p>
                      {isBusiness && !isCorp && (
                        <p className="text-[8px] font-bold text-indigo-600 uppercase tracking-wider mt-0.5">{businessType}</p>
                      )}
                    </div>
                    {isCorp && (
                      <span className="text-[7px] font-black uppercase bg-purple-100 text-purple-800 px-1 py-0.5 rounded leading-none">
                        Corp
                      </span>
                    )}
                    {!isCorp && tier === "Gold" && (
                      <span className="text-[7px] font-black uppercase bg-amber-100 text-amber-800 px-1 py-0.5 rounded leading-none">
                        Gold
                      </span>
                    )}
                    {!isCorp && tier === "Platinum" && (
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
