// Helper to parse dates like "March 14" or "July 8" or "Wedding Date: August 22, 2018"
// and compute days until next occurrence from the current date (July 8, 2026)

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

export interface UpcomingEvent {
  customerId: string;
  customerName: string;
  avatarColor: string;
  label: string; // E.g., "Daniel Williams's Birthday", "Sarah & David Thompson's Anniversary"
  eventDate: string; // "August 22"
  daysRemaining: number;
}

export function parseMonthDay(dateStr: string): { month: number; day: number } | null {
  if (!dateStr) return null;
  const cleaned = dateStr.toLowerCase().replace(/,/g, "").trim();
  const tokens = cleaned.split(/\s+/);
  if (tokens.length < 2) return null;

  // Let's check which token is the month and which is the day
  let month = -1;
  let day = -1;

  for (const token of tokens) {
    if (MONTH_MAP[token] !== undefined) {
      month = MONTH_MAP[token];
    } else {
      const parsedDay = parseInt(token, 10);
      if (!isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31) {
        day = parsedDay;
      }
    }
  }

  if (month !== -1 && day !== -1) {
    return { month, day };
  }
  return null;
}

export function getDaysRemaining(eventMonth: number, eventDay: number, currentYear = 2026, currentMonth = 6, currentDay = 8): number {
  const current = new Date(currentYear, currentMonth, currentDay);
  let target = new Date(currentYear, eventMonth, eventDay);

  // If the target date has already passed this year, set target to next year
  if (target.getTime() < current.getTime()) {
    target = new Date(currentYear + 1, eventMonth, eventDay);
  }

  const diffTime = target.getTime() - current.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getUpcomingEvents(
  customers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    importantDates: { label: string; date: string }[];
  }>,
  currentYear = 2026,
  currentMonth = 6, // July (0-indexed)
  currentDay = 8
): UpcomingEvent[] {
  const list: UpcomingEvent[] = [];

  const colors = ["bg-emerald-50 text-emerald-700 border-emerald-100", "bg-rose-50 text-rose-700 border-rose-100", "bg-indigo-50 text-indigo-700 border-indigo-100", "bg-amber-50 text-amber-700 border-amber-100", "bg-purple-50 text-purple-700 border-purple-100"];

  customers.forEach((customer, index) => {
    const avatarColor = colors[index % colors.length];
    customer.importantDates.forEach(d => {
      const parsed = parseMonthDay(d.date);
      if (parsed) {
        const days = getDaysRemaining(parsed.month, parsed.day, currentYear, currentMonth, currentDay);
        // Let's filter events that are within 180 days to keep the dashboard highly focused and useful
        if (days >= 0 && days <= 120) {
          list.push({
            customerId: customer.id,
            customerName: `${customer.firstName} ${customer.lastName}`,
            avatarColor,
            label: d.label === "Birthday" ? "Birthday" : d.label,
            eventDate: d.date,
            daysRemaining: days
          });
        }
      }
    });
  });

  // Sort by closest days remaining
  return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function syncFamilyBirthdayReminders(client: any): any {
  // Migrate any old homeBrand values to "CEO Lifestyle"
  if (client.homeBrand === "Both" || client.homeBrand === "Ceo Lifestyle" || client.homeBrand === "both" || !client.homeBrand) {
    client.homeBrand = "CEO Lifestyle";
  }

  // 1. Keep only non-automated reminders
  const manualReminders = client.reminders.filter((r: any) => !r.id.startsWith("rem-bday-") && !r.id.startsWith("rem-own-date-"));

  const newReminders: any[] = [];

  // Helper to construct a reminder date (14 days before birthday/special date)
  // If the special date has already passed in the current year (relative to July 8, 2026),
  // it is not a progressive date, so return null to skip generating a reminder.
  const getReminderDate = (bdayStr: string): string | null => {
    const parsed = parseMonthDay(bdayStr);
    if (!parsed) return null;
    
    const today = new Date(2026, 6, 8); // July is month index 6
    const specialDateThisYear = new Date(2026, parsed.month, parsed.day);
    
    if (specialDateThisYear.getTime() < today.getTime()) {
      return null; // Event has passed this year, not progressive
    }
    
    // Progressive date - calculate reminder date 14 days prior
    let d = new Date(2026, parsed.month, parsed.day);
    d.setDate(d.getDate() - 14);
    
    // If the reminder date itself has passed, opt for next year (2027)
    if (d.getTime() < today.getTime()) {
      d = new Date(2027, parsed.month, parsed.day);
      d.setDate(d.getDate() - 14);
    }
    
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, "0");
    const dStr = String(d.getDate()).padStart(2, "0");
    return `${yStr}-${mStr}-${dStr}`;
  };

  // Client's own important dates (Birthday, Anniversary, etc.)
  if (client.importantDates) {
    client.importantDates.forEach((dateObj: any, idx: number) => {
      if (dateObj.label && dateObj.date) {
        const bday = dateObj.date;
        const labelLower = dateObj.label.toLowerCase();
        const remDate = getReminderDate(bday);
        
        if (remDate) {
          let taskMsg = `Reach out to coordinate a premium package for ${client.firstName} ${client.lastName}'s ${dateObj.label} (${bday})`;
          if (labelLower === "birthday") {
            taskMsg = `Reach out to coordinate a premium package for ${client.firstName} ${client.lastName}'s Birthday (${bday})`;
          } else if (labelLower.includes("anniversary") || labelLower.includes("wedding") || labelLower.includes("proposal")) {
            taskMsg = `Reach out to coordinate an exclusive surprise for ${client.firstName} ${client.lastName}'s ${dateObj.label} (${bday})`;
          }
          
          newReminders.push({
            id: `rem-own-date-${idx}-${client.id}`,
            date: remDate,
            task: taskMsg,
            completed: false
          });
        }
      }
    });
  }

  // Mother
  if (client.profile.motherName && client.profile.motherBirthday && !client.profile.motherDeceased) {
    const bday = client.profile.motherBirthday;
    const remDate = getReminderDate(bday);
    if (remDate) {
      newReminders.push({
        id: `rem-bday-mother-${client.id}`,
        date: remDate,
        task: `Reach out to coordinate a premium gift package for mother ${client.profile.motherName}'s birthday (${bday})`,
        completed: false
      });
    }
  }

  // Father
  if (client.profile.fatherName && client.profile.fatherBirthday && !client.profile.fatherDeceased) {
    const bday = client.profile.fatherBirthday;
    const remDate = getReminderDate(bday);
    if (remDate) {
      newReminders.push({
        id: `rem-bday-father-${client.id}`,
        date: remDate,
        task: `Reach out to coordinate a premium gift package for father ${client.profile.fatherName}'s birthday (${bday})`,
        completed: false
      });
    }
  }

  // Partner/Wife
  if (client.profile.wifeName && client.profile.wifeBirthday && !client.profile.wifeDeceased) {
    const bday = client.profile.wifeBirthday;
    const remDate = getReminderDate(bday);
    if (remDate) {
      newReminders.push({
        id: `rem-bday-wife-${client.id}`,
        date: remDate,
        task: `Reach out to coordinate an exclusive Librarium romantic package for partner ${client.profile.wifeName}'s birthday (${bday})`,
        completed: false
      });
    }
  }

  // Partner/Husband
  if (client.profile.husbandName && client.profile.husbandBirthday && !client.profile.husbandDeceased) {
    const bday = client.profile.husbandBirthday;
    const remDate = getReminderDate(bday);
    if (remDate) {
      newReminders.push({
        id: `rem-bday-husband-${client.id}`,
        date: remDate,
        task: `Reach out to coordinate an exclusive Librarium romantic package for partner ${client.profile.husbandName}'s birthday (${bday})`,
        completed: false
      });
    }
  }

  // Children
  if (client.profile.children) {
    client.profile.children.forEach((child: any, idx: number) => {
      if (child.name && child.birthday && !child.deceased) {
        const remDate = getReminderDate(child.birthday);
        if (remDate) {
          newReminders.push({
            id: `rem-bday-child-${idx}-${client.id}`,
            date: remDate,
            task: `Reach out to coordinate a personalized birthday gift for child ${child.name}'s birthday (${child.birthday})`,
            completed: false
          });
        }
      }
    });
  }

  // Other Family Members
  if (client.profile.otherFamilyMembers) {
    client.profile.otherFamilyMembers.forEach((member: any, idx: number) => {
      if (member.name && member.birthday && !member.deceased) {
        const remDate = getReminderDate(member.birthday);
        if (remDate) {
          newReminders.push({
            id: `rem-bday-other-${idx}-${client.id}`,
            date: remDate,
            task: `Reach out to coordinate a personalized birthday gift for ${member.relationship.toLowerCase()} ${member.name}'s birthday (${member.birthday})`,
            completed: false
          });
        }
      }
    });
  }

  // Preserve completion state for reminders with the same ID if they already existed
  const syncedReminders = newReminders.map(newRem => {
    const existing = client.reminders.find((r: any) => r.id === newRem.id);
    if (existing) {
      return { ...newRem, completed: existing.completed };
    }
    return newRem;
  });

  return {
    ...client,
    reminders: [...manualReminders, ...syncedReminders]
  };
}
