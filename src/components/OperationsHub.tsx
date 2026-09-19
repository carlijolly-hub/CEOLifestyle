import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { isAdventistCommunicationRestricted } from "../utils/adventistGuard";
import AdventistWarningModal from "./AdventistWarningModal";
import AdventistAlert from "./AdventistAlert";
import OperationsCommunicationModal from "./OperationsCommunicationModal";
import { 
  OperationsOrder, 
  OperationsOrderItem,
  ProductionStatus, 
  OperationsDeliveryMethod, 
  OrderPriority, 
  Client, 
  ClientTier,
  ChecklistItem,
  ProductionChecklistTemplate,
  YesNo,
  FulfillmentTemplate,
  FulfillmentTemplateItem,
  FulfillmentInventoryItem,
  SystemSettings,
  BulkQuantityTier,
  OrderFulfillmentSnapshotItem,
  RegularInventoryItem,
  LuxeBookInventoryItem
} from "../types";
import { matchOrderItemToCatalog, canonicalizeProductName, parseTShirtVariant } from "../utils/productMatchingUtils";

export function createOrderFulfillmentSnapshot(
  items: OperationsOrderItem[] | string,
  templates: FulfillmentTemplate[],
  quantityTotal: number = 1
): OrderFulfillmentSnapshotItem[] {
  const snapshot: OrderFulfillmentSnapshotItem[] = [];
  const parsedItems: Array<{ 
    productName: string; 
    quantity: number;
    colour?: string;
    size?: string;
    notes?: string;
  }> = [];

  if (Array.isArray(items)) {
    items.forEach(i => {
      const pName = i.productName?.trim();
      if (pName) {
        parsedItems.push({ 
          productName: pName, 
          quantity: Number(i.quantity) || 1,
          colour: i.colour?.trim() || undefined,
          size: i.size?.trim() || undefined,
          notes: i.notes?.trim() || undefined
        });
      }
    });
  } else if (typeof items === "string" && items.trim()) {
    const lines = items.split("\n").map(l => l.trim()).filter(Boolean);
    lines.forEach(line => {
      const cleanLine = line.replace(/^[•\-\*\d\.\s]+/, "").trim();
      if (!cleanLine) return;
      const match = line.match(/^(\d+)\s*(?:x|pcs|units|items)?\s*(.+)/i);
      if (match) {
        parsedItems.push({ productName: match[2].trim(), quantity: parseInt(match[1], 10) || 1 });
      } else {
        parsedItems.push({ productName: cleanLine, quantity: Number(quantityTotal) || 1 });
      }
    });
  }

  parsedItems.forEach(itemObj => {
    const rawName = itemObj.productName;
    const lowerName = rawName.toLowerCase();

    const template = (templates || []).find(
      t => t.enabled && (
        t.productName.trim().toLowerCase() === lowerName ||
        lowerName.includes(t.productName.trim().toLowerCase()) ||
        lowerName.replace(/s$/, '') === t.productName.trim().toLowerCase()
      )
    );

    if (template && template.components && template.components.length > 0) {
      template.components.forEach(comp => {
        snapshot.push({
          id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          componentName: comp.componentName.trim(),
          quantity: comp.quantity * itemObj.quantity,
          unitLabel: comp.unitLabel,
          notes: comp.notes,
          bulkEnabled: comp.bulkEnabled,
          bulkUnitLabel: comp.bulkUnitLabel,
          minPurchaseQty: comp.minPurchaseQty,
          bulkIncrement: comp.bulkIncrement,
          bulkTierRules: comp.bulkTierRules,
          bulkNotes: comp.bulkNotes,
          bulkRuleActive: comp.bulkRuleActive,
          templateProductName: template.productName
        });
      });
    } else {
      // Direct product / non-BOM / apparel / catalog item snapshot
      const parsedTShirt = parseTShirtVariant(itemObj.productName, itemObj.colour, itemObj.size);

      snapshot.push({
        id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        componentName: parsedTShirt.isTShirt ? parsedTShirt.displayName : itemObj.productName.trim(),
        quantity: itemObj.quantity,
        unitLabel: parsedTShirt.isTShirt ? "pcs" : "units",
        notes: parsedTShirt.isTShirt ? `Garment: ${parsedTShirt.displayName}` : (itemObj.notes || "Direct Product / Line Item"),
        templateProductName: parsedTShirt.isTShirt ? "T-Shirt" : itemObj.productName.trim()
      });
    }
  });

  return snapshot;
}
import { calculateBulkPurchaseQty, DEFAULT_FULFILLMENT_INVENTORY, findInventoryStockMatches, formatQuoteTemplate } from "../utils/settingsHelper";
import { getClientPromises } from "../utils/clientTierUtils";
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Truck, 
  Store, 
  User, 
  Tag, 
  Calendar, 
  Printer, 
  Copy, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  ChevronRight, 
  FileText, 
  Kanban, 
  LayoutGrid, 
  ArrowRight,
  DollarSign,
  PackageCheck,
  Package,
  ShieldAlert,
  Send,
  Sparkles,
  HeartHandshake,
  ListChecks,
  CheckSquare,
  Square,
  Settings,
  Clipboard,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Shirt,
  Tv,
  Zap,
  ShoppingBag,
  ListPlus,
  ClipboardCopy,
  Sliders,
  Layers,
  Building2,
  BookOpen,
  MessageSquareQuote
} from "lucide-react";

export interface FormProductItem {
  id: string;
  productName: string;
  quantity: number;
  itemCost: number; // Cost of Order for line item (JMD $)
  details: string;
  size?: string;
  colour?: string;
}

export const DEFAULT_FULFILLMENT_TEMPLATES: FulfillmentTemplate[] = [
  {
    id: "ft-regular-male-basket",
    productName: "Regular Male Basket",
    enabled: true,
    components: [
      { id: "c1", componentName: "Tortuga Box", quantity: 1 },
      { id: "c2", componentName: "Sun Mix", quantity: 1 },
      { id: "c3", componentName: "Wine", quantity: 1 },
      { id: "c4", componentName: "Dove Men Deodorant", quantity: 1 },
      { id: "c5", componentName: "Dove Men Body + Face Wash", quantity: 1 },
      { id: "c6", componentName: "Lays Stax / Pringles", quantity: 1 },
      { id: "c7", componentName: "Bath Towel", quantity: 1 },
      { id: "c8", componentName: "Glade Spray", quantity: 1 },
      { id: "c9", componentName: "Plastic Plate", quantity: 1 },
      { id: "c10", componentName: "Cellophane", quantity: 1.5, unitLabel: "yard" },
      { id: "c11", componentName: "Tissue Paper", quantity: 2 },
      { id: "c12", componentName: "Bow", quantity: 1 }
    ]
  },
  {
    id: "ft-regular-female-basket",
    productName: "Regular Female Basket",
    enabled: true,
    components: [
      { id: "c1", componentName: "Wine", quantity: 1 },
      { id: "c2", componentName: "Plastic Plate", quantity: 1 },
      { id: "c3", componentName: "Cellophane", quantity: 1.5, unitLabel: "yard" },
      { id: "c4", componentName: "Tissue Paper", quantity: 2 },
      { id: "c5", componentName: "Bow", quantity: 1 },
      { id: "c6", componentName: "Bath Sponge", quantity: 1 },
      { id: "c7", componentName: "Bath & Body Set", quantity: 1 },
      { id: "c8", componentName: "Tortuga Box", quantity: 1 },
      { id: "c9", componentName: "Sun Mix", quantity: 1 },
      { id: "c10", componentName: "Candle", quantity: 1 }
    ]
  },
  {
    id: "ft-magic-heart-cube",
    productName: "Magic Heart Cube",
    enabled: true,
    components: [
      { id: "c1", componentName: "Handheld Bouquet", quantity: 1 },
      { id: "c2", componentName: "5×6 Photos", quantity: 8 },
      { id: "c3", componentName: "Ferrero Chocolates", quantity: 24, unitLabel: "pc" },
      { id: "c4", componentName: "Flower Foam", quantity: 1 }
    ]
  },
  {
    id: "ft-custom-gift-box",
    productName: "Custom Gift Box",
    enabled: true,
    components: [
      { id: "c1", componentName: "Gift Box", quantity: 1 },
      { id: "c2", componentName: "Ribbon", quantity: 1 },
      { id: "c3", componentName: "Greeting Card", quantity: 1 },
      { id: "c4", componentName: "Chocolates", quantity: 5 }
    ]
  },
  {
    id: "ft-custom-bouquet",
    productName: "Custom Bouquet",
    enabled: true,
    components: [
      { id: "c1", componentName: "Bouquet Wrap", quantity: 1 },
      { id: "c2", componentName: "Ribbon", quantity: 1 },
      { id: "c3", componentName: "Red Roses", quantity: 12 }
    ]
  }
];
import UniversalPasteModal from "./UniversalPasteModal";
import { getDaysSince } from "../utils/dateHelpers";
import { getSystemSettings, saveSystemSettings, DEFAULT_CHECKLIST_TEMPLATES } from "../utils/settingsHelper";
import { getNextOrderNumber } from "../utils/orderNumberUtils";

interface OperationsHubProps {
  orders?: OperationsOrder[];
  operationsOrders?: OperationsOrder[];
  clients: Client[];
  inventory?: LuxeBookInventoryItem[];
  onSaveOrder: (order: OperationsOrder) => void;
  onDeleteOrder: (orderId: string) => void;
  onNavigateToClient?: (clientId: string) => void;
  onNavigateToTab?: (tab: string) => void;
  settings?: SystemSettings;
  onUpdateSettings?: (newSettings: SystemSettings) => void;
}

const PRODUCTION_STATUSES: ProductionStatus[] = [
  "New",
  "Confirmed",
  "In Progress",
  "Ready",
  "Out for Delivery",
  "Ready for Collection",
  "Completed",
  "Cancelled"
];

const DELIVERY_METHODS: OperationsDeliveryMethod[] = [
  "Store Pickup",
  "Knutsford Express",
  "Personal Delivery",
  "Tara Courier",
  "Other"
];

const PRIORITIES: OrderPriority[] = ["Low", "Normal", "High", "Urgent"];

/**
 * Identify operational business context strictly for Operations Board.
 * Distinct from Client Home: Each operational record belongs to CEO Lifestyle or Librarium Luxe.
 */
export function getOperationalCompany(order?: OperationsOrder | null): "CEO Lifestyle" | "Librarium Luxe" {
  if (!order) return "CEO Lifestyle";
  if (order.company === "Librarium Luxe" || order.company === "CEO Lifestyle") {
    return order.company;
  }
  if (order.clientHome === "Librarium Luxe") return "Librarium Luxe";
  const itemsStr = typeof order.items === "string"
    ? order.items
    : (Array.isArray(order.items) ? order.items.map(i => i?.productName || "").join(" ") : "");
  if (/book|hardcover|paperback|novel|author|librarium|reading|edition|volume/i.test(itemsStr)) {
    return "Librarium Luxe";
  }
  return "CEO Lifestyle";
}

