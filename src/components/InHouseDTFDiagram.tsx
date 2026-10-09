import React, { useState } from "react";
import { 
  RotateCw, 
  Layers, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Info,
  CheckCircle2,
  AlertCircle,
  Scissors
} from "lucide-react";
import { PlacedTransfer, DesignQuantityReport } from "../utils/dtfPackingEngine";

interface InHouseDTFDiagramProps {
  sheetWidth: number;
  requiredSheetLength: number;
  placedTransfers: PlacedTransfer[];
  edgeMargin: number;
  transferSpacing: number;
  designReports: DesignQuantityReport[];
  totalSquareFootage: number;
  utilizationPercent: number;
}

export default function InHouseDTFDiagram({
  sheetWidth,
  requiredSheetLength,
  placedTransfers,
  edgeMargin,
  transferSpacing,
  designReports,
  totalSquareFootage,
  utilizationPercent,
}: InHouseDTFDiagramProps) {
  const [hoveredTransfer, setHoveredTransfer] = useState<PlacedTransfer | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  if (placedTransfers.length === 0 || requiredSheetLength <= 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
        <Layers className="w-10 h-10 text-slate-600 mx-auto" />
        <h4 className="text-sm font-bold text-slate-200">No Physical Gang Sheet Layout Yet</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Add artwork designs and quantities above to dynamically calculate and visualize the exact 2D gang-sheet arrangement on your {sheetWidth}&quot; roll.
        </p>
      </div>
    );
  }

  // Count items on sheet per design
  const itemsCountByDesign: Record<string, number> = {};
  placedTransfers.forEach(t => {
    itemsCountByDesign[t.designId] = (itemsCountByDesign[t.designId] || 0) + 1;
  });

  const usableWidth = Math.max(0, sheetWidth - (2 * edgeMargin));
  const usableLength = Math.max(0, requiredSheetLength - (2 * edgeMargin));

  // Zoom control handlers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(2.5, prev + 0.25));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.6, prev - 0.25));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 md:p-6 text-left space-y-5 shadow-2xl overflow-hidden">
      
      {/* Header with Dimensions, Specs and Zoom */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 rounded-full">
              Physical 2D Gang Sheet
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Dynamic Roll View
            </span>
          </div>
          <div className="flex items-baseline gap-3 mt-1.5 flex-wrap">
            <h3 className="text-lg font-black text-white tracking-tight">
              {sheetWidth}&quot; × {requiredSheetLength.toFixed(2)}&quot; Roll
            </h3>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-md">
              {totalSquareFootage.toFixed(2)} sq. ft.
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {utilizationPercent.toFixed(1)}% sheet utilization
            </span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.6}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-bold text-slate-300 px-2 min-w-[42px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2.5}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Reset Zoom (100%)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Production Guidelines Bar */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800 gap-y-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
            <span>Allocated: <strong className="text-white font-bold">{placedTransfers.length} transfers</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Scissors className="w-3 h-3 text-slate-400" />
            <span>Cutting Gap: <strong className="text-white font-bold">{transferSpacing}&quot;</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-rose-400/80 inline-block"></span>
            <span>Edge Margin: <strong className="text-white font-bold">{edgeMargin}&quot;</strong> (all sides)</span>
          </div>
        </div>
        <div className="text-slate-400 font-mono">
          Usable Area: {usableWidth.toFixed(2)}&quot; × {usableLength.toFixed(2)}&quot;
        </div>
      </div>

      {/* Visual Canvas Container with Scroll and Zoom */}
      <div className="relative border border-slate-800 rounded-2xl bg-slate-900/50 p-3 overflow-auto max-h-[380px] lg:max-h-[420px] flex justify-center custom-scrollbar">
        <div 
          style={{ 
            width: `${Math.max(240, Math.min(480, sheetWidth * 16)) * zoomLevel}px`,
            transition: "width 0.15s ease-out" 
          }}
          className="relative select-none"
        >
          {/* Dynamic SVG Canvas */}
          <svg
            viewBox={`0 0 ${sheetWidth} ${requiredSheetLength}`}
            className="w-full h-auto drop-shadow-2xl overflow-visible"
            style={{ display: "block" }}
          >
            <defs>
              {/* Hatch pattern for non-printable edge waste margin */}
              <pattern
                id="inhouse-margin-hatch"
                width="1"
                height="1"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                  stroke="#ef4444"
                  strokeWidth="0.08"
                  strokeOpacity="0.25"
                />
              </pattern>

              {/* Subtle grid pattern for precision preview */}
              <pattern
                id="inhouse-inch-grid"
                width="2"
                height="2"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 2 0 L 0 0 0 2"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="0.03"
                  strokeOpacity="0.4"
                />
              </pattern>
            </defs>

            {/* 1. Sheet Background Canvas */}
            <rect
              x={0}
              y={0}
              width={sheetWidth}
              height={requiredSheetLength}
              fill="#090d16"
              stroke="#475569"
              strokeWidth="0.15"
              rx="0.2"
            />

            {/* 2. Grid lines overlay */}
            <rect
              x={0}
              y={0}
              width={sheetWidth}
              height={requiredSheetLength}
              fill="url(#inhouse-inch-grid)"
            />

            {/* 3. Non-Printable Margin Boundary (outer margin zone) */}
            <rect
              x={0}
              y={0}
              width={sheetWidth}
              height={requiredSheetLength}
              fill="url(#inhouse-margin-hatch)"
              pointerEvents="none"
            />

            {/* 4. Usable Printable Inner Canvas */}
            <rect
              x={edgeMargin}
              y={edgeMargin}
              width={usableWidth}
              height={usableLength}
              fill="#0f172a"
              stroke="#ef4444"
              strokeWidth="0.06"
              strokeDasharray="0.3 0.2"
              strokeOpacity="0.7"
              pointerEvents="none"
            />

            {/* 5. Individual Placed Transfers (each as discrete physical rectangle) */}
            {placedTransfers.map((transfer) => {
              const isHovered = hoveredTransfer?.transferId === transfer.transferId;
              const shortLabel = transfer.designName.length > 10 
                ? `${transfer.designName.slice(0, 9)}…` 
                : transfer.designName;

              return (
                <g
                  key={transfer.transferId}
                  onMouseEnter={() => setHoveredTransfer(transfer)}
                  onMouseLeave={() => setHoveredTransfer(null)}
                  className="cursor-pointer transition-all duration-150"
                >
                  {/* Transfer Outer Bounding Box */}
                  <rect
                    x={transfer.x}
                    y={transfer.y}
                    width={transfer.placedWidth}
                    height={transfer.placedHeight}
                    fill={transfer.color}
                    fillOpacity={isHovered ? 0.35 : 0.2}
                    stroke={isHovered ? "#ffffff" : transfer.color}
                    strokeWidth={isHovered ? 0.14 : 0.08}
                    rx="0.12"
                  />

                  {/* Corner cutting guides / cut border */}
                  <rect
                    x={transfer.x}
                    y={transfer.y}
                    width={transfer.placedWidth}
                    height={transfer.placedHeight}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="0.03"
                    strokeDasharray="0.2 0.2"
                    strokeOpacity="0.4"
                    rx="0.12"
                  />

                  {/* Transfer Labels & Badges */}
                  {transfer.placedWidth >= 2.2 && transfer.placedHeight >= 1.5 ? (
                    <g pointerEvents="none">
                      {/* Design Title & Copy Number (e.g., Logo A #1) */}
                      <text
                        x={transfer.x + transfer.placedWidth / 2}
                        y={transfer.y + transfer.placedHeight / 2 - (transfer.placedHeight > 3 ? 0.3 : 0)}
                        fill="#ffffff"
                        fontSize={Math.min(0.9, Math.max(0.42, transfer.placedWidth * 0.12))}
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontFamily="system-ui, sans-serif"
                      >
                        {shortLabel} #{transfer.copyNumber}
                      </text>

                      {/* Physical Dimensions */}
                      <text
                        x={transfer.x + transfer.placedWidth / 2}
                        y={transfer.y + transfer.placedHeight / 2 + (transfer.placedHeight > 3 ? 0.45 : 0.35)}
                        fill="#94a3b8"
                        fontSize={Math.min(0.65, Math.max(0.32, transfer.placedWidth * 0.09))}
                        fontWeight="600"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontFamily="monospace"
                      >
                        {transfer.originalWidth}&quot; × {transfer.originalHeight}&quot;
                      </text>

                      {/* 90° Rotation Indicator Badge */}
                      {transfer.rotated && transfer.placedWidth >= 3 && transfer.placedHeight >= 2.5 && (
                        <g transform={`translate(${transfer.x + 0.3}, ${transfer.y + 0.3})`}>
                          <rect
                            x="0"
                            y="0"
                            width="1.3"
                            height="0.65"
                            rx="0.15"
                            fill="#0f172a"
                            fillOpacity="0.9"
                            stroke="#f59e0b"
                            strokeWidth="0.04"
                          />
                          <text
                            x="0.65"
                            y="0.35"
                            fill="#f59e0b"
                            fontSize="0.28"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="central"
                          >
                            90° ROT
                          </text>
                        </g>
                      )}
                    </g>
                  ) : (
                    // Small thumbnail fallback badge for compact items
                    <text
                      x={transfer.x + transfer.placedWidth / 2}
                      y={transfer.y + transfer.placedHeight / 2}
                      fill="#ffffff"
                      fontSize={Math.min(0.6, Math.max(0.28, transfer.placedWidth * 0.22))}
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                      pointerEvents="none"
                    >
                      #{transfer.copyNumber}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Scale & Dimension indicators along edges */}
            <g pointerEvents="none" opacity="0.6">
              {/* Sheet width ruler at top */}
              <line x1={0} y1={-0.4} x2={sheetWidth} y2={-0.4} stroke="#94a3b8" strokeWidth="0.06" />
              <line x1={0} y1={-0.7} x2={0} y2={-0.1} stroke="#94a3b8" strokeWidth="0.06" />
              <line x1={sheetWidth} y1={-0.7} x2={sheetWidth} y2={-0.1} stroke="#94a3b8" strokeWidth="0.06" />
              <text
                x={sheetWidth / 2}
                y={-0.6}
                fill="#cbd5e1"
                fontSize="0.5"
                fontWeight="bold"
                textAnchor="middle"
              >
                {sheetWidth}&quot; Width
              </text>
            </g>
          </svg>
        </div>

        {/* Hover Inspector Card Overlay */}
        {hoveredTransfer && (
          <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 pointer-events-none z-30 max-w-[240px] animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: hoveredTransfer.color }}
                />
                <span className="font-bold text-white truncate max-w-[130px]">
                  {hoveredTransfer.designName}
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">
                Copy #{hoveredTransfer.copyNumber} of {hoveredTransfer.totalCopies}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-0.5 text-slate-300">
              <div>
                <span className="text-slate-500 block text-[9px]">Original:</span>
                <span className="font-mono">{hoveredTransfer.originalWidth}&quot; × {hoveredTransfer.originalHeight}&quot;</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">Placed Size:</span>
                <span className="font-mono">{hoveredTransfer.placedWidth}&quot; × {hoveredTransfer.placedHeight}&quot;</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">Position (X, Y):</span>
                <span className="font-mono">{hoveredTransfer.x}&quot;, {hoveredTransfer.y}&quot;</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">Orientation:</span>
                <span className={hoveredTransfer.rotated ? "text-amber-400 font-bold" : "text-slate-400"}>
                  {hoveredTransfer.rotated ? "Rotated 90°" : "Standard"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Color Legend & Allocation Breakdown */}
      <div className="pt-2 border-t border-slate-800/80">
        <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
          <span>Artwork Allocation Breakdown</span>
          <span className="text-[10px] text-slate-500 font-normal">
            Hover over any piece in the diagram to inspect exact coordinates
          </span>
        </h5>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {designReports.map((design) => {
            const placedCount = itemsCountByDesign[design.designId] || 0;
            const isFullyAllocated = placedCount === design.requestedQty && design.requestedQty > 0;

            return (
              <div 
                key={design.designId}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span 
                    className="w-3.5 h-3.5 rounded-md shrink-0 shadow-xs" 
                    style={{ backgroundColor: design.color }}
                  />
                  <div className="truncate">
                    <p className="font-bold text-white truncate text-xs">
                      {design.designName}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {design.width}&quot; × {design.height}&quot;
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="font-mono font-bold text-white text-xs">
                      {placedCount}
                    </span>
                    <span className="text-slate-500">/</span>
                    <span className="font-mono text-slate-400 text-xs">
                      {design.requestedQty}
                    </span>
                    {isFullyAllocated ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : design.isUnplaceable ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    ) : null}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {isFullyAllocated ? "100% placed" : `${design.remainingQty} unplaced`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
