export type ClientTier = "Silver" | "Gold" | "Platinum" | "Founders Family" | "Delinquent" | "Problematic";
export type ClientHome = "CEO Lifestyle" | "Librarium Luxe" | "CEO Lifestyle | Librarium Luxe";
export type BusinessRelationship = "CEO Lifestyle" | "Librarium Luxe" | "CEO Lifestyle + Librarium Luxe";
export type ProfileTheme = "CEO Blue" | "Librarium Crimson" | "Dual Burgundy Blend";
export type ManagementClassification = "Standard" | "VIP Priority" | "Problematic" | "Delinquent";

export type PromiseStatus = "Open" | "Fulfilled" | "Cancelled" | "Completed";
export type CommitmentStatus = PromiseStatus;

export interface ClientPromise {
  id: string;
  promise: string;
  commitment?: string;
  dueDate?: string;
  status: PromiseStatus;
  notes?: string;
  createdDate?: string;
  fulfilledDate?: string;
  completedDate?: string;
}

export type ClientCommitment = ClientPromise;

export type PrimaryBookClassification = 
  | "Mindset & Personal Development"
  | "Business & Money"
  | "Psychology & Human Behaviour"
  | "Relationships & Romance"
  | "Biography & Memoir"
  | string;

export const DEFAULT_BOOK_CLASSIFICATIONS: string[] = [
  "Mindset & Personal Development",
  "Business & Money",
  "Psychology & Human Behaviour",
  "Relationships & Romance",
  "Biography & Memoir"
];

export interface ClassificationHistoryRecord {
  id: string;
  tier: ClientTier;
  managementClassification?: ManagementClassification;
  businessRelationship?: BusinessRelationship;
  dateChanged: string;
  changedBy?: string;
  reason?: string;
}
export type HomeBrand = "CEO Printing Services" | "Librarium Luxe" | "CEO Lifestyle";
export type Gender = "Male" | "Female" | "Other" | "N/A";
export type YesNo = "Yes" | "No";
export type CommunicationStatus = "Active" | "Not Active" | "Unknown";

export type ProductionStatus = 
  | "New"
  | "Confirmed"
  | "In Progress"
  | "Ready"
  | "Out for Delivery"
  | "Ready for Collection"
  | "Completed"
  | "Cancelled"
  | "Awaiting Deposit"
  | "Awaiting Artwork"
  | "Ready for Production"
  | "In Production"
  | "Quality Check"
  | "Ready for Pickup"
  | "Ready for Delivery";

export type OperationsDeliveryMethod = 
  | "Store Pickup"
  | "Knutsford Express"
  | "Personal Delivery"
  | "Tara Courier"
  | "Other";

export type OrderPriority = "Low" | "Normal" | "High" | "Urgent";

export type InventoryUsagePriority = "NORMAL" | "USE FIRST" | "CLEARANCE" | "RESERVED";

export type ContactType = 
  | "Supplier"
  | "General Contact"
  | "Business Contact"
  | "Service Provider"
  | "Partner / Vendor"
  | "Other Important Contact";

export type ContactPrimaryClassification = "Suppliers & Vendors" | "Operational & Business Contacts";

export interface ContactPhoneContact {
  id: string;
  location: string;
  phoneNumber: string;
  contactPerson?: string;
  notes?: string;
}

export interface SupplierPhoneContact {
  id: string;
  location: string;
  phoneNumber: string;
  contactPerson?: string;
  notes?: string;
}

export interface SupplierDaySchedule {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface SupplierOperatingHours {
  monday?: SupplierDaySchedule;
  tuesday?: SupplierDaySchedule;
  wednesday?: SupplierDaySchedule;
  thursday?: SupplierDaySchedule;
  friday?: SupplierDaySchedule;
  saturday?: SupplierDaySchedule;
  sunday?: SupplierDaySchedule;
}

export interface ContactSupplierRecord {
  id: string;
  fullName: string;
  organization?: string;
  company?: string;
  rolePosition?: string;
  contactType: ContactType;
  primaryClassification?: ContactPrimaryClassification;
  roles: string[];
  phone: string;
  whatsapp?: string;
  email?: string;
  location?: string;
  address?: string;
  servicesProvided?: string;
  relationshipDetails?: string;
  notes?: string;
  keyNotes?: string;
  preferredContactMethod?: "Phone" | "WhatsApp" | "Email" | "In-Person";
  status: "Active" | "Inactive";
  phoneContacts?: ContactPhoneContact[];
  dateAdded?: string;
  lastUpdated?: string;

