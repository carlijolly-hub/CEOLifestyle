import React, { useState, useEffect } from "react";
import { Calculator, RefreshCw, Shirt, Plus, Trash2, Copy, Check, DollarSign } from "lucide-react";
import { SystemSettings } from "../types";

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

  // Initialize state with localStorage persistence for premium UX
  const [garmentType, setGarmentType] = useState(() => {
    return localStorage.getItem("calc_tshirt_garment_type") || "T-Shirts";
  });

  const [adultQty, setAdultQty] = useState(() => {
    return localStorage.getItem("calc_tshirt_adult_qty") || "5";
  });
  const [adultPlusQty, setAdultPlusQty] = useState(() => {
    return localStorage.getItem("calc_tshirt_adult_plus_qty") || "0";
  });
  const [childQty, setChildQty] = useState(() => {
    return localStorage.getItem("calc_tshirt_child_qty") || "2";
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
      { id: "1", name: "Design Fee", amount: "1000" },
      { id: "2", name: "Sleeve Print", amount: "500" },
      { id: "3", name: "Rush Order", amount: "2500" }
    ];
  });

  // Copy success state
  const [copied, setCopied] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem("calc_tshirt_garment_type", garmentType);
    localStorage.setItem("calc_tshirt_adult_qty", adultQty);
    localStorage.setItem("calc_tshirt_adult_plus_qty", adultPlusQty);
    localStorage.setItem("calc_tshirt_child_qty", childQty);
    localStorage.setItem("calc_tshirt_adult_price", adultPrice);
    localStorage.setItem("calc_tshirt_adult_plus_price", adultPlusPrice);
    localStorage.setItem("calc_tshirt_child_price", childPrice);
    localStorage.setItem("calc_tshirt_additional_charges", JSON.stringify(additionalCharges));
  }, [garmentType, adultQty, adultPlusQty, childQty, adultPrice, adultPlusPrice, childPrice, additionalCharges]);

  // Calculations
  const parsedAdultQty = Math.max(0, parseInt(adultQty, 10) || 0);
  const parsedAdultPlusQty = Math.max(0, parseInt(adultPlusQty, 10) || 0);
  const parsedChildQty = Math.max(0, parseInt(childQty, 10) || 0);

  const parsedAdultPrice = Math.max(0, parseFloat(adultPrice) || 0);
  const parsedAdultPlusPrice = Math.max(0, parseFloat(adultPlusPrice) || 0);
  const parsedChildPrice = Math.max(0, parseFloat(childPrice) || 0);

  const adultSubtotal = parsedAdultQty * parsedAdultPrice;
  const adultPlusSubtotal = parsedAdultPlusQty * parsedAdultPlusPrice;
  const childSubtotal = parsedChildQty * parsedChildPrice;

  const totalAdditionalCharges = additionalCharges.reduce((sum, item) => {
    const amt = parseFloat(item.amount) || 0;
    return sum + amt;
  }, 0);

  const grandTotal = adultSubtotal + adultPlusSubtotal + childSubtotal + totalAdditionalCharges;

  // Format currency helpers
  const formatJMD = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "JMD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
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
    setAdultQty("5");
    setAdultPlusQty("0");
    setChildQty("2");
    setAdultPrice("3000");
    setAdultPlusPrice("3500");
    setChildPrice("2850");
    setAdditionalCharges([
      { id: "1", name: "Design Fee", amount: "1000" },
      { id: "2", name: "Sleeve Print", amount: "500" },
      { id: "3", name: "Rush Order", amount: "2500" }
    ]);
    setCopied(false);
  };

  // Generated Quote Text
  const getGeneratedQuoteText = () => {
    const itemsText = [
      `• ${parsedAdultQty} Adult ${garmentType} @ ${formatJMD(parsedAdultPrice)} each = ${formatJMD(adultSubtotal)}`,
      `• ${parsedAdultPlusQty} Adult +Size ${garmentType} @ ${formatJMD(parsedAdultPlusPrice)} each = ${formatJMD(adultPlusSubtotal)}`,
      `• ${parsedChildQty} Child ${garmentType} @ ${formatJMD(parsedChildPrice)} each = ${formatJMD(childSubtotal)}`
    ].join("\n");

    let additionalText = "";
    if (additionalCharges.length > 0) {
      additionalText = "\nAdditional Charges\n" + additionalCharges.map(item => {
        const amt = parseFloat(item.amount) || 0;
        return `• ${item.name || "Extra Charge"} – ${formatJMD(amt)}`;
      }).join("\n");
    }

    return `Thank you so much for providing those details. Here is your personalized quote based on your request:
${itemsText}${additionalText}
Total: ${formatJMD(grandTotal)}
(Includes garments with printing unless otherwise stated.)`;
  };

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(getGeneratedQuoteText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
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
                    placeholder="Charge Name (e.g. Embroidery)"
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
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Remove charge item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Calculations Overview & Grand Total */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-2.5">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block pb-0.5 border-b border-slate-200/40">
            Price Breakdown (JMD)
          </span>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-600 font-medium">
              <span>Adult Subtotal ({parsedAdultQty} units):</span>
              <span className="font-mono font-bold text-slate-800">{formatJMD(adultSubtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 font-medium">
              <span>Adult +Size Subtotal ({parsedAdultPlusQty} units):</span>
              <span className="font-mono font-bold text-slate-800">{formatJMD(adultPlusSubtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 font-medium">
              <span>Children Subtotal ({parsedChildQty} units):</span>
              <span className="font-mono font-bold text-slate-800">{formatJMD(childSubtotal)}</span>
            </div>
            {additionalCharges.length > 0 && (
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Additional Charges Total:</span>
                <span className="font-mono font-bold text-slate-800">{formatJMD(totalAdditionalCharges)}</span>
              </div>
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
            <button
              onClick={handleCopyQuote}
              className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider py-1 px-3 rounded-lg transition-all border ${
                copied 
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                  : "bg-slate-900 hover:bg-slate-800 text-white border-transparent"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Quote
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 text-xs font-semibold text-slate-700 whitespace-pre-wrap leading-relaxed select-all">
            {getGeneratedQuoteText()}
          </div>
        </div>

      </div>
    </div>
  );
}
