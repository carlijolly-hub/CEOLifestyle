import * as XLSX from "xlsx";
import { Client, ImportantDate } from "../types";
import { getCurrentEnvironment } from "./environmentUtils";

// Flatten customer object to a simple flat row for spreadsheets
export function customerToFlatRow(customer: Client) {
  const importantDates = customer.importantDates || [];
  const otherDates = importantDates
    .filter(d => !["Birthday", "Anniversary", "Wedding Date", "Proposal Date"].includes(d.label))
    .map(d => `${d.label}: ${d.date}`)
    .join("; ");

  const children = customer.profile?.children || [];
  const childrenStr = children
    .map(c => `${c.name}${c.birthday ? ` (${c.birthday})` : ""}`)
    .join(", ");

  const hobbies = customer.interests?.hobbies || [];
  const favoriteColors = customer.interests?.favoriteColors || [];
  const giftPreferences = customer.interests?.giftPreferences || [];

  const rel = customer.businessRelationship || (customer.homeBrand === "Librarium Luxe" ? "Librarium Luxe" : "CEO Lifestyle");

  return {
    "CL ID": customer.id || "",
    "Client Full Name": `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
    "Client Home": rel,
    "Business Relationship": rel,
    "First Name": customer.firstName || "",
    "Last Name": customer.lastName || "",
    "Final Tier": customer.tier || "Silver",
    "Client Tier": customer.tier || "Silver",
    "Tier Source": customer.tierSource || (["Founders Family", "Delinquent", "Problematic"].includes(customer.tier) ? "Manual" : "Calculated"),
    "Management Status": customer.managementClassification || "Standard",
    "Account Status": customer.accountStatus || (customer.deactivated ? "Inactive" : "Active"),
    "Relationship Status": customer.relationshipStatus || (customer.communicationStatus === "Active" ? "Active" : "Warm"),
    "Health Score": typeof customer.healthScore === "number" ? customer.healthScore : 75,
    "First Order Date": customer.history?.firstOrderDate || "",
    "Last Order Date": customer.history?.lastOrderDate || "",
    "Total Orders": customer.history?.totalOrders || 0,
    "Lifetime Spend": customer.history?.lifetimeRevenue || 0,
    "Lifetime Revenue (JMD)": customer.history?.lifetimeRevenue || 0,
    "AOV": customer.history?.averageOrderValue || 0,
    "Average Order Value (JMD)": customer.history?.averageOrderValue || 0,
    "Gender": customer.gender || "",
    "Occupation": customer.occupation || "",
    "Drive (Yes/No)": customer.drive || "",
    "Phone Number": customer.contact?.phoneNumber || "",
    "Communication Status": customer.communicationStatus || "Unknown",
    "Email Address": customer.contact?.email || "",
    "Instagram Username": customer.contact?.instagramUsername || "",
    "City": customer.contact?.city || "",
    "Parish (Jamaica)": customer.contact?.parish || "",
    "Country": customer.contact?.country || "",
    "Delivery Address": customer.contact?.deliveryAddress || "",
    "Delivery Country": customer.contact?.deliveryCountry || "",
    "Mother Name": customer.profile?.motherName || "",
    "Father Name": customer.profile?.fatherName || "",
    "Wife Name": customer.profile?.wifeName || "",
    "Husband Name": customer.profile?.husbandName || "",
    "Children Names & Birthdays": childrenStr,
    "Pets": customer.profile?.pets || "",
    "Personal Notes": customer.profile?.personalNotes || "",
    "Birthday": importantDates.find(d => d.label === "Birthday")?.date || "",
    "Anniversary": importantDates.find(d => d.label === "Anniversary")?.date || "",
    "Wedding Date": importantDates.find(d => d.label === "Wedding Date")?.date || "",
    "Proposal Date": importantDates.find(d => d.label === "Proposal Date")?.date || "",
    "Other Important Dates": otherDates,
    "Products Purchased": (customer.history?.productsPurchased || []).join(", "),
    "Preferred Products / Categories": (customer.history?.preferredCategories || []).join(", "),
    "Client Preferences": (customer.history?.clientPreferences || []).join(", "),
    "Hobbies": hobbies.join(", "),
    "Favorite Colors": favoriteColors.join(", "),
    "Gift Preferences": giftPreferences.join(", "),
    "Sport / League": customer.interests?.sports?.sport || "",
    "Favorite Team": customer.interests?.sports?.favoriteTeam || "",
    "Team One": customer.interests?.sports?.teamOne || "",
    "Team Two": customer.interests?.sports?.teamTwo || "",
    "National Team": customer.interests?.sports?.nationalTeam || "",
    "Favorite Player": customer.interests?.sports?.favoritePlayer || "",
    "Preferred Communication Method": customer.preferredCommunication || "",
    "Last Contacted Date": customer.lastContactedDate || ""
  };
}

// Convert a flat row from excel back to nested Customer object
export function flatRowToCustomer(row: any): Client {
  const parseList = (val: any): string[] => {
    if (!val) return [];
    return String(val)
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  };

  const parseChildren = (val: any) => {
    if (!val) return [];
    return String(val)
      .split(",")
      .map(s => {
        const item = s.trim();
        // Check for format: Name (Birthday)
        const match = item.match(/^([^(]+)\(([^)]+)\)$/);
        if (match) {
          return { name: match[1].trim(), birthday: match[2].trim() };
        }
        return { name: item };
      })
      .filter(c => c.name);
  };

  // Extract dates
  const importantDates: ImportantDate[] = [];
  if (row["Birthday"]) {
    importantDates.push({ label: "Birthday", date: String(row["Birthday"]).trim() });
  }
  if (row["Anniversary"]) {
    importantDates.push({ label: "Anniversary", date: String(row["Anniversary"]).trim() });
  }
  if (row["Wedding Date"]) {
    importantDates.push({ label: "Wedding Date", date: String(row["Wedding Date"]).trim() });
  }
  if (row["Proposal Date"]) {
    importantDates.push({ label: "Proposal Date", date: String(row["Proposal Date"]).trim() });
  }
  if (row["Other Important Dates"]) {
    String(row["Other Important Dates"])
      .split(";")
      .forEach(s => {
        const parts = s.split(":");
        if (parts.length >= 2) {
          importantDates.push({
            label: parts[0].trim(),
            date: parts.slice(1).join(":").trim()
          });
        }
      });
  }

  // Fallback IDs if they are not in the spreadsheet
  const randomId = String(Math.floor(100000 + Math.random() * 900000));
  const rawClId = row["CL ID"] || row["Client ID"] || row["CEO ID"] || row["id"];
  const cid = rawClId ? String(rawClId).trim() : randomId;

  // Name parsing from "Client Full Name" or "First Name" + "Last Name"
  let firstName = row["First Name"] ? String(row["First Name"]).trim() : "";
  let lastName = row["Last Name"] ? String(row["Last Name"]).trim() : "";
  if (!firstName && row["Client Full Name"]) {
    const nameParts = String(row["Client Full Name"]).trim().split(/\s+/);
    firstName = nameParts[0] || "New";
    lastName = nameParts.slice(1).join(" ") || "Client";
  }
  if (!firstName) firstName = "New";
  if (!lastName) lastName = "Client";

  const parseCleanNumber = (val: any): number => {
    if (typeof val === "number") return val;
    if (!val) return 0;
    const cleaned = String(val).replace(/[^0-9.-]+/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const totalOrders = parseCleanNumber(row["Total Orders"] ?? row["Orders"]);
  const lifetimeRevenue = parseCleanNumber(row["Lifetime Spend"] ?? row["Lifetime Revenue (JMD)"] ?? row["lifetimeRevenue"] ?? row["Lifetime Revenue"]);
  const averageOrderValue = parseCleanNumber(row["AOV"] ?? row["Average Order Value (JMD)"] ?? row["averageOrderValue"] ?? row["Average Order Value"]) || (totalOrders > 0 ? Math.round(lifetimeRevenue / totalOrders) : 0);

  const statusRaw = String(row["Account Status"] || row["Status"] || "").trim().toLowerCase();
  const isDeactivatedVal = statusRaw === "deactivated" || statusRaw === "inactive" || statusRaw === "archived";

  const relationshipHomeRaw = String(row["Client Home"] || row["Business Relationship"] || row["Home Brand"] || "CEO Lifestyle").trim();
  let businessRelationship: "CEO Lifestyle" | "Librarium Luxe" | "CEO Lifestyle + Librarium Luxe" = "CEO Lifestyle";
  if (relationshipHomeRaw.includes("|") || relationshipHomeRaw.includes("+") || relationshipHomeRaw.toLowerCase().includes("both")) {
    businessRelationship = "CEO Lifestyle + Librarium Luxe";
  } else if (relationshipHomeRaw.toLowerCase().includes("librarium")) {
    businessRelationship = "Librarium Luxe";
  } else {
    businessRelationship = "CEO Lifestyle";
  }

  const profileTheme = businessRelationship === "Librarium Luxe" ? "Librarium Crimson" : businessRelationship === "CEO Lifestyle + Librarium Luxe" ? "Dual Burgundy Blend" : "CEO Blue";

  const tierRaw = String(row["Final Tier"] || row["Client Tier"] || row["Customer Tier"] || "Silver").trim();
  let finalTier: any = "Silver";
  if (tierRaw.toLowerCase().includes("founders")) finalTier = "Founders Family";
  else if (tierRaw.toLowerCase().includes("delinquent")) finalTier = "Delinquent";
  else if (tierRaw.toLowerCase().includes("problematic")) finalTier = "Problematic";
  else if (tierRaw.toLowerCase().includes("platinum") || tierRaw === "VIP") finalTier = "Platinum";
  else if (tierRaw.toLowerCase().includes("gold")) finalTier = "Gold";
  else finalTier = "Silver";

  const relStatusRaw = String(row["Relationship Status"] || row["Communication Status"] || "Active").trim();
  const relationshipStatus: "Active" | "Warm" | "Dormant" = (relStatusRaw === "Dormant" || relStatusRaw === "Warm") ? relStatusRaw : "Active";

  const healthScoreRaw = Number(row["Health Score"]);
  const healthScore = !isNaN(healthScoreRaw) && healthScoreRaw >= 0 ? healthScoreRaw : 75;

  const mgmtRaw = String(row["Management Status"] || row["Management Classification"] || "").trim();
  let managementClassification: any = "Standard";
  if (mgmtRaw === "Problematic" || finalTier === "Problematic") managementClassification = "Problematic";
  else if (mgmtRaw === "Delinquent" || finalTier === "Delinquent") managementClassification = "Delinquent";
  else if (mgmtRaw === "VIP Priority" || finalTier === "Founders Family" || finalTier === "Platinum") managementClassification = "VIP Priority";

  return {
    id: cid,
    deactivated: isDeactivatedVal,
    firstName,
    lastName,
    gender: (row["Gender"] || "N/A") as any,
    occupation: row["Occupation"] ? String(row["Occupation"]).trim() : "Business Owner",
    drive: (row["Drive (Yes/No)"] === "Yes" || row["Drive (Yes/No)"] === "No") ? row["Drive (Yes/No)"] : "No",
    tier: finalTier,
    homeBrand: businessRelationship === "Librarium Luxe" ? "Librarium Luxe" : "CEO Lifestyle",
    businessRelationship,
    profileTheme,
    managementClassification,
    healthScore,
    relationshipStatus,
    accountStatus: isDeactivatedVal ? "Inactive" : "Active",
    tierSource: (row["Tier Source"] || (["Founders Family", "Delinquent", "Problematic"].includes(finalTier) ? "Manual" : "Calculated")) as any,
    contact: {
      phoneNumber: row["Phone Number"] ? String(row["Phone Number"]).trim() : "",
      email: row["Email Address"] ? String(row["Email Address"]).trim() : "",
      instagramUsername: row["Instagram Username"] ? String(row["Instagram Username"]).trim() : "",
      city: row["City"] ? String(row["City"]).trim() : "",
      parish: row["Parish (Jamaica)"] ? String(row["Parish (Jamaica)"]).trim() : "N/A",
      country: row["Country"] ? String(row["Country"]).trim() : "Jamaica",
      deliveryAddress: row["Delivery Address"] ? String(row["Delivery Address"]).trim() : "",
      deliveryCountry: row["Delivery Country"] ? String(row["Delivery Country"]).trim() : "Jamaica"
    },
    profile: {
      motherName: row["Mother Name"] ? String(row["Mother Name"]).trim() : "",
      fatherName: row["Father Name"] ? String(row["Father Name"]).trim() : "",
      wifeName: row["Wife Name"] ? String(row["Wife Name"]).trim() : "",
      husbandName: row["Husband Name"] ? String(row["Husband Name"]).trim() : "",
      children: parseChildren(row["Children Names & Birthdays"]),
      pets: row["Pets"] ? String(row["Pets"]).trim() : "None",
      personalNotes: row["Personal Notes"] ? String(row["Personal Notes"]).trim() : ""
    },
    importantDates,
    history: {
      firstOrderDate: row["First Order Date"] ? String(row["First Order Date"]).trim() : "",
      lastOrderDate: row["Last Order Date"] ? String(row["Last Order Date"]).trim() : "",
      totalOrders,
      productsPurchased: parseList(row["Products Purchased"]),
      preferredCategories: parseList(row["Preferred Products / Categories"]),
      clientPreferences: parseList(row["Client Preferences"] || row["Customer Preferences"]),
      lifetimeRevenue,
      averageOrderValue
    },
    interests: {
      sports: {
        sport: row["Sport / League"] ? String(row["Sport / League"]).trim() : "",
        favoriteTeam: row["Favorite Team"] ? String(row["Favorite Team"]).trim() : "",
        teamOne: row["Team One"] ? String(row["Team One"]).trim() : "",
        teamTwo: row["Team Two"] ? String(row["Team Two"]).trim() : "",
        nationalTeam: row["National Team"] ? String(row["National Team"]).trim() : "",
        favoritePlayer: row["Favorite Player"] ? String(row["Favorite Player"]).trim() : ""
      },
      hobbies: parseList(row["Hobbies"]),
      favoriteColors: parseList(row["Favorite Colors"]),
      giftPreferences: parseList(row["Gift Preferences"])
    },
    timeline: [
      {
        id: `t_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type: "Note",
        date: new Date().toISOString().split("T")[0],
        content: "Record imported/updated via Master Database sync."
      }
    ],
    reminders: [],
    preferredCommunication: (row["Preferred Communication Method"] || "Email") as any,
    lastContactedDate: row["Last Contacted Date"] ? String(row["Last Contacted Date"]).trim() : "",
    communicationStatus: (row["Communication Status"] === "Active" || row["Communication Status"] === "Not Active" || row["Communication Status"] === "Unknown") ? row["Communication Status"] : "Unknown"
  };
}