  // Supplier Specific Information
  isSupplier?: boolean;
  supplies?: string[];
  productsServicesSupplied?: string;
  pricingNotes?: string;
  paymentTerms?: string;
  leadTime?: string;
  reliability?: "High" | "Medium" | "Low" | "Unrated";
  lastOrder?: string;
  supplierNotes?: string;
  operatingHours?: SupplierOperatingHours;

  // Compatibility aliases for legacy fields
  supplierName?: string;
  contactPerson?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
}

export type ContactRecord = ContactSupplierRecord;
export type SupplierRecord = ContactSupplierRecord;

export interface BulkQuantityTier {
  id: string;
  minReq: number;
  maxReq: number;
  purchaseQty: number;
}

export interface RegularInventoryItem {
  id: string;
  productName: string;
  category: string;
  sku?: string;
  quantity: number;
  unitLabel: string;
  lowStockThreshold?: number;
  sellingPrice?: number;
  unitCost?: number;
  location?: string;
  notes?: string;
  dateAdded?: string;
  lastUpdated?: string;
  usagePriority?: InventoryUsagePriority;
}

export interface FulfillmentInventoryItem {
  id: string;
  itemName: string;
  availableQty: number;
  unitLabel?: string;
  category?: string;
  notes?: string;
  lastUpdated?: string;
  usagePriority?: InventoryUsagePriority;
  
  // Bulk purchasing rules attached directly to material
  bulkEnabled?: boolean;
  bulkUnitLabel?: string;
  minPurchaseQty?: number;
  bulkIncrement?: number;
  bulkTierRules?: BulkQuantityTier[];
  bulkNotes?: string;
  bulkRuleActive?: boolean;
}

export interface FulfillmentTemplateItem {
  id: string;
  componentName: string;
  quantity: number;
  unitLabel?: string;
  notes?: string;
  
  // Advanced Bulk Purchasing Rule Configuration
  bulkEnabled?: boolean;
  bulkUnitLabel?: string;
  minPurchaseQty?: number;
  bulkIncrement?: number;
  bulkTierRules?: BulkQuantityTier[];
  bulkNotes?: string;
  bulkRuleActive?: boolean;

  // Legacy fallback fields for backward compatibility
  bulkPurchaseMultiple?: number;
  bulkRuleType?: "multiples" | "exact";
}

export interface FulfillmentTemplate {
  id: string;
  productName: string;
  enabled: boolean;
  components: FulfillmentTemplateItem[];
  createdDate?: string;
  updatedDate?: string;
}

export interface OperationsOrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  details?: string;
  notes?: string;
  size?: string;
  colour?: string;
  color?: string;
  substituteColour?: string;
  substituteColor?: string;
  customization?: string;
  itemDescription?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  required?: boolean;
  customText?: string;
}

export interface ProductionChecklistTemplate {
  id: string;
  name: string;
  category?: string;
  description?: string;
  items: ChecklistItem[];
  isDefault?: boolean;
}

export interface OrderFulfillmentSnapshotItem {
  id: string;
  componentName: string;
  quantity: number;
  unitLabel?: string;
  notes?: string;
  bulkEnabled?: boolean;
  bulkUnitLabel?: string;
  minPurchaseQty?: number;
  bulkIncrement?: number;
  bulkTierRules?: BulkQuantityTier[];
  bulkNotes?: string;
  bulkRuleActive?: boolean;
  templateProductName?: string;
}

