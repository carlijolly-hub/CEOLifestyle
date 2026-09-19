import { YesNo } from "../types";

/**
 * Returns the current date/time adjusted to Jamaica Time (UTC-5 year-round, no DST).
 */
export function getJamaicaDate(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const jamaicaOffsetMs = -5 * 3600000;
  return new Date(utc + jamaicaOffsetMs);
}

/**
 * Checks if a client/order has the Adventist designation ("Yes" or true).
 */
export function isAdventistClient(adventistVal?: YesNo | boolean | string): boolean {
  if (!adventistVal) return false;
  if (typeof adventistVal === "boolean") return adventistVal;
  return String(adventistVal).trim().toLowerCase() === "yes";
}

/**
 * Checks whether current Jamaica time falls within the Adventist Sabbath rest period:
 * Friday 5:00 PM (17:00) through Saturday 11:59:59 PM (23:59:59).
 */
export function isRestrictedWindow(): boolean {
  const jamDate = getJamaicaDate();
  const day = jamDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  const hours = jamDate.getHours();

  // Friday starting at 5:00 PM (17)
  if (day === 5 && hours >= 17) {
    return true;
  }
  // All day Saturday
  if (day === 6) {
    return true;
  }

  return false;
}

/**
 * Returns true if communication is RESTRICTED for this specific client right now.
 */
export function isAdventistCommunicationRestricted(adventistVal?: YesNo | boolean | string): boolean {
  if (!isAdventistClient(adventistVal)) return false;
  return isRestrictedWindow();
}

export const ADVENTIST_WARNING_TEXT = "🔴 DO NOT MESSAGE FRIDAY 5 PM OR SATURDAY";

/**
 * Formatted helper message explaining the restriction.
 */
export function getAdventistRestrictionMessage(clientName?: string): string {
  const nameStr = clientName ? `"${clientName}"` : "This client";
  return `${nameStr} is marked Adventist ✝. ${ADVENTIST_WARNING_TEXT}`;
}
