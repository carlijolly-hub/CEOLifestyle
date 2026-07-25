import { SystemSettings, ProductionMaterialPreset, DTFSupplier, DTFPricingPreset, DeliveryMethod, SystemQuoteTemplate } from "../types";

export const DEFAULT_QUOTE_TEMPLATES: SystemQuoteTemplate[] = [
  {
    id: "tpl_apparel_quote",
    name: "T-Shirt Studio Quotation Template",
    category: "Quotations",
    toolKey: "apparel",
    description: "Standardized customer quotation layout for T-Shirts, Polos, Oxfords & Apparel orders.",
    placeholders: ["{GarmentItems}", "{AdditionalCharges}", "{DiscountPercent}", "{DiscountAmount}", "{GrandTotal}", "{DeliveryMethod}", "{DeliveryMessage}"],
    active: true,
    isDefault: true,
    content: `Thank you so much for providing those details. Here is your personalized quote based on your request:

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
    name: "Book Cost Calculator Quotation Template",
    category: "Quotations",
    toolKey: "book",
    description: "Standardized quotation for imported book orders, quantity tiers, and delivery charges.",
    placeholders: ["{BookTitle}", "{Quantity}", "{QuantityUnit}", "{UnitPrice}", "{BooksSubtotal}", "{DeliveryMethod}", "{DeliveryCharge}", "{DiscountPercent}", "{DiscountAmount}", "{GrandTotal}", "{DeliveryMessage}"],
    active: true,
    isDefault: true,
    content: `Thank you so much for providing those details. Here is your personalized quote based on your request:

Book:
{BookTitle}

Quantity
* {Quantity} {QuantityUnit} @ {UnitPrice} each = {BooksSubtotal}

{IF:AdditionalCharges}
Additional Charges
{AdditionalCharges}
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
    id: "tpl_dtf_quote",
    name: "DTF Printing Quotation Template",
    category: "Quotations",
    toolKey: "dtf",
    description: "Standardized quotation for direct-to-film transfer prints, sizing presets, and delivery.",
    placeholders: ["{PrintSize}", "{Quantity}", "{UnitPrice}", "{Subtotal}", "{DeliveryMethod}", "{DeliveryCharge}", "{DiscountPercent}", "{DiscountAmount}", "{GrandTotal}", "{DeliveryMessage}"],
    active: true,
    isDefault: true,
    content: `Thank you so much for providing those details. Here is your personalized quote based on your request:

Print Details:
* Size: {PrintSize}
* Quantity: {Quantity} prints @ {UnitPrice} each = {Subtotal}

{IF:AdditionalCharges}
Additional Charges
{AdditionalCharges}
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
    name: "Production Layout Quotation Template",
    category: "Quotations",
    toolKey: "production_layout",
    description: "Quotation for custom sheet & material production layouts.",
    placeholders: ["{MaterialName}", "{SheetSpecs}", "{Quantity}", "{UnitPrice}", "{Subtotal}", "{DeliveryMethod}", "{DeliveryCharge}", "{DiscountPercent}", "{DiscountAmount}", "{GrandTotal}", "{DeliveryMessage}"],
    active: true,
    isDefault: true,
    content: `Thank you so much for providing those details. Here is your personalized quote based on your request:

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
    name: "Location Logistics Quotation Template",
    category: "Quotations",
    toolKey: "location",
    description: "Quotation template for event venue setup and location logistics.",
    placeholders: ["{ParishLocation}", "{ServiceTier}", "{DiscountPercent}", "{DiscountAmount}", "{GrandTotal}", "{DeliveryMessage}"],
    active: true,
    isDefault: true,
    content: `Thank you so much for providing those details. Here is your personalized quote based on your request:

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
    id: "tpl_delivery_knutsford",
    name: "Knutsford Express Delivery Notice",
    category: "Delivery & Collection",
    description: "Standard dispatch text appended when Knutsford Express is selected.",
    placeholders: ["{DeliveryMethod}"],
    active: true,
    isDefault: true,
    content: `Your order will be dispatched via Knutsford Express once production has been completed.

Collection details and tracking information will be provided once your order is ready for shipment.`
  },
  {
    id: "tpl_delivery_tara",
    name: "Tara Courier Doorstep Notice",
    category: "Delivery & Collection",
    description: "Doorstep courier message template for islandwide deliveries.",
    placeholders: ["{DeliveryMethod}"],
    active: true,
    isDefault: true,
    content: `Your order will be delivered directly to your specified address via Tara Courier.

Tracking details and delivery schedule will be communicated upon dispatch.`
  },
  {
    id: "tpl_delivery_pickup",
    name: "Office Collection & Pickup Notice",
    category: "Delivery & Collection",
    description: "Message template for in-person pickups at corporate headquarters.",
    placeholders: ["{PickupLocation}"],
    active: true,
    isDefault: true,
    content: `Your order will be available for pickup at our Kingston Head Office once processing has been completed.

Please present your order reference upon arrival.`
  },
  {
    id: "tpl_comm_deposit",
    name: "Order Confirmation & Payment Deposit Request",
    category: "Customer Communications",
    description: "Customer payment request notice with NCB banking details.",
    placeholders: ["{CustomerName}", "{DepositAmount}", "{GrandTotal}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Dear {CustomerName},

Thank you for confirming your order with {BusinessName}!

To initiate production, a 50% deposit of {DepositAmount} is required.
Total Order Value: {GrandTotal}

Payment Details:
Bank: National Commercial Bank (NCB)
Account Name: {BusinessName}
Account Number: 123456789

Please send a copy of your transfer confirmation to begin processing.

Warm regards,
{BusinessName}`
  },
  {
    id: "tpl_comm_completion",
    name: "Order Completion & Dispatch Notice",
    category: "Customer Communications",
    description: "Customer notification when an order finishes production and is ready.",
    placeholders: ["{CustomerName}", "{DeliveryMethod}", "{DeliveryMessage}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Dear {CustomerName},

Your order is ready!

Delivery Method: {DeliveryMethod}
{DeliveryMessage}

Thank you for choosing {BusinessName}.

Warm regards,
{BusinessName}`
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
    const placeholder = `{${key}}`;
    result = result.split(placeholder).join(stringVal);
  });

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
  quoteTemplates: DEFAULT_QUOTE_TEMPLATES
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
