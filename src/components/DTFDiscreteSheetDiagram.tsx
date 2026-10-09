import React, { useState } from "react";
import { 
  DTFSheetPackingResult, 
  SingleSheetReport, 
  PlacedSheetTransfer 
} from "../utils/dtfSheetPackingEngine";
import { 
  MeasurementUnit, 
  formatMeasurement, 
  formatDimensionPair, 
  fromInches 
} from "../utils/measurementUtils";
import { 
  Maximize2, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

interface DTFDiscreteSheetDiagramProps {
  packingResult: DTFSheetPackingResult;
  measurementUnit: MeasurementUnit;
  sheetWidthNormalized: number;  // In inches
  sheetHeightNormalized: number; // In inches
}

export default function DTFDiscreteSheetDiagram({
  packingResult,
  measurementUnit,
  sheetWidthNormalized,
  sheetHeightNormalized
}: DTFDiscreteSheetDiagramProps) {
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"focus" | "grid">("focus");
  const [hoveredTransfer, setHoveredTransfer] = useState<PlacedSheetTransfer | null>(null);

  const sheets = packingResult.sheets;
  const totalSheets = packingResult.sheetsRequired;

  // Active sheet safety check
  const currentSheet: SingleSheetReport | undefined = 
    sheets.find(s => s.sheetIndex === activeSheetIndex) || sheets[0];

  const sheetW_display = fromInches(sheetWidthNormalized, measurementUnit);
  const sheetH_display = fromInches(sheetHeightNormalized, measurementUnit);

  const renderSingleSheetSvg = (sheet: SingleSheetReport, isThumbnail: boolean = false) => {
    // Aspect ratio viewBox
    const width = sheetWidthNormalized;
    const height = sheetHeightNormalized;
    const viewBox = `0 0 ${width} ${height}`;

    return (
      <div className="relative w-full flex justify-center items-center py-2 select-none">
        <svg
          viewBox={viewBox}
          className={`w-full max-h-[480px] object-contain rounded-xl shadow-lg border-2 border-slate-700 bg-slate-900 transition-all duration-300 ${
            isThumbnail ? "max-h-[220px]" : "max-h-[480px]"
          }`}
          style={{
            aspectRatio: `${width} / ${height}`,
            maxWidth: width > height ? "100%" : "380px"
          }}
        >
          <defs>
            {/* Subtle grid pattern to represent transfer film grid */}
            <pattern
              id={`film-grid-${sheet.sheetIndex}`}
              width="1"
              height="1"
              patternUnits="userSpaceOnUse"
            >
              <rect width="1" height="1" fill="#0b1120" />
              <path
                d="M 1 0 L 0 0 0 1"
                fill="none"
                stroke="#1e293b"
                strokeWidth="0.04"
              />
            </pattern>
          </defs>

          {/* Sheet Background / Film Base */}
          <rect
            x="0"
            y="0"
            width={width}
            height={height}
            fill={`url(#film-grid-${sheet.sheetIndex})`}
            rx="0.2"
          />

          {/* Sheet Outer Border Guide */}
          <rect
            x="0"
            y="0"
            width={width}
            height={height}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="0.08"
            strokeDasharray="0.3 0.3"
            opacity="0.6"
          />

          {/* Placed Designs */}
          {sheet.placedTransfers.map((t) => {
            const isHovered = hoveredTransfer?.transferId === t.transferId;
            const wDisplay = fromInches(t.placedWidth, measurementUnit);
            const hDisplay = fromInches(t.placedHeight, measurementUnit);

            return (
              <g
                key={t.transferId}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => setHoveredTransfer(t)}
                onMouseLeave={() => setHoveredTransfer(null)}
              >
                {/* Design Rectangle */}
                <rect
                  x={t.x}
                  y={t.y}
                  width={t.placedWidth}
                  height={t.placedHeight}
                  fill={t.color}
                  fillOpacity={isHovered ? 0.95 : 0.82}
                  stroke={isHovered ? "#ffffff" : "#0f172a"}
                  strokeWidth={isHovered ? 0.08 : 0.04}
                  rx="0.15"
                />

                {/* Subtle Inner Highlight */}
                <rect
                  x={t.x + 0.04}
                  y={t.y + 0.04}
                  width={Math.max(0.01, t.placedWidth - 0.08)}
                  height={Math.max(0.01, t.placedHeight - 0.08)}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="0.03"
                  strokeOpacity="0.25"
                  rx="0.1"
                />

                {/* Text Label inside rectangle (scaled to physical size) */}
                {t.placedWidth >= 1.5 && t.placedHeight >= 1.0 && (
                  <g pointerEvents="none">
                    <text
                      x={t.x + t.placedWidth / 2}
                      y={t.y + t.placedHeight / 2 - (t.placedHeight >= 2.0 ? 0.3 : 0.05)}
                      fill="#ffffff"
                      fontSize={Math.min(0.55, Math.min(t.placedWidth, t.placedHeight) * 0.26)}
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="font-sans drop-shadow"
                    >
                      {t.designName.length > 18 ? t.designName.substring(0, 16) + "…" : t.designName}
                    </text>

                    {t.placedHeight >= 1.8 && (
                      <text
                        x={t.x + t.placedWidth / 2}
                        y={t.y + t.placedHeight / 2 + 0.35}
                        fill="#f8fafc"
                        fontSize={Math.min(0.42, Math.min(t.placedWidth, t.placedHeight) * 0.18)}
                        fontWeight="600"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="font-mono drop-shadow opacity-95"
                      >
                        {formatDimensionPair(wDisplay, hDisplay, measurementUnit)}
                      </text>
                    )}

                    {t.totalCopies > 1 && t.placedHeight >= 2.6 && (
                      <text
                        x={t.x + t.placedWidth / 2}
                        y={t.y + t.placedHeight / 2 + 0.8}
                        fill="#e2e8f0"
                        fontSize={Math.min(0.35, Math.min(t.placedWidth, t.placedHeight) * 0.14)}
                        fontWeight="500"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="font-mono opacity-80"
                      >
                        #{t.copyNumber} of {t.totalCopies}
                      </text>
                    )}
                  </g>
                )}

                {/* Rotation Indicator Badge */}
                {t.rotated && t.placedWidth >= 1.0 && t.placedHeight >= 1.0 && (
                  <g transform={`translate(${t.x + t.placedWidth - 0.5}, ${t.y + 0.15})`}>
                    <rect width="0.38" height="0.38" rx="0.08" fill="#000000" fillOpacity="0.6" />
                    <text
                      x="0.19"
                      y="0.22"
                      fill="#38bdf8"
                      fontSize="0.24"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      ↺
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-100 shadow-xl space-y-4">
      {/* Visual Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">
              DTF Sheet Visual Layout
            </h3>
            <div className="label-value-row text-xs text-slate-400 mt-0.5">
              <span className="label-value-label">Physical DTF Sheet:</span>
              <span className="label-value-val text-indigo-300 font-semibold">{formatDimensionPair(sheetW_display, sheetH_display, measurementUnit)}</span>
            </div>
          </div>
        </div>

        {/* View mode toggle & Sheet Counter */}
        <div className="flex items-center space-x-2">
          {totalSheets > 1 && (
            <div className="inline-flex p-1 bg-slate-800 rounded-lg text-xs font-semibold text-slate-300">
              <button
                type="button"
                onClick={() => setViewMode("focus")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === "focus"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "hover:text-white"
                }`}
              >
                Sheet Focus
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "hover:text-white"
                }`}
              >
                All Sheets ({totalSheets})
              </button>
            </div>
          )}

          <div className="px-3 py-1 bg-indigo-950/70 border border-indigo-500/30 rounded-lg text-xs font-bold text-indigo-300">
            {packingResult.totalAllocatedPieces} of {packingResult.totalRequestedPieces} Pieces Placed
          </div>
        </div>
      </div>

      {/* Focus Mode: Individual Sheet Navigation */}
      {viewMode === "focus" && (
        <div className="space-y-3">
          {/* Sheet Selector bar (if multiple sheets) */}
          {totalSheets > 1 && (
            <div className="flex items-center justify-between bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/60">
              <button
                type="button"
                disabled={activeSheetIndex <= 1}
                onClick={() => setActiveSheetIndex(prev => Math.max(1, prev - 1))}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Sheet {activeSheetIndex} of {totalSheets}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                  {Math.round(currentSheet?.utilizationPercent || 0)}% Utilized
                </span>
                <span className="text-xs text-slate-400">
                  ({currentSheet?.totalTransfersOnSheet || 0} pieces)
                </span>
              </div>

              <button
                type="button"
                disabled={activeSheetIndex >= totalSheets}
                onClick={() => setActiveSheetIndex(prev => Math.min(totalSheets, prev + 1))}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Main SVG Render */}
          {currentSheet && renderSingleSheetSvg(currentSheet, false)}

          {/* Quick breakdown for current sheet */}
          {currentSheet && (
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Allocated on this sheet:</span>
                <span className="font-semibold text-white">
                  {Object.entries(currentSheet.allocatedCounts)
                    .map(([name, count]) => `${count} × ${name}`)
                    .join(", ") || "None"}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-slate-400">
                <span>
                  Used Area: <strong className="text-emerald-400">{currentSheet.usedArea.toFixed(1)} sq in</strong>
                </span>
                <span>•</span>
                <span>
                  Free Space: <strong className="text-slate-300">{currentSheet.remainingArea.toFixed(1)} sq in</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid Mode: View all sheets simultaneously */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sheets.map((s) => (
            <div
              key={s.sheetIndex}
              onClick={() => {
                setActiveSheetIndex(s.sheetIndex);
                setViewMode("focus");
              }}
              className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 hover:border-indigo-500 cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Sheet #{s.sheetIndex}
                </span>
                <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[11px]">
                  {Math.round(s.utilizationPercent)}%
                </span>
              </div>

              {renderSingleSheetSvg(s, true)}

              <div className="text-[11px] text-slate-400 flex justify-between items-center pt-1 border-t border-slate-700/40">
                <span>{s.totalTransfersOnSheet} pieces</span>
                <span className="text-indigo-400 font-medium group-hover:underline">Focus View →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hover Information Box */}
      {hoveredTransfer && (
        <div className="bg-indigo-950/80 border border-indigo-500/40 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: hoveredTransfer.color }}
            />
            <strong className="text-white text-sm">{hoveredTransfer.designName}</strong>
            <span className="text-indigo-200">
              (Copy #{hoveredTransfer.copyNumber} of {hoveredTransfer.totalCopies})
            </span>
          </div>
          <div className="flex items-center space-x-4 text-slate-300">
            <span>
              Placed Size:{" "}
              <strong className="text-white font-mono">
                {formatDimensionPair(
                  fromInches(hoveredTransfer.placedWidth, measurementUnit),
                  fromInches(hoveredTransfer.placedHeight, measurementUnit),
                  measurementUnit
                )}
              </strong>
            </span>
            {hoveredTransfer.rotated && (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <RotateCw className="w-3 h-3" /> Rotated 90° for optimal packing
              </span>
            )}
            <span>
              Position: ({hoveredTransfer.x.toFixed(1)}", {hoveredTransfer.y.toFixed(1)}")
            </span>
          </div>
        </div>
      )}

      {/* Overall Utilization and Sheet Summary Bar */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Total Sheets: <strong className="text-white">{totalSheets}</strong></span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span>
              Overall Utilization:{" "}
              <strong className="text-emerald-400 font-bold">
                {Math.round(packingResult.overallUtilizationPercent)}%
              </strong>
            </span>
          </div>
        </div>

        {packingResult.unplaceableItems.length > 0 && (
          <div className="flex items-center space-x-1 text-rose-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{packingResult.unplaceableItems.length} oversized item(s) cannot fit</span>
          </div>
        )}
      </div>
    </div>
  );
}
