import React, { useState, useEffect } from "react";
import { Client, LuxeBookInventoryItem, SystemSettings, AspiringClient, OperationsOrder } from "./types";
import { INITIAL_CLIENTS, INITIAL_INVENTORY, INITIAL_ASPIRING_CLIENTS, INITIAL_OPERATIONS_ORDERS } from "./data/mockData";
import { syncFamilyBirthdayReminders } from "./utils/dateHelpers";
import { getSystemSettings, saveSystemSettings } from "./utils/settingsHelper";
import Dashboard from "./components/Dashboard";
import OperationsHub from "./components/OperationsHub";
import ClientList from "./components/ClientList";
import ClientDetail from "./components/ClientDetail";
import ClientForm from "./components/ClientForm";
import ExcelManager from "./components/ExcelManager";
import MilestoneCalendar from "./components/MilestoneCalendar";
import LuxeInventory from "./components/LuxeInventory";
import UserManagement from "./components/UserManagement";
import ProductionTools from "./components/ProductionTools";
import AspiringClients from "./components/AspiringClients";
import AddAspiringClientModal from "./components/AddAspiringClientModal";
import EndSessionBackupModal from "./components/EndSessionBackupModal";
import SystemReferenceClock from "./components/SystemReferenceClock";
import { 
  getCurrentEnvironment, 
  loadEnvironmentClients, 
  saveEnvironmentClients, 
  loadEnvironmentAspiringClients, 
  saveEnvironmentAspiringClients, 
  loadEnvironmentInventory, 
  saveEnvironmentInventory, 
  loadEnvironmentSettings, 
  saveEnvironmentSettings,
  loadEnvironmentOperationsOrders,
  saveEnvironmentOperationsOrders
} from "./utils/environmentUtils";
import { 
  Users, 
  LayoutDashboard, 
  FileSpreadsheet, 
  Printer, 
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Calendar,
  X,
  CheckSquare,
  Settings,
  LogOut,
  Shield,
  Wrench,
  UserPlus,
  ClipboardList,
  Crown
} from "lucide-react";
// @ts-ignore
import spaceBg from "./assets/images/space_background_1783612418079.jpg";
import LoginScreen from "./components/LoginScreen";
import BrandingSettings from "./components/BrandingSettings";

const LOCAL_STORAGE_KEY = "ceo_librarium_crm_customers";

interface TourStep {
  title: string;
  text: string;
  tab: "dashboard" | "directory" | "excel" | "calendar" | "inventory" | "production" | "branding" | "users";
}

const TOURS: Record<string, { name: string; steps: TourStep[] }> = {
  luxe_inventory: {
    name: "Librarium Luxe Inventory Walkthrough",
    steps: [
      {
        title: "Welcome to Luxe Inventory",
        text: "This section manages all Librarium Luxe book inventory. Here you can add books, view individual item status, and track historical sales movements.",
        tab: "inventory"
      },
      {
        title: "Inventory Level Tracking",
        text: "Stock is separated into 'In Store' and 'Office' levels. Low-stock levels trigger visual indicators (e.g. Restock, Urgent Restock) based on your system-wide thresholds.",
        tab: "inventory"
      },
      {
        title: "Accessing Spreadsheet Imports",
        text: "You can perform bulk inventory adjustments using the Excel Exchange module. Download our inventory ledger template, edit it, and upload changes easily.",
        tab: "excel"
      }
    ]
  },
  dashboard_carousel: {
    name: "Interactive Dashboard Carousel Walkthrough",
    steps: [
      {
        title: "Welcome to the Interactive Dashboard Carousel",
        text: "This is the core viewing area of your Dashboard Command Center. Selected large modules are consolidated into a horizontal slider to save vertical space.",
        tab: "dashboard"
      },
      {
        title: "Navigation Controls",
        text: "Use the Left and Right arrows at the top right of the carousel to slide smoothly between Luxe Inventory, Book Cost Calculator, Location Cost Calculator, and the Interactive Agenda.",
        tab: "dashboard"
      },
      {
        title: "Dot Indicators & Active Status",
        text: "The indicators displaying '● ○ ○ ○' show which section you are currently viewing. Click any individual dot to jump to that module instantly.",
        tab: "dashboard"
      }
    ]
  },
  excel_exchange: {
    name: "Excel Exchange Walkthrough",
    steps: [
      {
        title: "Welcome to Excel Exchange",
        text: "This powerful data synchronization system processes bulk customer CRM databases and inventory ledger sheets safely.",
        tab: "excel"
      },
      {
        title: "Template Preparation",
        text: "Choose either 'Customers Template' or 'Inventory Template' to download the correct schema format. It is crucial to preserve the header column names.",
        tab: "excel"
      },
      {
        title: "Smart Validation & Upload",
        text: "Drag & drop or upload your completed Excel sheet. The engine performs real-time verification to detect duplicate IDs or invalid ranks before committing any changes.",
        tab: "excel"
      }
    ]
  }
};

