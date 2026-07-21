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

export interface BusinessEvent {
  id: string;
  title: string;
  date: string; // e.g. "2026-07-15"
  type: "Gold / Platinum Client Events" | "Gold Client Events" | "Platinum Client Events" | "Silver Client Events" | "CEO Day" | "Librarium Luxe Day" | "General Business Day";
  description?: string; // Product launches, marketing campaigns, inventory days, important company milestones, promotions, business deadlines
  associatedClientId?: string;
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
}

