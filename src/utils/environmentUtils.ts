import { Client, LuxeBookInventoryItem, SystemSettings, AspiringClient, BusinessEvent, SavedQuotation, OperationsOrder } from "../types";
import { 
  INITIAL_CLIENTS, 
  INITIAL_INVENTORY, 
  INITIAL_ASPIRING_CLIENTS, 
  INITIAL_QUOTATIONS, 
  INITIAL_BUSINESS_EVENTS,
  INITIAL_OPERATIONS_ORDERS
} from "../data/mockData";
import { getSystemSettings } from "./settingsHelper";
import { getClientTierRegister } from "./clientTierUtils";

export type EnvironmentType = "PRODUCTION";

// Get current environment (standard production operational system)
export function getCurrentEnvironment(): string {
  return "PRODUCTION";
}

// Set active environment (kept for compatibility)
export function setCurrentEnvironment(_env?: string): void {
  window.dispatchEvent(new CustomEvent("ceo_environment_changed"));
}

// Storage Key Map generator based on canonical production keys
function getStorageKey(baseKey: string, _env?: any): string {
  return baseKey;
}

// Load Clients for system database
export function loadEnvironmentClients(_env?: any): Client[] {
  if (typeof window !== "undefined" && localStorage.getItem("ceo_clients_cleared") === "true") {
    return [];
  }
  const key = "ceo_client_management_data";
  const legacyKey = "ceo_librarium_crm_customers";

  try {
    const raw = localStorage.getItem(key) || localStorage.getItem(legacyKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (parsed.length === 0 && localStorage.getItem("ceo_clients_cleared") === "true") {
          return [];
        }
        if (parsed.length > 0) {
          return parsed.map((c: any) => ({
            ...c,
            communicationStatus: c.communicationStatus || "Unknown"
          }));
        }
      }
    }
  } catch (e) {
    console.error("Error reading clients database", e);
  }

  // Baseline system data
  const normalized = INITIAL_CLIENTS.map(c => ({
    ...c,
    communicationStatus: c.communicationStatus || "Unknown"
  }));
  localStorage.setItem(key, JSON.stringify(normalized));
  return normalized;
}

// Save Clients to system database
export function saveEnvironmentClients(clients: Client[], _env?: any): void {
  const key = "ceo_client_management_data";
  localStorage.setItem(key, JSON.stringify(clients));
  localStorage.setItem("ceo_librarium_crm_customers", JSON.stringify(clients));
  if (clients.length > 0) {
    localStorage.removeItem("ceo_clients_cleared");
  }
}

// Load Aspiring Clients
export function loadEnvironmentAspiringClients(_env?: any): AspiringClient[] {
  if (typeof window !== "undefined" && localStorage.getItem("ceo_aspiring_clients_cleared") === "true") {
    return [];
  }
  const key = "ceo_aspiring_clients_data";

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (parsed.length === 0 && localStorage.getItem("ceo_aspiring_clients_cleared") === "true") {
          return [];
        }
        if (parsed.length > 0) return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading aspiring clients", e);
  }

  localStorage.setItem(key, JSON.stringify(INITIAL_ASPIRING_CLIENTS));
  return INITIAL_ASPIRING_CLIENTS;
}

// Save Aspiring Clients
export function saveEnvironmentAspiringClients(aspiring: AspiringClient[], _env?: any): void {
  const key = "ceo_aspiring_clients_data";
  localStorage.setItem(key, JSON.stringify(aspiring));
  localStorage.setItem("ceo_aspiring_clients", JSON.stringify(aspiring));
  if (aspiring.length > 0) {
    localStorage.removeItem("ceo_aspiring_clients_cleared");
  }
}

// Load Inventory
export function loadEnvironmentInventory(_env?: any): LuxeBookInventoryItem[] {
  if (typeof window !== "undefined" && localStorage.getItem("ceo_book_inventory_cleared") === "true") {
    return [];
  }
  const key = "ceo_luxe_book_inventory";

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (parsed.length === 0 && localStorage.getItem("ceo_book_inventory_cleared") === "true") {
          return [];
        }
        if (parsed.length > 0) return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading inventory", e);
  }

  localStorage.setItem(key, JSON.stringify(INITIAL_INVENTORY));
  return INITIAL_INVENTORY;
}

