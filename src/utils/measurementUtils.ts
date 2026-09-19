/**
 * Authoritative Measurement and Conversion Utilities
 * 
 * Standards:
 * - 1 inch = 2.54 cm
 * - 1 foot = 12 inches = 30.48 cm
 * 
 * Global Measurement Display Convention:
 * Whenever a measurement is displayed, show both:
 * 1. The numeric measurement with its abbreviation
 * 2. The full unit name in parentheses
 * 
 * Examples:
 * - 11 in × 12 in (Inches)
 * - 27.94 cm × 30.48 cm (Centimeters)
 * - 2 ft × 3 ft (Feet)
 * - 11 in (Inches)
 * - 27.94 cm (Centimeters)
 * - 2 ft (Feet)
 */

export type MeasurementUnit = "in" | "cm" | "ft";

export interface UnitDefinition {
  abbr: string;
  fullName: string;
  singular: string;
}

export const MEASUREMENT_UNITS: Record<MeasurementUnit, UnitDefinition> = {
  in: { abbr: "in", fullName: "Inches", singular: "Inch" },
  cm: { abbr: "cm", fullName: "Centimeters", singular: "Centimeter" },
  ft: { abbr: "ft", fullName: "Feet", singular: "Foot" },
};

/**
 * Normalizes any measurement to Inches for internal physical calculations.
 */
export function toInches(val: number, unit: MeasurementUnit): number {
  if (isNaN(val) || val <= 0) return 0;
  switch (unit) {
    case "cm":
      return val / 2.54;
    case "ft":
      return val * 12;
    case "in":
    default:
      return val;
  }
}

/**
 * Converts a normalized value in Inches into the target measurement unit.
 */
export function fromInches(inchesVal: number, toUnit: MeasurementUnit): number {
  if (isNaN(inchesVal) || inchesVal <= 0) return 0;
  switch (toUnit) {
    case "cm":
      return inchesVal * 2.54;
    case "ft":
      return inchesVal / 12;
    case "in":
    default:
      return inchesVal;
  }
}

/**
 * Directly converts a value between any two supported units.
 */
export function convertUnit(val: number, fromUnit: MeasurementUnit, toUnit: MeasurementUnit): number {
  if (fromUnit === toUnit) return val;
  const inches = toInches(val, fromUnit);
  return fromInches(inches, toUnit);
}

/**
 * Helper to round and format numeric display without trailing zero noise.
 */
/**
 * Unit Display Behavior Standards:
 * 
 * 1. Production Tools & Calculators: COMPACT ONLY
 * All production tools, inputs, dropdowns, diagrams, and operational calculation interfaces
 * MUST use compact unit format only:
 * - 11 in × 16 in
 * - 27.94 cm × 30.48 cm
 * - 2 ft × 3 ft
 * - 4 in (Diameter)
 * - 11 in (Width)
 * Do NOT append the full unit name in parentheses inside production tools.
 * 
 * 2. Copy & Paste Templates (Customer & Production Templates): FULL UNIT NAMES
 * The full unit name is ONLY used in Customer Template and Production Template outputs:
 * - 11 in × 16 in (Inches)
 * - 27.94 cm × 30.48 cm (Centimeters)
 * - 2 ft × 3 ft (Feet)
 */

export function formatUnitNumber(val: number, maxDecimals: number = 2): string {
  if (isNaN(val) || val === 0) return "0";
  if (Number.isInteger(val)) return String(val);
  const rounded = parseFloat(val.toFixed(maxDecimals));
  return String(rounded);
}

/**
 * Format an individual measurement.
 * Default: COMPACT format for production tools (e.g., "11 in", "27.94 cm", "2 ft").
 * Set includeFullName = true for Customer and Production templates ONLY (e.g., "11 in (Inches)").
 */