// Download Excel File helper with Environment Export Protection
export function downloadExcel(sheets: { name: string; data: any[] }[], filename: string, createdBy: string = "Master Administrator") {
  const env = getCurrentEnvironment();
  const prefix = env === "LIVE" ? "" : "STRESS_MODE_";

  let baseName = filename;
  if (baseName.startsWith("LIVE_MODE_")) baseName = baseName.replace("LIVE_MODE_", "");
  if (baseName.startsWith("STRESS_MODE_")) baseName = baseName.replace("STRESS_MODE_", "");

  const cleanName = baseName.endsWith(".xlsx") ? baseName.slice(0, -5) : baseName;
  const finalFilename = `${prefix}${cleanName}.xlsx`;

  const wb = XLSX.utils.book_new();
  sheets.forEach(sheet => {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });

  // Always append SYSTEM_REFERENCE metadata worksheet
  if (!sheets.some(s => s.name === "SYSTEM_REFERENCE")) {
    const now = new Date();
    const dateFormatted = now.toLocaleDateString("en-GB"); // 24/07/2026
    const timeFormatted = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }); // 01:40 PM
    const sysRefData = [
      { "Field": "Environment", "Value": env === "LIVE" ? "LIVE MODE" : "STRESS TEST MODE" },
      { "Field": "Export Date", "Value": dateFormatted },
      { "Field": "Export Time", "Value": timeFormatted },
      { "Field": "Application Version", "Value": "V2.1" },
      { "Field": "Exported By", "Value": createdBy }
    ];
    const wsRef = XLSX.utils.json_to_sheet(sysRefData);
    XLSX.utils.book_append_sheet(wb, wsRef, "SYSTEM_REFERENCE");
  }

  XLSX.writeFile(wb, finalFilename);
}

