import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Client, ClientTier, LuxeBookInventoryItem, InventorySalesMovement } from "../types";
import { 
  flatRowToCustomer, 
  exportClientsExcel, 
  exportReport, 
  downloadUploadTemplate 
} from "../utils/excelUtils";
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  FileCheck2, 
  FileText, 
  AlertCircle, 
  RefreshCw,
  Search,
  Check,
  MapPin,
  Sparkles,
  BookOpen,
  Archive,
  TrendingDown,
  X
} from "lucide-react";

interface ExcelManagerProps {
  customers: Client[];
  onImportCustomers: (importedList: Client[]) => void;
  inventory?: LuxeBookInventoryItem[];
  onUpdateInventory?: (updatedList: LuxeBookInventoryItem[]) => void;
}

export default function ExcelManager({ 
  customers, 
  onImportCustomers,
  inventory = [],
  onUpdateInventory
}: ExcelManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state
  const [dragActive, setDragActive] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [mappedClients, setMappedClients] = useState<Client[]>([]);
  const [importStats, setImportStats] = useState<{
    newCount: number;
    duplicateCount: number;
    total: number;
  } | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [activeSubTab, setActiveSubTab] = useState<"clients" | "luxe">("clients");
  const fileInputRefQuantities = useRef<HTMLInputElement>(null);
  const fileInputRefSales = useRef<HTMLInputElement>(null);
  const [excelUploadMode, setExcelUploadMode] = useState<"update" | "sync">("update");
  const [luxeSuccessMsg, setLuxeSuccessMsg] = useState("");
  const [luxeErrorMsg, setLuxeErrorMsg] = useState("");

  // Parish / Country dropdown filters for custom exports
  const [exportParish, setExportParish] = useState("All");
  const [exportCategory, setExportCategory] = useState("All");

  // Get unique local lists for export parameters
  const parishes = Array.from(new Set(customers.map(c => c.contact.parish).filter(p => p && p !== "N/A")));
  const categories = Array.from(new Set(customers.flatMap(c => c.history.preferredCategories)));

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Parsing file
  const processFile = (file: File) => {
    setSuccessMsg("");
    setErrorMsg("");
    
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setErrorMsg("Invalid file type. Please upload a standard Excel file (.xlsx or .xls).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        
        // Grab first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON row list
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        if (rawJson.length === 0) {
          setErrorMsg("Excel spreadsheet is empty. Please add rows to upload.");
          return;
        }

        // Parse rows to Customer objects
        const importedClients = rawJson.map(row => flatRowToCustomer(row));

        // Evaluate duplicates
        let newCount = 0;
        let duplicateCount = 0;

        importedClients.forEach(imported => {
          const exists = customers.some(existing => existing.id === imported.id);
          if (exists) {
            duplicateCount++;
          } else {
            newCount++;
          }
        });

        setParsedRows(rawJson);
        setMappedClients(importedClients);
        setImportStats({
          newCount,
          duplicateCount,
          total: importedClients.length
        });
      } catch (err: any) {
        setErrorMsg(`Failed to parse Excel file correctly: ${err.message || err}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Complete Bulk Database synchronization
  const handleFinalizeImport = () => {
    if (mappedClients.length === 0) return;
    onImportCustomers(mappedClients);
    
    setSuccessMsg(
      `Flawless Integration! Successfully integrated ${importStats?.total} records (${importStats?.newCount} new client accounts, ${importStats?.duplicateCount} updated duplicates).`
    );
    setParsedRows([]);
    setMappedClients([]);
    setImportStats(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Exporters
  const handleExportAll = () => {
    exportClientsExcel(customers, "All");
  };

  const handleExportBrand = (brand: "CEO Printing Services" | "Librarium Luxe") => {
    const filtered = customers.filter(c => c.homeBrand === brand || c.homeBrand === "CEO Lifestyle");
    exportClientsExcel(filtered, brand.replace(/\s+/g, "_"));
  };

  const handleExportTier = (tier: ClientTier) => {
    const filtered = customers.filter(c => c.tier === tier);
    exportClientsExcel(filtered, tier);
  };

  const handleExportOverseas = () => {
    const filtered = customers.filter(c => c.contact.country !== "Jamaica");
    exportClientsExcel(filtered, "Overseas");
  };

  const handleExportByParish = () => {
    if (exportParish === "All") {
      alert("Please select a specific Parish to download.");
      return;
    }
    const filtered = customers.filter(c => c.contact.parish === exportParish);
    exportClientsExcel(filtered, `Parish_${exportParish.replace(/\s+/g, "_")}`);
  };

  const handleExportByCategory = () => {
    if (exportCategory === "All") {
      alert("Please select a specific Category to download.");
      return;
    }
    const filtered = customers.filter(c => 
      c.history.preferredCategories.some(cat => cat.toLowerCase() === exportCategory.toLowerCase())
    );
    exportClientsExcel(filtered, `Category_${exportCategory.replace(/\s+/g, "_")}`);
  };

  // ----- LIBRARIUM LUXE INVENTORY EXCEL HANDLERS -----

  const handleProcessQuantitiesExcel = (file: File) => {
    setLuxeSuccessMsg("");
    setLuxeErrorMsg("");

    if (!onUpdateInventory) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rawJson.length === 0) {
          setLuxeErrorMsg("Excel sheet is empty.");
          return;
        }

        // If "sync" mode, we want to know which titles are in the Excel
        const excelTitles = new Set<string>();
        rawJson.forEach(row => {
          const titleKey = Object.keys(row).find(k => k.toLowerCase().includes("title") || k.toLowerCase().includes("book"));
          if (titleKey) {
            const titleVal = String(row[titleKey]).trim().toLowerCase();
            if (titleVal) {
              excelTitles.add(titleVal);
            }
          }
        });

        let updatedCount = 0;
        let addedCount = 0;
        let archivedCount = 0;
        let reactivatedCount = 0;
        
        let updatedList = [...(inventory || [])];

        if (excelUploadMode === "sync") {
          // Mark existing active items as archived if they are NOT in the Excel file
          updatedList = updatedList.map(item => {
            if (!item.archived && !excelTitles.has(item.title.toLowerCase())) {
              archivedCount++;
              return { ...item, archived: true }; // Mark as archived / inactive
            }
            return item;
          });
        }

        rawJson.forEach(row => {
          const titleKey = Object.keys(row).find(k => k.toLowerCase().includes("title") || k.toLowerCase().includes("book"));
          const qtyKey = Object.keys(row).find(k => k.toLowerCase().includes("qty") || k.toLowerCase().includes("quantity") || k.toLowerCase().includes("stock") || k.toLowerCase().includes("count"));
          const catKey = Object.keys(row).find(k => k.toLowerCase().includes("category") || k.toLowerCase().includes("genre"));
          const statusKey = Object.keys(row).find(k => k.toLowerCase().includes("status") || k.toLowerCase().includes("active") || k.toLowerCase().includes("deactivated") || k.toLowerCase().includes("archive"));
          const idKey = Object.keys(row).find(k => k.toLowerCase().includes("id") || k.toLowerCase().includes("isbn") || k.toLowerCase().includes("identifier") || k.toLowerCase().includes("code"));
          const priceKey = Object.keys(row).find(k => k.toLowerCase().includes("price") || k.toLowerCase().includes("selling") || k.toLowerCase().includes("jmd") || k.toLowerCase().includes("cost"));

          if (!titleKey) return;
          const titleVal = String(row[titleKey]).trim();
          const qtyVal = qtyKey ? Number(row[qtyKey]) : 0;
          const catVal = catKey ? String(row[catKey]).trim() : "Uncategorized";
          const idVal = idKey ? String(row[idKey]).trim() : "";
          
          let priceVal: number | undefined = undefined;
          if (priceKey && row[priceKey] !== undefined && row[priceKey] !== null) {
            const rawNum = String(row[priceKey]).replace(/[^0-9.]/g, "");
            const parsed = parseFloat(rawNum);
            if (!isNaN(parsed)) {
              priceVal = parsed;
            }
          }

          let isArchived = false;
          let hasStatus = false;
          if (statusKey && row[statusKey] !== undefined && row[statusKey] !== null && String(row[statusKey]).trim() !== "") {
            hasStatus = true;
            const sVal = String(row[statusKey]).trim().toLowerCase();
            if (sVal === "deactivated" || sVal === "inactive" || sVal === "archived" || sVal === "no" || sVal === "false") {
              isArchived = true;
            }
          }

          if (!titleVal) return;

          // Check if item exists (by explicit ID/ISBN match or case insensitive Title match)
          const existingIdx = updatedList.findIndex(item => 
            (idVal && item.id.toLowerCase() === idVal.toLowerCase()) || 
            item.title.toLowerCase() === titleVal.toLowerCase()
          );
          if (existingIdx !== -1) {
            const existingItem = updatedList[existingIdx];
            const wasArchived = existingItem.archived;
            const finalArchived = hasStatus ? isArchived : !!existingItem.archived;
            updatedList[existingIdx] = {
              ...existingItem,
              id: idVal ? idVal : existingItem.id, // Update to the ISBN/ID if provided
              quantity: Math.max(0, qtyVal),
              category: catVal, // Update category via Excel (Requirement 4)
              archived: finalArchived,
              sellingPrice: priceVal !== undefined ? priceVal : existingItem.sellingPrice
              // Physical book allocation (inStore, office) and bookRank are PRESERVED and IGNORED from Excel
            };
            if (wasArchived && !finalArchived) {
              reactivatedCount++;
            } else if (!wasArchived && finalArchived) {
              archivedCount++;
            } else {
              updatedCount++;
            }
          } else {
            // Generate a unique ID
            let randomId = "";
            let idCollision = true;
            while (idCollision) {
              randomId = `LUX-${Math.floor(100 + Math.random() * 900)}`;
              idCollision = updatedList.some(item => item.id === randomId);
            }

            // Add as a new book with default allocation that matches imported stock
            updatedList.push({
              id: idVal ? idVal : randomId,
              title: titleVal,
              category: catVal,
              quantity: Math.max(0, qtyVal),
              dateAdded: new Date().toISOString().slice(0, 10),
              salesHistory: [],
              bookRank: "Standard", // Default rank (not imported from Excel)
              archived: isArchived,
              inStore: 0,
              office: Math.max(0, qtyVal), // Assign to office by default
              sellingPrice: priceVal !== undefined ? priceVal : 4000
            });
            addedCount++;
          }
        });

        // Track operational discrepancies (mismatches) for Dashboard alerts
        let discrepancyCount = 0;
        updatedList.forEach(item => {
          if (!item.archived) {
            const total = item.quantity;
            const inStore = item.inStore ?? 0;
            const office = item.office ?? 0;
            if (inStore + office !== total) {
              discrepancyCount++;
            }
          }
        });

        onUpdateInventory(updatedList);
        
        let reportMsg = "";
        if (discrepancyCount > 0) {
          reportMsg = ` ⚠️ Operational Note: ${discrepancyCount} book(s) have location allocation variances (In Store + Office ≠ Total Stock). These have been automatically added to your Dashboard → Tasks Due section for high-level reconciliation.`;
        } else {
          reportMsg = ` ✓ Post-Import Validation Successful: All book location allocations are fully aligned with total stock!`;
        }

        if (excelUploadMode === "sync") {
          setLuxeSuccessMsg(`Excel Sync Completed! Added ${addedCount} new books, updated ${updatedCount} books. Archived ${archivedCount} missing items, and reactivated ${reactivatedCount} previously archived items.${reportMsg}`);
        } else {
          setLuxeSuccessMsg(`Excel Update Completed! Added ${addedCount} new books and updated ${updatedCount} books while preserving existing records.${reportMsg}`);
        }
      } catch (err) {
        console.error(err);
        setLuxeErrorMsg("Failed to parse the Excel file. Please ensure it is a valid format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleProcessSalesExcel = (file: File) => {
    setLuxeSuccessMsg("");
    setLuxeErrorMsg("");

    if (!onUpdateInventory) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rawJson.length === 0) {
          setLuxeErrorMsg("Excel sheet is empty.");
          return;
        }

        let salesCount = 0;
        let reducedStockSum = 0;
        const updatedList = [...(inventory || [])];

        rawJson.forEach(row => {
          const titleKey = Object.keys(row).find(k => k.toLowerCase().includes("title") || k.toLowerCase().includes("book"));
          const qtySoldKey = Object.keys(row).find(k => k.toLowerCase().includes("sold") || k.toLowerCase().includes("quantity") || k.toLowerCase().includes("qty"));
          const clientKey = Object.keys(row).find(k => k.toLowerCase().includes("client") || k.toLowerCase().includes("customer") || k.toLowerCase().includes("name"));
          const dateKey = Object.keys(row).find(k => k.toLowerCase().includes("date"));

          if (!titleKey) return;
          const titleVal = String(row[titleKey]).trim();
          const qtySoldVal = qtySoldKey ? Number(row[qtySoldKey]) : 1;
          const clientVal = clientKey ? String(row[clientKey]).trim() : "Anonymous Luxe Guest";
          const dateVal = dateKey ? String(row[dateKey]).trim() : new Date().toISOString().slice(0, 10);

          if (!titleVal) return;

          // Find book (case insensitive match)
          const existingIdx = updatedList.findIndex(item => item.title.toLowerCase() === titleVal.toLowerCase());
          if (existingIdx !== -1) {
            const currentItem = updatedList[existingIdx];
            const newHistoryItem: InventorySalesMovement = {
              id: `sh-${Math.floor(1000 + Math.random() * 9000)}`,
              date: dateVal,
              quantitySold: qtySoldVal,
              clientName: clientVal
            };

            updatedList[existingIdx] = {
              ...currentItem,
              quantity: Math.max(0, currentItem.quantity - qtySoldVal),
              salesHistory: [newHistoryItem, ...(currentItem.salesHistory || [])]
            };
            salesCount++;
            reducedStockSum += qtySoldVal;
          }
        });

        onUpdateInventory(updatedList);
        setLuxeSuccessMsg(`Excel Transactions success! Recorded ${salesCount} sales actions, reducing absolute stock by ${reducedStockSum} total books.`);
      } catch (err) {
        console.error(err);
        setLuxeErrorMsg("Failed to parse the Sales Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const exportCurrentInventory = () => {
    try {
      const data = (inventory || []).map(item => ({
        "Book ID": item.id,
        "Book Title": item.title,
        "Category": item.category,
        "Quantity": item.quantity,
        "Selling Price (JMD)": item.sellingPrice !== undefined ? item.sellingPrice : 4000,
        "Status": item.archived ? "Deactivated" : "Active"
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Current Inventory");
      XLSX.writeFile(wb, "Librarium_Luxe_Inventory_Export.xlsx");
      setLuxeSuccessMsg("Inventory exported successfully! You can modify this sheet and re-upload it to update records.");
    } catch (err: any) {
      console.error(err);
      setLuxeErrorMsg(`Failed to export inventory: ${err.message || err}`);
    }
  };

  const exportLuxeSalesHistory = () => {
    try {
      const salesData: any[] = [];
      (inventory || []).forEach(item => {
        if (item.salesHistory) {
          item.salesHistory.forEach(sh => {
            salesData.push({
              "Book Title": item.title,
              "Quantity Sold": sh.quantitySold,
              "Client Name": sh.clientName || "Anonymous Luxe Guest",
              "Date": sh.date,
              "Book ID": item.id,
              "Category": item.category
            });
          });
        }
      });

      if (salesData.length === 0) {
        setLuxeErrorMsg("No historical sales transactions available to export.");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(salesData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sales History");
      XLSX.writeFile(wb, "Librarium_Luxe_Sales_History_Export.xlsx");
      setLuxeSuccessMsg("Sales history transactions exported successfully!");
    } catch (err: any) {
      console.error(err);
      setLuxeErrorMsg(`Failed to export sales history: ${err.message || err}`);
    }
  };

  const downloadStockTemplate = () => {
    const templateData = [
      { "Book Title": "The Odyssey (Illuminated Translation with Gold Leaf)", "Category": "Epic Poetry", "Quantity": 10, "Status": "Active" },
      { "Book Title": "The Philosophy of Luxury: Aesthetics of Elegance", "Category": "Philosophy", "Quantity": 6, "Status": "Active" },
      { "Book Title": "Renaissance Architecture of Jamaica", "Category": "Caribbean History", "Quantity": 3, "Status": "Deactivated" }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory Quantities");
    XLSX.writeFile(wb, "Librarium_Luxe_Quantities_Template.xlsx");
  };

  const downloadSalesTemplate = () => {
    const templateData = [
      { "Book Title": "The Great Gatsby (Limited Hand-Pressed Edition)", "Quantity Sold": 1, "Client Name": "Robert Reid", "Date": "2026-07-01" },
      { "Book Title": "Librarium Folio: Italian Renaissance Masterpieces", "Quantity Sold": 1, "Client Name": "Daniel Sterling", "Date": "2026-07-03" }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Transactions");
    XLSX.writeFile(wb, "Librarium_Luxe_Sales_Transactions_Template.xlsx");
  };

  return (
    <div className="space-y-8 animate-fade-in text-xs">
      
      {/* Title Cover */}
      <div className="text-left bg-gradient-to-tr from-slate-50 via-slate-100/30 to-slate-100/70 border border-slate-200/60 rounded-3xl p-6 md:p-8 space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Excel Exchange Control Center</span>
        <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Database Import & Export</h1>
        <p className="text-slate-500 leading-relaxed text-xs max-w-2xl font-medium">
          Execute bulk database synchronizations. Import spreadsheets directly into your local database with automatic duplicate resolution, export refined client logs, or generate bespoke strategic business reports instantly.
        </p>
      </div>

      {/* Premium Sub-tabs Selector */}
      <div className="flex border-b border-slate-200 pb-px gap-6 text-left">
        <button
          onClick={() => setActiveSubTab("clients")}
          className={`pb-3 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-2 cursor-pointer ${
            activeSubTab === "clients"
              ? "border-slate-900 text-slate-950 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-slate-500" />
          Client Accounts Exchange
        </button>
        <button
          onClick={() => setActiveSubTab("luxe")}
          className={`pb-3 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-2 cursor-pointer ${
            activeSubTab === "luxe"
              ? "border-slate-900 text-slate-950 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <BookOpen className="w-4 h-4 text-rose-700" />
          Librarium Luxe Sync Center
        </button>
      </div>

      {activeSubTab === "clients" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN - IMPORT & TEMPLATE (7 spaces) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* UPLOAD CONTAINER */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="text-left">
              <h2 className="text-sm font-bold text-slate-950">1. Upload Client Database Spreadsheet</h2>
              <p className="text-xs text-slate-400 mt-1 font-bold">Upload a `.xlsx` spreadsheet matching our layout headers.</p>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-4 ${
                dragActive 
                  ? "border-slate-900 bg-slate-50" 
                  : "border-slate-200 hover:border-slate-400 bg-slate-50/20"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls"
                className="hidden"
              />
              
              <div className="p-4 bg-white rounded-full shadow-xs border border-slate-100">
                <UploadCloud className="w-8 h-8 text-slate-400" />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-800">
                  Drag and drop your spreadsheet here, or <span className="text-slate-950 underline font-extrabold hover:text-slate-850">browse computer</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-bold">Supports Microsoft Excel (.xlsx, .xls) files only.</p>
              </div>
            </div>

            {/* Error notifications */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 text-left text-red-800">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="font-semibold text-xs">{errorMsg}</p>
              </div>
            )}

            {/* Success Notification */}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 text-left text-emerald-800">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="font-bold text-xs">{successMsg}</p>
              </div>
            )}

            {/* Preview Sheet Data before finalized Sync */}
            {importStats && (
              <div className="border border-slate-200/60 rounded-2xl overflow-hidden p-5 space-y-5 bg-slate-50/40 animate-fade-in text-left">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                  <div>
                    <h3 className="font-bold text-slate-950">Spreadsheet Scan Complete</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-bold">Headers analyzed successfully.</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-white px-2 py-1 border border-slate-200 rounded text-slate-800 shadow-xs">
                    {importStats.total} Rows found
                  </span>
                </div>

                {/* Duplicates stats alerts */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white p-3.5 border border-slate-200/40 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                    <span className="text-[10px] text-slate-400 block font-bold">NEW CLIENT RECORDS</span>
                    <span className="text-lg font-bold text-emerald-600 block mt-1">+{importStats.newCount}</span>
                  </div>
                  <div className="bg-white p-3.5 border border-slate-200/40 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                    <span className="text-[10px] text-slate-400 block font-bold">DUPLICATES (TO OVERWRITE)</span>
                    <span className="text-lg font-bold text-amber-600 block mt-1">{importStats.duplicateCount} records</span>
                  </div>
                </div>

                <div className="bg-amber-50/40 p-3 rounded-lg border border-amber-100 flex items-start gap-2 text-[11px] text-amber-900 font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p>
                    Matching Client IDs detected! Proceeding with integration will **automatically merge** matches, updating existing profile attributes with Excel's latest fields.
                  </p>
                </div>

                {/* Confirm Import Action */}
                <button
                  onClick={handleFinalizeImport}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  Synchronize and Overwrite Database ({importStats.total} Records)
                </button>
              </div>
            )}
          </div>

          {/* DOWNLOAD BLANK SPREADSHEET TEMPLATE */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm text-left flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-950 flex items-center gap-1.5">
                <FileSpreadsheet className="w-5 h-5 text-slate-400" />
                Download Ready-to-Use Upload Template
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md font-medium">
                Get a clean skeleton file with pre-defined column headings, data guidelines, date formats, and selection dropdown options (Gender, Client Tier, Brands, Country, Parish) for clean imports.
              </p>
            </div>
            <button
              onClick={downloadUploadTemplate}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 border border-slate-800 hover:bg-slate-50 text-slate-900 text-xs font-bold rounded-xl transition-all shadow-xs whitespace-nowrap cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Excel Template
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN - SPREADSHEET EXPORTS & EXECUTIVE REPORTS (5 spaces) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* CATEGORY & BRAND EXPORTS PANEL */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6 text-left">
            <div>
              <h2 className="text-sm font-bold text-slate-950">2. Segmented Database Downloads</h2>
              <p className="text-xs text-slate-400 mt-1 font-bold">Download custom segments based on brand, location or tier.</p>
            </div>

            <div className="space-y-3">
              {/* Export All */}
              <button
                onClick={handleExportAll}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50/40 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-xl transition-all font-bold text-slate-800 cursor-pointer"
              >
                <span>Download Master Client Database</span>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              {/* Export CEO Printing */}
              <button
                onClick={() => handleExportBrand("CEO Printing Services")}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50/40 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-xl transition-all font-bold text-slate-800 cursor-pointer"
              >
                <span>Download CEO Printing Clients</span>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              {/* Export Librarium */}
              <button
                onClick={() => handleExportBrand("Librarium Luxe")}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50/40 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-xl transition-all font-bold text-slate-800 cursor-pointer"
              >
                <span>Download Librarium Luxe Clients</span>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              {/* Tiers */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleExportTier("Silver")}
                  className="flex items-center justify-between p-2.5 bg-slate-50/40 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-xl transition-all font-bold text-xs text-slate-800 cursor-pointer"
                >
                  <span>Silver</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => handleExportTier("Gold")}
                  className="flex items-center justify-between p-2.5 bg-slate-50/40 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-xl transition-all font-bold text-xs text-slate-800 cursor-pointer"
                >
                  <span>Gold</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => handleExportTier("Platinum")}
                  className="flex items-center justify-between p-2.5 bg-slate-50/40 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-xl transition-all font-bold text-xs text-slate-800 cursor-pointer"
                >
                  <span>Platinum</span>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              {/* Export Overseas */}
              <button
                onClick={handleExportOverseas}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50/40 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-xl transition-all font-bold text-slate-800 cursor-pointer"
              >
                <span>Download Overseas Clients</span>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              {/* Export by Parish */}
              <div className="border border-slate-200/60 p-4 rounded-2xl space-y-2 bg-slate-50/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Download Clients by Parish</span>
                <div className="flex gap-2">
                  <select
                    value={exportParish}
                    onChange={(e) => setExportParish(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800"
                  >
                    <option value="All">Select Parish...</option>
                    {parishes.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleExportByParish}
                    disabled={exportParish === "All"}
                    className="bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-150 disabled:text-slate-400 px-3 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Export by Category */}
              <div className="border border-slate-200/60 p-4 rounded-2xl space-y-2 bg-slate-50/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Download Clients by Category</span>
                <div className="flex gap-2">
                  <select
                    value={exportCategory}
                    onChange={(e) => setExportCategory(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-800"
                  >
                    <option value="All">Select Category...</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleExportByCategory}
                    disabled={exportCategory === "All"}
                    className="bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-150 disabled:text-slate-400 px-3 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* EXECUTIVE SPREADSHEET REPORTS */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6 text-left">
            <div>
              <h2 className="text-sm font-bold text-slate-950">3. Business Intel Reports</h2>
              <p className="text-xs text-slate-400 mt-1 font-bold">Generate multi-sheet strategic corporate dashboards.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* LTV */}
              <button
                onClick={() => exportReport("lifetime_value", customers)}
                className="flex flex-col text-left p-4 bg-slate-50/20 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-2xl transition-all shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-xs group cursor-pointer"
              >
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 w-fit mb-3">
                  <FileText className="w-4 h-4 text-emerald-700" />
                </div>
                <span className="font-bold text-slate-800 text-xs">Client LTV Report</span>
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">LTV analysis by order values</span>
              </button>

              {/* Repeat Clients */}
              <button
                onClick={() => exportReport("repeat_customers", customers)}
                className="flex flex-col text-left p-4 bg-slate-50/20 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-2xl transition-all shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-xs group cursor-pointer"
              >
                <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100 w-fit mb-3">
                  <FileText className="w-4 h-4 text-indigo-700" />
                </div>
                <span className="font-bold text-slate-800 text-xs">Repeat Client Report</span>
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">Retention rates & frequency</span>
              </button>

              {/* Product Preference */}
              <button
                onClick={() => exportReport("product_preferences", customers)}
                className="flex flex-col text-left p-4 bg-slate-50/20 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-2xl transition-all shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-xs group cursor-pointer"
              >
                <div className="p-2 bg-purple-50 rounded-lg border border-purple-100 w-fit mb-3">
                  <FileText className="w-4 h-4 text-purple-700" />
                </div>
                <span className="font-bold text-slate-800 text-xs">Category Preference</span>
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">Preferred products & colors</span>
              </button>

              {/* Birthday Reminders */}
              <button
                onClick={() => exportReport("dates_reminders", customers)}
                className="flex flex-col text-left p-4 bg-slate-50/20 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-2xl transition-all shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-xs group cursor-pointer"
              >
                <div className="p-2 bg-amber-50 rounded-lg border border-amber-100 w-fit mb-3">
                  <FileText className="w-4 h-4 text-amber-700" />
                </div>
                <span className="font-bold text-slate-800 text-xs">Anniversaries & Reminders</span>
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">Milestone dates calendar log</span>
              </button>

              {/* Overseas Report */}
              <button
                onClick={() => exportReport("overseas_purchasers", customers)}
                className="flex flex-col text-left p-4 bg-slate-50/20 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-2xl transition-all shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-xs group cursor-pointer"
              >
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 w-fit mb-3">
                  <FileText className="w-4 h-4 text-blue-700" />
                </div>
                <span className="font-bold text-slate-800 text-xs">Overseas Purchases Report</span>
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">International billing segments</span>
              </button>

              {/* Sales History */}
              <button
                onClick={() => exportReport("sales_history", customers)}
                className="flex flex-col text-left p-4 bg-slate-50/20 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300 rounded-2xl transition-all shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-xs group cursor-pointer"
              >
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 w-fit mb-3">
                  <FileText className="w-4 h-4 text-slate-700" />
                </div>
                <span className="font-bold text-slate-800 text-xs">Corporate Sales Metrics</span>
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">Revenue liftiver value ledger</span>
              </button>
            </div>
          </div>

        </div>

      </div>
      )}

      {activeSubTab === "luxe" && (
        <div className="space-y-8 animate-fade-in text-xs">
          {/* Notifications */}
          {luxeSuccessMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl flex items-center gap-3 animate-fade-in text-left">
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold">{luxeSuccessMsg}</span>
              <button onClick={() => setLuxeSuccessMsg("")} className="ml-auto text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {luxeErrorMsg && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl flex items-center gap-3 animate-shake text-left">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span className="text-xs font-semibold">{luxeErrorMsg}</span>
              <button onClick={() => setLuxeErrorMsg("")} className="ml-auto text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Luxe Sync Center Header & Core Control Panel */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="text-left">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-rose-700" />
                  Librarium Luxe Excel Sync Center
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">Primary control area for inventory uploads, sales updates, book rank classifications, and real-time synchronization.</p>
              </div>
              
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button 
                  onClick={exportCurrentInventory}
                  className="px-4 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-rose-600" /> Export Inventory
                </button>
                <button 
                  onClick={exportLuxeSalesHistory}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" /> Export Sales History
                </button>
                <button 
                  onClick={downloadStockTemplate}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" /> Stock Template
                </button>
                <button 
                  onClick={downloadSalesTemplate}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" /> Sales Template
                </button>
              </div>
            </div>

            {/* TWO DROP ZONES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
              
              {/* UPLOAD ZONE 1: STOCK QUANTITIES */}
              <div className="border border-dashed border-slate-200 hover:border-rose-300 hover:bg-rose-50/10 p-6 rounded-2xl text-center space-y-4 transition-all relative flex flex-col justify-between">
                <input 
                  type="file" 
                  ref={fileInputRefQuantities}
                  onChange={(e) => e.target.files && handleProcessQuantitiesExcel(e.target.files[0])}
                  accept=".xlsx,.xls"
                  className="hidden" 
                />
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 mx-auto flex items-center justify-center border border-slate-200">
                    <UploadCloud className="w-5 h-5 text-rose-700" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Stock Quantities Manager</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs mx-auto">Matches books by Title. Import stock quantities, categories, and Book Rank.</p>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex flex-col gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 max-w-xs mx-auto">
                    <div className="flex justify-around items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setExcelUploadMode("update")}
                        className={`px-3 py-1.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                          excelUploadMode === "update" 
                            ? "bg-rose-100 text-rose-800 border border-rose-200 shadow-xs" 
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Update Mode
                      </button>
                      <button
                        type="button"
                        onClick={() => setExcelUploadMode("sync")}
                        className={`px-3 py-1.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                          excelUploadMode === "sync" 
                            ? "bg-red-100 text-red-800 border border-red-200 shadow-xs" 
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                        title="Sync Mode will archive items NOT present in the Excel spreadsheet"
                      >
                        Sync Mode (Archive Missing)
                      </button>
                    </div>
                    <span className="text-[8px] text-slate-400 font-bold leading-relaxed block px-1">
                      {excelUploadMode === "update" 
                        ? "Adds new books and updates matching titles. Safe for existing listings."
                        : "Synchronizes exact state: marks list items NOT in Excel spreadsheet as archived/deactivated."
                      }
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => fileInputRefQuantities.current?.click()}
                  className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Upload Stock Excel
                </button>
              </div>

              {/* UPLOAD ZONE 2: SALES HISTORY */}
              <div className="border border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 p-6 rounded-2xl text-center space-y-4 transition-all relative flex flex-col justify-between">
                <input 
                  type="file" 
                  ref={fileInputRefSales}
                  onChange={(e) => e.target.files && handleProcessSalesExcel(e.target.files[0])}
                  accept=".xlsx,.xls"
                  className="hidden" 
                />
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 mx-auto flex items-center justify-center border border-slate-200">
                    <TrendingDown className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Sales Transactions Manager</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs mx-auto">Matches books by Title. Recording sales decreases current stock level and populates sales logs.</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[9px] text-slate-400 font-semibold leading-relaxed max-w-xs mx-auto text-left">
                    <span className="font-bold text-slate-600 block mb-0.5">Expected Columns:</span>
                    Book Title, Quantity Sold, Client Name, Date
                  </div>
                </div>

                <button 
                  onClick={() => fileInputRefSales.current?.click()}
                  className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Upload Sales Transaction Excel
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
