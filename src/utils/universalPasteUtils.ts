import * as XLSX from "xlsx";
import { flatRowToCustomer } from "./excelUtils";
import { 
  Client, 
  AspiringClient, 
  LuxeBookInventoryItem, 
  InventorySalesMovement,
  OperationsOrder,
  OperationsOrderItem,
  ClientTier,
  ProductionStatus,
  OperationsDeliveryMethod,
  OrderPriority,
  YesNo
} from "../types";

export interface ParsedPasteResult {
  headers: string[];
  rawRows: any[];
  mappedItems: any[];
  totalRows: number;
  validCount: number;
  warningCount: number;
  errors: string[];
}

/**
 * Universal text parsing for spreadsheet data copied from
 * Microsoft Excel, Google Sheets, or Apple Numbers.
 */
export function parseSpreadsheetClipboardText(text: string): { headers: string[]; rawRows: any[] } {
  if (!text || !text.trim()) {
    return { headers: [], rawRows: [] };
  }

  const cleanText = text.trim();

  // Method 1: SheetJS string reader
  try {
    const workbook = XLSX.read(cleanText, { type: "string" });
    const sheetName = workbook.SheetNames[0];
    if (sheetName && workbook.Sheets[sheetName]) {
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });
      if (json && json.length > 0) {
        const headers = Object.keys(json[0] || {});
        return { headers, rawRows: json };
      }
    }
  } catch (e) {
    console.warn("SheetJS text parse fallback:", e);
  }

  // Method 2: Manual TSV/CSV delimiter parser
  const lines = cleanText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rawRows: [] };

  const firstLine = lines[0];
  const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(",") ? "," : ";";

  const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
  if (lines.length === 1) {
    return { headers, rawRows: [] };
  }

  const rawRows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cells.every(c => c === "")) continue;
    const rowObj: any = {};
    headers.forEach((header, idx) => {
      const key = header || `Column_${idx + 1}`;
      rowObj[key] = cells[idx] !== undefined ? cells[idx] : "";
    });
    rawRows.push(rowObj);
  }

  return { headers, rawRows };
}

/**
 * Parses a product string containing one or multiple comma/newline-separated items
 * e.g. "1x the richest man in babylon, 1x psycology of money"
 * e.g. "1x T shirt, 1x t shirt"
 * e.g. "2x Magic Heart Cube, 1x Hardcover Journal ($4,500)"
 */
export function parseProductsString(productsStr: string): { items: OperationsOrderItem[]; totalQuantity: number } {
  if (!productsStr || !productsStr.trim()) {
    return {
      items: [{ id: "item-1", productName: "Custom Order Item", quantity: 1, itemCost: 0, details: "" } as any],
      totalQuantity: 1
    };
  }

  // Split by comma / newline / semicolon when not inside parentheses
  const rawItemParts: string[] = [];
  let currentPart = "";
  let insideParen = 0;
  
  for (let i = 0; i < productsStr.length; i++) {
    const char = productsStr[i];
    if (char === "(" || char === "[" || char === "{") insideParen++;
    else if (char === ")" || char === "]" || char === "}") insideParen = Math.max(0, insideParen - 1);

    if ((char === "," || char === ";" || char === "\n") && insideParen === 0) {
      if (currentPart.trim()) rawItemParts.push(currentPart.trim());
      currentPart = "";
    } else {
      currentPart += char;
    }
  }
  if (currentPart.trim()) rawItemParts.push(currentPart.trim());

  if (rawItemParts.length === 0) {
    return {
      items: [{ id: "item-1", productName: productsStr.trim(), quantity: 1 }],
      totalQuantity: 1
    };
  }

  const items: OperationsOrderItem[] = [];
  let totalQuantity = 0;

  rawItemParts.forEach((part, idx) => {
    let cleanPart = part.replace(/^[-•*+]\s*/, "").trim();
    if (!cleanPart) return;

    let qty = 1;
    let unitPrice = 0;
    let size = "";
    let colour = "";
    let details = "";

    // Check for leading quantity pattern: "1x", "2 x", "3X", "1*", etc.
    const qtyPrefixMatch = cleanPart.match(/^(\d+)\s*[xX*]\s+(.*)$/);
    if (qtyPrefixMatch) {
      qty = parseInt(qtyPrefixMatch[1], 10) || 1;
      cleanPart = qtyPrefixMatch[2].trim();
    } else {
      // Check for trailing quantity: "Product Name (qty 2)" or "Product Name x2"
      const qtySuffixMatch = cleanPart.match(/^(.*?)\s*[\(\[]?\s*(?:qty|quantity)?\s*[xX*]?\s*(\d+)\s*[\)\]]?$/i);
      if (qtySuffixMatch && qtySuffixMatch[1] && qtySuffixMatch[2] && !qtySuffixMatch[1].toLowerCase().includes("size")) {
        qty = parseInt(qtySuffixMatch[2], 10) || 1;
        cleanPart = qtySuffixMatch[1].trim();
      }
    }

    // Extract all parenthesized groups, e.g. (Size: M, Colour: Red) or (Size: M) (Colour: Red)
    const parenMatches = Array.from(cleanPart.matchAll(/\((.*?)\)/g));
    const extraDetails: string[] = [];

    if (parenMatches.length > 0) {
      for (const m of parenMatches) {
        const parenContent = m[1].trim();
        if (!parenContent) continue;

        let attributeHandled = false;

        // Check for price: ($7,000) or ($7000 JMD)
        const priceMatch = parenContent.match(/^[$JMD\s]*([\d,]+(?:\.\d+)?)\s*(?:JMD)?$/i);
        if (priceMatch && !parenContent.toLowerCase().includes("size") && !parenContent.toLowerCase().includes("colour") && !parenContent.toLowerCase().includes("color")) {
          unitPrice = parseFloat(priceMatch[1].replace(/,/g, "")) || unitPrice;
          attributeHandled = true;
        }

        // Check for size: (Size: M) or (Sz: M)
        const sizeMatch = parenContent.match(/(?:^|[,;]|\s)(?:size|sz)\s*:\s*([^,;]+)/i);
        if (sizeMatch) {
          size = sizeMatch[1].trim();
          attributeHandled = true;
        }

        // Check for colour / color: (Colour: Red) or (Color: Blue)
        const colourMatch = parenContent.match(/(?:^|[,;]|\s)(?:colour|color)\s*:\s*([^,;]+)/i);
        if (colourMatch) {
          colour = colourMatch[1].trim();
          attributeHandled = true;
        }

        // Check if there are other unhandled attribute segments inside this parenthesized block
        if (!attributeHandled) {
          extraDetails.push(parenContent);
        } else {
          // If combined like (Size: M, Colour: Red, Note: Expedited)
          const remainingParts = parenContent
            .split(/[,;]/)
            .map(p => p.trim())
            .filter(p => {
              if (!p) return false;
              if (p.match(/^(?:size|sz)\s*:/i)) return false;
              if (p.match(/^(?:colour|color)\s*:/i)) return false;
              if (p.match(/^[$JMD\s]*[\d,]+(?:\.\d+)?(?:\s*JMD)?$/i)) return false;
              return true;
            });
          if (remainingParts.length > 0) {
            extraDetails.push(remainingParts.join(", "));
          }
        }
      }

      // Remove the parenthesized groups from the cleaned product name
      cleanPart = cleanPart.replace(/\(.*?\)/g, "").trim();
      // Clean trailing punctuation or multiple spaces
      cleanPart = cleanPart.replace(/\s+/g, " ").replace(/^[,\-:\s]+|[,\-:\s]+$/g, "").trim();
    }

    if (extraDetails.length > 0) {
      details = extraDetails.join("; ");
    }

    totalQuantity += qty;
    items.push({
      id: `item-${idx + 1}`,
      productName: cleanPart || `Product ${idx + 1}`,
      quantity: qty,
      unitPrice,
      size,
      colour,
      details
    });
  });

  return {
    items: items.length > 0 ? items : [{ id: "item-1", productName: "Order Item", quantity: 1 }],
    totalQuantity: Math.max(1, totalQuantity)
  };
}

