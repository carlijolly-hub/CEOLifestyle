import React, { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { LuxeBookInventoryItem, InventorySalesMovement, SystemSettings } from "../types";
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
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export function calculateRestockQuantity(
  rankingStatus?: string,
  bookRank?: string,
  quantity: number = 0
): number {
  if (!rankingStatus) return 0;
  
  const status = rankingStatus.trim();
  const rank = bookRank?.trim() || "Standard";

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
    if (rank === "Top Seller") return Math.max(0, 10 - quantity);
    if (rank === "Best Seller" || rank === "High Performer") return Math.max(0, 8 - quantity);
    if (rank === "Standard" || rank === "Slow Moving" || rank === "New Release") return Math.max(0, 5 - quantity);
    return Math.max(0, 5 - quantity);
  }

  if (status === "Urgent Restock") {
    if (rank === "Top Seller") return Math.max(0, 15 - quantity);
    if (rank === "Best Seller" || rank === "High Performer") return Math.max(0, 10 - quantity);
    if (rank === "Standard" || rank === "Slow Moving" || rank === "New Release") return Math.max(0, 6 - quantity);
    return Math.max(0, 6 - quantity);
  }

  return 0;
}

interface LuxeInventoryProps {
  inventory: LuxeBookInventoryItem[];
  onUpdateInventory: (updatedList: LuxeBookInventoryItem[]) => void;
  settings?: SystemSettings;
}

