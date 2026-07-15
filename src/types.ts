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
  salesClassification?: "TS" | "MS" | "SM";
  archived?: boolean;
}

export type BookRankingStatus = "Never Sell" | "Dead Stock" | "Evaluate" | "Freeze" | "Stacked" | "Healthy" | "Test Again" | "Restock" | "Urgent Restock";
export type SalesClassification = "TS" | "MS" | "SM";

export interface BusinessEvent {
  id: string;
  title: string;
  date: string; // e.g. "2026-07-15"
  type: "CEO Day" | "Librarium Luxe Day" | "General Business Day";
  description?: string; // Product launches, marketing campaigns, inventory days, important company milestones, promotions, business deadlines
}

