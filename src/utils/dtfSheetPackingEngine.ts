/**
 * DTF Discrete Sheet 2D Physical Packing Engine
 * 
 * Implements deterministic 2D rectangular bin packing for DTF production sheets.
 * Solves the production question:
 * "How many different logos/designs can I fit onto my DTF sheet, and how much of the sheet will I use?"
 * 
 * Guarantees:
 * 1. Physical 2D rectangular packing (no simplistic area division).
 * 2. Accounts for the actual physical rectangular dimensions of every design.
 * 3. Allows 90° rotation (W × H evaluated as H × W) when rotation improves fit.
 * 4. Respects cutting gap/spacing and edge margins.
 * 5. Deterministic placement across discrete sheets (Sheet 1, Sheet 2, ...).
 * 6. Explicit validation for oversized designs exceeding sheet capacity.
 * 7. 11" × 16" design on an 11" × 16" sheet requires exactly 1 sheet per piece (100% utilization).
 * 8. 5" × 7" design on an 11" × 16" sheet yields 4 prints per sheet (10 prints = 3 sheets).
 * 9. 4" × 4" design on an 11" × 16" sheet yields 8 prints per sheet (20 prints = 3 sheets).
 */

export interface SheetArtworkInput {
  id: string;
  designName: string;
  width: number;       // In working or normalized unit
  height: number;      // In working or normalized unit
  quantity: number;    // Copies requested
  notes?: string;
  color?: string;      // Visual color
}

export interface PlacedSheetTransfer {
  transferId: string;
  designId: string;
  designName: string;
  copyNumber: number;
  totalCopies: number;
  originalWidth: number;
  originalHeight: number;
  placedWidth: number;
  placedHeight: number;
  x: number;           // Position from left edge of sheet
  y: number;           // Position from top edge of sheet
  sheetIndex: number;  // 1-based index of sheet
  rotated: boolean;    // true if rotated 90°
  color: string;
  notes?: string;
}

export interface SingleSheetReport {
  sheetIndex: number;                  // 1-based
  placedTransfers: PlacedSheetTransfer[];
  totalTransfersOnSheet: number;
  usedArea: number;                    // Area of artwork on this sheet
  sheetArea: number;                   // sheetWidth * sheetHeight
  remainingArea: number;               // sheetArea - usedArea
  utilizationPercent: number;          // (usedArea / sheetArea) * 100
  allocatedCounts: { [designName: string]: number };
}

export interface SheetDesignQuantityReport {
  designId: string;
  designName: string;
  width: number;
  height: number;
  requestedQty: number;
  allocatedQty: number;
  remainingQty: number;
  areaPerPiece: number;
  totalDesignArea: number;
  isUnplaceable: boolean;
  unplaceableReason?: string;
  color: string;
  notes?: string;
}

export type DiscreteDesignInput = SheetArtworkInput;

export interface DTFSheetPackingResult {
  sheetWidth: number;
  sheetHeight: number;
  sheetArea: number;
  sheetsRequired: number;
  sheets: SingleSheetReport[];
  totalRequestedPieces: number;
  totalAllocatedPieces: number;
  totalUnplacedPieces: number;
  totalDesignArea: number;
  totalUsedArea: number;
  totalRemainingArea: number;
  overallUtilizationPercent: number;
  designReports: SheetDesignQuantityReport[];
  designBreakdown: SheetDesignQuantityReport[];
  unplaceableItems: string[];
  totalDesignAreaSqIn: number;
  totalSheetAreaSqIn: number;
}

export interface SheetPackingOptions {
  sheetWidth: number;      // Normalized unit (inches)
  sheetHeight: number;     // Normalized unit (inches)
  transferSpacing?: number;// Gap between designs (e.g. 0.25 or 0)
  edgeMargin?: number;     // Margin from sheet boundary (e.g. 0.25 or 0)
  allowRotation?: boolean; // Default true
  designName?: string;     // Optional name for single-design mode
}

export const EMPTY_PACKING_RESULT: DTFSheetPackingResult = {
  sheetWidth: 0,
  sheetHeight: 0,
  sheetArea: 0,
  sheetsRequired: 0,
  sheets: [],
  totalRequestedPieces: 0,
  totalAllocatedPieces: 0,
  totalUnplacedPieces: 0,
  totalDesignArea: 0,
  totalUsedArea: 0,
  totalRemainingArea: 0,
  overallUtilizationPercent: 0,
  designReports: [],
  designBreakdown: [],
  unplaceableItems: [],
  totalDesignAreaSqIn: 0,
  totalSheetAreaSqIn: 0,
};

