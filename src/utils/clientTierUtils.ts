import { 
  Client, 
  ClientTier, 
  BusinessRelationship, 
  ProfileTheme, 
  ManagementClassification, 
  ClassificationHistoryRecord 
} from "../types";
import * as XLSX from "xlsx";
import { getCurrentEnvironment } from "./environmentUtils";

export interface ClientTierRecord {
  ceoId: string;           // Unique client identifier (e.g. CEO0001, CL24-000-0263)
  customerFullName: string; // Client name
  manualTier: ClientTier | ""; // Approved tier override: "Platinum" | "Gold" | "Silver" | "Founders Family" | "Delinquent" | "Problematic" | ""
  datePromoted: string;     // Date tier was assigned (DD/MM/YYYY)
  previousTier: string;     // Previous client level (e.g. "Gold", "Silver", "N/A")
  promotionNotes: string;   // Optional admin notes
  businessRelationship?: BusinessRelationship;
  managementClassification?: ManagementClassification;
}

export interface PromotionOpportunity {
  client: Client;
  ceoId: string;
  customerFullName: string;
  currentTier: ClientTier;      // Final approved current tier
  calculatedTier: ClientTier;   // Calculated higher tier
  lifetimeSpend: number;        // JMD
  totalOrders: number;
  averageOrderValue: number;
  clientScore: number;
  reason: string;
  recommendation: string;
}

export const TIER_WEIGHT: Record<ClientTier, number> = {
  "Silver": 1,
  "Gold": 2,
  "Platinum": 3,
  "Founders Family": 100, // Permanent priority tier
  "Delinquent": -10,      // Account risk tier
  "Problematic": -20     // Relationship management tier
};

export const CLIENT_TIER_REGISTER_STORAGE_KEY = "ceo_client_tier_register";

/**
 * Returns default Profile Theme based on Business Relationship
 */
export function getProfileThemeForRelationship(relationship?: BusinessRelationship | string): ProfileTheme {
  if (relationship === "Librarium Luxe") return "Librarium Crimson";
  if (relationship === "CEO Lifestyle + Librarium Luxe") return "Dual Burgundy Blend";
  return "CEO Blue";
}

/**
 * Returns Tailwind style definitions for a given Profile Theme
 */
export function getThemeCardStyles(theme?: ProfileTheme | string) {
  if (theme === "Librarium Crimson") {
    return {
      border: "border-rose-200 hover:border-rose-300",
      bgHeader: "bg-gradient-to-r from-rose-900 via-rose-800 to-pink-950 text-white",
      badge: "bg-rose-100 text-rose-900 border-rose-300 font-bold",
      accentText: "text-rose-700",
      ring: "ring-rose-500/20",
      cardBorderTop: "border-t-4 border-t-rose-800"
    };
  }
  if (theme === "Dual Burgundy Blend") {
    return {
      border: "border-purple-200 hover:border-purple-300",
      bgHeader: "bg-gradient-to-r from-blue-900 via-purple-900 to-rose-900 text-white",
      badge: "bg-gradient-to-r from-blue-900 to-rose-900 text-white border-purple-300 font-bold",
      accentText: "text-purple-700",
      ring: "ring-purple-500/20",
      cardBorderTop: "border-t-4 border-t-purple-800"
    };
  }
  // Default CEO Blue
  return {
    border: "border-blue-200 hover:border-blue-300",
    bgHeader: "bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white",
    badge: "bg-blue-100 text-blue-900 border-blue-300 font-bold",
    accentText: "text-blue-700",
    ring: "ring-blue-500/20",
    cardBorderTop: "border-t-4 border-t-blue-800"
  };
}

/**
 * Calculates relationship Health Score (0-100) based on order recency, total spend, order count, and relationship status.
 */
