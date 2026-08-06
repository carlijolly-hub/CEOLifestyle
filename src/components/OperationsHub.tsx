import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { 
  OperationsOrder, 
  OperationsOrderItem,
  ProductionStatus, 
  OperationsDeliveryMethod, 
  OrderPriority, 
  Client, 
  ClientTier,
  ChecklistItem,
  ProductionChecklistTemplate
} from "../types";
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
  ShieldAlert,
  Send,
  Sparkles,
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
  Tv
} from "lucide-react";

export interface FormProductItem {
  id: string;
  productName: string;
  quantity: number;
  itemCost: number; // Cost of Order for line item (JMD $)
  details: string;
}
import UniversalPasteModal from "./UniversalPasteModal";
import { getDaysSince } from "../utils/dateHelpers";
import { getSystemSettings, saveSystemSettings, DEFAULT_CHECKLIST_TEMPLATES } from "../utils/settingsHelper";

interface OperationsHubProps {
  orders?: OperationsOrder[];
  operationsOrders?: OperationsOrder[];
  clients: Client[];
  onSaveOrder: (order: OperationsOrder) => void;
  onDeleteOrder: (orderId: string) => void;
  onNavigateToClient?: (clientId: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

const PRODUCTION_STATUSES: ProductionStatus[] = [
  "Awaiting Deposit",
  "Awaiting Artwork",
  "Ready for Production",
  "In Production",
  "Quality Check",
  "Ready for Pickup",
  "Ready for Delivery",
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

export default function OperationsHub({
  orders: propsOrders,
  operationsOrders,
  clients,
  onSaveOrder,
  onDeleteOrder,
  onNavigateToClient,
  onNavigateToTab
}: OperationsHubProps) {
  const orders = propsOrders && propsOrders.length > 0 ? propsOrders : (operationsOrders || []);
  // Board View Switcher
  const [boardView, setBoardView] = useState<"active" | "today" | "week" | "overdue" | "completed">("active");
  const [layoutMode, setLayoutMode] = useState<"grid" | "kanban">("grid");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterTier, setFilterTier] = useState<string>("All");
  const [filterDelivery, setFilterDelivery] = useState<string>("All");
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [filterStaff, setFilterStaff] = useState<string>("All");

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OperationsOrder | null>(null);
  const [printableJobSheetOrder, setPrintableJobSheetOrder] = useState<OperationsOrder | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);

  // Manage Checklist Templates Modal State
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);

  const isAnyModalOpen = !!(isFormOpen || isPasteModalOpen || printableJobSheetOrder || isTemplateManagerOpen);
  useBodyScrollLock(isAnyModalOpen);

