import * as XLSX from "xlsx";
import { Client, LuxeBookInventoryItem, SystemSettings, AspiringClient, BackupRecord, ProductionMaterialPreset } from "../types";
import { INITIAL_BACKUP_HISTORY, INITIAL_CLIENTS } from "../data/mockData";
import { customerToFlatRow, flatRowToCustomer } from "./excelUtils";

export const BACKUP_HISTORY_STORAGE_KEY = "ceo_backup_history";

// Helper to retrieve backup history from localStorage
export function getBackupHistory(): BackupRecord[] {
  try {
    const stored = localStorage.getItem(BACKUP_HISTORY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length >= INITIAL_BACKUP_HISTORY.length) {
        return parsed;
      }
    }
    return INITIAL_BACKUP_HISTORY;
  } catch (err) {
    console.error("Failed to load backup history:", err);
    return INITIAL_BACKUP_HISTORY;
  }
}

// Helper to record a new backup in history
export function recordBackupInHistory(record: BackupRecord) {
  try {
    const history = getBackupHistory();
    const updated = [record, ...history].slice(0, 50); // Keep last 50 backups
    localStorage.setItem(BACKUP_HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save backup history record:", err);
  }
}

// Helper to record audit actions in the Activity Log (ceo_admin_guide_logs)
export function logBackupActivity(action: "Backup Created" | "Backup Restored", createdBy: string, backupId: string, notes: string = "") {
  try {
    const existingRaw = localStorage.getItem("ceo_admin_guide_logs");
    const logs: any[] = existingRaw ? JSON.parse(existingRaw) : [];
    
    const newEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      user: createdBy,
      category: "System Backup & Recovery",
      action: `${action} [${backupId}]`,
      details: notes || `Data protection task executed by ${createdBy}`
    };

    const updatedLogs = [newEntry, ...logs].slice(0, 200);
    localStorage.setItem("ceo_admin_guide_logs", JSON.stringify(updatedLogs));
  } catch (err) {
    console.error("Failed to log backup activity:", err);
  }
}

// Helper to generate a unique Backup ID: CLM-YYYYMMDD-XXX
export function generateBackupId(): string {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0].replace(/-/g, ""); // 20260722
  const history = getBackupHistory();
  
  // Count backups from today to determine index
  const todayPrefix = `CLM-${dateStr}-`;
  const todayCount = history.filter(h => h.backupId && h.backupId.startsWith(todayPrefix)).length;
  const seq = String(todayCount + 1).padStart(3, "0");
  
  return `CLM-${dateStr}-${seq}`;
}

// Helper to gather all active application state into a complete payload
export function generateFullBackupPayload(createdBy: string = "Master Administrator", notes: string = "") {
  let clients: Client[] = [];
  let aspiringClients: AspiringClient[] = [];
  let inventory: LuxeBookInventoryItem[] = [];
  let users: any[] = [];
  let settings: SystemSettings = {} as SystemSettings;
  let guideLogs: any[] = [];
  let businessEvents: any[] = [];

  try {
    const cStr = localStorage.getItem("ceo_client_management_data") || localStorage.getItem("ceo_librarium_crm_customers");
    if (cStr) clients = JSON.parse(cStr);
  } catch (e) { console.error("Error reading clients for backup", e); }

  if (!Array.isArray(clients) || clients.length === 0) {
    clients = INITIAL_CLIENTS;
  }

  try {
    const aspStr = localStorage.getItem("ceo_aspiring_clients");
    if (aspStr) aspiringClients = JSON.parse(aspStr);
  } catch (e) { console.error("Error reading aspiring clients for backup", e); }

  try {
    const invStr = localStorage.getItem("luxe_book_inventory");
    if (invStr) inventory = JSON.parse(invStr);
  } catch (e) { console.error("Error reading inventory for backup", e); }

  try {
    const usersStr = localStorage.getItem("ceo_application_users");
    if (usersStr) users = JSON.parse(usersStr);
  } catch (e) { console.error("Error reading users for backup", e); }

  try {
    const setStr = localStorage.getItem("librarium_system_settings");
    if (setStr) settings = JSON.parse(setStr);
  } catch (e) { console.error("Error reading settings for backup", e); }

  try {
    const guideStr = localStorage.getItem("ceo_admin_guide_logs");
    if (guideStr) guideLogs = JSON.parse(guideStr);
  } catch (e) { console.error("Error reading guide logs for backup", e); }

  try {
    const evStr = localStorage.getItem("ceo_crm_business_events");
    if (evStr) businessEvents = JSON.parse(evStr);
  } catch (e) { console.error("Error reading business events for backup", e); }

  let savedQuotations: any[] = [];
  try {
    const qStr = localStorage.getItem("ceo_saved_quotations");
    if (qStr) savedQuotations = JSON.parse(qStr);
  } catch (e) { console.error("Error reading saved quotations for backup", e); }

  const calculatorStates: Record<string, string> = {};
  const calcKeys = [
    "calc_prod_type", "calc_prod_custom_type", "calc_prod_material_id", "calc_prod_material_name",
    "calc_prod_sheet_w", "calc_prod_sheet_h", "calc_prod_sheet_cost", "calc_prod_item_w", "calc_prod_item_h",
    "calc_prod_customer_qty", "calc_prod_margin", "calc_prod_discount", "calc_prod_additional_charges",
    "calc_loc_name", "calc_loc_distance", "calc_loc_cost_per_km", "calc_loc_toll_fee", "calc_loc_trip_type", "calc_loc_discount",
    "calc_tshirt_garment_type", "calc_tshirt_adult_qty", "calc_tshirt_adult_plus_qty", "calc_tshirt_child_qty",
    "calc_tshirt_adult_price", "calc_tshirt_adult_plus_price", "calc_tshirt_child_price", "calc_tshirt_discount",
    "calc_tshirt_additional_charges", "calc_tshirt_delivery_method_id", "calc_tshirt_delivery_charge",
    "calc_book_name", "calc_book_cost", "calc_book_exchange_rate", "calc_book_qty", "calc_book_shipping",
    "calc_book_delivery_method_id", "calc_book_parish", "calc_book_discount", "calc_book_additional_charges"
  ];
  calcKeys.forEach(k => {
    const val = localStorage.getItem(k);
    if (val !== null) calculatorStates[k] = val;
  });

  const masterUsername = localStorage.getItem("ceo_admin_username") || "admin";
  const appBg = localStorage.getItem("ceo_app_background_base64") || "";
  const authBg = localStorage.getItem("ceo_auth_background_base64") || "";
  const backupHistory = getBackupHistory();

  const now = new Date();
  const dateFormatted = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeFormatted = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const backupId = generateBackupId();

  const totalBooksStock = inventory.reduce((sum, item) => sum + (item.quantity ?? ((item.inStore ?? 0) + (item.office ?? 0))), 0);

  const payload = {
    version: "2.1.0",
    backupSystem: "CEO Lifestyle Management Master Database Workbook",
    backupId,
    timestamp: now.toISOString(),
    backupDate: dateFormatted,
    backupTime: timeFormatted,
    createdBy,
    notes: notes || "Standard operational backup snapshot",
    itemCounts: {
      clients: clients.length,
      aspiringClients: aspiringClients.length,
      inventory: inventory.length,
      totalBooks: totalBooksStock,
      users: users.length,
      businessEvents: businessEvents.length,
      savedQuotations: savedQuotations.length
    },
    clients,
    aspiringClients,
    inventory,
    users,
    settings,
    guideLogs,
    businessEvents,
    savedQuotations,
    calculatorStates,
    masterUsername,
    appBg,
    authBg,
    backupHistory
  };

  return payload;
}