export const DTF_PALETTE = [
  "#2563EB", // Royal Blue
  "#059669", // Emerald Green
  "#D97706", // Amber
  "#DB2777", // Pink / Magenta
  "#7C3AED", // Violet
  "#0891B2", // Cyan
  "#EA580C", // Orange
  "#0D9488", // Teal
  "#4F46E5", // Indigo
  "#65A30D", // Lime
  "#C026D3", // Fuchsia
  "#E11D48", // Rose
];

interface FreeRectangle {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ItemToPack {
  designId: string;
  designName: string;
  copyNumber: number;
  totalCopies: number;
  width: number;
  height: number;
  area: number;
  color: string;
  notes?: string;
}

/**
 * Checks if a single piece fits on an empty sheet given options.
 */
function pieceFitsOnSheet(w: number, h: number, sheetW: number, sheetH: number, allowRotation: boolean): boolean {
  if (w <= sheetW + 0.001 && h <= sheetH + 0.001) return true;
  if (allowRotation && h <= sheetW + 0.001 && w <= sheetH + 0.001) return true;
  return false;
}

/**
 * Calculates Single Design sheet allocation.
 * Returns how many pieces fit per sheet, sheets required, and overall utilization.
 * Explicitly satisfies key requirements:
 * - 11" × 16" on 11" × 16" sheet requires 1 sheet per piece (100% utilization).
 * - 5" × 7" on 11" × 16" sheet yields 4 prints per sheet (10 prints = 3 sheets).
 * - 4" × 4" on 11" × 16" sheet yields 8 prints per sheet (20 prints = 3 sheets).
 */
export function calculateSingleDesignPacking(
  designWidth: number,
  designHeight: number,
  quantity: number,
  options: SheetPackingOptions
): DTFSheetPackingResult {
  const sheetW = Math.max(0.1, options.sheetWidth);
  const sheetH = Math.max(0.1, options.sheetHeight);
  const rawSpacing = Math.max(0, options.transferSpacing ?? 0);
  const rawMargin = Math.max(0, options.edgeMargin ?? 0);
  const allowRotation = options.allowRotation ?? true;

  const sheetArea = sheetW * sheetH;
  const designArea = designWidth * designHeight;
  const qty = Math.max(0, Math.floor(quantity));

  const fits = pieceFitsOnSheet(designWidth, designHeight, sheetW, sheetH, allowRotation);

  if (!fits || designWidth <= 0 || designHeight <= 0 || qty === 0) {
    const reason = !fits
      ? `Dimensions (${designWidth}" × ${designHeight}") exceed sheet dimensions (${sheetW}" × ${sheetH}").`
      : "";
    const designReport: SheetDesignQuantityReport = {
      designId: "single-design-1",
      designName: options.designName?.trim() || "Print Design",
      width: designWidth,
      height: designHeight,
      requestedQty: qty,
      allocatedQty: 0,
      remainingQty: qty,
      areaPerPiece: designArea,
      totalDesignArea: designArea * qty,
      isUnplaceable: !fits,
      unplaceableReason: reason || undefined,
      color: DTF_PALETTE[0],
    };

    const emptySheetsCount = qty > 0 && !fits ? 0 : (qty > 0 ? 1 : 0);
    return {
      sheetWidth: sheetW,
      sheetHeight: sheetH,
      sheetArea,
      sheetsRequired: emptySheetsCount,
      sheets: [],
      totalRequestedPieces: qty,
      totalAllocatedPieces: 0,
      totalUnplacedPieces: qty,
      totalDesignArea: designArea * qty,
      totalUsedArea: 0,
      totalRemainingArea: 0,
      overallUtilizationPercent: 0,
      designReports: [designReport],
      designBreakdown: [designReport],
      unplaceableItems: !fits && qty > 0 ? [`${options.designName?.trim() || "Print Design"}: ${reason}`] : [],
      totalDesignAreaSqIn: designArea * qty,
      totalSheetAreaSqIn: emptySheetsCount * sheetArea,
    };
  }

  // Determine active margin and spacing:
  // If piece exactly equals sheet dimensions, full-bleed allows margin = 0
  const isFullBleed =
    (Math.abs(designWidth - sheetW) < 0.01 && Math.abs(designHeight - sheetH) < 0.01) ||
    (allowRotation && Math.abs(designHeight - sheetW) < 0.01 && Math.abs(designWidth - sheetH) < 0.01);

  const margin = isFullBleed ? 0 : rawMargin;
  const spacing = isFullBleed ? 0 : rawSpacing;

  const usableW = Math.max(0.01, sheetW - 2 * margin);
  const usableH = Math.max(0.01, sheetH - 2 * margin);

  // Evaluate Normal Orientation
  const colsNormal = Math.max(1, Math.floor((usableW + spacing + 0.001) / (designWidth + spacing)));
  const rowsNormal = Math.max(1, Math.floor((usableH + spacing + 0.001) / (designHeight + spacing)));
  const normalValid = designWidth <= usableW + 0.001 && designHeight <= usableH + 0.001;
  const yieldNormal = normalValid ? colsNormal * rowsNormal : 0;

  // Evaluate Rotated Orientation
  let yieldRotated = 0;
  let colsRotated = 0;
  let rowsRotated = 0;
  let rotatedValid = false;

  if (allowRotation && Math.abs(designWidth - designHeight) > 0.001) {
    colsRotated = Math.max(1, Math.floor((usableW + spacing + 0.001) / (designHeight + spacing)));
    rowsRotated = Math.max(1, Math.floor((usableH + spacing + 0.001) / (designWidth + spacing)));
    rotatedValid = designHeight <= usableW + 0.001 && designWidth <= usableH + 0.001;
    yieldRotated = rotatedValid ? colsRotated * rowsRotated : 0;
  }

  // Pick best orientation
  let bestRotated = false;
  let cols = colsNormal;
  let rows = rowsNormal;
  let printsPerSheet = Math.max(1, yieldNormal);

  if (yieldRotated > yieldNormal) {
    bestRotated = true;
    cols = colsRotated;
    rows = rowsRotated;
    printsPerSheet = yieldRotated;
  }

  const placedW = bestRotated ? designHeight : designWidth;
  const placedH = bestRotated ? designWidth : designHeight;

  // Total sheets required
  const sheetsRequired = Math.ceil(qty / printsPerSheet);

  const sheets: SingleSheetReport[] = [];
  let remainingToPlace = qty;
  let globalCopyIndex = 1;

  for (let s = 1; s <= sheetsRequired; s++) {
    const placedOnThisSheet: PlacedSheetTransfer[] = [];
    const countThisSheet = Math.min(remainingToPlace, printsPerSheet);

    let placedInRowCol = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (placedInRowCol >= countThisSheet) break;

        const x = margin + c * (placedW + spacing);
        const y = margin + r * (placedH + spacing);

        placedOnThisSheet.push({
          transferId: `single-design-1-${globalCopyIndex}`,
          designId: "single-design-1",
          designName: "Print Design",
          copyNumber: globalCopyIndex,
          totalCopies: qty,
          originalWidth: designWidth,
          originalHeight: designHeight,
          placedWidth: placedW,
          placedHeight: placedH,
          x,
          y,
          sheetIndex: s,
          rotated: bestRotated,
          color: DTF_PALETTE[0],
        });

        placedInRowCol++;
        globalCopyIndex++;
      }
      if (placedInRowCol >= countThisSheet) break;
    }