export interface OperationsOrder {
  id: string;
  orderNumber: string;
  company?: "CEO Lifestyle" | "Librarium Luxe";
  clientId: string;
  clientName: string;
  clientTier?: ClientTier;
  clientPhone?: string;
  items: OperationsOrderItem[] | string;
  quantityTotal: number;
  orderDate: string;
  dueDate: string;
  productionStatus: ProductionStatus;
  deliveryMethod: OperationsDeliveryMethod;
  deliveryLocation: string;
  assignedStaff?: string;
  internalNotes?: string;
  priority: OrderPriority;
  depositPaid?: boolean;
  depositAmount?: number;
  totalAmount?: number;
  createdDate?: string;
  dateOrderCreated?: string;
  updatedDate?: string;
  checklist?: ChecklistItem[];
  checklistTemplateName?: string;
  clientHome?: "CEO Lifestyle" | "Librarium Luxe" | string;
  adventist?: YesNo;
  expressOrder?: YesNo;
  expressNote?: string;
  fulfillmentSnapshot?: OrderFulfillmentSnapshotItem[];
  invoiceLogged?: boolean;
  invoiceLoggedDate?: string;
}

export interface ClientTierRecord {
  ceoId: string;
  customerFullName: string;
  manualTier: ClientTier | "";
  datePromoted: string;
  previousTier: string;
  promotionNotes: string;
}

export interface PromotionOpportunity {
  client: Client;
  ceoId: string;
  customerFullName: string;
  currentTier: ClientTier;
  calculatedTier: ClientTier;
  lifetimeSpend: number;
  totalOrders: number;
  averageOrderValue: number;
  clientScore: number;
  reason: string;
  recommendation: string;
}

export interface ContactInfo {
  phoneNumber: string;
  email: string;
  instagramUsername?: string;
  city: string;
  parish: string; // E.g., "St. James", "St. Andrew", "St. Ann", "N/A"
  country: string;
  deliveryAddress: string;
  deliveryCountry: string;
}

export interface FamilyProfile {
  motherName: string;
  motherBirthday?: string;
  motherDeceased?: boolean;
  fatherName: string;
  fatherBirthday?: string;
  fatherDeceased?: boolean;
  wifeName: string;
  wifeBirthday?: string;
  wifeDeceased?: boolean;
  husbandName: string;
  husbandBirthday?: string;
  husbandDeceased?: boolean;
  children: { name: string; birthday?: string; deceased?: boolean }[];
  otherFamilyMembers?: { relationship: string; name: string; birthday?: string; deceased?: boolean }[];
  pets: string;
  personalNotes: string;
}

export interface ImportantDate {
  label: string; // E.g., "Birthday", "Anniversary", "Wedding Date", "Proposal Date", "Company Anniversary", "Mother's Birthday"
  date: string;  // E.g., "March 14", "August 22, 2018", etc.
}

export interface OrderHistory {
  firstOrderDate: string;
  lastOrderDate: string;
  totalOrders: number;
  productsPurchased: string[];
  preferredCategories: string[];
  clientPreferences: string[];
  lifetimeRevenue: number; // in JMD
  averageOrderValue: number; // in JMD
}

export interface SportsProfile {
  sport: string; // E.g., "Football", "NFL", "Formula 1"
  favoriteTeam: string;
  teamOne: string;
  teamTwo: string;
  favoritePlayer: string;
  nationalTeam: string;
}

export interface LifestyleInterests {
  sports: SportsProfile;
  hobbies: string[];
  favoriteColors: string[];
  giftPreferences: string[];
  personalStylePreferences?: string[];
}

export interface TimelineEvent {
  id: string;
  type: 
    | "Conversation" 
    | "WhatsApp"
    | "Phone Call"
    | "Customer Response"
    | "In-Person"
    | "Email"
    | "Order Placement"
    | "Order Created"
    | "Order Status Changed"
    | "Order Completed"
    | "Order Cancelled"
    | "Order" 
    | "Gift" 
    | "Follow-up" 
    | "Note"
    | "Milestone"
    | "Tier Changed"
    | "Client Info Updated"
    | string;
  date: string;
  content: string;
  amount?: number; // optionally associated with Order or Gift
  method?: string; // e.g. "WhatsApp", "Phone Call", "In-Person", "System Auto"
  orderId?: string;
  orderNumber?: string;
}

export type OpportunityStatus = "Open" | "Follow Up Required" | "Resolved" | "Converted" | "Closed" | "Missed" | "Missed Opportunity";

