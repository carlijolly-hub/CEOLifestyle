import React, { useState, useEffect, useCallback } from "react";
import LuxeInventory from "./LuxeInventory";
import { RegularInventory } from "./RegularInventory";
import { FulfillmentInventoryView } from "./FulfillmentInventoryView";
import { LuxeBookInventoryItem, SystemSettings, OperationsOrder } from "../types";
import { Archive, Package, PackageCheck, ChevronLeft, ChevronRight } from "lucide-react";

interface InventoryHubProps {
  inventory: LuxeBookInventoryItem[];
  onUpdateInventory: (updatedList: LuxeBookInventoryItem[]) => void;
  settings?: SystemSettings;
  onUpdateSettings?: (newSettings: SystemSettings) => void;
  operationsOrders?: OperationsOrder[];
}

interface InventorySystemItem {
  id: "book" | "regular" | "fulfillment";
  title: string;
  secondaryDescriptor: string;
  operationalQuestion: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  pillColor: string;
  tagline: string;
}

const INVENTORY_SYSTEMS: InventorySystemItem[] = [
  {
    id: "book",
    title: "BOOK INVENTORY",
    secondaryDescriptor: "BOOKS & EDITIONS",
    operationalQuestion: "What books do we have?",
    icon: Archive,
    accentColor: "from-amber-500/20 via-slate-900 to-amber-950/40",
    pillColor: "bg-amber-400/20 text-amber-300 border-amber-400/30",
    tagline: "Librarium Luxe book business: private catalog, editions, allocations, and sales velocity."
  },
  {
    id: "regular",
    title: "REGULAR INVENTORY",
    secondaryDescriptor: "FINISHED GOODS",
    operationalQuestion: "What finished goods do we have?",
    icon: Package,
    accentColor: "from-indigo-500/20 via-slate-900 to-indigo-950/40",
    pillColor: "bg-indigo-400/20 text-indigo-300 border-indigo-400/30",
    tagline: "Finished physical products ready to sell, use, or fulfill (apparel, finished gift sets, merchandise)."
  },
  {
    id: "fulfillment",
    title: "FULFILLMENT INVENTORY",
    secondaryDescriptor: "MATERIALS",
    operationalQuestion: "What materials do we have?",
    icon: PackageCheck,
    accentColor: "from-purple-500/20 via-slate-900 to-purple-950/40",
    pillColor: "bg-purple-400/20 text-purple-300 border-purple-400/30",
    tagline: "Raw materials, packaging, and supplies available on hand to fulfill active customer production orders."
  }
];

