import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { 
  Users, 
  Package, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  Database, 
  X,
  Lock,
  ArrowRight,
  Sparkles,
  BookOpen,
  PackageCheck
} from "lucide-react";
import { Client, AspiringClient, LuxeBookInventoryItem, SystemSettings } from "../types";
import { saveEnvironmentClients, saveEnvironmentAspiringClients, saveEnvironmentInventory } from "../utils/environmentUtils";
import { saveSystemSettings } from "../utils/settingsHelper";

export interface RemoveRecordsHubProps {
  clients: Client[];
  onUpdateClients?: (updatedClients: Client[]) => void;
  aspiringClients: AspiringClient[];
  onUpdateAspiringClients?: (updatedAspiring: AspiringClient[]) => void;
  inventory: LuxeBookInventoryItem[];
  onUpdateInventory?: (updatedInventory: LuxeBookInventoryItem[]) => void;
  settings: SystemSettings;
  onUpdateSettings?: (updatedSettings: SystemSettings) => void;
  onNavigateToBackup?: () => void;
  onNavigateToTab?: (tab: any) => void;
}

export interface RemoveActionItem {
  id: string;
  title: string;
  subtitle: string;
  unitName: string;
  count: number;
  countBadgeLabel: string;
  confirmationPhrase: string;
  targetDescription: string;
  whatIsRemoved: string[];
  whatIsPreserved: string[];
  onExecuteRemove: () => void;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

export interface RecordGroupDefinition {
  id: "client_data" | "inventory_data" | string;
  title: string;
  secondaryDescriptor: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeClass: string;
  actions: RemoveActionItem[];
}

export function RemoveRecordsHub({
  clients,
  onUpdateClients,
  aspiringClients,
  onUpdateAspiringClients,
  inventory,
  onUpdateInventory,
  settings,
  onUpdateSettings,
  onNavigateToBackup,
}: RemoveRecordsHubProps) {
  // Pending action for the confirmation modal
  const [pendingAction, setPendingAction] = useState<RemoveActionItem | null>(null);
  const [confirmationInput, setConfirmationInput] = useState<string>("");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Auto-dismiss success toast
  useEffect(() => {
    if (!successToast) return;
    const timer = setTimeout(() => {
      setSuccessToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [successToast]);

  // Execute removal functions
  const handleRemoveClientData = useCallback(() => {
    localStorage.setItem("ceo_clients_cleared", "true");
    localStorage.setItem("ceo_client_management_data", JSON.stringify([]));
    localStorage.setItem("ceo_librarium_crm_customers", JSON.stringify([]));
    localStorage.setItem("luxe_client_database", JSON.stringify([]));
    if (onUpdateClients) {
      onUpdateClients([]);
    }
    saveEnvironmentClients([]);
    setSuccessToast(`Successfully removed all ${clients.length} Client Directory records. System configurations preserved.`);
  }, [clients.length, onUpdateClients]);

  const handleRemoveAspiringClients = useCallback(() => {
    localStorage.setItem("ceo_aspiring_clients_cleared", "true");
    localStorage.setItem("ceo_aspiring_clients", JSON.stringify([]));
    localStorage.setItem("ceo_aspiring_clients_data", JSON.stringify([]));
    if (onUpdateAspiringClients) {
      onUpdateAspiringClients([]);
    }
    saveEnvironmentAspiringClients([]);
    setSuccessToast(`Successfully removed all ${aspiringClients.length} Aspiring Client prospect records.`);
  }, [aspiringClients.length, onUpdateAspiringClients]);

  const handleRemoveBookInventory = useCallback(() => {
    localStorage.setItem("ceo_book_inventory_cleared", "true");
    localStorage.setItem("luxe_book_inventory", JSON.stringify([]));
    localStorage.setItem("ceo_luxe_book_inventory", JSON.stringify([]));
    if (onUpdateInventory) {
      onUpdateInventory([]);
    }
    saveEnvironmentInventory([]);
    setSuccessToast(`Successfully removed all ${inventory.length} Book Inventory catalog records.`);
  }, [inventory.length, onUpdateInventory]);

  const handleRemoveRegularInventory = useCallback(() => {
    localStorage.setItem("ceo_regular_inventory_cleared", "true");
    const count = (settings.regularInventory || []).length;
    const updatedSettings: SystemSettings = {
      ...settings,
      regularInventory: []
    };
    if (onUpdateSettings) {
      onUpdateSettings(updatedSettings);
    }
    saveSystemSettings(updatedSettings);
    setSuccessToast(`Successfully removed all ${count} Regular Inventory / Finished Goods records.`);
  }, [settings, onUpdateSettings]);

  const handleRemoveFulfillmentInventory = useCallback(() => {
    localStorage.setItem("ceo_fulfillment_inventory_cleared", "true");
    const count = (settings.fulfillmentInventory || []).length;
    const updatedSettings: SystemSettings = {
      ...settings,
      fulfillmentInventory: []
    };
    if (onUpdateSettings) {
      onUpdateSettings(updatedSettings);
    }
    saveSystemSettings(updatedSettings);
    setSuccessToast(`Successfully removed all ${count} Fulfillment Inventory / Materials records.`);
  }, [settings, onUpdateSettings]);

  // Define future-ready record groups
  const RECORD_GROUPS: RecordGroupDefinition[] = [
    {
      id: "client_data",
      title: "CLIENT DATA",
      secondaryDescriptor: "CLIENT DIRECTORY & ASPIRING PROSPECTS",
      icon: Users,
      accentColor: "indigo",
      badgeClass: "bg-indigo-50 border-indigo-200/60 text-indigo-700",
      actions: [
        {
          id: "remove_clients",
          title: "Remove All Client Data",
          subtitle: "Client Directory Accounts & Profiles",
          unitName: "Client Records",
          count: clients.length,
          countBadgeLabel: `${clients.length} ${clients.length === 1 ? "Client Record" : "Client Records"}`,
          confirmationPhrase: "DELETE CLIENT DATA",
          targetDescription: "Removes all stored client profiles, contact books, timeline entries, and milestone logs from the active Client Directory.",
          whatIsRemoved: [
            "All client profile records stored in the Client Directory",
            "Client contact numbers, physical addresses, and VIP notes",
            "Client timeline milestones, gift history, and reminder records"
          ],
          whatIsPreserved: [
            "Client Tier definitions & qualification thresholds",
            "Client Management configuration & custom fields",
            "Client Commitment (CMT) definitions and business logic",
            "Communication Library quotation and email templates",
            "Milestone reminder intervals and preferences"
          ],
          onExecuteRemove: handleRemoveClientData,
          icon: Users,
          accentColor: "indigo"
        },
        {
          id: "remove_aspiring_clients",
          title: "Remove All Aspiring Clients",
          subtitle: "Prospective Leads & Inquiry Pipeline",
          unitName: "Aspiring Leads",
          count: aspiringClients.length,
          countBadgeLabel: `${aspiringClients.length} ${aspiringClients.length === 1 ? "Prospect Record" : "Prospect Records"}`,
          confirmationPhrase: "DELETE ASPIRING CLIENTS",
          targetDescription: "Removes all prospective client leads, inquiry records, and outreach tracking from the Aspiring Clients pipeline.",
          whatIsRemoved: [
            "All aspiring client leads and prospect profile cards",
            "Inquiry tags, services of interest, and source logs",
            "Follow-up attempt history logs and scheduled outreach reminders"
          ],
          whatIsPreserved: [
            "Client Directory client records (completely unaffected)",
            "Client Tier definitions and thresholds",
            "Communication Library quotation and outreach templates",
            "All inventory records and system settings"
          ],
          onExecuteRemove: handleRemoveAspiringClients,
          icon: Users,
          accentColor: "amber"
        }
      ]
    },
    {
      id: "inventory_data",
      title: "INVENTORY DATA",
      secondaryDescriptor: "BOOK, REGULAR & FULFILLMENT SYSTEMS",
      icon: Package,
      accentColor: "rose",
      badgeClass: "bg-rose-50 border-rose-200/60 text-rose-700",
      actions: [
        {
          id: "remove_book_inventory",
          title: "Remove All Book Inventory",
          subtitle: "Librarium Luxe Private Catalog & Allocations",
          unitName: "Book Inventory",
          count: inventory.length,
          countBadgeLabel: `${inventory.length} ${inventory.length === 1 ? "Book Edition" : "Book Editions"}`,
          confirmationPhrase: "DELETE BOOK INVENTORY",
          targetDescription: "Removes all luxury book catalog entries, editions, in-store and office stock allocations, and velocity logs.",
          whatIsRemoved: [
            "All book inventory editions and catalog listings",
            "Stock allocation quantities (In-Store, Office, Total)",
            "Historical sales movement records and edition notes"
          ],
          whatIsPreserved: [
            "Primary Book Classifications & categorization presets",
            "Regular Inventory (Finished Goods) — completely unaffected",
            "Fulfillment Inventory (Materials) — completely unaffected",
            "Product Fulfillment Templates & Bill of Materials",
            "Inventory Control Settings and restock rules"
          ],
          onExecuteRemove: handleRemoveBookInventory,
          icon: BookOpen,
          accentColor: "amber"
        },
        {
          id: "remove_regular_inventory",
          title: "Remove All Regular Inventory",
          subtitle: "Finished Physical Goods & Merchandise",
          unitName: "Regular Inventory",
          count: (settings.regularInventory || []).length,
          countBadgeLabel: `${(settings.regularInventory || []).length} ${(settings.regularInventory || []).length === 1 ? "Product Record" : "Product Records"}`,
          confirmationPhrase: "DELETE REGULAR INVENTORY",
          targetDescription: "Removes all finished physical retail goods, apparel items, gift sets, and finished stock units.",
          whatIsRemoved: [
            "All finished products and SKU records in Regular Inventory",
            "On-hand quantities, locations, unit costs, and selling prices",
            "Usage priority flags (Use First / Clearance / Normal)"
          ],
          whatIsPreserved: [
            "Book Inventory (Librarium Luxe) — completely unaffected",
            "Fulfillment Inventory (Materials) — completely unaffected",
            "Product Fulfillment Templates (Bill of Materials)",
            "Production Materials & Supplier Settings",
            "Inventory Control Settings and alert thresholds"
          ],
          onExecuteRemove: handleRemoveRegularInventory,
          icon: Package,
          accentColor: "indigo"
        },
        {
          id: "remove_fulfillment_inventory",
          title: "Remove All Fulfillment Inventory",
          subtitle: "Raw Materials, Blanks & Packaging Supplies",
          unitName: "Fulfillment Inventory",
          count: (settings.fulfillmentInventory || []).length,
          countBadgeLabel: `${(settings.fulfillmentInventory || []).length} ${(settings.fulfillmentInventory || []).length === 1 ? "Material Record" : "Material Records"}`,
          confirmationPhrase: "DELETE FULFILLMENT INVENTORY",
          targetDescription: "Removes all raw production materials, blank garment blanks, packaging components, and supplies.",
          whatIsRemoved: [
            "All raw material records and available on-hand stock quantities",
            "Bulk tier simulation records and manual stock adjustments"
          ],
          whatIsPreserved: [
            "Product Fulfillment Templates (Bill of Materials definitions)",
            "Production Materials & DTF Supplier settings",
            "Regular Inventory (Finished Goods) — completely unaffected",
            "Book Inventory — completely unaffected",
            "Inventory Control Settings and calculation formulas"
          ],
          onExecuteRemove: handleRemoveFulfillmentInventory,
          icon: PackageCheck,
          accentColor: "purple"
        }
      ]
    }
  ];

  // Master controlled navigation state:
  // 0 = Client Data
  // 1 = Inventory Data
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(() => {
    const stored = localStorage.getItem("ceo_remove_records_active_group_index");
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < RECORD_GROUPS.length) {
        return parsed;
      }
    }
    return 0;
  });

  const handleSelectGroup = useCallback((index: number) => {
    setActiveGroupIndex(index);
    localStorage.setItem("ceo_remove_records_active_group_index", index.toString());
  }, []);

  const handlePrevGroup = useCallback(() => {
    handleSelectGroup((activeGroupIndex - 1 + RECORD_GROUPS.length) % RECORD_GROUPS.length);
  }, [activeGroupIndex, handleSelectGroup, RECORD_GROUPS.length]);

  const handleNextGroup = useCallback(() => {
    handleSelectGroup((activeGroupIndex + 1) % RECORD_GROUPS.length);
  }, [activeGroupIndex, handleSelectGroup, RECORD_GROUPS.length]);

  // Keyboard navigation (ArrowLeft / ArrowRight) when modal is closed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (pendingAction) return; // Prevent navigation while modal is open
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        handlePrevGroup();
      } else if (e.key === "ArrowRight") {
        handleNextGroup();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevGroup, handleNextGroup, pendingAction]);

