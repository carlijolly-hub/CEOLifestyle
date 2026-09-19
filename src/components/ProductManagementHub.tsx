import React, { useState, useEffect, useCallback } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Sliders, 
  Layers, 
  Archive, 
  Plus, 
  Check, 
  Trash2, 
  Sparkles, 
  Package, 
  PlusCircle, 
  Building, 
  HelpCircle, 
  X,
  Printer
} from "lucide-react";
import { 
  SystemSettings, 
  FulfillmentTemplate, 
  FulfillmentTemplateItem, 
  DTFSupplier, 
  DTFPricingPreset, 
  ProductionMaterialPreset 
} from "../types";
import { 
  DEFAULT_FULFILLMENT_TEMPLATES, 
  DEFAULT_DTF_SUPPLIERS, 
  DEFAULT_DTF_PRICING, 
  DEFAULT_PRODUCTION_MATERIALS 
} from "../utils/settingsHelper";

interface ProductManagementHubProps {
  settings: SystemSettings;
  onUpdateSettings: (field: keyof SystemSettings, value: any) => void;
  userFullName?: string;
  isMasterAdmin?: boolean;
  initialIndex?: number;
}

interface ProductManagementArea {
  id: "fulfillment_templates" | "production_materials" | "inventory_control";
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRODUCT_MANAGEMENT_AREAS: ProductManagementArea[] = [
  {
    id: "fulfillment_templates",
    title: "Product Fulfillment Templates (Bill of Materials)",
    icon: Sliders,
  },
  {
    id: "production_materials",
    title: "Production Materials & Supplier Settings",
    icon: Layers,
  },
  {
    id: "inventory_control",
    title: "Inventory Control Settings",
    icon: Archive,
  }
];

export function ProductManagementHub({
  settings,
  onUpdateSettings,
  userFullName = "Master Administrator",
  initialIndex
}: ProductManagementHubProps) {
  // Master controlled navigation state:
  // 0 = Product Fulfillment Templates (BOM)
  // 1 = Production Materials & Supplier Settings
  // 2 = Inventory Control Settings
  const [activeAreaIndex, setActiveAreaIndex] = useState<number>(() => {
    if (typeof initialIndex === "number" && initialIndex >= 0 && initialIndex < PRODUCT_MANAGEMENT_AREAS.length) {
      return initialIndex;
    }
    const stored = localStorage.getItem("ceo_product_management_active_index");
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < PRODUCT_MANAGEMENT_AREAS.length) {
        return parsed;
      }
    }
    return 0;
  });

  // Sync if initialIndex changes externally
  useEffect(() => {
    if (typeof initialIndex === "number" && initialIndex >= 0 && initialIndex < PRODUCT_MANAGEMENT_AREAS.length) {
      setActiveAreaIndex(initialIndex);
    }
  }, [initialIndex]);

  const handleSelectArea = useCallback((index: number) => {
    setActiveAreaIndex(index);
    localStorage.setItem("ceo_product_management_active_index", index.toString());
  }, []);

  const handlePrevArea = useCallback(() => {
    handleSelectArea((activeAreaIndex - 1 + PRODUCT_MANAGEMENT_AREAS.length) % PRODUCT_MANAGEMENT_AREAS.length);
  }, [activeAreaIndex, handleSelectArea]);

  const handleNextArea = useCallback(() => {
    handleSelectArea((activeAreaIndex + 1) % PRODUCT_MANAGEMENT_AREAS.length);
  }, [activeAreaIndex, handleSelectArea]);

  // Keyboard navigation (Left/Right arrow keys when not typing inside an input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        handlePrevArea();
      } else if (e.key === "ArrowRight") {
        handleNextArea();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevArea, handleNextArea]);

  // =========================================================================
  // 1. PRODUCT FULFILLMENT TEMPLATES (BOM) STATE & HANDLERS
  // =========================================================================
  const [ftTemplates, setFtTemplates] = useState<FulfillmentTemplate[]>(() => {
    let existing: FulfillmentTemplate[] = [];
    if (settings.fulfillmentTemplates && Array.isArray(settings.fulfillmentTemplates) && settings.fulfillmentTemplates.length > 0) {
      existing = settings.fulfillmentTemplates;
    } else {
      const saved = localStorage.getItem("ceo_fulfillment_templates_v1");
      if (saved) {
        try { existing = JSON.parse(saved); } catch (e) {}
      }
    }
    if (existing && existing.length > 0) {
      const missingDefaults = DEFAULT_FULFILLMENT_TEMPLATES.filter(
        def => !existing.some(p => p.productName.trim().toLowerCase() === def.productName.trim().toLowerCase())
      );
      if (missingDefaults.length > 0) {
        return [...existing, ...missingDefaults];
      }
      return existing;
    }
    return DEFAULT_FULFILLMENT_TEMPLATES;
  });

  const [ftEditingId, setFtEditingId] = useState<string | null>(null);
  const [ftProductNameInput, setFtProductNameInput] = useState("");
  const [ftComponentsInput, setFtComponentsInput] = useState<FulfillmentTemplateItem[]>([]);

  const syncFulfillmentTemplates = (updated: FulfillmentTemplate[]) => {
    setFtTemplates(updated);
    localStorage.setItem("ceo_fulfillment_templates_v1", JSON.stringify(updated));
    onUpdateSettings("fulfillmentTemplates", updated);
  };

  const handleFtStartNew = () => {
    setFtEditingId("new");
    setFtProductNameInput("");
    setFtComponentsInput([
      { id: `c-${Date.now()}-1`, componentName: "", quantity: 1, unitLabel: "" }
    ]);
  };

  const handleFtStartEdit = (template: FulfillmentTemplate) => {
    setFtEditingId(template.id);
    setFtProductNameInput(template.productName);
    setFtComponentsInput(template.components.map(c => ({ ...c })));
  };

  const handleFtSave = () => {
    if (!ftProductNameInput.trim()) {
      alert("Please enter a product name for the fulfillment template.");
      return;
    }
    const cleanComponents = ftComponentsInput
      .filter(c => c.componentName.trim() !== "")
      .map((c, idx) => ({
        id: c.id || `comp-${idx}-${Date.now()}`,
        componentName: c.componentName.trim(),
        quantity: Math.max(0.01, Number(c.quantity) || 1),
        unitLabel: c.unitLabel?.trim() || undefined,
        notes: c.notes?.trim() || undefined,
        bulkEnabled: c?.bulkEnabled !== false,
        bulkRuleActive: c?.bulkRuleActive !== false,
        bulkUnitLabel: c.bulkUnitLabel?.trim() || undefined,
        minPurchaseQty: c.minPurchaseQty ? Math.max(0, Number(c.minPurchaseQty)) : undefined,
        bulkIncrement: c.bulkIncrement ? Math.max(0, Number(c.bulkIncrement)) : (c.bulkPurchaseMultiple ? Math.max(0, Number(c.bulkPurchaseMultiple)) : undefined),
        bulkTierRules: Array.isArray(c.bulkTierRules) ? c.bulkTierRules.filter(t => t.minReq >= 0 && t.purchaseQty >= 0) : [],
        bulkNotes: c.bulkNotes?.trim() || undefined,
        bulkPurchaseMultiple: c.bulkIncrement || c.bulkPurchaseMultiple,
        bulkRuleType: c.bulkRuleType || "multiples"
      }));

    if (cleanComponents.length === 0) {
      alert("Please add at least one valid component item to the template.");
      return;
    }

    if (ftEditingId === "new") {
      const newTpl: FulfillmentTemplate = {
        id: `ft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productName: ftProductNameInput.trim(),
        enabled: true,
        components: cleanComponents
      };
      syncFulfillmentTemplates([...ftTemplates, newTpl]);
    } else if (ftEditingId) {
      const updated = ftTemplates.map(t => {
        if (t.id === ftEditingId) {
          return {
            ...t,
            productName: ftProductNameInput.trim(),
            components: cleanComponents
          };
        }
        return t;
      });
      syncFulfillmentTemplates(updated);
    }
    setFtEditingId(null);
  };

  const handleFtDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this fulfillment template?")) {
      syncFulfillmentTemplates(ftTemplates.filter(t => t.id !== id));
      if (ftEditingId === id) setFtEditingId(null);
    }
  };

  const handleFtToggle = (id: string) => {
    const updated = ftTemplates.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t);
    syncFulfillmentTemplates(updated);
  };

  const handleFtResetDefaults = () => {
    if (confirm("Reset fulfillment templates to default system presets?")) {
      syncFulfillmentTemplates(DEFAULT_FULFILLMENT_TEMPLATES);
      setFtEditingId(null);
    }
  };

  // =========================================================================
  // 2. PRODUCTION MATERIALS & SUPPLIER SETTINGS STATE
  // =========================================================================
  const [prodMatSubTab, setProdMatSubTab] = useState<"dtf_suppliers" | "dtf_pricing" | "paper">("dtf_suppliers");

  // =========================================================================
  // 3. INVENTORY CONTROL SETTINGS STATE
  // =========================================================================
  const [newClassificationInput, setNewClassificationInput] = useState("");

  const activeArea = PRODUCT_MANAGEMENT_AREAS[activeAreaIndex];
  const prevArea = PRODUCT_MANAGEMENT_AREAS[(activeAreaIndex - 1 + PRODUCT_MANAGEMENT_AREAS.length) % PRODUCT_MANAGEMENT_AREAS.length];
  const nextArea = PRODUCT_MANAGEMENT_AREAS[(activeAreaIndex + 1) % PRODUCT_MANAGEMENT_AREAS.length];
  const ActiveIcon = activeArea.icon;

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6 text-left" id="master_product_management_hub">
      
      {/* ========================================================================= */}
      {/* 1. EXACT HEADING: PRODUCT MANAGEMENT (NO EXTRA SUMMARY OR SUBTITLES)      */}
      {/* ========================================================================= */}
      <div className="text-center pt-2 select-none">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">
          PRODUCT MANAGEMENT
        </h1>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTROLLED NAVIGATION INTERACTION (SAME AS INVENTORY & CLIENT)         */}
      {/* ========================================================================= */}
      <div className="glass-workspace p-3 sm:p-4 text-center select-none">
        <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-2xl mx-auto">
          
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handlePrevArea}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer shrink-0 shadow-2xs bg-white active:scale-95"
            title={`Previous: ${prevArea.title} (←)`}
            aria-label="Previous Product Management Area"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Center Selected Management Area Card (Liquid Glass Style) */}
          <div className="flex-1 min-w-0 bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl py-3 px-4 sm:px-6 shadow-xs flex items-center justify-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-700 shrink-0">
              <ActiveIcon className="w-5 h-5" />
            </div>
            <div className="text-center min-w-0">
              <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900 truncate">
                {activeArea.title}
              </h2>
            </div>
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleNextArea}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer shrink-0 shadow-2xs bg-white active:scale-95"
            title={`Next: ${nextArea.title} (→)`}
            aria-label="Next Product Management Area"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Dot Pagination Indicators */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {PRODUCT_MANAGEMENT_AREAS.map((area, idx) => (
            <button
              key={area.id}
              type="button"
              onClick={() => handleSelectArea(idx)}
              className={`h-2 transition-all rounded-full cursor-pointer ${
                activeAreaIndex === idx
                  ? "w-8 bg-indigo-600 shadow-xs"
                  : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
              title={`Switch to ${area.title}`}
              aria-label={`Switch to ${area.title}`}
            />
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ISOLATED ACTIVE WORKSPACE (ONLY ONE WORKSPACE RENDERED AT A TIME)       */}
      {/* ========================================================================= */}
      <div className="w-full transition-opacity duration-200 animate-fade-in">
        
        {/* AREA 1: PRODUCT FULFILLMENT TEMPLATES (BILL OF MATERIALS) */}
        {activeAreaIndex === 0 && (
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm text-left space-y-6">
            
            {/* Action Bar */}
            <div className="pb-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 border border-purple-100 rounded-2xl text-purple-700">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Product Fulfillment Templates (Bill of Materials)</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Define required component items per product. When an order arrives in NEW status, required items automatically expand into the live Fulfillment Center checklist.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFtResetDefaults}
                  className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={handleFtStartNew}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Template</span>
                </button>
              </div>
            </div>

            {/* Template Editor / Form (if editing/creating) */}
            {ftEditingId && (
              <div className="bg-slate-50 border-2 border-indigo-200/80 rounded-2xl p-5 md:p-6 space-y-5 animate-fade-in shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      {ftEditingId === "new" ? "New Product Fulfillment Template" : "Edit Fulfillment Template"}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFtEditingId(null)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
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
                    placeholder="e.g., Magic Heart Cube, Custom Gift Box, Custom Bouquet, T-Shirt..."
                    value={ftProductNameInput}
                    onChange={(e) => setFtProductNameInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600 shadow-2xs"
                  />
                  <p className="text-[11px] text-slate-500">
                    When an incoming order contains this product name, its fulfillment requirements will automatically populate in the Fulfillment Center.
                  </p>
                </div>

                {/* Component Requirements List */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Required Fulfillment Items (Per 1 Product Unit)
                    </label>
                    <button
                      type="button"
                      onClick={() => setFtComponentsInput(prev => [
                        ...prev,
                        { id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, componentName: "", quantity: 1, unitLabel: "" }
                      ])}
                      className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item (+)</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {ftComponentsInput.map((comp, idx) => (
                      <div key={comp.id || idx} className="bg-white p-3 border border-slate-200/90 rounded-2xl shadow-2xs space-y-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-24 shrink-0 space-y-0.5">
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Req Qty</span>
                            <input
                              type="number"
                              step="any"
                              min="0.01"
                              value={comp.quantity}
                              onChange={(e) => {
                                const val = Math.max(0.01, parseFloat(e.target.value) || 0.01);
                                setFtComponentsInput(prev => prev.map((c, i) => i === idx ? { ...c, quantity: val } : c));
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900 text-center focus:bg-white focus:border-indigo-600"
                            />
                          </div>
                          <div className="w-24 shrink-0 space-y-0.5">
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Unit (Opt)</span>
                            <input
                              type="text"
                              placeholder="e.g. yard, pc"
                              value={comp.unitLabel || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFtComponentsInput(prev => prev.map((c, i) => i === idx ? { ...c, unitLabel: val } : c));
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-600"
                            />
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Fulfillment Item Name</span>
                            <input
                              type="text"
                              placeholder="e.g. Cellophane, Tissue Paper, Chocolates, Ribbon..."
                              value={comp.componentName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFtComponentsInput(prev => prev.map((c, i) => i === idx ? { ...c, componentName: val } : c));
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setFtComponentsInput(prev => prev.filter((_, i) => i !== idx))}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0 cursor-pointer mt-4"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Bulk Purchasing Rule Editor */}
                        <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-200/80 space-y-3 text-left">
                          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-purple-100">
                            <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              Bulk Order / Purchasing Rule Settings
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setFtComponentsInput(prev => prev.map((c, i) => i === idx ? {
                                    ...c,
                                    bulkEnabled: c?.bulkEnabled === false ? true : false,
                                    bulkRuleActive: c?.bulkEnabled === false ? true : false
                                  } : c));
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${
                                  comp?.bulkEnabled !== false
                                    ? "bg-purple-600 text-white border-purple-700 shadow-2xs"
                                    : "bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300"
                                }`}
                              >
                                {comp?.bulkEnabled !== false ? "✓ Bulk Rule Active" : "✕ Disabled (Exact Qty)"}
                              </button>
                            </div>
                          </div>

                          {comp?.bulkEnabled !== false ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-extrabold text-slate-500 uppercase block">Purchase Unit Label</span>
                                  <input
                                    type="text"
                                    placeholder="e.g. yards, packs of 10, boxes"
                                    value={comp.bulkUnitLabel || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setFtComponentsInput(prev => prev.map((c, i) => i === idx ? { ...c, bulkUnitLabel: val } : c));
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-purple-600"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-extrabold text-slate-500 uppercase block">Bulk Multiple / Increment</span>
                                  <input
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 3, 5, 10, 24"
                                    value={comp.bulkIncrement || comp.bulkPurchaseMultiple || ""}
                                    onChange={(e) => {
                                      const val = e.target.value ? parseFloat(e.target.value) : undefined;
                                      setFtComponentsInput(prev => prev.map((c, i) => i === idx ? { ...c, bulkIncrement: val, bulkPurchaseMultiple: val } : c));
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-purple-600"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-extrabold text-slate-500 uppercase block">Min Purchase Qty</span>
                                  <input
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 3"
                                    value={comp.minPurchaseQty || ""}
                                    onChange={(e) => {
                                      const val = e.target.value ? parseFloat(e.target.value) : undefined;
                                      setFtComponentsInput(prev => prev.map((c, i) => i === idx ? { ...c, minPurchaseQty: val } : c));
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-purple-600"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">
                              Bulk Purchasing is disabled for this item. The Fulfillment Center will use exact required quantities.
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFtEditingId(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleFtSave}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Template</span>
                  </button>
                </div>
              </div>
            )}

            {/* Template List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Configured Templates ({ftTemplates.length})
                </h4>
              </div>

              {ftTemplates.length === 0 ? (
                <div className="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-2">
                  <p className="text-xs font-bold">No product fulfillment templates configured.</p>
                  <button
                    type="button"
                    onClick={handleFtResetDefaults}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 cursor-pointer"
                  >
                    Load System Defaults
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ftTemplates.map((t) => (
                    <div
                      key={t.id}
                      className={`p-5 rounded-2xl border transition-all space-y-3 ${
                        t.enabled
                          ? "bg-white border-slate-200 shadow-2xs"
                          : "bg-slate-50 border-slate-200 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl shrink-0">
                            <Package className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <span className="text-sm font-black text-slate-900 block truncate">
                              {t.productName}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border inline-block mt-0.5 ${
                              t.enabled
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}>
                              {t.enabled ? "Active Template" : "Disabled"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleFtToggle(t.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            {t.enabled ? "Disable" : "Enable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFtStartEdit(t)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit template"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFtDelete(t.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Items Breakdown List */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          Fulfillment Items ({t.components.length})
                        </span>
                        <div className="space-y-1">
                          {t.components.map((c, idx) => (
                            <div key={c.id || idx} className="flex items-center justify-between gap-2 text-xs font-bold text-slate-800">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                <span className="truncate">{c.componentName}</span>
                                {c.bulkPurchaseMultiple ? (
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-purple-50 text-purple-800 border border-purple-200/80 shrink-0">
                                    Bulk: Multiples of {c.bulkPurchaseMultiple} {c.bulkUnitLabel || c.unitLabel || 'units'}
                                  </span>
                                ) : null}
                              </div>
                              <span className="text-indigo-700 font-extrabold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md text-[11px] shrink-0">
                                {c.quantity}{c.unitLabel ? ` ${c.unitLabel}` : ''}
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

          </div>
        )}

        {/* AREA 2: PRODUCTION MATERIALS & SUPPLIER SETTINGS */}
        {activeAreaIndex === 1 && (
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
                    Sourced DTF Suppliers
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
                      Sourced DTF Suppliers ({ (settings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS).length })
                    </h4>
                    <p className="text-[11px] text-slate-400">Manage supplier sheet dimensions, cost per sheet, and delivery fees. System automatically calculates $/Sq Ft based on sheet area (delivery separate).</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const current = settings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS;
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
                      onUpdateSettings("dtfSuppliers", [...current, newSup]);
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Supplier</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {(settings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS).map((sup, idx) => (
                    <div key={sup.id || idx} className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 md:p-5 space-y-4 shadow-2xs">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Supplier Name
                          </label>
                          <input
                            type="text"
                            value={sup.name}
                            onChange={(e) => {
                              const list = [...(settings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS)];
                              list[idx] = { ...list[idx], name: e.target.value };
                              onUpdateSettings("dtfSuppliers", list);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                            placeholder="E.g. KRZ Prints"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Sheet Width (in)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={sup.sheetWidth === 0 ? "" : (sup.sheetWidth ?? "")}
                            onChange={(e) => {
                              const list = [...(settings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS)];
                              list[idx] = { ...list[idx], sheetWidth: e.target.value === "" ? ("" as any) : (parseFloat(e.target.value) || 0) };
                              onUpdateSettings("dtfSuppliers", list);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-hidden"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Sheet Height (in)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={sup.sheetHeight === 0 ? "" : (sup.sheetHeight ?? "")}
                            onChange={(e) => {
                              const list = [...(settings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS)];
                              list[idx] = { ...list[idx], sheetHeight: e.target.value === "" ? ("" as any) : (parseFloat(e.target.value) || 0) };
                              onUpdateSettings("dtfSuppliers", list);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-hidden"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Cost / Sheet ($)
                          </label>
                          <input
                            type="number"
                            value={sup.costPerSheet === 0 ? "" : (sup.costPerSheet ?? "")}
                            onChange={(e) => {
                              const list = [...(settings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS)];
                              list[idx] = { ...list[idx], costPerSheet: e.target.value === "" ? ("" as any) : (parseFloat(e.target.value) || 0) };
                              onUpdateSettings("dtfSuppliers", list);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Delivery Fee ($)
                          </label>
                          <input
                            type="number"
                            value={sup.deliveryCost === 0 ? "" : (sup.deliveryCost ?? "")}
                            onChange={(e) => {
                              const list = [...(settings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS)];
                              list[idx] = { ...list[idx], deliveryCost: e.target.value === "" ? ("" as any) : (parseFloat(e.target.value) || 0) };
                              onUpdateSettings("dtfSuppliers", list);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
                          />
                        </div>

                        <div className="md:col-span-1 flex items-center justify-end gap-2 pt-2 md:pt-0">
                          <button
                            type="button"
                            onClick={() => {
                              const list = [...(settings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS)];
                              list[idx] = { ...list[idx], active: !list[idx].active };
                              onUpdateSettings("dtfSuppliers", list);
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
                              const list = [...(settings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS)];
                              if (list.length <= 1) {
                                alert("At least one supplier must remain.");
                                return;
                              }
                              onUpdateSettings("dtfSuppliers", list.filter((_, i) => i !== idx));
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Computed Area and Auto $/Sq Ft */}
                      {(() => {
                        const width = Number(sup.sheetWidth) || 0;
                        const height = Number(sup.sheetHeight) || 0;
                        const cost = Number(sup.costPerSheet) || 0;
                        const areaSqFt = (width * height) / 144;
                        const pricePerSqFt = areaSqFt > 0 ? cost / areaSqFt : 0;
                        return (
                          <div className="flex flex-wrap items-center gap-3 px-3 py-1.5 bg-slate-100/90 rounded-xl text-[11px] text-slate-600 border border-slate-200/60">
                            <span>Sheet Area: <strong className="font-mono text-slate-800">{areaSqFt > 0 ? areaSqFt.toFixed(2) : "0.00"} sq ft</strong></span>
                            <span className="text-slate-300">•</span>
                            <span>Auto $/Sq Ft: <strong className="font-mono text-indigo-700">${pricePerSqFt > 0 ? pricePerSqFt.toFixed(2) : "0.00"} / sq ft</strong></span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] text-slate-400 italic">Delivery fee ($ {Number(sup.deliveryCost || 0).toLocaleString()}) is kept separate</span>
                          </div>
                        );
                      })()}

                      {/* Supplier Notes */}
                      <div className="pt-2 border-t border-slate-200/60">
                        <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                          Supplier Notes / Contact Details
                        </label>
                        <input
                          type="text"
                          value={sup.notes || ""}
                          onChange={(e) => {
                            const list = [...(settings.dtfSuppliers || DEFAULT_DTF_SUPPLIERS)];
                            list[idx] = { ...list[idx], notes: e.target.value };
                            onUpdateSettings("dtfSuppliers", list);
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
                      DTF Print Pricing Presets ({ (settings.dtfPricingPresets || DEFAULT_DTF_PRICING).length })
                    </h4>
                    <p className="text-[11px] text-slate-400">Manage standard print dimensions and customer selling prices.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const current = settings.dtfPricingPresets || DEFAULT_DTF_PRICING;
                      const newPreset: DTFPricingPreset = {
                        id: "dtf_p_" + Date.now(),
                        sizeLabel: 'Custom Print Size',
                        width: 10,
                        height: 10,
                        sellingPrice: 1800,
                        notes: "",
                        active: true
                      };
                      onUpdateSettings("dtfPricingPresets", [...current, newPreset]);
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Pricing Preset</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {(settings.dtfPricingPresets || DEFAULT_DTF_PRICING).map((preset, idx) => (
                    <div key={preset.id || idx} className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 md:p-5 space-y-4 shadow-2xs">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-4 space-y-1">
                          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Print Size Label
                          </label>
                          <input
                            type="text"
                            value={preset.sizeLabel}
                            onChange={(e) => {
                              const list = [...(settings.dtfPricingPresets || DEFAULT_DTF_PRICING)];
                              list[idx] = { ...list[idx], sizeLabel: e.target.value };
                              onUpdateSettings("dtfPricingPresets", list);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                            placeholder="E.g. 12 x 10 inches"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Width (in)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={preset.width === 0 ? "" : (preset.width ?? "")}
                            onChange={(e) => {
                              const list = [...(settings.dtfPricingPresets || DEFAULT_DTF_PRICING)];
                              list[idx] = { ...list[idx], width: e.target.value === "" ? ("" as any) : (parseFloat(e.target.value) || 0) };
                              onUpdateSettings("dtfPricingPresets", list);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-hidden"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Height (in)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={preset.height === 0 ? "" : (preset.height ?? "")}
                            onChange={(e) => {
                              const list = [...(settings.dtfPricingPresets || DEFAULT_DTF_PRICING)];
                              list[idx] = { ...list[idx], height: e.target.value === "" ? ("" as any) : (parseFloat(e.target.value) || 0) };
                              onUpdateSettings("dtfPricingPresets", list);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-hidden"
                          />
                        </div>

                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Customer Price ($ JMD)
                          </label>
                          <input
                            type="number"
                            step="50"
                            value={preset.sellingPrice === 0 ? "" : (preset.sellingPrice ?? "")}
                            onChange={(e) => {
                              const list = [...(settings.dtfPricingPresets || DEFAULT_DTF_PRICING)];
                              list[idx] = { ...list[idx], sellingPrice: e.target.value === "" ? ("" as any) : (parseFloat(e.target.value) || 0) };
                              onUpdateSettings("dtfPricingPresets", list);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
                          />
                        </div>

                        <div className="md:col-span-1 flex items-center justify-end gap-2 pt-2 md:pt-0">
                          <button
                            type="button"
                            onClick={() => {
                              const list = [...(settings.dtfPricingPresets || DEFAULT_DTF_PRICING)];
                              list[idx] = { ...list[idx], active: !list[idx].active };
                              onUpdateSettings("dtfPricingPresets", list);
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
                              const list = [...(settings.dtfPricingPresets || DEFAULT_DTF_PRICING)];
                              if (list.length <= 1) {
                                alert("At least one pricing preset must remain.");
                                return;
                              }
                              onUpdateSettings("dtfPricingPresets", list.filter((_, i) => i !== idx));
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Standard Paper &amp; Sticker Sheets ({ (settings.productionMaterials || DEFAULT_PRODUCTION_MATERIALS).length })
                    </h4>
                    <p className="text-[11px] text-slate-400">Manage base stock costs, pricing histories, and supplier benchmarks for layout calculators.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const currentMats = settings.productionMaterials || DEFAULT_PRODUCTION_MATERIALS;
                      const newMaterial: ProductionMaterialPreset = {
                        id: "mat-" + Date.now(),
                        name: "New Production Stock",
                        width: 12,
                        height: 18,
                        cost: 150,
                        pricingHistory: [
                          {
                            id: `ph-${Date.now()}`,
                            price: 150,
                            date: new Date().toISOString().split("T")[0],
                            reason: "Initial preset configuration",
                            updatedBy: userFullName || "Master Administrator"
                          }
                        ],
                        supplierNotes: "",
                        alternativeSources: "",
                        lastUpdatedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                      };
                      onUpdateSettings("productionMaterials", [...currentMats, newMaterial]);
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Material Preset</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {(settings.productionMaterials || DEFAULT_PRODUCTION_MATERIALS).map((mat, idx) => {
                    const prevPriceRecord = mat.pricingHistory && mat.pricingHistory.length > 1
                      ? mat.pricingHistory[mat.pricingHistory.length - 2]
                      : null;
                    const lastUpdated = mat.lastUpdatedDate || "Recorded";

                    return (
                      <div key={mat.id || idx} className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 md:p-5 space-y-4 shadow-2xs">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                          <div className="md:col-span-4 space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                              Material / Paper Description
                            </label>
                            <input
                              type="text"
                              value={mat.name}
                              onChange={(e) => {
                                const updated = [...(settings.productionMaterials || DEFAULT_PRODUCTION_MATERIALS)];
                                updated[idx] = { ...updated[idx], name: e.target.value, lastUpdatedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
                                onUpdateSettings("productionMaterials", updated);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                              placeholder="E.g. Crack & Peel Sticker Sheet"
                            />
                          </div>

                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                              Width (in)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={mat.width}
                              onChange={(e) => {
                                const updated = [...(settings.productionMaterials || DEFAULT_PRODUCTION_MATERIALS)];
                                updated[idx] = { ...updated[idx], width: parseFloat(e.target.value) || 0 };
                                onUpdateSettings("productionMaterials", updated);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                            />
                          </div>

                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                              Height (in)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={mat.height}
                              onChange={(e) => {
                                const updated = [...(settings.productionMaterials || DEFAULT_PRODUCTION_MATERIALS)];
                                updated[idx] = { ...updated[idx], height: parseFloat(e.target.value) || 0 };
                                onUpdateSettings("productionMaterials", updated);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                            />
                          </div>

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
                                  const updated = [...(settings.productionMaterials || DEFAULT_PRODUCTION_MATERIALS)];
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
                                  onUpdateSettings("productionMaterials", updated);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl pl-6 pr-2 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="md:col-span-1 flex items-end justify-end pt-2 md:pt-0">
                            <button
                              type="button"
                              onClick={() => {
                                const currentMats = settings.productionMaterials || DEFAULT_PRODUCTION_MATERIALS;
                                if (currentMats.length <= 1) {
                                  alert("At least one production material preset must remain.");
                                  return;
                                }
                                const updated = currentMats.filter((_, i) => i !== idx);
                                onUpdateSettings("productionMaterials", updated);
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
                                const updated = [...(settings.productionMaterials || DEFAULT_PRODUCTION_MATERIALS)];
                                updated[idx] = { 
                                  ...updated[idx], 
                                  supplierNotes: e.target.value,
                                  lastUpdatedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                };
                                onUpdateSettings("productionMaterials", updated);
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
                                  const updated = [...(settings.productionMaterials || DEFAULT_PRODUCTION_MATERIALS)];
                                  updated[idx] = { ...updated[idx], alternativeSources: e.target.value };
                                  onUpdateSettings("productionMaterials", updated);
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

        {/* AREA 3: INVENTORY CONTROL SETTINGS */}
        {activeAreaIndex === 2 && (
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm text-left space-y-6">
            <div className="pb-4 border-b border-slate-100 flex items-center gap-2">
              <Archive className="w-5 h-5 text-indigo-600" />
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
                  value={settings.lowStockThreshold}
                  onChange={(e) => onUpdateSettings("lowStockThreshold", parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                />
                <span className="text-[10px] text-slate-400 block font-medium">Triggers soft "Low Stock" warning badge across catalogs.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Restock Alert Threshold</label>
                <input
                  type="number"
                  min="1"
                  value={settings.restockThreshold}
                  onChange={(e) => onUpdateSettings("restockThreshold", parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                />
                <span className="text-[10px] text-slate-400 block font-medium">Triggers active watchtower suggestions to issue purchase re-orders.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">Default Book Status</label>
                <select
                  value={settings.defaultBookStatus}
                  onChange={(e) => onUpdateSettings("defaultBookStatus", e.target.value)}
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
                  value={settings.inventoryWarningLevels}
                  onChange={(e) => onUpdateSettings("inventoryWarningLevels", e.target.value)}
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
                    checked={settings.outOfStockAlertRules}
                    onChange={(e) => onUpdateSettings("outOfStockAlertRules", e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            {/* Primary Book Classifications Section */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Primary Book Classifications</h4>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Manage available book classifications available across the Librarium Luxe catalog.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(settings.bookClassifications || ["Mindset & Personal Development", "Business & Money", "Psychology & Human Behaviour", "Relationships & Romance", "Biography & Memoir"]).map((clf) => (
                  <div key={clf} className="px-3 py-1.5 bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span>{clf}</span>
                    <button
                      onClick={() => {
                        const current = settings.bookClassifications || ["Mindset & Personal Development", "Business & Money", "Psychology & Human Behaviour", "Relationships & Romance", "Biography & Memoir"];
                        if (current.length <= 1) {
                          alert("At least one classification must remain.");
                          return;
                        }
                        const updated = current.filter(c => c !== clf);
                        onUpdateSettings("bookClassifications", updated);
                      }}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove classification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 max-w-md pt-1">
                <input
                  type="text"
                  value={newClassificationInput}
                  onChange={(e) => setNewClassificationInput(e.target.value)}
                  placeholder="Add custom classification (e.g., Philosophy)..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden"
                />
                <button
                  onClick={() => {
                    if (!newClassificationInput.trim()) return;
                    const current = settings.bookClassifications || ["Mindset & Personal Development", "Business & Money", "Psychology & Human Behaviour", "Relationships & Romance", "Biography & Memoir"];
                    if (current.some(c => c.toLowerCase() === newClassificationInput.trim().toLowerCase())) {
                      alert("Classification already exists.");
                      return;
                    }
                    const updated = [...current, newClassificationInput.trim()];
                    onUpdateSettings("bookClassifications", updated);
                    setNewClassificationInput("");
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

export default ProductManagementHub;