// Generate and trigger download of Master Data Workbook (.xlsx)
export function exportExcelBackup(notes: string = "", createdBy: string = "Master Administrator", customFileName?: string): BackupRecord {
  const payload = generateFullBackupPayload(createdBy, notes);
  const history = getBackupHistory();
  const lastBackupRecord = history.length > 0 ? history[0] : null;
  const lastBackupStr = lastBackupRecord ? `${lastBackupRecord.date} by ${lastBackupRecord.createdBy} [${lastBackupRecord.backupId || "Legacy"}]` : "None";

  const now = new Date();
  const dateIso = now.toISOString().split("T")[0]; // 2026-07-24
  const fileName = customFileName || `CEO_Lifestyle_Test_Environment_Backup_V2.1_${dateIso}.xlsx`;

  const wb = XLSX.utils.book_new();

  // Worksheet 1: Master Backup Report
  const masterReportData = [
    { "Category": "CEO LIFESTYLE MANAGEMENT - MASTER DATA WORKBOOK REPORT", "Value": "" },
    { "Category": "Backup ID", "Value": payload.backupId },
    { "Category": "Backup Date", "Value": payload.backupDate },
    { "Category": "Backup Time", "Value": payload.backupTime },
    { "Category": "Created By User", "Value": payload.createdBy },
    { "Category": "Application Version", "Value": payload.version },
    { "Category": "Last Successful Backup Date", "Value": lastBackupStr },
    { "Category": "Backup Notes / Changes Ledger", "Value": payload.notes },
    { "Category": "", "Value": "" },
    { "Category": "SYSTEM DATABASE SUMMARY", "Value": "" },
    { "Category": "Total Active Clients", "Value": payload.clients.length },
    { "Category": "Total Aspiring Clients", "Value": payload.aspiringClients.length },
    { "Category": "Total Inventory Items (Titles)", "Value": payload.inventory.length },
    { "Category": "Total Books in Stock (Units)", "Value": payload.itemCounts.totalBooks },
    { "Category": "Total Registered Users", "Value": payload.users.length },
    { "Category": "System Settings Status", "Value": payload.settings && Object.keys(payload.settings).length > 0 ? "Configured" : "Default" }
  ];
  const wsMaster = XLSX.utils.json_to_sheet(masterReportData);
  XLSX.utils.book_append_sheet(wb, wsMaster, "Master Backup Report");

  // Worksheet 2: Dashboard Summary
  const dashboardData = [
    { "Metric": "Active Client Profiles", "Count": payload.clients.length, "Status": "Healthy" },
    { "Metric": "Aspiring Client Inquiries", "Count": payload.aspiringClients.length, "Status": "Active" },
    { "Metric": "Luxe Inventory Titles", "Count": payload.inventory.length, "Status": "Cataloged" },
    { "Metric": "Total Book Units in Stock", "Count": payload.itemCounts.totalBooks, "Status": "Monitored" },
    { "Metric": "System User Accounts", "Count": payload.users.length, "Status": "Protected" },
    { "Metric": "System Backup Logs", "Count": payload.backupHistory.length, "Status": "Audited" }
  ];
  const wsDashboard = XLSX.utils.json_to_sheet(dashboardData);
  XLSX.utils.book_append_sheet(wb, wsDashboard, "Dashboard Summary");

  // Worksheet 3: Clients
  const flatClients = payload.clients.map(c => customerToFlatRow(c));
  const wsClients = XLSX.utils.json_to_sheet(flatClients.length > 0 ? flatClients : [{ "Notice": "No client records present" }]);
  XLSX.utils.book_append_sheet(wb, wsClients, "Clients");

  // Worksheet 4: Aspiring Clients
  const flatAspiring = payload.aspiringClients.map(asp => ({
    "ID": asp.id,
    "Name": asp.name,
    "Contact Info": asp.contactInfo,
    "Source of Inquiry": asp.sourceOfInquiry,
    "Service / Product Interested": asp.serviceInterestedIn,
    "Date Contacted": asp.dateContacted,
    "Follow-up Date": asp.followUpDate,
    "Status": asp.status,
    "Assigned User": asp.assignedUser,
    "Notes": asp.notes
  }));
  const wsAspiring = XLSX.utils.json_to_sheet(flatAspiring.length > 0 ? flatAspiring : [{ "Notice": "No aspiring client records" }]);
  XLSX.utils.book_append_sheet(wb, wsAspiring, "Aspiring Clients");

  // Worksheet 5: User Accounts
  const flatUsers = payload.users.map(u => ({
    "Username": u.username,
    "Full Name": u.fullName,
    "Role": u.role,
    "Status": u.status,
    "Email": u.email || "N/A",
    "Last Login": u.lastLogin || "N/A"
  }));
  const wsUsers = XLSX.utils.json_to_sheet(flatUsers.length > 0 ? flatUsers : [{ "Notice": "No registered users" }]);
  XLSX.utils.book_append_sheet(wb, wsUsers, "User Accounts");

  // Worksheet 6: Luxe Inventory
  const flatInv = payload.inventory.map(inv => ({
    "Item ID": inv.id,
    "Book Title": inv.title,
    "Category": inv.category,
    "In Store Stock": inv.inStore ?? inv.quantity ?? 0,
    "Office Stock": inv.office ?? 0,
    "Total Quantity": inv.quantity ?? ((inv.inStore ?? 0) + (inv.office ?? 0)),
    "Selling Price (JMD)": inv.sellingPrice || 0,
    "Ranking Status": inv.rankingStatus || "Healthy",
    "Book Rank": inv.bookRank || "Standard",
    "Date Added": inv.dateAdded || ""
  }));
  const wsInv = XLSX.utils.json_to_sheet(flatInv.length > 0 ? flatInv : [{ "Notice": "No inventory records" }]);
  XLSX.utils.book_append_sheet(wb, wsInv, "Luxe Inventory");

  // Worksheet 7: Production Records
  const productionMaterials: ProductionMaterialPreset[] = payload.settings?.productionMaterials || [];
  const flatProd = productionMaterials.map(m => ({
    "Material ID": m.id,
    "Material Name": m.name,
    "Sheet Width (in)": m.width,
    "Sheet Height (in)": m.height,
    "Current Cost / Sheet (JMD)": m.cost,
    "Supplier Notes": m.supplierNotes || "None",
    "Alternative Sources": m.alternativeSources || "None",
    "Supplier Options": m.supplierOptions ? m.supplierOptions.map(s => `${s.name}: $${s.costPerSheet}`).join("; ") : "Default",
    "Pricing History Log": m.pricingHistory ? m.pricingHistory.map(ph => `$${ph.price} on ${ph.date} (${ph.reason || "Update"})`).join(" | ") : "Initial Cost",
    "Last Price Update Date": m.lastUpdatedDate || "July 2026"
  }));
  const wsProd = XLSX.utils.json_to_sheet(flatProd.length > 0 ? flatProd : [{ "Notice": "No production materials preset" }]);
  XLSX.utils.book_append_sheet(wb, wsProd, "Production Records");

  // Worksheet 8: Sales Records
  const salesRows: any[] = [];
  payload.clients.forEach(c => {
    if (c.history && c.history.productsPurchased) {
      c.history.productsPurchased.forEach(prod => {
        salesRows.push({
          "Source": "Client Order",
          "Client CID": c.id,
          "Client Name": `${c.firstName} ${c.lastName}`,
          "Product / Service": prod,
          "Lifetime Revenue": c.history.lifetimeRevenue || 0,
          "Total Orders": c.history.totalOrders || 1,
          "Last Order Date": c.history.lastOrderDate || c.lastContactedDate || "N/A"
        });
      });
    }
  });
  payload.inventory.forEach(inv => {
    if (inv.salesHistory && inv.salesHistory.length > 0) {
      inv.salesHistory.forEach(sh => {
        salesRows.push({
          "Source": "Luxe Inventory Sale",
          "Book ID": inv.id,
          "Book Title": inv.title,
          "Buyer Name": sh.clientName || "Direct Sale",
          "Quantity Sold": sh.quantitySold,
          "Sale Date": sh.date
        });
      });
    }
  });
  const wsSales = XLSX.utils.json_to_sheet(salesRows.length > 0 ? salesRows : [{ "Notice": "No sales records recorded" }]);
  XLSX.utils.book_append_sheet(wb, wsSales, "Sales Records");

  // Worksheet 9: Milestones & Calendar Events
  const milestonesRows: any[] = [];
  payload.clients.forEach(c => {
    if (c.importantDates) {
      c.importantDates.forEach(d => {
        milestonesRows.push({
          "Client CID": c.id,
          "Client Name": `${c.firstName} ${c.lastName}`,
          "Event Label": d.label,
          "Event Date": d.date,
          "Tier": c.tier
        });
      });
    }
    if (c.reminders) {
      c.reminders.forEach(r => {
        milestonesRows.push({
          "Client CID": c.id,
          "Client Name": `${c.firstName} ${c.lastName}`,
          "Event Label": `Reminder: ${r.task}`,
          "Event Date": r.date,
          "Status": r.completed ? "Completed" : "Pending"
        });
      });
    }
  });
  const wsMilestones = XLSX.utils.json_to_sheet(milestonesRows.length > 0 ? milestonesRows : [{ "Notice": "No milestones recorded" }]);
  XLSX.utils.book_append_sheet(wb, wsMilestones, "Milestones & Calendar Events");

  // Worksheet 10: Centralized System Settings
  const flatSettings = payload.settings ? Object.entries(payload.settings)
    .filter(([k]) => k !== "productionMaterials" && k !== "appBg" && k !== "authBg")
    .map(([k, v]) => ({
      "Setting Key": k,
      "Setting Value": typeof v === "object" ? JSON.stringify(v) : String(v)
    })) : [];
  const wsSettings = XLSX.utils.json_to_sheet(flatSettings.length > 0 ? flatSettings : [{ "Notice": "No custom settings" }]);
  XLSX.utils.book_append_sheet(wb, wsSettings, "Centralized System Settings");

  // Worksheet 11: Branding Preferences
  const brandingData = [
    { "Preference": "Application Name", "Value": payload.settings?.appName || "CEO Lifestyle Management" },
    { "Preference": "Company Name", "Value": payload.settings?.companyName || "CEO Group of Companies" },
    { "Preference": "Business Slogan", "Value": payload.settings?.businessSlogan || "Luxury & Executive Operational Command" },
    { "Preference": "Footer Text", "Value": payload.settings?.footerText || "CEO Lifestyle Management" },
    { "Preference": "Theme Preference", "Value": payload.settings?.themePreference || "classic_light" },
    { "Preference": "Custom App Wallpaper Base64", "Value": payload.appBg ? "Stored (Base64)" : "Default" },
    { "Preference": "Custom Auth Wallpaper Base64", "Value": payload.authBg ? "Stored (Base64)" : "Default" }
  ];
  const wsBranding = XLSX.utils.json_to_sheet(brandingData);
  XLSX.utils.book_append_sheet(wb, wsBranding, "Branding Preferences");

  // Worksheet 12: Activity Log
  const flatLogs = (payload.guideLogs || []).map((g: any) => ({
    "Log ID": g.id,
    "Timestamp": g.timestamp,
    "User": g.user || "System",
    "Category": g.category || "General",
    "Action": g.action,
    "Details": g.details || ""
  }));
  const wsLogs = XLSX.utils.json_to_sheet(flatLogs.length > 0 ? flatLogs : [{ "Notice": "No activity logs" }]);
  XLSX.utils.book_append_sheet(wb, wsLogs, "Activity Log");

  // Worksheet 13: Backup History
  const flatHistory = (payload.backupHistory || []).map((h: any) => ({
    "Backup ID": h.backupId || h.id,
    "Date & Time": h.date,
    "Created By": h.createdBy,
    "Version": h.version,
    "Format": h.fileFormat,
    "File Name": h.fileName,
    "Notes": h.notes
  }));
  const wsHistory = XLSX.utils.json_to_sheet(flatHistory.length > 0 ? flatHistory : [{ "Notice": "No previous backup history" }]);
  XLSX.utils.book_append_sheet(wb, wsHistory, "Backup History");

  // Worksheet 14: Embedded Raw JSON Payload for 100% loss-less system restore
  const rawJsonString = JSON.stringify(payload);
  const CHUNK_SIZE = 30000;
  const jsonChunks: { "Chunk Index": number; "JSON Payload Chunk": string }[] = [];
  for (let i = 0; i < rawJsonString.length; i += CHUNK_SIZE) {
    jsonChunks.push({
      "Chunk Index": Math.floor(i / CHUNK_SIZE),
      "JSON Payload Chunk": rawJsonString.substring(i, i + CHUNK_SIZE)
    });
  }
  const wsJson = XLSX.utils.json_to_sheet(jsonChunks);
  XLSX.utils.book_append_sheet(wb, wsJson, "Backup System Payload JSON");

  // Download workbook
  XLSX.writeFile(wb, fileName);

  const backupRecord: BackupRecord = {
    id: `bkp_${Date.now()}`,
    backupId: payload.backupId,
    date: `${payload.backupDate} at ${payload.backupTime}`,
    createdBy,
    version: payload.version,
    notes: payload.notes,
    fileFormat: "XLSX",
    fileName,
    itemCounts: payload.itemCounts
  };

  recordBackupInHistory(backupRecord);
  logBackupActivity("Backup Created", createdBy, payload.backupId, payload.notes);

  return backupRecord;
}

