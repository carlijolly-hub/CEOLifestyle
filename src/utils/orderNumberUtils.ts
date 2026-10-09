import { OperationsOrder } from "../types";

/**
 * Generates the next sequential unique order number from existing orders.
 * Scans all existing order numbers for numeric values, finds max, adds 1,
 * and formats as #000XXX (or #00XXXX).
 * Guarantees no collisions with any existing orders.
 */
export function getNextOrderNumber(orders: (OperationsOrder | { orderNumber?: string; id?: string })[]): string {
  let maxNum = 420; // baseline starting point
  const existingNumbers = new Set<string>();

  (orders || []).forEach(o => {
    if (o.orderNumber) {
      const trimmed = String(o.orderNumber).trim();
      existingNumbers.add(trimmed);
      const match = trimmed.match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        if (!isNaN(val) && val > maxNum && val < 999999) {
          maxNum = val;
        }
      }
    }
    if (o.id) {
      const trimmedId = String(o.id).trim();
      existingNumbers.add(trimmedId);
      const match = trimmedId.match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        if (!isNaN(val) && val > maxNum && val < 999999) {
          maxNum = val;
        }
      }
    }
  });

  let candidateNum = maxNum + 1;
  let candidateStr = candidateNum < 1000 ? `#000${candidateNum}` : `#${String(candidateNum).padStart(6, "0")}`;

  while (existingNumbers.has(candidateStr) || (orders || []).some(o => o.orderNumber === candidateStr)) {
    candidateNum++;
    candidateStr = candidateNum < 1000 ? `#000${candidateNum}` : `#${String(candidateNum).padStart(6, "0")}`;
  }

  return candidateStr;
}

/**
 * Normalizes an order record to ensure all required fields have reliable fallbacks.
 * Preserves Created Date, Order Number, and Invoice Logged status without data corruption.
 */
export function normalizeOperationsOrder(raw: any, existingOrders?: OperationsOrder[]): OperationsOrder {
  const todayIso = new Date().toISOString().split("T")[0];
  
  const orderNumber = raw.orderNumber 
    ? String(raw.orderNumber).trim() 
    : getNextOrderNumber(existingOrders || []);

  const createdDate = raw.createdDate || raw.dateOrderCreated || raw.orderDate || todayIso;
  const dateOrderCreated = raw.dateOrderCreated || raw.createdDate || raw.orderDate || todayIso;
  const dueDate = raw.dueDate || raw.orderDate || todayIso;

  const rawStatus = raw.productionStatus || raw.status || "New";
  const validStatuses = [
    "New",
    "Confirmed",
    "In Progress",
    "In Production",
    "Ready for Collection",
    "Ready for Pickup",
    "Ready for Delivery",
    "Ready for Dispatch",
    "Out for Delivery",
    "Delivered",
    "Completed",
    "Cancelled"
  ];
  const productionStatus = validStatuses.includes(rawStatus) ? rawStatus : "New";

  return {
    ...raw,
    id: raw.id || `ORD-${orderNumber.replace(/[^0-9]/g, "") || Date.now()}`,
    orderNumber,
    clientId: raw.clientId || "",
    clientName: raw.clientName || "Walk-In Client",
    clientTier: raw.clientTier || raw.tier || "Silver",
    clientPhone: raw.clientPhone || raw.phone || "",
    items: Array.isArray(raw.items) ? raw.items : (typeof raw.items === "string" ? raw.items : []),
    quantityTotal: typeof raw.quantityTotal === "number" ? raw.quantityTotal : (Array.isArray(raw.items) ? raw.items.reduce((s: number, i: any) => s + (i.quantity || 1), 0) : 1),
    orderDate: raw.orderDate || createdDate,
    dueDate,
    productionStatus,
    deliveryMethod: raw.deliveryMethod || "Store Pickup",
    deliveryLocation: raw.deliveryLocation || "Fresh Drip Outlet",
    assignedStaff: raw.assignedStaff || "",
    internalNotes: raw.internalNotes || raw.notes || "",
    priority: raw.priority || "Normal",
    depositPaid: raw.depositPaid ?? true,
    depositAmount: typeof raw.depositAmount === "number" ? raw.depositAmount : 0,
    totalAmount: typeof raw.totalAmount === "number" ? raw.totalAmount : (typeof raw.costOfOrder === "number" ? raw.costOfOrder : (typeof raw.cost === "number" ? raw.cost : 0)),
    createdDate,
    dateOrderCreated,
    updatedDate: raw.updatedDate || todayIso,
    checklist: Array.isArray(raw.checklist) ? raw.checklist : [],
    checklistTemplateName: raw.checklistTemplateName || "",
    company: (raw.company === "Librarium Luxe" || raw.company === "CEO Lifestyle")
      ? raw.company
      : (raw.clientHome === "Librarium Luxe" || /book|hardcover|paperback|novel|librarium/i.test(typeof raw.items === "string" ? raw.items : (Array.isArray(raw.items) ? raw.items.map((i: any) => i?.productName || "").join(" ") : "")) ? "Librarium Luxe" : "CEO Lifestyle"),
    clientHome: raw.clientHome || "CEO Lifestyle",
    adventist: raw.adventist || "No",
    expressOrder: raw.expressOrder || "No",
    expressNote: raw.expressNote || "",
    fulfillmentSnapshot: Array.isArray(raw.fulfillmentSnapshot) ? raw.fulfillmentSnapshot : undefined,
    invoiceLogged: typeof raw.invoiceLogged === "boolean" ? raw.invoiceLogged : false,
    invoiceLoggedDate: raw.invoiceLoggedDate || (raw.invoiceLogged ? createdDate : undefined)
  };
}
