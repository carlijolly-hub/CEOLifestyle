import { SystemSettings, ProductionMaterialPreset, DTFSupplier, DTFPricingPreset, DeliveryMethod, SystemQuoteTemplate, ProductionChecklistTemplate } from "../types";

export const DEFAULT_QUOTE_TEMPLATES: SystemQuoteTemplate[] = [
  {
    id: "tpl_customer_response",
    name: "Customer Response",
    category: "Customer Communication",
    toolKey: "general",
    description: "Standard opening greeting and introduction used before customer quotation breakdowns.",
    placeholders: ["{CustomerName}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Thank you so much for providing those details.

Here is your personalized quotation based on your request.`
  },
  {
    id: "tpl_apparel_quote",
    name: "T-Shirt Studio Quote",
    category: "Sales Quotes",
    toolKey: "apparel",
    description: "Standardized customer quotation layout for T-Shirts, Polos, Oxfords & Apparel orders.",
    placeholders: ["{CustomerResponse}", "{GarmentItems}", "{AdditionalCharges}", "{DiscountPercent}", "{DiscountAmount}", "{GrandTotal}", "{DeliveryMethod}", "{DeliveryMessage}"],
    active: true,
    isDefault: true,
    content: `{CustomerResponse}

{GarmentItems}

{IF:AdditionalCharges}
Additional Charges
{AdditionalCharges}
{/IF}

{IF:DiscountAmount}
Discount
* You save {DiscountPercent}% = {DiscountAmount}
{/IF}

Total: {GrandTotal}
(Includes garments with printing unless otherwise stated.)

{IF:DeliveryMessage}
Delivery Method: {DeliveryMethod}
{DeliveryMessage}
{/IF}

Let me know if you would like to proceed.`
  },
  {
    id: "tpl_book_quote",
    name: "Librarium Book Quote",
    category: "Sales Quotes",
    toolKey: "book",
    description: "Standardized quotation for imported book orders, quantity tiers, and delivery charges.",
    placeholders: ["{CustomerResponse}", "{BookTitle}", "{Quantity}", "{QuantityUnit}", "{UnitPrice}", "{BooksSubtotal}", "{TargetDestination}", "{DeliveryMethod}", "{DeliveryCharge}", "{DiscountPercent}", "{DiscountAmount}", "{GrandTotal}", "{DeliveryMessage}"],
    active: true,
    isDefault: true,
    content: `{CustomerResponse}

Book:
{BookTitle}

Quantity
* {Quantity} {QuantityUnit} @ {UnitPrice} each = {BooksSubtotal}

{IF:AdditionalCharges}
Additional Charges
{AdditionalCharges}
{/IF}

{IF:TargetDestination}
Target Destination: {TargetDestination}
{/IF}

{IF:DiscountAmount}
Discount
* You save {DiscountPercent}% = {DiscountAmount}
{/IF}

Total: {GrandTotal}
(Includes the selected book unless otherwise stated.)

{IF:DeliveryMessage}
Delivery Method: {DeliveryMethod}
{DeliveryMessage}
{/IF}

Let me know if you would like to proceed.`
  },
  {
    id: "tpl_multi_book_quote",
    name: "Multi-Book Quote",
    category: "Sales Quotes",
    toolKey: "book",
    description: "Standardized quotation for multi-book orders, book bundles, and custom quantities.",
    placeholders: ["{CustomerResponse}", "{BooksList}", "{Quantity}", "{BooksSubtotal}", "{TargetDestination}", "{AdditionalCharges}", "{DeliveryMethod}", "{DeliveryCharge}", "{DiscountPercent}", "{DiscountAmount}", "{GrandTotal}", "{DeliveryMessage}"],
    active: true,
    isDefault: true,
    content: `{CustomerResponse}

Books Selected:
{BooksList}

{IF:AdditionalCharges}
Additional Charges
{AdditionalCharges}
{/IF}

Subtotal: {BooksSubtotal}

{IF:TargetDestination}
Target Destination: {TargetDestination}
{/IF}

{IF:DiscountAmount}
Discount
* You save {DiscountPercent}% = {DiscountAmount}
{/IF}

Total: {GrandTotal}

{IF:DeliveryMessage}
Delivery Method: {DeliveryMethod}
{DeliveryMessage}
{/IF}

Let me know if you would like to proceed.`
  },
  {
    id: "tpl_dtf_quote",
    name: "DTF Printing Quote",
    category: "Sales Quotes",
    toolKey: "dtf",
    description: "Standardized quotation for direct-to-film transfer prints, sizing presets, and delivery.",
    placeholders: ["{CustomerResponse}", "{PrintSize}", "{Quantity}", "{UnitPrice}", "{Subtotal}", "{TargetDestination}", "{DeliveryMethod}", "{DeliveryCharge}", "{DiscountPercent}", "{DiscountAmount}", "{GrandTotal}", "{DeliveryMessage}"],
    active: true,
    isDefault: true,
    content: `{CustomerResponse}

Print Details:
* Size: {PrintSize}
* Quantity: {Quantity} prints @ {UnitPrice} each = {Subtotal}

{IF:AdditionalCharges}
Additional Charges
{AdditionalCharges}
{/IF}

{IF:TargetDestination}
Target Destination: {TargetDestination}
{/IF}

{IF:DiscountAmount}
Discount
* You save {DiscountPercent}% = {DiscountAmount}
{/IF}

Total: {GrandTotal}
(Includes DTF printing unless otherwise stated.)

{IF:DeliveryMessage}
Delivery Method: {DeliveryMethod}
{DeliveryMessage}
{/IF}

Let me know if you would like to proceed.`
  },
  {
    id: "tpl_production_layout_quote",
    name: "Production Layout Quotation",
    category: "Sales Quotes",
    toolKey: "production_layout",
    description: "Quotation for custom sheet & material production layouts.",
    placeholders: ["{CustomerResponse}", "{MaterialName}", "{SheetSpecs}", "{Quantity}", "{UnitPrice}", "{Subtotal}", "{DeliveryMethod}", "{DeliveryCharge}", "{DiscountPercent}", "{DiscountAmount}", "{GrandTotal}", "{DeliveryMessage}"],
    active: true,
    isDefault: true,
    content: `{CustomerResponse}

Production Details:
* Material: {MaterialName}
* Sheet Specs: {SheetSpecs}
* Quantity: {Quantity} sheets @ {UnitPrice} each = {Subtotal}

{IF:AdditionalCharges}
Additional Charges
{AdditionalCharges}
{/IF}

{IF:DiscountAmount}
Discount
* You save {DiscountPercent}% = {DiscountAmount}
{/IF}

Total: {GrandTotal}
(Includes printing and design unless otherwise stated.)

{IF:DeliveryMessage}
Delivery Method: {DeliveryMethod}
{DeliveryMessage}
{/IF}

Let me know if you would like to proceed.`
  },
  {
    id: "tpl_location_logistics_quote",
    name: "Location Logistics Quotation",
    category: "Sales Quotes",
    toolKey: "location",
    description: "Quotation template for event venue setup and location logistics.",
    placeholders: ["{CustomerResponse}", "{ParishLocation}", "{ServiceTier}", "{DiscountPercent}", "{DiscountAmount}", "{GrandTotal}", "{DeliveryMessage}"],
    active: true,
    isDefault: true,
    content: `{CustomerResponse}

Logistics Details:
* Location / Parish: {ParishLocation}
* Service Tier: {ServiceTier}

{IF:DiscountAmount}
Discount
* You save {DiscountPercent}% = {DiscountAmount}
{/IF}

Total: {GrandTotal}

{IF:DeliveryMessage}
Delivery Method: {DeliveryMethod}
{DeliveryMessage}
{/IF}

Let me know if you would like to proceed.`
  },
  {
    id: "tpl_ops_board_message",
    name: "Operations Board Messages",
    category: "Operations",
    toolKey: "general",
    description: "Copy-and-paste format for operations board task updates and fulfillment cards.",
    placeholders: ["{OrderNumber}", "{CustomerName}", "{ProductionStatus}", "{DueDate}", "{DeliveryMethod}", "{TargetDestination}", "{InternalNotes}"],
    active: true,
    isDefault: true,
    content: `ORDER OPERATIONAL DETAILS:
Order #{OrderNumber} — {CustomerName}
Status: {ProductionStatus}
Due Date: {DueDate}
Delivery Method: {DeliveryMethod}
Target Destination: {TargetDestination}
Internal Notes: {InternalNotes}`
  },
  {
    id: "tpl_delivery_messages",
    name: "Delivery Messages",
    category: "Operations",
    toolKey: "general",
    description: "Logistics dispatch instructions and collection notifications sent to recipients.",
    placeholders: ["{CustomerName}", "{DeliveryMethod}", "{TargetDestination}", "{DeliveryMessage}"],
    active: true,
    isDefault: true,
    content: `DELIVERY LOGISTICS NOTICE:
Recipient: {CustomerName}
Method: {DeliveryMethod}
Destination: {TargetDestination}

{DeliveryMessage}`
  },
  {
    id: "tpl_payment_instructions",
    name: "Payment Instructions",
    category: "Operations",
    toolKey: "general",
    description: "Editable banking information and deposit payment guidelines.",
    placeholders: ["{CustomerName}", "{OrderNumber}", "{GrandTotal}", "{DepositAmount}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Dear {CustomerName},

Payment Details for Order #{OrderNumber}:
Bank: National Commercial Bank (NCB)
Account Name: {BusinessName}
Account Number: 123456789
Branch: Montego Bay

Total Order Amount: {GrandTotal}
Required 50% Deposit: {DepositAmount}

Please email your transfer proof to confirm your order and initiate production.`
  },
  {
    id: "tpl_followup_message",
    name: "Follow-up Messages",
    category: "Customer Communication",
    toolKey: "general",
    description: "Polite follow-up check-in sent to clients following quotation delivery.",
    placeholders: ["{CustomerName}", "{ItemTitle}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Hi {CustomerName},

I hope you're having a wonderful week! Following up regarding your personalized quotation for {ItemTitle}.

Please let us know if you have any questions or if you'd like us to confirm this order for production.

Warm regards,
{BusinessName}`
  },
  {
    id: "tpl_thank_you_message",
    name: "Thank You Messages",
    category: "Customer Communication",
    toolKey: "general",
    description: "Appreciation message sent to clients after successful fulfillment.",
    placeholders: ["{CustomerName}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Thank you so much for choosing {BusinessName}, {CustomerName}!

We truly appreciate your business and hope you love your completed order. If you need anything else, please feel free to reach out anytime.

Warm regards,
{BusinessName}`
  },
  {
    id: "tpl_reminder_message",
    name: "Reminder Messages",
    category: "Customer Communication",
    toolKey: "general",
    description: "Reminder notice for upcoming order deadlines, payments, or pickups.",
    placeholders: ["{CustomerName}", "{OrderNumber}", "{DueDate}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Hello {CustomerName},

This is a friendly reminder regarding your order #{OrderNumber} scheduled for {DueDate}.

Please reach out to us if you need any adjustments or updates.

Warm regards,
{BusinessName}`
  },
  {
    id: "tpl_inventory_notification",
    name: "Inventory Notifications",
    category: "Customer Communication",
    toolKey: "general",
    description: "Catalog stock update or restock notification sent to VIP clients.",
    placeholders: ["{BookTitle}", "{StockStatus}", "{Quantity}", "{Location}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Luxe Inventory Update:
Title: {BookTitle}
Status: {StockStatus}
Available Stock: {Quantity} copies at {Location}

Contact {BusinessName} today to reserve your copy!`
  },
  {
    id: "tpl_internal_ops_notes",
    name: "Internal Operations Notes",
    category: "Operations",
    toolKey: "general",
    description: "Standardized internal formatting for staff assignments and task notes.",
    placeholders: ["{CustomerName}", "{ClientTier}", "{Priority}", "{AssignedStaff}", "{InternalNotes}"],
    active: true,
    isDefault: true,
    content: `INTERNAL OPERATIONAL LOG
Client: {CustomerName} ({ClientTier} Tier)
Priority Level: {Priority}
Assigned Staff: {AssignedStaff}
Special Instructions: {InternalNotes}`
  }
];

export function isTruthyValue(val: any): boolean {
  if (val === undefined || val === null || val === false) return false;
  if (typeof val === "number") return val > 0;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    if (
      lower === "0" ||
      lower === "0%" ||
      lower === "0.00" ||
      lower === "0.00%" ||
      lower === "$0" ||
      lower === "$0.00" ||
      lower === "jmd 0" ||
      lower === "jmd 0.00" ||
      lower === "jmd $0" ||
      lower === "jmd $0.00" ||
      lower === "false" ||
      lower === "null" ||
      lower === "undefined" ||
      lower === "none"
    ) {
      return false;
    }
    return true;
  }
  return Boolean(val);
}

export function formatQuoteTemplate(
  templateContent: string,
  dataMap: Record<string, string | number>
): string {
  if (!templateContent) return "";
  let result = templateContent;

  // Process conditional blocks first:
  // Supports {IF:key}...{/IF}, [IF:key]...[/IF], {{#IF key}}...{{/IF}}
  const conditionalRegex = /(?:\{IF:([a-zA-Z0-9_]+)\}|\[IF:([a-zA-Z0-9_]+)\]|\{\{#IF\s+([a-zA-Z0-9_]+)\}\})([\s\S]*?)(?:\{\/IF\}|\[\/IF\]|\{\{\/IF\}\})/gi;

  result = result.replace(conditionalRegex, (_match, key1, key2, key3, innerContent) => {
    const key = key1 || key2 || key3;
    const val = dataMap[key];
    if (isTruthyValue(val)) {
      return innerContent;
    }
    return "";
  });

  const conditionalNotRegex = /(?:\{IF_NOT:([a-zA-Z0-9_]+)\}|\[IF_NOT:([a-zA-Z0-9_]+)\]|\{\{#IF_NOT\s+([a-zA-Z0-9_]+)\}\})([\s\S]*?)(?:\{\/IF_NOT\}|\[\/IF_NOT\]|\{\{\/IF_NOT\}\})/gi;

  result = result.replace(conditionalNotRegex, (_match, key1, key2, key3, innerContent) => {
    const key = key1 || key2 || key3;
    const val = dataMap[key];
    if (!isTruthyValue(val)) {
      return innerContent;
    }
    return "";
  });

  // Standard placeholder replacement
  Object.entries(dataMap).forEach(([key, val]) => {
    const stringVal = val !== undefined && val !== null ? String(val) : "";
    result = result.split(`{{${key}}}`).join(stringVal);
    result = result.split(`{${key}}`).join(stringVal);
  });

  // Alias support for Destination <-> TargetDestination
  if (dataMap.Destination !== undefined && dataMap.TargetDestination === undefined) {
    const stringVal = String(dataMap.Destination);
    result = result.split(`{{TargetDestination}}`).join(stringVal);
    result = result.split(`{TargetDestination}`).join(stringVal);
  } else if (dataMap.TargetDestination !== undefined && dataMap.Destination === undefined) {
    const stringVal = String(dataMap.TargetDestination);
    result = result.split(`{{Destination}}`).join(stringVal);
    result = result.split(`{Destination}`).join(stringVal);
  }

  // Cleanup unfulfilled {Placeholder} tags if any remain
  result = result.replace(/\{[a-zA-Z0-9_]+\}/g, "");

  // Smart line-by-line cleanup for un-tagged templates
  let lines = result.split("\n");
  lines = lines.filter(line => {
    const trimmed = line.trim();
    // Filter out zero-discount lines like "* You save 0% = JMD 0" or "* You save % = "
    if (/^\*\s*You save\s*(0%|0\.00%|%)?\s*=\s*(JMD\s*\$?0(\.00)?|\$0(\.00)?|0)?\s*$/i.test(trimmed)) {
      return false;
    }
    // Filter out zero-amount charge / fee / delivery bullet lines like "* Knutsford Express – JMD 0" or "* Delivery Fee – JMD $0"
    if (/^\*\s*.*–\s*(JMD\s*\$?0(\.00)?|\$0(\.00)?|0)\s*$/i.test(trimmed)) {
      return false;
    }
    if (/^\*\s*.*:\s*(JMD\s*\$?0(\.00)?|\$0(\.00)?|0)\s*$/i.test(trimmed)) {
      return false;
    }
    return true;
  });

  // Clean orphan section headers that have no content following them before another header/total
  const headerRegex = /^(Additional Charges|Additional Charges:|Discount|Discount:)\s*$/i;
  const nextSectionHeaderRegex = /^(Total\b.*|Delivery\b.*|Let me know if you would like to proceed.*|Additional Charges\b.*|Discount\b.*)$/i;

  const cleanedLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (headerRegex.test(line.trim())) {
      // Look ahead to see if there is any content before the next header or end
      let hasSubContent = false;
      for (let j = i + 1; j < lines.length; j++) {
        const ahead = lines[j].trim();
        if (!ahead) continue;
        if (nextSectionHeaderRegex.test(ahead)) {
          break;
        }
        hasSubContent = true;
        break;
      }
      if (!hasSubContent) {
        continue; // Skip orphan header!
      }
    }
    cleanedLines.push(line);
  }

  // Collapse 3+ consecutive newlines into 2 newlines
  result = cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return result;
}

export const DEFAULT_DELIVERY_METHODS: DeliveryMethod[] = [
  {
    id: "del_knutsford",
    name: "Knutsford Express",
    type: "shipping",
    defaultCost: 1350,
    active: true,
    messageTemplate: "Your order will be dispatched via Knutsford Express once your order has been processed.\n\nCollection details and tracking information will be provided once your order is ready for shipment.",
    estimatedTime: "24 Hours",
    notes: "Islandwide station-to-station delivery service.",
    trackingSupported: true
  },
  {
    id: "del_tara",
    name: "Tara Courier",
    type: "delivery",
    defaultCost: 1500,
    active: true,
    messageTemplate: "Your order will be delivered directly to your door via Tara Courier.\n\nTracking details and delivery schedule will be communicated upon dispatch.",
    estimatedTime: "1-2 Business Days",
    notes: "Door-to-door courier service across all 14 parishes.",
    trackingSupported: true
  },
  {
    id: "del_in_house",
    name: "In-House Delivery",
    type: "delivery",
    defaultCost: 2000,
    active: true,
    messageTemplate: "Your order will be hand-delivered by our executive VIP logistics team.\n\nOur team will contact you directly to confirm personal delivery arrangements.",
    estimatedTime: "Same Day / Next Day",
    notes: "Direct VIP drop-off for corporate and luxury clients."
  },
  {
    id: "del_office_collection",
    name: "Office Collection",
    type: "collection",
    defaultCost: 0,
    active: true,
    messageTemplate: "Your order will be available for pickup at our Kingston Head Office.\n\nCollection details and ready notification will be sent once processing is complete.",
    pickupLocation: "Kingston Head Office (Mon-Fri 9AM-5PM)",
    notes: "Free customer pickup at corporate office."
  },
  {
    id: "del_pickup",
    name: "Pickup",
    type: "collection",
    defaultCost: 0,
    active: true,
    messageTemplate: "Your order will be ready for pickup at our designated facility once your order has been processed.\n\nPlease present your order confirmation upon arrival.",
    pickupLocation: "Main Customer Fulfillment Center",
    notes: "Standard self-service collection."
  },
  {
    id: "del_customer_delivery",
    name: "Customer Delivery",
    type: "delivery",
    defaultCost: 1200,
    active: true,
    messageTemplate: "Your order will be dispatched directly to your specified recipient address.\n\nDelivery confirmation will be sent upon completion.",
    estimatedTime: "1-2 Business Days",
    notes: "Standard doorstep customer delivery."
  },
  {
    id: "del_local_courier",
    name: "Local Courier",
    type: "delivery",
    defaultCost: 1000,
    active: true,
    messageTemplate: "Your order will be dispatched via local urban courier.\n\nCourier driver contact details will be shared upon dispatch.",
    estimatedTime: "Same Day (Urban Area)",
    notes: "Fast local courier within Kingston & St. Andrew / St. Catherine."
  },
  {
    id: "del_intl_shipping",
    name: "International Shipping",
    type: "shipping",
    defaultCost: 8500,
    active: true,
    messageTemplate: "Your order will be shipped via DHL / FedEx International Express.\n\nInternational tracking number and customs documentation will be emailed once shipped.",
    estimatedTime: "3-5 Business Days",
    notes: "Global express air freight delivery.",
    trackingSupported: true
  }
];

export const DEFAULT_DTF_SUPPLIERS: DTFSupplier[] = [
  {
    id: "krz_prints",
    name: "KRZ Prints",
    sheetWidth: 12,
    sheetHeight: 17,
    costPerSheet: 800,
    deliveryCost: 0,
    notes: "Primary supplier.",
    active: true
  },
  {
    id: "earl_prints",
    name: "Earl Prints",
    sheetWidth: 12,
    sheetHeight: 12,
    costPerSheet: 2000,
    deliveryCost: 0,
    notes: "Alternative supplier.",
    active: true
  },
  {
    id: "large_format_supplier",
    name: "Large Format Supplier",
    sheetWidth: 22,
    sheetHeight: 14,
    costPerSheet: 1700,
    deliveryCost: 1400,
    notes: "Large format supplier.",
    active: true
  }
];

export const DEFAULT_DTF_PRICING: DTFPricingPreset[] = [
  {
    id: "dtf_p_4x4",
    sizeLabel: '4" × 4"',
    width: 4,
    height: 4,
    sellingPrice: 1500,
    active: true,
    notes: "Small badge / chest logo print"
  },
  {
    id: "dtf_p_12x10",
    sizeLabel: '12" × 10"',
    width: 12,
    height: 10,
    sellingPrice: 1750,
    active: true,
    notes: "Standard front or back shirt graphic"
  },
  {
    id: "dtf_p_combo_pocket_back",
    sizeLabel: 'Pocket 12" × 12" + Back 12" × 10"',
    width: 12,
    height: 12,
    sellingPrice: 2250,
    active: true,
    notes: "Pocket logo plus full back design bundle"
  },
  {
    id: "dtf_p_oversized",
    sizeLabel: "Oversized Print",
    width: 12,
    height: 17,
    sellingPrice: 3500,
    active: true,
    notes: "Oversized print tier ($3,500 - $4,500)"
  }
];

export const DEFAULT_PRODUCTION_MATERIALS: ProductionMaterialPreset[] = [
  { 
    id: "crack_peel", 
    name: "Crack & Peel Sticker Sheet", 
    width: 11, 
    height: 8.5, 
    cost: 375,
    supplierNotes: "Supplier A:\n$375 per sheet\n\nSupplier B:\n$350 per sheet (bulk order > 50 sheets)",
    alternativeSources: "Check Kingston supplier during local shortages.",
    supplierOptions: [
      { id: "sup-1", name: "Supplier A", costPerSheet: 375, notes: "Standard turnaround (2 days)" },
      { id: "sup-2", name: "Supplier B (Bulk)", costPerSheet: 350, minOrder: "50 sheets", notes: "Requires 4 days lead time" }
    ],
    pricingHistory: [
      { id: "ph-1", price: 375, date: "2026-07-01", reason: "Current standard contract rate", updatedBy: "Master Administrator" }
    ],
    lastUpdatedDate: "July 2026"
  },
  { 
    id: "card_a4", 
    name: "Card Stock (A4)", 
    width: 11, 
    height: 8.5, 
    cost: 375,
    supplierNotes: "Primary Paper Merchant:\n$375 per sheet\n\nHigh-volume discount available at 100+ sheets.",
    alternativeSources: "Apex Printing Supplies (Montego Bay)",
    supplierOptions: [
      { id: "sup-3", name: "Primary Paper Merchant", costPerSheet: 375 }
    ],
    pricingHistory: [
      { id: "ph-2", price: 375, date: "2026-06-15", reason: "Annual supplier rate confirmation", updatedBy: "Master Administrator" }
    ],
    lastUpdatedDate: "June 2026"
  },
  { 
    id: "card_legal", 
    name: "Card Stock (Legal)", 
    width: 14, 
    height: 8.5, 
    cost: 450,
    supplierNotes: "Supplier Price Update:\nCurrent Price: $450\nPrevious Price: $375\nReason: Supplier increase due to raw material import tariffs.",
    alternativeSources: "Direct Wholesale Import Co.",
    supplierOptions: [
      { id: "sup-4", name: "Direct Wholesale Import Co.", costPerSheet: 450 }
    ],
    pricingHistory: [
      { id: "ph-3", price: 375, date: "2026-01-10", reason: "Initial price tier", updatedBy: "Master Administrator" },
      { id: "ph-4", price: 450, date: "2026-07-20", reason: "Supplier increase (import tariffs)", updatedBy: "Master Administrator" }
    ],
    lastUpdatedDate: "July 2026"
  }
];

export const DEFAULT_CHECKLIST_TEMPLATES: ProductionChecklistTemplate[] = [
  {
    id: "template_magic_heart_cube",
    name: "Magic Heart Cube Checklist",
    category: "Gift Sets",
    description: "Assembly checklist for Magic Heart Cubes",
    items: [
      { id: "item_1", label: "Flowers", completed: false },
      { id: "item_2", label: "Chocolates", completed: false },
      { id: "item_3", label: "Photos", completed: false },
      { id: "item_4", label: "Money", completed: false },
      { id: "item_5", label: "Balloons", completed: false }
    ],
    isDefault: true
  },
  {
    id: "template_flower_arrangements",
    name: "Flower Arrangements Checklist",
    category: "Floral & Decor",
    description: "Quality assembly checklist for fresh flower arrangements",
    items: [
      { id: "item_1", label: "Fresh Flowers Inspection", completed: false },
      { id: "item_2", label: "Vase & Floral Foam Setup", completed: false },
      { id: "item_3", label: "Ribbon & Custom Tag", completed: false },
      { id: "item_4", label: "Personalized Card Insert", completed: false },
      { id: "item_5", label: "Flower Preservative Packet", completed: false },
      { id: "item_6", label: "Hydration & Packaging", completed: false }
    ],
    isDefault: true
  },
  {
    id: "template_tshirt_order",
    name: "T-Shirts Checklist",
    category: "Apparel",
    description: "Standard checklist for custom t-shirt printing and apparel orders",
    items: [
      { id: "item_1", label: "Garment Inspection", completed: false },
      { id: "item_2", label: "Printing Process", completed: false },
      { id: "item_3", label: "Quality Control Trim", completed: false },
      { id: "item_4", label: "Folding & Polybag", completed: false }
    ],
    isDefault: true
  },
  {
    id: "template_dtf_printing",
    name: "DTF Printing Checklist",
    category: "Printing",
    description: "Direct-to-Film transfer print and curing quality workflow",
    items: [
      { id: "item_1", label: "Vector Artwork File Check", completed: false },
      { id: "item_2", label: "Film Print Run", completed: false },
      { id: "item_3", label: "Hot Melt Powdering & Curing", completed: false },
      { id: "item_4", label: "Adhesion & Color Inspection", completed: false },
      { id: "item_5", label: "Protective Packaging", completed: false }
    ],
    isDefault: true
  },
  {
    id: "template_luxe_book_binding",
    name: "Books Checklist",
    category: "Librarium Books",
    description: "Craftsmanship checklist for luxury bound book editions",
    items: [
      { id: "item_1", label: "Leather Grain Inspection", completed: false },
      { id: "item_2", label: "Paper Stock Cut", completed: false },
      { id: "item_3", label: "Foil Stamping", completed: false },
      { id: "item_4", label: "Binding & Ribbon", completed: false },
      { id: "item_5", label: "Dust Jacket", completed: false },
      { id: "item_6", label: "Slipcase Box", completed: false }
    ],
    isDefault: true
  },
  {
    id: "template_engraving",
    name: "Engraving Checklist",
    category: "Engraving & Marking",
    description: "Precision laser engraving and surface finish inspection steps",
    items: [
      { id: "item_1", label: "Material Inspection", completed: false },
      { id: "item_2", label: "Vector File Alignment", completed: false },
      { id: "item_3", label: "Laser Power Calibration", completed: false },
      { id: "item_4", label: "Test Pass Verification", completed: false },
      { id: "item_5", label: "Final Engraving Pass", completed: false },
      { id: "item_6", label: "Surface Polish & Cleaning", completed: false }
    ],
    isDefault: true
  },
  {
    id: "template_custom_gifts",
    name: "Custom Gifts Checklist",
    category: "Bespoke Gifts",
    description: "Bespoke gift assembly, personalization, and luxury packaging checklist",
    items: [
      { id: "item_1", label: "Gift Box Selection", completed: false },
      { id: "item_2", label: "Custom Item Verification", completed: false },
      { id: "item_3", label: "Personalized Engraving / Print", completed: false },
      { id: "item_4", label: "Satin Ribbon & Bow", completed: false },
      { id: "item_5", label: "Handwritten Note Card", completed: false },
      { id: "item_6", label: "Outer Protection & Labeling", completed: false }
    ],
    isDefault: true
  }
];

export const DEFAULT_TARGET_DESTINATIONS: string[] = [
  "Kingston",
  "St. Andrew",
  "St. Thomas",
  "Portland",
  "St. Mary",
  "St. Ann",
  "Trelawny",
  "St. James",
  "Hanover",
  "Westmoreland",
  "St. Elizabeth",
  "Manchester",
  "Clarendon",
  "St. Catherine",
  "Montego Bay",
  "Ocho Rios",
  "Mandeville",
  "May Pen",
  "Portmore",
  "Savanna-la-Mar",
  "Fresh Drip Outlet",
  "Customer Pickup",
  "Other"
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  exchangeRate: 160,
  shippingSingleBook: 1350,
  shippingMultipleBooks: 1000,
  businessMarkupPercent: 25,
  roundingUpUnit: 100,
  lowStockThreshold: 2,
  restockThreshold: 5,
  outOfStockAlertRules: true,
  defaultBookStatus: "Active",
  inventoryWarningLevels: "Moderate",
  birthdayReminderDays: 14,
  anniversaryReminderDays: 14,
  proposalAnniversaryReminderDays: 14,
  customMilestoneReminderDays: 14,
  appName: "CEO Librarium CRM",
  footerText: ". © Since 2024 • CEO Lifestyle  The Home Of Endless Creativity",
  companyName: "CEO Lifestyle",
  businessSlogan: "The Home Of Endless Creativity",
  appLogo: "",
  appBg: "",
  authBg: "",
  masterUsername: "admin",
  sessionTimeoutMinutes: 30,
  autoLogoutTimerMinutes: 15,
  passwordPolicy: "Moderate",
  defaultDashboardView: "today",
  defaultCalendarView: "month",
  dateFormat: "YYYY-MM-DD",
  currencyDisplayFormat: "Standard",
  themePreference: "cosmic_slate",
  dashboardCarouselDefaultIndex: 0,
  luxeInventoryCarouselDefaultIndex: 0,
  productionMaterials: DEFAULT_PRODUCTION_MATERIALS,
  dtfSuppliers: DEFAULT_DTF_SUPPLIERS,
  dtfPricingPresets: DEFAULT_DTF_PRICING,
  deliveryMethods: DEFAULT_DELIVERY_METHODS,
  quoteTemplates: DEFAULT_QUOTE_TEMPLATES,
  checklistTemplates: DEFAULT_CHECKLIST_TEMPLATES,
  targetDestinations: DEFAULT_TARGET_DESTINATIONS
};

export function getSystemSettings(): SystemSettings {
  const stored = localStorage.getItem("librarium_system_settings");
  if (!stored) {
    // Attempt backward compatibility sync for wallpaper/username
    const compatSettings = { ...DEFAULT_SYSTEM_SETTINGS };
    const savedAppBg = localStorage.getItem("ceo_app_background_wallpaper");
    const savedAuthBg = localStorage.getItem("ceo_auth_background_wallpaper");
    const savedUsername = localStorage.getItem("ceo_admin_username");
    
    if (savedAppBg) compatSettings.appBg = savedAppBg;
    if (savedAuthBg) compatSettings.authBg = savedAuthBg;
    if (savedUsername) compatSettings.masterUsername = savedUsername;
    
    return compatSettings;
  }
  try {
    const parsed = JSON.parse(stored);
    if (!parsed.productionMaterials || !Array.isArray(parsed.productionMaterials) || parsed.productionMaterials.length === 0) {
      parsed.productionMaterials = DEFAULT_PRODUCTION_MATERIALS;
    }
    if (!parsed.dtfSuppliers || !Array.isArray(parsed.dtfSuppliers) || parsed.dtfSuppliers.length === 0) {
      parsed.dtfSuppliers = DEFAULT_DTF_SUPPLIERS;
    }
    if (!parsed.dtfPricingPresets || !Array.isArray(parsed.dtfPricingPresets) || parsed.dtfPricingPresets.length === 0) {
      parsed.dtfPricingPresets = DEFAULT_DTF_PRICING;
    }
    if (!parsed.deliveryMethods || !Array.isArray(parsed.deliveryMethods) || parsed.deliveryMethods.length === 0) {
      parsed.deliveryMethods = DEFAULT_DELIVERY_METHODS;
    }
    if (!parsed.quoteTemplates || !Array.isArray(parsed.quoteTemplates) || parsed.quoteTemplates.length === 0) {
      parsed.quoteTemplates = DEFAULT_QUOTE_TEMPLATES;
    } else {
      const existingIds = new Set(parsed.quoteTemplates.map((t: SystemQuoteTemplate) => t.id));
      const missingDefaults = DEFAULT_QUOTE_TEMPLATES.filter(dt => !existingIds.has(dt.id));
      if (missingDefaults.length > 0) {
        parsed.quoteTemplates = [...parsed.quoteTemplates, ...missingDefaults];
      }
    }
    if (!parsed.checklistTemplates || !Array.isArray(parsed.checklistTemplates) || parsed.checklistTemplates.length === 0) {
      parsed.checklistTemplates = DEFAULT_CHECKLIST_TEMPLATES;
    }
    if (!parsed.targetDestinations || !Array.isArray(parsed.targetDestinations) || parsed.targetDestinations.length === 0) {
      parsed.targetDestinations = DEFAULT_TARGET_DESTINATIONS;
    }
    return { ...DEFAULT_SYSTEM_SETTINGS, ...parsed };
  } catch (e) {
    return DEFAULT_SYSTEM_SETTINGS;
  }
}

export function saveSystemSettings(settings: SystemSettings): void {
  localStorage.setItem("librarium_system_settings", JSON.stringify(settings));
  // Keep individual legacy storage keys in sync for backward compatibility
  localStorage.setItem("ceo_admin_username", settings.masterUsername);
  if (settings.appBg) {
    localStorage.setItem("ceo_app_background_wallpaper", settings.appBg);
  } else {
    localStorage.removeItem("ceo_app_background_wallpaper");
  }
  if (settings.authBg) {
    localStorage.setItem("ceo_auth_background_wallpaper", settings.authBg);
  } else {
    localStorage.removeItem("ceo_auth_background_wallpaper");
  }
}
