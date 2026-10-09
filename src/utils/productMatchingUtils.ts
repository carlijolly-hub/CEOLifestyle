import { 
  LuxeBookInventoryItem, 
  RegularInventoryItem, 
  FulfillmentInventoryItem, 
  FulfillmentTemplate, 
  OperationsOrderItem 
} from "../types";

export type ProductMatchType = 
  | "BOM_TEMPLATE" 
  | "LUXE_BOOK" 
  | "REGULAR_INVENTORY" 
  | "FULFILLMENT_MATERIAL" 
  | "UNMATCHED";

export interface MatchedProductResult {
  rawProductName: string;
  matchType: ProductMatchType;
  matchedId?: string;
  matchedName: string;
  category: string;
  availableStock: number;
  unitLabel: string;
  matchConfidence: "EXACT" | "FUZZY" | "NONE";
  matchReason: string;
  bookRecord?: LuxeBookInventoryItem;
  regularRecord?: RegularInventoryItem;
  materialRecord?: FulfillmentInventoryItem;
  templateRecord?: FulfillmentTemplate;
}

/**
 * Normalizes text by removing punctuation, extra spaces, and common suffixes
 */
export function normalizeProductSearchString(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[()[\]{}'"`’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Common typo corrections and synonym maps for robust fuzzy matching
 */
const COMMON_TYPO_MAP: Record<string, string> = {
  "psycology": "psychology",
  "psycological": "psychological",
  "babalon": "babylon",
  "babylonian": "babylon",
  "tshirt": "t-shirt",
  "tshirts": "t-shirt",
  "t-shirts": "t-shirt",
  "t-shirt": "t-shirt",
  "t shirt": "t-shirt",
  "t shirts": "t-shirt",
  "tee": "t-shirt",
  "tees": "t-shirt",
  "tee-shirt": "t-shirt",
  "tee-shirts": "t-shirt",
  "polos": "polo",
  "hoodies": "hoodie",
  "stickers": "sticker",
  "mugs": "mug",
  "journals": "journal",
  "planners": "planner",
  "pens": "pen",
  "bottles": "bottle",
  "caps": "cap",
  "hats": "hat"
};

/**
 * Normalizes a product name into a canonical, consistent single-form name and key.
 * e.g., "T-Shirts", "T-Shirt", "tshirts", "T Shirts" -> { normalizedName: "T-Shirt", canonicalKey: "t-shirt" }
 */
export function canonicalizeProductName(rawName: string): {
  normalizedName: string;
  canonicalKey: string;
  isTShirt: boolean;
} {
  const trimmed = (rawName || "").trim();
  if (!trimmed) {
    return { normalizedName: "", canonicalKey: "", isTShirt: false };
  }

  // Check T-Shirt variations specifically
  if (
    /^\s*t[\s\-_]*shirts?\s*$/i.test(trimmed) || 
    /^\s*tshirts?\s*$/i.test(trimmed) ||
    /^\s*tees?\s*$/i.test(trimmed) ||
    /^\s*tee[\s\-_]*shirts?\s*$/i.test(trimmed)
  ) {
    return {
      normalizedName: "T-Shirt",
      canonicalKey: "t-shirt",
      isTShirt: true
    };
  }

  // Handle common plurals while preserving title casing
  let cleanName = trimmed;
  const lower = trimmed.toLowerCase();
  
  // Plural strip if simple English plural ending in 's' but not 'ss' or 'us'
  if (lower.endsWith("s") && !lower.endsWith("ss") && !lower.endsWith("us") && lower.length > 3) {
    const singular = trimmed.slice(0, -1);
    // e.g. "Die-Cut Stickers" -> "Die-Cut Sticker", "Custom Mugs" -> "Custom Mug"
    cleanName = singular;
  }

  return {
    normalizedName: cleanName,
    canonicalKey: cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    isTShirt: false
  };
}

export interface ParsedTShirtInfo {
  isTShirt: boolean;
  colour?: string;
  size?: string;
  canonicalProduct: string;
  variantKey: string;
  variantLabel: string;
  displayName: string;
  quantity?: number;
}

const KNOWN_COLORS = [
  "royal blue", "sky blue", "heather grey", "heather gray", "forest green",
  "hot pink", "dark grey", "dark gray", "light blue", "navy blue",
  "red", "white", "black", "navy", "blue", "grey", "gray", "charcoal",
  "green", "olive", "yellow", "gold", "orange", "pink", "purple",
  "burgundy", "maroon", "brown", "beige", "cream", "tan", "teal", "sand"
];

const KNOWN_SIZES = [
  "5xl", "4xl", "3xl", "xxxl", "2xl", "xxl", "xl", "xs", "small", "medium", "large", "s", "m", "l"
];

const SIZE_NORMALIZATION_MAP: Record<string, string> = {
  "small": "S",
  "medium": "M",
  "large": "L",
  "xs": "XS",
  "s": "S",
  "m": "M",
  "l": "L",
  "xl": "XL",
  "2xl": "2XL",
  "xxl": "2XL",
  "3xl": "3XL",
  "xxxl": "3XL",
  "4xl": "4XL",
  "5xl": "5XL"
};

/**
 * Robustly parses T-Shirt information from strings or explicit fields, extracting size, colour,
 * and standardizing naming to T-Shirt.
 */
export function parseTShirtVariant(
  rawProductName: string,
  explicitColour?: string,
  explicitSize?: string
): ParsedTShirtInfo {
  const trimmed = (rawProductName || "").trim();
  const lower = trimmed.toLowerCase();

  // Test if this is a T-Shirt variation
  const isTShirt = 
    /\bt[\s\-_]*shirts?\b/i.test(trimmed) ||
    /\btshirts?\b/i.test(trimmed) ||
    /\btees?\b/i.test(trimmed) ||
    /\btee[\s\-_]*shirts?\b/i.test(trimmed) ||
    (explicitColour !== undefined && explicitSize !== undefined && lower.includes("shirt"));

  if (!isTShirt) {
    const canon = canonicalizeProductName(trimmed);
    return {
      isTShirt: false,
      canonicalProduct: canon.normalizedName || trimmed,
      variantKey: canon.canonicalKey || lower,
      variantLabel: trimmed,
      displayName: trimmed
    };
  }

  // Extract or normalize colour
  let colour = (explicitColour || "").trim();
  if (!colour) {
    for (const c of KNOWN_COLORS) {
      const reg = new RegExp(`\\b${c}\\b`, "i");
      if (reg.test(lower)) {
        colour = c.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        break;
      }
    }
  } else {
    colour = colour.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  }

  // Extract or normalize size
  let size = (explicitSize || "").trim();
  if (!size) {
    for (const s of KNOWN_SIZES) {
      const reg = new RegExp(`\\b${s}\\b`, "i");
      if (reg.test(lower)) {
        size = SIZE_NORMALIZATION_MAP[s.toLowerCase()] || s.toUpperCase();
        break;
      }
    }
  } else {
    size = SIZE_NORMALIZATION_MAP[size.toLowerCase()] || size.toUpperCase();
  }

  // Build clean variant label and display name
  const colourPart = colour || "";
  const sizePart = size || "";
  const variantLabel = [colourPart, sizePart].filter(Boolean).join(" ") || "Standard";
  
  let displayName = "";
  if (colourPart && sizePart) {
    displayName = `${colourPart} ${sizePart} T-Shirt`;
  } else if (colourPart) {
    displayName = `${colourPart} T-Shirt`;
  } else if (sizePart) {
    displayName = `${sizePart} T-Shirt`;
  } else {
    displayName = "T-Shirt";
  }

  const variantKey = `t-shirt::c:${colourPart.toLowerCase()}::s:${sizePart.toLowerCase()}`;

  return {
    isTShirt: true,
    colour: colourPart || undefined,
    size: sizePart || undefined,
    canonicalProduct: "T-Shirt",
    variantKey,
    variantLabel,
    displayName
  };
}

export function cleanAndStemWord(word: string): string {
  const lower = word.toLowerCase().trim();
  return COMMON_TYPO_MAP[lower] || lower;
}

/**
 * Matches an order line item against:
 * 1. Fulfillment BOM Templates (Packages, Gift Baskets, Bouquets)
 * 2. Librarium Luxe Books
 * 3. Regular Inventory (Finished goods, apparel, mugs)
 * 4. Fulfillment Materials (Raw components, ribbon, cellophane)
 */
/**
 * Strips leading common English articles ("the ", "a ", "an ")
 */
export function stripLeadingArticle(str: string): string {
  if (!str) return "";
  return str.replace(/^(?:the|a|an)\s+/i, "").trim();
}

/**
 * Evaluates whether an input product matches a candidate catalog item under the conservative 4-tier hierarchy:
 * Tier 1: Exact normalized match
 * Tier 2: Explicit/validated relationship (e.g. SKU, explicit ID, or clean book title without parenthesized edition)
 * Tier 3: Safe normalized equivalence (spacing, punctuation, canonical singular/plural, leading articles, typo-corrected tokens)
 * Tier 4: Otherwise — NO MATCH (substring containment by itself is strictly prohibited)
 */
function evaluateDeterministicMatch(
  rawInput: string,
  normalizedRaw: string,
  targetName: string,
  options?: {
    targetId?: string;
    targetSku?: string;
    cleanTargetTitle?: string;
  }
): { isMatch: boolean; confidence: "EXACT" | "FUZZY" | "NONE"; reason: string } {
  const targetNorm = normalizeProductSearchString(targetName);

  // 1. Exact normalized match (Highest confidence)
  if (normalizedRaw && targetNorm && normalizedRaw === targetNorm) {
    return {
      isMatch: true,
      confidence: "EXACT",
      reason: `Exact match: "${targetName}"`
    };
  }

  // 2. Explicit / validated relationship: ID or SKU match
  const rawTrimmed = rawInput.trim().toLowerCase();
  if (options?.targetId && options.targetId.toLowerCase() === rawTrimmed) {
    return {
      isMatch: true,
      confidence: "EXACT",
      reason: `Explicit ID match: "${options.targetId}"`
    };
  }
  if (options?.targetSku && options.targetSku.toLowerCase() === rawTrimmed) {
    return {
      isMatch: true,
      confidence: "EXACT",
      reason: `Explicit SKU match: "${options.targetSku}"`
    };
  }
  // For books: clean catalog title without parenthesized edition (e.g. "The Psychology of Money")
  if (options?.cleanTargetTitle && options.cleanTargetTitle === normalizedRaw) {
    return {
      isMatch: true,
      confidence: "EXACT",
      reason: `Exact title match: "${targetName}"`
    };
  }

  // 3. Safe normalized equivalence:
  // a. Canonical name key equality (e.g. "T-Shirts" vs "T-Shirt", "Die-Cut Stickers" vs "Die-Cut Sticker")
  const canonRaw = canonicalizeProductName(rawInput);
  const canonTarget = canonicalizeProductName(targetName);
  if (canonRaw.canonicalKey && canonTarget.canonicalKey && canonRaw.canonicalKey === canonTarget.canonicalKey) {
    return {
      isMatch: true,
      confidence: "EXACT",
      reason: `Canonical equivalence: "${targetName}"`
    };
  }

  // b. Leading article equivalence (e.g. "The Richest Man in Babylon" vs "Richest Man in Babylon")
  const articleStrippedRaw = stripLeadingArticle(normalizedRaw);
  const articleStrippedTarget = stripLeadingArticle(targetNorm);
  if (articleStrippedRaw && articleStrippedTarget && articleStrippedRaw === articleStrippedTarget) {
    return {
      isMatch: true,
      confidence: "EXACT",
      reason: `Normalized title equivalence: "${targetName}"`
    };
  }
  if (options?.cleanTargetTitle) {
    const articleStrippedCleanTarget = stripLeadingArticle(options.cleanTargetTitle);
    if (articleStrippedRaw && articleStrippedCleanTarget && articleStrippedRaw === articleStrippedCleanTarget) {
      return {
        isMatch: true,
        confidence: "EXACT",
        reason: `Title match without edition subtitle: "${targetName}"`
      };
    }
  }

  // c. Typo-corrected token sequence equivalence (only when all tokens match 1:1 in order)
  const rawTokens = normalizedRaw.split(" ").map(cleanAndStemWord).filter(t => t.length > 0);
  const targetTokens = targetNorm.split(" ").map(cleanAndStemWord).filter(t => t.length > 0);
  if (rawTokens.length > 0 && rawTokens.length === targetTokens.length) {
    const allTokensMatch = rawTokens.every((t, i) => t === targetTokens[i]);
    if (allTokensMatch) {
      return {
        isMatch: true,
        confidence: "FUZZY",
        reason: `Safe spelling equivalence: "${targetName}"`
      };
    }
  }
  if (options?.cleanTargetTitle) {
    const cleanTargetTokens = options.cleanTargetTitle.split(" ").map(cleanAndStemWord).filter(t => t.length > 0);
    if (rawTokens.length > 0 && rawTokens.length === cleanTargetTokens.length) {
      const allTokensMatch = rawTokens.every((t, i) => t === cleanTargetTokens[i]);
      if (allTokensMatch) {
        return {
          isMatch: true,
          confidence: "FUZZY",
          reason: `Safe spelling match: "${targetName}"`
        };
      }
    }
  }

  // 4. Otherwise — NO MATCH!
  // Substring containment by itself (e.g. Pineapple vs Apple, Luxe Gift Box vs Box, Black T-Shirt vs T-Shirt) is strictly prohibited.
  return {
    isMatch: false,
    confidence: "NONE",
    reason: ""
  };
}

export function matchOrderItemToCatalog(
  productName: string,
  context: {
    templates?: FulfillmentTemplate[];
    luxeBooks?: LuxeBookInventoryItem[];
    regularInventory?: RegularInventoryItem[];
    fulfillmentMaterials?: FulfillmentInventoryItem[];
  }
): MatchedProductResult {
  const raw = (productName || "").trim();
  const normalizedRaw = normalizeProductSearchString(raw);

  // 1. Check Fulfillment BOM Templates (Highest Priority)
  const templates = context.templates || [];
  for (const tpl of templates) {
    if (tpl.enabled === false) continue;
    const match = evaluateDeterministicMatch(raw, normalizedRaw, tpl.productName, {
      targetId: tpl.id
    });
    if (match.isMatch) {
      return {
        rawProductName: raw,
        matchType: "BOM_TEMPLATE",
        matchedId: tpl.id,
        matchedName: tpl.productName,
        category: "BOM Assembly / Package",
        availableStock: 0,
        unitLabel: "packages",
        matchConfidence: match.confidence,
        matchReason: `Matched multi-component template "${tpl.productName}"`,
        templateRecord: tpl
      };
    }
  }

  // 2. Check Librarium Luxe Book Inventory
  const books = context.luxeBooks || [];
  for (const book of books) {
    const cleanBookTitle = normalizeProductSearchString(book.title.replace(/\([^)]+\)/g, ""));
    const match = evaluateDeterministicMatch(raw, normalizedRaw, book.title, {
      targetId: book.id,
      cleanTargetTitle: cleanBookTitle
    });
    if (match.isMatch) {
      const stock = (Number(book.quantity) || 0) || ((Number(book.inStore) || 0) + (Number(book.office) || 0));
      return {
        rawProductName: raw,
        matchType: "LUXE_BOOK",
        matchedId: book.id,
        matchedName: book.title,
        category: book.category || "Librarium Luxe Book",
        availableStock: stock,
        unitLabel: "copies",
        matchConfidence: match.confidence,
        matchReason: `Matched Librarium Luxe catalog item "${book.title}"`,
        bookRecord: book
      };
    }
  }

  // 3. Check Regular Goods Inventory (Finished Goods & Merchandise)
  const regular = context.regularInventory || [];
  for (const reg of regular) {
    const match = evaluateDeterministicMatch(raw, normalizedRaw, reg.productName, {
      targetId: reg.id,
      targetSku: reg.sku
    });
    if (match.isMatch) {
      return {
        rawProductName: raw,
        matchType: "REGULAR_INVENTORY",
        matchedId: reg.id,
        matchedName: reg.productName,
        category: reg.category || "Regular Goods",
        availableStock: Number(reg.quantity) || 0,
        unitLabel: reg.unitLabel || "pcs",
        matchConfidence: match.confidence,
        matchReason: `Matched regular inventory item "${reg.productName}"`,
        regularRecord: reg
      };
    }
  }

  // 4. Check Fulfillment Materials (Raw components, ribbon, packaging)
  const materials = context.fulfillmentMaterials || [];
  for (const mat of materials) {
    const match = evaluateDeterministicMatch(raw, normalizedRaw, mat.itemName, {
      targetId: mat.id
    });
    if (match.isMatch) {
      return {
        rawProductName: raw,
        matchType: "FULFILLMENT_MATERIAL",
        matchedId: mat.id,
        matchedName: mat.itemName,
        category: mat.category || "Fulfillment Materials",
        availableStock: Number(mat.availableQty) || 0,
        unitLabel: mat.unitLabel || "units",
        matchConfidence: match.confidence,
        matchReason: `Matched raw material stock item "${mat.itemName}"`,
        materialRecord: mat
      };
    }
  }

  // 5. UNMATCHED (Never silently guess or consume unrelated inventory!)
  return {
    rawProductName: raw,
    matchType: "UNMATCHED",
    matchedName: raw,
    category: "Unmatched / Direct Order Item",
    availableStock: 0,
    unitLabel: "units",
    matchConfidence: "NONE",
    matchReason: "Direct product line item - requires catalog matching or direct procurement"
  };
}