export interface FollowUpReminder {
  id: string;
  date: string;
  task: string;
  completed: boolean;
  completedAt?: string;
  followUpCount?: number; // 0, 1, 2, 3 attempts
  followUpHistory?: FollowUpRecord[];
  opportunityStatus?: OpportunityStatus;
  nextActionDate?: string;
  milestone?: {
    clientName: string;
    personName: string;
    relationship: string;
    eventType: string;
    eventDate: string;
    recommendedActionDate: string;
    triggerType?: "advance_opportunity" | "actual_day";
    occurrenceYear?: number;
  };
}

export type RelationshipStatus = "Active" | "Warm" | "Dormant";
export type AccountStatus = "Active" | "Inactive" | "Archived";
export type TierSource = "Calculated" | "Manual";

export type RemembranceRelationship = 
  | "Mother"
  | "Father"
  | "Husband"
  | "Wife"
  | "Son"
  | "Daughter"
  | "Brother"
  | "Sister"
  | "Grandmother"
  | "Grandfather"
  | "Other";

export interface PersonalRemembrance {
  id: string;
  relationship: RemembranceRelationship | string;
  status: "Passed Away" | string;
  dateAdded?: string;
  remembranceDate?: string;
  notes?: string;
}

export type AdultTShirtSize = "XS" | "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "4XL" | "5XL";

export interface ApparelInformation {
  tShirtSize?: AdultTShirtSize | string;
  poloSize?: string;
  hoodieSize?: string;
  jerseySize?: string;
  hatSize?: string;
  shoeSize?: string;
  jacketSize?: string;
  ringSize?: string;
  braceletSize?: string;
  necklaceLength?: string;
  dressSize?: string;
  [key: string]: string | undefined;
}

export interface Client {
  id: string; // Client ID (CID), e.g., CEO0001
  firstName: string;
  lastName: string;
  gender: Gender;
  occupation: string;
  drive: YesNo;
  tier: ClientTier;
  homeBrand: HomeBrand;
  contact: ContactInfo;
  profile: FamilyProfile;
  importantDates: ImportantDate[];
  history: OrderHistory;
  interests: LifestyleInterests;
  timeline: TimelineEvent[];
  reminders: FollowUpReminder[];
  preferredCommunication: "Phone" | "Email" | "WhatsApp" | "N/A";
  lastContactedDate: string;
  marketingPermission?: YesNo;
  deactivated?: boolean;
  communicationStatus?: CommunicationStatus;
  businessRelationship?: BusinessRelationship;
  profileTheme?: ProfileTheme;
  managementClassification?: ManagementClassification;
  tierHistory?: ClassificationHistoryRecord[];
  healthScore?: number;
  relationshipStatus?: RelationshipStatus;
  accountStatus?: AccountStatus;
  tierSource?: TierSource;
  manualTierReason?: string;
  strategicAssociations?: string[];
  calculatedTier?: ClientTier;
  clientHome?: ClientHome | string;
  googleReview?: YesNo;
  adventist?: YesNo;
  favouriteAuthors?: string[];
  remembrances?: PersonalRemembrance[];
  apparelInfo?: ApparelInformation;
  promises?: ClientPromise[];
  commitments?: ClientPromise[];
  checkedIn?: boolean;
}

export interface InventorySalesMovement {
  id: string;
  date: string;
  quantitySold: number;
  clientName?: string;
}

export interface LuxeBookInventoryItem {
  id: string;
  title: string;
  category: string;
  primaryClassification?: PrimaryBookClassification;
  quantity: number;
  dateAdded: string; // e.g. "2026-05-15"
  salesHistory: InventorySalesMovement[];
  rankingStatus?: "Never Sell" | "Dead Stock" | "Evaluate" | "Freeze" | "Stacked" | "Healthy" | "Test Again" | "Restock" | "Urgent Restock";
  bookRank?: "Top Seller" | "Best Seller" | "High Performer" | "Standard" | "Slow Moving" | "New Release" | string;
  archived?: boolean;
  inStore?: number;
  office?: number;
  sellingPrice?: number;
}

