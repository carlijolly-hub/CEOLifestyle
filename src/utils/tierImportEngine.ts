import { 
  Client, 
  ClientTier, 
  BusinessRelationship, 
  ProfileTheme, 
  ManagementClassification, 
  ClientTierRecord 
} from "../types";

export interface ParsedTierRow {
  clId: string;
  fullName: string;
  clientHome: string;
  firstOrderDate: string;
  lastOrderDate: string;
  totalOrders: number;
  lifetimeSpend: number;
  aov: number;
  relationshipStatus: "Active" | "Warm" | "Dormant";
  healthScore: number;
  finalTier: ClientTier;
  businessRelationship: BusinessRelationship;
  homeBrand: "CEO Lifestyle" | "Librarium Luxe";
  profileTheme: ProfileTheme;
  rawRow: any;
}

export type DuplicateAction = "merge" | "create_new" | "skip";

export interface TierImportValidationItem {
  parsedRow: ParsedTierRow;
  status: "exact_id_match" | "possible_duplicate_name" | "new_client";
  existingClient?: Client; // Client matched by ID or Name
  selectedAction: DuplicateAction;
  warningMessage?: string;
}

export interface TierImportValidationSummary {
  totalRecords: number;
  newProfilesCount: number;
  updatedProfilesCount: number;
  exactIdMatchesCount: number;
  possibleDuplicateNamesCount: number;
  items: TierImportValidationItem[];
}

export interface TierImportExecutionResult {
  updatedClients: Client[];
  updatedRegister: ClientTierRecord[];
  reportStats: {
    totalRecords: number;
    createdCount: number;
    updatedCount: number;
    skippedCount: number;
    errorsCount: number;
    logDetails: string[];
    timestamp: string;
  };
}

/**
  Parse currency or numerical string into clean float number
 */
export function parseCurrencyValue(val: any): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]+/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse integer safely
 */
export function parseIntegerValue(val: any): number {
  if (typeof val === "number") return Math.round(val);
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9-]+/g, "");
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Split full name into first & last name
 */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: "VIP", lastName: "Client" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "Client" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ")
  };
}

/**
 * Normalize Client Home value to BusinessRelationship, HomeBrand, and ProfileTheme
 */
export function normalizeClientHome(clientHomeRaw: any): {
  businessRelationship: BusinessRelationship;
  homeBrand: "CEO Lifestyle" | "Librarium Luxe";
  profileTheme: ProfileTheme;
} {
  const str = String(clientHomeRaw || "CEO Lifestyle").trim();
  const lower = str.toLowerCase();

  if (lower.includes("|") || lower.includes("+") || lower.includes("both") || lower.includes("dual")) {
    return {
      businessRelationship: "CEO Lifestyle + Librarium Luxe",
      homeBrand: "CEO Lifestyle",
      profileTheme: "Dual Burgundy Blend"
    };
  }
  if (lower.includes("librarium") || lower.includes("luxe")) {
    return {
      businessRelationship: "Librarium Luxe",
      homeBrand: "Librarium Luxe",
      profileTheme: "Librarium Crimson"
    };
  }
  return {
    businessRelationship: "CEO Lifestyle",
    homeBrand: "CEO Lifestyle",
    profileTheme: "CEO Blue"
  };
}

/**
 * Normalize Tier String to official ClientTier enum
 */
export function normalizeClientTier(tierRaw: any): ClientTier {
  const str = String(tierRaw || "Silver").trim().toLowerCase();
  if (str.includes("founders")) return "Founders Family";
  if (str.includes("delinquent")) return "Delinquent";
  if (str.includes("problematic")) return "Problematic";
  if (str.includes("platinum") || str === "vip") return "Platinum";
  if (str.includes("gold")) return "Gold";
  return "Silver";
}

/**
 * Parse raw rows from Excel or Paste into standardized ParsedTierRow objects
 */
