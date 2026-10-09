import { Client, FollowUpReminder, ImportantDate, TimelineEvent } from "../types";

/**
 * Normalizes a header or key for robust matching against various Excel column header styles
 * E.g., "Mother's Birthday", "Mother Birthday", "mother_birthday", "motherBirthday" all match.
 */
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/['"’]/g, "").replace(/[\s_\-–—]+/g, "");
}

/**
 * Checks if a given raw Excel row object contained any column matching the target headers.
 */
function isColumnInRawRow(rawRow: any, possibleHeaders: string[]): boolean {
  if (!rawRow || typeof rawRow !== "object") return false;
  const rawKeysNormalized = Object.keys(rawRow).map(k => normalizeKey(k));
  return possibleHeaders.some(h => rawKeysNormalized.includes(normalizeKey(h)));
}

/**
 * Extracts a value from a raw Excel row object by possible header variations.
 */
function getRawRowValue(rawRow: any, possibleHeaders: string[]): any {
  if (!rawRow || typeof rawRow !== "object") return undefined;
  for (const key of Object.keys(rawRow)) {
    const normKey = normalizeKey(key);
    if (possibleHeaders.some(h => normalizeKey(h) === normKey)) {
      return rawRow[key];
    }
  }
  return undefined;
}

/**
 * CRITICAL-002 FIX: Safe Client Merge Logic
 *
 * Merges an imported client record into an existing client record without
 * destroying existing CRM profile data, custom fields, collections, or nested structures
 * that were omitted or absent from the Excel import.
 *
 * Core Principles:
 * 1. Existing client data is authoritative unless the Excel import explicitly provides a valid value for that field.
 * 2. Nested objects (`profile`, `contact`, `history`, `interests`) are merged independently so partial updates never wipe unmentioned fields.
 * 3. CRM collections (`commitments`, `promises`, `remembrances`, `tags`, `customFields`, `importantDates`, `timeline`, `reminders`) are preserved.
 * 4. Distinctly differentiates between absent/omitted Excel columns and intentional new values.
 * 5. Special handling for `id` (preserves existing ID) and `timeline`/`reminders` (merges without data loss).
 */