export default function OperationsHub({
  orders: propsOrders,
  operationsOrders,
  clients,
  inventory = [],
  onSaveOrder,
  onDeleteOrder,
  onNavigateToClient,
  onNavigateToTab,
  settings,
  onUpdateSettings
}: OperationsHubProps) {
  const orders = (propsOrders !== undefined ? propsOrders : operationsOrders) || [];
  // Board View Switcher
  const [boardView, setBoardView] = useState<"active" | "new" | "today" | "week" | "overdue" | "completed">("active");
  const [layoutMode, setLayoutMode] = useState<"grid" | "kanban">("grid");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCompany, setFilterCompany] = useState<"All" | "CEO Lifestyle" | "Librarium Luxe">("All");
  const [filterInvoice, setFilterInvoice] = useState<"All" | "Not Logged" | "Logged">("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterTier, setFilterTier] = useState<string>("All");
  const [filterDelivery, setFilterDelivery] = useState<string>("All");
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [filterStaff, setFilterStaff] = useState<string>("All");
  const [filterExpress, setFilterExpress] = useState<string>("All");

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OperationsOrder | null>(null);
  const [printableJobSheetOrder, setPrintableJobSheetOrder] = useState<OperationsOrder | null>(null);
  const [communicationModalOrder, setCommunicationModalOrder] = useState<OperationsOrder | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pendingCompletionOrder, setPendingCompletionOrder] = useState<{ order: OperationsOrder; isFormSave?: boolean; savedOrderPayload?: OperationsOrder } | null>(null);

  // Manage Checklist Templates Modal State
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [adventistModalOrder, setAdventistModalOrder] = useState<OperationsOrder | null>(null);

  const isAnyModalOpen = !!(isFormOpen || isPasteModalOpen || printableJobSheetOrder || communicationModalOrder || isTemplateManagerOpen || adventistModalOrder);
  useBodyScrollLock(isAnyModalOpen);

  const handleConfirmPasteOrders = (pastedOrders: OperationsOrder[]) => {
    if (pastedOrders.length === 0) return;
    pastedOrders.forEach(o => {
      let finalOrder = { ...o };
      // Attempt client matching
      if (clients && clients.length > 0 && finalOrder.clientName) {
        const lowerName = finalOrder.clientName.trim().toLowerCase();
        const matchedClient = clients.find(c => {
          const cFullName = `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase();
          return cFullName === lowerName;
        });
        if (matchedClient) {
          finalOrder.clientId = matchedClient.id;
          finalOrder.clientTier = matchedClient.tier || finalOrder.clientTier;
          if (!finalOrder.clientPhone || finalOrder.clientPhone === "N/A") {
            finalOrder.clientPhone = matchedClient.contact?.phoneNumber || "N/A";
          }
          if (matchedClient.adventist) {
            finalOrder.adventist = matchedClient.adventist;
          }
        }
      }

      // Generate fulfillment snapshot if templates exist
      if ((!finalOrder.fulfillmentSnapshot || finalOrder.fulfillmentSnapshot.length === 0) && fulfillmentTemplates) {
        finalOrder.fulfillmentSnapshot = createOrderFulfillmentSnapshot(
          finalOrder.items,
          fulfillmentTemplates,
          finalOrder.quantityTotal
        );
      }

      onSaveOrder(finalOrder);
    });
  };

  // Form Fields State
  const [formOrderNumber, setFormOrderNumber] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formClientName, setFormClientName] = useState("");
  const [formClientTier, setFormClientTier] = useState<ClientTier | "">("");
  const [formClientPhone, setFormClientPhone] = useState("");
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
  
  // Multi-product line items state (Up to 10 products per order)
  const [formItems, setFormItems] = useState<FormProductItem[]>([
    { id: "item-1", productName: "", quantity: 1, itemCost: 0, details: "" }
  ]);

  const [formDateCreated, setFormDateCreated] = useState<string>("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formProductionStatus, setFormProductionStatus] = useState<ProductionStatus>("New");
  const [formDeliveryMethod, setFormDeliveryMethod] = useState<OperationsDeliveryMethod>("Store Pickup");
  const [formDeliveryLocation, setFormDeliveryLocation] = useState("");
  const [formAssignedStaff, setFormAssignedStaff] = useState("");
  const [formPriority, setFormPriority] = useState<OrderPriority>("Normal");
  const [formInternalNotes, setFormInternalNotes] = useState("");
  const [formDepositPaid, setFormDepositPaid] = useState(true);
  const [formDepositAmount, setFormDepositAmount] = useState<number | "">(0);
  const [formInvoiceLogged, setFormInvoiceLogged] = useState<boolean>(false);
  const [formCompany, setFormCompany] = useState<"CEO Lifestyle" | "Librarium Luxe">("CEO Lifestyle");
  const [formClientHome, setFormClientHome] = useState<string>("CEO Lifestyle");
  const [formExpressOrder, setFormExpressOrder] = useState<YesNo>("No");
  const [formExpressNote, setFormExpressNote] = useState<string>("");
  const [showFormCmtsPopover, setShowFormCmtsPopover] = useState(false);
  const [isFulfillmentInventoryOpen, setIsFulfillmentInventoryOpen] = useState(false);
  const [newInvItemName, setNewInvItemName] = useState("");
  const [newInvUnitLabel, setNewInvUnitLabel] = useState("units");

  const currentSettings = settings || getSystemSettings();
  const fulfillmentInventory = currentSettings.fulfillmentInventory || DEFAULT_FULFILLMENT_INVENTORY;

  const handleAddProductItem = () => {
    if (formItems.length >= 10) return;
    setFormItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productName: "",
        quantity: 1,
        itemCost: 0,
        details: "",
        size: "",
        colour: ""
      }
    ]);
  };

  const handleRemoveProductItem = (id: string) => {
    if (formItems.length <= 1) return;
    setFormItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateProductItem = (id: string, field: keyof FormProductItem, val: any) => {
    setFormItems(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  // Checklist Form Fields
  const [hasFormChecklist, setHasFormChecklist] = useState<boolean>(false);
  const [formChecklistTemplateName, setFormChecklistTemplateName] = useState<string>("");
  const [formChecklist, setFormChecklist] = useState<ChecklistItem[]>([]);
  const [newCustomChecklistItemText, setNewCustomChecklistItemText] = useState("");
  const [checklistTemplatesList, setChecklistTemplatesList] = useState<ProductionChecklistTemplate[]>(() => {
    return getSystemSettings().checklistTemplates || DEFAULT_CHECKLIST_TEMPLATES;
  });
  const [editingTemplate, setEditingTemplate] = useState<ProductionChecklistTemplate | null>(null);
  const [showChecklistIncompleteModal, setShowChecklistIncompleteModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("Apparel");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newTemplateItemsText, setNewTemplateItemsText] = useState("");

  // Card expanded checklist state (track order IDs with visible checklists)
  const [expandedChecklistOrderIds, setExpandedChecklistOrderIds] = useState<Record<string, boolean>>({});

  // FULFILLMENT CHECKLIST (Bulk Items To Get / Purchasing Checklist) STATE
  interface ManualFulfillmentItem {
    id: string;
    text: string;
    completed: boolean;
    createdAt: string;
  }

  // Checked state for order-derived items (keyed by lowercase item string)
  const [checkedDerivedKeys, setCheckedDerivedKeys] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("ceo_checked_derived_keys_v2");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed loading checked derived keys", e);
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem("ceo_checked_derived_keys_v2", JSON.stringify(checkedDerivedKeys));
    } catch (e) {
      console.error("Failed saving checked derived keys", e);
    }
  }, [checkedDerivedKeys]);

  // Dismissed keys for order-derived items (if user explicitly deleted a derived item)
  const [dismissedDerivedKeys, setDismissedDerivedKeys] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("ceo_dismissed_derived_keys_v2");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed loading dismissed derived keys", e);
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem("ceo_dismissed_derived_keys_v2", JSON.stringify(dismissedDerivedKeys));
    } catch (e) {
      console.error("Failed saving dismissed derived keys", e);
    }
  }, [dismissedDerivedKeys]);

  // Manual entries independent of orders
  const [manualFulfillmentList, setManualFulfillmentList] = useState<ManualFulfillmentItem[]>(() => {
    try {
      const saved = localStorage.getItem("ceo_manual_fulfillment_v2");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed loading manual fulfillment list", e);
    }
    return [
      { id: "m-1", text: "5x Gift Bags", completed: false, createdAt: new Date().toISOString() },
      { id: "m-2", text: "2x Ribbon Rolls", completed: false, createdAt: new Date().toISOString() },
      { id: "m-3", text: "10x Thank You Cards", completed: false, createdAt: new Date().toISOString() }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem("ceo_manual_fulfillment_v2", JSON.stringify(manualFulfillmentList));
    } catch (e) {
      console.error("Failed saving manual fulfillment list", e);
    }
  }, [manualFulfillmentList]);

  // Inputs for manual additions
  const [newFulfillmentInput, setNewFulfillmentInput] = useState("");
  const [copiedFulfillmentNotice, setCopiedFulfillmentNotice] = useState<"all" | "remaining" | "shopping" | null>(null);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [bulkAddText, setBulkAddText] = useState("");
  const [fulfillmentViewMode, setFulfillmentViewMode] = useState<"consolidated" | "grouped">("consolidated");

  // Manual Purchase Quantity Overrides for Fulfillment Center items
  const [manualPurchaseOverrides, setManualPurchaseOverrides] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("ceo_manual_purchase_overrides_v1");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed loading manual purchase overrides", e);
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem("ceo_manual_purchase_overrides_v1", JSON.stringify(manualPurchaseOverrides));
    } catch (e) {
      console.error("Failed saving manual purchase overrides", e);
    }
  }, [manualPurchaseOverrides]);

  const [editingOverrideKey, setEditingOverrideKey] = useState<string | null>(null);
  const [overrideInputVal, setOverrideInputVal] = useState<string>("");

  // Fulfillment Templates State
  const [fulfillmentTemplates, setFulfillmentTemplates] = useState<FulfillmentTemplate[]>(() => {
    try {
      const saved = localStorage.getItem("ceo_fulfillment_templates_v1");
      if (saved) {
        const parsed: FulfillmentTemplate[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const missingDefaults = DEFAULT_FULFILLMENT_TEMPLATES.filter(
            def => !parsed.some(p => p.productName.trim().toLowerCase() === def.productName.trim().toLowerCase())
          );
          if (missingDefaults.length > 0) {
            return [...parsed, ...missingDefaults];
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed loading fulfillment templates", e);
    }
    return DEFAULT_FULFILLMENT_TEMPLATES;
  });

  useEffect(() => {
    try {
      localStorage.setItem("ceo_fulfillment_templates_v1", JSON.stringify(fulfillmentTemplates));
    } catch (e) {
      console.error("Failed saving fulfillment templates", e);
    }
  }, [fulfillmentTemplates]);

  // Modal State for Template Admin
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateProductNameInput, setTemplateProductNameInput] = useState("");
  const [templateComponentsInput, setTemplateComponentsInput] = useState<{ id: string; componentName: string; quantity: number; unitLabel?: string }[]>([]);

  const handleOpenNewTemplate = () => {
    setEditingTemplateId("new");
    setTemplateProductNameInput("");
    setTemplateComponentsInput([
      { id: `comp-${Date.now()}-1`, componentName: "", quantity: 1, unitLabel: "" }
    ]);
  };

  const handleOpenEditTemplate = (template: FulfillmentTemplate) => {
    setEditingTemplateId(template.id);
    setTemplateProductNameInput(template.productName);
    setTemplateComponentsInput(
      template.components.map(c => ({
        id: c.id,
        componentName: c.componentName,
        quantity: c.quantity,
        unitLabel: c.unitLabel || ""
      }))
    );
  };

  const handleSaveTemplate = () => {
    const trimmedProduct = templateProductNameInput.trim();
    if (!trimmedProduct) {
      alert("Please enter a product name for the template.");
      return;
    }

    const validComponents = templateComponentsInput
      .filter(c => c.componentName.trim().length > 0)
      .map(c => ({
        id: c.id || `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        componentName: c.componentName.trim(),
        quantity: Number(c.quantity) > 0 ? Number(c.quantity) : 1,
        unitLabel: c.unitLabel?.trim() || undefined
      }));

    if (validComponents.length === 0) {
      alert("Please add at least one required component item to the template.");
      return;
    }

    if (editingTemplateId === "new") {
      const newTemplate: FulfillmentTemplate = {
        id: `ft-${Date.now()}`,
        productName: trimmedProduct,
        enabled: true,
        components: validComponents,
        createdDate: new Date().toISOString()
      };
      setFulfillmentTemplates(prev => [...prev, newTemplate]);
    } else if (editingTemplateId) {
      setFulfillmentTemplates(prev => prev.map(t => {
        if (t.id === editingTemplateId) {
          return {
            ...t,
            productName: trimmedProduct,
            components: validComponents,
            updatedDate: new Date().toISOString()
          };
        }
        return t;
      }));
    }

    setEditingTemplateId(null);
  };

  const handleToggleTemplateEnabled = (id: string) => {
    setFulfillmentTemplates(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm("Are you sure you want to delete this fulfillment template?")) {
      setFulfillmentTemplates(prev => prev.filter(t => t.id !== id));
      if (editingTemplateId === id) setEditingTemplateId(null);
    }
  };

  const handleResetDefaultTemplates = () => {
    if (confirm("Reset templates to default system templates?")) {
      setFulfillmentTemplates(DEFAULT_FULFILLMENT_TEMPLATES);
      setEditingTemplateId(null);
    }
  };

  // Count of active orders currently in NEW status (Fulfillment source filter)
  // CRITICAL-005: ONLY an order explicitly recognized as NEW may generate active fulfillment demand.
  const activeNewOrders = useMemo(() => {
    return orders.filter(o => {
      const status = (o.productionStatus ?? (o as any).status ?? "").trim().toLowerCase();
      return status === "new";
    });
  }, [orders]);

  // DYNAMICALLY DERIVED FULFILLMENT REQUIREMENTS FROM CURRENT "NEW" ORDERS ONLY
  const derivedFulfillmentItems = useMemo(() => {
    const normalizeProductName = (rawName: string, explicitColour?: string, explicitSize?: string) => {
      const parsedTShirt = parseTShirtVariant(rawName, explicitColour, explicitSize);
      if (parsedTShirt.isTShirt) {
        return {
          groupKey: "t-shirt",
          productName: "T-Shirt",
          isTShirt: true,
          parsedTShirt
        };
      }
      const canon = canonicalizeProductName(rawName);
      return {
        groupKey: canon.canonicalKey || rawName.trim().toLowerCase(),
        productName: canon.normalizedName || rawName.trim(),
        isTShirt: false,
        parsedTShirt: undefined
      };
    };

    const groupsMap: Record<string, {
      productName: string;
      isTShirt: boolean;
      orderNumbersSet: Set<string>;
      totalOrderedQty: number;
      variantsMap: Record<string, {
        variantKey: string;
        colour?: string;
        size?: string;
        variantLabel?: string;
        qty: number;
        orderNumbersSet: Set<string>;
      }>;
    }> = {};

    activeNewOrders.forEach(order => {
      const orderNum = order.orderNumber || order.id;

      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          const rawName = item.productName?.trim();
          if (rawName) {
            const { groupKey, productName, isTShirt, parsedTShirt } = normalizeProductName(rawName, item.colour, item.size);
            const qty = Number(item.quantity) || 1;
            const colour = parsedTShirt?.colour || item.colour?.trim() || undefined;
            const size = parsedTShirt?.size || item.size?.trim() || undefined;
            const variantKey = isTShirt 
              ? (parsedTShirt?.variantKey || `t-shirt::c:${colour ? colour.toLowerCase() : ''}::s:${size ? size.toLowerCase() : ''}`)
              : `${groupKey}::c:${colour ? colour.toLowerCase() : ''}::s:${size ? size.toLowerCase() : ''}`;

            if (!groupsMap[groupKey]) {
              groupsMap[groupKey] = {
                productName,
                isTShirt,
                orderNumbersSet: new Set(),
                totalOrderedQty: 0,
                variantsMap: {}
              };
            }
            groupsMap[groupKey].orderNumbersSet.add(orderNum);
            groupsMap[groupKey].totalOrderedQty += qty;

            if (!groupsMap[groupKey].variantsMap[variantKey]) {
              groupsMap[groupKey].variantsMap[variantKey] = {
                variantKey,
                colour,
                size,
                variantLabel: parsedTShirt?.variantLabel,
                qty: 0,
                orderNumbersSet: new Set()
              };
            }

            groupsMap[groupKey].variantsMap[variantKey].qty += qty;
            groupsMap[groupKey].variantsMap[variantKey].orderNumbersSet.add(orderNum);
          }
        });
      } else if (typeof order.items === "string" && order.items.trim()) {
        const rawName = order.items.trim();
        const { groupKey, productName, isTShirt, parsedTShirt } = normalizeProductName(rawName);
        const qty = Number(order.quantityTotal) || 1;
        const colour = parsedTShirt?.colour;
        const size = parsedTShirt?.size;
        const variantKey = isTShirt 
          ? (parsedTShirt?.variantKey || `t-shirt::c:${colour ? colour.toLowerCase() : ''}::s:${size ? size.toLowerCase() : ''}`)
          : `${groupKey}::c:::s:`;

        if (!groupsMap[groupKey]) {
          groupsMap[groupKey] = {
            productName,
            isTShirt,
            orderNumbersSet: new Set(),
            totalOrderedQty: 0,
            variantsMap: {}
          };
        }
        groupsMap[groupKey].orderNumbersSet.add(orderNum);
        groupsMap[groupKey].totalOrderedQty += qty;

        if (!groupsMap[groupKey].variantsMap[variantKey]) {
          groupsMap[groupKey].variantsMap[variantKey] = {
            variantKey,
            colour,
            size,
            variantLabel: parsedTShirt?.variantLabel,
            qty: 0,
            orderNumbersSet: new Set()
          };
        }

        groupsMap[groupKey].variantsMap[variantKey].qty += qty;
        groupsMap[groupKey].variantsMap[variantKey].orderNumbersSet.add(orderNum);
      }
    });

    const result: {
      id: string;
      type: "derived";
      groupKey: string;
      displayName: string;
      totalQty: number;
      orderNumbers: string[];
      hasTemplate: boolean;
      matchType: string;
      matchDetails?: string;
      variants: {
        variantKey: string;
        colour?: string;
        size?: string;
        componentName?: string;
        qty: number;
        purchaseQty?: number;
        bulkPurchaseMultiple?: number;
        bulkUnitLabel?: string;
        bulkNotes?: string;
        unitLabel?: string;
        orderNumbers: string[];
        label: string;
        completed: boolean;
      }[];
      text: string;
      completed: boolean;
    }[] = [];

    Object.keys(groupsMap).forEach(groupKey => {
      if (dismissedDerivedKeys[groupKey]) return;

      const group = groupsMap[groupKey];
      const orderNumbers = Array.from(group.orderNumbersSet);

      // Match item against full product catalog
      const matchResult = matchOrderItemToCatalog(group.productName, {
        templates: fulfillmentTemplates,
        luxeBooks: inventory,
        regularInventory: currentSettings.regularInventory,
        fulfillmentMaterials: fulfillmentInventory
      });

      const template = matchResult.matchType === "BOM_TEMPLATE" ? matchResult.templateRecord : undefined;

      const variantsList: {
        variantKey: string;
        colour?: string;
        size?: string;
        componentName?: string;
        qty: number;
        purchaseQty?: number;
        bulkPurchaseMultiple?: number;
        bulkUnitLabel?: string;
        bulkNotes?: string;
        unitLabel?: string;
        orderNumbers: string[];
        label: string;
        completed: boolean;
      }[] = [];

      let totalQty = group.totalOrderedQty;

      if (template && template.components && template.components.length > 0) {
        // Expand template components multiplying component qty by total ordered product qty
        template.components.forEach(comp => {
          const compQty = totalQty * comp.quantity;
          const variantKey = `${groupKey}::comp:${comp.id}`;

          const calcRes = calculateBulkPurchaseQty(compQty, comp);
          const suggestedPurchaseQty = calcRes.hasRule ? calcRes.purchaseQty : undefined;
          const overrideQty = manualPurchaseOverrides[variantKey];
          const effectivePurchaseQty = overrideQty !== undefined ? overrideQty : suggestedPurchaseQty;
          const isOverridden = overrideQty !== undefined;

          let label = `${compQty}`;
          if (comp.unitLabel) {
            label += ` ${comp.unitLabel}`;
          }
          label += ` × ${comp.componentName}`;

          if (effectivePurchaseQty && effectivePurchaseQty !== compQty) {
            label += ` (Buy: ${effectivePurchaseQty} ${comp.bulkUnitLabel || comp.unitLabel || "units"}${isOverridden ? ' *Override*' : ''})`;
          }

          const isCompCompleted = !!checkedDerivedKeys[variantKey];

          variantsList.push({
            variantKey,
            componentName: comp.componentName,
            qty: compQty,
            purchaseQty: effectivePurchaseQty,
            bulkPurchaseMultiple: comp.bulkIncrement || comp.bulkPurchaseMultiple,
            bulkUnitLabel: comp.bulkUnitLabel || comp.unitLabel,
            bulkNotes: comp.bulkNotes || calcRes.ruleDescription,
            unitLabel: comp.unitLabel,
            orderNumbers,
            label,
            completed: isCompCompleted
          });
        });
      } else {
        // Standard variant breakdown (Size/Colour or product default)
        const variantKeys = Object.keys(group.variantsMap);
        variantKeys.forEach(vKey => {
          const v = group.variantsMap[vKey];

          let label = `${v.qty} × `;
          if (group.isTShirt) {
            label += v.variantLabel || [v.colour, v.size].filter(Boolean).join(" ") || "Standard";
          } else if (v.colour && v.size) {
            label += `${v.colour} — ${v.size}`;
          } else if (v.colour) {
            label += `${v.colour}`;
          } else if (v.size) {
            label += `Size ${v.size}`;
          } else {
            label += `${group.productName}`;
          }

          if (matchResult.matchType === "LUXE_BOOK") {
            label += ` (Stock: ${matchResult.availableStock} copies)`;
          } else if (matchResult.matchType === "REGULAR_INVENTORY") {
            label += ` (Stock: ${matchResult.availableStock} ${matchResult.unitLabel})`;
          } else if (matchResult.matchType === "UNMATCHED" && !group.isTShirt) {
            label += ` (Unmatched Product)`;
          }

          const isVariantCompleted = !!checkedDerivedKeys[vKey];

          variantsList.push({
            variantKey: vKey,
            colour: v.colour,
            size: v.size,
            qty: v.qty,
            orderNumbers: Array.from(v.orderNumbersSet),
            label,
            completed: isVariantCompleted
          });
        });
      }

      let pluralName = group.productName;
      if (group.isTShirt) {
        pluralName = "T-Shirts";
      } else if (totalQty > 1 && !pluralName.toLowerCase().endsWith('s') && !pluralName.toLowerCase().endsWith('box')) {
        pluralName = `${pluralName}s`;
      }

      const groupTitleText = group.isTShirt 
        ? `T-SHIRTS: ${totalQty} TOTAL` 
        : `${totalQty} × ${pluralName}`;
      const allVariantsCompleted = variantsList.length > 0 && variantsList.every(v => v.completed);
      const isGroupCompleted = !!checkedDerivedKeys[groupKey] || allVariantsCompleted;

      result.push({
        id: `derived-group-${groupKey}`,
        type: "derived" as const,
        groupKey,
        displayName: pluralName,
        totalQty,
        orderNumbers,
        hasTemplate: !!template,
        matchType: matchResult.matchType,
        matchDetails: matchResult.matchReason,
        variants: variantsList,
        text: groupTitleText,
        completed: isGroupCompleted
      });
    });

    return result;
  }, [activeNewOrders, checkedDerivedKeys, dismissedDerivedKeys, fulfillmentTemplates, inventory, currentSettings.regularInventory, fulfillmentInventory]);

  // CONSOLIDATED FULFILLMENT REQUIREMENTS ACROSS ACTIVE NEW ORDERS
  const consolidatedFulfillmentRequirements = useMemo(() => {
    const map: Record<string, {
      key: string;
      componentName: string;
      totalRequiredQty: number;
      unitLabel?: string;
      componentSpec?: FulfillmentTemplateItem;
      orderNumbersSet: Set<string>;
      productNamesSet: Set<string>;
    }> = {};

    activeNewOrders.forEach(order => {
      const orderNum = order.orderNumber || order.id;

      // Read order snapshot if available
      const orderSnapshot = (order.fulfillmentSnapshot && order.fulfillmentSnapshot.length > 0)
        ? order.fulfillmentSnapshot
        : createOrderFulfillmentSnapshot(order.items, fulfillmentTemplates, order.quantityTotal);

      if (orderSnapshot && orderSnapshot.length > 0) {
        orderSnapshot.forEach(comp => {
          const compName = (comp.componentName || "").trim();
          if (!compName) return;
          const compKey = compName.toLowerCase();
          const reqQty = Number(comp.quantity) || 0;

          if (!map[compKey]) {
            map[compKey] = {
              key: `cons::${compKey}`,
              componentName: compName,
              totalRequiredQty: 0,
              unitLabel: comp.unitLabel,
              componentSpec: comp as unknown as FulfillmentTemplateItem,
              orderNumbersSet: new Set(),
              productNamesSet: new Set()
            };
          } else {
            if (!map[compKey].componentSpec && comp) {
              map[compKey].componentSpec = comp as unknown as FulfillmentTemplateItem;
            }
          }

          map[compKey].totalRequiredQty += reqQty;
          map[compKey].orderNumbersSet.add(orderNum);
          map[compKey].productNamesSet.add(comp.templateProductName || "Order Requirement");
        });
      } else {
        // Fallback for orders without template or snapshot
        const items = Array.isArray(order.items)
          ? order.items
          : typeof order.items === "string" && order.items.trim()
          ? [{ productName: order.items.trim(), quantity: Number(order.quantityTotal) || 1 }]
          : [];

        items.forEach(item => {
          const rawName = (item.productName || "").trim();
          if (!rawName) return;
          const orderQty = Number(item.quantity) || 1;
          const lowerName = rawName.toLowerCase();

          const compKey = lowerName;
          if (!map[compKey]) {
            map[compKey] = {
              key: `cons::${compKey}`,
              componentName: rawName,
              totalRequiredQty: 0,
              unitLabel: undefined,
              componentSpec: undefined,
              orderNumbersSet: new Set(),
              productNamesSet: new Set()
            };
          }
          map[compKey].totalRequiredQty += orderQty;
          map[compKey].orderNumbersSet.add(orderNum);
          map[compKey].productNamesSet.add(rawName);
        });
      }
    });

    // CRITICAL-007: Shared physical inventory stock pools
    // Tracks remaining available stock for each physical inventory record so that
    // multiple requirements resolving to the same physical inventory item share that stock pool,
    // preventing double-counting and under-purchasing.
    const stockPools = new Map<string, number>();
    const poolInitialStock = new Map<string, number>();

    return Object.values(map).map(item => {
      const requiredQty = item.totalRequiredQty;
      const cNameLower = (item.componentName || "").trim().toLowerCase();
      const isFlowerItem = cNameLower.includes("flower") || cNameLower.includes("rose") || cNameLower.includes("floral") || cNameLower.includes("bouquet");

      // Match item across materials, book catalog, regular goods, or unmatched
      const matchResult = matchOrderItemToCatalog(item.componentName, {
        templates: fulfillmentTemplates,
        luxeBooks: inventory,
        regularInventory: currentSettings.regularInventory,
        fulfillmentMaterials: fulfillmentInventory
      });

      // Match item in Fulfillment Inventory (On-Hand materials) using conservative catalog match
      const invMatch = matchResult.matchType === "FULFILLMENT_MATERIAL"
        ? matchResult.materialRecord
        : undefined;

      // Identify physical inventory pool and initial stock
      let poolKey: string | null = null;
      let initialStock = 0;
      let catalogType: "BOM_MATERIAL" | "LUXE_BOOK" | "REGULAR_INVENTORY" | "UNMATCHED" = "BOM_MATERIAL";
      let displayCategory = "Fulfillment Materials";

      if (isFlowerItem) {
        poolKey = null;
        initialStock = 0;
        catalogType = "BOM_MATERIAL";
      } else if (invMatch) {
        poolKey = `fulfillment_inv_${invMatch.id}`;
        initialStock = Math.max(0, Number(invMatch.availableQty) || 0);
        catalogType = "BOM_MATERIAL";
        displayCategory = invMatch.category || "Fulfillment Materials";
      } else if (matchResult.matchType === "LUXE_BOOK") {
        poolKey = `luxe_book_${matchResult.matchedId || matchResult.matchedName.toLowerCase()}`;
        initialStock = Math.max(0, matchResult.availableStock || 0);
        catalogType = "LUXE_BOOK";
        displayCategory = matchResult.category || "Librarium Luxe Book";
      } else if (matchResult.matchType === "REGULAR_INVENTORY") {
        poolKey = `regular_inv_${matchResult.matchedId || matchResult.matchedName.toLowerCase()}`;
        initialStock = Math.max(0, matchResult.availableStock || 0);
        catalogType = "REGULAR_INVENTORY";
        displayCategory = matchResult.category || "Regular Goods";
      } else if (matchResult.matchType === "FULFILLMENT_MATERIAL") {
        const matId = matchResult.materialRecord?.id || matchResult.matchedId || matchResult.matchedName.toLowerCase();
        poolKey = `fulfillment_inv_${matId}`;
        initialStock = Math.max(0, matchResult.availableStock || 0);
        catalogType = "BOM_MATERIAL";
        displayCategory = matchResult.category || "Fulfillment Materials";
      } else {
        poolKey = null;
        initialStock = 0;
        catalogType = "UNMATCHED";
        displayCategory = "Unmatched Product";
      }

      // Allocate stock from shared pool:
      // Available Stock -> Allocate against requirements -> Remaining Stock -> Next requirement uses remaining stock
      let allocatedQty = 0;
      if (poolKey) {
        if (!stockPools.has(poolKey)) {
          stockPools.set(poolKey, initialStock);
          poolInitialStock.set(poolKey, initialStock);
        }
        const currentPoolStock = stockPools.get(poolKey) ?? 0;
        allocatedQty = Math.min(requiredQty, currentPoolStock);
        const remainingPoolStock = Math.max(0, currentPoolStock - allocatedQty);
        stockPools.set(poolKey, remainingPoolStock);
      }

      const availableQty = allocatedQty;
      
      // REQUIRED - IN STOCK = TO PURCHASE (Max 0, no negative values)
      const remainingReqQty = Math.max(0, requiredQty - availableQty);

      // Apply bulk purchasing rules to remaining requirement if any
      let calcRes = { hasRule: false, purchaseQty: remainingReqQty, ruleDescription: "Exact Remaining Quantity" };
      if (remainingReqQty > 0) {
        calcRes = calculateBulkPurchaseQty(remainingReqQty, item.componentSpec || invMatch);
      } else {
        calcRes = { hasRule: false, purchaseQty: 0, ruleDescription: requiredQty > 0 ? "Fully covered by in-stock Inventory" : "No active requirement" };
      }

      const suggestedPurchaseQty = remainingReqQty === 0 ? 0 : (calcRes.hasRule ? Math.max(0, calcRes.purchaseQty) : remainingReqQty);
      const overrideQty = manualPurchaseOverrides[item.key];
      const effectivePurchaseQty = overrideQty !== undefined ? Math.max(0, overrideQty) : suggestedPurchaseQty;
      const isOverridden = overrideQty !== undefined;

      const completed = !!checkedDerivedKeys[item.key];

      return {
        key: item.key,
        componentName: item.componentName,
        totalRequiredQty: requiredQty,
        availableQty,
        remainingReqQty,
        catalogType,
        displayCategory,
        isUnmatched: catalogType === "UNMATCHED",
        matchReason: matchResult.matchReason,
        matchedName: matchResult.matchedName,
        unitLabel: item.unitLabel || invMatch?.unitLabel || matchResult.unitLabel || '',
        bulkUnitLabel: item.componentSpec?.bulkUnitLabel || invMatch?.bulkUnitLabel || item.unitLabel || invMatch?.unitLabel || matchResult.unitLabel || '',
        bulkNotes: item.componentSpec?.bulkNotes || invMatch?.bulkNotes || calcRes.ruleDescription,
        purchaseQty: effectivePurchaseQty,
        suggestedPurchaseQty,
        isOverridden,
        hasBulkRule: calcRes.hasRule,
        ruleDescription: calcRes.ruleDescription,
        orderNumbers: Array.from(item.orderNumbersSet),
        productNames: Array.from(item.productNamesSet),
        completed,
        invMatchId: invMatch?.id,
        poolKey,
        poolInitialStock: poolKey ? (poolInitialStock.get(poolKey) ?? 0) : 0,
        poolRemainingStock: poolKey ? (stockPools.get(poolKey) ?? 0) : 0
      };
    });
  }, [activeNewOrders, fulfillmentTemplates, fulfillmentInventory, inventory, currentSettings.regularInventory, checkedDerivedKeys, manualPurchaseOverrides]);

  // COMBINED FULFILLMENT CHECKLIST STATS
  const totalFulfillmentRemaining = useMemo(() => {
    let remaining = 0;
    derivedFulfillmentItems.forEach(group => {
      if (!group.completed) {
        group.variants.forEach(v => {
          if (!v.completed) remaining++;
        });
      }
    });
    remaining += manualFulfillmentList.filter(m => !m.completed).length;
    return remaining;
  }, [derivedFulfillmentItems, manualFulfillmentList]);

  const totalFulfillmentCompleted = useMemo(() => {
    let completed = 0;
    derivedFulfillmentItems.forEach(group => {
      group.variants.forEach(v => {
        if (v.completed) completed++;
      });
    });
    completed += manualFulfillmentList.filter(m => m.completed).length;
    return completed;
  }, [derivedFulfillmentItems, manualFulfillmentList]);

  // Handlers
  const handleToggleDerivedVariant = (variantKey: string) => {
    setCheckedDerivedKeys(prev => ({
      ...prev,
      [variantKey]: !prev[variantKey]
    }));
  };

  const handleToggleDerivedGroup = (groupKey: string, variants: { variantKey: string }[], currentCompleted: boolean) => {
    const targetState = !currentCompleted;
    setCheckedDerivedKeys(prev => {
      const next = { ...prev, [groupKey]: targetState };
      variants.forEach(v => {
        next[v.variantKey] = targetState;
      });
      return next;
    });
  };

  const handleDismissDerivedGroup = (groupKey: string) => {
    setDismissedDerivedKeys(prev => ({
      ...prev,
      [groupKey]: true
    }));
  };

  const handleAddManualFulfillmentItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newFulfillmentInput.trim();
    if (!trimmed) return;

    const lines = trimmed.split("\n").map(l => l.trim()).filter(Boolean);
    const newItems: ManualFulfillmentItem[] = lines.map(line => ({
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: line,
      completed: false,
      createdAt: new Date().toISOString()
    }));

    setManualFulfillmentList(prev => [...prev, ...newItems]);
    setNewFulfillmentInput("");
  };

  const handleClearCompletedFulfillment = () => {
    setCheckedDerivedKeys({});
    setManualFulfillmentList(prev => prev.filter(m => !m.completed));
  };

  const handleClearAllFulfillment = () => {
    if (confirm("Are you sure you want to clear manual items and uncheck active requirements?")) {
      setManualFulfillmentList([]);
      setCheckedDerivedKeys({});
      const newDismissed = { ...dismissedDerivedKeys };
      derivedFulfillmentItems.forEach(item => {
        newDismissed[item.groupKey] = true;
      });
      setDismissedDerivedKeys(newDismissed);
    }
  };

  const handleRestoreDismissedDerived = () => {
    setDismissedDerivedKeys({});
  };

  const handleCopyFulfillmentAll = () => {
    const lines: string[] = [];

    if (fulfillmentViewMode === "consolidated") {
      lines.push(`📋 CONSOLIDATED FULFILLMENT CHECKLIST (${activeNewOrders.length} NEW Orders)`);
      lines.push(`========================================`);
      consolidatedFulfillmentRequirements.forEach(item => {
        let text = "";
        if (item.hasBulkRule && item.purchaseQty) {
          text = `${item.purchaseQty} ${item.bulkUnitLabel || item.unitLabel || ''} ${item.componentName} (Required: ${item.totalRequiredQty} ${item.unitLabel || ''})`;
        } else {
          text = `${item.totalRequiredQty}${item.unitLabel ? ` ${item.unitLabel}` : ''} × ${item.componentName}`;
        }
        lines.push(`☐ ${text}`);
      });
      if (manualFulfillmentList.length > 0) {
        lines.push(`\n-- MANUAL ENTRIES --`);
        manualFulfillmentList.forEach(m => lines.push(`☐ ${m.text}`));
      }
    } else {
      derivedFulfillmentItems.forEach(group => {
        lines.push(group.text);
        if (group.variants.length > 0) {
          group.variants.forEach(v => {
            lines.push(`    ${v.label}`);
          });
        }
      });
      manualFulfillmentList.forEach(m => {
        lines.push(m.text);
      });
    }

    if (lines.length === 0) return;
    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedFulfillmentNotice("all");
    setTimeout(() => setCopiedFulfillmentNotice(null), 2500);
  };

  const handleCopyFulfillmentRemaining = () => {
    const lines: string[] = [];

    if (fulfillmentViewMode === "consolidated") {
      const remainingConsolidated = consolidatedFulfillmentRequirements.filter(i => !i.completed);
      const remainingManual = manualFulfillmentList.filter(m => !m.completed);

      lines.push(`📋 REMAINING FULFILLMENT REQUIREMENTS (${activeNewOrders.length} NEW Orders)`);
      lines.push(`========================================`);

      remainingConsolidated.forEach(item => {
        let text = "";
        if (item.hasBulkRule && item.purchaseQty) {
          text = `${item.purchaseQty} ${item.bulkUnitLabel || item.unitLabel || ''} ${item.componentName} (Required: ${item.totalRequiredQty} ${item.unitLabel || ''})`;
        } else {
          text = `${item.totalRequiredQty}${item.unitLabel ? ` ${item.unitLabel}` : ''} × ${item.componentName}`;
        }
        lines.push(`☐ ${text}`);
      });

      if (remainingManual.length > 0) {
        lines.push(`\n-- MANUAL REMAINING --`);
        remainingManual.forEach(m => lines.push(`☐ ${m.text}`));
      }
    } else {
      derivedFulfillmentItems.forEach(group => {
        if (group.completed) return;

        const remainingVariants = group.variants.filter(v => !v.completed);
        if (remainingVariants.length === 0) return;

        if (group.variants.length > 1 || (group.variants.length === 1 && (group.variants[0].colour || group.variants[0].size))) {
          const remGroupQty = remainingVariants.reduce((sum, v) => sum + v.qty, 0);
          let pluralName = group.displayName;
          lines.push(`${remGroupQty} × ${pluralName}`);
          remainingVariants.forEach(v => {
            lines.push(`    ${v.label}`);
          });
        } else {
          lines.push(group.text);
        }
      });

      manualFulfillmentList.filter(m => !m.completed).forEach(m => {
        lines.push(m.text);
      });
    }

    if (lines.length === 0) return;
    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedFulfillmentNotice("remaining");
    setTimeout(() => setCopiedFulfillmentNotice(null), 2500);
  };

  const handleUpdateFulfillmentStock = (itemId: string, newQty: number) => {
    const updatedInv = fulfillmentInventory.map(item =>
      item.id === itemId ? { ...item, availableQty: Math.max(0, newQty), lastUpdated: new Date().toISOString() } : item
    );
    const updatedSettings = { ...currentSettings, fulfillmentInventory: updatedInv };
    if (onUpdateSettings) {
      onUpdateSettings(updatedSettings);
    } else {
      saveSystemSettings(updatedSettings);
    }
  };

  const handleAddNewFulfillmentMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvItemName.trim()) return;
    const newItem: FulfillmentInventoryItem = {
      id: `fi_${Date.now()}`,
      itemName: newInvItemName.trim(),
      availableQty: 0,
      unitLabel: newInvUnitLabel.trim() || "units",
      category: "General Materials",
      lastUpdated: new Date().toISOString()
    };
    const updatedInv = [...fulfillmentInventory, newItem];
    const updatedSettings = { ...currentSettings, fulfillmentInventory: updatedInv };
    if (onUpdateSettings) {
      onUpdateSettings(updatedSettings);
    } else {
      saveSystemSettings(updatedSettings);
    }
    setNewInvItemName("");
  };

  const handleCopyFulfillmentShoppingList = () => {
    const lines: string[] = ["PURCHASE LIST\n"];

    consolidatedFulfillmentRequirements.forEach(item => {
      const qtyToBuy = item.purchaseQty !== undefined ? item.purchaseQty : item.remainingReqQty;
      if (qtyToBuy > 0) {
        let name = item.componentName;
        if (qtyToBuy > 1 && name.endsWith("T-Shirt")) {
          name = name + "s";
        }
        const unit = (item.bulkUnitLabel || item.unitLabel || "").trim();
        const isStandardUnit = !unit || unit === "units" || unit === "pcs" || unit === "pc" || unit === "prints" || unit === "blocks" || unit === "boxes" || unit === "photos" || unit === "chocolates" || name.toLowerCase().includes(unit.toLowerCase());

        if (isStandardUnit) {
          lines.push(`☐ ${qtyToBuy} ${name}`);
        } else {
          lines.push(`☐ ${qtyToBuy} ${unit} ${name}`);
        }
      }
    });

    manualFulfillmentList.filter(m => !m.completed).forEach(m => {
      const cleanText = m.text.replace(/^[☐☑•\-\*]\s*/, "");
      lines.push(`☐ ${cleanText}`);
    });

    if (lines.length === 1) {
      lines.push("(All required fulfillment materials are fully covered by available on-hand stock!)");
    }

    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedFulfillmentNotice("shopping");
    setTimeout(() => setCopiedFulfillmentNotice(null), 2500);
  };

  const handlePrintShoppingList = () => {
    const itemsList: string[] = [];
    consolidatedFulfillmentRequirements.forEach(item => {
      const qtyToBuy = item.purchaseQty !== undefined ? item.purchaseQty : item.remainingReqQty;
      if (qtyToBuy > 0) {
        let name = item.componentName;
        if (qtyToBuy > 1 && name.endsWith("T-Shirt")) {
          name = name + "s";
        }
        const unit = (item.bulkUnitLabel || item.unitLabel || "").trim();
        const isStandardUnit = !unit || unit === "units" || unit === "pcs" || unit === "pc" || unit === "prints" || unit === "blocks" || unit === "boxes" || unit === "photos" || unit === "chocolates" || name.toLowerCase().includes(unit.toLowerCase());
        const displayLabel = isStandardUnit ? `${qtyToBuy} ${name}` : `${qtyToBuy} ${unit} ${name}`;
        itemsList.push(`<li><span class="box">☐</span> <strong>${displayLabel}</strong></li>`);
      }
    });
    manualFulfillmentList.filter(m => !m.completed).forEach(m => {
      const cleanText = m.text.replace(/^[☐☑•\-\*]\s*/, "");
      itemsList.push(`<li><span class="box">☐</span> ${cleanText}</li>`);
    });

    const printWin = window.open("", "_blank", "width=600,height=700");
    if (printWin) {
      printWin.document.write(`
        <html>
          <head>
            <title>PURCHASE LIST - CEO Lifestyle Fulfillment Center</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 28px; color: #0f172a; }
              h2 { font-size: 20px; font-weight: 900; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 8px; }
              p.sub { font-size: 11px; color: #64748b; margin-top: 4px; margin-bottom: 20px; }
              ul { list-style: none; padding-left: 0; font-size: 15px; line-height: 2; margin: 0; }
              li { margin-bottom: 8px; font-size: 16px; display: flex; align-items: center; gap: 10px; }
              .box { font-size: 18px; color: #64748b; }
              .footer { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #94a3b8; }
            </style>
          </head>
          <body>
            <h2>PURCHASE LIST</h2>
            <p class="sub">CEO Lifestyle Fulfillment Center • Generated ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} • ${activeNewOrders.length} Active Orders</p>
            <ul>
              ${itemsList.length > 0 ? itemsList.join("\n") : "<li>All required fulfillment materials are fully covered by available on-hand stock!</li>"}
            </ul>
            <div class="footer">Confidential Internal Purchasing Slip • CEO Lifestyle Back-Office Operations</div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWin.document.close();
    }
  };

  // Unique staff list for filtering
  const staffList = useMemo(() => {
    const list = new Set<string>();
    orders.forEach(o => {
      if (o.assignedStaff && o.assignedStaff.trim()) list.add(o.assignedStaff.trim());
    });
    return Array.from(list);
  }, [orders]);

  // Today's date ISO format
  const todayIso = new Date().toISOString().split("T")[0];

  // Helper for status badge styling
  const getStatusBadgeStyle = (status: ProductionStatus | string) => {
    switch (status) {
      case "New":
        return "bg-sky-100 text-sky-900 border-sky-300 font-bold";
      case "Confirmed":
        return "bg-indigo-100 text-indigo-900 border-indigo-300 font-bold";
      case "In Progress":
      case "In Production":
        return "bg-amber-100 text-amber-950 border-amber-300 font-extrabold";
      case "Ready":
      case "Ready for Production":
      case "Quality Check":
        return "bg-emerald-100 text-emerald-950 border-emerald-300 font-extrabold";
      case "Out for Delivery":
      case "Ready for Delivery":
        return "bg-cyan-100 text-cyan-950 border-cyan-300 font-extrabold";
      case "Ready for Collection":
      case "Ready for Pickup":
        return "bg-purple-100 text-purple-950 border-purple-300 font-extrabold";
      case "Completed":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "Cancelled":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Helper for priority badge styling
  const getPriorityBadgeStyle = (priority: OrderPriority) => {
    switch (priority) {
      case "Urgent":
        return "bg-purple-100 text-purple-900 border-purple-300 font-black uppercase text-[9px] tracking-wider animate-pulse";
      case "High":
        return "bg-rose-100 text-rose-900 border-rose-200 font-extrabold uppercase text-[9px] tracking-wider";
      case "Normal":
        return "bg-slate-100 text-slate-700 border-slate-200 font-semibold text-[9px]";
      case "Low":
        return "bg-slate-50 text-slate-500 border-slate-200 font-medium text-[9px]";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Helper for rendering client apparel fitting info badge on task cards
  const renderClientApparelBadge = (clientId?: string, clientName?: string) => {
    if (!clientId && !clientName) return null;
    const match = clients.find(c => 
      (clientId && c.id === clientId) || 
      (clientName && `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase() === clientName.trim().toLowerCase())
    );
    if (!match || !match.apparelInfo) return null;

    const { tShirtSize, poloSize, hoodieSize, jerseySize, hatSize, shoeSize, jacketSize, dressSize } = match.apparelInfo;
    const sizes: string[] = [];
    if (tShirtSize) sizes.push(`Shirt: ${tShirtSize}`);
    if (poloSize) sizes.push(`Polo: ${poloSize}`);
    if (hoodieSize) sizes.push(`Hoodie: ${hoodieSize}`);
    if (jerseySize) sizes.push(`Jersey: ${jerseySize}`);
    if (jacketSize) sizes.push(`Jacket: ${jacketSize}`);
    if (hatSize) sizes.push(`Hat: ${hatSize}`);
    if (shoeSize) sizes.push(`Shoe: ${shoeSize}`);
    if (dressSize) sizes.push(`Dress: ${dressSize}`);

    if (sizes.length === 0) return null;

    return (
      <div className="flex items-center gap-1 bg-indigo-50/90 border border-indigo-200/80 px-2 py-0.5 rounded-md text-[10px] font-extrabold text-indigo-900 mt-1">
        <Shirt className="w-3 h-3 text-indigo-600 shrink-0" />
        <span className="truncate">{sizes.join(" • ")}</span>
      </div>
    );
  };

  // Helper for due date urgency indicator
  const getDueDateTag = (dueDateStr: string, status: ProductionStatus) => {
    if (status === "Completed" || status === "Cancelled") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
          <Calendar className="w-3 h-3 text-slate-400" />
          {dueDateStr}
        </span>
      );
    }

    if (!dueDateStr) return null;

    const diffDays = getDaysSince(dueDateStr); // positive if past due date

    if (diffDays > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-50 text-rose-800 border border-rose-200/80 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          Overdue ({diffDays} {diffDays === 1 ? "day" : "days"})
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
          <Clock className="w-3 h-3 text-amber-600" />
          DUE TODAY
        </span>
      );
    } else {
      const daysLeft = Math.abs(diffDays);
      if (daysLeft <= 3) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Clock className="w-3 h-3 text-emerald-600" />
            Due in {daysLeft} {daysLeft === 1 ? "day" : "days"}
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
          <Calendar className="w-3 h-3 text-slate-400" />
          Due {dueDateStr}
        </span>
      );
    }
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const active = orders.filter(o => o.productionStatus !== "Completed" && o.productionStatus !== "Cancelled");
    const newCount = orders.filter(o => o.productionStatus === "New").length;
    
    let dueTodayCount = 0;
    let overdueCount = 0;
    let readyPickupCount = 0;
    let readyDeliveryCount = 0;
    let expressCount = 0;

    active.forEach(o => {
      if (o.dueDate) {
        const diffDays = getDaysSince(o.dueDate);
        if (diffDays === 0) dueTodayCount++;
        else if (diffDays > 0) overdueCount++;
      }
      if (o.productionStatus === "Ready for Collection" || o.productionStatus === "Ready for Pickup" || o.productionStatus === "Ready") readyPickupCount++;
      if (o.productionStatus === "Out for Delivery" || o.productionStatus === "Ready for Delivery") readyDeliveryCount++;
      if (o.expressOrder === "Yes") expressCount++;
    });

    const invoiceNotLoggedCount = orders.filter(o => o.productionStatus !== "Cancelled" && !o.invoiceLogged).length;
    const invoiceLoggedCount = orders.filter(o => o.productionStatus !== "Cancelled" && !!o.invoiceLogged).length;

    return {
      activeCount: active.length,
      newCount,
      dueTodayCount,
      overdueCount,
      readyPickupCount,
      readyDeliveryCount,
      expressCount,
      invoiceNotLoggedCount,
      invoiceLoggedCount,
      completedCount: orders.filter(o => o.productionStatus === "Completed").length
    };
  }, [orders]);

  // Filtered Orders List based on view & search & filter dropdowns
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Board View Filter
      if (boardView === "active") {
        if (order.productionStatus === "Completed" || order.productionStatus === "Cancelled") return false;
      } else if (boardView === "new") {
        if (order.productionStatus !== "New") return false;
      } else if (boardView === "today") {
        if (order.productionStatus === "Completed" || order.productionStatus === "Cancelled") return false;
        if (order.dueDate !== todayIso) return false;
      } else if (boardView === "week") {
        if (order.productionStatus === "Completed" || order.productionStatus === "Cancelled") return false;
        if (!order.dueDate) return false;
        const diffDays = getDaysSince(order.dueDate);
        if (diffDays > 0 || diffDays < -7) return false; // within next 7 days or past due
      } else if (boardView === "overdue") {
        if (order.productionStatus === "Completed" || order.productionStatus === "Cancelled") return false;
        if (!order.dueDate) return false;
        if (getDaysSince(order.dueDate) <= 0) return false;
      } else if (boardView === "completed") {
        if (order.productionStatus !== "Completed" && order.productionStatus !== "Cancelled") return false;
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const itemsText = typeof order.items === "string" 
          ? (order.items || "").toLowerCase()
          : (order.items || []).map(i => i?.productName || "").join(" ").toLowerCase();
        
        const matches = 
          (order.orderNumber || "").toLowerCase().includes(q) ||
          (order.clientName || "").toLowerCase().includes(q) ||
          (order.clientPhone && order.clientPhone.includes(q)) ||
          itemsText.includes(q) ||
          (order.deliveryLocation && (order.deliveryLocation || "").toLowerCase().includes(q)) ||
          (order.internalNotes && (order.internalNotes || "").toLowerCase().includes(q)) ||
          (order.assignedStaff && (order.assignedStaff || "").toLowerCase().includes(q)) ||
          (order.expressNote && (order.expressNote || "").toLowerCase().includes(q)) ||
          (order.expressOrder === "Yes" && "express".includes(q));

        if (!matches) return false;
      }

      // 3. Dropdown & Custom Filters
      if (filterCompany !== "All" && getOperationalCompany(order) !== filterCompany) return false;
      if (filterInvoice === "Not Logged" && order.invoiceLogged) return false;
      if (filterInvoice === "Logged" && !order.invoiceLogged) return false;
      if (filterStatus !== "All" && order.productionStatus !== filterStatus) return false;
      if (filterTier !== "All" && order.clientTier !== filterTier) return false;
      if (filterDelivery !== "All" && order.deliveryMethod !== filterDelivery) return false;
      if (filterPriority !== "All" && order.priority !== filterPriority) return false;
      if (filterStaff !== "All" && order.assignedStaff !== filterStaff) return false;
      if (filterExpress === "Express Only" && order.expressOrder !== "Yes") return false;
      if (filterExpress === "Normal Only" && order.expressOrder === "Yes") return false;

      return true;
    });
  }, [
    orders, 
    boardView, 
    searchQuery, 
    filterCompany,
    filterInvoice,
    filterStatus, 
    filterTier, 
    filterDelivery, 
    filterPriority, 
    filterStaff, 
    filterExpress,
    todayIso
  ]);

  // Open modal to create new order
  const handleOpenCreateModal = () => {
    const nextNum = getNextOrderNumber(orders);
    setEditingOrder(null);
    setFormOrderNumber(nextNum);
    setFormClientId("");
    setFormClientName("");
    setFormClientTier("");
    setFormClientPhone("");
    setIsClientSearchOpen(false);
    setFormItems([
      { id: "item-1", productName: "", quantity: 1, itemCost: 0, details: "" }
    ]);
    setFormDateCreated(todayIso);
    setFormDueDate(todayIso);
    setFormProductionStatus("New");
    setFormDeliveryMethod("Store Pickup");
    setFormDeliveryLocation("Fresh Drip Outlet");
    setFormAssignedStaff("");
    setFormPriority("Normal");
    setFormInternalNotes("");
    setFormDepositPaid(true);
    setFormDepositAmount(0);
    setFormInvoiceLogged(false);
    setFormCompany("CEO Lifestyle");
    setFormClientHome("CEO Lifestyle");
    setFormExpressOrder("No");
    setFormExpressNote("");

    // Default: No checklist attached on new task by default
    setHasFormChecklist(false);
    setFormChecklistTemplateName("");
    setFormChecklist([]);
    setNewCustomChecklistItemText("");

    setIsFormOpen(true);
  };

  // Open modal to edit existing order
  const handleOpenEditModal = (order: OperationsOrder) => {
    setEditingOrder(order);
    setFormOrderNumber(order.orderNumber);
    setFormClientId(order.clientId || "");
    setFormClientName(order.clientName);
    setFormClientTier(order.clientTier || "");
    setFormClientPhone(order.clientPhone || "");
    setIsClientSearchOpen(false);

    if (Array.isArray(order.items) && order.items.length > 0) {
      setFormItems(
        order.items.map((it, idx) => ({
          id: it.id || `item-${idx + 1}`,
          productName: it.productName || "",
          quantity: it.quantity || 1,
          itemCost: it.unitPrice ?? (it as any).itemCost ?? 0,
          details: it.details || ""
        }))
      );
    } else if (typeof order.items === "string" && order.items.trim()) {
      setFormItems([
        {
          id: "item-1",
          productName: order.items,
          quantity: order.quantityTotal || 1,
          itemCost: order.totalAmount || 0,
          details: ""
        }
      ]);
    } else {
      setFormItems([
        { id: "item-1", productName: "", quantity: 1, itemCost: 0, details: "" }
      ]);
    }

    setFormDateCreated(order.dateOrderCreated || order.createdDate || order.orderDate || todayIso);
    setFormDueDate(order.dueDate || todayIso);
    setFormProductionStatus(order.productionStatus);
    setFormDeliveryMethod(order.deliveryMethod);
    setFormDeliveryLocation(order.deliveryLocation || "Fresh Drip Outlet");
    setFormAssignedStaff(order.assignedStaff || "");
    setFormPriority(order.priority || "Normal");
    setFormInternalNotes(order.internalNotes || "");
    setFormDepositPaid(order.depositPaid !== false);
    setFormDepositAmount(typeof order.depositAmount === "number" ? order.depositAmount : (order.depositPaid ? (order.totalAmount || 0) : 0));
    setFormInvoiceLogged(order.invoiceLogged || false);
    const comp = getOperationalCompany(order);
    setFormCompany(comp);
    setFormClientHome(order.clientHome || (comp === "Librarium Luxe" ? "Librarium Luxe" : "CEO Lifestyle"));
    setFormExpressOrder(order.expressOrder || "No");
    setFormExpressNote(order.expressNote || "");

    if (order.checklist && order.checklist.length > 0) {
      setHasFormChecklist(true);
      setFormChecklistTemplateName(order.checklistTemplateName || "");
      setFormChecklist([...order.checklist]);
    } else {
      setHasFormChecklist(false);
      setFormChecklistTemplateName("");
      setFormChecklist([]);
    }
    setNewCustomChecklistItemText("");

    setIsFormOpen(true);
  };

  // Apply a selected Checklist Template to the active form
  const handleSelectChecklistTemplateInForm = (templateName: string) => {
    setHasFormChecklist(true);
    setFormChecklistTemplateName(templateName);
    if (!templateName) {
      return; // Keep existing items
    }
    const found = checklistTemplatesList.find(t => t.name === templateName);
    if (found) {
      setFormChecklist(found.items.map(it => ({ ...it, completed: false })));
    }
  };

  // Add custom checklist item in form
  const handleAddCustomChecklistItem = () => {
    if (!newCustomChecklistItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      label: newCustomChecklistItemText.trim(),
      completed: false
    };
    setFormChecklist(prev => [...prev, newItem]);
    setNewCustomChecklistItemText("");
  };

  // Toggle checklist item in form
  const handleToggleFormChecklistItem = (itemId: string) => {
    setFormChecklist(prev => prev.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item));
  };

  // Delete checklist item in form
  const handleDeleteFormChecklistItem = (itemId: string) => {
    setFormChecklist(prev => prev.filter(item => item.id !== itemId));
  };

  // Move checklist item up or down
  const handleMoveFormChecklistItem = (index: number, direction: -1 | 1) => {
    setFormChecklist(prev => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const newArr = [...prev];
      const temp = newArr[index];
      newArr[index] = newArr[targetIndex];
      newArr[targetIndex] = temp;
      return newArr;
    });
  };

  // Update label of checklist item
  const handleUpdateFormChecklistItemLabel = (itemId: string, newLabel: string) => {
    setFormChecklist(prev => prev.map(item => item.id === itemId ? { ...item, label: newLabel } : item));
  };

  // Toggle checklist item directly on card
  const handleToggleCardChecklistItem = (order: OperationsOrder, itemId: string) => {
    if (!order.checklist) return;
    const updatedChecklist = order.checklist.map(it => 
      it.id === itemId ? { ...it, completed: !it.completed } : it
    );
    const updatedOrder: OperationsOrder = {
      ...order,
      checklist: updatedChecklist,
      updatedDate: todayIso
    };
    onSaveOrder(updatedOrder);
  };

  // Save / Update Custom Templates to System Settings
  const handleSaveChecklistTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const items = newTemplateItemsText
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean)
      .map((label, idx) => ({
        id: `tpl_item_${Date.now()}_${idx}`,
        label,
        completed: false
      }));

    if (items.length === 0) {
      alert("Please enter at least one checklist item label.");
      return;
    }

    let updatedList: ProductionChecklistTemplate[];
    if (editingTemplate) {
      updatedList = checklistTemplatesList.map(t => t.id === editingTemplate.id ? {
        ...editingTemplate,
        name: newTemplateName.trim(),
        category: newTemplateCategory.trim(),
        description: newTemplateDescription.trim(),
        items
      } : t);
    } else {
      const newTpl: ProductionChecklistTemplate = {
        id: `tpl_chk_${Date.now()}`,
        name: newTemplateName.trim(),
        category: newTemplateCategory.trim(),
        description: newTemplateDescription.trim(),
        items
      };
      updatedList = [...checklistTemplatesList, newTpl];
    }

    setChecklistTemplatesList(updatedList);
    const currentSettings = getSystemSettings();
    saveSystemSettings({
      ...currentSettings,
      checklistTemplates: updatedList
    });

    setEditingTemplate(null);
    setNewTemplateName("");
    setNewTemplateDescription("");
    setNewTemplateItemsText("");
  };

  const handleDeleteChecklistTemplate = (templateId: string) => {
    if (!confirm("Are you sure you want to delete this checklist template?")) return;
    const updatedList = checklistTemplatesList.filter(t => t.id !== templateId);
    setChecklistTemplatesList(updatedList);
    const currentSettings = getSystemSettings();
    saveSystemSettings({
      ...currentSettings,
      checklistTemplates: updatedList
    });
  };

  // Auto populate client details when selecting client dropdown in form
  const handleSelectClientInForm = (cId: string) => {
    setFormClientId(cId);
    const selected = clients.find(c => c.id === cId);
    if (selected) {
      setFormClientName(`${selected.firstName} ${selected.lastName}`);
      setFormClientTier(selected.tier || "Silver");
      setFormClientPhone(selected.contact?.phoneNumber || "");
      const home = selected.clientHome || (selected as any).homeBrand || "CEO Lifestyle";
      setFormClientHome(home);
      if (home === "Librarium Luxe") {
        setFormCompany("Librarium Luxe");
      } else {
        setFormCompany("CEO Lifestyle");
      }
    }
  };

  // Submit Order Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientName.trim()) {
      alert("Please enter or select a client name.");
      return;
    }
    const validItems = formItems.filter(i => i.productName.trim().length > 0);
    if (validItems.length === 0) {
      alert("Please enter at least one product name.");
      return;
    }

    const savedItems: OperationsOrderItem[] = validItems.map(i => ({
      id: i.id,
      productName: i.productName.trim(),
      quantity: Number(i.quantity) || 1,
      unitPrice: Number(i.itemCost) || 0, // Cost of Order for line item
      details: i.details.trim(),
      size: i.size?.trim() || undefined,
      colour: i.colour?.trim() || undefined
    }));

    // Cost of Order represents the total cost for that line item (NOT multiplied by quantity)
    const totalAmt = savedItems.reduce((acc, i) => acc + (i.unitPrice || 0), 0);
    const qtyTotal = savedItems.reduce((acc, i) => acc + (i.quantity || 1), 0);

    const depositVal = typeof formDepositAmount === "number" ? Math.max(0, formDepositAmount) : 0;

    if (depositVal < 0) {
      alert("Deposit paid cannot be negative.");
      return;
    }

    if (depositVal > totalAmt && totalAmt > 0) {
      alert(`Deposit paid (J$${depositVal.toLocaleString()}) cannot exceed the total order cost (J$${totalAmt.toLocaleString()}).`);
      return;
    }

    const snapRequirements = editingOrder?.fulfillmentSnapshot && editingOrder.fulfillmentSnapshot.length > 0 
      ? editingOrder.fulfillmentSnapshot 
      : createOrderFulfillmentSnapshot(savedItems, fulfillmentTemplates, qtyTotal);

    const orderCreatedDateVal = formDateCreated || editingOrder?.dateOrderCreated || editingOrder?.createdDate || editingOrder?.orderDate || todayIso;

    // Terminal state guard: If existing order is Completed, prevent reopening through normal editing
    const effectiveProductionStatus: ProductionStatus = (editingOrder && editingOrder.productionStatus === "Completed")
      ? "Completed"
      : formProductionStatus;

    const savedOrder: OperationsOrder = {
      id: editingOrder ? editingOrder.id : `ORD-${Date.now()}`,
      orderNumber: editingOrder ? editingOrder.orderNumber : (formOrderNumber.trim() || getNextOrderNumber(orders)),
      clientId: formClientId || "MANUAL",
      clientName: formClientName.trim(),
      clientTier: (formClientTier || "Silver") as ClientTier,
      clientPhone: formClientPhone.trim(),
      items: savedItems,
      quantityTotal: qtyTotal,
      orderDate: orderCreatedDateVal,
      createdDate: orderCreatedDateVal,
      dateOrderCreated: orderCreatedDateVal,
      dueDate: formDueDate || todayIso,
      productionStatus: effectiveProductionStatus,
      deliveryMethod: formDeliveryMethod,
      deliveryLocation: formDeliveryLocation.trim() || "Fresh Drip Outlet",
      assignedStaff: formAssignedStaff.trim(),
      internalNotes: formInternalNotes.trim(),
      priority: formPriority,
      depositAmount: depositVal,
      depositPaid: depositVal > 0,
      totalAmount: totalAmt,
      checklistTemplateName: hasFormChecklist ? formChecklistTemplateName : "",
      checklist: hasFormChecklist ? formChecklist : [],
      company: formCompany,
      clientHome: formClientHome || (formCompany === "Librarium Luxe" ? "Librarium Luxe" : "CEO Lifestyle"),
      expressOrder: formExpressOrder,
      expressNote: formExpressNote.trim(),
      invoiceLogged: formInvoiceLogged,
      invoiceLoggedDate: formInvoiceLogged ? (editingOrder?.invoiceLoggedDate || todayIso) : undefined,
      updatedDate: todayIso,
      fulfillmentSnapshot: snapRequirements
    };

    // Enforce checklist completion requirement if status is set to Completed
    const effectiveChecklist = hasFormChecklist ? formChecklist : (editingOrder?.checklist || []);
    if (formProductionStatus === "Completed" && effectiveChecklist && effectiveChecklist.length > 0) {
      const hasIncomplete = effectiveChecklist.some(item => (item.required !== false) && !item.completed);
      if (hasIncomplete) {
        setPendingCompletionOrder({ order: editingOrder || savedOrder, isFormSave: true, savedOrderPayload: savedOrder });
        setShowChecklistIncompleteModal(true);
        return;
      }
    }

    onSaveOrder(savedOrder);
    setIsFormOpen(false);
  };

  // Quick toggle for Invoice Logged manual verification
  const handleToggleInvoiceLogged = (order: OperationsOrder, isChecked: boolean) => {
    const updatedOrder: OperationsOrder = {
      ...order,
      invoiceLogged: isChecked,
      invoiceLoggedDate: isChecked ? (order.invoiceLoggedDate || todayIso) : undefined,
      updatedDate: todayIso
    };
    onSaveOrder(updatedOrder);
  };

  // Quick Status update on card
  const handleQuickStatusUpdate = (order: OperationsOrder, newStatus: ProductionStatus) => {
    // Terminal state guard: Completed orders cannot transition back to active statuses
    if (order.productionStatus === "Completed" && newStatus !== "Completed") {
      return;
    }

    if (newStatus === "Completed" && order.checklist && order.checklist.length > 0) {
      const hasIncomplete = order.checklist.some(item => (item.required !== false) && !item.completed);
      if (hasIncomplete) {
        setPendingCompletionOrder({ order: { ...order, productionStatus: newStatus }, isFormSave: false });
        setShowChecklistIncompleteModal(true);
        return;
      }
    }
    const updated = {
      ...order,
      productionStatus: newStatus,
      updatedDate: todayIso
    };
    onSaveOrder(updated);
  };

  // Quick Copy Customer & Order Details for WhatsApp / SMS using Central Client Communication Library
  const handleCopyOrderDetails = (order: OperationsOrder) => {
    const isAdventist = order.adventist === "Yes" || clients.some(c => (c.id === order.clientId || `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase() === (order.clientName || '').trim().toLowerCase()) && c.adventist === "Yes");
    if (isAdventist && isAdventistCommunicationRestricted("Yes")) {
      setAdventistModalOrder(order);
      return;
    }

    const comp = getOperationalCompany(order);
    const isLuxe = comp === "Librarium Luxe";
    const clientObj = clients.find(c => c.id === order.clientId || `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase() === (order.clientName || '').trim().toLowerCase());

    const rawItems = Array.isArray(order.items) ? order.items : [];
    const firstItem = rawItems[0];
    const itemSummary = rawItems.length > 0
      ? rawItems.map(i => {
          const parts = [i.colour, i.size].filter(Boolean);
          const varStr = parts.length > 0 ? ` (${parts.join(" - ")})` : "";
          return `${i.quantity}x ${i.productName}${varStr}`;
        }).join(", ")
      : (typeof order.items === "string" ? order.items : "Custom Order");

    const totalVal = order.totalAmount || 0;
    const depositVal = typeof order.depositAmount === "number" ? order.depositAmount : (order.depositPaid ? totalVal : 0);
    const balanceDueVal = Math.max(0, totalVal - depositVal);

    const bookTitle = isLuxe 
      ? (firstItem ? firstItem.productName : (typeof order.items === "string" ? order.items : "Curated Selection"))
      : "";
    const booksList = isLuxe && rawItems.length > 0
      ? rawItems.map(i => {
          const cost = i.unitPrice ?? (i as any).itemCost;
          return `* ${i.quantity}x ${i.productName}${cost ? ` — JMD $${Number(cost).toLocaleString()}` : ''}`;
        }).join("\n")
      : (bookTitle ? `* ${order.quantityTotal || 1}x ${bookTitle}` : "");

    const garmentItems = !isLuxe && rawItems.length > 0
      ? rawItems.map(i => {
          const cost = i.unitPrice ?? (i as any).itemCost;
          const varDetails = [i.colour, i.size].filter(Boolean).join(" - ");
          return `* ${i.quantity}x ${i.productName}${varDetails ? ` (${varDetails})` : ''}${cost ? ` — JMD $${Number(cost).toLocaleString()}` : ''}`;
        }).join("\n")
      : (!isLuxe ? itemSummary : "");

    const firstCost = firstItem ? (firstItem.unitPrice ?? (firstItem as any).itemCost) : undefined;
    const firstColor = firstItem?.color || firstItem?.colour || (!isLuxe ? "Standard" : "");
    const firstSubColor = firstItem?.substituteColor || firstItem?.substituteColour || "None specified";
    const firstSize = firstItem?.size || (!isLuxe ? "Standard" : "");
    const firstCustomization = firstItem?.customization || firstItem?.notes || "None";
    const firstDescription = firstItem?.itemDescription || firstItem?.details || firstItem?.productName || itemSummary;
    const phoneContact = order.clientPhone || clientObj?.contact?.phoneNumber || "N/A";
    const orderTotalStr = totalVal > 0 ? `JMD $${totalVal.toLocaleString()}` : "$0";
    const depositStr = depositVal > 0 ? `JMD $${depositVal.toLocaleString()}` : (order.depositPaid ? orderTotalStr : "Pending");
    const balanceStr = balanceDueVal > 0 ? `JMD $${balanceDueVal.toLocaleString()}` : "Settled (JMD $0)";

    const orderDataMap: Record<string, any> = {
      CustomerName: order.clientName || clientObj?.firstName || "Valued Client",
      ClientName: order.clientName || clientObj?.firstName || "Valued Client",
      customer_name: order.clientName || clientObj?.firstName || "Valued Client",
      client_name: order.clientName || clientObj?.firstName || "Valued Client",
      Company: comp,
      BusinessName: comp,
      businessName: comp,
      company_name: comp,
      OrderNumber: order.orderNumber || order.id,
      order_number: order.orderNumber || order.id,
      DueDate: order.dueDate || "TBD",
      dueDate: order.dueDate || "TBD",
      TargetDueDate: order.dueDate || "TBD",
      target_due_date: order.dueDate || "TBD",
      OrderDate: order.dateOrderCreated || order.createdDate || order.orderDate || "",
      QuoteDate: order.dateOrderCreated || order.orderDate || "",
      DeliveryMethod: order.deliveryMethod || "Store Pickup",
      deliveryMethod: order.deliveryMethod || "Store Pickup",
      delivery_method: order.deliveryMethod || "Store Pickup",
      DeliveryLocation: order.deliveryLocation || "Office",
      delivery_location: order.deliveryLocation || "Office",
      Location: order.deliveryLocation || "Office",
      Destination: order.deliveryLocation || "Office",
      TargetDestination: order.deliveryLocation || "Office",
      PickupLocation: order.deliveryLocation || (isLuxe ? "Librarium Luxe Desk" : "Fresh Drip Outlet"),
      DeliveryInformation: `${order.deliveryMethod || "Store Pickup"} • Location: ${order.deliveryLocation || "Office / Desk"}`,
      DeliveryInfo: `${order.deliveryMethod || "Store Pickup"} (${order.deliveryLocation || "Office / Desk"})`,
      delivery_info: `${order.deliveryMethod || "Store Pickup"} (${order.deliveryLocation || "Office / Desk"})`,
      GrandTotal: orderTotalStr,
      OrderTotal: orderTotalStr,
      order_total: orderTotalStr,
      total_amount: orderTotalStr,
      TotalAmount: orderTotalStr,
      Subtotal: orderTotalStr,
      DepositAmount: depositStr,
      DepositPaid: depositStr,
      deposit_paid: depositStr,
      deposit_amount: depositStr,
      BalanceDue: balanceStr,
      balance_due: balanceStr,
      PaymentInformation: `Total: ${orderTotalStr} | Deposit: ${depositStr} | Balance Due: ${balanceStr}`,
      PaymentInfo: `Total: ${orderTotalStr} | Deposit: ${depositStr} | Balance Due: ${balanceStr}`,
      payment_info: `Total: ${orderTotalStr} | Deposit: ${depositStr} | Balance Due: ${balanceStr}`,
      ProductionStatus: order.productionStatus || "New",
      ClientTier: order.clientTier || clientObj?.tier || "Silver",
      Priority: order.priority || "Normal",
      AssignedStaff: order.assignedStaff || "Operations Team",
      InternalNotes: order.internalNotes || "",
      PhoneContact: phoneContact,
      phone_contact: phoneContact,
      Phone: phoneContact,
      phone: phoneContact,
      ClientPhone: phoneContact,
      ItemTitle: isLuxe ? bookTitle : itemSummary,
      Product: itemSummary || (isLuxe ? "Curated Edition" : "Bespoke Apparel"),
      product: itemSummary || (isLuxe ? "Curated Edition" : "Bespoke Apparel"),
      ItemDescription: firstDescription,
      item_description: firstDescription,
      Quantity: order.quantityTotal || 1,
      quantity: order.quantityTotal || 1,
      QuantityUnit: isLuxe ? "copies" : "units",
      Color: firstColor,
      color: firstColor,
      Colour: firstColor,
      colour: firstColor,
      SubstituteColor: firstSubColor,
      substitute_color: firstSubColor,
      SubstituteColour: firstSubColor,
      substitute_colour: firstSubColor,
      Size: firstSize,
      size: firstSize,
      Customization: firstCustomization,
      customization: firstCustomization,
      UnitPrice: firstCost ? `JMD $${Number(firstCost).toLocaleString()}` : "",
      BooksSubtotal: orderTotalStr,
      BookTitle: bookTitle || "Curated Edition",
      BookTitles: bookTitle || "Curated Edition",
      book_title: bookTitle || "Curated Edition",
      book_titles: bookTitle || "Curated Edition",
      BookPrice: firstCost ? `JMD $${Number(firstCost).toLocaleString()}` : orderTotalStr,
      book_price: firstCost ? `JMD $${Number(firstCost).toLocaleString()}` : orderTotalStr,
      BundleInfo: rawItems.length > 1 ? `${rawItems.length}-Volume Bespoke Literary Collection` : (firstItem?.details || "Single Curated Volume"),
      bundle_info: rawItems.length > 1 ? `${rawItems.length}-Volume Bespoke Literary Collection` : (firstItem?.details || "Single Curated Volume"),
      Availability: isLuxe ? "Reserved in Archival Vault / Literary Import" : "In Stock",
      availability: isLuxe ? "Reserved in Archival Vault / Literary Import" : "In Stock",
      BooksList: booksList,
      GarmentItems: garmentItems,
      StockStatus: isLuxe ? "Reserved in Archival Vault / Literary Import" : "In Stock",
      CustomerResponse: `Thank you for choosing ${comp}.`
    };

    // Retrieve active template from Client Communication Library:
    // 1. Company (CEO Lifestyle vs Librarium Luxe)
    // 2. Location (Operations Dashboard)
    // 3. Category (Order Details)
    const quoteTemplates = currentSettings?.quoteTemplates || [];
    const matchedTemplate = quoteTemplates.find(tpl => {
      if (!tpl.active) return false;
      const tplComp = tpl.company || tpl.businessHome || "CEO Lifestyle";
      const compMatch = tplComp === comp || tplComp === "Both" || tplComp === "All";
      const isOrderDetails = (tpl.category || "").toUpperCase().replace(/\s+/g, "_") === "ORDER_DETAILS" || (tpl.category || "").toUpperCase() === "ORDER DETAILS";
      const isOpsLocation = tpl.location === "Operations Dashboard" || (tpl.location && tpl.location.includes("Operations"));
      return compMatch && isOrderDetails && isOpsLocation;
    }) || quoteTemplates.find(tpl => {
      if (!tpl.active) return false;
      const tplComp = tpl.company || tpl.businessHome || "CEO Lifestyle";
      const compMatch = tplComp === comp || tplComp === "Both" || tplComp === "All";
      const isOrderDetails = (tpl.category || "").toUpperCase().replace(/\s+/g, "_") === "ORDER_DETAILS" || (tpl.category || "").toUpperCase() === "ORDER DETAILS";
      return compMatch && isOrderDetails;
    });

    let text = "";
    if (matchedTemplate && matchedTemplate.content) {
      text = formatQuoteTemplate(matchedTemplate.content, orderDataMap);
    } else if (isLuxe) {
      text = `*LIBRARIUM LUXE BOOK ACQUISITION UPDATE*
Order Reference: ${order.orderNumber}
Company: Librarium Luxe
Client: ${order.clientName} (${order.clientTier || "Silver"} Tier)
Phone: ${order.clientPhone || "N/A"}
Curated Volumes: ${itemSummary || "Curated Edition"}
Acquisition Total: JMD $${(order.totalAmount || 0).toLocaleString()}
${depositVal > 0 ? `Deposit Paid: JMD $${depositVal.toLocaleString()}` : "Deposit: Pending"}
${balanceDueVal > 0 ? `Balance Due: JMD $${balanceDueVal.toLocaleString()}` : "Balance: Settled"}
Fulfillment Status: ${order.productionStatus}
Invoice Logged: ${order.invoiceLogged ? "Yes (Verified)" : "No (Pending)"}
Target Availability Date: ${order.dueDate || "N/A"}
Delivery / Collection: ${order.deliveryMethod} (${order.deliveryLocation || "Librarium Luxe Desk"})
${order.expressOrder === "Yes" ? `Express Curatorial Rush: Yes (${order.expressNote || "Priority handling"})` : ""}
${order.internalNotes ? `Curatorial Notes: ${order.internalNotes}` : ""}`.trim();
    } else {
      text = `*CEO LIFESTYLE OPERATIONS ORDER UPDATE*
Order Number: ${order.orderNumber}
Company: CEO Lifestyle
Client: ${order.clientName} (${order.clientTier || "Silver"} Tier)
Phone: ${order.clientPhone || "N/A"}
Products: ${itemSummary || "Custom Order"}
Cost of Order: JMD $${(order.totalAmount || 0).toLocaleString()}
${depositVal > 0 ? `Deposit Paid: JMD $${depositVal.toLocaleString()}` : "Deposit: Pending"}
${balanceDueVal > 0 ? `Balance Due: JMD $${balanceDueVal.toLocaleString()}` : "Balance: Settled"}
Status: ${order.productionStatus}
Invoice Logged: ${order.invoiceLogged ? "Yes (Verified)" : "No (Pending)"}
Due Date: ${order.dueDate || "N/A"}
Delivery Method: ${order.deliveryMethod} (${order.deliveryLocation || "Fresh Drip Outlet"})
Express Order: ${order.expressOrder || "No"}${order.expressOrder === "Yes" && order.expressNote ? ` (${order.expressNote})` : ""}
${order.internalNotes ? `Notes: ${order.internalNotes}` : ""}`.trim();
    }

    navigator.clipboard.writeText(text);
    setCopiedOrderId(order.id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* Module Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-950 text-white rounded-xl">
              <ClipboardList className="w-5 h-5 text-emerald-400" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Operations Hub</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Real-time Active Orders & Production Workflow Command Center
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Layout Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setLayoutMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                layoutMode === "grid"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cards
            </button>
            <button
              onClick={() => setLayoutMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                layoutMode === "kanban"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban
            </button>
          </div>

          <button
            onClick={() => setIsTemplateManagerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200/80 transition-all cursor-pointer"
            title="Manage reusable production checklist templates"
          >
            <ListChecks className="w-3.5 h-3.5 text-indigo-600" />
            <span>Checklist Templates</span>
          </button>

          <button
            onClick={() => setIsPasteModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Clipboard className="w-4 h-4 text-emerald-200" />
            <span>Paste Orders</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>New Production Order</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div 
          onClick={() => setBoardView("active")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            boardView === "active"
              ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20"
              : "bg-white text-slate-800 border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400">Active Orders</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black">{metrics.activeCount}</span>
            <PackageCheck className={`w-5 h-5 ${boardView === "active" ? "text-emerald-400" : "text-slate-400"}`} />
          </div>
        </div>

        <div 
          onClick={() => setBoardView("today")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            boardView === "today"
              ? "bg-amber-900 text-white border-amber-900 shadow-md ring-2 ring-amber-500/20"
              : "bg-white text-slate-800 border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-500">Due Today</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-2xl font-black ${metrics.dueTodayCount > 0 ? "text-amber-600" : ""}`}>
              {metrics.dueTodayCount}
            </span>
            <Clock className={`w-5 h-5 ${boardView === "today" ? "text-amber-300" : "text-amber-500"}`} />
          </div>
        </div>

        <div 
          onClick={() => setBoardView("overdue")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            boardView === "overdue"
              ? "bg-rose-900 text-white border-rose-900 shadow-md ring-2 ring-rose-500/20"
              : "bg-white text-slate-800 border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block text-rose-500">Overdue</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-2xl font-black ${metrics.overdueCount > 0 ? "text-rose-600" : ""}`}>
              {metrics.overdueCount}
            </span>
            <AlertTriangle className={`w-5 h-5 ${boardView === "overdue" ? "text-rose-300" : "text-rose-500"}`} />
          </div>
        </div>

        <div 
          onClick={() => {
            setBoardView("active");
            setFilterStatus("Ready for Pickup");
          }}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-600">Ready for Pickup</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{metrics.readyPickupCount}</span>
            <Store className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        <div 
          onClick={() => {
            setBoardView("active");
            setFilterStatus("Ready for Delivery");
          }}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all cursor-pointer col-span-2 sm:col-span-1"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block text-teal-600">Ready for Delivery</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{metrics.readyDeliveryCount}</span>
            <Truck className="w-5 h-5 text-teal-500" />
          </div>
        </div>
      </div>

      {/* Board View Switcher & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-4 shadow-2xs">
        {/* Board View Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => { setBoardView("active"); setFilterStatus("All"); }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              boardView === "active" && filterStatus === "All"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Active ({metrics.activeCount})
          </button>

          <button
            onClick={() => { setBoardView("new"); setFilterStatus("All"); }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              boardView === "new" && filterStatus === "All"
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-blue-50 text-blue-800 hover:bg-blue-100"
            }`}
          >
            <span>New ({metrics.newCount})</span>
          </button>

          <button
            onClick={() => { setBoardView("today"); setFilterStatus("All"); }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              boardView === "today"
                ? "bg-amber-500 text-white shadow-2xs"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Due Today ({metrics.dueTodayCount})
          </button>

          <button
            onClick={() => { setBoardView("week"); setFilterStatus("All"); }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              boardView === "week"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Due This Week
          </button>

          <button
            onClick={() => { setBoardView("overdue"); setFilterStatus("All"); }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              boardView === "overdue"
                ? "bg-rose-600 text-white shadow-2xs"
                : "bg-rose-50 text-rose-800 hover:bg-rose-100"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Overdue ({metrics.overdueCount})
          </button>

          <button
            onClick={() => { setBoardView("completed"); setFilterStatus("All"); }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              boardView === "completed"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Completed Archives ({metrics.completedCount})
          </button>

          {/* Invoice Verification Fast Filter */}
          <button
            onClick={() => {
              if (filterInvoice === "Not Logged") {
                setFilterInvoice("All");
              } else {
                setFilterInvoice("Not Logged");
              }
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0 ${
              filterInvoice === "Not Logged"
                ? "bg-amber-600 text-white shadow-2xs ring-2 ring-amber-400/40"
                : metrics.invoiceNotLoggedCount > 0
                  ? "bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            title="Filter orders where invoice has not yet been verified / logged"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Invoice Not Logged ({metrics.invoiceNotLoggedCount})</span>
          </button>
        </div>

        {/* Search & Select Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-2 pt-2 border-t border-slate-100">
          {/* Search bar */}
          <div className="relative sm:col-span-2 md:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search order #, client, express note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800"
            />
          </div>

          {/* Company Filter (Operations Board business context) */}
          <div>
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value as any)}
              className={`w-full border rounded-xl p-2 text-xs font-bold focus:outline-none cursor-pointer ${
                filterCompany === "CEO Lifestyle"
                  ? "bg-slate-900 border-slate-800 text-white font-black"
                  : filterCompany === "Librarium Luxe"
                    ? "bg-emerald-900 border-emerald-800 text-amber-300 font-black"
                    : "bg-slate-50 border-slate-200 text-slate-700 font-medium"
              }`}
            >
              <option value="All">All Companies</option>
              <option value="CEO Lifestyle">CEO Lifestyle</option>
              <option value="Librarium Luxe">Librarium Luxe</option>
            </select>
          </div>

          {/* Invoice Status Filter */}
          <div>
            <select
              value={filterInvoice}
              onChange={(e) => setFilterInvoice(e.target.value as "All" | "Not Logged" | "Logged")}
              className={`w-full border rounded-xl p-2 text-xs font-bold focus:outline-none cursor-pointer ${
                filterInvoice === "Not Logged"
                  ? "bg-amber-100 border-amber-300 text-amber-950 font-black"
                  : filterInvoice === "Logged"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-black"
                    : "bg-slate-50 border-slate-200 text-slate-700 font-medium"
              }`}
            >
              <option value="All">All Invoices</option>
              <option value="Not Logged">Invoice Not Logged ({metrics.invoiceNotLoggedCount})</option>
              <option value="Logged">Invoice Logged ({metrics.invoiceLoggedCount})</option>
            </select>
          </div>

          {/* Express Order Filter */}
          <div>
            <select
              value={filterExpress}
              onChange={(e) => setFilterExpress(e.target.value)}
              className="w-full bg-amber-50 border border-amber-200 rounded-xl p-2 text-xs font-bold text-amber-900 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All">All Express</option>
              <option value="Express Only">⚡ Express Only ({metrics.expressCount})</option>
              <option value="Normal Only">Standard Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-800"
            >
              <option value="All">All Statuses</option>
              {PRODUCTION_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Client Tier Filter */}
          <div>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-800"
            >
              <option value="All">All Tiers</option>
              <option value="Platinum">Platinum</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
            </select>
          </div>

          {/* Delivery Method Filter */}
          <div>
            <select
              value={filterDelivery}
              onChange={(e) => setFilterDelivery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-800"
            >
              <option value="All">All Delivery</option>
              {DELIVERY_METHODS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-800"
            >
              <option value="All">All Priorities</option>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area: Grid / Cards vs Kanban */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Orders Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            There are currently no production orders matching your selected view or search criteria.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer mt-2"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            Create First Order
          </button>
        </div>
      ) : layoutMode === "grid" ? (
        /* CARDS GRID VIEW - OPTIMIZED COMPACT HEIGHT */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredOrders.map((order) => {
            return (
              <div 
                key={order.id}
                className="bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top Header */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-black text-slate-900">{order.orderNumber}</span>
                      
                      {/* COMPANY BADGE (Operations Board Business Context) */}
                      {getOperationalCompany(order) === "Librarium Luxe" ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-800 text-emerald-100 flex items-center gap-1 shadow-2xs shrink-0">
                          <BookOpen className="w-2.5 h-2.5 text-amber-300" />
                          Librarium Luxe
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-900 text-white flex items-center gap-1 shadow-2xs shrink-0">
                          <Building2 className="w-2.5 h-2.5 text-blue-400" />
                          CEO Lifestyle
                        </span>
                      )}

                      <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${getPriorityBadgeStyle(order.priority)}`}>
                        {order.priority}
                      </span>
                      {order.expressOrder === "Yes" && (
                        <span className="px-1.5 py-0.2 rounded border text-[9px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 border-amber-300 shadow-2xs flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5 fill-amber-950 text-amber-950" />
                          Express
                        </span>
                      )}
                    </div>

                    <div>
                      {getDueDateTag(order.dueDate, order.productionStatus)}
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="font-bold text-xs text-slate-900 break-words">{order.clientName}</span>
                        {order.clientTier && (
                          <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase shrink-0 ${
                            order.clientTier === "Platinum" ? "bg-slate-900 text-amber-300" :
                            order.clientTier === "Gold" ? "bg-amber-100 text-amber-900" :
                            order.clientTier === "Founders Family" ? "bg-purple-100 text-purple-900" :
                            "bg-slate-100 text-slate-700"
                          }`}>
                            {order.clientTier}
                          </span>
                        )}
                        {(order.adventist === "Yes" || clients.some(c => (c.id === order.clientId || `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase() === (order.clientName || '').trim().toLowerCase()) && c.adventist === "Yes")) && (
                          <span className="text-[10px] font-bold text-slate-700">
                            • Adventist ✝
                          </span>
                        )}
                      </div>
                      {order.clientPhone && (
                        <span className="text-[10px] text-slate-500 font-medium block break-words">
                          {order.clientPhone}
                        </span>
                      )}
                    </div>

                    {typeof order.totalAmount === "number" && order.totalAmount > 0 && (() => {
                      const dep = typeof order.depositAmount === "number" ? order.depositAmount : 0;
                      const bal = Math.max(0, order.totalAmount - dep);
                      return (
                        <div className="text-right shrink-0 bg-slate-50 border border-slate-200/70 px-2 py-1 rounded-xl">
                          <div className="text-xs font-black text-slate-900">
                            <span className="text-slate-400 font-bold uppercase text-[8px] mr-1">Total:</span>
                            J${order.totalAmount.toLocaleString()}
                          </div>
                          <div className="text-[9px] font-bold text-slate-600 flex items-center justify-end gap-1.5 mt-0.5">
                            <span className="text-slate-500 font-medium">Dep: J${dep.toLocaleString()}</span>
                            <span className={`font-black ${bal === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                              Bal: J${bal.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Products Ordered */}
                  <div className="bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100/80">
                    <div className="label-value-row text-[11px] font-bold text-slate-800">
                      <span className="label-value-label text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Product:</span>
                      <span className="label-value-val">{itemSummaryText(order.items)}</span>
                    </div>
                    {renderClientApparelBadge(order.clientId, order.clientName)}
                  </div>

                  {/* Express Note Callout */}
                  {order.expressOrder === "Yes" && (
                    <div className="bg-amber-400/15 border border-amber-300/80 px-2 py-1.5 rounded-lg flex items-start gap-1.5 text-[10px]">
                      <Zap className="w-3.5 h-3.5 text-amber-700 fill-amber-500 shrink-0 mt-0.5" />
                      <div className="label-value-row flex-1 text-[10px]">
                        <span className="label-value-label font-black text-amber-950 uppercase tracking-wider text-[8px] pt-0.5">
                          Express Note:
                        </span>
                        <span className="label-value-val font-bold text-amber-950 leading-tight">
                          {order.expressNote || "Express handling requested"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Delivery & Workflow Status */}
                  <div className="flex items-start justify-between gap-2 text-[10px] font-medium text-slate-600">
                    <div className="flex items-start gap-1 flex-1 min-w-0">
                      {order.deliveryMethod === "Knutsford Express" ? (
                        <Truck className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      ) : order.deliveryMethod === "Store Pickup" ? (
                        <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0 break-words">
                        <span className="font-bold text-slate-900">{order.deliveryMethod}</span>
                        {order.deliveryLocation && (
                          <span className="text-slate-500"> • {order.deliveryLocation}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Production Status Selector */}
                  <div>
                    <select
                      value={order.productionStatus}
                      disabled={order.productionStatus === "Completed"}
                      onChange={(e) => handleQuickStatusUpdate(order, e.target.value as ProductionStatus)}
                      className={`w-full py-1 px-2 rounded-lg text-[10px] font-extrabold border focus:outline-none transition-all ${order.productionStatus === "Completed" ? "cursor-not-allowed opacity-90" : "cursor-pointer"} ${getStatusBadgeStyle(order.productionStatus)}`}
                    >
                      {order.productionStatus === "Completed" ? (
                        <option value="Completed" className="bg-white text-slate-800 font-medium text-xs">
                          Completed (Terminal)
                        </option>
                      ) : (
                        PRODUCTION_STATUSES.map(status => (
                          <option key={status} value={status} className="bg-white text-slate-800 font-medium text-xs">
                            {status}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Manual Invoice Logged Verification */}
                  <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50/90 rounded-lg border border-slate-200/60">
                    <label 
                      className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-bold text-slate-800"
                      title="Manual verification: Check this box when you have verified the invoice has been created/logged"
                    >
                      <input
                        type="checkbox"
                        checked={!!order.invoiceLogged}
                        onChange={(e) => handleToggleInvoiceLogged(order, e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className={order.invoiceLogged ? "text-emerald-700 font-extrabold" : "text-slate-700 font-bold"}>
                        Invoice Logged
                      </span>
                    </label>
                    {order.invoiceLogged ? (
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                        Verified
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md">
                        Not Logged
                      </span>
                    )}
                  </div>

                  {/* Internal Notes / Staff */}
                  {order.internalNotes && (
                    <div className="bg-amber-50/60 border border-amber-100/60 px-2 py-1 rounded-md text-[10px] text-slate-600 italic">
                      <div className="label-value-row">
                        <span className="label-value-label text-[9px] font-extrabold text-amber-800/80 uppercase tracking-wider not-italic">Notes:</span>
                        <span className="label-value-val">"{order.internalNotes}"</span>
                      </div>
                    </div>
                  )}

                  {/* Production Checklist Widget */}
                  {order.checklist && order.checklist.length > 0 && (() => {
                    const completedCount = order.checklist.filter(i => i.completed).length;
                    const totalCount = order.checklist.length;
                    const percent = Math.round((completedCount / totalCount) * 100);
                    const isExpanded = expandedChecklistOrderIds[order.id];

                    return (
                      <div className="bg-slate-50/80 border border-slate-200/60 rounded-lg p-1.5 space-y-1">
                        <div 
                          onClick={() => setExpandedChecklistOrderIds(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                          className="flex items-center justify-between cursor-pointer text-[10px] font-extrabold text-slate-800 select-none"
                        >
                          <span className="flex items-center gap-1 text-[10px] text-slate-700 font-bold">
                            <ListChecks className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{order.checklistTemplateName || "Checklist"}: {completedCount}/{totalCount} ({percent}%)</span>
                          </span>
                          <ChevronRight className={`w-3 h-3 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${percent === 100 ? "bg-emerald-500" : "bg-indigo-600"}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        {/* Expandable Checklist Items */}
                        {isExpanded && (
                          <div className="space-y-1 pt-1 border-t border-slate-200/60 animate-fade-in">
                            {order.checklist.map((item) => (
                              <label 
                                key={item.id} 
                                className="flex items-start gap-1.5 text-[10px] font-medium text-slate-700 cursor-pointer hover:bg-white p-0.5 rounded transition-colors"
                              >
                                <input 
                                  type="checkbox"
                                  checked={item.completed}
                                  onChange={() => handleToggleCardChecklistItem(order, item.id)}
                                  className="mt-0.5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                />
                                <span className={`text-[10px] leading-tight ${item.completed ? "line-through text-slate-400" : "font-bold text-slate-800"}`}>
                                  {item.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Card Quick Actions Bar */}
                <div className="bg-slate-50/80 px-3 py-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-600">
                  <div className="flex items-center gap-1">
                    {/* Copy Details */}
                    <button
                      onClick={() => handleCopyOrderDetails(order)}
                      className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-600 transition-colors cursor-pointer"
                      title="Copy Customer & Order details for messaging"
                    >
                      {copiedOrderId === order.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Business Communication Templates Modal */}
                    <button
                      onClick={() => {
                        const isAdventist = order.adventist === "Yes" || clients.some(c => (c.id === order.clientId || `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase() === (order.clientName || '').trim().toLowerCase()) && c.adventist === "Yes");
                        if (isAdventist && isAdventistCommunicationRestricted("Yes")) {
                          setAdventistModalOrder(order);
                          return;
                        }
                        setCommunicationModalOrder(order);
                      }}
                      className={`px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-extrabold text-[10px] ${
                        getOperationalCompany(order) === "Librarium Luxe"
                          ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60"
                      }`}
                      title={`Open ${getOperationalCompany(order)} message & communication templates`}
                    >
                      <MessageSquareQuote className="w-3.5 h-3.5" />
                      <span>Templates</span>
                    </button>

                    {/* Print Job Sheet */}
                    <button
                      onClick={() => setPrintableJobSheetOrder(order)}
                      className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-600 transition-colors cursor-pointer"
                      title="Print Production Job Sheet"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-700" />
                    </button>

                    {/* Edit Order */}
                    <button
                      onClick={() => handleOpenEditModal(order)}
                      className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-600 transition-colors cursor-pointer"
                      title="Edit Order Details"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-700" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete Order ${order.orderNumber}?`)) {
                          onDeleteOrder(order.id);
                        }
                      }}
                      className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-600 transition-colors cursor-pointer"
                      title="Delete Order"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Mark Completed Shortcut */}
                  {order.productionStatus !== "Completed" && (
                    <button
                      onClick={() => handleQuickStatusUpdate(order, "Completed")}
                      className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Complete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {PRODUCTION_STATUSES.filter(st => st !== "Cancelled").map((status) => {
            const statusOrders = filteredOrders.filter(o => o.productionStatus === status);

            return (
              <div 
                key={status}
                className="w-72 flex-shrink-0 bg-slate-100/70 p-3 rounded-2xl border border-slate-200/80 space-y-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    {status}
                  </span>
                  <span className="bg-slate-200 text-slate-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {statusOrders.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {statusOrders.length === 0 ? (
                    <div className="p-4 bg-white/60 rounded-xl border border-dashed border-slate-200 text-center text-[10px] text-slate-400 font-medium">
                      No orders in this stage
                    </div>
                  ) : (
                    statusOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-left"
                      >
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-black text-slate-900">{order.orderNumber}</span>
                            {getOperationalCompany(order) === "Librarium Luxe" ? (
                              <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-800 text-emerald-100 flex items-center gap-0.5 shadow-2xs">
                                <BookOpen className="w-2 h-2 text-amber-300" />
                                Luxe
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase tracking-wider bg-slate-900 text-white flex items-center gap-0.5 shadow-2xs">
                                <Building2 className="w-2 h-2 text-blue-400" />
                                CEO
                              </span>
                            )}
                            {order.expressOrder === "Yes" && (
                              <span className="px-1 py-0.2 rounded border text-[8px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 border-amber-300 shadow-2xs flex items-center gap-0.5">
                                <Zap className="w-2.5 h-2.5 fill-amber-950 text-amber-950" />
                                Express
                              </span>
                            )}
                          </div>
                          <span className={`px-1.5 py-0.2 rounded border text-[8px] ${getPriorityBadgeStyle(order.priority)}`}>
                            {order.priority}
                          </span>
                        </div>

                        <div>
                          <span className="font-bold text-xs text-slate-900 block">{order.clientName}</span>
                          <div className="label-value-row text-[11px] font-medium text-slate-600 mt-0.5">
                            <span className="label-value-label text-[9px] font-bold text-slate-400 uppercase tracking-wider">Product:</span>
                            <span className="label-value-val">{itemSummaryText(order.items)}</span>
                          </div>
                          {renderClientApparelBadge(order.clientId, order.clientName)}
                        </div>

                        {order.expressOrder === "Yes" && (
                          <div className="bg-amber-400/15 border border-amber-300/80 px-2 py-1 rounded-md flex items-start gap-1 text-[10px]">
                            <Zap className="w-3 h-3 text-amber-700 fill-amber-500 shrink-0 mt-0.5" />
                            <div className="label-value-row flex-1">
                              <span className="label-value-label font-extrabold text-amber-950 uppercase text-[8px] pt-0.5">
                                Express:
                              </span>
                              <span className="label-value-val font-bold text-amber-950 leading-tight">
                                {order.expressNote || "Priority handling"}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Kanban Checklist Status */}
                        {order.checklist && order.checklist.length > 0 && (() => {
                          const completedCount = order.checklist.filter(i => i.completed).length;
                          const totalCount = order.checklist.length;
                          const percent = Math.round((completedCount / totalCount) * 100);
                          return (
                            <div className="bg-slate-50 border border-slate-100 p-1.5 rounded-lg space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-700">
                                <span className="flex items-center gap-1">
                                  <ListChecks className="w-3 h-3 text-emerald-600" />
                                  <span>Checklist</span>
                                </span>
                                <span>{completedCount}/{totalCount} ({percent}%)</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${percent === 100 ? "bg-emerald-500" : "bg-indigo-600"}`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Kanban Invoice Logged Checkbox */}
                        <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 text-[10px]">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800 select-none">
                            <input
                              type="checkbox"
                              checked={!!order.invoiceLogged}
                              onChange={(e) => handleToggleInvoiceLogged(order, e.target.checked)}
                              className="w-3 h-3 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className={order.invoiceLogged ? "text-emerald-700 font-extrabold" : "text-slate-600"}>
                              Invoice Logged
                            </span>
                          </label>
                          {order.invoiceLogged ? (
                            <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                              Yes
                            </span>
                          ) : (
                            <span className="text-[8px] font-bold text-amber-700 bg-amber-50 px-1 rounded border border-amber-200">
                              Pending
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>Due: {order.dueDate}</span>
                          <div className="flex items-center gap-1">
                            {/* Copy Summary */}
                            <button
                              onClick={() => handleCopyOrderDetails(order)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                              title="Quick Copy Order Summary"
                            >
                              {copiedOrderId === order.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>

                            {/* Templates Modal Button */}
                            <button
                              onClick={() => {
                                const isAdventist = order.adventist === "Yes" || clients.some(c => (c.id === order.clientId || `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase() === (order.clientName || '').trim().toLowerCase()) && c.adventist === "Yes");
                                if (isAdventist && isAdventistCommunicationRestricted("Yes")) {
                                  setAdventistModalOrder(order);
                                  return;
                                }
                                setCommunicationModalOrder(order);
                              }}
                              className={`p-1 rounded flex items-center gap-0.5 font-bold ${
                                getOperationalCompany(order) === "Librarium Luxe"
                                  ? "text-emerald-800 hover:bg-emerald-100 bg-emerald-50"
                                  : "text-blue-700 hover:bg-blue-100 bg-blue-50"
                              }`}
                              title={`Open ${getOperationalCompany(order)} message templates`}
                            >
                              <MessageSquareQuote className="w-3 h-3" />
                              <span className="text-[9px]">Templates</span>
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(order)}
                              className="text-slate-800 font-bold hover:underline"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULFILLMENT CHECKLIST (BULK ITEMS TO GET / PURCHASING CHECKLIST) */}
      <div className="mt-8 bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 text-left">
        {/* Header & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <span className="p-2.5 bg-gradient-to-b from-slate-900 to-slate-950 text-emerald-400 rounded-2xl shadow-xs shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900">Fulfillment Checklist</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                  Items to Get
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  Live Derived ({activeNewOrders.length} New Orders)
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Automatically aggregates required preparation/purchasing items for orders currently in <strong className="font-extrabold text-slate-700">NEW</strong> status. Items automatically disappear when an order moves out of New status.
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsFulfillmentInventoryOpen(!isFulfillmentInventoryOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                isFulfillmentInventoryOpen
                  ? "bg-purple-600 text-white border-purple-700 shadow-2xs"
                  : "bg-purple-50 text-purple-900 hover:bg-purple-100 border-purple-200"
              }`}
              title="View and manage available on-hand fulfillment materials inventory"
            >
              <PackageCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Fulfillment Inventory Stock</span>
            </button>

            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition-all cursor-pointer"
              title="Manage Product Fulfillment Templates (Bill of Materials)"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Product Templates</span>
            </button>

            <button
              onClick={handleCopyFulfillmentShoppingList}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                copiedFulfillmentNotice === "shopping"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700 shadow-2xs"
              }`}
              title="Copy clean Purchase List to clipboard reflecting exact remaining amounts needed"
            >
              {copiedFulfillmentNotice === "shopping" ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied Purchase List!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Purchase List</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrintShoppingList}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Print clean Purchase Slip for purchasing department or runner"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print Slip</span>
            </button>
          </div>
        </div>

        {/* FULFILLMENT INVENTORY ON-HAND STOCK MANAGEMENT PANEL (Requirement 13 & 17) */}
        {isFulfillmentInventoryOpen && (
          <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-4 text-left animate-fade-in">
            <div className="flex items-center justify-between border-b border-purple-200/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-600 text-white rounded-xl">
                  <PackageCheck className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider">
                    Fulfillment Inventory On-Hand Stock
                  </h4>
                  <p className="text-[11px] text-purple-800 font-medium">
                    Materials & components on hand (e.g. Cellophane, Ribbons, Bows, Foam, Photos, Chocolates). Automatically subtracted from order requirements!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFulfillmentInventoryOpen(false)}
                className="text-purple-400 hover:text-purple-700 text-xs font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Grid of On-Hand Fulfillment Materials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {fulfillmentInventory.map(item => (
                <div
                  key={item.id}
                  className="bg-white p-3 rounded-xl border border-purple-200/80 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-slate-900 truncate block">{item.itemName}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 uppercase">
                      {item.category || "Packaging"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase">Available On-Hand:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateFulfillmentStock(item.id, (Number(item.availableQty) || 0) - 1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center transition-all cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={item.availableQty === 0 ? 0 : (item.availableQty ?? "")}
                        onChange={(e) => handleUpdateFulfillmentStock(item.id, e.target.value === "" ? 0 : (parseFloat(e.target.value) || 0))}
                        className="w-16 text-center bg-slate-50 border border-slate-200 rounded-lg py-1 text-xs font-black text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateFulfillmentStock(item.id, (Number(item.availableQty) || 0) + 1)}
                        className="w-6 h-6 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center justify-center transition-all cursor-pointer"
                      >
                        +
                      </button>
                      <span className="text-[10px] font-bold text-slate-600">{item.unitLabel || 'units'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Custom Material */}
            <form onSubmit={handleAddNewFulfillmentMaterial} className="flex items-center gap-2 pt-2 border-t border-purple-200/80">
              <input
                type="text"
                placeholder="Add custom fulfillment material (e.g. Blue Shredded Paper)..."
                value={newInvItemName}
                onChange={(e) => setNewInvItemName(e.target.value)}
                className="flex-1 bg-white border border-purple-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
              />
              <input
                type="text"
                placeholder="Unit (e.g. rolls)"
                value={newInvUnitLabel}
                onChange={(e) => setNewInvUnitLabel(e.target.value)}
                className="w-28 bg-white border border-purple-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0"
              >
                + Add Material
              </button>
            </form>
          </div>
        )}

        {/* Informational Disclaimer Banner */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-950 font-medium">
          <span className="p-1 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
            <ListChecks className="w-3.5 h-3.5" />
          </span>
          <p className="leading-snug">
            <strong className="font-bold">Live Preparation Queue (NEW Orders):</strong> Items are consolidated automatically from orders in <em>NEW</em> status. Once an order moves to <em>Confirmed, In Progress</em>, or any other status, it no longer contributes new purchasing requirements. Completely separate from stock records (does <em className="not-italic font-bold">not</em> affect inventory).
          </p>
        </div>

        {/* View Mode Switcher Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setFulfillmentViewMode("consolidated")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                fulfillmentViewMode === "consolidated"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Consolidated Shopping List</span>
            </button>
            <button
              type="button"
              onClick={() => setFulfillmentViewMode("grouped")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                fulfillmentViewMode === "grouped"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>By Product Order Group</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 pr-2">
            {fulfillmentViewMode === "consolidated" ? (
              <span className="text-slate-700 font-extrabold">{consolidatedFulfillmentRequirements.length} Consolidated Requirement Lines</span>
            ) : (
              <span className="text-slate-700 font-extrabold">{derivedFulfillmentItems.length} Product Order Groups</span>
            )}
          </div>
        </div>

        {/* Input Bar & Manual Entry */}
        <div className="space-y-3">
          <form onSubmit={handleAddManualFulfillmentItem} className="flex gap-2">
            <input
              type="text"
              placeholder="Add manual item to get (e.g., 5x Gift Bags, 2x Ribbon Rolls)..."
              value={newFulfillmentInput}
              onChange={(e) => setNewFulfillmentInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 focus:bg-white transition-all placeholder:font-normal placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-all cursor-pointer shadow-2xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Manual Item</span>
            </button>
          </form>

          {/* Toggle Multi-line Bulk Add */}
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setIsBulkAddOpen(!isBulkAddOpen)}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 underline cursor-pointer"
            >
              <ListPlus className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isBulkAddOpen ? "Hide Bulk Multi-Line Paste" : "Paste Multiple Manual Lines"}</span>
            </button>

            {/* Checklist Stats */}
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
              <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60">
                {fulfillmentViewMode === "consolidated"
                  ? consolidatedFulfillmentRequirements.filter(i => !i.completed).length + manualFulfillmentList.filter(m => !m.completed).length
                  : derivedFulfillmentItems.filter(g => !g.completed).length + manualFulfillmentList.filter(m => !m.completed).length
                } Remaining
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                {fulfillmentViewMode === "consolidated"
                  ? consolidatedFulfillmentRequirements.filter(i => i.completed).length + manualFulfillmentList.filter(m => m.completed).length
                  : derivedFulfillmentItems.filter(g => g.completed).length + manualFulfillmentList.filter(m => m.completed).length
                } Obtained
              </span>
            </div>
          </div>

          {/* Multi-line Paste Form */}
          {isBulkAddOpen && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 animate-fade-in">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                Paste Multi-Line List (One Item Per Line)
              </label>
              <textarea
                rows={4}
                placeholder={`5x Gift Bags\n2x Ribbon Rolls\n10x Thank You Cards`}
                value={bulkAddText}
                onChange={(e) => setBulkAddText(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-800"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkAddOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const lines = bulkAddText.split("\n").map(l => l.trim()).filter(Boolean);
                    if (lines.length > 0) {
                      const newItems = lines.map(line => ({
                        id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                        text: line,
                        completed: false,
                        createdAt: new Date().toISOString()
                      }));
                      setManualFulfillmentList(prev => [...prev, ...newItems]);
                      setBulkAddText("");
                      setIsBulkAddOpen(false);
                    }
                  }}
                  className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 cursor-pointer"
                >
                  Add All Lines
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Checklist Items Display */}
        {(consolidatedFulfillmentRequirements.length > 0 || derivedFulfillmentItems.length > 0 || manualFulfillmentList.length > 0) ? (
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1">
              <span>{fulfillmentViewMode === "consolidated" ? "Consolidated Items To Get / Purchase" : "Product Groups To Prepare"}</span>
              <div className="flex items-center gap-3">
                {(consolidatedFulfillmentRequirements.some(i => i.completed) || derivedFulfillmentItems.some(g => g.completed) || manualFulfillmentList.some(m => m.completed)) && (
                  <button
                    onClick={handleClearCompletedFulfillment}
                    className="text-slate-500 hover:text-rose-600 transition-colors font-bold cursor-pointer"
                  >
                    Clear Completed
                  </button>
                )}
                <button
                  onClick={handleClearAllFulfillment}
                  className="text-slate-400 hover:text-rose-700 transition-colors font-bold cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* CONSOLIDATED VIEW */}
              {fulfillmentViewMode === "consolidated" && consolidatedFulfillmentRequirements.map((item) => {
                const isEditingThis = editingOverrideKey === item.key;
                const displayQty = item.purchaseQty !== undefined ? item.purchaseQty : item.totalRequiredQty;

                return (
                  <div
                    key={item.key}
                    onClick={() => {
                      if (!isEditingThis) handleToggleDerivedVariant(item.key);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative ${
                      item.completed
                        ? "bg-slate-50/80 border-slate-200/70 opacity-60"
                        : item.isOverridden
                        ? "bg-amber-50/30 border-amber-300/90 shadow-2xs hover:border-amber-400"
                        : "bg-white border-slate-200/90 shadow-2xs hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDerivedVariant(item.key);
                          }}
                          className={`mt-0.5 p-0.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                            item.completed
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-100 border border-slate-300 text-transparent hover:border-slate-400"
                          }`}
                          title={item.completed ? "Mark incomplete" : "Mark as completed/obtained"}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-xs font-black block ${
                                item.completed ? "line-through text-slate-400" : "text-slate-900"
                              }`}>
                                {displayQty} {item.bulkUnitLabel || item.unitLabel || ''} {item.componentName}
                              </span>

                              {item.catalogType === "LUXE_BOOK" && (
                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                                  📚 Luxe Book Catalog
                                </span>
                              )}
                              {item.catalogType === "REGULAR_INVENTORY" && (
                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-900 border border-cyan-300">
                                  📦 Regular Goods
                                </span>
                              )}
                              {item.catalogType === "UNMATCHED" && (
                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 border border-rose-300">
                                  ⚠️ Unmatched Product / Direct Line Item
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isEditingThis) {
                                  setEditingOverrideKey(null);
                                } else {
                                  setEditingOverrideKey(item.key);
                                  setOverrideInputVal(String(displayQty));
                                }
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                                item.isOverridden
                                  ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                              }`}
                              title="Override purchase quantity for this fulfillment requirement"
                            >
                              <Edit3 className="w-3 h-3" />
                              {item.isOverridden ? "Override Active" : "Override Qty"}
                            </button>
                          </div>

                          {/* 4-Step Breakdown Badge */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-extrabold">
                              Required: {item.totalRequiredQty} {item.unitLabel || ''}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                              item.availableQty > 0
                                ? "bg-purple-100 text-purple-900 border-purple-300"
                                : "bg-slate-50 text-slate-500 border-slate-200"
                            }`}>
                              On-Hand Stock: {item.availableQty} {item.unitLabel || ''}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                              item.remainingReqQty > 0
                                ? "bg-amber-100 text-amber-950 border-amber-300"
                                : "bg-emerald-100 text-emerald-900 border-emerald-300"
                            }`}>
                              Remaining Needed: {item.remainingReqQty} {item.unitLabel || ''}
                            </span>
                            {item.hasBulkRule && item.purchaseQty !== undefined && item.remainingReqQty > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-950 border border-indigo-300 text-[10px] font-extrabold">
                                Bulk Rule: {item.purchaseQty} {item.bulkUnitLabel || item.unitLabel || ''}
                              </span>
                            )}
                          </div>

                          {/* Inline Override Form */}
                          {isEditingThis && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2 text-left"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider">
                                  Manual Purchase Quantity Override
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEditingOverrideKey(null)}
                                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                                >
                                  ✕
                                </button>
                              </div>

                              <p className="text-[10px] font-medium text-amber-900 leading-tight">
                                This override affects this fulfillment requirement only. It will not permanently alter the backend template unless explicitly saved there.
                              </p>

                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step="any"
                                  value={overrideInputVal}
                                  onChange={(e) => setOverrideInputVal(e.target.value)}
                                  placeholder="Enter purchase qty"
                                  className="w-28 bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs font-black text-slate-900 focus:outline-hidden focus:border-amber-600"
                                />
                                <span className="text-xs font-bold text-amber-900">
                                  {item.bulkUnitLabel || item.unitLabel || 'units'}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const val = parseFloat(overrideInputVal);
                                    if (!isNaN(val) && val >= 0) {
                                      setManualPurchaseOverrides(prev => ({ ...prev, [item.key]: val }));
                                      setEditingOverrideKey(null);
                                    }
                                  }}
                                  className="px-3 py-1 bg-amber-600 text-white font-extrabold text-[10px] rounded-lg hover:bg-amber-700 shadow-2xs transition-all cursor-pointer"
                                >
                                  Save Override
                                </button>

                                {item.isOverridden && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setManualPurchaseOverrides(prev => {
                                        const next = { ...prev };
                                        delete next[item.key];
                                        return next;
                                      });
                                      setEditingOverrideKey(null);
                                    }}
                                    className="px-2.5 py-1 bg-white text-rose-700 border border-rose-200 font-extrabold text-[10px] rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                  >
                                    Reset to Rule
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            {item.productNames.length > 0 && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60 inline-flex items-center gap-1">
                                From: {item.productNames.join(", ")}
                              </span>
                            )}
                            {item.orderNumbers.length > 0 && (
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 inline-flex items-center gap-1">
                                Orders: {item.orderNumbers.join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* GROUPED VIEW */}
              {fulfillmentViewMode === "grouped" && derivedFulfillmentItems.map((group) => (
                <div
                  key={group.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                    group.completed
                      ? "bg-slate-50/80 border-slate-200/70 opacity-60"
                      : "bg-white border-indigo-200/90 shadow-2xs hover:border-indigo-300"
                  }`}
                >
                  {/* Group Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleDerivedGroup(group.groupKey, group.variants, group.completed)}
                        className={`p-0.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                          group.completed
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 border border-slate-300 text-transparent hover:border-slate-400"
                        }`}
                        title={group.completed ? "Mark group as incomplete" : "Mark entire group as complete"}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      <div className="min-w-0">
                        <span className={`text-xs font-black leading-snug block ${
                          group.completed ? "line-through text-slate-400" : "text-slate-900"
                        }`}>
                          {group.text}
                        </span>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 inline-flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                            Orders: {group.orderNumbers.join(", ")}
                          </span>
                          {group.hasTemplate && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 inline-flex items-center gap-1">
                              <Layers className="w-2.5 h-2.5 text-purple-600" />
                              BOM Template ({group.variants.length} items)
                            </span>
                          )}
                          {group.matchType === "LUXE_BOOK" && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                              📚 Luxe Book Catalog
                            </span>
                          )}
                          {group.matchType === "REGULAR_INVENTORY" && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-900 border border-cyan-300 inline-flex items-center gap-1">
                              📦 Regular Goods
                            </span>
                          )}
                          {group.matchType === "UNMATCHED" && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-rose-50 text-rose-900 border border-rose-300 inline-flex items-center gap-1">
                              ⚠️ Unmatched Product
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDismissDerivedGroup(group.groupKey)}
                      className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Hide auto-derived requirement group"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Sub-variant list */}
                  {group.variants.length > 0 && (
                    <div className="pl-6 border-l-2 border-indigo-100 space-y-1.5 pt-1">
                      {group.variants.map((v) => (
                        <div
                          key={v.variantKey}
                          onClick={() => handleToggleDerivedVariant(v.variantKey)}
                          className="flex items-center justify-between text-xs cursor-pointer group/v hover:bg-slate-50 p-1 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleDerivedVariant(v.variantKey);
                              }}
                              className={`p-0.5 rounded-md transition-colors cursor-pointer shrink-0 ${
                                v.completed
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-100 border border-slate-300 text-transparent group-hover/v:border-slate-400"
                              }`}
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </button>
                            <span className={`text-xs ${v.completed ? "line-through text-slate-400 font-medium" : "font-extrabold text-slate-800"}`}>
                              {v.label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* MANUAL ITEMS (Rendered in both views) */}
              {manualFulfillmentList.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setManualFulfillmentList(prev => prev.map(item => item.id === m.id ? { ...item, completed: !item.completed } : item))}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    m.completed
                      ? "bg-slate-50/80 border-slate-200/70 opacity-60"
                      : "bg-white border-slate-200 shadow-2xs hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setManualFulfillmentList(prev => prev.map(item => item.id === m.id ? { ...item, completed: !item.completed } : item));
                      }}
                      className={`mt-0.5 p-0.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                        m.completed
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 border border-slate-300 text-transparent hover:border-slate-400"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="space-y-1 min-w-0">
                      <span className={`text-xs leading-snug break-words block ${
                        m.completed ? "line-through text-slate-400 font-medium" : "font-extrabold text-slate-900"
                      }`}>
                        {m.text}
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60 inline-flex items-center gap-1">
                        Manual Entry
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setManualFulfillmentList(prev => prev.filter(item => item.id !== m.id));
                    }}
                    className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Remove manual entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl space-y-2">
            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No New Order Fulfillment Requirements</p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto font-medium">
              Orders in NEW status automatically generate consolidated preparation items here. Once an order moves out of New status, its items disappear automatically. You can also add manual preparation items.
            </p>
          </div>
        )}
      </div>

      {/* CREATE / EDIT ORDER MODAL */}
      {isFormOpen && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto text-left relative my-auto animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-slate-950 text-emerald-400 rounded-xl">
                  <ClipboardList className="w-4 h-4" />
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingOrder ? `Edit Order ${editingOrder.orderNumber}` : "Create New Production Order"}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="space-y-4">
              
              {/* Row 1: Order # & Client Select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Order Number</label>
                  <input
                    type="text"
                    required
                    value={formOrderNumber}
                    onChange={(e) => setFormOrderNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Select Existing Client Profile</label>
                  <select
                    value={formClientId}
                    onChange={(e) => handleSelectClientInForm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-800"
                  >
                    <option value="">-- Choose Client (or enter manual name below) --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} ({c.tier || "Silver"}) - {c.contact.phoneNumber || "No Phone"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Client Name Search Lookup, Phone, Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Client Name *</label>
                    {formClientId && (
                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                        ID: {formClientId}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formClientName}
                      onChange={(e) => {
                        setFormClientName(e.target.value);
                        setIsClientSearchOpen(true);
                      }}
                      onFocus={() => setIsClientSearchOpen(true)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 pr-8"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Search suggestions dropdown */}
                  {isClientSearchOpen && formClientName.trim().length > 0 && (() => {
                    const query = formClientName.trim().toLowerCase();
                    const matches = clients.filter(c => {
                      const full = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase();
                      const cid = (c.id || "").toLowerCase();
                      const phone = (c.contact?.phoneNumber || "").toLowerCase();
                      return full.includes(query) || cid.includes(query) || phone.includes(query);
                    }).slice(0, 6);

                    if (matches.length === 0) return null;

                    return (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                        <div className="px-2.5 py-1 bg-slate-50 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                          Client Directory Matches
                        </div>
                        {matches.map(c => {
                          const fullName = `${c.firstName} ${c.lastName}`.trim();
                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                setFormClientId(c.id);
                                setFormClientName(fullName);
                                setFormClientTier(c.tier || "");
                                setFormClientPhone(c.contact?.phoneNumber || "");
                                if (c.contact?.deliveryAddress) {
                                  setFormDeliveryLocation(c.contact.deliveryAddress);
                                } else if (c.contact?.city) {
                                  setFormDeliveryLocation(`${c.contact.city}${c.contact.parish ? `, ${c.contact.parish}` : ""}`);
                                }
                                setIsClientSearchOpen(false);
                              }}
                              className="p-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                            >
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-slate-900 block truncate">{fullName}</span>
                                <span className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                                  <span>ID: {c.id}</span>
                                  {c.contact?.phoneNumber && <span>• {c.contact.phoneNumber}</span>}
                                  {c.homeBrand && <span>• {c.homeBrand}</span>}
                                </span>
                              </div>
                              {c.tier && (
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                  c.tier === "Platinum" ? "bg-slate-900 text-amber-300" :
                                  c.tier === "Gold" ? "bg-amber-100 text-amber-900" :
                                  c.tier === "Founders Family" ? "bg-purple-100 text-purple-900" :
                                  "bg-slate-100 text-slate-700"
                                }`}>
                                  {c.tier}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Client Phone</label>
                  <input
                    type="text"
                    value={formClientPhone}
                    onChange={(e) => setFormClientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Client Tier</label>
                  <select
                    value={formClientTier || ""}
                    onChange={(e) => setFormClientTier(e.target.value as ClientTier | "")}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer"
                  >
                    <option value="">Blank (Default)</option>
                    <option value="Platinum">Platinum</option>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Founders Family">Founders Family</option>
                    <option value="Delinquent">Delinquent</option>
                    <option value="Problematic">Problematic</option>
                  </select>
                </div>

                {/* Company Designation (Operations Board Business Context) */}
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-widest block flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    Company
                  </label>
                  <select
                    value={formCompany}
                    onChange={(e) => {
                      const newCompany = e.target.value as "CEO Lifestyle" | "Librarium Luxe";
                      setFormCompany(newCompany);
                    }}
                    className={`w-full border rounded-xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer ${
                      formCompany === "Librarium Luxe"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-black"
                        : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  >
                    <option value="CEO Lifestyle">CEO Lifestyle</option>
                    <option value="Librarium Luxe">Librarium Luxe</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Client Home</label>
                  <select
                    value={formClientHome}
                    onChange={(e) => setFormClientHome(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer"
                  >
                    <option value="CEO Lifestyle">CEO Lifestyle</option>
                    <option value="Librarium Luxe">Librarium Luxe</option>
                  </select>
                </div>
              </div>

              {/* OPEN CMT REMINDER DURING ORDER CREATION (Requirement 11) */}
              {(() => {
                const activeClientObj = clients.find(c => {
                  if (formClientId && c.id === formClientId) return true;
                  const fullName = `${c.firstName || ""} ${c.lastName || ""}`.trim().toLowerCase();
                  const searchName = formClientName.trim().toLowerCase();
                  if (searchName && (fullName === searchName || (searchName.length >= 3 && fullName.includes(searchName)))) return true;
                  return false;
                });
                if (!activeClientObj) return null;
                const openCmts = getClientPromises(activeClientObj).filter(p => p.status === 'Open' || (p.status as any) === 'Pending');
                if (openCmts.length === 0) return null;

                return (
                  <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-3 space-y-2 text-left animate-fade-in">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 text-amber-950 font-extrabold text-xs">
                        <HeartHandshake className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{openCmts.length} Open CMT{openCmts.length > 1 ? "s" : ""}</span>
                        <span className="text-amber-800/80 font-medium text-[11px]">for {activeClientObj.firstName} {activeClientObj.lastName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowFormCmtsPopover(!showFormCmtsPopover)}
                        className="text-[10px] font-extrabold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        {showFormCmtsPopover ? "Hide CMTs" : "View Open CMTs"}
                      </button>
                    </div>

                    {showFormCmtsPopover && (
                      <div className="space-y-1.5 pt-2 border-t border-amber-200/80 max-h-40 overflow-y-auto">
                        {openCmts.map(cmt => (
                          <div key={cmt.id} className="bg-white/90 border border-amber-200 p-2.5 rounded-xl text-xs space-y-0.5">
                            <div className="font-extrabold text-slate-900 flex items-center justify-between gap-2">
                              <span>• {cmt.commitment || (cmt as any).title || (cmt as any).text}</span>
                              {cmt.dueDate && <span className="text-[10px] text-amber-800 font-extrabold shrink-0 bg-amber-100 px-1.5 py-0.5 rounded">Due: {cmt.dueDate}</span>}
                            </div>
                            {cmt.notes && <p className="text-[11px] text-slate-600 italic pl-3">{cmt.notes}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ADVENTIST INTERACTION PROTECTION BANNER */}
              {(() => {
                const activeClientObj = clients.find(c => {
                  if (formClientId && c.id === formClientId) return true;
                  const fullName = `${c.firstName || ""} ${c.lastName || ""}`.trim().toLowerCase();
                  const searchName = formClientName.trim().toLowerCase();
                  if (searchName && (fullName === searchName || (searchName.length >= 3 && fullName.includes(searchName)))) return true;
                  return false;
                });
                if (!activeClientObj || activeClientObj.adventist !== "Yes") return null;
                return (
                  <div className="bg-indigo-50/90 border border-indigo-200 rounded-2xl p-3 text-xs text-indigo-950 flex items-center gap-2.5 animate-fade-in">
                    <span className="p-1.5 bg-indigo-100 rounded-xl text-indigo-700 font-black text-sm shrink-0">✝</span>
                    <div>
                      <span className="font-extrabold block">Adventist Interaction Protection Active</span>
                      <span className="text-[11px] text-indigo-800">Please ensure deliveries and client communication are scheduled outside of Sabbath hours (Friday 5:00 PM to Saturday night).</span>
                    </div>
                  </div>
                );
              })()}

              {/* Multi-Product Ordered Section (Up to 10 products) */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Products Ordered ({formItems.length}/10)
                  </h4>
                </div>

                <div className="space-y-3">
                  {formItems.map((item, index) => (
                    <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                          Product #{index + 1}
                        </span>
                        {formItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProductItem(item.id)}
                            className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                            Product Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={item.productName}
                            onChange={(e) => handleUpdateProductItem(item.id, "productName", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                            Cost of Order (JMD $) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.itemCost === 0 ? 0 : (item.itemCost || "")}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateProductItem(item.id, "itemCost", val === "" ? ("" as any) : (parseFloat(val) || 0));
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity === 0 ? "" : (item.quantity ?? "")}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateProductItem(item.id, "quantity", val === "" ? ("" as any) : (parseInt(val, 10) || 0));
                            }}
                            onBlur={() => {
                              const val = parseInt(String(item.quantity), 10);
                              if (!val || val < 1) {
                                handleUpdateProductItem(item.id, "quantity", 1);
                              }
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800"
                          />
                        </div>
                      </div>

                      {/* Structured Size & Colour inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                            Size
                          </label>
                          <input
                            type="text"
                            value={item.size || ""}
                            onChange={(e) => handleUpdateProductItem(item.id, "size", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                            Colour
                          </label>
                          <input
                            type="text"
                            value={item.colour || ""}
                            onChange={(e) => handleUpdateProductItem(item.id, "colour", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          Product Notes / Specifications
                        </label>
                        <input
                          type="text"
                          value={item.details}
                          onChange={(e) => handleUpdateProductItem(item.id, "details", e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* + Product Button moved to bottom of product list */}
                {formItems.length < 10 && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleAddProductItem}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Product</span>
                    </button>
                  </div>
                )}

                {/* Existing Stock Match / Use-First Alert */}
                {(() => {
                  const stockMatches = findInventoryStockMatches(formItems, currentSettings.regularInventory || []);
                  if (stockMatches.length === 0) return null;

                  return (
                    <div className="p-3.5 bg-amber-50/90 border-2 border-amber-300 rounded-2xl space-y-2 text-xs animate-fade-in shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-black text-amber-950 text-xs">
                          <Zap className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0" />
                          <span>Existing Inventory Match ({stockMatches.length})</span>
                        </div>
                        <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-lg">
                          Consider using existing stock
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                        You currently have item(s) in Inventory matching this order's products. Consider using existing stock before purchasing or manufacturing another:
                      </p>
                      <div className="space-y-1.5 pt-1">
                        {stockMatches.map((m, idx) => (
                          <div key={idx} className="bg-white border border-amber-200 rounded-xl p-2.5 flex items-start justify-between gap-2 shadow-2xs">
                            <div className="space-y-0.5 min-w-0">
                              <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                                <span>{m.matchedInventoryItem.productName}</span>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                  m.priorityFlag === "USE FIRST" ? "bg-amber-100 text-amber-900 border border-amber-300" :
                                  m.priorityFlag === "CLEARANCE" ? "bg-rose-100 text-rose-900 border border-rose-300" : "bg-slate-100 text-slate-700"
                                }`}>
                                  {m.priorityFlag}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-600 font-medium">
                                Available On-Hand: <strong className="text-slate-900 font-black">{m.availableQty} {m.matchedInventoryItem.unitLabel || "pcs"}</strong> • Matches order requirement: <span className="italic text-slate-800">"{m.orderItemName}"</span> ({m.matchReason})
                              </p>
                            </div>
                            <div className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg shrink-0 text-center">
                              Option Available
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-amber-800/90 italic font-medium pt-0.5">
                        * Non-blocking advisory: The system does not automatically allocate or remove inventory. The operator decides whether to use stock on hand.
                      </p>
                    </div>
                  );
                })()}

                {/* Form Financial Summary Bar: Total, Deposit Paid, Balance Due */}
                {(() => {
                  const calculatedTotalAmt = formItems.reduce((acc, i) => acc + (i.itemCost || 0), 0);
                  const depositVal = typeof formDepositAmount === "number" ? formDepositAmount : 0;
                  const balanceVal = Math.max(0, calculatedTotalAmt - depositVal);
                  const isDepositOver = depositVal > calculatedTotalAmt && calculatedTotalAmt > 0;

                  return (
                    <div className="space-y-3 bg-slate-900 text-white p-4 rounded-2xl shadow-xs">
                      <div className="flex items-center justify-between text-xs font-bold border-b border-slate-800 pb-2">
                        <span className="text-slate-300">Order Total (Calculated):</span>
                        <span className="font-mono text-sm text-emerald-400 font-extrabold">
                          J${calculatedTotalAmt.toLocaleString()}
                          <span className="text-[10px] text-slate-400 font-normal ml-2 font-sans">
                            ({formItems.reduce((acc, i) => acc + (i.quantity || 1), 0)} items total)
                          </span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block">
                            Deposit Paid (JMD $) *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">J$</span>
                            <input
                              type="number"
                              min="0"
                              value={formDepositAmount === "" ? "" : formDepositAmount}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                  setFormDepositAmount("");
                                } else {
                                  const parsed = parseFloat(val);
                                  if (isNaN(parsed) || parsed < 0) {
                                    setFormDepositAmount(0);
                                  } else {
                                    setFormDepositAmount(parsed);
                                  }
                                }
                              }}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-2.5 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          {isDepositOver && (
                            <p className="text-[10px] font-bold text-rose-400 mt-0.5">
                              ⚠️ Deposit cannot exceed order total (J${calculatedTotalAmt.toLocaleString()}).
                            </p>
                          )}
                        </div>

                        <div className="space-y-1 flex flex-col justify-end">
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block">
                            Balance Due (Auto-Calculated)
                          </span>
                          <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 flex items-center justify-between text-xs font-mono font-bold">
                            <span className="text-slate-400">Remaining:</span>
                            <span className={balanceVal === 0 ? "text-emerald-400 font-extrabold" : "text-amber-400 font-extrabold"}>
                              J${balanceVal.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Row: Date Order Created, Due Date, Priority, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Date Order Created *</label>
                  <input
                    type="date"
                    required
                    value={formDateCreated}
                    onChange={(e) => setFormDateCreated(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as OrderPriority)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Status</label>
                  <select
                    value={editingOrder?.productionStatus === "Completed" ? "Completed" : formProductionStatus}
                    disabled={editingOrder?.productionStatus === "Completed"}
                    onChange={(e) => setFormProductionStatus(e.target.value as ProductionStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {editingOrder?.productionStatus === "Completed" ? (
                      <option value="Completed">Completed (Terminal)</option>
                    ) : (
                      PRODUCTION_STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Row 5: Delivery Method & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Delivery Method</label>
                  <select
                    value={formDeliveryMethod}
                    onChange={(e) => {
                      const m = e.target.value as OperationsDeliveryMethod;
                      setFormDeliveryMethod(m);
                      if (m === "Store Pickup" && !formDeliveryLocation) setFormDeliveryLocation("Fresh Drip Outlet");
                      else if (m === "Knutsford Express" && !formDeliveryLocation) setFormDeliveryLocation("Montego Bay Branch");
                      else if (m === "Personal Delivery" && !formDeliveryLocation) setFormDeliveryLocation("Spanish Town");
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800"
                  >
                    {DELIVERY_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Delivery Location / Branch</label>
                  <input
                    type="text"
                    value={formDeliveryLocation}
                    onChange={(e) => setFormDeliveryLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              {/* Row 6: Assigned Staff & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Assigned Staff</label>
                  <input
                    type="text"
                    value={formAssignedStaff}
                    onChange={(e) => setFormAssignedStaff(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="formDepositPaid"
                    checked={formDepositPaid}
                    onChange={(e) => setFormDepositPaid(e.target.checked)}
                    className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-800 cursor-pointer"
                  />
                  <label htmlFor="formDepositPaid" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Deposit / Payment Received
                  </label>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Internal Production Notes</label>
                <textarea
                  rows={2}
                  value={formInternalNotes}
                  onChange={(e) => setFormInternalNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                />
              </div>

              {/* Express Order Section */}
              <div className={`p-3.5 rounded-2xl border transition-all ${
                formExpressOrder === "Yes" 
                  ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/30" 
                  : "bg-slate-50/80 border-slate-200"
              }`}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <Zap className={`w-3.5 h-3.5 ${formExpressOrder === "Yes" ? "text-amber-600 fill-amber-500" : "text-slate-400"}`} />
                      <span>Express Order</span>
                    </label>
                    <select
                      value={formExpressOrder}
                      onChange={(e) => setFormExpressOrder(e.target.value as YesNo)}
                      className={`w-full border rounded-xl p-2.5 text-xs font-bold focus:outline-none cursor-pointer ${
                        formExpressOrder === "Yes"
                          ? "bg-amber-400 text-amber-950 border-amber-300 font-black shadow-2xs"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      <option value="No">Express: No (Standard)</option>
                      <option value="Yes">⚡ Express: Yes (Urgent Priority)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      Express Order Note / Rush Deadline
                    </label>
                    <input
                      type="text"
                      value={formExpressNote}
                      onChange={(e) => setFormExpressNote(e.target.value)}
                      disabled={formExpressOrder === "No"}
                      className={`w-full border rounded-xl p-2.5 text-xs font-medium focus:outline-none ${
                        formExpressOrder === "Yes"
                          ? "bg-white border-amber-300 text-slate-900 placeholder:text-slate-400 font-bold"
                          : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Verification Field (Manual Confirmation) */}
              <div className={`p-3.5 rounded-2xl border transition-all ${
                formInvoiceLogged 
                  ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20" 
                  : "bg-slate-50/80 border-slate-200"
              }`}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="formInvoiceLogged"
                    checked={formInvoiceLogged}
                    onChange={(e) => setFormInvoiceLogged(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="space-y-0.5 flex-1">
                    <label htmlFor="formInvoiceLogged" className="text-xs font-bold text-slate-900 cursor-pointer flex items-center gap-2">
                      <span>Invoice Logged</span>
                      {formInvoiceLogged ? (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Verified & Logged
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                          Manual Operator Verification
                        </span>
                      )}
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      Manually verify that the invoice for this order has been created and logged. (This is a manual confirmation and will not be checked automatically.)
                    </p>
                  </div>
                </div>
              </div>

              {/* Quality Checklist Section (Optional) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Quality Checklist</h4>
                  </div>
                  {hasFormChecklist && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsTemplateManagerOpen(true)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                      >
                        + Manage Templates
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHasFormChecklist(false);
                          setFormChecklist([]);
                          setFormChecklistTemplateName("");
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                      >
                        🗑️ Remove Checklist
                      </button>
                    </div>
                  )}
                </div>

                {!hasFormChecklist ? (
                  <div className="p-4 bg-white border border-dashed border-slate-200 rounded-xl text-center space-y-2">
                    <p className="text-xs text-slate-500 font-medium">No checklist attached to this task by default.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setHasFormChecklist(true);
                        if (checklistTemplatesList.length > 0) {
                          const tpl = checklistTemplatesList[0];
                          setFormChecklistTemplateName(tpl.name);
                          setFormChecklist(tpl.items.map(it => ({ ...it, completed: false })));
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <ListChecks className="w-4 h-4" />
                      <span>➕ Add Quality Checklist</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Choose Template</label>
                      </div>
                      <select
                        value={formChecklistTemplateName}
                        onChange={(e) => handleSelectChecklistTemplateInForm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer"
                      >
                        <option value="">-- Custom Checklist (No Template) --</option>
                        {checklistTemplatesList.map(tpl => (
                          <option key={tpl.id} value={tpl.name}>
                            {tpl.name} ({tpl.items.length} steps)
                          </option>
                        ))}
                      </select>

                      {/* Quick-select template pills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {checklistTemplatesList.map(tpl => (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => handleSelectChecklistTemplateInForm(tpl.name)}
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                              formChecklistTemplateName === tpl.name
                                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            ⚡ {tpl.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Checklist Items List with Reordering & Inline Editing */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          Checklist Steps ({formChecklist.length})
                        </label>
                      </div>

                      {formChecklist.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No checklist steps added yet. Choose a template above or add custom steps below.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {formChecklist.map((item, idx) => (
                            <div key={item.id} className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-slate-200/80 text-xs shadow-2xs group hover:border-slate-300 transition-all">
                              {/* Reorder Arrows */}
                              <div className="flex items-center gap-0.5 text-slate-400">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveFormChecklistItem(idx, -1)}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-colors"
                                  title="Move Step Up"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === formChecklist.length - 1}
                                  onClick={() => handleMoveFormChecklistItem(idx, 1)}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-colors"
                                  title="Move Step Down"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Checkbox */}
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => handleToggleFormChecklistItem(item.id)}
                                className="rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                              />

                              {/* Editable Text Input */}
                              <input
                                type="text"
                                value={item.label}
                                onChange={(e) => handleUpdateFormChecklistItemLabel(item.id, e.target.value)}
                                className={`flex-1 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-slate-800 px-1 py-0.5 text-xs font-bold focus:outline-none transition-colors ${
                                  item.completed ? "line-through text-slate-400 font-normal" : "text-slate-800"
                                }`}
                              />

                              {/* Delete Item Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteFormChecklistItem(item.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                                title="Remove Step"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Custom Item Row */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newCustomChecklistItemText}
                          onChange={(e) => setNewCustomChecklistItemText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomChecklistItem();
                            }
                          }}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-slate-800"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomChecklistItem}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          + Add Step
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{editingOrder ? "Save Changes" : "Create Production Order"}</span>
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* PRINTABLE JOB SHEET TICKET MODAL - SHIPPING LABEL AESTHETIC */}
      {printableJobSheetOrder && createPortal(
        <div 
          id="production-job-sheet-portal"
          className="production-job-label-wrapper fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        >
          <div className="max-w-[620px] w-full my-auto space-y-3">
            
            {/* On-screen control bar (Hidden in print) */}
            <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-lg border border-slate-800 no-print">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-200">
                  Production Job Sheet Ticket
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Ticket</span>
                </button>
                <button
                  onClick={() => setPrintableJobSheetOrder(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Close Preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PHYSICAL PRODUCTION JOB SHEET TICKET (Modern E-Commerce Shipping Label Aesthetic) */}
            <div className="production-job-label-card bg-white text-black border-2 border-black rounded-none shadow-2xl p-4 sm:p-5 font-sans space-y-0 select-text text-left">
              
              {/* ZONE 1: BRAND / CARRIER HEADER & JOB IDENTITY */}
              <div className="border-b-2 border-black pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-black" />
                      <div className="text-[13px] font-black uppercase tracking-wider text-black leading-tight">
                        CEO LIFESTYLE MANAGEMENT
                      </div>
                    </div>
                    <div className="text-[9px] font-extrabold uppercase tracking-widest text-slate-700">
                      PRODUCTION & WORKFLOW JOB SHEET
                    </div>
                    {printableJobSheetOrder.company === "Librarium Luxe" && (
                      <div className="inline-block mt-1 px-2 py-0.5 bg-black text-white text-[8px] font-black uppercase tracking-widest">
                        LIBRARIUM LUXE DIVISION
                      </div>
                    )}
                  </div>

                  {/* Prominent Job Reference Number & Priority Badges */}
                  <div className="text-right flex flex-col items-end">
                    <div className="text-[8px] font-mono font-bold tracking-widest uppercase text-slate-500">
                      JOB REFERENCE
                    </div>
                    <div className="font-mono text-2xl sm:text-3xl font-black tracking-tight text-black leading-none mt-0.5">
                      {printableJobSheetOrder.orderNumber}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="px-2 py-0.5 bg-black text-white text-[9px] font-black uppercase tracking-widest border border-black">
                        {printableJobSheetOrder.priority} PRIORITY
                      </span>
                      {printableJobSheetOrder.expressOrder === "Yes" && (
                        <span className="px-2 py-0.5 bg-amber-300 text-black text-[9px] font-black uppercase tracking-widest border border-black flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5 fill-black text-black" />
                          EXPRESS
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Primary Scannable Barcode & Tracking Reference */}
                <div className="mt-3 pt-2.5 border-t border-dashed border-slate-300 flex items-center justify-between">
                  <div className="text-[8px] font-mono font-bold tracking-wider text-slate-600 uppercase">
                    SERVICE: INTERNAL PRODUCTION ROUTING<br />
                    REF: OPS-{printableJobSheetOrder.orderNumber.replace(/[^0-9A-Za-z]/g, "")}
                  </div>
                  <div className="flex flex-col items-end">
                    <svg className="h-7 w-48 sm:w-56" viewBox="0 0 160 26" preserveAspectRatio="none" shapeRendering="crispEdges">
                      {[2,1,3,1,2,4,1,2,3,1,2,1,4,2,1,3,2,1,2,4,1,3,2,1,3,1,4,2,1,2,3,2,1,4,1,2,3,1,2,1,3,4,2,1,2,3,1,4,2,1,2,3,2,1,3,1,4,2,1,2,1,3,2].map((w, i) => (
                        i % 2 === 0 ? <rect key={i} x={i * 2.5} y="0" width={w * 0.75} height="26" fill="#000000" /> : null
                      ))}
                    </svg>
                    <span className="font-mono text-[8px] font-bold tracking-widest text-black mt-0.5">
                      *JOB-{printableJobSheetOrder.orderNumber}*
                    </span>
                  </div>
                </div>

                {/* Express Rush Alert Strip if Express */}
                {printableJobSheetOrder.expressOrder === "Yes" && (
                  <div className="mt-2 p-2 bg-amber-100 border border-black text-black">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-amber-950">
                      <Zap className="w-3 h-3 fill-amber-500 text-amber-950" />
                      <span>EXPRESS ORDER RUSH WORKFLOW ACTIVATED</span>
                    </div>
                    {printableJobSheetOrder.expressNote && (
                      <p className="text-[9px] font-bold text-amber-900 mt-0.5 leading-tight">
                        RUSH NOTE: {printableJobSheetOrder.expressNote}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ZONE 2: RECIPIENT / SHIP TO BLOCK & ROUTING SPECIFICATIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-12 border-b-2 border-black divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-black">
                
                {/* DELIVER / SHIP TO RECIPIENT BLOCK (7 cols) */}
                <div className="sm:col-span-7 p-3 space-y-2 bg-white">
                  <div className="text-[8px] font-black uppercase tracking-widest text-slate-500 border-b border-black pb-0.5 flex justify-between items-center">
                    <span>DELIVER / SHIP TO</span>
                    <span className="font-mono text-[7px] text-slate-400">CLIENT SPECIFICATION</span>
                  </div>
                  
                  <div>
                    <div className="font-black text-base sm:text-lg text-black uppercase tracking-tight leading-tight">
                      {printableJobSheetOrder.clientName}
                    </div>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span className="inline-block px-1.5 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-wider">
                        TIER: {printableJobSheetOrder.clientTier || "Silver"}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-800">
                        TEL: {printableJobSheetOrder.clientPhone || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-left">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">DELIVERY METHOD</span>
                      <span className="text-[11px] font-black text-black block leading-tight mt-0.5">
                        {printableJobSheetOrder.deliveryMethod}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">DELIVERY LOCATION</span>
                      <span className="text-[11px] font-black text-black block leading-tight mt-0.5">
                        {printableJobSheetOrder.deliveryLocation || "Office / Desk"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* JOB & DISPATCH METADATA GRID (5 cols) */}
                <div className="sm:col-span-5 p-3 space-y-2 bg-slate-50/60">
                  <div className="text-[8px] font-black uppercase tracking-widest text-slate-500 border-b border-black pb-0.5 flex justify-between items-center">
                    <span>DISPATCH TIMELINE</span>
                    <span className="font-mono text-[7px] text-slate-400">OPERATIONAL DATES</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">DATE ORDER CREATED</span>
                      <span className="font-mono text-xs font-bold text-black block">
                        {printableJobSheetOrder.dateOrderCreated || printableJobSheetOrder.createdDate || printableJobSheetOrder.orderDate || "N/A"}
                      </span>
                    </div>

                    <div className="bg-black text-white p-2 border border-black">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 block">TARGET DUE DATE</span>
                      <span className="font-mono text-sm font-black text-white block tracking-tight">
                        {printableJobSheetOrder.dueDate}
                      </span>
                    </div>

                    <div className="pt-1 border-t border-slate-200">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">ASSIGNED STAFF</span>
                      <span className="text-xs font-bold text-black block">
                        {printableJobSheetOrder.assignedStaff || "Operations Team"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* ZONE 3: PRODUCTION ITEMS & MANIFEST TABLE */}
              <div className="border-b-2 border-black p-3 space-y-2 bg-white">
                <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-500 border-b border-black pb-1">
                  <span>JOB SPECIFICATIONS & ITEMS MANIFEST</span>
                  <span className="font-mono font-bold text-black">
                    {Array.isArray(printableJobSheetOrder.items)
                      ? `${printableJobSheetOrder.items.reduce((s, i) => s + (i.quantity || 1), 0)} TOTAL PCS`
                      : `${printableJobSheetOrder.quantityTotal || 1} TOTAL PCS`}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-black text-[8px] font-black uppercase tracking-wider text-slate-600">
                        <th className="pb-1 text-left">ITEM / DESCRIPTION</th>
                        <th className="pb-1 text-center w-12">QTY</th>
                        <th className="pb-1 text-right w-20">UNIT COST</th>
                        <th className="pb-1 text-right w-24">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {Array.isArray(printableJobSheetOrder.items) && printableJobSheetOrder.items.length > 0 ? (
                        printableJobSheetOrder.items.map((item, idx) => {
                          const unitCost = item.unitPrice ?? (item as any).itemCost ?? 0;
                          const lineTotal = (item.quantity || 1) * unitCost;
                          const variantParts = [item.colour || (item as any).color, item.size].filter(Boolean);
                          const subColor = (item as any).substituteColor || (item as any).substituteColour;

                          return (
                            <tr key={idx} className="align-top">
                              <td className="py-1.5 pr-2">
                                <div className="font-black text-black text-xs leading-tight">
                                  {item.productName}
                                </div>
                                {variantParts.length > 0 && (
                                  <div className="text-[9px] font-bold text-slate-600 leading-tight mt-0.5">
                                    Variant: {variantParts.join(" • ")}
                                  </div>
                                )}
                                {subColor && (
                                  <div className="text-[8px] text-slate-500 italic leading-tight">
                                    Sub Color: {subColor}
                                  </div>
                                )}
                                {item.details && (
                                  <div className="text-[9px] text-slate-600 leading-tight mt-0.5">
                                    {item.details}
                                  </div>
                                )}
                                {(item as any).customization && (
                                  <div className="text-[8px] font-bold text-amber-950 bg-amber-50 px-1 py-0.5 mt-0.5 inline-block border border-amber-200">
                                    Customization: {(item as any).customization}
                                  </div>
                                )}
                              </td>
                              <td className="py-1.5 text-center font-mono font-black text-xs text-black">
                                {item.quantity}
                              </td>
                              <td className="py-1.5 text-right font-mono text-[11px] font-bold text-slate-700">
                                J${Number(unitCost).toLocaleString()}
                              </td>
                              <td className="py-1.5 text-right font-mono font-black text-xs text-black">
                                J${Number(lineTotal).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr className="align-top">
                          <td className="py-1.5 pr-2">
                            <div className="font-black text-black text-xs">
                              {typeof printableJobSheetOrder.items === "string" ? printableJobSheetOrder.items : "Custom Job Specification"}
                            </div>
                          </td>
                          <td className="py-1.5 text-center font-mono font-black text-xs text-black">
                            {printableJobSheetOrder.quantityTotal || 1}
                          </td>
                          <td className="py-1.5 text-right font-mono text-[11px] font-bold text-slate-700">
                            -
                          </td>
                          <td className="py-1.5 text-right font-mono font-black text-xs text-black">
                            J${(printableJobSheetOrder.totalAmount || 0).toLocaleString()}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ZONE 4: FINANCIAL SUMMARY & VERIFICATION STRIP */}
              {(() => {
                const total = printableJobSheetOrder.totalAmount || 0;
                const dep = typeof printableJobSheetOrder.depositAmount === "number" ? printableJobSheetOrder.depositAmount : (printableJobSheetOrder.depositPaid ? total : 0);
                const bal = Math.max(0, total - dep);
                return (
                  <div className="border-b-2 border-black grid grid-cols-3 divide-x-2 divide-black bg-slate-50/70 text-center font-mono">
                    <div className="p-2">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 font-sans block">ORDER TOTAL</span>
                      <span className="text-xs font-black text-black block mt-0.5">J${total.toLocaleString()}</span>
                    </div>
                    <div className="p-2">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 font-sans block">DEPOSIT PAID</span>
                      <span className="text-xs font-black text-emerald-700 block mt-0.5">J${dep.toLocaleString()}</span>
                    </div>
                    <div className="p-2 bg-white">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 font-sans block">BALANCE DUE</span>
                      <span className={`text-xs font-black block mt-0.5 ${bal > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                        {bal === 0 ? "J$0 (PAID)" : `J$${bal.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* ZONE 5: PRODUCTION CHECKLIST & QUALITY ASSURANCE */}
              <div className="border-b-2 border-black p-3 space-y-2 bg-white">
                <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-500 border-b border-black pb-1">
                  <span>PRODUCTION CHECKLIST & QUALITY ASSURANCE</span>
                  <span className="font-mono text-[7px] uppercase tracking-wider text-slate-400">PHYSICAL STAGE VERIFICATION</span>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-bold text-[9px] ${printableJobSheetOrder.depositPaid ? "bg-black text-white" : "bg-white"}`}>
                      {printableJobSheetOrder.depositPaid ? "✓" : ""}
                    </div>
                    <span className="font-bold text-black">50% Deposit Received</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className={`w-3.5 h-3.5 border border-black flex items-center justify-center font-bold text-[9px] ${printableJobSheetOrder.invoiceLogged ? "bg-black text-white" : "bg-white"}`}>
                      {printableJobSheetOrder.invoiceLogged ? "✓" : ""}
                    </div>
                    <span className={`font-bold ${printableJobSheetOrder.invoiceLogged ? "text-black font-black" : "text-slate-800"}`}>
                      Invoice Logged & Verified
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 border border-black bg-white" />
                    <span className="font-bold text-black">Artwork Vector Confirmed</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 border border-black bg-white" />
                    <span className="font-bold text-black">Materials Prepped</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 border border-black bg-white" />
                    <span className="font-bold text-black">Production Run Passed QC</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 border border-black bg-white" />
                    <span className="font-bold text-black">Packaged & Labeled</span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <div className="w-3.5 h-3.5 border border-black bg-white" />
                    <span className="font-bold text-black">Dispatched / Pickup Ready</span>
                  </div>
                </div>

                {/* Render order's custom checklist steps if defined */}
                {Array.isArray(printableJobSheetOrder.checklist) && printableJobSheetOrder.checklist.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-dashed border-slate-200 space-y-1">
                    <span className="text-[7px] font-black uppercase tracking-wider text-slate-400 block">JOB-SPECIFIC WORKFLOW STEPS</span>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px]">
                      {printableJobSheetOrder.checklist.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-1.5">
                          <div className={`w-3 h-3 border border-black flex items-center justify-center text-[8px] font-bold ${step.completed ? "bg-black text-white" : "bg-white"}`}>
                            {step.completed ? "✓" : ""}
                          </div>
                          <span className={step.completed ? "font-bold text-slate-900" : "text-slate-700"}>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special Production Notes */}
                {printableJobSheetOrder.internalNotes && (
                  <div className="mt-2 pt-1.5 border-t border-dashed border-slate-300">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">SPECIAL PRODUCTION NOTES</span>
                    <p className="text-[10px] font-bold text-black mt-0.5 leading-snug">
                      {printableJobSheetOrder.internalNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* ZONE 6: SIGN-OFF & DISPATCH WAYBILL FOOTER */}
              <div className="p-3 bg-slate-50/40">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 block">
                      QUALITY INSPECTOR SIGN-OFF
                    </span>
                    <div className="h-7 border-b border-black mt-1 flex items-end">
                      <span className="text-[8px] text-slate-400 font-mono italic">Sign & Date:</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 block">
                      DISPATCH WAYBILL REF
                    </span>
                    <div className="h-7 border-b border-black mt-1 flex items-end">
                      <span className="text-[8px] text-slate-400 font-mono italic">Waybill / Seal #:</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[7px] font-mono uppercase tracking-wider text-slate-500">
                  <span>CEO LIFESTYLE OPERATIONS HUB • PHYSICAL PRODUCTION TICKET</span>
                  <span>ATTACH TO PRODUCTION PACKAGE / TOTE</span>
                </div>
              </div>

            </div>

          </div>
        </div>,
        document.body
      )}


      {/* MANAGE CHECKLIST TEMPLATES MODAL */}
      {isTemplateManagerOpen && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto text-left relative my-auto animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <ListChecks className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Manage Reusable Production Checklists</h3>
                  <p className="text-xs text-slate-500 font-medium">Create and customize standard operational templates for production orders</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsTemplateManagerOpen(false);
                  setEditingTemplate(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Existing Templates */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active System Checklist Templates</h4>
              <div className="grid grid-cols-1 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {checklistTemplatesList.map((tpl) => (
                  <div key={tpl.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{tpl.name}</span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {tpl.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{tpl.description}</p>
                      <div className="flex items-center gap-1.5 pt-1 text-[11px] font-medium text-slate-600">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{tpl.items.length} Production Steps</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingTemplate(tpl);
                          setNewTemplateName(tpl.name);
                          setNewTemplateCategory(tpl.category);
                          setNewTemplateDescription(tpl.description);
                          setNewTemplateItemsText(tpl.items.map(i => i.label).join("\n"));
                        }}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors cursor-pointer"
                        title="Edit Template"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteChecklistTemplate(tpl.id)}
                        className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-600 transition-colors cursor-pointer"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create / Edit Template Form */}
            <form onSubmit={handleSaveChecklistTemplate} className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  {editingTemplate ? `Edit Template: ${editingTemplate.name}` : "➕ Create New Checklist Template"}
                </span>
                {editingTemplate && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplate(null);
                      setNewTemplateName("");
                      setNewTemplateDescription("");
                      setNewTemplateItemsText("");
                    }}
                    className="text-[10px] font-bold text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Template Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Embroidery & Apparel QA Checklist"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Apparel, Books, Large Format"
                    value={newTemplateCategory}
                    onChange={(e) => setNewTemplateCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs font-medium text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Standard production and quality inspection steps for embroidered goods"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Checklist Steps (One step per line) *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={`Verify vector file resolution\nInspect blank garment quality\nExecute stitch / print process\nFinal QA & thread trim\nPolybag & client tag attachment`}
                  value={newTemplateItemsText}
                  onChange={(e) => setNewTemplateItemsText(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingTemplate ? "Update Template" : "Save Checklist Template"}</span>
                </button>
              </div>
            </form>

          </div>
        </div>,
        document.body
      )}

      {/* UNIVERSAL PASTE MODAL */}
      <UniversalPasteModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        title="Paste Operations Board Orders"
        subtitle="Copy rows directly from Excel or Google Sheets (Ctrl+C) and paste them directly into the production pipeline"
        templateType="operations"
        onConfirmImport={(pastedOrders) => handleConfirmPasteOrders(pastedOrders)}
      />

      {/* Checklist Incomplete Warning Modal */}
      {showChecklistIncompleteModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-rose-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Checklist Incomplete</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This order has required production checklist items that are not yet marked as completed.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (pendingCompletionOrder) {
                    if (pendingCompletionOrder.isFormSave && pendingCompletionOrder.savedOrderPayload) {
                      onSaveOrder(pendingCompletionOrder.savedOrderPayload);
                      setIsFormOpen(false);
                    } else {
                      onSaveOrder({
                        ...pendingCompletionOrder.order,
                        productionStatus: "Completed",
                        updatedDate: todayIso
                      });
                    }
                  }
                  setShowChecklistIncompleteModal(false);
                  setPendingCompletionOrder(null);
                }}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
              >
                Force Complete (Admin Override)
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowChecklistIncompleteModal(false);
                  setPendingCompletionOrder(null);
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Back to Checklist
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <AdventistWarningModal
        isOpen={!!adventistModalOrder}
        onClose={() => setAdventistModalOrder(null)}
        clientName={adventistModalOrder?.clientName || ""}
        actionName="Operations Order WhatsApp Update"
      />

      {/* Fulfillment Templates Admin Modal */}
      {isTemplateModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-left">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-2xl">
                  <Sliders className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white">Product Fulfillment Templates (BOM)</h3>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Configure component requirements per product. Automatically expands when products are ordered in NEW status.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setEditingTemplateId(null);
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* If creating/editing a template */}
              {editingTemplateId ? (
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      {editingTemplateId === "new" ? "Create New Product Template" : "Edit Product Template"}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingTemplateId(null)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Product Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700">
                      Product Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Magic Heart Cube, Custom Gift Box, T-Shirt..."
                      value={templateProductNameInput}
                      onChange={(e) => setTemplateProductNameInput(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                    <p className="text-[11px] text-slate-500">
                      When an order item matches this product name, its required components will auto-generate in the checklist.
                    </p>
                  </div>

                  {/* Components List Inputs */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-700">
                        Required Component Items (Per 1 Product)
                      </label>
                      <button
                        type="button"
                        onClick={() => setTemplateComponentsInput(prev => [
                          ...prev,
                          { id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, componentName: "", quantity: 1, unitLabel: "" }
                        ])}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Component</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {templateComponentsInput.map((comp, idx) => (
                        <div key={comp.id || idx} className="flex items-center gap-2 bg-white p-2 border border-slate-200 rounded-xl">
                          <div className="w-20 shrink-0">
                            <input
                              type="number"
                              min="1"
                              placeholder="Qty"
                              value={comp.quantity === 0 ? "" : (comp.quantity ?? "")}
                              onChange={(e) => {
                                const val = e.target.value === "" ? ("" as any) : (parseInt(e.target.value, 10) || 0);
                                setTemplateComponentsInput(prev => prev.map((c, i) => i === idx ? { ...c, quantity: val } : c));
                              }}
                              onBlur={() => {
                                setTemplateComponentsInput(prev => prev.map((c, i) => i === idx ? { ...c, quantity: Math.max(1, parseInt(String(c.quantity), 10) || 1) } : c));
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900 text-center"
                            />
                          </div>
                          <div className="w-20 shrink-0">
                            <input
                              type="text"
                              placeholder="Unit (pc)"
                              value={comp.unitLabel || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTemplateComponentsInput(prev => prev.map((c, i) => i === idx ? { ...c, unitLabel: val } : c));
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-800"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              placeholder="Component Item Name (e.g. Handheld Bouquet, 5x6 Photos...)"
                              value={comp.componentName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTemplateComponentsInput(prev => prev.map((c, i) => i === idx ? { ...c, componentName: val } : c));
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setTemplateComponentsInput(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditingTemplateId(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTemplate}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Template</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Template List */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Configured Fulfillment Templates ({fulfillmentTemplates.length})
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Select a product template to edit or add a new component template.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenNewTemplate}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Template</span>
                    </button>
                  </div>

                  {fulfillmentTemplates.length === 0 ? (
                    <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-2">
                      <p className="text-xs font-bold">No product templates configured yet.</p>
                      <button
                        onClick={handleResetDefaultTemplates}
                        className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 cursor-pointer"
                      >
                        Load Pre-Configured Default Templates
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fulfillmentTemplates.map((t) => (
                        <div
                          key={t.id}
                          className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                            t.enabled
                              ? "bg-white border-slate-200 shadow-2xs"
                              : "bg-slate-50 border-slate-200 opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-black text-slate-900 truncate">
                                {t.productName}
                              </span>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                t.enabled
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-slate-100 text-slate-500 border-slate-200"
                              }`}>
                                {t.enabled ? "Active" : "Disabled"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleTemplateEnabled(t.id)}
                                className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                              >
                                {t.enabled ? "Disable" : "Enable"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditTemplate(t)}
                                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit template"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTemplate(t.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete template"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Components Breakdown */}
                          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-150 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                              Required Components (per 1 unit)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                              {t.components.map(c => (
                                <div key={c.id} className="flex items-center gap-1.5 font-bold text-slate-700">
                                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                                  <span>
                                    {c.quantity}{c.unitLabel ? ` ${c.unitLabel}` : ''} × {c.componentName}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleResetDefaultTemplates}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Reset System Defaults
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setEditingTemplateId(null);
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* OPERATIONS BUSINESS-AWARE COMMUNICATION MODAL */}
      {communicationModalOrder && (
        <OperationsCommunicationModal
          isOpen={!!communicationModalOrder}
          order={communicationModalOrder}
          clients={clients}
          onClose={() => setCommunicationModalOrder(null)}
        />
      )}

    </div>
  );
}

// Helper to format item list text nicely
function itemSummaryText(items: any): string {
  if (Array.isArray(items)) {
    return items.map(i => {
      const parts = [i.colour, i.size].filter(Boolean);
      const variantStr = parts.length > 0 ? ` (${parts.join(" - ")})` : "";
      return `${i.quantity}x ${i.productName}${variantStr}`;
    }).join(", ");
  }
  return String(items || "");
}
