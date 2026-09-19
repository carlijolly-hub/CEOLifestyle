/**
 * DTF Gang Sheet 2D Physical Packing Engine
 * 
 * Implements a true 2D rectangle strip packing algorithm with multi-heuristic
 * extreme-point optimization specifically designed for Direct-to-Film (DTF)
 * roll production.
 * 
 * Guarantees:
 * 1. Physical 2D arrangement (no simplistic area division).
 * 2. Sheet Width is a fixed input; Sheet Length is calculated dynamically.
 * 3. Never distorts, stretches, scales, or alters artwork dimensions.
 * 4. Allows 90° rotation where beneficial and enabled.
 * 5. Respects cutting gap/spacing between individual adjacent pieces.
 * 6. Respects non-printable edge/waste margins on all sides.
 * 7. Minimizes required roll length to minimize material usage and cost.
 * 8. Every single transfer exists as its own discrete physical rectangle.
 */

export interface ArtworkInputItem {
  id: string;
  designName: string;
  width: number;       // inches
  height: number;      // inches
  quantity: number;    // copies
  notes?: string;
  color?: string;      // Visual identifier color
}

export interface PlacedTransfer {
  transferId: string;
  designId: string;
  designName: string;
  copyNumber: number;
  totalCopies: number;
  originalWidth: number;
  originalHeight: number;
  placedWidth: number;
  placedHeight: number;
  x: number;           // inches from left of sheet
  y: number;           // inches from top of sheet
  rotated: boolean;    // true if rotated 90 degrees
  color: string;
  notes?: string;
}

export interface DesignQuantityReport {
  designId: string;
  designName: string;
  width: number;
  height: number;
  requestedQty: number;
  allocatedQty: number;
  remainingQty: number;
  areaPerTransferSqIn: number;
  totalAreaSqIn: number;
  isUnplaceable: boolean;
  unplaceableReason?: string;
  color: string;
}

export interface ContinuousPackingOptions {
  sheetWidth: number;      // inches (fixed user input, e.g. 22)
  transferSpacing: number; // inches between items (e.g. 0.25)
  edgeMargin: number;      // inches from sheet boundary (e.g. 0.25)
  allowRotation: boolean;  // allow 90 degree rotation (default true)
}

export interface ContinuousGangSheetResult {
  sheetWidth: number;
  requiredSheetLength: number;
  requiredMaterialLabel: string; // e.g. "22\" × 58.50\""
  totalSquareFootage: number;
  totalArtworkAreaSqIn: number;
  totalArtworkAreaSqFt: number;
  totalMaterialAreaSqIn: number;
  totalMaterialAreaSqFt: number;
  wasteAreaSqIn: number;
  wasteAreaSqFt: number;
  utilizationPercent: number;
  placedTransfers: PlacedTransfer[];
  totalDesigns: number;
  totalRequestedTransfers: number;
  totalAllocatedTransfers: number;
  totalRemainingTransfers: number;
  designReports: DesignQuantityReport[];
  unplaceableItems: string[];
}

export const ARTWORK_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#14B8A6", // Teal
  "#6366F1", // Indigo
  "#84CC16", // Lime
  "#D946EF", // Fuchsia
  "#E11D48", // Rose
];

interface RawItemToPack {
  designId: string;
  designName: string;
  copyNumber: number;
  totalCopies: number;
  width: number;
  height: number;
  color: string;
  notes?: string;
}

/**
 * Executes a true 2D continuous strip gang-sheet packing optimization
 * on a fixed roll width, minimizing the required sheet length.
 */