// Generate and trigger download of JSON backup file
export function exportJsonBackup(notes: string = "", createdBy: string = "Master Administrator", customFileName?: string): BackupRecord {
  const payload = generateFullBackupPayload(createdBy, notes);
  const now = new Date();
  const dateIso = now.toISOString().split("T")[0];
  const fileName = customFileName || `CEO_Lifestyle_Test_Environment_Backup_V2.1_${dateIso}.json`;

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", fileName);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  const backupRecord: BackupRecord = {
    id: `bkp_${Date.now()}`,
    backupId: payload.backupId,
    date: `${payload.backupDate} at ${payload.backupTime}`,
    createdBy,
    version: payload.version,
    notes: payload.notes,
    fileFormat: "JSON",
    fileName,
    itemCounts: payload.itemCounts
  };

  recordBackupInHistory(backupRecord);
  logBackupActivity("Backup Created", createdBy, payload.backupId, payload.notes);

  return backupRecord;
}

// Specialized Test Environment Export Helper
export function exportTestEnvironmentBackup(
  fileFormat: "xlsx" | "json" = "xlsx",
  notes: string = "",
  createdBy: string = "Master Administrator"
): BackupRecord {
  const now = new Date();
  const dateIso = now.toISOString().split("T")[0]; // 2026-07-24
  const testEnvNotes = notes || "Production Test Data Export for Live Migration & Stress Testing";
  const customFileName = `CEO_Lifestyle_Test_Environment_Backup_V2.1_${dateIso}.${fileFormat}`;

  if (fileFormat === "xlsx") {
    return exportExcelBackup(testEnvNotes, createdBy, customFileName);
  } else {
    return exportJsonBackup(testEnvNotes, createdBy, customFileName);
  }
}