export function formatMeasurement(
  val: number,
  unit: MeasurementUnit = "in",
  maxDecimals: number = 2,
  includeFullName: boolean = false
): string {
  const meta = MEASUREMENT_UNITS[unit] || MEASUREMENT_UNITS.in;
  const numStr = formatUnitNumber(val, maxDecimals);
  const base = `${numStr} ${meta.abbr}`;
  return includeFullName ? `${base} (${meta.fullName})` : base;
}

/**
 * Format a 2D dimension pair.
 * Default: COMPACT format for production tools (e.g., "11 in × 16 in", "27.94 cm × 30.48 cm", "2 ft × 3 ft").
 * Set includeFullName = true for Customer and Production templates ONLY:
 * e.g., "11 in × 16 in (Inches)", "27.94 cm × 30.48 cm (Centimeters)", "2 ft × 3 ft (Feet)".
 */
export function formatDimensionPair(
  width: number,
  height: number,
  unit: MeasurementUnit = "in",
  maxDecimals: number = 2,
  includeFullName: boolean = false
): string {
  const meta = MEASUREMENT_UNITS[unit] || MEASUREMENT_UNITS.in;
  const wStr = formatUnitNumber(width, maxDecimals);
  const hStr = formatUnitNumber(height, maxDecimals);
  const base = `${wStr} ${meta.abbr} × ${hStr} ${meta.abbr}`;
  return includeFullName ? `${base} (${meta.fullName})` : base;
}

/**
 * Format a 3D dimension triplet.
 * Default: COMPACT format for production tools (e.g., "11 in × 16 in × 2 in").
 * Set includeFullName = true for Customer and Production templates ONLY (e.g., "11 in × 16 in × 2 in (Inches)").
 */
export function formatDimensionTriplet(
  width: number,
  height: number,
  depth: number,
  unit: MeasurementUnit = "in",
  maxDecimals: number = 2,
  includeFullName: boolean = false
): string {
  const meta = MEASUREMENT_UNITS[unit] || MEASUREMENT_UNITS.in;
  const wStr = formatUnitNumber(width, maxDecimals);
  const hStr = formatUnitNumber(height, maxDecimals);
  const dStr = formatUnitNumber(depth, maxDecimals);
  const base = `${wStr} ${meta.abbr} × ${hStr} ${meta.abbr} × ${dStr} ${meta.abbr}`;
  return includeFullName ? `${base} (${meta.fullName})` : base;
}

/**
 * Format circular diameter measurement.
 * Default: COMPACT format for production tools (e.g., "4 in").
 * Set includeFullName = true for Customer and Production templates ONLY (e.g., "4 in (Inches)").
 */
export function formatDiameter(
  diameter: number,
  unit: MeasurementUnit = "in",
  maxDecimals: number = 2,
  includeFullName: boolean = false
): string {
  const meta = MEASUREMENT_UNITS[unit] || MEASUREMENT_UNITS.in;
  const dStr = formatUnitNumber(diameter, maxDecimals);
  const base = `${dStr} ${meta.abbr}`;
  return includeFullName ? `${base} (${meta.fullName})` : base;
}

/**
 * Convenience formatters explicitly dedicated to Customer & Production templates ONLY.
 */
export function formatMeasurementTemplate(
  val: number,
  unit: MeasurementUnit = "in",
  maxDecimals: number = 2
): string {
  return formatMeasurement(val, unit, maxDecimals, true);
}

export function formatDimensionPairTemplate(
  width: number,
  height: number,
  unit: MeasurementUnit = "in",
  maxDecimals: number = 2
): string {
  return formatDimensionPair(width, height, unit, maxDecimals, true);
}

export function formatDiameterTemplate(
  diameter: number,
  unit: MeasurementUnit = "in",
  maxDecimals: number = 2
): string {
  return formatDiameter(diameter, unit, maxDecimals, true);
}

/**
 * Format area in square feet:
 * e.g., "1.22 sq ft"
 */
export function formatAreaSquareFeet(sqFt: number, maxDecimals: number = 2): string {
  return `${formatUnitNumber(sqFt, maxDecimals)} sq ft`;
}
