import React, { useState, useRef, useEffect } from "react";
import { 
  Calculator, 
  Layers, 
  Bell, 
  Monitor, 
  Lock, 
  Sliders, 
  PlusCircle, 
  UploadCloud, 
  Check, 
  AlertCircle, 
  Trash2, 
  Key, 
  Eye, 
  EyeOff, 
  User, 
  Sparkles,
  RefreshCw,
  Clock,
  Coins,
  ShieldCheck,
  Building,
  HelpCircle,
  Database,
  Download,
  FileSpreadsheet,
  Users,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Printer,
  Truck,
  MapPin,
  Package,
  MessageSquareQuote,
  MessageSquare,
  Copy,
  RotateCcw,
  Search,
  FileText,
  Tag,
  Filter,
  Plus
} from "lucide-react";
import { SystemSettings, Client, LuxeBookInventoryItem, ProductionMaterialPreset, BackupRecord, DTFSupplier, DTFPricingPreset, DeliveryMethod, SystemQuoteTemplate } from "../types";
import { DEFAULT_PRODUCTION_MATERIALS, DEFAULT_DTF_SUPPLIERS, DEFAULT_DTF_PRICING, DEFAULT_DELIVERY_METHODS, DEFAULT_QUOTE_TEMPLATES, formatQuoteTemplate } from "../utils/settingsHelper";
import { 
  exportExcelBackup, 
  exportJsonBackup, 
  exportTestEnvironmentBackup,
  processBackupImport,
  validateAndParseBackupFile, 
  getBackupHistory,
  ImportResult
} from "../utils/backupUtils";
import ClientExportModal from "./ClientExportModal";

interface BrandingSettingsProps {
  appBg: string;
  authBg: string;
  onUpdateAppBg: (base64: string) => void;
  onUpdateAuthBg: (base64: string) => void;
  onResetAppBg: () => void;
  onResetAuthBg: () => void;
  defaultBg: string;
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  userRole?: string;
  userFullName?: string;
  onRestoreBackup?: (backupData: any) => void;
  onStartTour?: (tourId: string) => void;
  onNavigateToTab?: (tab: "dashboard" | "directory" | "excel" | "calendar" | "inventory" | "branding" | "users") => void;
  clients?: Client[];
}

const GUIDE_MODULES = [
  {
    id: "dashboard",
    name: "Dashboard",
    purpose: "Provides an executive high-level summary of active relationships, recent activities, and key metrics.",
    location: "Main Navigation -> Dashboard",
    features: [
      "Executive relationship health metrics (Silver, Gold, Platinum accounts)",
      "Chronological recent activity feed showcasing timeline updates",
      "Dynamic Watchtower warning badges with direct links to client profiles",
      "Interactive command carousel consolidating calculators and agendas"
    ],
    workflow: "Begin each work session here. Check upcoming action tasks and low stock book notifications to coordinate daily outreach."
  },
  {
    id: "carousel",
    name: "Interactive Dashboard Carousel",
    purpose: "Saves vertical space by grouping major operational cards into a single horizontal navigation zone.",
    location: "Dashboard Screen (Right Column)",
    features: [
      "Luxe Inventory real-time stock levels",
      "Book Cost shipping & markup calculator",
      "Location Event cost estimator",
      "Interactive calendar and follow-up agenda"
    ],
    workflow: "Slide between operational widgets using left/right arrows to conduct micro-calculations and view calendar milestones."
  },
  {
    id: "watchtower",
    name: "Watchtower Monitor",
    purpose: "Brings key client reminders and upcoming birthday/anniversary events to the immediate attention of the CEO.",
    location: "Dashboard Screen (Left Side)",
    features: [
      "Custom filtration by milestone type",
      "Color-coded warning states based on deadline proximity",
      "Quick-click navigation to client directory detail pages"
    ],
    workflow: "Act on visual milestones by scheduling outreach before deadlines lapse."
  },
  {
    id: "directory",
    name: "Client Directory",
    purpose: "Stores comprehensive customer records, tiers, delivery locations, and family logs in a centralized CRM table.",
    location: "Main Navigation -> Client Directory",
    features: [
      "Search, filter by tier, and alphabetical sorting",
      "Status deactivation toggle (Soft delete)",
      "Bespoke style, colors, and communication channel preferences"
    ],
    workflow: "Onboard new high-net-worth individuals or edit baseline profiles when client contact info changes."
  },
  {
    id: "detail",
    name: "Client Detail deep-dive",
    purpose: "Displays historical relationship timelines, family trees, sports profiles, and tailored reminders.",
    location: "Clicking any Client name across the application",
    features: [
      "Chronological timeline log (Conversations, Orders, Gifts, Notes)",
      "Interactive family member birthday registers",
      "Bespoke reminder logs with status flags"
    ],
    workflow: "Review a client's historical timeline and personal preferences immediately prior to phone calls or in-person meetings."
  },
  {
    id: "calendar",
    name: "Milestone Calendar",
    purpose: "Maps all active client anniversaries, birthdays, and custom operational milestones onto a calendar grid.",
    location: "Main Navigation -> Milestone Calendar",
    features: [
      "Dynamic monthly and weekly schedule displays",
      "Interactive click-to-edit timeline event dialogs",
      "Bespoke business event tags (CEO Day, Reference Day)"
    ],
    workflow: "Scan monthly grids to budget gift costs and pre-schedule holiday campaigns."
  },
  {
    id: "inventory",
    name: "Librarium Luxe Inventory",
    purpose: "Manages catalog of luxury books, in-store levels, office stocks, and low stock thresholds.",
    location: "Main Navigation -> Luxe Inventory",
    features: [
      "Granular stock splitting (Store vs. Office volumes)",
      "Algorithmic Book Ranking Status indicators (e.g., Never Sell, Restock)",
      "Real-time alerts integrated into the main dashboard"
    ],
    workflow: "Adjust counts upon new book arrivals or completed sales. Respond immediately to 'Urgent Restock' ranks."
  },
  {
    id: "book_calculator",
    name: "Book Cost Calculator",
    purpose: "Computes final book pricing using custom markup settings and exchange rates.",
    location: "Dashboard Carousel & Centralized Settings",
    features: [
      "Exchange rate multiplier conversion",
      "Single-copy vs. multi-copy freight charge scaling",
      "Rounding-up increments formatting"
    ],
    workflow: "Calculate exact consumer pricing profiles for bespoke luxury imports."
  },
  {
    id: "location_calculator",
    name: "Location Cost Calculator",
    purpose: "Determines physical venue overheads, shipping variables, and bulk transport margins.",
    location: "Dashboard Carousel & Centralized Settings",
    features: [
      "Calculates overhead factors based on system settings",
      "Delineates variables for multiple locations"
    ],
    workflow: "Perform quick profitability analysis prior to securing book show spaces or pop-up shops."
  },
  {
    id: "excel",
    name: "Excel Exchange",
    purpose: "Allows bulk spreadsheet data imports and exports.",
    location: "Main Navigation -> Excel Exchange",
    features: [
      "Downloadable pre-mapped Excel templates",
      "Full CRM batch uploads with field matching",
      "Luxe Inventory bulk reconciliation uploaders"
    ],
    workflow: "Use during system migrations or seasonal book catalog updates to skip manual data entry."
  },
  {
    id: "users",
    name: "User Management & Access",
    purpose: "Controls system operator roles, permissions, and active statuses.",
    location: "Main Navigation -> User Access (Master Admin only)",
    features: [
      "Operator role definitions (Staff, Manager, Admin, Read-Only)",
      "Interactive action logging and password reset keys"
    ],
    workflow: "Audit operator rosters monthly to deactivate idle accounts and preserve database security."
  },
  {
    id: "settings",
    name: "Centralized System Settings",
    purpose: "Controls application metadata, styling, and system guide assets.",
    location: "Main Navigation -> System Settings (Master Admin only)",
    features: [
      "Calculations, reminders, and branding tabs",
      "Master Administrator Guide system"
    ],
    workflow: "Manage background style rules, update reminder day parameters, and review system walkthroughs."
  },
  {
    id: "backup",
    name: "Backup & Restore",
    purpose: "Ensures continuity by packaging full operational CRM indexes into local JSON snapshots.",
    location: "System Settings -> Backup & Restore (Master Admin only)",
    features: [
      "One-click complete DB compilation",
      "Comprehensive verification audit before restoring"
    ],
    workflow: "Download an archive snapshot weekly. Keep previous versions in a secure repository."
  }
];