export interface ImportResult {
  success: boolean;
  statusText: string;
  mode: "Add Test Data (Merge)" | "Replace Environment";
  clientsProcessed: number;
  clientsAdded: number;
  aspiringClientsProcessed: number;
  aspiringClientsAdded: number;
  tasksAndEventsProcessed: number;
  tasksAndEventsAdded: number;
  inventoryProcessed: number;
  inventoryAdded: number;
  productionQuotesProcessed: number;
  productionQuotesAdded: number;
  usersProcessed: number;
  usersAdded: number;
  error?: string;
  mergedData: {
    clients: Client[];
    aspiringClients: AspiringClient[];
    inventory: LuxeBookInventoryItem[];
    users: any[];
    settings: SystemSettings;
    guideLogs: any[];
    businessEvents: any[];
    savedQuotations: any[];
    appBg?: string;
    authBg?: string;
    backupHistory?: BackupRecord[];
  };
}

// Process Backup Import with Duplicate Protection
export function processBackupImport(
  rawPayload: any,
  mode: "merge" | "replace",
  createdBy: string = "Master Administrator"
): ImportResult {
  const isMerge = mode === "merge";

  // Read current active data from localStorage
  let activeClients: Client[] = [];
  let activeAspiring: AspiringClient[] = [];
  let activeInv: LuxeBookInventoryItem[] = [];
  let activeEvents: any[] = [];
  let activeQuotes: any[] = [];
  let activeUsers: any[] = [];
  let activeGuideLogs: any[] = [];
  let activeSettings: SystemSettings = {} as SystemSettings;

  try {
    const c = localStorage.getItem("ceo_client_management_data");
    if (c) activeClients = JSON.parse(c);
  } catch (e) {}

  try {
    const asp = localStorage.getItem("ceo_aspiring_clients");
    if (asp) activeAspiring = JSON.parse(asp);
  } catch (e) {}

  try {
    const inv = localStorage.getItem("luxe_book_inventory");
    if (inv) activeInv = JSON.parse(inv);
  } catch (e) {}

  try {
    const ev = localStorage.getItem("ceo_crm_business_events");
    if (ev) activeEvents = JSON.parse(ev);
  } catch (e) {}

  try {
    const q = localStorage.getItem("ceo_saved_quotations");
    if (q) activeQuotes = JSON.parse(q);
  } catch (e) {}

  try {
    const u = localStorage.getItem("ceo_application_users");
    if (u) activeUsers = JSON.parse(u);
  } catch (e) {}

  try {
    const g = localStorage.getItem("ceo_admin_guide_logs");
    if (g) activeGuideLogs = JSON.parse(g);
  } catch (e) {}

  try {
    const s = localStorage.getItem("librarium_system_settings");
    if (s) activeSettings = JSON.parse(s);
  } catch (e) {}

  const incomingClients: Client[] = Array.isArray(rawPayload.clients) ? rawPayload.clients : [];
  const incomingAspiring: AspiringClient[] = Array.isArray(rawPayload.aspiringClients) ? rawPayload.aspiringClients : [];
  const incomingInv: LuxeBookInventoryItem[] = Array.isArray(rawPayload.inventory) ? rawPayload.inventory : [];
  const incomingEvents: any[] = Array.isArray(rawPayload.businessEvents) ? rawPayload.businessEvents : [];
  const incomingQuotes: any[] = Array.isArray(rawPayload.savedQuotations) ? rawPayload.savedQuotations : [];
  const incomingUsers: any[] = Array.isArray(rawPayload.users) ? rawPayload.users : [];
  const incomingGuideLogs: any[] = Array.isArray(rawPayload.guideLogs) ? rawPayload.guideLogs : [];

  let finalClients: Client[] = [];
  let finalAspiring: AspiringClient[] = [];
  let finalInv: LuxeBookInventoryItem[] = [];
  let finalEvents: any[] = [];
  let finalQuotes: any[] = [];
  let finalUsers: any[] = [];
  let finalGuideLogs: any[] = [];
  let finalSettings: SystemSettings = activeSettings;

  let clientsAdded = 0;
  let aspiringAdded = 0;
  let inventoryAdded = 0;
  let tasksAndEventsAdded = 0;
  let quotesAdded = 0;
  let usersAdded = 0;

  if (mode === "replace") {
    finalClients = incomingClients;
    clientsAdded = incomingClients.length;

    finalAspiring = incomingAspiring;
    aspiringAdded = incomingAspiring.length;

    finalInv = incomingInv;
    inventoryAdded = incomingInv.length;

    finalEvents = incomingEvents;
    tasksAndEventsAdded = incomingEvents.length;

    finalQuotes = incomingQuotes;
    quotesAdded = incomingQuotes.length;

    finalUsers = incomingUsers.length > 0 ? incomingUsers : activeUsers;
    usersAdded = incomingUsers.length;

    finalGuideLogs = incomingGuideLogs.length > 0 ? incomingGuideLogs : activeGuideLogs;
    if (rawPayload.settings && typeof rawPayload.settings === "object") {
      finalSettings = rawPayload.settings;
    }
  } else {
    // MERGE MODE (Add Test Data with Duplicate Protection)
    
    // 1. Clients (Duplicate Protection)
    finalClients = [...activeClients];
    incomingClients.forEach(inc => {
      const incFullName = `${inc.firstName || ""} ${inc.lastName || ""}`.toLowerCase().trim();
      const incContact = (inc.contact?.email || inc.contact?.phoneNumber || (inc as any).contactInfo?.email || "").toLowerCase().trim();
      
      const exists = finalClients.some(existing => {
        if (existing.id && inc.id && existing.id === inc.id) return true;
        const exFullName = `${existing.firstName || ""} ${existing.lastName || ""}`.toLowerCase().trim();
        const exContact = (existing.contact?.email || existing.contact?.phoneNumber || (existing as any).contactInfo?.email || "").toLowerCase().trim();
        if (incFullName && exFullName === incFullName) return true;
        if (incContact && exContact && exContact === incContact) return true;
        return false;
      });

      if (!exists) {
        finalClients.push(inc);
        clientsAdded++;
      }
    });

    // 2. Aspiring Clients (Duplicate Protection)
    finalAspiring = [...activeAspiring];
    incomingAspiring.forEach(asp => {
      const aspName = (asp.name || "").toLowerCase().trim();
      const exists = finalAspiring.some(ex => {
        if (ex.id && asp.id && ex.id === asp.id) return true;
        if (aspName && (ex.name || "").toLowerCase().trim() === aspName) return true;
        return false;
      });

      if (!exists) {
        finalAspiring.push(asp);
        aspiringAdded++;
      }
    });

    // 3. Inventory (Duplicate Protection)
    finalInv = [...activeInv];
    incomingInv.forEach(inv => {
      const invTitle = (inv.title || "").toLowerCase().trim();
      const exists = finalInv.some(ex => {
        if (ex.id && inv.id && ex.id === inv.id) return true;
        if (invTitle && (ex.title || "").toLowerCase().trim() === invTitle) return true;
        return false;
      });

      if (!exists) {
        finalInv.push(inv);
        inventoryAdded++;
      }
    });

    // 4. Business Events & Tasks (Duplicate Protection)
    finalEvents = [...activeEvents];
    incomingEvents.forEach(ev => {
      const evTitle = (ev.title || "").toLowerCase().trim();
      const evDate = ev.date || "";
      const exists = finalEvents.some(ex => {
        if (ex.id && ev.id && ex.id === ev.id) return true;
        if (evTitle && (ex.title || "").toLowerCase().trim() === evTitle && ex.date === evDate) return true;
        return false;
      });

      if (!exists) {
        finalEvents.push(ev);
        tasksAndEventsAdded++;
      }
    });

    // 5. Saved Quotations (Duplicate Protection)
    finalQuotes = [...activeQuotes];
    incomingQuotes.forEach(q => {
      const qNum = q.quoteNumber || "";
      const exists = finalQuotes.some(ex => {
        if (ex.id && q.id && ex.id === q.id) return true;
        if (qNum && ex.quoteNumber === qNum) return true;
        return false;
      });

      if (!exists) {
        finalQuotes.push(q);
        quotesAdded++;
      }
    });

    // 6. User Accounts (Duplicate Protection)
    finalUsers = [...activeUsers];
    incomingUsers.forEach(u => {
      const uName = (u.username || "").toLowerCase().trim();
      const exists = finalUsers.some(ex => (ex.username || "").toLowerCase().trim() === uName);
      if (!exists) {
        finalUsers.push(u);
        usersAdded++;
      }
    });

    // 7. Guide Logs
    finalGuideLogs = [...activeGuideLogs];
    incomingGuideLogs.forEach(g => {
      const exists = finalGuideLogs.some(ex => ex.id === g.id);
      if (!exists) {
        finalGuideLogs.push(g);
      }
    });

    // Settings merge
    if (rawPayload.settings && typeof rawPayload.settings === "object") {
      finalSettings = { ...activeSettings };
      if (!finalSettings.quoteTemplates || finalSettings.quoteTemplates.length === 0) {
        finalSettings.quoteTemplates = rawPayload.settings.quoteTemplates;
      }
      if (!finalSettings.deliveryMethods || finalSettings.deliveryMethods.length === 0) {
        finalSettings.deliveryMethods = rawPayload.settings.deliveryMethods;
      }
      if (!finalSettings.productionMaterials || finalSettings.productionMaterials.length === 0) {
        finalSettings.productionMaterials = rawPayload.settings.productionMaterials;
      }
    }
  }

  // Persist to LocalStorage
  localStorage.setItem("ceo_client_management_data", JSON.stringify(finalClients));
  localStorage.setItem("ceo_librarium_crm_customers", JSON.stringify(finalClients));
  localStorage.setItem("ceo_aspiring_clients", JSON.stringify(finalAspiring));
  localStorage.setItem("luxe_book_inventory", JSON.stringify(finalInv));
  localStorage.setItem("ceo_crm_business_events", JSON.stringify(finalEvents));
  localStorage.setItem("ceo_saved_quotations", JSON.stringify(finalQuotes));
  localStorage.setItem("ceo_application_users", JSON.stringify(finalUsers));
  localStorage.setItem("ceo_admin_guide_logs", JSON.stringify(finalGuideLogs));
  localStorage.setItem("librarium_system_settings", JSON.stringify(finalSettings));

  if (rawPayload.appBg) {
    localStorage.setItem("ceo_app_background_base64", rawPayload.appBg);
  }
  if (rawPayload.authBg) {
    localStorage.setItem("ceo_auth_background_base64", rawPayload.authBg);
  }
  if (rawPayload.calculatorStates && typeof rawPayload.calculatorStates === "object") {
    Object.keys(rawPayload.calculatorStates).forEach(key => {
      localStorage.setItem(key, rawPayload.calculatorStates[key]);
    });
  }

  // Log activity
  logBackupActivity(
    "Backup Restored",
    createdBy,
    rawPayload.backupId || "MIGRATION-V2.1",
    `Imported via ${isMerge ? "Add Test Data (Merge)" : "Replace Environment"}`
  );

  window.dispatchEvent(new Event("storage"));

  return {
    success: true,
    statusText: "Successful",
    mode: isMerge ? "Add Test Data (Merge)" : "Replace Environment",
    clientsProcessed: incomingClients.length,
    clientsAdded,
    aspiringClientsProcessed: incomingAspiring.length,
    aspiringClientsAdded: aspiringAdded,
    tasksAndEventsProcessed: incomingEvents.length,
    tasksAndEventsAdded,
    inventoryProcessed: incomingInv.length,
    inventoryAdded,
    productionQuotesProcessed: incomingQuotes.length,
    productionQuotesAdded: quotesAdded,
    usersProcessed: incomingUsers.length,
    usersAdded,
    mergedData: {
      clients: finalClients,
      aspiringClients: finalAspiring,
      inventory: finalInv,
      users: finalUsers,
      settings: finalSettings,
      guideLogs: finalGuideLogs,
      businessEvents: finalEvents,
      savedQuotations: finalQuotes,
      appBg: rawPayload.appBg,
      authBg: rawPayload.authBg,
      backupHistory: getBackupHistory()
    }
  };
}

