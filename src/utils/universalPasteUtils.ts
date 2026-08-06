import * as XLSX from "xlsx";
import { flatRowToCustomer } from "./excelUtils";
import { 
  Client, 
  AspiringClient, 
  LuxeBookInventoryItem, 
  InventorySalesMovement 
} from "../types";

export interface ParsedPasteResult {
  headers: string[];
  rawRows: any[];
  mappedItems: any[];
  totalRows: number;
  validCount: number;
  warningCount: number;
  errors: string[];
}

/**
 * Universal text parsing for spreadsheet data copied from
 * Microsoft Excel, Google Sheets, or Apple Numbers.
 */
export function parseSpreadsheetClipboardText(text: string): { headers: string[]; rawRows: any[] } {
  if (!text || !text.trim()) {
    return { headers: [], rawRows: [] };
  }

  const cleanText = text.trim();

  // Method 1: SheetJS string reader
  try {
    const workbook = XLSX.read(cleanText, { type: "string" });
    const sheetName = workbook.SheetNames[0];
    if (sheetName && workbook.Sheets[sheetName]) {
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });
      if (json && json.length > 0) {
        const headers = Object.keys(json[0] || {});
        return { headers, rawRows: json };
      }
    }
  } catch (e) {
    console.warn("SheetJS text parse fallback:", e);
  }

  // Method 2: Manual TSV/CSV delimiter parser
  const lines = cleanText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rawRows: [] };

  const firstLine = lines[0];
  const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(",") ? "," : ";";

  const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
  if (lines.length === 1) {
    return { headers, rawRows: [] };
  }

  const rawRows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cells.every(c => c === "")) continue;
    const rowObj: any = {};
    headers.forEach((header, idx) => {
      const key = header || `Column_${idx + 1}`;
      rowObj[key] = cells[idx] !== undefined ? cells[idx] : "";
    });
    rawRows.push(rowObj);
  }

  return { headers, rawRows };
}

/**
 * Maps raw spreadsheet rows into domain objects based on template type
 */