// 1. Download Master Customer Database
export function exportClientsExcel(customers: Client[], category: string) {
  let list = Array.isArray(customers) && customers.length > 0 ? customers : [];
  if (list.length === 0) {
    try {
      const stored = localStorage.getItem("ceo_librarium_crm_customers") || localStorage.getItem("ceo_client_management_data");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      }
    } catch (e) {}
  }
  const flatData = list.map(c => customerToFlatRow(c));
  downloadExcel([{ name: "Clients", data: flatData }], `CRM_Clients_${category}`);
}

// 2. Export Custom Reports
export function exportReport(type: string, customers: Client[]) {
  let list = Array.isArray(customers) && customers.length > 0 ? customers : [];
  if (list.length === 0) {
    try {
      const stored = localStorage.getItem("ceo_librarium_crm_customers") || localStorage.getItem("ceo_client_management_data");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      }
    } catch (e) {}
  }

  let sheets: { name: string; data: any[] }[] = [];
  let filename = `CRM_Report_${type}`;

  switch (type) {
    case "lifetime_value":
      sheets = [
        {
          name: "Lifetime Client Value",
          data: list
            .map(c => ({
              "Client ID": c.id,
              "Status": c.deactivated ? "Deactivated" : "Active",
              "Client Name": `${c.firstName} ${c.lastName}`,
              "Client Tier": c.tier,
              "Home Brand": c.homeBrand,
              "Total Orders": c.history.totalOrders,
              "Lifetime Revenue (JMD)": c.history.lifetimeRevenue,
              "Average Order Value (JMD)": c.history.averageOrderValue,
              "First Order Date": c.history.firstOrderDate,
              "Last Order Date": c.history.lastOrderDate
            }))
            .sort((a, b) => b["Lifetime Revenue (JMD)"] - a["Lifetime Revenue (JMD)"])
        }
      ];
      break;

    case "repeat_customers":
      sheets = [
        {
          name: "Repeat Clients",
          data: list
            .filter(c => (c.history?.totalOrders || 0) >= 2)
            .map(c => ({
              "Client ID": c.id,
              "Status": c.deactivated ? "Deactivated" : "Active",
              "Client Name": `${c.firstName} ${c.lastName}`,
              "Client Tier": c.tier,
              "Home Brand": c.homeBrand,
              "Total Orders": c.history?.totalOrders || 0,
              "Lifetime Revenue (JMD)": c.history?.lifetimeRevenue || 0,
              "Average Order Value (JMD)": c.history?.averageOrderValue || 0
            }))
            .sort((a, b) => b["Total Orders"] - a["Total Orders"])
        }
      ];
      break;

    case "product_preferences":
      sheets = [
        {
          name: "Product Preferences",
          data: list.map(c => ({
            "Client ID": c.id,
            "Status": c.deactivated ? "Deactivated" : "Active",
            "Client Name": `${c.firstName} ${c.lastName}`,
            "Client Tier": c.tier,
            "Home Brand": c.homeBrand,
            "Preferred Categories": (c.history?.preferredCategories || []).join(", "),
            "Products Purchased": (c.history?.productsPurchased || []).join(", "),
            "Client Preferences": (c.history?.clientPreferences || []).join(", "),
            "Favorite Colors": (c.interests?.favoriteColors || []).join(", "),
            "Gift Preferences": (c.interests?.giftPreferences || []).join(", ")
          }))
        }
      ];
      break;

    case "dates_reminders":
      sheets = [
        {
          name: "Upcoming Dates & Birthdays",
          data: list.flatMap(c =>
            (c.importantDates || []).map(d => ({
              "Client ID": c.id,
              "Status": c.deactivated ? "Deactivated" : "Active",
              "Client Name": `${c.firstName} ${c.lastName}`,
              "Client Tier": c.tier,
              "Event / Occasion": d.label,
              "Date Details": d.date,
              "Preferred Contact Method": c.preferredCommunication || "",
              "Phone Number": c.contact?.phoneNumber || "",
              "Email Address": c.contact?.email || ""
            }))
          )
        }
      ];
      break;

    case "overseas_purchasers":
      sheets = [
        {
          name: "Overseas Ordering Family Gifts",
          data: list
            .filter(c => c.contact?.country && c.contact.country !== "Jamaica")
            .map(c => ({
              "Client ID": c.id,
              "Status": c.deactivated ? "Deactivated" : "Active",
              "Client Name": `${c.firstName} ${c.lastName}`,
              "Client Tier": c.tier,
              "Residing Country": c.contact?.country || "",
              "Residing City": c.contact?.city || "",
              "Recipient Delivery Address": c.contact?.deliveryAddress || "",
              "Recipient Delivery Country": c.contact?.deliveryCountry || "",
              "Phone Number": c.contact?.phoneNumber || "",
              "Email Address": c.contact?.email || "",
              "Personal Notes": c.profile?.personalNotes || ""
            }))
        }
      ];
      break;

    case "sales_history":
      sheets = [
        {
          name: "Sales Metrics",
          data: list.map(c => ({
            "Client ID": c.id,
            "Status": c.deactivated ? "Deactivated" : "Active",
            "Client Name": `${c.firstName} ${c.lastName}`,
            "Tier": c.tier,
            "Brand": c.homeBrand,
            "Total Orders Placed": c.history?.totalOrders || 0,
            "Revenue Lifetime Value (JMD)": c.history?.lifetimeRevenue || 0,
            "Average Invoice Amount": c.history?.averageOrderValue || 0
          }))
        }
      ];
      break;

    default:
      // Default Master Database Report
      sheets = [{ name: "Database Report", data: list.map(c => customerToFlatRow(c)) }];
  }

  downloadExcel(sheets, filename);
}

