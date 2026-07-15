import React, { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { LuxeBookInventoryItem, InventorySalesMovement } from "../types";
import { 
  BookOpen, 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  Plus, 
  Search, 
  AlertCircle, 
  Trash2, 
  Archive,
  History, 
  Edit2, 
  Check, 
  X, 
  Sparkles, 
  TrendingDown,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export function calculateRestockQuantity(
  rankingStatus?: string,
  salesClassification?: string,
  quantity: number = 0
): number {
  if (!rankingStatus) return 0;
  
  const status = rankingStatus.trim();
  const classification = salesClassification?.trim() || "";

  if (
    status === "Never Sell" ||
    status === "Dead Stock" ||
    status === "Evaluate" ||
    status === "Freeze" ||
    status === "Stacked" ||
    status === "Healthy"
  ) {
    return 0;
  }

  if (status === "Test Again") {
    return Math.max(0, 5 - quantity);
  }

  if (status === "Restock") {
    if (classification === "TS") return Math.max(0, 10 - quantity);
    if (classification === "MS") return Math.max(0, 8 - quantity);
    if (classification === "SM") return Math.max(0, 5 - quantity);
    return 0;
  }

  if (status === "Urgent Restock") {
    if (classification === "TS") return Math.max(0, 15 - quantity);
    if (classification === "MS") return Math.max(0, 10 - quantity);
    if (classification === "SM") return Math.max(0, 6 - quantity);
    return 0;
  }

  return 0;
}

interface LuxeInventoryProps {
  inventory: LuxeBookInventoryItem[];
  onUpdateInventory: (updatedList: LuxeBookInventoryItem[]) => void;
}

export default function LuxeInventory({ inventory, onUpdateInventory }: LuxeInventoryProps) {
  const fileInputRefQuantities = useRef<HTMLInputElement>(null);
  const fileInputRefSales = useRef<HTMLInputElement>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [alertFilter, setAlertFilter] = useState<"all" | "out" | "low" | "need_action">("all");

  // New item form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newQuantity, setNewQuantity] = useState<number>(5);
  const [newDateAdded, setNewDateAdded] = useState(new Date().toISOString().slice(0, 10));
  const [newRankingStatus, setNewRankingStatus] = useState<LuxeBookInventoryItem["rankingStatus"]>("Healthy");
  const [newSalesClassification, setNewSalesClassification] = useState<LuxeBookInventoryItem["salesClassification"]>("TS");

  // Manual quantity adjust state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);

  // Full item editing state
  const [editingItem, setEditingItem] = useState<LuxeBookInventoryItem | null>(null);

  // Success / Error messages
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Excel quantities upload mode
  const [excelUploadMode, setExcelUploadMode] = useState<"update" | "sync">("update");
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [showIntelligence, setShowIntelligence] = useState<boolean>(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Unique categories for filtering
  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(inventory.map(item => item.category)))];
  }, [inventory]);

  // Inventory stats & alerts
  const stats = useMemo(() => {
    const activeInventory = inventory.filter(item => {
      if (item.archived) return false;
      const titleLower = item.title.toLowerCase();
      const catLower = item.category.toLowerCase();
      return !titleLower.includes("sample") && 
             !titleLower.includes("demo") && 
             !titleLower.includes("test") && 
             !titleLower.includes("placeholder") &&
             !catLower.includes("sample") && 
             !catLower.includes("demo") && 
             !catLower.includes("test") && 
             !catLower.includes("placeholder");
    });

    const totalItems = activeInventory.length;
    const outOfStock = activeInventory.filter(item => item.quantity <= 0);
    const lowStock = activeInventory.filter(item => item.quantity > 0 && item.quantity <= 5);
    const totalBooks = activeInventory.reduce((sum, item) => sum + item.quantity, 0);
    // Alerts are triggered when stock <= 5 or flagged as Urgent Restock
    const needsAttention = activeInventory.filter(item => item.quantity <= 5 || item.rankingStatus === "Urgent Restock");

    return {
      totalItems,
      outOfStockCount: outOfStock.length,
      lowStockCount: lowStock.length,
      totalBooks,
      needsAttention: needsAttention.length
    };
  }, [inventory]);

  // Handle manual add item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMsg("Book title is required.");
      return;
    }
    if (!newCategory.trim()) {
      setErrorMsg("Category is required.");
      return;
    }

    const newItem: LuxeBookInventoryItem = {
      id: `LUX-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      category: newCategory.trim(),
      quantity: Math.max(0, newQuantity),
      dateAdded: newDateAdded,
      salesHistory: [],
      rankingStatus: newRankingStatus,
      salesClassification: newSalesClassification
    };

    onUpdateInventory([...inventory, newItem]);
    setNewTitle("");
    setNewCategory("");
    setNewQuantity(5);
    setNewRankingStatus("Healthy");
    setNewSalesClassification("TS");
    setShowAddForm(false);
    setSuccessMsg(`Successfully added "${newItem.title}" to inventory.`);
    setErrorMsg("");
  };

  // Handle saving changes from full edit form
  const handleSaveFullEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editingItem.title.trim()) {
      setErrorMsg("Book title is required.");
      return;
    }
    if (!editingItem.category.trim()) {
      setErrorMsg("Category is required.");
      return;
    }

    const updated = inventory.map(item => {
      if (item.id === editingItem.id) {
        return {
          ...editingItem,
          title: editingItem.title.trim(),
          category: editingItem.category.trim()
        };
      }
      return item;
    });

    onUpdateInventory(updated);
    setEditingItem(null);
    setSuccessMsg(`Successfully updated book details for "${editingItem.title}".`);
    setErrorMsg("");
  };

  // Handle manual quantity change
  const handleSaveQuantityEdit = (id: string) => {
    const updated = inventory.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, editQuantity) };
      }
      return item;
    });
    onUpdateInventory(updated);
    setEditingId(null);
    setSuccessMsg("Stock quantity updated successfully.");
    setErrorMsg("");
  };

  // Handle quick stock adjustment
  const handleQuickAdjust = (id: string, delta: number) => {
    const updated = inventory.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    });
    onUpdateInventory(updated);
    setSuccessMsg(`Quick adjusted stock quantity.`);
  };

  // Delete individual sales history transaction
  const handleDeleteSalesHistory = (itemId: string, bookTitle: string, saleId: string, clientName: string, quantitySold: number) => {
    if (window.confirm(`Are you sure you want to delete the historical sales transaction of ${quantitySold} copies for client "${clientName || "Luxe Guest"}"? This will remove this sale from history and restore ${quantitySold} copies back to the active stock inventory for "${bookTitle}".`)) {
      const updated = inventory.map(item => {
        if (item.id === itemId) {
          const updatedSalesHistory = item.salesHistory ? item.salesHistory.filter(sh => sh.id !== saleId) : [];
          return {
            ...item,
            quantity: item.quantity + quantitySold, // Restore/refund stock quantity
            salesHistory: updatedSalesHistory
          };
        }
        return item;
      });
      onUpdateInventory(updated);
      setSuccessMsg(`Successfully deleted sales history record for "${clientName || "Luxe Guest"}" and restored ${quantitySold} copies of "${bookTitle}" back to active stock.`);
    }
  };

  // Archive/Deactivate inventory item
  const handleArchiveItem = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to deactivate and archive "${title}"? This preserves historical sales transactions but removes it from active inventory tracking.`)) {
      const updated = inventory.map(item => {
        if (item.id === id) {
          return { ...item, archived: true };
        }
        return item;
      });
      onUpdateInventory(updated);
      setSuccessMsg(`Archived and deactivated "${title}" successfully.`);
    }
  };

  // Restore/Reactivate archived inventory item
  const handleRestoreItem = (id: string, title: string) => {
    if (window.confirm(`Restore "${title}" to active inventory?`)) {
      const updated = inventory.map(item => {
        if (item.id === id) {
          return { ...item, archived: false };
        }
        return item;
      });
      onUpdateInventory(updated);
      setSuccessMsg(`Restored "${title}" to active inventory.`);
    }
  };

  // Permanent Delete inventory item
  const handlePermanentDeleteItem = (id: string, title: string) => {
    if (window.confirm(`⚠️ PERMANENT DELETION WARNING: Are you sure you want to permanently delete "${title}"? This will completely erase the book, its associated sales transactions, and all historical data. This cannot be undone.`)) {
      const updated = inventory.filter(item => item.id !== id);
      onUpdateInventory(updated);
      setSuccessMsg(`Permanently deleted "${title}" and all its historical records.`);
    }
  };

  // Process Excel Quantities Upload
  const handleProcessQuantitiesExcel = (file: File) => {
    setSuccessMsg("");
    setErrorMsg("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rawJson.length === 0) {
          setErrorMsg("Excel sheet is empty.");
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
        
        let updatedList = [...inventory];

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

        // Add or update items from the Excel file
        rawJson.forEach(row => {
          const titleKey = Object.keys(row).find(k => k.toLowerCase().includes("title") || k.toLowerCase().includes("book"));
          const qtyKey = Object.keys(row).find(k => k.toLowerCase().includes("qty") || k.toLowerCase().includes("quantity") || k.toLowerCase().includes("stock") || k.toLowerCase().includes("count"));
          const catKey = Object.keys(row).find(k => k.toLowerCase().includes("category") || k.toLowerCase().includes("genre"));

          if (!titleKey) return;
          const titleVal = String(row[titleKey]).trim();
          const qtyVal = qtyKey ? Number(row[qtyKey]) : 0;
          const catVal = catKey ? String(row[catKey]).trim() : "Uncategorized";

          if (!titleVal) return;

          // Check if item exists (case insensitive match)
          const existingIdx = updatedList.findIndex(item => item.title.toLowerCase() === titleVal.toLowerCase());
          if (existingIdx !== -1) {
            const existingItem = updatedList[existingIdx];
            const wasArchived = existingItem.archived;
            updatedList[existingIdx] = {
              ...existingItem,
              quantity: Math.max(0, qtyVal),
              archived: false // Reactivate if it was archived but now appears in Excel
            };
            if (wasArchived) {
              reactivatedCount++;
            } else {
              updatedCount++;
            }
          } else {
            // Add as a new book
            updatedList.push({
              id: `LUX-${Math.floor(100 + Math.random() * 900)}`,
              title: titleVal,
              category: catVal,
              quantity: Math.max(0, qtyVal),
              dateAdded: new Date().toISOString().slice(0, 10),
              salesHistory: [],
              archived: false
            });
            addedCount++;
          }
        });

        onUpdateInventory(updatedList);
        
        if (excelUploadMode === "sync") {
          setSuccessMsg(`Excel Sync Completed! Added ${addedCount} new books, updated ${updatedCount} books. Archived ${archivedCount} missing items, and reactivated ${reactivatedCount} previously archived items.`);
        } else {
          setSuccessMsg(`Excel Update Completed! Added ${addedCount} new books and updated ${updatedCount} books while preserving existing records.`);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to parse the Excel file. Please ensure it is a valid format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Process Excel Sales Transactions (Reduces Stock level)
  const handleProcessSalesExcel = (file: File) => {
    setSuccessMsg("");
    setErrorMsg("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rawJson.length === 0) {
          setErrorMsg("Excel sheet is empty.");
          return;
        }

        let salesCount = 0;
        let reducedStockSum = 0;
        const updatedList = [...inventory];

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
        setSuccessMsg(`Excel Transactions success! Recorded ${salesCount} sales actions, reducing absolute stock by ${reducedStockSum} total books.`);
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to parse the Sales Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Download stock upload template
  const downloadStockTemplate = () => {
    const templateData = [
      { "Book Title": "The Odyssey (Illuminated Translation with Gold Leaf)", "Category": "Epic Poetry", "Quantity": 10 },
      { "Book Title": "The Philosophy of Luxury: Aesthetics of Elegance", "Category": "Philosophy", "Quantity": 6 },
      { "Book Title": "Renaissance Architecture of Jamaica", "Category": "Caribbean History", "Quantity": 3 }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory Quantities");
    XLSX.writeFile(wb, "Librarium_Luxe_Quantities_Template.xlsx");
  };

  // Download sales upload template
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

  // Filter book inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      // Archive filter
      if (!showArchived && item.archived) return false;
      if (showArchived && !item.archived) return false;

      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;

      let matchesAlert = true;
      if (alertFilter === "out") {
        matchesAlert = item.quantity <= 0;
      } else if (alertFilter === "low") {
        matchesAlert = item.quantity > 0 && item.quantity <= 5;
      } else if (alertFilter === "need_action") {
        matchesAlert = item.quantity <= 5 || item.rankingStatus === "Urgent Restock";
      }

      return matchesSearch && matchesCategory && matchesAlert;
    });
  }, [inventory, searchQuery, categoryFilter, alertFilter, showArchived]);

  return (
    <div className="space-y-6 text-left animate-fade-in">
      
      {/* SUCCESS / ERROR FLASH NOTIFICATIONS */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="ml-auto text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl flex items-center gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-xs font-semibold">{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="ml-auto text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. TOP STATS OVERVIEW & WARNING WATCHTOWER */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Book Titles</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-light text-white">{stats.totalItems}</span>
            <span className="text-xs text-slate-400 font-mono font-bold">({stats.totalBooks} total copies)</span>
          </div>
        </div>

        {/* OUT OF STOCK ALERT - GLOWING RED */}
        <button 
          onClick={() => setAlertFilter(alertFilter === "out" ? "all" : "out")}
          className={`border rounded-2xl p-4 flex flex-col justify-between transition-all text-left ${
            stats.outOfStockCount > 0 
              ? "bg-red-500/10 border-red-500/50 hover:bg-red-500/15 shadow-[0_2px_12px_rgba(239,68,68,0.15)] ring-1 ring-red-500/30" 
              : "bg-slate-900 border-slate-800"
          }`}
        >
          <div className="flex justify-between w-full items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Out of Stock</span>
            {stats.outOfStockCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-extrabold ${stats.outOfStockCount > 0 ? "text-red-400" : "text-white"}`}>
              {stats.outOfStockCount}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Books</span>
          </div>
        </button>

        {/* LOW STOCK ALERT - GLOWING AMBER */}
        <button 
          onClick={() => setAlertFilter(alertFilter === "low" ? "all" : "low")}
          className={`border rounded-2xl p-4 flex flex-col justify-between transition-all text-left ${
            stats.lowStockCount > 0 
              ? "bg-amber-500/10 border-amber-500/50 hover:bg-amber-500/15 shadow-[0_2px_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30" 
              : "bg-slate-900 border-slate-800"
          }`}
        >
          <div className="flex justify-between w-full items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Low Stock (&le; 5 copies)</span>
            {stats.lowStockCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-extrabold ${stats.lowStockCount > 0 ? "text-amber-400" : "text-white"}`}>
              {stats.lowStockCount}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Need Restock</span>
          </div>
        </button>

        {/* URGENT DEFICIT INDICATOR CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deficit Watchtower</span>
          <div className="mt-2 flex items-center gap-2">
            <AlertCircle className={`w-5 h-5 ${stats.needsAttention > 0 ? "text-red-500 animate-bounce" : "text-slate-500"}`} />
            <div>
              <span className="text-xl font-bold text-white block">
                {stats.needsAttention === 0 ? "No Issues" : `${stats.needsAttention} Alerts`}
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wide block font-semibold">
                {stats.needsAttention === 0 ? "Fully Stocked & ENGAGED" : "Out/Low Stock items pending"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. THE EXCEL STOCK MANAGEMENT BAR */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-rose-700" />
              Librarium Luxe Excel Sync Center
            </h3>
            <p className="text-xs text-slate-400 mt-1">Upload inventory updates directly. Choose the exact spreadsheet flow below.</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={downloadStockTemplate}
              className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" /> Stock Template
            </button>
            <button 
              onClick={downloadSalesTemplate}
              className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" /> Sales Template
            </button>
          </div>
        </div>

        {/* TWO DROP ZONES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* UPLOAD ZONE 1: STOCK QUANTITIES */}
          <div className="border border-dashed border-slate-200 hover:border-rose-300 hover:bg-rose-50/10 p-5 rounded-2xl text-center space-y-3 transition-all relative">
            <input 
              type="file" 
              ref={fileInputRefQuantities}
              onChange={(e) => e.target.files && handleProcessQuantitiesExcel(e.target.files[0])}
              accept=".xlsx,.xls"
              className="hidden" 
            />
            <div className="w-9 h-9 rounded-full bg-slate-50 mx-auto flex items-center justify-center border border-slate-200">
              <UploadCloud className="w-4 h-4 text-rose-700" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Stock Quantities Manager</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs mx-auto">Matches books by Title. Select upload mode below:</p>
            </div>

            {/* Mode Selector */}
            <div className="flex flex-col gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 max-w-xs mx-auto">
              <div className="flex justify-around items-center gap-1">
                <button
                  type="button"
                  onClick={() => setExcelUploadMode("update")}
                  className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                    excelUploadMode === "update" 
                      ? "bg-rose-100 text-rose-800 border border-rose-200" 
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Update Mode
                </button>
                <button
                  type="button"
                  onClick={() => setExcelUploadMode("sync")}
                  className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${
                    excelUploadMode === "sync" 
                      ? "bg-rose-600 text-white shadow-xs" 
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Full Sync Mode
                </button>
              </div>
              <p className="text-[8.5px] font-medium text-slate-400">
                {excelUploadMode === "sync" 
                  ? "⚠️ Full Sync: Books missing from file will be moved to the active archive." 
                  : "➕ Update: Updates existing quantities & appends new books. Retains old records."}
              </p>
            </div>

            <button 
              onClick={() => fileInputRefQuantities.current?.click()}
              className="w-full max-w-xs px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
            >
              Select & Upload Stock Excel
            </button>
          </div>

          {/* UPLOAD ZONE 2: SALES TRANSACTIONS */}
          <div className="border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/10 p-5 rounded-2xl text-center space-y-3 transition-all relative">
            <input 
              type="file" 
              ref={fileInputRefSales}
              onChange={(e) => e.target.files && handleProcessSalesExcel(e.target.files[0])}
              accept=".xlsx,.xls"
              className="hidden" 
            />
            <div className="w-9 h-9 rounded-full bg-slate-50 mx-auto flex items-center justify-center border border-slate-200">
              <TrendingDown className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Process Sales Transactions</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs mx-auto">Upload sales history sheet to automatically subtract sold quantities from your current book stock.</p>
            </div>
            <button 
              onClick={() => fileInputRefSales.current?.click()}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
            >
              Select Sales Excel
            </button>
          </div>

        </div>
      </div>

      {/* BOOK PERFORMANCE & INTELLIGENCE ANALYTICS */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
        <button
          onClick={() => setShowIntelligence(!showIntelligence)}
          className="w-full flex items-center justify-between text-left focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Librarium Luxe Intelligence & Performance Analytics
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Analyze active stock velocity, total stocked units, historical copies sold, and commercial ranking.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg uppercase tracking-wider hover:bg-indigo-100 transition-colors">
            {showIntelligence ? "Hide Analytics 📂" : "Expand Analytics 📁"}
          </span>
        </button>

        {showIntelligence && (
          <div className="border-t border-slate-100 pt-4 animate-fade-in space-y-4">
            <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-slate-50/20">
              <table className="w-full border-collapse text-left text-xs text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="p-3 pl-5">Premium Book / Edition</th>
                    <th className="p-3 text-center">Current Stock</th>
                    <th className="p-3 text-center">Units Stocked</th>
                    <th className="p-3 text-center">Units Sold</th>
                    <th className="p-3 text-center">Sales Class</th>
                    <th className="p-3 text-center">Velocity Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.filter(item => !item.archived).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        No active book inventory listed.
                      </td>
                    </tr>
                  ) : (
                    inventory.filter(item => !item.archived).map(item => {
                      const unitsSold = item.salesHistory ? item.salesHistory.reduce((sum, sh) => sum + sh.quantitySold, 0) : 0;
                      const unitsStocked = item.quantity + unitsSold;
                      const salesClass = item.salesClassification || "TS";
                      const rank = item.rankingStatus || "Healthy";

                      return (
                        <tr key={item.id} className="border-b border-slate-100 hover:bg-white transition-colors bg-white/40">
                          <td className="p-3 pl-5">
                            <div>
                              <span className="font-bold text-slate-900 block">{item.title}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">{item.category}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-900">
                            {item.quantity}
                          </td>
                          <td className="p-3 text-center font-mono text-slate-500">
                            {unitsStocked}
                          </td>
                          <td className="p-3 text-center font-mono text-indigo-600 font-bold">
                            {unitsSold}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider inline-block ${
                              salesClass === "TS" 
                                ? "bg-amber-100 text-amber-900 border border-amber-200" 
                                : salesClass === "MS"
                                  ? "bg-slate-100 text-slate-700 border border-slate-200"
                                  : "bg-indigo-50 text-indigo-800 border border-indigo-100"
                            }`}>
                              {salesClass === "TS" ? "Top Seller (TS)" : salesClass === "MS" ? "Medium Seller (MS)" : "Slow Mover (SM)"}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider inline-block ${
                              rank === "Urgent Restock" 
                                ? "bg-red-100 text-red-800 border border-red-200" 
                                : rank === "Restock" || rank === "Test Again"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-800 border border-emerald-100"
                            }`}>
                              {rank}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 3. INVENTORY DIRECTORY TREE LIST */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* FILTERS & SEARCH ROW */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inventory..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:outline-none transition-colors"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl py-2 px-3 text-slate-700 focus:outline-none hover:border-slate-300"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
              ))}
            </select>

            {/* Archive State Toggle */}
            <button
              type="button"
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                showArchived 
                  ? "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100" 
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
              }`}
            >
              <span>{showArchived ? "📁 Inactive Archive" : "📂 Active Inventory"}</span>
            </button>

            {/* Clear Filters indicator */}
            {(categoryFilter !== "All" || alertFilter !== "all" || searchQuery !== "" || showArchived) && (
              <button 
                onClick={() => {
                  setCategoryFilter("All");
                  setAlertFilter("all");
                  setSearchQuery("");
                  setShowArchived(false);
                }}
                className="text-[10px] font-bold text-rose-700 hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* ALERT FILTER CHIPS */}
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Show:</span>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/40">
              <button 
                onClick={() => setAlertFilter("all")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                  alertFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                All ({inventory.length})
              </button>
              <button 
                onClick={() => setAlertFilter("need_action")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${
                  alertFilter === "need_action" ? "bg-white text-rose-700 shadow-xs" : "text-slate-500 hover:text-rose-700"
                }`}
              >
                Alerts ({stats.needsAttention})
              </button>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="ml-2 px-3.5 py-1.5 bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all shadow-sm"
            >
              {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showAddForm ? "Cancel" : "Add Book"}
            </button>
          </div>
        </div>

        {/* ADD BOOK MANUAL FORM */}
        {showAddForm && (
          <form onSubmit={handleAddItem} className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-4 animate-fade-in text-left">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200">
              <Sparkles className="w-4 h-4 text-rose-700" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Catalog New Premium Book Edition</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Book Title / Edition</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Shakespeare Folio (Royal Blue Leather)"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                <input 
                  type="text" 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g., Fine Art, History"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Initial Copies</label>
                <input 
                  type="number" 
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(Number(e.target.value))}
                  min="0"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Added Date</label>
                <input 
                  type="date" 
                  value={newDateAdded}
                  onChange={(e) => setNewDateAdded(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Ranking Status</label>
                <select 
                  value={newRankingStatus}
                  onChange={(e) => setNewRankingStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800 text-slate-800"
                >
                  <option value="Never Sell">Never Sell</option>
                  <option value="Dead Stock">Dead Stock</option>
                  <option value="Evaluate">Evaluate</option>
                  <option value="Freeze">Freeze</option>
                  <option value="Stacked">Stacked</option>
                  <option value="Healthy">Healthy</option>
                  <option value="Test Again">Test Again</option>
                  <option value="Restock">Restock</option>
                  <option value="Urgent Restock">Urgent Restock</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Sales Classification</label>
                <select 
                  value={newSalesClassification}
                  onChange={(e) => setNewSalesClassification(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800 text-slate-800"
                >
                  <option value="TS">TS (Top Seller)</option>
                  <option value="MS">MS (Medium Seller)</option>
                  <option value="SM">SM (Slow Mover)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button 
                type="submit"
                className="px-4 py-2 bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Save New Book
              </button>
            </div>
          </form>
        )}

        {/* EDIT BOOK MANUAL FORM */}
        {editingItem && (
          <form onSubmit={handleSaveFullEdit} className="p-5 bg-indigo-50/40 border border-indigo-200/60 rounded-2xl space-y-4 animate-fade-in text-left">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-200">
              <div className="flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-indigo-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Edit Premium Book Catalog Detail ({editingItem.id})</h4>
              </div>
              <button type="button" onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Book Title / Edition</label>
                <input 
                  type="text" 
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                <input 
                  type="text" 
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Copies In Stock</label>
                <input 
                  type="number" 
                  value={editingItem.quantity}
                  onChange={(e) => setEditingItem({ ...editingItem, quantity: Math.max(0, Number(e.target.value)) })}
                  min="0"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Added Date</label>
                <input 
                  type="date" 
                  value={editingItem.dateAdded}
                  onChange={(e) => setEditingItem({ ...editingItem, dateAdded: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Ranking Status</label>
                <select 
                  value={editingItem.rankingStatus || "Healthy"}
                  onChange={(e) => setEditingItem({ ...editingItem, rankingStatus: e.target.value as any })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800 text-slate-800"
                >
                  <option value="Never Sell">Never Sell</option>
                  <option value="Dead Stock">Dead Stock</option>
                  <option value="Evaluate">Evaluate</option>
                  <option value="Freeze">Freeze</option>
                  <option value="Stacked">Stacked</option>
                  <option value="Healthy">Healthy</option>
                  <option value="Test Again">Test Again</option>
                  <option value="Restock">Restock</option>
                  <option value="Urgent Restock">Urgent Restock</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Sales Classification</label>
                <select 
                  value={editingItem.salesClassification || "TS"}
                  onChange={(e) => setEditingItem({ ...editingItem, salesClassification: e.target.value as any })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800 text-slate-800"
                >
                  <option value="TS">TS (Top Seller)</option>
                  <option value="MS">MS (Medium Seller)</option>
                  <option value="SM">SM (Slow Mover)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* INVENTORY LIST COLLAPSIBLE CARDS */}
        <div className="grid grid-cols-1 gap-4">
          {filteredInventory.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic bg-white border border-slate-200/60 rounded-2xl">
              No matching book inventory listings found under these filter parameters.
            </div>
          ) : (
            filteredInventory.map(item => {
              const isExpanded = expandedItemId === item.id;
              const isOutOfStock = item.quantity <= 0;
              const isLowStock = item.quantity > 0 && item.quantity <= 5;
              const restockQty = calculateRestockQuantity(item.rankingStatus, item.salesClassification, item.quantity);
              const isUrgentRestock = item.rankingStatus === "Urgent Restock";
              const totalSales = item.salesHistory ? item.salesHistory.reduce((sum, sh) => sum + sh.quantitySold, 0) : 0;

              return (
                <div
                  key={item.id}
                  onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                  className={`bg-white border text-left rounded-2xl cursor-pointer hover:shadow-md transition-all relative overflow-hidden flex flex-col ${
                    isExpanded 
                      ? "ring-1 ring-slate-900 border-transparent shadow-md" 
                      : "border-slate-200/60 shadow-[0_1px_4px_rgba(0,0,0,0.01)]"
                  }`}
                  id={`inventory-card-${item.id}`}
                >
                  {/* Card Main Body */}
                  <div className="p-4 flex flex-col gap-3">
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-extrabold flex items-center justify-center flex-shrink-0 shadow-2xs">
                          <BookOpen className="w-4 h-4 text-indigo-900" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-950 truncate leading-tight">
                              {item.title}
                            </h3>
                            {item.archived && (
                              <span className="bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded text-[7.5px] font-bold uppercase tracking-wider animate-pulse">
                                Archived / Inactive
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-400 font-semibold truncate">
                            <span className="font-bold">ID: {item.id}</span>
                            <span>•</span>
                            <span className="truncate">{item.category}</span>
                            <span>•</span>
                            <span className="truncate">Added {item.dateAdded}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expansion Indicator */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded text-[8px] bg-red-100 text-red-800 border border-red-200 font-bold uppercase tracking-wider">
                            Out of stock
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2 py-0.5 rounded text-[8px] bg-amber-100 text-amber-800 border border-amber-200 font-bold uppercase tracking-wider">
                            Low stock
                          </span>
                        ) : null}
                        <div className="text-slate-400 hover:text-slate-700 p-1 rounded-full transition-colors">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                        </div>
                      </div>
                    </div>

                    {/* Compact Metric Summary Section displayed beneath each inventory item header inside the card */}
                    <div className="grid grid-cols-4 gap-1 p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                      <div className="text-left min-w-0">
                        <span className="text-slate-400 block font-bold uppercase text-[7px] tracking-tight truncate">Book Type</span>
                        <span className="text-slate-900 font-extrabold text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-left min-w-0">
                        <span className="text-slate-400 block font-bold uppercase text-[7px] tracking-tight truncate">Total In Stock</span>
                        <span className="text-slate-900 font-extrabold text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight font-mono">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="text-left min-w-0">
                        <span className="text-slate-400 block font-bold uppercase text-[7px] tracking-tight truncate">Book Rank</span>
                        <span className="text-slate-900 font-extrabold text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight">
                          Class {item.salesClassification || "TS"}
                        </span>
                      </div>
                      <div className="text-left min-w-0">
                        <span className="text-slate-400 block font-bold uppercase text-[7px] tracking-tight truncate">Total Sales Made</span>
                        <span className="text-indigo-600 font-extrabold text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight font-mono">
                          {totalSales} units
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Info Area */}
                  {isExpanded && (
                    <div 
                      className="border-t border-slate-100 bg-slate-50/20 p-4 space-y-4"
                      onClick={(e) => e.stopPropagation()} // Prevent closing card when clicking inside the expanded area
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Book Metadata & Controls */}
                        <div className="space-y-3 text-left bg-white p-3.5 rounded-xl border border-slate-100 shadow-3xs">
                          <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest block">Inventory Status & Controls:</span>
                          
                          <div className="grid grid-cols-2 gap-3 text-[11px]">
                            <div>
                              <span className="text-slate-400 block font-bold uppercase text-[8px] tracking-tight mb-0.5">Ranking Status</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider inline-block ${
                                isUrgentRestock 
                                  ? "bg-red-100 text-red-800 border border-red-200" 
                                  : item.rankingStatus === "Restock" || item.rankingStatus === "Test Again"
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}>
                                {item.rankingStatus || "Healthy"}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 block font-bold uppercase text-[8px] tracking-tight mb-0.5">Book Rank (Class)</span>
                              <span className="font-extrabold text-slate-800 block uppercase font-mono">
                                Class {item.salesClassification || "TS"}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
                            <div>
                              <span className="text-slate-400 block font-bold uppercase text-[8px] tracking-tight mb-1">Stock Quantity Adjust</span>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleQuickAdjust(item.id, -1); }}
                                  className="text-slate-400 hover:text-rose-700 transition-colors cursor-pointer"
                                  title="Decrease Stock by 1"
                                >
                                  <MinusCircle className="w-5 h-5" />
                                </button>
                                <span className="font-extrabold text-xs font-mono text-slate-900 block w-6 text-center">
                                  {item.quantity}
                                </span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleQuickAdjust(item.id, 1); }}
                                  className="text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                  title="Increase Stock by 1"
                                >
                                  <PlusCircle className="w-5 h-5" />
                                </button>
                              </div>
                            </div>

                            <div>
                              <span className="text-slate-400 block font-bold uppercase text-[8px] tracking-tight mb-1">Restock Order Alert</span>
                              {restockQty > 0 ? (
                                <span className={`px-2 py-1 rounded-full text-[8.5px] uppercase tracking-wider border font-bold inline-block ${
                                  isUrgentRestock
                                    ? "bg-red-500 text-white border-red-600 shadow-xs animate-pulse"
                                    : "bg-amber-100 text-amber-800 border-amber-200"
                                }`}>
                                  Order +{restockQty} {isUrgentRestock && "⚠️"}
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-[8.5px] uppercase tracking-wider border font-bold bg-emerald-50 text-emerald-800 border-emerald-200 inline-block">
                                  Fully Stocked
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Complete Actions Column */}
                        <div className="space-y-3 text-left bg-white p-3.5 rounded-xl border border-slate-100 shadow-3xs flex flex-col justify-between">
                          <div>
                            <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Record Operations:</span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingItem(item);
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg transition-all cursor-pointer"
                                title="Edit Complete Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit Details
                              </button>

                              {item.archived ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRestoreItem(item.id, item.title); }}
                                  className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 rounded-lg transition-all cursor-pointer"
                                  title="Restore to Active Inventory"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  Restore Active
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleArchiveItem(item.id, item.title); }}
                                  className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 rounded-lg transition-all cursor-pointer"
                                  title="Archive / Inactivate Item"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                  Archive Book
                                </button>
                              )}

                              <button
                                onClick={(e) => { e.stopPropagation(); handlePermanentDeleteItem(item.id, item.title); }}
                                className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 rounded-lg transition-all cursor-pointer"
                                title="Permanently Delete (Erase History)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Book
                              </button>
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-400 italic">
                            * Deleting permanently erases all associated sales transaction history from reports.
                          </div>
                        </div>
                      </div>

                      {/* Recorded Sales History & Transactions (If Any exist) */}
                      {item.salesHistory && item.salesHistory.length > 0 ? (
                        <div className="bg-white border border-slate-100 rounded-xl p-3.5 text-left space-y-2 shadow-3xs">
                          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                            <History className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Recorded Sales History & Transactions ({item.salesHistory.length})</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {item.salesHistory.map((sh, idx) => (
                              <div key={sh.id || idx} className="p-2 bg-slate-50 border border-slate-200/50 rounded-lg text-[11px] flex justify-between items-center">
                                <div>
                                  <p className="font-bold text-slate-800">{sh.clientName || "Luxe Guest"}</p>
                                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">{sh.date}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-[10px]">
                                    -{sh.quantitySold} copies
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSalesHistory(item.id, item.title, sh.id, sh.clientName || "Luxe Guest", sh.quantitySold);
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-all cursor-pointer"
                                    title="Delete this historical sale record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-100 rounded-xl p-3 text-center text-[11px] text-slate-400 italic shadow-3xs">
                          No sales history has been recorded for this item yet.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* PREMIUM INVENTORY SUMMARY METRICS PANEL */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="bg-slate-50/70 border border-slate-200/50 rounded-2xl p-5 md:p-6 shadow-3xs">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              Librarium Luxe Inventory Summary Section
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Metric 1: Book Type */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-3xs flex flex-col justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Book Type</span>
                  <span className="text-xl md:text-2xl font-black text-slate-900 mt-1 block">
                    {Array.from(new Set(filteredInventory.map(item => item.category))).length} <span className="text-xs font-semibold text-slate-500 font-sans">Genres</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 truncate font-medium">
                  {Array.from(new Set(filteredInventory.map(item => item.category))).slice(0, 3).join(", ") + (Array.from(new Set(filteredInventory.map(item => item.category))).length > 3 ? "..." : "") || "No genres available"}
                </p>
              </div>

              {/* Metric 2: Total In Stock */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-3xs flex flex-col justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total In Stock</span>
                  <span className="text-xl md:text-2xl font-black text-slate-900 mt-1 block font-mono">
                    {filteredInventory.reduce((sum, item) => sum + item.quantity, 0)} <span className="text-xs font-semibold text-slate-500 font-sans">copies</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Active Book Units tracked</span>
                </div>
              </div>

              {/* Metric 3: Book Rank */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-3xs flex flex-col justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Book Rank Distribution</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-xl md:text-2xl font-black text-slate-900 block font-mono">
                      {filteredInventory.length}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 font-sans">total ranked</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 font-mono" title="Top Sellers">
                    TS: {filteredInventory.filter(i => i.salesClassification === "TS" || !i.salesClassification).length}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100 font-mono" title="Medium Sellers">
                    MS: {filteredInventory.filter(i => i.salesClassification === "MS").length}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-50 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 font-mono" title="Slow Movers">
                    SM: {filteredInventory.filter(i => i.salesClassification === "SM").length}
                  </span>
                </div>
              </div>

              {/* Metric 4: Total Sales Made */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-3xs flex flex-col justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Sales Made</span>
                  <span className="text-xl md:text-2xl font-black text-indigo-600 mt-1 block font-mono">
                    {filteredInventory.reduce((sum, item) => sum + (item.salesHistory ? item.salesHistory.reduce((s, sh) => s + sh.quantitySold, 0) : 0), 0)} <span className="text-xs font-semibold text-slate-500 font-sans">sold</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <span>Units sold across history</span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
