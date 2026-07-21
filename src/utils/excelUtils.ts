import * as XLSX from "xlsx";
import { Client, ImportantDate } from "../types";

// Flatten customer object to a simple flat row for spreadsheets
export function customerToFlatRow(customer: Client) {
  const otherDates = customer.importantDates
    .filter(d => !["Birthday", "Anniversary", "Wedding Date", "Proposal Date"].includes(d.label))
    .map(d => `${d.label}: ${d.date}`)
    .join("; ");

  const childrenStr = customer.profile.children
    .map(c => `${c.name}${c.birthday ? ` (${c.birthday})` : ""}`)
    .join(", ");

  return {
    "Client ID": customer.id,
    "Status": customer.deactivated ? "Deactivated" : "Active",
    "First Name": customer.firstName,
    "Last Name": customer.lastName,
    "Gender": customer.gender,
    "Occupation": customer.occupation,
    "Drive (Yes/No)": customer.drive,
    "Client Tier": customer.tier,
    "Home Brand": customer.homeBrand,
    "Phone Number": customer.contact.phoneNumber,
    "Email Address": customer.contact.email,
    "City": customer.contact.city,
    "Parish (Jamaica)": customer.contact.parish,
    "Country": customer.contact.country,
    "Delivery Address": customer.contact.deliveryAddress,
    "Delivery Country": customer.contact.deliveryCountry,
    "Mother Name": customer.profile.motherName,
    "Father Name": customer.profile.fatherName,
    "Wife Name": customer.profile.wifeName,
    "Husband Name": customer.profile.husbandName,
    "Children Names & Birthdays": childrenStr,
    "Pets": customer.profile.pets,
    "Personal Notes": customer.profile.personalNotes,
    "Birthday": customer.importantDates.find(d => d.label === "Birthday")?.date || "",
    "Anniversary": customer.importantDates.find(d => d.label === "Anniversary")?.date || "",
    "Wedding Date": customer.importantDates.find(d => d.label === "Wedding Date")?.date || "",
    "Proposal Date": customer.importantDates.find(d => d.label === "Proposal Date")?.date || "",
    "Other Important Dates": otherDates,
    "First Order Date": customer.history.firstOrderDate,
    "Last Order Date": customer.history.lastOrderDate,
    "Total Orders": customer.history.totalOrders,
    "Products Purchased": customer.history.productsPurchased.join(", "),
    "Preferred Products / Categories": customer.history.preferredCategories.join(", "),
    "Client Preferences": customer.history.clientPreferences.join(", "),
    "Lifetime Revenue (JMD)": customer.history.lifetimeRevenue,
    "Average Order Value (JMD)": customer.history.averageOrderValue,
    "Hobbies": customer.interests.hobbies.join(", "),
    "Favorite Colors": customer.interests.favoriteColors.join(", "),
    "Gift Preferences": customer.interests.giftPreferences.join(", "),
    "Sport / League": customer.interests.sports.sport,
    "Favorite Team": customer.interests.sports.favoriteTeam,
    "Team One": customer.interests.sports.teamOne,
    "Team Two": customer.interests.sports.teamTwo,
    "National Team": customer.interests.sports.nationalTeam,
    "Favorite Player": customer.interests.sports.favoritePlayer,
    "Preferred Communication Method": customer.preferredCommunication,
    "Last Contacted Date": customer.lastContactedDate
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
  const rawCid = row["Client ID"] ? String(row["Client ID"]).trim().replace(/\D/g, "") : "";
  const cid = rawCid || randomId;

  const totalOrders = Number(row["Total Orders"]) || 0;
  const lifetimeRevenue = Number(row["Lifetime Revenue (JMD)"]) || 0;
  const averageOrderValue = totalOrders > 0 ? Math.round(lifetimeRevenue / totalOrders) : 0;

  const isDeactivatedVal = row["Status"] ? (String(row["Status"]).trim().toLowerCase() === "deactivated" || String(row["Status"]).trim().toLowerCase() === "inactive") : false;

  return {
    id: cid,
    deactivated: isDeactivatedVal,
    firstName: row["First Name"] ? String(row["First Name"]).trim() : "New",
    lastName: row["Last Name"] ? String(row["Last Name"]).trim() : "Client",
    gender: (row["Gender"] || "N/A") as any,
    occupation: row["Occupation"] ? String(row["Occupation"]).trim() : "Business Owner",
    drive: (row["Drive (Yes/No)"] === "Yes" || row["Drive (Yes/No)"] === "No") ? row["Drive (Yes/No)"] : "No",
    tier: (() => {
      let t = String(row["Client Tier"] || row["Customer Tier"] || "Silver").trim();
      if (t === "VIP") return "Gold";
      if (t === "Corporate" || t === "Standard Account" || t === "Platinum Tier") return "Platinum";
      if (t === "Standard" || t === "Silver Tier") return "Silver";
      return t as any;
    })(),
    homeBrand: (() => {
      const b = String(row["Home Brand"] || "CEO Lifestyle").trim();
      if (b === "Both" || b === "Ceo Lifestyle" || b === "CEO Lifestyle") return "CEO Lifestyle";
      return b as any;
    })(),
    contact: {
      phoneNumber: row["Phone Number"] ? String(row["Phone Number"]).trim() : "",
      email: row["Email Address"] ? String(row["Email Address"]).trim() : "",
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
      averageOrderValue: row["Average Order Value (JMD)"] ? Number(row["Average Order Value (JMD)"]) : averageOrderValue
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
        content: "Record imported/updated via Excel Database sync."
      }
    ],
    reminders: [],
    preferredCommunication: (row["Preferred Communication Method"] || "Email") as any,
    lastContactedDate: row["Last Contacted Date"] ? String(row["Last Contacted Date"]).trim() : ""
  };
}

