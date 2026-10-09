import React from "react";
import { isRestrictedWindow } from "../utils/adventistGuard";

interface AdventistAlertProps {
  adventist?: string | boolean;
  inline?: boolean;
  className?: string;
}

/**
 * Reusable Adventist identity component for summary cards & profile views.
 * Displays clean '• Adventist ✝' tag on summaries.
 */
export default function AdventistAlert({
  adventist,
  inline = false,
  className = ""
}: AdventistAlertProps) {
  const isAdventist = adventist === "Yes" || adventist === true;
  if (!isAdventist) return null;

  if (inline) {
    return (
      <span className={`inline-flex items-center text-[10px] font-bold text-slate-700 ${className}`}>
        • Adventist ✝
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 font-bold text-slate-800 text-xs ${className}`}>
      <span>Adventist ✝</span>
    </div>
  );
}
