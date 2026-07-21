import React, { useState, useEffect } from "react";
import { Calculator, DollarSign, RefreshCw, Info, Package, AlertCircle, TrendingUp, Copy, Check } from "lucide-react";
import { SystemSettings, LuxeBookInventoryItem } from "../types";

interface BookCostCalculatorProps {
  settings?: SystemSettings;
  inventory?: LuxeBookInventoryItem[];
}

export default function BookCostCalculator({ settings, inventory }: BookCostCalculatorProps) {
  const defaultRate = settings ? settings.exchangeRate.toString() : "160";
  const defaultSingleShip = settings ? settings.shippingSingleBook.toString() : "1350";
  const defaultMultiShip = settings ? settings.shippingMultipleBooks.toString() : "1000";
  const markupPercent = settings ? settings.businessMarkupPercent : 25;
  const roundingUnit = settings ? settings.roundingUpUnit : 100;

  // Use localStorage to persist the calculator values for a premium user experience
  const [bookName, setBookName] = useState(() => {
    return localStorage.getItem("calc_book_name") || "The 48 Laws of Power";
  });
  const [bookCost, setBookCost] = useState(() => {
    return localStorage.getItem("calc_book_cost") || "11.09";
  });
  const [exchangeRate, setExchangeRate] = useState(() => {
    return localStorage.getItem("calc_exchange_rate") || defaultRate;
  });
  const [quantity, setQuantity] = useState(() => {
    return localStorage.getItem("calc_quantity") || "1";
  });
  const [shippingCost, setShippingCost] = useState(() => {
    return localStorage.getItem("calc_shipping_cost") || defaultSingleShip;
  });

  // Copy state
  const [copied, setCopied] = useState(false);

  // Keep track of whether the user has manually overwritten shipping
  const [isOverride, setIsOverride] = useState(() => {
    return localStorage.getItem("calc_shipping_override") === "true";
  });

  // Sync state with settings if settings changes and user has not customized it
  useEffect(() => {
    if (settings) {
      const storedRate = localStorage.getItem("calc_exchange_rate");
      if (!storedRate) {
        setExchangeRate(settings.exchangeRate.toString());
      }
      const storedShipping = localStorage.getItem("calc_shipping_cost");
      if (!storedShipping) {
        const parsedQty = parseInt(quantity, 10) || 1;
        const defaultShipping = parsedQty === 1 ? settings.shippingSingleBook : settings.shippingMultipleBooks * parsedQty;
        setShippingCost(defaultShipping.toString());
      }
    }
  }, [settings]);

  // Persist values in localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("calc_book_name", bookName);
    localStorage.setItem("calc_book_cost", bookCost);
    localStorage.setItem("calc_exchange_rate", exchangeRate);
    localStorage.setItem("calc_quantity", quantity);
    localStorage.setItem("calc_shipping_cost", shippingCost);
    localStorage.setItem("calc_shipping_override", String(isOverride));
  }, [bookName, bookCost, exchangeRate, quantity, shippingCost, isOverride]);

  // Handle quantity change with automatic shipping defaults
  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    const parsedQty = parseInt(val, 10);
    
    if (!isNaN(parsedQty) && parsedQty > 0) {
      const singleShip = settings ? settings.shippingSingleBook : 1350;
      const multiShip = settings ? settings.shippingMultipleBooks : 1000;
      const defaultShipping = parsedQty === 1 ? singleShip : multiShip * parsedQty;
      setShippingCost(defaultShipping.toString());
      setIsOverride(false); // Reset override state on quantity change to show it matched default
    }
  };

  // Handle manual shipping change
  const handleShippingChange = (val: string) => {
    setShippingCost(val);
    
    // Check if the entered shipping value differs from what the default would be
    const parsedQty = parseInt(quantity, 10) || 1;
    const singleShip = settings ? settings.shippingSingleBook : 1350;
    const multiShip = settings ? settings.shippingMultipleBooks : 1000;
    const defaultShipping = parsedQty === 1 ? singleShip : multiShip * parsedQty;
    
    if (parseFloat(val) !== defaultShipping) {
      setIsOverride(true);
    } else {
      setIsOverride(false);
    }
  };

  // Reset to absolute standard defaults
  const handleReset = () => {
    setBookName("The 48 Laws of Power");
    setBookCost("11.09");
    const rate = settings ? settings.exchangeRate.toString() : "160";
    setExchangeRate(rate);
    setQuantity("1");
    const singleShip = settings ? settings.shippingSingleBook.toString() : "1350";
    setShippingCost(singleShip);
    setIsOverride(false);
    setCopied(false);
  };

  // Numeric parsers
  const parsedCost = parseFloat(bookCost) || 0;
  const parsedRate = parseFloat(exchangeRate) || 0;
  const parsedQty = parseInt(quantity, 10) || 1;
  const parsedShipping = parseFloat(shippingCost) || 0;

  // Calculation logic:
  // ((Book Cost * Exchange Rate) + Shipping Cost) * 1.25
  // Note: To support scaling with quantity cleanly:
  // Total Book Cost in JMD = (Book Cost * Quantity * Exchange Rate)
  // Let's compute:
  const totalBookCostJMD = parsedCost * parsedQty * parsedRate;
  const subtotalJMD = totalBookCostJMD + parsedShipping;
  const rawSellingPrice = subtotalJMD * (1 + (markupPercent / 100));
  
  // Round the final selling price UP to the nearest rounding unit
  const finalSellingPrice = roundingUnit > 0 ? Math.ceil(rawSellingPrice / roundingUnit) * roundingUnit : Math.ceil(rawSellingPrice);

  // Unit selling price (for reference)
  const unitSellingPrice = parsedQty > 0 ? Math.round(finalSellingPrice / parsedQty) : 0;

  // Format helper for JMD currency
  const formatJMD = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "JMD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCopyMessage = () => {
    const generatedMessage = `${bookName || "The book"} is available for ${formatJMD(finalSellingPrice)}. Let me know if you would like to proceed.`;
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-5 text-left animate-fade-in" id="book-cost-calculator-widget">
      <div className="flex items-center justify-between border-b pb-3 border-slate-100">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <Calculator className="w-4 h-4 text-slate-800" />
          Librarium Book Cost Calculator
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

      {/* Input Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Dropdown for active books in inventory */}
        {inventory && inventory.filter(item => !item.archived).length > 0 && (
          <div className="space-y-1.5 col-span-2">
            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Quick Select Active Book from Inventory
            </label>
            <select
              value=""
              onChange={(e) => {
                const selectedId = e.target.value;
                const book = (inventory || []).find(b => b.id === selectedId);
                if (book) {
                  setBookName(book.title);
                  if (book.sellingPrice) {
                    // Back-calculate the estimated USD cost based on sellingPrice
                    const currentRate = parseFloat(exchangeRate) || 160;
                    const defaultSingleShip = settings ? settings.shippingSingleBook : 1350;
                    const markupDivisor = 1 + (markupPercent / 100);
                    const estUSD = ((book.sellingPrice / markupDivisor) - defaultSingleShip) / currentRate;
                    setBookCost(estUSD > 0 ? estUSD.toFixed(2) : "10.00");
                  }
                }
              }}
              className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
            >
              <option value="">-- Choose an Active Book to Populate Calculator --</option>
              {inventory.filter(item => !item.archived).map(b => (
                <option key={b.id} value={b.id}>{b.title} (${b.sellingPrice ? b.sellingPrice.toLocaleString() : "No Price"})</option>
              ))}
            </select>
          </div>
        )}

        {/* Book Name (col-span-2) */}
        <div className="space-y-1.5 col-span-2">
          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Book Name
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Package className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
              placeholder="The 48 Laws of Power"
              className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Book Cost USD */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Book Cost (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={bookCost}
              onChange={(e) => setBookCost(e.target.value)}
              placeholder="11.09"
              className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-6 pr-3 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Exchange Rate JMD */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Exchange Rate (JMD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              J$
            </span>
            <input
              type="number"
              step="1"
              min="1"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              placeholder="160"
              className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Quantity
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              Qty
            </span>
            <input
              type="number"
              step="1"
              min="1"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              placeholder="1"
              className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Shipping Cost JMD */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Shipping (JMD)
            </label>
            {isOverride && (
              <span className="text-[7px] font-black uppercase bg-amber-50 text-amber-700 px-1 py-0.2 rounded border border-amber-200 tracking-wider">
                Customized
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              J$
            </span>
            <input
              type="number"
              step="10"
              min="0"
              value={shippingCost}
              onChange={(e) => handleShippingChange(e.target.value)}
              placeholder="1350"
              className={`w-full border rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold transition-all focus:bg-white focus:border-slate-400 focus:outline-hidden ${
                isOverride 
                  ? "bg-amber-50/50 border-amber-300 text-amber-900" 
                  : "bg-slate-50 border-slate-200/60 text-slate-800"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Dynamic Summary Panel */}
      <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Cost Summary</span>
          <span className="text-[9px] font-bold text-slate-500 font-mono">
            {parsedQty} {parsedQty === 1 ? "book" : "books"} @ ${parsedCost} USD
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Books Subtotal:</span>
            <span className="font-mono font-semibold">{formatJMD(totalBookCostJMD)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Shipping Cost:</span>
            <span className="font-mono font-semibold">{formatJMD(parsedShipping)}</span>
          </div>
          <div className="flex justify-between text-slate-600 pb-1.5 border-b border-dashed border-slate-200">
            <span>Markup Factor:</span>
            <span className="font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> {markupPercent}% ({(1 + (markupPercent / 100)).toFixed(2)}x)
            </span>
          </div>
          <div className="flex justify-between text-slate-500 text-[10px] pt-1">
            <span>Unrounded Price:</span>
            <span className="font-mono">{formatJMD(rawSellingPrice)}</span>
          </div>
        </div>
      </div>

      {/* Hero Output Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col justify-between items-center text-center shadow-md relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
        
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
          Estimated Selling Price
        </span>
        <div className="text-2xl font-black tracking-tight text-white mt-1 font-mono">
          {formatJMD(finalSellingPrice)}
        </div>
        
        {parsedQty > 1 && (
          <div className="text-[10px] text-slate-400 mt-1 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5 font-mono">
            {formatJMD(unitSellingPrice)} per book
          </div>
        )}
      </div>

      {/* Customer Response Message Card */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Customer Response</span>
          <button
            onClick={handleCopyMessage}
            className="text-[9px] font-bold text-indigo-650 hover:text-indigo-850 uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600 font-extrabold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-indigo-500" />
                <span>Copy Message</span>
              </>
            )}
          </button>
        </div>
        <div className="bg-white border border-slate-100 p-3 rounded-xl text-[11px] text-slate-700 font-medium leading-relaxed font-sans select-all">
          "{bookName || "The book"} is available for {formatJMD(finalSellingPrice)}. Let me know if you would like to proceed."
        </div>
      </div>
    </div>
  );
}
