import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  MessageSquareQuote,
  Search,
  Plus,
  Copy,
  Check,
  RotateCcw,
  Edit3,
  Trash2,
  FileText,
  DollarSign,
  ShoppingBag,
  Users,
  Calendar,
  Hammer,
  BookOpen,
  X,
  ShieldCheck,
  Filter,
  Truck,
  PlusCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Tag,
  Sparkles,
  MapPin
} from "lucide-react";
import { SystemSettings, SystemQuoteTemplate, DeliveryMethod, OS_LOCATIONS, OSLocation } from "../types";
import { DEFAULT_QUOTE_TEMPLATES, DEFAULT_DELIVERY_METHODS, formatQuoteTemplate, getActiveOrderClientInfo } from "../utils/settingsHelper";
import TemplateBlockViewer from "./common/TemplateBlockViewer";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

interface CommunicationsLibraryProps {
  settings: SystemSettings;
  onUpdateSettings: (field: keyof SystemSettings, value: any) => void;
  isMasterAdmin?: boolean;
  initialCategory?: string;
}

export interface CategoryDefinition {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

// Logical High-Level Categories mapping 100% of existing templates including Order Details
export const CATEGORIES: CategoryDefinition[] = [
  {
    id: "ORDER_DETAILS",
    label: "Order Details",
    shortLabel: "ORDER DETAILS",
    icon: ShoppingBag,
    description: "Client-facing Order Details copy & paste messages organized by company"
  },
  {
    id: "CLIENT",
    label: "Client Communications",
    shortLabel: "CLIENT MESSAGES",
    icon: Users,
    description: "Client care, welcome greetings, follow-up check-ins & relationship outreach"
  },
  {
    id: "QUOTES",
    label: "Quotes & Estimates",
    shortLabel: "QUOTES",
    icon: DollarSign,
    description: "Production quotes, bespoke proposals & client pricing estimates"
  },
  {
    id: "BILLS",
    label: "Bills & Invoices",
    shortLabel: "BILLS & INVOICES",
    icon: FileText,
    description: "Official invoice presentation, bill copies & statements of account"
  },
  {
    id: "PAYMENTS",
    label: "Payments & Receipts",
    shortLabel: "PAYMENTS",
    icon: ShieldCheck,
    description: "Deposit requests, payment receipts, balance due & banking details"
  },
  {
    id: "ORDERS",
    label: "Orders & Fulfillment",
    shortLabel: "ORDERS",
    icon: ShoppingBag,
    description: "Order confirmations, production progress updates & job completions"
  },
  {
    id: "DELIVERY",
    label: "Delivery & Collection",
    shortLabel: "DELIVERY & PICKUP",
    icon: Truck,
    description: "Courier dispatch notices, pickup depot guidelines & courier rates"
  },
  {
    id: "EVENTS",
    label: "Events & Staging",
    shortLabel: "EVENTS",
    icon: Calendar,
    description: "Event booking confirmations, staging agreements & VIP concierge notes"
  },
  {
    id: "PRODUCTION",
    label: "Production & Operations",
    shortLabel: "PRODUCTION",
    icon: Hammer,
    description: "Production job orders, material specifications & work tickets"
  },
  {
    id: "LIBRARIUM LUXE",
    label: "Librarium Luxe",
    shortLabel: "LIBRARIUM LUXE",
    icon: BookOpen,
    description: "Curatorial correspondence, book acquisition & archival vault notices"
  },
  {
    id: "DOCUMENTS",
    label: "Documents & Terms",
    shortLabel: "DOCUMENTS & TERMS",
    icon: FileText,
    description: "Official company terms, standard conditions & legal disclosures"
  },
  {
    id: "GENERAL",
    label: "General Notices",
    shortLabel: "GENERAL NOTICES",
    icon: MessageSquareQuote,
    description: "Company announcements, seasonal holiday notices & broadcast messages"
  },
];

const BRAND_FILTERS = [
  { id: "ALL", label: "All Brands" },
  { id: "CEO Lifestyle", label: "CEO Lifestyle / Print" },
  { id: "Librarium Luxe", label: "Librarium Luxe" },
];

const LOCATION_FILTERS = [
  { id: "ALL", label: "All Locations" },
  ...OS_LOCATIONS.map(loc => ({ id: loc, label: loc }))
];

// Rich sample data dictionary used for realistic live preview rendering
const PREVIEW_SAMPLE_DATA: Record<string, string | number> = {
  CustomerName: "Johnathan Sterling",
  ClientName: "Johnathan Sterling",
  client_name: "Johnathan Sterling",
  clientName: "Johnathan Sterling",
  CustomerResponse: "Thank you so much for reaching out to CEO Lifestyle.",
  BusinessName: "CEO Lifestyle Management",
  company_name: "CEO Lifestyle Management",
  BusinessPhone: "+1 (876) 555-0199",
  BusinessEmail: "concierge@ceolifestyle.com",
  OrderNumber: "ORD-84920",
  order_number: "ORD-84920",
  QuoteNumber: "QT-2026-948",
  quote_number: "QT-2026-948",
  InvoiceNumber: "INV-2026-0819",
  invoice_number: "INV-2026-0819",
  ReceiptNumber: "REC-77341",
  receipt_number: "REC-77341",
  QuoteDate: "2026-07-24",
  DueDate: "2026-07-31",
  dueDate: "2026-07-31",
  TargetDueDate: "2026-07-31",
  EventDate: "2026-08-15",
  ItemTitle: "Executive Embroidered Polos & Custom Hardcover Editions",
  GarmentItems: "* 15 Adult Luxury Polos (Navy) @ JMD 3,500 each = JMD 52,500\n* 5 Adult Luxury Polos (White) @ JMD 3,500 each = JMD 17,500",
  BookTitle: "The Sovereign Mindset: Principles of Modern Leadership",
  BooksList: "* 5 Copies — The Sovereign Mindset (Deluxe Leather Edition) @ JMD 8,500 each = JMD 42,500\n* 3 Copies — Architecture of Luxury (Hardcover) @ JMD 9,000 each = JMD 27,000",
  Product: "Executive Embroidered Luxury Polos",
  ItemDescription: "Heavyweight 240 GSM Luxury Cotton Tee with Custom Ribbed Collar",
  Color: "Black",
  SubstituteColor: "Navy Blue",
  Size: "XL",
  Customization: "Front Chest Gold Foil + Sleeve Crest Embroidery",
  BookPrice: "JMD 8,500",
  BundleInfo: "3-Volume Collector's Boxed Set with Custom Slipcase",
  Availability: "In Stock — Ready for Dispatch",
  DeliveryInfo: "Courier Dispatch via Knutsford Express",
  PaymentInfo: "50% Deposit Paid (JMD $35,250), Balance Due upon Delivery",
  OrderTotal: "JMD 70,500",
  DepositPaid: "JMD 35,250",
  Phone: "+1 (876) 555-0199",
  ClientPhone: "+1 (876) 555-0199",
  Quantity: 20,
  QuantityUnit: "Units",
  UnitPrice: "JMD 3,500",
  Subtotal: "JMD 70,000",
  BooksSubtotal: "JMD 69,500",
  PrintSize: '12" × 10" Front Chest Embroidery',
  MaterialName: "Card Stock (A4) 350 GSM Silk Coated",
  SheetSpecs: "12 x 18 in • 24 Ups per Sheet",
  ParishLocation: "Kingston & St. Andrew (Executive Suite Staging)",
  ServiceTier: "VIP Event Setup & Full Concierge Logistics",
  DeliveryMethod: "Knutsford Express",
  deliveryMethod: "Knutsford Express",
  DeliveryCharge: "JMD 1,500",
  DeliveryMessage: "Your order will be dispatched via Knutsford Express. Waybill tracking details will be communicated upon dispatch.",
  PickupLocation: "Kingston Main Headquarters (Mon-Fri 9AM-5PM)",
  Location: "Kingston",
  location: "Kingston",
  Destination: "Kingston",
  TargetDestination: "Kingston",
  AdditionalCharges: "* Custom Digitizing & Embroidery Setup – JMD 3,000\n* Priority Rush Production Service – JMD 4,500",
  DiscountPercent: 10,
  DiscountAmount: "JMD 7,000",
  GrandTotal: "JMD 70,500",
  total_amount: "JMD 70,500",
  DepositAmount: "JMD 35,250",
  deposit_amount: "JMD 35,250",
  BalanceDue: "JMD 35,250",
  balance_due: "JMD 35,250",
  ProductionStatus: "Embroidering & Quality Finishing",
  ClientTier: "Platinum VIP Corporate",
  Priority: "High Priority Rush",
  AssignedStaff: "Marcus & Production Crew Alpha",
  StockStatus: "In Stock (Archival Vault)",
  TermsAndConditions: "1. 50% deposit required prior to production commencement.\n2. Final balance due upon delivery or collection.\n3. Turnaround time begins upon artwork approval.",
  InternalNotes: "Client requested matte thread finish. Double-check sleeve crest placement before packaging."
};

// Common reusable placeholder chips for quick insertion
const COMMON_PLACEHOLDERS = [
  { tag: "{ClientName}", label: "Client / Customer Name" },
  { tag: "{DeliveryMethod}", label: "Delivery Method" },
  { tag: "{Location}", label: "Location" },
  { tag: "{OrderNumber}", label: "Order #" },
  { tag: "{QuoteDate}", label: "Quote Date" },
  { tag: "{DueDate}", label: "Due Date" },
  { tag: "{GrandTotal}", label: "Grand Total" },
  { tag: "{DepositAmount}", label: "Deposit (50%)" },
  { tag: "{BalanceDue}", label: "Balance Due" },
  { tag: "{PickupLocation}", label: "Pickup Location" },
  { tag: "{BusinessName}", label: "Business Name" },
  { tag: "{InvoiceNumber}", label: "Invoice #" },
  { tag: "{ReceiptNumber}", label: "Receipt #" },
  { tag: "{ProductionStatus}", label: "Prod. Status" },
  { tag: "{BookTitle}", label: "Book Title" },
  { tag: "{GarmentItems}", label: "Garment Items" },
  { tag: "{EventDate}", label: "Event Date" },
];

// Scoped variable suggestions per category for high clarity
export const CATEGORY_SCOPED_PLACEHOLDERS: Record<string, { tag: string; label: string }[]> = {
  ORDER_DETAILS: [
    { tag: "{ClientName}", label: "Client Name" },
    { tag: "{OrderNumber}", label: "Order Number" },
    { tag: "{Product}", label: "Product" },
    { tag: "{ItemDescription}", label: "Item Description" },
    { tag: "{Quantity}", label: "Quantity" },
    { tag: "{Color}", label: "Color" },
    { tag: "{SubstituteColor}", label: "Substitute Color" },
    { tag: "{Size}", label: "Size" },
    { tag: "{Customization}", label: "Customization" },
    { tag: "{DeliveryMethod}", label: "Delivery Method" },
    { tag: "{Location}", label: "Location" },
    { tag: "{OrderTotal}", label: "Order Total" },
    { tag: "{DepositPaid}", label: "Deposit Paid" },
    { tag: "{BalanceDue}", label: "Balance Due" },
    { tag: "{DueDate}", label: "Due Date" },
    { tag: "{BookTitle}", label: "Book Title (Luxe)" },
    { tag: "{BookPrice}", label: "Book Price (Luxe)" },
    { tag: "{BundleInfo}", label: "Bundle Info (Luxe)" },
    { tag: "{Availability}", label: "Availability (Luxe)" },
    { tag: "{DeliveryInfo}", label: "Delivery Info (Luxe)" },
    { tag: "{PaymentInfo}", label: "Payment Info (Luxe)" },
    { tag: "{Phone}", label: "Phone" },
    { tag: "{BusinessName}", label: "Business Name" }
  ],
  CLIENT: [
    { tag: "{ClientName}", label: "Client / Customer Name" },
    { tag: "{BusinessName}", label: "Business Name" },
    { tag: "{BusinessPhone}", label: "Business Phone" },
    { tag: "{BusinessEmail}", label: "Business Email" },
    { tag: "{ItemTitle}", label: "Item / Service Title" },
  ],
  DELIVERY: [
    { tag: "{ClientName}", label: "Client / Customer Name" },
    { tag: "{DeliveryMethod}", label: "Delivery Method" },
    { tag: "{Location}", label: "Location" },
    { tag: "{OrderNumber}", label: "Order #" },
    { tag: "{DueDate}", label: "Scheduled Dispatch / Due Date" },
    { tag: "{DeliveryMessage}", label: "Delivery Notes" },
    { tag: "{PickupLocation}", label: "Pickup Location" },
    { tag: "{BusinessName}", label: "Business Name" },
  ],
  QUOTES: [
    { tag: "{ClientName}", label: "Client / Customer Name" },
    { tag: "{ItemTitle}", label: "Item / Service Title" },
    { tag: "{GrandTotal}", label: "Grand Total" },
    { tag: "{DepositAmount}", label: "Deposit (50%)" },
    { tag: "{DeliveryMethod}", label: "Delivery Method" },
    { tag: "{Location}", label: "Location" },
    { tag: "{QuoteNumber}", label: "Quote #" },
    { tag: "{QuoteDate}", label: "Quote Date" },
    { tag: "{BusinessName}", label: "Business Name" },
  ],
  ORDERS: [
    { tag: "{ClientName}", label: "Client / Customer Name" },
    { tag: "{OrderNumber}", label: "Order #" },
    { tag: "{GrandTotal}", label: "Grand Total" },
    { tag: "{DeliveryMethod}", label: "Delivery Method" },
    { tag: "{Location}", label: "Location" },
    { tag: "{DueDate}", label: "Due Date" },
    { tag: "{ProductionStatus}", label: "Prod. Status" },
    { tag: "{BusinessName}", label: "Business Name" },
  ],
  BILLS: [
    { tag: "{ClientName}", label: "Client / Customer Name" },
    { tag: "{InvoiceNumber}", label: "Invoice #" },
    { tag: "{ReceiptNumber}", label: "Receipt #" },
    { tag: "{GrandTotal}", label: "Total Amount" },
    { tag: "{DepositAmount}", label: "Deposit Paid" },
    { tag: "{BalanceDue}", label: "Balance Due" },
    { tag: "{BusinessName}", label: "Business Name" },
  ],
  PAYMENTS: [
    { tag: "{ClientName}", label: "Client / Customer Name" },
    { tag: "{ReceiptNumber}", label: "Receipt #" },
    { tag: "{InvoiceNumber}", label: "Invoice #" },
    { tag: "{GrandTotal}", label: "Total Amount" },
    { tag: "{DepositAmount}", label: "Deposit Paid" },
    { tag: "{BalanceDue}", label: "Balance Due" },
    { tag: "{BusinessName}", label: "Business Name" },
  ],
  EVENTS: [
    { tag: "{ClientName}", label: "Client / Customer Name" },
    { tag: "{EventDate}", label: "Event Date" },
    { tag: "{GrandTotal}", label: "Grand Total" },
    { tag: "{DeliveryMethod}", label: "Delivery Method" },
    { tag: "{Location}", label: "Location" },
    { tag: "{BusinessName}", label: "Business Name" },
  ],
  PRODUCTION: [
    { tag: "{ClientName}", label: "Client / Customer Name" },
    { tag: "{OrderNumber}", label: "Order #" },
    { tag: "{ItemTitle}", label: "Item Title" },
    { tag: "{PrintSize}", label: "Print Specs" },
    { tag: "{MaterialName}", label: "Material" },
    { tag: "{DueDate}", label: "Due Date" },
    { tag: "{ProductionStatus}", label: "Prod. Status" },
  ],
  "LIBRARIUM LUXE": [
    { tag: "{ClientName}", label: "Client / Customer Name" },
    { tag: "{BookTitle}", label: "Book Title" },
    { tag: "{BooksList}", label: "Books List" },
    { tag: "{GrandTotal}", label: "Grand Total" },
    { tag: "{DeliveryMethod}", label: "Delivery Method" },
    { tag: "{Location}", label: "Location" },
    { tag: "{BusinessName}", label: "Business Name" },
  ],
  DOCUMENTS: [
    { tag: "{ClientName}", label: "Client / Customer Name" },
    { tag: "{OrderNumber}", label: "Order #" },
    { tag: "{BusinessName}", label: "Business Name" },
    { tag: "{BusinessPhone}", label: "Phone" },
    { tag: "{BusinessEmail}", label: "Email" },
    { tag: "{TermsAndConditions}", label: "Terms & Conditions" },
  ],
  GENERAL: [
    { tag: "{ClientName}", label: "Client / Customer Name" },
    { tag: "{BusinessName}", label: "Business Name" },
    { tag: "{BusinessPhone}", label: "Phone" },
    { tag: "{BusinessEmail}", label: "Email" },
  ],
};

function isBillOrInvoice(tpl: SystemQuoteTemplate): boolean {
  const dt = (tpl.documentType || "").toLowerCase();
  const name = (tpl.name || "").toLowerCase();
  return (
    dt === "invoice" ||
    dt === "bill" ||
    dt === "statement" ||
    name.includes("invoice presentation copy") ||
    name.includes("bill presentation copy") ||
    name.includes("statement of account copy")
  );
}

function matchesCategory(tpl: SystemQuoteTemplate, catId: string): boolean {
  const cat = (tpl.category || "").toUpperCase();
  const docType = (tpl.documentType || "").toLowerCase();

  if (catId === "ORDER_DETAILS" || catId === "ORDER DETAILS") {
    return cat === "ORDER DETAILS" || cat === "ORDER_DETAILS" || docType === "order_details" || cat.includes("ORDER DETAIL");
  }
  if (catId === "CLIENT") return cat === "CLIENT" || cat.includes("CUSTOMER");
  if (catId === "QUOTES") return cat === "SALES" || cat === "QUOTES" || cat.includes("QUOTE");
  if (catId === "BILLS") return (cat === "PAYMENTS" && isBillOrInvoice(tpl)) || cat === "BILLS" || isBillOrInvoice(tpl);
  if (catId === "PAYMENTS") return (cat === "PAYMENTS" && !isBillOrInvoice(tpl)) || cat === "PAYMENT";
  if (catId === "ORDERS") return (cat === "ORDERS" || cat.includes("ORDER")) && docType !== "order_details" && cat !== "ORDER DETAILS" && cat !== "ORDER_DETAILS";
  if (catId === "DELIVERY") return cat === "DELIVERY" || cat.includes("DELIVERY") || cat.includes("COLLECTION");
  if (catId === "EVENTS") return cat === "EVENTS" || cat.includes("EVENT");
  if (catId === "PRODUCTION") return cat === "PRODUCTION" || cat.includes("PROD");
  if (catId === "LIBRARIUM LUXE") return cat === "LIBRARIUM LUXE" || cat.includes("LIBRA") || cat.includes("BOOK");
  if (catId === "DOCUMENTS") return cat === "DOCUMENTS" || cat.includes("DOC") || cat.includes("TERM");
  if (catId === "GENERAL") return cat === "GENERAL" || cat === "OTHER" || cat.includes("NOTICE");
  return false;
}

export const CommunicationsLibrary: React.FC<CommunicationsLibraryProps> = ({
  settings,
  onUpdateSettings,
  isMasterAdmin = true,
  initialCategory
}) => {
  // Normalize initialCategory to match an existing category, or default to ORDER_DETAILS
  const defaultCategory = useMemo(() => {
    if (initialCategory) {
      const match = CATEGORIES.find((c) => c.id === initialCategory || c.id === initialCategory.toUpperCase());
      if (match) return match.id;
    }
    return "ORDER_DETAILS";
  }, [initialCategory]);

  const [activeCategory, setActiveCategory] = useState<string>(defaultCategory);
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [selectedLocation, setSelectedLocation] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [deliverySubTab, setDeliverySubTab] = useState<"templates" | "methods">("templates");

  // Selected template ID for focused preview
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Preview mode: "rendered" (realistic client preview) vs "source" (raw variables)
  const [previewMode, setPreviewMode] = useState<"rendered" | "source">("rendered");

  // Mobile view toggle: "templates" vs "preview"
  const [mobileTab, setMobileTab] = useState<"templates" | "preview">("templates");

  // Editing modal state
  const [editingTemplate, setEditingTemplate] = useState<SystemQuoteTemplate | null>(null);
  const [editorTab, setEditorTab] = useState<"edit" | "preview">("edit");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New template modal state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<SystemQuoteTemplate>>({
    name: "",
    category: "ORDER_DETAILS",
    company: "CEO Lifestyle",
    businessHome: "CEO Lifestyle",
    location: "Operations Dashboard",
    documentType: "message",
    description: "",
    content: "",
    active: true
  });

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Lock body scroll when editing or creating modals are open
  const isAnyModalOpen = Boolean(editingTemplate || isCreatingNew);
  useBodyScrollLock(isAnyModalOpen);

  // Master active templates list from settings or factory defaults
  const templates: SystemQuoteTemplate[] = useMemo(() => {
    return settings.quoteTemplates && settings.quoteTemplates.length > 0
      ? settings.quoteTemplates
      : DEFAULT_QUOTE_TEMPLATES;
  }, [settings.quoteTemplates]);

  // Delivery methods list from settings or defaults
  const deliveryMethodsList: DeliveryMethod[] = useMemo(() => {
    return settings.deliveryMethods && settings.deliveryMethods.length > 0
      ? settings.deliveryMethods
      : DEFAULT_DELIVERY_METHODS;
  }, [settings.deliveryMethods]);

  const notifySuccess = (message: string) => {
    setActionSuccess(message);
    setTimeout(() => setActionSuccess(null), 3200);
  };

  // Carousel Category Navigation Math
  const activeCategoryIndex = useMemo(() => {
    const idx = CATEGORIES.findIndex((c) => c.id === activeCategory);
    return idx >= 0 ? idx : 0;
  }, [activeCategory]);

  const activeCategoryDef = CATEGORIES[activeCategoryIndex] || CATEGORIES[0];
  const CategoryIcon = activeCategoryDef.icon;

  const prevCategoryDef = CATEGORIES[(activeCategoryIndex - 1 + CATEGORIES.length) % CATEGORIES.length];
  const nextCategoryDef = CATEGORIES[(activeCategoryIndex + 1) % CATEGORIES.length];

  const handlePrevCategory = () => {
    const prevIdx = (activeCategoryIndex - 1 + CATEGORIES.length) % CATEGORIES.length;
    setActiveCategory(CATEGORIES[prevIdx].id);
  };

  const handleNextCategory = () => {
    const nextIdx = (activeCategoryIndex + 1) % CATEGORIES.length;
    setActiveCategory(CATEGORIES[nextIdx].id);
  };

  // Filter templates for the ACTIVE CATEGORY ONLY
  const categoryTemplates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return templates.filter((tpl) => {
      // Must match active category
      if (!matchesCategory(tpl, activeCategory)) return false;

      // Brand / Company filter
      if (selectedBrand !== "ALL") {
        const bComp = (tpl.company || tpl.businessHome || "All").toLowerCase();
        if (bComp !== "all" && bComp !== "both" && !bComp.includes(selectedBrand.toLowerCase())) {
          return false;
        }
      }

      // Location filter
      if (selectedLocation !== "ALL") {
        const loc = (tpl.location || "").toLowerCase();
        if (!loc.includes(selectedLocation.toLowerCase())) {
          return false;
        }
      }

      // Search query within category
      if (q) {
        const inName = tpl.name.toLowerCase().includes(q);
        const inDesc = (tpl.description || "").toLowerCase().includes(q);
        const inContent = tpl.content.toLowerCase().includes(q);
        const inPlaceholders = (tpl.placeholders || []).some((p) => p.toLowerCase().includes(q));
        if (!inName && !inDesc && !inContent && !inPlaceholders) return false;
      }

      return true;
    });
  }, [templates, activeCategory, selectedBrand, selectedLocation, searchQuery]);

  // Keep selectedTemplateId valid for active category
  useEffect(() => {
    if (categoryTemplates.length > 0) {
      const exists = categoryTemplates.some((t) => t.id === selectedTemplateId);
      if (!exists) {
        setSelectedTemplateId(categoryTemplates[0].id);
      }
    } else {
      setSelectedTemplateId(null);
    }
  }, [categoryTemplates, selectedTemplateId]);

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) return categoryTemplates[0] || null;
    return categoryTemplates.find((t) => t.id === selectedTemplateId) || categoryTemplates[0] || null;
  }, [categoryTemplates, selectedTemplateId]);

  // Save template updates
  const handleSaveTemplate = (updated: SystemQuoteTemplate) => {
    const updatedList = templates.map((tpl) => (tpl.id === updated.id ? updated : tpl));
    onUpdateSettings("quoteTemplates", updatedList);
    setEditingTemplate(null);
    notifySuccess(`Saved changes to "${updated.name}"`);
  };

  // Restore factory default wording for single template
  const handleRestoreDefault = (templateId: string) => {
    const defaultTemplate = DEFAULT_QUOTE_TEMPLATES.find((t) => t.id === templateId);
    if (!defaultTemplate) return;

    const updatedList = templates.map((tpl) => (tpl.id === templateId ? { ...defaultTemplate } : tpl));
    onUpdateSettings("quoteTemplates", updatedList);
    if (editingTemplate && editingTemplate.id === templateId) {
      setEditingTemplate({ ...defaultTemplate });
    }
    notifySuccess(`Restored "${defaultTemplate.name}" to factory default wording`);
  };

  // Restore entire library to system defaults
  const handleRestoreAllDefaults = () => {
    if (
      !window.confirm(
        "Are you sure you want to restore the entire Communications Library to system defaults? Any custom edits on default templates will be reset."
      )
    ) {
      return;
    }
    onUpdateSettings("quoteTemplates", DEFAULT_QUOTE_TEMPLATES);
    notifySuccess("Reset all templates to factory defaults");
  };

  // Duplicate a template
  const handleDuplicateTemplate = (template: SystemQuoteTemplate) => {
    const newId = `tpl_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const duplicate: SystemQuoteTemplate = {
      ...template,
      id: newId,
      name: `${template.name} (Copy)`,
      isDefault: false,
    };
    const updatedList = [duplicate, ...templates];
    onUpdateSettings("quoteTemplates", updatedList);
    setSelectedTemplateId(newId);
    notifySuccess(`Duplicated "${template.name}"`);
  };

  // Delete custom template
  const handleDeleteTemplate = (templateId: string, name: string) => {
    if (!window.confirm(`Delete the custom template "${name}"?`)) return;
    const updatedList = templates.filter((tpl) => tpl.id !== templateId);
    onUpdateSettings("quoteTemplates", updatedList);
    notifySuccess(`Deleted template "${name}"`);
  };

  // Create new custom template
  const handleCreateNewTemplate = () => {
    if (!newTemplate.name?.trim()) {
      alert("Please provide a name for this template.");
      return;
    }
    if (!newTemplate.content?.trim()) {
      alert("Please provide content for this template.");
      return;
    }

    const created: SystemQuoteTemplate = {
      id: `tpl_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newTemplate.name.trim(),
      category: newTemplate.category || activeCategory,
      businessHome: newTemplate.businessHome || "All",
      company: newTemplate.company || (newTemplate.businessHome === "Librarium Luxe" ? "Librarium Luxe" : newTemplate.businessHome === "CEO Lifestyle" ? "CEO Lifestyle" : "Both"),
      location: newTemplate.location || "Operations Dashboard",
      documentType: newTemplate.documentType || "message",
      description: newTemplate.description?.trim() || "Custom communication template",
      content: newTemplate.content.trim(),
      placeholders: extractPlaceholders(newTemplate.content),
      active: true,
      isDefault: false
    };

    const updatedList = [created, ...templates];
    onUpdateSettings("quoteTemplates", updatedList);
    setIsCreatingNew(false);
    setSelectedTemplateId(created.id);
    setNewTemplate({
      name: "",
      category: activeCategory,
      businessHome: "CEO Lifestyle",
      company: "CEO Lifestyle",
      location: "Operations Dashboard",
      documentType: "message",
      description: "",
      content: "",
      active: true
    });
    notifySuccess(`Created custom template "${created.name}"`);
  };

  // Extract placeholders helper
  const extractPlaceholders = (text: string): string[] => {
    const matches = text.match(/\{[a-zA-Z0-9_]+\}|\{\{[a-zA-Z0-9_]+\}\}/g) || [];
    return Array.from(new Set(matches));
  };

  // Insert placeholder into current textarea
  const insertPlaceholderIntoTextarea = (
    placeholder: string,
    currentContent: string,
    setContent: (val: string) => void
  ) => {
    if (!textareaRef.current) {
      setContent(currentContent + ` ${placeholder}`);
      return;
    }
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = currentContent.substring(0, start);
    const after = currentContent.substring(end);
    const newContent = before + placeholder + after;
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 50);
  };

  // Connected Order & Client Information state
  const [useActiveOrderData, setUseActiveOrderData] = useState<boolean>(true);
  const [showAllPlaceholders, setShowAllPlaceholders] = useState<boolean>(false);
  const [activeOrderInfo, setActiveOrderInfo] = useState(() => getActiveOrderClientInfo());

  // Periodically refresh active order info from localStorage
  useEffect(() => {
    const handleStorage = () => {
      setActiveOrderInfo(getActiveOrderClientInfo());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const hasActiveOrderInfo = Boolean(
    activeOrderInfo.clientName || activeOrderInfo.deliveryMethod || activeOrderInfo.location
  );

  const effectivePreviewData = useMemo(() => {
    if (useActiveOrderData && hasActiveOrderInfo) {
      return {
        ...PREVIEW_SAMPLE_DATA,
        CustomerName: activeOrderInfo.clientName || "",
        ClientName: activeOrderInfo.clientName || "",
        client_name: activeOrderInfo.clientName || "",
        clientName: activeOrderInfo.clientName || "",
        DeliveryMethod: activeOrderInfo.deliveryMethod || "",
        deliveryMethod: activeOrderInfo.deliveryMethod || "",
        Location: activeOrderInfo.location || "",
        location: activeOrderInfo.location || "",
        Destination: activeOrderInfo.location || "",
        TargetDestination: activeOrderInfo.location || "",
        PickupLocation: activeOrderInfo.location || PREVIEW_SAMPLE_DATA.PickupLocation
      };
    }
    return PREVIEW_SAMPLE_DATA;
  }, [useActiveOrderData, hasActiveOrderInfo, activeOrderInfo]);

  // Copy sample preview to clipboard
  const handleCopySample = (template: SystemQuoteTemplate) => {
    const rendered = formatQuoteTemplate(template.content, effectivePreviewData);
    navigator.clipboard.writeText(rendered);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Delivery methods handlers
  const handleUpdateDeliveryMethods = (updated: DeliveryMethod[]) => {
    onUpdateSettings("deliveryMethods", updated);
    notifySuccess("Delivery & collection methods updated.");
  };

  const handleAddDeliveryMethod = () => {
    const newMethod: DeliveryMethod = {
      id: "del_" + Date.now(),
      name: "New Courier / Method",
      type: "delivery",
      defaultCost: 1200,
      active: true,
      messageTemplate: "Your order will be dispatched via local courier.\n\nTracking details will be provided upon shipment.",
      estimatedTime: "1-2 Days",
      notes: "Added method"
    };
    handleUpdateDeliveryMethods([newMethod, ...deliveryMethodsList]);
  };

  const handleResetDeliveryMethods = () => {
    if (window.confirm("Reset all delivery methods to system default settings?")) {
      handleUpdateDeliveryMethods(DEFAULT_DELIVERY_METHODS);
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-5 text-left" id="communications_library_workspace">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR: TITLE, CONTEXT, AND COMPACT UTILITY CONTROLS           */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-2xl shadow-2xs">
              <MessageSquareQuote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Communications Library
                </h2>
                {isMasterAdmin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800">
                    <ShieldCheck className="w-3 h-3" />
                    Master Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Centralized client communications, billing documents, quotation copy, and operational messages.
              </p>
            </div>
          </div>

          {/* Action Buttons: New Template & Reset */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => {
                setNewTemplate((prev) => ({ ...prev, category: activeCategory }));
                setIsCreatingNew(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Template</span>
            </button>
            <button
              type="button"
              onClick={handleRestoreAllDefaults}
              title="Reset all templates to factory defaults"
              className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Action Flash Alert */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Search & Brand Filter Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${activeCategoryDef.label}...`}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 self-start md:self-auto">
            {/* Brand / Company Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Brand:
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {BRAND_FILTERS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBrand(b.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedBrand === b.id
                        ? "bg-white text-indigo-700 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Operational Location Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-600" />
                Location:
              </span>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all cursor-pointer"
                title="Filter templates by operational location"
              >
                {LOCATION_FILTERS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.label}
                  </option>
                ))}
              </select>
              {selectedLocation !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedLocation("ALL")}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-[11px] font-bold cursor-pointer"
                  title="Clear location filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTROLLED CATEGORY CAROUSEL (Apple-Inspired Navigation Mechanism)     */}
      {/* ========================================================================= */}
      <div className="glass-workspace p-4 sm:p-5 text-center select-none">
        
        {/* Navigation Stage: ‹ [Flank Preview]  [ACTIVE CATEGORY]  [Flank Preview] › */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-4xl mx-auto">
          
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handlePrevCategory}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer shrink-0 shadow-2xs bg-white active:scale-95"
            title={`Previous: ${prevCategoryDef.label} (←)`}
            aria-label="Previous Category"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Carousel Viewport */}
          <div className="flex-1 flex items-center justify-center gap-4 sm:gap-8 min-w-0 overflow-hidden py-1">
            
            {/* Left Flank Category (Dimmed peek on desktop) */}
            <button
              type="button"
              onClick={handlePrevCategory}
              className="hidden md:block text-right truncate max-w-[130px] lg:max-w-[160px] opacity-35 hover:opacity-75 transition-opacity cursor-pointer text-xs font-extrabold uppercase tracking-wider text-slate-500"
              title={`Switch to ${prevCategoryDef.label}`}
            >
              {prevCategoryDef.shortLabel}
            </button>

            {/* Center Active Category Display (Prominent Spotlight) */}
            <div className="flex flex-col items-center justify-center min-w-0 px-2 animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-900 text-xs sm:text-sm font-black uppercase tracking-wider shadow-2xs">
                <CategoryIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate">{activeCategoryDef.label}</span>
                <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-mono">
                  {categoryTemplates.length}
                </span>
              </div>

              <p className="text-xs text-slate-500 font-medium mt-1.5 max-w-md mx-auto line-clamp-1">
                {activeCategoryDef.description}
              </p>
            </div>

            {/* Right Flank Category (Dimmed peek on desktop) */}
            <button
              type="button"
              onClick={handleNextCategory}
              className="hidden md:block text-left truncate max-w-[130px] lg:max-w-[160px] opacity-35 hover:opacity-75 transition-opacity cursor-pointer text-xs font-extrabold uppercase tracking-wider text-slate-500"
              title={`Switch to ${nextCategoryDef.label}`}
            >
              {nextCategoryDef.shortLabel}
            </button>
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleNextCategory}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer shrink-0 shadow-2xs bg-white active:scale-95"
            title={`Next: ${nextCategoryDef.label} (→)`}
            aria-label="Next Category"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Carousel Pagination Dots & Jump Dropdown: Controlled Indicators */}
        <div className="pt-3.5 mt-2 border-t border-slate-100 flex items-center justify-center gap-3">
          
          {/* Pagination Dots (● ○ ○ ○) */}
          <div className="flex items-center gap-1.5">
            {CATEGORIES.map((cat, idx) => {
              const isActive = idx === activeCategoryIndex;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  title={`${cat.label} (${idx + 1} of ${CATEGORIES.length})`}
                  aria-label={cat.label}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    isActive
                      ? "w-6 h-2 bg-indigo-600 shadow-2xs"
                      : "w-2 h-2 bg-slate-200 hover:bg-slate-400"
                  }`}
                />
              );
            })}
          </div>

          {/* Compact Jump Dropdown for Direct Access */}
          <div className="relative inline-block text-left">
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200/80 rounded-lg px-2 py-0.5 shadow-2xs focus:outline-hidden focus:border-indigo-500 cursor-pointer"
              title="Jump directly to category"
            >
              {CATEGORIES.map((c, i) => (
                <option key={c.id} value={c.id}>
                  {i + 1}. {c.label}
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. DELIVERY & COURIER METHODS SUB-TAB SELECTOR                            */}
      {/* ========================================================================= */}
      {activeCategory === "DELIVERY" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-xl shadow-2xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setDeliverySubTab("templates")}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                deliverySubTab === "templates"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <MessageSquareQuote className="w-3.5 h-3.5" />
              <span>Communication Templates ({categoryTemplates.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setDeliverySubTab("methods")}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                deliverySubTab === "methods"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Courier &amp; Pickup Methods ({deliveryMethodsList.length})</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-medium px-2">
            {deliverySubTab === "templates"
              ? "Client-facing delivery notices, logistics copy & courier guidelines"
              : "Manage courier fees, pickup points & automated quotation messages"}
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. COURIER METHODS MANAGER (When DELIVERY & methods sub-tab are active)   */}
      {/* ========================================================================= */}
      {activeCategory === "DELIVERY" && deliverySubTab === "methods" ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-xs text-left space-y-5">
          <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Courier &amp; Collection Methods</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Configure courier providers, pickup depots, default rates, and quote message templates.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddDeliveryMethod}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Method</span>
              </button>

              <button
                type="button"
                onClick={handleResetDeliveryMethods}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {deliveryMethodsList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200/60 rounded-2xl text-slate-500 text-xs">
                No courier methods configured. Click &quot;Reset Defaults&quot; or &quot;Add Method&quot; above.
              </div>
            ) : (
              deliveryMethodsList.map((method, idx) => {
                const list = [...deliveryMethodsList];
                return (
                  <div
                    key={method.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      method.active
                        ? "bg-slate-50/70 border-slate-200/80 hover:border-slate-300"
                        : "bg-slate-100/50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200/60">
                      <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                        <input
                          type="text"
                          value={method.name}
                          onChange={(e) => {
                            list[idx] = { ...list[idx], name: e.target.value };
                            handleUpdateDeliveryMethods(list);
                          }}
                          placeholder="Method Name (e.g. Knutsford Express)"
                          className="font-extrabold text-xs text-slate-900 bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 focus:border-indigo-500 focus:outline-hidden max-w-xs w-full"
                        />

                        <select
                          value={method.type}
                          onChange={(e) => {
                            list[idx] = { ...list[idx], type: e.target.value as any };
                            handleUpdateDeliveryMethods(list);
                          }}
                          className="bg-white border border-slate-200/80 text-[10px] font-bold uppercase rounded-lg px-2 py-1.5 text-slate-700"
                        >
                          <option value="delivery">🚚 Delivery</option>
                          <option value="collection">🏢 Collection / Pickup</option>
                          <option value="shipping">📦 Shipping / Courier</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400">Cost: J$</span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={method.defaultCost}
                            onChange={(e) => {
                              list[idx] = { ...list[idx], defaultCost: parseFloat(e.target.value) || 0 };
                              handleUpdateDeliveryMethods(list);
                            }}
                            className="w-20 font-mono font-bold text-xs bg-white border border-slate-200/80 rounded-lg px-2 py-1 text-slate-800"
                          />
                        </div>

                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={method.active}
                            onChange={(e) => {
                              list[idx] = { ...list[idx], active: e.target.checked };
                              handleUpdateDeliveryMethods(list);
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          Active
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            const filtered = list.filter((item) => item.id !== method.id);
                            handleUpdateDeliveryMethods(filtered);
                          }}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          title="Delete Method"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                      <div className="md:col-span-8 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Automated Customer Quote Message Template
                        </label>
                        <textarea
                          rows={3}
                          value={method.messageTemplate}
                          onChange={(e) => {
                            list[idx] = { ...list[idx], messageTemplate: e.target.value };
                            handleUpdateDeliveryMethods(list);
                          }}
                          placeholder="Message template appended to customer quotes..."
                          className="w-full text-xs font-sans text-slate-800 bg-white border border-slate-200/80 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="md:col-span-4 space-y-2 text-[10px]">
                        <div>
                          <label className="font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Estimated Time</label>
                          <input
                            type="text"
                            value={method.estimatedTime || ""}
                            onChange={(e) => {
                              list[idx] = { ...list[idx], estimatedTime: e.target.value };
                              handleUpdateDeliveryMethods(list);
                            }}
                            placeholder="E.g. 24 Hours / 1-2 Days"
                            className="w-full bg-white border border-slate-200/80 rounded-lg px-2 py-1 text-slate-800 font-medium"
                          />
                        </div>

                        {method.type === "collection" && (
                          <div>
                            <label className="font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Pickup Location</label>
                            <input
                              type="text"
                              value={method.pickupLocation || ""}
                              onChange={(e) => {
                                list[idx] = { ...list[idx], pickupLocation: e.target.value };
                                handleUpdateDeliveryMethods(list);
                              }}
                              placeholder="E.g. Kingston Head Office"
                              className="w-full bg-white border border-slate-200/80 rounded-lg px-2 py-1 text-slate-800 font-medium"
                            />
                          </div>
                        )}

                        <div>
                          <label className="font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Notes / Logistics Info</label>
                          <input
                            type="text"
                            value={method.notes || ""}
                            onChange={(e) => {
                              list[idx] = { ...list[idx], notes: e.target.value };
                              handleUpdateDeliveryMethods(list);
                            }}
                            placeholder="Internal logistics notes"
                            className="w-full bg-white border border-slate-200/80 rounded-lg px-2 py-1 text-slate-800 font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 5. SELECTED CATEGORY WORKSPACE (Focused Split View: List + Single Preview)*/
        /* ========================================================================= */
        <div className="space-y-4">
          
          {/* Mobile Tab Switcher (Templates vs Preview) */}
          <div className="flex lg:hidden items-center p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setMobileTab("templates")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mobileTab === "templates"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Templates ({categoryTemplates.length})
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("preview")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mobileTab === "preview"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Focused Preview
            </button>
          </div>

          {categoryTemplates.length === 0 ? (
            /* Empty State for current category */
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                No templates found in {activeCategoryDef.label}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No templates match "${searchQuery}". Clear your search query to see all templates in this category.`
                  : "No templates exist in this category yet. You can create one using the button below."}
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Clear Search
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setNewTemplate((prev) => ({ ...prev, category: activeCategory }));
                    setIsCreatingNew(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Template</span>
                </button>
              </div>
            </div>
          ) : (
            /* Responsive Split View: Left List of Cards, Right Focused Preview */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* =================================================================== */}
              {/* LEFT COLUMN: Clean, Compact Template Cards List                     */}
              {/* =================================================================== */}
              <div
                className={`lg:col-span-5 space-y-2.5 ${
                  mobileTab === "preview" ? "hidden lg:block" : "block"
                }`}
              >
                <div className="flex items-center justify-between px-1 pb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    {activeCategoryDef.label} ({categoryTemplates.length})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Click to select &amp; preview
                  </span>
                </div>

                {/* Contained Vertical Scroll List */}
                <div className="max-h-[580px] overflow-y-auto pr-1 space-y-2.5">
                  {categoryTemplates.map((tpl) => {
                    const isSelected = selectedTemplate?.id === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => {
                          setSelectedTemplateId(tpl.id);
                          setMobileTab("preview");
                        }}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer text-left flex items-start justify-between gap-3 ${
                          isSelected
                            ? "bg-white border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs"
                            : "bg-white/70 hover:bg-white border-slate-200/80 hover:border-slate-300"
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {tpl.name}
                            </h4>
                            {!tpl.active && (
                              <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm shrink-0">
                                Inactive
                              </span>
                            )}
                          </div>

                          {/* Compact visual badges: Company, Category, Location */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-semibold">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200/70 font-mono">
                              {tpl.company || tpl.businessHome || "CEO Lifestyle"}
                            </span>
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                              {tpl.category}
                            </span>
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded-md border border-amber-100 flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5 inline text-amber-600" />
                              {tpl.location || "Operations Dashboard"}
                            </span>
                          </div>
                        </div>

                        {/* Small Pencil Icon for Edit */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTemplate(tpl);
                          }}
                          title="Edit"
                          aria-label="Edit"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* =================================================================== */}
              {/* RIGHT COLUMN: Contained Focused Document Preview                    */}
              {/* =================================================================== */}
              {selectedTemplate && (
                <div
                  className={`lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs text-left space-y-4 ${
                    mobileTab === "templates" ? "hidden lg:block" : "block"
                  }`}
                >
                  {/* Preview Header & Controls */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                        Focused Preview
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 truncate mt-0.5">
                        {selectedTemplate.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* View Mode Toggle: Client View vs Variables */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setPreviewMode("rendered")}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            previewMode === "rendered"
                              ? "bg-white text-indigo-700 shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Client View
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewMode("source")}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            previewMode === "source"
                              ? "bg-white text-indigo-700 shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Variables
                        </button>
                      </div>

                      {/* Copy Sample Button */}
                      <button
                        type="button"
                        onClick={() => handleCopySample(selectedTemplate)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200/80 rounded-xl transition-all cursor-pointer shadow-2xs"
                        title="Copy sample output"
                        aria-label="Copy sample output"
                      >
                        {copiedId === selectedTemplate.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Small Pencil Icon for Edit */}
                      <button
                        type="button"
                        onClick={() => setEditingTemplate(selectedTemplate)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200/80 rounded-xl transition-all cursor-pointer shadow-2xs"
                        title="Edit"
                        aria-label="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Template Meta Badges: Company, Category, Location */}
                  <div className="flex flex-wrap items-center gap-2 py-2 px-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs font-semibold">
                    <div className="flex items-center gap-1 text-slate-600">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Company:</span>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-800 font-bold">
                        {selectedTemplate.company || selectedTemplate.businessHome || "CEO Lifestyle"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Category:</span>
                      <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-indigo-700 font-bold">
                        {selectedTemplate.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Location:</span>
                      <span className="px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-md text-amber-800 font-bold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-600" />
                        {selectedTemplate.location || "Operations Dashboard"}
                      </span>
                    </div>
                  </div>

                  {/* Connected Order & Client Live Information Banner */}
                  {hasActiveOrderInfo && (
                    <div className="p-3 bg-gradient-to-r from-indigo-50/90 via-slate-50 to-indigo-50/70 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900">
                              Order &amp; Client Connected
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                              Live Sync
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 truncate">
                            <strong className="text-indigo-950 font-bold">
                              {activeOrderInfo.clientName || "Client Unnamed"}
                            </strong>
                            {activeOrderInfo.deliveryMethod && (
                              <span className="text-slate-600"> • {activeOrderInfo.deliveryMethod}</span>
                            )}
                            {activeOrderInfo.location && (
                              <span className="text-slate-600"> • {activeOrderInfo.location}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setUseActiveOrderData(!useActiveOrderData)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer shadow-2xs bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200"
                          title="Toggle between active production order values and factory sample data"
                        >
                          {useActiveOrderData ? "Switch to Sample Preview" : "Use Active Order Info"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Contained Document Stationery Body */}
                  {previewMode === "rendered" ? (
                    <TemplateBlockViewer
                      text={formatQuoteTemplate(selectedTemplate.content, effectivePreviewData)}
                      theme="light"
                      className="p-5 bg-slate-50/80 border border-slate-200/70 rounded-2xl text-xs sm:text-sm text-slate-800 font-sans leading-relaxed max-h-[380px] overflow-y-auto shadow-inner"
                    />
                  ) : (
                    <div className="p-5 bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl text-xs font-mono whitespace-pre-wrap break-words min-w-0 leading-relaxed max-h-[380px] overflow-y-auto shadow-inner">
                      {selectedTemplate.content}
                    </div>
                  )}

                  {/* Included Variables Chips List */}
                  {selectedTemplate.placeholders && selectedTemplate.placeholders.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Included Variables ({selectedTemplate.placeholders.length})
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                        {selectedTemplate.placeholders.map((ph, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200/60 rounded-md text-[10px] font-mono"
                          >
                            {ph}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Bar: Duplicate, Restore, Delete */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleDuplicateTemplate(selectedTemplate)}
                      className="hover:text-indigo-600 font-medium transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Duplicate Template</span>
                    </button>

                    <div className="flex items-center gap-3">
                      {selectedTemplate.isDefault ? (
                        <button
                          type="button"
                          onClick={() => handleRestoreDefault(selectedTemplate.id)}
                          className="hover:text-indigo-600 font-medium transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Wording</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(selectedTemplate.id, selectedTemplate.name)}
                          className="text-rose-500 hover:text-rose-700 font-medium transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. FOCUSED EDITING MODAL (Contained, Accessible, Centered Dialog)         */}
      {/* ========================================================================= */}
      {editingTemplate &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-left">
              
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      Edit Template: {editingTemplate.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Adjust client-facing wording, structure, and dynamic variable placeholders.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                  title="Close"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                
                {/* Form Row 1: Name, Category, Company, Operational Location */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.name}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, name: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Category
                    </label>
                    <select
                      value={editingTemplate.category}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, category: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Company
                    </label>
                    <select
                      value={editingTemplate.company || editingTemplate.businessHome || "CEO Lifestyle"}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          company: e.target.value,
                          businessHome: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      <option value="CEO Lifestyle">CEO Lifestyle</option>
                      <option value="Librarium Luxe">Librarium Luxe</option>
                      <option value="Both">Both (Universal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-indigo-600" />
                      Location
                    </label>
                    <select
                      value={editingTemplate.location || "Operations Dashboard"}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, location: e.target.value as any })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      {OS_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Description &amp; Operational Purpose
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.description || ""}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, description: e.target.value })
                    }
                    placeholder="Brief note about when this communication is used..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* Available Placeholders Quick Inserter */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-indigo-600" />
                      <span>
                        {showAllPlaceholders ? "All Available Variables" : `${editingTemplate.category || activeCategory} Variables`} (Click to insert)
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAllPlaceholders(!showAllPlaceholders)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                      >
                        {showAllPlaceholders ? "Show Category Specific" : "Show All Variables"}
                      </button>
                      <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                        Supports &#123;Tag&#125;
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {(showAllPlaceholders
                      ? COMMON_PLACEHOLDERS
                      : (CATEGORY_SCOPED_PLACEHOLDERS[editingTemplate.category || activeCategory] || COMMON_PLACEHOLDERS)
                    ).map((ph, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          insertPlaceholderIntoTextarea(
                            ph.tag,
                            editingTemplate.content,
                            (newText) =>
                              setEditingTemplate({ ...editingTemplate, content: newText })
                          )
                        }
                        className="px-2 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700 transition-colors cursor-pointer shadow-2xs"
                        title={ph.label}
                      >
                        {ph.tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editor vs Preview: Responsive Layout */}
                <div className="space-y-2">
                  <div className="flex sm:hidden items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setEditorTab("edit")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        editorTab === "edit"
                          ? "bg-white text-indigo-700 shadow-2xs"
                          : "text-slate-600"
                      }`}
                    >
                      Edit Content
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab("preview")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        editorTab === "preview"
                          ? "bg-white text-indigo-700 shadow-2xs"
                          : "text-slate-600"
                      }`}
                    >
                      Live Preview
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    
                    {/* Left: Textarea Editor */}
                    <div className={`space-y-1.5 ${editorTab === "preview" ? "hidden sm:block lg:block" : "block"}`}>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                        Template Content &amp; Formatting
                      </label>
                      <textarea
                        ref={textareaRef}
                        rows={10}
                        value={editingTemplate.content}
                        onChange={(e) =>
                          setEditingTemplate({ ...editingTemplate, content: e.target.value })
                        }
                        className="w-full px-3.5 py-3 bg-slate-900 text-slate-100 font-mono text-xs rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed shadow-inner"
                        placeholder="Enter template wording..."
                      />
                    </div>

                    {/* Right: Live Rendered Output */}
                    <div className={`space-y-1.5 ${editorTab === "edit" ? "hidden sm:block lg:block" : "block"}`}>
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                          Live Rendered Output
                        </label>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Real-Time Preview
                        </span>
                      </div>
                      <div className="h-[212px] p-3.5 bg-slate-50 border border-slate-200 rounded-2xl overflow-y-auto text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed shadow-inner">
                        {formatQuoteTemplate(editingTemplate.content, effectivePreviewData)}
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-between shrink-0">
                <div>
                  {editingTemplate.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleRestoreDefault(editingTemplate.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-bold transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to Default Wording</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveTemplate(editingTemplate)}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* 7. NEW TEMPLATE CREATION MODAL                                            */}
      {/* ========================================================================= */}
      {isCreatingNew &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-left">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      Create Custom Template
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Add a new communication template or document presentation format.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="e.g. Order Details Notice"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Category
                    </label>
                    <select
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Company
                    </label>
                    <select
                      value={newTemplate.company || newTemplate.businessHome || "CEO Lifestyle"}
                      onChange={(e) =>
                        setNewTemplate({
                          ...newTemplate,
                          company: e.target.value,
                          businessHome: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      <option value="CEO Lifestyle">CEO Lifestyle</option>
                      <option value="Librarium Luxe">Librarium Luxe</option>
                      <option value="Both">Both (Universal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-indigo-600" />
                      Location
                    </label>
                    <select
                      value={newTemplate.location || "Operations Dashboard"}
                      onChange={(e) => setNewTemplate({ ...newTemplate, location: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      {OS_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    placeholder="Brief context on when to use this template..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Template Content *
                  </label>
                  <textarea
                    rows={8}
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    placeholder="Hello {CustomerName},\n\nYour order #{OrderNumber} is being prepared..."
                    className="w-full px-3.5 py-3 bg-slate-900 text-slate-100 font-mono text-xs rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed shadow-inner"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewTemplate}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Create Template
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

    </div>
  );
};