export function calculateContinuousDTFGangSheet(
  artworkItems: ArtworkInputItem[],
  options: ContinuousPackingOptions
): ContinuousGangSheetResult {
  const { sheetWidth, transferSpacing, edgeMargin, allowRotation } = options;

  const usableWidth = sheetWidth - (2 * edgeMargin);

  // Initialize design reports & validation
  const designReports: DesignQuantityReport[] = artworkItems.map((item, idx) => {
    const areaPerTransfer = item.width * item.height;
    const color = item.color || ARTWORK_COLORS[idx % ARTWORK_COLORS.length];
    const qty = Math.max(0, Math.floor(item.quantity || 0));

    // Check if this item can physically fit across the roll's usable width
    const fitsNormal = item.width <= usableWidth + 0.001;
    const fitsRotated = allowRotation && (item.height <= usableWidth + 0.001);
    const isUnplaceable = !fitsNormal && !fitsRotated;

    let unplaceableReason: string | undefined;
    if (isUnplaceable) {
      if (item.width <= 0 || item.height <= 0) {
        unplaceableReason = "Dimensions must be greater than 0 inches.";
      } else if (usableWidth <= 0) {
        unplaceableReason = `Sheet width (${sheetWidth}") with ${edgeMargin}" margins leaves no usable printing width.`;
      } else if (allowRotation) {
        unplaceableReason = `Artwork width (${item.width}") and height (${item.height}") both exceed usable roll width (${usableWidth.toFixed(2)}").`;
      } else {
        unplaceableReason = `Artwork width (${item.width}") exceeds usable roll width (${usableWidth.toFixed(2)}"). (Rotation disabled)`;
      }
    }

    return {
      designId: item.id,
      designName: item.designName || `Design #${idx + 1}`,
      width: item.width,
      height: item.height,
      requestedQty: qty,
      allocatedQty: 0,
      remainingQty: qty,
      areaPerTransferSqIn: areaPerTransfer,
      totalAreaSqIn: areaPerTransfer * qty,
      isUnplaceable,
      unplaceableReason,
      color,
    };
  });

  const unplaceableItems = designReports
    .filter(d => d.isUnplaceable && d.requestedQty > 0)
    .map(d => `${d.designName}: ${d.unplaceableReason}`);

  // Expand all placeable artwork items into discrete individual physical units
  const unitsToPlace: RawItemToPack[] = [];
  artworkItems.forEach(item => {
    const report = designReports.find(d => d.designId === item.id);
    if (!report || report.isUnplaceable) return;

    const qty = report.requestedQty;
    for (let c = 1; c <= qty; c++) {
      unitsToPlace.push({
        designId: item.id,
        designName: report.designName,
        copyNumber: c,
        totalCopies: qty,
        width: item.width,
        height: item.height,
        color: report.color,
        notes: item.notes,
      });
    }
  });

  const totalRequestedTransfers = designReports.reduce((sum, d) => sum + d.requestedQty, 0);

  // If no items to place or invalid usable width
  if (usableWidth <= 0 || unitsToPlace.length === 0) {
    return {
      sheetWidth,
      requiredSheetLength: 0,
      requiredMaterialLabel: `${sheetWidth}" × 0.00"`,
      totalSquareFootage: 0,
      totalArtworkAreaSqIn: 0,
      totalArtworkAreaSqFt: 0,
      totalMaterialAreaSqIn: 0,
      totalMaterialAreaSqFt: 0,
      wasteAreaSqIn: 0,
      wasteAreaSqFt: 0,
      utilizationPercent: 0,
      placedTransfers: [],
      totalDesigns: artworkItems.length,
      totalRequestedTransfers,
      totalAllocatedTransfers: 0,
      totalRemainingTransfers: totalRequestedTransfers,
      designReports,
      unplaceableItems,
    };
  }

  // --- MULTI-HEURISTIC EXTREME-POINT STRIP PACKING ---
  // To find the absolute minimum sheet length, we evaluate multiple distinct sort orderings
  const candidateOrderings: RawItemToPack[][] = [];

  // Order 1: Max dimension descending, then area descending
  candidateOrderings.push(
    [...unitsToPlace].sort((a, b) => {
      const maxA = Math.max(a.width, a.height);
      const maxB = Math.max(b.width, b.height);
      if (maxB !== maxA) return maxB - maxA;
      return (b.width * b.height) - (a.width * a.height);
    })
  );

  // Order 2: Height descending, then width descending
  candidateOrderings.push(
    [...unitsToPlace].sort((a, b) => {
      if (b.height !== a.height) return b.height - a.height;
      return b.width - a.width;
    })
  );

  // Order 3: Width descending, then height descending
  candidateOrderings.push(
    [...unitsToPlace].sort((a, b) => {
      if (b.width !== a.width) return b.width - a.width;
      return b.height - a.height;
    })
  );

  // Order 4: Area descending, then perimeter descending
  candidateOrderings.push(
    [...unitsToPlace].sort((a, b) => {
      const areaA = a.width * a.height;
      const areaB = b.width * b.height;
      if (areaB !== areaA) return areaB - areaA;
      return (b.width + b.height) - (a.width + a.height);
    })
  );

  // Order 5: Grouped by design: largest design (by total area) first
  candidateOrderings.push(
    [...unitsToPlace].sort((a, b) => {
      if (a.designId !== b.designId) {
        const areaA = a.width * a.height * a.totalCopies;
        const areaB = b.width * b.height * b.totalCopies;
        if (areaB !== areaA) return areaB - areaA;
        return a.designId.localeCompare(b.designId);
      }
      return a.copyNumber - b.copyNumber;
    })
  );

  // Order 6: Grouped by design: widest design first
  candidateOrderings.push(
    [...unitsToPlace].sort((a, b) => {
      if (a.designId !== b.designId) {
        const maxA = Math.max(a.width, a.height);
        const maxB = Math.max(b.width, b.height);
        if (maxB !== maxA) return maxB - maxA;
        return a.designId.localeCompare(b.designId);
      }
      return a.copyNumber - b.copyNumber;
    })
  );

  // Order 7: Aspect ratio descending (long narrow pieces first, or square pieces)
  candidateOrderings.push(
    [...unitsToPlace].sort((a, b) => {
      const ratioA = Math.max(a.width / a.height, a.height / a.width);
      const ratioB = Math.max(b.width / b.height, b.height / b.width);
      if (ratioB !== ratioA) return ratioB - ratioA;
      return (b.width * b.height) - (a.width * a.height);
    })
  );

  // Function to simulate strip packing for a given order of items
  function packOrdering(items: RawItemToPack[]): PlacedTransfer[] {
    const placed: PlacedTransfer[] = [];
    let currentMaxY = edgeMargin;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let bestPlacement: {
        x: number;
        y: number;
        w: number;
        h: number;
        rotated: boolean;
        score: number;
      } | null = null;

      // Candidate X coordinates: edgeMargin or right side of any placed item + transferSpacing
      const candXs = new Set<number>();
      candXs.add(edgeMargin);
      for (const p of placed) {
        const xPos = p.x + p.placedWidth + transferSpacing;
        candXs.add(Math.round(xPos * 1000) / 1000);
      }

      // Candidate Y coordinates: edgeMargin, bottom of any placed item + transferSpacing, or top of any placed item
      const candYs = new Set<number>();
      candYs.add(edgeMargin);
      for (const p of placed) {
        const yPosBottom = p.y + p.placedHeight + transferSpacing;
        candYs.add(Math.round(yPosBottom * 1000) / 1000);
        candYs.add(Math.round(p.y * 1000) / 1000);
      }

      const sortedXs = Array.from(candXs).sort((a, b) => a - b);
      const sortedYs = Array.from(candYs).sort((a, b) => a - b);

      // Orientations to test
      const orientations: { w: number; h: number; rotated: boolean }[] = [];
      // 1. Normal orientation
      if (item.width <= usableWidth + 0.001) {
        orientations.push({ w: item.width, h: item.height, rotated: false });
      }
      // 2. Rotated 90 degrees
      if (allowRotation && item.height <= usableWidth + 0.001 && item.width !== item.height) {
        orientations.push({ w: item.height, h: item.width, rotated: true });
      }

      for (const orient of orientations) {
        for (const y of sortedYs) {
          for (const x of sortedXs) {
            // Check boundary bounds
            if (x < edgeMargin - 0.001 || x + orient.w > sheetWidth - edgeMargin + 0.001) {
              continue;
            }

            // Check collision with all placed items
            let collision = false;
            for (const p of placed) {
              // Two rectangles with spacing collision condition
              const noOverlap =
                x + orient.w + transferSpacing <= p.x + 0.001 ||
                p.x + p.placedWidth + transferSpacing <= x + 0.001 ||
                y + orient.h + transferSpacing <= p.y + 0.001 ||
                p.y + p.placedHeight + transferSpacing <= y + 0.001;

              if (!noOverlap) {
                collision = true;
                break;
              }
            }

            if (!collision) {
              // Calculate placement score
              const resultingMaxY = Math.max(currentMaxY, y + orient.h);

              // Calculate contact with borders & adjacent pieces to maximize packing compactness
              let contactScore = 0;
              if (Math.abs(x - edgeMargin) < 0.01) contactScore += orient.h;
              if (Math.abs(x + orient.w - (sheetWidth - edgeMargin)) < 0.01) contactScore += orient.h;
              if (Math.abs(y - edgeMargin) < 0.01) contactScore += orient.w;

              for (const p of placed) {
                // Touching horizontally
                if (Math.abs(p.x + p.placedWidth + transferSpacing - x) < 0.01 ||
                    Math.abs(x + orient.w + transferSpacing - p.x) < 0.01) {
                  const overlapY = Math.min(y + orient.h, p.y + p.placedHeight) - Math.max(y, p.y);
                  if (overlapY > 0) contactScore += overlapY;
                }
                // Touching vertically
                if (Math.abs(p.y + p.placedHeight + transferSpacing - y) < 0.01 ||
                    Math.abs(y + orient.h + transferSpacing - p.y) < 0.01) {
                  const overlapX = Math.min(x + orient.w, p.x + p.placedWidth) - Math.max(x, p.x);
                  if (overlapX > 0) contactScore += overlapX;
                }
              }

              // Primary: minimize resulting roll length
              // Secondary: minimize vertical position y
              // Tertiary: minimize horizontal position x (pack left to right)
              // Quaternary: maximize contact with existing items/borders
              const score = (resultingMaxY * 100000) + (y * 100) + (x * 1) - (contactScore * 0.5);

              if (!bestPlacement || score < bestPlacement.score) {
                bestPlacement = {
                  x,
                  y,
                  w: orient.w,
                  h: orient.h,
                  rotated: orient.rotated,
                  score,
                };
              }
            }
          }
        }
      }

      if (bestPlacement) {
        placed.push({
          transferId: `${item.designId}-c${item.copyNumber}`,
          designId: item.designId,
          designName: item.designName,
          copyNumber: item.copyNumber,
          totalCopies: item.totalCopies,
          originalWidth: item.width,
          originalHeight: item.height,
          placedWidth: bestPlacement.w,
          placedHeight: bestPlacement.h,
          x: Math.round(bestPlacement.x * 100) / 100,
          y: Math.round(bestPlacement.y * 100) / 100,
          rotated: bestPlacement.rotated,
          color: item.color,
          notes: item.notes,
        });
        currentMaxY = Math.max(currentMaxY, bestPlacement.y + bestPlacement.h);
      }
    }

    return placed;
  }

  // Run all candidate heuristics and choose the one with the minimal required sheet length
  let bestPacking: PlacedTransfer[] = [];
  let minLength = Infinity;

  for (const ordering of candidateOrderings) {
    const result = packOrdering(ordering);
    if (result.length === unitsToPlace.length) {
      const maxY = result.reduce((max, t) => Math.max(max, t.y + t.placedHeight), 0);
      const totalLen = maxY + edgeMargin;
      if (totalLen < minLength) {
        minLength = totalLen;
        bestPacking = result;
      }
    }
  }

  // Fallback to first ordering if none completed (safety)
  if (bestPacking.length === 0 && candidateOrderings.length > 0) {
    bestPacking = packOrdering(candidateOrderings[0]);
  }

  // Update design reports with allocated counts
  bestPacking.forEach(t => {
    const report = designReports.find(d => d.designId === t.designId);
    if (report) {
      report.allocatedQty += 1;
      report.remainingQty = Math.max(0, report.requestedQty - report.allocatedQty);
    }
  });

  const totalAllocatedTransfers = bestPacking.length;
  const totalRemainingTransfers = totalRequestedTransfers - totalAllocatedTransfers;

  // Calculate final dynamic sheet length
  const maxPlacedY = bestPacking.reduce((max, t) => Math.max(max, t.y + t.placedHeight), 0);
  const requiredSheetLength = bestPacking.length > 0
    ? Math.round((maxPlacedY + edgeMargin) * 100) / 100
    : 0;

  // Square footage & utilization
  const totalMaterialAreaSqIn = sheetWidth * requiredSheetLength;
  const totalSquareFootage = Math.round((totalMaterialAreaSqIn / 144) * 100) / 100;

  const totalArtworkAreaSqIn = bestPacking.reduce(
    (sum, t) => sum + (t.originalWidth * t.originalHeight),
    0
  );
  const totalArtworkAreaSqFt = Math.round((totalArtworkAreaSqIn / 144) * 100) / 100;

  const wasteAreaSqIn = Math.max(0, totalMaterialAreaSqIn - totalArtworkAreaSqIn);
  const wasteAreaSqFt = Math.round((wasteAreaSqIn / 144) * 100) / 100;

  const utilizationPercent = totalMaterialAreaSqIn > 0
    ? Math.round(((totalArtworkAreaSqIn / totalMaterialAreaSqIn) * 100) * 10) / 10
    : 0;

  const requiredMaterialLabel = `${sheetWidth}" × ${requiredSheetLength.toFixed(2)}"`;

  return {
    sheetWidth,
    requiredSheetLength,
    requiredMaterialLabel,
    totalSquareFootage,
    totalArtworkAreaSqIn,
    totalArtworkAreaSqFt,
    totalMaterialAreaSqIn,
    totalMaterialAreaSqFt: totalSquareFootage,
    wasteAreaSqIn,
    wasteAreaSqFt,
    utilizationPercent,
    placedTransfers: bestPacking,
    totalDesigns: artworkItems.length,
    totalRequestedTransfers,
    totalAllocatedTransfers,
    totalRemainingTransfers,
    designReports,
    unplaceableItems,
  };
}