// Validation & Parsing of backup file (.xlsx or .json)
export async function validateAndParseBackupFile(file: File): Promise<{
  isValid: boolean;
  version?: string;
  backupId?: string;
  backupDate?: string;
  createdBy?: string;
  notes?: string;
  itemCounts?: { clients: number; aspiringClients: number; inventory: number; users: number; totalBooks?: number };
  rawPayload: any;
  error?: string;
}> {
  const fileName = file.name.toLowerCase();

  try {
    if (fileName.endsWith(".json")) {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed || (typeof parsed !== "object")) {
        return { isValid: false, rawPayload: null, error: "Invalid JSON backup file structure." };
      }

      // Check for mandatory keys or content
      const hasClients = Array.isArray(parsed.clients);
      const hasInventory = Array.isArray(parsed.inventory);
      const hasSettings = parsed.settings && typeof parsed.settings === "object";
      const hasAspiring = Array.isArray(parsed.aspiringClients);

      if (!hasClients && !hasInventory && !hasSettings && !hasAspiring) {
        return {
          isValid: false,
          rawPayload: null,
          error: "Unrecognized backup file. Missing clients, inventory, aspiring clients, or settings data."
        };
      }

      const clientsCount = Array.isArray(parsed.clients) ? parsed.clients.length : 0;
      const aspiringCount = Array.isArray(parsed.aspiringClients) ? parsed.aspiringClients.length : 0;
      const inventoryCount = Array.isArray(parsed.inventory) ? parsed.inventory.length : 0;
      const usersCount = Array.isArray(parsed.users) ? parsed.users.length : 0;
      const totalBooks = Array.isArray(parsed.inventory)
        ? parsed.inventory.reduce((acc: number, item: any) => acc + (item.quantity ?? ((item.inStore ?? 0) + (item.office ?? 0))), 0)
        : 0;

      return {
        isValid: true,
        version: parsed.version || "2.1.0",
        backupId: parsed.backupId || "CLM-LEGACY-JSON",
        backupDate: parsed.backupDate || "Unknown Date",
        createdBy: parsed.createdBy || "Administrator",
        notes: parsed.notes || "JSON System Backup File",
        itemCounts: { clients: clientsCount, aspiringClients: aspiringCount, inventory: inventoryCount, users: usersCount, totalBooks },
        rawPayload: parsed
      };
    }

    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "array" });

      if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
        return { isValid: false, rawPayload: null, error: "Empty or invalid Excel workbook." };
      }

      // 1. Check if "Backup System Payload JSON" sheet exists for 100% loss-less JSON extraction
      if (wb.SheetNames.includes("Backup System Payload JSON")) {
        const sheet = wb.Sheets["Backup System Payload JSON"];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);
        if (rows && rows.length > 0) {
          rows.sort((a, b) => Number(a["Chunk Index"] || 0) - Number(b["Chunk Index"] || 0));
          const fullJsonStr = rows.map(r => r["JSON Payload Chunk"] || "").join("");
          if (fullJsonStr) {
            try {
              const parsed = JSON.parse(fullJsonStr);
              return {
                isValid: true,
                version: parsed.version || "2.1.0",
                backupId: parsed.backupId || "CLM-EXCEL-JSON",
                backupDate: parsed.backupDate || "Excel Master Backup",
                createdBy: parsed.createdBy || "Master Administrator",
                notes: parsed.notes || "Master Data Workbook",
                itemCounts: {
                  clients: Array.isArray(parsed.clients) ? parsed.clients.length : 0,
                  aspiringClients: Array.isArray(parsed.aspiringClients) ? parsed.aspiringClients.length : 0,
                  inventory: Array.isArray(parsed.inventory) ? parsed.inventory.length : 0,
                  users: Array.isArray(parsed.users) ? parsed.users.length : 0,
                  totalBooks: Array.isArray(parsed.inventory)
                    ? parsed.inventory.reduce((acc: number, item: any) => acc + (item.quantity ?? ((item.inStore ?? 0) + (item.office ?? 0))), 0)
                    : 0
                },
                rawPayload: parsed
              };
            } catch (jsonErr) {
              console.warn("Could not parse embedded JSON from Excel, falling back to sheet row parsing", jsonErr);
            }
          }
        }
      }

      // 2. Fallback: Parse structured Excel sheets directly
      let clients: Client[] = [];
      let aspiringClients: AspiringClient[] = [];
      let inventory: LuxeBookInventoryItem[] = [];
      let notes = "Restored from Excel sheets";
      let createdBy = "Master Administrator";
      let backupId = "CLM-EXCEL-RESTORE";

      if (wb.SheetNames.includes("Master Backup Report")) {
        const reportRows: any[] = XLSX.utils.sheet_to_json(wb.Sheets["Master Backup Report"]);
        reportRows.forEach(row => {
          if (row["Category"] === "Created By User") createdBy = String(row["Value"] || createdBy);
          if (row["Category"] === "Backup Notes / Changes Ledger") notes = String(row["Value"] || notes);
          if (row["Category"] === "Backup ID") backupId = String(row["Value"] || backupId);
        });
      }

      if (wb.SheetNames.includes("Clients")) {
        const clientRows: any[] = XLSX.utils.sheet_to_json(wb.Sheets["Clients"]);
        clients = clientRows
          .filter(r => r["First Name"] || r["Client ID"])
          .map(r => flatRowToCustomer(r));
      }

      if (wb.SheetNames.includes("Aspiring Clients")) {
        const aspRows: any[] = XLSX.utils.sheet_to_json(wb.Sheets["Aspiring Clients"]);
        aspiringClients = aspRows
          .filter(r => r["Name"] || r["ID"])
          .map(r => ({
            id: String(r["ID"] || `asp_${Date.now()}_${Math.random()}`),
            name: String(r["Name"] || "Prospective Lead"),
            contactInfo: String(r["Contact Info"] || ""),
            sourceOfInquiry: String(r["Source of Inquiry"] || "Other"),
            serviceInterestedIn: String(r["Service / Product Interested"] || "Custom Apparel"),
            dateContacted: String(r["Date Contacted"] || new Date().toISOString().split("T")[0]),
            followUpDate: String(r["Follow-up Date"] || new Date().toISOString().split("T")[0]),
            status: (r["Status"] || "New Inquiry") as any,
            assignedUser: String(r["Assigned User"] || "Master Administrator"),
            notes: String(r["Notes"] || "")
          }));
      }

      if (wb.SheetNames.includes("Luxe Inventory")) {
        const invRows: any[] = XLSX.utils.sheet_to_json(wb.Sheets["Luxe Inventory"]);
        inventory = invRows
          .filter(r => r["Book Title"] || r["Item ID"])
          .map(r => {
            const inStore = Number(r["In Store Stock"]) || 0;
            const office = Number(r["Office Stock"]) || 0;
            const total = Number(r["Total Quantity"]) || (inStore + office);
            return {
              id: String(r["Item ID"] || `LUX-${Math.floor(100 + Math.random() * 900)}`),
              title: String(r["Book Title"] || "Luxury Book"),
              category: String(r["Category"] || "Mindset & Wealth"),
              quantity: total,
              inStore,
              office,
              sellingPrice: Number(r["Selling Price (JMD)"]) || 5000,
              dateAdded: String(r["Date Added"] || new Date().toISOString().split("T")[0]),
              salesHistory: [],
              rankingStatus: (r["Ranking Status"] || "Healthy") as any,
              bookRank: (r["Book Rank"] || "Standard") as any
            };
          });
      }

      if (clients.length === 0 && aspiringClients.length === 0 && inventory.length === 0) {
        return { isValid: false, rawPayload: null, error: "No recognizable clients, aspiring leads, or inventory rows found in Excel sheet." };
      }

      const payload = {
        version: "2.1.0",
        backupId,
        clients,
        aspiringClients,
        inventory,
        createdBy,
        notes
      };

      const totalBooks = inventory.reduce((acc, item) => acc + (item.quantity ?? ((item.inStore ?? 0) + (item.office ?? 0))), 0);

      return {
        isValid: true,
        version: "2.1.0 (Excel Import)",
        backupId,
        backupDate: new Date().toLocaleDateString(),
        createdBy,
        notes,
        itemCounts: { clients: clients.length, aspiringClients: aspiringClients.length, inventory: inventory.length, users: 0, totalBooks },
        rawPayload: payload
      };
    }

    return { isValid: false, rawPayload: null, error: "Unsupported file format. Please upload a .xlsx Excel or .json backup file." };
  } catch (err: any) {
    return { isValid: false, rawPayload: null, error: `Validation failed: ${err.message || String(err)}` };
  }
}

