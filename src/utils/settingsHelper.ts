import { SystemSettings, ProductionMaterialPreset, DTFSupplier, DTFPricingPreset, DeliveryMethod, SystemQuoteTemplate, ProductionChecklistTemplate, FulfillmentTemplate, FulfillmentTemplateItem, FulfillmentInventoryItem, RegularInventoryItem, BulkQuantityTier, PeakPlannerRecord, DEFAULT_BOOK_CLASSIFICATIONS, InventoryUsagePriority, SupplierRecord, ContactRecord, ContactSupplierRecord, OSLocation } from "../types";

export function normalizeTemplateCompanyAndLocation(tpl: SystemQuoteTemplate): SystemQuoteTemplate {
  let location = tpl.location;
  if (!location) {
    const cat = (tpl.category || "").toUpperCase();
    if (cat.includes("ORDER DETAIL") || tpl.id.includes("order_details")) location = "Operations Dashboard";
    else if (cat === "DELIVERY" || cat.includes("DELIV")) location = "Delivery & Collection";
    else if (cat === "QUOTES" || cat === "SALES" || cat.includes("QUOTE")) location = "Quote Calculator";
    else if (cat === "PRODUCTION" || cat.includes("PROD")) location = "Production";
    else if (cat === "LIBRARIUM LUXE" || cat.includes("LIBRA")) location = "Librarium Luxe Operations";
    else if (cat === "CLIENT" || cat.includes("CUSTOMER")) location = "Client Directory";
    else if (cat === "ORDERS") location = "Operations Dashboard";
    else if (cat === "BILLS" || cat === "PAYMENTS") location = "Operations Dashboard";
    else location = "General / All";
  }
  let company = tpl.company;
  if (!company) {
    if (tpl.businessHome === "Librarium Luxe") company = "Librarium Luxe";
    else if (tpl.businessHome === "CEO Lifestyle") company = "CEO Lifestyle";
    else company = "Both";
  }
  return {
    ...tpl,
    location,
    company
  };
}

