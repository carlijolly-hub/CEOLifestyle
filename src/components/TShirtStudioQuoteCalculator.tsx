import React, { useState, useEffect } from "react";
import { 
  Calculator, 
  RefreshCw, 
  Shirt, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Truck, 
  MapPin, 
  Clock, 
  Bookmark, 
  FileText 
} from "lucide-react";
import { SystemSettings, DeliveryMethod, SavedQuotation } from "../types";
import { DEFAULT_DELIVERY_METHODS, DEFAULT_QUOTE_TEMPLATES, formatQuoteTemplate } from "../utils/settingsHelper";
import { normalizeQuotation } from "../utils/quotationUtils";
import { loadEnvironmentQuotations, saveEnvironmentQuotations } from "../utils/environmentUtils";

interface AdditionalCharge {
  id: string;
  name: string;
  amount: string;
}

interface TShirtStudioQuoteCalculatorProps {
  settings?: SystemSettings;
}

export default function TShirtStudioQuoteCalculator({ settings }: TShirtStudioQuoteCalculatorProps) {
  // Garment Types definition
  const garmentTypes = [
    "T-Shirts",
    "Polo Shirts",
    "Oxford Shirts (Short Sleeve)",
    "Oxford Shirts (Long Sleeve)",
    "Sweatshirts",
    "Pullovers"
  ];

  // Active delivery methods from Centralized System Settings
  const activeDeliveryMethods = (settings?.deliveryMethods && settings.deliveryMethods.length > 0)
    ? settings.deliveryMethods.filter(m => m.active !== false)
    : DEFAULT_DELIVERY_METHODS.filter(m => m.active !== false);

  // Initialize state with localStorage persistence
  const [garmentType, setGarmentType] = useState(() => {
    return localStorage.getItem("calc_tshirt_garment_type") || "T-Shirts";
  });

  const [adultQty, setAdultQty] = useState(() => {
    return localStorage.getItem("calc_tshirt_adult_qty") || "2";
  });
  const [adultPlusQty, setAdultPlusQty] = useState(() => {
    return localStorage.getItem("calc_tshirt_adult_plus_qty") || "0";
  });
  const [childQty, setChildQty] = useState(() => {
    return localStorage.getItem("calc_tshirt_child_qty") || "1";
  });

  const [adultPrice, setAdultPrice] = useState(() => {
    return localStorage.getItem("calc_tshirt_adult_price") || "3000";
  });
  const [adultPlusPrice, setAdultPlusPrice] = useState(() => {
    return localStorage.getItem("calc_tshirt_adult_plus_price") || "3500";
  });
  const [childPrice, setChildPrice] = useState(() => {
    return localStorage.getItem("calc_tshirt_child_price") || "2850";
  });
  const [discountPercent, setDiscountPercent] = useState(() => {
    return localStorage.getItem("calc_tshirt_discount") || "10";
  });

  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>(() => {
    const stored = localStorage.getItem("calc_tshirt_additional_charges");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // Fallback below
      }
    }
    return [
      { id: "1", name: "Design Fee", amount: "1000" }
    ];
  });

  // Centralized Delivery & Collection Method Selection
  const [deliveryMethodId, setDeliveryMethodId] = useState<string>(() => {
    const saved = localStorage.getItem("calc_tshirt_delivery_method_id");
    if (saved && activeDeliveryMethods.some(m => m.id === saved)) {
      return saved;
    }
    return activeDeliveryMethods.find(m => m.id === "del_knutsford")?.id || activeDeliveryMethods[0]?.id || "del_knutsford";
  });

  const selectedDeliveryMethod = activeDeliveryMethods.find(m => m.id === deliveryMethodId) || activeDeliveryMethods[0];
  const isPickup = selectedDeliveryMethod?.type === "collection";

  const [deliveryCharge, setDeliveryCharge] = useState<string>(() => {
    const saved = localStorage.getItem("calc_tshirt_delivery_charge");
    if (saved !== null) return saved;
    return selectedDeliveryMethod ? selectedDeliveryMethod.defaultCost.toString() : "950";
  });

  // Copy success & saved quotation notification states
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync delivery charge when delivery method changes
  const handleDeliveryMethodChange = (newMethodId: string) => {
    setDeliveryMethodId(newMethodId);
    const method = activeDeliveryMethods.find(m => m.id === newMethodId);
    if (method) {
      if (method.type === "collection") {
        setDeliveryCharge("0");
      } else {
        setDeliveryCharge(method.defaultCost.toString());
      }
    }
  };

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem("calc_tshirt_garment_type", garmentType);
    localStorage.setItem("calc_tshirt_adult_qty", adultQty);
    localStorage.setItem("calc_tshirt_adult_plus_qty", adultPlusQty);
    localStorage.setItem("calc_tshirt_child_qty", childQty);
    localStorage.setItem("calc_tshirt_adult_price", adultPrice);
    localStorage.setItem("calc_tshirt_adult_plus_price", adultPlusPrice);
    localStorage.setItem("calc_tshirt_child_price", childPrice);
    localStorage.setItem("calc_tshirt_discount", discountPercent);
    localStorage.setItem("calc_tshirt_additional_charges", JSON.stringify(additionalCharges));
    localStorage.setItem("calc_tshirt_delivery_method_id", deliveryMethodId);
    localStorage.setItem("calc_tshirt_delivery_charge", deliveryCharge);
  }, [garmentType, adultQty, adultPlusQty, childQty, adultPrice, adultPlusPrice, childPrice, discountPercent, additionalCharges, deliveryMethodId, deliveryCharge]);

  // Calculations
  const parsedAdultQty = Math.max(0, parseInt(adultQty, 10) || 0);
  const parsedAdultPlusQty = Math.max(0, parseInt(adultPlusQty, 10) || 0);
  const parsedChildQty = Math.max(0, parseInt(childQty, 10) || 0);

  const parsedAdultPrice = Math.max(0, parseFloat(adultPrice) || 0);
  const parsedAdultPlusPrice = Math.max(0, parseFloat(adultPlusPrice) || 0);
  const parsedChildPrice = Math.max(0, parseFloat(childPrice) || 0);
  const parsedDiscount = Math.min(100, Math.max(0, parseFloat(discountPercent) || 0));

  const adultSubtotal = parsedAdultQty * parsedAdultPrice;
  const adultPlusSubtotal = parsedAdultPlusQty * parsedAdultPlusPrice;
  const childSubtotal = parsedChildQty * parsedChildPrice;
  const garmentsSubtotal = adultSubtotal + adultPlusSubtotal + childSubtotal;

  const totalAdditionalCharges = additionalCharges.reduce((sum, item) => {
    const amt = parseFloat(item.amount) || 0;
    return sum + amt;
  }, 0);

  const parsedDeliveryCharge = isPickup 
    ? 0 
    : (() => {
        if (!deliveryCharge) return 0;
        if (deliveryCharge.trim().toLowerCase() === "free") return 0;
        const cleaned = deliveryCharge.replace(/[^0-9.]/g, "");
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      })();

  const subtotalBeforeDiscount = garmentsSubtotal + totalAdditionalCharges + parsedDeliveryCharge;
  const discountAmount = subtotalBeforeDiscount * (parsedDiscount / 100);
  const grandTotal = Math.max(0, subtotalBeforeDiscount - discountAmount);

  // Format currency helper for UI
  const formatJMD = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "JMD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Helper for JMD formatting in quote text (e.g. "JMD 3,000")
  const formatJMDVal = (val: number) => {
    return "JMD " + Math.round(val).toLocaleString("en-US");
  };

  // Add / Remove additional charge actions
  const handleAddCharge = () => {
    const newCharge: AdditionalCharge = {
      id: Date.now().toString(),
      name: "",
      amount: "0"
    };
    setAdditionalCharges([...additionalCharges, newCharge]);
  };

  const handleRemoveCharge = (id: string) => {
    setAdditionalCharges(additionalCharges.filter(item => item.id !== id));
  };

  const handleChargeChange = (id: string, field: "name" | "amount", value: string) => {
    setAdditionalCharges(additionalCharges.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleReset = () => {
    setGarmentType("T-Shirts");
    setAdultQty("2");
    setAdultPlusQty("0");
    setChildQty("1");
    setAdultPrice("3000");
    setAdultPlusPrice("3500");
    setChildPrice("2850");
    setDiscountPercent("10");
    setAdditionalCharges([
      { id: "1", name: "Design Fee", amount: "1000" }
    ]);
    const defaultMethod = activeDeliveryMethods.find(m => m.id === "del_knutsford") || activeDeliveryMethods[0];
    if (defaultMethod) {
      setDeliveryMethodId(defaultMethod.id);
      setDeliveryCharge(defaultMethod.type === "collection" ? "0" : defaultMethod.defaultCost.toString());
    }
    setCopied(false);
    setSavedSuccess(false);
  };

  // Standardized Customer Quote Generator
  const getGeneratedQuoteText = () => {
    const apparelTemplate = settings?.quoteTemplates?.find(t => t.active && (t.toolKey === "apparel" || t.id === "tpl_apparel_quote" || t.id === "tpl_apparel_studio"))
      || DEFAULT_QUOTE_TEMPLATES.find(t => t.id === "tpl_apparel_quote");

    const customerRespTpl = settings?.quoteTemplates?.find(t => t.active && (t.id === "tpl_customer_response" || t.name === "Customer Response"))
      || DEFAULT_QUOTE_TEMPLATES.find(t => t.id === "tpl_customer_response");
    const customerResponseStr = customerRespTpl?.content.trim() || "Thank you so much for providing those details.\n\nHere is your personalized quotation based on your request.";

    // Itemized Garment List (Zero Quantity / Zero Cost Rule: omit if Qty <= 0 or Price <= 0)
    const itemLines: string[] = [];
    if (parsedAdultQty > 0 && parsedAdultPrice > 0) {
      itemLines.push(`* ${parsedAdultQty} Adult ${garmentType} @ ${formatJMDVal(parsedAdultPrice)} each = ${formatJMDVal(adultSubtotal)}`);
    }
    if (parsedAdultPlusQty > 0 && parsedAdultPlusPrice > 0) {
      itemLines.push(`* ${parsedAdultPlusQty} Adult +Size ${garmentType} @ ${formatJMDVal(parsedAdultPlusPrice)} each = ${formatJMDVal(adultPlusSubtotal)}`);
    }
    if (parsedChildQty > 0 && parsedChildPrice > 0) {
      itemLines.push(`* ${parsedChildQty} Child ${garmentType} @ ${formatJMDVal(parsedChildPrice)} each = ${formatJMDVal(childSubtotal)}`);
    }
    const garmentItemsStr = itemLines.join("\n");

    // Additional Charges Section (Zero Cost Rule: omit if amount <= 0)
    const addChargeLines: string[] = [];
    additionalCharges.forEach((item) => {
      const amt = parseFloat(item.amount) || 0;
      if (item.name && amt > 0) {
        addChargeLines.push(`* ${item.name} – ${formatJMDVal(amt)}`);
      }
    });

    if (!isPickup && parsedDeliveryCharge > 0) {
      addChargeLines.push(`* Delivery Fee (${selectedDeliveryMethod?.name || 'Delivery'}) – ${formatJMDVal(parsedDeliveryCharge)}`);
    }

    const addChargesStr = addChargeLines.join("\n");

    // Delivery Message (Delivery Exception Rule: always display if delivery method selected)
    const selectedMethodName = selectedDeliveryMethod?.name || (isPickup ? "Pickup" : "Delivery");
    const rawDeliveryMsg = (selectedDeliveryMethod?.messageTemplate || (isPickup ? "Your order will be available for pickup once completed. We will contact you to arrange pickup details." : "")).trim();

    const hasDiscount = parsedDiscount > 0 && discountAmount > 0;

    if (apparelTemplate) {
      return formatQuoteTemplate(apparelTemplate.content, {
        CustomerResponse: customerResponseStr,
        GarmentType: garmentType,
        GarmentItems: garmentItemsStr,
        AdditionalCharges: addChargesStr,
        Subtotal: formatJMDVal(subtotalBeforeDiscount),
        DiscountPercent: hasDiscount ? parsedDiscount : 0,
        DiscountAmount: hasDiscount ? formatJMDVal(discountAmount) : "",
        GrandTotal: formatJMDVal(grandTotal),
        DeliveryMethod: selectedMethodName,
        DeliveryCharge: parsedDeliveryCharge > 0 ? formatJMDVal(parsedDeliveryCharge) : "",
        DeliveryMessage: rawDeliveryMsg,
        DepositAmount: formatJMDVal(grandTotal * 0.5),
        BusinessName: settings?.companyName || "CEO Lifestyle"
      });
    }

    const sections: string[] = [];
    sections.push("Thank you so much for providing those details. Here is your personalized quote based on your request:");

    if (garmentItemsStr) {
      sections.push(garmentItemsStr);
    }

    if (addChargesStr) {
      sections.push(`Additional Charges\n${addChargesStr}`);
    }

    if (hasDiscount) {
      sections.push(`Discount\n* You save ${parsedDiscount}% = ${formatJMDVal(discountAmount)}`);
    }

    sections.push(`Total: ${formatJMDVal(grandTotal)}\n(Includes garments with printing unless otherwise stated.)`);

    if (rawDeliveryMsg) {
      sections.push(`Delivery Method: ${selectedMethodName}\n${rawDeliveryMsg}`);
    }

    sections.push("Let me know if you would like to proceed.");

    return sections.join("\n\n");
  };

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(getGeneratedQuoteText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveQuotation = () => {
    const totalQty = parsedAdultQty + parsedAdultPlusQty + parsedChildQty;
    const newQuote: SavedQuotation = normalizeQuotation({
      id: "quote_" + Date.now(),
      quoteNumber: `TS-QT-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: "T-Shirt Studio Quote",
      toolType: "apparel",
      title: `${totalQty} Custom ${garmentType}`,
      date: new Date().toISOString().split("T")[0],
      totalCost: grandTotal * 0.6,
      quotedPrice: grandTotal,
      details: `Garment: ${garmentType}. Total Qty: ${totalQty}. Delivery: ${selectedDeliveryMethod?.name || 'Delivery'}. Total: $${grandTotal.toLocaleString()} JMD.`,
      summaryText: `${totalQty} ${garmentType} via ${selectedDeliveryMethod?.name || 'Delivery'}`,
      itemDetails: [
        { name: `Adult ${garmentType}`, quantity: parsedAdultQty, unitPriceJMD: parsedAdultPrice, subtotalJMD: adultSubtotal },
        { name: `Adult +Size ${garmentType}`, quantity: parsedAdultPlusQty, unitPriceJMD: parsedAdultPlusPrice, subtotalJMD: adultPlusSubtotal },
        { name: `Child ${garmentType}`, quantity: parsedChildQty, unitPriceJMD: parsedChildPrice, subtotalJMD: childSubtotal }
      ],
      subtotalJMD: subtotalBeforeDiscount,
      discountPercent: parsedDiscount,
      discountAmountJMD: discountAmount,
      totalJMD: grandTotal,
      formattedResponseText: getGeneratedQuoteText(),
      createdAt: new Date().toISOString(),
      createdBy: "Master Administrator",
      status: "Active"
    });

    const existing = loadEnvironmentQuotations();
    const updated = [newQuote, ...existing];
    saveEnvironmentQuotations(updated);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-5 text-left animate-fade-in" id="tshirt-studio-quote-calculator-widget">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3 border-slate-100">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <Shirt className="w-4 h-4 text-indigo-600 animate-pulse" />
          T-Shirt Studio Quote Calculator
        </span>
        <button
          onClick={handleReset}
          className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
          title="Reset to defaults"
        >
          <RefreshCw className="w-2.5 h-2.5" />
          Reset
        </button>
      </div>

      {/* Inputs Form */}
      <div className="space-y-4">
        {/* Garment Type Dropdown */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Garment Type
          </label>
          <select
            value={garmentType}
            onChange={(e) => setGarmentType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
          >
            {garmentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Quantities & Prices Section */}
        <div className="space-y-3">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-1">
            Garment Categories (Quantities & Unit Prices)
          </span>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 text-[8px] font-bold text-slate-400 uppercase tracking-wider px-1">
            <div className="col-span-5">Category</div>
            <div className="col-span-3 text-center">Quantity</div>
            <div className="col-span-4 text-right">Unit Price (JMD)</div>
          </div>

          {/* Adult Row */}
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-5 text-xs font-semibold text-slate-700">Adult</div>
            <div className="col-span-3">
              <input
                type="number"
                min="0"
                step="1"
                value={adultQty}
                onChange={(e) => setAdultQty(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="0"
                className="w-full text-center bg-slate-50 border border-slate-200/60 rounded-xl py-1.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
              />
            </div>
            <div className="col-span-4 relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">J$</span>
              <input
                type="number"
                min="0"
                step="1"
                value={adultPrice}
                onChange={(e) => setAdultPrice(e.target.value)}
                placeholder="0"
                className="w-full text-right bg-slate-50 border border-slate-200/60 rounded-xl py-1.5 pl-6 pr-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Adult +Size Row */}
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-5 text-xs font-semibold text-slate-700">Adult +Size</div>
            <div className="col-span-3">
              <input
                type="number"
                min="0"
                step="1"
                value={adultPlusQty}
                onChange={(e) => setAdultPlusQty(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="0"
                className="w-full text-center bg-slate-50 border border-slate-200/60 rounded-xl py-1.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
              />
            </div>
            <div className="col-span-4 relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">J$</span>
              <input
                type="number"
                min="0"
                step="1"
                value={adultPlusPrice}
                onChange={(e) => setAdultPlusPrice(e.target.value)}
                placeholder="0"
                className="w-full text-right bg-slate-50 border border-slate-200/60 rounded-xl py-1.5 pl-6 pr-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Children Row */}
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-5 text-xs font-semibold text-slate-700">Children</div>
            <div className="col-span-3">
              <input
                type="number"
                min="0"
                step="1"
                value={childQty}
                onChange={(e) => setChildQty(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="0"
                className="w-full text-center bg-slate-50 border border-slate-200/60 rounded-xl py-1.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
              />
            </div>
            <div className="col-span-4 relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">J$</span>
              <input
                type="number"
                min="0"
                step="1"
                value={childPrice}
                onChange={(e) => setChildPrice(e.target.value)}
                placeholder="0"
                className="w-full text-right bg-slate-50 border border-slate-200/60 rounded-xl py-1.5 pl-6 pr-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
              />
            </div>
          </div>
        </div>

        {/* Dedicated Additional Charges Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
              Additional Charges
            </span>
            <button
              type="button"
              onClick={handleAddCharge}
              className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Add Charge
            </button>
          </div>

          {additionalCharges.length === 0 ? (
            <p className="text-[10px] text-slate-400 italic py-1">No additional charges added. Use the button to append fees.</p>
          ) : (
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {additionalCharges.map((item) => (
                <div key={item.id} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleChargeChange(item.id, "name", e.target.value)}
                    placeholder="Charge Name (e.g. Design Fee)"
                    className="flex-1 bg-slate-50 border border-slate-200/60 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">J$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.amount}
                      onChange={(e) => handleChargeChange(item.id, "amount", e.target.value)}
                      placeholder="0"
                      className="w-full text-right bg-slate-50 border border-slate-200/60 rounded-xl py-1.5 pl-6 pr-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCharge(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove charge item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Centralized Delivery & Collection Section */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-indigo-600" />
              Delivery & Collection Logistics
            </span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
              System Managed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Delivery Method Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Delivery Method
              </label>
              <select
                value={deliveryMethodId}
                onChange={(e) => handleDeliveryMethodChange(e.target.value)}
                className="w-full bg-indigo-50/50 border border-indigo-200/80 rounded-xl px-2.5 py-2 text-xs font-bold text-indigo-950 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all cursor-pointer"
              >
                {activeDeliveryMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Delivery Charge (JMD) - Hidden when Pickup / Collection is selected */}
            {!isPickup ? (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Delivery Charge
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    J$
                  </span>
                  <input
                    type="text"
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(e.target.value)}
                    placeholder="Free or e.g. 2,450"
                    className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-none transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-emerald-800 text-[11px] font-bold gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pickup / Office Collection selected (No Delivery Charge added).</span>
              </div>
            )}
          </div>

          {/* Delivery Method Info Badge */}
          {selectedDeliveryMethod && (
            <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-3 text-[11px] text-indigo-900 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-bold">{selectedDeliveryMethod.name}</span>
                {selectedDeliveryMethod.estimatedTime && (
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {selectedDeliveryMethod.estimatedTime}
                  </span>
                )}
                {selectedDeliveryMethod.pickupLocation && (
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {selectedDeliveryMethod.pickupLocation}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-indigo-600 font-semibold italic">
                Automated template loaded from System Settings
              </span>
            </div>
          )}
        </div>

        {/* Discount (%) Field */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Quotation Discount (%)
            </label>
            {parsedDiscount > 0 && (
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                You save {parsedDiscount}% ({formatJMD(discountAmount)})
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              placeholder="0"
              className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-slate-400">
              %
            </span>
          </div>
        </div>

        {/* Calculations Overview & Grand Total */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-2.5">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block pb-0.5 border-b border-slate-200/40">
            Price Breakdown (JMD)
          </span>

          <div className="space-y-1.5 text-xs">
            {parsedAdultQty > 0 && (
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Adult Subtotal ({parsedAdultQty} units):</span>
                <span className="font-mono font-bold text-slate-800">{formatJMD(adultSubtotal)}</span>
              </div>
            )}
            {parsedAdultPlusQty > 0 && (
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Adult +Size Subtotal ({parsedAdultPlusQty} units):</span>
                <span className="font-mono font-bold text-slate-800">{formatJMD(adultPlusSubtotal)}</span>
              </div>
            )}
            {parsedChildQty > 0 && (
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Children Subtotal ({parsedChildQty} units):</span>
                <span className="font-mono font-bold text-slate-800">{formatJMD(childSubtotal)}</span>
              </div>
            )}
            {totalAdditionalCharges > 0 && (
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Additional Charges Total:</span>
                <span className="font-mono font-bold text-slate-800">{formatJMD(totalAdditionalCharges)}</span>
              </div>
            )}
            {!isPickup && parsedDeliveryCharge > 0 && (
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>{selectedDeliveryMethod ? selectedDeliveryMethod.name : "Delivery Fee"}:</span>
                <span className="font-mono font-bold text-slate-800">{formatJMD(parsedDeliveryCharge)}</span>
              </div>
            )}
            
            {parsedDiscount > 0 && (
              <>
                <div className="flex justify-between items-center text-slate-600 font-medium pt-1 border-t border-dashed border-slate-200">
                  <span>Subtotal (Before Discount):</span>
                  <span className="font-mono font-bold text-slate-800">{formatJMD(subtotalBeforeDiscount)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-700 font-bold">
                  <span>Discount ({parsedDiscount}%):</span>
                  <span className="font-mono">-{formatJMD(discountAmount)}</span>
                </div>
              </>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 text-sm">
              <span className="font-extrabold text-slate-900">Grand Total:</span>
              <span className="font-mono font-black text-indigo-600 text-base">{formatJMD(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Generated Customer Quote Preview & Copy */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
              Generated Customer Quote
            </span>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveQuotation}
                className="text-[9px] font-bold text-slate-700 hover:text-slate-900 uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600 font-extrabold">Saved to Log!</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3 h-3 text-indigo-600" />
                    <span>Save Quotation</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyQuote}
                className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider py-1 px-3 rounded-lg transition-all border cursor-pointer ${
                  copied 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                    : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Quote</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 text-xs font-semibold text-slate-800 whitespace-pre-wrap leading-relaxed select-all font-sans">
            {getGeneratedQuoteText()}
          </div>
        </div>

      </div>
    </div>
  );
}