export type AuthoritativeBookRank = "Top Seller" | "Medium Seller" | "Slow Mover" | "Never Sell" | "Unknown";
export type LegacyBookRank = "Best Seller" | "High Performer" | "Standard" | "Slow Moving" | "New Release";
export type BookRank = AuthoritativeBookRank | LegacyBookRank;

export type BookRankingStatus = "Never Sell" | "Dead Stock" | "Evaluate" | "Freeze" | "Stacked" | "Healthy" | "Test Again" | "Restock" | "Urgent Restock";

export enum UserRole {
  MASTER_ADMINISTRATOR = "Master Administrator",
  ADMINISTRATOR = "Administrator",
  MANAGER = "Manager",
  STAFF = "Staff",
  READ_ONLY_USER = "Read-Only User"
}

export enum UserStatus {
  ACTIVE = "Active",
  DEACTIVATED = "Deactivated"
}

export interface AppUser {
  id: string;
  fullName: string;
  username: string;
  password?: string;
  status: UserStatus;
  role: UserRole;
}

export type BusinessEventCategory = 
  | "CEO Business Day" 
  | "Librarium Luxe Business Day" 
  | "General Business Day"
  | "Gold / Platinum Client Events"
  | "Gold Client Events"
  | "Platinum Client Events"
  | "Silver Client Events"
  | "Founders Family Events"
  | "CEO Day"
  | "Librarium Luxe Day";

export type EventImportanceLevel = "Standard" | "Important" | "Critical";

export type CustomAlertTiming = "Same Day" | "1 Day Before" | "3 Days Before" | "7 Days Before" | "14 Days Before" | "Custom Date";

export type EventRepeatSchedule = "Does Not Repeat" | "Every Week" | "Every Month" | "Every Year" | "Custom Repeat Schedule";

export interface EventPreparationTask {
  id: string;
  task: string;
  completed: boolean;
}

export interface EventHistoryRecord {
  id: string;
  year: string;
  status: "Upcoming" | "In Progress" | "Completed";
  salesAchieved?: number;
  topProduct?: string;
  marketingChannel?: string;
  notes?: string;
}

export interface BusinessEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: BusinessEventCategory; // retained for backwards compatibility
  category?: BusinessEventCategory;
  importanceLevel?: EventImportanceLevel;
  alertTiming?: CustomAlertTiming;
  customAlertDate?: string; // YYYY-MM-DD
  repeatSchedule?: EventRepeatSchedule;
  description?: string;
  notes?: string;
  associatedClientId?: string;
  assignedUser?: string;
  preparationChecklist?: EventPreparationTask[];
  historicalNotes?: EventHistoryRecord[];
  completed?: boolean;
  recurringGroupId?: string;
}

export interface SupplierOption {
  id: string;
  name: string;
  costPerSheet: number;
  minOrder?: string;
  notes?: string;
}

export interface MaterialPriceHistoryRecord {
  id: string;
  price: number;
  date: string;
  reason?: string;
  updatedBy?: string;
}

export interface ProductionMaterialPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  cost: number;
  supplierNotes?: string;
  supplierOptions?: SupplierOption[];
  pricingHistory?: MaterialPriceHistoryRecord[];
  alternativeSources?: string;
  lastUpdatedDate?: string;
}

export interface DTFSupplier {
  id: string;
  name: string;
  sheetWidth: number;   // Width in inches
  sheetHeight: number;  // Height in inches
  costPerSheet: number; // Supplier cost in JMD
  deliveryCost: number; // Delivery fee in JMD
  notes?: string;
  active: boolean;
}

export interface DTFPricingPreset {
  id: string;
  sizeLabel: string;    // e.g. '4" × 4"', '12" × 10"', 'Pocket 12" × 12" + Back 12" × 10"', 'Oversized Print'
  width?: number;       // Print width in inches
  height?: number;      // Print height in inches
  sellingPrice: number; // Customer price in JMD
  active: boolean;
  notes?: string;
}

