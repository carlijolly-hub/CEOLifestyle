/**
 * Circular Layout Engine
 * Calculates physical layout of circular items on rectangular sheets
 * based on the fundamental print production rule:
 *
 * 1. Circle Diameter (D)
 * 2. Individual Square Cutting Area (D x D)
 * 3. Spacing (Cutting Gap) between individual cutting squares
 * 4. Place individual squares on sheet (accounting for Waste Margin)
 * 5. Calculate maximum complete circles (Columns x Rows)
 *
 * Example:
 * 11" x 8.5" Sheet, 4" Circle Diameter, 0.25" Cutting Gap, 0.25" Waste Margin
 * -> 2 Columns x 2 Rows = 4 Usable Circles Per Sheet
 * (Two 4" squares + 0.25" gap = 8.25" width & height occupied)
 */

export interface CircularCuttingUnit {
  index: number;
  row: number;
  col: number;
  // The individual square cutting area (D x D)
  squareX: number;     // Top-left X (inches)
  squareY: number;     // Top-left Y (inches)
  squareSize: number;  // Width and height of square (inches) = circle diameter
  // The inscribed circle within the square
  centerX: number;     // Center X (inches)
  centerY: number;     // Center Y (inches)
  radius: number;      // Circle radius (inches)
  diameter: number;    // Circle diameter (inches)
}

export interface CircularLayoutResult {
  arrangementLabel: string;
  itemsPerSheet: number;
  columns: number;
  rows: number;
  units: CircularCuttingUnit[];
  
  // Sheet & Product Dimensions
  sheetWidth: number;
  sheetHeight: number;
  diameter: number;
  radius: number;
  squareSize: number; // = diameter
  cuttingGap: number;
  wasteMargin: number;
  
  // Occupied footprint of all squares + gaps
  occupiedWidth: number;
  occupiedHeight: number;
  marginLeft: number;
  marginTop: number;
  
  // Validity & diagnostics
  isValid: boolean;
  validationMessage?: string;
  patternDescription?: string;
}

/**
 * Calculates available positions using individual square cutting areas
 */
export function calculateCircularLayout(
  sheetWidth: number,
  sheetHeight: number,
  diameter: number,
  cuttingGap: number = 0.25,
  wasteMargin: number = 0.25
): CircularLayoutResult {
  const sw = Math.max(0, sheetWidth);
  const sh = Math.max(0, sheetHeight);
  const d = Math.max(0, diameter);
  const gap = Math.max(0, cuttingGap);
  const margin = Math.max(0, wasteMargin);
  const r = d / 2;
  const squareSize = d;

  const defaultInvalid = (msg: string): CircularLayoutResult => ({
    arrangementLabel: "0 circles per sheet",
    itemsPerSheet: 0,
    columns: 0,
    rows: 0,
    units: [],
    sheetWidth: sw,
    sheetHeight: sh,
    diameter: d,
    radius: r,
    squareSize,
    cuttingGap: gap,
    wasteMargin: margin,
    occupiedWidth: 0,
    occupiedHeight: 0,
    marginLeft: 0,
    marginTop: 0,
    isValid: false,
    validationMessage: msg,
    patternDescription: "0 columns × 0 rows"
  });

  if (sw <= 0 || sh <= 0 || d <= 0) {
    return defaultInvalid("Please enter positive dimensions for sheet and circle diameter.");
  }

  // Check if a single cutting square fits physically on sheet
  if (squareSize > sw || squareSize > sh) {
    return defaultInvalid(
      `A single ${squareSize}" × ${squareSize}" cutting square exceeds sheet dimensions (${sw}" × ${sh}").`
    );
  }

  // Available space taking waste margin into account
  // If margin is specified as sheet waste allowance, available area is sw - margin, sh - margin
  const availW = Math.max(0, sw - margin);
  const availH = Math.max(0, sh - margin);

  if (squareSize > availW || squareSize > availH) {
    return defaultInvalid(
      `A single ${squareSize}" × ${squareSize}" cutting square exceeds usable sheet area after waste margin (${margin}").`
    );
  }

  // Calculate maximum columns and rows
  // For k squares with size S and gap G:
  // k * S + (k - 1) * G <= availLength
  // k * (S + G) <= availLength + G
  // k = floor((availLength + G) / (S + G))
  const cols = Math.max(0, Math.floor((availW + gap) / (squareSize + gap)));
  const rows = Math.max(0, Math.floor((availH + gap) / (squareSize + gap)));

  const itemsPerSheet = cols * rows;

  if (itemsPerSheet === 0) {
    return defaultInvalid(
      `No complete ${squareSize}" × ${squareSize}" square cutting areas fit on this sheet.`
    );
  }

  // Calculate occupied space of all cutting squares + gaps
  const occupiedWidth = cols * squareSize + (cols - 1) * gap;
  const occupiedHeight = rows * squareSize + (rows - 1) * gap;

  // Center the cutting squares within the sheet
  const marginLeft = Math.max(0, (sw - occupiedWidth) / 2);
  const marginTop = Math.max(0, (sh - occupiedHeight) / 2);

  // Generate the individual cutting units
  const units: CircularCuttingUnit[] = [];
  let idx = 1;

  for (let rIdx = 0; rIdx < rows; rIdx++) {
    for (let cIdx = 0; cIdx < cols; cIdx++) {
      const sqX = marginLeft + cIdx * (squareSize + gap);
      const sqY = marginTop + rIdx * (squareSize + gap);
      const cX = sqX + r;
      const cY = sqY + r;

      units.push({
        index: idx++,
        row: rIdx + 1,
        col: cIdx + 1,
        squareX: sqX,
        squareY: sqY,
        squareSize,
        centerX: cX,
        centerY: cY,
        radius: r,
        diameter: d
      });
    }
  }

  const arrangementLabel = `${cols} col × ${rows} row • ${itemsPerSheet} usable circles`;
  const patternDescription = `${cols} Columns × ${rows} Rows (${itemsPerSheet} Individual Cutting Squares)`;

  return {
    arrangementLabel,
    itemsPerSheet,
    columns: cols,
    rows,
    units,
    sheetWidth: sw,
    sheetHeight: sh,
    diameter: d,
    radius: r,
    squareSize,
    cuttingGap: gap,
    wasteMargin: margin,
    occupiedWidth,
    occupiedHeight,
    marginLeft,
    marginTop,
    isValid: true,
    patternDescription
  };
}
