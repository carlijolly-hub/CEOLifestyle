import React, { useState, useEffect } from "react";
import { SupplierOperatingHours } from "../types";

/**
 * Authoritative Business Timezone for CEO Lifestyle Management
 * Kingston, Jamaica (UTC-5 year-round, no daylight saving time shifts).
 * All users (Carli, wife, team) evaluate against this single master time reference.
 */
export const SYSTEM_TIMEZONE = "America/Jamaica";

const DAYS_ORDER = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
] as const;

export type DayKey = typeof DAYS_ORDER[number];

export type VendorOperatingState = "OPEN" | "CLOSED" | "HOURS_UNAVAILABLE";

export interface VendorOperatingStatus {
  status: VendorOperatingState;
  label: "OPEN" | "CLOSED" | "Hours Unavailable";
  detail: string;
  isOpen: boolean;
  dayLabel: string;
  currentTimeFormatted: string;
  currentDateFormatted: string;
}

export interface SystemTimeDetails {
  date: Date;
  dayName: DayKey;
  dayIndex: number;
  dayLabel: string;
  hours: number;
  minutes: number;
  seconds: number;
  totalMinutes: number;
  formattedDate: string;
  formattedTime: string;
}

/**
 * Parse any 12-hour (e.g. "8:00 AM", "5:00 PM", "8:30pm", "8am")
 * or 24-hour (e.g. "17:00", "08:00") time string into total minutes from midnight (0 - 1439).
 * Returns null if string is empty or invalid.
 */
export function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr || typeof timeStr !== "string") return null;
  const cleaned = timeStr.trim();
  if (!cleaned) return null;

  // 12-hour format: e.g. "8:00 AM", "08:00 PM", "8:30pm", "8am", "5pm"
  const match12 = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const meridiem = match12[3].toLowerCase();
    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // 24-hour format: e.g. "17:00", "08:30"
  const match24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  return null;
}

/**
 * Extract authoritative day, hour, minute, and formatted values
 * in the system business timezone (America/Jamaica).
 */
