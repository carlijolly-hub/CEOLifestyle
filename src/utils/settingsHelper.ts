import { SystemSettings } from "../types";

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
  luxeInventoryCarouselDefaultIndex: 0
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
    // Merge defaults to ensure no missing keys if schema updates
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