export default function LuxeInventory({ inventory, onUpdateInventory, settings }: LuxeInventoryProps) {
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [alertFilter, setAlertFilter] = useState<"all" | "out" | "low" | "need_action">("all");

  // New item form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newQuantity, setNewQuantity] = useState<number>(5);
  const [newInStore, setNewInStore] = useState<number>(0);
  const [newOffice, setNewOffice] = useState<number>(5);
  const [newDateAdded, setNewDateAdded] = useState(new Date().toISOString().slice(0, 10));
  const [newRankingStatus, setNewRankingStatus] = useState<LuxeBookInventoryItem["rankingStatus"]>("Healthy");
  const [newBookRank, setNewBookRank] = useState<string>("Standard");
  const [newBookId, setNewBookId] = useState("");
  const [newSellingPrice, setNewSellingPrice] = useState<string>("4000");
  const [newArchived, setNewArchived] = useState<boolean>(false);

  // Manual quantity adjust state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);

  // Full item editing state
  const [editingItem, setEditingItem] = useState<LuxeBookInventoryItem | null>(null);
  const [editingOriginalId, setEditingOriginalId] = useState<string | null>(null);

  // Success / Error messages
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(() => {
    const stored = localStorage.getItem("luxe_inventory_carousel_index");
    if (stored !== null) return parseInt(stored, 10);
    return settings?.luxeInventoryCarouselDefaultIndex ?? 0;
  });

  const showArchived = currentCarouselIndex === 3;
  const [showIntelligence, setShowIntelligence] = useState<boolean>(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const handleCarouselChange = (index: number) => {
    setCurrentCarouselIndex(index);
    localStorage.setItem("luxe_inventory_carousel_index", index.toString());
  };

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

  // Dynamic inventory location validation statistics
  const validationSummary = useMemo(() => {
    let successful = 0;
    let discrepancies = 0;
    let requiringReview = 0;

    inventory.forEach(item => {
      if (item.archived) return; // Only validate active ones
      const inStore = item.inStore ?? 0;
      const office = item.office ?? 0;
      const total = item.quantity;

      const hasMissingFields = item.inStore === undefined || item.office === undefined;
      const matches = inStore + office === total;

      if (matches && !hasMissingFields) {
        successful++;
      } else {
        if (!matches) {
          discrepancies++;
        }
        requiringReview++;
      }
    });

    return { successful, discrepancies, requiringReview };
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

    // Prevent negative inventory quantities and allocations
    if (newQuantity < 0) {
      setErrorMsg("Initial total quantity cannot be negative.");
      return;
    }
    if (newInStore < 0) {
      setErrorMsg("Store allocation cannot be negative.");
      return;
    }
    if (newOffice < 0) {
      setErrorMsg("Office allocation cannot be negative.");
      return;
    }

    // Check for duplicate title
    const titleExists = inventory.some(item => item.title.toLowerCase().trim() === newTitle.trim().toLowerCase());
    if (titleExists) {
      setErrorMsg(`A book with the title "${newTitle.trim()}" already exists in the inventory.`);
      return;
    }

    let finalId = newBookId.trim();
    if (finalId) {
      const idExists = inventory.some(item => item.id.toLowerCase() === finalId.toLowerCase());
      if (idExists) {
        setErrorMsg(`The Book ID "${finalId}" is already assigned to another book. Each book must have a unique ID.`);
        return;
      }
    } else {
      let idCollision = true;
      while (idCollision) {
        finalId = `LUX-${Math.floor(100 + Math.random() * 900)}`;
        idCollision = inventory.some(item => item.id.toLowerCase() === finalId.toLowerCase());
      }
    }

    const newItem: LuxeBookInventoryItem = {
      id: finalId,
      title: newTitle.trim(),
      category: newCategory.trim(),
      quantity: Math.max(0, newQuantity),
      dateAdded: newDateAdded,
      salesHistory: [],
      rankingStatus: newRankingStatus,
      bookRank: newBookRank,
      archived: newArchived,
      inStore: newInStore,
      office: newOffice,
      sellingPrice: parseFloat(newSellingPrice) || 0
    };

    onUpdateInventory([...inventory, newItem]);
    setNewBookId("");
    setNewTitle("");
    setNewCategory("");
    setNewQuantity(5);
    setNewInStore(0);
    setNewOffice(5);
    setNewRankingStatus("Healthy");
    setNewBookRank("Standard");
    setNewSellingPrice("4000");
    setNewArchived(false);
    setShowAddForm(false);
    setSuccessMsg(`Successfully added "${newItem.title}" to inventory.`);
    setErrorMsg("");
  };

  // Handle manual location update
  const handleLocationUpdate = (id: string, inStore: number, office: number) => {
    const updated = inventory.map(item => {
      if (item.id === id) {
        return {
          ...item,
          inStore: Math.max(0, inStore),
          office: Math.max(0, office)
        };
      }
      return item;
    });
    onUpdateInventory(updated);
  };

  // Quick helper to auto-balance location allocation to match Total Stock
  const handleAutoReconcile = (id: string, mode: "balance" | "sync_total") => {
    const updated = inventory.map(item => {
      if (item.id === id) {
        if (mode === "balance") {
          // Split Total Stock evenly, giving remainder to office
          const inStore = Math.floor(item.quantity / 2);
          const office = item.quantity - inStore;
          return { ...item, inStore, office };
        } else if (mode === "sync_total") {
          // Set Total Stock = inStore + office
          const total = (item.inStore ?? 0) + (item.office ?? 0);
          return { ...item, quantity: total };
        }
      }
      return item;
    });
    onUpdateInventory(updated);
    setSuccessMsg("Inventory allocation synchronized.");
  };

  // Handle saving changes from full edit form
  const handleSaveFullEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const trimmedId = editingItem.id.trim();
    if (!trimmedId) {
      setErrorMsg("Book ID is required.");
      return;
    }
    if (!editingItem.title.trim()) {
      setErrorMsg("Book title is required.");
      return;
    }
    if (!editingItem.category.trim()) {
      setErrorMsg("Category is required.");
      return;
    }

    // Prevent negative quantities
    if (editingItem.quantity < 0) {
      setErrorMsg("Quantity cannot be negative.");
      return;
    }
    if (editingItem.inStore !== undefined && editingItem.inStore < 0) {
      setErrorMsg("Store allocation cannot be negative.");
      return;
    }
    if (editingItem.office !== undefined && editingItem.office < 0) {
      setErrorMsg("Office allocation cannot be negative.");
      return;
    }

    // Check for duplicate title
    const titleExists = inventory.some(item => 
      item.id !== editingOriginalId && 
      item.title.toLowerCase().trim() === editingItem.title.toLowerCase().trim()
    );
    if (titleExists) {
      setErrorMsg(`Another book with the title "${editingItem.title}" already exists.`);
      return;
    }

    // Check for unique ID constraint
    if (trimmedId.toLowerCase() !== (editingOriginalId || "").toLowerCase()) {
      const idExists = inventory.some(item => item.id.toLowerCase() === trimmedId.toLowerCase());
      if (idExists) {
        setErrorMsg(`The Book ID "${trimmedId}" is already assigned to another book. Each book must have a unique ID.`);
        return;
      }
    }

    const updated = inventory.map(item => {
      if (item.id === editingOriginalId) {
        return {
          ...editingItem,
          id: trimmedId,
          title: editingItem.title.trim(),
          category: editingItem.category.trim()
        };
      }
      return item;
    });

    onUpdateInventory(updated);
    setEditingItem(null);
    setEditingOriginalId(null);
    setSuccessMsg(`Successfully updated book details for "${editingItem.title}".`);
    setErrorMsg("");
  };

  // Handle manual quantity change
  const handleSaveQuantityEdit = (id: string) => {
    if (editQuantity < 0) {
      setErrorMsg("Quantity cannot be a negative value.");
      return;
    }
    const updated = inventory.map(item => {
      if (item.id === id) {
        return { ...item, quantity: editQuantity };
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
      setSuccessMsg(`Successfully deactivated "${title}" and changed status to Inactive.`);
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

      {/* APPLE-INSPIRED LUXE INVENTORY CAROUSEL CONTROLLER */}
      <div className="flex items-center justify-center py-2">
        <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800/85 rounded-full px-4 py-2 shadow-md">
          {/* Left Arrow */}
          <button 
            onClick={() => handleCarouselChange((currentCarouselIndex - 1 + 4) % 4)}
            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
            title="Previous Section"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dot indicators only */}
          <div className="flex justify-center items-center gap-2">
            {[0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                onClick={() => handleCarouselChange(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentCarouselIndex === idx ? "bg-indigo-400 scale-110" : "bg-slate-700 hover:bg-slate-600"
                }`}
                title={
                  idx === 0 ? "Inventory Health & Summary" :
                  idx === 1 ? "Performance & Analytics" :
                  idx === 2 ? "Premium Book Catalog" :
                  "Inactive Archives"
                }
              />
            ))}
          </div>

          {/* Right Arrow */}
          <button 
            onClick={() => handleCarouselChange((currentCarouselIndex + 1) % 4)}
            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
            title="Next Section"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slide 0: Master Inventory Summary & Health Overview */}
      {currentCarouselIndex === 0 && (
        <div className="bg-slate-50/70 border border-slate-200/50 rounded-3xl p-6 md:p-8 space-y-8 shadow-3xs text-left animate-fade-in">
          {/* Slide Header */}
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200/60">
            <Sparkles className="w-5 h-5 text-rose-800 animate-pulse" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Librarium Luxe Master Inventory Summary & Health Overview
              </h3>
              <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">
                Primary inventory health overview, real-time metrics, active stock level monitors, and database integrity validation report
              </p>
            </div>
          </div>

          {/* 1. Key Metrics row */}
          <div className="space-y-3">
            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Key Inventory Metrics</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Book Type */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-3xs flex flex-col justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Book Type</span>
                  <span className="text-xl md:text-2xl font-black text-slate-900 mt-1 block">
                    {Array.from(new Set(inventory.filter(item => !item.archived).map(item => item.category))).length} <span className="text-xs font-semibold text-slate-500 font-sans">Genres</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-450 mt-2 truncate font-semibold">
                  {Array.from(new Set(inventory.filter(item => !item.archived).map(item => item.category))).slice(0, 3).join(", ") + (Array.from(new Set(inventory.filter(item => !item.archived).map(item => item.category))).length > 3 ? "..." : "") || "No genres available"}
                </p>
              </div>

              {/* Metric 2: Total In Stock */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-3xs flex flex-col justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total In Stock</span>
                  <span className="text-xl md:text-2xl font-black text-slate-900 mt-1 block font-mono">
                    {inventory.filter(item => !item.archived).reduce((sum, item) => sum + item.quantity, 0)} <span className="text-xs font-semibold text-slate-500 font-sans">copies</span>
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
                      {inventory.filter(item => !item.archived).length}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 font-sans">total ranked</span>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  <span className="text-[8px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 px-1 py-0.5 rounded border border-amber-100" title="Top Sellers">
                    Top: {inventory.filter(i => !i.archived && (i.bookRank || "Standard") === "Top Seller").length}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 px-1 py-0.5 rounded border border-orange-100" title="Best Sellers">
                    Best: {inventory.filter(i => !i.archived && i.bookRank === "Best Seller").length}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded border border-emerald-100" title="High Performers">
                    HP: {inventory.filter(i => !i.archived && i.bookRank === "High Performer").length}
                  </span>
                </div>
              </div>

              {/* Metric 4: Total Sales Made */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-3xs flex flex-col justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Sales Made</span>
                  <span className="text-xl md:text-2xl font-black text-indigo-600 mt-1 block font-mono">
                    {inventory.filter(item => !item.archived).reduce((sum, item) => sum + (item.salesHistory ? item.salesHistory.reduce((s, sh) => s + sh.quantitySold, 0) : 0), 0)} <span className="text-xs font-semibold text-slate-500 font-sans">sold</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <span>Units sold across history</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Active Stock Level Alerts (Widgets incorporated) */}
          <div className="space-y-3">
            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Stock Level Alerts</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* OUT OF STOCK */}
              <button
                onClick={() => {
                  setAlertFilter("out");
                  handleCarouselChange(2); // Seamless slide transition to active book catalog list
                }}
                className={`group relative overflow-hidden border rounded-2xl p-5 flex flex-col justify-between transition-all duration-305 text-left cursor-pointer shadow-3xs ${
                  stats.outOfStockCount > 0
                    ? "bg-white border-red-200 hover:bg-slate-50 hover:border-red-300 hover:shadow-xs"
                    : "bg-slate-100/50 border-slate-200/40 text-slate-400"
                }`}
              >
                <div className="flex justify-between w-full items-center">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                    Out of Stock
                  </span>
                  <span className={`w-2 h-2 rounded-full ${stats.outOfStockCount > 0 ? "bg-red-500 animate-pulse" : "bg-slate-200"}`} />
                </div>
                <div className="flex items-baseline gap-1.5 mt-4">
                  <span className={`text-4xl font-extrabold tracking-tight ${stats.outOfStockCount > 0 ? "text-red-650" : "text-slate-400"}`}>
                    {stats.outOfStockCount}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Unique Books</span>
                </div>
                <p className="text-[9px] mt-2 font-bold leading-relaxed text-slate-450 flex items-center justify-between w-full">
                  <span>{stats.outOfStockCount > 0 ? "⚠️ Critical deficit: stock fully depleted" : "All listings have physical stock"}</span>
                  {stats.outOfStockCount > 0 && <span className="text-red-650 font-black">View Catalog ➔</span>}
                </p>
              </button>

              {/* LOW STOCK */}
              <button
                onClick={() => {
                  setAlertFilter("low");
                  handleCarouselChange(2); // Seamless slide transition to active book catalog list
                }}
                className={`group relative overflow-hidden border rounded-2xl p-5 flex flex-col justify-between transition-all duration-305 text-left cursor-pointer shadow-3xs ${
                  stats.lowStockCount > 0
                    ? "bg-white border-amber-200 hover:bg-slate-50 hover:border-amber-300 hover:shadow-xs"
                    : "bg-slate-100/50 border-slate-200/40 text-slate-400"
                }`}
              >
                <div className="flex justify-between w-full items-center">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                    Low Stock (&le; 5 units)
                  </span>
                  <span className={`w-2 h-2 rounded-full ${stats.lowStockCount > 0 ? "bg-amber-500 animate-pulse" : "bg-slate-200"}`} />
                </div>
                <div className="flex items-baseline gap-1.5 mt-4">
                  <span className={`text-4xl font-extrabold tracking-tight ${stats.lowStockCount > 0 ? "text-amber-650" : "text-slate-400"}`}>
                    {stats.lowStockCount}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Near Depleted</span>
                </div>
                <p className="text-[9px] mt-2 font-bold leading-relaxed text-slate-450 flex items-center justify-between w-full">
                  <span>{stats.lowStockCount > 0 ? "⚠️ Alert triggered: 1 to 5 copies remaining" : "All active items are healthy"}</span>
                  {stats.lowStockCount > 0 && <span className="text-amber-650 font-black">View Catalog ➔</span>}
                </p>
              </button>

              {/* NEED RESTOCK */}
              <button
                onClick={() => {
                  setAlertFilter("need_action");
                  handleCarouselChange(2); // Seamless slide transition to active book catalog list
                }}
                className={`group relative overflow-hidden border rounded-2xl p-5 flex flex-col justify-between transition-all duration-305 text-left cursor-pointer shadow-3xs ${
                  stats.needsAttention > 0
                    ? "bg-white border-indigo-200 hover:bg-slate-50 hover:border-indigo-300 hover:shadow-xs"
                    : "bg-slate-100/50 border-slate-200/40 text-slate-400"
                }`}
              >
                <div className="flex justify-between w-full items-center">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                    Need Restock
                  </span>
                  <span className={`w-2 h-2 rounded-full ${stats.needsAttention > 0 ? "bg-indigo-500 animate-pulse" : "bg-slate-200"}`} />
                </div>
                <div className="flex items-baseline gap-1.5 mt-4">
                  <span className={`text-4xl font-extrabold tracking-tight ${stats.needsAttention > 0 ? "text-indigo-650" : "text-slate-400"}`}>
                    {stats.needsAttention}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Action Required</span>
                </div>
                <p className="text-[9px] mt-2 font-bold leading-relaxed text-slate-450 flex items-center justify-between w-full">
                  <span>{stats.needsAttention > 0 ? "⚠️ Watchtower: urgent deficit or low volume" : "No outstanding supply deficits"}</span>
                  {stats.needsAttention > 0 && <span className="text-indigo-650 font-black">View Catalog ➔</span>}
                </p>
              </button>
            </div>
          </div>

          {/* 3. Inventory Validation & Allocation Report (Report and Allocation Status) */}
          <div className="space-y-3">
            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Inventory Validation Report & Allocation Status</h4>
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-3xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600 bg-emerald-50 rounded-full p-1" />
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800">
                    Live Stock Allocation Integrity Report
                  </h3>
                </div>
                <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 font-bold rounded uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Live Database Guard
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50/50 border border-slate-200/40 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Successfully Validated</span>
                    <span className="text-xl font-black text-emerald-600 mt-1 block font-mono">{validationSummary.successful}</span>
                    <span className="text-[9px] text-slate-400 font-semibold block mt-1">Allocation matches Total Stock</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">✓</div>
                </div>
                
                <div className={`border p-4 rounded-xl flex items-center justify-between transition-colors ${validationSummary.discrepancies > 0 ? "border-red-200 bg-red-50/30" : "bg-slate-50/50 border-slate-200/40"}`}>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Inventory Discrepancies</span>
                    <span className={`text-xl font-black mt-1 block font-mono ${validationSummary.discrepancies > 0 ? "text-red-650 animate-bounce" : "text-slate-500"}`}>{validationSummary.discrepancies}</span>
                    <span className="text-[9px] text-slate-400 font-semibold block mt-1">In Store + Office &ne; Total Stock</span>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${validationSummary.discrepancies > 0 ? "bg-red-100 text-red-600 border border-red-200 animate-pulse" : "bg-slate-100 text-slate-400 border border-slate-200"}`}>
                    {validationSummary.discrepancies > 0 ? "!" : "0"}
                  </div>
                </div>
                
                <div className={`border p-4 rounded-xl flex items-center justify-between transition-colors ${validationSummary.requiringReview > 0 ? "border-amber-250 bg-amber-50/30" : "bg-slate-50/50 border-slate-200/40"}`}>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Requiring Admin Review</span>
                    <span className={`text-xl font-black mt-1 block font-mono ${validationSummary.requiringReview > 0 ? "text-amber-700" : "text-slate-500"}`}>{validationSummary.requiringReview}</span>
                    <span className="text-[9px] text-slate-400 font-semibold block mt-1">Mismatches or missing data</span>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${validationSummary.requiringReview > 0 ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-400 border border-slate-200"}`}>
                    {validationSummary.requiringReview}
                  </div>
                </div>
              </div>
              
              {validationSummary.discrepancies > 0 && (
                <div className="p-4 bg-red-50 border border-red-200/60 rounded-xl flex items-start gap-3 text-red-900 border-l-4 border-l-red-500 animate-shake">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-extrabold text-xs">Inventory Totals Discrepancy Alert</p>
                    <p className="text-[11px] text-red-700 mt-1 leading-relaxed font-semibold">
                      Inventory totals do not match. Please verify the physical inventory allocation before continuing.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide 1: Book Performance & Intelligence Analytics */}
      {currentCarouselIndex === 1 && (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in text-left">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Librarium Luxe Intelligence & Performance Analytics
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-semibold">
                Analyze active stock velocity, total stocked units, historical copies sold, and commercial ranking.
              </p>
            </div>
          </div>

          <div className="pt-2 space-y-4">
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
                      const bookRank = item.bookRank || "Standard";
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
                              bookRank === "Top Seller" 
                                ? "bg-amber-100 text-amber-950 border border-amber-200/60" 
                                : bookRank === "Best Seller"
                                  ? "bg-orange-100 text-orange-950 border border-orange-200/60"
                                  : bookRank === "High Performer"
                                    ? "bg-emerald-50 text-emerald-950 border border-emerald-200/50"
                                    : bookRank === "Slow Moving"
                                      ? "bg-indigo-50 text-indigo-950 border border-indigo-100"
                                      : bookRank === "New Release"
                                        ? "bg-blue-50 text-blue-950 border border-blue-100"
                                        : "bg-slate-100 text-slate-800 border border-slate-200"
                            }`}>
                              {bookRank}
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
        </div>
      )}

      {/* Slide 2 & Slide 3: Catalog Listing and Archives */}
      {(currentCarouselIndex === 2 || currentCarouselIndex === 3) && (
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

            {/* Archive State Badge */}
            <div
              className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                showArchived 
                  ? "bg-rose-50 text-rose-800 border-rose-200/80" 
                  : "bg-indigo-50 text-indigo-800 border-indigo-200/80"
              }`}
            >
              <span>{showArchived ? "📁 Inactive Archive View" : "📂 Active Premium Book Catalog"}</span>
            </div>

            {/* Clear Filters indicator */}
            {(categoryFilter !== "All" || alertFilter !== "all" || searchQuery !== "") && (
              <button 
                onClick={() => {
                  setCategoryFilter("All");
                  setAlertFilter("all");
                  setSearchQuery("");
                }}
                className="text-[10px] font-bold text-rose-700 hover:underline cursor-pointer"
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
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Book ID (Unique)</label>
                <input 
                  type="text" 
                  value={newBookId}
                  onChange={(e) => setNewBookId(e.target.value)}
                  placeholder="e.g., LUX-812 (Optional)"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800"
                />
              </div>
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
                <label className="text-[10px] font-bold text-slate-400 uppercase">In Store Allocation</label>
                <input 
                  type="number" 
                  value={newInStore}
                  onChange={(e) => setNewInStore(Math.max(0, Number(e.target.value)))}
                  min="0"
                  className={`w-full bg-white border rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800 ${
                    newInStore + newOffice !== newQuantity ? "border-red-500 bg-red-50 text-red-900" : "border-slate-200"
                  }`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Office Allocation</label>
                <input 
                  type="number" 
                  value={newOffice}
                  onChange={(e) => setNewOffice(Math.max(0, Number(e.target.value)))}
                  min="0"
                  className={`w-full bg-white border rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800 ${
                    newInStore + newOffice !== newQuantity ? "border-red-500 bg-red-50 text-red-900" : "border-slate-200"
                  }`}
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
                <label className="text-[10px] font-bold text-slate-400 uppercase">Book Rank</label>
                <select 
                  value={newBookRank}
                  onChange={(e) => setNewBookRank(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800 text-slate-800"
                >
                  <option value="Top Seller">Top Seller</option>
                  <option value="Best Seller">Best Seller</option>
                  <option value="High Performer">High Performer</option>
                  <option value="Standard">Standard</option>
                  <option value="Slow Moving">Slow Moving</option>
                  <option value="New Release">New Release</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
                <select 
                  value={newArchived ? "Inactive" : "Active"}
                  onChange={(e) => setNewArchived(e.target.value === "Inactive")}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800 text-slate-800"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Selling Price (JMD)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">J$</span>
                  <input 
                    type="number" 
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(e.target.value)}
                    placeholder="e.g., 4000"
                    min="0"
                    step="100"
                    className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-2.5 py-2 text-xs font-semibold focus:outline-none focus:border-slate-800 text-slate-800"
                  />
                </div>
              </div>
            </div>

            {newInStore + newOffice !== newQuantity && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="font-semibold">
                  Inventory totals do not match. Please verify the physical inventory allocation before continuing.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const half = Math.floor(newQuantity / 2);
                    setNewInStore(half);
                    setNewOffice(newQuantity - half);
                  }}
                  className="ml-auto bg-red-100 hover:bg-red-200 text-red-800 text-[10px] font-bold px-2 py-1 rounded"
                >
                  Auto-Balance
                </button>
              </div>
            )}

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
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Book ID (Unique)</label>
                <input 
                  type="text" 
                  value={editingItem.id}
                  onChange={(e) => setEditingItem({ ...editingItem, id: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800"
                />
              </div>
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
                <label className="text-[10px] font-bold text-slate-400 uppercase">In Store Allocation</label>
                <input 
                  type="number" 
                  value={editingItem.inStore ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, inStore: Math.max(0, Number(e.target.value)) })}
                  min="0"
                  className={`w-full bg-white border rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800 ${
                    (editingItem.inStore ?? 0) + (editingItem.office ?? 0) !== editingItem.quantity ? "border-red-500 bg-red-50 text-red-900" : "border-slate-200"
                  }`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Office Allocation</label>
                <input 
                  type="number" 
                  value={editingItem.office ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, office: Math.max(0, Number(e.target.value)) })}
                  min="0"
                  className={`w-full bg-white border rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800 ${
                    (editingItem.inStore ?? 0) + (editingItem.office ?? 0) !== editingItem.quantity ? "border-red-500 bg-red-50 text-red-900" : "border-slate-200"
                  }`}
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
                <label className="text-[10px] font-bold text-slate-400 uppercase">Book Rank</label>
                <select 
                  value={editingItem.bookRank || "Standard"}
                  onChange={(e) => setEditingItem({ ...editingItem, bookRank: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800 text-slate-800"
                >
                  <option value="Top Seller">Top Seller</option>
                  <option value="Best Seller">Best Seller</option>
                  <option value="High Performer">High Performer</option>
                  <option value="Standard">Standard</option>
                  <option value="Slow Moving">Slow Moving</option>
                  <option value="New Release">New Release</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
                <select 
                  value={editingItem.archived ? "Inactive" : "Active"}
                  onChange={(e) => setEditingItem({ ...editingItem, archived: e.target.value === "Inactive" })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-slate-800 text-slate-800"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Selling Price (JMD)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">J$</span>
                  <input 
                    type="number" 
                    value={editingItem.sellingPrice || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, sellingPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="e.g., 4000"
                    min="0"
                    step="100"
                    className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-2.5 py-2 text-xs font-semibold focus:outline-none focus:border-slate-800 text-slate-800"
                  />
                </div>
              </div>
            </div>

            {(editingItem.inStore ?? 0) + (editingItem.office ?? 0) !== editingItem.quantity && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="font-semibold">
                  Inventory totals do not match. Please verify the physical inventory allocation before continuing.
                </span>
                <div className="ml-auto flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const half = Math.floor(editingItem.quantity / 2);
                      setEditingItem({
                        ...editingItem,
                        inStore: half,
                        office: editingItem.quantity - half
                      });
                    }}
                    className="bg-red-100 hover:bg-red-200 text-red-800 text-[10px] font-bold px-2 py-1 rounded"
                  >
                    Split Total Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem({
                        ...editingItem,
                        quantity: (editingItem.inStore ?? 0) + (editingItem.office ?? 0)
                      });
                    }}
                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[10px] font-bold px-2 py-1 rounded"
                  >
                    Sync Total to Allocations
                  </button>
                </div>
              </div>
            )}

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
              const restockQty = calculateRestockQuantity(item.rankingStatus, item.bookRank, item.quantity);
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
                              <span className="bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded text-[7.5px] font-bold uppercase tracking-wider">
                                Inactive
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
                    {(() => {
                      const inStoreVal = item.inStore ?? 0;
                      const officeVal = item.office ?? 0;
                      const hasDiscrepancy = inStoreVal + officeVal !== item.quantity;

                      return (
                        <div className={`grid grid-cols-5 gap-1 p-2 rounded-xl border transition-colors ${
                          hasDiscrepancy 
                            ? "bg-red-50/50 border-red-200/60 text-red-900" 
                            : "bg-slate-50/50 border-slate-100"
                        }`}>
                          <div className="text-left min-w-0">
                            <span className="text-slate-400 block font-bold uppercase text-[7px] tracking-tight truncate">Book Type</span>
                            <span className="text-slate-900 font-extrabold text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight">
                              {item.category}
                            </span>
                          </div>
                          <div className="text-left min-w-0">
                            <span className="text-slate-400 block font-bold uppercase text-[7px] tracking-tight truncate">In Store</span>
                            <span className={`font-extrabold text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight font-mono ${hasDiscrepancy ? "text-red-700" : "text-slate-950"}`}>
                              {item.inStore ?? 0}
                            </span>
                          </div>
                          <div className="text-left min-w-0">
                            <span className="text-slate-400 block font-bold uppercase text-[7px] tracking-tight truncate">Office</span>
                            <span className={`font-extrabold text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight font-mono ${hasDiscrepancy ? "text-red-700" : "text-slate-950"}`}>
                              {item.office ?? 0}
                            </span>
                          </div>
                          <div className="text-left min-w-0">
                            <span className="text-slate-400 block font-bold uppercase text-[7px] tracking-tight truncate">Selling Price</span>
                            <span className="text-indigo-600 font-extrabold text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight font-mono">
                              {item.sellingPrice !== undefined ? `$${item.sellingPrice.toLocaleString()}` : "—"}
                            </span>
                          </div>
                          <div className="text-left min-w-0 relative">
                            <span className="text-slate-400 block font-bold uppercase text-[7px] tracking-tight truncate flex items-center gap-1">
                              Total Stock
                              {hasDiscrepancy && <AlertCircle className="w-2.5 h-2.5 text-red-650 animate-pulse shrink-0" />}
                            </span>
                            <span className={`font-extrabold text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight font-mono ${hasDiscrepancy ? "text-red-650 font-bold underline decoration-wavy decoration-red-400" : "text-slate-900"}`}>
                              {item.quantity}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
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
                              <span className="text-slate-400 block font-bold uppercase text-[8px] tracking-tight mb-0.5">Book Rank</span>
                              <span className="font-extrabold text-slate-800 block uppercase">
                                {item.bookRank || "Standard"}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-[11px] pt-1 border-t border-slate-100/70">
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

                          {/* Physical Location Allocation Controls */}
                          <div className="border-t border-slate-100 pt-3 mt-1 space-y-2.5">
                            <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest block">Physical Location Allocation:</span>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase block">In Store</label>
                                <input 
                                  type="number"
                                  value={item.inStore ?? 0}
                                  onChange={(e) => handleLocationUpdate(item.id, Number(e.target.value), item.office ?? 0)}
                                  min="0"
                                  className={`w-full bg-slate-50 border rounded-lg p-1.5 text-xs font-mono font-bold focus:outline-none focus:border-slate-800 ${
                                    (item.inStore ?? 0) + (item.office ?? 0) !== item.quantity ? "border-red-500 bg-red-50 text-red-900" : "border-slate-200"
                                  }`}
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase block">Office</label>
                                <input 
                                  type="number"
                                  value={item.office ?? 0}
                                  onChange={(e) => handleLocationUpdate(item.id, item.inStore ?? 0, Number(e.target.value))}
                                  min="0"
                                  className={`w-full bg-slate-50 border rounded-lg p-1.5 text-xs font-mono font-bold focus:outline-none focus:border-slate-800 ${
                                    (item.inStore ?? 0) + (item.office ?? 0) !== item.quantity ? "border-red-500 bg-red-50 text-red-900" : "border-slate-200"
                                  }`}
                                />
                              </div>
                            </div>

                            {(item.inStore ?? 0) + (item.office ?? 0) !== item.quantity && (
                              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-850 flex flex-col gap-1 text-[10px] mt-1">
                                <span className="font-extrabold flex items-center gap-1 text-red-650">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Allocation Mismatch ({(item.inStore ?? 0) + (item.office ?? 0)} total)
                                </span>
                                <div className="flex gap-1.5 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleAutoReconcile(item.id, "balance")}
                                    className="bg-red-100 hover:bg-red-200 text-red-850 font-extrabold px-1.5 py-0.5 rounded text-[9px] transition-colors"
                                  >
                                    Split Total Stock
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAutoReconcile(item.id, "sync_total")}
                                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-850 font-extrabold px-1.5 py-0.5 rounded text-[9px] transition-colors"
                                  >
                                    Sync Total Stock
                                  </button>
                                </div>
                              </div>
                            )}
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
                                  setEditingOriginalId(item.id);
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
                                  Reactivate Book
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleArchiveItem(item.id, item.title); }}
                                  className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 rounded-lg transition-all cursor-pointer"
                                  title="Deactivate Item"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                  Deactivate Book
                                </button>
                              )}
                            </div>
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

      </div>
      )}

    </div>
  );
}
