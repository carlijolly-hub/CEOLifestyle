import React, { useState, useMemo } from "react";
import { FulfillmentInventoryItem, OperationsOrder, FulfillmentTemplate, SystemSettings, LuxeBookInventoryItem } from "../types";
import { getSystemSettings, saveSystemSettings, DEFAULT_FULFILLMENT_INVENTORY, calculateBulkPurchaseQty } from "../utils/settingsHelper";
import { canonicalizeProductName } from "../utils/productMatchingUtils";
import { 
  PackageCheck, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Filter, 
  Printer, 
  Copy, 
  Check, 
  X,
  Sparkles,
  ShoppingBag
} from "lucide-react";

interface FulfillmentInventoryViewProps {
  settings?: SystemSettings;
  onUpdateSettings?: (newSettings: SystemSettings) => void;
  operationsOrders?: OperationsOrder[];
  inventory?: LuxeBookInventoryItem[];
}

export function FulfillmentInventoryView({ settings, onUpdateSettings, operationsOrders = [], inventory = [] }: FulfillmentInventoryViewProps) {
  const currentSettings = settings || getSystemSettings();
  const items: FulfillmentInventoryItem[] = currentSettings.fulfillmentInventory || DEFAULT_FULFILLMENT_INVENTORY;
  const templates: FulfillmentTemplate[] = currentSettings.fulfillmentTemplates || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FulfillmentInventoryItem | null>(null);

  // Form Fields
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("Packaging & Baskets");
  const [availableQty, setAvailableQty] = useState<number | "">(0);
  const [unitLabel, setUnitLabel] = useState("units");
  const [notes, setNotes] = useState("");

  const categories = useMemo(() => {
    const defaultCats = ["All", "Packaging & Baskets", "Floral & Arrangements", "Print & Media", "Confectionery"];
    const itemCats = items.map(item => item.category).filter(Boolean);
    return Array.from(new Set([...defaultCats, ...itemCats]));
  }, [items]);

  // Compute Required Quantities across orders with status = "New"
  // CRITICAL-005: ONLY an order explicitly recognized as NEW may generate active fulfillment demand.
  const newOrders = useMemo(() => {
    return operationsOrders.filter(o => {
      const status = (o.productionStatus ?? (o as any).status ?? "").trim().toLowerCase();
      return status === "new";
    });
  }, [operationsOrders]);

  const activeRequirementsMap = useMemo(() => {
    const reqMap: Record<string, { totalRequired: number; unitLabel: string }> = {};

    newOrders.forEach(order => {
      // Read order snapshot if available
      if (order.fulfillmentSnapshot && order.fulfillmentSnapshot.length > 0) {
        order.fulfillmentSnapshot.forEach(snap => {
          const cNameKey = snap.componentName.trim().toLowerCase();
          if (!reqMap[cNameKey]) {
            reqMap[cNameKey] = { totalRequired: 0, unitLabel: snap.unitLabel || snap.bulkUnitLabel || "" };
          }
          reqMap[cNameKey].totalRequired += Number(snap.quantity) || 0;
        });
        return;
      }

      // Legacy order fallback
      let orderItems: Array<{ productName: string; quantity: number }> = [];

      if (typeof order.items === "string") {
        const rawText = order.items.trim();
        if (rawText) {
          const lines = rawText.split("\n");
          lines.forEach(line => {
            const cleanLine = line.replace(/^[•\-\*\d\.\s]+/, "").trim();
            if (!cleanLine) return;
            const match = cleanLine.match(/(\d+)\s*(?:x|pcs|units|items)?\s*(.+)/i);
            if (match) {
              orderItems.push({ quantity: parseInt(match[1], 10) || 1, productName: match[2].trim() });
            } else {
              orderItems.push({ quantity: order.quantityTotal || 1, productName: cleanLine });
            }
          });
        }
      } else if (Array.isArray(order.items)) {
        orderItems = order.items.map(it => ({ productName: it.productName, quantity: it.quantity || 1 }));
      }

      orderItems.forEach(itemObj => {
        const canon = canonicalizeProductName(itemObj.productName);
        const searchKey = canon.normalizedName.toLowerCase();

        const matchingTemplate = templates.find(t => 
          t.enabled && (
            t.productName.trim().toLowerCase() === searchKey ||
            canonicalizeProductName(t.productName).normalizedName.toLowerCase() === searchKey
          )
        );

        if (matchingTemplate && matchingTemplate.components && matchingTemplate.components.length > 0) {
          matchingTemplate.components.forEach(comp => {
            const cNameKey = comp.componentName.trim().toLowerCase();
            const totalCompQty = comp.quantity * itemObj.quantity;

            if (!reqMap[cNameKey]) {
              reqMap[cNameKey] = { totalRequired: 0, unitLabel: comp.unitLabel || comp.bulkUnitLabel || "" };
            }
            reqMap[cNameKey].totalRequired += totalCompQty;
          });
        } else {
          const directKey = searchKey || itemObj.productName.trim().toLowerCase();
          if (directKey) {
            if (!reqMap[directKey]) {
              reqMap[directKey] = { totalRequired: 0, unitLabel: "units" };
            }
            reqMap[directKey].totalRequired += itemObj.quantity;
          }
        }
      });
    });

    return reqMap;
  }, [newOrders, templates]);

  // Merge On-Hand Stock with Active Order Requirements (REQUIRED - IN STOCK = TO PURCHASE)
  const mergedInventory = useMemo(() => {
    return items.map(item => {
      const cNameKey = item.itemName.trim().toLowerCase();
      
      // Match from requirements map: aggregate requirement entries matching this inventory item
      const itemCanonKey = canonicalizeProductName(item.itemName).canonicalKey;
      const matchingReqKeys = Object.keys(activeRequirementsMap).filter(k => 
        k === cNameKey || (itemCanonKey && canonicalizeProductName(k).canonicalKey === itemCanonKey)
      );

      let totalRequired = 0;
      matchingReqKeys.forEach(k => {
        totalRequired += activeRequirementsMap[k]?.totalRequired || 0;
      });

      const isFlowerItem = cNameKey.includes("flower") || cNameKey.includes("rose") || cNameKey.includes("floral") || cNameKey.includes("bouquet") || item.category === "Floral & Fresh Arrangements";
      const available = isFlowerItem ? 0 : (Number(item.availableQty) || 0);
      const remainingNeeded = Math.max(0, totalRequired - available);

      // Apply bulk purchasing rules to remaining needed (REQUIRED - IN STOCK = TO PURCHASE)
      let calcRes = { hasRule: false, purchaseQty: remainingNeeded, ruleDescription: "Exact Remaining Quantity" };
      if (remainingNeeded > 0) {
        calcRes = calculateBulkPurchaseQty(remainingNeeded, item);
      } else {
        calcRes = { hasRule: false, purchaseQty: 0, ruleDescription: totalRequired > 0 ? "Fully covered by in-stock inventory" : "No active orders require this item" };
      }

      return {
        ...item,
        isFlowerItem,
        totalRequired,
        available: isFlowerItem ? 0 : Number(item.availableQty) || 0,
        remainingNeeded,
        purchaseQty: Math.max(0, calcRes.purchaseQty),
        toPurchase: Math.max(0, calcRes.purchaseQty),
        hasRule: calcRes.hasRule,
        ruleDescription: calcRes.ruleDescription
      };
    });
  }, [items, activeRequirementsMap]);

  const filteredItems = useMemo(() => {
    return mergedInventory.filter(item => {
      const matchesSearch = 
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [mergedInventory, searchTerm, selectedCategory]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setItemName("");
    setCategory("Packaging & Baskets");
    setAvailableQty(0);
    setUnitLabel("units");
    setNotes("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: FulfillmentInventoryItem) => {
    setEditingItem(item);
    setItemName(item.itemName);
    setCategory(item.category || "Packaging & Baskets");
    setAvailableQty(item.availableQty || 0);
    setUnitLabel(item.unitLabel || "units");
    setNotes(item.notes || "");
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const qty = typeof availableQty === "number" ? availableQty : 0;
    let updatedList: FulfillmentInventoryItem[];

    if (editingItem) {
      updatedList = items.map(item =>
        item.id === editingItem.id
          ? {
              ...item,
              itemName: itemName.trim(),
              category: category.trim(),
              availableQty: Math.max(0, qty),
              unitLabel: unitLabel.trim() || "units",
              notes: notes.trim(),
              lastUpdated: new Date().toISOString()
            }
          : item
      );
    } else {
      const newItem: FulfillmentInventoryItem = {
        id: `fi_${Date.now()}`,
        itemName: itemName.trim(),
        availableQty: Math.max(0, qty),
        unitLabel: unitLabel.trim() || "units",
        category: category.trim(),
        notes: notes.trim(),
        lastUpdated: new Date().toISOString()
      };
      updatedList = [...items, newItem];
    }

    const updatedSettings = { ...currentSettings, fulfillmentInventory: updatedList };
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
        const newQty = Math.max(0, (item.availableQty || 0) + delta);
        return { ...item, availableQty: newQty, lastUpdated: new Date().toISOString() };
      }
      return item;
    });

    const updatedSettings = { ...currentSettings, fulfillmentInventory: updatedList };
    if (onUpdateSettings) {
      onUpdateSettings(updatedSettings);
    } else {
      saveSystemSettings(updatedSettings);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this material from fulfillment inventory?")) return;
    const updatedList = items.filter(item => item.id !== itemId);
    const updatedSettings = { ...currentSettings, fulfillmentInventory: updatedList };
    if (onUpdateSettings) {
      onUpdateSettings(updatedSettings);
    } else {
      saveSystemSettings(updatedSettings);
    }
  };

  const handleCopyShoppingList = () => {
    const lines: string[] = [];
    lines.push(`### FULFILLMENT PURCHASE LIST\n`);

    mergedInventory.forEach(item => {
      if (item.toPurchase > 0) {
        lines.push(`* ${item.toPurchase} ${item.unitLabel || "units"} ${item.itemName} (Required: ${item.totalRequired}, Available: ${item.available})`);
      }
    });

    if (lines.length === 1) {
      lines.push(`(All required fulfillment materials are fully covered by available on-hand stock!)`);
    }

    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-500/20 border border-purple-400/30 rounded-xl text-purple-300">
              <PackageCheck className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-300">MATERIALS</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">FULFILLMENT INVENTORY</h2>
          <p className="text-xs text-slate-300">
            Materials and packaging supplies required to complete orders (packaging, boxes, bags, wrapping materials, ribbons). Answers: &ldquo;What materials do we have?&rdquo; In stock available to fulfill work.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyShoppingList}
            className={`px-4 py-2.5 font-extrabold text-xs rounded-2xl transition-all shadow-lg cursor-pointer flex items-center gap-2 shrink-0 ${
              copiedNotice
                ? "bg-emerald-600 text-white"
                : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30"
            }`}
          >
            {copiedNotice ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            <span>{copiedNotice ? "Copied Purchase List!" : "Copy To-Purchase List"}</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs rounded-2xl transition-all shadow-lg cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4 text-purple-700" />
            <span>Add Material</span>
          </button>
        </div>
      </div>

      {/* Workflow Diagram Banner */}
      <div className="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-purple-950 font-bold">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
          <span>Fulfillment Formula: <strong>Active Orders</strong> ➔ <strong>Required</strong> − <strong>Available Stock</strong> = <strong>Remaining Needed</strong> ➔ <strong>To Purchase</strong></span>
        </div>
        <span className="bg-purple-200 text-purple-900 text-[10px] font-extrabold px-2.5 py-1 rounded-xl">
          {newOrders.length} New Orders in Queue
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search fulfillment material or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-600"
            />
          </div>

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
        </div>
      </div>

      {/* Inventory Matrix Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Material Name & Category</th>
                <th className="py-3 px-4 text-center">Required (Orders)</th>
                <th className="py-3 px-4 text-center">Available (On-Hand)</th>
                <th className="py-3 px-4 text-center">Remaining Needed</th>
                <th className="py-3 px-4 text-center">To Purchase</th>
                <th className="py-3 px-4 text-center">Manual Stock Adjust</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No fulfillment materials found matching your search.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 text-xs">{item.itemName}</div>
                      <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        {item.category || "Packaging"}
                      </span>
                      {item.notes && <p className="text-[11px] text-slate-500 italic mt-0.5">{item.notes}</p>}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {item.totalRequired > 0 ? (
                        <span className="text-slate-900 font-black">{item.totalRequired} {item.unitLabel}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-black border ${
                        item.available > 0
                          ? "bg-purple-100 text-purple-900 border-purple-200"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}>
                        {item.available} {item.unitLabel}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-black border ${
                        item.remainingNeeded > 0
                          ? "bg-amber-100 text-amber-950 border-amber-300"
                          : "bg-emerald-100 text-emerald-900 border-emerald-300"
                      }`}>
                        {item.remainingNeeded} {item.unitLabel}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {item.toPurchase > 0 ? (
                        <span className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white font-black text-xs shadow-2xs inline-block">
                          {item.toPurchase} {item.bulkUnitLabel || item.unitLabel}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-extrabold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Fully Covered
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                        <button
                          onClick={() => handleQuantityAdjust(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                        >
                          -
                        </button>
                        <span className="px-1.5 font-black text-xs text-slate-800 min-w-[24px] text-center">{item.available}</span>
                        <button
                          onClick={() => handleQuantityAdjust(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 hover:bg-purple-50 text-slate-500 hover:text-purple-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Material Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 text-left relative animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <PackageCheck className="w-5 h-5" />
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingItem ? "Edit Fulfillment Material" : "Add Fulfillment Material"}
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
                <label className="block text-slate-500 text-[10px] uppercase font-extrabold mb-1">Material Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Blue Ribbon, Ferrero Chocolates, Cellophane"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-extrabold mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Packaging & Baskets, Floral & Arrangements"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-extrabold mb-1">On-Hand Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={availableQty}
                    onChange={(e) => setAvailableQty(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] uppercase font-extrabold mb-1">Unit Label</label>
                  <input
                    type="text"
                    placeholder="e.g. yards, pcs, sheets"
                    value={unitLabel}
                    onChange={(e) => setUnitLabel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] uppercase font-extrabold mb-1">Notes / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Satin roll, clear wrap"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                />
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
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingItem ? "Save Material" : "Add Material"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
