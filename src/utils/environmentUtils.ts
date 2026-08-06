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

export type EnvironmentType = "LIVE" | "STRESS_TEST";

const ACTIVE_ENV_KEY = "ceo_active_environment";

// Get current environment (defaults to STRESS_TEST as specified)
export function getCurrentEnvironment(): EnvironmentType {
  const stored = localStorage.getItem(ACTIVE_ENV_KEY);
  if (stored === "LIVE") return "LIVE";
  return "STRESS_TEST";
}

// Set active environment
export function setCurrentEnvironment(env: EnvironmentType): void {
  localStorage.setItem(ACTIVE_ENV_KEY, env);
  // Dispatch custom window event so all components update seamlessly
  window.dispatchEvent(new CustomEvent("ceo_environment_changed", { detail: { environment: env } }));
}

// Storage Key Map generator based on active or specified environment
function getStorageKey(baseKey: string, env?: EnvironmentType): string {
  const currentEnv = env || getCurrentEnvironment();
  if (currentEnv === "LIVE") {
    return `live_${baseKey}`;
  }
  return baseKey; // STRESS_TEST uses baseline keys
}

// Load Clients for active environment
export function loadEnvironmentClients(env?: EnvironmentType): Client[] {
  const currentEnv = env || getCurrentEnvironment();
  const key = getStorageKey("ceo_client_management_data", currentEnv);
  const legacyKey = currentEnv === "STRESS_TEST" ? "ceo_librarium_crm_customers" : null;

  try {
    const raw = localStorage.getItem(key) || (legacyKey ? localStorage.getItem(legacyKey) : null);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c: any) => ({
          ...c,
          communicationStatus: c.communicationStatus || "Unknown"
        }));
      }
    }
  } catch (e) {
    console.error("Error reading environment clients", e);
  }

  // Fallbacks:
  if (currentEnv === "STRESS_TEST") {
    // Save initial stress test dataset
    const normalized = INITIAL_CLIENTS.map(c => ({
      ...c,
      communicationStatus: c.communicationStatus || "Unknown"
    }));
    localStorage.setItem(key, JSON.stringify(normalized));
    return normalized;
  } else {
    // Pristine Live Mode defaults to empty or clean list
    return [];
  }
}

// Save Clients for active environment
export function saveEnvironmentClients(clients: Client[], env?: EnvironmentType): void {
  const key = getStorageKey("ceo_client_management_data", env);
  localStorage.setItem(key, JSON.stringify(clients));
  if ((env || getCurrentEnvironment()) === "STRESS_TEST") {
    localStorage.setItem("ceo_librarium_crm_customers", JSON.stringify(clients));
  }
}

// Load Aspiring Clients for active environment
export function loadEnvironmentAspiringClients(env?: EnvironmentType): AspiringClient[] {
  const currentEnv = env || getCurrentEnvironment();
  const key = getStorageKey("ceo_aspiring_clients_data", currentEnv);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Error loading aspiring clients", e);
  }

  if (currentEnv === "STRESS_TEST") {
    localStorage.setItem(key, JSON.stringify(INITIAL_ASPIRING_CLIENTS));
    return INITIAL_ASPIRING_CLIENTS;
  }
  return [];
}

// Save Aspiring Clients for active environment
export function saveEnvironmentAspiringClients(aspiring: AspiringClient[], env?: EnvironmentType): void {
  const key = getStorageKey("ceo_aspiring_clients_data", env);
  localStorage.setItem(key, JSON.stringify(aspiring));
}

// Load Inventory for active environment
export function loadEnvironmentInventory(env?: EnvironmentType): LuxeBookInventoryItem[] {
  const currentEnv = env || getCurrentEnvironment();
  const key = getStorageKey("ceo_luxe_book_inventory", currentEnv);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Error loading inventory", e);
  }

  if (currentEnv === "STRESS_TEST") {
    localStorage.setItem(key, JSON.stringify(INITIAL_INVENTORY));
    return INITIAL_INVENTORY;
  }
  return [];
}

// Save Inventory for active environment
export function saveEnvironmentInventory(inventory: LuxeBookInventoryItem[], env?: EnvironmentType): void {
  const key = getStorageKey("ceo_luxe_book_inventory", env);
  localStorage.setItem(key, JSON.stringify(inventory));
}

// Load Quotations for active environment
export function loadEnvironmentQuotations(env?: EnvironmentType): SavedQuotation[] {
  const currentEnv = env || getCurrentEnvironment();
  const key = getStorageKey("ceo_saved_quotations", currentEnv);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Error loading quotations", e);
  }

  if (currentEnv === "STRESS_TEST") {
    localStorage.setItem(key, JSON.stringify(INITIAL_QUOTATIONS));
    return INITIAL_QUOTATIONS as SavedQuotation[];
  }
  return [];
}