export function InventoryHub({
  inventory,
  onUpdateInventory,
  settings,
  onUpdateSettings,
  operationsOrders = []
}: InventoryHubProps) {
  // Master controlled carousel state: 0 = Book Inventory, 1 = Regular Inventory, 2 = Fulfillment Inventory
  const [activeSystemIndex, setActiveSystemIndex] = useState<number>(() => {
    const stored = localStorage.getItem("ceo_inventory_active_system_index");
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < INVENTORY_SYSTEMS.length) {
        return parsed;
      }
    }
    return 0;
  });

  const handleSelectSystem = useCallback((index: number) => {
    setActiveSystemIndex(index);
    localStorage.setItem("ceo_inventory_active_system_index", index.toString());
  }, []);

  const handlePrevSystem = useCallback(() => {
    handleSelectSystem((activeSystemIndex - 1 + INVENTORY_SYSTEMS.length) % INVENTORY_SYSTEMS.length);
  }, [activeSystemIndex, handleSelectSystem]);

  const handleNextSystem = useCallback(() => {
    handleSelectSystem((activeSystemIndex + 1) % INVENTORY_SYSTEMS.length);
  }, [activeSystemIndex, handleSelectSystem]);

  // Optional keyboard navigation (Left/Right arrow keys when not inside an input)
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
        handlePrevSystem();
      } else if (e.key === "ArrowRight") {
        handleNextSystem();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevSystem, handleNextSystem]);

  const activeSystem = INVENTORY_SYSTEMS[activeSystemIndex];
  const prevSystem = INVENTORY_SYSTEMS[(activeSystemIndex - 1 + INVENTORY_SYSTEMS.length) % INVENTORY_SYSTEMS.length];
  const nextSystem = INVENTORY_SYSTEMS[(activeSystemIndex + 1) % INVENTORY_SYSTEMS.length];
  const ActiveIcon = activeSystem.icon;

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6 text-left" id="master_inventory_hub">
      
      {/* ========================================================================= */}
      {/* 1. APPLE-INSPIRED CONTROLLED MASTER CAROUSEL (3 PRIMARY INVENTORY SYSTEMS) */}
      {/* ========================================================================= */}
      <div className="glass-workspace p-4 sm:p-5 text-center select-none">
        
        {/* Navigation Stage: ‹ [Flank Preview]  [ACTIVE SYSTEM]  [Flank Preview] › */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-4xl mx-auto">
          
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handlePrevSystem}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer shrink-0 shadow-2xs bg-white active:scale-95"
            title={`Previous: ${prevSystem.title} (←)`}
            aria-label="Previous Inventory System"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Carousel Viewport */}
          <div className="flex-1 flex items-center justify-center gap-3 sm:gap-6 min-w-0 overflow-hidden py-1">
            
            {/* Left Flank Preview (dimmed peek on desktop) */}
            <button
              type="button"
              onClick={handlePrevSystem}
              className="hidden md:flex items-center gap-1 text-right truncate max-w-[130px] lg:max-w-[160px] opacity-35 hover:opacity-75 transition-opacity cursor-pointer text-xs font-extrabold uppercase tracking-wider text-slate-500"
              title={`Jump to ${prevSystem.title}`}
            >
              <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{prevSystem.title}</span>
            </button>

            {/* Active System Center Card (Liquid Glass Design) */}
            <div className="flex-1 max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white border border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-xl transition-all duration-300 text-center relative overflow-hidden">
              {/* Subtle accent glow background */}
              <div className={`absolute inset-0 bg-gradient-to-r ${activeSystem.accentColor} opacity-50 pointer-events-none`} />

              <div className="relative z-10 flex flex-col items-center gap-2">
                {/* System Index & Operational Question Pill */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                    System {activeSystemIndex + 1} of 3
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${activeSystem.pillColor}`}>
                    {activeSystem.operationalQuestion}
                  </span>
                </div>

                {/* Primary Heading with Icon */}
                <div className="flex items-center gap-2.5 mt-1">
                  <div className="p-2 rounded-2xl bg-white/10 border border-white/15 text-white shadow-xs">
                    <ActiveIcon className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                    {activeSystem.title}
                  </h2>
                </div>

                {/* Secondary Descriptor Pill */}
                <div className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-white/15 text-slate-200 border border-white/20">
                  {activeSystem.secondaryDescriptor}
                </div>

                {/* Short Subtitle / Purpose */}
                <p className="text-xs text-slate-300 font-medium max-w-md line-clamp-2 mt-0.5">
                  {activeSystem.tagline}
                </p>
              </div>
            </div>

            {/* Right Flank Preview (dimmed peek on desktop) */}
            <button
              type="button"
              onClick={handleNextSystem}
              className="hidden md:flex items-center gap-1 text-left truncate max-w-[130px] lg:max-w-[160px] opacity-35 hover:opacity-75 transition-opacity cursor-pointer text-xs font-extrabold uppercase tracking-wider text-slate-500"
              title={`Jump to ${nextSystem.title}`}
            >
              <span className="truncate">{nextSystem.title}</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleNextSystem}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer shrink-0 shadow-2xs bg-white active:scale-95"
            title={`Next: ${nextSystem.title} (→)`}
            aria-label="Next Inventory System"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Dot Pagination Indicators */}
        <div className="flex items-center justify-center gap-2.5 pt-3">
          {INVENTORY_SYSTEMS.map((system, idx) => (
            <button
              key={system.id}
              type="button"
              onClick={() => handleSelectSystem(idx)}
              className={`transition-all duration-300 rounded-full cursor-pointer flex items-center justify-center ${
                activeSystemIndex === idx
                  ? "w-8 h-2.5 bg-indigo-600 shadow-xs scale-105"
                  : "w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400"
              }`}
              title={`${idx + 1}. ${system.title} (${system.secondaryDescriptor})`}
              aria-label={`Go to ${system.title}`}
            />
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ACTIVE INVENTORY WORKSPACE CONTAINER (ONLY ONE RENDERS AT A TIME)       */}
      {/* ========================================================================= */}
      <div className="w-full max-w-full">
        {activeSystemIndex === 0 && (
          <LuxeInventory
            inventory={inventory}
            onUpdateInventory={onUpdateInventory}
            settings={settings}
          />
        )}

        {activeSystemIndex === 1 && (
          <RegularInventory
            settings={settings}
            onUpdateSettings={onUpdateSettings}
          />
        )}

        {activeSystemIndex === 2 && (
          <FulfillmentInventoryView
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            operationsOrders={operationsOrders}
            inventory={inventory}
          />
        )}
      </div>
    </div>
  );
}

export default InventoryHub;