// 3. Download Empty Upload Template
export function downloadUploadTemplate() {
  const templateRows = [
    {
      "Client ID": "10001 (Optional - leave empty for auto-generate)",
      "Status": "Active",
      "First Name": "Jane",
      "Last Name": "Doe",
      "Gender": "Female",
      "Occupation": "Art Director",
      "Drive (Yes/No)": "Yes",
      "Client Tier": "VIP",
      "Home Brand": "Librarium Luxe",
      "Phone Number": "+1 (876) 555-9999",
      "Email Address": "jane.doe@email.com",
      "City": "Kingston",
      "Parish (Jamaica)": "St. Andrew",
      "Country": "Jamaica",
      "Delivery Address": "12 Constant Spring Rd, Kingston",
      "Delivery Country": "Jamaica",
      "Mother Name": "Mary Doe",
      "Father Name": "John Doe Sr",
      "Wife Name": "N/A",
      "Husband Name": "Robert Doe",
      "Children Names & Birthdays": "Lucy Doe (June 10), Mark Doe (September 15)",
      "Pets": "Lola (Cat)",
      "Personal Notes": "Prefers weekend deliveries and luxury boxes.",
      "Birthday": "January 14",
      "Anniversary": "December 20",
      "Wedding Date": "December 20, 2021",
      "Proposal Date": "February 14, 2020",
      "Other Important Dates": "Company Launch: June 15",
      "First Order Date": "2024-03-10",
      "Last Order Date": "2026-06-12",
      "Total Orders": 4,
      "Products Purchased": "Romance Books, Mindset Journals, Deluxe Gift Boxes",
      "Preferred Products / Categories": "Romance Collection, Luxury Presentation",
      "Client Preferences": "Gold ribbons, Pink themes",
      "Lifetime Revenue (JMD)": 150000,
      "Average Order Value (JMD)": 37500,
      "Hobbies": "Reading, Yoga, Painting",
      "Favorite Colors": "Pink, Gold, Lilac",
      "Gift Preferences": "Luxury feminine gifts",
      "Sport / League": "Football (Premier League)",
      "Favorite Team": "Manchester City",
      "Team One": "Manchester City",
      "Team Two": "Arsenal",
      "National Team": "Reggae Girlz",
      "Favorite Player": "Kevin De Bruyne",
      "Preferred Communication Method": "WhatsApp",
      "Last Contacted Date": "2026-06-12"
    }
  ];

  // Helper validation instructions sheet
  const instructionRows = [
    {
      "Field Name": "Client ID",
      "Allowed Values": "Any numeric code (e.g. 10008). If empty, auto-generates.",
      "Required": "No"
    },
    {
      "Field Name": "Status",
      "Allowed Values": "Active, Deactivated",
      "Required": "No (Defaults to Active)"
    },
    {
      "Field Name": "First Name / Last Name",
      "Allowed Values": "Any plain text",
      "Required": "Yes"
    },
    {
      "Field Name": "Gender",
      "Allowed Values": "Male, Female, Other, N/A",
      "Required": "No"
    },
    {
      "Field Name": "Drive (Yes/No)",
      "Allowed Values": "Yes, No",
      "Required": "No"
    },
    {
      "Field Name": "Client Tier",
      "Allowed Values": "Silver, Gold, Platinum",
      "Required": "No"
    },
    {
      "Field Name": "Home Brand",
      "Allowed Values": "CEO Printing Services, Librarium Luxe, CEO Lifestyle",
      "Required": "No"
    },
    {
      "Field Name": "Country / Delivery Country",
      "Allowed Values": "E.g. Jamaica, United States, Canada, United Kingdom",
      "Required": "Yes"
    },
    {
      "Field Name": "Parish (Jamaica)",
      "Allowed Values": "St. James, St. Andrew, St. Ann, Kingston, Hanover, etc. Use N/A for overseas.",
      "Required": "No (Required only for Jamaican residents)"
    },
    {
      "Field Name": "Children Names & Birthdays",
      "Allowed Values": "Comma-separated. Format: Name (Birthday). E.g. Joshua (May 6), Mia (Nov 19)",
      "Required": "No"
    },
    {
      "Field Name": "Other Important Dates",
      "Allowed Values": "Format: DateLabel: Date. Semi-colon separated. E.g. Mother's Birthday: Sept 3; Company Anniversary: March 10",
      "Required": "No"
    },
    {
      "Field Name": "Total Orders / Lifetime Revenue (JMD)",
      "Allowed Values": "Numeric values only. Do not add currency symbols.",
      "Required": "No"
    },
    {
      "Field Name": "Preferred Communication Method",
      "Allowed Values": "Phone, Email, WhatsApp, N/A",
      "Required": "No"
    }
  ];

  downloadExcel(
    [
      { name: "Template Sheet", data: templateRows },
      { name: "Data Validation & Helper Guide", data: instructionRows }
    ],
    "CRM_Upload_Template"
  );
}