// Save Inventory
export function saveEnvironmentInventory(inventory: LuxeBookInventoryItem[], _env?: any): void {
  const key = "ceo_luxe_book_inventory";
  localStorage.setItem(key, JSON.stringify(inventory));
  localStorage.setItem("luxe_book_inventory", JSON.stringify(inventory));
  if (inventory.length > 0) {
    localStorage.removeItem("ceo_book_inventory_cleared");
  }
}

// Load Quotations
export function loadEnvironmentQuotations(_env?: any): SavedQuotation[] {
  const key = "ceo_saved_quotations";

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Error loading quotations", e);
  }

  localStorage.setItem(key, JSON.stringify(INITIAL_QUOTATIONS));
  return INITIAL_QUOTATIONS as SavedQuotation[];
}

// Save Quotations
export function saveEnvironmentQuotations(quotes: SavedQuotation[], _env?: any): void {
  const key = "ceo_saved_quotations";
  localStorage.setItem(key, JSON.stringify(quotes));
}

// Load Business Events
export function loadEnvironmentBusinessEvents(_env?: any): BusinessEvent[] {
  const key = "ceo_business_events";

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Error loading business events", e);
  }

  localStorage.setItem(key, JSON.stringify(INITIAL_BUSINESS_EVENTS));
  return INITIAL_BUSINESS_EVENTS as BusinessEvent[];
}

// Save Business Events
export function saveEnvironmentBusinessEvents(events: BusinessEvent[], _env?: any): void {
  const key = "ceo_business_events";
  localStorage.setItem(key, JSON.stringify(events));
}

import { normalizeOperationsOrder } from "./orderNumberUtils";

// Load Operations Orders
export function loadEnvironmentOperationsOrders(_env?: any): OperationsOrder[] {
  const key = "ceo_operations_orders";

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((o: any) => normalizeOperationsOrder(o, parsed));
      }
    }
  } catch (e) {
    console.error("Error loading operations orders", e);
  }

  const normalizedInit = INITIAL_OPERATIONS_ORDERS.map(o => normalizeOperationsOrder(o, INITIAL_OPERATIONS_ORDERS));
  localStorage.setItem(key, JSON.stringify(normalizedInit));
  return normalizedInit;
}

// Save Operations Orders
export function saveEnvironmentOperationsOrders(orders: OperationsOrder[], _env?: any): void {
  const key = "ceo_operations_orders";
  localStorage.setItem(key, JSON.stringify(orders));
}

// Load Client Tier Register
export function loadEnvironmentClientTierRegister(_env?: any): any[] {
  const key = "ceo_client_tier_register";

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Error loading tier register", e);
  }

  const clients = loadEnvironmentClients();
  const register = getClientTierRegister(clients);
  localStorage.setItem(key, JSON.stringify(register));
  return register;
}

// Save Client Tier Register
export function saveEnvironmentClientTierRegister(register: any[], _env?: any): void {
  const key = "ceo_client_tier_register";
  localStorage.setItem(key, JSON.stringify(register));
}

// Load System Settings
export function loadEnvironmentSettings(_env?: any): SystemSettings {
  const key = "librarium_system_settings";

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return { ...getSystemSettings(), ...parsed };
    }
  } catch (e) {
    console.error("Error loading settings", e);
  }

  return getSystemSettings();
}

// Save System Settings
export function saveEnvironmentSettings(settings: SystemSettings, _env?: any): void {
  const key = "librarium_system_settings";
  localStorage.setItem(key, JSON.stringify(settings));
}

// Re-seed system dataset to baseline records
export function resetSystemDataset(): void {
  saveEnvironmentClients(INITIAL_CLIENTS);
  saveEnvironmentAspiringClients(INITIAL_ASPIRING_CLIENTS);
  saveEnvironmentInventory(INITIAL_INVENTORY);
  saveEnvironmentQuotations(INITIAL_QUOTATIONS as SavedQuotation[]);
  saveEnvironmentBusinessEvents(INITIAL_BUSINESS_EVENTS as BusinessEvent[]);
  saveEnvironmentOperationsOrders(INITIAL_OPERATIONS_ORDERS);
  saveEnvironmentClientTierRegister(getClientTierRegister(INITIAL_CLIENTS));
  saveEnvironmentSettings(getSystemSettings());
  
  window.dispatchEvent(new CustomEvent("ceo_environment_changed"));
}

// Aliases for backwards compatibility
export const resetStressTestDataset = resetSystemDataset;
export function clearEnvironmentData(_env?: any): void {
  resetSystemDataset();
}