// Retain legacy discrete sheet function for any external component compatibility
export interface PackingOptions {
  sheetWidth: number;
  sheetHeight: number;
  transferSpacing: number;
  edgeMargin: number;
  allowRotation: boolean;
}

export interface GangSheet {
  sheetNumber: number;
  width: number;
  height: number;
  transfers: PlacedTransfer[];
  artworkAreaSqIn: number;
  sheetAreaSqIn: number;
  utilizationPercent: number;
  wasteAreaSqIn: number;
}

export interface GangSheetResult {
  sheets: GangSheet[];
  totalSheetsRequired: number;
  totalDesigns: number;
  totalRequestedTransfers: number;
  totalAllocatedTransfers: number;
  totalRemainingTransfers: number;
  totalSheetAreaSqFt: number;
  totalArtworkAreaSqFt: number;
  totalWasteAreaSqFt: number;
  overallUtilizationPercent: number;
  designReports: DesignQuantityReport[];
  unplaceableItems: string[];
  singleSheetAreaSqFt: number;
}

export function calculateDTFGangSheetLayout(
  artworkItems: ArtworkInputItem[],
  options: PackingOptions
): GangSheetResult {
  // Continuous packing fallback wrapper
  const continuous = calculateContinuousDTFGangSheet(artworkItems, {
    sheetWidth: options.sheetWidth,
    transferSpacing: options.transferSpacing,
    edgeMargin: options.edgeMargin,
    allowRotation: options.allowRotation,
  });

  const singleSheetAreaSqIn = options.sheetWidth * options.sheetHeight;
  const singleSheetAreaSqFt = singleSheetAreaSqIn / 144;
  const totalSheetsRequired = continuous.requiredSheetLength > 0
    ? Math.max(1, Math.ceil(continuous.requiredSheetLength / options.sheetHeight))
    : 0;

  const sheets: GangSheet[] = [];
  for (let s = 1; s <= totalSheetsRequired; s++) {
    const minY = (s - 1) * options.sheetHeight;
    const maxY = s * options.sheetHeight;
    const sheetTransfers = continuous.placedTransfers.filter(
      t => t.y >= minY && t.y < maxY
    );
    const artArea = sheetTransfers.reduce((sum, t) => sum + (t.originalWidth * t.originalHeight), 0);
    sheets.push({
      sheetNumber: s,
      width: options.sheetWidth,
      height: options.sheetHeight,
      transfers: sheetTransfers,
      artworkAreaSqIn: artArea,
      sheetAreaSqIn: singleSheetAreaSqIn,
      utilizationPercent: singleSheetAreaSqIn > 0 ? (artArea / singleSheetAreaSqIn) * 100 : 0,
      wasteAreaSqIn: Math.max(0, singleSheetAreaSqIn - artArea),
    });
  }

  return {
    sheets,
    totalSheetsRequired,
    totalDesigns: continuous.totalDesigns,
    totalRequestedTransfers: continuous.totalRequestedTransfers,
    totalAllocatedTransfers: continuous.totalAllocatedTransfers,
    totalRemainingTransfers: continuous.totalRemainingTransfers,
    totalSheetAreaSqFt: totalSheetsRequired * singleSheetAreaSqFt,
    totalArtworkAreaSqFt: continuous.totalArtworkAreaSqFt,
    totalWasteAreaSqFt: Math.max(0, (totalSheetsRequired * singleSheetAreaSqFt) - continuous.totalArtworkAreaSqFt),
    overallUtilizationPercent: continuous.utilizationPercent,
    designReports: continuous.designReports,
    unplaceableItems: continuous.unplaceableItems,
    singleSheetAreaSqFt,
  };
}