// Download Excel File helper
export function downloadExcel(sheets: { name: string; data: any[] }[], filename: string) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(sheet => {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// 1. Download Master Customer Database
export function exportClientsExcel(customers: Client[], category: string) {
  const flatData = customers.map(c => customerToFlatRow(c));
  downloadExcel([{ name: "Clients", data: flatData }], `CRM_Clients_${category}`);
}

// 2. Export Custom Reports
export function exportReport(type: string, customers: Client[]) {
  let sheets: { name: string; data: any[] }[] = [];
  let filename = `CRM_Report_${type}`;

  switch (type) {
    case "lifetime_value":
      sheets = [
        {
          name: "Lifetime Client Value",
          data: customers
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
          data: customers
            .filter(c => c.history.totalOrders >= 2)
            .map(c => ({
              "Client ID": c.id,
              "Status": c.deactivated ? "Deactivated" : "Active",
              "Client Name": `${c.firstName} ${c.lastName}`,
              "Client Tier": c.tier,
              "Home Brand": c.homeBrand,
              "Total Orders": c.history.totalOrders,
              "Lifetime Revenue (JMD)": c.history.lifetimeRevenue,
              "Average Order Value (JMD)": c.history.averageOrderValue
            }))
            .sort((a, b) => b["Total Orders"] - a["Total Orders"])
        }
      ];
      break;

    case "product_preferences":
      sheets = [
        {
          name: "Product Preferences",
          data: customers.map(c => ({
            "Client ID": c.id,
            "Status": c.deactivated ? "Deactivated" : "Active",
            "Client Name": `${c.firstName} ${c.lastName}`,
            "Client Tier": c.tier,
            "Home Brand": c.homeBrand,
            "Preferred Categories": c.history.preferredCategories.join(", "),
            "Products Purchased": c.history.productsPurchased.join(", "),
            "Client Preferences": c.history.clientPreferences.join(", "),
            "Favorite Colors": c.interests.favoriteColors.join(", "),
            "Gift Preferences": c.interests.giftPreferences.join(", ")
          }))
        }
      ];
      break;

    case "dates_reminders":
      sheets = [
        {
          name: "Upcoming Dates & Birthdays",
          data: customers.flatMap(c =>
            c.importantDates.map(d => ({
              "Client ID": c.id,
              "Status": c.deactivated ? "Deactivated" : "Active",
              "Client Name": `${c.firstName} ${c.lastName}`,
              "Client Tier": c.tier,
              "Event / Occasion": d.label,
              "Date Details": d.date,
              "Preferred Contact Method": c.preferredCommunication,
              "Phone Number": c.contact.phoneNumber,
              "Email Address": c.contact.email
            }))
          )
        }
      ];
      break;

    case "overseas_purchasers":
      sheets = [
        {
          name: "Overseas Ordering Family Gifts",
          data: customers
            .filter(c => c.contact.country !== "Jamaica")
            .map(c => ({
              "Client ID": c.id,
              "Status": c.deactivated ? "Deactivated" : "Active",
              "Client Name": `${c.firstName} ${c.lastName}`,
              "Client Tier": c.tier,
              "Residing Country": c.contact.country,
              "Residing City": c.contact.city,
              "Recipient Delivery Address": c.contact.deliveryAddress,
              "Recipient Delivery Country": c.contact.deliveryCountry,
              "Phone Number": c.contact.phoneNumber,
              "Email Address": c.contact.email,
              "Personal Notes": c.profile.personalNotes
            }))
        }
      ];
      break;

    case "sales_history":
      sheets = [
        {
          name: "Sales Metrics",
          data: customers.map(c => ({
            "Client ID": c.id,
            "Status": c.deactivated ? "Deactivated" : "Active",
            "Client Name": `${c.firstName} ${c.lastName}`,
            "Tier": c.tier,
            "Brand": c.homeBrand,
            "Total Orders Placed": c.history.totalOrders,
            "Revenue Liftiver Value (JMD)": c.history.lifetimeRevenue,
            "Average Invoice Amount": c.history.averageOrderValue
          }))
        }
      ];
      break;

    default:
      // Default Master Database Report
      sheets = [{ name: "Database Report", data: customers.map(c => customerToFlatRow(c)) }];
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