/**
 * Helper to check if a block of text contains sufficient structural evidence of an Operations Order.
 * An actual order block MUST contain an explicit Order Number identifier and at least one other recognizable order field.
 */
export function hasOrderStructuralEvidence(text: string): boolean {
  if (!text || !text.trim()) return false;
  // Must have an explicit Order Number field line with actual value
  const hasOrderNum = /(?:^|\r?\n)[ \t]*(?:\*+)?[ \t]*(?:Order\s*(?:Number|#|No|ID)|Job\s*#)[ \t]*(?:\*+)?[ \t]*:[ \t]*#?[a-zA-Z0-9_-]+/i.test(text);
  if (!hasOrderNum) return false;

  // Must have at least one other recognizable order field
  const hasClient = /(?:^|\r?\n)[ \t]*(?:\*+)?[ \t]*(?:Client|Customer)(?:\s*Name)?[ \t]*(?:\*+)?[ \t]*:[ \t]*[^\r\n]+/i.test(text);
  const hasProducts = /(?:^|\r?\n)[ \t]*(?:\*+)?[ \t]*(?:Products?|Items?|Line\s*Items?)[ \t]*(?:\*+)?[ \t]*:[ \t]*[^\r\n]+/i.test(text);
  const hasStatus = /(?:^|\r?\n)[ \t]*(?:\*+)?[ \t]*(?:Production\s*Status|Order\s*Status|Status|Stage)[ \t]*(?:\*+)?[ \t]*:[ \t]*[^\r\n]+/i.test(text);
  const hasPhone = /(?:^|\r?\n)[ \t]*(?:\*+)?[ \t]*(?:Phone|Tel|Mobile|Contact)[ \t]*(?:\*+)?[ \t]*:[ \t]*[^\r\n]+/i.test(text);
  const hasDueDate = /(?:^|\r?\n)[ \t]*(?:\*+)?[ \t]*(?:Due\s*Date|Delivery\s*Date|Due)[ \t]*(?:\*+)?[ \t]*:[ \t]*[^\r\n]+/i.test(text);
  const hasDelivery = /(?:^|\r?\n)[ \t]*(?:\*+)?[ \t]*(?:Delivery\s*Method|Shipping\s*Method|Delivery)[ \t]*(?:\*+)?[ \t]*:[ \t]*[^\r\n]+/i.test(text);

  return hasClient || hasProducts || hasStatus || hasPhone || hasDueDate || hasDelivery;
}

/**
 * Checks if the text represents CEO Lifestyle Operations Order update blocks (Key-Value format)
 */
export function isOperationsBlockText(text: string): boolean {
  if (!text || !text.trim()) return false;
  
  const hasOrderNum = /(?:^|\r?\n)[ \t]*(?:\*+)?[ \t]*(?:Order\s*(?:Number|#|No|ID)|Job\s*#)[ \t]*(?:\*+)?[ \t]*:[ \t]*[^\r\n]+/i.test(text);
  const hasClient = /(?:^|\r?\n)[ \t]*(?:\*+)?[ \t]*(?:Client|Customer)(?:\s*Name)?[ \t]*(?:\*+)?[ \t]*:/i.test(text);
  const hasProducts = /(?:^|\r?\n)[ \t]*(?:\*+)?[ \t]*(?:Products?|Items?)[ \t]*(?:\*+)?[ \t]*:/i.test(text);
  const hasStatus = /(?:^|\r?\n)[ \t]*(?:\*+)?[ \t]*(?:Production\s*Status|Order\s*Status|Status|Stage)[ \t]*(?:\*+)?[ \t]*:/i.test(text);
  const hasHeader = /(?:^|\r?\n)[ \t]*(?:\*+)?[ \t]*(?:CEO\s+LIFESTYLE\s+)?OPERATIONS\s+ORDER(?:\s+UPDATE)?[ \t]*(?:\*+)?[ \t]*(?=\r?\n|$)/i.test(text);

  // Structural requirement: Must contain an explicit Order Number field,
  // and either an Operations Order header or other standard order fields
  if (hasOrderNum && (hasHeader || hasClient || hasProducts || hasStatus)) return true;
  return false;
}

/**
 * Splits pasted text into individual order blocks using order header delimiters.
 * Ensures EXACTLY 1 order block per legitimate header, with zero phantom/fallback orders.
 * Candidate headers inside freeform text (such as Notes or Client info) are validated
 * for structural evidence before being treated as new order boundaries.
 */
export function splitOrderBlocks(text: string): string[] {
  if (!text || !text.trim()) return [];

  const cleanText = text.trim();

  // Pattern 1: Find all candidate order update headers (e.g. "*CEO LIFESTYLE OPERATIONS ORDER UPDATE*")
  const headerRegex = /(?:^|\r?\n)[ \t]*(?:\*+)?[ \t]*(?:CEO\s+LIFESTYLE\s+)?OPERATIONS\s+ORDER(?:\s+UPDATE)?[ \t]*(?:\*+)?[ \t]*(?=\r?\n|$)/gi;
  
  const rawHeaderMatches: { index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = headerRegex.exec(cleanText)) !== null) {
    rawHeaderMatches.push({ index: m.index });
  }

  // Filter candidate header matches:
  // A header match is ONLY treated as a new order boundary if the text segment following it
  // contains structural evidence of an actual order starting (explicit Order Number + order fields).
  // This prevents phrases mentioning "CEO LIFESTYLE OPERATIONS ORDER UPDATE" inside Notes or freeform text
  // from incorrectly splitting an order or spawning phantom order blocks.
  if (rawHeaderMatches.length > 0) {
    const validHeaderIndices: number[] = [];
    for (let i = 0; i < rawHeaderMatches.length; i++) {
      const startIndex = rawHeaderMatches[i].index;
      const nextRawIndex = i + 1 < rawHeaderMatches.length ? rawHeaderMatches[i + 1].index : cleanText.length;
      const candidateSegment = cleanText.substring(startIndex, nextRawIndex);

      if (hasOrderStructuralEvidence(candidateSegment)) {
        validHeaderIndices.push(startIndex);
      }
    }

    if (validHeaderIndices.length > 0) {
      const blocks: string[] = [];
      for (let i = 0; i < validHeaderIndices.length; i++) {
        const startIndex = validHeaderIndices[i];
        const endIndex = i + 1 < validHeaderIndices.length ? validHeaderIndices[i + 1] : cleanText.length;
        const block = cleanText.substring(startIndex, endIndex).trim();
        if (block) {
          blocks.push(block);
        }
      }
      if (blocks.length > 0) {
        return blocks;
      }
    }
  }

  // Pattern 2: If no explicit "*OPERATIONS ORDER UPDATE*" headers, split by "Order Number:" / "Order #:"
  const orderNumRegex = /(?:^|\r?\n)[ \t]*(?:\*+)?[ \t]*(?:Order\s*(?:Number|#|No|ID)|Job\s*#)[ \t]*(?:\*+)?[ \t]*:/gi;
  const rawNumMatches: { index: number }[] = [];
  while ((m = orderNumRegex.exec(cleanText)) !== null) {
    rawNumMatches.push({ index: m.index });
  }

  if (rawNumMatches.length > 1) {
    const validNumIndices: number[] = [];
    for (let i = 0; i < rawNumMatches.length; i++) {
      const startIndex = rawNumMatches[i].index;
      const nextIndex = i + 1 < rawNumMatches.length ? rawNumMatches[i + 1].index : cleanText.length;
      const candidateSegment = cleanText.substring(startIndex, nextIndex);
      if (hasOrderStructuralEvidence(candidateSegment)) {
        validNumIndices.push(startIndex);
      }
    }

    if (validNumIndices.length > 0) {
      const blocks: string[] = [];
      for (let i = 0; i < validNumIndices.length; i++) {
        const startIndex = validNumIndices[i];
        const endIndex = i + 1 < validNumIndices.length ? validNumIndices[i + 1] : cleanText.length;
        const block = cleanText.substring(startIndex, endIndex).trim();
        if (block) {
          blocks.push(block);
        }
      }
      if (blocks.length > 0) {
        return blocks;
      }
    }
  }

  // Pattern 3: Single order block
  return [cleanText];
}

/**
 * Parses a single Operations Order block into a complete OperationsOrder domain object
 */
export function parseSingleOperationsOrderBlock(block: string, index: number): { order: OperationsOrder | null; rawRow: Record<string, string> | null; error?: string } {
  const lines = block.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  const fields: Record<string, string> = {};
  let currentKey = "";

  lines.forEach(line => {
    // Ignore pure header lines or divider lines
    if (/^(?:\*+)?[ \t]*(?:CEO\s+LIFESTYLE\s+)?OPERATIONS\s+ORDER(?:\s+UPDATE)?[ \t]*(?:\*+)?$/i.test(line)) {
      return;
    }
    if (/^[=\-_*#]{3,}$/.test(line)) {
      return;
    }

    // Match "Key: Value" or "*Key*: Value" or "**Key**: Value"
    const kvMatch = line.match(/^(?:\*+)?\s*([a-zA-Z\s#\(\)\/]+?)\s*(?:\*+)?\s*:\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1].trim().toLowerCase();
      fields[currentKey] = kvMatch[2].trim();
    } else if (currentKey) {
      // Continuation of previous multi-line field
      fields[currentKey] += ", " + line;
    }
  });

  const getVal = (...keys: string[]): string => {
    for (const k of keys) {
      const lower = k.toLowerCase();
      if (fields[lower] !== undefined && fields[lower] !== "") {
        return fields[lower];
      }
      for (const fKey of Object.keys(fields)) {
        if (fKey === lower || fKey.startsWith(lower) || lower.startsWith(fKey)) {
          return fields[fKey];
        }
      }
    }
    return "";
  };

  const todayIso = new Date().toISOString().split("T")[0];

  // 1. Order Number (Strictly required: phantom orders are prohibited)
  const rawOrderNum = getVal("order number", "order #", "ord #", "order_number", "order no", "job #", "job id", "order");
  let orderNumber = rawOrderNum.trim();
  if (!orderNumber || orderNumber.toLowerCase() === "none" || orderNumber.toLowerCase() === "n/a") {
    return {
      order: null,
      rawRow: null,
      error: "Missing explicit Order Number."
    };
  }
  if (!orderNumber.startsWith("#") && !orderNumber.startsWith("ORD-") && /^\d+$/.test(orderNumber)) {
    orderNumber = `#${orderNumber}`;
  }

  // 2. Client Name and Tier
  const rawClient = getVal("client", "client name", "customer", "customer name", "name");
  let clientName = rawClient.trim();
  let clientTier: ClientTier = "Silver";

  // Extract tier from parenthesis e.g. "christina stewart (Silver Tier)" or "ms davis (Silver Tier)"
  const tierMatch = clientName.match(/^(.*?)\s*\(\s*(Bronze|Silver|Gold|Platinum|CEO Circle)\s*(?:Tier)?\s*\)/i);
  if (tierMatch) {
    clientName = tierMatch[1].trim();
    const parsedTier = tierMatch[2].trim();
    if (["Bronze", "Silver", "Gold", "Platinum", "CEO Circle"].includes(parsedTier)) {
      clientTier = parsedTier as ClientTier;
    }
  }

  // 3. Client Phone
  const rawPhone = getVal("phone", "client phone", "phone number", "tel", "mobile", "contact");
  let clientPhone = rawPhone.trim();
  if (clientPhone.toUpperCase() === "N/A" || clientPhone.toUpperCase() === "NONE" || clientPhone === "-") {
    clientPhone = "N/A";
  }

  // 4. Products
  const rawProducts = getVal("products", "product", "items", "item", "product ordered", "products ordered", "line items");
  
  if (!clientName && !rawProducts) {
    return {
      order: null,
      rawRow: null,
      error: `Order ${orderNumber}: Missing both Client Name and Products.`
    };
  }

  if (!clientName) {
    clientName = "Valued Client";
  }

  const { items, totalQuantity } = parseProductsString(rawProducts);

  // 5. Cost of Order / Total Amount
  const rawCost = getVal("cost of order", "cost", "total amount", "total cost", "total value", "price", "total");
  const totalAmount = rawCost ? (parseFloat(rawCost.replace(/[^0-9.]/g, "")) || 0) : 0;

  // 6. Production Status
  const rawStatus = getVal("status", "production status", "order status", "stage");
  let productionStatus: ProductionStatus = "New";
  if (rawStatus) {
    const sLower = rawStatus.toLowerCase();
    if (sLower.includes("ready for delivery")) productionStatus = "Ready for Delivery";
    else if (sLower.includes("ready for collection")) productionStatus = "Ready for Collection";
    else if (sLower.includes("ready for pickup")) productionStatus = "Ready for Pickup";
    else if (sLower.includes("ready for production")) productionStatus = "Ready for Production";
    else if (sLower.includes("out for delivery")) productionStatus = "Out for Delivery";
    else if (sLower.includes("in progress")) productionStatus = "In Progress";
    else if (sLower.includes("in production")) productionStatus = "In Production";
    else if (sLower.includes("quality check")) productionStatus = "Quality Check";
    else if (sLower.includes("completed") || sLower.includes("delivered")) productionStatus = "Completed";
    else if (sLower.includes("awaiting deposit")) productionStatus = "Awaiting Deposit";
    else if (sLower.includes("awaiting artwork")) productionStatus = "Awaiting Artwork";
    else if (sLower.includes("confirmed")) productionStatus = "Confirmed";
    else if (sLower.includes("cancelled")) productionStatus = "Cancelled";
    else if (sLower.includes("ready")) productionStatus = "Ready";
    else productionStatus = "New";
  }

  // 7. Due Date
  const rawDueDate = getVal("due date", "target due date", "target delivery date", "delivery date", "due");
  let dueDate = rawDueDate.trim();
  if (!dueDate || dueDate.toUpperCase() === "NONE" || dueDate.toUpperCase() === "N/A") {
    dueDate = todayIso;
  } else {
    const parsedDate = new Date(dueDate);
    if (!isNaN(parsedDate.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      dueDate = dueDate;
    } else if (!isNaN(parsedDate.getTime())) {
      dueDate = parsedDate.toISOString().split("T")[0];
    }
  }

  // 8. Date Order Created
  const rawCreatedDate = getVal("date order created", "created date", "date created", "order date", "date");
  let dateOrderCreated = rawCreatedDate.trim();
  if (!dateOrderCreated || isNaN(new Date(dateOrderCreated).getTime())) {
    dateOrderCreated = todayIso;
  } else {
    const parsedDate = new Date(dateOrderCreated);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOrderCreated)) {
      dateOrderCreated = dateOrderCreated;
    } else if (!isNaN(parsedDate.getTime())) {
      dateOrderCreated = parsedDate.toISOString().split("T")[0];
    }
  }

  // 9. Delivery Method and Location
  const rawDelivery = getVal("delivery method", "delivery", "shipping method", "method");
  let deliveryMethod: OperationsDeliveryMethod = "Store Pickup";
  let deliveryLocation = "";

  if (rawDelivery) {
    const locMatch = rawDelivery.match(/^(.*?)\s*\((.*?)\)/);
    let methodPart = rawDelivery;
    if (locMatch) {
      methodPart = locMatch[1].trim();
      deliveryLocation = locMatch[2].trim();
    }

    const mLower = methodPart.toLowerCase();
    if (mLower.includes("knutsford")) {
      deliveryMethod = "Knutsford Express";
    } else if (mLower.includes("store") || mLower.includes("pickup") || mLower.includes("pick up")) {
      deliveryMethod = "Store Pickup";
    } else if (mLower.includes("personal") || mLower.includes("courier") || mLower.includes("hand")) {
      deliveryMethod = "Personal Delivery";
    } else if (mLower.includes("tara")) {
      deliveryMethod = "Tara Courier";
    } else {
      deliveryMethod = "Other";
    }
  }

  // Location if separate field
  const rawLoc = getVal("delivery location", "location", "branch", "pickup location");
  if (rawLoc && !deliveryLocation) {
    deliveryLocation = rawLoc.trim();
  }

  // 10. Express Order & Express Note
  const rawExpress = getVal("express order", "express", "rush", "is express");
  let expressOrder: YesNo = "No";
  let expressNote = "";

  if (rawExpress) {
    const expLower = rawExpress.toLowerCase();
    if (expLower.includes("yes") || expLower.includes("true") || expLower.startsWith("y") || expLower.includes("express") || expLower.includes("rush")) {
      expressOrder = "Yes";
      const noteMatch = rawExpress.match(/(?:note|rush)\s*:\s*(.*)$/i) || rawExpress.match(/\((.*?)\)/);
      if (noteMatch) {
        expressNote = noteMatch[1].trim();
      }
    }
  }

  const rawExpNote = getVal("express note", "express notes", "rush note", "rush details");
  if (rawExpNote && !expressNote) {
    expressNote = rawExpNote.trim();
  }

  // 11. Notes
  const rawNotes = getVal("notes", "internal notes", "special instructions", "note", "details");
  let internalNotes = rawNotes.trim();
  if (internalNotes.toLowerCase() === "none" || internalNotes.toLowerCase() === "n/a" || internalNotes === "-") {
    internalNotes = "";
  }

  // 12. Priority
  const rawPriority = getVal("priority", "order priority", "urgency");
  let priority: OrderPriority = expressOrder === "Yes" ? "Urgent" : "Normal";
  if (rawPriority) {
    const pLower = rawPriority.toLowerCase();
    if (pLower.includes("urgent") || pLower.includes("rush")) priority = "Urgent";
    else if (pLower.includes("high")) priority = "High";
    else if (pLower.includes("low")) priority = "Low";
    else priority = "Normal";
  }

  // 13. Assigned Staff
  const assignedStaff = getVal("assigned staff", "staff", "assigned to", "operator", "assigned").trim();

  // 14. Deposit
  const rawDeposit = getVal("deposit", "deposit amount", "deposit received", "deposit paid");
  let depositAmount = 0;
  if (rawDeposit) {
    depositAmount = parseFloat(rawDeposit.replace(/[^0-9.]/g, "")) || 0;
  }

  // 15. Invoice Logged
  const rawInvoice = getVal("invoice logged", "invoice", "invoice status", "invoiced", "invoice verified");
  let invoiceLogged = false;
  if (rawInvoice) {
    const invLower = rawInvoice.toLowerCase();
    if (invLower.includes("yes") || invLower.includes("true") || invLower.includes("logged") || invLower.includes("verified")) {
      invoiceLogged = true;
    }
  }

  const orderId = `ORD-${Date.now()}-${index}`;

  const order: OperationsOrder = {
    id: orderId,
    orderNumber,
    clientId: "",
    clientName,
    clientTier,
    clientPhone,
    items,
    quantityTotal: totalQuantity,
    orderDate: dateOrderCreated,
    createdDate: dateOrderCreated,
    dateOrderCreated,
    dueDate,
    productionStatus,
    deliveryMethod,
    deliveryLocation,
    priority,
    depositPaid: depositAmount > 0,
    depositAmount,
    totalAmount,
    assignedStaff,
    internalNotes,
    clientHome: "CEO Lifestyle",
    adventist: "No",
    expressOrder,
    expressNote,
    invoiceLogged,
    updatedDate: todayIso
  };

  const productSummary = items.map(i => `${i.quantity}x ${i.productName}`).join(", ");

  const rawRow: Record<string, string> = {
    "Order Number": orderNumber,
    "Client Name": clientName,
    "Tier": clientTier || "Silver",
    "Phone": clientPhone || "N/A",
    "Products": productSummary,
    "Cost": totalAmount > 0 ? `$${totalAmount.toLocaleString()}` : "$0",
    "Status": productionStatus,
    "Due Date": dueDate,
    "Delivery Method": deliveryMethod,
    "Location": deliveryLocation || "Office",
    "Express": expressOrder,
    "Notes": internalNotes || "None"
  };

  return { order, rawRow };
}

/**
 * Universal text parsing that seamlessly routes to block parser or spreadsheet parser
 */
export function parseUniversalPasteText(
  templateType: "clients" | "aspiring" | "tier_register" | "inventory" | "sales" | "operations" | "milestones",
  text: string
): ParsedPasteResult {
  if (!text || !text.trim()) {
    return {
      headers: [],
      rawRows: [],
      mappedItems: [],
      totalRows: 0,
      validCount: 0,
      warningCount: 0,
      errors: ["No data rows found in pasted text."]
    };
  }

  // 1. If Operations template and text is structured as block updates
  if (templateType === "operations" && isOperationsBlockText(text)) {
    const blocks = splitOrderBlocks(text);
    const mappedOrders: OperationsOrder[] = [];
    const previewRows: any[] = [];
    const errors: string[] = [];

    blocks.forEach((block, idx) => {
      const parsed = parseSingleOperationsOrderBlock(block, idx);
      if (parsed.order && parsed.rawRow) {
        mappedOrders.push(parsed.order);
        previewRows.push(parsed.rawRow);
      } else {
        errors.push(`Block ${idx + 1}: ${parsed.error || "Missing explicit Order Number. Skipped to prevent phantom orders."}`);
      }
    });

    const headers = [
      "Order Number",
      "Client Name",
      "Tier",
      "Phone",
      "Products",
      "Cost",
      "Status",
      "Due Date",
      "Delivery Method",
      "Location",
      "Express",
      "Notes"
    ];

    return {
      headers,
      rawRows: previewRows,
      mappedItems: mappedOrders,
      totalRows: mappedOrders.length,
      validCount: mappedOrders.length,
      warningCount: errors.length,
      errors
    };
  }

  // 2. Standard spreadsheet/tabular parsing
  const { rawRows } = parseSpreadsheetClipboardText(text);
  return processPastedDomainRows(templateType, rawRows);
}

/**
 * Maps raw spreadsheet rows into domain objects based on template type
 */
export function processPastedDomainRows(
  templateType: "clients" | "aspiring" | "tier_register" | "inventory" | "sales" | "operations" | "milestones",
  rawRows: any[]
): ParsedPasteResult {
  const errors: string[] = [];
  let validCount = 0;
  let warningCount = 0;
  const mappedItems: any[] = [];

  if (rawRows.length === 0) {
    return {
      headers: [],
      rawRows: [],
      mappedItems: [],
      totalRows: 0,
      validCount: 0,
      warningCount: 0,
      errors: ["No data rows found in pasted text."]
    };
  }

  const headers = Object.keys(rawRows[0] || {});

  rawRows.forEach((row, index) => {
    const rowNum = index + 1;

    switch (templateType) {
      case "clients": {
        try {
          const client = flatRowToCustomer(row);
          if (!client.firstName && !client.lastName) {
            warningCount++;
            errors.push(`Row ${rowNum}: Missing Client Name. Defaulted to 'New Client'.`);
          } else {
            validCount++;
          }
          mappedItems.push(client);
        } catch (err: any) {
          warningCount++;
          errors.push(`Row ${rowNum}: Error converting client (${err.message}).`);
        }
        break;
      }

      case "aspiring": {
        const name = row["Name"] || row["Client Name"] || row["Full Name"] || row["Aspiring Client"] || "";
        const contactInfo = row["Contact Info"] || row["Phone"] || row["Email"] || row["Contact"] || "";
        const source = row["Source of Inquiry"] || row["Source"] || row["Inquiry Source"] || "Referral";
        const service = row["Service Interested In"] || row["Service"] || row["Interest"] || "Executive Services";
        const notes = row["Notes"] || row["Details"] || "";
        const status = row["Status"] || "Follow Up Required";
        const dateContacted = row["Date Contacted"] || row["Date"] || new Date().toISOString().split("T")[0];

        if (!name) {
          warningCount++;
          errors.push(`Row ${rowNum}: Missing Aspiring Client Name.`);
        } else {
          validCount++;
        }

        mappedItems.push({
          id: row["ID"] || `ASP_${Date.now()}_${index}`,
          name: name || `Lead ${index + 1}`,
          contactInfo,
          sourceOfInquiry: source,
          serviceInterestedIn: service,
          dateContacted,
          notes,
          assignedUser: row["Assigned User"] || "Chief Executive Officer",
          status,
          followUpDate: row["Follow Up Date"] || dateContacted,
          followUpCount: parseInt(row["Follow Up Count"]) || 0
        });
        break;
      }

      case "tier_register": {
        const id = row["CL ID"] || row["Client ID"] || row["id"] || `CL${index + 100}`;
        const name = row["Client Full Name"] || row["Client Name"] || row["Name"] || "";
        const tier = row["Final Tier"] || row["Client Tier"] || row["Tier"] || "Silver";

        if (!name && !id) {
          warningCount++;
          errors.push(`Row ${rowNum}: Missing Client ID and Name.`);
        } else {
          validCount++;
        }

        mappedItems.push({
          id,
          fullName: name || "Client Record",
          tier,
          businessRelationship: row["Business Relationship"] || "CEO Lifestyle",
          managementClassification: row["Management Classification"] || "Standard",
          tierSource: row["Tier Source"] || "Manual",
          manualTierReason: row["Manual Tier Reason"] || "",
          healthScore: parseInt(row["Health Score"]) || 75
        });
        break;
      }

      case "inventory": {
        const title = row["Title"] || row["Book Title"] || row["Item Name"] || row["Name"] || "";
        const author = row["Author"] || row["Brand"] || "CEO Lifestyle";
        const rawPrice = row["Price (JMD)"] || row["Price"] || row["Unit Price"] || 0;
        const rawStock = row["Total Stock"] || row["Quantity"] || row["Stock"] || 0;

        const price = typeof rawPrice === "number" ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, "")) || 0;
        const totalStock = typeof rawStock === "number" ? rawStock : parseInt(String(rawStock).replace(/[^0-9]/g, "")) || 0;

        if (!title) {
          warningCount++;
          errors.push(`Row ${rowNum}: Missing Book Title / Item Name.`);
        } else {
          validCount++;
        }

        mappedItems.push({
          id: row["ID"] || `BOOK_${Date.now()}_${index}`,
          title: title || `Untitled Item ${index + 1}`,
          author,
          isbn: row["ISBN"] || "",
          price,
          totalStock,
          inStore: parseInt(row["In Store"]) || Math.floor(totalStock / 2),
          inOffice: parseInt(row["In Office"]) || Math.ceil(totalStock / 2),
          allocatedToClients: 0,
          category: row["Category"] || "Books",
          status: row["Status"] || "Active",
          bookRank: (() => {
            const raw = (row["Book Rank"] || row["Rank"] || row["Classification"] || row["BookRank"] || row["bookRank"] || "").trim();
            if (!raw) return undefined;
            return raw;
          })()
        });
        break;
      }

      case "sales": {
        const title = row["Title"] || row["Book Title"] || row["Item Name"] || "";
        const qty = parseInt(row["Quantity"] || row["Qty"] || 1);
        const price = parseFloat(row["Unit Price"] || row["Price"] || 0);

        if (!title) {
          warningCount++;
          errors.push(`Row ${rowNum}: Missing Item Title.`);
        } else {
          validCount++;
        }

        mappedItems.push({
          id: `SALE_${Date.now()}_${index}`,
          bookTitle: title || "Item",
          quantitySold: qty,
          unitPriceJmd: price,
          actionDate: row["Action Date"] || row["Date"] || new Date().toISOString().split("T")[0],
          customerName: row["Customer"] || row["Client"] || "General Sale",
          notes: row["Notes"] || ""
        });
        break;
      }

      case "operations": {
        const rawOrderNum = row["Order Number"] || row["Order #"] || row["Job ID"] || row["Order ID"] || row["ID"] || "";
        const clientName = row["Client Name"] || row["Client"] || row["Customer Name"] || row["Customer"] || row["Name"] || "Valued Client";
        const tier = (row["Tier"] || row["Client Tier"] || "Silver") as ClientTier;
        const phone = row["Phone"] || row["Client Phone"] || row["Phone Number"] || "N/A";
        const productsRaw = row["Products"] || row["Product"] || row["Items"] || row["Item Description"] || row["Description"] || row["Item"] || "";
        const { items, totalQuantity } = parseProductsString(productsRaw);
        
        const rawCost = row["Cost"] || row["Cost of Order"] || row["Total Amount"] || row["Total Value (JMD)"] || row["Total Value"] || row["Price"] || 0;
        const totalAmount = typeof rawCost === "number" ? rawCost : (parseFloat(String(rawCost).replace(/[^0-9.]/g, "")) || 0);

        const rawDeposit = row["Deposit"] || row["Deposit Received (JMD)"] || row["Deposit Received"] || row["Deposit Amount"] || 0;
        const depositAmount = typeof rawDeposit === "number" ? rawDeposit : (parseFloat(String(rawDeposit).replace(/[^0-9.]/g, "")) || 0);

        const statusRaw = row["Status"] || row["Production Status"] || "New";
        let productionStatus: ProductionStatus = "New";
        const sLower = String(statusRaw).toLowerCase();
        if (sLower.includes("ready for delivery")) productionStatus = "Ready for Delivery";
        else if (sLower.includes("ready for collection")) productionStatus = "Ready for Collection";
        else if (sLower.includes("ready for pickup")) productionStatus = "Ready for Pickup";
        else if (sLower.includes("ready for production")) productionStatus = "Ready for Production";
        else if (sLower.includes("out for delivery")) productionStatus = "Out for Delivery";
        else if (sLower.includes("in progress")) productionStatus = "In Progress";
        else if (sLower.includes("in production")) productionStatus = "In Production";
        else if (sLower.includes("quality check")) productionStatus = "Quality Check";
        else if (sLower.includes("completed") || sLower.includes("delivered")) productionStatus = "Completed";
        else if (sLower.includes("awaiting deposit")) productionStatus = "Awaiting Deposit";
        else if (sLower.includes("awaiting artwork")) productionStatus = "Awaiting Artwork";
        else if (sLower.includes("confirmed") || sLower.includes("deposit confirmed")) productionStatus = "Confirmed";
        else if (sLower.includes("cancelled")) productionStatus = "Cancelled";
        else if (sLower.includes("ready")) productionStatus = "Ready";

        const todayIso = new Date().toISOString().split("T")[0];
        const dueDate = row["Due Date"] || row["Target Due Date"] || row["Target Delivery Date"] || row["Delivery Date"] || todayIso;
        const dateCreated = row["Date Order Created"] || row["Created Date"] || row["Date Created"] || row["Order Date"] || todayIso;

        const deliveryMethodRaw = row["Delivery Method"] || row["Method"] || "Store Pickup";
        let deliveryMethod: OperationsDeliveryMethod = "Store Pickup";
        let deliveryLocation = row["Location"] || row["Delivery Location"] || row["Branch"] || "";

        const dLower = String(deliveryMethodRaw).toLowerCase();
        if (dLower.includes("knutsford")) deliveryMethod = "Knutsford Express";
        else if (dLower.includes("store") || dLower.includes("pickup")) deliveryMethod = "Store Pickup";
        else if (dLower.includes("personal")) deliveryMethod = "Personal Delivery";
        else if (dLower.includes("tara")) deliveryMethod = "Tara Courier";
        else deliveryMethod = "Other";

        const expressRaw = row["Express"] || row["Express Order"] || row["Is Express"] || "";
        const isExpress = ["yes", "true", "y", "express"].includes(String(expressRaw).trim().toLowerCase());
        const expressNote = row["Express Note"] || row["Express Notes"] || row["Rush Note"] || "";

        if (!rawOrderNum || !String(rawOrderNum).trim() || String(rawOrderNum).trim().toLowerCase() === "none" || String(rawOrderNum).trim().toLowerCase() === "n/a") {
          warningCount++;
          errors.push(`Row ${rowNum}: Missing explicit Order Number. Skipped to prevent phantom orders.`);
          break;
        }

        if (!clientName && !productsRaw) {
          warningCount++;
          errors.push(`Row ${rowNum}: Missing Client Name or Products.`);
          break;
        } else {
          validCount++;
        }

        const trimmedOrderNum = String(rawOrderNum).trim();
        const orderNumber = trimmedOrderNum.startsWith("#") || trimmedOrderNum.startsWith("ORD-")
          ? trimmedOrderNum
          : (/^\d+$/.test(trimmedOrderNum) ? `#${trimmedOrderNum}` : trimmedOrderNum);

        const order: OperationsOrder = {
          id: `ORD_${Date.now()}_${index}`,
          orderNumber,
          clientId: "",
          clientName,
          clientTier: tier,
          clientPhone: phone,
          items,
          quantityTotal: totalQuantity,
          orderDate: dateCreated,
          createdDate: dateCreated,
          dateOrderCreated: dateCreated,
          dueDate,
          productionStatus,
          deliveryMethod,
          deliveryLocation,
          priority: isExpress ? "Urgent" : "Normal",
          depositPaid: depositAmount > 0,
          depositAmount,
          totalAmount,
          assignedStaff: row["Assigned Staff"] || row["Staff"] || "",
          internalNotes: row["Notes"] || row["Internal Notes"] || "",
          clientHome: "CEO Lifestyle",
          adventist: "No",
          expressOrder: isExpress ? "Yes" : "No",
          expressNote,
          updatedDate: todayIso
        };

        mappedItems.push(order);
        break;
      }

      case "milestones": {
        const title = row["Title"] || row["Event Title"] || row["Milestone"] || "";
        const date = row["Date"] || row["Event Date"] || "";

        if (!title || !date) {
          warningCount++;
          errors.push(`Row ${rowNum}: Missing Title or Date.`);
        } else {
          validCount++;
        }

        mappedItems.push({
          id: `MS_${Date.now()}_${index}`,
          title: title || "Milestone Event",
          date,
          clientId: row["Client ID"] || "",
          clientName: row["Client Name"] || "",
          category: row["Category"] || "Relationship Milestone",
          notes: row["Notes"] || ""
        });
        break;
      }
    }
  });

  return {
    headers,
    rawRows,
    mappedItems,
    totalRows: rawRows.length,
    validCount,
    warningCount,
    errors
  };
}
