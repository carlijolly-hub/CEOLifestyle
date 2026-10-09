import { SavedQuotation } from "../types";

export function normalizeQuotation(q: any): SavedQuotation {
  if (!q || typeof q !== "object") {
    return {
      id: `quote_err_${Math.random().toString(36).substring(2, 7)}`,
      toolType: "layout",
      clientName: "Unknown Client",
      title: "Unspecified Quotation",
      date: new Date().toISOString().split("T")[0],
      totalCost: 0,
      quotedPrice: 0,
      details: "No details available."
    };
  }

  const clientName = q.clientName || q.customerName || q.client || "Client Reference";
  const title = q.title || q.summaryText || q.quoteNumber || `${(q.toolType || "Production").toUpperCase()} Quotation`;
  const details = q.details || q.summaryText || q.formattedResponseText || "Standard production quotation details.";
  const date = q.date || (q.createdAt ? q.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]);
  
  const rawPrice = typeof q.quotedPrice === "number" ? q.quotedPrice :
                   typeof q.totalJMD === "number" ? q.totalJMD :
                   typeof q.totalCost === "number" ? q.totalCost : 0;
                   
  const rawCost = typeof q.totalCost === "number" ? q.totalCost :
                  typeof q.subtotalJMD === "number" ? q.subtotalJMD : rawPrice;

  return {
    ...q,
    id: q.id || `quote_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    toolType: q.toolType || "layout",
    clientName,
    title,
    date,
    totalCost: Number.isNaN(rawCost) ? 0 : rawCost,
    quotedPrice: Number.isNaN(rawPrice) ? 0 : rawPrice,
    details,
    totalJMD: typeof q.totalJMD === "number" ? q.totalJMD : rawPrice,
    summaryText: q.summaryText || title,
    isFavorite: Boolean(q.isFavorite),
    favoritedAt: q.favoritedAt || (q.isFavorite ? q.createdAt || new Date().toISOString() : undefined),
    displayOrder: typeof q.displayOrder === "number" ? q.displayOrder : undefined,
    clientType: q.clientType || undefined
  };
}

export function validateQuotation(q: Partial<SavedQuotation>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!q.clientName || !q.clientName.trim()) {
    errors.push("Missing customer/reference name");
  }
  if (typeof q.quotedPrice !== "number" && typeof q.totalJMD !== "number") {
    errors.push("Missing valid quote total amount");
  }
  return {
    valid: errors.length === 0,
    errors
  };
}
