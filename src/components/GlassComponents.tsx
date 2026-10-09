import React from "react";

export interface GlassWorkspaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "light" | "dark";
  children: React.ReactNode;
}

/**
 * Level 2: Main Glass Workspace
 * Large floating glass surface that holds and frames application views.
 */
export const GlassWorkspace: React.FC<GlassWorkspaceProps> = ({
  variant = "light",
  className = "",
  children,
  ...props
}) => {
  return (
    <div
      className={`${variant === "dark" ? "glass-workspace-dark" : "glass-workspace"} p-6 sm:p-8 min-w-0 max-w-full ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface GlassWidgetProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: React.ReactNode;
}

/**
 * Level 3: Glass Widget
 * Floating instruments, metrics, or tool sections positioned within the workspace.
 */
export const GlassWidget: React.FC<GlassWidgetProps> = ({
  interactive = false,
  className = "",
  children,
  ...props
}) => {
  return (
    <div
      className={`glass-widget p-4 sm:p-6 min-w-0 max-w-full ${interactive ? "hover:-translate-y-0.5 cursor-pointer" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface GlassControlProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
}

/**
 * Level 4: Floating Glass Control
 * Interactive buttons, arrows, toggles, and compact action elements.
 */
export const GlassControl: React.FC<GlassControlProps> = ({
  active = false,
  className = "",
  children,
  ...props
}) => {
  return (
    <button
      className={`px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer max-w-full ${
        active ? "glass-control-active" : "glass-control text-slate-700"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export interface GlassPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  active?: boolean;
  children: React.ReactNode;
}

/**
 * Level 4: Glass Pill
 * Badges, filters, counters, and metadata tags.
 */
export const GlassPill: React.FC<GlassPillProps> = ({
  active = false,
  className = "",
  children,
  ...props
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold max-w-full ${
        active ? "bg-slate-900 text-white shadow-2xs" : "glass-pill text-slate-700"
      } ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
