import React from "react";
import { Maximize2, Square, ArrowRight, Sparkles } from "lucide-react";

interface PrintOnlySheetVisualProps {
  sheetWidth: number;
  sheetLength: number;
  squareFootage: number;
}

export default function PrintOnlySheetVisual({
  sheetWidth,
  sheetLength,
  squareFootage,
}: PrintOnlySheetVisualProps) {
  const validDimensions = sheetWidth > 0 && sheetLength > 0;

  if (!validDimensions) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 space-y-2">
        <Square className="w-8 h-8 text-slate-600 mx-auto" />
        <p className="text-xs font-bold text-slate-300">Enter Sheet Dimensions</p>
        <p className="text-[11px] text-slate-500">
          Enter sheet width and length to see the proportional sheet preview.
        </p>
      </div>
    );
  }

  // Calculate aspect ratio for visual box (cap max visual height to keep compact)
  const aspectRatio = sheetLength / sheetWidth; // e.g. 36 / 22 = 1.63
  const containerWidth = 260;
  // Limit rendered height between 140px and 380px so it stays compact in the right column
  const renderedHeight = Math.max(140, Math.min(360, containerWidth * Math.min(aspectRatio, 2.5)));

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 text-left space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-200">Proportional Sheet Preview</span>
        </div>
        <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-md">
          {squareFootage.toFixed(2)} sq. ft.
        </span>
      </div>

      {/* Visual Sheet Canvas */}
      <div className="flex flex-col items-center justify-center p-3 bg-slate-900/50 rounded-2xl border border-slate-800/80 relative">
        
        {/* Dimension: Width (Top) */}
        <div className="flex items-center justify-center gap-1 text-[11px] font-mono font-bold text-slate-400 mb-1.5 w-full">
          <span className="h-px bg-slate-700 flex-1 max-w-[40px]"></span>
          <span className="text-white bg-slate-800 px-2 py-0.5 rounded text-[10px]">
            {sheetWidth}&quot; Width
          </span>
          <span className="h-px bg-slate-700 flex-1 max-w-[40px]"></span>
        </div>

        {/* Proportional Box */}
        <div className="flex items-center gap-2 w-full justify-center">
          
          {/* Main Visual Film Sheet */}
          <div
            style={{
              width: `${containerWidth}px`,
              height: `${renderedHeight}px`,
            }}
            className="relative bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 rounded-xl border-2 border-emerald-500/40 shadow-2xl flex flex-col items-center justify-center overflow-hidden select-none transition-all duration-200 group"
          >
            {/* Subtle grid lines background pattern */}
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: "linear-gradient(to right, #64748b 1px, transparent 1px), linear-gradient(to bottom, #64748b 1px, transparent 1px)",
                backgroundSize: "20px 20px"
              }}
            />

            {/* Film Roll Top & Bottom Indicators */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500/30 via-emerald-400/60 to-emerald-500/30"></div>
            <div className="absolute bottom-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500/30 via-emerald-400/60 to-emerald-500/30"></div>

            {/* Corner Alignment Marks */}
            <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-emerald-400/70"></div>
            <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-emerald-400/70"></div>
            <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-emerald-400/70"></div>
            <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-emerald-400/70"></div>

            {/* Center Content Badge */}
            <div className="relative z-10 text-center p-3 bg-slate-950/85 backdrop-blur-xs rounded-xl border border-slate-800 shadow-md max-w-[200px]">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
                DTF Print Sheet
              </span>
              <div className="text-base font-black text-white font-mono mt-0.5">
                {sheetWidth}&quot; × {sheetLength}&quot;
              </div>
              <div className="text-[11px] font-bold text-emerald-400 font-mono mt-0.5">
                {squareFootage.toFixed(2)} sq. ft.
              </div>
            </div>

            {/* Aspect ratio badge */}
            <div className="absolute bottom-2.5 right-3 text-[9px] font-mono text-slate-500">
              Ratio: 1 : {(sheetLength / sheetWidth).toFixed(2)}
            </div>
          </div>

          {/* Dimension: Length (Right) */}
          <div className="flex flex-col items-center justify-center text-[10px] font-mono font-bold text-slate-400 h-full">
            <span className="w-px bg-slate-700 h-8"></span>
            <span className="text-white bg-slate-800 px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap my-1 rotate-90">
              {sheetLength}&quot;
            </span>
            <span className="w-px bg-slate-700 h-8"></span>
          </div>
        </div>

      </div>

      {/* Specifications Breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 block text-[10px] font-bold uppercase">Square Footage</span>
          <span className="text-emerald-400 font-bold font-mono text-xs">
            {squareFootage.toFixed(2)} sq. ft.
          </span>
        </div>
        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 block text-[10px] font-bold uppercase">Linear Length</span>
          <span className="text-white font-bold font-mono text-xs">
            {(sheetLength / 12).toFixed(2)} linear ft.
          </span>
        </div>
      </div>
    </div>
  );
}