export interface DeliveryMethod {
  id: string;
  name: string; // E.g. "Knutsford Express", "Tara Courier", "Pickup", "In-House Delivery", "Office Collection", "Customer Delivery", "Local Courier", "International Shipping"
  type: "delivery" | "collection" | "shipping";
  defaultCost: number; // Cost in JMD
  active: boolean;
  messageTemplate: string; // Customer quote message template
  parish?: string; // Optional parish/coverage area
  estimatedTime?: string; // E.g. "24 Hours", "1-2 Business Days", "Same Day"
  notes?: string;
  pickupLocation?: string; // E.g. "Kingston Head Office"
  trackingSupported?: boolean;
}

export const OS_LOCATIONS = [
  "Operations Dashboard",
  "Client Directory",
  "Client Profile",
  "Delivery & Collection",
  "Production",
  "Quote Calculator",
  "T-Shirt Studio",
  "Librarium Luxe Operations",
  "General / All"
] as const;

export type OSLocation = typeof OS_LOCATIONS[number] | string;

export interface SystemQuoteTemplate {
  id: string;
  name: string;
  category: "ORDER DETAILS" | "CLIENT" | "SALES" | "ORDERS" | "PAYMENTS" | "EVENTS" | "PRODUCTION" | "LIBRARIUM LUXE" | "DOCUMENTS" | "GENERAL" | "Customer Communication" | "Sales Quotes" | "Operations" | "Quotations" | "Delivery & Collection" | string;
  toolKey?: "apparel" | "book" | "dtf" | "production_layout" | "location" | "general" | string;
  company?: "CEO Lifestyle" | "Librarium Luxe" | "Both" | "All" | string;
  businessHome?: "All" | "CEO Lifestyle" | "Librarium Luxe" | string;
  location?: OSLocation;
  documentType?: "message" | "quote" | "invoice" | "receipt" | "bill" | "statement" | "document" | "notice" | "order_details" | string;
  content: string;
  description?: string;
  placeholders?: string[];
  active: boolean;
  isDefault?: boolean;
}

export interface PeakProductMixItem {
  id: string;
  templateId?: string;
  productName: string;
  quantity: number; // Active planning target
  historicalEventSales?: Record<number, number>; // Historical actual sales for this event, e.g. { 2023: 32, 2024: 41, 2025: 38, 2026: 47 }
  yearPlans?: Record<number, number>; // Manual plan targets per planning year, e.g. { 2027: 50, 2028: 60 }
  yearActuals?: Record<number, number>; // Actual sales per year, e.g. { 2027: 58 }
}

