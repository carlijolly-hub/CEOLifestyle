import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import AddAspiringClientModal from "./AddAspiringClientModal";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { Client, FollowUpReminder, TimelineEvent, LuxeBookInventoryItem, BusinessEvent, SystemSettings, AspiringClient, AspiringClientStatus, PromotionOpportunity, OperationsOrder } from "../types";
import { 
  Users, 
  Printer, 
  BookOpen, 
  Globe, 
  Award, 
  Calendar, 
  DollarSign, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Package,
  Clock,
  AlertCircle,
  Gift,
  MessageSquare,
  Notebook,
  Heart,
  Sparkles,
  Search,
  Activity,
  CheckCircle2,
  Smartphone,
  Mail,
  UserPlus,
  UserCheck,
  MapPin,
  Shirt,
  Layers,
  Calculator,
  SlidersHorizontal,
  X,
  Crown,
  Star,
  ClipboardList
} from "lucide-react";
import { SmallCalendarWidget } from "./MilestoneCalendar";
import { getRelationshipEventTitle, getClientMilestones } from "../utils/dateHelpers";
import { getClientTierRegister, evaluateClientPromotions, approveClientPromotion, calculateHealthScore, getTierSource } from "../utils/clientTierUtils";

import BookCostCalculator from "./BookCostCalculator";
import LocationCostCalculator from "./LocationCostCalculator";
import ProductionLayoutCalculator from "./ProductionLayoutCalculator";
import DTFPrintingCalculator from "./DTFPrintingCalculator";
import TShirtStudioQuoteCalculator from "./TShirtStudioQuoteCalculator";
import FavoriteQuotesWidget from "./FavoriteQuotesWidget";
import { formatInstagramUsername } from "../utils/contactUtils";

interface DashboardProps {
  clients: Client[];
  aspiringClients?: AspiringClient[];
  setAspiringClients?: React.Dispatch<React.SetStateAction<AspiringClient[]>>;
  onConvertToClient?: (aspiringClient: AspiringClient) => void;
  inventory?: LuxeBookInventoryItem[];
  operationsOrders?: OperationsOrder[];
  onSelectClient: (clientId: string) => void;
  onNavigateToTab: (tab: string) => void;
  onNavigateToAspiringAdd?: () => void;
  onOpenTask?: (clientId: string, reminderId: string) => void;
  settings?: SystemSettings;
}

const MONTH_MAP: { [key: string]: number } = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11
};

// Dynamic Real-Time Date
const realToday = new Date();
const CURRENT_YEAR = realToday.getFullYear();
const CURRENT_MONTH = realToday.getMonth();
const CURRENT_DAY = realToday.getDate();
const CURRENT_SIM_DATE = realToday;

// 1. Robust Date Parsing
function parseDateString(dateStr: string): { month: number; day: number; year?: number } | null {
  if (!dateStr) return null;
  const s = dateStr.trim();
  
  // Try YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1], 10),
      month: parseInt(isoMatch[2], 10) - 1,
      day: parseInt(isoMatch[3], 10)
    };
  }

  // Clean strings like "August 22, 2018"
  const cleaned = s.toLowerCase().replace(/,/g, "").replace(/:/g, " ").trim();
  const tokens = cleaned.split(/\s+/);
  
  let month = -1;
  let day = -1;
  let year: number | undefined = undefined;

  for (const token of tokens) {
    if (MONTH_MAP[token] !== undefined) {
      month = MONTH_MAP[token];
    } else {
      const parsedVal = parseInt(token, 10);
      if (!isNaN(parsedVal)) {
        if (parsedVal > 1900 && parsedVal < 2100) {
          year = parsedVal;
        } else if (parsedVal >= 1 && parsedVal <= 31) {
          if (day === -1) {
            day = parsedVal;
          } else {
            if (parsedVal > 100) {
              year = parsedVal;
            }
          }
        }
      }
    }
  }

  if (month !== -1 && day !== -1) {
    return { month, day, year };
  }
  return null;
}