export function getSystemTimeDetails(baseDate: Date = new Date()): SystemTimeDetails {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: SYSTEM_TIMEZONE,
      weekday: "long",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });

    const parts = formatter.formatToParts(baseDate);
    const map: Record<string, string> = {};
    for (const p of parts) {
      map[p.type] = p.value;
    }

    const rawWeekday = (map.weekday || "").toLowerCase();
    const dayName: DayKey = (DAYS_ORDER.includes(rawWeekday as DayKey)
      ? rawWeekday
      : "monday") as DayKey;

    const dayIndex = DAYS_ORDER.indexOf(dayName);
    const hours = parseInt(map.hour || "0", 10) % 24;
    const minutes = parseInt(map.minute || "0", 10);
    const seconds = parseInt(map.second || "0", 10);
    const totalMinutes = hours * 60 + minutes;

    const dayLabel = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    const formattedDate = baseDate.toLocaleDateString("en-US", {
      timeZone: SYSTEM_TIMEZONE,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedTime = baseDate.toLocaleTimeString("en-US", {
      timeZone: SYSTEM_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return {
      date: baseDate,
      dayName,
      dayIndex,
      dayLabel,
      hours,
      minutes,
      seconds,
      totalMinutes,
      formattedDate,
      formattedTime,
    };
  } catch {
    // Fallback if Intl fails
    const dayIndex = baseDate.getDay();
    const dayName = DAYS_ORDER[dayIndex] || "monday";
    const hours = baseDate.getHours();
    const minutes = baseDate.getMinutes();
    const seconds = baseDate.getSeconds();
    const totalMinutes = hours * 60 + minutes;
    const dayLabel = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    return {
      date: baseDate,
      dayName,
      dayIndex,
      dayLabel,
      hours,
      minutes,
      seconds,
      totalMinutes,
      formattedDate: baseDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      formattedTime: baseDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  }
}

/**
 * Look ahead across the next 7 days to determine the vendor's next opening window.
 */
function findNextOpening(
  operatingHours: SupplierOperatingHours,
  currentDayIndex: number,
  currentTotalMinutes: number
): string | null {
  for (let offset = 0; offset <= 7; offset++) {
    const dayIndex = (currentDayIndex + offset) % 7;
    const dayName = DAYS_ORDER[dayIndex];
    const sched = operatingHours?.[dayName];

    if (sched && sched.isOpen) {
      const openMin = parseTimeToMinutes(sched.openTime);
      if (openMin !== null) {
        if (offset === 0) {
          if (currentTotalMinutes < openMin) {
            return `Opens at ${sched.openTime}`;
          }
        } else {
          const dayLabel =
            offset === 1
              ? "tomorrow"
              : dayName.charAt(0).toUpperCase() + dayName.slice(1);
          return `Opens ${dayLabel} at ${sched.openTime}`;
        }
      }
    }
  }
  return null;
}

/**
 * Pure evaluation function: determines whether a vendor is currently OPEN or CLOSED
 * given their Daily Operating Hours and the authoritative system time.
 */
export function calculateVendorOperatingStatus(
  operatingHours?: SupplierOperatingHours,
  timeDetails?: SystemTimeDetails
): VendorOperatingStatus {
  const current = timeDetails || getSystemTimeDetails();

  if (!operatingHours || typeof operatingHours !== "object") {
    return {
      status: "HOURS_UNAVAILABLE",
      label: "Hours Unavailable",
      detail: "Schedule not configured",
      isOpen: false,
      dayLabel: current.dayLabel,
      currentTimeFormatted: current.formattedTime,
      currentDateFormatted: current.formattedDate,
    };
  }

  // Verify that at least one day is defined in operatingHours
  const hasAnySchedule = DAYS_ORDER.some(d => operatingHours[d] !== undefined);
  if (!hasAnySchedule) {
    return {
      status: "HOURS_UNAVAILABLE",
      label: "Hours Unavailable",
      detail: "Schedule not configured",
      isOpen: false,
      dayLabel: current.dayLabel,
      currentTimeFormatted: current.formattedTime,
      currentDateFormatted: current.formattedDate,
    };
  }

  const todaySched = operatingHours[current.dayName];

  // If today's entry is missing completely
  if (!todaySched || typeof todaySched !== "object") {
    const nextOpening = findNextOpening(operatingHours, current.dayIndex, current.totalMinutes);
    return {
      status: "HOURS_UNAVAILABLE",
      label: "Hours Unavailable",
      detail: nextOpening || "Schedule incomplete for today",
      isOpen: false,
      dayLabel: current.dayLabel,
      currentTimeFormatted: current.formattedTime,
      currentDateFormatted: current.formattedDate,
    };
  }

  // Vendor is marked closed today
  if (todaySched.isOpen === false) {
    const nextOpening = findNextOpening(operatingHours, current.dayIndex, current.totalMinutes);
    return {
      status: "CLOSED",
      label: "CLOSED",
      detail: nextOpening || "Closed today",
      isOpen: false,
      dayLabel: current.dayLabel,
      currentTimeFormatted: current.formattedTime,
      currentDateFormatted: current.formattedDate,
    };
  }

  // Parse open and close times
  const openMinutes = parseTimeToMinutes(todaySched.openTime);
  const closeMinutes = parseTimeToMinutes(todaySched.closeTime);

  // If times are missing or invalid, fail safe to Hours Unavailable
  if (openMinutes === null || closeMinutes === null) {
    return {
      status: "HOURS_UNAVAILABLE",
      label: "Hours Unavailable",
      detail: "Operating hours format incomplete",
      isOpen: false,
      dayLabel: current.dayLabel,
      currentTimeFormatted: current.formattedTime,
      currentDateFormatted: current.formattedDate,
    };
  }

  const nextOpening = findNextOpening(operatingHours, current.dayIndex, current.totalMinutes);

  // Normal daytime schedule (e.g. 8:00 AM - 5:00 PM)
  if (openMinutes <= closeMinutes) {
    // Exact boundary rule:
    // 7:59 AM -> CLOSED
    // 8:00 AM -> OPEN
    // 12:30 PM -> OPEN
    // 5:00 PM -> OPEN (inclusive until close boundary)
    // 5:01 PM -> CLOSED
    if (current.totalMinutes >= openMinutes && current.totalMinutes <= closeMinutes) {
      return {
        status: "OPEN",
        label: "OPEN",
        detail: `Open until ${todaySched.closeTime}`,
        isOpen: true,
        dayLabel: current.dayLabel,
        currentTimeFormatted: current.formattedTime,
        currentDateFormatted: current.formattedDate,
      };
    } else if (current.totalMinutes < openMinutes) {
      return {
        status: "CLOSED",
        label: "CLOSED",
        detail: `Opens at ${todaySched.openTime}`,
        isOpen: false,
        dayLabel: current.dayLabel,
        currentTimeFormatted: current.formattedTime,
        currentDateFormatted: current.formattedDate,
      };
    } else {
      // Past closing time
      return {
        status: "CLOSED",
        label: "CLOSED",
        detail: nextOpening || `Closed at ${todaySched.closeTime}`,
        isOpen: false,
        dayLabel: current.dayLabel,
        currentTimeFormatted: current.formattedTime,
        currentDateFormatted: current.formattedDate,
      };
    }
  } else {
    // Overnight schedule (e.g. 6:00 PM to 2:00 AM)
    if (current.totalMinutes >= openMinutes || current.totalMinutes <= closeMinutes) {
      return {
        status: "OPEN",
        label: "OPEN",
        detail: `Open until ${todaySched.closeTime}`,
        isOpen: true,
        dayLabel: current.dayLabel,
        currentTimeFormatted: current.formattedTime,
        currentDateFormatted: current.formattedDate,
      };
    } else {
      return {
        status: "CLOSED",
        label: "CLOSED",
        detail: `Opens at ${todaySched.openTime}`,
        isOpen: false,
        dayLabel: current.dayLabel,
        currentTimeFormatted: current.formattedTime,
        currentDateFormatted: current.formattedDate,
      };
    }
  }
}

/**
 * Centralized Live System Time Broadcaster
 * Maintains a single timer across the entire application to power live updates
 * without creating redundant intervals or causing performance overhead.
 */
class SystemTimeBroadcaster {
  private listeners = new Set<(details: SystemTimeDetails) => void>();
  private timer: any = null;
  private currentDetails: SystemTimeDetails = getSystemTimeDetails();

  public getCurrentDetails(): SystemTimeDetails {
    return this.currentDetails;
  }

  public subscribe(listener: (details: SystemTimeDetails) => void): () => void {
    this.listeners.add(listener);
    // Send immediate value
    listener(this.currentDetails);

    if (!this.timer) {
      // Check every 5 seconds to provide responsive live boundary transitions
      this.timer = setInterval(() => {
        this.currentDetails = getSystemTimeDetails();
        for (const l of this.listeners) {
          l(this.currentDetails);
        }
      }, 5000);
    }

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    };
  }
}

export const systemTimeBroadcaster = new SystemTimeBroadcaster();

/**
 * Hook to consume live system time synchronized across all users.
 */
export function useLiveSystemTime(): SystemTimeDetails {
  const [details, setDetails] = useState<SystemTimeDetails>(() =>
    systemTimeBroadcaster.getCurrentDetails()
  );

  useEffect(() => {
    return systemTimeBroadcaster.subscribe(nextDetails => {
      setDetails(nextDetails);
    });
  }, []);

  return details;
}

/**
 * Hook to evaluate a vendor's real-time operating status based on live system clock.
 */
export function useVendorOperatingStatus(
  operatingHours?: SupplierOperatingHours
): VendorOperatingStatus {
  const liveTime = useLiveSystemTime();
  return calculateVendorOperatingStatus(operatingHours, liveTime);
}

/**
 * Premium Apple-inspired dynamic operating status badge.
 */
export function VendorOperatingStatusBadge({
  operatingHours,
  className = "",
  size = "md",
  showDetail = true,
}: {
  operatingHours?: SupplierOperatingHours;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  showDetail?: boolean;
}) {
  const status = useVendorOperatingStatus(operatingHours);

  if (status.status === "OPEN") {
    return (
      <span
        title={`Status: OPEN based on System Reference Time (${status.currentTimeFormatted}). ${status.detail}`}
        className={`inline-flex items-center gap-1.5 font-bold rounded-full border transition-all ${
          size === "xs"
            ? "px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-300"
            : size === "sm"
            ? "px-2.5 py-0.5 text-[11px] bg-emerald-50 text-emerald-800 border-emerald-200"
            : size === "lg"
            ? "px-3.5 py-1.5 text-xs bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
            : "px-2.5 py-1 text-xs bg-emerald-50 text-emerald-800 border-emerald-200"
        } ${className}`}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="tracking-wide">OPEN</span>
        {showDetail && status.detail && (
          <span className="text-emerald-700/80 font-medium pl-0.5 text-[10.5px]">
            · {status.detail}
          </span>
        )}
      </span>
    );
  }

  if (status.status === "CLOSED") {
    return (
      <span
        title={`Status: CLOSED based on System Reference Time (${status.currentTimeFormatted}). ${status.detail}`}
        className={`inline-flex items-center gap-1.5 font-bold rounded-full border transition-all ${
          size === "xs"
            ? "px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 border-slate-300"
            : size === "sm"
            ? "px-2.5 py-0.5 text-[11px] bg-slate-100 text-slate-700 border-slate-200"
            : size === "lg"
            ? "px-3.5 py-1.5 text-xs bg-slate-100 text-slate-800 border-slate-300 shadow-2xs"
            : "px-2.5 py-1 text-xs bg-slate-100 text-slate-700 border-slate-200"
        } ${className}`}
      >
        <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
        <span className="tracking-wide">CLOSED</span>
        {showDetail && status.detail && (
          <span className="text-slate-500 font-medium pl-0.5 text-[10.5px]">
            · {status.detail}
          </span>
        )}
      </span>
    );
  }

  // HOURS_UNAVAILABLE
  return (
    <span
      title="Daily operating hours have not been configured or are incomplete for this vendor."
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${
        size === "xs"
          ? "px-2 py-0.5 text-[10px] bg-slate-50 text-slate-500 border-slate-200"
          : size === "sm"
          ? "px-2.5 py-0.5 text-[11px] bg-slate-50 text-slate-500 border-slate-200"
          : size === "lg"
          ? "px-3.5 py-1.5 text-xs bg-slate-50 text-slate-600 border-slate-200"
          : "px-2.5 py-1 text-xs bg-slate-50 text-slate-500 border-slate-200"
      } ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
      <span>Hours Unavailable</span>
    </span>
  );
}