export function parseTierImportRows(rows: any[]): ParsedTierRow[] {
  return rows.map((row, index) => {
    const clId = String(
      row["CL ID"] || 
      row["CEO ID"] || 
      row["Client ID"] || 
      row["ID"] || 
      row["id"] || 
      row["ceoId"] || 
      ""
    ).trim();

    const fullName = String(
      row["Client Full Name"] || 
      row["Customer Full Name"] || 
      row["Client Name"] || 
      row["Name"] || 
      row["customerFullName"] || 
      ""
    ).trim();

    const clientHomeStr = String(
      row["Client Home"] || 
      row["Business Relationship"] || 
      row["Home Brand"] || 
      row["businessRelationship"] || 
      "CEO Lifestyle"
    ).trim();

    const { businessRelationship, homeBrand, profileTheme } = normalizeClientHome(clientHomeStr);

    const firstOrderDate = String(
      row["First Order Date"] || row["First Order"] || row["firstOrderDate"] || ""
    ).trim();

    const lastOrderDate = String(
      row["Last Order Date"] || row["Last Order"] || row["lastOrderDate"] || ""
    ).trim();

    const totalOrders = parseIntegerValue(
      row["Total Orders"] || row["Orders"] || row["totalOrders"]
    );

    const lifetimeSpend = parseCurrencyValue(
      row["Lifetime Spend"] || 
      row["Lifetime Revenue"] || 
      row["Lifetime Revenue (JMD)"] || 
      row["Total Spend"] || 
      row["Spend"] || 
      row["lifetimeRevenue"]
    );

    let aov = parseCurrencyValue(
      row["AOV"] || 
      row["Average Order Value"] || 
      row["Average Order Value (JMD)"] || 
      row["averageOrderValue"]
    );

    if (aov === 0 && totalOrders > 0 && lifetimeSpend > 0) {
      aov = Math.round(lifetimeSpend / totalOrders);
    }

    const relStatusStr = String(
      row["Relationship Status"] || row["Communication Status"] || row["relationshipStatus"] || "Warm"
    ).trim().toLowerCase();

    let relationshipStatus: "Active" | "Warm" | "Dormant" = "Warm";
    if (relStatusStr.includes("active")) relationshipStatus = "Active";
    else if (relStatusStr.includes("dormant")) relationshipStatus = "Dormant";

    const healthScoreRaw = parseIntegerValue(row["Health Score"] || row["Health"] || row["healthScore"]);
    const healthScore = healthScoreRaw > 0 ? Math.min(100, healthScoreRaw) : 75;

    const finalTier = normalizeClientTier(
      row["Final Tier"] || row["Client Tier"] || row["Manual Tier"] || row["Tier"] || row["manualTier"]
    );

    return {
      clId: clId || `CL24-AUTO-${1000 + index}`,
      fullName: fullName || "VIP Client",
      clientHome: clientHomeStr,
      firstOrderDate,
      lastOrderDate,
      totalOrders,
      lifetimeSpend,
      aov,
      relationshipStatus,
      healthScore,
      finalTier,
      businessRelationship,
      homeBrand,
      profileTheme,
      rawRow: row
    };
  }).filter(r => r.clId || r.fullName);
}

/**
 * Validate imported rows against existing client database
 */
export function validateTierImport(
  parsedRows: ParsedTierRow[],
  existingClients: Client[]
): TierImportValidationSummary {
  const items: TierImportValidationItem[] = [];
  let exactIdMatchesCount = 0;
  let possibleDuplicateNamesCount = 0;
  let newProfilesCount = 0;
  let updatedProfilesCount = 0;

  parsedRows.forEach(row => {
    // 1. Check Exact ID match
    const existingById = existingClients.find(
      c => c.id.trim().toLowerCase() === row.clId.trim().toLowerCase()
    );

    if (existingById) {
      exactIdMatchesCount++;
      updatedProfilesCount++;
      items.push({
        parsedRow: row,
        status: "exact_id_match",
        existingClient: existingById,
        selectedAction: "merge"
      });
      return;
    }

    // 2. Check Name match with different CL ID
    const existingByName = existingClients.find(
      c => `${c.firstName} ${c.lastName}`.trim().toLowerCase() === row.fullName.trim().toLowerCase()
    );

    if (existingByName) {
      possibleDuplicateNamesCount++;
      items.push({
        parsedRow: row,
        status: "possible_duplicate_name",
        existingClient: existingByName,
        selectedAction: "merge", // Default action for name match
        warningMessage: `Possible Duplicate Name: "${row.fullName}". Existing ID: ${existingByName.id}, Imported ID: ${row.clId}`
      });
      return;
    }

    // 3. New Client Profile
    newProfilesCount++;
    items.push({
      parsedRow: row,
      status: "new_client",
      selectedAction: "create_new"
    });
  });

  return {
    totalRecords: parsedRows.length,
    newProfilesCount,
    updatedProfilesCount,
    exactIdMatchesCount,
    possibleDuplicateNamesCount,
    items
  };
}

/**
 * Execute Tier Import with user choices, updating clients & client tier register
 */
