// Helper to parse dates like "March 14" or "July 8" or "Wedding Date: August 22, 2018"
// and compute days until next occurrence from the current date (July 8, 2026)
import { SystemSettings, FollowUpReminder, OpportunityStatus } from "../types";

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
  const pDate = parseDateString(dateStr);
  if (pDate) {
    return { month: pDate.month, day: pDate.day };
  }
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

export function getDaysRemaining(eventMonth: number, eventDay: number, currentYear = new Date().getFullYear(), currentMonth = new Date().getMonth(), currentDay = new Date().getDate()): number {
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
  currentYear = new Date().getFullYear(),
  currentMonth = new Date().getMonth(), // July (0-indexed)
  currentDay = new Date().getDate()
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
            label: getRelationshipEventTitle(customer as any, d.label),
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

export function getRelationshipEventTitle(client: any, label: string): string {
  if (!client) return label;
  const lbl = label.trim().toLowerCase();
  const clientFirst = client.firstName || "";
  
  const getPossessive = (name: string): string => {
    if (!name) return "";
    if (name.endsWith("s")) return `${name}'`;
    return `${name}'s`;
  };

  const clientPossessive = getPossessive(clientFirst);

  const firstNameOnly = (nameStr: string) => {
    if (!nameStr || nameStr.toLowerCase() === "n/a") return "";
    return nameStr.split(/\s+/)[0].replace(/[^a-zA-Z]/g, "");
  };

  const getPetName = (petsStr: string) => {
    if (!petsStr || petsStr.toLowerCase() === "n/a") return "";
    return petsStr.split(/\s+/)[0].replace(/[^a-zA-Z]/g, "");
  };

  // 1. Client's own Birthday
  if (lbl === "birth" || lbl === "birthday" || lbl === "client birthday" || lbl === `${clientFirst.toLowerCase()} birthday`) {
    return `${clientPossessive} Birthday`;
  }

  // 2. Mother's Birthday
  if (lbl.includes("mother") || lbl.includes("mom")) {
    const motherFirst = firstNameOnly(client.profile?.motherName || "");
    return `${clientPossessive} Mother's Birthday${motherFirst ? ` (${motherFirst})` : ""}`;
  }

  // 3. Father's Birthday
  if (lbl.includes("father") || lbl.includes("dad")) {
    const fatherFirst = firstNameOnly(client.profile?.fatherName || "");
    return `${clientPossessive} Father's Birthday${fatherFirst ? ` (${fatherFirst})` : ""}`;
  }

  // 4. Partner / Spouse's Birthday (Wife/Husband)
  if (lbl.includes("wife") || lbl.includes("partner") || lbl.includes("husband") || lbl.includes("spouse")) {
    const wifeFirst = firstNameOnly(client.profile?.wifeName || "");
    const husbandFirst = firstNameOnly(client.profile?.husbandName || "");
    if (lbl.includes("wife") || (wifeFirst && !husbandFirst)) {
      return `${clientPossessive} Wife's Birthday${wifeFirst ? ` (${wifeFirst})` : ""}`;
    }
    if (lbl.includes("husband") || (husbandFirst && !wifeFirst)) {
      return `${clientPossessive} Husband's Birthday${husbandFirst ? ` (${husbandFirst})` : ""}`;
    }
  }

  // Check if Wife/Partner/Husband name is mentioned in label
  const wifeFirstOpt = firstNameOnly(client.profile?.wifeName || "");
  if (wifeFirstOpt && lbl.includes(wifeFirstOpt.toLowerCase())) {
    return `${clientPossessive} Wife's Birthday (${wifeFirstOpt})`;
  }
  const husbandFirstOpt = firstNameOnly(client.profile?.husbandName || "");
  if (husbandFirstOpt && lbl.includes(husbandFirstOpt.toLowerCase())) {
    return `${clientPossessive} Husband's Birthday (${husbandFirstOpt})`;
  }

  // 5. Wedding Anniversary
  if (lbl === "anniversary" || lbl === "wedding date" || lbl.includes("wedding") || (lbl.includes("anniversary") && !lbl.includes("business") && !lbl.includes("company"))) {
    return `${clientPossessive} Wedding Anniversary`;
  }

  // 6. Proposal Anniversary
  if (lbl === "proposal date" || lbl.includes("proposal")) {
    return `${clientPossessive} Proposal Anniversary`;
  }

  // 7. Business / Company Anniversary
  if (lbl.includes("business") || lbl.includes("company")) {
    return `${clientPossessive} Business Anniversary`;
  }

  // 8. Pet Birthday
  if (lbl.includes("pet") || lbl.includes("dog") || lbl.includes("cat")) {
    const petFirst = getPetName(client.profile?.pets || "");
    return `${clientPossessive} Pet's Birthday${petFirst ? ` (${petFirst})` : ""}`;
  }

  // Check if pet name is mentioned in label
  const petFirstOpt = getPetName(client.profile?.pets || "");
  if (petFirstOpt && lbl.includes(petFirstOpt.toLowerCase())) {
    return `${clientPossessive} Pet's Birthday (${petFirstOpt})`;
  }

  // 9. Children Birthdays
  if (client.profile?.children && Array.isArray(client.profile.children)) {
    const SON_NAMES = ["joshua", "liam", "noah", "elijah", "carter", "mark"];
    const DAUGHTER_NAMES = ["mia", "emily", "ava", "chloe", "madison", "lucy", "emma"];

    for (const child of client.profile.children) {
      if (child.name) {
        const childFirst = firstNameOnly(child.name);
        if (lbl.includes(childFirst.toLowerCase())) {
          const lowerName = childFirst.toLowerCase();
          const rel = SON_NAMES.includes(lowerName) ? "Son's Birthday" : DAUGHTER_NAMES.includes(lowerName) ? "Daughter's Birthday" : "Child's Birthday";
          return `${clientPossessive} ${rel} (${childFirst})`;
        }
      }
    }
  }

  // 10. Other Family Members
  if (client.profile?.otherFamilyMembers && Array.isArray(client.profile.otherFamilyMembers)) {
    for (const member of client.profile.otherFamilyMembers) {
      if (member.name) {
        const memberFirst = firstNameOnly(member.name);
        if (lbl.includes(memberFirst.toLowerCase())) {
          return `${clientPossessive} ${member.relationship || "Family Member"}'s Birthday (${memberFirst})`;
        }
      }
    }
  }

  // Fallback: If label already starts with client name (possessive or normal), make sure it has possessive or return as is cleanly
  if (lbl.startsWith(clientFirst.toLowerCase())) {
    const remainder = label.substring(clientFirst.length).trim();
    const cleanedRemainder = remainder.replace(/^[\s—\-\|]+/, "").trim();
    if (cleanedRemainder) {
      return `${clientPossessive} ${cleanedRemainder}`;
    }
    return label;
  }

  // Default fallback format
  return `${clientPossessive} ${label}`;
}

// 1. Robust Date Parsing
export function parseDateString(dateStr: string): { month: number; day: number; year?: number } | null {
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

export interface ClientMilestone {
  label: string;          // Formatted title: "Daniel Williams — Client Birthday" or "Daniel Williams — Mother's Birthday (Sarah)"
  originalLabel: string;  // E.g. "Birthday", "Mother's Birthday"
  date: string;           // E.g. "March 14" or "YYYY-MM-DD"
  type: "birthday" | "anniversary" | "custom_milestone";
  relationship: string;   // "Client" | "Mother" | "Father" | "Wife" | "Husband" | "Child" | "Other" | "Spouse" | etc.
  personName: string;     // E.g. "Sarah" or "Daniel"
}

export function getClientMilestones(client: any): ClientMilestone[] {
  if (!client) return [];

  const rawList: { originalLabel: string; date: string; type: "birthday" | "anniversary" | "custom_milestone"; relationship: string; personName: string }[] = [];

  // 1. Client's own important dates (from client.importantDates)
  if (client.importantDates) {
    client.importantDates.forEach((dateObj: any) => {
      if (!dateObj.label || !dateObj.date) return;
      const lblLower = dateObj.label.toLowerCase();
      let type: "birthday" | "anniversary" | "custom_milestone" = "custom_milestone";
      let relationship = "Client";
      let personName = `${client.firstName} ${client.lastName}`;

      if (lblLower.includes("birth")) {
        type = "birthday";
      } else if (lblLower.includes("anniv") || lblLower.includes("wed") || lblLower.includes("proposal")) {
        type = "anniversary";
        relationship = "Spouse";
        personName = client.profile?.wifeName || client.profile?.husbandName || "Partner";
      }

      rawList.push({
        originalLabel: dateObj.label,
        date: dateObj.date,
        type,
        relationship,
        personName
      });
    });
  }

  // 2. Family Members
  const profile = client.profile || {};

  // Mother
  if (profile.motherName && profile.motherBirthday && !profile.motherDeceased) {
    rawList.push({
      originalLabel: "Mother's Birthday",
      date: profile.motherBirthday,
      type: "birthday",
      relationship: "Mother",
      personName: profile.motherName
    });
  }

  // Father
  if (profile.fatherName && profile.fatherBirthday && !profile.fatherDeceased) {
    rawList.push({
      originalLabel: "Father's Birthday",
      date: profile.fatherBirthday,
      type: "birthday",
      relationship: "Father",
      personName: profile.fatherName
    });
  }

  // Wife
  if (profile.wifeName && profile.wifeBirthday && !profile.wifeDeceased) {
    rawList.push({
      originalLabel: "Wife's Birthday",
      date: profile.wifeBirthday,
      type: "birthday",
      relationship: "Wife",
      personName: profile.wifeName
    });
  }

  // Husband
  if (profile.husbandName && profile.husbandBirthday && !profile.husbandDeceased) {
    rawList.push({
      originalLabel: "Husband's Birthday",
      date: profile.husbandBirthday,
      type: "birthday",
      relationship: "Husband",
      personName: profile.husbandName
    });
  }

  // Children
  if (profile.children && Array.isArray(profile.children)) {
    profile.children.forEach((child: any) => {
      if (child.name && child.birthday && !child.deceased) {
        rawList.push({
          originalLabel: "Child's Birthday",
          date: child.birthday,
          type: "birthday",
          relationship: "Child",
          personName: child.name
        });
      }
    });
  }

  // Other Family Members
  if (profile.otherFamilyMembers && Array.isArray(profile.otherFamilyMembers)) {
    profile.otherFamilyMembers.forEach((member: any) => {
      if (member.name && member.birthday && !member.deceased) {
        rawList.push({
          originalLabel: `${member.relationship || "Family Member"}'s Birthday`,
          date: member.birthday,
          type: "birthday",
          relationship: member.relationship || "Other Family",
          personName: member.name
        });
      }
    });
  }

  // Deduplicate raw list by comparing lowercase relationship + name + type, or same date & similar labels
  const uniqueList: typeof rawList = [];
  rawList.forEach(item => {
    const alreadyExists = uniqueList.some(existing => {
      const sameDate = existing.date === item.date;
      const exLabel = (existing.originalLabel || "").toLowerCase();
      const itLabel = (item.originalLabel || "").toLowerCase();
      const sameLabel = exLabel === itLabel;
      const overlapLabel = (exLabel && itLabel) ? (exLabel.includes(itLabel) || itLabel.includes(exLabel)) : false;
      const samePerson = (existing.personName || "").toLowerCase() === (item.personName || "").toLowerCase();
      
      // If same date and same person, or same date and overlapping labels
      return (sameDate && samePerson) || (sameDate && overlapLabel) || (sameLabel && samePerson);
    });

    if (!alreadyExists) {
      uniqueList.push(item);
    }
  });

  // Map to final ClientMilestone format with formatted labels
  return uniqueList.map(item => {
    return {
      label: getRelationshipEventTitle(client, item.originalLabel),
      originalLabel: item.originalLabel,
      date: item.date,
      type: item.type,
      relationship: item.relationship,
      personName: item.personName
    };
  });
}

export function syncFamilyBirthdayReminders(client: any, settings?: SystemSettings): any {
  // Migrate any old homeBrand values to "CEO Lifestyle"
  if (client.homeBrand === "Both" || client.homeBrand === "Ceo Lifestyle" || client.homeBrand === "both" || !client.homeBrand) {
    client.homeBrand = "CEO Lifestyle";
  }

  const existingReminders: FollowUpReminder[] = Array.isArray(client.reminders) ? client.reminders : [];

  // 1. Separate manual reminders (not matching our auto milestone prefixes)
  const isMilestoneReminder = (r: FollowUpReminder) => 
    r.id.startsWith("rem-madv-") ||
    r.id.startsWith("rem-mact-") ||
    r.id.startsWith("rem-milestone-") ||
    r.id.startsWith("rem-bday-") ||
    r.id.startsWith("rem-own-date-");

  const manualReminders = existingReminders.filter(r => !isMilestoneReminder(r));
  const previousMilestoneReminders = existingReminders.filter(r => isMilestoneReminder(r));

  // Map of existing milestone reminders for fast lookup
  const existingMap = new Map<string, FollowUpReminder>();
  previousMilestoneReminders.forEach(r => {
    existingMap.set(r.id, r);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();

  const generatedReminders: FollowUpReminder[] = [];
  const milestones = getClientMilestones(client);

  milestones.forEach((m) => {
    const parsed = parseMonthDay(m.date);
    if (!parsed) return;

    // Dynamic reminder windows based on settings
    let daysPrior = 14;
    if (settings) {
      if (m.type === "birthday") {
        daysPrior = settings.birthdayReminderDays || 14;
      } else if (m.type === "anniversary") {
        const isProposal = (m.originalLabel || "").toLowerCase().includes("proposal");
        daysPrior = isProposal ? (settings.proposalAnniversaryReminderDays || 14) : (settings.anniversaryReminderDays || 14);
      } else {
        daysPrior = settings.customMilestoneReminderDays || 14;
      }
    }

    // Determine target occurrence year(s)
    // HIGH-005: If the event has already passed during currentYear, calculate the NEXT occurrence (currentYear + 1).
    // If today is on or before the occurrence date, the target occurrence is currentYear.
    const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
    const thisYearDay = (parsed.month === 1 && parsed.day === 29 && !isLeapYear(currentYear)) ? 28 : parsed.day;
    const eventThisYear = new Date(currentYear, parsed.month, thisYearDay);
    eventThisYear.setHours(0, 0, 0, 0);

    const targetYear = eventThisYear.getTime() < today.getTime() ? currentYear + 1 : currentYear;
    const yearsToGenerate: number[] = [targetYear];

    const relKey = (m.relationship || "Client").toLowerCase().replace(/[^a-z0-9]/g, "");
    const personKey = (m.personName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const typeKey = (m.type || "milestone").toLowerCase().replace(/[^a-z0-9]/g, "");

    yearsToGenerate.forEach(targetYear => {
      const occurrenceDay = (parsed.month === 1 && parsed.day === 29 && !isLeapYear(targetYear)) ? 28 : parsed.day;
      const occurrenceDateStr = `${targetYear}-${String(parsed.month + 1).padStart(2, "0")}-${String(occurrenceDay).padStart(2, "0")}`;

      const advDateObj = new Date(targetYear, parsed.month, occurrenceDay);
      advDateObj.setDate(advDateObj.getDate() - daysPrior);
      advDateObj.setHours(0, 0, 0, 0);
      const advDateStr = `${advDateObj.getFullYear()}-${String(advDateObj.getMonth() + 1).padStart(2, "0")}-${String(advDateObj.getDate()).padStart(2, "0")}`;

      // 1. Advance Opportunity Task
      const advId = `rem-madv-${client.id}-${typeKey}-${relKey}${personKey ? `-${personKey}` : ""}-${occurrenceDateStr}`;
      
      let advTaskText = "";
      if (m.type === "birthday") {
        if (m.relationship === "Client") {
          advTaskText = `🎁 Birthday Opportunity: ${client.firstName || ""} ${client.lastName || ""} has a birthday in ${daysPrior} days (${m.date}). Plan outreach or custom gift.`;
        } else {
          advTaskText = `🎁 Birthday Opportunity: ${(m.relationship || "Family").toLowerCase()} ${m.personName || ""}'s birthday is in ${daysPrior} days (${m.date}). Coordinate outreach.`;
        }
      } else if (m.type === "anniversary") {
        advTaskText = `💍 Anniversary Opportunity: ${client.firstName || ""} ${client.lastName || ""}'s ${m.originalLabel || "Anniversary"} is in ${daysPrior} days (${m.date}). Plan exclusive surprise.`;
      } else {
        advTaskText = `✨ Milestone Opportunity: ${client.firstName || ""} ${client.lastName || ""}'s ${m.originalLabel || "Milestone"} is in ${daysPrior} days (${m.date}).`;
      }

      // Check if existing reminder exists
      const existingAdv = existingMap.get(advId) || previousMilestoneReminders.find(r => 
        (r.milestone?.triggerType === "advance_opportunity" && r.milestone?.occurrenceYear === targetYear && r.milestone?.eventType === m.type && r.milestone?.relationship === m.relationship) ||
        (r.date === advDateStr && r.task === advTaskText)
      );

      const actionDate = existingAdv?.nextActionDate || advDateStr;
      const isPastUnresolved = !existingAdv?.completed && 
        existingAdv?.opportunityStatus !== "Resolved" && 
        existingAdv?.opportunityStatus !== "Converted" && 
        existingAdv?.opportunityStatus !== "Closed" && 
        getDaysSince(actionDate) > 0;

      const currentOppStatus: OpportunityStatus = existingAdv?.opportunityStatus 
        ? (isPastUnresolved ? "Missed Opportunity" : existingAdv.opportunityStatus)
        : (existingAdv?.completed ? "Resolved" : (isPastUnresolved ? "Missed Opportunity" : "Open"));

      generatedReminders.push({
        id: advId,
        date: advDateStr,
        task: existingAdv?.task || advTaskText,
        completed: existingAdv ? existingAdv.completed : false,
        completedAt: existingAdv?.completedAt,
        followUpCount: existingAdv?.followUpCount || 0,
        followUpHistory: existingAdv?.followUpHistory || [],
        opportunityStatus: currentOppStatus,
        nextActionDate: actionDate,
        milestone: {
          clientName: `${client.firstName} ${client.lastName}`,
          personName: m.personName || client.firstName,
          relationship: m.relationship || "Client",
          eventType: m.type,
          eventDate: occurrenceDateStr,
          recommendedActionDate: advDateStr,
          triggerType: "advance_opportunity",
          occurrenceYear: targetYear
        }
      });

      // 2. Actual Day Task
      const actId = `rem-mact-${client.id}-${typeKey}-${relKey}${personKey ? `-${personKey}` : ""}-${occurrenceDateStr}`;
      
      let actTaskText = "";
      if (m.type === "birthday") {
        if (m.relationship === "Client") {
          actTaskText = `🎂 Birthday Today: Wish ${client.firstName || ""} ${client.lastName || ""} a happy birthday!`;
        } else {
          actTaskText = `🎂 Birthday Today: Wish ${(m.relationship || "Family").toLowerCase()} ${m.personName || ""} a happy birthday (${m.originalLabel || "Birthday"})!`;
        }
      } else if (m.type === "anniversary") {
        actTaskText = `💍 Anniversary Today: Wish ${client.firstName || ""} ${client.lastName || ""} a happy ${m.originalLabel || "Anniversary"}!`;
      } else {
        actTaskText = `✨ Milestone Today: Acknowledge ${client.firstName || ""} ${client.lastName || ""}'s ${m.originalLabel || "Milestone"}!`;
      }

      const existingAct = existingMap.get(actId) || previousMilestoneReminders.find(r => 
        (r.milestone?.triggerType === "actual_day" && r.milestone?.occurrenceYear === targetYear && r.milestone?.eventType === m.type && r.milestone?.relationship === m.relationship) ||
        (r.date === occurrenceDateStr && r.task === actTaskText)
      );

      generatedReminders.push({
        id: actId,
        date: occurrenceDateStr,
        task: existingAct?.task || actTaskText,
        completed: existingAct ? existingAct.completed : false,
        completedAt: existingAct?.completedAt,
        milestone: {
          clientName: `${client.firstName} ${client.lastName}`,
          personName: m.personName || client.firstName,
          relationship: m.relationship || "Client",
          eventType: m.type,
          eventDate: occurrenceDateStr,
          recommendedActionDate: occurrenceDateStr,
          triggerType: "actual_day",
          occurrenceYear: targetYear
        }
      });
    });
  });

  // Also preserve any historical completed milestone reminders that were not re-generated (e.g. from previous years)
  const genIds = new Set(generatedReminders.map(r => r.id));
  const historicalCompleted = previousMilestoneReminders.filter(r => r.completed && !genIds.has(r.id));

  // Combine and deduplicate
  const allRemindersMap = new Map<string, FollowUpReminder>();
  [...manualReminders, ...historicalCompleted, ...generatedReminders].forEach(r => {
    if (!allRemindersMap.has(r.id)) {
      allRemindersMap.set(r.id, r);
    }
  });

  return {
    ...client,
    reminders: Array.from(allRemindersMap.values())
  };
}

export function getDaysSince(dateStr: string): number {
  if (!dateStr) return 9999;
  const s = dateStr.trim();
  let dateObj: Date | null = null;

  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    dateObj = new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
  } else {
    const parsed = Date.parse(s);
    if (!isNaN(parsed)) {
      dateObj = new Date(parsed);
    }
  }

  if (!dateObj) return 9999;

  const today = new Date();
  const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const utcTarget = Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  
  const diffDays = Math.round((utcToday - utcTarget) / (1000 * 60 * 60 * 24));
  return diffDays;
}

export type FollowUpActionStatus = "Upcoming" | "Due" | "Missed" | "Completed" | "Resolved";

export function getFollowUpActionState(
  actionDateStr: string,
  isCompleted: boolean,
  opportunityStatus?: string
): { status: FollowUpActionStatus; label: string; daysDiff: number } {
  if (isCompleted || opportunityStatus === "Resolved" || opportunityStatus === "Converted" || opportunityStatus === "Closed") {
    return { status: "Completed", label: "Completed", daysDiff: 0 };
  }

  const daysSince = getDaysSince(actionDateStr);
  // daysSince > 0 means the date was in the past (e.g. yesterday = 1 day since)
  // daysSince === 0 means today
  // daysSince < 0 means future (e.g. -5 means 5 days in future)

  if (daysSince === 0) {
    return { status: "Due", label: "Due Today", daysDiff: 0 };
  } else if (daysSince > 0) {
    return { status: "Missed", label: "Missed", daysDiff: daysSince };
  } else {
    const daysUntil = Math.abs(daysSince);
    return { status: "Upcoming", label: `Upcoming (in ${daysUntil}d)`, daysDiff: daysSince };
  }
}