export function safeMergeClient(existing: Client, imported: Client): Client {
  const rawRow = (imported as any)._rawRow;
  const hasRawRow = Boolean(rawRow && typeof rawRow === "object");

  // ==========================================
  // 1. NESTED PROFILE MERGE
  // ==========================================
  const existingProfile = (existing.profile || {}) as any;
  const importedProfile = (imported.profile || {}) as any;
  const mergedProfile: any = { ...existingProfile };

  if (hasRawRow) {
    // Check which profile columns were actually in the Excel row
    if (isColumnInRawRow(rawRow, ["Mother Name", "motherName"])) {
      const val = importedProfile.motherName ?? getRawRowValue(rawRow, ["Mother Name", "motherName"]);
      if (val !== undefined && String(val).trim() !== "") mergedProfile.motherName = String(val).trim();
    }
    if (isColumnInRawRow(rawRow, ["Father Name", "fatherName"])) {
      const val = importedProfile.fatherName ?? getRawRowValue(rawRow, ["Father Name", "fatherName"]);
      if (val !== undefined && String(val).trim() !== "") mergedProfile.fatherName = String(val).trim();
    }
    if (isColumnInRawRow(rawRow, ["Wife Name", "wifeName"])) {
      const val = importedProfile.wifeName ?? getRawRowValue(rawRow, ["Wife Name", "wifeName"]);
      if (val !== undefined && String(val).trim() !== "") mergedProfile.wifeName = String(val).trim();
    }
    if (isColumnInRawRow(rawRow, ["Husband Name", "husbandName"])) {
      const val = importedProfile.husbandName ?? getRawRowValue(rawRow, ["Husband Name", "husbandName"]);
      if (val !== undefined && String(val).trim() !== "") mergedProfile.husbandName = String(val).trim();
    }
    if (isColumnInRawRow(rawRow, ["Pets", "pets"])) {
      const val = importedProfile.pets ?? getRawRowValue(rawRow, ["Pets", "pets"]);
      if (val !== undefined && String(val).trim() !== "") mergedProfile.pets = String(val).trim();
    }
    if (isColumnInRawRow(rawRow, ["Personal Notes", "personalNotes", "Notes"])) {
      const val = importedProfile.personalNotes ?? getRawRowValue(rawRow, ["Personal Notes", "personalNotes", "Notes"]);
      if (val !== undefined && String(val).trim() !== "") mergedProfile.personalNotes = String(val).trim();
    }
    if (isColumnInRawRow(rawRow, ["Private Notes", "privateNotes"])) {
      const val = importedProfile.privateNotes ?? getRawRowValue(rawRow, ["Private Notes", "privateNotes"]);
      if (val !== undefined && String(val).trim() !== "") {
        mergedProfile.privateNotes = String(val).trim();
        if (!mergedProfile.personalNotes) mergedProfile.personalNotes = String(val).trim();
      }
    }
    if (isColumnInRawRow(rawRow, ["Mother Birthday", "Mothers Birthday", "motherBirthday"])) {
      const val = importedProfile.motherBirthday ?? getRawRowValue(rawRow, ["Mother Birthday", "Mothers Birthday", "motherBirthday"]);
      if (val !== undefined && String(val).trim() !== "") mergedProfile.motherBirthday = String(val).trim();
    }
    if (isColumnInRawRow(rawRow, ["Father Birthday", "Fathers Birthday", "fatherBirthday"])) {
      const val = importedProfile.fatherBirthday ?? getRawRowValue(rawRow, ["Father Birthday", "Fathers Birthday", "fatherBirthday"]);
      if (val !== undefined && String(val).trim() !== "") mergedProfile.fatherBirthday = String(val).trim();
    }
    if (isColumnInRawRow(rawRow, ["Spouse Birthday", "spouseBirthday", "Wife Birthday", "Husband Birthday"])) {
      const val = importedProfile.spouseBirthday ?? importedProfile.wifeBirthday ?? importedProfile.husbandBirthday ?? getRawRowValue(rawRow, ["Spouse Birthday", "spouseBirthday", "Wife Birthday", "Husband Birthday"]);
      if (val !== undefined && String(val).trim() !== "") {
        const cleanVal = String(val).trim();
        mergedProfile.spouseBirthday = cleanVal;
        mergedProfile.wifeBirthday = cleanVal;
        mergedProfile.husbandBirthday = cleanVal;
      }
    }
    if (isColumnInRawRow(rawRow, ["Children Names & Birthdays", "Children", "children"])) {
      if (Array.isArray(importedProfile.children) && importedProfile.children.length > 0) {
        mergedProfile.children = importedProfile.children;
      }
    }
    if (isColumnInRawRow(rawRow, ["Children Birthdays", "childrenBirthdays"])) {
      const val = importedProfile.childrenBirthdays ?? getRawRowValue(rawRow, ["Children Birthdays", "childrenBirthdays"]);
      if (val !== undefined && val !== null) mergedProfile.childrenBirthdays = val;
    }
    if (isColumnInRawRow(rawRow, ["Mother Deceased", "motherDeceased"])) {
      const val = getRawRowValue(rawRow, ["Mother Deceased", "motherDeceased"]);
      if (val !== undefined) mergedProfile.motherDeceased = val === true || val === "Yes" || val === "true";
    }
    if (isColumnInRawRow(rawRow, ["Father Deceased", "fatherDeceased"])) {
      const val = getRawRowValue(rawRow, ["Father Deceased", "fatherDeceased"]);
      if (val !== undefined) mergedProfile.fatherDeceased = val === true || val === "Yes" || val === "true";
    }
    if (isColumnInRawRow(rawRow, ["Wife Deceased", "wifeDeceased"])) {
      const val = getRawRowValue(rawRow, ["Wife Deceased", "wifeDeceased"]);
      if (val !== undefined) mergedProfile.wifeDeceased = val === true || val === "Yes" || val === "true";
    }
    if (isColumnInRawRow(rawRow, ["Husband Deceased", "husbandDeceased"])) {
      const val = getRawRowValue(rawRow, ["Husband Deceased", "husbandDeceased"]);
      if (val !== undefined) mergedProfile.husbandDeceased = val === true || val === "Yes" || val === "true";
    }
    if (isColumnInRawRow(rawRow, ["Deceased Status", "deceasedStatus"])) {
      const val = getRawRowValue(rawRow, ["Deceased Status", "deceasedStatus"]);
      if (val !== undefined && val !== null) mergedProfile.deceasedStatus = val;
    }
  } else {
    // Direct JS/TS object import (or partial profile update)
    for (const [key, val] of Object.entries(importedProfile)) {
      if (val === undefined || val === null) continue;
      if (Array.isArray(val)) {
        if (val.length > 0) mergedProfile[key] = val;
        continue;
      }
      if (typeof val === "string") {
        if (val.trim() !== "") {
          mergedProfile[key] = val.trim();
        }
        continue;
      }
      mergedProfile[key] = val;
    }

    // Ensure family birthday field aliases remain synchronized
    if (importedProfile.spouseBirthday) {
      mergedProfile.spouseBirthday = importedProfile.spouseBirthday;
      if (!mergedProfile.wifeBirthday) mergedProfile.wifeBirthday = importedProfile.spouseBirthday;
      if (!mergedProfile.husbandBirthday) mergedProfile.husbandBirthday = importedProfile.spouseBirthday;
    }
    if (importedProfile.privateNotes) {
      mergedProfile.privateNotes = importedProfile.privateNotes;
      if (!mergedProfile.personalNotes) mergedProfile.personalNotes = importedProfile.privateNotes;
    }
  }

  // ==========================================
  // 2. NESTED CONTACT MERGE
  // ==========================================
  const existingContact = (existing.contact || {}) as any;
  const importedContact = (imported.contact || {}) as any;
  const mergedContact: any = { ...existingContact };

  if (hasRawRow) {
    if (isColumnInRawRow(rawRow, ["Phone Number", "Phone", "phoneNumber", "Contact Phone"]) && importedContact.phoneNumber) {
      mergedContact.phoneNumber = importedContact.phoneNumber;
    }
    if (isColumnInRawRow(rawRow, ["Email Address", "Email", "email", "Contact Email"]) && importedContact.email) {
      mergedContact.email = importedContact.email;
    }
    if (isColumnInRawRow(rawRow, ["Instagram Username", "Instagram", "instagramUsername"]) && importedContact.instagramUsername) {
      mergedContact.instagramUsername = importedContact.instagramUsername;
    }
    if (isColumnInRawRow(rawRow, ["City", "city"]) && importedContact.city) {
      mergedContact.city = importedContact.city;
    }
    if (isColumnInRawRow(rawRow, ["Parish (Jamaica)", "Parish", "parish"]) && importedContact.parish && importedContact.parish !== "N/A") {
      mergedContact.parish = importedContact.parish;
    }
    if (isColumnInRawRow(rawRow, ["Country", "country"]) && importedContact.country) {
      mergedContact.country = importedContact.country;
    }
    if (isColumnInRawRow(rawRow, ["Delivery Address", "deliveryAddress"]) && importedContact.deliveryAddress) {
      mergedContact.deliveryAddress = importedContact.deliveryAddress;
    }
    if (isColumnInRawRow(rawRow, ["Delivery Country", "deliveryCountry"]) && importedContact.deliveryCountry) {
      mergedContact.deliveryCountry = importedContact.deliveryCountry;
    }
  } else {
    for (const [key, val] of Object.entries(importedContact)) {
      if (typeof val === "string" && val.trim() !== "") {
        mergedContact[key] = val.trim();
      }
    }
  }

  // ==========================================
  // 3. NESTED HISTORY MERGE
  // ==========================================
  const existingHistory = (existing.history || {}) as any;
  const importedHistory = (imported.history || {}) as any;
  const mergedHistory: any = { ...existingHistory };

  if (hasRawRow) {
    if (isColumnInRawRow(rawRow, ["Total Orders", "Orders", "totalOrders"]) && importedHistory.totalOrders !== undefined) {
      mergedHistory.totalOrders = importedHistory.totalOrders;
    }
    if (isColumnInRawRow(rawRow, ["Lifetime Spend", "Lifetime Revenue (JMD)", "Lifetime Revenue", "lifetimeRevenue"]) && importedHistory.lifetimeRevenue !== undefined) {
      mergedHistory.lifetimeRevenue = importedHistory.lifetimeRevenue;
    }
    if (isColumnInRawRow(rawRow, ["AOV", "Average Order Value (JMD)", "Average Order Value", "averageOrderValue"]) && importedHistory.averageOrderValue !== undefined) {
      mergedHistory.averageOrderValue = importedHistory.averageOrderValue;
    }
    if (isColumnInRawRow(rawRow, ["First Order Date", "firstOrderDate"]) && importedHistory.firstOrderDate) {
      mergedHistory.firstOrderDate = importedHistory.firstOrderDate;
    }
    if (isColumnInRawRow(rawRow, ["Last Order Date", "lastOrderDate"]) && importedHistory.lastOrderDate) {
      mergedHistory.lastOrderDate = importedHistory.lastOrderDate;
    }
    if (isColumnInRawRow(rawRow, ["Products Purchased", "productsPurchased"]) && importedHistory.productsPurchased?.length > 0) {
      mergedHistory.productsPurchased = importedHistory.productsPurchased;
    }
    if (isColumnInRawRow(rawRow, ["Preferred Products / Categories", "preferredCategories"]) && importedHistory.preferredCategories?.length > 0) {
      mergedHistory.preferredCategories = importedHistory.preferredCategories;
    }
    if (isColumnInRawRow(rawRow, ["Client Preferences", "Customer Preferences", "clientPreferences"]) && importedHistory.clientPreferences?.length > 0) {
      mergedHistory.clientPreferences = importedHistory.clientPreferences;
    }
  } else {
    if (importedHistory.totalOrders > 0) mergedHistory.totalOrders = importedHistory.totalOrders;
    if (importedHistory.lifetimeRevenue > 0) mergedHistory.lifetimeRevenue = importedHistory.lifetimeRevenue;
    if (importedHistory.averageOrderValue > 0) mergedHistory.averageOrderValue = importedHistory.averageOrderValue;
    if (importedHistory.firstOrderDate) mergedHistory.firstOrderDate = importedHistory.firstOrderDate;
    if (importedHistory.lastOrderDate) mergedHistory.lastOrderDate = importedHistory.lastOrderDate;
    if (importedHistory.productsPurchased?.length > 0) mergedHistory.productsPurchased = importedHistory.productsPurchased;
    if (importedHistory.preferredCategories?.length > 0) mergedHistory.preferredCategories = importedHistory.preferredCategories;
    if (importedHistory.clientPreferences?.length > 0) mergedHistory.clientPreferences = importedHistory.clientPreferences;
  }

  // ==========================================
  // 4. NESTED INTERESTS MERGE
  // ==========================================
  const existingInterests = (existing.interests || {}) as any;
  const importedInterests = (imported.interests || {}) as any;
  const mergedInterests: any = { ...existingInterests };

  if (hasRawRow) {
    if (isColumnInRawRow(rawRow, ["Hobbies", "hobbies"]) && importedInterests.hobbies?.length > 0) {
      mergedInterests.hobbies = importedInterests.hobbies;
    }
    if (isColumnInRawRow(rawRow, ["Favorite Colors", "favoriteColors"]) && importedInterests.favoriteColors?.length > 0) {
      mergedInterests.favoriteColors = importedInterests.favoriteColors;
    }
    if (isColumnInRawRow(rawRow, ["Gift Preferences", "giftPreferences"]) && importedInterests.giftPreferences?.length > 0) {
      mergedInterests.giftPreferences = importedInterests.giftPreferences;
    }
    if (isColumnInRawRow(rawRow, ["Sport / League", "Favorite Team", "Team One", "Team Two", "National Team", "Favorite Player"])) {
      mergedInterests.sports = {
        ...(existingInterests.sports || {}),
        ...(importedInterests.sports || {})
      };
    }
  } else {
    if (importedInterests.hobbies?.length > 0) mergedInterests.hobbies = importedInterests.hobbies;
    if (importedInterests.favoriteColors?.length > 0) mergedInterests.favoriteColors = importedInterests.favoriteColors;
    if (importedInterests.giftPreferences?.length > 0) mergedInterests.giftPreferences = importedInterests.giftPreferences;
    if (importedInterests.sports) {
      mergedInterests.sports = {
        ...(existingInterests.sports || {}),
        ...(importedInterests.sports || {})
      };
    }
  }

  // ==========================================
  // 5. CRM ARRAYS & COLLECTIONS MERGE
  // ==========================================
  // Commitments & Promises
  const mergedCommitments = (imported.commitments && imported.commitments.length > 0)
    ? imported.commitments
    : (existing.commitments || []);

  const mergedPromises = (imported.promises && imported.promises.length > 0)
    ? imported.promises
    : (existing.promises || []);

  // Remembrances & Apparel
  const mergedRemembrances = (imported.remembrances && imported.remembrances.length > 0)
    ? imported.remembrances
    : (existing.remembrances || []);

  const mergedApparel = imported.apparelInfo
    ? { ...(existing.apparelInfo || {}), ...imported.apparelInfo }
    : (existing.apparelInfo || {});

  // Strategic Associations & Favourite Authors
  const mergedStrategic = (imported.strategicAssociations && imported.strategicAssociations.length > 0)
    ? imported.strategicAssociations
    : (existing.strategicAssociations || []);

  const mergedAuthors = (imported.favouriteAuthors && imported.favouriteAuthors.length > 0)
    ? imported.favouriteAuthors
    : (existing.favouriteAuthors || []);

  // Tags & Custom Fields
  const importedTags = (imported as any).tags;
  const existingTags = (existing as any).tags;
  const mergedTags = (Array.isArray(importedTags) && importedTags.length > 0)
    ? importedTags
    : (Array.isArray(existingTags) ? existingTags : []);

  const importedCustomFields = (imported as any).customFields;
  const existingCustomFields = (existing as any).customFields;
  const mergedCustomFields = (importedCustomFields && typeof importedCustomFields === "object")
    ? { ...((existingCustomFields && typeof existingCustomFields === "object") ? existingCustomFields : {}), ...importedCustomFields }
    : ((existingCustomFields && typeof existingCustomFields === "object") ? existingCustomFields : {});

  // Important Dates
  const existingDates: ImportantDate[] = Array.isArray(existing.importantDates) ? existing.importantDates : [];
  const importedDates: ImportantDate[] = Array.isArray(imported.importantDates) ? imported.importantDates : [];
  const mergedDates: ImportantDate[] = [...existingDates];
  if (importedDates.length > 0) {
    importedDates.forEach(impDate => {
      const idx = mergedDates.findIndex(d => d.label.toLowerCase() === impDate.label.toLowerCase());
      if (idx !== -1) {
        mergedDates[idx] = impDate;
      } else {
        mergedDates.push(impDate);
      }
    });
  }

  // Timeline & Reminders (Preserve existing logic & history)
  const existingTimeline: TimelineEvent[] = Array.isArray(existing.timeline) ? existing.timeline : [];
  const importedTimeline: TimelineEvent[] = Array.isArray(imported.timeline) ? imported.timeline : [];
  const mergedTimeline: TimelineEvent[] = [...importedTimeline, ...existingTimeline].slice(0, 15);

  const existingReminders: FollowUpReminder[] = Array.isArray(existing.reminders) ? existing.reminders : [];
  const importedReminders: FollowUpReminder[] = Array.isArray(imported.reminders) ? imported.reminders : [];
  const mergedReminders: FollowUpReminder[] = [...importedReminders];
  existingReminders.forEach(r => {
    if (!mergedReminders.some(mr => mr.id === r.id || (mr.task === r.task && mr.date === r.date))) {
      mergedReminders.push(r);
    }
  });

  // Tier History Audit Record & Tier Target Resolution
  const hasTierInImport = hasRawRow
    ? isColumnInRawRow(rawRow, ["Final Tier", "Client Tier", "Customer Tier", "Tier", "tier"])
    : Boolean(imported.tier && (imported.tier as string) !== "");

  const targetTier = (hasTierInImport && imported.tier) ? imported.tier : existing.tier;

  let mergedTierHistory = [...(existing.tierHistory || [])];
  if (hasTierInImport && imported.tier && imported.tier !== existing.tier) {
    mergedTierHistory.unshift({
      id: `th_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      tier: imported.tier,
      dateChanged: new Date().toISOString().split("T")[0],
      changedBy: "Excel Synchronization",
      reason: `Excel Import Tier Update: from ${existing.tier} to ${imported.tier}`
    });
  }

  // ==========================================
  // 6. ASSEMBLE MERGED CLIENT RECORD
  // ==========================================
  const mergedClient: Client = {
    // 1. Existing client is authoritative base
    ...existing,

    // 2. Safe top-level scalar updates (only when explicitly provided)
    firstName: (hasRawRow ? (isColumnInRawRow(rawRow, ["First Name", "Client Full Name", "firstName"]) ? imported.firstName : existing.firstName) : (imported.firstName && imported.firstName !== "New" ? imported.firstName : existing.firstName)),
    lastName: (hasRawRow ? (isColumnInRawRow(rawRow, ["Last Name", "Client Full Name", "lastName"]) ? imported.lastName : existing.lastName) : (imported.lastName && imported.lastName !== "Client" ? imported.lastName : existing.lastName)),
    gender: (hasRawRow ? (isColumnInRawRow(rawRow, ["Gender", "gender"]) ? imported.gender : existing.gender) : (imported.gender && imported.gender !== "N/A" ? imported.gender : existing.gender)),
    occupation: (hasRawRow ? (isColumnInRawRow(rawRow, ["Occupation", "occupation"]) ? imported.occupation : existing.occupation) : (imported.occupation && imported.occupation !== "Business Owner" ? imported.occupation : existing.occupation)),
    drive: (hasRawRow ? (isColumnInRawRow(rawRow, ["Drive (Yes/No)", "Drive", "drive"]) ? imported.drive : existing.drive) : (imported.drive !== undefined ? imported.drive : existing.drive)),
    tier: targetTier,
    tierSource: (hasTierInImport && imported.tier && imported.tier !== existing.tier)
      ? "Manual"
      : (imported.tierSource || existing.tierSource || "Calculated"),
    homeBrand: (hasRawRow ? (isColumnInRawRow(rawRow, ["Home Brand", "homeBrand"]) ? imported.homeBrand : existing.homeBrand) : (imported.homeBrand || existing.homeBrand)),
    businessRelationship: (hasRawRow ? (isColumnInRawRow(rawRow, ["Business Relationship", "Client Home", "Home Brand"]) ? imported.businessRelationship : existing.businessRelationship) : (imported.businessRelationship || existing.businessRelationship)),
    profileTheme: (hasRawRow ? (isColumnInRawRow(rawRow, ["Profile Theme", "profileTheme"]) ? imported.profileTheme : existing.profileTheme) : (imported.profileTheme || existing.profileTheme)),
    managementClassification: (hasRawRow ? (isColumnInRawRow(rawRow, ["Management Classification", "Management Status"]) ? imported.managementClassification : existing.managementClassification) : (imported.managementClassification && imported.managementClassification !== "Standard" ? imported.managementClassification : existing.managementClassification)),
    healthScore: (hasRawRow ? (isColumnInRawRow(rawRow, ["Health Score", "healthScore"]) ? imported.healthScore : existing.healthScore) : (typeof imported.healthScore === "number" && imported.healthScore !== 75 ? imported.healthScore : existing.healthScore)),
    relationshipStatus: (hasRawRow ? (isColumnInRawRow(rawRow, ["Relationship Status", "relationshipStatus"]) ? imported.relationshipStatus : existing.relationshipStatus) : (imported.relationshipStatus || existing.relationshipStatus)),
    accountStatus: (hasRawRow ? (isColumnInRawRow(rawRow, ["Account Status", "Status", "accountStatus"]) ? imported.accountStatus : existing.accountStatus) : (imported.accountStatus || existing.accountStatus)),
    deactivated: (hasRawRow ? (isColumnInRawRow(rawRow, ["Account Status", "Status", "deactivated"]) ? imported.deactivated : existing.deactivated) : (imported.deactivated !== undefined ? imported.deactivated : existing.deactivated)),
    preferredCommunication: (hasRawRow ? (isColumnInRawRow(rawRow, ["Preferred Communication Method", "preferredCommunication"]) ? imported.preferredCommunication : existing.preferredCommunication) : (imported.preferredCommunication || existing.preferredCommunication)),
    lastContactedDate: (imported.lastContactedDate && imported.lastContactedDate.trim() !== "")
      ? imported.lastContactedDate
      : existing.lastContactedDate,
    communicationStatus: (imported.communicationStatus && imported.communicationStatus !== "Unknown")
      ? imported.communicationStatus
      : existing.communicationStatus,

    // 3. ID is strictly preserved
    id: existing.id,

    // 4. Merged structures
    profile: mergedProfile,
    contact: mergedContact,
    history: mergedHistory,
    interests: mergedInterests,
    importantDates: mergedDates,
    timeline: mergedTimeline,
    reminders: mergedReminders,
    commitments: mergedCommitments,
    promises: mergedPromises,
    remembrances: mergedRemembrances,
    apparelInfo: mergedApparel,
    strategicAssociations: mergedStrategic,
    favouriteAuthors: mergedAuthors,
    tierHistory: mergedTierHistory,
    ...(mergedTags.length > 0 ? { tags: mergedTags } : ((existing as any).tags ? { tags: (existing as any).tags } : {})),
    ...(Object.keys(mergedCustomFields).length > 0 ? { customFields: mergedCustomFields } : ((existing as any).customFields ? { customFields: (existing as any).customFields } : {}))
  };

  // 5. Transfer any extra un-modeled properties from imported if not present on existing
  for (const key of Object.keys(imported)) {
    if (key === "_rawRow") continue;
    if (!(key in mergedClient) && (imported as any)[key] !== undefined && (imported as any)[key] !== null) {
      (mergedClient as any)[key] = (imported as any)[key];
    }
  }

  return mergedClient;
}