  const activeGroup = RECORD_GROUPS[activeGroupIndex];
  const prevGroup = RECORD_GROUPS[(activeGroupIndex - 1 + RECORD_GROUPS.length) % RECORD_GROUPS.length];
  const nextGroup = RECORD_GROUPS[(activeGroupIndex + 1) % RECORD_GROUPS.length];
  const ActiveIcon = activeGroup.icon;

  // Open modal handler
  const handleOpenConfirmation = (action: RemoveActionItem) => {
    setPendingAction(action);
    setConfirmationInput("");
  };

  // Close modal handler
  const handleCloseConfirmation = () => {
    setPendingAction(null);
    setConfirmationInput("");
  };

  // Perform confirmed removal
  const handleConfirmRemoval = () => {
    if (!pendingAction) return;
    if (confirmationInput.trim() !== pendingAction.confirmationPhrase) return;
    pendingAction.onExecuteRemove();
    handleCloseConfirmation();
  };

  const isConfirmed = pendingAction && confirmationInput.trim() === pendingAction.confirmationPhrase;

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6 text-left" id="remove_records_hub">
      
      {/* ========================================================================= */}
      {/* 1. EXACT HEADING: DATA MANAGEMENT (NO FLUFF, NO VERBOSE DESCRIPTIONS)     */}
      {/* ========================================================================= */}
      <div className="text-center pt-2 select-none">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">
          DATA MANAGEMENT
        </h1>
        <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mt-1">
          Remove Records Utility
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 2. BACKUP PROTECTION REMINDER (CLEAN RESTRAINED ADVISORY BANNER)          */}
      {/* ========================================================================= */}
      <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 border border-amber-300/80 rounded-xl text-amber-800 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-amber-900 text-xs tracking-tight">
              Backup Protection Reminder
            </h4>
            <p className="text-[11px] text-amber-800/90 font-medium mt-0.5 leading-relaxed">
              Before removing records, make sure you have a current backup if the data may be needed later. Stored records are selectively wiped to provide a clean deployment state.
            </p>
          </div>
        </div>

        {onNavigateToBackup && (
          <button
            type="button"
            onClick={onNavigateToBackup}
            className="px-3.5 py-2 bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold shrink-0 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Database className="w-4 h-4 text-amber-700" />
            <span>Open Backup & Restore</span>
          </button>
        )}
      </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl p-4 text-xs font-bold flex items-center justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="p-1 text-emerald-700 hover:text-emerald-950 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CONTROLLED NAVIGATION INTERACTION (SAME AS INVENTORY & PRODUCT MGMT)   */}
      {/* ========================================================================= */}
      <div className="glass-workspace p-3 sm:p-4 text-center select-none">
        <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-2xl mx-auto">
          
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handlePrevGroup}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-slate-700 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer shrink-0 shadow-2xs bg-white active:scale-95"
            title={`Previous: ${prevGroup.title} (←)`}
            aria-label="Previous Record Group"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Center Selected Management Area Card (Liquid Glass Style) */}
          <div className="flex-1 min-w-0 bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl py-3 px-4 sm:px-6 shadow-xs flex items-center justify-center gap-3">
            <div className={`p-2 rounded-xl border shrink-0 ${activeGroup.badgeClass}`}>
              <ActiveIcon className="w-5 h-5" />
            </div>
            <div className="text-center min-w-0">
              <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900 truncate">
                {activeGroup.title}
              </h2>
            </div>
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleNextGroup}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-slate-700 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer shrink-0 shadow-2xs bg-white active:scale-95"
            title={`Next: ${nextGroup.title} (→)`}
            aria-label="Next Record Group"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Pagination Indicators */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {RECORD_GROUPS.map((group, idx) => (
            <button
              key={group.id}
              type="button"
              onClick={() => handleSelectGroup(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === activeGroupIndex
                  ? "w-8 bg-rose-600"
                  : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
              title={`Jump to ${group.title}`}
              aria-label={`Jump to ${group.title}`}
            />
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. WORKSPACE: CONTROLLED ADMINISTRATIVE UTILITY                           */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
        
        {/* Workspace Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Data Scope
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">
                Selective Cleanup Only
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
              {activeGroup.title}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {activeGroup.secondaryDescriptor}
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto text-[11px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Settings & Configurations Protected</span>
          </div>
        </div>

        {/* Action Rows List (Compact Administrative Utility Style) */}
        <div className="space-y-4">
          {activeGroup.actions.map((action) => {
            const ActionIcon = action.icon;
            const hasRecords = action.count > 0;

            return (
              <div 
                key={action.id}
                className="bg-slate-50/60 border border-slate-200/70 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-50 hover:border-slate-300/80"
              >
                {/* Action Details */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-2xs shrink-0">
                      <ActionIcon className="w-4 h-4 text-slate-800" />
                    </div>
                    <h4 className="text-sm font-black text-slate-900">
                      {action.title}
                    </h4>

                    {/* Live Record Count Badge */}
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      hasRecords 
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200/80" 
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}>
                      {action.countBadgeLabel}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed pl-10">
                    {action.targetDescription}
                  </p>

                  {/* Safety Scope Indicator Tags */}
                  <div className="flex flex-wrap items-center gap-2 pl-10 pt-1 text-[10px] font-bold">
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Preserves System Settings
                    </span>
                    <span className="text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      Requires Typed Phrase
                    </span>
                  </div>
                </div>

                {/* Trigger Button */}
                <div className="self-end md:self-center shrink-0 pl-10 md:pl-0">
                  {hasRecords ? (
                    <button
                      type="button"
                      onClick={() => handleOpenConfirmation(action)}
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Remove Records...</span>
                    </button>
                  ) : (
                    <div className="px-3.5 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-not-allowed select-none">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>No Records (Clean)</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. HIGH-IMPACT CONFIRMATION MODAL WITH TYPED PHRASE SAFETY GUARD           */}
      {/* ========================================================================= */}
      {pendingAction && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in text-left">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    {pendingAction.title}?
                  </h3>
                  <p className="text-xs font-bold text-rose-600 mt-0.5">
                    {pendingAction.count} {pendingAction.count === 1 ? "record" : "records"} will be permanently removed
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseConfirmation}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Exact Scope Breakdown: Removed vs Preserved */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* What will be removed */}
              <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-rose-900 font-extrabold text-[11px] uppercase tracking-wider">
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Will Be Removed</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-rose-900/90 font-medium">
                  {pendingAction.whatIsRemoved.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 leading-tight">
                      <span className="text-rose-500 font-black">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What will be preserved */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-[11px] uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Preserved Intact</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-emerald-900/90 font-medium">
                  {pendingAction.whatIsPreserved.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 leading-tight">
                      <span className="text-emerald-500 font-black">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Backup Advisory Note inside Modal */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Ensure you have an active backup before proceeding if this data may be needed.</span>
            </div>

            {/* Typed Confirmation Guard */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="block text-xs font-extrabold text-slate-800">
                Type the confirmation phrase below to unlock:
              </label>
              
              <div className="flex items-center justify-between bg-slate-100/90 px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs font-black text-rose-700 select-all">
                <span>{pendingAction.confirmationPhrase}</span>
                <span className="text-[10px] font-sans font-bold text-slate-400 uppercase">Exact Match</span>
              </div>

              <input
                type="text"
                autoFocus
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={`Type "${pendingAction.confirmationPhrase}"`}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold font-mono transition-all focus:outline-none ${
                  isConfirmed
                    ? "bg-emerald-50/80 border-emerald-400 text-emerald-900 ring-2 ring-emerald-200"
                    : "bg-white border-slate-300 text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                }`}
              />

              {isConfirmed && (
                <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 pt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Confirmation verified. Removal unlocked.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseConfirmation}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!isConfirmed}
                onClick={handleConfirmRemoval}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  isConfirmed
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer active:scale-95"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Permanently Remove Records</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
