import React, { useState, useEffect, useMemo } from "react";
import { Client, ClientHome, LuxeBookInventoryItem, SystemSettings, AspiringClient, OperationsOrder, TimelineEvent, FollowUpRecord, FollowUpReminder, OpportunityStatus, AppUser, UserRole, UserStatus } from "./types";
import { INITIAL_CLIENTS, INITIAL_INVENTORY, INITIAL_ASPIRING_CLIENTS, INITIAL_OPERATIONS_ORDERS, INITIAL_USERS } from "./data/mockData";
import { syncFamilyBirthdayReminders, getFollowUpActionState } from "./utils/dateHelpers";
import { safeMergeClient } from "./utils/clientMergeUtils";
import { getSystemSettings, saveSystemSettings } from "./utils/settingsHelper";
import { getOpenPromisesCount, getClientPromises } from "./utils/clientTierUtils";
import Dashboard from "./components/Dashboard";
import OperationsHub from "./components/OperationsHub";
import ClientList from "./components/ClientList";
import ClientDetail from "./components/ClientDetail";
import ClientForm from "./components/ClientForm";
import ExcelManager from "./components/ExcelManager";
import MilestoneCalendar from "./components/MilestoneCalendar";
import LuxeInventory from "./components/LuxeInventory";
import InventoryHub from "./components/InventoryHub";
import UserManagement from "./components/UserManagement";
import ProductionTools from "./components/ProductionTools";
import AspiringClients from "./components/AspiringClients";
import AddAspiringClientModal from "./components/AddAspiringClientModal";
import ConvertDuplicateModal from "./components/ConvertDuplicateModal";
import EndSessionBackupModal from "./components/EndSessionBackupModal";
import SystemReferenceClock from "./components/SystemReferenceClock";
import { CmtManagementModal } from "./components/CmtManagementModal";
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
  Archive,
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
  Crown,
  HeartHandshake,
  CheckCircle2,
  MessageSquare,
  Clock,
  AlertCircle,
  Award,
  ChevronRight
} from "lucide-react";
// @ts-ignore
import spaceBg from "./assets/images/space_background_1783612418079.jpg";
import LoginScreen from "./components/LoginScreen";
import BrandingSettings from "./components/BrandingSettings";
import UndoToast, { UndoAction } from "./components/UndoToast";

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
  // System-Wide Fix for Numeric Input Fields (Auto-Select on Focus to allow direct replacement)
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target;
      if (target instanceof HTMLInputElement) {
        const isNumeric =
          target.type === "number" ||
          target.inputMode === "numeric" ||
          target.inputMode === "decimal" ||
          target.dataset.numeric === "true" ||
          /price|cost|qty|quantity|amount|rate|markup|deposit|fee|shipping|total|threshold|stock|tier/i.test(
            target.name || target.id || target.placeholder || ""
          );

        if (isNumeric) {
          setTimeout(() => {
            if (document.activeElement === target) {
              target.select();
            }
          }, 20);
        }
      }
    };

    document.addEventListener("focus", handleFocus, true);
    return () => {
      document.removeEventListener("focus", handleFocus, true);
    };
  }, []);

  // State for client list
  const [clients, setClients] = useState<Client[]>([]);

  // State for Librarium Luxe Inventory
  const [inventory, setInventory] = useState<LuxeBookInventoryItem[]>([]);

  // State for Operations Orders
  const [operationsOrders, setOperationsOrders] = useState<OperationsOrder[]>(() => {
    const activeEnv = getCurrentEnvironment();
    return loadEnvironmentOperationsOrders(activeEnv);
  });

  // State for Universal Undo
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);

  const handleSaveOperationsOrder = (order: OperationsOrder) => {
    const oldOrder = operationsOrders.find(o => (order.id && o.id === order.id) || (order.orderNumber && o.orderNumber === order.orderNumber));
    const isNew = !oldOrder;
    const statusChanged = oldOrder && oldOrder.productionStatus !== order.productionStatus;

    // Terminal state guard: once an order is Completed, it cannot be reopened to an active or earlier status
    const isCompletedTerminal = oldOrder && oldOrder.productionStatus === "Completed" && order.productionStatus !== "Completed";
    const finalProductionStatus = isCompletedTerminal ? "Completed" : order.productionStatus;

    const safeOrder: OperationsOrder = {
      ...order,
      productionStatus: finalProductionStatus,
      orderNumber: oldOrder ? oldOrder.orderNumber : order.orderNumber,
      createdDate: oldOrder?.createdDate || oldOrder?.dateOrderCreated || order.createdDate || order.dateOrderCreated || new Date().toISOString().split("T")[0],
      dateOrderCreated: oldOrder?.dateOrderCreated || oldOrder?.createdDate || order.dateOrderCreated || order.createdDate || new Date().toISOString().split("T")[0],
      updatedDate: new Date().toISOString().split("T")[0]
    };

    setOperationsOrders(prev => {
      const existingIdx = prev.findIndex(o => (safeOrder.id && o.id === safeOrder.id) || (safeOrder.orderNumber && o.orderNumber === safeOrder.orderNumber));
      let updated: OperationsOrder[];
      if (existingIdx !== -1) {
        updated = [...prev];
        updated[existingIdx] = {
          ...prev[existingIdx],
          ...safeOrder
        };
      } else {
        updated = [safeOrder, ...prev];
      }
      const activeEnv = getCurrentEnvironment();
      saveEnvironmentOperationsOrders(updated, activeEnv);
      return updated;
    });

    // Register Undo Action for Order Changes
    if (oldOrder) {
      setUndoAction({
        id: `undo_ord_${Date.now()}`,
        message: statusChanged 
          ? `Order ${order.orderNumber} status changed to ${order.productionStatus}.`
          : `Order ${order.orderNumber} updated.`,
        onUndo: () => {
          setOperationsOrders(prev => {
            const updated = prev.map(o => o.id === oldOrder.id ? oldOrder : o);
            saveEnvironmentOperationsOrders(updated, getCurrentEnvironment());
            return updated;
          });
        }
      });
    } else if (isNew) {
      setUndoAction({
        id: `undo_new_ord_${Date.now()}`,
        message: `New Order ${order.orderNumber} created.`,
        onUndo: () => {
          setOperationsOrders(prev => {
            const updated = prev.filter(o => o.id !== order.id && o.orderNumber !== order.orderNumber);
            saveEnvironmentOperationsOrders(updated, getCurrentEnvironment());
            return updated;
          });
        }
      });
    }

    // Automatically log Interaction & Activity Timeline event for the client
    if (isNew || statusChanged) {
      setClients(prevClients => {
        const clientIndex = prevClients.findIndex(
          c => {
            const cid = (c.id || "").trim();
            const ordCid = (order.clientId || "").trim();
            if (ordCid && cid === ordCid) return true;

            const cName = `${c.firstName || ""} ${c.lastName || ""}`.trim().toLowerCase();
            const oName = (order.clientName || "").trim().toLowerCase();
            if (oName && cName && cName === oName) return true;

            const cFull = `${c.firstName || ""} ${c.lastName || ""}`.trim().toLowerCase();
            if (oName && cFull && cFull === oName) return true;

            return false;
          }
        );

        if (clientIndex === -1) return prevClients;

        const targetClient = prevClients[clientIndex];
        const todayStr = new Date().toISOString().split("T")[0];

        let eventType = "Order Created";
        let content = "";

        if (isNew) {
          const itemText = typeof order.items === "string" 
            ? (order.items || "") 
            : (order.items || []).map(i => `${i.quantity || 1}x ${i.productName || "Product"}`).join(", ");
          content = `Order Created — ${order.orderNumber || ""} (${itemText || "Custom Order"})${order.expressOrder === "Yes" ? " [⚡ EXPRESS]" : ""}`;
        } else if (statusChanged) {
          eventType = order.productionStatus === "Completed" ? "Order Completed" : "Order Status Changed";
          content = `Order ${order.orderNumber || ""} Status → ${order.productionStatus || "Updated"}`;
        }

        const newTimelineEvent: TimelineEvent = {
          id: `evt_ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: eventType,
          date: todayStr,
          content: content || "Order Activity Recorded",
          amount: order.totalAmount,
          orderId: order.id,
          orderNumber: order.orderNumber || ""
        };

        const updatedTimeline = [newTimelineEvent, ...(targetClient.timeline || [])];
        const updatedClient = {
          ...targetClient,
          timeline: updatedTimeline,
          lastContactedDate: todayStr
        };

        const updatedClientsList = [...prevClients];
        updatedClientsList[clientIndex] = updatedClient;

        const activeEnv = getCurrentEnvironment();
        saveEnvironmentClients(updatedClientsList, activeEnv);

        return updatedClientsList;
      });
    }
  };

  const handleDeleteOperationsOrder = (orderId: string) => {
    const targetOrder = operationsOrders.find(o => o.id === orderId);
    setOperationsOrders(prev => {
      const updated = prev.filter(o => o.id !== orderId);
      const activeEnv = getCurrentEnvironment();
      saveEnvironmentOperationsOrders(updated, activeEnv);
      return updated;
    });

    if (targetOrder) {
      setUndoAction({
        id: `undo_del_ord_${Date.now()}`,
        message: `Order ${targetOrder.orderNumber} deleted.`,
        onUndo: () => {
          setOperationsOrders(prev => {
            const updated = [targetOrder, ...prev];
            const activeEnv = getCurrentEnvironment();
            saveEnvironmentOperationsOrders(updated, activeEnv);
            return updated;
          });
        }
      });
    }
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

  // ---------------------------------------------------------------------------
  // CRITICAL-003: Safe Role Resolution
  // Missing, invalid, corrupted, or unavailable role data must NEVER result in administrative privileges.
  // Authenticated role must be authoritatively resolved from existing user records.
  // ---------------------------------------------------------------------------
  interface SafeUserSession {
    isAuthenticated: boolean;
    role: string;
    fullName: string;
    username: string;
  }

  const resolveSafeUserSession = (): SafeUserSession => {
    const isAuth = localStorage.getItem("ceo_admin_authenticated") === "true";
    if (!isAuth) {
      return {
        isAuthenticated: false,
        role: "Staff",
        fullName: "",
        username: ""
      };
    }

    const storedRole = (localStorage.getItem("ceo_user_role") || "").trim();
    const storedUsername = (localStorage.getItem("ceo_user_username") || "").trim();
    const storedFullName = (localStorage.getItem("ceo_user_fullname") || "").trim();

    // Load authoritative application user records
    let appUsers: AppUser[] = [];
    try {
      const raw = localStorage.getItem("ceo_application_users");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          appUsers = parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse application users during role resolution:", e);
    }
    if (appUsers.length === 0) {
      appUsers = INITIAL_USERS;
    }

    // 1. Check against authoritative application user records
    if (storedUsername) {
      const matchedUser = appUsers.find(
        u => u.username.toLowerCase() === storedUsername.toLowerCase()
      );

      if (matchedUser) {
        if (matchedUser.status === UserStatus.DEACTIVATED) {
          localStorage.removeItem("ceo_admin_authenticated");
          localStorage.removeItem("ceo_user_role");
          localStorage.removeItem("ceo_user_fullname");
          localStorage.removeItem("ceo_user_username");
          return {
            isAuthenticated: false,
            role: "Staff",
            fullName: "",
            username: ""
          };
        }

        // For non-privileged roles (Staff, Manager, Read-Only User), enforce authoritative role
        if (
          matchedUser.role !== UserRole.MASTER_ADMINISTRATOR &&
          matchedUser.role !== UserRole.ADMINISTRATOR
        ) {
          if (storedRole !== matchedUser.role) {
            localStorage.setItem("ceo_user_role", matchedUser.role);
          }
          return {
            isAuthenticated: true,
            role: matchedUser.role,
            fullName: matchedUser.fullName || storedFullName || matchedUser.username,
            username: matchedUser.username
          };
        }

        // For Master Administrator in directory: require legitimate matching role
        if (storedRole === matchedUser.role) {
          return {
            isAuthenticated: true,
            role: matchedUser.role,
            fullName: matchedUser.fullName || storedFullName || "Master Administrator",
            username: matchedUser.username
          };
        } else {
          // Missing, tampered, or invalid role for an admin record -> fail safely
          localStorage.removeItem("ceo_admin_authenticated");
          localStorage.removeItem("ceo_user_role");
          localStorage.removeItem("ceo_user_fullname");
          localStorage.removeItem("ceo_user_username");
          return {
            isAuthenticated: false,
            role: "Staff",
            fullName: "",
            username: ""
          };
        }
      }
    }

    // 2. Custom Master Administrator credentials check
    const masterUser = (localStorage.getItem("ceo_admin_username") || "admin").trim().toLowerCase();
    if (storedUsername && (storedUsername.toLowerCase() === masterUser || storedUsername.toLowerCase() === "admin")) {
      if (storedRole === "Master Administrator") {
        return {
          isAuthenticated: true,
          role: "Master Administrator",
          fullName: storedFullName || "Master Administrator",
          username: storedUsername
        };
      } else {
        // Missing, corrupted, or tampered role for master account -> fail safely, require re-authentication
        localStorage.removeItem("ceo_admin_authenticated");
        localStorage.removeItem("ceo_user_role");
        localStorage.removeItem("ceo_user_fullname");
        localStorage.removeItem("ceo_user_username");
        return {
          isAuthenticated: false,
          role: "Staff",
          fullName: "",
          username: ""
        };
      }
    }

    // 3. Fallback for valid non-privileged roles
    if (storedRole === "Staff" || storedRole === "Read-Only User" || storedRole === "Manager") {
      return {
        isAuthenticated: true,
        role: storedRole,
        fullName: storedFullName || "Staff User",
        username: storedUsername || "staff"
      };
    }

    // 4. Missing, invalid, empty, or corrupted role data -> NEVER escalate!
    localStorage.removeItem("ceo_admin_authenticated");
    localStorage.removeItem("ceo_user_role");
    localStorage.removeItem("ceo_user_fullname");
    localStorage.removeItem("ceo_user_username");
    return {
      isAuthenticated: false,
      role: "Staff",
      fullName: "",
      username: ""
    };
  };

  // Authentication states with safe role resolution
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return resolveSafeUserSession().isAuthenticated;
  });

  // Current Logged-in User Info
  const [userRole, setUserRole] = useState(() => {
    return resolveSafeUserSession().role;
  });

  const [userFullName, setUserFullName] = useState(() => {
    return resolveSafeUserSession().fullName;
  });

  const [userUsername, setUserUsername] = useState(() => {
    return resolveSafeUserSession().username;
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
    const session = resolveSafeUserSession();
    setIsAuthenticated(session.isAuthenticated);
    setUserRole(session.role);
    setUserFullName(session.fullName);
    setUserUsername(session.username);
  };
  
  // System Settings state
  const [settings, setSettings] = useState<SystemSettings>(() => getSystemSettings());
  const [isAllOpenCmtsModalOpen, setIsAllOpenCmtsModalOpen] = useState(false);

  const totalOpenCmtsCount = useMemo(() => {
    if (!clients || !Array.isArray(clients)) return 0;
    return clients.reduce((sum, c) => sum + getOpenPromisesCount(c), 0);
  }, [clients]);

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
    setUserRole("Staff");
    setUserFullName("");
    setUserUsername("");
    setActiveTab("dashboard");
  };
  
  // Selected client for detail view
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isEndSessionModalOpen, setIsEndSessionModalOpen] = useState(false);

  // Aspiring Clients state
  const [aspiringClients, setAspiringClients] = useState<AspiringClient[]>(() => {
    if (localStorage.getItem("ceo_aspiring_clients_cleared") === "true") {
      return [];
    }
    const stored = localStorage.getItem("ceo_aspiring_clients") || localStorage.getItem("ceo_aspiring_clients_data");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (err) {
        console.error(err);
      }
    }
    return INITIAL_ASPIRING_CLIENTS;
  });

  const saveAspiringClients = (updatedList: AspiringClient[]) => {
    if (updatedList.length > 0) {
      localStorage.removeItem("ceo_aspiring_clients_cleared");
    }
    setAspiringClients(updatedList);
    localStorage.setItem("ceo_aspiring_clients", JSON.stringify(updatedList));
    localStorage.setItem("ceo_aspiring_clients_data", JSON.stringify(updatedList));
    saveEnvironmentAspiringClients(updatedList);
  };

  useEffect(() => {
    if (aspiringClients.length > 0) {
      localStorage.removeItem("ceo_aspiring_clients_cleared");
    }
    localStorage.setItem("ceo_aspiring_clients", JSON.stringify(aspiringClients));
  }, [aspiringClients]);

  const [duplicateModalData, setDuplicateModalData] = useState<{ aspiringClient: AspiringClient; matchedClients: Client[] } | null>(null);

  const findMatchingClients = (asp: AspiringClient, allClients: Client[]): Client[] => {
    const normName = (asp.name || "").trim().toLowerCase();
    const phone = (asp.phoneNumber || "").replace(/\D/g, "");
    const email = (asp.email || "").trim().toLowerCase();
    const ig = (asp.instagramUsername || "").replace("@", "").trim().toLowerCase();

    return allClients.filter(c => {
      const cFullName = `${c.firstName || ""} ${c.lastName || ""}`.trim().toLowerCase();
      const cPhone = (c.contact?.phoneNumber || "").replace(/\D/g, "");
      const cEmail = (c.contact?.email || "").trim().toLowerCase();
      const cIg = (c.contact?.instagramUsername || "").replace("@", "").trim().toLowerCase();

      // Name match
      if (normName && cFullName && (normName === cFullName || cFullName.includes(normName) || normName.includes(cFullName))) {
        return true;
      }
      // Phone match (7+ digits)
      if (phone.length >= 7 && cPhone.length >= 7 && (phone.includes(cPhone) || cPhone.includes(phone))) {
        return true;
      }
      // Email match
      if (email && cEmail && email === cEmail) {
        return true;
      }
      // IG match
      if (ig && cIg && ig === cIg) {
        return true;
      }
      return false;
    });
  };

  const executeConversionNewClient = (asp: AspiringClient) => {
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

    const initialTimeline: TimelineEvent[] = [
      {
        id: `TL-CONV-${Date.now()}`,
        type: "Conversation",
        date: new Date().toISOString().split("T")[0],
        content: `Account converted from Aspiring Client Lead (${asp.serviceInterestedIn}). Priority: ${asp.priority || "Normal"}. Notes: ${asp.notes}`
      },
      ...(asp.followUpHistory || []).map((f, idx) => ({
        id: f.id || `TL-FU-${Date.now()}-${idx}`,
        type: f.method === "Phone Call" ? "Phone Call" : f.method === "WhatsApp" ? "WhatsApp" : "Follow-up",
        date: f.date,
        content: `[Follow-Up #${f.attemptNumber}] ${f.notes} (Recorded by ${f.recordedBy})`
      }))
    ];

    const newClient: Client = {
      id: newClientId,
      firstName,
      lastName,
      gender: "Other",
      occupation: "Executive Prospect",
      drive: "Yes",
      tier: "Silver",
      homeBrand: asp.clientHome === "Librarium Luxe" ? "Librarium Luxe" : "CEO Lifestyle",
      clientHome: (asp.clientHome as ClientHome) || "CEO Lifestyle",
      adventist: asp.adventist || "No",
      marketingPermission: "Yes",
      deactivated: false,
      preferredCommunication: (asp.preferredContactMethod || "Phone") as any,
      lastContactedDate: asp.lastContactDate || asp.dateContacted || new Date().toISOString().split("T")[0],
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
        personalNotes: `Converted from Aspiring Client Lead on ${new Date().toLocaleDateString()}.\nSource: ${asp.sourceOfInquiry}\nInterest: ${asp.serviceInterestedIn}\nPriority: ${asp.priority || "Normal"}\nNotes: ${asp.notes}`
      },
      importantDates: [],
      history: {
        firstOrderDate: asp.dateContacted || new Date().toISOString().split("T")[0],
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
      timeline: initialTimeline
    };

    saveClients([newClient, ...clients]);
    setAspiringClients(prev => {
      const updated = prev.map(item => item.id === asp.id ? { ...item, status: "Converted to Client" as const } : item);
      const activeEnv = getCurrentEnvironment();
      saveEnvironmentAspiringClients(updated, activeEnv);
      return updated;
    });
    setSelectedClientId(newClientId);
    setActiveTab("directory");
    setDuplicateModalData(null);
  };

  const executeConversionLinkToExisting = (asp: AspiringClient, targetClient: Client) => {
    const today = new Date().toISOString().split("T")[0];

    const conversionEvents: TimelineEvent[] = [
      {
        id: `TL-LINK-${Date.now()}`,
        type: "Customer Response",
        date: today,
        content: `Linked Aspiring Lead (${asp.serviceInterestedIn}). Source: ${asp.sourceOfInquiry}. Priority: ${asp.priority || "Normal"}. Notes: ${asp.notes}`
      },
      ...(asp.followUpHistory || []).map((f, idx) => ({
        id: f.id || `TL-FU-${Date.now()}-${idx}`,
        type: f.method === "Phone Call" ? "Phone Call" : f.method === "WhatsApp" ? "WhatsApp" : "Follow-up",
        date: f.date,
        content: `[Follow-Up #${f.attemptNumber}] ${f.notes} (Recorded by ${f.recordedBy})`
      }))
    ];

    const updatedClient: Client = {
      ...targetClient,
      lastContactedDate: asp.lastContactDate || today,
      clientHome: targetClient.clientHome || asp.clientHome,
      adventist: targetClient.adventist || asp.adventist,
      contact: {
        ...targetClient.contact,
        phoneNumber: targetClient.contact?.phoneNumber || asp.phoneNumber || targetClient.contact?.phoneNumber,
        email: targetClient.contact?.email || asp.email || targetClient.contact?.email,
        instagramUsername: targetClient.contact?.instagramUsername || asp.instagramUsername || targetClient.contact?.instagramUsername
      },
      profile: {
        ...targetClient.profile,
        personalNotes: `${targetClient.profile?.personalNotes || ""}\n\n[Linked Aspiring Lead (${today})]: ${asp.notes}`.trim()
      },
      history: {
        ...targetClient.history,
        productsPurchased: Array.from(new Set([...(targetClient.history?.productsPurchased || []), asp.serviceInterestedIn]))
      },
      timeline: [...conversionEvents, ...(targetClient.timeline || [])]
    };

    saveClients(clients.map(c => c.id === targetClient.id ? updatedClient : c));
    setAspiringClients(prev => {
      const updated = prev.map(item => item.id === asp.id ? { ...item, status: "Converted to Client" as const } : item);
      const activeEnv = getCurrentEnvironment();
      saveEnvironmentAspiringClients(updated, activeEnv);
      return updated;
    });
    setSelectedClientId(targetClient.id);
    setActiveTab("directory");
    setDuplicateModalData(null);
  };

  const handleConvertToClient = (asp: AspiringClient) => {
    const matches = findMatchingClients(asp, clients);
    if (matches.length > 0) {
      setDuplicateModalData({ aspiringClient: asp, matchedClients: matches });
    } else {
      executeConversionNewClient(asp);
    }
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

  // Opportunity Follow-Up Logging State
  const [isLoggingOpportunityFollowUp, setIsLoggingOpportunityFollowUp] = useState(false);
  const [oppFollowUpMethod, setOppFollowUpMethod] = useState("Phone Call");
  const [oppFollowUpNotes, setOppFollowUpNotes] = useState("");
  const [oppFollowUpNextDate, setOppFollowUpNextDate] = useState("");

  useEffect(() => {
    if (activeTaskInfo) {
      const client = clients.find(c => c.id === activeTaskInfo.clientId);
      const reminder = client?.reminders.find(r => r.id === activeTaskInfo.reminderId);
      if (reminder) {
        setTaskEditText(reminder.task);
        setTaskEditDate(reminder.date);
        setIsLoggingOpportunityFollowUp(false);
        setOppFollowUpNotes("");
        setOppFollowUpNextDate("");
      }
    } else {
      setTaskEditText("");
      setTaskEditDate("");
      setIsLoggingOpportunityFollowUp(false);
      setOppFollowUpNotes("");
      setOppFollowUpNextDate("");
    }
  }, [activeTaskInfo, clients]);

  const handleLogOpportunityFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskInfo) return;

    const realToday = new Date().toISOString().split("T")[0];

    const updated = clients.map(c => {
      if (c.id === activeTaskInfo.clientId) {
        return {
          ...c,
          reminders: c.reminders.map(r => {
            if (r.id === activeTaskInfo.reminderId) {
              const currentCount = r.followUpCount || 0;
              const newCount = Math.min(currentCount + 1, 3);
              const newRecord: FollowUpRecord = {
                id: `OPPFU_${Date.now()}`,
                attemptNumber: newCount,
                date: realToday,
                method: oppFollowUpMethod,
                notes: oppFollowUpNotes.trim() || `Follow-up attempt ${newCount} logged via ${oppFollowUpMethod}.`,
                recordedBy: "Master Administrator",
                nextFollowUpDate: oppFollowUpNextDate || r.nextActionDate || r.date
              };

              const newHistory = [...(r.followUpHistory || []), newRecord];
              const isFinal = newCount >= 3;

              const newStatus: OpportunityStatus = isFinal ? "Follow Up Required" : "Open";

              return {
                ...r,
                followUpCount: newCount,
                followUpHistory: newHistory,
                nextActionDate: oppFollowUpNextDate || r.nextActionDate,
                date: oppFollowUpNextDate || r.date,
                opportunityStatus: newStatus
              };
            }
            return r;
          })
        };
      }
      return c;
    });

    saveClients(updated);
    setIsLoggingOpportunityFollowUp(false);
    setOppFollowUpNotes("");
    setOppFollowUpNextDate("");
  };

  const handleSetOpportunityResolution = (resolution: "Resolved" | "Converted" | "Closed") => {
    if (!activeTaskInfo) return;

    const updated = clients.map(c => {
      if (c.id === activeTaskInfo.clientId) {
        return {
          ...c,
          reminders: c.reminders.map(r => {
            if (r.id === activeTaskInfo.reminderId) {
              return {
                ...r,
                completed: true,
                completedAt: new Date().toISOString(),
                opportunityStatus: resolution
              };
            }
            return r;
          })
        };
      }
      return c;
    });

    saveClients(updated);
  };

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
              const newCompleted = !r.completed;
              return { 
                ...r, 
                completed: newCompleted,
                completedAt: newCompleted ? new Date().toISOString() : undefined 
              };
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
    if (localStorage.getItem("ceo_clients_cleared") === "true") {
      setClients([]);
    } else {
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
    }

    // Initialize Luxe Inventory
    if (localStorage.getItem("ceo_book_inventory_cleared") === "true") {
      setInventory([]);
    } else {
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
    }
  }, []);

  // Listen for database changes and reloads
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
    if (updatedList.length === 0) {
      localStorage.setItem("ceo_book_inventory_cleared", "true");
    } else {
      localStorage.removeItem("ceo_book_inventory_cleared");
    }
    setInventory(updatedList);
    localStorage.setItem("luxe_book_inventory", JSON.stringify(updatedList));
    localStorage.setItem("ceo_luxe_book_inventory", JSON.stringify(updatedList));
    saveEnvironmentInventory(updatedList);
  };

  // Restore application backup
  const handleRestoreBackup = (backupData: {
    clients?: Client[];
    aspiringClients?: AspiringClient[];
    inventory?: LuxeBookInventoryItem[];
    operationsOrders?: OperationsOrder[];
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
    if (backupData.operationsOrders) {
      setOperationsOrders(backupData.operationsOrders);
      localStorage.setItem("ceo_operations_orders", JSON.stringify(backupData.operationsOrders));
      saveEnvironmentOperationsOrders(backupData.operationsOrders, getCurrentEnvironment());
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
    if (updatedList.length === 0) {
      localStorage.setItem("ceo_clients_cleared", "true");
    } else {
      localStorage.removeItem("ceo_clients_cleared");
    }
    setClients(updatedList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    localStorage.setItem("ceo_client_management_data", JSON.stringify(updatedList));
    saveEnvironmentClients(updatedList);
  };

  const handleToggleClientCheckIn = (clientId: string, checkedIn: boolean) => {
    const updated = clients.map(c => c.id === clientId ? { ...c, checkedIn } : c);
    saveClients(updated);
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
    let clientToSave = savedClient;
    // CRITICAL-006: Client ID is immutable after creation.
    // If editing an existing active client, enforce authoritative client id to prevent silent mutation or identity duplication.
    if (activeClient && isEditing && clientToSave.id !== activeClient.id) {
      clientToSave = { ...clientToSave, id: activeClient.id };
    }
    const syncedClient = syncFamilyBirthdayReminders(clientToSave, settings);
    let updatedList = [...clients];
    const index = clients.findIndex(c => c.id === syncedClient.id);
    const oldClient = index !== -1 ? clients[index] : null;
    
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

    if (oldClient) {
      const tierChanged = oldClient.tier !== syncedClient.tier;
      setUndoAction({
        id: `undo_cli_${Date.now()}`,
        message: tierChanged 
          ? `Client ${syncedClient.firstName} ${syncedClient.lastName} tier updated to ${syncedClient.tier}.`
          : `Client profile for ${syncedClient.firstName} ${syncedClient.lastName} saved.`,
        onUndo: () => {
          setClients(prev => {
            const restored = prev.map(c => c.id === oldClient.id ? oldClient : c);
            saveClients(restored);
            return restored;
          });
        }
      });
    }
  };

  // Deactivate a client profile (no permanent deletion to protect historical records)
  const handleDeleteClient = (clientId: string) => {
    const targetClient = clients.find(c => c.id === clientId);
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

    if (targetClient) {
      setUndoAction({
        id: `undo_del_cli_${Date.now()}`,
        message: `Client ${targetClient.firstName} ${targetClient.lastName} deactivated.`,
        onUndo: () => {
          setClients(prev => {
            const restored = prev.map(c => c.id === clientId ? { ...targetClient, deactivated: false } : c);
            saveClients(restored);
            return restored;
          });
        }
      });
    }
  };

  // Import clients from XLSX Spreadsheet
  const handleImportClients = (importedList: Client[]) => {
    let updatedList = [...clients];
    
    importedList.forEach(imported => {
      const checkId = (imported.id || "").trim().toLowerCase();
      const checkName = `${(imported.firstName || "").trim()} ${(imported.lastName || "").trim()}`.toLowerCase();
      const checkPhone = (imported.contact?.phoneNumber || "").trim().replace(/\D/g, "");
      const checkEmail = (imported.contact?.email || "").trim().toLowerCase();

      // Find index by ID, Name, Phone, or Email to prevent any duplicate creation
      const index = updatedList.findIndex(existing => {
        const existingId = (existing.id || "").toLowerCase();
        const existingName = `${(existing.firstName || "").trim()} ${(existing.lastName || "").trim()}`.toLowerCase();
        const existingPhone = (existing.contact?.phoneNumber || "").trim().replace(/\D/g, "");
        const existingEmail = (existing.contact?.email || "").trim().toLowerCase();

        return (
          (existingId && checkId && existingId === checkId) ||
          (existingName && checkName && existingName === checkName) ||
          (checkPhone && existingPhone && existingPhone === checkPhone) ||
          (checkEmail && existingEmail && existingEmail === checkEmail)
        );
      });

      if (index !== -1) {
        // CRITICAL-002 FIX: Safe deep merge protecting existing CRM profile, commitments, notes, and collections
        const existing = updatedList[index];
        const mergedClient = safeMergeClient(existing, imported);
        updatedList[index] = syncFamilyBirthdayReminders(mergedClient, settings);
      } else {
        updatedList.push(syncFamilyBirthdayReminders(imported, settings));
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
      <header className="sticky top-0 z-50 glass-header border-b border-slate-200/80 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.04)]">
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

          {/* Middle Navigation Tabs (Sleek Apple-inspired Pills) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 shadow-inner">
            {/* 1. Dashboard */}
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setIsAdding(false);
                setIsEditing(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === "dashboard" 
                  ? "bg-white text-slate-900 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-slate-200/80" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <div className={`p-1 rounded-lg flex items-center justify-center transition-all ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-indigo-600 border border-slate-200/80 shadow-2xs"
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
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === "operations" 
                  ? "bg-white text-slate-900 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-slate-200/80" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <div className={`p-1 rounded-lg flex items-center justify-center transition-all ${
                activeTab === "operations"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-emerald-600 border border-slate-200/80 shadow-2xs"
              }`}>
                <ClipboardList className="w-3.5 h-3.5" />
              </div>
              Operations Board
            </button>

            {/* 3. Aspiring Clients */}
            <button
              onClick={() => {
                setActiveTab("aspiring");
                setIsAdding(false);
                setIsEditing(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === "aspiring" 
                  ? "bg-white text-slate-900 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-slate-200/80" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <div className={`p-1 rounded-lg flex items-center justify-center transition-all ${
                activeTab === "aspiring"
                  ? "bg-pink-600 text-white shadow-xs"
                  : "bg-white text-pink-600 border border-slate-200/80 shadow-2xs"
              }`}>
                <UserPlus className="w-3.5 h-3.5" />
              </div>
              Aspiring Clients
            </button>

            {/* 4. Client Directory */}
            <button
              onClick={() => {
                setActiveTab("directory");
                setIsAdding(false);
                setIsEditing(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === "directory" 
                  ? "bg-white text-slate-900 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-slate-200/80" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <div className={`p-1 rounded-lg flex items-center justify-center transition-all ${
                activeTab === "directory"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-blue-600 border border-slate-200/80 shadow-2xs"
              }`}>
                <Users className="w-3.5 h-3.5" />
              </div>
              Client Directory
            </button>

            {/* 5. Production Tools */}
            <button
              onClick={() => {
                setActiveTab("production");
                setIsAdding(false);
                setIsEditing(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === "production" 
                  ? "bg-white text-slate-900 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-slate-200/80" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <div className={`p-1 rounded-lg flex items-center justify-center transition-all ${
                activeTab === "production"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-amber-600 border border-slate-200/80 shadow-2xs"
              }`}>
                <Wrench className="w-3.5 h-3.5" />
              </div>
              Production Tools
            </button>

            {/* 6. Inventory */}
            <button
              onClick={() => {
                setActiveTab("inventory");
                setIsAdding(false);
                setIsEditing(false);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === "inventory" 
                  ? "bg-white text-slate-900 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-slate-200/80" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <div className={`p-1 rounded-lg flex items-center justify-center transition-all ${
                activeTab === "inventory"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-white text-purple-600 border border-slate-200/80 shadow-2xs"
              }`}>
                <Archive className="w-3.5 h-3.5" />
              </div>
              Inventory
            </button>
          </nav>

          {/* Right Status Indicator & Settings dropdown */}
          <div className="flex items-center gap-2 relative">

            {/* Settings Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                  isSettingsOpen || activeTab === "excel" || activeTab === "branding" || activeTab === "users"
                    ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200/70 text-slate-600 border-slate-200/60"
                }`}
                title="Settings Control Center"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline text-xs font-semibold">Settings</span>
              </button>

              {isSettingsOpen && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setIsSettingsOpen(false)}
                  />
                  
                  {/* Dropdown Content */}
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-2 z-50 text-left animate-fade-in">
                    <div className="px-3.5 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Tools & Administration</span>
                    </div>

                    {/* Open CMTs Quick Link in Settings */}
                    <button
                      onClick={() => {
                        setIsSettingsOpen(false);
                        setIsAllOpenCmtsModalOpen(true);
                      }}
                      className="w-full px-3.5 py-2 my-1 bg-amber-50 hover:bg-amber-100/90 border-y border-amber-200/80 text-amber-900 flex items-center justify-between transition-all cursor-pointer text-xs font-bold"
                    >
                      <div className="flex items-center gap-1.5">
                        <HeartHandshake className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Open CMTs</span>
                      </div>
                      <span className="bg-amber-200 text-amber-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        {totalOpenCmtsCount}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("calendar");
                        setIsAdding(false);
                        setIsEditing(false);
                        setIsSettingsOpen(false);
                      }}
                      className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-semibold transition-all ${
                        activeTab === "calendar"
                          ? "bg-rose-50 text-rose-800 font-bold border-l-2 border-rose-600"
                          : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 text-rose-600" />
                      Milestone Hub
                    </button>
                    
                    <button
                      onClick={() => {
                        setActiveTab("excel");
                        setIsAdding(false);
                        setIsEditing(false);
                        setIsSettingsOpen(false);
                      }}
                      className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-semibold transition-all ${
                        activeTab === "excel"
                          ? "bg-indigo-50 text-indigo-800 font-bold border-l-2 border-indigo-600"
                          : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-700" />
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
              setActiveTab("operations");
              setIsAdding(false);
              setIsEditing(false);
            }}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
              activeTab === "operations" ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Ops Board
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
              setActiveTab("inventory");
              setIsAdding(false);
              setIsEditing(false);
            }}
            className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-bold ${
              activeTab === "inventory" ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            <Archive className="w-4 h-4" />
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 min-w-0">
        
        {/* Phase Two - Consistent User Identity Header */}
        <div className="text-left pb-6 mb-8 border-b border-slate-200/20 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            {/* Left Column: User Identity, Page Title & Description */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-400 block drop-shadow-sm font-mono leading-none">
                  {userRole === "Staff" ? "Staff User" : userRole}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-white drop-shadow-sm break-words">
                {activeTab === "dashboard" && "Client Watchtower"}
                {activeTab === "operations" && "Operations Board & Production Management"}
                {activeTab === "directory" && (isAdding ? "Create Client Profile" : isEditing ? "Modify Client Profile" : "Client Directory")}
                {activeTab === "aspiring" && "Aspiring Clients & Lead Management"}
                {activeTab === "excel" && "Excel Exchange"}
                {activeTab === "calendar" && "Milestone Calendar"}
                {activeTab === "inventory" && "Inventory"}
                {activeTab === "production" && "Production Tools Workspace"}
                {activeTab === "branding" && "Centralized System Settings"}
                {activeTab === "users" && "User Access & Governance"}
              </h1>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2xl font-medium pt-1 break-words">
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
            inventory={inventory}
            onSaveOrder={handleSaveOperationsOrder}
            onDeleteOrder={handleDeleteOperationsOrder}
            onNavigateToTab={(tab) => setActiveTab(tab as any)}
            onNavigateToClient={handleSelectClient}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
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
                  onToggleCheckIn={handleToggleClientCheckIn}
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
                    operationsOrders={operationsOrders}
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

        {/* Tab 5: Inventory Hub (Librarium Luxe, Regular Goods, Fulfillment Materials) */}
        {activeTab === "inventory" && (
          <InventoryHub 
            inventory={inventory}
            onUpdateInventory={saveInventory}
            settings={settings}
            onUpdateSettings={(newSettings) => setSettings(newSettings)}
            operationsOrders={operationsOrders}
          />
        )}

        {/* Tab: Production Tools Workspace */}
        {activeTab === "production" && (
          <ProductionTools 
            settings={settings}
            inventory={inventory}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {/* Tab 6: Centralized Settings */}
        {activeTab === "branding" && (
          userRole === "Master Administrator" ? (
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
              aspiringClients={aspiringClients}
              onUpdateAspiringClients={saveAspiringClients}
              inventory={inventory}
              onUpdateInventory={saveInventory}
            />
          ) : (
            <div className="max-w-2xl mx-auto my-12 p-8 bg-white/90 border border-slate-200 rounded-3xl shadow-xl text-center space-y-4">
              <Shield className="w-12 h-12 text-rose-500 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
              <p className="text-sm text-slate-600">Master Administrator privileges are required to access System Settings.</p>
            </div>
          )
        )}

        {/* Tab 7: User Access & Governance */}
        {activeTab === "users" && (
          userRole === "Master Administrator" ? (
            <UserManagement 
              onUpdateMasterCredentials={handleUpdateMasterCredentials}
              masterUsername={masterUsername}
            />
          ) : (
            <div className="max-w-2xl mx-auto my-12 p-8 bg-white/90 border border-slate-200 rounded-3xl shadow-xl text-center space-y-4">
              <Shield className="w-12 h-12 text-rose-500 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
              <p className="text-sm text-slate-600">Master Administrator privileges are required to access User Governance.</p>
            </div>
          )
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

      {/* TASK / OPPORTUNITY DETAILS MODAL */}
      {activeTaskInfo && (() => {
        const client = clients.find(c => c.id === activeTaskInfo.clientId);
        const reminder = client?.reminders.find(r => r.id === activeTaskInfo.reminderId);
        if (!client || !reminder) return null;

        const isAdvanceOpportunity = reminder.milestone?.triggerType === "advance_opportunity";
        const followUpCount = reminder.followUpCount || 0;
        const history = reminder.followUpHistory || [];
        const isResolved = reminder.completed || reminder.opportunityStatus === "Resolved" || reminder.opportunityStatus === "Converted" || reminder.opportunityStatus === "Closed";
        
        // Date evaluation
        const currentActionDate = reminder.nextActionDate || reminder.date;
        const dateState = getFollowUpActionState(currentActionDate, isResolved, reminder.opportunityStatus);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full p-6 space-y-4 text-left relative max-h-[90vh] overflow-y-auto my-auto">
              <button 
                onClick={() => {
                  setActiveTaskInfo(null);
                  setIsLoggingOpportunityFollowUp(false);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAdvanceOpportunity ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                  {isAdvanceOpportunity ? <Sparkles className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">
                    {isAdvanceOpportunity ? "Advanced Opportunity" : "Task Details"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    {client.firstName} {client.lastName} ({client.tier} Account)
                  </p>
                </div>
              </div>

              {/* Advanced Opportunity Architecture */}
              {isAdvanceOpportunity ? (
                <div className="space-y-4">
                  {/* Opportunity Details Card */}
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 space-y-2 text-slate-700">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                        🎁 {reminder.milestone?.eventType === "birthday" ? "Birthday Opportunity" : reminder.milestone?.eventType === "anniversary" ? "Anniversary Opportunity" : "Milestone Opportunity"}
                      </span>
                      <span className="font-mono text-amber-900 font-bold bg-white/90 px-2 py-0.5 rounded border border-amber-200 shadow-2xs">
                        Event Date: {reminder.milestone?.eventDate}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800">
                      Target: <span className="font-bold text-amber-950">{reminder.milestone?.personName}</span> ({reminder.milestone?.relationship})
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60 text-[11px]">
                      <span className="text-slate-500 font-medium">Scheduled Action Date:</span>
                      <span className="font-mono font-bold text-slate-800">{currentActionDate}</span>
                      
                      {/* Date Status Badge */}
                      {dateState.status === "Due" && (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          Due Today
                        </span>
                      )}
                      {dateState.status === "Missed" && (
                        <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          Missed Opportunity ({dateState.daysDiff}d ago)
                        </span>
                      )}
                      {dateState.status === "Upcoming" && (
                        <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-600" />
                          {dateState.label}
                        </span>
                      )}
                      {dateState.status === "Completed" && (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          ✓ {reminder.opportunityStatus || "Completed"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1 -> 2 -> 3 Visual Progression */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <span>Follow-Up Progression</span>
                      <span className="text-indigo-600 font-bold">
                        {isResolved ? "Resolved" : `Attempt ${Math.min(followUpCount + 1, 3)} of 3`}
                      </span>
                    </div>

                    {/* Step Indicators */}
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((step) => {
                        const isCompletedStep = followUpCount >= step;
                        const isCurrentStep = followUpCount === step - 1 && !isResolved;
                        return (
                          <div 
                            key={step}
                            className={`p-2.5 rounded-xl border text-center transition-all ${
                              isCompletedStep 
                                ? "bg-emerald-50/80 border-emerald-200 text-emerald-900" 
                                : isCurrentStep 
                                  ? "bg-indigo-50 border-indigo-300 text-indigo-950 ring-1 ring-indigo-400" 
                                  : "bg-white border-slate-200 text-slate-400 opacity-60"
                            }`}
                          >
                            <div className="text-[10px] font-black uppercase">Follow-Up {step}</div>
                            <div className="text-[11px] font-bold mt-0.5">
                              {isCompletedStep ? "✓ Actioned" : isCurrentStep ? "Available" : "Pending"}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Button for Current Attempt */}
                    {!isResolved && followUpCount < 3 && !isLoggingOpportunityFollowUp && (
                      <button
                        type="button"
                        onClick={() => setIsLoggingOpportunityFollowUp(true)}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Action Follow-Up {followUpCount + 1}
                      </button>
                    )}

                    {/* Inline Form to Log Follow-Up Attempt */}
                    {isLoggingOpportunityFollowUp && (
                      <form onSubmit={handleLogOpportunityFollowUpSubmit} className="space-y-3 pt-2 border-t border-slate-200 animate-fade-in">
                        <div className="flex items-center justify-between text-[11px] font-black text-indigo-900">
                          <span>Log Follow-Up Attempt #{followUpCount + 1}</span>
                          <button
                            type="button"
                            onClick={() => setIsLoggingOpportunityFollowUp(false)}
                            className="text-slate-400 hover:text-slate-600 text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Contact Method</label>
                            <select
                              value={oppFollowUpMethod}
                              onChange={(e) => setOppFollowUpMethod(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
                            >
                              <option value="Phone Call">Phone Call</option>
                              <option value="WhatsApp">WhatsApp</option>
                              <option value="Instagram">Instagram DM</option>
                              <option value="Email">Email</option>
                              <option value="In Person">In Person</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Next Action Date</label>
                            <input
                              type="date"
                              value={oppFollowUpNextDate}
                              onChange={(e) => setOppFollowUpNextDate(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Action Notes</label>
                          <textarea
                            value={oppFollowUpNotes}
                            onChange={(e) => setOppFollowUpNotes(e.target.value)}
                            placeholder="Record client response or next steps..."
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 resize-none h-16 focus:outline-none"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                        >
                          Complete Attempt #{followUpCount + 1}
                        </button>
                      </form>
                    )}

                    {/* Disposition / Resolution Options */}
                    {(followUpCount >= 3 || isResolved) && (
                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Opportunity Disposition
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => handleSetOpportunityResolution("Converted")}
                            className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                              reminder.opportunityStatus === "Converted" 
                                ? "bg-emerald-600 text-white border-emerald-600" 
                                : "bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            ✓ Converted
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetOpportunityResolution("Resolved")}
                            className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                              reminder.opportunityStatus === "Resolved" 
                                ? "bg-indigo-600 text-white border-indigo-600" 
                                : "bg-white hover:bg-indigo-50 text-indigo-800 border-indigo-200"
                            }`}
                          >
                            ✓ Resolved
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetOpportunityResolution("Closed")}
                            className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                              reminder.opportunityStatus === "Closed" 
                                ? "bg-slate-700 text-white border-slate-700" 
                                : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            Closed
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Follow-Up History Log */}
                  {history.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                        <span>Opportunity Follow-Up History</span>
                        <span>{history.length} Attempt{history.length > 1 ? "s" : ""}</span>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {history.map((item, idx) => (
                          <div key={item.id || idx} className="bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 text-xs space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-black text-indigo-900">
                                Follow-Up {item.attemptNumber || idx + 1} ({item.method || "Contact"})
                              </span>
                              <span className="font-mono text-slate-400 font-bold">{item.date}</span>
                            </div>
                            <p className="text-slate-700 text-[11px] font-medium leading-relaxed">
                              {item.notes}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Standard Task View */
                <div className="space-y-3 text-xs">
                  {reminder.milestone && (
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 space-y-1 text-slate-700">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                          🎂 Milestone Occurrence Reminder
                        </span>
                        <span className="font-mono text-amber-800 font-bold bg-white/80 px-2 py-0.5 rounded border border-amber-200/50">{reminder.milestone.eventDate}</span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-700">
                        {reminder.milestone.relationship}: <span className="font-bold text-slate-900">{reminder.milestone.personName}</span> ({reminder.milestone.eventType})
                      </p>
                      {reminder.completedAt && (
                        <p className="text-[10px] text-emerald-700 font-semibold pt-0.5">
                          ✓ Handled on {new Date(reminder.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

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
                        className={`w-full flex items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
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
              )}

              {/* Modal Footer Controls */}
              <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100">
                {!isAdvanceOpportunity && (
                  <button
                    type="button"
                    onClick={handleUpdateTaskDetails}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold p-2.5 rounded-xl transition-all shadow-sm text-center cursor-pointer"
                  >
                    Save Changes
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTaskInfo(null);
                    handleSelectClient(client.id);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold p-2.5 rounded-xl transition-all text-center cursor-pointer"
                >
                  Open Client Profile
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTaskFromModal}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold p-2.5 rounded-xl transition-all text-center cursor-pointer"
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

      {/* Lightweight Universal Undo Toast */}
      <UndoToast
        action={undoAction}
        onDismiss={() => setUndoAction(null)}
      />

      {/* Convert Duplicate Confirmation Modal */}
      <ConvertDuplicateModal
        isOpen={!!duplicateModalData}
        aspiringClient={duplicateModalData?.aspiringClient || null}
        matchedClients={duplicateModalData?.matchedClients || []}
        onClose={() => setDuplicateModalData(null)}
        onLinkToExisting={(targetClient) => {
          if (duplicateModalData?.aspiringClient) {
            executeConversionLinkToExisting(duplicateModalData.aspiringClient, targetClient);
          }
        }}
        onCreateNew={() => {
          if (duplicateModalData?.aspiringClient) {
            executeConversionNewClient(duplicateModalData.aspiringClient);
          }
        }}
      />

      {/* Back-Office Master Open CMTs Review Modal */}
      {isAllOpenCmtsModalOpen && (
        <CmtManagementModal
          isOpen={isAllOpenCmtsModalOpen}
          onClose={() => setIsAllOpenCmtsModalOpen(false)}
          clients={clients}
          onUpdateClients={setClients}
          onNavigateToClient={handleSelectClient}
        />
      )}

    </div>
  );
}
