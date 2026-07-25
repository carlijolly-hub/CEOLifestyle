export type ClientTier = "Silver" | "Gold" | "Platinum";
export type HomeBrand = "CEO Printing Services" | "Librarium Luxe" | "CEO Lifestyle";
export type Gender = "Male" | "Female" | "Other" | "N/A";
export type YesNo = "Yes" | "No";

export interface ContactInfo {
  phoneNumber: string;
  email: string;
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
  type: "Conversation" | "Order" | "Gift" | "Follow-up" | "Note";
  date: string;
  content: string;
  amount?: number; // optionally associated with Order or Gift
}

export interface FollowUpReminder {
  id: string;
  date: string;
  task: string;
  completed: boolean;
  milestone?: {
    clientName: string;
    personName: string;
    relationship: string;
    eventType: string;
    eventDate: string;
    recommendedActionDate: string;
  };
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

export type BookRankingStatus = "Never Sell" | "Dead Stock" | "Evaluate" | "Freeze" | "Stacked" | "Healthy" | "Test Again" | "Restock" | "Urgent Restock";
export type BookRank = "Top Seller" | "Best Seller" | "High Performer" | "Standard" | "Slow Moving" | "New Release";

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

export interface SystemQuoteTemplate {
  id: string;
  name: string;
  category: "Quotations" | "Delivery & Collection" | "Customer Communications";
  toolKey?: "apparel" | "book" | "dtf" | "production_layout" | "location" | "general";
  content: string;
  description?: string;
  placeholders?: string[];
  active: boolean;
  isDefault?: boolean;
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
  };
}

export interface SavedQuotation {
  id: string;
  toolType: "layout" | "apparel" | "book" | "location" | "dtf";
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
  contactInfo: string;
  sourceOfInquiry: "Instagram" | "Referral" | "Website" | "Walk-in" | "Phone Call" | "Other" | string;
  serviceInterestedIn: string;
  dateContacted: string; // YYYY-MM-DD
  notes: string;
  assignedUser: string;
  status: AspiringClientStatus;
  followUpDate: string; // YYYY-MM-DD
}