export interface PeakPlannerRecord {
  id: string;
  name: string;
  emoji?: string;
  peakDate: string; // e.g. "2026-02-14" or start date
  peakEndDate?: string; // e.g. "2026-02-14" or end date
  prepStartDate: string; // e.g. "2026-01-15"
  planningYear?: number; // Active planning year, e.g. 2027
  expectedOrders: number; // e.g. 50
  historicalEventOrders?: Record<number, number>; // Historical order counts e.g. { 2024: 40, 2025: 55, 2026: 50 }
  orderYearPlans?: Record<number, number>; // Manual plan order counts per planning year e.g. { 2027: 60, 2028: 70 }
  expectedProductMix: PeakProductMixItem[];
  notes?: string;
  active: boolean;
  isDefaultPreset?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface SystemSettings {
  exchangeRate: number;
  shippingSingleBook: number;
  shippingMultipleBooks: number;
  businessMarkupPercent: number;
  roundingUpUnit: number;
  lowStockThreshold: number;
  restockThreshold: number;
  outOfStockAlertRules: boolean;
  defaultBookStatus: string;
  inventoryWarningLevels: "Low" | "Moderate" | "Strict";
  birthdayReminderDays: number;
  anniversaryReminderDays: number;
  proposalAnniversaryReminderDays: number;
  customMilestoneReminderDays: number;
  appName: string;
  footerText: string;
  companyName: string;
  businessSlogan: string;
  appLogo: string;
  appBg: string;
  authBg: string;
  masterUsername: string;
  sessionTimeoutMinutes: number;
  autoLogoutTimerMinutes: number;
  passwordPolicy: "Simple" | "Moderate" | "Strong";
  defaultDashboardView: "today" | "this_week" | "overview";
  defaultCalendarView: "month" | "week" | "agenda";
  dateFormat: "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY";
  currencyDisplayFormat: "Standard" | "Symbol Only";
  themePreference: "cosmic_slate" | "executive_dark" | "classic_light";
  dashboardCarouselDefaultIndex: number;
  luxeInventoryCarouselDefaultIndex: number;
  productionMaterials?: ProductionMaterialPreset[];
  dtfSuppliers?: DTFSupplier[];
  dtfPricingPresets?: DTFPricingPreset[];
  deliveryMethods?: DeliveryMethod[];
  quoteTemplates?: SystemQuoteTemplate[];
  checklistTemplates?: ProductionChecklistTemplate[];
  fulfillmentTemplates?: FulfillmentTemplate[];
  fulfillmentInventory?: FulfillmentInventoryItem[];
  regularInventory?: RegularInventoryItem[];
  peakPlannerRecords?: PeakPlannerRecord[];
  targetDestinations?: string[];
  bookClassifications?: string[];
  supplierDirectory?: SupplierRecord[];
  contactDirectory?: ContactRecord[];
  contactSupplierDirectory?: ContactSupplierRecord[];
}

export interface FollowUpRecord {
  id: string;
  attemptNumber: number;
  date: string;
  timestamp?: string;
  method?: string;
  channel?: string;
  notes: string;
  recordedBy?: string;
  loggedBy?: string;
  nextFollowUpDate?: string;
}

export interface BackupRecord {
  id: string;
  backupId?: string;
  date: string;
  createdBy: string;
  version: string;
  notes: string;
  fileFormat: "XLSX" | "JSON";
  fileName: string;
  itemCounts?: {
    clients?: number;
    aspiringClients?: number;
    inventory?: number;
    users?: number;
    operationsOrders?: number;
  };
}

export interface SavedQuotation {
  id: string;
  toolType: "layout" | "circular_layout" | "apparel" | "book" | "location" | "dtf" | "inhouse_dtf";
  clientName: string;
  title?: string;
  date?: string;
  totalCost?: number;
  quotedPrice?: number;
  details?: string;
  quoteNumber?: string;
  summaryText?: string;
  itemDetails?: Array<{
    name: string;
    quantity: number;
    unitPriceJMD?: number;
    subtotalJMD?: number;
  }>;
  subtotalJMD?: number;
  discountPercent?: number;
  discountAmountJMD?: number;
  totalJMD?: number;
  formattedResponseText?: string;
  createdAt?: string;
  createdBy?: string;
  status?: string;
  isFavorite?: boolean;
  favoritedAt?: string;
  displayOrder?: number;
  clientType?: string;
}

export type AspiringClientStatus = 
  | "New Inquiry" 
  | "Quote Sent"
  | "Follow Up Required" 
  | "Awaiting Response" 
  | "Interested" 
  | "Converted to Client" 
  | "Not Interested" 
  | "Archived";

export interface AspiringClient {
  id: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  instagramUsername?: string;
  preferredContactMethod?: "Instagram" | "Phone Call" | "WhatsApp" | "SMS" | "Email" | "In Person" | "Other" | string;
  contactInfo: string;
  sourceOfInquiry: "Instagram" | "Referral" | "Website" | "Walk-in" | "Phone Call" | "Other" | string;
  serviceInterestedIn: string;
  dateContacted: string; // YYYY-MM-DD
  lastContactDate?: string;
  notes: string;
  assignedUser: string;
  status: AspiringClientStatus;
  followUpDate: string; // YYYY-MM-DD
  followUpCount?: number; // 0 to 3+
  followUpHistory?: FollowUpRecord[];
  archiveReason?: "Not Interested" | "No Response" | "Converted to Client" | "Keep Active" | "Other" | string;
  archivedDate?: string;
  clientHome?: "CEO Lifestyle" | "Librarium Luxe" | string;
  adventist?: YesNo;
  favouriteAuthors?: string[];
  priority?: "Normal" | "High" | "Urgent";
}

export interface ExecutiveChecklistItem {
  id: string;
  task: string;
  dueDate?: string; // YYYY-MM-DD
  priority?: "High" | "Normal";
  notes?: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