    remainingToPlace -= countThisSheet;
    const usedAreaThisSheet = countThisSheet * designArea;
    const remainingAreaThisSheet = Math.max(0, sheetArea - usedAreaThisSheet);
    const utilThisSheet = sheetArea > 0 ? (usedAreaThisSheet / sheetArea) * 100 : 0;

    sheets.push({
      sheetIndex: s,
      placedTransfers: placedOnThisSheet,
      totalTransfersOnSheet: countThisSheet,
      usedArea: usedAreaThisSheet,
      sheetArea,
      remainingArea: remainingAreaThisSheet,
      utilizationPercent: Math.min(100, utilThisSheet),
      allocatedCounts: { "Print Design": countThisSheet },
    });
  }

  const totalAllocatedPieces = qty;
  const totalUsedArea = qty * designArea;
  const totalSheetArea = sheetsRequired * sheetArea;
  const totalRemainingArea = Math.max(0, totalSheetArea - totalUsedArea);
  const overallUtilizationPercent =
    totalSheetArea > 0 ? (totalUsedArea / totalSheetArea) * 100 : 0;

  const designReport: SheetDesignQuantityReport = {
    designId: "single-design-1",
    designName: options.designName?.trim() || "Print Design",
    width: designWidth,
    height: designHeight,
    requestedQty: qty,
    allocatedQty: qty,
    remainingQty: 0,
    areaPerPiece: designArea,
    totalDesignArea: designArea * qty,
    isUnplaceable: false,
    color: DTF_PALETTE[0],
  };

  return {
    sheetWidth: sheetW,
    sheetHeight: sheetH,
    sheetArea,
    sheetsRequired,
    sheets,
    totalRequestedPieces: qty,
    totalAllocatedPieces,
    totalUnplacedPieces: 0,
    totalDesignArea: designArea * qty,
    totalUsedArea,
    totalRemainingArea,
    overallUtilizationPercent: Math.min(100, overallUtilizationPercent),
    designReports: [designReport],
    designBreakdown: [designReport],
    unplaceableItems: [],
    totalDesignAreaSqIn: designArea * qty,
    totalSheetAreaSqIn: totalSheetArea,
  };
}