export default function BrandingSettings({
  appBg,
  authBg,
  onUpdateAppBg,
  onUpdateAuthBg,
  onResetAppBg,
  onResetAuthBg,
  defaultBg,
  settings,
  onUpdateSettings,
  userRole = "Master Administrator",
  userFullName = "Master Administrator",
  onRestoreBackup,
  onStartTour,
  onNavigateToTab,
  clients = []
}: BrandingSettingsProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "business" | "delivery_methods" | "quote_templates" | "production_materials" | "inventory" | "reminders" | "branding" | "security" | "preferences" | "expansion" | "backup" | "guide"
  >("business");

  // Production materials internal subtab
  const [prodMatSubTab, setProdMatSubTab] = useState<"dtf_suppliers" | "dtf_pricing" | "paper">("dtf_suppliers");

  // Local state for settings edit
  const [localSettings, setLocalSettings] = useState<SystemSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  // Quote Templates Management State
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>("All");
  const [activePreviewTemplateId, setActivePreviewTemplateId] = useState<string | null>(null);
  const [copiedPreviewId, setCopiedPreviewId] = useState<string | null>(null);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [newTplName, setNewTplName] = useState("");
  const [newTplCategory, setNewTplCategory] = useState<"Quotations" | "Delivery & Collection" | "Customer Communications">("Quotations");
  const [newTplToolKey, setNewTplToolKey] = useState<"apparel" | "book" | "dtf" | "production_layout" | "location" | "general">("general");
  const [newTplDescription, setNewTplDescription] = useState("");
  const [newTplContent, setNewTplContent] = useState("");

  // Sample data map used for live quote template previews
  const DUMMY_PREVIEW_DATA: Record<string, string | number> = {
    CustomerName: "Johnathan Sterling",
    QuoteDate: "2026-07-24",
    GarmentType: "Embroidered Polo Shirts",
    GarmentItems: "* 10 Adult Polos @ JMD 3,500 each = JMD 35,000\n* 5 Adult +Size Polos @ JMD 4,000 each = JMD 20,000",
    BookTitle: "The Executive Mindset & Wealth Principles",
    Quantity: 15,
    QuantityUnit: "Copies",
    UnitPrice: "JMD 3,500",
    Subtotal: "JMD 55,000",
    BooksSubtotal: "JMD 52,500",
    PrintSubtotal: "JMD 22,500",
    PrintSize: '12" × 10" Front Chest Graphic',
    MaterialName: "Card Stock (A4) Premium",
    SheetSpecs: "8.5 x 11 in • 350 GSM",
    ParishLocation: "Kingston & St. Andrew (Executive Suite)",
    ServiceTier: "VIP Event Setup & Full Staging",
    DeliveryMethod: "Tara Courier Doorstep Delivery",
    DeliveryCharge: "JMD 1,500",
    DeliveryMessage: "Your order will be delivered directly to your specified address via Tara Courier.\n\nTracking details and courier schedule will be communicated upon dispatch.",
    PickupLocation: "Kingston Head Office (Mon-Fri 9AM-5PM)",
    AdditionalCharges: "* Custom Gold Thread Digitizing Fee – JMD 2,500\n* Priority Rush Order Charge – JMD 3,000",
    DiscountPercent: 10,
    DiscountAmount: "JMD 5,500",
    GrandTotal: "JMD 56,500",
    DepositAmount: "JMD 28,250",
    BusinessName: localSettings.companyName || "CEO Lifestyle",
    CompletionDate: "2026-07-28"
  };

  const activeQuoteTemplates: SystemQuoteTemplate[] = localSettings.quoteTemplates && localSettings.quoteTemplates.length > 0
    ? localSettings.quoteTemplates
    : DEFAULT_QUOTE_TEMPLATES;

  const handleUpdateQuoteTemplate = (id: string, updatedFields: Partial<SystemQuoteTemplate>) => {
    const updated = activeQuoteTemplates.map(tpl => {
      if (tpl.id === id) {
        return { ...tpl, ...updatedFields };
      }
      return tpl;
    });
    handleChange("quoteTemplates", updated);
  };

  const handleDuplicateQuoteTemplate = (template: SystemQuoteTemplate) => {
    const newId = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const duplicateItem: SystemQuoteTemplate = {
      ...template,
      id: newId,
      name: `${template.name} (Copy)`,
      isDefault: false
    };
    const updated = [duplicateItem, ...activeQuoteTemplates];
    handleChange("quoteTemplates", updated);
    setSaveSuccess(`Duplicated template "${template.name}" successfully!`);
  };

  const handleRestoreTemplateDefault = (templateId: string) => {
    const defaultTpl = DEFAULT_QUOTE_TEMPLATES.find(d => d.id === templateId);
    if (defaultTpl) {
      const updated = activeQuoteTemplates.map(tpl => {
        if (tpl.id === templateId) {
          return { ...defaultTpl };
        }
        return tpl;
      });
      handleChange("quoteTemplates", updated);
      setSaveSuccess(`Restored template "${defaultTpl.name}" to original default!`);
    }
  };

  const handleDeleteQuoteTemplate = (templateId: string) => {
    if (window.confirm("Are you sure you want to remove this template?")) {
      const updated = activeQuoteTemplates.filter(t => t.id !== templateId);
      handleChange("quoteTemplates", updated);
      setSaveSuccess("Template deleted successfully.");
    }
  };

  const handleResetAllQuoteTemplates = () => {
    if (window.confirm("Reset ALL quotation and customer message templates to original system defaults? Custom templates will be replaced.")) {
      handleChange("quoteTemplates", DEFAULT_QUOTE_TEMPLATES);
      setSaveSuccess("All quote and message templates reset to system defaults!");
    }
  };

  const handleCreateNewQuoteTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplName.trim() || !newTplContent.trim()) {
      setSaveError("Please provide both a template name and message content.");
      return;
    }

    const detectedPlaceholders = Array.from(newTplContent.matchAll(/\{([^}]+)\}/g)).map(m => `{${m[1]}}`);
    const uniquePlaceholders = Array.from(new Set(detectedPlaceholders));

    const newTemplate: SystemQuoteTemplate = {
      id: `tpl_custom_${Date.now()}`,
      name: newTplName.trim(),
      category: newTplCategory,
      toolKey: newTplToolKey,
      description: newTplDescription.trim() || "Custom user-defined message template.",
      content: newTplContent.trim(),
      placeholders: uniquePlaceholders,
      active: true,
      isDefault: false
    };

    handleChange("quoteTemplates", [newTemplate, ...activeQuoteTemplates]);
    setShowAddTemplateModal(false);
    setNewTplName("");
    setNewTplDescription("");
    setNewTplContent("");
    setSaveSuccess(`Created new template "${newTemplate.name}" successfully!`);
  };

  // Refs for uploads
  const appFileInputRef = useRef<HTMLInputElement>(null);
  const authFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Compression helper
  const [isCompressingApp, setIsCompressingApp] = useState(false);
  const [isCompressingAuth, setIsCompressingAuth] = useState(false);
  const [isCompressingLogo, setIsCompressingLogo] = useState(false);

  // Security Credentials state
  const [currentUsername, setCurrentUsername] = useState(() => localStorage.getItem("ceo_admin_username") || "admin");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [credError, setCredError] = useState("");
  const [credSuccess, setCredSuccess] = useState("");

  // Backup & Restore states
  const [manualBackupNotes, setManualBackupNotes] = useState("");
  const [backupHistoryList, setBackupHistoryList] = useState<BackupRecord[]>(() => getBackupHistory());
  const [backupFileError, setBackupFileError] = useState("");
  const [backupFileSuccess, setBackupFileSuccess] = useState("");
  const [validationReport, setValidationReport] = useState<{
    isValid: boolean;
    version?: string;
    backupDate?: string;
    createdBy?: string;
    notes?: string;
    itemCounts?: { clients: number; aspiringClients: number; inventory: number; users: number };
    rawPayload: any;
    error?: string;
  } | null>(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [importReport, setImportReport] = useState<ImportResult | null>(null);
  const [isClientExportOpen, setIsClientExportOpen] = useState(false);

  // Master Admin Guide Navigation State
  const [guideSection, setGuideSection] = useState<"tours" | "updates" | "modules" | "checklists" | "logs">("tours");
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  // Master Admin Guide Custom Notes/Logs State
  const [guideLogs, setGuideLogs] = useState<{ id: string; timestamp: string; category: string; text: string }[]>(() => {
    const stored = localStorage.getItem("ceo_admin_guide_logs");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: "log_1",
        timestamp: new Date().toISOString(),
        category: "Operational",
        text: "System launched. All baseline CRM accounts and luxury inventory items verified."
      },
      {
        id: "log_2",
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        category: "Preferences",
        text: "Customized the app dashboard layout to use the premium horizontal command carousel."
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("ceo_admin_guide_logs", JSON.stringify(guideLogs));
  }, [guideLogs]);

  const [newLogCategory, setNewLogCategory] = useState("Operational");
  const [newLogText, setNewLogText] = useState("");

  const handleAddGuideLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogText.trim()) return;

    const newEntry = {
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      category: newLogCategory,
      text: newLogText.trim()
    };

    setGuideLogs(prev => [newEntry, ...prev]);
    setNewLogText("");
  };

  const handleDeleteGuideLog = (id: string) => {
    setGuideLogs(prev => prev.filter(log => log.id !== id));
  };

  // Test Environment Export Handlers (V2.1)
  const handleTriggerTestEnvExcel = () => {
    try {
      const record = exportTestEnvironmentBackup("xlsx", manualBackupNotes, userFullName || "Master Administrator");
      setBackupFileSuccess(`Test Environment Backup (.xlsx) generated successfully! File: ${record.fileName || "CEO_Lifestyle_Test_Environment_Backup_V2.1.xlsx"}`);
      setBackupFileError("");
      setManualBackupNotes("");
      setBackupHistoryList(getBackupHistory());
    } catch (err: any) {
      setBackupFileError(`Failed to export test environment Excel backup: ${err.message || String(err)}`);
    }
  };

  const handleTriggerTestEnvJson = () => {
    try {
      const record = exportTestEnvironmentBackup("json", manualBackupNotes, userFullName || "Master Administrator");
      setBackupFileSuccess(`Test Environment Backup (.json) generated successfully! File: ${record.fileName || "CEO_Lifestyle_Test_Environment_Backup_V2.1.json"}`);
      setBackupFileError("");
      setManualBackupNotes("");
      setBackupHistoryList(getBackupHistory());
    } catch (err: any) {
      setBackupFileError(`Failed to export test environment JSON backup: ${err.message || String(err)}`);
    }
  };

  // Manual Excel Backup Handler
  const handleTriggerExcelBackup = () => {
    try {
      const record = exportExcelBackup(manualBackupNotes, userFullName || "Master Administrator");
      setBackupFileSuccess(`Master Excel backup (.xlsx) successfully generated and recorded!`);
      setBackupFileError("");
      setManualBackupNotes("");
      setBackupHistoryList(getBackupHistory());
    } catch (err: any) {
      setBackupFileError(`Failed to generate Excel backup: ${err.message || String(err)}`);
    }
  };

  // Manual JSON Backup Handler
  const handleTriggerJsonBackup = () => {
    try {
      const record = exportJsonBackup(manualBackupNotes, userFullName || "Master Administrator");
      setBackupFileSuccess(`System JSON backup (.json) successfully generated and recorded!`);
      setBackupFileError("");
      setManualBackupNotes("");
      setBackupHistoryList(getBackupHistory());
    } catch (err: any) {
      setBackupFileError(`Failed to generate JSON backup: ${err.message || String(err)}`);
    }
  };

  // Backup File Selector & Validator for Restore
  const handleBackupFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackupFileError("");
    setBackupFileSuccess("");
    setValidationReport(null);
    setImportReport(null);
    setRestoreConfirmText("");

    const file = e.target.files?.[0];
    if (!file) return;

    const result = await validateAndParseBackupFile(file);
    if (!result.isValid) {
      setBackupFileError(result.error || "File validation failed.");
      return;
    }

    setValidationReport(result);
    setBackupFileSuccess("Backup file integrity verified successfully! Select import mode and review audit details below.");
  };

  // Execute Restore / Import Operation
  const handleExecuteSystemRestore = () => {
    if (!validationReport || !validationReport.rawPayload) return;

    const authUpper = restoreConfirmText.trim().toUpperCase();
    if (authUpper !== "IMPORT" && authUpper !== "RESTORE") {
      setBackupFileError("Please type IMPORT or RESTORE to confirm authorization.");
      return;
    }

    setIsRestoring(true);
    setTimeout(() => {
      try {
        const result = processBackupImport(
          validationReport.rawPayload,
          importMode,
          userFullName || "Master Administrator"
        );

        if (result.success) {
          setImportReport(result);
          if (onRestoreBackup) {
            onRestoreBackup(result.mergedData);
          }
          setBackupFileSuccess(`🎉 Migration import complete via ${result.mode}! Database state updated successfully.`);
          setBackupFileError("");
          setValidationReport(null);
          setRestoreConfirmText("");
          setBackupHistoryList(getBackupHistory());
        } else {
          setBackupFileError(result.error || "Import operation failed.");
        }
      } catch (err: any) {
        setBackupFileError(`Restore process failed: ${err.message || String(err)}`);
      } finally {
        setIsRestoring(false);
      }
    }, 800);
  };

  // Keep localState in sync when prop settings changes
  useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings]);

  const handleChange = (field: keyof SystemSettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveSuccess("");
    setSaveError("");

    try {
      // Basic validations
      if (localSettings.exchangeRate <= 0) {
        throw new Error("Exchange rate must be greater than zero.");
      }
      if (localSettings.shippingSingleBook < 0 || localSettings.shippingMultipleBooks < 0) {
        throw new Error("Shipping costs cannot be negative.");
      }
      if (localSettings.businessMarkupPercent < 0) {
        throw new Error("Markup percentage cannot be negative.");
      }
      if (!localSettings.appName.trim()) {
        throw new Error("Application name is required.");
      }
      if (!localSettings.masterUsername.trim()) {
        throw new Error("Master Administrator Username is required.");
      }

      onUpdateSettings(localSettings);
      setSaveSuccess("All application settings saved and synchronized successfully!");
      
      // Auto dismiss success
      setTimeout(() => {
        setSaveSuccess("");
      }, 4000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save settings.");
    }
  };

  const compressImage = (file: File, maxWidth = 1600, maxHeight = 900, quality = 0.75): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("File is not a valid image."));
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", quality);
            resolve(dataUrl);
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error("Failed to load image."));
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
    });
  };

  const handleAppImageUpload = async (file: File) => {
    setSaveError("");
    setSaveSuccess("");
    setIsCompressingApp(true);
    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File is too large. Max size is 10MB.");
      }
      const base64 = await compressImage(file);
      onUpdateAppBg(base64);
      handleChange("appBg", base64);
      setSaveSuccess("Application background updated and synchronized!");
    } catch (err: any) {
      setSaveError(err.message || "Failed to process image.");
    } finally {
      setIsCompressingApp(false);
    }
  };

  const handleAuthImageUpload = async (file: File) => {
    setSaveError("");
    setSaveSuccess("");
    setIsCompressingAuth(true);
    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File is too large. Max size is 10MB.");
      }
      const base64 = await compressImage(file);
      onUpdateAuthBg(base64);
      handleChange("authBg", base64);
      setSaveSuccess("Authentication screen background updated!");
    } catch (err: any) {
      setSaveError(err.message || "Failed to process image.");
    } finally {
      setIsCompressingAuth(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setSaveError("");
    setSaveSuccess("");
    setIsCompressingLogo(true);
    try {
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Logo file too large. Max is 2MB.");
      }
      const base64 = await compressImage(file, 400, 400, 0.9);
      handleChange("appLogo", base64);
      setSaveSuccess("Application logo uploaded successfully!");
    } catch (err: any) {
      setSaveError(err.message || "Failed to process logo.");
    } finally {
      setIsCompressingLogo(false);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setCredError("");
    setCredSuccess("");

    if (!newPassword) {
      setCredError("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setCredError("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 3) {
      setCredError("Password must be at least 3 characters long.");
      return;
    }

    // Save password
    localStorage.setItem("ceo_admin_password", newPassword);
    setNewPassword("");
    setConfirmPassword("");
    setCredSuccess("Administrator access key updated successfully!");
    
    // Trigger username update if modified
    if (localSettings.masterUsername !== currentUsername) {
      handleChange("masterUsername", localSettings.masterUsername);
      setCurrentUsername(localSettings.masterUsername);
    }
  };

  const handleResetCredentials = () => {
    if (window.confirm("Reset administrator login credentials to default?")) {
      localStorage.setItem("ceo_admin_username", "admin");
      localStorage.setItem("ceo_admin_password", "ceo");
      setCurrentUsername("admin");
      handleChange("masterUsername", "admin");
      setCredError("");
      setCredSuccess("Credentials reset to admin / ceo!");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-xs max-w-7xl mx-auto pb-16">
      
      {/* Page Header */}
      <div className="text-left bg-white/70 backdrop-blur-md border border-slate-200/50 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-indigo-600" />
            Centralized Control & System Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl font-medium">
            Configure system rules, luxury calculation multipliers, custom alerts, company metadata, background branding wallpapers, and security parameters from a single hub.
          </p>
        </div>
        <button
          onClick={() => handleSaveAll()}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer text-xs"
        >
          <Check className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {/* Save Notifications */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-2xl flex items-center gap-2.5 font-semibold text-xs text-left animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" /> {saveSuccess}
        </div>
      )}
      {saveError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-700 rounded-2xl flex items-center gap-2.5 font-semibold text-xs text-left animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /> {saveError}
        </div>
      )}

      {/* Main Settings Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column Navigation (Apple Inspired Sidebar) */}
        <div className="lg:col-span-3 space-y-2 bg-white/60 backdrop-blur-xs p-3 rounded-3xl border border-slate-200/60 shadow-xs text-left">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-3.5 py-2 block">
            System Modules
          </span>
          
          <button
            onClick={() => setActiveSubTab("business")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeSubTab === "business"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Coins className="w-4 h-4" />
            Calculations
          </button>

          <button
            onClick={() => setActiveSubTab("delivery_methods")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeSubTab === "delivery_methods"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Truck className="w-4 h-4" />
            Delivery & Collection
          </button>

          <button
            onClick={() => setActiveSubTab("quote_templates")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeSubTab === "quote_templates"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <MessageSquareQuote className="w-4 h-4" />
            Quote &amp; Message Templates
          </button>

          <button
            onClick={() => setActiveSubTab("production_materials")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeSubTab === "production_materials"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Layers className="w-4 h-4" />
            Production Materials
          </button>

          <button
            onClick={() => setActiveSubTab("inventory")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeSubTab === "inventory"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Layers className="w-4 h-4" />
            Inventory Control
          </button>

          <button
            onClick={() => setActiveSubTab("reminders")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeSubTab === "reminders"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Bell className="w-4 h-4" />
            Milestone Reminders
          </button>

          <button
            onClick={() => setActiveSubTab("branding")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeSubTab === "branding"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Building className="w-4 h-4" />
            Branding & Style
          </button>

          <button
            onClick={() => setActiveSubTab("security")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeSubTab === "security"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Lock className="w-4 h-4" />
            Security & Credentials
          </button>

          <button
            onClick={() => setActiveSubTab("preferences")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeSubTab === "preferences"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Sliders className="w-4 h-4" />
            Default Preferences
          </button>

          {userRole === "Master Administrator" && (
            <button
              onClick={() => setActiveSubTab("backup")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                activeSubTab === "backup"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Database className="w-4 h-4" />
              Backup & Restore
            </button>
          )}

          {userRole === "Master Administrator" && (
            <button
              onClick={() => setActiveSubTab("guide")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                activeSubTab === "guide"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Master Admin Guide
            </button>
          )}

          <button
            onClick={() => setActiveSubTab("expansion")}
            className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeSubTab === "expansion"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50"
            }`}
          >
            <PlusCircle className="w-4 h-4 text-inherit" />
            Future Extensions
          </button>
        </div>

        {/* Right Column Content Areas */}
        <div className="lg:col-span-9">
          
          {/* 1. BUSINESS CALCULATIONS */}
          {activeSubTab === "business" && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm text-left space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center gap-2">
                <Coins className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Business Calculation Settings</h3>
                  <p className="text-xs text-slate-400 font-medium">Fine-tune the pricing and shipping formulas utilized in calculations.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Default USD to JMD Exchange Rate</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">J$</span>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={localSettings.exchangeRate}
                      onChange={(e) => handleChange("exchangeRate", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-8 pr-3 py-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium">Standard exchange conversion baseline.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Default Business Markup Percentage</label>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={localSettings.businessMarkupPercent}
                      onChange={(e) => handleChange("businessMarkupPercent", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-3 pr-8 py-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium">Markup applied to total cost before rounding. (e.g. 25 = 1.25x multiplier)</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Default Shipping Cost (Single Book)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">J$</span>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={localSettings.shippingSingleBook}
                      onChange={(e) => handleChange("shippingSingleBook", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-8 pr-3 py-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium">Applied for singular book calculations.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Default Shipping Cost (Multiple Books / unit)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">J$</span>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={localSettings.shippingMultipleBooks}
                      onChange={(e) => handleChange("shippingMultipleBooks", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-8 pr-3 py-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium">Per-book shipping rate when calculating multi-book shipments.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Currency Rounding Rule</label>
                  <select
                    value={localSettings.roundingUpUnit}
                    onChange={(e) => handleChange("roundingUpUnit", parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                  >
                    <option value={100}>Round UP to nearest J$100</option>
                    <option value={50}>Round UP to nearest J$50</option>
                    <option value={10}>Round UP to nearest J$10</option>
                    <option value={0}>No Rounding (Calculated Decimals)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block font-medium">Standardize end-prices for clean customer presentation.</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. DELIVERY & COLLECTION MANAGEMENT */}
          {activeSubTab === "delivery_methods" && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm text-left space-y-6">
              <div className="pb-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Delivery & Collection Management</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Manage centralized courier methods, pickup points, and customer quotation message templates.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (localSettings.deliveryMethods || DEFAULT_DELIVERY_METHODS);
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
                      handleChange("deliveryMethods", [newMethod, ...updated]);
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Method
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Reset all delivery and collection methods to system default settings?")) {
                        handleChange("deliveryMethods", DEFAULT_DELIVERY_METHODS);
                      }
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset Defaults
                  </button>
                </div>
              </div>

              {/* Delivery Methods List */}
              <div className="space-y-4">
                {(!localSettings.deliveryMethods || localSettings.deliveryMethods.length === 0) ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200/60 rounded-2xl text-slate-500">
                    No delivery or collection methods configured. Click "Reset Defaults" or "Add Method" above.
                  </div>
                ) : (
                  (localSettings.deliveryMethods || []).map((method, idx) => {
                    const list = [...(localSettings.deliveryMethods || [])];
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
                          <div className="flex items-center gap-3 flex-1">
                            <input
                              type="text"
                              value={method.name}
                              onChange={(e) => {
                                list[idx] = { ...list[idx], name: e.target.value };
                                handleChange("deliveryMethods", list);
                              }}
                              placeholder="Method Name (e.g. Knutsford Express)"
                              className="font-extrabold text-xs text-slate-900 bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none max-w-xs w-full"
                            />
                            
                            <select
                              value={method.type}
                              onChange={(e) => {
                                list[idx] = { ...list[idx], type: e.target.value as any };
                                handleChange("deliveryMethods", list);
                              }}
                              className="bg-white border border-slate-200/80 text-[10px] font-bold uppercase rounded-lg px-2 py-1.5 text-slate-700"
                            >
                              <option value="delivery">🚚 Delivery</option>
                              <option value="collection">🏢 Collection / Pickup</option>
                              <option value="shipping">📦 Shipping / Courier</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-slate-400">Default Cost: J$</span>
                              <input
                                type="number"
                                min="0"
                                step="50"
                                value={method.defaultCost}
                                onChange={(e) => {
                                  list[idx] = { ...list[idx], defaultCost: parseFloat(e.target.value) || 0 };
                                  handleChange("deliveryMethods", list);
                                }}
                                className="w-24 font-mono font-bold text-xs bg-white border border-slate-200/80 rounded-lg px-2 py-1 text-slate-800"
                              />
                            </div>

                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={method.active}
                                onChange={(e) => {
                                  list[idx] = { ...list[idx], active: e.target.checked };
                                  handleChange("deliveryMethods", list);
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              Active
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                const filtered = list.filter(item => item.id !== method.id);
                                handleChange("deliveryMethods", filtered);
                              }}
                              className="text-slate-400 hover:text-red-600 transition-colors p-1"
                              title="Delete Method"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Customer Quote Message Template */}
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
                                handleChange("deliveryMethods", list);
                              }}
                              placeholder="Message template appended to customer quotes..."
                              className="w-full text-xs font-sans text-slate-800 bg-white border border-slate-200/80 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none"
                            />
                            <span className="text-[9px] text-slate-400 block font-medium">
                              This exact text will be loaded automatically into book cost quotations when this method is selected.
                            </span>
                          </div>

                          <div className="md:col-span-4 space-y-2 text-[10px]">
                            <div>
                              <label className="font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Estimated Time</label>
                              <input
                                type="text"
                                value={method.estimatedTime || ""}
                                onChange={(e) => {
                                  list[idx] = { ...list[idx], estimatedTime: e.target.value };
                                  handleChange("deliveryMethods", list);
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
                                    handleChange("deliveryMethods", list);
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
                                  handleChange("deliveryMethods", list);
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
          )}

          {/* QUOTE & MESSAGE TEMPLATES MANAGEMENT */}
          {activeSubTab === "quote_templates" && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm text-left space-y-6">
              
              {/* Header */}
              <div className="pb-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700">
                    <MessageSquareQuote className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Quote &amp; Message Templates</h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Centralized management for customer quotations, delivery notices, and automated communications.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddTemplateModal(true)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Template</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetAllQuoteTemplates}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reset All Defaults</span>
                  </button>
                </div>
              </div>

              {/* Search & Category Filter Pills */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  {["All", "Quotations", "Delivery & Collection", "Customer Communications"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedTemplateCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        selectedTemplateCategory === cat
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative w-full md:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    placeholder="Search templates or placeholders..."
                    className="w-full bg-white border border-slate-200/80 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Templates List */}
              <div className="space-y-6">
                {(() => {
                  const filtered = activeQuoteTemplates.filter((tpl) => {
                    const matchesCategory = selectedTemplateCategory === "All" || tpl.category === selectedTemplateCategory;
                    const query = templateSearchQuery.toLowerCase().trim();
                    const matchesQuery = !query || 
                      tpl.name.toLowerCase().includes(query) || 
                      (tpl.description || "").toLowerCase().includes(query) || 
                      tpl.content.toLowerCase().includes(query) ||
                      (tpl.placeholders || []).some(p => p.toLowerCase().includes(query));
                    return matchesCategory && matchesQuery;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl space-y-2">
                        <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-600">No matching quote templates found.</p>
                        <p className="text-[11px] text-slate-400">Try adjusting your search filter or add a new custom template.</p>
                      </div>
                    );
                  }

                  return filtered.map((tpl) => {
                    const isPreviewOpen = activePreviewTemplateId === tpl.id;
                    const renderedPreviewText = formatQuoteTemplate(tpl.content, DUMMY_PREVIEW_DATA);

                    return (
                      <div
                        key={tpl.id}
                        className={`border rounded-3xl p-5 md:p-6 transition-all space-y-4 ${
                          tpl.active
                            ? "bg-white border-slate-200 shadow-xs hover:border-slate-300"
                            : "bg-slate-50/70 border-slate-200/60 opacity-75"
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              tpl.category === "Quotations"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                                : tpl.category === "Delivery & Collection"
                                ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            }`}>
                              {tpl.category}
                            </span>

                            {tpl.toolKey && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                                Tool: {tpl.toolKey.toUpperCase()}
                              </span>
                            )}

                            {tpl.isDefault && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-200/50">
                                System Default
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                              <input
                                type="checkbox"
                                checked={tpl.active}
                                onChange={(e) => handleUpdateQuoteTemplate(tpl.id, { active: e.target.checked })}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                              />
                              <span>{tpl.active ? "Active" : "Disabled"}</span>
                            </label>

                            <div className="h-4 w-px bg-slate-200" />

                            <button
                              type="button"
                              onClick={() => handleDuplicateQuoteTemplate(tpl)}
                              title="Duplicate template"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {tpl.isDefault ? (
                              <button
                                type="button"
                                onClick={() => handleRestoreTemplateDefault(tpl.id)}
                                title="Restore system default wording"
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Restore Default</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteQuoteTemplate(tpl.id)}
                                title="Delete template"
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Editable Name & Description */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Template Name</label>
                            <input
                              type="text"
                              value={tpl.name}
                              onChange={(e) => handleUpdateQuoteTemplate(tpl.id, { name: e.target.value })}
                              className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Associated Tool / Key</label>
                            <select
                              value={tpl.toolKey || "general"}
                              onChange={(e) => handleUpdateQuoteTemplate(tpl.id, { toolKey: e.target.value as any })}
                              className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="apparel">T-Shirt Studio</option>
                              <option value="book">Book Cost Calculator</option>
                              <option value="dtf">DTF Printing</option>
                              <option value="production_layout">Production Layout</option>
                              <option value="location">Location Logistics</option>
                              <option value="general">General / Communications</option>
                            </select>
                          </div>

                          <div className="md:col-span-3 space-y-1">
                            <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Description / Application Note</label>
                            <input
                              type="text"
                              value={tpl.description || ""}
                              onChange={(e) => handleUpdateQuoteTemplate(tpl.id, { description: e.target.value })}
                              placeholder="Brief description of where this message is used..."
                              className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 focus:bg-white focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Dynamic Placeholders Toolbar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                              <Tag className="w-3 h-3 text-indigo-500" /> Dynamic Placeholders (Click tag to append to template)
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60">
                            {[
                              "{CustomerName}", "{QuoteDate}", "{GarmentType}", "{GarmentItems}", "{BookTitle}", 
                              "{Quantity}", "{UnitPrice}", "{Subtotal}", "{DiscountPercent}", "{DiscountAmount}", 
                              "{GrandTotal}", "{DeliveryMethod}", "{DeliveryCharge}", "{DeliveryMessage}", 
                              "{PickupLocation}", "{DepositAmount}", "{BusinessName}"
                            ].map((ph) => (
                              <button
                                key={ph}
                                type="button"
                                onClick={() => {
                                  const newContent = tpl.content + " " + ph;
                                  handleUpdateQuoteTemplate(tpl.id, { content: newContent });
                                }}
                                className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-[11px] font-mono font-bold text-indigo-700 transition-all cursor-pointer shadow-2xs"
                              >
                                {ph}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Main Template Content Textarea */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Template Wording / Structure</label>
                          <textarea
                            rows={8}
                            value={tpl.content}
                            onChange={(e) => handleUpdateQuoteTemplate(tpl.id, { content: e.target.value })}
                            className="w-full bg-slate-900 text-slate-100 font-mono text-xs rounded-2xl p-4 border border-slate-800 focus:border-indigo-500 focus:outline-none leading-relaxed shadow-inner"
                          />
                        </div>

                        {/* Live Preview Toggle & Panel */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setActivePreviewTemplateId(isPreviewOpen ? null : tpl.id)}
                              className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer transition-all"
                            >
                              <Eye className="w-4 h-4" />
                              <span>{isPreviewOpen ? "Hide Live Preview" : "View Live Customer Preview"}</span>
                            </button>

                            {isPreviewOpen && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(renderedPreviewText);
                                  setCopiedPreviewId(tpl.id);
                                  setTimeout(() => setCopiedPreviewId(null), 2000);
                                }}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                              >
                                {copiedPreviewId === tpl.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-700">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Copy Sample Text</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {isPreviewOpen && (
                            <div className="mt-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs font-sans text-slate-800 space-y-2 animate-fade-in shadow-xs">
                              <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2 text-[10px] font-extrabold uppercase text-slate-400">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span>Live Rendered Customer View (Simulated Sample Data)</span>
                              </div>
                              <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/60 font-medium">
                                {renderedPreviewText}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* New Template Creation Modal */}
              {showAddTemplateModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full space-y-5 shadow-2xl border border-slate-200 text-left animate-fade-in">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-indigo-600" /> Create Custom Message Template
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowAddTemplateModal(false)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleCreateNewQuoteTemplate} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold uppercase text-slate-500">Template Title</label>
                        <input
                          type="text"
                          required
                          value={newTplName}
                          onChange={(e) => setNewTplName(e.target.value)}
                          placeholder="E.g. Express Production Follow-Up Quote"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase text-slate-500">Category</label>
                          <select
                            value={newTplCategory}
                            onChange={(e) => setNewTplCategory(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="Quotations">Quotations</option>
                            <option value="Delivery & Collection">Delivery & Collection</option>
                            <option value="Customer Communications">Customer Communications</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold uppercase text-slate-500">Tool Key</label>
                          <select
                            value={newTplToolKey}
                            onChange={(e) => setNewTplToolKey(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="apparel">T-Shirt Studio</option>
                            <option value="book">Book Cost Calculator</option>
                            <option value="dtf">DTF Printing</option>
                            <option value="production_layout">Production Layout</option>
                            <option value="location">Location Logistics</option>
                            <option value="general">General / Communications</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold uppercase text-slate-500">Description</label>
                        <input
                          type="text"
                          value={newTplDescription}
                          onChange={(e) => setNewTplDescription(e.target.value)}
                          placeholder="Purpose or context of this template"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold uppercase text-slate-500">Template Text Content (Use {"{Placeholders}"})</label>
                        <textarea
                          rows={6}
                          required
                          value={newTplContent}
                          onChange={(e) => setNewTplContent(e.target.value)}
                          placeholder={"Dear {CustomerName},\n\nThank you for choosing {BusinessName}. Your quote for {GarmentType} is JMD {GrandTotal}.\n\nWarm regards,\n{BusinessName}"}
                          className="w-full bg-slate-900 text-slate-100 font-mono text-xs rounded-2xl p-3 border border-slate-800 focus:border-indigo-500 focus:outline-none leading-relaxed"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setShowAddTemplateModal(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
                        >
                          Create Template
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PRODUCTION MATERIALS SETTINGS */}
          {activeSubTab === "production_materials" && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm text-left space-y-6">
              
              {/* Header & Internal Nav Tabs */}
              <div className="pb-4 border-b border-slate-100 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Production Materials &amp; Supplier Settings</h3>
                      <p className="text-xs text-slate-400 font-medium">Control DTF Suppliers, DTF Customer Pricing Presets, and Paper Sheet materials for production calculators.</p>
                    </div>
                  </div>

                  {/* Internal Subtab Pills */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setProdMatSubTab("dtf_suppliers")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        prodMatSubTab === "dtf_suppliers"
                          ? "bg-white text-indigo-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      DTF Suppliers
                    </button>

                    <button
                      type="button"
                      onClick={() => setProdMatSubTab("dtf_pricing")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        prodMatSubTab === "dtf_pricing"
                          ? "bg-white text-indigo-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      DTF Customer Pricing
                    </button>

                    <button
                      type="button"
                      onClick={() => setProdMatSubTab("paper")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        prodMatSubTab === "paper"
                          ? "bg-white text-indigo-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Paper &amp; Sticker Sheets
                    </button>
                  </div>
                </div>
              </div>

              {/* 1. DTF SUPPLIERS SUBTAB */}
              {prodMatSubTab === "dtf_suppliers" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        DTF Printing Suppliers ({ (localSettings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS).length })
                      </h4>
                      <p className="text-[11px] text-slate-400">Manage supplier sheet dimensions, cost per sheet, and delivery fees.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const current = localSettings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS;
                        const newSup: DTFSupplier = {
                          id: "dtf_sup_" + Date.now(),
                          name: "New DTF Supplier",
                          sheetWidth: 12,
                          sheetHeight: 17,
                          costPerSheet: 850,
                          deliveryCost: 0,
                          notes: "",
                          active: true
                        };
                        handleChange("dtfSuppliers", [...current, newSup]);
                      }}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add Supplier</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(localSettings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS).map((sup, idx) => (
                      <div key={sup.id || idx} className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 md:p-5 space-y-4 shadow-2xs">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                          {/* Supplier Name */}
                          <div className="md:col-span-3 space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                              Supplier Name
                            </label>
                            <input
                              type="text"
                              value={sup.name}
                              onChange={(e) => {
                                const list = [...(localSettings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS)];
                                list[idx] = { ...list[idx], name: e.target.value };
                                handleChange("dtfSuppliers", list);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                              placeholder="E.g. KRZ Prints"
                            />
                          </div>

                          {/* Sheet Width */}
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                              Sheet Width (in)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              value={sup.sheetWidth}
                              onChange={(e) => {
                                const list = [...(localSettings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS)];
                                list[idx] = { ...list[idx], sheetWidth: parseFloat(e.target.value) || 0 };
                                handleChange("dtfSuppliers", list);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-hidden"
                            />
                          </div>

                          {/* Sheet Height */}
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                              Sheet Height (in)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              value={sup.sheetHeight}
                              onChange={(e) => {
                                const list = [...(localSettings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS)];
                                list[idx] = { ...list[idx], sheetHeight: parseFloat(e.target.value) || 0 };
                                handleChange("dtfSuppliers", list);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-hidden"
                            />
                          </div>

                          {/* Cost Per Sheet */}
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                              Cost / Sheet ($)
                            </label>
                            <input
                              type="number"
                              value={sup.costPerSheet}
                              onChange={(e) => {
                                const list = [...(localSettings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS)];
                                list[idx] = { ...list[idx], costPerSheet: parseFloat(e.target.value) || 0 };
                                handleChange("dtfSuppliers", list);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
                            />
                          </div>

                          {/* Delivery Cost */}
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                              Delivery Fee ($)
                            </label>
                            <input
                              type="number"
                              value={sup.deliveryCost}
                              onChange={(e) => {
                                const list = [...(localSettings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS)];
                                list[idx] = { ...list[idx], deliveryCost: parseFloat(e.target.value) || 0 };
                                handleChange("dtfSuppliers", list);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
                            />
                          </div>

                          {/* Actions */}
                          <div className="md:col-span-1 flex items-center justify-end gap-2 pt-2 md:pt-0">
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...(localSettings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS)];
                                list[idx] = { ...list[idx], active: !list[idx].active };
                                handleChange("dtfSuppliers", list);
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                                sup.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {sup.active ? "Active" : "Inactive"}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const list = [...(localSettings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS)];
                                if (list.length <= 1) {
                                  alert("At least one supplier must remain.");
                                  return;
                                }
                                handleChange("dtfSuppliers", list.filter((_, i) => i !== idx));
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Supplier Notes */}
                        <div className="pt-2 border-t border-slate-200/60">
                          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                            Supplier Notes / Contact Details
                          </label>
                          <input
                            type="text"
                            value={sup.notes || ""}
                            onChange={(e) => {
                              const list = [...(localSettings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS)];
                              list[idx] = { ...list[idx], notes: e.target.value };
                              handleChange("dtfSuppliers", list);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700"
                            placeholder="E.g. Next-day delivery available. Contact John @ 876-555-0199..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. DTF CUSTOMER PRICING SUBTAB */}
              {prodMatSubTab === "dtf_pricing" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        DTF Print Pricing Presets ({ (localSettings.dtfPricingPresets || DEFAULT_DTF_PRICING).length })
                      </h4>
                      <p className="text-[11px] text-slate-400">Manage standard print dimensions and customer selling prices.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const current = localSettings.dtfPricingPresets || DEFAULT_DTF_PRICING;
                        const newPreset: DTFPricingPreset = {
                          id: "dtf_p_" + Date.now(),
                          sizeLabel: 'Custom Print Size',
                          width: 10,
                          height: 10,
                          sellingPrice: 1800,
                          notes: "",
                          active: true
                        };
                        handleChange("dtfPricingPresets", [...current, newPreset]);
                      }}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add Pricing Preset</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(localSettings.dtfPricingPresets || DEFAULT_DTF_PRICING).map((preset, idx) => (
                      <div key={preset.id || idx} className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 md:p-5 space-y-4 shadow-2xs">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                          {/* Size Label */}
                          <div className="md:col-span-4 space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                              Print Size Label
                            </label>
                            <input
                              type="text"
                              value={preset.sizeLabel}
                              onChange={(e) => {
                                const list = [...(localSettings.dtfPricingPresets || DEFAULT_DTF_PRICING)];
                                list[idx] = { ...list[idx], sizeLabel: e.target.value };
                                handleChange("dtfPricingPresets", list);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                              placeholder="E.g. 12 x 10 inches"
                            />
                          </div>

                          {/* Width */}
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                              Width (in)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={preset.width || ""}
                              onChange={(e) => {
                                const list = [...(localSettings.dtfPricingPresets || DEFAULT_DTF_PRICING)];
                                list[idx] = { ...list[idx], width: parseFloat(e.target.value) || 0 };
                                handleChange("dtfPricingPresets", list);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-800"
                            />
                          </div>

                          {/* Height */}
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                              Height (in)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={preset.height || ""}
                              onChange={(e) => {
                                const list = [...(localSettings.dtfPricingPresets || DEFAULT_DTF_PRICING)];
                                list[idx] = { ...list[idx], height: parseFloat(e.target.value) || 0 };
                                handleChange("dtfPricingPresets", list);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-800"
                            />
                          </div>

                          {/* Selling Price */}
                          <div className="md:col-span-3 space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                              Selling Price per Print ($ JMD)
                            </label>
                            <input
                              type="number"
                              value={preset.sellingPrice}
                              onChange={(e) => {
                                const list = [...(localSettings.dtfPricingPresets || DEFAULT_DTF_PRICING)];
                                list[idx] = { ...list[idx], sellingPrice: parseFloat(e.target.value) || 0 };
                                handleChange("dtfPricingPresets", list);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-900"
                            />
                          </div>

                          {/* Actions */}
                          <div className="md:col-span-1 flex items-center justify-end gap-2 pt-2 md:pt-0">
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...(localSettings.dtfPricingPresets || DEFAULT_DTF_PRICING)];
                                list[idx] = { ...list[idx], active: !list[idx].active };
                                handleChange("dtfPricingPresets", list);
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                                preset.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {preset.active ? "Active" : "Inactive"}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const list = [...(localSettings.dtfPricingPresets || DEFAULT_DTF_PRICING)];
                                if (list.length <= 1) {
                                  alert("At least one pricing preset must remain.");
                                  return;
                                }
                                handleChange("dtfPricingPresets", list.filter((_, i) => i !== idx));
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. PAPER & STICKER SHEETS SUBTAB */}
              {prodMatSubTab === "paper" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Paper &amp; Sticker Sheet Presets
                    </h4>

                    <button
                      type="button"
                      onClick={() => {
                        const currentMats = localSettings.productionMaterials || DEFAULT_PRODUCTION_MATERIALS;
                        const newMat: ProductionMaterialPreset = {
                          id: "mat_" + Date.now(),
                          name: "New Sheet Material",
                          width: 11,
                          height: 8.5,
                          cost: 375
                        };
                        handleChange("productionMaterials", [...currentMats, newMat]);
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add Material</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(localSettings.productionMaterials || DEFAULT_PRODUCTION_MATERIALS).map((mat, idx) => {
                      const lastUpdated = mat.lastUpdatedDate || "July 2026";
                      const priceHistory = mat.pricingHistory || [];
                      const prevPriceRecord = priceHistory.length > 1 ? priceHistory[priceHistory.length - 2] : null;

                      return (
                        <div key={mat.id || idx} className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 md:p-5 space-y-4 shadow-2xs transition-all">
                          
                          {/* Top row: Name, dimensions, cost & action */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                            {/* Name Input */}
                            <div className="md:col-span-4 space-y-1">
                              <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                Material Name
                              </label>
                              <input
                                type="text"
                                value={mat.name}
                                onChange={(e) => {
                                  const updated = [...(localSettings.productionMaterials || DEFAULT_PRODUCTION_MATERIALS)];
                                  updated[idx] = { ...updated[idx], name: e.target.value, lastUpdatedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
                                  handleChange("productionMaterials", updated);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                                placeholder="E.g. Crack & Peel Sticker Sheet"
                              />
                            </div>

                            {/* Width */}
                            <div className="md:col-span-2 space-y-1">
                              <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                Width (in)
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={mat.width}
                                onChange={(e) => {
                                  const updated = [...(localSettings.productionMaterials || DEFAULT_PRODUCTION_MATERIALS)];
                                  updated[idx] = { ...updated[idx], width: parseFloat(e.target.value) || 0 };
                                  handleChange("productionMaterials", updated);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                              />
                            </div>

                            {/* Height */}
                            <div className="md:col-span-2 space-y-1">
                              <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                Height (in)
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={mat.height}
                                onChange={(e) => {
                                  const updated = [...(localSettings.productionMaterials || DEFAULT_PRODUCTION_MATERIALS)];
                                  updated[idx] = { ...updated[idx], height: parseFloat(e.target.value) || 0 };
                                  handleChange("productionMaterials", updated);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                              />
                            </div>

                            {/* Cost per sheet */}
                            <div className="md:col-span-3 space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                  Current Cost / Sheet ($ JMD)
                                </label>
                                {prevPriceRecord && (
                                  <span className="text-[9px] font-mono text-slate-400 italic">
                                    Prev: ${prevPriceRecord.price}
                                  </span>
                                )}
                              </div>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                                <input
                                  type="number"
                                  value={mat.cost}
                                  onChange={(e) => {
                                    const newCost = parseFloat(e.target.value) || 0;
                                    const updated = [...(localSettings.productionMaterials || DEFAULT_PRODUCTION_MATERIALS)];
                                    const currentMat = updated[idx];
                                    const oldCost = currentMat.cost;

                                    let history = currentMat.pricingHistory || [];
                                    if (newCost !== oldCost && newCost > 0) {
                                      history = [
                                        ...history,
                                        {
                                          id: `ph-${Date.now()}`,
                                          price: newCost,
                                          date: new Date().toISOString().split("T")[0],
                                          reason: `Price update from $${oldCost} to $${newCost}`,
                                          updatedBy: userFullName || "Master Administrator"
                                        }
                                      ];
                                    }

                                    updated[idx] = { 
                                      ...currentMat, 
                                      cost: newCost, 
                                      pricingHistory: history,
                                      lastUpdatedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                    };
                                    handleChange("productionMaterials", updated);
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-xl pl-6 pr-2 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                                />
                              </div>
                            </div>

                            {/* Delete button */}
                            <div className="md:col-span-1 flex items-end justify-end pt-2 md:pt-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const currentMats = localSettings.productionMaterials || DEFAULT_PRODUCTION_MATERIALS;
                                  if (currentMats.length <= 1) {
                                    alert("At least one production material preset must remain.");
                                    return;
                                  }
                                  const updated = currentMats.filter((_, i) => i !== idx);
                                  handleChange("productionMaterials", updated);
                                }}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                title="Remove Material Preset"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Supplier Notes */}
                          <div className="pt-3 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                            <div className="md:col-span-6 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-extrabold uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                                  Supplier Notes &amp; Price Comparison
                                </label>
                                <span className="text-[9px] font-mono text-slate-400 font-bold">
                                  Last Updated: {lastUpdated}
                                </span>
                              </div>
                              <textarea
                                rows={3}
                                value={mat.supplierNotes || ""}
                                onChange={(e) => {
                                  const updated = [...(localSettings.productionMaterials || DEFAULT_PRODUCTION_MATERIALS)];
                                  updated[idx] = { 
                                    ...updated[idx], 
                                    supplierNotes: e.target.value,
                                    lastUpdatedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                  };
                                  handleChange("productionMaterials", updated);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-indigo-500 leading-relaxed"
                                placeholder="Record supplier quotes..."
                              />
                            </div>

                            <div className="md:col-span-6 space-y-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-extrabold uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                                  Alternative Sources
                                </label>
                                <input
                                  type="text"
                                  value={mat.alternativeSources || ""}
                                  onChange={(e) => {
                                    const updated = [...(localSettings.productionMaterials || DEFAULT_PRODUCTION_MATERIALS)];
                                    updated[idx] = { ...updated[idx], alternativeSources: e.target.value };
                                    handleChange("productionMaterials", updated);
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800"
                                />
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 2. INVENTORY CONTROL */}
          {activeSubTab === "inventory" && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm text-left space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Inventory Control Settings</h3>
                  <p className="text-xs text-slate-400 font-medium">Define thresholds for automated warehouse watchtowers and low stock alarms.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={localSettings.lowStockThreshold}
                    onChange={(e) => handleChange("lowStockThreshold", parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                  />
                  <span className="text-[10px] text-slate-400 block font-medium">Triggers soft "Low Stock" warning badge across catalogs.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Restock Alert Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={localSettings.restockThreshold}
                    onChange={(e) => handleChange("restockThreshold", parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                  />
                  <span className="text-[10px] text-slate-400 block font-medium">Triggers active watchtower suggestions to issue purchase re-orders.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Default Book Status</label>
                  <select
                    value={localSettings.defaultBookStatus}
                    onChange={(e) => handleChange("defaultBookStatus", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                  >
                    <option value="Active">Active</option>
                    <option value="Evaluating">Evaluating</option>
                    <option value="Pending Delivery">Pending Delivery</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block font-medium">Pre-populated default status for newly cataloged items.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Inventory Warning Level</label>
                  <select
                    value={localSettings.inventoryWarningLevels}
                    onChange={(e) => handleChange("inventoryWarningLevels", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                  >
                    <option value="Low">Low (Soft warnings)</option>
                    <option value="Moderate">Moderate (Catalogs + Dashboard alerts)</option>
                    <option value="Strict">Strict (Block checkout/orders if below threshold)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block font-medium">Rigidity rule for catalog depletion notifications.</span>
                </div>

                <div className="md:col-span-2 py-2 flex items-center justify-between border-t border-slate-100 mt-2">
                  <div className="space-y-0.5 text-left">
                    <span className="text-xs font-bold text-slate-800">Auto-Alert for Out of Stock Rules</span>
                    <p className="text-[10px] text-slate-400 font-medium">Send automatic High Priority alerts to Dashboard if a luxury item hits zero quantity.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={localSettings.outOfStockAlertRules}
                      onChange={(e) => handleChange("outOfStockAlertRules", e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 3. MILESTONE REMINDERS */}
          {activeSubTab === "reminders" && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm text-left space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Milestone Reminder Windows</h3>
                  <p className="text-xs text-slate-400 font-medium">Customize the pre-alert notice window (number of days before the event) for client relationship milestones.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Birthday Reminder Pre-alert</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={localSettings.birthdayReminderDays}
                      onChange={(e) => handleChange("birthdayReminderDays", parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-800 pr-12 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">Days</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium">Trigger client and family birthday tasks in advance (Default: 14).</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Anniversary Reminder Pre-alert</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={localSettings.anniversaryReminderDays}
                      onChange={(e) => handleChange("anniversaryReminderDays", parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-800 pr-12 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">Days</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium">For wedding, corporate, and special anniversaries.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Proposal Anniversary Pre-alert</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={localSettings.proposalAnniversaryReminderDays}
                      onChange={(e) => handleChange("proposalAnniversaryReminderDays", parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-800 pr-12 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">Days</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium">Advance warning window for romantic proposal anniversaries.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Custom Milestone Pre-alert</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={localSettings.customMilestoneReminderDays}
                      onChange={(e) => handleChange("customMilestoneReminderDays", parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-800 pr-12 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">Days</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium">For unclassified custom customer milestones.</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. BRANDING & APPEARANCE */}
          {activeSubTab === "branding" && (
            <div className="space-y-8">
              {/* Text metadata settings */}
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm text-left space-y-6">
                <div className="pb-4 border-b border-slate-100 flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Application Branding & Metadata</h3>
                    <p className="text-xs text-slate-400 font-medium">Personalize the corporate identity properties presented throughout the layout.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Application Name</label>
                    <input
                      type="text"
                      value={localSettings.appName}
                      onChange={(e) => handleChange("appName", e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                    />
                    <span className="text-[10px] text-slate-400 block font-medium">The title presented in the main navigation topbar.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Company Name</label>
                    <input
                      type="text"
                      value={localSettings.companyName}
                      onChange={(e) => handleChange("companyName", e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                    />
                    <span className="text-[10px] text-slate-400 block font-medium">Main enterprise moniker.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Business Slogan</label>
                    <input
                      type="text"
                      value={localSettings.businessSlogan}
                      onChange={(e) => handleChange("businessSlogan", e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                    />
                    <span className="text-[10px] text-slate-400 block font-medium">Sub-title and footer slogan.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Footer Copyright Notice</label>
                    <input
                      type="text"
                      value={localSettings.footerText}
                      onChange={(e) => handleChange("footerText", e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                    />
                    <span className="text-[10px] text-slate-400 block font-medium">Text rendered in page layout bottom rail.</span>
                  </div>

                  <div className="md:col-span-2 space-y-3 pt-2">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Application Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl border border-slate-200/80 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                        {localSettings.appLogo ? (
                          <img src={localSettings.appLogo} alt="App Logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-black text-slate-400 uppercase">No Logo</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="file"
                          ref={logoFileInputRef}
                          onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                          accept="image/*"
                          className="hidden"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => logoFileInputRef.current?.click()}
                            className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-[10px] font-bold rounded-xl text-slate-700 cursor-pointer shadow-xs"
                          >
                            Upload Custom Logo
                          </button>
                          {localSettings.appLogo && (
                            <button
                              type="button"
                              onClick={() => handleChange("appLogo", "")}
                              className="p-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-xl cursor-pointer"
                              title="Remove Logo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-[9.5px] text-slate-400">Square dimensions (e.g. 200x200px) on transparent background recommended.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Wallpapers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                
                {/* Main App Wall */}
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-indigo-600" />
                      Workspace Wallpaper
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                      Main dashboard background behind standard windows.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div 
                      className="aspect-video w-full rounded-2xl border border-slate-200/80 bg-cover bg-center shadow-xs overflow-hidden relative flex items-end p-3"
                      style={{ backgroundImage: `url(${appBg || defaultBg})` }}
                    >
                      <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[0.5px]" />
                      <span className="relative z-10 text-[9px] bg-white/95 backdrop-blur-xs text-slate-700 px-2 py-1 rounded-md font-bold border border-slate-100 shadow-xs">
                        {appBg ? "Custom Wallpaper" : "Default Cosmic Background"}
                      </span>
                    </div>

                    <input 
                      type="file" 
                      ref={appFileInputRef}
                      onChange={(e) => e.target.files?.[0] && handleAppImageUpload(e.target.files[0])}
                      accept="image/*"
                      className="hidden" 
                    />
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => appFileInputRef.current?.click()}
                        className="flex-1 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 text-slate-700 text-[10px] font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        Upload Image
                      </button>
                      {appBg && (
                        <button
                          type="button"
                          onClick={() => {
                            onResetAppBg();
                            handleChange("appBg", "");
                          }}
                          className="py-2 px-3 border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Authentication Wall */}
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      Login Screen Wallpaper
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                      Displayed behind secure input windows on log-in page.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div 
                      className="aspect-video w-full rounded-2xl border border-slate-200/80 bg-cover bg-center shadow-xs overflow-hidden relative flex items-end p-3"
                      style={{ backgroundImage: `url(${authBg || defaultBg})` }}
                    >
                      <div className="absolute inset-0 bg-slate-950/25 backdrop-blur-[0.5px]" />
                      <span className="relative z-10 text-[9px] bg-white/95 backdrop-blur-xs text-slate-700 px-2 py-1 rounded-md font-bold border border-slate-100 shadow-xs">
                        {authBg ? "Custom Login Gateway" : "Default Cosmic Background"}
                      </span>
                    </div>

                    <input 
                      type="file" 
                      ref={authFileInputRef}
                      onChange={(e) => e.target.files?.[0] && handleAuthImageUpload(e.target.files[0])}
                      accept="image/*"
                      className="hidden" 
                    />
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => authFileInputRef.current?.click()}
                        className="flex-1 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 text-slate-700 text-[10px] font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        Upload Image
                      </button>
                      {authBg && (
                        <button
                          type="button"
                          onClick={() => {
                            onResetAuthBg();
                            handleChange("authBg", "");
                          }}
                          className="py-2 px-3 border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 5. SECURITY & CREDENTIALS */}
          {activeSubTab === "security" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left items-start">
              
              {/* Change Password Panel */}
              <div className="lg:col-span-8 bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                <div className="pb-4 border-b border-slate-100 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Administrative Security & Credentials</h3>
                    <p className="text-xs text-slate-400 font-medium">Manage access logs, secure system login IDs, and master passwords.</p>
                  </div>
                </div>

                {credSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-xl flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-emerald-600" /> {credSuccess}
                  </div>
                )}
                {credError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-700 rounded-xl flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 text-red-600" /> {credError}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Change Master Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><User className="w-3.5 h-3.5" /></span>
                      <input
                        type="text"
                        value={localSettings.masterUsername}
                        onChange={(e) => handleChange("masterUsername", e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl py-2 px-3 pl-9 text-xs font-semibold text-slate-800 transition-colors"
                        placeholder="Enter master admin username"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 pr-10 transition-colors"
                          placeholder="Type new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 transition-colors"
                        placeholder="Verify new password"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      Update Credentials
                    </button>
                    <button
                      type="button"
                      onClick={handleResetCredentials}
                      className="py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Reset Default
                    </button>
                  </div>
                </form>
              </div>

              {/* Policies & Timers */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Security Policies</span>
                  
                  <div className="space-y-4 text-xs font-medium text-slate-700">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Session Timeout</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="5"
                          value={localSettings.sessionTimeoutMinutes}
                          onChange={(e) => handleChange("sessionTimeoutMinutes", parseInt(e.target.value, 10) || 30)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 pr-12 font-mono font-bold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-black">Min</span>
                      </div>
                      <span className="text-[9.5px] text-slate-400 leading-normal block">Log out inactive desktop sessions automatically.</span>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Automatic Logout Timer</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          value={localSettings.autoLogoutTimerMinutes}
                          onChange={(e) => handleChange("autoLogoutTimerMinutes", parseInt(e.target.value, 10) || 15)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 pr-12 font-mono font-bold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-black">Min</span>
                      </div>
                      <span className="text-[9.5px] text-slate-400 leading-normal block">Strict timeout for Auth Screen state locking.</span>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Password Policy</label>
                      <select
                        value={localSettings.passwordPolicy}
                        onChange={(e) => handleChange("passwordPolicy", e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2.5 font-semibold text-slate-800"
                      >
                        <option value="Simple">Simple (3+ characters)</option>
                        <option value="Moderate">Moderate (6+ characters, alpha-numeric)</option>
                        <option value="Strong">Strong (8+ characters, complex with numbers & symbols)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-[9.5px] leading-relaxed text-indigo-700 font-semibold flex gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="font-extrabold block">Executive Standard</span>
                    These credentials protect all database registries, luxury portfolios, transaction records, and corporate metrics from public access. Keep passwords complex.
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 6. DEFAULT PREFERENCES */}
          {activeSubTab === "preferences" && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm text-left space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Application Preferences</h3>
                  <p className="text-xs text-slate-400 font-medium">Configure global default presentations for calendars, layouts, and formatting masks.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Default Dashboard View</label>
                  <select
                    value={localSettings.defaultDashboardView}
                    onChange={(e) => handleChange("defaultDashboardView", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                  >
                    <option value="today">Today's Focus (Pending Followups & Milestones)</option>
                    <option value="this_week">This Week's Outlook</option>
                    <option value="overview">Executive Metrics Dashboard</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block font-medium">Initial visual state loaded for signed-in sessions.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Default Calendar View</label>
                  <select
                    value={localSettings.defaultCalendarView}
                    onChange={(e) => handleChange("defaultCalendarView", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                  >
                    <option value="month">Grid Calendar (Monthly overview)</option>
                    <option value="week">Timeline (Weekly block)</option>
                    <option value="agenda">Agenda Lists (Executive schedule)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Date Format Mask</label>
                  <select
                    value={localSettings.dateFormat}
                    onChange={(e) => handleChange("dateFormat", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                  >
                    <option value="YYYY-MM-DD">Standard ISO (e.g. 2026-07-18)</option>
                    <option value="DD/MM/YYYY">British Standard (e.g. 18/07/2026)</option>
                    <option value="MM/DD/YYYY">US Standard (e.g. 07/18/2026)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Currency Formatting Standard</label>
                  <select
                    value={localSettings.currencyDisplayFormat}
                    onChange={(e) => handleChange("currencyDisplayFormat", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                  >
                    <option value="Standard">Standard (e.g. $1,350 JMD)</option>
                    <option value="Symbol Only">Symbol Prefixed (e.g. J$1,350)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Application Theme Preset</label>
                  <select
                    value={localSettings.themePreference}
                    onChange={(e) => handleChange("themePreference", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                  >
                    <option value="cosmic_slate">Ambient Cosmic Slate (Apple Dark Mode inspired)</option>
                    <option value="executive_dark">Luxury Royal Gold & Charcoal</option>
                    <option value="classic_light">Corporate Minimalist Ivory Light</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block font-medium">Scalable design presets for future layout expansion.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Dashboard Carousel Default Slide</label>
                  <select
                    value={localSettings.dashboardCarouselDefaultIndex ?? 0}
                    onChange={(e) => handleChange("dashboardCarouselDefaultIndex", parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                  >
                    <option value={0}>Librarium Luxe Inventory</option>
                    <option value={1}>Interactive Agenda</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block font-medium">Default starting slide for the primary Dashboard Interactive Carousel.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Luxe Inventory Carousel Default Slide</label>
                  <select
                    value={localSettings.luxeInventoryCarouselDefaultIndex ?? 0}
                    onChange={(e) => handleChange("luxeInventoryCarouselDefaultIndex", parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                  >
                    <option value={0}>Inventory Health & Summary</option>
                    <option value={1}>Performance & Analytics</option>
                    <option value={2}>Premium Book Catalog</option>
                    <option value={3}>Inactive Archives</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block font-medium">Default starting slide for the Luxe Inventory Interactive Carousel.</span>
                </div>
              </div>
            </div>
          )}

          {/* 7. FUTURE EXPANSIONS */}
          {activeSubTab === "expansion" && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm text-left space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Scalable System Modules</h3>
                  <p className="text-xs text-slate-400 font-medium">These pre-designed placeholders allow adding third-party endpoints and integrations in the future with zero code architectural refactoring.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Module 1 */}
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between h-32 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 bg-emerald-50 text-emerald-600 font-bold text-[8px] uppercase tracking-wider rounded-bl border-l border-b border-slate-200/30">
                    Integration Ready
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800">Email SMTP Gateway</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">SMTP server details for automated client anniversary gift reminder emails.</p>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block pt-2 border-t border-slate-150">Coming Soon</span>
                </div>

                {/* Module 2 */}
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between h-32 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 bg-emerald-50 text-emerald-600 font-bold text-[8px] uppercase tracking-wider rounded-bl border-l border-b border-slate-200/30">
                    Security Active
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800">Database Backup & Recovery</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Daily automatic schema backup exports in Excel or JSON format.</p>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block pt-2 border-t border-slate-150">Coming Soon</span>
                </div>

                {/* Module 3 */}
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between h-32 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 bg-emerald-50 text-emerald-600 font-bold text-[8px] uppercase tracking-wider rounded-bl border-l border-b border-slate-200/30">
                    Audit Ready
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800">Corporate Audit Logs</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Immutable system ledger recording customer creations and inventory modifications.</p>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block pt-2 border-t border-slate-150">Coming Soon</span>
                </div>

                {/* Module 4 */}
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between h-32 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 bg-indigo-50 text-indigo-600 font-bold text-[8px] uppercase tracking-wider rounded-bl border-l border-b border-slate-200/30">
                    REST API
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800">API Configurations</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">OAuth endpoints and webhook channels to broadcast metrics to Slack or Shopify.</p>
                  </div>
                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block pt-2 border-t border-slate-150">Scalable Sandbox</span>
                </div>

                {/* Module 5 */}
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between h-32 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 bg-indigo-50 text-indigo-600 font-bold text-[8px] uppercase tracking-wider rounded-bl border-l border-b border-slate-200/30">
                    Governance
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800">User Role Permissions</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Granular access control grids restricting staff from editing client life histories.</p>
                  </div>
                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block pt-2 border-t border-slate-150">Scalable Sandbox</span>
                </div>

                {/* Module 6 */}
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between h-32 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 bg-indigo-50 text-indigo-600 font-bold text-[8px] uppercase tracking-wider rounded-bl border-l border-b border-slate-200/30">
                    Compliance
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800">GDPR Data Retention</h4>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Auto-purging deactivated customer files after a custom period of inactivity.</p>
                  </div>
                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block pt-2 border-t border-slate-150">Scalable Sandbox</span>
                </div>

              </div>
            </div>
          )}

          {/* 7. SYSTEM DATABASE BACKUP & RESTORE */}
          {activeSubTab === "backup" && userRole === "Master Administrator" && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm text-left space-y-8">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Data Management & Master Backup System</h3>
                    <p className="text-xs text-slate-500 font-medium">Create automated snapshots, manage backup notes, restore system data, and view audit history.</p>
                  </div>
                </div>
              </div>

              {/* Status messages */}
              {backupFileSuccess && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-2xl flex items-start gap-2.5 text-xs font-bold animate-fade-in">
                  <Check className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{backupFileSuccess}</span>
                </div>
              )}
              {backupFileError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-2.5 text-xs font-bold animate-fade-in">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span>{backupFileError}</span>
                </div>
              )}

              {/* Section 1: Export Current Test Environment */}
              <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-6 space-y-4 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider block">Option 1</span>
                    <h4 className="text-xs font-extrabold text-slate-900">Export Current Test Environment</h4>
                  </div>
                  <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
                    Live Migration Export
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Export all current test data from this development environment to migrate into the live application for full stress testing without manually recreating records.
                </p>

                {/* Scope breakdown list */}
                <div className="p-4 bg-white border border-slate-200/80 rounded-xl space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block">
                    Export Package Scope Includes:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span><strong>Client Management:</strong> Platinum, Gold, Silver profiles, notes & history</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span><strong>Aspiring Clients:</strong> Pipeline leads, follow-up dates & opportunity status</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span><strong>Calendar & Tasks:</strong> Milestone events, agenda items & reminders</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span><strong>Luxe Inventory:</strong> Book titles, stock levels & low stock alerts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span><strong>Production Tools:</strong> Saved quotes, calculator states & delivery fees</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span><strong>System Settings:</strong> System preferences, user permissions & branding</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Export Notes / Migration Ledger Entry (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={manualBackupNotes}
                    onChange={(e) => setManualBackupNotes(e.target.value)}
                    placeholder="E.g., Test environment snapshot for V2.1 live deployment stress testing."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={handleTriggerTestEnvExcel}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-xs text-xs cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    Export Test Environment (.xlsx)
                  </button>

                  <button
                    onClick={handleTriggerTestEnvJson}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl transition-all shadow-xs text-xs cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-indigo-500" />
                    Export Test Environment (.json)
                  </button>
                </div>
              </div>

              {/* Dedicated Option: Client Data Export (V2.1) */}
              <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-6 space-y-4 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-700 tracking-wider block">Client Database Export (V2.1)</span>
                    <h4 className="text-xs font-extrabold text-slate-900">Export Current Client Database ({clients?.length || 45} Clients)</h4>
                  </div>
                  <span className="text-[9px] font-extrabold text-indigo-800 bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
                    {clients?.length || 45} Synced Profiles
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  Download the complete client database including Client IDs, contact info, Platinum/Gold/Silver tiers, status, relationship connections, family birthdays, anniversaries, purchase histories, preferences, and notes.
                </p>

                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    onClick={() => setIsClientExportOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md text-xs cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-indigo-200" />
                    Export Current Client Database
                  </button>
                </div>
              </div>

              {/* Section 2: Import Existing Backup / Live Migration */}
              <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-6 space-y-5 text-left">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-amber-600 tracking-wider block">Option 2</span>
                  <h4 className="text-xs font-extrabold text-slate-900">Import Existing Backup / Environment Migration</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Select a previously generated <code className="font-mono text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">.xlsx</code> or <code className="font-mono text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">.json</code> test environment file to import into the application.
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.json"
                    onChange={handleBackupFileSelected}
                    className="hidden"
                    id="system-backup-upload-input"
                  />
                  <label
                    htmlFor="system-backup-upload-input"
                    className="flex flex-col items-center justify-center p-6 bg-white hover:bg-slate-50 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl cursor-pointer transition-all text-center group"
                  >
                    <UploadCloud className="w-8 h-8 text-indigo-500 group-hover:scale-110 transition-transform mb-2" />
                    <span className="text-xs font-bold text-slate-800">Click or Drag & Drop Test Data File (.xlsx or .json)</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">Automated validation will verify structure and data integrity before restoration.</span>
                  </label>
                </div>

                {/* Validation Audit Box */}
                {validationReport && (
                  <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-5 space-y-4 animate-fade-in text-left">
                    <div className="flex items-center justify-between pb-3 border-b border-amber-200/50">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                        <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                          Backup File Validation Audit
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-extrabold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md">
                          ID: {validationReport.backupId || "TEST-EXP-V2.1"}
                        </span>
                        <span className="text-[10px] font-mono font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                          Version {validationReport.version || "2.1.0"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 bg-white border border-amber-100 rounded-xl">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Backup Date</span>
                        <span className="font-extrabold text-slate-800">{validationReport.backupDate || "N/A"}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-amber-100 rounded-xl">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Created By</span>
                        <span className="font-extrabold text-slate-800">{validationReport.createdBy || "Master Administrator"}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-amber-100 rounded-xl">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Active Clients</span>
                        <span className="font-extrabold text-slate-800">{validationReport.itemCounts?.clients || 0}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-amber-100 rounded-xl">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Aspiring Leads</span>
                        <span className="font-extrabold text-slate-800">{validationReport.itemCounts?.aspiringClients || 0}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-amber-100 rounded-xl">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Luxe Inventory</span>
                        <span className="font-extrabold text-slate-800">{validationReport.itemCounts?.inventory || 0} items ({validationReport.itemCounts?.totalBooks || 0} books)</span>
                      </div>
                      <div className="p-2.5 bg-white border border-amber-100 rounded-xl">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">User Accounts</span>
                        <span className="font-extrabold text-slate-800">{validationReport.itemCounts?.users || 0} users</span>
                      </div>
                    </div>

                    {validationReport.notes && (
                      <div className="p-3 bg-white/80 border border-amber-100 rounded-xl text-xs text-slate-700">
                        <strong className="font-bold block text-[10px] uppercase text-amber-800">Backup Notes:</strong>
                        <p className="mt-0.5">{validationReport.notes}</p>
                      </div>
                    )}

                    {/* Import Mode Selector */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block">
                        Select Import Mode:
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                            importMode === "merge"
                              ? "bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-500/20"
                              : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="importMode"
                            value="merge"
                            checked={importMode === "merge"}
                            onChange={() => setImportMode("merge")}
                            className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-extrabold text-slate-900">Add Test Data (Merge)</span>
                              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                Recommended
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium mt-1 leading-normal">
                              Preserves existing live data and merges incoming test environment records without creating duplicates.
                            </p>
                          </div>
                        </label>

                        <label
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                            importMode === "replace"
                              ? "bg-rose-50/80 border-rose-300 ring-1 ring-rose-500/20"
                              : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="importMode"
                            value="replace"
                            checked={importMode === "replace"}
                            onChange={() => setImportMode("replace")}
                            className="mt-0.5 text-rose-600 focus:ring-rose-500"
                          />
                          <div>
                            <span className="text-xs font-extrabold text-slate-900 block">Replace Environment</span>
                            <p className="text-[10px] text-slate-500 font-medium mt-1 leading-normal">
                              Completely replaces current application database with the imported backup payload.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Authorization & Execution Box */}
                    <div className="p-4 bg-indigo-900/5 border border-indigo-200 rounded-xl space-y-3">
                      <div className="space-y-1">
                        <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">
                          Authorization Required:
                        </h5>
                        <p className="text-xs text-slate-700 font-bold">
                          You are about to import test environment data.
                        </p>
                        <p className="text-xs text-slate-600">
                          Import Mode: <span className="font-bold text-indigo-700">{importMode === "merge" ? "Add Test Data (Merge)" : "Replace Environment"}</span>.
                          This will {importMode === "merge" ? "add test records into with duplicate protection" : "completely replace active database in"} the current application.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                        <input
                          type="text"
                          placeholder="Type IMPORT to authorize"
                          value={restoreConfirmText}
                          onChange={(e) => setRestoreConfirmText(e.target.value)}
                          className="bg-white border border-indigo-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                        />

                        <button
                          onClick={handleExecuteSystemRestore}
                          disabled={(restoreConfirmText.trim().toUpperCase() !== "IMPORT" && restoreConfirmText.trim().toUpperCase() !== "RESTORE") || isRestoring}
                          className={`px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                            (restoreConfirmText.trim().toUpperCase() === "IMPORT" || restoreConfirmText.trim().toUpperCase() === "RESTORE") && !isRestoring
                              ? importMode === "merge"
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                : "bg-rose-600 hover:bg-rose-700 text-white"
                              : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                          }`}
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isRestoring ? "animate-spin" : ""}`} />
                          {isRestoring ? "Processing Import & Syncing Database..." : "Execute Migration Import"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Post-Import Report Summary Card */}
                {importReport && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4 animate-fade-in text-left">
                    <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <h4 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                            Import Complete Report
                          </h4>
                          <span className="text-[10px] text-emerald-700 font-medium">
                            Mode: {importReport.mode}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full uppercase">
                        Status: {importReport.statusText}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-white border border-emerald-100 rounded-xl">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Clients</span>
                        <span className="font-extrabold text-slate-800">
                          Processed: {importReport.clientsProcessed} | Added: <span className="text-emerald-600 font-mono">{importReport.clientsAdded}</span>
                        </span>
                      </div>
                      <div className="p-3 bg-white border border-emerald-100 rounded-xl">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Aspiring Leads</span>
                        <span className="font-extrabold text-slate-800">
                          Processed: {importReport.aspiringClientsProcessed} | Added: <span className="text-emerald-600 font-mono">{importReport.aspiringClientsAdded}</span>
                        </span>
                      </div>
                      <div className="p-3 bg-white border border-emerald-100 rounded-xl">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Tasks & Calendar Events</span>
                        <span className="font-extrabold text-slate-800">
                          Processed: {importReport.tasksAndEventsProcessed} | Added: <span className="text-emerald-600 font-mono">{importReport.tasksAndEventsAdded}</span>
                        </span>
                      </div>
                      <div className="p-3 bg-white border border-emerald-100 rounded-xl">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Inventory Items</span>
                        <span className="font-extrabold text-slate-800">
                          Processed: {importReport.inventoryProcessed} | Added: <span className="text-emerald-600 font-mono">{importReport.inventoryAdded}</span>
                        </span>
                      </div>
                      <div className="p-3 bg-white border border-emerald-100 rounded-xl">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Production Quotes</span>
                        <span className="font-extrabold text-slate-800">
                          Processed: {importReport.productionQuotesProcessed} | Added: <span className="text-emerald-600 font-mono">{importReport.productionQuotesAdded}</span>
                        </span>
                      </div>
                      <div className="p-3 bg-white border border-emerald-100 rounded-xl">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">User Accounts</span>
                        <span className="font-extrabold text-slate-800">
                          Processed: {importReport.usersProcessed} | Processed: <span className="text-emerald-600 font-mono">{importReport.usersAdded}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Backup History Ledger */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">System Backup History Ledger</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Audit trail of all backups created in this environment.</p>
                  </div>
                  <span className="text-xs font-mono font-extrabold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {backupHistoryList.length} Entries
                  </span>
                </div>

                {backupHistoryList.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-150 rounded-2xl space-y-2">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">No backup records generated yet.</p>
                    <p className="text-[10px] text-slate-400">Use Option 1 above or exit a work session to record automatic system snapshots.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-3">Backup ID</th>
                          <th className="p-3">Date & Time</th>
                          <th className="p-3">Created By</th>
                          <th className="p-3">Version</th>
                          <th className="p-3">Format</th>
                          <th className="p-3">Database Summary</th>
                          <th className="p-3">Notes / Changes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                        {backupHistoryList.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 whitespace-nowrap font-mono font-extrabold text-indigo-700 text-[11px]">
                              {rec.backupId || rec.id}
                            </td>
                            <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-800">
                              {rec.date}
                            </td>
                            <td className="p-3 whitespace-nowrap font-bold text-slate-900">
                              {rec.createdBy}
                            </td>
                            <td className="p-3 whitespace-nowrap font-mono text-[11px]">
                              {rec.version}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase ${
                                (rec.fileFormat === "XLSX" || (rec as any).format === "Excel") ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"
                              }`}>
                                {rec.fileFormat || (rec as any).format || "XLSX"}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap text-[11px]">
                              Clients: {rec.itemCounts?.clients ?? (rec as any).itemSummary?.clients ?? 0} | Leads: {rec.itemCounts?.aspiringClients ?? (rec as any).itemSummary?.aspiringClients ?? 0} | Inventory: {rec.itemCounts?.inventory ?? (rec as any).itemSummary?.inventory ?? 0}
                            </td>
                            <td className="p-3 text-slate-500 text-[11px]">
                              {rec.notes || <span className="text-slate-300 italic">No notes added</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 8. MASTER ADMINISTRATOR WALKTHROUGH GUIDE */}
          {activeSubTab === "guide" && userRole === "Master Administrator" && (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm text-left space-y-8 animate-fade-in">
              <div className="pb-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      Master Administrator Guide
                      <span className="text-[9px] font-extrabold uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                        Operational Manual
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Your centralized command center documentation, live walkthrough controller, and maintenance checklogs.
                    </p>
                  </div>
                </div>

                {/* Sub-navigation controls inside the manual */}
                <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-150">
                  {(["tours", "updates", "modules", "checklists", "logs"] as const).map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setGuideSection(sec)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer capitalize ${
                        guideSection === sec
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      {sec === "tours" && "Guided Tours"}
                      {sec === "updates" && "System Updates"}
                      {sec === "modules" && "Module Manual"}
                      {sec === "checklists" && "Operations"}
                      {sec === "logs" && "Admin Logs"}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION A: GUIDED WALKTHROUGHS */}
              {guideSection === "tours" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-indigo-50/40 border border-indigo-100 p-5 rounded-2xl text-xs space-y-2 text-left">
                    <span className="font-extrabold text-indigo-800 uppercase tracking-wider text-[10px] block">Live Guided Tours</span>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      Launch interactive, step-by-step overlays that guide you through key features live in the interface. Each tour automatically navigates to the relevant system module, shows floating status details, and walks you through standard procedures.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Tour 1 */}
                    <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl space-y-4 flex flex-col justify-between text-left">
                      <div className="space-y-2">
                        <div className="w-8 h-8 rounded-xl bg-slate-900/10 flex items-center justify-center text-slate-800 font-bold text-xs">01</div>
                        <h4 className="text-xs font-bold text-slate-800">Librarium Luxe Inventory</h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                          Master inventory tracking, separating in-store vs. office counts, tracking sales histories, and responding to low stock warning levels.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onStartTour && onStartTour("luxe_inventory")}
                        className="w-full mt-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Start Walkthrough <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Tour 2 */}
                    <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl space-y-4 flex flex-col justify-between text-left">
                      <div className="space-y-2">
                        <div className="w-8 h-8 rounded-xl bg-slate-900/10 flex items-center justify-center text-slate-800 font-bold text-xs">02</div>
                        <h4 className="text-xs font-bold text-slate-800">Interactive Dashboard Carousel</h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                          Learn how to operate the command center horizontal carousel. Swap between calculators and agendas with sliding transitions.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onStartTour && onStartTour("dashboard_carousel")}
                        className="w-full mt-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Start Walkthrough <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Tour 3 */}
                    <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl space-y-4 flex flex-col justify-between text-left">
                      <div className="space-y-2">
                        <div className="w-8 h-8 rounded-xl bg-slate-900/10 flex items-center justify-center text-slate-800 font-bold text-xs">03</div>
                        <h4 className="text-xs font-bold text-slate-800">Excel Exchange Engine</h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                          Understand how to bulk upload client databases and book lists. Download safe templates and audit upload validation reports.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onStartTour && onStartTour("excel_exchange")}
                        className="w-full mt-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Start Walkthrough <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION B: SYSTEM UPDATES & NEW FEATURES */}
              {guideSection === "updates" && (
                <div className="space-y-6 animate-fade-in text-xs font-medium">
                  <div className="border-l-2 border-indigo-500 pl-4 space-y-6 text-left">
                    {/* Version 1.2 */}
                    <div className="relative space-y-2 text-left">
                      <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-indigo-600 border border-white" />
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[10px] uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-150">
                          Version 1.2 Update
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">July 18, 2026</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">Interactive Dashboard Carousel</h4>
                      <p className="text-slate-500 leading-relaxed">
                        Added a highly polished, interactive navigation carousel on the dashboard main screen. This groups previously bulky modules—including Librarium Luxe Inventory, Book Cost Calculator, Location Cost Calculator, and the Interactive Agenda—into a unified horizontal carousel.
                      </p>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1 text-[11px] text-left">
                        <span className="font-bold text-slate-700 block">How to use:</span>
                        <p className="text-slate-500">Navigate between slides using the left/right arrows inside the dashboard widget. Use the dot indicators at the bottom to quickly jump to specific calculations or your agenda schedule.</p>
                      </div>
                    </div>

                    {/* Version 1.1 */}
                    <div className="relative space-y-2 text-left">
                      <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-slate-300 border border-white" />
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[10px] uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          Version 1.1 Update
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">June 12, 2026</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">Excel Exchange Sync Engine</h4>
                      <p className="text-slate-500 leading-relaxed">
                        Created the bulk spreadsheet parser enabling system administrators to import and export bulk client portfolios and inventory records. Validates inputs against schema definitions (e.g., verifying CID formats and inventory stock levels) before executing changes.
                      </p>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1 text-[11px] text-left">
                        <span className="font-bold text-slate-700 block">How to use:</span>
                        <p className="text-slate-500">Go to Excel Exchange from the main navigation. Download the pre-mapped template, enter your offline database columns, and drop the saved spreadsheet file back to trigger automated parsing.</p>
                      </div>
                    </div>

                    {/* Version 1.0 */}
                    <div className="relative space-y-2 text-left">
                      <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-slate-300 border border-white" />
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[10px] uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          Version 1.0 Launch
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">May 01, 2026</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">CEO Lifestyle CRM Platform</h4>
                      <p className="text-slate-500 leading-relaxed">
                        Initial deployment of the Executive Relationship Hub. Integrates client portfolios, bespoke reminder day formulas, system default preferences, and backup snapshots.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION C: MODULE NAVIGATION DIRECTORY */}
              {guideSection === "modules" && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="text-xs text-slate-500 font-medium text-left">
                    Select any system module below to inspect its operational manual, key configurations, and ideal workflow recommendations.
                  </div>

                  <div className="space-y-3 text-left">
                    {GUIDE_MODULES.map((mod) => {
                      const isExpanded = expandedModuleId === mod.id;
                      return (
                        <div key={mod.id} className="border border-slate-200/80 rounded-2xl overflow-hidden transition-all bg-slate-50/20">
                          <button
                            type="button"
                            onClick={() => setExpandedModuleId(isExpanded ? null : mod.id)}
                            className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50/50 transition-colors text-left cursor-pointer"
                          >
                            <span className="text-xs font-bold text-slate-800">{mod.name}</span>
                            <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider font-mono">
                              {isExpanded ? "Collapse ▲" : "View manual ▼"}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="p-4 bg-slate-50/40 border-t border-slate-100 text-[11px] text-slate-600 space-y-3.5 leading-relaxed font-medium">
                              <div>
                                <span className="font-extrabold text-slate-400 text-[9px] uppercase tracking-wider block mb-1 text-left">Purpose</span>
                                <p className="text-left">{mod.purpose}</p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                <div>
                                  <span className="font-extrabold text-slate-400 text-[9px] uppercase tracking-wider block mb-1 text-left">Access Location</span>
                                  <p className="font-mono text-[10px] text-slate-700 bg-white border border-slate-150 px-2 py-1 rounded inline-block text-left">
                                    {mod.location}
                                  </p>
                                </div>
                                {onNavigateToTab && (
                                  <div className="flex items-end justify-start text-left">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const tabMap: Record<string, any> = {
                                          dashboard: "dashboard",
                                          carousel: "dashboard",
                                          watchtower: "dashboard",
                                          directory: "directory",
                                          detail: "directory",
                                          calendar: "calendar",
                                          inventory: "inventory",
                                          book_calculator: "dashboard",
                                          location_calculator: "dashboard",
                                          excel: "excel",
                                          users: "users",
                                          settings: "branding",
                                          backup: "branding"
                                        };
                                        const targetTab = tabMap[mod.id] || "dashboard";
                                        onNavigateToTab(targetTab);
                                      }}
                                      className="py-1 px-3 bg-indigo-105 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-150 transition-colors cursor-pointer"
                                    >
                                      Go to Section
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="text-left">
                                <span className="font-extrabold text-slate-400 text-[9px] uppercase tracking-wider block mb-1 text-left">Key Actions & Features</span>
                                <ul className="list-disc pl-4 space-y-1 text-left">
                                  {mod.features.map((f, i) => (
                                    <li key={i}>{f}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="text-left">
                                <span className="font-extrabold text-slate-400 text-[9px] uppercase tracking-wider block mb-1 text-left">Recommended Workflow</span>
                                <p className="bg-indigo-50/20 text-slate-700 p-2.5 rounded-xl border border-indigo-100/45 text-left">
                                  {mod.workflow}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION D: ADMINISTRATOR REFERENCE AREA */}
              {guideSection === "checklists" && (
                <div className="space-y-6 animate-fade-in text-xs font-medium text-left">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    {/* Daily */}
                    <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                      <div className="pb-2 border-b border-slate-150 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-slate-800">Daily Operations Checklist</span>
                      </div>
                      <ul className="space-y-2.5 text-slate-500 text-[11px] leading-relaxed">
                        <li className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5 accent-indigo-600" defaultChecked />
                          <span>Review Dashboard key relationship alerts and incoming milestone warning tags.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5 accent-indigo-600" defaultChecked />
                          <span>Check the upcoming contact agenda list and follow up on client tasks due.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5 accent-indigo-600" />
                          <span>Inspect the Librarium book inventory notifications for low-stock alarms.</span>
                        </li>
                      </ul>
                    </div>

                    {/* Weekly */}
                    <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                      <div className="pb-2 border-b border-slate-150 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-slate-800">Weekly Maintenance Tasks</span>
                      </div>
                      <ul className="space-y-2.5 text-slate-500 text-[11px] leading-relaxed text-left">
                        <li className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5 accent-emerald-600" defaultChecked />
                          <span>Audit inventory book stock counts in both the store and main office.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5 accent-emerald-600" />
                          <span>Review the previous week's client timeline notes for outstanding requests.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5 accent-emerald-600" />
                          <span>Download and secure a comprehensive JSON system backup from system settings.</span>
                        </li>
                      </ul>
                    </div>

                    {/* Monthly */}
                    <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl space-y-4 text-left">
                      <div className="pb-2 border-b border-slate-150 flex items-center gap-1.5 text-left">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span className="font-bold text-slate-800">Monthly Administration Checks</span>
                      </div>
                      <ul className="space-y-2.5 text-slate-500 text-[11px] leading-relaxed text-left">
                        <li className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5 accent-amber-600" />
                          <span>Audit user access profiles and credential activities. Deactivate idle staff.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5 accent-amber-600" />
                          <span>Fine-tune the currency exchange multiplier rate and pricing markup margins.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5 accent-amber-600" />
                          <span>Analyze the performance logs and client deactivations.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION E: OPERATIONAL NOTES LOGGING */}
              {guideSection === "logs" && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div className="text-xs text-slate-500 font-medium text-left">
                    Store custom operational annotations, logs, and notes regarding active pricing changes or client campaign briefs. This content is included inside your application database backups.
                  </div>

                  {/* Add Log Form */}
                  <form onSubmit={handleAddGuideLog} className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-2xl space-y-3 text-left">
                    <div className="flex flex-col sm:flex-row gap-3 text-left">
                      <div className="sm:w-1/4">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Log Category</label>
                        <select
                          value={newLogCategory}
                          onChange={(e) => setNewLogCategory(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden"
                        >
                          <option value="Operational">Operational</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Security">Security</option>
                          <option value="Preferences">Preferences</option>
                        </select>
                      </div>
                      <div className="flex-1 text-left">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Operational Event Text</label>
                        <input
                          type="text"
                          placeholder="e.g., Calibrated proposal anniversary notification to 15 days ahead..."
                          value={newLogText}
                          onChange={(e) => setNewLogText(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-300 focus:outline-hidden"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        Add Entry
                      </button>
                    </div>
                  </form>

                  {/* Log list */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 text-left">
                    {guideLogs.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-6">No administrative logs recorded.</p>
                    ) : (
                      guideLogs.map((log) => (
                        <div key={log.id} className="p-3.5 bg-white border border-slate-200/60 rounded-xl flex items-start justify-between gap-4 text-xs font-medium text-left">
                          <div className="space-y-1 text-left">
                            <div className="flex items-center gap-2 text-left">
                              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                                log.category === "Operational" ? "bg-indigo-50 border-indigo-150 text-indigo-700" :
                                log.category === "Maintenance" ? "bg-emerald-50 border-emerald-150 text-emerald-700" :
                                log.category === "Security" ? "bg-rose-50 border-rose-150 text-rose-700" :
                                "bg-slate-50 border-slate-150 text-slate-700"
                              }`}>
                                {log.category}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-slate-600 font-medium leading-relaxed text-left">{log.text}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteGuideLog(log.id)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
                            title="Delete log entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Quick Info Box */}
          <div className="mt-8 p-4 bg-slate-50 border border-slate-200/50 rounded-2xl flex items-start gap-2.5 text-[10.5px] text-slate-500 leading-normal text-left">
            <HelpCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <span className="font-bold text-slate-700">Need Guidance?</span>
              <p>
                Click <strong>"Save Changes"</strong> at the top right to store active system values. Any operational configurations take effect immediately across all system models (e.g. Book Cost Calculator, inventory warnings, client milestone reminders).
              </p>
            </div>
          </div>

        </div>

      </div>

      <ClientExportModal
        isOpen={isClientExportOpen}
        onClose={() => setIsClientExportOpen(false)}
        clients={clients || []}
        userFullName={userFullName || "Master Administrator"}
      />

    </div>
  );
}