export const DEFAULT_QUOTE_TEMPLATES: SystemQuoteTemplate[] = [
  // ==========================================
  // ORDER DETAILS (CLIENT-FACING COPY & PASTE)
  // ==========================================
  {
    id: "tpl_ceo_order_details",
    name: "CEO Lifestyle Order Details",
    category: "ORDER DETAILS",
    company: "CEO Lifestyle",
    businessHome: "CEO Lifestyle",
    location: "Operations Dashboard",
    toolKey: "apparel",
    documentType: "order_details",
    description: "Primary client-facing Order Details copy & paste message for CEO Lifestyle bespoke apparel and print orders.",
    placeholders: ["{ClientName}", "{OrderNumber}", "{Product}", "{ItemDescription}", "{Quantity}", "{Color}", "{SubstituteColor}", "{Size}", "{Customization}", "{DeliveryMethod}", "{Location}", "{OrderTotal}", "{DepositPaid}", "{BalanceDue}", "{DueDate}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `*CEO LIFESTYLE ORDER DETAILS*
Order Number: {OrderNumber}
Client: {ClientName}
Product: {Product}
{IF:ItemDescription}Description: {ItemDescription}
{/IF}Quantity: {Quantity}
{IF:Color}Color: {Color}
{/IF}{IF:SubstituteColor}Substitute Color: {SubstituteColor}
{/IF}{IF:Size}Size: {Size}
{/IF}{IF:Customization}Customization: {Customization}
{/IF}Delivery Method: {DeliveryMethod}
Delivery Location: {Location}
Order Total: {OrderTotal}
Deposit Paid: {DepositPaid}
Balance Due: {BalanceDue}
{IF:DueDate}Target Due Date: {DueDate}
{/IF}
Thank you for choosing {BusinessName}! Please let us know if you need any adjustments.`
  },
  {
    id: "tpl_ceo_order_details_quick",
    name: "CEO Lifestyle Quick Order Summary",
    category: "ORDER DETAILS",
    company: "CEO Lifestyle",
    businessHome: "CEO Lifestyle",
    location: "Operations Dashboard",
    toolKey: "apparel",
    documentType: "order_details",
    description: "Fast, concise WhatsApp order summary with item count, status, and balance.",
    placeholders: ["{ClientName}", "{OrderNumber}", "{Product}", "{Phone}", "{OrderTotal}", "{DepositPaid}", "{BalanceDue}", "{ProductionStatus}", "{DueDate}", "{DeliveryMethod}", "{Location}", "{ExpressOrder}", "{InternalNotes}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `*CEO LIFESTYLE OPERATIONS ORDER UPDATE*
Order Number: {OrderNumber}
Company: CEO Lifestyle
Client: {ClientName}
Phone: {Phone}
Products: {Product}
Cost of Order: {OrderTotal}
Deposit Paid: {DepositPaid}
Balance Due: {BalanceDue}
Status: {ProductionStatus}
Due Date: {DueDate}
Delivery Method: {DeliveryMethod} ({Location})
{IF:ExpressOrder}Express Order: {ExpressOrder}
{/IF}{IF:InternalNotes}Notes: {InternalNotes}
{/IF}
Thank you for choosing {BusinessName}!`
  },
  {
    id: "tpl_luxe_order_details",
    name: "Librarium Luxe Order Details",
    category: "ORDER DETAILS",
    company: "Librarium Luxe",
    businessHome: "Librarium Luxe",
    location: "Operations Dashboard",
    toolKey: "book",
    documentType: "order_details",
    description: "Curated client-facing literary acquisition and rare book order details.",
    placeholders: ["{ClientName}", "{OrderNumber}", "{BookTitle}", "{Quantity}", "{BookPrice}", "{BundleInfo}", "{Availability}", "{DeliveryMethod}", "{Location}", "{DeliveryInfo}", "{OrderTotal}", "{PaymentInfo}", "{DepositPaid}", "{BalanceDue}", "{DueDate}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `*LIBRARIUM LUXE BOOK ACQUISITION DETAILS*
Order Reference: {OrderNumber}
Client: {ClientName}
Book Title: {BookTitle}
Quantity: {Quantity}
{IF:BookPrice}Book Price: {BookPrice}
{/IF}{IF:BundleInfo}Bundle Details: {BundleInfo}
{/IF}{IF:Availability}Availability: {Availability}
{/IF}Delivery Method: {DeliveryMethod}
Location: {Location}
{IF:DeliveryInfo}Delivery Info: {DeliveryInfo}
{/IF}Order Total: {OrderTotal}
Deposit Paid: {DepositPaid}
Balance Due: {BalanceDue}
{IF:DueDate}Target Date: {DueDate}
{/IF}
Thank you for your patronage with {BusinessName}.`
  },
  {
    id: "tpl_luxe_order_details_quick",
    name: "Librarium Luxe Acquisition Update (Quick)",
    category: "ORDER DETAILS",
    company: "Librarium Luxe",
    businessHome: "Librarium Luxe",
    location: "Operations Dashboard",
    toolKey: "book",
    documentType: "order_details",
    description: "Concise literary acquisition dispatch and curatorial status summary.",
    placeholders: ["{ClientName}", "{OrderNumber}", "{Product}", "{Phone}", "{OrderTotal}", "{DepositPaid}", "{BalanceDue}", "{ProductionStatus}", "{DueDate}", "{DeliveryMethod}", "{Location}", "{ExpressOrder}", "{InternalNotes}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `*LIBRARIUM LUXE BOOK ACQUISITION UPDATE*
Order Reference: {OrderNumber}
Company: Librarium Luxe
Client: {ClientName}
Phone: {Phone}
Curated Volumes: {Product}
Acquisition Total: {OrderTotal}
Deposit Paid: {DepositPaid}
Balance Due: {BalanceDue}
Fulfillment Status: {ProductionStatus}
Target Availability Date: {DueDate}
Delivery / Collection: {DeliveryMethod} ({Location})
{IF:ExpressOrder}Express Curatorial Rush: {ExpressOrder}
{/IF}{IF:InternalNotes}Curatorial Notes: {InternalNotes}
{/IF}
Warm regards,
{BusinessName}`
  },
  // ==========================================
  // CLIENT COMMUNICATIONS
  // ==========================================
  {
    id: "tpl_customer_response",
    name: "Customer Response Greeting",
    category: "CLIENT",
    toolKey: "general",
    businessHome: "All",
    documentType: "message",
    description: "Standard opening greeting and introduction used before customer quotation breakdowns.",
    placeholders: ["{CustomerName}", "{client_name}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Thank you so much for providing those details.

Here is your personalized quotation based on your request.`
  },
  {
    id: "tpl_client_welcome",
    name: "Client Welcome Message",
    category: "CLIENT",
    toolKey: "general",
    businessHome: "All",
    documentType: "message",
    description: "Welcoming a new client or VIP account to concierge and bespoke production services.",
    placeholders: ["{CustomerName}", "{BusinessName}", "{BusinessPhone}", "{BusinessEmail}"],
    active: true,
    isDefault: true,
    content: `Dear {CustomerName},

Welcome to {BusinessName}. We are honored to partner with you and look forward to delivering exceptional craftsmanship and concierge service for all your bespoke production and lifestyle needs.

Should you require immediate assistance or wish to discuss an upcoming project, please do not hesitate to reach out directly.

Warm regards,
{BusinessName}
Concierge & Production Team`
  },
  {
    id: "tpl_followup_message",
    name: "Follow-up Check-in",
    category: "CLIENT",
    toolKey: "general",
    businessHome: "All",
    documentType: "message",
    description: "Polite follow-up check-in sent to clients following quotation delivery.",
    placeholders: ["{CustomerName}", "{client_name}", "{ItemTitle}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Hi {CustomerName},

I hope you're having a wonderful week! Following up regarding your personalized quotation for {ItemTitle}.

Please let us know if you have any questions or if you'd like us to confirm this order for production.

Warm regards,
{BusinessName}`
  },
  {
    id: "tpl_client_checkin",
    name: "Relationship Care & Check-in",
    category: "CLIENT",
    toolKey: "general",
    businessHome: "All",
    documentType: "message",
    description: "Periodic relationship care check-in for active accounts and corporate partners.",
    placeholders: ["{CustomerName}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Hello {CustomerName},

Checking in from the executive team at {BusinessName}! We hope everything is going smoothly with your recent projects.

We are currently scheduling our upcoming production cycles. If you have any new merchandise, publication, or event requirements in the pipeline, we would be delighted to assist you early to guarantee priority scheduling.

Wishing you continued success,
{BusinessName}`
  },
  {
    id: "tpl_client_reengagement",
    name: "Client Re-engagement Outreach",
    category: "CLIENT",
    toolKey: "general",
    businessHome: "All",
    documentType: "message",
    description: "Gentle outreach to re-engage valued clients and previous accounts.",
    placeholders: ["{CustomerName}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Dear {CustomerName},

It has been a little while since we last collaborated, and we wanted to reconnect.

At {BusinessName}, we have recently expanded our production capabilities, premium apparel blanks, and expedited turnaround times. We would love to support your next initiative.

Let us know when you have a free moment to catch up on any upcoming ideas.

Warm regards,
{BusinessName}`
  },
  {
    id: "tpl_reminder_message",
    name: "Reminder Messages",
    category: "CLIENT",
    toolKey: "general",
    businessHome: "All",
    documentType: "message",
    description: "Reminder notice for upcoming order deadlines, payments, or pickups.",
    placeholders: ["{CustomerName}", "{client_name}", "{OrderNumber}", "{DueDate}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Hello {CustomerName},

This is a friendly reminder regarding your order #{OrderNumber} scheduled for {DueDate}.

Please reach out to us if you need any adjustments or updates.

Warm regards,
{BusinessName}`
  },
  {
    id: "tpl_thank_you_message",
    name: "Thank You Messages",
    category: "CLIENT",
    toolKey: "general",
    businessHome: "All",
    documentType: "message",
    description: "Appreciation message sent to clients after successful fulfillment.",
    placeholders: ["{CustomerName}", "{client_name}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Thank you so much for choosing {BusinessName}, {CustomerName}!

We truly appreciate your business and hope you love your completed order. If you need anything else, please feel free to reach out anytime.

Warm regards,
{BusinessName}`
  },

  // ==========================================
  // SALES
  // ==========================================
  {
    id: "tpl_sales_quote",
    name: "Standard Sales Quotation",
    category: "SALES",
    toolKey: "general",
    businessHome: "CEO Lifestyle",
    documentType: "quote",
    description: "Comprehensive quotation breakdown for general bespoke merchandise and corporate orders.",
    placeholders: ["{CustomerResponse}", "{CustomerName}", "{QuoteDate}", "{Quantity}", "{UnitPrice}", "{Subtotal}", "{AdditionalCharges}", "{DiscountAmount}", "{GrandTotal}", "{DeliveryMethod}", "{DeliveryMessage}"],
    active: true,
    isDefault: true,
    content: `{CustomerResponse}

QUOTATION SUMMARY:
Client: {CustomerName}
Date: {QuoteDate}

Item Details:
* Quantity: {Quantity} units @ {UnitPrice} each = {Subtotal}

{IF:AdditionalCharges}
Additional Charges:
{AdditionalCharges}
{/IF}

{IF:DiscountAmount}
Discount:
* You save {DiscountPercent}% = {DiscountAmount}
{/IF}

Total Quoted: {GrandTotal}

{IF:DeliveryMessage}
Delivery Method: {DeliveryMethod}
{DeliveryMessage}
{/IF}

To confirm this quote and secure your production schedule, a 50% deposit is required.`
  },
  {
    id: "tpl_quote_followup",
    name: "Quote Follow-Up & Next Steps",
    category: "SALES",
    toolKey: "general",
    businessHome: "All",
    documentType: "message",
    description: "Sales follow-up communication sent 48-72 hours after quote delivery.",
    placeholders: ["{CustomerName}", "{QuoteNumber}", "{GrandTotal}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Good day {CustomerName},

I wanted to follow up on Quote #{QuoteNumber} (Total: {GrandTotal}) sent earlier this week.

Our production calendar is filling quickly for this cycle. Would you like us to reserve your production slot and send the deposit invoice to get started?

Happy to adjust any quantities or specifications if needed!

Best regards,
{BusinessName}`
  },
  {
    id: "tpl_sales_proposal",
    name: "Executive VIP Proposal Intro",
    category: "SALES",
    toolKey: "general",
    businessHome: "CEO Lifestyle",
    documentType: "quote",
    description: "Executive presentation preamble for high-volume corporate accounts and custom contract pitches.",
    placeholders: ["{CustomerName}", "{BusinessName}", "{QuoteDate}"],
    active: true,
    isDefault: true,
    content: `CONFIDENTIAL EXECUTIVE PROPOSAL
Prepared for: {CustomerName}
Presented by: {BusinessName}
Date: {QuoteDate}

Thank you for the opportunity to present this custom production proposal. Below you will find our recommended specifications, volume tiers, and logistics schedule designed specifically to match your brand's exacting standards.`
  },

  // ==========================================
  // ORDERS
  // ==========================================
  {
    id: "tpl_order_confirmation",
    name: "Order Confirmation Notice",
    category: "ORDERS",
    toolKey: "general",
    businessHome: "All",
    documentType: "message",
    description: "Official confirmation sent to client once deposit is logged and order enters the active queue.",
    placeholders: ["{CustomerName}", "{OrderNumber}", "{DueDate}", "{GrandTotal}", "{DepositAmount}", "{DeliveryMethod}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `ORDER CONFIRMATION: #{OrderNumber}
Dear {CustomerName},

Thank you for your business! Your order has been officially confirmed and entered into our active production queue.

Order Summary:
* Order Ref: #{OrderNumber}
* Target Completion / Dispatch: {DueDate}
* Total Order Value: {GrandTotal}
* Deposit Received: {DepositAmount}
* Fulfillment Method: {DeliveryMethod}

We will keep you updated as your items transition through print and finishing.

Warm regards,
{BusinessName}`
  },
  {
    id: "tpl_order_update",
    name: "Production Progress Update",
    category: "ORDERS",
    toolKey: "general",
    businessHome: "All",
    documentType: "message",
    description: "Mid-cycle order status update keeping the client informed of production progress.",
    placeholders: ["{CustomerName}", "{OrderNumber}", "{ProductionStatus}", "{DueDate}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `ORDER STATUS UPDATE: #{OrderNumber}
Hello {CustomerName},

Here is a quick update regarding your order #{OrderNumber}.

Current Stage: {ProductionStatus}
Estimated Dispatch: {DueDate}

Everything is progressing according to schedule with our quality standards. We will notify you as soon as final packaging and inspection are complete!

Warm regards,
{BusinessName}`
  },
  {
    id: "tpl_order_completion",
    name: "Job Completion Notice",
    category: "ORDERS",
    toolKey: "general",
    businessHome: "All",
    documentType: "message",
    description: "Notice to client that order has completed production and passed inspection.",
    placeholders: ["{CustomerName}", "{OrderNumber}", "{BalanceDue}", "{DeliveryMethod}", "{PickupLocation}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `YOUR ORDER IS READY! #{OrderNumber}
Dear {CustomerName},

Great news! Production and quality checks for order #{OrderNumber} are officially complete.

{IF:BalanceDue}
Remaining Balance Due: {BalanceDue}
{/IF}

Dispatch / Collection:
* Method: {DeliveryMethod}
{IF:PickupLocation}
* Pickup Location: {PickupLocation}
{/IF}

Please let us know your preferred collection window or confirm your delivery address.

Warm regards,
{BusinessName}`
  },
  {
    id: "tpl_delivery_messages",
    name: "Delivery Messages & Logistics Notice",
    category: "DELIVERY",
    toolKey: "general",
    businessHome: "All",
    documentType: "message",
    description: "Logistics dispatch instructions and courier notifications sent to recipients.",
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
    id: "tpl_collection_messages",
    name: "Collection Messages & Pickup Notification",
    category: "DELIVERY",
    toolKey: "general",
    businessHome: "All",
    documentType: "message",
    description: "Pickup notification and office collection instructions for clients collecting orders.",
    placeholders: ["{CustomerName}", "{OrderNumber}", "{PickupLocation}", "{BusinessPhone}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Dear {CustomerName},

Your order #{OrderNumber} is ready for collection at our executive suite.

Collection Details:
* Location: {PickupLocation}
* Operating Hours: Monday to Friday, 9:00 AM – 5:00 PM
* Concierge Phone: {BusinessPhone}

Please present your order reference #{OrderNumber} or a valid photo ID upon arrival.

Warm regards,
{BusinessName}`
  },
  {
    id: "tpl_ready_for_delivery",
    name: "Ready-for-Delivery Notification",
    category: "DELIVERY",
    toolKey: "general",
    businessHome: "All",
    documentType: "notice",
    description: "Notification sent to the customer when production is complete and delivery is scheduled.",
    placeholders: ["{CustomerName}", "{OrderNumber}", "{DeliveryMethod}", "{TargetDestination}", "{DueDate}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Dear {CustomerName},

Great news! Production on your order #{OrderNumber} is complete and your package is ready for delivery.

Delivery Schedule:
* Method: {DeliveryMethod}
* Destination: {TargetDestination}
* Scheduled Dispatch: {DueDate}

Our courier team will provide real-time updates upon dispatch. If you have any gate or reception instructions, please let us know.

Warm regards,
{BusinessName}`
  },
  {
    id: "tpl_ready_for_collection",
    name: "Ready-for-Collection Notification",
    category: "DELIVERY",
    toolKey: "general",
    businessHome: "All",
    documentType: "notice",
    description: "Alert informing the client that items are inspected, packaged, and ready for pickup.",
    placeholders: ["{CustomerName}", "{OrderNumber}", "{PickupLocation}", "{BalanceDue}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Dear {CustomerName},

Your order #{OrderNumber} has passed final quality inspection and is now packaged and ready for collection.

Collection Summary:
* Pickup Location: {PickupLocation}
* Outstanding Balance: {BalanceDue}
* Packaging: Secure Executive Presentation Packaging

You may collect your order during our standard business hours (Mon-Fri 9:00 AM - 5:00 PM). Kindly present this notice upon arrival.

Warm regards,
{BusinessName}`
  },
  {
    id: "tpl_delivery_instructions",
    name: "Delivery Instructions & Courier Guidelines",
    category: "DELIVERY",
    toolKey: "general",
    businessHome: "All",
    documentType: "document",
    description: "Detailed recipient delivery instructions, access codes, and courier guidelines.",
    placeholders: ["{CustomerName}", "{OrderNumber}", "{DeliveryMethod}", "{TargetDestination}", "{DeliveryMessage}", "{BusinessPhone}"],
    active: true,
    isDefault: true,
    content: `DELIVERY & DISPATCH INSTRUCTIONS:
Order Reference: #{OrderNumber}
Client: {CustomerName}
Courier Service: {DeliveryMethod}
Destination Address: {TargetDestination}

Special Delivery Guidelines:
1. Contact recipient at least 30 minutes prior to arrival.
2. Secure signature on delivery receipt upon package handover.
3. For gated or corporate drop-offs, present company courier credentials at security checkpoint.

Client Delivery Notes:
{DeliveryMessage}

Courier Dispatch Desk: {BusinessPhone}`
  },
  {
    id: "tpl_collection_instructions",
    name: "Collection Instructions & Pickup Guidelines",
    category: "DELIVERY",
    toolKey: "general",
    businessHome: "All",
    documentType: "document",
    description: "Guidelines provided to clients regarding collection protocols and authorized pickup.",
    placeholders: ["{CustomerName}", "{OrderNumber}", "{PickupLocation}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `ORDER COLLECTION GUIDELINES:
Order Reference: #{OrderNumber}
Client Name: {CustomerName}
Pickup Location: {PickupLocation}

Collection Protocols:
1. Third-Party Pickups: If sending a driver, courier, or representative, please provide written authorization and order reference #{OrderNumber} in advance.
2. Package Verification: We invite you to inspect packaging seals and item count prior to departure.
3. Operating Hours: Monday – Friday, 9:00 AM – 5:00 PM.

Thank you for partnering with {BusinessName}.`
  },
  {
    id: "tpl_delivery_confirmation",
    name: "Delivery Confirmation & Dispatch Notice",
    category: "DELIVERY",
    toolKey: "general",
    businessHome: "All",
    documentType: "receipt",
    description: "Confirmation sent once order has been dispatched or handed over to recipient.",
    placeholders: ["{CustomerName}", "{OrderNumber}", "{DeliveryMethod}", "{TargetDestination}", "{QuoteDate}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Dear {CustomerName},

We are pleased to confirm that order #{OrderNumber} has been successfully dispatched via {DeliveryMethod}.

Delivery Confirmation Details:
* Recipient: {CustomerName}
* Destination: {TargetDestination}
* Dispatch Date: {QuoteDate}
* Fulfillment Method: {DeliveryMethod}

Thank you for choosing {BusinessName}. We trust everything meets your expectations.

Warm regards,
{BusinessName}`
  },
  {
    id: "tpl_collection_confirmation",
    name: "Collection Confirmation & Handover Receipt",
    category: "DELIVERY",
    toolKey: "general",
    businessHome: "All",
    documentType: "receipt",
    description: "Confirmation of successful client collection and completed handover.",
    placeholders: ["{CustomerName}", "{OrderNumber}", "{PickupLocation}", "{QuoteDate}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Dear {CustomerName},

This confirms that order #{OrderNumber} was successfully collected from our {PickupLocation} on {QuoteDate}.

Handover Summary:
* Order Ref: #{OrderNumber}
* Collected By: {CustomerName}
* Location: {PickupLocation}
* Handover Status: Completed & Verified

It was our pleasure serving you. Should you require any repeat production or concierge support, do not hesitate to contact us.

Warm regards,
{BusinessName}`
  },

  // ==========================================
  // PAYMENTS & BILLING
  // ==========================================
  {
    id: "tpl_payment_instructions",
    name: "Payment Instructions & Banking Details",
    category: "PAYMENTS",
    toolKey: "general",
    businessHome: "All",
    documentType: "notice",
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
    id: "tpl_deposit_request",
    name: "Deposit Request Notice (50% Production Deposit)",
    category: "PAYMENTS",
    toolKey: "general",
    businessHome: "All",
    documentType: "notice",
    description: "Formal request for the required initial 50% production deposit to release materials.",
    placeholders: ["{CustomerName}", "{OrderNumber}", "{GrandTotal}", "{DepositAmount}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `DEPOSIT REQUEST — ORDER #{OrderNumber}
Dear {CustomerName},

To initiate material procurement and schedule your order #{OrderNumber} on the production floor, a 50% deposit is required.

Total Order: {GrandTotal}
Required Deposit (50%): {DepositAmount}

Banking Details:
Bank: National Commercial Bank (NCB)
Account Name: {BusinessName}
Account Number: 123456789

Kindly reply with your transfer receipt so our accounts desk can verify and release your order into active scheduling.

Thank you for your partnership,
{BusinessName}`
  },
  {
    id: "tpl_payment_confirmation",
    name: "Payment Confirmation & Acknowledgment",
    category: "PAYMENTS",
    toolKey: "general",
    businessHome: "All",
    documentType: "receipt",
    description: "Confirmation sent immediately upon verification of client funds.",
    placeholders: ["{CustomerName}", "{OrderNumber}", "{DepositAmount}", "{BalanceDue}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `PAYMENT RECEIVED — THANK YOU
Dear {CustomerName},

We have received and verified your payment for Order #{OrderNumber}.

Amount Received: {DepositAmount}
Remaining Balance Due upon Completion: {BalanceDue}

Your order is now in active production. Thank you for your prompt remittance!

Warm regards,
{BusinessName} Accounts Desk`
  },
  {
    id: "tpl_balance_due_notice",
    name: "Balance Due Notice",
    category: "PAYMENTS",
    toolKey: "general",
    businessHome: "All",
    documentType: "notice",
    description: "Notice sent when the job is completed and final balance settlement is required prior to release.",
    placeholders: ["{CustomerName}", "{OrderNumber}", "{GrandTotal}", "{DepositAmount}", "{BalanceDue}", "{DeliveryMethod}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `FINAL BALANCE SETTLEMENT — ORDER #{OrderNumber}
Dear {CustomerName},

Your custom order #{OrderNumber} is complete and ready for dispatch.

Financial Summary:
* Total Order Value: {GrandTotal}
* Deposit Paid: {DepositAmount}
* Final Balance Due: {BalanceDue}

Please settle the remaining balance using our standard banking details prior to dispatch or upon collection:
Bank: National Commercial Bank (NCB)
Account: {BusinessName} (123456789)

Thank you for your business!

Warm regards,
{BusinessName}`
  },
  {
    id: "tpl_invoice_presentation",
    name: "Official Invoice Presentation Copy",
    category: "PAYMENTS",
    toolKey: "general",
    businessHome: "CEO Lifestyle",
    documentType: "invoice",
    description: "Official client-facing invoice header, greeting, item summary, and payment terms.",
    placeholders: ["{CustomerName}", "{InvoiceNumber}", "{OrderNumber}", "{QuoteDate}", "{GrandTotal}", "{DepositAmount}", "{BalanceDue}", "{BusinessName}", "{TermsAndConditions}"],
    active: true,
    isDefault: true,
    content: `TAX INVOICE
==================================================
Invoice Ref: {InvoiceNumber}
Order Ref: #{OrderNumber}
Date of Issue: {QuoteDate}
Billed To: {CustomerName}
Issued By: {BusinessName}
==================================================

Total Invoice Amount: {GrandTotal}
Deposit Applied: {DepositAmount}
NET BALANCE DUE: {BalanceDue}

Payment Terms:
* Remittance required via Direct Bank Transfer or Approved Company Cheque.
* Turnaround and dispatch contingent on account standing.

Banking Remittance:
National Commercial Bank (NCB) • Account: 123456789

Thank you for choosing {BusinessName}.`
  },
  {
    id: "tpl_bill_presentation",
    name: "Official Bill Presentation Copy",
    category: "PAYMENTS",
    toolKey: "general",
    businessHome: "CEO Lifestyle",
    documentType: "bill",
    description: "Client-facing bill breakdown and remittance advice.",
    placeholders: ["{CustomerName}", "{OrderNumber}", "{GrandTotal}", "{BalanceDue}", "{DueDate}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `OFFICIAL BILL & REMITTANCE ADVICE
==================================================
Account: {CustomerName}
Order Ref: #{OrderNumber}
Due Date: {DueDate}
Total Payable: {GrandTotal}
Net Outstanding: {BalanceDue}
==================================================

Please remit payment in accordance with your agreed credit terms.
For billing inquiries, contact billing@{BusinessName}.com`
  },
  {
    id: "tpl_payment_receipt",
    name: "Official Payment Receipt Copy",
    category: "PAYMENTS",
    toolKey: "general",
    businessHome: "All",
    documentType: "receipt",
    description: "Official receipt acknowledging full settlement of invoice or order.",
    placeholders: ["{CustomerName}", "{ReceiptNumber}", "{OrderNumber}", "{GrandTotal}", "{DepositAmount}", "{QuoteDate}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `OFFICIAL RECEIPT
==================================================
Receipt Number: {ReceiptNumber}
Date: {QuoteDate}
Received From: {CustomerName}
For Order: #{OrderNumber}
Amount Received: {DepositAmount}
Balance Remaining: JMD 0.00
Status: FULLY PAID & SETTLED
==================================================

Thank you for your valued patronage.
{BusinessName} Executive Finance`
  },
  {
    id: "tpl_statement_account",
    name: "Statement of Account Copy",
    category: "PAYMENTS",
    toolKey: "general",
    businessHome: "All",
    documentType: "statement",
    description: "Client statement of account showing recent ledger transactions and balances.",
    placeholders: ["{CustomerName}", "{QuoteDate}", "{BalanceDue}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `STATEMENT OF ACCOUNT
Client: {CustomerName}
Statement Date: {QuoteDate}
Current Outstanding Balance: {BalanceDue}

All overdue balances are subject to standard account review. Kindly verify your open items with our finance office.`
  },

  // ==========================================
  // EVENTS
  // ==========================================
  {
    id: "tpl_event_confirmation",
    name: "Event Booking Confirmation",
    category: "EVENTS",
    toolKey: "location",
    businessHome: "CEO Lifestyle",
    documentType: "message",
    description: "Confirmation of event setup date, venue logistics, and staging equipment.",
    placeholders: ["{CustomerName}", "{EventDate}", "{ParishLocation}", "{ServiceTier}", "{GrandTotal}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `EVENT LOGISTICS CONFIRMATION
Dear {CustomerName},

This certifies your event logistics booking with {BusinessName}.

Event Details:
* Date: {EventDate}
* Venue / Parish: {ParishLocation}
* Service Tier: {ServiceTier}
* Contract Value: {GrandTotal}

Our setup crew will arrive on site 2 hours prior to start time. We look forward to creating an unforgettable experience!`
  },
  {
    id: "tpl_event_reminder",
    name: "Event Setup & Logistics Reminder",
    category: "EVENTS",
    toolKey: "location",
    businessHome: "CEO Lifestyle",
    documentType: "message",
    description: "Reminder notice sent 48 hours ahead of event execution.",
    placeholders: ["{CustomerName}", "{EventDate}", "{ParishLocation}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `UPCOMING EVENT LOGISTICS REMINDER
Hello {CustomerName},

Touching base regarding your upcoming event on {EventDate} at {ParishLocation}.

Our logistics team is fully prepped. Please ensure venue access passes and site loading areas are accessible for our trucks.

Warm regards,
{BusinessName} Event Operations`
  },
  {
    id: "tpl_milestone_greeting",
    name: "Milestone & Anniversary Celebration Greeting",
    category: "EVENTS",
    toolKey: "general",
    businessHome: "All",
    documentType: "message",
    description: "Heartfelt greeting sent to clients on birthdays, anniversaries, or corporate milestones.",
    placeholders: ["{CustomerName}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `WARMEST CONGRATULATIONS FROM {BusinessName}!

Dear {CustomerName},

Wishing you a joyful and memorable celebration on this special milestone!

It is an absolute pleasure working with you. May this upcoming year bring even greater achievements, health, and prosperity.

Warmest personal regards,
The Executive Team at {BusinessName}`
  },

  // ==========================================
  // PRODUCTION
  // ==========================================
  {
    id: "tpl_apparel_quote",
    name: "T-Shirt Studio Quote",
    category: "PRODUCTION",
    toolKey: "apparel",
    businessHome: "CEO Lifestyle",
    documentType: "quote",
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
    id: "tpl_dtf_quote",
    name: "DTF Printing Quote",
    category: "PRODUCTION",
    toolKey: "dtf",
    businessHome: "CEO Lifestyle",
    documentType: "quote",
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
    category: "PRODUCTION",
    toolKey: "production_layout",
    businessHome: "CEO Lifestyle",
    documentType: "quote",
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
    category: "PRODUCTION",
    toolKey: "location",
    businessHome: "CEO Lifestyle",
    documentType: "quote",
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
    id: "tpl_prod_client_update",
    name: "Production Proof & Artwork Approval",
    category: "PRODUCTION",
    toolKey: "general",
    businessHome: "CEO Lifestyle",
    documentType: "message",
    description: "Sending digital artwork proof or test swatch for client sign-off before mass run.",
    placeholders: ["{CustomerName}", "{OrderNumber}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `ARTWORK PROOF FOR APPROVAL — ORDER #{OrderNumber}
Dear {CustomerName},

Attached is the digital production proof for your order #{OrderNumber}.

Please review:
1. Graphic sizing and positioning
2. Spelling, punctuation, and copy
3. Colors and imprint specifications

Please reply with "APPROVED FOR PRODUCTION" to release this job into machine scheduling.

Best regards,
{BusinessName} Production Studio`
  },
  {
    id: "tpl_ops_board_message",
    name: "Operations Board Messages",
    category: "PRODUCTION",
    toolKey: "general",
    businessHome: "CEO Lifestyle",
    documentType: "notice",
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
    id: "tpl_internal_ops_notes",
    name: "Internal Operations Notes",
    category: "PRODUCTION",
    toolKey: "general",
    businessHome: "CEO Lifestyle",
    documentType: "notice",
    description: "Standardized internal formatting for staff assignments and task notes.",
    placeholders: ["{CustomerName}", "{ClientTier}", "{Priority}", "{AssignedStaff}", "{InternalNotes}"],
    active: true,
    isDefault: true,
    content: `INTERNAL OPERATIONAL LOG
Client: {CustomerName} ({ClientTier} Tier)
Priority Level: {Priority}
Assigned Staff: {AssignedStaff}
Special Instructions: {InternalNotes}`
  },

  // ==========================================
  // LIBRARIUM LUXE
  // ==========================================
  {
    id: "tpl_book_quote",
    name: "Librarium Luxe Book Quote",
    category: "LIBRARIUM LUXE",
    toolKey: "book",
    businessHome: "Librarium Luxe",
    documentType: "quote",
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
    name: "Multi-Book Curated Quote",
    category: "LIBRARIUM LUXE",
    toolKey: "book",
    businessHome: "Librarium Luxe",
    documentType: "quote",
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
    id: "tpl_book_order_conf",
    name: "Librarium Luxe Order Confirmation",
    category: "LIBRARIUM LUXE",
    toolKey: "book",
    businessHome: "Librarium Luxe",
    documentType: "message",
    description: "Official acquisition confirmation for bespoke curated book titles.",
    placeholders: ["{CustomerName}", "{BookTitle}", "{Quantity}", "{GrandTotal}", "{DueDate}"],
    active: true,
    isDefault: true,
    content: `LIBRARIUM LUXE — ACQUISITION CONFIRMED
Dear {CustomerName},

Thank you for acquiring titles through Librarium Luxe.

Acquisition Summary:
* Title: {BookTitle}
* Quantity: {Quantity} copies
* Total Value: {GrandTotal}
* Estimated Arrival / Availability: {DueDate}

We will notify you immediately once your curated volumes arrive and pass archival inspection.

With warm literary regards,
Librarium Luxe Curatorial Desk`
  },
  {
    id: "tpl_inventory_notification",
    name: "Librarium Luxe Inventory & Stock Notice",
    category: "LIBRARIUM LUXE",
    toolKey: "book",
    businessHome: "Librarium Luxe",
    documentType: "notice",
    description: "Catalog stock update or restock notification sent to VIP clients.",
    placeholders: ["{BookTitle}", "{StockStatus}", "{Quantity}", "{Location}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `Luxe Inventory Update:
Title: {BookTitle}
Status: {StockStatus}
Available Stock: {Quantity} copies at {Location}

Contact Librarium Luxe today to reserve your copy!`
  },
  {
    id: "tpl_book_dispatch",
    name: "Book Dispatch & Collection Notice",
    category: "LIBRARIUM LUXE",
    toolKey: "book",
    businessHome: "Librarium Luxe",
    documentType: "message",
    description: "Notification that curated volumes are ready for collection or have been dispatched.",
    placeholders: ["{CustomerName}", "{BookTitle}", "{DeliveryMethod}", "{PickupLocation}"],
    active: true,
    isDefault: true,
    content: `YOUR CURATED BOOKS ARE READY
Dear {CustomerName},

Your copies of "{BookTitle}" have arrived from our literary importers and are prepared for you.

Delivery Method: {DeliveryMethod}
{IF:PickupLocation}
Collection Location: {PickupLocation}
{/IF}

Enjoy your reading journey!

Librarium Luxe Concierge`
  },
  {
    id: "tpl_book_followup",
    name: "Reader Follow-up & Recommendations",
    category: "LIBRARIUM LUXE",
    toolKey: "book",
    businessHome: "Librarium Luxe",
    documentType: "message",
    description: "Concierge follow-up offering further reading recommendations.",
    placeholders: ["{CustomerName}", "{BookTitle}"],
    active: true,
    isDefault: true,
    content: `Dear {CustomerName},

We hope you are thoroughly enjoying "{BookTitle}"!

Our curators have selected several complementary titles on related themes that we believe would enrich your executive collection.

Let us know if you would like us to reserve a curated preview list for you.

Warmest regards,
Librarium Luxe`
  },
  {
    id: "tpl_book_payment_comm",
    name: "Librarium Luxe Book Payment & Remittance",
    category: "LIBRARIUM LUXE",
    toolKey: "book",
    businessHome: "Librarium Luxe",
    documentType: "message",
    description: "Payment and deposit communication for curated books and literary acquisitions.",
    placeholders: ["{CustomerName}", "{OrderNumber}", "{BookTitle}", "{DepositAmount}", "{BalanceDue}", "{GrandTotal}"],
    active: true,
    isDefault: true,
    content: `LIBRARIUM LUXE CURATED BOOK ACQUISITION
Dear {CustomerName},

Thank you for confirming your book acquisition order #{OrderNumber}.

Order Summary:
Curated Titles: {BookTitle}
Total Acquisition Amount: {GrandTotal}
{IF:DepositAmount}Deposit Required / Received: {DepositAmount}{/IF}
{IF:BalanceDue}Balance Due Upon Collection: {BalanceDue}{/IF}

Payment Remittance Details:
Account: Librarium Luxe Executive Acquisitions
Please use Reference #{OrderNumber} with your payment remittance.

Warm regards,
Librarium Luxe Curatorial Team`
  },
  {
    id: "tpl_book_outofstock_followup",
    name: "Librarium Luxe Out-of-Stock & Backorder Follow-up",
    category: "LIBRARIUM LUXE",
    toolKey: "book",
    businessHome: "Librarium Luxe",
    documentType: "notice",
    description: "Out-of-stock notification, international literary reorder timelines, and reservation follow-up.",
    placeholders: ["{CustomerName}", "{BookTitle}", "{DueDate}"],
    active: true,
    isDefault: true,
    content: `LIBRARIUM LUXE CURATORIAL NOTICE
Dear {CustomerName},

Regarding your request for "{BookTitle}":

This title is currently out of local inventory and is being sourced directly through our international literary distributors. We have placed your reservation on priority backorder.

Estimated Availability Date: {DueDate}

We will notify you immediately once your volume passes curatorial inspection and is ready for collection or delivery.

Warmest regards,
Librarium Luxe Concierge`
  },

  // ==========================================
  // DOCUMENTS
  // ==========================================
  {
    id: "tpl_doc_quote_copy",
    name: "Quotation Terms & Header Copy",
    category: "DOCUMENTS",
    toolKey: "general",
    businessHome: "All",
    documentType: "document",
    description: "Standard valid-for-30-days quotation header, terms, and payment guidelines.",
    placeholders: ["{QuoteDate}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `TERMS OF QUOTATION:
1. Validity: This quotation is valid for 30 calendar days from {QuoteDate}.
2. Production Scheduling: Orders are booked upon receipt of a confirmed 50% commitment deposit.
3. Artwork Requirements: Vector artwork (.AI, .EPS, .PDF) or high-res raster (300 DPI minimum) required.
4. Turnaround: Standard turnaround is 5-7 business days from proof approval.`
  },
  {
    id: "tpl_doc_invoice_copy",
    name: "Invoice Presentation & Standard Terms",
    category: "DOCUMENTS",
    toolKey: "general",
    businessHome: "All",
    documentType: "document",
    description: "Standard invoicing layout terms and wire transfer disclosures.",
    placeholders: ["{BusinessName}"],
    active: true,
    isDefault: true,
    content: `INVOICE TERMS & CONDITIONS:
1. Payment Due: Due upon receipt unless net terms are explicitly contracted.
2. Direct Bank Remittance: Wire transfer to National Commercial Bank (NCB).
3. Title & Ownership: Goods remain the property of {BusinessName} until paid in full.
4. Claims & Discrepancies: Must be reported within 48 hours of receipt.`
  },
  {
    id: "tpl_doc_receipt_copy",
    name: "Payment Receipt Copy & Certification",
    category: "DOCUMENTS",
    toolKey: "general",
    businessHome: "All",
    documentType: "document",
    description: "Standard receipt certification language acknowledging settled transactions.",
    placeholders: ["{ReceiptNumber}", "{BusinessName}"],
    active: true,
    isDefault: true,
    content: `PAYMENT RECEIPT CERTIFICATION
Receipt Ref: {ReceiptNumber}

This document serves as official acknowledgement that payment has been received and credited in full towards the designated order.

Authorized Signature: {BusinessName} Treasury`
  },
  {
    id: "tpl_doc_bill_copy",
    name: "Bill Copy & Presentation Language",
    category: "DOCUMENTS",
    toolKey: "general",
    businessHome: "All",
    documentType: "document",
    description: "Presentation language and remit notice on client billing statements.",
    placeholders: ["{BusinessName}"],
    active: true,
    isDefault: true,
    content: `BILLING DISCLOSURE
All bills are issued in accordance with contracted rate sheets. For questions regarding itemization or adjustments, please direct inquiries to our corporate office.`
  },
  {
    id: "tpl_doc_terms_conditions",
    name: "General Production Terms & Conditions",
    category: "DOCUMENTS",
    toolKey: "general",
    businessHome: "CEO Lifestyle",
    documentType: "document",
    description: "Comprehensive production terms: rush policies, tolerances, and liability limits.",
    placeholders: ["{BusinessName}"],
    active: true,
    isDefault: true,
    content: `GENERAL PRODUCTION TERMS & CONDITIONS:
* Rush Service: Expedited orders (under 72 hours) incur a 25% priority rush surcharge.
* Color Tolerance: Due to differences in monitor calibration and substrate absorbency, slight dye-lot variance of +/- 5% is standard industry practice.
* Client Materials: For customer-supplied blanks (CMT), {BusinessName} exercises extreme care but is not liable for manufacturer textile flaws.`
  },
  {
    id: "tpl_doc_footer_legal",
    name: "Document Footer & Confidentiality Notice",
    category: "DOCUMENTS",
    toolKey: "general",
    businessHome: "All",
    documentType: "document",
    description: "Universal legal footer and confidentiality clause printed on client-facing documents.",
    placeholders: ["{BusinessName}"],
    active: true,
    isDefault: true,
    content: `CONFIDENTIAL & PROPRIETARY
This document contains confidential business information intended exclusively for the recipient.
© {BusinessName}. All rights reserved. Kingston, Jamaica.`
  },

  // ==========================================
  // GENERAL
  // ==========================================
  {
    id: "tpl_general_notice",
    name: "General Business Announcement",
    category: "GENERAL",
    toolKey: "general",
    businessHome: "All",
    documentType: "message",
    description: "General communication or service announcement sent to clientele.",
    placeholders: ["{BusinessName}"],
    active: true,
    isDefault: true,
    content: `EXECUTIVE CLIENT ANNOUNCEMENT
From: {BusinessName}

We are pleased to inform our valued clients of upcoming enhancements to our operations and product offerings.

We thank you for your ongoing partnership and look forward to continuing to serve you with distinction.`
  },
  {
    id: "tpl_holiday_hours_notice",
    name: "Holiday & Seasonal Schedule Notice",
    category: "GENERAL",
    toolKey: "general",
    businessHome: "All",
    documentType: "notice",
    description: "Seasonal operating schedule and production cutoff dates.",
    placeholders: ["{BusinessName}"],
    active: true,
    isDefault: true,
    content: `SEASONAL OPERATING HOURS NOTICE
Dear Valued Clients,

In observance of the upcoming holiday season, {BusinessName} will operate on an adjusted schedule:

Please note that custom orders requiring delivery prior to the holidays must be submitted and approved before our scheduled production cutoff.

Warmest seasonal wishes from our entire team!`
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

export interface OrderClientFulfillmentData {
  clientName?: string;
  deliveryMethod?: string;
  location?: string;
}

/**
 * Retrieve active order & client information entered across any production calculator or session.
 * Used to populate communications templates seamlessly when operational values exist.
 */
export function getActiveOrderClientInfo(): OrderClientFulfillmentData {
  try {
    const clientName = 
      localStorage.getItem("calc_active_client_name") ||
      localStorage.getItem("calc_book_client_name") ||
      localStorage.getItem("calc_tshirt_client_name") ||
      localStorage.getItem("calc_prod_client_name") ||
      localStorage.getItem("calc_loc_client_name") ||
      "";

    const deliveryMethod = 
      localStorage.getItem("calc_active_delivery_method") ||
      "";

    const location = 
      localStorage.getItem("calc_active_location") ||
      localStorage.getItem("calc_book_target_destination") ||
      "";

    return {
      clientName: clientName.trim(),
      deliveryMethod: deliveryMethod.trim(),
      location: location.trim()
    };
  } catch (_e) {
    return { clientName: "", deliveryMethod: "", location: "" };
  }
}

/**
 * Save active order & client information for cross-tool template sharing.
 */
export function saveActiveOrderClientInfo(data: Partial<OrderClientFulfillmentData>): void {
  try {
    if (data.clientName !== undefined) {
      localStorage.setItem("calc_active_client_name", data.clientName.trim());
    }
    if (data.deliveryMethod !== undefined) {
      localStorage.setItem("calc_active_delivery_method", data.deliveryMethod.trim());
    }
    if (data.location !== undefined) {
      localStorage.setItem("calc_active_location", data.location.trim());
    }
  } catch (_e) {
    // Ignore localStorage failures
  }
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

  // Comprehensive alias mapping so snake_case, camelCase, and PascalCase placeholders work identically
  const expandedData: Record<string, string | number> = { ...dataMap };
  const aliasPairs: [string, string][] = [
    ["client_name", "CustomerName"],
    ["clientName", "CustomerName"],
    ["ClientName", "CustomerName"],
    ["customer_name", "CustomerName"],
    ["customerName", "CustomerName"],
    ["CustomerName", "ClientName"],
    ["customerName", "ClientName"],
    ["business_name", "BusinessName"],
    ["businessName", "BusinessName"],
    ["company_name", "BusinessName"],
    ["order_number", "OrderNumber"],
    ["orderNumber", "OrderNumber"],
    ["quote_number", "QuoteNumber"],
    ["quoteNumber", "QuoteNumber"],
    ["invoice_number", "InvoiceNumber"],
    ["invoiceNumber", "InvoiceNumber"],
    ["receipt_number", "ReceiptNumber"],
    ["receiptNumber", "ReceiptNumber"],
    ["total_amount", "GrandTotal"],
    ["totalAmount", "GrandTotal"],
    ["grand_total", "GrandTotal"],
    ["deposit_amount", "DepositAmount"],
    ["depositAmount", "DepositAmount"],
    ["balance_due", "BalanceDue"],
    ["balanceDue", "BalanceDue"],
    ["event_date", "EventDate"],
    ["eventDate", "EventDate"],
    ["due_date", "DueDate"],
    ["dueDate", "DueDate"],
    ["quote_date", "QuoteDate"],
    ["quoteDate", "QuoteDate"],
    ["delivery_method", "DeliveryMethod"],
    ["deliveryMethod", "DeliveryMethod"],
    ["DeliveryMethod", "delivery_method"],
    ["DeliveryMethod", "deliveryMethod"],
    ["delivery_message", "DeliveryMessage"],
    ["deliveryMessage", "DeliveryMessage"],
    ["pickup_location", "PickupLocation"],
    ["pickupLocation", "PickupLocation"],
    ["PickupLocation", "Location"],
    ["Destination", "TargetDestination"],
    ["TargetDestination", "Destination"],
    ["Location", "TargetDestination"],
    ["Location", "Destination"],
    ["location", "Location"],
    ["Location", "location"],
    ["TargetDestination", "Location"],
    ["Destination", "Location"],
    // Product, Garment, Book & Order Details Aliases
    ["product", "Product"],
    ["Product", "product_name"],
    ["Product", "ItemTitle"],
    ["ItemTitle", "Product"],
    ["Product", "BookTitle"],
    ["BookTitle", "Product"],
    ["book_title", "BookTitle"],
    ["BookPrice", "UnitPrice"],
    ["UnitPrice", "BookPrice"],
    ["quantity", "Quantity"],
    ["color", "Color"],
    ["colour", "Color"],
    ["Color", "Colour"],
    ["Colour", "Color"],
    ["substitute_color", "SubstituteColor"],
    ["substitute_colour", "SubstituteColor"],
    ["substituteColor", "SubstituteColor"],
    ["substituteColour", "SubstituteColor"],
    ["SubstituteColour", "SubstituteColor"],
    ["SubstituteColor", "SubstituteColour"],
    ["item_description", "ItemDescription"],
    ["ItemDescription", "details"],
    ["size", "Size"],
    ["customization", "Customization"],
    ["Customization", "ProductionDetails"],
    ["ProductionDetails", "Customization"],
    ["bundle_info", "BundleInfo"],
    ["BundleInfo", "Bundle"],
    ["availability", "Availability"],
    ["Availability", "StockStatus"],
    ["delivery_info", "DeliveryInfo"],
    ["DeliveryInfo", "PickupInfo"],
    ["payment_info", "PaymentInfo"],
    ["curatorial_notes", "CuratorialNotes"],
    ["CuratorialNotes", "InternalNotes"],
    ["internal_notes", "InternalNotes"],
    ["InternalNotes", "Notes"],
    ["Notes", "InternalNotes"],
    ["express_order", "ExpressOrder"],
    ["ExpressOrder", "expressOrder"],
    ["express_note", "ExpressNote"],
    ["ExpressNote", "expressNote"],
    ["phone", "Phone"],
    ["clientPhone", "Phone"],
    ["Phone", "ClientPhone"]
  ];

  // Transitive alias expansion (2 passes to resolve chained aliases)
  for (let pass = 0; pass < 2; pass++) {
    aliasPairs.forEach(([a, b]) => {
      if (expandedData[a] !== undefined && expandedData[b] === undefined) {
        expandedData[b] = expandedData[a];
      } else if (expandedData[b] !== undefined && expandedData[a] === undefined) {
        expandedData[a] = expandedData[b];
      }
    });
  }

  // Standard placeholder replacement
  Object.entries(expandedData).forEach(([key, val]) => {
    const stringVal = val !== undefined && val !== null ? String(val) : "";
    result = result.split(`{{${key}}}`).join(stringVal);
    result = result.split(`{${key}}`).join(stringVal);
  });

  // Cleanup unfulfilled {{Placeholder}} and {Placeholder} tags if any remain
  result = result.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, "").replace(/\{[a-zA-Z0-9_]+\}/g, "");

  // Prevent literal "undefined" or "null" from showing
  result = result.replace(/\b(undefined|null)\b/g, "");

  // Clean up any double spaces introduced by empty placeholders
  result = result.replace(/[ \t]{2,}/g, " ");

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
    // Filter out empty labels where optional variable had no value (e.g. "Substitute Color:", "Color:", "Description:", etc.)
    if (/^(\*?\s*(?:Substitute Colou?r|Colou?r|Size|Description|Item Description|Customization|Production Details|Bundle Details|Bundle Info|Availability|Availability Info|Delivery Info|Pickup Info|Curatorial Notes|Internal Notes|Notes|Express Order|Express Notes|Express Curatorial Rush)):\s*$/i.test(trimmed)) {
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

export const DEFAULT_PEAK_PLANNER_RECORDS: PeakPlannerRecord[] = [
  {
    id: "peak-valentines",
    name: "Valentine's Day",
    emoji: "❤️",
    peakDate: "2026-02-14",
    peakEndDate: "2026-02-14",
    prepStartDate: "2026-01-15",
    planningYear: 2027,
    expectedOrders: 60,
    historicalEventOrders: {
      2024: 40,
      2025: 55,
      2026: 50
    },
    orderYearPlans: {
      2027: 60
    },
    expectedProductMix: [
      {
        id: "pm-v1",
        productName: "Magic Heart Cube",
        quantity: 120,
        yearPlans: { 2027: 120 },
        historicalEventSales: {
          2024: 50,
          2025: 70,
          2026: 100
        }
      },
      {
        id: "pm-v2",
        productName: "Luxe Journal",
        quantity: 35,
        yearPlans: { 2027: 35 },
        historicalEventSales: {
          2024: 20,
          2025: 25,
          2026: 30
        }
      },
      {
        id: "pm-v3",
        productName: "Custom Gift Box",
        quantity: 25,
        yearPlans: { 2027: 25 },
        historicalEventSales: {
          2024: 15,
          2025: 18,
          2026: 22
        }
      }
    ],
    notes: "High demand for fresh roses, chocolates, and personalized heart cubes. Begin ribbon and box assembly by mid-January.",
    active: true,
    isDefaultPreset: true
  },
  {
    id: "peak-mothers-day",
    name: "Mother's Day",
    emoji: "🌹",
    peakDate: "2026-05-10",
    peakEndDate: "2026-05-10",
    prepStartDate: "2026-04-01",
    expectedOrders: 45,
    expectedProductMix: [
      {
        id: "pm-m1",
        productName: "Regular Female Basket",
        quantity: 20,
        historicalEventSales: {
          2023: 14,
          2024: 16,
          2025: 18,
          2026: 19
        }
      },
      {
        id: "pm-m2",
        productName: "Magic Heart Cube",
        quantity: 15,
        historicalEventSales: {
          2024: 10,
          2025: 12,
          2026: 14
        }
      },
      {
        id: "pm-m3",
        productName: "Luxury Gift Box",
        quantity: 10,
        historicalEventSales: {
          2024: 6,
          2025: 8,
          2026: 9
        }
      }
    ],
    notes: "Key volume peak for spa gift sets, custom printed cards, and floral arrangements. Order cellophane and tissue paper early.",
    active: true,
    isDefaultPreset: true
  },
  {
    id: "peak-fathers-day",
    name: "Father's Day",
    emoji: "👔",
    peakDate: "2026-06-21",
    peakEndDate: "2026-06-21",
    prepStartDate: "2026-05-15",
    expectedOrders: 35,
    expectedProductMix: [
      {
        id: "pm-f1",
        productName: "Regular Male Basket",
        quantity: 20,
        historicalEventSales: {
          2023: 12,
          2024: 15,
          2025: 17,
          2026: 18
        }
      },
      {
        id: "pm-f2",
        productName: "T-Shirt Orders",
        quantity: 15,
        historicalEventSales: {
          2024: 9,
          2025: 12,
          2026: 14
        }
      }
    ],
    notes: "Focus on male body care baskets, Dove products, Tortuga rum cakes, and custom printed dad t-shirts.",
    active: true,
    isDefaultPreset: true
  },
  {
    id: "peak-graduation",
    name: "Graduation Season",
    emoji: "🎓",
    peakDate: "2026-06-28",
    peakEndDate: "2026-07-05",
    prepStartDate: "2026-05-20",
    expectedOrders: 30,
    expectedProductMix: [
      {
        id: "pm-g1",
        productName: "T-Shirt Orders",
        quantity: 15,
        historicalEventSales: {
          2024: 10,
          2025: 12,
          2026: 14
        }
      },
      {
        id: "pm-g2",
        productName: "Handheld Bouquet",
        quantity: 15,
        historicalEventSales: {
          2024: 8,
          2025: 11,
          2026: 13
        }
      }
    ],
    notes: "School graduations & university ceremonies. Stock up on DTF film transfers, custom sashes, and handheld mini bouquets.",
    active: true,
    isDefaultPreset: true
  },
  {
    id: "peak-christmas",
    name: "Christmas",
    emoji: "🎄",
    peakDate: "2026-12-25",
    peakEndDate: "2026-12-25",
    prepStartDate: "2026-10-15",
    expectedOrders: 50,
    expectedProductMix: [
      {
        id: "pm-c1",
        productName: "Magic Heart Cube",
        quantity: 20,
        historicalEventSales: {
          2023: 12,
          2024: 15,
          2025: 18,
          2026: 19
        }
      },
      {
        id: "pm-c2",
        productName: "Regular Male Basket",
        quantity: 15,
        historicalEventSales: {
          2023: 10,
          2024: 12,
          2025: 13,
          2026: 14
        }
      },
      {
        id: "pm-c3",
        productName: "Regular Female Basket",
        quantity: 10,
        historicalEventSales: {
          2023: 7,
          2024: 8,
          2025: 9,
          2026: 10
        }
      },
      {
        id: "pm-c4",
        productName: "T-Shirt Orders",
        quantity: 5,
        historicalEventSales: {
          2024: 3,
          2025: 4,
          2026: 5
        }
      }
    ],
    notes: "Largest annual holiday rush. Preparation starts mid-October. Ensure full inventory of baskets, chocolates, and wine.",
    active: true,
    isDefaultPreset: true
  }
];

export interface PeakRequirementSummary {
  componentName: string;
  unitLabel?: string;
  totalRequiredQty: number;
  purchaseQty: number;
  bulkUnitLabel?: string;
  hasRule: boolean;
  ruleDescription?: string;
  derivedFromProducts: { productName: string; qty: number }[];
}

export function calculatePeakProjectedRequirements(
  peak: PeakPlannerRecord,
  fulfillmentTemplates: FulfillmentTemplate[],
  selectedPlanningYear?: number
): PeakRequirementSummary[] {
  const compMap: Record<string, {
    componentName: string;
    unitLabel?: string;
    totalRequiredQty: number;
    spec?: FulfillmentTemplateItem;
    derivedMap: Record<string, number>;
  }> = {};

  const templatesByNormalizedName = new Map<string, FulfillmentTemplate>();
  (fulfillmentTemplates || []).forEach(tpl => {
    if (tpl.enabled !== false) {
      templatesByNormalizedName.set(tpl.productName.trim().toLowerCase(), tpl);
      if (tpl.id) templatesByNormalizedName.set(tpl.id.toLowerCase(), tpl);
    }
  });

  const activeYear = selectedPlanningYear || peak.planningYear || 2027;

  (peak.expectedProductMix || []).forEach(mixItem => {
    const normName = mixItem.productName.trim().toLowerCase();
    const template = (mixItem.templateId && templatesByNormalizedName.get(mixItem.templateId.toLowerCase())) 
      || templatesByNormalizedName.get(normName);

    const planQty = (mixItem.yearPlans && mixItem.yearPlans[activeYear] !== undefined)
      ? mixItem.yearPlans[activeYear]
      : mixItem.quantity;

    if (template && template.components && template.components.length > 0) {
      template.components.forEach(comp => {
        const compKey = comp.componentName.trim().toLowerCase();
        const reqQty = comp.quantity * planQty;

        if (!compMap[compKey]) {
          compMap[compKey] = {
            componentName: comp.componentName.trim(),
            unitLabel: comp.unitLabel,
            totalRequiredQty: 0,
            spec: comp,
            derivedMap: {}
          };
        }

        compMap[compKey].totalRequiredQty += reqQty;
        compMap[compKey].derivedMap[mixItem.productName] = (compMap[compKey].derivedMap[mixItem.productName] || 0) + reqQty;
      });
    } else {
      const compKey = mixItem.productName.trim().toLowerCase();
      if (!compMap[compKey]) {
        compMap[compKey] = {
          componentName: mixItem.productName.trim(),
          unitLabel: "units",
          totalRequiredQty: 0,
          derivedMap: {}
        };
      }
      compMap[compKey].totalRequiredQty += planQty;
      compMap[compKey].derivedMap[mixItem.productName] = (compMap[compKey].derivedMap[mixItem.productName] || 0) + planQty;
    }
  });

  return Object.values(compMap).map(item => {
    const calcRes = calculateBulkPurchaseQty(item.totalRequiredQty, item.spec || {});
    return {
      componentName: item.componentName,
      unitLabel: item.unitLabel || item.spec?.unitLabel,
      totalRequiredQty: item.totalRequiredQty,
      purchaseQty: calcRes.purchaseQty,
      bulkUnitLabel: item.spec?.bulkUnitLabel || item.unitLabel,
      hasRule: calcRes.hasRule,
      ruleDescription: calcRes.ruleDescription,
      derivedFromProducts: Object.entries(item.derivedMap).map(([pName, qty]) => ({ productName: pName, qty }))
    };
  });
}

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

export function calculateBulkPurchaseQty(
  totalRequiredQty: number,
  comp?: {
    bulkEnabled?: boolean;
    bulkRuleActive?: boolean;
    bulkTierRules?: BulkQuantityTier[];
    bulkIncrement?: number;
    bulkPurchaseMultiple?: number;
    minPurchaseQty?: number;
    bulkUnitLabel?: string;
    unitLabel?: string;
    bulkNotes?: string;
  } | null
): { purchaseQty: number; hasRule: boolean; ruleDescription: string } {
  if (!comp) {
    return {
      purchaseQty: totalRequiredQty,
      hasRule: false,
      ruleDescription: "Disabled (Exact Required Quantity)"
    };
  }

  // Check if bulk purchasing is explicitly disabled or inactive
  const isEnabled = comp.bulkEnabled !== false && comp.bulkRuleActive !== false;
  
  if (!isEnabled) {
    return {
      purchaseQty: totalRequiredQty,
      hasRule: false,
      ruleDescription: "Disabled (Exact Required Quantity)"
    };
  }

  // 1. Check custom tier rules if provided
  if (comp.bulkTierRules && comp.bulkTierRules.length > 0) {
    const sortedTiers = [...comp.bulkTierRules].sort((a, b) => a.minReq - b.minReq);
    
    // Find matching tier
    const matchingTier = sortedTiers.find(t => {
      const max = (!t.maxReq || t.maxReq === 0) ? Infinity : t.maxReq;
      return totalRequiredQty >= t.minReq && totalRequiredQty <= max;
    });

    if (matchingTier) {
      const maxText = matchingTier.maxReq && matchingTier.maxReq < Infinity ? matchingTier.maxReq : "∞";
      return {
        purchaseQty: matchingTier.purchaseQty,
        hasRule: true,
        ruleDescription: `Tier Rule (${matchingTier.minReq}–${maxText} req ➔ ${matchingTier.purchaseQty} ${comp.bulkUnitLabel || comp.unitLabel || 'units'})`
      };
    }
  }

  // 2. Check increment / multiple rules
  const multiple = comp.bulkIncrement || comp.bulkPurchaseMultiple;
  const minQty = comp.minPurchaseQty || 0;

  if (multiple && multiple > 0) {
    let calculated = Math.ceil(totalRequiredQty / multiple) * multiple;
    if (minQty > 0 && calculated < minQty) {
      calculated = minQty;
    }
    return {
      purchaseQty: calculated,
      hasRule: true,
      ruleDescription: comp.bulkNotes || `Purchase in multiples of ${multiple} ${comp.bulkUnitLabel || comp.unitLabel || 'units'}${minQty ? ` (Min: ${minQty})` : ''}`
    };
  }

  // 3. Fallback: Exact requirement
  return {
    purchaseQty: totalRequiredQty,
    hasRule: false,
    ruleDescription: "Exact requirement (No bulk rule active)"
  };
}

export const DEFAULT_FULFILLMENT_TEMPLATES: FulfillmentTemplate[] = [
  {
    id: "ft-regular-male-basket",
    productName: "Regular Male Basket",
    enabled: true,
    components: [
      { id: "c1", componentName: "Tortuga Box", quantity: 1 },
      { id: "c2", componentName: "Sun Mix", quantity: 1 },
      { id: "c3", componentName: "Wine", quantity: 1 },
      { id: "c4", componentName: "Dove Men Deodorant", quantity: 1 },
      { id: "c5", componentName: "Dove Men Body + Face Wash", quantity: 1 },
      { id: "c6", componentName: "Lays Stax / Pringles", quantity: 1 },
      { id: "c7", componentName: "Bath Towel", quantity: 1 },
      { id: "c8", componentName: "Glade Spray", quantity: 1 },
      { id: "c9", componentName: "Plastic Plate", quantity: 1 },
      {
        id: "c10",
        componentName: "Cellophane",
        quantity: 1.5,
        unitLabel: "yard",
        bulkEnabled: true,
        bulkRuleActive: true,
        bulkUnitLabel: "yards",
        bulkIncrement: 3,
        minPurchaseQty: 3,
        bulkTierRules: [
          { id: "t1", minReq: 1, maxReq: 3, purchaseQty: 3 },
          { id: "t2", minReq: 3.1, maxReq: 6, purchaseQty: 6 },
          { id: "t3", minReq: 6.1, maxReq: 9, purchaseQty: 9 }
        ],
        bulkNotes: "Cellophane: 1–3 yds ➔ 3 yds, 3.1–6 yds ➔ 6 yds, 6.1–9 yds ➔ 9 yds"
      },
      {
        id: "c11",
        componentName: "Tissue Paper",
        quantity: 2,
        unitLabel: "sheets",
        bulkEnabled: true,
        bulkRuleActive: true,
        bulkIncrement: 10,
        bulkUnitLabel: "packs of 10",
        bulkNotes: "Purchase in packs of 10"
      },
      { id: "c12", componentName: "Bow", quantity: 1 }
    ]
  },
  {
    id: "ft-regular-female-basket",
    productName: "Regular Female Basket",
    enabled: true,
    components: [
      { id: "c1", componentName: "Wine", quantity: 1 },
      { id: "c2", componentName: "Plastic Plate", quantity: 1 },
      {
        id: "c3",
        componentName: "Cellophane",
        quantity: 1.5,
        unitLabel: "yard",
        bulkEnabled: true,
        bulkRuleActive: true,
        bulkUnitLabel: "yards",
        bulkIncrement: 3,
        minPurchaseQty: 3,
        bulkTierRules: [
          { id: "t1", minReq: 1, maxReq: 3, purchaseQty: 3 },
          { id: "t2", minReq: 3.1, maxReq: 6, purchaseQty: 6 },
          { id: "t3", minReq: 6.1, maxReq: 9, purchaseQty: 9 }
        ],
        bulkNotes: "Cellophane: 1–3 yds ➔ 3 yds, 3.1–6 yds ➔ 6 yds, 6.1–9 yds ➔ 9 yds"
      },
      {
        id: "c4",
        componentName: "Tissue Paper",
        quantity: 2,
        unitLabel: "sheets",
        bulkEnabled: true,
        bulkRuleActive: true,
        bulkIncrement: 10,
        bulkUnitLabel: "packs of 10",
        bulkNotes: "Purchase in packs of 10"
      },
      { id: "c5", componentName: "Bow", quantity: 1 },
      { id: "c6", componentName: "Bath Sponge", quantity: 1 },
      { id: "c7", componentName: "Bath & Body Set", quantity: 1 },
      { id: "c8", componentName: "Tortuga Box", quantity: 1 },
      { id: "c9", componentName: "Sun Mix", quantity: 1 },
      { id: "c10", componentName: "Candle", quantity: 1 }
    ]
  },
  {
    id: "ft-magic-heart-cube",
    productName: "Magic Heart Cube",
    enabled: true,
    components: [
      { id: "c1", componentName: "Handheld Bouquet", quantity: 1 },
      { id: "c2", componentName: "5×6 Photos", quantity: 8, unitLabel: "prints", bulkEnabled: true, bulkRuleActive: true, bulkIncrement: 10, bulkUnitLabel: "batches of 10", bulkNotes: "Print in batches of 10" },
      { id: "c3", componentName: "Ferrero Chocolates", quantity: 24, unitLabel: "pc", bulkEnabled: true, bulkRuleActive: true, bulkIncrement: 24, bulkUnitLabel: "boxes of 24", bulkNotes: "Purchase in boxes of 24" },
      { id: "c4", componentName: "Flower Foam", quantity: 1 }
    ]
  },
  {
    id: "ft-custom-gift-box",
    productName: "Custom Gift Box",
    enabled: true,
    components: [
      { id: "c1", componentName: "Gift Box", quantity: 1 },
      { id: "c2", componentName: "Ribbon", quantity: 1, unitLabel: "yd", bulkEnabled: true, bulkRuleActive: true, bulkIncrement: 5, bulkUnitLabel: "rolls of 5 yd", bulkNotes: "Purchase in rolls of 5 yards" },
      { id: "c3", componentName: "Greeting Card", quantity: 1 },
      { id: "c4", componentName: "Chocolates", quantity: 5 }
    ]
  },
  {
    id: "ft-custom-bouquet",
    productName: "Custom Bouquet",
    enabled: true,
    components: [
      { id: "c1", componentName: "Bouquet Wrap", quantity: 1 },
      { id: "c2", componentName: "Ribbon", quantity: 1, unitLabel: "yd", bulkEnabled: true, bulkRuleActive: true, bulkIncrement: 5, bulkUnitLabel: "rolls of 5 yd", bulkNotes: "Purchase in rolls of 5 yards" },
      { id: "c3", componentName: "Red Roses", quantity: 12 }
    ]
  }
];

export const DEFAULT_FULFILLMENT_INVENTORY: FulfillmentInventoryItem[] = [
  { id: "fi_cellophane", itemName: "Cellophane", availableQty: 0, unitLabel: "yards", category: "Packaging & Baskets", notes: "Standard clear wrap roll" },
  { id: "fi_tissue_paper", itemName: "Tissue Paper", availableQty: 0, unitLabel: "sheets", category: "Packaging & Baskets", notes: "Color accent sheets" },
  { id: "fi_ribbon", itemName: "Ribbon", availableQty: 0, unitLabel: "yards", category: "Packaging & Baskets", notes: "Satin decorative ribbon" },
  { id: "fi_bow", itemName: "Bow", availableQty: 0, unitLabel: "pc", category: "Packaging & Baskets", notes: "Premade gift bows" },
  { id: "fi_flower_foam", itemName: "Flower Foam", availableQty: 0, unitLabel: "blocks", category: "Floral & Arrangements", notes: "Floral foam base blocks" },
  { id: "fi_photos", itemName: "5×6 Photos", availableQty: 0, unitLabel: "prints", category: "Print & Media", notes: "Custom photo prints" },
  { id: "fi_chocolates", itemName: "Ferrero Chocolates", availableQty: 0, unitLabel: "pc", category: "Confectionery", notes: "Individual chocolate units" },
  { id: "fi_packaging", itemName: "Packaging Materials", availableQty: 0, unitLabel: "boxes", category: "Packaging & Baskets", notes: "General outer shipping boxes & mailers" },
  { id: "fi_baskets", itemName: "Basket Components", availableQty: 0, unitLabel: "baskets", category: "Packaging & Baskets", notes: "Woven gift basket bases" },
  { id: "fi_gift_boxes", itemName: "Gift Box", availableQty: 0, unitLabel: "boxes", category: "Packaging & Baskets", notes: "Rigid luxury gift boxes" }
];

export const DEFAULT_REGULAR_INVENTORY: RegularInventoryItem[] = [
  { id: "reg_tshirt_blk_m", productName: "CEO Branded Cotton T-Shirt (Black - M)", category: "T-Shirts & Apparel", quantity: 15, unitLabel: "pcs", lowStockThreshold: 5, sellingPrice: 3500, unitCost: 1500, notes: "100% Premium Cotton" },
  { id: "reg_tshirt_wht_l", productName: "CEO Branded Cotton T-Shirt (White - L)", category: "T-Shirts & Apparel", quantity: 12, unitLabel: "pcs", lowStockThreshold: 5, sellingPrice: 3500, unitCost: 1500, notes: "100% Premium Cotton" },
  { id: "reg_hoodie_blk_l", productName: "Luxe Oversized Hoodie (Black - L)", category: "T-Shirts & Apparel", quantity: 8, unitLabel: "pcs", lowStockThreshold: 3, sellingPrice: 7500, unitCost: 3500, notes: "Heavyweight Fleece" },
  { id: "reg_mug_ceramic", productName: "Custom Ceramic Executive Mug", category: "Finished Gifts", quantity: 20, unitLabel: "pcs", lowStockThreshold: 5, sellingPrice: 2200, unitCost: 900, notes: "Gold Foil Rim" },
  { id: "reg_pen_luxury", productName: "Executive Metallic Pen Set", category: "Finished Merchandise", quantity: 25, unitLabel: "sets", lowStockThreshold: 5, sellingPrice: 4500, unitCost: 1800, notes: "Engraved Presentation Box" },
  { id: "reg_giftbox_deluxe", productName: "CEO Deluxe Celebration Gift Set", category: "Finished Gifts", quantity: 4, unitLabel: "sets", lowStockThreshold: 3, sellingPrice: 15000, unitCost: 7000, notes: "Pre-assembled Gift Box with Mug, Pen, & Journal" }
];

export const DEFAULT_CONTACT_SUPPLIER_DIRECTORY: ContactSupplierRecord[] = [
  {
    id: "cnt_marcus_vance",
    fullName: "Marcus Vance",
    organization: "ABC Packaging & Wraps",
    contactType: "Supplier",
    primaryClassification: "Suppliers & Vendors",
    roles: ["Supplier", "Packaging", "Wholesale"],
    phone: "876-555-0192",
    whatsapp: "876-555-0192",
    email: "orders@abcpackaging.com",
    location: "Kingston Industrial Estate, Kingston 11",
    servicesProvided: "Cellophane rolls, custom tissue paper, decorative ribbon, luxury gift boxes",
    keyNotes: "Offers bulk discounts on orders over 50 units. Main packaging supplier for luxury gift boxes.",
    notes: "Reliable supplier. Usually provides better pricing for bulk orders.",
    preferredContactMethod: "WhatsApp",
    status: "Active",
    isSupplier: true,
    supplies: ["Cellophane", "Gift Boxes", "Ribbon", "Tissue Paper"],
    productsServicesSupplied: "Cellophane, Gift Boxes, Decorative Ribbon, Tissue Paper",
    pricingNotes: "Bulk tier discounts on orders over 50 units.",
    paymentTerms: "Net 15 / Cash on Delivery",
    leadTime: "2-3 Business Days",
    reliability: "High",
    supplierNotes: "Main packaging supplier for luxury gift boxes and cellophane wrapping.",
    phoneContacts: [
      { id: "ph_abc_1", location: "Montego Bay", phoneNumber: "876-555-0192", contactPerson: "Marcus Vance", notes: "Main branch" },
      { id: "ph_abc_2", location: "Kingston", phoneNumber: "876-555-0193", contactPerson: "John", notes: "Warehouse & Pickup" }
    ],
    operatingHours: {
      monday: { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" },
      tuesday: { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" },
      wednesday: { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" },
      thursday: { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" },
      friday: { isOpen: true, openTime: "8:00 AM", closeTime: "4:30 PM" },
      saturday: { isOpen: true, openTime: "9:00 AM", closeTime: "1:00 PM" },
      sunday: { isOpen: false, openTime: "", closeTime: "" }
    },
    dateAdded: "2026-01-15T00:00:00.000Z"
  },
  {
    id: "cnt_sarah_williams",
    fullName: "Sarah Williams",
    organization: "XYZ Wholesale & Apparel",
    contactType: "Supplier",
    primaryClassification: "Suppliers & Vendors",
    roles: ["Supplier", "Packaging", "Wholesale Vendor", "Apparel"],
    phone: "876-555-0144",
    whatsapp: "876-555-0144",
    email: "sarah@xyzwholesale.com",
    location: "Spanish Town Road, Kingston",
    servicesProvided: "Bulk packaging materials, gift boxes, cellophane, ribbon, garment blanks (T-shirts, polos, hoodies)",
    keyNotes: "Minimum order quantity: 10 units per color for apparel blanks.",
    notes: "Wholesale contact for raw packaging materials and custom apparel blanks. 100% cotton blanks and heavyweight fleece.",
    preferredContactMethod: "Phone",
    status: "Active",
    isSupplier: true,
    supplies: ["T-Shirts", "Polo Shirts", "Hoodies", "Blanks", "Packaging Materials"],
    productsServicesSupplied: "T-Shirts, Polo Shirts, Hoodies, Apparel Blanks, Packaging Materials",
    pricingNotes: "Wholesale tier discount rates updated quarterly.",
    paymentTerms: "50% deposit upon order, balance on delivery",
    leadTime: "3-5 Business Days",
    reliability: "High",
    supplierNotes: "Primary vendor for garment blanks and wholesale packaging.",
    phoneContacts: [
      { id: "ph_xyz_1", location: "St. James", phoneNumber: "876-555-0144", contactPerson: "Sarah Williams", notes: "Apparel Showroom" },
      { id: "ph_xyz_2", location: "Kingston", phoneNumber: "876-555-0145", contactPerson: "Alex", notes: "Distribution Center" }
    ],
    operatingHours: {
      monday: { isOpen: true, openTime: "8:30 AM", closeTime: "5:00 PM" },
      tuesday: { isOpen: true, openTime: "8:30 AM", closeTime: "5:00 PM" },
      wednesday: { isOpen: true, openTime: "8:30 AM", closeTime: "5:00 PM" },
      thursday: { isOpen: true, openTime: "8:30 AM", closeTime: "5:00 PM" },
      friday: { isOpen: true, openTime: "8:30 AM", closeTime: "4:00 PM" },
      saturday: { isOpen: false, openTime: "", closeTime: "" },
      sunday: { isOpen: false, openTime: "", closeTime: "" }
    },
    dateAdded: "2026-01-20T00:00:00.000Z"
  },
  {
    id: "cnt_david_chin",
    fullName: "David Chin",
    organization: "Island Print & Media Works",
    contactType: "Supplier",
    primaryClassification: "Suppliers & Vendors",
    roles: ["Supplier", "Printing", "Service Provider"],
    phone: "876-555-0188",
    whatsapp: "876-555-0188",
    email: "david@islandprint.com",
    location: "Half Way Tree, Kingston 10",
    servicesProvided: "High-gloss photo prints, custom greeting cards, foil stamped book inserts, vinyl banners",
    keyNotes: "Fast 24-hour turnaround print partner for custom event stationery and foil stamping.",
    notes: "High gloss 5x6 prints and foil stamped cards.",
    preferredContactMethod: "WhatsApp",
    status: "Active",
    isSupplier: true,
    supplies: ["Photo Prints", "Print & Media", "Custom Greeting Cards", "Banners"],
    productsServicesSupplied: "High-Gloss Photo Prints, Custom Greeting Cards, Foil Stamped Inserts",
    pricingNotes: "Standard print rate sheet applied.",
    paymentTerms: "Payment upon invoice receipt",
    leadTime: "24-48 Hours",
    reliability: "High",
    supplierNotes: "Fast turnaround print partner for custom event stationery.",
    phoneContacts: [
      { id: "ph_ip_1", location: "Half Way Tree", phoneNumber: "876-555-0188", contactPerson: "David Chin", notes: "Print Hub" }
    ],
    operatingHours: {
      monday: { isOpen: true, openTime: "9:00 AM", closeTime: "6:00 PM" },
      tuesday: { isOpen: true, openTime: "9:00 AM", closeTime: "6:00 PM" },
      wednesday: { isOpen: true, openTime: "9:00 AM", closeTime: "6:00 PM" },
      thursday: { isOpen: true, openTime: "9:00 AM", closeTime: "6:00 PM" },
      friday: { isOpen: true, openTime: "9:00 AM", closeTime: "6:00 PM" },
      saturday: { isOpen: true, openTime: "10:00 AM", closeTime: "3:00 PM" },
      sunday: { isOpen: false, openTime: "", closeTime: "" }
    },
    dateAdded: "2026-02-01T00:00:00.000Z"
  },
  {
    id: "cnt_john_brown",
    fullName: "John Brown",
    organization: "Knutsford Express",
    contactType: "Business Contact",
    primaryClassification: "Operational & Business Contacts",
    roles: ["Courier", "Delivery Contact", "Business Contact"],
    phone: "876-555-0112",
    whatsapp: "876-555-0112",
    email: "j.brown@knutsfordexpress.com",
    location: "Kingston Depot & Dispatch",
    servicesProvided: "Islandwide courier dispatch, express drop-offs, priority parcel tracking & collection",
    keyNotes: "Main point of contact for priority package shipments and waybill handling.",
    notes: "Main contact for priority package shipments and Knutsford waybill handling.",
    preferredContactMethod: "WhatsApp",
    status: "Active",
    dateAdded: "2026-01-10T00:00:00.000Z"
  },
  {
    id: "cnt_robert_miller",
    fullName: "Robert Miller",
    organization: "Independent Express Logistics",
    contactType: "Service Provider",
    primaryClassification: "Operational & Business Contacts",
    roles: ["Courier", "Delivery Driver", "Service Provider"],
    phone: "876-555-0177",
    whatsapp: "876-555-0177",
    email: "rmiller.courier@gmail.com",
    location: "Corporate Area / St. Andrew",
    servicesProvided: "Same-day corporate delivery, fragile luxury gift box transport, direct door-to-door deliveries",
    keyNotes: "Available for urgent weekend client deliveries in Kingston and St. Andrew.",
    notes: "Available for urgent weekend client deliveries in Kingston and St. Andrew.",
    preferredContactMethod: "Phone",
    status: "Active",
    dateAdded: "2026-02-05T00:00:00.000Z"
  },
  {
    id: "cnt_elizabeth_sterling",
    fullName: "Elizabeth Sterling",
    organization: "Sterling Financial Advisory",
    contactType: "Partner / Vendor",
    primaryClassification: "Operational & Business Contacts",
    roles: ["Business Advisor", "Service Provider", "Partner"],
    phone: "876-555-0150",
    whatsapp: "876-555-0150",
    email: "elizabeth@sterlingadvisory.jm",
    location: "New Kingston Financial District",
    servicesProvided: "Tax compliance, financial advisory, business strategy consulting & referral networking",
    keyNotes: "Key strategic advisor for growth expansion and corporate structuring.",
    notes: "Key strategic advisor for growth expansion and corporate structuring.",
    preferredContactMethod: "Email",
    status: "Active",
    dateAdded: "2026-02-10T00:00:00.000Z"
  }
];

export const DEFAULT_SUPPLIER_DIRECTORY: SupplierRecord[] = DEFAULT_CONTACT_SUPPLIER_DIRECTORY;
export const DEFAULT_CONTACT_DIRECTORY: ContactRecord[] = DEFAULT_CONTACT_SUPPLIER_DIRECTORY;

export function calculate3YearAverage(
  historicalActuals?: Record<number, number>,
  currentYear: number = 2027
): { average: number; count: number; yearsUsed: number[] } {
  if (!historicalActuals) {
    return { average: 0, count: 0, yearsUsed: [] };
  }
  const completedYears = Object.keys(historicalActuals)
    .map(Number)
    .filter(yr => yr < currentYear && !isNaN(Number(historicalActuals[yr])))
    .sort((a, b) => b - a)
    .slice(0, 3);

  if (completedYears.length === 0) {
    return { average: 0, count: 0, yearsUsed: [] };
  }

  const sum = completedYears.reduce((acc, yr) => acc + (historicalActuals[yr] || 0), 0);
  const average = Math.round((sum / completedYears.length) * 10) / 10;
  return { average, count: completedYears.length, yearsUsed: completedYears };
}

export function calculate5YearAverage(
  historicalActuals?: Record<number, number>,
  currentYear: number = 2027
): { average: number; count: number; yearsUsed: number[] } {
  if (!historicalActuals) {
    return { average: 0, count: 0, yearsUsed: [] };
  }
  const completedYears = Object.keys(historicalActuals)
    .map(Number)
    .filter(yr => yr < currentYear && !isNaN(Number(historicalActuals[yr])))
    .sort((a, b) => b - a)
    .slice(0, 5);

  if (completedYears.length === 0) {
    return { average: 0, count: 0, yearsUsed: [] };
  }

  const sum = completedYears.reduce((acc, yr) => acc + (historicalActuals[yr] || 0), 0);
  const average = Math.round((sum / completedYears.length) * 10) / 10;
  return { average, count: completedYears.length, yearsUsed: completedYears };
}

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
  fulfillmentTemplates: DEFAULT_FULFILLMENT_TEMPLATES,
  fulfillmentInventory: DEFAULT_FULFILLMENT_INVENTORY,
  regularInventory: DEFAULT_REGULAR_INVENTORY,
  peakPlannerRecords: DEFAULT_PEAK_PLANNER_RECORDS,
  targetDestinations: DEFAULT_TARGET_DESTINATIONS,
  bookClassifications: DEFAULT_BOOK_CLASSIFICATIONS,
  supplierDirectory: DEFAULT_SUPPLIER_DIRECTORY,
  contactDirectory: DEFAULT_CONTACT_DIRECTORY,
  contactSupplierDirectory: DEFAULT_CONTACT_SUPPLIER_DIRECTORY
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
      parsed.quoteTemplates = DEFAULT_QUOTE_TEMPLATES.map(normalizeTemplateCompanyAndLocation);
    } else {
      const existingIds = new Set(parsed.quoteTemplates.map((t: SystemQuoteTemplate) => t.id));
      const missingDefaults = DEFAULT_QUOTE_TEMPLATES.filter(dt => !existingIds.has(dt.id));
      if (missingDefaults.length > 0) {
        parsed.quoteTemplates = [...parsed.quoteTemplates, ...missingDefaults];
      }
      parsed.quoteTemplates = parsed.quoteTemplates.map(normalizeTemplateCompanyAndLocation);
    }
    if (!parsed.checklistTemplates || !Array.isArray(parsed.checklistTemplates) || parsed.checklistTemplates.length === 0) {
      parsed.checklistTemplates = DEFAULT_CHECKLIST_TEMPLATES;
    }
    if (!parsed.fulfillmentTemplates || !Array.isArray(parsed.fulfillmentTemplates) || parsed.fulfillmentTemplates.length === 0) {
      parsed.fulfillmentTemplates = DEFAULT_FULFILLMENT_TEMPLATES;
    }
    if (!parsed.fulfillmentInventory || !Array.isArray(parsed.fulfillmentInventory) || parsed.fulfillmentInventory.length === 0) {
      parsed.fulfillmentInventory = DEFAULT_FULFILLMENT_INVENTORY;
    }
    if (!parsed.regularInventory || !Array.isArray(parsed.regularInventory) || parsed.regularInventory.length === 0) {
      parsed.regularInventory = DEFAULT_REGULAR_INVENTORY;
    }
    if (!parsed.peakPlannerRecords || !Array.isArray(parsed.peakPlannerRecords) || parsed.peakPlannerRecords.length === 0) {
      parsed.peakPlannerRecords = DEFAULT_PEAK_PLANNER_RECORDS;
    } else {
      // Ensure missing default peak presets are present if user hasn't deleted them
      const existingPeakIds = new Set(parsed.peakPlannerRecords.map((p: any) => p.id));
      const missingPeakDefaults = DEFAULT_PEAK_PLANNER_RECORDS.filter(dp => !existingPeakIds.has(dp.id));
      if (missingPeakDefaults.length > 0) {
        parsed.peakPlannerRecords = [...parsed.peakPlannerRecords, ...missingPeakDefaults];
      }
    }
    if (!parsed.targetDestinations || !Array.isArray(parsed.targetDestinations) || parsed.targetDestinations.length === 0) {
      parsed.targetDestinations = DEFAULT_TARGET_DESTINATIONS;
    }
    if (!parsed.bookClassifications || !Array.isArray(parsed.bookClassifications) || parsed.bookClassifications.length === 0) {
      parsed.bookClassifications = DEFAULT_BOOK_CLASSIFICATIONS;
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

export interface InventoryStockMatch {
  orderItemName: string;
  matchedInventoryItem: RegularInventoryItem;
  availableQty: number;
  priorityFlag: InventoryUsagePriority;
  matchReason: string;
}

export function findInventoryStockMatches(
  orderItems: Array<{ productName: string; size?: string; colour?: string; details?: string }>,
  regularInventory: RegularInventoryItem[]
): InventoryStockMatch[] {
  if (!orderItems || orderItems.length === 0 || !regularInventory || regularInventory.length === 0) {
    return [];
  }

  const matches: InventoryStockMatch[] = [];
  const seenInventoryIds = new Set<string>();

  for (const item of orderItems) {
    const rawProdName = (item.productName || "").trim().toLowerCase();
    if (!rawProdName) continue;

    const reqSize = (item.size || "").trim().toLowerCase();
    const reqColour = (item.colour || "").trim().toLowerCase();

    for (const inv of regularInventory) {
      if (seenInventoryIds.has(inv.id)) continue;
      const invQty = inv.quantity || 0;
      if (invQty <= 0) continue; // Must have available on-hand stock
      
      const invPriority: InventoryUsagePriority = inv.usagePriority || "NORMAL";
      if (invPriority === "RESERVED") continue; // Never suggest reserved items for general orders

      const invName = (inv.productName || "").toLowerCase();
      const invNotes = (inv.notes || "").toLowerCase();

      let isMatch = false;
      let reason = "";

      // 1. Exact or partial product name match
      if (invName === rawProdName) {
        isMatch = true;
        reason = "Exact product name match";
      } else if (invName.includes(rawProdName) || rawProdName.includes(invName)) {
        isMatch = true;
        reason = "Matching product line";
      } else {
        // Token comparison: e.g. "T-Shirt", "Mug", "Hoodie", "Gift Box"
        const prodTokens = rawProdName.split(/[\s,/\-\(\)]+/).filter(t => t.length > 2);
        const invTokens = invName.split(/[\s,/\-\(\)]+/).filter(t => t.length > 2);
        const sharedTokens = prodTokens.filter(pt => invTokens.includes(pt));
        
        if (sharedTokens.length >= 2 || (sharedTokens.length === 1 && prodTokens.length === 1)) {
          isMatch = true;
          reason = `Matching attributes: ${sharedTokens.join(", ")}`;
        }
      }

      // If size specified, check size match
      if (isMatch && reqSize) {
        if (!invName.includes(reqSize) && !invNotes.includes(reqSize)) {
          const otherSizes = ["xs", "s", "m", "l", "xl", "2xl", "3xl"].filter(s => s !== reqSize);
          const hasOtherSize = otherSizes.some(s => invName.includes(` ${s} `) || invName.includes(`-${s}`) || invName.includes(`(${s})`));
          if (hasOtherSize) {
            isMatch = false;
          }
        }
      }

      // If colour specified, check colour match
      if (isMatch && reqColour) {
        if (!invName.includes(reqColour) && !invNotes.includes(reqColour)) {
          const commonColours = ["black", "white", "red", "blue", "green", "pink", "gold", "silver"].filter(c => c !== reqColour);
          const hasOtherColour = commonColours.some(c => invName.includes(c));
          if (hasOtherColour) {
            isMatch = false;
          }
        }
      }

      if (isMatch) {
        matches.push({
          orderItemName: item.productName,
          matchedInventoryItem: inv,
          availableQty: invQty,
          priorityFlag: invPriority,
          matchReason: reason
        });
        seenInventoryIds.add(inv.id);
      }
    }
  }

  // Sort matches so USE FIRST and CLEARANCE items surface at the top
  return matches.sort((a, b) => {
    const priorityScore = (p: InventoryUsagePriority) => {
      if (p === "USE FIRST") return 1;
      if (p === "CLEARANCE") return 2;
      if (p === "NORMAL") return 3;
      return 4;
    };
    return priorityScore(a.priorityFlag) - priorityScore(b.priorityFlag);
  });
}