export function executeTierImport(
  summary: TierImportValidationSummary,
  existingClients: Client[],
  existingRegister: ClientTierRecord[]
): TierImportExecutionResult {
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorsCount = 0;
  const logDetails: string[] = [];

  let clientMap = new Map<string, Client>();
  existingClients.forEach(c => clientMap.set(c.id.toLowerCase(), { ...c }));

  let registerMap = new Map<string, ClientTierRecord>();
  existingRegister.forEach(r => {
    if (r.ceoId) registerMap.set(r.ceoId.toLowerCase(), { ...r });
  });

  summary.items.forEach(item => {
    const row = item.parsedRow;
    const action = item.selectedAction;

    if (action === "skip") {
      skippedCount++;
      logDetails.push(`[SKIPPED] ${row.clId} - ${row.fullName} (User opted to skip import)`);
      return;
    }

    if (action === "merge" && item.existingClient) {
      // MERGE / UPDATE EXISTING CLIENT PROFILE
      const existing = clientMap.get(item.existingClient.id.toLowerCase());
      if (existing) {
        updatedCount++;

        const updatedHistory = {
          ...existing.history,
          firstOrderDate: row.firstOrderDate || existing.history?.firstOrderDate || "",
          lastOrderDate: row.lastOrderDate || existing.history?.lastOrderDate || "",
          totalOrders: row.totalOrders > 0 ? row.totalOrders : (existing.history?.totalOrders || 0),
          lifetimeRevenue: row.lifetimeSpend > 0 ? row.lifetimeSpend : (existing.history?.lifetimeRevenue || 0),
          averageOrderValue: row.aov > 0 ? row.aov : (existing.history?.averageOrderValue || 0)
        };

        const mgmtClassification: ManagementClassification = 
          row.finalTier === "Founders Family" || row.finalTier === "Platinum" ? "VIP Priority" :
          row.finalTier === "Problematic" ? "Problematic" :
          row.finalTier === "Delinquent" ? "Delinquent" :
          (existing.managementClassification || "Standard");

        const timelineEntry = {
          id: `TL_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: "Note" as const,
          date: new Date().toISOString().split("T")[0],
          content: `Profile updated via Smart Tier Import. Tier set to ${row.finalTier}. Lifetime Spend: $${(updatedHistory.lifetimeRevenue || 0).toLocaleString()} JMD, Orders: ${updatedHistory.totalOrders}.`
        };

        const updatedClient: Client = {
          ...existing,
          tier: row.finalTier,
          businessRelationship: row.businessRelationship,
          homeBrand: row.homeBrand,
          profileTheme: row.profileTheme,
          healthScore: row.healthScore,
          relationshipStatus: row.relationshipStatus,
          managementClassification: mgmtClassification,
          tierSource: ["Founders Family", "Delinquent", "Problematic"].includes(row.finalTier) ? "Manual" : existing.tierSource || "Manual",
          history: updatedHistory,
          timeline: [timelineEntry, ...(existing.timeline || [])]
        };

        clientMap.set(existing.id.toLowerCase(), updatedClient);

        // Update register
        registerMap.set(row.clId.toLowerCase(), {
          ceoId: existing.id,
          customerFullName: `${existing.firstName} ${existing.lastName}`.trim(),
          manualTier: row.finalTier,
          datePromoted: new Date().toLocaleDateString("en-GB"),
          previousTier: existing.tier || "Silver",
          promotionNotes: `Merged/Updated via Smart Tier Import. Spend: $${(updatedHistory.lifetimeRevenue || 0).toLocaleString()} JMD.`
        });

        logDetails.push(`[UPDATED] ${existing.id} - ${row.fullName} (Tier: ${row.finalTier}, Spend: $${row.lifetimeSpend.toLocaleString()} JMD)`);
      } else {
        errorsCount++;
        logDetails.push(`[ERROR] Could not locate existing profile for ${row.clId} - ${row.fullName}`);
      }
    } else if (action === "create_new" || (action === "merge" && !item.existingClient)) {
      // CREATE BRAND NEW CLIENT PROFILE
      createdCount++;
      const { firstName, lastName } = splitFullName(row.fullName);

      const mgmtClassification: ManagementClassification = 
        row.finalTier === "Founders Family" || row.finalTier === "Platinum" ? "VIP Priority" :
        row.finalTier === "Problematic" ? "Problematic" :
        row.finalTier === "Delinquent" ? "Delinquent" : "Standard";

      const newClient: Client = {
        id: row.clId,
        firstName,
        lastName,
        tier: row.finalTier,
        homeBrand: row.homeBrand,
        businessRelationship: row.businessRelationship,
        profileTheme: row.profileTheme,
        managementClassification: mgmtClassification,
        healthScore: row.healthScore,
        relationshipStatus: row.relationshipStatus,
        accountStatus: "Active",
        deactivated: false,
        tierSource: ["Founders Family", "Delinquent", "Problematic"].includes(row.finalTier) ? "Manual" : "Calculated",
        gender: "N/A",
        occupation: "Business Owner / VIP",
        drive: "No",
        contact: {
          phoneNumber: "",
          email: "",
          city: "",
          parish: "N/A",
          country: "Jamaica",
          deliveryAddress: "",
          deliveryCountry: "Jamaica"
        },
        profile: {
          motherName: "",
          fatherName: "",
          wifeName: "",
          husbandName: "",
          children: [],
          pets: "None",
          personalNotes: "Automatically onboarded via Smart Tier Import system."
        },
        importantDates: [],
        history: {
          firstOrderDate: row.firstOrderDate,
          lastOrderDate: row.lastOrderDate,
          totalOrders: row.totalOrders,
          lifetimeRevenue: row.lifetimeSpend,
          averageOrderValue: row.aov,
          productsPurchased: [],
          preferredCategories: [],
          clientPreferences: []
        },
        interests: {
          sports: {
            sport: "",
            favoriteTeam: "",
            teamOne: "",
            teamTwo: "",
            nationalTeam: "",
            favoritePlayer: ""
          },
          hobbies: ["VIP Services"],
          favoriteColors: [],
          giftPreferences: []
        },
        timeline: [
          {
            id: `TL_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: "Note" as const,
            date: new Date().toISOString().split("T")[0],
            content: `Profile created via Smart Tier Import Engine. Assigned Tier: ${row.finalTier}.`
          }
        ],
        reminders: [],
        preferredCommunication: "Email",
        lastContactedDate: row.lastOrderDate || new Date().toISOString().split("T")[0],
        communicationStatus: "Active"
      };

      clientMap.set(row.clId.toLowerCase(), newClient);

      // Register entry
      registerMap.set(row.clId.toLowerCase(), {
        ceoId: row.clId,
        customerFullName: row.fullName,
        manualTier: row.finalTier,
        datePromoted: new Date().toLocaleDateString("en-GB"),
        previousTier: "N/A",
        promotionNotes: "Created via Smart Tier Import Onboarding Engine"
      });

      logDetails.push(`[CREATED] ${row.clId} - ${row.fullName} (Tier: ${row.finalTier}, Spend: $${row.lifetimeSpend.toLocaleString()} JMD, Orders: ${row.totalOrders})`);
    }
  });

  const updatedClientsList = Array.from(clientMap.values());
  const updatedRegisterList = Array.from(registerMap.values());

  const now = new Date();
  const timestamp = `${now.toLocaleDateString("en-GB")} ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;

  return {
    updatedClients: updatedClientsList,
    updatedRegister: updatedRegisterList,
    reportStats: {
      totalRecords: summary.totalRecords,
      createdCount,
      updatedCount,
      skippedCount,
      errorsCount,
      logDetails,
      timestamp
    }
  };
}

/**
 * Generate readable text report for user download
 */
export function generateImportReportText(stats: TierImportExecutionResult["reportStats"]): string {
  const divider = "==========================================================================";
  const lines: string[] = [
    divider,
    "              CEO LIFESTYLE - SMART TIER IMPORT AUDIT REPORT              ",
    divider,
    `Timestamp: ${stats.timestamp}`,
    `Generated By: Master Administrator System`,
    `Engine Version: V2.1 (CRM Single-Step Onboarding Engine)`,
    divider,
    "",
    "IMPORT SUMMARY AUDIT:",
    `  • Total Spreadsheet Records Processed: ${stats.totalRecords}`,
    `  • New Client Profiles Created:         ${stats.createdCount}`,
    `  • Existing Profiles Merged/Updated:    ${stats.updatedCount}`,
    `  • Records Skipped (User Action):      ${stats.skippedCount}`,
    `  • Parsing/Processing Errors:          ${stats.errorsCount}`,
    "",
    divider,
    "DETAILED RECORD LOGS:",
    divider,
    ...stats.logDetails.map(log => `  ${log}`),
    "",
    divider,
    "END OF AUDIT REPORT",
    divider
  ];

  return lines.join("\n");
}
