import React, { useState, useEffect, useCallback } from "react";
import { 
  Crown, 
  Users, 
  HeartHandshake, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { Client } from "../types";
import ClientTierManagement from "./ClientTierManagement";
import { ClientManagementSettings } from "./ClientManagementSettings";
import { CmtManagementModal } from "./CmtManagementModal";

interface ClientSettingsHubProps {
  clients: Client[];
  onUpdateClients?: (updatedClients: Client[]) => void;
  onNavigateToTab?: (tab: any) => void;
  onNavigateToClient?: (clientId: string) => void;
  initialIndex?: number;
}

interface ClientManagementArea {
  id: "tier_management" | "client_management" | "cmts";
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CLIENT_MANAGEMENT_AREAS: ClientManagementArea[] = [
  {
    id: "tier_management",
    title: "Client Tier Management",
    icon: Crown,
  },
  {
    id: "client_management",
    title: "Client Management",
    icon: Users,
  },
  {
    id: "cmts",
    title: "CMTs Management",
    icon: HeartHandshake,
  }
];

export function ClientSettingsHub({
  clients,
  onUpdateClients,
  onNavigateToTab,
  onNavigateToClient,
  initialIndex
}: ClientSettingsHubProps) {
  // Master controlled navigation state:
  // 0 = Client Tier Management
  // 1 = Client Management
  // 2 = CMTs Management
  const [activeAreaIndex, setActiveAreaIndex] = useState<number>(() => {
    if (typeof initialIndex === "number" && initialIndex >= 0 && initialIndex < CLIENT_MANAGEMENT_AREAS.length) {
      return initialIndex;
    }
    const stored = localStorage.getItem("ceo_client_settings_active_index");
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < CLIENT_MANAGEMENT_AREAS.length) {
        return parsed;
      }
    }
    return 0;
  });

  // Sync if initialIndex changes externally
  useEffect(() => {
    if (typeof initialIndex === "number" && initialIndex >= 0 && initialIndex < CLIENT_MANAGEMENT_AREAS.length) {
      setActiveAreaIndex(initialIndex);
    }
  }, [initialIndex]);

  const handleSelectArea = useCallback((index: number) => {
    setActiveAreaIndex(index);
    localStorage.setItem("ceo_client_settings_active_index", index.toString());
  }, []);

  const handlePrevArea = useCallback(() => {
    handleSelectArea((activeAreaIndex - 1 + CLIENT_MANAGEMENT_AREAS.length) % CLIENT_MANAGEMENT_AREAS.length);
  }, [activeAreaIndex, handleSelectArea]);

  const handleNextArea = useCallback(() => {
    handleSelectArea((activeAreaIndex + 1) % CLIENT_MANAGEMENT_AREAS.length);
  }, [activeAreaIndex, handleSelectArea]);

  // Keyboard navigation (Left/Right arrow keys when not inside an input)
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

  const activeArea = CLIENT_MANAGEMENT_AREAS[activeAreaIndex];
  const prevArea = CLIENT_MANAGEMENT_AREAS[(activeAreaIndex - 1 + CLIENT_MANAGEMENT_AREAS.length) % CLIENT_MANAGEMENT_AREAS.length];
  const nextArea = CLIENT_MANAGEMENT_AREAS[(activeAreaIndex + 1) % CLIENT_MANAGEMENT_AREAS.length];
  const ActiveIcon = activeArea.icon;

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6 text-left" id="master_client_settings_hub">
      
      {/* ========================================================================= */}
      {/* 1. EXACT HEADING: CLIENT (NO EXTRA SUMMARY, DESCRIPTIONS, OR SUBTITLES)   */}
      {/* ========================================================================= */}
      <div className="text-center pt-2 select-none">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">
          CLIENT
        </h1>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTROLLED NAVIGATION INTERACTION (SAME AS INVENTORY & PRODUCT MGMT)   */}
      {/* ========================================================================= */}
      <div className="glass-workspace p-3 sm:p-4 text-center select-none">
        <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-2xl mx-auto">
          
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handlePrevArea}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-slate-700 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition-all cursor-pointer shrink-0 shadow-2xs bg-white active:scale-95"
            title={`Previous: ${prevArea.title} (←)`}
            aria-label="Previous Client Management Area"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Center Selected Management Area Card (Liquid Glass Style) */}
          <div className="flex-1 min-w-0 bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl py-3 px-4 sm:px-6 shadow-xs flex items-center justify-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-700 shrink-0">
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
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-slate-700 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition-all cursor-pointer shrink-0 shadow-2xs bg-white active:scale-95"
            title={`Next: ${nextArea.title} (→)`}
            aria-label="Next Client Management Area"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Dot Pagination Indicators */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {CLIENT_MANAGEMENT_AREAS.map((area, idx) => (
            <button
              key={area.id}
              type="button"
              onClick={() => handleSelectArea(idx)}
              className={`h-2 transition-all rounded-full cursor-pointer ${
                activeAreaIndex === idx
                  ? "w-8 bg-amber-600 shadow-xs"
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
        {activeAreaIndex === 0 && (
          <ClientTierManagement
            clients={clients}
            onUpdateClients={onUpdateClients}
            onNavigateToClient={onNavigateToClient}
          />
        )}

        {activeAreaIndex === 1 && (
          <ClientManagementSettings
            clients={clients}
            onUpdateClients={onUpdateClients}
            onNavigateToTab={onNavigateToTab}
            onNavigateToClient={onNavigateToClient}
          />
        )}

        {activeAreaIndex === 2 && (
          <CmtManagementModal
            isOpen={true}
            isEmbeddedInSettings={true}
            clients={clients}
            onUpdateClients={onUpdateClients || (() => {})}
            onNavigateToClient={(clientId) => {
              if (onNavigateToTab) onNavigateToTab("directory");
              if (onNavigateToClient) onNavigateToClient(clientId);
            }}
          />
        )}
      </div>

    </div>
  );
}

export default ClientSettingsHub;