export function processPastedDomainRows(
  templateType: "clients" | "aspiring" | "tier_register" | "inventory" | "sales" | "operations" | "milestones",
  rawRows: any[]
): ParsedPasteResult {
  const errors: string[] = [];
  let validCount = 0;
  let warningCount = 0;
  const mappedItems: any[] = [];

  if (rawRows.length === 0) {
    return {
      headers: [],
      rawRows: [],
      mappedItems: [],
      totalRows: 0,
      validCount: 0,
      warningCount: 0,
      errors: ["No data rows found in pasted text."]
    };
  }

  const headers = Object.keys(rawRows[0] || {});

  rawRows.forEach((row, index) => {
    const rowNum = index + 1;

    switch (templateType) {
      case "clients": {
        try {
          const client = flatRowToCustomer(row);
          if (!client.firstName && !client.lastName) {
            warningCount++;
            errors.push(`Row ${rowNum}: Missing Client Name. Defaulted to 'New Client'.`);
          } else {
            validCount++;
          }
          mappedItems.push(client);
        } catch (err: any) {
          warningCount++;
          errors.push(`Row ${rowNum}: Error converting client (${err.message}).`);
        }
        break;
      }

      case "aspiring": {
        const name = row["Name"] || row["Client Name"] || row["Full Name"] || row["Aspiring Client"] || "";
        const contactInfo = row["Contact Info"] || row["Phone"] || row["Email"] || row["Contact"] || "";
        const source = row["Source of Inquiry"] || row["Source"] || row["Inquiry Source"] || "Referral";
        const service = row["Service Interested In"] || row["Service"] || row["Interest"] || "Executive Services";
        const notes = row["Notes"] || row["Details"] || "";
        const status = row["Status"] || "Follow Up Required";
        const dateContacted = row["Date Contacted"] || row["Date"] || new Date().toISOString().split("T")[0];

        if (!name) {
          warningCount++;
          errors.push(`Row ${rowNum}: Missing Aspiring Client Name.`);
        } else {
          validCount++;
        }

        mappedItems.push({
          id: row["ID"] || `ASP_${Date.now()}_${index}`,
          name: name || `Lead ${index + 1}`,
          contactInfo,
          sourceOfInquiry: source,
          serviceInterestedIn: service,
          dateContacted,
          notes,
          assignedUser: row["Assigned User"] || "Chief Executive Officer",
          status,
          followUpDate: row["Follow Up Date"] || dateContacted,
          followUpCount: parseInt(row["Follow Up Count"]) || 0
        });
        break;
      }

      case "tier_register": {
        const id = row["CL ID"] || row["Client ID"] || row["id"] || `CL${index + 100}`;
        const name = row["Client Full Name"] || row["Client Name"] || row["Name"] || "";
        const tier = row["Final Tier"] || row["Client Tier"] || row["Tier"] || "Silver";

        if (!name && !id) {
          warningCount++;
          errors.push(`Row ${rowNum}: Missing Client ID and Name.`);
        } else {
          validCount++;
        }

        mappedItems.push({
          id,
          fullName: name || "Client Record",
          tier,
          businessRelationship: row["Business Relationship"] || "CEO Lifestyle",
          managementClassification: row["Management Classification"] || "Standard",
          tierSource: row["Tier Source"] || "Manual",
          manualTierReason: row["Manual Tier Reason"] || "",
          healthScore: parseInt(row["Health Score"]) || 75
        });
        break;
      }

      case "inventory": {
        const title = row["Title"] || row["Book Title"] || row["Item Name"] || row["Name"] || "";
        const author = row["Author"] || row["Brand"] || "CEO Lifestyle";
        const rawPrice = row["Price (JMD)"] || row["Price"] || row["Unit Price"] || 0;
        const rawStock = row["Total Stock"] || row["Quantity"] || row["Stock"] || 0;

        const price = typeof rawPrice === "number" ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, "")) || 0;
        const totalStock = typeof rawStock === "number" ? rawStock : parseInt(String(rawStock).replace(/[^0-9]/g, "")) || 0;

        if (!title) {
          warningCount++;
          errors.push(`Row ${rowNum}: Missing Book Title / Item Name.`);
        } else {
          validCount++;
        }

        mappedItems.push({
          id: row["ID"] || `BOOK_${Date.now()}_${index}`,
          title: title || `Untitled Item ${index + 1}`,
          author,
          isbn: row["ISBN"] || "",
          price,
          totalStock,
          inStore: parseInt(row["In Store"]) || Math.floor(totalStock / 2),
          inOffice: parseInt(row["In Office"]) || Math.ceil(totalStock / 2),
          allocatedToClients: 0,
          category: row["Category"] || "Books",
          status: row["Status"] || "Active",
          bookRank: row["Book Rank"] || "Standard"
        });
        break;
      }

      case "sales": {
        const title = row["Title"] || row["Book Title"] || row["Item Name"] || "";
        const qty = parseInt(row["Quantity"] || row["Qty"] || 1);
        const price = parseFloat(row["Unit Price"] || row["Price"] || 0);

        if (!title) {
          warningCount++;
          errors.push(`Row ${rowNum}: Missing Item Title.`);
        } else {
          validCount++;
        }

        mappedItems.push({
          id: `SALE_${Date.now()}_${index}`,
          bookTitle: title || "Item",
          quantitySold: qty,
          unitPriceJmd: price,
          actionDate: row["Action Date"] || row["Date"] || new Date().toISOString().split("T")[0],
          customerName: row["Customer"] || row["Client"] || "General Sale",
          notes: row["Notes"] || ""
        });
        break;
      }

      case "operations": {
        const clientName = row["Client Name"] || row["Client"] || row["Name"] || "";
        const itemDesc = row["Item Description"] || row["Description"] || row["Item"] || "";

        if (!clientName && !itemDesc) {
          warningCount++;
          errors.push(`Row ${rowNum}: Missing Client Name or Item Description.`);
        } else {
          validCount++;
        }

        mappedItems.push({
          id: row["Order ID"] || row["Job ID"] || `JOB_${Date.now()}_${index}`,
          clientName: clientName || "Client Order",
          itemDescription: itemDesc || "Custom Order",
          quantity: parseInt(row["Quantity"]) || 1,
          totalValueJmd: parseFloat(row["Total Value (JMD)"] || row["Total Value"] || 0),
          depositReceivedJmd: parseFloat(row["Deposit Received (JMD)"] || row["Deposit"] || 0),
          status: row["Status"] || "Deposit Confirmed",
          targetDeliveryDate: row["Target Delivery Date"] || row["Delivery Date"] || ""
        });
        break;
      }

      case "milestones": {
        const title = row["Title"] || row["Event Title"] || row["Milestone"] || "";
        const date = row["Date"] || row["Event Date"] || "";

        if (!title || !date) {
          warningCount++;
          errors.push(`Row ${rowNum}: Missing Title or Date.`);
        } else {
          validCount++;
        }

        mappedItems.push({
          id: `MS_${Date.now()}_${index}`,
          title: title || "Milestone Event",
          date,
          clientId: row["Client ID"] || "",
          clientName: row["Client Name"] || "",
          category: row["Category"] || "Relationship Milestone",
          notes: row["Notes"] || ""
        });
        break;
      }
    }
  });

  return {
    headers,
    rawRows,
    mappedItems,
    totalRows: rawRows.length,
    validCount,
    warningCount,
    errors
  };
}