export function calculateHealthScore(client: Client): number {
  if (typeof client.healthScore === "number" && client.healthScore >= 0) {
    return Math.min(100, Math.max(0, client.healthScore));
  }

  let score = 0;

  // 1. Orders count (max 30 pts)
  const orders = client.history?.totalOrders || 0;
  score += Math.min(30, orders * 4);

  // 2. Revenue (max 25 pts)
  const revenue = client.history?.lifetimeRevenue || 0;
  score += Math.min(25, Math.round(revenue / 15000));

  // 3. Recency (max 25 pts)
  const lastOrder = client.history?.lastOrderDate || client.lastContactedDate || "";
  if (lastOrder) {
    const orderDate = new Date(lastOrder);
    if (!isNaN(orderDate.getTime())) {
      const diffDays = Math.floor((new Date().getTime() - orderDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays <= 30) score += 25;
      else if (diffDays <= 90) score += 18;
      else if (diffDays <= 180) score += 10;
      else score += 3;
    } else {
      score += 10;
    }
  } else {
    score += 5;
  }

  // 4. Relationship Status / Engagement (max 20 pts)
  const relStatus = client.relationshipStatus || (client.communicationStatus === "Active" ? "Active" : "Warm");
  if (relStatus === "Active") score += 20;
  else if (relStatus === "Warm") score += 12;
  else score += 3;

  return Math.min(100, Math.max(0, score));
}

/**
 * Determines whether a client's tier was manually assigned or auto-calculated.
 */
export function getTierSource(client: Client, registerRecord?: ClientTierRecord): "Calculated" | "Manual" {
  if (client.tierSource) return client.tierSource;
  if (client.tier === "Founders Family" || client.tier === "Delinquent" || client.tier === "Problematic") {
    return "Manual";
  }
  if (client.manualTierReason || (client.strategicAssociations && client.strategicAssociations.length > 0)) {
    return "Manual";
  }
  if (registerRecord && registerRecord.manualTier) {
    return "Manual";
  }
  const calcTier = calculateClientTier(client);
  if (client.tier !== calcTier) {
    return "Manual";
  }
  return "Calculated";
}

/**
 * Calculates recommended client tier based on performance metrics.
 * Special Tiers Protection:
 * - "Founders Family", "Delinquent", "Problematic" are permanent manual tiers and are NOT auto-calculated or altered.
 * - Platinum: Lifetime Spend >= $400,000 JMD OR totalOrders >= 8 OR avgOrderValue >= $50,000
 * - Gold: Lifetime Spend >= $120,000 JMD OR totalOrders >= 3 OR avgOrderValue >= $25,000
 * - Silver: Standard / Default
 */
export function calculateClientTier(client: Client): ClientTier {
  if (client.tier === "Founders Family" || client.tier === "Delinquent" || client.tier === "Problematic") {
    return client.tier;
  }

  const revenue = client.history?.lifetimeRevenue || 0;
  const orders = client.history?.totalOrders || 0;
  const avgOrder = client.history?.averageOrderValue || 0;

  if (revenue >= 400000 || orders >= 8 || avgOrder >= 50000) {
    return "Platinum";
  }
  if (revenue >= 120000 || orders >= 3 || avgOrder >= 25000) {
    return "Gold";
  }
  return "Silver";
}

/**
 * Retrieves the Client Tier Register from localStorage.
 */
export function getClientTierRegister(clients?: Client[]): ClientTierRecord[] {
  try {
    const stored = localStorage.getItem(CLIENT_TIER_REGISTER_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading Client Tier Register:", e);
  }

  // Initial default register if clients provided
  if (clients && clients.length > 0) {
    const defaultRegister: ClientTierRecord[] = clients.map(c => ({
      ceoId: c.id,
      customerFullName: `${c.firstName} ${c.lastName}`.trim(),
      manualTier: c.tier || "Silver",
      datePromoted: "14/02/2024",
      previousTier: "N/A",
      promotionNotes: "Initial approved relationship tier",
      businessRelationship: c.businessRelationship || (c.homeBrand === "Librarium Luxe" ? "Librarium Luxe" : "CEO Lifestyle"),
      managementClassification: c.managementClassification || "Standard"
    }));
    saveClientTierRegister(defaultRegister);
    return defaultRegister;
  }
  return [];
}

/**
 * Saves the Client Tier Register to localStorage.
 */
export function saveClientTierRegister(register: ClientTierRecord[]): void {
  try {
    localStorage.setItem(CLIENT_TIER_REGISTER_STORAGE_KEY, JSON.stringify(register));
  } catch (e) {
    console.error("Error saving Client Tier Register:", e);
  }
}

/**
 * Returns the final active tier for a client based on manual override vs calculation.
 */
export function getFinalClientTier(client: Client, registerRecord?: ClientTierRecord): ClientTier {
  if (registerRecord && registerRecord.manualTier) {
    return registerRecord.manualTier;
  }
  return calculateClientTier(client);
}

/**
 * Evaluates all clients against the Client Tier Register to find promotion opportunities.
 * STICKTO NO DEMOTION POLICY & SPECIAL TIER PROTECTION:
 * - Only evaluates Silver -> Gold or Gold -> Platinum transitions.
 * - Does NOT promote or alter "Founders Family", "Delinquent", or "Problematic".
 */
export function evaluateClientPromotions(
  clients: Client[],
  register: ClientTierRecord[]
): PromotionOpportunity[] {
  const regMap = new Map<string, ClientTierRecord>();
  register.forEach(r => {
    if (r.ceoId) regMap.set(r.ceoId.toLowerCase(), r);
    if (r.customerFullName) regMap.set(r.customerFullName.toLowerCase(), r);
  });

  const opportunities: PromotionOpportunity[] = [];

  clients.forEach(c => {
    // Skip Founders Family, Delinquent, Problematic
    if (c.tier === "Founders Family" || c.tier === "Delinquent" || c.tier === "Problematic") {
      return;
    }

    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase().trim();
    const rec = regMap.get(c.id.toLowerCase()) || regMap.get(fullName);
    const currentFinalTier = getFinalClientTier(c, rec);

    if (currentFinalTier === "Founders Family" || currentFinalTier === "Delinquent" || currentFinalTier === "Problematic") {
      return;
    }

    const calculatedTier = calculateClientTier(c);

    // NO DEMOTION POLICY:
    // Only trigger IF Calculated Tier is STRICTLY HIGHER than current Final Tier (Silver -> Gold -> Platinum)
    if (TIER_WEIGHT[calculatedTier] > TIER_WEIGHT[currentFinalTier] && TIER_WEIGHT[calculatedTier] <= 3) {
      const lifetimeSpend = c.history?.lifetimeRevenue || 0;
      const totalOrders = c.history?.totalOrders || 0;
      const averageOrderValue = c.history?.averageOrderValue || 0;
      const score = Math.min(100, Math.round((lifetimeSpend / 5000) + (totalOrders * 5) + (averageOrderValue / 1000)));

      opportunities.push({
        client: c,
        ceoId: c.id,
        customerFullName: `${c.firstName} ${c.lastName}`.trim(),
        currentTier: currentFinalTier,
        calculatedTier: calculatedTier,
        lifetimeSpend,
        totalOrders,
        averageOrderValue,
        clientScore: score,
        reason: `Lifetime Spend: $${lifetimeSpend.toLocaleString()} JMD | Orders: ${totalOrders} | Avg Order: $${averageOrderValue.toLocaleString()} JMD`,
        recommendation: `Upgrade client status from ${currentFinalTier} to ${calculatedTier} based on spending and order volume.`
      });
    }
  });

  return opportunities;
}

/**
 * Promotes or modifies a client tier & history, updating the Client Tier Register and active client data.
 */
export function approveClientPromotion(
  client: Client,
  newTier: ClientTier,
  notes: string = "Updated by Master Administrator",
  allClients?: Client[]
): { updatedRegister: ClientTierRecord[]; updatedClients: Client[] } {
  const register = getClientTierRegister(allClients);
  const today = new Date();
  const dateFormatted = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

  let found = false;
  const updatedRegister = register.map(r => {
    if (
      (r.ceoId && r.ceoId.toLowerCase() === client.id.toLowerCase()) ||
      (r.customerFullName && r.customerFullName.toLowerCase() === `${client.firstName} ${client.lastName}`.toLowerCase().trim())
    ) {
      found = true;
      return {
        ...r,
        previousTier: r.manualTier || client.tier || "Silver",
        manualTier: newTier,
        datePromoted: dateFormatted,
        promotionNotes: notes,
        businessRelationship: client.businessRelationship || r.businessRelationship || "CEO Lifestyle",
        managementClassification: client.managementClassification || r.managementClassification || "Standard"
      };
    }
    return r;
  });

  if (!found) {
    updatedRegister.push({
      ceoId: client.id,
      customerFullName: `${client.firstName} ${client.lastName}`.trim(),
      manualTier: newTier,
      datePromoted: dateFormatted,
      previousTier: client.tier || "Silver",
      promotionNotes: notes,
      businessRelationship: client.businessRelationship || "CEO Lifestyle",
      managementClassification: client.managementClassification || "Standard"
    });
  }

  saveClientTierRegister(updatedRegister);

  // Sync to active clients dataset in localStorage & append tierHistory
  let updatedClients: Client[] = [];
  if (allClients && allClients.length > 0) {
    updatedClients = allClients.map(c => {
      if (c.id === client.id) {
        const historyRecord: ClassificationHistoryRecord = {
          id: `HIST_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          tier: newTier,
          managementClassification: c.managementClassification || "Standard",
          businessRelationship: c.businessRelationship || "CEO Lifestyle",
          dateChanged: dateFormatted,
          changedBy: "Master Administrator",
          reason: notes
        };
        const updatedHistory = [...(c.tierHistory || []), historyRecord];

        return {
          ...c,
          tier: newTier,
          tierHistory: updatedHistory
        };
      }
      return c;
    });

    try {
      localStorage.setItem("ceo_client_management_data", JSON.stringify(updatedClients));
    } catch (e) {
      console.error("Error updating active clients localStorage:", e);
    }
  }

  return { updatedRegister, updatedClients };
}

/**
 * Export Client Tier Register to Excel (CEO_Client_Tier_Register_V2.1.xlsx)
 */
export function exportClientTierRegisterExcel(register: ClientTierRecord[]) {
  const env = getCurrentEnvironment();
  const prefix = env === "LIVE" ? "" : "STRESS_MODE_";
  const now = new Date();

  const wb = XLSX.utils.book_new();
  const excelRows = register.map(r => ({
    "CEO ID": r.ceoId,
    "Customer Full Name": r.customerFullName,
    "Manual Tier": r.manualTier,
    "Business Relationship": r.businessRelationship || "CEO Lifestyle",
    "Management Classification": r.managementClassification || "Standard",
    "Date Promoted": r.datePromoted,
    "Previous Tier": r.previousTier,
    "Promotion Notes": r.promotionNotes
  }));

  const ws = XLSX.utils.json_to_sheet(
    excelRows.length > 0 ? excelRows : [{ "CEO ID": "N/A", "Customer Full Name": "No records in register" }]
  );
  XLSX.utils.book_append_sheet(wb, ws, "Client Tier Register");

  const sysRefData = [
    { "Field": "Environment", "Value": env === "LIVE" ? "LIVE MODE" : "STRESS TEST MODE" },
    { "Field": "Export Date", "Value": now.toLocaleDateString("en-GB") },
    { "Field": "Export Time", "Value": now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) },
    { "Field": "Application Version", "Value": "V2.1" },
    { "Field": "Exported By", "Value": "Master Administrator" }
  ];
  const wsRef = XLSX.utils.json_to_sheet(sysRefData);
  XLSX.utils.book_append_sheet(wb, wsRef, "SYSTEM_REFERENCE");

  XLSX.writeFile(wb, `${prefix}CEO_Client_Tier_Register_V2.1.xlsx`);
}

/**
 * Parse uploaded Excel file to raw row objects
 */
export function parseRawExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse uploaded Excel file for Client Tier Register import
 */
export function parseClientTierRegisterExcel(file: File): Promise<ClientTierRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        const records: ClientTierRecord[] = rows
          .map(row => ({
            ceoId: String(row["CEO ID"] || row["ceoId"] || "").trim(),
            customerFullName: String(row["Customer Full Name"] || row["customerFullName"] || "").trim(),
            manualTier: (row["Manual Tier"] || row["manualTier"] || "") as ClientTier | "",
            businessRelationship: (row["Business Relationship"] || row["businessRelationship"] || "CEO Lifestyle") as BusinessRelationship,
            managementClassification: (row["Management Classification"] || row["managementClassification"] || "Standard") as ManagementClassification,
            datePromoted: String(row["Date Promoted"] || row["datePromoted"] || "").trim(),
            previousTier: String(row["Previous Tier"] || row["previousTier"] || "N/A").trim(),
            promotionNotes: String(row["Promotion Notes"] || row["promotionNotes"] || "").trim()
          }))
          .filter(r => r.ceoId || r.customerFullName);

        resolve(records);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