// 2. Days until next occurrence (for recurring events like birthdays)
function getDaysUntilNext(month: number, day: number): number {
  const current = new Date(CURRENT_YEAR, CURRENT_MONTH, CURRENT_DAY);
  let target = new Date(CURRENT_YEAR, month, day);
  
  if (target.getTime() < current.getTime()) {
    target = new Date(CURRENT_YEAR + 1, month, day);
  }
  
  const diffTime = target.getTime() - current.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 3. Days since a historical date (can return negative values if the date is in the future)
function getDaysSince(dateStr: string): number {
  if (!dateStr) return 9999;
  const parsed = parseDateString(dateStr);
  if (!parsed) return 9999;
  
  const year = parsed.year || CURRENT_YEAR;
  const dateObj = new Date(year, parsed.month, parsed.day);
  const diffTime = CURRENT_SIM_DATE.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

interface TriggerItem {
  type: "birthday" | "anniversary" | "child_birthday" | "order_anniversary" | "reminder" | "no_contact" | "no_order";
  priority: 1 | 2 | 3 | 4;
  reason: string;
  daysRemaining?: number;
  metadata?: any;
}

interface FocusProfile {
  client: Client;
  highestPriority: number;
  triggers: TriggerItem[];
  isAspiring?: boolean;
  aspiringClient?: AspiringClient;
}

// Helper to calculate Average Order Value safely without crashing if history is undefined
const getClientHistoryAOV = (client: any): number => {
  if (!client || !client.history) return 0;
  if (client.history.averageOrderValue) return client.history.averageOrderValue;
  if (client.history.totalOrders > 0 && client.history.lifetimeRevenue) {
    return Math.round(client.history.lifetimeRevenue / client.history.totalOrders);
  }
  return 0;
};

export default function Dashboard({ clients, aspiringClients, setAspiringClients, onConvertToClient, inventory = [], operationsOrders = [], onSelectClient, onNavigateToTab, onNavigateToAspiringAdd, onOpenTask, settings }: DashboardProps) {
  const [focusFilter, setFocusFilter] = useState<"all" | "urgent" | "milestones" | "operations" | "inventory">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [summaryTab, setSummaryTab] = useState<"today" | "this_week" | "overview">("today");
  const [expandedAttentionId, setExpandedAttentionId] = useState<string | null>(null);

  // Operations Board Summary Metrics Calculation
  const opsMetrics = useMemo(() => {
    const list = operationsOrders || [];
    const active = list.filter(o => o.productionStatus !== "Completed" && o.productionStatus !== "Cancelled");
    
    let dueTodayCount = 0;
    let overdueCount = 0;
    let readyPickupCount = 0;

    active.forEach(o => {
      if (o.dueDate) {
        const diffDays = getDaysSince(o.dueDate);
        if (diffDays === 0) dueTodayCount++;
        else if (diffDays > 0) overdueCount++;
      }
      if (o.productionStatus === "Ready for Pickup") readyPickupCount++;
    });

    return {
      activeOrders: active.length,
      dueToday: dueTodayCount,
      overdue: overdueCount,
      readyPickup: readyPickupCount
    };
  }, [operationsOrders]);

  // Aspiring Clients Follow-Up Calculation
  const aspiringFollowUps = useMemo(() => {
    if (!aspiringClients) return [];

    return aspiringClients
      .filter(c => c.status !== "Converted to Client" && c.status !== "Archived" && c.status !== "Not Interested" && c.followUpDate)
      .map(c => {
        const daysOverdue = getDaysSince(c.followUpDate); // >0 = overdue, 0 = today, <0 = future
        return {
          ...c,
          isOverdue: daysOverdue > 0,
          isDueToday: daysOverdue === 0,
          daysOverdue
        };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue); // Overdue first
  }, [aspiringClients]);

  const aspiringOverdueCount = aspiringFollowUps.filter(f => f.isOverdue).length;
  const aspiringDueTodayCount = aspiringFollowUps.filter(f => f.isDueToday).length;

  const handleQuickRescheduleAspiring = (id: string, newDate: string, newStatus?: AspiringClientStatus) => {
    if (setAspiringClients) {
      setAspiringClients(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            followUpDate: newDate,
            status: newStatus || item.status
          };
        }
        return item;
      }));
    }
  };

  // Client Tier Register & Promotion State (Independent Tier Register & No Demotion Policy)
  const [tierRegister, setTierRegister] = useState(() => getClientTierRegister(clients));
  const [selectedDashboardPromotion, setSelectedDashboardPromotion] = useState<PromotionOpportunity | null>(null);
  useBodyScrollLock(!!selectedDashboardPromotion);

  useEffect(() => {
    setTierRegister(getClientTierRegister(clients));
  }, [clients]);

  const dashboardPromotions = useMemo(() => {
    return evaluateClientPromotions(clients, tierRegister);
  }, [clients, tierRegister]);

  // Client Watchtower Executive Intelligence Engine
  const watchtowerIntelligence = useMemo(() => {
    const alerts: {
      id: string;
      type: "Platinum Inactive" | "Health Alert" | "Founders Touchpoint" | "Delinquent Review" | "Problematic Review" | "Gold Dormant" | "Promotion Recommendation";
      client: Client;
      severity: "urgent" | "warning" | "info";
      title: string;
      subtitle: string;
      reason: string;
      actionText: string;
    }[] = [];

    clients.forEach(c => {
      const revenue = c.history?.lifetimeRevenue || 0;
      const lastOrder = c.history?.lastOrderDate || c.lastContactedDate || "";
      const health = calculateHealthScore(c);

      let daysInactive = 0;
      if (lastOrder) {
        const d = new Date(lastOrder);
        if (!isNaN(d.getTime())) {
          daysInactive = Math.floor((new Date().getTime() - d.getTime()) / (1000 * 3600 * 24));
        }
      }

      // 1. Delinquent Risk Alert
      if (c.tier === "Delinquent" || c.managementClassification === "Delinquent") {
        alerts.push({
          id: `delinq_${c.id}`,
          type: "Delinquent Review",
          client: c,
          severity: "urgent",
          title: `🚨 Delinquent Account Review Required`,
          subtitle: `${c.firstName} ${c.lastName} (${c.id})`,
          reason: `Account flagged as Delinquent. Audit outstanding payments and communication log.`,
          actionText: "Review Account"
        });
      }

      // 2. Problematic Relationship Alert
      if (c.tier === "Problematic" || c.managementClassification === "Problematic") {
        alerts.push({
          id: `prob_${c.id}`,
          type: "Problematic Review",
          client: c,
          severity: "urgent",
          title: `⚠️ Problematic Client Relationship`,
          subtitle: `${c.firstName} ${c.lastName} (${c.id})`,
          reason: `Client classified Problematic. Executive review required before accepting new orders.`,
          actionText: "Review Relationship"
        });
      }

      // 3. Platinum Client Inactive 180+ days
      if (c.tier === "Platinum" && (daysInactive >= 180 || c.relationshipStatus === "Dormant")) {
        alerts.push({
          id: `plat_inact_${c.id}`,
          type: "Platinum Inactive",
          client: c,
          severity: "warning",
          title: `💎 Platinum Client Inactive (${daysInactive > 0 ? `${daysInactive} Days` : 'Dormant'})`,
          subtitle: `${c.firstName} ${c.lastName} • Spend: $${revenue.toLocaleString()} JMD`,
          reason: `High-value Platinum client has had no purchase activity in over 6 months. Relationship recovery advised.`,
          actionText: "Initiate Outreach"
        });
      }

      // 4. High Lifetime Spend + Low Health Score (Health <= 40)
      if (revenue >= 50000 && health <= 40 && c.tier !== "Delinquent" && c.tier !== "Problematic") {
        alerts.push({
          id: `health_alert_${c.id}`,
          type: "Health Alert",
          client: c,
          severity: "warning",
          title: `📉 High Value Client Health Alert (Score: ${health}/100)`,
          subtitle: `${c.firstName} ${c.lastName} • Spend: $${revenue.toLocaleString()} JMD`,
          reason: `Valuable historical relationship showing declining health score (${health}/100). Executive check-in needed.`,
          actionText: "Schedule Touchpoint"
        });
      }

      // 5. Founders Family Executive Attention
      if (c.tier === "Founders Family" && (daysInactive >= 90 || health < 60)) {
        alerts.push({
          id: `founders_${c.id}`,
          type: "Founders Touchpoint",
          client: c,
          severity: "info",
          title: `👑 Founders Family Courtesy Touchpoint`,
          subtitle: `${c.firstName} ${c.lastName} • Priority Legacy Relationship`,
          reason: `Permanent VIP Founders Family account requires periodic executive courtesy contact.`,
          actionText: "Executive Check-in"
        });
      }

      // 6. Gold Client Becoming Dormant
      if (c.tier === "Gold" && daysInactive >= 120) {
        alerts.push({
          id: `gold_dorm_${c.id}`,
          type: "Gold Dormant",
          client: c,
          severity: "info",
          title: `🥇 Gold Client Inactive (${daysInactive} Days)`,
          subtitle: `${c.firstName} ${c.lastName} • Spend: $${revenue.toLocaleString()} JMD`,
          reason: `Gold client engagement cooling down. Send personalized luxury offer or check-in.`,
          actionText: "Contact Client"
        });
      }
    });

    return alerts;
  }, [clients]);

  // Dashboard Executive Carousel Navigation State & Preferences
  const ALL_CAROUSEL_IDS = useMemo(() => [
    "tshirt_calc",
    "operations_board",
    "inventory",
    "book_calc",
    "location_calc",
    "agenda",
    "favorite_quotes",
    "promotions",
    "aspiring"
  ], []);

  const DEFAULT_CAROUSEL_ORDER = useMemo(() => [
    "tshirt_calc",
    "operations_board",
    "inventory",
    "book_calc",
    "location_calc",
    "agenda",
    "aspiring"
  ], []);

  const [carouselOrder, setCarouselOrder] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("dashboard_carousel_order_v2.1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validParsed = parsed.filter(id => ALL_CAROUSEL_IDS.includes(id));
          const existingSet = new Set(validParsed);
          const missing = DEFAULT_CAROUSEL_ORDER.filter(id => !existingSet.has(id));
          const combined = [...validParsed, ...missing];
          if (combined.length > 0) return combined;
        }
      }
    } catch (e) {
      console.error("Error reading carousel order:", e);
    }
    return DEFAULT_CAROUSEL_ORDER;
  });

  // Add Aspiring Client Quick Modal State
  const [showAddAspiringModal, setShowAddAspiringModal] = useState(false);
  const [aspiringFormError, setAspiringFormError] = useState("");
  const [newAspiringData, setNewAspiringData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    instagramUsername: "",
    preferredContactMethod: "Instagram",
    serviceInterestedIn: "Custom T-Shirts & Apparel",
    sourceOfInquiry: "Instagram",
    notes: "",
    followUpDate: new Date().toISOString().split("T")[0]
  });

  const handleSaveNewAspiring = (e: React.FormEvent) => {
    e.preventDefault();
    setAspiringFormError("");

    if (!newAspiringData.name.trim()) {
      setAspiringFormError("Customer Name is required.");
      return;
    }

    const phone = newAspiringData.phoneNumber.trim();
    const email = newAspiringData.email.trim();
    const rawIg = newAspiringData.instagramUsername.trim();
    const formattedIg = formatInstagramUsername(rawIg);

    if (!phone && !email && !formattedIg) {
      setAspiringFormError("At least ONE contact method (Phone Number, Email, or Instagram Username) is required.");
      return;
    }

    const parts = [];
    if (phone) parts.push(phone);
    if (email) parts.push(email);
    if (formattedIg) parts.push(formattedIg);
    const summaryContact = parts.join(" | ");

    const todayStr = new Date().toISOString().split("T")[0];

    const newEntry: AspiringClient = {
      id: `ASP-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newAspiringData.name.trim(),
      phoneNumber: phone,
      email: email,
      instagramUsername: formattedIg,
      preferredContactMethod: newAspiringData.preferredContactMethod || "Instagram",
      contactInfo: summaryContact,
      sourceOfInquiry: newAspiringData.sourceOfInquiry || "Instagram",
      serviceInterestedIn: newAspiringData.serviceInterestedIn || "Custom T-Shirts & Apparel",
      dateContacted: todayStr,
      notes: newAspiringData.notes.trim(),
      assignedUser: "Master Administrator",
      followUpDate: newAspiringData.followUpDate || todayStr,
      status: "New Inquiry"
    };

    if (setAspiringClients) {
      setAspiringClients(prev => [newEntry, ...prev]);
    }

    setShowAddAspiringModal(false);
    setNewAspiringData({
      name: "",
      phoneNumber: "",
      email: "",
      instagramUsername: "",
      preferredContactMethod: "Instagram",
      serviceInterestedIn: "Custom T-Shirts & Apparel",
      sourceOfInquiry: "Instagram",
      notes: "",
      followUpDate: todayStr
    });
  };

  const [activeWidgetId, setActiveWidgetId] = useState<string>(() => {
    const storedId = localStorage.getItem("dashboard_carousel_active_id_v2.1");
    if (storedId && DEFAULT_CAROUSEL_ORDER.includes(storedId)) return storedId;
    const storedIdx = localStorage.getItem("dashboard_carousel_index_v2.1");
    if (storedIdx !== null) {
      const idx = parseInt(storedIdx, 10);
      if (!isNaN(idx) && idx >= 0 && idx < DEFAULT_CAROUSEL_ORDER.length) {
        return DEFAULT_CAROUSEL_ORDER[idx] || "tshirt_calc";
      }
    }
    return "tshirt_calc";
  });

  const [showWidgetSelectorMenu, setShowWidgetSelectorMenu] = useState<boolean>(false);

  React.useEffect(() => {
    localStorage.setItem("dashboard_carousel_order_v2.1", JSON.stringify(carouselOrder));
  }, [carouselOrder]);

  React.useEffect(() => {
    localStorage.setItem("dashboard_carousel_active_id_v2.1", activeWidgetId);
    const idx = carouselOrder.indexOf(activeWidgetId);
    if (idx !== -1) {
      localStorage.setItem("dashboard_carousel_index_v2.1", idx.toString());
    }
  }, [activeWidgetId, carouselOrder]);

  // Backward compatibility alias for any component referencing currentCarouselIndex
  const currentCarouselIndex = useMemo(() => {
    const idx = carouselOrder.indexOf(activeWidgetId);
    return idx >= 0 ? idx : 0;
  }, [carouselOrder, activeWidgetId]);

  const setCurrentCarouselIndex = (indexOrFn: number | ((prev: number) => number)) => {
    let newIndex = 0;
    if (typeof indexOrFn === "function") {
      newIndex = indexOrFn(currentCarouselIndex);
    } else {
      newIndex = indexOrFn;
    }
    const safeIdx = (newIndex + carouselOrder.length) % carouselOrder.length;
    if (carouselOrder[safeIdx]) {
      setActiveWidgetId(carouselOrder[safeIdx]);
    }
  };

  // Luxe Inventory Alerts
  const inventoryAlerts = useMemo(() => {
    const lowThreshold = settings ? settings.lowStockThreshold : 5;
    const activeInv = inventory.filter(item => !item.archived);
    const outOfStock = activeInv.filter(item => item.quantity <= 0);
    const lowStock = activeInv.filter(item => item.quantity > 0 && item.quantity <= lowThreshold);
    const urgentRestock = activeInv.filter(item => item.rankingStatus === "Urgent Restock" && item.quantity > 0);
    const activeAlertsList = activeInv.filter(item => item.quantity <= lowThreshold || item.rankingStatus === "Urgent Restock");
    return {
      outOfStock,
      lowStock,
      urgentRestock,
      activeAlertsList,
      totalAlerts: activeAlertsList.length
    };
  }, [inventory, settings]);

  // Luxe Inventory Detailed Tasks and Reconciliation Alerts
  const inventoryTasks = useMemo(() => {
    const tasks: any[] = [];
    if (!inventory) return tasks;

    inventory.forEach(item => {
      if (item.archived) return;

      const total = item.quantity;
      const inStore = item.inStore ?? 0;
      const office = item.office ?? 0;
      const physicalCount = inStore + office;

      // 1. Stock level exceptions
      if (total <= 0) {
        tasks.push({
          id: `inv-task-${item.id}-out-of-stock`,
          isInventoryTask: true,
          title: item.title,
          severity: "urgent",
          type: "out_of_stock",
          description: "Out of Stock",
          detailedText: `"${item.title}" — Out of Stock`,
          recommendedAction: "Order restock copies immediately to fulfill backorders.",
          quantityAffected: 0
        });
      } else if (total <= (settings ? settings.lowStockThreshold : 5)) {
        const isUrgent = item.rankingStatus === "Urgent Restock";
        tasks.push({
          id: `inv-task-${item.id}-low-stock`,
          isInventoryTask: true,
          title: item.title,
          severity: isUrgent ? "urgent" : "high",
          type: isUrgent ? "urgent_restock" : "low_stock",
          description: isUrgent 
            ? `Restock Recommended (${total} copy${total > 1 ? 's' : ''} remaining)`
            : `Low Stock (${total} copy${total > 1 ? 's' : ''} remaining)`,
          detailedText: isUrgent
            ? `"${item.title}" — Restock Recommended (${total} copy${total > 1 ? 's' : ''} remaining)`
            : `"${item.title}" — Low Stock (${total} copy${total > 1 ? 's' : ''} remaining)`,
          recommendedAction: isUrgent 
            ? "Urgent: Place restocking order. Premium copies are critically low."
            : "Monitor rate of sale and schedule restocking.",
          quantityAffected: total
        });
      } else if (item.rankingStatus === "Urgent Restock") {
        tasks.push({
          id: `inv-task-${item.id}-urgent-restock`,
          isInventoryTask: true,
          title: item.title,
          severity: "urgent",
          type: "urgent_restock",
          description: "Urgent Restock Recommended",
          detailedText: `"${item.title}" — Restock Recommended (${total} copies remaining)`,
          recommendedAction: "Critical Restock: Place restocking order. High-priority title.",
          quantityAffected: total
        });
      } else if (item.rankingStatus === "Restock") {
        tasks.push({
          id: `inv-task-${item.id}-restock`,
          isInventoryTask: true,
          title: item.title,
          severity: "high",
          type: "restock_recommended",
          description: "Restock Recommended",
          detailedText: `"${item.title}" — Restock Recommended (${total} copies remaining)`,
          recommendedAction: "Schedule a standard reorder process for this listing.",
          quantityAffected: total
        });
      }

      // 2. Inventory Reconciliation Alerts
      const hasMissingFields = item.inStore === undefined || item.office === undefined;
      const mismatch = physicalCount !== total;

      if (mismatch || hasMissingFields) {
        if (hasMissingFields) {
          tasks.push({
            id: `inv-task-${item.id}-missing-alloc`,
            isInventoryTask: true,
            title: item.title,
            severity: "high",
            type: "mismatch",
            description: "Inventory Count Mismatch: Physical count does not match recorded inventory.",
            detailedText: `"${item.title}" — Physical count does not match recorded inventory.`,
            recommendedAction: "Specify physical allocations for In Store and Office.",
            quantityAffected: total
          });
        } else if (physicalCount < total) {
          const diff = total - physicalCount;
          tasks.push({
            id: `inv-task-${item.id}-variance-missing`,
            isInventoryTask: true,
            title: item.title,
            severity: "urgent",
            type: "variance_missing",
            description: `Inventory Variance: ${diff} book${diff > 1 ? 's' : ''} missing`,
            detailedText: `"${item.title}" — Inventory Count Mismatch (Expected: ${total}, Found: ${physicalCount})`,
            recommendedAction: `Inventory Count Mismatch: Physical count does not match recorded inventory. Variance: ${diff} book${diff > 1 ? 's' : ''} missing.`,
            quantityAffected: diff
          });
        } else if (physicalCount > total) {
          const diff = physicalCount - total;
          tasks.push({
            id: `inv-task-${item.id}-variance-excess`,
            isInventoryTask: true,
            title: item.title,
            severity: "high",
            type: "variance_excess",
            description: `Inventory Variance: ${diff} additional cop${diff > 1 ? 'ies' : 'y'} recorded`,
            detailedText: `"${item.title}" — Inventory Variance: ${diff} additional cop${diff > 1 ? 'ies' : 'y'} recorded`,
            recommendedAction: `Inventory Count Mismatch: Physical count does not match recorded inventory. Variance: ${diff} additional copies recorded.`,
            quantityAffected: diff
          });
        }
      }
    });

    return tasks;
  }, [inventory, settings]);

  // Real-time filtered inventory tasks based on current focusFilter
  const filteredInventoryTasks = useMemo(() => {
    if (focusFilter === "inventory") {
      return inventoryTasks;
    }
    return [];
  }, [inventoryTasks, focusFilter]);

  // Format currency beautifully (JMD)
  const formatCurrency = (val: number) => {
    return `J$${Math.round(val).toLocaleString()}`;
  };

  const getBrandCardClasses = (homeBrand: string) => {
    if (homeBrand === "CEO Printing Services") {
      return "bg-blue-50/45 border-blue-200/85 hover:bg-blue-50/70 border-l-4 border-l-blue-600";
    }
    if (homeBrand === "Librarium Luxe") {
      return "bg-rose-50/35 border-[#5C1A24]/30 hover:bg-rose-50/70 border-l-4 border-l-[#5C1A24]";
    }
    if (homeBrand === "CEO Lifestyle") {
      return "bg-purple-50/35 border-purple-200/80 hover:bg-purple-50/70 border-l-4 border-l-purple-700";
    }
    return "bg-slate-50 border-slate-200 hover:bg-slate-100 border-l-4 border-l-slate-400";
  };

  // 4. GENERATE INTELLIGENT RELATIONSHIP FOCUS PROFILES
  const focusProfiles = useMemo(() => {
    const profiles: FocusProfile[] = [];

    clients.forEach(client => {
      const triggers: TriggerItem[] = [];
      const isGold = client.tier === "Gold" || client.tier === "Platinum";

      // A & B. Centralized Milestone Events (Birthday, Anniversary, Family birthdays, etc.)
      const milestones = getClientMilestones(client);
      milestones.forEach(m => {
        const parsed = parseDateString(m.date);
        if (!parsed) return;

        const days = getDaysUntilNext(parsed.month, parsed.day);
        if (days >= 0 && days <= 30) {
          const priority = isGold ? 1 : 3;
          let reason = "";
          if (days === 0) {
            reason = `${m.label} is TODAY! Send immediate personalized greetings.`;
          } else {
            reason = `${m.label} is approaching in ${days} day${days > 1 ? 's' : ''} (${m.date}).`;
          }

          triggers.push({
            type: m.type === "birthday" ? (m.relationship === "Child" ? "child_birthday" : "birthday") : "anniversary",
            priority,
            reason,
            daysRemaining: days,
            metadata: { date: m.date, label: m.label }
          });
        }
      });

      // C. Previous Order Anniversaries (Re-purchase reminders)
      client.timeline.forEach(event => {
        if (event.type === "Order" && event.date) {
          const parsed = parseDateString(event.date);
          if (!parsed || !parsed.year) return;

          const days = getDaysUntilNext(parsed.month, parsed.day);
          const yearsAgo = CURRENT_YEAR - parsed.year;

          if (days >= 0 && days <= 30 && yearsAgo > 0) {
            // Repeat client with event -> Priority 3
            triggers.push({
              type: "order_anniversary",
              priority: 3,
              reason: days === 0
                ? `Purchase Anniversary: Ordered "${event.content}" exactly ${yearsAgo} year${yearsAgo > 1 ? 's' : ''} ago today!`
                : `Purchase Anniversary approaching: Bought "${event.content}" ${yearsAgo} year${yearsAgo > 1 ? 's' : ''} ago on this date. Good moment to follow up.`,
              daysRemaining: days,
              metadata: { item: event.content, date: event.date, yearsAgo }
            });
          }
        }
      });

      // D. Follow-up Reminders / Pending Tasks
      client.reminders.forEach(reminder => {
        if (!reminder.completed) {
          const daysSince = getDaysSince(reminder.date);
          const daysDiff = -daysSince; // Negative if overdue, 0 if today, positive if upcoming

          // Include overdue tasks (daysSince > 0) and upcoming tasks due within 30 days (daysDiff >= 0 && daysDiff <= 30)
          if (daysSince > 0 || (daysDiff >= 0 && daysDiff <= 30)) {
            const isOverdue = daysSince > 0;
            const isDueToday = daysSince === 0;
            const priority = (isOverdue || isDueToday || isGold) ? 1 : 4;

            let reason = "";
            if (isOverdue) {
              reason = `Overdue task: "${reminder.task}" was due ${daysSince} day${daysSince > 1 ? 's' : ''} ago! (${reminder.date})`;
            } else if (isDueToday) {
              reason = `Task due TODAY: "${reminder.task}"`;
            } else {
              reason = `Task: "${reminder.task}" is due in ${daysDiff} day${daysDiff > 1 ? 's' : ''}.`;
            }

            triggers.push({
              type: "reminder",
              priority,
              reason,
              daysRemaining: daysDiff,
              metadata: reminder
            });
          }
        }
      });

      // E. Gold/VIP Relationship Attention (no contact in 90 days)
      if (isGold) {
        const daysSinceContact = getDaysSince(client.lastContactedDate);
        if (daysSinceContact > 90) {
          triggers.push({
            type: "no_contact",
            priority: 2, // Gold client + no recent interaction
            reason: `Elite Account Inactivity: No personal contact logged in ${daysSinceContact} days (Last touch: ${client.lastContactedDate || "Never"}).`
          });
        }

        // F. Gold/VIP Dormant Purchaser (no orders in 180 days)
        const daysSinceOrder = getDaysSince(client.history?.lastOrderDate);
        if (daysSinceOrder > 180) {
          triggers.push({
            type: "no_order",
            priority: 2, // Gold client + no recent interaction
            reason: `Dormant Account: No purchase transactions recorded in ${daysSinceOrder} days (Last order: ${client.history?.lastOrderDate || "Never"}).`
          });
        }
      }

      // If they have any active focus triggers, compile them into a profile
      if (triggers.length > 0) {
        const highestPriority = Math.min(...triggers.map(t => t.priority)) as FocusProfile["highestPriority"];
        
        // Sort triggers inside the profile: urgent priority first, then closest days remaining
        const sortedTriggers = [...triggers].sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          return (a.daysRemaining || 0) - (b.daysRemaining || 0);
        });

        profiles.push({
          client,
          highestPriority,
          triggers: sortedTriggers
        });
      }
    });

    // Process Aspiring Client Follow-Ups into Clients Needing Attention Today
    if (aspiringClients) {
      aspiringClients.forEach(asp => {
        if (!asp.followUpDate || asp.status === "Converted to Client" || asp.status === "Archived" || asp.status === "Not Interested") return;

        const daysSince = getDaysSince(asp.followUpDate);
        const daysDiff = -daysSince; // Negative if overdue, 0 if today, positive if upcoming

        if (daysSince >= 0 || daysDiff <= 15 || asp.status === "Follow Up Required") {
          const isOverdue = daysSince > 0;
          const isDueToday = daysSince === 0;

          const priority: 1 | 2 | 3 | 4 = (isOverdue || isDueToday) ? 1 : (asp.status === "Follow Up Required" ? 2 : 3);

          let reason = "";
          if (isOverdue) {
            reason = `Aspiring Client Overdue (${daysSince}d): Contact ${asp.name} regarding "${asp.serviceInterestedIn}"`;
          } else if (isDueToday) {
            reason = `Aspiring Client Due TODAY: Follow up with ${asp.name} regarding "${asp.serviceInterestedIn}"`;
          } else {
            reason = `Aspiring Client Follow-up: Contact ${asp.name} regarding "${asp.serviceInterestedIn}" in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`;
          }

          const aspPseudoClient: Client = {
            id: `aspiring-${asp.id}`,
            firstName: asp.name.split(" ")[0],
            lastName: asp.name.split(" ").slice(1).join(" ") || "(Aspiring Lead)",
            gender: "Other",
            occupation: "Prospective Client",
            drive: "No",
            tier: "Silver",
            homeBrand: "CEO Printing Services",
            marketingPermission: "Yes",
            deactivated: false,
            preferredCommunication: (asp.preferredContactMethod || (asp.sourceOfInquiry === "Instagram" ? "Instagram" : "WhatsApp")) as any,
            lastContactedDate: asp.dateContacted,
            contact: {
              phoneNumber: asp.phoneNumber || (asp.contactInfo && !asp.contactInfo.includes("@") ? asp.contactInfo : ""),
              email: asp.email || (asp.contactInfo && asp.contactInfo.includes("@") ? asp.contactInfo : ""),
              instagramUsername: asp.instagramUsername || "",
              city: "Kingston",
              parish: "St. Andrew",
              country: "Jamaica",
              deliveryAddress: "Kingston, Jamaica",
              deliveryCountry: "Jamaica"
            },
            profile: {
              motherName: "", fatherName: "", wifeName: "", husbandName: "", children: [], pets: "",
              personalNotes: `Inquiry Source: ${asp.sourceOfInquiry} | Assigned Staff: ${asp.assignedUser}\nNotes: ${asp.notes}`
            },
            importantDates: [],
            history: {
              firstOrderDate: asp.dateContacted,
              lastOrderDate: asp.dateContacted,
              totalOrders: 0,
              productsPurchased: [asp.serviceInterestedIn],
              preferredCategories: [asp.serviceInterestedIn],
              clientPreferences: [asp.status, `Inquiry: ${asp.sourceOfInquiry}`],
              lifetimeRevenue: 0,
              averageOrderValue: 0
            },
            interests: {
              sports: { sport: "N/A", favoriteTeam: "N/A", teamOne: "N/A", teamTwo: "N/A", favoritePlayer: "N/A", nationalTeam: "N/A" },
              hobbies: ["Aspiring Opportunity"],
              favoriteColors: [],
              giftPreferences: []
            },
            reminders: [
              {
                id: `asp-rem-${asp.id}`,
                date: asp.followUpDate,
                task: `Follow up regarding ${asp.serviceInterestedIn}`,
                completed: false
              }
            ],
            timeline: [
              {
                id: `asp-tl-${asp.id}`,
                type: "Follow-up",
                date: asp.dateContacted,
                content: `Inquiry recorded via ${asp.sourceOfInquiry}. Interested in: ${asp.serviceInterestedIn}. Notes: ${asp.notes}`
              }
            ]
          };

          const trigger: TriggerItem = {
            type: "reminder",
            priority,
            reason,
            daysRemaining: daysDiff,
            metadata: {
              task: `Follow up regarding ${asp.serviceInterestedIn}`,
              date: asp.followUpDate,
              aspiringClient: asp,
              isAspiring: true,
              service: asp.serviceInterestedIn,
              status: asp.status,
              assignedUser: asp.assignedUser,
              sourceOfInquiry: asp.sourceOfInquiry,
              notes: asp.notes
            }
          };

          profiles.push({
            client: aspPseudoClient,
            highestPriority: priority,
            triggers: [trigger],
            isAspiring: true,
            aspiringClient: asp
          });
        }
      });
    }

    // Calculate internal urgency rank for Section 5 Dashboard Priority Order
    // Lower rank = higher urgency (appears at top of "Clients Needing Attention Today")
    // 🔴 Highest Priority (Top, Rank < 100): Overdue follow-ups, Due Today, Client Events Today, Aspiring Follow-ups Today
    // 🟠 Medium Priority (Rank 100-299): Approaching soon (1-7 days, 8-14 days)
    // 🟡 Lower Priority (Bottom, Rank 300+): Future reminders, Account Inactivity / Dormant accounts
    const getProfileUrgencyRank = (profile: FocusProfile): number => {
      const primaryTrigger = profile.triggers[0];
      if (!primaryTrigger) return 999;

      let daysDiff = primaryTrigger.daysRemaining;
      if (profile.isAspiring && profile.aspiringClient?.followUpDate) {
        const daysSince = getDaysSince(profile.aspiringClient.followUpDate);
        daysDiff = -daysSince; // negative if overdue, 0 if today, positive if upcoming
      }

      if (daysDiff === undefined) {
        return 400; // Account Inactivity / Long-term relationship touchpoints
      }

      // 🔴 1. OVERDUE FOLLOW-UPS / TASKS (daysDiff < 0)
      if (daysDiff < 0) {
        const overdueDays = Math.abs(daysDiff);
        return Math.max(1, 20 - overdueDays); // Most overdue comes first (Rank 1 to 19)
      }

      // 🔴 2. DUE TODAY / EVENT HAPPENING TODAY (daysDiff === 0)
      if (daysDiff === 0) {
        return 30; // Rank 30
      }

      // 🟠 3. APPROACHING SOON (1 to 7 days)
      if (daysDiff >= 1 && daysDiff <= 7) {
        return 100 + daysDiff; // Rank 101 to 107
      }

      // 🟠 4. APPROACHING MEDIUM (8 to 14 days)
      if (daysDiff >= 8 && daysDiff <= 14) {
        return 200 + daysDiff; // Rank 208 to 214
      }

      // 🟡 5. FUTURE REMINDERS (15+ days)
      return 300 + daysDiff;
    };

    // Executive Attention System Priority Sorting:
    return profiles.sort((a, b) => {
      const rankA = getProfileUrgencyRank(a);
      const rankB = getProfileUrgencyRank(b);

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // Within same urgency tier:
      // 1. Priority level 1 first
      if (a.highestPriority !== b.highestPriority) {
        return a.highestPriority - b.highestPriority;
      }

      // 2. VIP / Gold / Platinum tier clients
      const aIsGold = a.client.tier === "Gold" || a.client.tier === "Platinum" ? 1 : 0;
      const bIsGold = b.client.tier === "Gold" || b.client.tier === "Platinum" ? 1 : 0;
      if (aIsGold !== bIsGold) return bIsGold - aIsGold;

      // 3. Alphabetical by name
      return `${a.client.firstName} ${a.client.lastName}`.localeCompare(`${b.client.firstName} ${b.client.lastName}`);
    });
  }, [clients, aspiringClients]);

  // Count helpers for mutually exclusive categories
  const milestonesCount = useMemo(() => {
    return focusProfiles.filter(p => 
      !p.isAspiring && 
      p.triggers.some(t => ["birthday", "anniversary", "child_birthday", "order_anniversary", "no_contact", "no_order", "custom_milestone"].includes(t.type))
    ).length;
  }, [focusProfiles]);

  const operationsCount = useMemo(() => {
    return focusProfiles.filter(p => 
      p.isAspiring || 
      p.triggers.some(t => t.type === "reminder")
    ).length;
  }, [focusProfiles]);

  // 5. FILTER focus profiles by state selections & search query
  const filteredFocusProfiles = useMemo(() => {
    return focusProfiles.filter(profile => {
      // Apply Search filter
      const fullName = `${profile.client.firstName} ${profile.client.lastName}`.toLowerCase();
      const serviceText = profile.aspiringClient ? profile.aspiringClient.serviceInterestedIn.toLowerCase() : "";
      const notesText = profile.aspiringClient ? profile.aspiringClient.notes.toLowerCase() : "";
      const q = searchQuery.toLowerCase();
      if (searchQuery && !fullName.includes(q) && !serviceText.includes(q) && !notesText.includes(q)) {
        return false;
      }

      // Apply Focus Category Filter
      if (focusFilter === "urgent") {
        return profile.highestPriority === 1;
      }
      if (focusFilter === "milestones") {
        return !profile.isAspiring && profile.triggers.some(t => ["birthday", "anniversary", "child_birthday", "order_anniversary", "no_contact", "no_order", "custom_milestone"].includes(t.type));
      }
      if (focusFilter === "operations") {
        return profile.isAspiring || profile.triggers.some(t => t.type === "reminder");
      }
      return true;
    });
  }, [focusProfiles, focusFilter, searchQuery]);

  // 6. GOLD / VIP CLIENT METRICS & ALERTS
  const goldMetrics = useMemo(() => {
    const goldList = clients.filter(c => c.tier === "Gold" || c.tier === "Platinum");
    const needingAttention = focusProfiles.filter(p => 
      (p.client.tier === "Gold" || p.client.tier === "Platinum") && 
      (p.highestPriority === 1 || p.highestPriority === 2)
    );
    
    // Gold events within 30 days
    const upcomingGoldEvents = goldList.flatMap(c => 
      c.importantDates.filter(d => {
        const parsed = parseDateString(d.date);
        if (!parsed) return false;
        const days = getDaysUntilNext(parsed.month, parsed.day);
        return days >= 0 && days <= 30;
      }).map(d => ({
        client: c,
        event: { ...d, label: getRelationshipEventTitle(c, d.label), type: c.tier === "Gold" ? "Gold Client Events" : c.tier === "Platinum" ? "Platinum Client Events" : "Silver Client Events" },
        days: getDaysUntilNext(parseDateString(d.date)!.month, parseDateString(d.date)!.day),
        isBusiness: false
      }))
    );

    // Load business events
    const businessEvents = (() => {
      const stored = localStorage.getItem("ceo_crm_business_events");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (err) {
          console.error(err);
        }
      }
      return [];
    })();

    // Parse business events in the next 30 days
    const simYear = CURRENT_SIM_DATE.getFullYear();
    const simMonth = CURRENT_SIM_DATE.getMonth();
    const simDay = CURRENT_SIM_DATE.getDate();
    const refDateObj = new Date(simYear, simMonth, simDay);

    const upcomingBusinessEvents = businessEvents
      .map((be: any) => {
        const parsed = parseDateString(be.date);
        if (!parsed) return null;
        
        const eventYear = parsed.year || simYear;
        const targetDate = new Date(eventYear, parsed.month, parsed.day);
        const diffTime = targetDate.getTime() - refDateObj.getTime();
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (days >= 0 && days <= 30) {
          const associatedClient = be.associatedClientId ? clients.find(c => c.id === be.associatedClientId) : null;
          return {
            client: associatedClient || ({ id: "business-entity", firstName: "Business", lastName: "Event", homeBrand: "CEO Lifestyle" } as any),
            event: { label: be.title, date: be.date, type: be.type },
            days,
            isBusiness: true
          };
        }
        return null;
      })
      .filter(Boolean) as any[];

    // Combine standard and business events
    const combinedUpcoming = [...upcomingGoldEvents, ...upcomingBusinessEvents]
      .sort((a, b) => a.days - b.days);

    // Aggregate preferences of Gold Clients
    const preferencesList = Array.from(
      new Set(goldList.flatMap(c => c.history?.clientPreferences || []))
    ).slice(0, 5);

    return {
      totalGold: goldList.length,
      needingAttentionCount: needingAttention.length,
      upcomingEvents: combinedUpcoming.slice(0, 4),
      preferences: preferencesList,
      list: goldList
    };
  }, [clients, focusProfiles]);

  // 6.5 CONSOLIDATED UPCOMING AGENDA & NEXT 30 DAYS MILESTONES
  const upcomingMilestonesDashboard = useMemo(() => {
    const eventsList: Array<{
      id: string;
      client: Client;
      type: "birthday" | "anniversary" | "custom_milestone" | "reminder" | "business";
      businessType?: string;
      label: string;
      dateStr: string;
      parsedMonth: number;
      parsedDay: number;
      parsedYear?: number;
      isVip: boolean;
      description?: string;
    }> = [];

    // 1. Process client milestones & reminders
    clients.forEach(client => {
      // client milestones
      const milestones = getClientMilestones(client);
      milestones.forEach((m, idx) => {
        const parsed = parseDateString(m.date);
        if (!parsed) return;

        eventsList.push({
          id: `milestone-${client.id}-${idx}-${m.type}`,
          client,
          type: m.type,
          businessType: client.tier === "Gold" ? "Gold Client Events" : client.tier === "Platinum" ? "Platinum Client Events" : "Silver Client Events",
          label: m.label,
          dateStr: m.date,
          parsedMonth: parsed.month,
          parsedDay: parsed.day,
          parsedYear: parsed.year,
          isVip: client.tier === "Gold" || client.tier === "Platinum"
        });
      });

      // client follow-up reminders
      client.reminders.forEach(reminder => {
        const parsed = parseDateString(reminder.date);
        if (!parsed) return;

        eventsList.push({
          id: `rem-${client.id}-${reminder.id}`,
          client,
          type: "reminder",
          businessType: client.tier === "Gold" ? "Gold Client Events" : client.tier === "Platinum" ? "Platinum Client Events" : "Silver Client Events",
          label: reminder.task,
          dateStr: reminder.date,
          parsedMonth: parsed.month,
          parsedDay: parsed.day,
          parsedYear: parsed.year,
          isVip: client.tier === "Gold" || client.tier === "Platinum"
        });
      });
    });

    // 1.5 Process Aspiring Client follow-ups
    if (aspiringClients) {
      aspiringClients.forEach(asp => {
        if (!asp.followUpDate || asp.status === "Converted to Client" || asp.status === "Archived" || asp.status === "Not Interested") return;
        const parsed = parseDateString(asp.followUpDate);
        if (!parsed) return;

        eventsList.push({
          id: `aspiring-${asp.id}`,
          client: {
            id: `aspiring-${asp.id}`,
            firstName: asp.name.split(" ")[0],
            lastName: asp.name.split(" ").slice(1).join(" ") || "Prospect",
            homeBrand: "CEO Printing Services",
            tier: "Silver"
          } as any,
          type: "reminder",
          businessType: "Aspiring Client Follow-Up",
          label: `Follow up with ${asp.name} regarding ${asp.serviceInterestedIn}`,
          dateStr: asp.followUpDate,
          parsedMonth: parsed.month,
          parsedDay: parsed.day,
          parsedYear: parsed.year,
          isVip: false,
          description: `Assigned: ${asp.assignedUser} | Status: ${asp.status}`
        });
      });
    }

    // 2. Process business events
    const businessEvents = (() => {
      const stored = localStorage.getItem("ceo_crm_business_events");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (err) {
          console.error(err);
        }
      }
      return [];
    })();

    businessEvents.forEach((be: any) => {
      const parsed = parseDateString(be.date);
      if (!parsed) return;

      const associatedClient = be.associatedClientId ? clients.find(c => c.id === be.associatedClientId) : null;
      const isClientRelated = be.type === "Gold / Platinum Client Events" || be.type === "Gold Client Events" || be.type === "Platinum Client Events" || be.type === "Silver Client Events";

      eventsList.push({
        id: be.id,
        client: associatedClient || ({ id: "business-entity", firstName: "Business", lastName: "Event", homeBrand: "CEO Lifestyle" } as any),
        type: (isClientRelated && associatedClient) ? "custom_milestone" : "business",
        businessType: be.type,
        label: be.title,
        dateStr: be.date,
        parsedMonth: parsed.month,
        parsedDay: parsed.day,
        parsedYear: parsed.year,
        isVip: associatedClient ? (associatedClient.tier === "Gold" || associatedClient.tier === "Platinum") : false,
        description: be.description
      });
    });

    // July 8, 2026 reference (CURRENT_SIM_DATE)
    const simYear = CURRENT_SIM_DATE.getFullYear();
    const simMonth = CURRENT_SIM_DATE.getMonth();
    const simDay = CURRENT_SIM_DATE.getDate();
    const refDateObj = new Date(simYear, simMonth, simDay);

    return eventsList.map(ev => {
      let eventYear = simYear;
      let targetDate = new Date(eventYear, ev.parsedMonth, ev.parsedDay);
      
      if (targetDate.getTime() - refDateObj.getTime() < -1000 * 60 * 60 * 24 * 5) {
        eventYear += 1;
        targetDate = new Date(eventYear, ev.parsedMonth, ev.parsedDay);
      }

      const diffTime = targetDate.getTime() - refDateObj.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...ev,
        daysRemaining: diffDays,
        targetDate
      };
    })
    .filter(ev => ev.daysRemaining >= 0 && ev.daysRemaining <= 30)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [clients]);

  // 7. TIME-BASED WORKSPACE SUMMARIES (TODAY vs THIS WEEK vs OVERVIEW)
  const summaries = useMemo(() => {
    // TODAY Computations
    const contactToday = focusProfiles.filter(p => 
      p.highestPriority === 1 || 
      p.triggers.some(t => t.daysRemaining === 0)
    ).slice(0, 5);

    const eventsToday = focusProfiles.flatMap(p => 
      p.triggers
        .filter(t => t.daysRemaining !== undefined && t.daysRemaining >= 0 && t.daysRemaining <= 2 && ["birthday", "anniversary", "child_birthday"].includes(t.type))
        .map(t => ({ client: p.client, trigger: t }))
    ).sort((a, b) => (a.trigger.daysRemaining || 0) - (b.trigger.daysRemaining || 0)).slice(0, 5);

    // Format today's date as YYYY-MM-DD
    const simYear = CURRENT_SIM_DATE.getFullYear();
    const simMonth = String(CURRENT_SIM_DATE.getMonth() + 1).padStart(2, "0");
    const simDay = String(CURRENT_SIM_DATE.getDate()).padStart(2, "0");
    const todayStr = `${simYear}-${simMonth}-${simDay}`;

    // Load business events
    const businessEvents = (() => {
      const stored = localStorage.getItem("ceo_crm_business_events");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (err) {
          console.error(err);
        }
      }
      return [];
    })();

    const businessEventsToday = businessEvents
      .filter((be: any) => be.date === todayStr)
      .map((be: any) => {
        const client = be.associatedClientId ? clients.find(c => c.id === be.associatedClientId) : null;
        return {
          client: client || ({ id: "business-entity", firstName: "Business", lastName: "Event", homeBrand: "CEO Lifestyle" } as any),
          reminder: {
            id: be.id,
            date: be.date,
            task: `${be.type}: ${be.title}${be.description ? ` - ${be.description}` : ""}`,
            completed: false,
            timestamp: be.id
          },
          isBusiness: true,
          businessType: be.type,
          overdueBy: 0
        };
      });

    const activeAspiringRemindersToday = (aspiringClients || [])
      .filter(c => c.status !== "Converted to Client" && c.status !== "Archived" && c.status !== "Not Interested" && c.followUpDate)
      .filter(c => getDaysSince(c.followUpDate) >= 0 || c.status === "Follow Up Required")
      .map(c => {
        const overdueBy = getDaysSince(c.followUpDate);
        return {
          client: {
            id: `aspiring-${c.id}`,
            firstName: c.name.split(" ")[0],
            lastName: c.name.split(" ").slice(1).join(" ") || "Prospect",
            homeBrand: "CEO Printing Services",
            tier: "Silver"
          } as any,
          reminder: {
            id: `aspiring-rem-${c.id}`,
            date: c.followUpDate,
            task: `Follow up regarding ${c.serviceInterestedIn}`,
            completed: false,
            timestamp: c.id
          },
          isAspiringTask: true,
          aspiringClient: c,
          overdueBy
        };
      });

    const pendingRemindersToday = [
      ...businessEventsToday,
      ...activeAspiringRemindersToday,
      ...clients.flatMap(c => 
        c.reminders
          .filter(r => !r.completed && getDaysSince(r.date) >= 0) // Include overdue and due today
          .map(r => ({ client: c, reminder: r, overdueBy: getDaysSince(r.date) }))
      )
    ].sort((a, b) => {
      const getPriorityVal = (item: any) => {
        if (item.isInventoryTask) {
          return item.severity === "urgent" ? 1 : 2;
        }
        if (item.isAspiringTask) {
          return item.overdueBy > 0 ? 1 : 2;
        }
        if (item.overdueBy > 0) {
          return 1;
        }
        return 3;
      };
      return getPriorityVal(a) - getPriorityVal(b);
    }).slice(0, 15);

    const activeOrdersLast30 = clients.flatMap(c => 
      c.timeline
        .filter(e => e.type === "Order" && getDaysSince(e.date) <= 30)
        .map(e => ({ client: c, event: e, daysAgo: getDaysSince(e.date) }))
    ).sort((a, b) => a.daysAgo - b.daysAgo).slice(0, 5);

    // THIS WEEK Computations (next 7 days)
    const birthdaysThisWeek = focusProfiles.flatMap(p => 
      p.triggers
        .filter(t => t.type === "birthday" && t.daysRemaining !== undefined && t.daysRemaining >= 0 && t.daysRemaining <= 7)
        .map(t => ({ client: p.client, trigger: t }))
    ).sort((a, b) => (a.trigger.daysRemaining || 0) - (b.trigger.daysRemaining || 0));

    const anniversariesThisWeek = focusProfiles.flatMap(p => 
      p.triggers
        .filter(t => t.type === "anniversary" && t.daysRemaining !== undefined && t.daysRemaining >= 0 && t.daysRemaining <= 7)
        .map(t => ({ client: p.client, trigger: t }))
    ).sort((a, b) => (a.trigger.daysRemaining || 0) - (b.trigger.daysRemaining || 0));

    const vipAttentionThisWeek = focusProfiles.filter(p => 
      (p.client.tier === "Gold" || p.client.tier === "Platinum") &&
      p.triggers.some(t => t.daysRemaining !== undefined && t.daysRemaining >= 0 && t.daysRemaining <= 7)
    ).slice(0, 5);

    // Filter reminders mentioning delivery keywords
    const deliveryRemindersThisWeek = clients.flatMap(c => 
      c.reminders
        .filter(r => {
          if (r.completed) return false;
          const daysDiff = -getDaysSince(r.date);
          const hasKeyword = ["deliver", "send", "ship", "box", "apparel", "gift", "shirts"].some(kw => r.task.toLowerCase().includes(kw));
          return daysDiff >= 0 && daysDiff <= 7 && hasKeyword;
        })
        .map(r => ({ client: c, reminder: r, daysLeft: -getDaysSince(r.date) }))
    ).sort((a, b) => a.daysLeft - b.daysLeft);

    // GENERAL OVERVIEW CALCULATIONS
    const totalRevenue = clients.reduce((sum, c) => sum + (c.history?.lifetimeRevenue || 0), 0);
    const totalStandard = clients.filter(c => c.tier === "Silver").length;
    const totalVIP = clients.filter(c => c.tier === "Gold").length;
    const totalCorporate = clients.filter(c => c.tier === "Platinum").length;
    const totalAbroad = clients.filter(c => c.contact.country !== "Jamaica").length;
    
    const totalCeo = clients.filter(c => c.homeBrand === "CEO Printing Services" || c.homeBrand === "CEO Lifestyle").length;
    const totalLibrarium = clients.filter(c => c.homeBrand === "Librarium Luxe" || c.homeBrand === "CEO Lifestyle").length;
    const totalShared = clients.filter(c => c.homeBrand === "CEO Lifestyle").length;

    return {
      today: {
        contact: contactToday,
        events: eventsToday,
        reminders: pendingRemindersToday,
        activeOrders: activeOrdersLast30
      },
      thisWeek: {
        birthdays: birthdaysThisWeek,
        anniversaries: anniversariesThisWeek,
        vip: vipAttentionThisWeek,
        deliveries: deliveryRemindersThisWeek
      },
      overview: {
        totalRevenue,
        totalStandard,
        totalVIP,
        totalCorporate,
        totalAbroad,
        totalCeo,
        totalLibrarium,
        totalShared
      }
    };
  }, [clients, focusProfiles]);

  return (
    <div className="space-y-10 animate-fade-in text-slate-800">
      
      {/* 2. Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 8-columns: Daily Client Focus Center */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-left">
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                Clients Needing Attention Today
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">Identified automatically from personal events, purchase history, and touchpoint timelines.</p>
            </div>
            
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clients..."
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Filter Bar Chips - Compact Single Row Command Bar */}
          <div className="flex flex-wrap md:flex-nowrap items-center gap-1 sm:gap-1.5 pb-2 border-b border-slate-100/60 text-[10px] sm:text-[11px] md:text-xs">
            <button
              onClick={() => setFocusFilter("all")}
              className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-full font-bold transition-all border whitespace-nowrap cursor-pointer ${
                focusFilter === "all" 
                  ? "bg-slate-900 text-white border-transparent shadow-xs" 
                  : "bg-white text-slate-500 border-slate-200/60 hover:border-slate-300"
              }`}
            >
              All Needs ({focusProfiles.length})
            </button>
            <button
              onClick={() => setFocusFilter("urgent")}
              className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-full font-bold transition-all border flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                focusFilter === "urgent" 
                  ? "bg-red-600 text-white border-transparent shadow-[0_2px_8px_rgba(220,38,38,0.25)]" 
                  : "bg-white text-slate-500 border-slate-200/60 hover:border-slate-300 hover:text-red-600"
              }`}
            >
              <AlertCircle className={`w-3 h-3 ${focusFilter === "urgent" ? "text-white" : "text-red-500 animate-pulse"}`} /> Urgent Only ({focusProfiles.filter(p => p.highestPriority === 1).length})
            </button>
            <button
              onClick={() => setFocusFilter("milestones")}
              className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-full font-bold transition-all border whitespace-nowrap cursor-pointer ${
                focusFilter === "milestones" 
                  ? "bg-slate-900 text-white border-transparent shadow-xs" 
                  : "bg-white text-slate-500 border-slate-200/60 hover:border-slate-300"
              }`}
            >
              Client Milestones ({milestonesCount})
            </button>
            <button
              onClick={() => setFocusFilter("operations")}
              className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-full font-bold transition-all border whitespace-nowrap cursor-pointer ${
                focusFilter === "operations" 
                  ? "bg-slate-900 text-white border-transparent shadow-xs" 
                  : "bg-white text-slate-500 border-slate-200/60 hover:border-slate-300"
              }`}
            >
              Operations ({operationsCount})
            </button>
            <button
              onClick={() => setFocusFilter("inventory")}
              className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-full font-bold transition-all border flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                focusFilter === "inventory" 
                  ? "bg-amber-600 text-white border-transparent shadow-[0_2px_8px_rgba(217,119,6,0.25)]" 
                  : "bg-white text-slate-500 border-slate-200/60 hover:border-slate-300 hover:text-amber-600"
              }`}
            >
              <Package className={`w-3 h-3 ${focusFilter === "inventory" ? "text-white" : "text-amber-500"}`} /> Inventory Alerts ({inventoryTasks.length})
            </button>
          </div>

          {/* Cards Focus Grid */}
          <div className="space-y-6">
            {focusFilter === "inventory" && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/60 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-extrabold text-amber-950 flex items-center gap-2">
                      <Package className="w-5 h-5 text-amber-700" /> Luxe Inventory Alerts Dashboard
                    </h2>
                    <p className="text-xs text-amber-800/80 mt-1">
                      Real-time reconciliation, variance exceptions, and low stock warnings for the Librarium Luxe catalog.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white/80 backdrop-blur-xs border border-amber-200 px-4 py-2.5 rounded-xl">
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700">Total Alerts</div>
                      <div className="text-xl font-black text-amber-950 mt-0.5">{inventoryTasks.length}</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xs border border-amber-200 px-4 py-2.5 rounded-xl">
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-red-700">Urgent Reorder</div>
                      <div className="text-xl font-black text-red-950 mt-0.5">
                        {inventoryTasks.filter(t => t.severity === "urgent").length}
                      </div>
                    </div>
                  </div>
                </div>

                {filteredInventoryTasks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredInventoryTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => onNavigateToTab("inventory")}
                        className={`bg-white border text-left p-5 rounded-2xl cursor-pointer hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between ${
                          task.severity === "urgent"
                            ? "border-red-200 shadow-[0_2px_12px_rgba(220,38,38,0.03)] hover:border-red-300 border-l-4 border-l-red-600"
                            : "border-amber-200 shadow-[0_2px_12px_rgba(245,158,11,0.02)] hover:border-amber-300 border-l-4 border-l-amber-500"
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-extrabold text-slate-900 truncate leading-snug">{task.title}</h4>
                              <span className="text-[8px] font-extrabold uppercase tracking-widest text-slate-400">Luxe Catalog Exception</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap border ${
                              task.severity === "urgent"
                                ? "bg-red-50 text-red-700 border-red-200 animate-pulse"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}>
                              {task.severity === "urgent" ? "Urgent Issue" : "Action Required"}
                            </span>
                          </div>

                          <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl space-y-1.5 text-left">
                            <p className="text-xs font-bold text-slate-800 leading-normal">
                              {task.detailedText || task.description}
                            </p>
                            <p className="text-[11px] text-slate-500 italic leading-snug">
                              "{task.recommendedAction}"
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> Action: Reconcile Stock
                          </span>
                          <span className="text-[10px] font-extrabold text-slate-900 hover:text-slate-700 flex items-center gap-0.5">
                            Open Inventory <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200/50 rounded-2xl p-12 text-center shadow-xs">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-slate-800">No inventory alerts detected</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">All physical allocations match and stock levels are fully balanced.</p>
                  </div>
                )}
              </div>
            )}

            {focusFilter !== "inventory" && filteredFocusProfiles.length === 0 ? (
              <div className="bg-white border border-slate-200/50 rounded-2xl p-12 text-center shadow-xs">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-800">No clients require focus under this filter</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Everyone is engaged, and dates are completely clear of alerts. Great work maintaining client touchpoints!</p>
              </div>
            ) : focusFilter !== "inventory" && (
              filteredFocusProfiles.map((profile) => {
                const { client, highestPriority, triggers } = profile;
                const isOverseas = client.contact.country !== "Jamaica";
                const isExpanded = expandedAttentionId === client.id;

                return (
                  <div
                    key={client.id}
                    onClick={() => setExpandedAttentionId(isExpanded ? null : client.id)}
                    className={`bg-white border text-left rounded-2xl cursor-pointer hover:shadow-md transition-all relative overflow-hidden flex flex-col ${
                      isExpanded 
                        ? "ring-1 ring-slate-900 border-transparent shadow-md" 
                        : "border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.015)]"
                    }`}
                  >
                    {/* Compact List Header Row (always visible) */}
                    <div className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Elegant Initials Circle */}
                        <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shadow-xs flex-shrink-0">
                          {client.firstName[0]}{client.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-950 truncate">
                              {client.firstName} {client.lastName}
                            </h3>
                            {profile.isAspiring ? (
                              <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
                                Aspiring Client
                              </span>
                            ) : (
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest border ${
                                client.tier === "Gold" 
                                  ? "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-amber-950 border-amber-600 shadow-[0_1px_4px_rgba(245,158,11,0.2)]" 
                                  : client.tier === "Platinum" 
                                    ? "bg-slate-900 text-slate-100 border-slate-950 font-extrabold shadow-[0_1px_4px_rgba(0,0,0,0.1)]" 
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}>
                                {client.tier}
                              </span>
                            )}
                            {isOverseas && !profile.isAspiring && (
                              <span className="bg-slate-50 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest">
                                Overseas
                              </span>
                            )}
                          </div>
                          
                          {profile.isAspiring && profile.aspiringClient ? (
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 font-semibold truncate flex-wrap">
                              <span className="font-extrabold text-amber-800 uppercase tracking-wider">Status: {profile.aspiringClient.status}</span>
                              <span>•</span>
                              <span>Source: {profile.aspiringClient.sourceOfInquiry}</span>
                              <span>•</span>
                              <span className="text-slate-600 font-bold">Assigned: {profile.aspiringClient.assignedUser}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-semibold truncate flex-wrap">
                              <span className="font-bold uppercase tracking-wider">ID: {client.id}</span>
                              <span>•</span>
                              <span className="uppercase tracking-widest">{client.homeBrand}</span>
                              <span>•</span>
                              <span className="text-indigo-600 font-bold">
                                Avg Order: {formatCurrency(getClientHistoryAOV(client))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Primary Trigger Preview in compact view */}
                      {!isExpanded && triggers.length > 0 && (
                        <div className="hidden lg:flex items-center gap-2 max-w-sm text-xs text-slate-500 truncate flex-1 justify-center px-4">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" />
                          <span className="truncate italic font-medium">"{triggers[0].reason}"</span>
                          {triggers.length > 1 && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold font-mono ml-1 flex-shrink-0">
                              +{triggers.length - 1} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Right side controls */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 flex-shrink-0">
                        {/* Desktop Average Order Value display */}
                        {!profile.isAspiring && (
                          <div className="hidden md:block text-right pr-2">
                            <span className="text-slate-400 block font-extrabold uppercase text-[7px] tracking-wider">Avg Order</span>
                            <span className="text-indigo-600 font-bold text-xs block font-mono">
                              {formatCurrency(getClientHistoryAOV(client))}
                            </span>
                          </div>
                        )}

                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${
                          highestPriority === 1 
                            ? "bg-red-600 text-white border-transparent shadow-[0_2px_8px_rgba(220,38,38,0.25)] animate-pulse" 
                            : highestPriority === 2
                              ? "bg-amber-50 text-amber-900 border-amber-200"
                              : "bg-slate-100 text-slate-800 border-slate-200"
                        }`}>
                          {highestPriority === 1 ? "⚠️ URGENT" : `Priority ${highestPriority}`}
                        </span>

                        <div className="text-slate-400 hover:text-slate-700 p-1 rounded-full transition-colors">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                        </div>
                      </div>
                    </div>

                    {/* Compact Metric Dashboard Summary (Always Visible) */}
                    <div className="px-4 pb-4 md:px-5">
                      <div className="grid grid-cols-4 gap-1 p-1.5 bg-slate-50/50 rounded-xl border border-slate-100">
                        <div className="text-left min-w-0">
                          <span className="text-slate-400 block font-bold uppercase text-[6.5px] sm:text-[7px] tracking-tight truncate">
                            {profile.isAspiring ? "Status" : "Lifetime Value"}
                          </span>
                          <span className="text-slate-900 font-extrabold text-[9px] sm:text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight font-mono">
                            {profile.isAspiring ? (profile.aspiringClient?.status || "Inquiry") : formatCurrency(client.history?.lifetimeRevenue || 0)}
                          </span>
                        </div>
                        <div className="text-left min-w-0">
                          <span className="text-slate-400 block font-bold uppercase text-[6.5px] sm:text-[7px] tracking-tight truncate">
                            {profile.isAspiring ? "Interest" : "Total Orders"}
                          </span>
                          <span className="text-slate-900 font-extrabold text-[9px] sm:text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight font-mono">
                            {profile.isAspiring ? (profile.aspiringClient?.serviceInterestedIn || "Custom Apparel") : (client.history?.totalOrders || 0)}
                          </span>
                        </div>
                        <div className="text-left min-w-0">
                          <span className="text-slate-400 block font-bold uppercase text-[6.5px] sm:text-[7px] tracking-tight truncate">
                            {profile.isAspiring ? "Preferred Contact" : "Avg Order Value"}
                          </span>
                          <span className="text-indigo-600 font-extrabold text-[9px] sm:text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight font-mono">
                            {profile.isAspiring ? (
                              `${profile.aspiringClient?.preferredContactMethod || (profile.aspiringClient?.sourceOfInquiry === 'Instagram' ? 'Instagram' : 'Phone')}${profile.aspiringClient?.instagramUsername ? ` • ${profile.aspiringClient.instagramUsername}` : ''}`
                            ) : formatCurrency(getClientHistoryAOV(client))}
                          </span>
                        </div>
                        <div className="text-left min-w-0">
                          <span className="text-slate-400 block font-bold uppercase text-[6.5px] sm:text-[7px] tracking-tight truncate">
                            {profile.isAspiring ? "Inquiry Date" : "Rel. Span"}
                          </span>
                          <span className="text-slate-800 font-bold text-[9px] sm:text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight">
                            {profile.isAspiring ? (profile.aspiringClient?.dateContacted || "Recent") : `Since ${client.history?.firstOrderDate ? client.history.firstOrderDate.slice(0, 4) : "2024"}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details Container */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/30 p-5 md:p-6 space-y-5">
                        {/* Reasons list (Triggers block) */}
                        <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">ATTENTION TRIGGERS:</span>
                          {triggers.map((trig, idx) => {
                            let title = "";
                            let description = "";

                            if (trig.metadata?.isAspiring) {
                              title = `Aspiring Client Follow-Up: ${trig.metadata.service || 'Quote Request'}`;
                              description = `Action required: Contact prospective client regarding ${trig.metadata.service}. Status: ${trig.metadata.status}. Notes: "${trig.metadata.notes || 'Inquiry pending follow-up.'}"`;
                            } else if (trig.type === "birthday" || trig.type === "child_birthday" || trig.type === "anniversary") {
                              title = trig.metadata?.label || "Milestone Event";
                              if (trig.daysRemaining === 0) {
                                if (trig.type === "birthday" || trig.type === "child_birthday") {
                                  description = "Birthday reminder due today. Prepare follow-up and client outreach.";
                                } else {
                                  description = "Special milestone occurring today. Consider sending congratulations or preparing scheduled client engagement.";
                                }
                              } else {
                                description = `Special milestone approaching in ${trig.daysRemaining} day${trig.daysRemaining > 1 ? 's' : ''} (${trig.metadata?.date || ''}). Prepare client engagement.`;
                              }
                            } else if (trig.type === "order_anniversary") {
                              const item = trig.metadata?.item || "Premium Order";
                              const yearsAgo = trig.metadata?.yearsAgo || 1;
                              title = `Purchase Anniversary: ${item}`;
                              if (trig.daysRemaining === 0) {
                                description = `Ordered exactly ${yearsAgo} year${yearsAgo > 1 ? 's' : ''} ago today! Perfect moment for client follow-up.`;
                              } else {
                                description = `Ordered ${yearsAgo} year${yearsAgo > 1 ? 's' : ''} ago on this date. Good moment to prepare follow-up.`;
                              }
                            } else if (trig.type === "reminder") {
                              const task = trig.metadata?.task || trig.reason;
                              title = `Task Reminder: ${task}`;
                              if (trig.daysRemaining && trig.daysRemaining < 0) {
                                description = `Overdue task: Was due ${Math.abs(trig.daysRemaining)} day${Math.abs(trig.daysRemaining) > 1 ? 's' : ''} ago! Immediate action recommended.`;
                              } else if (trig.daysRemaining === 0) {
                                description = "Action due today. Prepare follow-up and complete pending touchpoint.";
                              } else {
                                description = `Scheduled task due in ${trig.daysRemaining} day${trig.daysRemaining && trig.daysRemaining > 1 ? 's' : ''}.`;
                              }
                            } else if (trig.type === "no_contact") {
                              title = "Elite Account Inactivity";
                              description = trig.reason;
                            } else if (trig.type === "no_order") {
                              title = "Dormant Account";
                              description = trig.reason;
                            } else {
                              title = "Relationship Focus Required";
                              description = trig.reason;
                            }

                            return (
                              <div key={idx} className="flex items-start gap-2.5 text-xs relative">
                                {/* Dot marker */}
                                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                  trig.priority === 1 
                                    ? "bg-red-600 animate-ping" 
                                    : trig.priority === 2 
                                      ? "bg-amber-500" 
                                      : "bg-slate-400"
                                }`} />
                                {trig.priority === 1 && (
                                  <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-red-600 absolute" />
                                )}
                                <div className="text-left pl-1 flex-1 space-y-1">
                                  <p className={`font-extrabold text-[13px] leading-snug ${trig.priority === 1 ? "text-red-700" : "text-slate-950"}`}>
                                    {title}
                                  </p>
                                  <p className="text-xs text-slate-550 pl-3 leading-relaxed font-semibold border-l border-slate-200/80">
                                    {description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Preferences & Quick Context info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                          <div className="space-y-1.5 text-left">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                              {profile.isAspiring ? "INQUIRY DETAILS & NOTES:" : "CLIENT TASTES & NOTES:"}
                            </span>
                            <p className="text-slate-500 leading-relaxed font-semibold">
                              {profile.isAspiring && profile.aspiringClient
                                ? `Inquiry Source: ${profile.aspiringClient.sourceOfInquiry} | Service: ${profile.aspiringClient.serviceInterestedIn}`
                                : (client.history?.clientPreferences && client.history.clientPreferences.length > 0 
                                    ? `Likes: ${client.history.clientPreferences.join(", ")}` 
                                    : "No preference tags on file.")}
                            </p>
                            <p className="text-slate-400 text-[11px] italic leading-normal">
                              "{profile.isAspiring && profile.aspiringClient
                                ? (profile.aspiringClient.notes || "No notes cataloged.")
                                : (client.profile.personalNotes || "No specific relationship guidelines cataloged.")}"
                            </p>
                          </div>

                          <div className="space-y-1.5 text-left md:text-right flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                                {profile.isAspiring ? "CONTACT INFO:" : "PREVIOUS ORDERS:"}
                              </span>
                              <p className="text-slate-500 font-semibold leading-relaxed">
                                {profile.isAspiring && profile.aspiringClient
                                  ? (
                                    <span className="flex flex-col gap-0.5">
                                      {profile.aspiringClient.instagramUsername && (
                                        <span className="text-pink-700 font-extrabold font-mono">{profile.aspiringClient.instagramUsername}</span>
                                      )}
                                      {profile.aspiringClient.phoneNumber && (
                                        <span>Phone: {profile.aspiringClient.phoneNumber}</span>
                                      )}
                                      {profile.aspiringClient.email && (
                                        <span>Email: {profile.aspiringClient.email}</span>
                                      )}
                                      {!profile.aspiringClient.instagramUsername && !profile.aspiringClient.phoneNumber && !profile.aspiringClient.email && (
                                        <span>{profile.aspiringClient.contactInfo || "No contact info provided."}</span>
                                      )}
                                    </span>
                                  )
                                  : (client.history?.productsPurchased ? client.history.productsPurchased.slice(0, 3).join(", ") : "No recorded history.")}
                              </p>
                            </div>

                            {!profile.isAspiring && (
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">AVERAGE ORDER VALUE:</span>
                                <p className="text-indigo-600 font-extrabold leading-normal text-[11px] font-mono">
                                  {formatCurrency(getClientHistoryAOV(client))}
                                </p>
                              </div>
                            )}
                            
                            {/* Preferred Communication */}
                            <div className="flex items-center gap-1.5 justify-start md:justify-end text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2">
                              <span className="text-[9px] font-bold">PREFERRED:</span>
                              <span className="text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                                <Smartphone className="w-3 h-3 text-slate-500" /> {client.preferredCommunication || "WhatsApp"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions Footer */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {profile.isAspiring && profile.aspiringClient
                              ? `SCHEDULED FOLLOW-UP: ${profile.aspiringClient.followUpDate || "TODAY"}`
                              : `LAST CONTACT LOGGED: ${client.lastContactedDate || "NEVER"}`}
                          </span>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            {profile.isAspiring && profile.aspiringClient ? (
                              <>
                                {onConvertToClient && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onConvertToClient(profile.aspiringClient!);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    Convert to Client
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigateToTab("aspiring");
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl transition-colors cursor-pointer"
                                >
                                  View Lead Details
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectClient(client.id);
                                }}
                                className="flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-slate-700 transition-colors cursor-pointer hover:translate-x-1 duration-200"
                              >
                                Launch Client File
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Upcoming Agenda / Next 30 Days Milestones Section */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4 text-left" id="dashboard-upcoming-milestones-section">
            <div className="pb-3 border-b border-slate-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest block">
                  Upcoming Agenda
                </span>
                <h3 className="text-lg font-bold text-slate-950">
                  Next 30 Days Milestones
                </h3>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-xl text-slate-700 border border-slate-200/50">
                {upcomingMilestonesDashboard.length} Milestones Found
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
              {upcomingMilestonesDashboard.length === 0 ? (
                <div className="col-span-full text-center py-8 text-slate-400 italic">
                  No major milestones or reminders found inside the next 30 days.
                </div>
              ) : (
                upcomingMilestonesDashboard.map((ev, idx) => {
                  let badgeColor = "bg-slate-100 text-slate-600 border-slate-200";
                  if (ev.daysRemaining === 0) {
                    badgeColor = "bg-rose-500 text-white border-transparent animate-pulse font-extrabold";
                  } else if (ev.daysRemaining === 1) {
                    badgeColor = "bg-amber-500 text-white border-transparent font-bold";
                  } else if (ev.daysRemaining <= 5) {
                    badgeColor = "bg-indigo-600 text-white border-transparent font-bold";
                  }

                  let typeLabel = "📌 Milestone";
                  if (ev.type === "birthday") typeLabel = "🎁 Birthday";
                  else if (ev.type === "anniversary") typeLabel = "💍 Anniversary";
                  else if (ev.type === "reminder") typeLabel = "🔔 Follow-up Reminder";
                  else if (ev.type === "business") typeLabel = `💼 ${ev.businessType || "Business Event"}`;

                  const isCorp = ev.client.id === "business-entity";

                  return (
                    <div
                      key={`dashboard-upc-${idx}`}
                      onClick={() => {
                        if (!isCorp) {
                          onSelectClient(ev.client.id);
                        }
                      }}
                      className="p-3 bg-slate-50/60 hover:bg-slate-50 border border-slate-200/40 hover:border-slate-300/80 rounded-2xl transition-all flex flex-col justify-between text-xs group cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {typeLabel}
                          </span>
                          <span className={`text-[9px] font-mono border px-2 py-0.5 rounded-lg ${badgeColor}`}>
                            {ev.daysRemaining === 0 ? "TODAY" : ev.daysRemaining === 1 ? "1 day left" : `${ev.daysRemaining} days`}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 group-hover:underline flex items-center gap-1.5 flex-wrap">
                          {ev.label}
                          {ev.isVip && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="VIP Account" />
                          )}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {isCorp ? "Corporate Event" : `${ev.client.firstName} ${ev.client.lastName}`}
                          {!isCorp && ev.client.homeBrand && (
                            <span className="text-slate-400"> &bull; {ev.client.homeBrand}</span>
                          )}
                        </p>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>{ev.dateStr}</span>
                        {!isCorp && (
                          <span className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            Open Profile <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right 4-columns: Interactive Carousel Command Center & Gold Clients */}
        <div className="lg:col-span-4 space-y-8 text-left">
          
          {(() => {
            const carouselModulesMap: Record<string, { id: string; title: string; icon: React.ReactNode; render: () => React.ReactNode }> = {
              operations_board: {
                id: "operations_board",
                title: "Operations Board",
                icon: <ClipboardList className="w-4 h-4 text-emerald-400" />,
                render: () => (
                  <div 
                    onClick={() => onNavigateToTab("operations")}
                    className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4 hover:border-slate-700 transition-all cursor-pointer group animate-fade-in"
                    id="dashboard-operations-board-carousel-widget"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-slate-800 text-emerald-400 rounded-xl shadow-inner">
                          <ClipboardList className="w-4 h-4" />
                        </span>
                        <div>
                          <h3 className="text-sm font-extrabold tracking-tight">Operations Board</h3>
                          <p className="text-[10px] text-slate-400">Production Workflow Manager</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Open Board <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Orders</span>
                        <span className="text-lg sm:text-xl font-black text-white mt-1 block">{opsMetrics.activeOrders} Active Orders</span>
                      </div>

                      <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">Due Today</span>
                        <span className="text-lg sm:text-xl font-black text-amber-300 mt-1 block">{opsMetrics.dueToday} Due Today</span>
                      </div>

                      <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">Overdue</span>
                        <span className="text-lg sm:text-xl font-black text-rose-300 mt-1 block">{opsMetrics.overdue} Overdue</span>
                      </div>

                      <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Ready for Pickup</span>
                        <span className="text-lg sm:text-xl font-black text-emerald-300 mt-1 block">{opsMetrics.readyPickup} Ready for Pickup</span>
                      </div>
                    </div>
                  </div>
                )
              },
              inventory: {
                id: "inventory",
                title: "Librarium Luxe Inventory",
                icon: <Package className="w-4 h-4 text-amber-400" />,
                render: () => (
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4 text-left animate-fade-in" id="dashboard-luxe-quick-glance-carousel">
                    <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-slate-800" />
                        Librarium Luxe Inventory
                      </span>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/60">
                        Quick Glance
                      </span>
                    </div>

                    {/* Aggregated location metrics */}
                    {(() => {
                      const activeInv = (inventory || []).filter(item => !item.archived);
                      const totalStock = activeInv.reduce((sum, item) => sum + item.quantity, 0);
                      const totalInStore = activeInv.reduce((sum, item) => sum + (item.inStore ?? 0), 0);
                      const totalOffice = activeInv.reduce((sum, item) => sum + (item.office ?? 0), 0);

                      return (
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Total Stock</span>
                            <span className="text-sm font-extrabold text-slate-850 font-mono block mt-0.5">{totalStock}</span>
                          </div>
                          <div className="border-x border-slate-200">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">In Store</span>
                            <span className="text-sm font-extrabold text-indigo-600 font-mono block mt-0.5">{totalInStore}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Office</span>
                            <span className="text-sm font-extrabold text-slate-700 font-mono block mt-0.5">{totalOffice}</span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                      {(!inventory || inventory.filter(item => !item.archived).length === 0) ? (
                        <p className="text-xs text-slate-400 italic py-2">No active inventory items loaded.</p>
                      ) : (
                        inventory.filter(item => !item.archived).map(item => (
                          <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0 text-xs">
                            <div className="min-w-0 flex-1 pr-3">
                              <span className="font-semibold text-slate-800 truncate block">{item.title}</span>
                              <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                                In Store: {item.inStore ?? 0} &bull; Office: {item.office ?? 0} &bull; Price: {item.sellingPrice !== undefined ? `$${item.sellingPrice.toLocaleString()}` : "—"}
                              </span>
                            </div>
                            {item.quantity === 0 ? (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 flex-shrink-0">
                                Out of Stock
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 flex-shrink-0">
                                {item.quantity} units
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <button
                      onClick={() => onNavigateToTab("inventory")}
                      className="w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2 rounded-xl transition-all shadow-xs block"
                    >
                      Manage Inventory
                    </button>
                  </div>
                )
              },
              book_calc: {
                id: "book_calc",
                title: "Book Cost Calculator",
                icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
                render: () => <BookCostCalculator settings={settings} inventory={inventory} />
              },
              location_calc: {
                id: "location_calc",
                title: "Location Cost Calculator",
                icon: <MapPin className="w-4 h-4 text-sky-400" />,
                render: () => <LocationCostCalculator settings={settings} />
              },
              agenda: {
                id: "agenda",
                title: "Interactive Agenda",
                icon: <Calendar className="w-4 h-4 text-emerald-400" />,
                render: () => (
                  <SmallCalendarWidget 
                    clients={clients}
                    onSelectClient={onSelectClient}
                    onOpenTask={onOpenTask}
                  />
                )
              },
              tshirt_calc: {
                id: "tshirt_calc",
                title: "T-Shirt Studio Quote",
                icon: <Shirt className="w-4 h-4 text-rose-400" />,
                render: () => <TShirtStudioQuoteCalculator settings={settings} />
              },
              favorite_quotes: {
                id: "favorite_quotes",
                title: "Favorite Quotes",
                icon: <Star className="w-4 h-4 text-amber-400 fill-amber-400" />,
                render: () => (
                  <FavoriteQuotesWidget 
                    onNavigateToTab={onNavigateToTab}
                  />
                )
              },
              promotions: {
                id: "promotions",
                title: "Client Tier Promotions",
                icon: <Crown className="w-4 h-4 text-amber-400" />,
                render: () => (
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4 text-left animate-fade-in" id="dashboard-promotions-carousel">
                    <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-amber-500" />
                        Client Tier Promotions
                      </span>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
                        {dashboardPromotions.length} Eligible
                      </span>
                    </div>

                    {dashboardPromotions.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs italic">
                        No client tier promotions pending review today. All client tiers are up to date!
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                        {dashboardPromotions.slice(0, 5).map(promo => (
                          <div key={promo.client.id} className="p-3 bg-gradient-to-br from-slate-50 to-amber-50/30 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-slate-900 truncate">
                                  {promo.client.firstName} {promo.client.lastName}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-amber-400 text-amber-950">
                                  Upgrade to {(promo as any).eligibleTier || (promo as any).targetTier}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5 font-medium line-clamp-1">
                                {promo.reason}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const targetTier = (promo as any).eligibleTier || (promo as any).targetTier;
                                const updated = (approveClientPromotion as any)(promo.client, targetTier, tierRegister as any);
                                if (Array.isArray(updated)) {
                                  setTierRegister(updated);
                                } else if (updated && (updated as any).updatedRegister) {
                                  setTierRegister((updated as any).updatedRegister);
                                }
                              }}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold text-[10px] rounded-xl transition-all shrink-0 cursor-pointer"
                            >
                              Approve {(promo as any).eligibleTier || (promo as any).targetTier}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => onNavigateToTab("clients")}
                      className="w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs py-2 rounded-xl transition-all block cursor-pointer"
                    >
                      View All Clients & Tier Register
                    </button>
                  </div>
                )
              },
              aspiring: {
                id: "aspiring",
                title: "Aspiring Client Management",
                icon: <Sparkles className="w-4 h-4 text-pink-400" />,
                render: () => {
                  const simYear = CURRENT_SIM_DATE.getFullYear();
                  const simMonth = String(CURRENT_SIM_DATE.getMonth() + 1).padStart(2, "0");
                  const simDay = String(CURRENT_SIM_DATE.getDate()).padStart(2, "0");
                  const todayStr = `${simYear}-${simMonth}-${simDay}`;

                  const activeLeads = aspiringClients?.filter(c => c.status !== "Converted to Client" && c.status !== "Archived" && c.status !== "Not Interested") || [];
                  const followUpsDue = activeLeads.filter(c => c.followUpDate && c.followUpDate <= todayStr).length;
                  const awaitingResponse = activeLeads.filter(c => c.status === "Awaiting Response" || c.status === "New Inquiry" || c.status === "Quote Sent").length;

                  return (
                    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4 text-left animate-fade-in" id="dashboard-aspiring-carousel">
                      <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-pink-500" />
                          Aspiring Client Management
                        </span>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider bg-pink-50 text-pink-900 border border-pink-200 px-2 py-0.5 rounded">
                          {activeLeads.length} Active Leads
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Active Leads</span>
                          <span className="text-sm font-extrabold text-slate-900 font-mono block mt-0.5">{activeLeads.length}</span>
                        </div>
                        <div className="border-x border-slate-200">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Follow Ups Due</span>
                          <span className="text-sm font-extrabold text-amber-600 font-mono block mt-0.5">{followUpsDue}</span>
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Awaiting Response</span>
                          <span className="text-sm font-extrabold text-purple-600 font-mono block mt-0.5">{awaitingResponse}</span>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                        {activeLeads.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-2">No active aspiring prospects pending.</p>
                        ) : (
                          activeLeads.slice(0, 3).map(c => (
                            <div key={c.id} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0 text-xs">
                              <div className="min-w-0 flex-1 pr-2">
                                <span className="font-bold text-slate-900 truncate block">🌱 {c.name}</span>
                                <span className="text-[10px] text-slate-500 font-medium block truncate">
                                  Preferred: {c.preferredContactMethod || "Instagram"} {c.instagramUsername ? `(${c.instagramUsername})` : ''}
                                </span>
                              </div>
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded shrink-0 ${
                                c.followUpDate === todayStr 
                                  ? "bg-amber-100 text-amber-900 border border-amber-200" 
                                  : c.followUpDate && c.followUpDate < todayStr 
                                    ? "bg-rose-100 text-rose-900 border border-rose-200" 
                                    : "bg-slate-100 text-slate-700"
                              }`}>
                                {c.followUpDate === todayStr ? "Due Today" : (c.followUpDate && c.followUpDate < todayStr ? "Overdue" : c.followUpDate || "Pending")}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToAspiringAdd) {
                              onNavigateToAspiringAdd();
                            } else {
                              onNavigateToTab("aspiring");
                            }
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                        >
                          <span>➕</span>
                          <span>Add Aspiring Client</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateToTab("aspiring")}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Manage Clients</span>
                        </button>
                      </div>
                    </div>
                  );
                }
              }
            };

            const orderedModules = carouselOrder
              .map(id => carouselModulesMap[id])
              .filter(Boolean);

            const activeIdx = orderedModules.findIndex(m => m.id === activeWidgetId);
            const currentIdx = activeIdx === -1 ? 0 : activeIdx;
            const currentModule = orderedModules[currentIdx] || orderedModules[0];

            return (
              <div className="space-y-6 animate-fade-in relative">
                {/* Minimal Apple-Inspired Carousel Navigation Bar */}
                <div className="relative flex flex-col items-center justify-center py-1">
                  <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800/85 rounded-full px-4 py-2 shadow-md">
                    {/* Left Navigation Arrow */}
                    <button 
                      onClick={() => setCurrentCarouselIndex(prev => (prev - 1 + orderedModules.length) % orderedModules.length)}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowWidgetSelectorMenu(prev => !prev);
                      }}
                      className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center rounded-full hover:bg-slate-800/60"
                      title="Previous Module (Double-click to open Widget Selector)"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Dot Indicators */}
                    <div className="flex justify-center items-center gap-2">
                      {orderedModules.map((mod, idx) => {
                        const isActive = currentIdx === idx;
                        return (
                          <button
                            key={mod.id}
                            onClick={() => setActiveWidgetId(mod.id)}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                              isActive ? "bg-indigo-500 scale-110 shadow-xs shadow-indigo-500/50" : "bg-slate-700 hover:bg-slate-600"
                            }`}
                            title={mod.title}
                          />
                        );
                      })}
                    </div>

                    {/* Right Navigation Arrow */}
                    <button 
                      onClick={() => setCurrentCarouselIndex(prev => (prev + 1) % orderedModules.length)}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowWidgetSelectorMenu(prev => !prev);
                      }}
                      className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center rounded-full hover:bg-slate-800/60"
                      title="Next Module (Double-click to open Widget Selector)"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Compact Double-Click Quick Widget Selector Menu */}
                  {showWidgetSelectorMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]" 
                        onClick={() => setShowWidgetSelectorMenu(false)} 
                      />
                      <div className="absolute top-12 z-40 w-72 bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-2xl p-3.5 shadow-2xl space-y-3 text-left animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                            Dashboard Widgets
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowWidgetSelectorMenu(false)}
                            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                          {orderedModules.map((mod, idx) => {
                            const isActive = mod.id === activeWidgetId;
                            return (
                              <div
                                key={mod.id}
                                onClick={() => {
                                  setActiveWidgetId(mod.id);
                                  setShowWidgetSelectorMenu(false);
                                }}
                                className={`group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer border ${
                                  isActive
                                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300 font-extrabold shadow-xs"
                                    : "bg-slate-800/40 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-300"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className={`text-xs font-black shrink-0 ${isActive ? "text-amber-400" : "text-slate-500"}`}>
                                    {isActive ? "●" : "○"}
                                  </span>
                                  <span className="shrink-0">{mod.icon}</span>
                                  <span className="text-xs truncate">{mod.title}</span>
                                </div>

                                <div 
                                  className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {idx > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newOrder = [...carouselOrder];
                                        const [moved] = newOrder.splice(idx, 1);
                                        newOrder.splice(idx - 1, 0, moved);
                                        setCarouselOrder(newOrder);
                                      }}
                                      className="p-1 text-slate-400 hover:text-amber-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                                      title="Move Up"
                                    >
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                  )}
                                  {idx < orderedModules.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newOrder = [...carouselOrder];
                                        const [moved] = newOrder.splice(idx, 1);
                                        newOrder.splice(idx + 1, 0, moved);
                                        setCarouselOrder(newOrder);
                                      }}
                                      className="p-1 text-slate-400 hover:text-amber-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                                      title="Move Down"
                                    >
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 text-center font-medium">
                          Double-click arrows anytime to toggle menu
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Animated content slot */}
                <div className="relative min-h-[300px]">
                  <div
                    key={currentModule?.id || currentIdx}
                    className="w-full animate-fade-in"
                  >
                    {currentModule?.render()}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Client Tier Promotions Dashboard Widget */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-lg border border-amber-500/30 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Client Intelligence
                </span>
                <h3 className="text-base font-black text-white mt-0.5">🏅 Client Tier Promotions</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                {dashboardPromotions.length} Ready
              </span>
            </div>

            {/* Micro Tier Summary */}
            <div className="flex items-center justify-between text-[11px] bg-slate-800/60 p-2.5 rounded-2xl border border-slate-800">
              <span className="text-slate-400 font-medium">{clients.length} Clients Monitored</span>
              <div className="flex items-center gap-2 font-bold">
                <span className="text-amber-300">💎 {clients.filter(c => c.tier === "Platinum").length} Plat</span>
                <span className="text-yellow-300">🥇 {clients.filter(c => c.tier === "Gold").length} Gold</span>
                <span className="text-slate-300">🛡️ {clients.filter(c => c.tier === "Silver").length} Silv</span>
              </div>
            </div>

            {dashboardPromotions.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1">
                All client tiers are protected and aligned with activity levels. No demotions occur.
              </p>
            ) : (
              <div className="space-y-2">
                {dashboardPromotions.slice(0, 3).map((promo) => (
                  <div 
                    key={promo.ceoId}
                    onClick={() => setSelectedDashboardPromotion(promo)}
                    className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 rounded-2xl p-3 flex items-center justify-between gap-2 cursor-pointer transition-all group"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white truncate">{promo.customerFullName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{promo.ceoId}</span>
                      </div>
                      <p className="text-[10px] text-slate-300 truncate">
                        {promo.reason}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        promo.calculatedTier === "Platinum"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                      }`}>
                        {promo.calculatedTier === "Platinum" ? "💎 Platinum" : "🥇 Gold"}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300 transition-colors" />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => onNavigateToTab("branding")}
                  className="w-full py-2 bg-slate-800/50 hover:bg-slate-800 text-amber-300 text-xs font-bold rounded-xl text-center transition-colors cursor-pointer border border-slate-800"
                >
                  Manage Client Tier Register →
                </button>
              </div>
            )}
          </div>

          {/* Client Watchtower Intelligence Stream */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-lg border border-slate-800 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-400" /> Executive Relationship Watchtower
                </span>
                <h3 className="text-base font-black text-white mt-0.5">🔭 Client Watchtower Alerts</h3>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                watchtowerIntelligence.length > 0
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              }`}>
                {watchtowerIntelligence.length} Action Items
              </span>
            </div>

            {watchtowerIntelligence.length === 0 ? (
              <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-slate-200">Watchtower Clear</p>
                <p className="text-[11px] text-slate-400">All Platinum, Gold, and Founders Family relationships are active and healthy.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {watchtowerIntelligence.map((alert, idx) => (
                  <div
                    key={`watchtower-alert-${alert.id}-${idx}`}
                    onClick={() => onSelectClient(alert.client.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      alert.severity === "urgent"
                        ? "bg-rose-950/40 border-rose-800/80 hover:bg-rose-900/50 text-rose-100"
                        : alert.severity === "warning"
                          ? "bg-amber-950/40 border-amber-800/80 hover:bg-amber-900/50 text-amber-100"
                          : "bg-indigo-950/40 border-indigo-800/80 hover:bg-indigo-900/50 text-indigo-100"
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold truncate">{alert.title}</span>
                      </div>
                      <p className="text-[10px] opacity-80 truncate font-medium">{alert.subtitle}</p>
                      <p className="text-[10.5px] opacity-90 line-clamp-1">{alert.reason}</p>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-black/40 border border-white/10 hover:bg-black/60 transition-colors whitespace-nowrap">
                        {alert.actionText} →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gold Client Watch Box */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-lg border border-slate-800 space-y-6">
            <div className="space-y-1 pb-3 border-b border-slate-800/80">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-slate-300" /> Elite Relationship Watch
              </span>
              <h3 className="text-lg font-bold tracking-tight text-white">Gold & Platinum Clients</h3>
            </div>

            {/* Micro Gold Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-widest">Total Active</span>
                <span className="text-3xl font-light text-white block mt-1">{goldMetrics.totalGold}</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-widest">Needs Contact</span>
                <span className="text-3xl font-light text-amber-400 block mt-1">{goldMetrics.needingAttentionCount}</span>
              </div>
            </div>

            {/* Upcoming Gold Events Agenda */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">UPCOMING ELITE & CORPORATE EVENTS:</span>
              
              {goldMetrics.upcomingEvents.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No key elite milestones in next 30 days.</p>
              ) : (
                <div className="space-y-2.5">
                  {goldMetrics.upcomingEvents.map((item, idx) => {
                    const isCorp = item.client.id === "business-entity";
                    const isBusiness = (item as any).isBusiness;
                    const businessType = item.event.type;
                    const clientAOV = item.client.history ? (item.client.history.averageOrderValue || (item.client.history.totalOrders > 0 ? Math.round(item.client.history.lifetimeRevenue / item.client.history.totalOrders) : 0)) : 0;
                    
                    // Style badges for different categories
                    let badgeBg = "bg-white/10 text-white";
                    if (businessType === "CEO Day") badgeBg = "bg-blue-500/20 text-blue-200 border border-blue-500/30";
                    else if (businessType === "Librarium Luxe Day") badgeBg = "bg-rose-500/20 text-rose-200 border border-rose-500/30";
                    else if (businessType === "Gold Client Events" || businessType === "Gold / Platinum Client Events") badgeBg = "bg-amber-500/20 text-amber-200 border border-amber-500/30";
                    else if (businessType === "Platinum Client Events") badgeBg = "bg-white text-slate-950 border border-white font-extrabold";
                    else if (businessType === "Silver Client Events") badgeBg = "bg-slate-500/20 text-slate-200 border border-slate-500/30";
                    else if (businessType === "General Business Day") badgeBg = "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30";

                    return (
                      <div 
                        key={idx}
                        onClick={() => {
                          if (!isCorp) {
                            onSelectClient(item.client.id);
                          }
                        }}
                        className={`p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all flex justify-between items-center text-xs ${!isCorp ? "cursor-pointer" : ""}`}
                      >
                        <div>
                          {isCorp ? (
                            <p className="font-bold text-white flex items-center gap-1.5">
                              💼 {businessType || "Corporate Event"}
                            </p>
                          ) : (
                            <p className="font-bold text-white flex items-center gap-1.5">
                              👤 {item.client.firstName} {item.client.lastName}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.event.label} ({item.event.date})</p>
                          {!isCorp && (
                            <p className="text-[10px] text-amber-300 font-mono mt-1 font-bold">AOV: {formatCurrency(clientAOV)}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-[10px] font-mono font-bold bg-white/10 text-white px-2 py-0.5 rounded">
                            {item.days === 0 ? "Today" : `${item.days}d`}
                          </span>
                          {businessType && (
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${badgeBg}`}>
                              {businessType === "Gold / Platinum Client Events" ? "Gold / Plat" : businessType === "Gold Client Events" ? "Gold" : businessType === "Platinum Client Events" ? "Platinum" : businessType === "Silver Client Events" ? "Silver" : businessType}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Elite Preference Summary */}
            <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">SHARED GOLD/PLAT PREFERENCES:</span>
              <div className="flex flex-wrap gap-1.5">
                {goldMetrics.preferences.map((p, i) => (
                  <span key={i} className="text-[10px] bg-slate-850 border border-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 3. Bottom Interactive Workspace Summary Section */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="text-left">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-800" />
              Dynamic Relationship Intel
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Toggle workspaces to inspect immediate tasks, milestones, or high-level portfolio reports.</p>
          </div>

          {/* Interactive Workspace Segment Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 self-start sm:self-center">
            <button
              onClick={() => setSummaryTab("today")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                summaryTab === "today" 
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/40" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSummaryTab("this_week")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                summaryTab === "this_week" 
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/40" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setSummaryTab("overview")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                summaryTab === "overview" 
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/40" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Metrics Overview
            </button>
          </div>
        </div>

        {/* Dynamic Summary Panels */}
        <div className="animate-fade-in text-left">
          
          {/* TAB A: TODAY PANEL */}
          {summaryTab === "today" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Box 1: Contact list */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase block border-b border-slate-100 pb-1.5">Focus Contacts</span>
                {summaries.today.contact.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No urgent contacts due today.</p>
                ) : (
                  summaries.today.contact.map((p, idx) => (
                    <div 
                      key={`today-contact-${p.client.id}-${idx}`}
                      onClick={() => onSelectClient(p.client.id)}
                      className={`p-3 border rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 ${getBrandCardClasses(p.client.homeBrand)}`}
                    >
                      <p className="font-bold text-xs text-slate-800">{p.client.firstName} {p.client.lastName}</p>
                      <div className="flex items-center justify-between gap-1.5 mt-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1 rounded text-[7px] font-black uppercase tracking-wider ${
                            p.client.tier === "Gold"
                              ? "bg-amber-100 text-amber-800"
                              : p.client.tier === "Platinum"
                                ? "bg-slate-900 text-slate-100"
                                : "bg-slate-200 text-slate-600"
                          }`}>
                            {p.client.tier}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">• {p.client.preferredCommunication}</span>
                        </div>
                        <span className="text-[10px] text-indigo-600 font-mono font-bold">AOV: {formatCurrency(getClientHistoryAOV(p.client))}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Box 2: Events Today */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase block border-b border-slate-100 pb-1.5">Events Today / Tomorrow</span>
                {summaries.today.events.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No major personal events today.</p>
                ) : (
                  summaries.today.events.map((item, idx) => (
                    <div 
                      key={`today-evt-${item.client.id}-${item.trigger.type || 'trig'}-${idx}`}
                      onClick={() => onSelectClient(item.client.id)}
                      className={`p-3 border rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 flex items-center justify-between gap-2 ${getBrandCardClasses(item.client.homeBrand)}`}
                    >
                      <div className="text-left">
                        <p className="font-bold text-xs text-slate-800">{item.client.firstName} {item.client.lastName}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`px-1 rounded text-[7px] font-black uppercase tracking-wider ${
                            item.client.tier === "Gold"
                              ? "bg-amber-100 text-amber-800"
                              : item.client.tier === "Platinum"
                                ? "bg-slate-900 text-slate-100"
                                : "bg-slate-200 text-slate-600"
                          }`}>
                            {item.client.tier}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[120px]">
                            {item.trigger.metadata?.label || "Event"}
                          </span>
                        </div>
                        <p className="text-[10px] text-indigo-600 font-mono font-bold mt-1">AOV: {formatCurrency(getClientHistoryAOV(item.client))}</p>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-700 whitespace-nowrap">
                        {item.trigger.daysRemaining === 0 ? "Today" : `${item.trigger.daysRemaining}d`}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Box 3: Pending Reminders */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase block border-b border-slate-100 pb-1.5">Overdue / Pending Tasks</span>
                {summaries.today.reminders.length === 0 ? (
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 py-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> All daily tasks completed!
                  </p>
                ) : (
                  summaries.today.reminders.map((item, idx) => {
                    const isAspiringTask = (item as any).isAspiringTask;
                    if (isAspiringTask) {
                      const asp: AspiringClient = (item as any).aspiringClient;
                      return (
                        <div 
                          key={`today-asp-${item.reminder.id}-${idx}`}
                          onClick={() => onNavigateToTab("aspiring")}
                          className="p-3 border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50/90 rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 space-y-1.5 text-left shadow-xs border-l-4 border-l-amber-500"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                  Aspiring Client
                                </span>
                                <span className="font-extrabold text-xs text-slate-900">{asp?.name || item.client.firstName}</span>
                              </div>
                              <p className="text-[11px] text-slate-700 font-semibold mt-1">
                                {asp?.serviceInterestedIn ? `Follow up regarding ${asp.serviceInterestedIn}` : item.reminder.task}
                              </p>
                            </div>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap border ${
                              item.overdueBy > 0 
                                ? "bg-rose-600 text-white border-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.3)] animate-pulse" 
                                : "bg-amber-100 text-amber-800 border-amber-200"
                            }`}>
                              {item.overdueBy > 0 ? `Overdue ${item.overdueBy}d` : "Due Today"}
                            </span>
                          </div>
                          {asp?.notes && (
                            <p className="text-[10px] text-slate-500 italic leading-snug bg-white/70 p-1.5 rounded border border-slate-100/80">
                              "{asp.notes}"
                            </p>
                          )}
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold pt-0.5">
                            {asp?.assignedUser ? <span>Assigned: {asp.assignedUser}</span> : <span>Opportunity</span>}
                            <span className="text-amber-700 font-bold">{asp?.status || "Follow Up"}</span>
                          </div>
                        </div>
                      );
                    }

                    const isInventoryTask = (item as any).isInventoryTask;
                    if (isInventoryTask) {
                      const inv = item as any;
                      return (
                        <div 
                          key={`today-inv-${inv.id}-${idx}`}
                          onClick={() => onNavigateToTab("inventory")}
                          className={`p-3 border rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 space-y-1.5 text-left ${
                            inv.severity === "urgent"
                              ? "bg-red-50/50 border-red-200/50 hover:bg-red-50/85 border-l-4 border-l-red-600 shadow-[0_2px_8px_rgba(220,38,38,0.05)]"
                              : "bg-amber-50/50 border-amber-200/50 hover:bg-amber-50/85 border-l-4 border-l-amber-500 shadow-[0_2px_8px_rgba(245,158,11,0.05)]"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-bold text-xs text-slate-950 truncate max-w-[180px]">{inv.title}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`px-1 rounded text-[7px] font-black uppercase tracking-wider ${
                                  inv.severity === "urgent"
                                    ? "bg-red-100 text-red-800 animate-pulse"
                                    : "bg-amber-100 text-amber-800"
                                }`}>
                                  {inv.severity === "urgent" ? "Urgent Issue" : "Needs Attention"}
                                </span>
                                <span className="text-[9px] text-[#5C1A24] font-black uppercase tracking-wider">Librarium Luxe</span>
                              </div>
                            </div>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap border ${
                              inv.severity === "urgent"
                                ? "bg-red-600 text-white border-red-600 shadow-[0_0_8px_rgba(220,38,38,0.3)]"
                                : "bg-amber-50 text-amber-900 border-amber-200"
                            }`}>
                              {inv.severity === "urgent" ? "CRITICAL" : "ALERT"}
                            </span>
                          </div>
                          
                          <div className="text-[11px] text-slate-800 space-y-1 leading-snug">
                            <p className="font-bold">{inv.description}</p>
                            <p className="text-slate-500 italic">"{inv.recommendedAction}"</p>
                          </div>
                        </div>
                      );
                    }

                    const isBusiness = (item as any).isBusiness;
                    const businessType = (item as any).businessType;
                    const isCorp = item.client.id === "business-entity";

                    if (isBusiness) {
                      if (isCorp) {
                        return (
                          <div 
                            key={`today-bus-corp-${item.reminder.id}-${idx}`}
                            className="p-3 border rounded-xl transition-all hover:-translate-y-0.5 space-y-1.5 bg-purple-50/50 border-purple-200/50 text-left"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <p className="font-bold text-xs text-purple-900">💼 {businessType}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-purple-100 text-purple-800 font-extrabold uppercase tracking-wider border border-purple-200">
                                    Corporate Event
                                  </span>
                                </div>
                              </div>
                              <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap border bg-purple-100 text-purple-800 border-purple-200">
                                Today
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-700 italic leading-snug">
                              "{item.reminder.task.includes(': ') ? item.reminder.task.substring(item.reminder.task.indexOf(': ') + 2) : item.reminder.task}"
                            </p>
                          </div>
                        );
                      } else {
                        return (
                          <div 
                            key={`today-bus-${item.reminder.id}-${idx}`}
                            onClick={() => onSelectClient(item.client.id)}
                            className={`p-3 border rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 space-y-1.5 text-left ${getBrandCardClasses(item.client.homeBrand)}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <p className="font-bold text-xs text-slate-800">{item.client.firstName} {item.client.lastName}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`px-1 rounded text-[7px] font-black uppercase tracking-wider ${
                                    item.client.tier === "Gold"
                                      ? "bg-amber-100 text-amber-800"
                                      : item.client.tier === "Platinum"
                                        ? "bg-slate-900 text-slate-100"
                                        : "bg-slate-200 text-slate-600"
                                  }`}>
                                    {item.client.tier}
                                  </span>
                                  <span className="px-1 bg-emerald-100 text-emerald-800 rounded text-[7px] font-black uppercase tracking-wider border border-emerald-200/50">
                                    {businessType}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap border bg-slate-100 text-slate-700 border-slate-200">
                                Today
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 italic leading-snug">
                              "{item.reminder.task.includes(': ') ? item.reminder.task.substring(item.reminder.task.indexOf(': ') + 2) : item.reminder.task}"
                            </p>
                          </div>
                        );
                      }
                    }

                    return (
                      <div 
                        key={`today-rem-${item.reminder.id}-${idx}`}
                        onClick={() => onOpenTask ? onOpenTask(item.client.id, item.reminder.id) : onSelectClient(item.client.id)}
                        className={`p-3 border rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 space-y-1.5 text-left ${getBrandCardClasses(item.client.homeBrand)}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-bold text-xs text-slate-800">{item.client.firstName} {item.client.lastName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`px-1 rounded text-[7px] font-black uppercase tracking-wider ${
                                item.client.tier === "Gold"
                                  ? "bg-amber-100 text-amber-800"
                                  : item.client.tier === "Platinum"
                                    ? "bg-slate-900 text-slate-100"
                                    : "bg-slate-200 text-slate-600"
                              }`}>
                                {item.client.tier}
                              </span>
                              <span className="text-[10px] text-indigo-600 font-mono font-bold">AOV: {formatCurrency(getClientHistoryAOV(item.client))}</span>
                            </div>
                          </div>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap border ${
                            item.overdueBy > 0 
                              ? "bg-red-600 text-white border-red-600 shadow-[0_0_8px_rgba(220,38,38,0.3)] animate-pulse" 
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}>
                            {item.overdueBy > 0 ? `URGENT Overdue ${item.overdueBy}d` : "Today"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 italic leading-snug">"{item.reminder.task}"</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Box 4: Active Orders (last 30 days) */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase block border-b border-slate-100 pb-1.5">Recent orders (last 30 days)</span>
                {summaries.today.activeOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No recent purchase transactions.</p>
                ) : (
                  summaries.today.activeOrders.map((item, idx) => (
                    <div 
                      key={`today-ord-${item.event.id}-${idx}`}
                      onClick={() => onSelectClient(item.client.id)}
                      className={`p-3 border rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 space-y-1.5 ${getBrandCardClasses(item.client.homeBrand)}`}
                    >
                      <div className="flex justify-between items-center text-xs gap-2">
                        <div className="text-left">
                          <p className="font-bold text-slate-800">{item.client.firstName} {item.client.lastName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`px-1 rounded text-[7px] font-black uppercase tracking-wider ${
                              item.client.tier === "Gold"
                                ? "bg-amber-100 text-amber-800"
                                : item.client.tier === "Platinum"
                                  ? "bg-slate-900 text-slate-100"
                                  : "bg-slate-200 text-slate-600"
                            }`}>
                              {item.client.tier}
                            </span>
                            <span className="text-[10px] text-indigo-600 font-mono font-bold">AOV: {formatCurrency(getClientHistoryAOV(item.client))}</span>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-slate-950 whitespace-nowrap bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">{formatCurrency(item.event.amount || 0)}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">"{item.event.content}"</p>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB B: THIS WEEK PANEL */}
          {summaryTab === "this_week" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Box 1: Birthdays this week */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase block border-b border-slate-100 pb-1.5">Birthdays This Week</span>
                {summaries.thisWeek.birthdays.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No client birthdays this week.</p>
                ) : (
                  summaries.thisWeek.birthdays.map((item, idx) => (
                    <div 
                      key={`week-bday-${item.client.id}-${idx}`}
                      onClick={() => onSelectClient(item.client.id)}
                      className={`p-3 border rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 flex items-center justify-between gap-2 ${getBrandCardClasses(item.client.homeBrand)}`}
                    >
                      <div className="text-left">
                        <p className="font-bold text-xs text-slate-800">{item.client.firstName} {item.client.lastName}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`px-1 rounded text-[7px] font-black uppercase tracking-wider ${
                            item.client.tier === "Gold"
                              ? "bg-amber-100 text-amber-800"
                              : item.client.tier === "Platinum"
                                ? "bg-slate-900 text-slate-100"
                                : "bg-slate-200 text-slate-600"
                          }`}>
                            {item.client.tier}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[120px]">
                            Bday: {item.trigger.metadata?.date}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-slate-200/85 px-1.5 py-0.5 rounded text-slate-700 whitespace-nowrap">
                        {item.trigger.daysRemaining === 0 ? "Today" : `${item.trigger.daysRemaining}d`}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Box 2: Anniversaries this week */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase block border-b border-slate-100 pb-1.5">Anniversaries This Week</span>
                {summaries.thisWeek.anniversaries.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No major wedding/personal anniversaries.</p>
                ) : (
                  summaries.thisWeek.anniversaries.map((item, idx) => (
                    <div 
                      key={`week-anniv-${item.client.id}-${idx}`}
                      onClick={() => onSelectClient(item.client.id)}
                      className={`p-3 border rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 flex items-center justify-between gap-2 ${getBrandCardClasses(item.client.homeBrand)}`}
                    >
                      <div className="text-left">
                        <p className="font-bold text-xs text-slate-800">{item.client.firstName} {item.client.lastName}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`px-1 rounded text-[7px] font-black uppercase tracking-wider ${
                            item.client.tier === "Gold"
                              ? "bg-amber-100 text-amber-800"
                              : item.client.tier === "Platinum"
                                ? "bg-slate-900 text-slate-100"
                                : "bg-slate-200 text-slate-600"
                          }`}>
                            {item.client.tier}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[120px]">
                            {item.trigger.metadata?.label}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-slate-200/85 px-1.5 py-0.5 rounded text-slate-700 whitespace-nowrap">
                        {item.trigger.daysRemaining === 0 ? "Today" : `${item.trigger.daysRemaining}d`}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Box 3: Gold & Plat Priority Touchpoints */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase block border-b border-slate-100 pb-1.5">Gold & Plat Touchpoints This Week</span>
                {summaries.thisWeek.vip.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No Gold or Plat attention triggers this week.</p>
                ) : (
                  summaries.thisWeek.vip.map((p, idx) => (
                    <div 
                      key={`week-vip-${p.client.id}-${idx}`}
                      onClick={() => onSelectClient(p.client.id)}
                      className={`p-3 border rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 ${getBrandCardClasses(p.client.homeBrand)}`}
                    >
                      <p className="font-bold text-xs text-slate-800">{p.client.firstName} {p.client.lastName}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`px-1 rounded text-[7px] font-black uppercase tracking-wider ${
                          p.client.tier === "Gold"
                            ? "bg-amber-100 text-amber-800"
                            : p.client.tier === "Platinum"
                              ? "bg-slate-900 text-slate-100"
                              : "bg-slate-200 text-slate-600"
                        }`}>
                          {p.client.tier}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">• {p.client.contact.city}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Box 4: Delivery / Fulfillment Reminders */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase block border-b border-slate-100 pb-1.5">Deliveries & Gifts This Week</span>
                {summaries.thisWeek.deliveries.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No packaging or delivery tasks scheduled.</p>
                ) : (
                  summaries.thisWeek.deliveries.map((item, idx) => (
                    <div 
                      key={`week-deliv-${item.reminder.id}-${idx}`}
                      onClick={() => onOpenTask ? onOpenTask(item.client.id, item.reminder.id) : onSelectClient(item.client.id)}
                      className={`p-3 border rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 space-y-1.5 ${getBrandCardClasses(item.client.homeBrand)}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-bold text-xs text-slate-800">{item.client.firstName} {item.client.lastName}</p>
                          <span className={`px-1 rounded text-[7px] font-black uppercase tracking-wider inline-block mt-0.5 ${
                            item.client.tier === "Gold"
                              ? "bg-amber-100 text-amber-800"
                              : item.client.tier === "Platinum"
                                ? "bg-slate-900 text-slate-100"
                                : "bg-slate-200 text-slate-600"
                          }`}>
                            {item.client.tier}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1 rounded whitespace-nowrap">
                          {item.daysLeft === 0 ? "Today" : `${item.daysLeft}d`}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 italic mt-0.5">"{item.reminder.task}"</p>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB C: OVERVIEW METRICS PANEL */}
          {summaryTab === "overview" && (
            <div className="space-y-6">
              
              {/* Top Row Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200/40 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Accounts</span>
                  <p className="text-2xl font-light text-slate-900 mt-1">{clients.length}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200/40 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gold Clients</span>
                  <p className="text-2xl font-light text-slate-900 mt-1">{summaries.overview.totalVIP}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200/40 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platinum Clients</span>
                  <p className="text-2xl font-light text-slate-900 mt-1">{summaries.overview.totalCorporate}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200/40 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overseas Clients</span>
                  <p className="text-2xl font-light text-slate-900 mt-1">{summaries.overview.totalAbroad}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200/40 rounded-2xl col-span-2 md:col-span-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Valuation</span>
                  <p className="text-xl font-bold text-slate-950 mt-1 truncate">{formatCurrency(summaries.overview.totalRevenue)}</p>
                </div>
              </div>

              {/* Segment distributions bars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Brand segments distribution */}
                <div className="bg-slate-50 border border-slate-200/40 p-4 rounded-2xl space-y-3.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Brand Affinity Distribution</span>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mb-1">
                        <span>CEO Printing Services Only</span>
                        <span>{summaries.overview.totalCeo - summaries.overview.totalShared}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-900 h-full" style={{ width: `${((summaries.overview.totalCeo - summaries.overview.totalShared)/clients.length)*100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mb-1">
                        <span>Librarium Luxe Only</span>
                        <span>{summaries.overview.totalLibrarium - summaries.overview.totalShared}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-700 h-full" style={{ width: `${((summaries.overview.totalLibrarium - summaries.overview.totalShared)/clients.length)*100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mb-1">
                        <span>CEO Lifestyle (Shared)</span>
                        <span>{summaries.overview.totalShared}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-500 h-full" style={{ width: `${(summaries.overview.totalShared/clients.length)*100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account status mix */}
                <div className="bg-slate-50 border border-slate-200/40 p-4 rounded-2xl space-y-3.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Client Level Mix</span>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mb-1">
                        <span>Gold Elite</span>
                        <span>{summaries.overview.totalVIP}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-950 h-full" style={{ width: `${(summaries.overview.totalVIP/clients.length)*100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mb-1">
                        <span>Platinum Elite</span>
                        <span>{summaries.overview.totalCorporate}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-800 h-full" style={{ width: `${(summaries.overview.totalCorporate/clients.length)*100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mb-1">
                        <span>Silver Directory</span>
                        <span>{summaries.overview.totalStandard}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-500 h-full" style={{ width: `${(summaries.overview.totalStandard/clients.length)*100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Geography summary */}
                <div className="bg-slate-50 border border-slate-200/40 p-4 rounded-2xl space-y-3.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Geographic Reach</span>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mb-1">
                        <span>Jamaica Local Delivery</span>
                        <span>{clients.length - summaries.overview.totalAbroad}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-900 h-full" style={{ width: `${((clients.length - summaries.overview.totalAbroad)/clients.length)*100}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mb-1">
                        <span>International Delivery</span>
                        <span>{summaries.overview.totalAbroad}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-500 h-full" style={{ width: `${(summaries.overview.totalAbroad/clients.length)*100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* Promotion Detail View Modal */}
      {selectedDashboardPromotion && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto text-left">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                🏅 Client Promotion Recommendation
              </span>
              <button
                type="button"
                onClick={() => setSelectedDashboardPromotion(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Client:</span>
                  <span className="font-extrabold text-white text-sm">{selectedDashboardPromotion.customerFullName}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>CEO ID:</span>
                  <span className="font-mono text-slate-300">{selectedDashboardPromotion.ceoId}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-700/60">
                  <span>Current Approved Tier:</span>
                  <span className="font-bold text-slate-300 px-2.5 py-0.5 bg-slate-700/80 rounded-md">
                    {selectedDashboardPromotion.currentTier}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Calculated Target Tier:</span>
                  <span className="font-black text-amber-300 px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-md">
                    {selectedDashboardPromotion.calculatedTier}
                  </span>
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block">
                  Reason & Metrics Summary
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">Lifetime Spend</span>
                    <span className="font-bold text-amber-300">${selectedDashboardPromotion.lifetimeSpend.toLocaleString()} JMD</span>
                  </div>
                  <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">Total Orders</span>
                    <span className="font-bold text-white">{selectedDashboardPromotion.totalOrders}</span>
                  </div>
                  <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">Average Order Value</span>
                    <span className="font-bold text-slate-200">${selectedDashboardPromotion.averageOrderValue.toLocaleString()} JMD</span>
                  </div>
                  <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block">Client Engagement Score</span>
                    <span className="font-bold text-emerald-400">{selectedDashboardPromotion.clientScore} / 100</span>
                  </div>
                </div>
                <div className="pt-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Recommendation:</span>
                  <p className="text-slate-200 mt-0.5 font-medium">{selectedDashboardPromotion.recommendation}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDashboardPromotion(null);
                  onNavigateToTab("branding");
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Open Tier Register
              </button>
              <button
                type="button"
                onClick={() => {
                  const result = approveClientPromotion(selectedDashboardPromotion.client, selectedDashboardPromotion.calculatedTier, "Approved via Dashboard Widget", clients);
                  setTierRegister(result.updatedRegister);
                  setSelectedDashboardPromotion(null);
                  alert(`Successfully promoted ${selectedDashboardPromotion.customerFullName} to ${selectedDashboardPromotion.calculatedTier}!`);
                }}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-colors cursor-pointer shadow-md"
              >
                Upgrade to {selectedDashboardPromotion.calculatedTier}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Quick Add Aspiring Client Modal */}
      <AddAspiringClientModal
        isOpen={showAddAspiringModal}
        onClose={() => setShowAddAspiringModal(false)}
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
          setAspiringClients(prev => [newEntry, ...prev]);
          setShowAddAspiringModal(false);
        }}
      />

    </div>
  );
}
