import React, { useState, useMemo } from "react";
import { RegularInventoryItem, SystemSettings, InventoryUsagePriority } from "../types";
import { getSystemSettings, saveSystemSettings, DEFAULT_REGULAR_INVENTORY } from "../utils/settingsHelper";
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  RefreshCw,
  Tag,
  DollarSign,
  Info,
  X,
  Check,
  Zap,
  Lock
} from "lucide-react";

interface RegularInventoryProps {
  settings?: SystemSettings;
  onUpdateSettings?: (newSettings: SystemSettings) => void;
}

export function RegularInventory({ settings, onUpdateSettings }: RegularInventoryProps) {
  const currentSettings = settings || getSystemSettings();
  const items: RegularInventoryItem[] = currentSettings.regularInventory || DEFAULT_REGULAR_INVENTORY;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState<"All" | "In Stock" | "Low Stock" | "Out of Stock">("All");
  const [priorityFilter, setPriorityFilter] = useState<"All" | InventoryUsagePriority>("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RegularInventoryItem | null>(null);

  // Form Fields
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("T-Shirts & Apparel");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState<number | "">(10);
  const [unitLabel, setUnitLabel] = useState("pcs");
  const [lowStockThreshold, setLowStockThreshold] = useState<number | "">(5);
  const [sellingPrice, setSellingPrice] = useState<number | "">(0);
  const [unitCost, setUnitCost] = useState<number | "">(0);
  const [location, setLocation] = useState("Main Store");
  const [notes, setNotes] = useState("");
  const [usagePriority, setUsagePriority] = useState<InventoryUsagePriority>("NORMAL");

  const categories = useMemo(() => {
    const defaultCats = ["All", "T-Shirts & Apparel", "Finished Gifts", "Finished Merchandise", "Custom Crafts"];
    const itemCats = items.map(item => item.category).filter(Boolean);
    return Array.from(new Set([...defaultCats, ...itemCats]));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;

      const qty = item.quantity || 0;
      const threshold = item.lowStockThreshold || 5;
      let status: "In Stock" | "Low Stock" | "Out of Stock" = "In Stock";
      if (qty <= 0) status = "Out of Stock";
      else if (qty <= threshold) status = "Low Stock";

      const matchesStock = stockFilter === "All" || status === stockFilter;

      const itemPriority: InventoryUsagePriority = item.usagePriority || "NORMAL";
      const matchesPriority = priorityFilter === "All" || itemPriority === priorityFilter;

      return matchesSearch && matchesCategory && matchesStock && matchesPriority;
    });
  }, [items, searchTerm, selectedCategory, stockFilter, priorityFilter]);

  // Inventory Summary Stats
  const stats = useMemo(() => {
    let totalItems = items.length;
    let totalQty = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let useFirstCount = 0;
    let clearanceCount = 0;

    items.forEach(item => {
      const qty = item.quantity || 0;
      totalQty += qty;
      const threshold = item.lowStockThreshold || 5;
      if (qty <= 0) outOfStockCount++;
      else if (qty <= threshold) lowStockCount++;

      if (item.usagePriority === "USE FIRST") useFirstCount++;
      if (item.usagePriority === "CLEARANCE") clearanceCount++;
    });

    return { totalItems, totalQty, lowStockCount, outOfStockCount, useFirstCount, clearanceCount };
  }, [items]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setProductName("");
    setCategory("T-Shirts & Apparel");
    setSku("");
    setQuantity(10);
    setUnitLabel("pcs");
    setLowStockThreshold(5);
    setSellingPrice(0);
    setUnitCost(0);
    setLocation("Main Store");
    setNotes("");
    setUsagePriority("NORMAL");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: RegularInventoryItem) => {
    setEditingItem(item);
    setProductName(item.productName);
    setCategory(item.category || "T-Shirts & Apparel");
    setSku(item.sku || "");
    setQuantity(item.quantity);
    setUnitLabel(item.unitLabel || "pcs");
    setLowStockThreshold(item.lowStockThreshold || 5);
    setSellingPrice(item.sellingPrice || 0);
    setUnitCost(item.unitCost || 0);
    setLocation(item.location || "Main Store");
    setNotes(item.notes || "");
    setUsagePriority(item.usagePriority || "NORMAL");
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;

    const qty = typeof quantity === "number" ? quantity : 0;
    const thresh = typeof lowStockThreshold === "number" ? lowStockThreshold : 5;
    const price = typeof sellingPrice === "number" ? sellingPrice : 0;
    const cost = typeof unitCost === "number" ? unitCost : 0;

    let updatedList: RegularInventoryItem[];

    if (editingItem) {
      updatedList = items.map(item =>
        item.id === editingItem.id
          ? {
              ...item,
              productName: productName.trim(),
              category: category.trim(),
              sku: sku.trim(),
              quantity: Math.max(0, qty),
              unitLabel: unitLabel.trim() || "pcs",
              lowStockThreshold: thresh,
              sellingPrice: price,
              unitCost: cost,
              location: location.trim(),
              notes: notes.trim(),
              usagePriority,
              lastUpdated: new Date().toISOString()
            }
          : item
      );
    } else {
      const newItem: RegularInventoryItem = {
        id: `reg_${Date.now()}`,
        productName: productName.trim(),
        category: category.trim(),
        sku: sku.trim() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        quantity: Math.max(0, qty),
        unitLabel: unitLabel.trim() || "pcs",
        lowStockThreshold: thresh,
        sellingPrice: price,
        unitCost: cost,
        location: location.trim(),
        notes: notes.trim(),
        usagePriority,
        dateAdded: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      updatedList = [newItem, ...items];
    }

    const updatedSettings = { ...currentSettings, regularInventory: updatedList };
    if (onUpdateSettings) {
      onUpdateSettings(updatedSettings);
    } else {
      saveSystemSettings(updatedSettings);
    }

    setIsModalOpen(false);
  };

  const handleQuantityAdjust = (itemId: string, delta: number) => {
    const updatedList = items.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(0, (item.quantity || 0) + delta);
        return { ...item, quantity: newQty, lastUpdated: new Date().toISOString() };
      }
      return item;
    });

    const updatedSettings = { ...currentSettings, regularInventory: updatedList };
    if (onUpdateSettings) {
      onUpdateSettings(updatedSettings);
    } else {
      saveSystemSettings(updatedSettings);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this finished product from regular inventory?")) return;
    const updatedList = items.filter(item => item.id !== itemId);
    const updatedSettings = { ...currentSettings, regularInventory: updatedList };
    if (onUpdateSettings) {
      onUpdateSettings(updatedSettings);
    } else {
      saveSystemSettings(updatedSettings);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
              <Package className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">FINISHED GOODS</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">REGULAR INVENTORY</h2>
          <p className="text-xs text-slate-300">
            Finished physical products that are ready to sell, use, or fulfill (T-shirts, apparel, finished gift products, and merchandise). Answers: &ldquo;What finished goods do we have?&rdquo;
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/30 cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Finished Product</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Product Lines</span>
          <div className="text-xl font-black text-slate-900">{stats.totalItems}</div>
        </div>
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Units On Hand</span>
          <div className="text-xl font-black text-indigo-900">{stats.totalQty}</div>
        </div>
        <div className="bg-amber-50/80 border border-amber-200/80 p-4 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">Low Stock Warnings</span>
          <div className="text-xl font-black text-amber-900 flex items-center gap-1.5">
            <span>{stats.lowStockCount}</span>
            {stats.lowStockCount > 0 && <AlertTriangle className="w-4 h-4 text-amber-600" />}
          </div>
        </div>
        <div className="bg-rose-50/80 border border-rose-200/80 p-4 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider">Out of Stock</span>
          <div className="text-xl font-black text-rose-900 flex items-center gap-1.5">
            <span>{stats.outOfStockCount}</span>
            {stats.outOfStockCount > 0 && <XCircle className="w-4 h-4 text-rose-600" />}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product name, SKU, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent focus:outline-none text-xs font-bold cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as "All" | InventoryUsagePriority)}
              className="bg-transparent focus:outline-none text-xs font-bold cursor-pointer"
            >
              <option value="All">All Usage Flags</option>
              <option value="USE FIRST">⚡ USE FIRST</option>
              <option value="CLEARANCE">🏷️ CLEARANCE</option>
              <option value="NORMAL">NORMAL</option>
              <option value="RESERVED">🔒 RESERVED</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-extrabold">
            {(["All", "In Stock", "Low Stock", "Out of Stock"] as const).map(st => (
              <button
                key={st}
                onClick={() => setStockFilter(st)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  stockFilter === st
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Product Name & Category</th>
                <th className="py-3 px-4">Usage Flag</th>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4 text-center">On-Hand Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Price / Cost</th>
                <th className="py-3 px-4 text-center">Manual Adjust</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No regular inventory items found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const qty = item.quantity || 0;
                  const thresh = item.lowStockThreshold || 5;
                  let statusLabel = "In Stock";
                  let statusBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
                  if (qty <= 0) {
                    statusLabel = "Out of Stock";
                    statusBg = "bg-rose-50 text-rose-800 border-rose-200";
                  } else if (qty <= thresh) {
                    statusLabel = "Low Stock";
                    statusBg = "bg-amber-50 text-amber-800 border-amber-200";
                  }

                  const priority = item.usagePriority || "NORMAL";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-xs">{item.productName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {item.category}
                          </span>
                          {item.location && (
                            <span className="text-[10px] text-slate-400 italic">
                              • {item.location}
                            </span>
                          )}
                        </div>
                        {item.notes && <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">{item.notes}</p>}
                      </td>

                      <td className="py-3.5 px-4">
                        {priority === "USE FIRST" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-extrabold bg-amber-100 text-amber-900 border-amber-300">
                            <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                            <span>USE FIRST</span>
                          </span>
                        )}
                        {priority === "CLEARANCE" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-extrabold bg-rose-100 text-rose-900 border-rose-300">
                            <Tag className="w-3 h-3 text-rose-600" />
                            <span>CLEARANCE</span>
                          </span>
                        )}
                        {priority === "RESERVED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-extrabold bg-slate-200 text-slate-800 border-slate-400">
                            <Lock className="w-3 h-3 text-slate-600" />
                            <span>RESERVED</span>
                          </span>
                        )}
                        {priority === "NORMAL" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg border text-[10px] font-bold bg-slate-50 text-slate-600 border-slate-200">
                            <span>NORMAL</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                        {item.sku || "—"}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-black text-sm text-slate-900">{qty}</span>
                        <span className="text-[10px] text-slate-500 font-bold ml-1">{item.unitLabel || "pcs"}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-extrabold ${statusBg}`}>
                          {qty <= 0 ? <XCircle className="w-3 h-3 text-rose-600" /> : qty <= thresh ? <AlertTriangle className="w-3 h-3 text-amber-600" /> : <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          <span>{statusLabel}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {item.sellingPrice ? (
                          <div className="font-extrabold text-slate-900">${item.sellingPrice.toLocaleString()}</div>
                        ) : (
                          <div className="text-slate-400">—</div>
                        )}
                        {item.unitCost ? (
                          <div className="text-[10px] text-slate-400">Cost: ${item.unitCost.toLocaleString()}</div>
                        ) : null}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                          <button
                            onClick={() => handleQuantityAdjust(item.id, -1)}
                            className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title="Decrease quantity by 1"
                          >
                            -
                          </button>
                          <span className="px-1.5 font-black text-xs text-slate-800 min-w-[24px] text-center">{qty}</span>
                          <button
                            onClick={() => handleQuantityAdjust(item.id, 1)}
                            className="w-6 h-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title="Increase quantity by 1"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 text-left relative animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Package className="w-5 h-5" />
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingItem ? "Edit Finished Product" : "Add New Finished Product"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-extrabold mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CEO Branded Cotton T-Shirt (Black - M)"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-extrabold mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. T-Shirts & Apparel"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-extrabold mb-1">SKU / Item Code</label>
                  <input
                    type="text"
                    placeholder="e.g. TSH-BLK-M"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-extrabold mb-1">Current Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-extrabold mb-1">Unit Label</label>
                  <input
                    type="text"
                    placeholder="e.g. pcs, sets"
                    value={unitLabel}
                    onChange={(e) => setUnitLabel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-extrabold mb-1">Low Stock Limit</label>
                  <input
                    type="number"
                    min="0"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-extrabold mb-1">Selling Price (JMD)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 3500"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-extrabold mb-1">Unit Cost (JMD)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1500"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-extrabold mb-1">Storage Location / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Shelf B2, Premium Cotton, Gift Packaging"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-extrabold mb-1">Inventory Usage Priority Flag</label>
                <select
                  value={usagePriority}
                  onChange={(e) => setUsagePriority(e.target.value as InventoryUsagePriority)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="NORMAL">NORMAL — Ordinary available inventory</option>
                  <option value="USE FIRST">⚡ USE FIRST — Prioritize mentioning this stock when an order matches</option>
                  <option value="CLEARANCE">🏷️ CLEARANCE — Stock you specifically want to move or sell</option>
                  <option value="RESERVED">🔒 RESERVED — Do not suggest for general customer orders</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1 font-normal">
                  Items marked "USE FIRST" or "CLEARANCE" will trigger a match alert when creating matching orders.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingItem ? "Save Changes" : "Add Product"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