  const handleConfirmPasteOrders = (pastedOrders: OperationsOrder[]) => {
    if (pastedOrders.length === 0) return;
    pastedOrders.forEach(o => onSaveOrder(o));
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

  const [formDueDate, setFormDueDate] = useState("");
  const [formProductionStatus, setFormProductionStatus] = useState<ProductionStatus>("Ready for Production");
  const [formDeliveryMethod, setFormDeliveryMethod] = useState<OperationsDeliveryMethod>("Store Pickup");
  const [formDeliveryLocation, setFormDeliveryLocation] = useState("");
  const [formAssignedStaff, setFormAssignedStaff] = useState("");
  const [formPriority, setFormPriority] = useState<OrderPriority>("Normal");
  const [formInternalNotes, setFormInternalNotes] = useState("");
  const [formDepositPaid, setFormDepositPaid] = useState(true);
  const [formClientHome, setFormClientHome] = useState<string>("CEO Lifestyle");

  const handleAddProductItem = () => {
    if (formItems.length >= 10) return;
    setFormItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productName: "",
        quantity: 1,
        itemCost: 0,
        details: ""
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
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("Apparel");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newTemplateItemsText, setNewTemplateItemsText] = useState("");

  // Card expanded checklist state (track order IDs with visible checklists)
  const [expandedChecklistOrderIds, setExpandedChecklistOrderIds] = useState<Record<string, boolean>>({});

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
  const getStatusBadgeStyle = (status: ProductionStatus) => {
    switch (status) {
      case "Awaiting Deposit":
        return "bg-amber-50 text-amber-800 border-amber-200/80";
      case "Awaiting Artwork":
        return "bg-indigo-50 text-indigo-800 border-indigo-200/80";
      case "Ready for Production":
        return "bg-sky-50 text-sky-800 border-sky-200/80";
      case "In Production":
        return "bg-blue-600 text-white border-blue-700 font-bold shadow-2xs";
      case "Quality Check":
        return "bg-purple-50 text-purple-800 border-purple-200/80";
      case "Ready for Pickup":
        return "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold";
      case "Ready for Delivery":
        return "bg-teal-50 text-teal-900 border-teal-300 font-bold";
      case "Completed":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "Cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
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
      (clientName && `${c.firstName} ${c.lastName}`.toLowerCase() === clientName.toLowerCase())
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
    
    let dueTodayCount = 0;
    let overdueCount = 0;
    let readyPickupCount = 0;
    let readyDeliveryCount = 0;

    active.forEach(o => {
      if (o.dueDate) {
        const diffDays = getDaysSince(o.dueDate);
        if (diffDays === 0) dueTodayCount++;
        else if (diffDays > 0) overdueCount++;
      }
      if (o.productionStatus === "Ready for Pickup") readyPickupCount++;
      if (o.productionStatus === "Ready for Delivery") readyDeliveryCount++;
    });

    return {
      activeCount: active.length,
      dueTodayCount,
      overdueCount,
      readyPickupCount,
      readyDeliveryCount,
      completedCount: orders.filter(o => o.productionStatus === "Completed").length
    };
  }, [orders]);

  // Filtered Orders List based on view & search & filter dropdowns
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Board View Filter
      if (boardView === "active") {
        if (order.productionStatus === "Completed" || order.productionStatus === "Cancelled") return false;
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
        const q = searchQuery.toLowerCase();
        const itemsText = typeof order.items === "string" 
          ? order.items.toLowerCase()
          : order.items.map(i => i.productName).join(" ").toLowerCase();
        
        const matches = 
          order.orderNumber.toLowerCase().includes(q) ||
          order.clientName.toLowerCase().includes(q) ||
          (order.clientPhone && order.clientPhone.includes(q)) ||
          itemsText.includes(q) ||
          (order.deliveryLocation && order.deliveryLocation.toLowerCase().includes(q)) ||
          (order.internalNotes && order.internalNotes.toLowerCase().includes(q)) ||
          (order.assignedStaff && order.assignedStaff.toLowerCase().includes(q));

        if (!matches) return false;
      }

      // 3. Dropdown Filters
      if (filterStatus !== "All" && order.productionStatus !== filterStatus) return false;
      if (filterTier !== "All" && order.clientTier !== filterTier) return false;
      if (filterDelivery !== "All" && order.deliveryMethod !== filterDelivery) return false;
      if (filterPriority !== "All" && order.priority !== filterPriority) return false;
      if (filterStaff !== "All" && order.assignedStaff !== filterStaff) return false;

      return true;
    });
  }, [
    orders, 
    boardView, 
    searchQuery, 
    filterStatus, 
    filterTier, 
    filterDelivery, 
    filterPriority, 
    filterStaff, 
    todayIso
  ]);

  // Open modal to create new order
  const handleOpenCreateModal = () => {
    const nextNum = `#000${421 + orders.length}`;
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
    setFormDueDate(todayIso);
    setFormProductionStatus("Ready for Production");
    setFormDeliveryMethod("Store Pickup");
    setFormDeliveryLocation("Fresh Drip Outlet");
    setFormAssignedStaff("");
    setFormPriority("Normal");
    setFormInternalNotes("");
    setFormDepositPaid(true);
    setFormClientHome("CEO Lifestyle");

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

    setFormDueDate(order.dueDate || todayIso);
    setFormProductionStatus(order.productionStatus);
    setFormDeliveryMethod(order.deliveryMethod);
    setFormDeliveryLocation(order.deliveryLocation || "Fresh Drip Outlet");
    setFormAssignedStaff(order.assignedStaff || "");
    setFormPriority(order.priority || "Normal");
    setFormInternalNotes(order.internalNotes || "");
    setFormDepositPaid(order.depositPaid !== false);
    setFormClientHome(order.clientHome || "CEO Lifestyle");

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
      setFormClientPhone(selected.contact.phoneNumber || "");
      if (selected.clientHome) {
        setFormClientHome(selected.clientHome);
      } else if (selected.homeBrand === "Librarium Luxe") {
        setFormClientHome("Librarium Luxe");
      } else if (selected.homeBrand === "CEO Lifestyle") {
        setFormClientHome("CEO Lifestyle | Librarium Luxe");
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
      details: i.details.trim()
    }));

    // Cost of Order represents the total cost for that line item (NOT multiplied by quantity)
    const totalAmt = savedItems.reduce((acc, i) => acc + (i.unitPrice || 0), 0);
    const qtyTotal = savedItems.reduce((acc, i) => acc + (i.quantity || 1), 0);

    const savedOrder: OperationsOrder = {
      id: editingOrder ? editingOrder.id : `ORD-${Date.now()}`,
      orderNumber: formOrderNumber || `#000${Math.floor(100 + Math.random() * 900)}`,
      clientId: formClientId || "MANUAL",
      clientName: formClientName.trim(),
      clientTier: (formClientTier || "Silver") as ClientTier,
      clientPhone: formClientPhone.trim(),
      items: savedItems,
      quantityTotal: qtyTotal,
      orderDate: editingOrder?.orderDate || todayIso,
      dueDate: formDueDate || todayIso,
      productionStatus: formProductionStatus,
      deliveryMethod: formDeliveryMethod,
      deliveryLocation: formDeliveryLocation.trim() || "Fresh Drip Outlet",
      assignedStaff: formAssignedStaff.trim(),
      internalNotes: formInternalNotes.trim(),
      priority: formPriority,
      depositPaid: formDepositPaid,
      totalAmount: totalAmt,
      checklistTemplateName: hasFormChecklist ? formChecklistTemplateName : "",
      checklist: hasFormChecklist ? formChecklist : [],
      clientHome: formClientHome || "CEO Lifestyle",
      createdDate: editingOrder?.createdDate || todayIso,
      updatedDate: todayIso
    };

    onSaveOrder(savedOrder);
    setIsFormOpen(false);
  };

  // Quick Status update on card
  const handleQuickStatusUpdate = (order: OperationsOrder, newStatus: ProductionStatus) => {
    const updated = {
      ...order,
      productionStatus: newStatus,
      updatedDate: todayIso
    };
    onSaveOrder(updated);
  };

  // Quick Copy Customer & Order Details for WhatsApp / SMS
  const handleCopyOrderDetails = (order: OperationsOrder) => {
    const itemSummary = Array.isArray(order.items)
      ? order.items.map(i => `${i.quantity}x ${i.productName}`).join(", ")
      : order.items;

    const text = `*CEO LIFESTYLE OPERATIONS ORDER UPDATE*
Order Number: ${order.orderNumber}
Client: ${order.clientName} (${order.clientTier || "Silver"} Tier)
Phone: ${order.clientPhone || "N/A"}
Products: ${itemSummary}
Status: ${order.productionStatus}
Due Date: ${order.dueDate}
Delivery Method: ${order.deliveryMethod} (${order.deliveryLocation || "Office"})
Notes: ${order.internalNotes || "None"}`;

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
        </div>

        {/* Search & Select Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100">
          {/* Search bar */}
          <div className="relative sm:col-span-2 md:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search order #, client, product, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800"
            />
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
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-black text-slate-900">{order.orderNumber}</span>
                      <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${getPriorityBadgeStyle(order.priority)}`}>
                        {order.priority}
                      </span>
                    </div>

                    <div>
                      {getDueDateTag(order.dueDate, order.productionStatus)}
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 truncate">
                        <span className="font-bold text-xs text-slate-900 truncate">{order.clientName}</span>
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
                      </div>
                      {order.clientPhone && (
                        <span className="text-[10px] text-slate-500 font-medium block truncate">
                          {order.clientPhone}
                        </span>
                      )}
                    </div>

                    {order.totalAmount && order.totalAmount > 0 && (
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-slate-900 block">${order.totalAmount.toLocaleString()}</span>
                        <span className={`text-[8px] font-extrabold block ${order.depositPaid ? "text-emerald-600" : "text-amber-600"}`}>
                          {order.depositPaid ? "Deposit Paid" : "Pending"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Products Ordered */}
                  <div className="bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100/80">
                    <p className="text-[11px] font-bold text-slate-800 line-clamp-1">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Product:</span>
                      {itemSummaryText(order.items)}
                    </p>
                    {renderClientApparelBadge(order.clientId, order.clientName)}
                  </div>

                  {/* Delivery & Workflow Status */}
                  <div className="flex items-center justify-between gap-2 text-[10px] font-medium text-slate-600">
                    <div className="flex items-center gap-1 truncate">
                      {order.deliveryMethod === "Knutsford Express" ? (
                        <Truck className="w-3 h-3 text-indigo-600 shrink-0" />
                      ) : order.deliveryMethod === "Store Pickup" ? (
                        <Store className="w-3 h-3 text-emerald-600 shrink-0" />
                      ) : (
                        <Truck className="w-3 h-3 text-slate-500 shrink-0" />
                      )}
                      <span className="font-bold text-slate-900 truncate">{order.deliveryMethod}</span>
                      {order.deliveryLocation && (
                        <span className="text-slate-500 truncate">• {order.deliveryLocation}</span>
                      )}
                    </div>
                  </div>

                  {/* Production Status Selector */}
                  <div>
                    <select
                      value={order.productionStatus}
                      onChange={(e) => handleQuickStatusUpdate(order, e.target.value as ProductionStatus)}
                      className={`w-full py-1 px-2 rounded-lg text-[10px] font-extrabold border focus:outline-none transition-all cursor-pointer ${getStatusBadgeStyle(order.productionStatus)}`}
                    >
                      {PRODUCTION_STATUSES.map(status => (
                        <option key={status} value={status} className="bg-white text-slate-800 font-medium text-xs">
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Internal Notes / Staff */}
                  {order.internalNotes && (
                    <p className="text-[10px] text-slate-600 italic bg-amber-50/60 border border-amber-100/60 px-2 py-1 rounded-md line-clamp-1">
                      "{order.internalNotes}"
                    </p>
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
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-black text-slate-900">{order.orderNumber}</span>
                          <span className={`px-1.5 py-0.2 rounded border text-[8px] ${getPriorityBadgeStyle(order.priority)}`}>
                            {order.priority}
                          </span>
                        </div>

                        <div>
                          <span className="font-bold text-xs text-slate-900 block">{order.clientName}</span>
                          <p className="text-[11px] font-medium text-slate-600 line-clamp-1 mt-0.5">
                            {itemSummaryText(order.items)}
                          </p>
                          {renderClientApparelBadge(order.clientId, order.clientName)}
                        </div>

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

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>Due: {order.dueDate}</span>
                          <button
                            onClick={() => handleOpenEditModal(order)}
                            className="text-slate-800 font-bold hover:underline"
                          >
                            Edit
                          </button>
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
                      placeholder="Search Client Directory (e.g. Sir)..."
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
                    placeholder="+1 (876) 555-0101"
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

                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Client Home</label>
                  <select
                    value={formClientHome}
                    onChange={(e) => setFormClientHome(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer"
                  >
                    <option value="CEO Lifestyle">CEO Lifestyle</option>
                    <option value="Librarium Luxe">Librarium Luxe</option>
                    <option value="CEO Lifestyle | Librarium Luxe">CEO Lifestyle | Librarium Luxe</option>
                  </select>
                </div>
              </div>

              {/* Multi-Product Ordered Section (Up to 10 products) */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Products Ordered ({formItems.length}/10)
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Add up to 10 products per order. Cost of Order represents total cost for that line item.
                    </p>
                  </div>
                  {formItems.length < 10 && (
                    <button
                      type="button"
                      onClick={handleAddProductItem}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>➕ Add Product</span>
                    </button>
                  )}
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
                            placeholder="e.g. Bouquet / Hardcover Book"
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
                            placeholder="12000"
                            value={item.itemCost || ""}
                            onChange={(e) => handleUpdateProductItem(item.id, "itemCost", parseFloat(e.target.value) || 0)}
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
                            value={item.quantity}
                            onChange={(e) => handleUpdateProductItem(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          Product Notes / Specifications (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Red roses, Hardcover foil stamping, Ceramic matte finish"
                          value={item.details}
                          onChange={(e) => handleUpdateProductItem(item.id, "details", e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Form Order Total Summary Bar */}
                <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs">
                  <span>Calculated Total Order Cost:</span>
                  <span className="font-mono text-sm text-emerald-400 font-extrabold">
                    J${formItems.reduce((acc, i) => acc + (i.itemCost || 0), 0).toLocaleString()}
                    <span className="text-[10px] text-slate-400 font-normal ml-2 font-sans">
                      ({formItems.reduce((acc, i) => acc + (i.quantity || 1), 0)} items total)
                    </span>
                  </span>
                </div>
              </div>

              {/* Row 4: Due Date, Priority, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    value={formProductionStatus}
                    onChange={(e) => setFormProductionStatus(e.target.value as ProductionStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800"
                  >
                    {PRODUCTION_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
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
                    placeholder="e.g. Fresh Drip Outlet or Montego Bay Branch"
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
                    placeholder="e.g. Marcus Brown"
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
                  placeholder="Special instructions, vector artwork status, packaging requirements..."
                  value={formInternalNotes}
                  onChange={(e) => setFormInternalNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                />
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
                        <span className="text-[10px] text-slate-400 font-medium italic">
                          Arrow keys to reorder • Double click text to edit
                        </span>
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
                          placeholder="Add custom checklist item step..."
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

      {/* PRINTABLE JOB SHEET MODAL */}
      {printableJobSheetOrder && createPortal(
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl border border-slate-100 text-left relative my-auto max-h-[95vh] overflow-y-auto">
            
            {/* Modal Actions Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Production Job Sheet Ticket
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print Ticket</span>
                </button>
                <button
                  onClick={() => setPrintableJobSheetOrder(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Sheet Document */}
            <div className="space-y-6 p-4 border border-slate-200 rounded-2xl bg-white text-slate-900">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-950">CEO LIFESTYLE MANAGEMENT</h1>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Production & Workflow Job Sheet
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xl font-black text-slate-950 block">
                    {printableJobSheetOrder.orderNumber}
                  </span>
                  <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-slate-900 text-white inline-block mt-1">
                    {printableJobSheetOrder.priority} Priority
                  </span>
                </div>
              </div>

              {/* Order Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Client Name</span>
                  <span className="font-black text-slate-900 text-sm">{printableJobSheetOrder.clientName}</span>
                  <span className="text-[10px] font-bold text-slate-500 block">Tier: {printableJobSheetOrder.clientTier || "Silver"}</span>
                </div>

                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Phone Contact</span>
                  <span className="font-bold text-slate-900">{printableJobSheetOrder.clientPhone || "N/A"}</span>
                </div>

                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Target Due Date</span>
                  <span className="font-black text-rose-700 text-sm">{printableJobSheetOrder.dueDate}</span>
                </div>

                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Delivery Method</span>
                  <span className="font-bold text-slate-900">{printableJobSheetOrder.deliveryMethod}</span>
                </div>

                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Delivery Location</span>
                  <span className="font-bold text-slate-900">{printableJobSheetOrder.deliveryLocation || "Office"}</span>
                </div>

                <div>
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Assigned Staff</span>
                  <span className="font-bold text-slate-900">{printableJobSheetOrder.assignedStaff || "Unassigned"}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Job Specifications & Items</h4>
                <table className="w-full text-xs text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                      <th className="p-2 border-r border-slate-200">Item Description</th>
                      <th className="p-2 border-r border-slate-200 text-center w-16">Qty</th>
                      <th className="p-2 border-r border-slate-200 text-right">Unit Cost</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(printableJobSheetOrder.items) ? (
                      printableJobSheetOrder.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="p-2 border-r border-slate-200 font-bold">
                            {item.productName}
                            {item.details && <span className="block text-[10px] text-slate-500 font-normal">{item.details}</span>}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold">{item.quantity}</td>
                          <td className="p-2 border-r border-slate-200 text-right">${(item.unitPrice || 0).toLocaleString()}</td>
                          <td className="p-2 text-right font-bold">${((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b border-slate-200">
                        <td className="p-2 border-r border-slate-200 font-bold">{printableJobSheetOrder.items}</td>
                        <td className="p-2 border-r border-slate-200 text-center font-bold">{printableJobSheetOrder.quantityTotal}</td>
                        <td className="p-2 border-r border-slate-200 text-right">-</td>
                        <td className="p-2 text-right font-bold">${(printableJobSheetOrder.totalAmount || 0).toLocaleString()}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Quality Checklist */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Production Checklist & Inspection</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg">
                    <input type="checkbox" className="w-4 h-4 rounded text-slate-900" defaultChecked={printableJobSheetOrder.depositPaid} />
                    <span className="font-bold">50% Deposit Received</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg">
                    <input type="checkbox" className="w-4 h-4 rounded text-slate-900" />
                    <span className="font-bold">Artwork Vector Confirmed</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg">
                    <input type="checkbox" className="w-4 h-4 rounded text-slate-900" />
                    <span className="font-bold">Materials Prepped</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg">
                    <input type="checkbox" className="w-4 h-4 rounded text-slate-900" />
                    <span className="font-bold">Production Run Passed QC</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg">
                    <input type="checkbox" className="w-4 h-4 rounded text-slate-900" />
                    <span className="font-bold">Packaged & Labeled</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg">
                    <input type="checkbox" className="w-4 h-4 rounded text-slate-900" />
                    <span className="font-bold">Dispatched / Pickup Ready</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              {printableJobSheetOrder.internalNotes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <span className="font-extrabold block uppercase text-[9px] text-amber-700 tracking-wider">Special Production Notes</span>
                  <p className="font-medium mt-0.5">{printableJobSheetOrder.internalNotes}</p>
                </div>
              )}

              {/* Sign-off line */}
              <div className="pt-6 flex items-end justify-between border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-widest">Quality Inspector Sign-off</span>
                  <div className="w-48 border-b-2 border-slate-400 mt-6" />
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-widest">Dispatch Waybill Ref</span>
                  <div className="w-48 border-b-2 border-slate-400 mt-6" />
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

    </div>
  );
}

// Helper to format item list text nicely
function itemSummaryText(items: any): string {
  if (Array.isArray(items)) {
    return items.map(i => `${i.quantity}x ${i.productName}`).join(", ");
  }
  return String(items || "");
}