// Save Quotations for active environment
export function saveEnvironmentQuotations(quotes: SavedQuotation[], env?: EnvironmentType): void {
  const key = getStorageKey("ceo_saved_quotations", env);
  localStorage.setItem(key, JSON.stringify(quotes));
}

// Load Business Events for active environment
export function loadEnvironmentBusinessEvents(env?: EnvironmentType): BusinessEvent[] {
  const currentEnv = env || getCurrentEnvironment();
  const key = getStorageKey("ceo_business_events", currentEnv);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Error loading business events", e);
  }

  if (currentEnv === "STRESS_TEST") {
    localStorage.setItem(key, JSON.stringify(INITIAL_BUSINESS_EVENTS));
    return INITIAL_BUSINESS_EVENTS as BusinessEvent[];
  }
  return [];
}

// Save Business Events
export function saveEnvironmentBusinessEvents(events: BusinessEvent[], env?: EnvironmentType): void {
  const key = getStorageKey("ceo_business_events", env);
  localStorage.setItem(key, JSON.stringify(events));
}

// Load Operations Orders for active environment
export function loadEnvironmentOperationsOrders(env?: EnvironmentType): OperationsOrder[] {
  const currentEnv = env || getCurrentEnvironment();
  const key = getStorageKey("ceo_operations_orders", currentEnv);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Error loading operations orders", e);
  }

  if (currentEnv === "STRESS_TEST") {
    localStorage.setItem(key, JSON.stringify(INITIAL_OPERATIONS_ORDERS));
    return INITIAL_OPERATIONS_ORDERS;
  }
  return [];
}

// Save Operations Orders for active environment
export function saveEnvironmentOperationsOrders(orders: OperationsOrder[], env?: EnvironmentType): void {
  const key = getStorageKey("ceo_operations_orders", env);
  localStorage.setItem(key, JSON.stringify(orders));
}

// Load Client Tier Register
export function loadEnvironmentClientTierRegister(env?: EnvironmentType): any[] {
  const currentEnv = env || getCurrentEnvironment();
  const key = getStorageKey("ceo_client_tier_register", currentEnv);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Error loading tier register", e);
  }

  const clients = loadEnvironmentClients(currentEnv);
  const register = getClientTierRegister(clients);
  localStorage.setItem(key, JSON.stringify(register));
  return register;
}

// Save Client Tier Register
export function saveEnvironmentClientTierRegister(register: any[], env?: EnvironmentType): void {
  const key = getStorageKey("ceo_client_tier_register", env);
  localStorage.setItem(key, JSON.stringify(register));
}

// Load System Settings
export function loadEnvironmentSettings(env?: EnvironmentType): SystemSettings {
  const currentEnv = env || getCurrentEnvironment();
  const key = getStorageKey("librarium_system_settings", currentEnv);

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
export function saveEnvironmentSettings(settings: SystemSettings, env?: EnvironmentType): void {
  const key = getStorageKey("librarium_system_settings", env);
  localStorage.setItem(key, JSON.stringify(settings));
}

// Re-seed Stress Test Dataset to full default test data
export function resetStressTestDataset(): void {
  const env: EnvironmentType = "STRESS_TEST";
  saveEnvironmentClients(INITIAL_CLIENTS, env);
  saveEnvironmentAspiringClients(INITIAL_ASPIRING_CLIENTS, env);
  saveEnvironmentInventory(INITIAL_INVENTORY, env);
  saveEnvironmentQuotations(INITIAL_QUOTATIONS as SavedQuotation[], env);
  saveEnvironmentBusinessEvents(INITIAL_BUSINESS_EVENTS as BusinessEvent[], env);
  saveEnvironmentOperationsOrders(INITIAL_OPERATIONS_ORDERS, env);
  saveEnvironmentClientTierRegister(getClientTierRegister(INITIAL_CLIENTS), env);
  saveEnvironmentSettings(getSystemSettings(), env);
  
  window.dispatchEvent(new CustomEvent("ceo_environment_changed", { detail: { environment: "STRESS_TEST" } }));
}

// Clear active environment data completely
export function clearEnvironmentData(env: EnvironmentType): void {
  saveEnvironmentClients([], env);
  saveEnvironmentAspiringClients([], env);
  saveEnvironmentInventory([], env);
  saveEnvironmentQuotations([], env);
  saveEnvironmentBusinessEvents([], env);
  saveEnvironmentOperationsOrders([], env);
  saveEnvironmentClientTierRegister([], env);
  saveEnvironmentSettings(getSystemSettings(), env);

  window.dispatchEvent(new CustomEvent("ceo_environment_changed", { detail: { environment: env } }));
}