export interface ClientExportSummary {
  totalClients: number;
  platinumCount: number;
  goldCount: number;
  silverCount: number;
  fileName: string;
  format: "xlsx" | "json";
}

// Dedicated Client Database Export Function (V2.1)
export function exportClientDatabase(
  clients: Client[],
  fileFormat: "xlsx" | "json" = "xlsx",
  createdBy: string = "Master Administrator"
): ClientExportSummary {
  let targetClients = Array.isArray(clients) && clients.length > 0 ? clients : [];
  if (targetClients.length === 0) {
    try {
      const stored = localStorage.getItem("ceo_librarium_crm_customers") || localStorage.getItem("ceo_client_management_data");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          targetClients = parsed;
        }
      }
    } catch (e) {
      console.error("Error reading client data for export:", e);
    }
  }
  if (targetClients.length === 0) {
    targetClients = INITIAL_CLIENTS;
  }

  const now = new Date();
  const dateIso = now.toISOString().split("T")[0]; // e.g. 2026-07-24
  const count = targetClients.length;
  const fileName = `CEO_Lifestyle_Client_Database_${count}_Clients_V2.1_${dateIso}.${fileFormat}`;

  const platinumCount = targetClients.filter(c => c.tier === "Platinum").length;
  const goldCount = targetClients.filter(c => c.tier === "Gold").length;
  const silverCount = targetClients.filter(c => c.tier === "Silver").length;

  if (fileFormat === "xlsx") {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Export Summary Report
    const summaryRows = [
      { "Category": "CEO LIFESTYLE MANAGEMENT - CLIENT DATABASE EXPORT", "Value": "" },
      { "Category": "Export Date", "Value": dateIso },
      { "Category": "Export Time", "Value": now.toLocaleTimeString() },
      { "Category": "Exported By User", "Value": createdBy },
      { "Category": "Total Clients Exported", "Value": count },
      { "Category": "Platinum Tier Clients", "Value": platinumCount },
      { "Category": "Gold Tier Clients", "Value": goldCount },
      { "Category": "Silver Tier Clients", "Value": silverCount },
      { "Category": "Export Compatibility", "Value": "V2.1 Universal Import & Restore Compatible" }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Export Summary");

    // Sheet 2: Synced Client Profiles
    const flatClients = targetClients.map(c => customerToFlatRow(c));
    const wsClients = XLSX.utils.json_to_sheet(flatClients.length > 0 ? flatClients : [{ "Notice": "No client records present" }]);
    XLSX.utils.book_append_sheet(wb, wsClients, "Client Profiles");

    // Sheet 3: Embedded Client Payload JSON for 100% loss-less system restore
    const rawJsonString = JSON.stringify({
      version: "2.1.0",
      exportType: "ClientDatabase",
      backupId: `CLIENTS-${dateIso.replace(/-/g, "")}`,
      backupDate: dateIso,
      createdBy,
      clients: targetClients
    });
    const CHUNK_SIZE = 30000;
    const jsonChunks: { "Chunk Index": number; "JSON Payload Chunk": string }[] = [];
    for (let i = 0; i < rawJsonString.length; i += CHUNK_SIZE) {
      jsonChunks.push({
        "Chunk Index": Math.floor(i / CHUNK_SIZE),
        "JSON Payload Chunk": rawJsonString.substring(i, i + CHUNK_SIZE)
      });
    }
    const wsJson = XLSX.utils.json_to_sheet(jsonChunks);
    XLSX.utils.book_append_sheet(wb, wsJson, "Backup System Payload JSON");

    XLSX.writeFile(wb, fileName);
  } else {
    // JSON export format
    const payload = {
      version: "2.1.0",
      exportType: "ClientDatabase",
      backupId: `CLIENTS-${dateIso.replace(/-/g, "")}`,
      backupDate: dateIso,
      timestamp: now.toISOString(),
      createdBy,
      summary: {
        totalClients: count,
        platinumCount,
        goldCount,
        silverCount
      },
      clients: targetClients
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // Record in backup history
  const record: BackupRecord = {
    id: `client_exp_${Date.now()}`,
    backupId: `CLIENTS-${dateIso.replace(/-/g, "")}`,
    date: `${dateIso} ${now.toLocaleTimeString()}`,
    createdBy,
    version: "2.1.0 (Client Export)",
    fileFormat: fileFormat === "xlsx" ? "XLSX" : "JSON",
    fileName,
    notes: `Exported ${count} client profiles (${platinumCount} Platinum, ${goldCount} Gold, ${silverCount} Silver)`
  };
  recordBackupInHistory(record);
  logBackupActivity("Backup Created", createdBy, record.backupId, record.notes);

  return {
    totalClients: count,
    platinumCount,
    goldCount,
    silverCount,
    fileName,
    format: fileFormat
  };
}