export default function App() {
  // State for client list
  const [clients, setClients] = useState<Client[]>([]);

  // State for Librarium Luxe Inventory
  const [inventory, setInventory] = useState<LuxeBookInventoryItem[]>([]);

  // State for Operations Orders
  const [operationsOrders, setOperationsOrders] = useState<OperationsOrder[]>(() => {
    const activeEnv = getCurrentEnvironment();
    return loadEnvironmentOperationsOrders(activeEnv);
  });

  const handleSaveOperationsOrder = (order: OperationsOrder) => {
    setOperationsOrders(prev => {
      const existingIdx = prev.findIndex(o => o.id === order.id);
      let updated: OperationsOrder[];
      if (existingIdx !== -1) {
        updated = [...prev];
        updated[existingIdx] = order;
      } else {
        updated = [order, ...prev];
      }
      const activeEnv = getCurrentEnvironment();
      saveEnvironmentOperationsOrders(updated, activeEnv);
      return updated;
    });
  };

  const handleDeleteOperationsOrder = (orderId: string) => {
    setOperationsOrders(prev => {
      const updated = prev.filter(o => o.id !== orderId);
      const activeEnv = getCurrentEnvironment();
      saveEnvironmentOperationsOrders(updated, activeEnv);
      return updated;
    });
  };
  
  // Tab state: "dashboard" | "operations" | "directory" | "aspiring" | "excel" | "calendar" | "inventory" | "production" | "branding" | "users"
  const [activeTab, setActiveTab] = useState<"dashboard" | "operations" | "directory" | "aspiring" | "excel" | "calendar" | "inventory" | "production" | "branding" | "users">("dashboard");
  const [autoOpenAddAspiring, setAutoOpenAddAspiring] = useState(false);
  const [isGlobalAddAspiringOpen, setIsGlobalAddAspiringOpen] = useState(false);

  // Always scroll to top when active tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeTab]);

  const handleNavigateToAspiringAdd = () => {
    setIsGlobalAddAspiringOpen(true);
  };

  // Settings dropdown state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("ceo_admin_authenticated") === "true";
  });

  // Current Logged-in User Info
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem("ceo_user_role") || "Master Administrator";
  });

  const [userFullName, setUserFullName] = useState(() => {
    return localStorage.getItem("ceo_user_fullname") || "Master Administrator";
  });

  const [userUsername, setUserUsername] = useState(() => {
    return localStorage.getItem("ceo_user_username") || "admin";
  });

  // Master Admin Credentials
  const [masterUsername, setMasterUsername] = useState(() => {
    return localStorage.getItem("ceo_admin_username") || "admin";
  });

  const handleUpdateMasterCredentials = (newUser: string, newPass: string) => {
    localStorage.setItem("ceo_admin_username", newUser);
    localStorage.setItem("ceo_admin_password", newPass);
    setMasterUsername(newUser);
    if (userRole === "Master Administrator") {
      setUserUsername(newUser);
      localStorage.setItem("ceo_user_username", newUser);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setUserRole(localStorage.getItem("ceo_user_role") || "Master Administrator");
    setUserFullName(localStorage.getItem("ceo_user_fullname") || "Master Administrator");
    setUserUsername(localStorage.getItem("ceo_user_username") || "admin");
  };
  
  // System Settings state
  const [settings, setSettings] = useState<SystemSettings>(() => getSystemSettings());

  const handleUpdateSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    saveSystemSettings(newSettings);
    saveEnvironmentSettings(newSettings);
    
    // Sync related legacy states
    if (newSettings.appBg !== appBg) {
      setAppBg(newSettings.appBg);
      localStorage.setItem("ceo_app_background_base64", newSettings.appBg);
    }
    if (newSettings.authBg !== authBg) {
      setAuthBg(newSettings.authBg);
      localStorage.setItem("ceo_auth_background_base64", newSettings.authBg);
    }
    if (newSettings.masterUsername !== masterUsername) {
      setMasterUsername(newSettings.masterUsername);
      localStorage.setItem("ceo_admin_username", newSettings.masterUsername);
    }
  };

  // Custom backgrounds
  const [appBg, setAppBg] = useState(() => {
    return localStorage.getItem("ceo_app_background_base64") || "";
  });
  
  const [authBg, setAuthBg] = useState(() => {
    return localStorage.getItem("ceo_auth_background_base64") || "";
  });

  const handleUpdateAppBg = (base64: string) => {
    setAppBg(base64);
    localStorage.setItem("ceo_app_background_base64", base64);
    setSettings(prev => {
      const updated = { ...prev, appBg: base64 };
      saveSystemSettings(updated);
      return updated;
    });
  };

  const handleUpdateAuthBg = (base64: string) => {
    setAuthBg(base64);
    localStorage.setItem("ceo_auth_background_base64", base64);
    setSettings(prev => {
      const updated = { ...prev, authBg: base64 };
      saveSystemSettings(updated);
      return updated;
    });
  };

  const handleResetAppBg = () => {
    setAppBg("");
    localStorage.removeItem("ceo_app_background_base64");
    setSettings(prev => {
      const updated = { ...prev, appBg: "" };
      saveSystemSettings(updated);
      return updated;
    });
  };

  const handleResetAuthBg = () => {
    setAuthBg("");
    localStorage.removeItem("ceo_auth_background_base64");
    setSettings(prev => {
      const updated = { ...prev, authBg: "" };
      saveSystemSettings(updated);
      return updated;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("ceo_admin_authenticated");
    localStorage.removeItem("ceo_user_role");
    localStorage.removeItem("ceo_user_fullname");
    localStorage.removeItem("ceo_user_username");
    setIsAuthenticated(false);
    setUserRole("Master Administrator");
    setUserFullName("Master Administrator");
    setUserUsername("admin");
    setActiveTab("dashboard");
  };
  
  // Selected client for detail view
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isEndSessionModalOpen, setIsEndSessionModalOpen] = useState(false);

  // Aspiring Clients state
  const [aspiringClients, setAspiringClients] = useState<AspiringClient[]>(() => {
    const stored = localStorage.getItem("ceo_aspiring_clients");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_ASPIRING_CLIENTS.length) {
          return parsed;
        }
      } catch (err) {
        console.error(err);
      }
    }
    return INITIAL_ASPIRING_CLIENTS;
  });

  useEffect(() => {
    localStorage.setItem("ceo_aspiring_clients", JSON.stringify(aspiringClients));
  }, [aspiringClients]);

  const handleConvertToClient = (asp: AspiringClient) => {
    const nameParts = asp.name.trim().split(" ");
    const firstName = nameParts[0] || "Prospect";
    const lastName = nameParts.slice(1).join(" ") || "Client";
    
    let phone = asp.phoneNumber || "";
    let email = asp.email || "";
    let instagram = asp.instagramUsername || "";

    if (!phone && !email && asp.contactInfo) {
      if (asp.contactInfo.includes("|")) {
        const parts = asp.contactInfo.split("|");
        phone = parts[0].trim();
        email = parts[1].trim();
      } else if (asp.contactInfo.includes("@")) {
        email = asp.contactInfo.trim();
      } else {
        phone = asp.contactInfo.trim();
      }
    }

    const newClientId = `CLI-${Math.floor(1000 + Math.random() * 9000)}`;

    const newClient: Client = {
      id: newClientId,
      firstName,
      lastName,
      gender: "Other",
      occupation: "Executive Prospect",
      drive: "Yes",
      tier: "Silver",
      homeBrand: "CEO Printing Services",
      marketingPermission: "Yes",
      deactivated: false,
      preferredCommunication: (asp.preferredContactMethod || "Phone") as any,
      lastContactedDate: new Date().toISOString().split("T")[0],
      contact: {
        phoneNumber: phone || "+1 (876) 555-0000",
        email: email || `${firstName.toLowerCase()}@client.jm`,
        instagramUsername: instagram,
        city: "Kingston",
        parish: "St. Andrew",
        country: "Jamaica",
        deliveryAddress: "Kingston, Jamaica",
        deliveryCountry: "Jamaica"
      },
      profile: {
        motherName: "",
        fatherName: "",
        wifeName: "",
        husbandName: "",
        children: [],
        pets: "",
        personalNotes: `Converted from Aspiring Client Lead on ${new Date().toLocaleDateString()}.\nSource: ${asp.sourceOfInquiry}\nInterest: ${asp.serviceInterestedIn}\nNotes: ${asp.notes}`
      },
      importantDates: [],
      history: {
        firstOrderDate: new Date().toISOString().split("T")[0],
        lastOrderDate: new Date().toISOString().split("T")[0],
        totalOrders: 0,
        productsPurchased: [asp.serviceInterestedIn],
        preferredCategories: [asp.serviceInterestedIn],
        clientPreferences: [],
        lifetimeRevenue: 0,
        averageOrderValue: 0
      },
      interests: {
        sports: {
          sport: "N/A",
          favoriteTeam: "N/A",
          teamOne: "N/A",
          teamTwo: "N/A",
          favoritePlayer: "N/A",
          nationalTeam: "N/A"
        },
        hobbies: ["Corporate Executive", "Lifestyle"],
        favoriteColors: ["Navy", "Gold"],
        giftPreferences: []
      },
      reminders: [],
      timeline: [
        {
          id: `TL-${Date.now()}`,
          type: "Conversation",
          date: new Date().toISOString().split("T")[0],
          content: `Account converted from Aspiring Client Lead (${asp.serviceInterestedIn}). Notes: ${asp.notes}`
        }
      ]
    };

    saveClients([newClient, ...clients]);
    setAspiringClients(prev => prev.map(item => item.id === asp.id ? { ...item, status: "Converted to Client" } : item));
    setSelectedClientId(newClientId);
    setActiveTab("directory");
  };
  
  // Walkthrough tour state
  const [activeTour, setActiveTour] = useState<{ id: string; currentStep: number } | null>(() => {
    const stored = localStorage.getItem("active_walkthrough_tour");
    return stored ? JSON.parse(stored) : null;
  });

  const saveActiveTour = (tour: { id: string; currentStep: number } | null) => {
    setActiveTour(tour);
    if (tour) {
      localStorage.setItem("active_walkthrough_tour", JSON.stringify(tour));
    } else {
      localStorage.removeItem("active_walkthrough_tour");
    }
  };

  const handleStartTour = (tourId: string) => {
    const tour = TOURS[tourId];
    if (!tour) return;
    saveActiveTour({ id: tourId, currentStep: 0 });
    setActiveTab(tour.steps[0].tab);
  };
  
  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Task viewing & managing state
  const [activeTaskInfo, setActiveTaskInfo] = useState<{ clientId: string; reminderId: string } | null>(null);
  const [taskEditText, setTaskEditText] = useState("");
  const [taskEditDate, setTaskEditDate] = useState("");

  useEffect(() => {
    if (activeTaskInfo) {
      const client = clients.find(c => c.id === activeTaskInfo.clientId);
      const reminder = client?.reminders.find(r => r.id === activeTaskInfo.reminderId);
      if (reminder) {
        setTaskEditText(reminder.task);
        setTaskEditDate(reminder.date);
      }
    } else {
      setTaskEditText("");
      setTaskEditDate("");
    }
  }, [activeTaskInfo, clients]);

  const handleUpdateTaskDetails = () => {
    if (!activeTaskInfo) return;
    const updated = clients.map(c => {
      if (c.id === activeTaskInfo.clientId) {
        return {
          ...c,
          reminders: c.reminders.map(r => {
            if (r.id === activeTaskInfo.reminderId) {
              return { ...r, task: taskEditText, date: taskEditDate };
            }
            return r;
          })
        };
      }
      return c;
    });
    saveClients(updated);
    setActiveTaskInfo(null);
  };

  const handleToggleTaskCompleted = () => {
    if (!activeTaskInfo) return;
    const updated = clients.map(c => {
      if (c.id === activeTaskInfo.clientId) {
        return {
          ...c,
          reminders: c.reminders.map(r => {
            if (r.id === activeTaskInfo.reminderId) {
              return { ...r, completed: !r.completed };
            }
            return r;
          })
        };
      }
      return c;
    });
    saveClients(updated);
  };

  const handleDeleteTaskFromModal = () => {
    if (!activeTaskInfo) return;
    if (window.confirm("Are you sure you want to permanently delete this task?")) {
      const updated = clients.map(c => {
        if (c.id === activeTaskInfo.clientId) {
          return {
            ...c,
            reminders: c.reminders.filter(r => r.id !== activeTaskInfo.reminderId)
          };
        }
        return c;
      });
      saveClients(updated);
      setActiveTaskInfo(null);
    }
  };

  // Initialize clients from localStorage or initial dummy data
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem("ceo_client_management_data");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_CLIENTS.length) {
          const synced = parsed.map((c: Client) => syncFamilyBirthdayReminders(c, settings));
          setClients(synced);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(synced));
          localStorage.setItem("ceo_client_management_data", JSON.stringify(synced));
        } else {
          // Upgrade or populate with full 45 profiles
          const synced = INITIAL_CLIENTS.map(c => syncFamilyBirthdayReminders(c, settings));
          setClients(synced);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(synced));
          localStorage.setItem("ceo_client_management_data", JSON.stringify(synced));
        }
      } catch (err) {
        console.error("Failed to parse stored clients, using fallback mock dataset:", err);
        const synced = INITIAL_CLIENTS.map(c => syncFamilyBirthdayReminders(c, settings));
        setClients(synced);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(synced));
        localStorage.setItem("ceo_client_management_data", JSON.stringify(synced));
      }
    } else {
      const synced = INITIAL_CLIENTS.map(c => syncFamilyBirthdayReminders(c, settings));
      setClients(synced);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(synced));
      localStorage.setItem("ceo_client_management_data", JSON.stringify(synced));
    }

    // Initialize Luxe Inventory
    const storedInv = localStorage.getItem("luxe_book_inventory");
    if (storedInv) {
      try {
        const parsed = JSON.parse(storedInv);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_INVENTORY.length) {
          const dummyIds = ["LUX-001", "LUX-002", "LUX-003", "LUX-004", "LUX-005", "LUX-006"];
          const filtered = parsed.filter((item: LuxeBookInventoryItem) => !dummyIds.includes(item.id));
          
          const seenIds = new Set<string>();
          const deduped: LuxeBookInventoryItem[] = [];
          filtered.forEach((item: LuxeBookInventoryItem) => {
            if (!item.id) return;
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              deduped.push(item);
            } else {
              let newId = item.id;
              while (seenIds.has(newId)) {
                newId = `LUX-${Math.floor(100 + Math.random() * 900)}`;
              }
              seenIds.add(newId);
              deduped.push({ ...item, id: newId });
            }
          });

          if (deduped.length >= INITIAL_INVENTORY.length) {
            setInventory(deduped);
          } else {
            setInventory(INITIAL_INVENTORY);
            localStorage.setItem("luxe_book_inventory", JSON.stringify(INITIAL_INVENTORY));
          }
        } else {
          setInventory(INITIAL_INVENTORY);
          localStorage.setItem("luxe_book_inventory", JSON.stringify(INITIAL_INVENTORY));
        }
      } catch (err) {
        console.error("Failed to parse stored inventory, using fallback:", err);
        setInventory(INITIAL_INVENTORY);
        localStorage.setItem("luxe_book_inventory", JSON.stringify(INITIAL_INVENTORY));
      }
    } else {
      setInventory(INITIAL_INVENTORY);
      localStorage.setItem("luxe_book_inventory", JSON.stringify(INITIAL_INVENTORY));
    }
  }, []);

  // Listen for environment changes (LIVE vs STRESS_TEST vs Reset)
  useEffect(() => {
    const handleEnvChange = () => {
      const activeEnv = getCurrentEnvironment();
      setOperationsOrders(loadEnvironmentOperationsOrders(activeEnv));
      setClients(loadEnvironmentClients(activeEnv));
      setAspiringClients(loadEnvironmentAspiringClients(activeEnv));
      setInventory(loadEnvironmentInventory(activeEnv));
    };
    window.addEventListener("ceo_environment_changed", handleEnvChange);
    return () => window.removeEventListener("ceo_environment_changed", handleEnvChange);
  }, []);

  // Recalculate client milestones automatically when reminder settings change
  useEffect(() => {
    if (clients.length > 0) {
      const updated = clients.map(c => syncFamilyBirthdayReminders(c, settings));
      setClients(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem("ceo_client_management_data", JSON.stringify(updated));
    }
  }, [
    settings.birthdayReminderDays,
    settings.anniversaryReminderDays,
    settings.proposalAnniversaryReminderDays,
    settings.customMilestoneReminderDays
  ]);

  // Save Luxe Inventory helper
  const saveInventory = (updatedList: LuxeBookInventoryItem[]) => {
    setInventory(updatedList);
    localStorage.setItem("luxe_book_inventory", JSON.stringify(updatedList));
    saveEnvironmentInventory(updatedList);
  };

  // Restore application backup
  const handleRestoreBackup = (backupData: {
    clients?: Client[];
    aspiringClients?: AspiringClient[];
    inventory?: LuxeBookInventoryItem[];
    settings?: SystemSettings;
    users?: any[];
    masterUsername?: string;
    masterPassword?: string;
    guideLogs?: any[];
    businessEvents?: any[];
    savedQuotations?: any[];
    appBg?: string;
    authBg?: string;
    backupHistory?: any[];
  }) => {
    if (backupData.clients) {
      saveClients(backupData.clients);
    }
    if (backupData.aspiringClients) {
      setAspiringClients(backupData.aspiringClients);
      localStorage.setItem("ceo_aspiring_clients", JSON.stringify(backupData.aspiringClients));
    }
    if (backupData.inventory) {
      saveInventory(backupData.inventory);
    }
    if (backupData.settings) {
      handleUpdateSettings(backupData.settings);
    }
    if (backupData.users) {
      localStorage.setItem("ceo_application_users", JSON.stringify(backupData.users));
    }
    if (backupData.businessEvents) {
      localStorage.setItem("ceo_crm_business_events", JSON.stringify(backupData.businessEvents));
    }
    if (backupData.savedQuotations) {
      localStorage.setItem("ceo_saved_quotations", JSON.stringify(backupData.savedQuotations));
    }
    if (backupData.masterUsername && backupData.masterPassword) {
      handleUpdateMasterCredentials(backupData.masterUsername, backupData.masterPassword);
    }
    if (backupData.guideLogs) {
      localStorage.setItem("ceo_admin_guide_logs", JSON.stringify(backupData.guideLogs));
    }
    if (backupData.appBg) {
      setAppBg(backupData.appBg);
      localStorage.setItem("ceo_app_background_base64", backupData.appBg);
    }
    if (backupData.authBg) {
      setAuthBg(backupData.authBg);
      localStorage.setItem("ceo_auth_background_base64", backupData.authBg);
    }
    if (backupData.backupHistory) {
      localStorage.setItem("ceo_backup_history", JSON.stringify(backupData.backupHistory));
    }
    window.dispatchEvent(new Event("storage"));
  };

  // Save clients to localStorage whenever changed
  const saveClients = (updatedList: Client[]) => {
    setClients(updatedList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    localStorage.setItem("ceo_client_management_data", JSON.stringify(updatedList));
    saveEnvironmentClients(updatedList);
  };

  // Select client and force directory tab open
  const handleSelectClient = (id: string) => {
    setSelectedClientId(id);
    setIsAdding(false);
    setIsEditing(false);
    setActiveTab("directory");
  };

  // Add new client form toggle
  const handleAddNewClientTrigger = () => {
    setSelectedClientId(null);
    setIsEditing(false);
    setIsAdding(true);
  };

  // Edit client form trigger
  const handleEditClientTrigger = (client: Client) => {
    setIsAdding(false);
    setIsEditing(true);
  };

  // Save / Update a client
  const handleSaveClient = (savedClient: Client) => {
    const syncedClient = syncFamilyBirthdayReminders(savedClient, settings);
    let updatedList = [...clients];
    const index = clients.findIndex(c => c.id === syncedClient.id);
    
    if (index !== -1) {
      // Overwrite/update existing
      updatedList[index] = syncedClient;
    } else {
      // Append new
      updatedList.push(syncedClient);
    }
    
    saveClients(updatedList);
    setSelectedClientId(syncedClient.id);
    setIsEditing(false);
    setIsAdding(false);
  };

  // Deactivate a client profile (no permanent deletion to protect historical records)
  const handleDeleteClient = (clientId: string) => {
    const updatedList = clients.map(c => {
      if (c.id === clientId) {
        return { ...c, deactivated: true };
      }
      return c;
    });
    saveClients(updatedList);
    setSelectedClientId(null);
    setIsEditing(false);
    setIsAdding(false);
  };

  // Import clients from XLSX Spreadsheet
  const handleImportClients = (importedList: Client[]) => {
    let updatedList = [...clients];
    
    importedList.forEach(imported => {
      const checkId = imported.id.trim().toLowerCase();
      const checkName = `${imported.firstName.trim()} ${imported.lastName.trim()}`.toLowerCase();
      const checkPhone = imported.contact.phoneNumber.trim().replace(/\D/g, "");
      const checkEmail = imported.contact.email.trim().toLowerCase();

      // Find index by ID, Name, Phone, or Email to prevent any duplicate creation
      const index = updatedList.findIndex(existing => {
        const existingId = existing.id.toLowerCase();
        const existingName = `${existing.firstName.trim()} ${existing.lastName.trim()}`.toLowerCase();
        const existingPhone = existing.contact.phoneNumber.trim().replace(/\D/g, "");
        const existingEmail = existing.contact.email.trim().toLowerCase();

        return (
          existingId === checkId ||
          existingName === checkName ||
          (checkPhone && existingPhone === checkPhone) ||
          (checkEmail && existingEmail === checkEmail)
        );
      });

      if (index !== -1) {
        // Merge timeline history if possible, keep old reminders or append
        const existing = updatedList[index];
        updatedList[index] = {
          ...imported,
          id: existing.id, // Preserve existing ID
          timeline: [...imported.timeline, ...existing.timeline].slice(0, 15),
          reminders: [...imported.reminders, ...existing.reminders]
        };
      } else {
        updatedList.push(imported);
      }
    });

    saveClients(updatedList);
  };

  // Retrieve current active client details
  const activeClient = clients.find(c => c.id === selectedClientId) || null;

  // Gated behind premium Apple-inspired authentication gateway
  if (!isAuthenticated) {
    return (
      <LoginScreen 
        onLoginSuccess={handleLoginSuccess} 
        backgroundUrl={authBg || spaceBg} 
      />
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col text-slate-800 antialiased selection:bg-slate-900 selection:text-white relative bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${appBg || spaceBg})` }}
    >
      {/* Dimmer overlay for elegant, high-contrast cosmos aesthetic */}
      <div className="fixed inset-0 bg-slate-950/35 backdrop-blur-[1px] pointer-events-none z-0" />
      
      {/* Dynamic Global CSS for smooth keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Main Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/70 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          
          {/* Left Executive Logo Wordmark */}
          <div className="flex items-center cursor-pointer group shrink-0 select-none py-1 overflow-visible h-full" onClick={() => setActiveTab("dashboard")}>
            <div className="inline-flex items-center leading-normal py-1 px-1 overflow-visible my-auto">
              <span className="font-satisfy text-2xl sm:text-3xl md:text-[28px] font-bold tracking-normal bg-gradient-to-r from-blue-700 via-indigo-600 to-amber-600 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity whitespace-nowrap leading-[1.6] py-1 px-0.5 inline-block overflow-visible">
                CEO Lifestyle
              </span>
              <sup className="text-[10px] sm:text-[11px] ml-1 font-sans font-black text-amber-600 inline-block select-none -translate-y-2 shrink-0 overflow-visible">®</sup>
            </div>
          </div>

          {/* Middle Navigation Tabs (3D-Style Premium Icons & Exact Order) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 shadow-inner">
            {/* 1. Dashboard */}
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setIsAdding(false);
                setIsEditing(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === "dashboard" 
                  ? "bg-white text-slate-950 shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] border border-slate-200/80" 
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-200/50"
              }`}
            >
              <div className={`p-1 rounded-lg flex items-center justify-center transition-all ${
                activeTab === "dashboard"
                  ? "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-[0_2px_4px_rgba(99,102,241,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]"
                  : "bg-gradient-to-b from-white to-slate-100 text-indigo-600 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              }`}>
                <LayoutDashboard className="w-3.5 h-3.5" />
              </div>
              Dashboard
            </button>

            {/* 2. Operations Board */}
            <button
              onClick={() => {
                setActiveTab("operations");
                setIsAdding(false);
                setIsEditing(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === "operations" 
                  ? "bg-white text-slate-950 shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] border border-slate-200/80" 
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-200/50"
              }`}
            >
              <div className={`p-1 rounded-lg flex items-center justify-center transition-all ${
                activeTab === "operations"
                  ? "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_2px_4px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]"
                  : "bg-gradient-to-b from-white to-slate-100 text-emerald-600 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              }`}>
                <ClipboardList className="w-3.5 h-3.5" />
              </div>
              Operations Board
            </button>

            {/* 3. Client Directory */}
            <button
              onClick={() => {
                setActiveTab("directory");
                setIsAdding(false);
                setIsEditing(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === "directory" 
                  ? "bg-white text-slate-950 shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] border border-slate-200/80" 
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-200/50"
              }`}
            >
              <div className={`p-1 rounded-lg flex items-center justify-center transition-all ${
                activeTab === "directory"
                  ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-[0_2px_4px_rgba(59,130,246,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]"
                  : "bg-gradient-to-b from-white to-slate-100 text-blue-600 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              }`}>
                <Users className="w-3.5 h-3.5" />
              </div>
              Client Directory
            </button>

            {/* 4. Production Tools */}
            <button
              onClick={() => {
                setActiveTab("production");
                setIsAdding(false);
                setIsEditing(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === "production" 
                  ? "bg-white text-slate-950 shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] border border-slate-200/80" 
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-200/50"
              }`}
            >
              <div className={`p-1 rounded-lg flex items-center justify-center transition-all ${
                activeTab === "production"
                  ? "bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-[0_2px_4px_rgba(245,158,11,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]"
                  : "bg-gradient-to-b from-white to-slate-100 text-amber-600 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              }`}>
                <Wrench className="w-3.5 h-3.5" />
              </div>
              Production Tools
            </button>

            {/* 5. Luxe Inventory */}
            <button
              onClick={() => {
                setActiveTab("inventory");
                setIsAdding(false);
                setIsEditing(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === "inventory" 
                  ? "bg-white text-slate-950 shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] border border-slate-200/80" 
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-200/50"
              }`}
            >
              <div className={`p-1 rounded-lg flex items-center justify-center transition-all ${
                activeTab === "inventory"
                  ? "bg-gradient-to-b from-purple-500 to-purple-600 text-white shadow-[0_2px_4px_rgba(168,85,247,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]"
                  : "bg-gradient-to-b from-white to-slate-100 text-purple-600 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              }`}>
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              Luxe Inventory
            </button>

            {/* 6. Milestone Hub */}
            <button
              onClick={() => {
                setActiveTab("calendar");
                setIsAdding(false);
                setIsEditing(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === "calendar" 
                  ? "bg-white text-slate-950 shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] border border-slate-200/80" 
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-200/50"
              }`}
            >
              <div className={`p-1 rounded-lg flex items-center justify-center transition-all ${
                activeTab === "calendar"
                  ? "bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-[0_2px_4px_rgba(244,63,94,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]"
                  : "bg-gradient-to-b from-white to-slate-100 text-rose-600 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              }`}>
                <Calendar className="w-3.5 h-3.5" />
              </div>
              Milestone Hub
            </button>

            {/* 7. Aspiring Clients */}
            <button
              onClick={() => {
                setActiveTab("aspiring");
                setIsAdding(false);
                setIsEditing(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === "aspiring" 
                  ? "bg-white text-slate-950 shadow-[0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] border border-slate-200/80" 
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-200/50"
              }`}
            >
              <div className={`p-1 rounded-lg flex items-center justify-center transition-all ${
                activeTab === "aspiring"
                  ? "bg-gradient-to-b from-pink-500 to-pink-600 text-white shadow-[0_2px_4px_rgba(236,72,153,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]"
                  : "bg-gradient-to-b from-white to-slate-100 text-pink-600 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              }`}>
                <UserPlus className="w-3.5 h-3.5" />
              </div>
              Aspiring Clients
            </button>
          </nav>

          {/* Right Status Indicator & Settings dropdown */}
          <div className="flex items-center gap-2.5 relative">
            
            {/* Settings Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                  isSettingsOpen || activeTab === "excel" || activeTab === "branding" || activeTab === "users"
                    ? "bg-slate-950 border-slate-950 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200/40"
                }`}
                title="Settings Control Center"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline text-xs font-bold">Settings</span>
              </button>

              {isSettingsOpen && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setIsSettingsOpen(false)}
                  />
                  
                  {/* Dropdown Content */}
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-2 z-50 text-left animate-fade-in">
                    <div className="px-3.5 py-1.5 border-b border-slate-100 mb-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Administration</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        setActiveTab("excel");
                        setIsAdding(false);
                        setIsEditing(false);
                        setIsSettingsOpen(false);
                      }}
                      className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-semibold transition-all ${
                        activeTab === "excel"
                          ? "bg-rose-50 text-rose-800 font-bold border-l-2 border-rose-600"
                          : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-rose-700" />
                      Excel Exchange
                    </button>
                    
                    {userRole === "Master Administrator" && (
                      <button
                        onClick={() => {
                          setActiveTab("branding");
                          setIsAdding(false);
                          setIsEditing(false);
                          setIsSettingsOpen(false);
                        }}
                        className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-semibold transition-all ${
                          activeTab === "branding"
                            ? "bg-slate-50 text-slate-950 font-bold border-l-2 border-slate-800"
                            : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                        }`}
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-500" />
                        System Settings
                      </button>
                    )}

                    {userRole === "Master Administrator" && (
                      <button
                        onClick={() => {
                          setActiveTab("users");
                          setIsAdding(false);
                          setIsEditing(false);
                          setIsSettingsOpen(false);
                        }}
                        className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-semibold transition-all ${
                          activeTab === "users"
                            ? "bg-emerald-50 text-emerald-850 font-bold border-l-2 border-emerald-600"
                            : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5 text-emerald-600" />
                        User Access
                      </button>
                    )}
                    
                    <div className="border-t border-slate-100 my-1" />
                    
                    <button
                      onClick={() => {
                        setIsSettingsOpen(false);
                        setIsEndSessionModalOpen(true);
                      }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>

        {/* Mobile quick-tab bar (simplified without administrative controls) */}
        <div className="sm:hidden flex items-center justify-around border-t border-neutral-100 p-2 bg-white">
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setIsAdding(false);
              setIsEditing(false);
            }}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
              activeTab === "dashboard" ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => {
              setActiveTab("directory");
              setIsAdding(false);
              setIsEditing(false);
            }}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
              activeTab === "directory" ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            <Users className="w-4 h-4" />
            Directory
          </button>
          <button
            onClick={() => {
              setActiveTab("aspiring");
              setIsAdding(false);
              setIsEditing(false);
            }}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
              activeTab === "aspiring" ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Leads
          </button>
          <button
            onClick={() => {
              setActiveTab("calendar");
              setIsAdding(false);
              setIsEditing(false);
            }}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
              activeTab === "calendar" ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Milestone Hub
          </button>
          <button
            onClick={() => {
              setActiveTab("inventory");
              setIsAdding(false);
              setIsEditing(false);
            }}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
              activeTab === "inventory" ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Inventory
          </button>
          <button
            onClick={() => {
              setActiveTab("production");
              setIsAdding(false);
              setIsEditing(false);
            }}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
              activeTab === "production" ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            <Wrench className="w-4 h-4" />
            Tools
          </button>
        </div>
      </header>

      {/* Main Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Phase Two - Consistent User Identity Header */}
        <div className="text-left pb-6 mb-8 border-b border-slate-200/20 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            {/* Left Column: User Identity, Page Title & Description */}
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-400 block drop-shadow-sm font-mono leading-none">
                  {userRole === "Staff" ? "Staff User" : userRole}
                </span>
                <div className="flex items-center gap-1.5 bg-slate-900/50 backdrop-blur-md px-2.5 py-1 rounded border border-slate-700/50">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono tracking-wider uppercase text-slate-300">
                    System Active
                  </span>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-white drop-shadow-sm">
                {activeTab === "dashboard" && "Client Watchtower"}
                {activeTab === "operations" && "Operations Board & Production Management"}
                {activeTab === "directory" && (isAdding ? "Create Client Profile" : isEditing ? "Modify Client Profile" : "Client Directory")}
                {activeTab === "aspiring" && "Aspiring Clients & Lead Management"}
                {activeTab === "excel" && "Excel Exchange"}
                {activeTab === "calendar" && "Milestone Calendar"}
                {activeTab === "inventory" && "Librarium Luxe Inventory"}
                {activeTab === "production" && "Production Tools Workspace"}
                {activeTab === "branding" && "Centralized System Settings"}
                {activeTab === "users" && "User Access & Governance"}
              </h1>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2xl font-medium pt-1">
                {activeTab === "dashboard" && `Welcome, ${userFullName}. Let's look at who needs your personal attention today to foster authentic, high-value client experiences.`}
                {activeTab === "operations" && "Real-time production workflow manager tracking active customer orders from deposit confirmation through artwork, production, quality control, and delivery."}
                {activeTab === "directory" && "A centralized database for managing client relationships, profiles, history, important dates, and lifestyle touchpoints."}
                {activeTab === "aspiring" && "Track potential future customers, schedule follow-ups, and convert leads into active portfolio clients."}
                {activeTab === "excel" && "Maintain perfect backup parity. Seamlessly ingest or export customer files and private catalog items."}
                {activeTab === "calendar" && "Your visual guide to critical client anniversaries, birthdays, and important lifestyle touchpoints."}
                {activeTab === "inventory" && "Manage and inspect exquisite private catalog items, standard stock quotas, and client-allocated assets."}
                {activeTab === "production" && "Centralized workspace for production layout calculations, apparel studio quotation, book cost estimation, and travel logistics."}
                {activeTab === "branding" && "Configure pricing equations, warehouse alerts, dynamic milestone triggers, and workspace branding styles."}
                {activeTab === "users" && "Manage application user credentials, provision future workspace roles, and control active status."}
              </p>
            </div>

            {/* Right Column: System Reference Card */}
            <SystemReferenceClock 
              clientsCount={clients.length}
              showDirectoryStatusWidgets={activeTab === "directory"}
              onOpenEnvironmentManagement={() => {
                setActiveTab("branding");
                setIsSettingsOpen(false);
              }}
            />
          </div>
        </div>
        
        {/* Tab 1: Dashboard */}
        {activeTab === "dashboard" && (
          <Dashboard 
            clients={clients} 
            aspiringClients={aspiringClients}
            setAspiringClients={setAspiringClients}
            onConvertToClient={handleConvertToClient}
            inventory={inventory}
            operationsOrders={operationsOrders}
            onSelectClient={handleSelectClient}
            onNavigateToTab={(tab) => setActiveTab(tab as any)}
            onNavigateToAspiringAdd={handleNavigateToAspiringAdd}
            onOpenTask={(clientId, reminderId) => setActiveTaskInfo({ clientId, reminderId })}
            settings={settings}
          />
        )}

        {/* Tab: Operations Board */}
        {activeTab === "operations" && (
          <OperationsHub 
            operationsOrders={operationsOrders}
            clients={clients}
            onSaveOrder={handleSaveOperationsOrder}
            onDeleteOrder={handleDeleteOperationsOrder}
            onNavigateToTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {/* Tab: Aspiring Clients */}
        {activeTab === "aspiring" && (
          <AspiringClients
            aspiringClients={aspiringClients}
            setAspiringClients={setAspiringClients}
            onConvertToClient={handleConvertToClient}
            onNavigateToCalendar={() => setActiveTab("calendar")}
            autoOpenAddModal={autoOpenAddAspiring}
            onResetAutoOpenAdd={() => setAutoOpenAddAspiring(false)}
          />
        )}

        {/* Tab 2: Directory split views */}
        {activeTab === "directory" && (
          <div className="space-y-6">
            
            {/* Split layout (List on left, Detail panel on right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Directory search column */}
              <div className={`lg:col-span-4 space-y-4 ${
                (activeClient || isAdding || isEditing) ? "hidden lg:block" : "block"
              }`}>
                <ClientList 
                  clients={clients}
                  selectedClientId={selectedClientId}
                  onSelectClient={setSelectedClientId}
                  onAddNewClient={handleAddNewClientTrigger}
                  onDeleteClient={handleDeleteClient}
                />
              </div>

              {/* Detail panel columns */}
              <div className={`lg:col-span-8 ${
                (!activeClient && !isAdding && !isEditing) ? "block" : ""
              }`}>
                
                {/* Mobile Back-to-list action bar */}
                {(activeClient || isAdding || isEditing) && (
                  <button
                    onClick={() => {
                      setSelectedClientId(null);
                      setIsAdding(false);
                      setIsEditing(false);
                    }}
                    className="lg:hidden flex items-center gap-1 text-neutral-600 hover:text-neutral-900 text-xs font-semibold mb-4"
                  >
                    <ArrowLeft className="w-4 h-4" /> Return to Client Directory
                  </button>
                )}

                {/* Switch between Detail view, edit form, creation form, or default placeholder */}
                {isAdding ? (
                  <ClientForm 
                    onSave={handleSaveClient}
                    onCancel={() => setIsAdding(false)}
                    existingCustomers={clients}
                  />
                ) : isEditing ? (
                  <ClientForm 
                    customer={activeClient}
                    onSave={handleSaveClient}
                    onCancel={() => setIsEditing(false)}
                    existingCustomers={clients}
                  />
                ) : activeClient ? (
                  <ClientDetail 
                    customer={activeClient}
                    onEdit={handleEditClientTrigger}
                    onDelete={handleDeleteClient}
                    onUpdateCustomer={handleSaveClient}
                  />
                ) : (
                  // Default placeholder
                  <div className="bg-white border border-neutral-100 rounded-3xl p-16 text-center shadow-xs flex flex-col items-center justify-center min-h-[350px]">
                    <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center border border-neutral-200 mb-4 shadow-sm">
                      <Users className="w-5 h-5 text-neutral-400" />
                    </div>
                    <h3 className="text-sm font-bold text-neutral-800">No Client Account Selected</h3>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm leading-relaxed">
                      Select an account from the directory tree to inspect historic purchase orders, family connections, lifestyle notes, and pending tasks, or establish a brand new profile.
                    </p>
                    <button
                      onClick={handleAddNewClientTrigger}
                      className="mt-5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      Establish First Client
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* Tab 3: Excel Exchange */}
        {activeTab === "excel" && (
          <ExcelManager 
            customers={clients}
            onImportCustomers={handleImportClients}
            inventory={inventory}
            onUpdateInventory={saveInventory}
          />
        )}

        {/* Tab 4: Milestone Calendar */}
        {activeTab === "calendar" && (
          <MilestoneCalendar 
            clients={clients}
            aspiringClients={aspiringClients}
            onSelectClient={handleSelectClient}
            onOpenTask={(clientId, reminderId) => setActiveTaskInfo({ clientId, reminderId })}
          />
        )}

        {/* Tab 5: Luxe Inventory */}
        {activeTab === "inventory" && (
          <LuxeInventory 
            inventory={inventory}
            onUpdateInventory={saveInventory}
            settings={settings}
          />
        )}

        {/* Tab: Production Tools Workspace */}
        {activeTab === "production" && (
          <ProductionTools 
            settings={settings}
            inventory={inventory}
          />
        )}

        {/* Tab 6: Centralized Settings */}
        {activeTab === "branding" && (
          <BrandingSettings 
            appBg={appBg}
            authBg={authBg}
            onUpdateAppBg={handleUpdateAppBg}
            onUpdateAuthBg={handleUpdateAuthBg}
            onResetAppBg={handleResetAppBg}
            onResetAuthBg={handleResetAuthBg}
            defaultBg={spaceBg}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            userRole={userRole}
            userFullName={userFullName}
            onRestoreBackup={handleRestoreBackup}
            onStartTour={handleStartTour}
            onNavigateToTab={setActiveTab}
            clients={clients}
            onUpdateClients={saveClients}
            onNavigateToClient={handleSelectClient}
          />
        )}

        {/* Tab 7: User Access & Governance */}
        {activeTab === "users" && userRole === "Master Administrator" && (
          <UserManagement 
            onUpdateMasterCredentials={handleUpdateMasterCredentials}
            masterUsername={masterUsername}
          />
        )}

      </main>

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-neutral-800/10 bg-white/90 backdrop-blur-md py-6 text-center text-xs text-neutral-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="flex items-center gap-1.5 justify-center flex-wrap">
            <span>© Since 2024 •</span>
            <span className="font-satisfy text-sm bg-gradient-to-r from-blue-700 via-indigo-600 to-amber-600 bg-clip-text text-transparent font-bold py-0.5 px-0.5 inline-block leading-[1.5] overflow-visible">
              CEO Lifestyle
            </span>
            <sup className="text-[9px] font-sans font-black text-amber-600 inline-block select-none -translate-y-1">®</sup>
            <span>• The Home Of Endless Creativity</span>
          </p>
          <div className="flex gap-4">
            <span className="font-semibold text-neutral-500">Executive Relationship Hub</span>
            <span>•</span>
            <span>Made with Precision</span>
          </div>
        </div>
      </footer>

      {/* TASK DETAILS MODAL */}
      {activeTaskInfo && (() => {
        const client = clients.find(c => c.id === activeTaskInfo.clientId);
        const reminder = client?.reminders.find(r => r.id === activeTaskInfo.reminderId);
        if (!client || !reminder) return null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4 text-left relative">
              <button 
                onClick={() => setActiveTaskInfo(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">Task Details</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{client.firstName} {client.lastName} ({client.tier} Account)</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Task/Follow-up Details</label>
                  <textarea
                    value={taskEditText}
                    onChange={(e) => setTaskEditText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-xs font-semibold text-slate-800 resize-none h-24 transition-colors"
                    placeholder="Enter details here..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Follow-up Date</label>
                    <input
                      type="date"
                      value={taskEditDate}
                      onChange={(e) => setTaskEditDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-xs font-semibold text-slate-800 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Status</label>
                    <button
                      type="button"
                      onClick={handleToggleTaskCompleted}
                      className={`w-full flex items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                        reminder.completed 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                          : "bg-amber-50 border-amber-100 text-amber-800"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${reminder.completed ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                      {reminder.completed ? "Completed" : "Pending Action"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleUpdateTaskDetails}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold p-2.5 rounded-xl transition-all shadow-sm text-center"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTaskInfo(null);
                    handleSelectClient(client.id);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold p-2.5 rounded-xl transition-all text-center"
                >
                  Open Client Profile
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTaskFromModal}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold p-2.5 rounded-xl transition-all text-center"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* GUIDED WALKTHROUGH TOUR OVERLAY */}
      {activeTour && (() => {
        const tour = TOURS[activeTour.id];
        if (!tour) return null;
        const currentStepData = tour.steps[activeTour.currentStep];
        if (!currentStepData) return null;

        const isFirstStep = activeTour.currentStep === 0;
        const isLastStep = activeTour.currentStep === tour.steps.length - 1;

        return (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 animate-fade-in text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Interactive Guide
                </span>
              </div>
              <button
                type="button"
                onClick={() => saveActiveTour(null)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="End Walkthrough"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider font-mono">
                Step {activeTour.currentStep + 1} of {tour.steps.length}
              </span>
              <h4 className="text-xs font-bold text-slate-100">{currentStepData.title}</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                {currentStepData.text}
              </p>
            </div>

            {/* Visual Step Dots */}
            <div className="flex gap-1.5 justify-start">
              {tour.steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === activeTour.currentStep
                      ? "w-5 bg-indigo-500"
                      : "w-1.5 bg-slate-700"
                  }`}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => saveActiveTour(null)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Skip Tour
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isFirstStep) {
                      const prevIdx = activeTour.currentStep - 1;
                      saveActiveTour({ id: activeTour.id, currentStep: prevIdx });
                      setActiveTab(tour.steps[prevIdx].tab);
                    }
                  }}
                  disabled={isFirstStep}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
                    isFirstStep
                      ? "text-slate-650 bg-slate-800/40 cursor-not-allowed"
                      : "text-slate-300 bg-slate-850 hover:bg-slate-800 cursor-pointer"
                  }`}
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isLastStep) {
                      saveActiveTour(null);
                    } else {
                      const nextIdx = activeTour.currentStep + 1;
                      saveActiveTour({ id: activeTour.id, currentStep: nextIdx });
                      setActiveTab(tour.steps[nextIdx].tab);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  {isLastStep ? "Finish" : "Next"} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* End of Session Backup Modal */}
      <EndSessionBackupModal
        isOpen={isEndSessionModalOpen}
        onClose={() => setIsEndSessionModalOpen(false)}
        onConfirmLogout={() => {
          setIsEndSessionModalOpen(false);
          handleLogout();
        }}
        userFullName={userFullName}
      />

      {/* Global Add Aspiring Client Popup Modal */}
      <AddAspiringClientModal
        isOpen={isGlobalAddAspiringOpen}
        onClose={() => setIsGlobalAddAspiringOpen(false)}
        onSave={(newClientData) => {
          let summaryContact = newClientData.contactInfo || "";
          if (newClientData.phoneNumber || newClientData.email) {
            summaryContact = [newClientData.phoneNumber, newClientData.email].filter(Boolean).join(" | ");
          }

          const newEntry: AspiringClient = {
            id: `ASP${String(Date.now()).slice(-4)}`,
            ...newClientData,
            contactInfo: summaryContact
          };

          setAspiringClients(prev => {
            const updated = [newEntry, ...prev];
            const activeEnv = getCurrentEnvironment();
            saveEnvironmentAspiringClients(updated, activeEnv);
            return updated;
          });
        }}
      />

    </div>
  );
}
