import React, { useState, useEffect } from "react";
import { getCurrentEnvironment, EnvironmentType } from "../utils/environmentUtils";

interface SystemReferenceClockProps {
  onOpenEnvironmentManagement?: () => void;
  clientsCount?: number;
  showDirectoryStatusWidgets?: boolean;
}

export default function SystemReferenceClock({
  onOpenEnvironmentManagement,
  clientsCount,
  showDirectoryStatusWidgets = false,
}: SystemReferenceClockProps) {
  const [now, setNow] = useState(() => new Date());
  const [environment, setEnvironment] = useState<EnvironmentType>(() => getCurrentEnvironment());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    const handleEnvChange = (e: any) => {
      if (e.detail && e.detail.environment) {
        setEnvironment(e.detail.environment);
      } else {
        setEnvironment(getCurrentEnvironment());
      }
    };

    window.addEventListener("ceo_environment_changed", handleEnvChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener("ceo_environment_changed", handleEnvChange);
    };
  }, []);

  const formattedDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const formattedSyncTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3 self-start md:self-end shrink-0">
      {/* 45 Client Accounts Synchronized Status Indicator (Client Directory tab only) */}
      {showDirectoryStatusWidgets && clientsCount !== undefined && (
        <div className="px-3.5 py-2.5 bg-slate-900/60 backdrop-blur-md border border-slate-700/60 rounded-xl text-left shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs font-extrabold text-white">
              {clientsCount} Client Accounts Synchronized
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium leading-tight">
            Offline Database active.<br />
            Last Synchronized: <span className="font-semibold text-slate-300">{formattedSyncTime}</span>
          </p>
        </div>
      )}

      {/* CRM Watchtower Secured Status Indicator (Client Directory tab only) */}
      {showDirectoryStatusWidgets && (
        <div className="px-3.5 py-2.5 bg-slate-900/60 backdrop-blur-md border border-emerald-500/30 rounded-xl text-left shadow-xs flex items-center gap-2.5">
          <span className="text-base leading-none">🛡️</span>
          <div>
            <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider block leading-tight">
              CRM Watchtower
            </span>
            <span className="text-xs font-bold text-slate-100 block mt-0.5">
              Secured
            </span>
          </div>
        </div>
      )}

      {/* SYSTEM REFERENCE DATE & TIME Block */}
      <div className="px-4 py-3 bg-slate-900/60 backdrop-blur-md border border-slate-700/60 rounded-xl text-left space-y-2 shrink-0 shadow-xs">
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
            SYSTEM REFERENCE DATE
          </span>
          <span className="text-xs font-semibold text-white font-mono block mt-0.5">
            {formattedDate}
          </span>
        </div>
        <div className="pt-2 border-t border-slate-700/40">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
            SYSTEM TIME
          </span>
          <span className="text-xs font-semibold text-amber-300 font-mono block mt-0.5">
            {formattedTime}
          </span>
        </div>
        <div className="pt-2 border-t border-slate-700/40">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
            ENVIRONMENT
          </span>
          <button
            type="button"
            onClick={onOpenEnvironmentManagement}
            className={`mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              environment === "LIVE"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
            }`}
            title="Click to open Environment Management Settings"
          >
            <span className="text-xs">{environment === "LIVE" ? "🟢" : "🟡"}</span>
            <span>{environment === "LIVE" ? "LIVE MODE" : "STRESS TEST MODE"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