/**
 * Packs multiple designs onto physical discrete sheets using deterministic 2D bin packing.
 */
export function calculateDTFSheetPacking(
  items: SheetArtworkInput[],
  options: SheetPackingOptions
): DTFSheetPackingResult {
  const sheetW = Math.max(0.1, options.sheetWidth);
  const sheetH = Math.max(0.1, options.sheetHeight);
  const rawSpacing = Math.max(0, options.transferSpacing ?? 0);
  const rawMargin = Math.max(0, options.edgeMargin ?? 0);
  const allowRotation = options.allowRotation ?? true;

  const sheetArea = sheetW * sheetH;

  // Filter valid items
  const validItems = items.filter(
    (item) => item.width > 0 && item.height > 0 && item.quantity > 0
  );

  // If there is strictly 1 single design in the job, delegate to optimal single-design packing!
  if (validItems.length === 1) {
    const single = validItems[0];
    const res = calculateSingleDesignPacking(single.width, single.height, single.quantity, options);
    // Overwrite name and color
    const customColor = single.color || DTF_PALETTE[0];
    res.designReports[0].designId = single.id;
    res.designReports[0].designName = single.designName;
    res.designReports[0].color = customColor;
    res.designReports[0].notes = single.notes;

    res.sheets.forEach((s) => {
      s.placedTransfers.forEach((t) => {
        t.designId = single.id;
        t.designName = single.designName;
        t.color = customColor;
        t.notes = single.notes;
      });
      s.allocatedCounts = { [single.designName]: s.totalTransfersOnSheet };
    });
    return res;
  }

  const designReports: SheetDesignQuantityReport[] = [];
  const unplaceableItems: string[] = [];
  const placeableItemsToPack: ItemToPack[] = [];

  let totalRequestedPieces = 0;

  validItems.forEach((item, idx) => {
    totalRequestedPieces += item.quantity;
    const color = item.color || DTF_PALETTE[idx % DTF_PALETTE.length];
    const fits = pieceFitsOnSheet(item.width, item.height, sheetW, sheetH, allowRotation);

    if (!fits) {
      const reason = `Dimensions (${item.width}" × ${item.height}") exceed sheet dimensions (${sheetW}" × ${sheetH}").`;
      unplaceableItems.push(`${item.designName}: ${reason}`);
      designReports.push({
        designId: item.id,
        designName: item.designName,
        width: item.width,
        height: item.height,
        requestedQty: item.quantity,
        allocatedQty: 0,
        remainingQty: item.quantity,
        areaPerPiece: item.width * item.height,
        totalDesignArea: 0,
        isUnplaceable: true,
        unplaceableReason: reason,
        color,
        notes: item.notes,
      });
    } else {
      designReports.push({
        designId: item.id,
        designName: item.designName,
        width: item.width,
        height: item.height,
        requestedQty: item.quantity,
        allocatedQty: 0,
        remainingQty: item.quantity,
        areaPerPiece: item.width * item.height,
        totalDesignArea: item.width * item.height * item.quantity,
        isUnplaceable: false,
        color,
        notes: item.notes,
      });

      for (let c = 1; c <= item.quantity; c++) {
        placeableItemsToPack.push({
          designId: item.id,
          designName: item.designName,
          copyNumber: c,
          totalCopies: item.quantity,
          width: item.width,
          height: item.height,
          area: item.width * item.height,
          color,
          notes: item.notes,
        });
      }
    }
  });

  // Sort items deterministically: largest area first, then largest max dimension, then by name
  placeableItemsToPack.sort((a, b) => {
    if (Math.abs(b.area - a.area) > 0.001) return b.area - a.area;
    const maxDimB = Math.max(b.width, b.height);
    const maxDimA = Math.max(a.width, a.height);
    if (Math.abs(maxDimB - maxDimA) > 0.001) return maxDimB - maxDimA;
    return a.designName.localeCompare(b.designName);
  });

  interface SheetState {
    sheetIndex: number;
    freeRects: FreeRectangle[];
    placedTransfers: PlacedSheetTransfer[];
    usedArea: number;
    allocatedCounts: { [designName: string]: number };
  }

  const sheets: SheetState[] = [];

  function createNewSheet(sheetIndex: number): SheetState {
    const usableW = Math.max(0.01, sheetW - 2 * rawMargin);
    const usableH = Math.max(0.01, sheetH - 2 * rawMargin);

    return {
      sheetIndex,
      freeRects: [{ x: rawMargin, y: rawMargin, w: usableW, h: usableH }],
      placedTransfers: [],
      usedArea: 0,
      allocatedCounts: {},
    };
  }

  function tryPlaceOnSheet(
    sheet: SheetState,
    item: ItemToPack,
    spacing: number
  ): boolean {
    let bestRectIdx = -1;
    let bestRotated = false;
    let bestShortSideFit = Infinity;
    let bestAreaFit = Infinity;

    // Evaluate orientations
    const orientations: { w: number; h: number; rotated: boolean }[] = [
      { w: item.width, h: item.height, rotated: false },
    ];
    if (allowRotation && Math.abs(item.width - item.height) > 0.01) {
      orientations.push({ w: item.height, h: item.width, rotated: true });
    }

    for (let i = 0; i < sheet.freeRects.length; i++) {
      const rect = sheet.freeRects[i];
      for (const ori of orientations) {
        const reqW = ori.w;
        const reqH = ori.h;

        if (rect.w >= reqW - 0.001 && rect.h >= reqH - 0.001) {
          const leftoverW = rect.w - reqW;
          const leftoverH = rect.h - reqH;
          const shortSideFit = Math.min(leftoverW, leftoverH);
          const areaFit = rect.w * rect.h - reqW * reqH;

          if (shortSideFit < bestShortSideFit || (Math.abs(shortSideFit - bestShortSideFit) < 0.001 && areaFit < bestAreaFit)) {
            bestShortSideFit = shortSideFit;
            bestAreaFit = areaFit;
            bestRectIdx = i;
            bestRotated = ori.rotated;
          }
        }
      }
    }

    if (bestRectIdx === -1) return false;

    const targetRect = sheet.freeRects[bestRectIdx];
    const placedW = bestRotated ? item.height : item.width;
    const placedH = bestRotated ? item.width : item.height;
    const posX = targetRect.x;
    const posY = targetRect.y;

    sheet.placedTransfers.push({
      transferId: `${item.designId}-${item.copyNumber}`,
      designId: item.designId,
      designName: item.designName,
      copyNumber: item.copyNumber,
      totalCopies: item.totalCopies,
      originalWidth: item.width,
      originalHeight: item.height,
      placedWidth: placedW,
      placedHeight: placedH,
      x: posX,
      y: posY,
      sheetIndex: sheet.sheetIndex,
      rotated: bestRotated,
      color: item.color,
      notes: item.notes,
    });

    sheet.usedArea += item.area;
    sheet.allocatedCounts[item.designName] = (sheet.allocatedCounts[item.designName] || 0) + 1;

    // Guillotine split
    const effectiveOccupiedW = placedW + spacing;
    const effectiveOccupiedH = placedH + spacing;

    sheet.freeRects.splice(bestRectIdx, 1);

    const rightW = targetRect.w - effectiveOccupiedW;
    const bottomH = targetRect.h - effectiveOccupiedH;

    if (rightW > 0.05 && bottomH > 0.05) {
      if (rightW > bottomH) {
        sheet.freeRects.push({
          x: targetRect.x + effectiveOccupiedW,
          y: targetRect.y,
          w: rightW,
          h: targetRect.h,
        });
        sheet.freeRects.push({
          x: targetRect.x,
          y: targetRect.y + effectiveOccupiedH,
          w: effectiveOccupiedW,
          h: bottomH,
        });
      } else {
        sheet.freeRects.push({
          x: targetRect.x,
          y: targetRect.y + effectiveOccupiedH,
          w: targetRect.w,
          h: bottomH,
        });
        sheet.freeRects.push({
          x: targetRect.x + effectiveOccupiedW,
          y: targetRect.y,
          w: rightW,
          h: effectiveOccupiedH,
        });
      }
    } else if (rightW > 0.05) {
      sheet.freeRects.push({
        x: targetRect.x + effectiveOccupiedW,
        y: targetRect.y,
        w: rightW,
        h: targetRect.h,
      });
    } else if (bottomH > 0.05) {
      sheet.freeRects.push({
        x: targetRect.x,
        y: targetRect.y + effectiveOccupiedH,
        w: targetRect.w,
        h: bottomH,
      });
    }

    return true;
  }

  for (const item of placeableItemsToPack) {
    let placed = false;

    for (const sheet of sheets) {
      if (tryPlaceOnSheet(sheet, item, rawSpacing)) {
        placed = true;
        break;
      }
    }

    if (!placed) {
      const newSheet = createNewSheet(sheets.length + 1);
      const placedOnNew = tryPlaceOnSheet(newSheet, item, rawSpacing);
      if (placedOnNew) {
        sheets.push(newSheet);
        placed = true;
      } else {
        // Fallback for full-bleed on fresh sheet
        newSheet.freeRects = [{ x: 0, y: 0, w: sheetW, h: sheetH }];
        if (tryPlaceOnSheet(newSheet, item, 0)) {
          sheets.push(newSheet);
          placed = true;
        }
      }
    }

    if (placed) {
      const rep = designReports.find((r) => r.designId === item.designId);
      if (rep) {
        rep.allocatedQty += 1;
        rep.remainingQty = Math.max(0, rep.requestedQty - rep.allocatedQty);
      }
    }
  }

  if (sheets.length === 0) {
    sheets.push(createNewSheet(1));
  }

  const finalSheetReports: SingleSheetReport[] = sheets.map((s) => {
    const used = s.usedArea;
    const remaining = Math.max(0, sheetArea - used);
    const util = sheetArea > 0 ? (used / sheetArea) * 100 : 0;
    return {
      sheetIndex: s.sheetIndex,
      placedTransfers: s.placedTransfers,
      totalTransfersOnSheet: s.placedTransfers.length,
      usedArea: used,
      sheetArea,
      remainingArea: remaining,
      utilizationPercent: Math.min(100, util),
      allocatedCounts: s.allocatedCounts,
    };
  });

  const totalAllocatedPieces = finalSheetReports.reduce(
    (acc, s) => acc + s.totalTransfersOnSheet,
    0
  );
  const totalUsedArea = finalSheetReports.reduce((acc, s) => acc + s.usedArea, 0);
  const totalSheetArea = sheets.length * sheetArea;
  const totalRemainingArea = Math.max(0, totalSheetArea - totalUsedArea);
  const overallUtilizationPercent =
    totalSheetArea > 0 ? (totalUsedArea / totalSheetArea) * 100 : 0;

  const totalDesignArea = designReports
    .filter((d) => !d.isUnplaceable)
    .reduce((acc, d) => acc + d.totalDesignArea, 0);

  return {
    sheetWidth: sheetW,
    sheetHeight: sheetH,
    sheetArea,
    sheetsRequired: sheets.length,
    sheets: finalSheetReports,
    totalRequestedPieces,
    totalAllocatedPieces,
    totalUnplacedPieces: Math.max(0, totalRequestedPieces - totalAllocatedPieces),
    totalDesignArea,
    totalUsedArea,
    totalRemainingArea,
    overallUtilizationPercent: Math.min(100, overallUtilizationPercent),
    designReports,
    designBreakdown: designReports,
    unplaceableItems,
    totalDesignAreaSqIn: totalDesignArea,
    totalSheetAreaSqIn: totalSheetArea,
  };
}
