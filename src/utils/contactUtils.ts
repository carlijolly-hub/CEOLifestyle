import { AspiringClient } from "../types";

/**
 * Ensures Instagram username starts with '@' if non-empty.
 */
export function formatInstagramUsername(username?: string): string {
  if (!username) return "";
  const trimmed = username.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

/**
 * Returns formatted contact details for display in cards, dashboard, and calendar.
 */
export function getAspiringContactDisplay(asp: AspiringClient): {
  preferredMethod: string;
  primaryLabel: string;
  primaryValue: string;
} {
  const preferred = asp.preferredContactMethod || (asp.sourceOfInquiry === "Instagram" ? "Instagram" : "Phone Call");
  
  const formattedIg = formatInstagramUsername(asp.instagramUsername);
  const phone = asp.phoneNumber ? asp.phoneNumber.trim() : "";
  const email = asp.email ? asp.email.trim() : "";

  if (preferred === "Instagram") {
    return {
      preferredMethod: "Instagram",
      primaryLabel: "Instagram",
      primaryValue: formattedIg || phone || email || asp.contactInfo || "No handle provided"
    };
  }

  if (preferred === "WhatsApp" || preferred === "Phone Call" || preferred === "SMS") {
    return {
      preferredMethod: preferred,
      primaryLabel: preferred === "WhatsApp" ? "WhatsApp Phone" : "Phone",
      primaryValue: phone || formattedIg || email || asp.contactInfo || "No phone provided"
    };
  }

  if (preferred === "Email") {
    return {
      preferredMethod: "Email",
      primaryLabel: "Email Address",
      primaryValue: email || phone || formattedIg || asp.contactInfo || "No email provided"
    };
  }

  return {
    preferredMethod: preferred || "Other",
    primaryLabel: "Contact Detail",
    primaryValue: formattedIg || phone || email || asp.contactInfo || "No contact provided"
  };
}
