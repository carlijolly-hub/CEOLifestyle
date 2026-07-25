import React, { useState, useEffect } from "react";
import { 
  Calculator, 
  DollarSign, 
  RefreshCw, 
  Info, 
  Package, 
  AlertCircle, 
  TrendingUp, 
  Copy, 
  Check, 
  Truck, 
  MapPin, 
  Clock, 
  Bookmark, 
  FileText, 
  Sparkles,
  Plus,
  Trash2
} from "lucide-react";
import { SystemSettings, LuxeBookInventoryItem, DeliveryMethod, SavedQuotation } from "../types";
import { DEFAULT_DELIVERY_METHODS, DEFAULT_QUOTE_TEMPLATES, formatQuoteTemplate } from "../utils/settingsHelper";

interface AdditionalCharge {
  id: string;
  name: string;
  amount: string;
}

interface BookCostCalculatorProps {
  settings?: SystemSettings;
  inventory?: LuxeBookInventoryItem[];
}

export default function BookCostCalculator({ settings, inventory }: BookCostCalculatorProps) {
  const defaultRate = settings ? settings.exchangeRate.toString() : "160";
  const markupPercent = settings ? settings.businessMarkupPercent : 25;
  const roundingUnit = settings ? settings.roundingUpUnit : 100;

  // Active delivery methods from Centralized System Settings
  const activeDeliveryMethods = (settings?.deliveryMethods && settings.deliveryMethods.length > 0)
    ? settings.deliveryMethods.filter(m => m.active !== false)
    : DEFAULT_DELIVERY_METHODS.filter(m => m.active !== false);

  // Use localStorage to persist calculator values
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
  const [discountPercent, setDiscountPercent] = useState(() => {
    return localStorage.getItem("calc_book_discount") || "0";
  });

  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>(() => {
    const stored = localStorage.getItem("calc_book_additional_charges");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return [];
  });

  // Centralized Delivery & Collection Method Selection
  const [deliveryMethodId, setDeliveryMethodId] = useState<string>(() => {
    const saved = localStorage.getItem("calc_book_delivery_method_id");
    if (saved && activeDeliveryMethods.some(m => m.id === saved)) {
      return saved;
    }
    return activeDeliveryMethods[0]?.id || "del_knutsford";
  });

  // Jamaica Parish selection for future parish delivery charges & scalability
  const [selectedParish, setSelectedParish] = useState(() => {
    return localStorage.getItem("calc_book_parish") || "All Parishes";
  });

  // Current selected delivery method object
  const selectedDeliveryMethod = activeDeliveryMethods.find(m => m.id === deliveryMethodId) || activeDeliveryMethods[0];
  const isPickup = selectedDeliveryMethod?.type === "collection";

  const defaultDeliveryCost = selectedDeliveryMethod ? selectedDeliveryMethod.defaultCost.toString() : "1350";

  const [shippingCost, setShippingCost] = useState(() => {
    return localStorage.getItem("calc_shipping_cost") || defaultDeliveryCost;
  });

  // Copy success and saved quote notification states
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Overridden shipping state flag
  const [isOverride, setIsOverride] = useState(() => {
    return localStorage.getItem("calc_shipping_override") === "true";
  });

  // Add / Remove / Edit additional charges
  const handleAddCharge = () => {
    setAdditionalCharges([...additionalCharges, { id: Date.now().toString(), name: "", amount: "0" }]);
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

  // Sync shipping cost when delivery method changes (unless user manually customized)
  const handleDeliveryMethodChange = (newMethodId: string) => {
    setDeliveryMethodId(newMethodId);
    const method = activeDeliveryMethods.find(m => m.id === newMethodId);
    if (method) {
      if (method.type === "collection") {
        setShippingCost("0");
      } else {
        setShippingCost(method.defaultCost.toString());
      }
      setIsOverride(false);
    }
  };

  // Sync state with settings if settings props update
  useEffect(() => {
    if (settings) {
      const storedRate = localStorage.getItem("calc_exchange_rate");
      if (!storedRate) {
        setExchangeRate(settings.exchangeRate.toString());
      }
    }
  }, [settings]);

  // Persist state in localStorage
  useEffect(() => {
    localStorage.setItem("calc_book_name", bookName);
    localStorage.setItem("calc_book_cost", bookCost);
    localStorage.setItem("calc_exchange_rate", exchangeRate);
    localStorage.setItem("calc_quantity", quantity);
    localStorage.setItem("calc_shipping_cost", shippingCost);
    localStorage.setItem("calc_book_delivery_method_id", deliveryMethodId);
    localStorage.setItem("calc_book_parish", selectedParish);
    localStorage.setItem("calc_shipping_override", String(isOverride));
    localStorage.setItem("calc_book_discount", discountPercent);
    localStorage.setItem("calc_book_additional_charges", JSON.stringify(additionalCharges));
  }, [bookName, bookCost, exchangeRate, quantity, shippingCost, deliveryMethodId, selectedParish, isOverride, discountPercent, additionalCharges]);

  // Handle quantity change
  const handleQuantityChange = (val: string) => {
    setQuantity(val);
  };

  // Handle manual shipping change
  const handleShippingChange = (val: string) => {
    setShippingCost(val);
    const expectedCost = selectedDeliveryMethod ? selectedDeliveryMethod.defaultCost : 1350;
    if (parseFloat(val) !== expectedCost) {
      setIsOverride(true);
    } else {
      setIsOverride(false);
    }
  };

  // Reset calculator to baseline defaults
  const handleReset = () => {
    setBookName("The 48 Laws of Power");
    setBookCost("11.09");
    const rate = settings ? settings.exchangeRate.toString() : "160";
    setExchangeRate(rate);
    setQuantity("1");
    const defaultMethod = activeDeliveryMethods[0] || DEFAULT_DELIVERY_METHODS[0];
    setDeliveryMethodId(defaultMethod.id);
    setShippingCost(defaultMethod.type === "collection" ? "0" : defaultMethod.defaultCost.toString());
    setDiscountPercent("0");
    setAdditionalCharges([]);
    setSelectedParish("All Parishes");
    setIsOverride(false);
    setCopied(false);
    setSavedSuccess(false);
  };

  // Numeric calculations
  const parsedCost = parseFloat(bookCost) || 0;
  const parsedRate = parseFloat(exchangeRate) || 0;
  const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
  const parsedShipping = isPickup ? 0 : (parseFloat(shippingCost) || 0);
  const parsedDiscount = Math.min(100, Math.max(0, parseFloat(discountPercent) || 0));

  const totalAdditionalCharges = additionalCharges.reduce((sum, item) => {
    const amt = parseFloat(item.amount) || 0;
    return sum + amt;
  }, 0);

  // Calculation formulas
  const totalBookCostJMD = parsedCost * parsedQty * parsedRate;
  
  // Book subtotal (selling price before shipping & additional charges)
  const rawBookSellingPrice = totalBookCostJMD * (1 + (markupPercent / 100));
  const booksSellingSubtotal = roundingUnit > 0 ? Math.ceil(rawBookSellingPrice / roundingUnit) * roundingUnit : Math.ceil(rawBookSellingPrice);
  const unitBookSellingPrice = parsedQty > 0 ? Math.round(booksSellingSubtotal / parsedQty) : 0;

  // Total quotation before discount
  const subtotalBeforeDiscount = booksSellingSubtotal + parsedShipping + totalAdditionalCharges;
  const discountAmount = subtotalBeforeDiscount * (parsedDiscount / 100);
  const finalSellingPrice = Math.max(0, subtotalBeforeDiscount - discountAmount);

  // Unrounded base calculation
  const rawSellingPrice = (totalBookCostJMD + parsedShipping + totalAdditionalCharges) * (1 + (markupPercent / 100));

  // Currency Formatter
  const formatJMD = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "JMD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatJMDVal = (val: number) => {
    return "JMD " + Math.round(val).toLocaleString("en-US");
  };

  // Unified Customer Quotation Output Generator
  const getFormattedCustomerQuote = () => {
    const bookTemplate = settings?.quoteTemplates?.find(t => t.active && (t.toolKey === "book" || t.id === "tpl_book_quote" || t.id === "tpl_book_cost_calculator"))
      || DEFAULT_QUOTE_TEMPLATES.find(t => t.id === "tpl_book_quote");

    const deliveryMsg = (selectedDeliveryMethod?.messageTemplate || 
      "Your order will be dispatched via courier once your order has been processed. Collection details and tracking information will be provided once your order is ready for shipment.").trim();

    const methodName = selectedDeliveryMethod ? selectedDeliveryMethod.name : "Knutsford Express";
    
    // Additional charges list (including delivery charge if applicable)
    const addChargeLines: string[] = [];
    additionalCharges.forEach((item) => {
      const amt = parseFloat(item.amount) || 0;
      if (item.name && amt > 0) {
        addChargeLines.push(`* ${item.name} – ${formatJMDVal(amt)}`);
      }
    });

    if (!isPickup && parsedShipping > 0) {
      addChargeLines.push(`* Delivery Fee (${methodName}) – ${formatJMDVal(parsedShipping)}`);
    }

    const addChargesStr = addChargeLines.join("\n");
    const hasDiscount = parsedDiscount > 0 && discountAmount > 0;
    const isItemValid = parsedQty > 0 && unitBookSellingPrice > 0;

    if (bookTemplate) {
      return formatQuoteTemplate(bookTemplate.content, {
        BookTitle: bookName || "Book",
        Quantity: isItemValid ? parsedQty : "",
        QuantityUnit: parsedQty === 1 ? "Book" : "Books",
        UnitPrice: isItemValid ? formatJMDVal(unitBookSellingPrice) : "",
        BooksSubtotal: isItemValid ? formatJMDVal(booksSellingSubtotal) : "",
        AdditionalCharges: addChargesStr,
        DeliveryMethod: methodName,
        DeliveryCharge: parsedShipping > 0 ? formatJMDVal(parsedShipping) : "",
        DeliveryMessage: deliveryMsg,
        Subtotal: formatJMDVal(subtotalBeforeDiscount),
        DiscountPercent: hasDiscount ? parsedDiscount : 0,
        DiscountAmount: hasDiscount ? formatJMDVal(discountAmount) : "",
        GrandTotal: formatJMDVal(finalSellingPrice),
        BusinessName: settings?.companyName || "CEO Lifestyle"
      });
    }

    const sections: string[] = [];
    sections.push("Thank you so much for providing those details. Here is your personalized quote based on your request:");

    if (isItemValid) {
      sections.push(`Book:\n${bookName || "Book"}\n\nQuantity\n* ${parsedQty} ${parsedQty === 1 ? "Book" : "Books"} @ ${formatJMDVal(unitBookSellingPrice)} each = ${formatJMDVal(booksSellingSubtotal)}`);
    }

    if (addChargesStr) {
      sections.push(`Additional Charges\n${addChargesStr}`);
    }

    if (hasDiscount) {
      sections.push(`Discount\n* You save ${parsedDiscount}% = ${formatJMDVal(discountAmount)}`);
    }

    sections.push(`Total: ${formatJMDVal(finalSellingPrice)}\n(Includes the selected book unless otherwise stated.)`);

    if (deliveryMsg) {
      sections.push(`Delivery Method: ${methodName}\n${deliveryMsg}`);
    }

    sections.push("Let me know if you would like to proceed.");

    return sections.join("\n\n");
  };

  // Copy Quotation to Clipboard
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(getFormattedCustomerQuote());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save Quotation to Centralized Saved Quotations Log
  const handleSaveQuotation = () => {
    const newQuote: SavedQuotation = {
      id: "quote_" + Date.now(),
      quoteNumber: `BK-QT-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: "Bespoke Book Order",
      toolType: "book",
      summaryText: `${bookName} (${parsedQty} ${parsedQty === 1 ? 'copy' : 'copies'}) via ${selectedDeliveryMethod?.name || 'Delivery'}`,
      itemDetails: [
        { name: `Book: ${bookName}`, quantity: parsedQty, unitPriceJMD: unitBookSellingPrice, subtotalJMD: booksSellingSubtotal },
        { name: `Delivery: ${selectedDeliveryMethod?.name || 'Shipping'}`, quantity: 1, unitPriceJMD: parsedShipping, subtotalJMD: parsedShipping }
      ],
      subtotalJMD: subtotalBeforeDiscount,
      discountPercent: parsedDiscount,
      discountAmountJMD: discountAmount,
      totalJMD: finalSellingPrice,
      formattedResponseText: getFormattedCustomerQuote(),
      createdAt: new Date().toISOString(),
      createdBy: "Master Administrator",
      status: "Active"
    };

    const stored = localStorage.getItem("ceo_saved_quotations");
    let existing: SavedQuotation[] = [];
    if (stored) {
      try { existing = JSON.parse(stored); } catch (e) { existing = []; }
    }
    const updated = [newQuote, ...existing];
    localStorage.setItem("ceo_saved_quotations", JSON.stringify(updated));

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-5 text-left animate-fade-in" id="book-cost-calculator-widget">
      {/* Header */}
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
                    const currentRate = parseFloat(exchangeRate) || 160;
                    const defaultSingleShip = selectedDeliveryMethod ? selectedDeliveryMethod.defaultCost : 1350;
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

        {/* Centralized Delivery / Collection Method Selection */}
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
            <Truck className="w-3 h-3 text-indigo-600" />
            Delivery / Collection Method
          </label>
          <select
            value={deliveryMethodId}
            onChange={(e) => handleDeliveryMethodChange(e.target.value)}
            className="w-full bg-indigo-50/50 border border-indigo-200/80 rounded-xl px-2.5 py-2 text-xs font-bold text-indigo-950 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all cursor-pointer"
          >
            {activeDeliveryMethods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.type === "collection" ? "🏢" : "🚚"} {m.name} (${m.defaultCost.toLocaleString()} JMD)
              </option>
            ))}
          </select>
        </div>

        {/* Shipping / Delivery Fee (JMD) */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Delivery Fee (JMD)
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

        {/* Discount (%) */}
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Discount (%)
          </label>
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

        {/* Parish / Region Selection for Scalability */}
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Target Destination Parish
          </label>
          <select
            value={selectedParish}
            onChange={(e) => setSelectedParish(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-none transition-all cursor-pointer"
          >
            <option value="All Parishes">Islandwide / All Parishes</option>
            <option value="Kingston & St. Andrew">Kingston & St. Andrew</option>
            <option value="St. Catherine">St. Catherine</option>
            <option value="St. James">St. James (Montego Bay)</option>
            <option value="St. Ann">St. Ann (Ocho Rios)</option>
            <option value="Manchester">Manchester (Mandeville)</option>
            <option value="Clarendon">Clarendon</option>
            <option value="Hanover">Hanover</option>
            <option value="Westmoreland">Westmoreland (Negril)</option>
            <option value="St. Elizabeth">St. Elizabeth</option>
            <option value="Trelawny">Trelawny</option>
            <option value="Portland">Portland (Port Antonio)</option>
            <option value="St. Mary">St. Mary</option>
            <option value="St. Thomas">St. Thomas</option>
          </select>
        </div>

        {/* Additional Charges / Custom Fees Section */}
        <div className="space-y-2 col-span-2 pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              Additional Charges / Custom Fees
            </label>
            <button
              type="button"
              onClick={handleAddCharge}
              className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors bg-indigo-50 px-2 py-1 rounded-md"
            >
              <Plus className="w-3 h-3" />
              Add Charge
            </button>
          </div>

          {additionalCharges.length > 0 && (
            <div className="space-y-2 pt-1">
              {additionalCharges.map((item) => (
                <div key={item.id} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleChargeChange(item.id, "name", e.target.value)}
                    placeholder="Charge Name (e.g. Design Fee, Custom Bookmark, Packaging)"
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
      </div>

      {/* Selected Delivery Details Badge */}
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
            <span>Books Subtotal ({parsedQty} {parsedQty === 1 ? "copy" : "copies"}):</span>
            <span className="font-mono font-semibold">{formatJMD(booksSellingSubtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>{selectedDeliveryMethod ? selectedDeliveryMethod.name : "Delivery Fee"}:</span>
            <span className="font-mono font-semibold">{formatJMD(parsedShipping)}</span>
          </div>
          {totalAdditionalCharges > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Additional Charges:</span>
              <span className="font-mono font-semibold">{formatJMD(totalAdditionalCharges)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600 pb-1.5 border-b border-dashed border-slate-200">
            <span>Markup Factor:</span>
            <span className="font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> {markupPercent}% ({(1 + (markupPercent / 100)).toFixed(2)}x)
            </span>
          </div>
          
          {parsedDiscount > 0 && (
            <>
              <div className="flex justify-between text-slate-600 pt-1 border-t border-dashed border-slate-200">
                <span>Subtotal (Before Discount):</span>
                <span className="font-mono font-semibold text-slate-800">{formatJMD(subtotalBeforeDiscount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Discount ({parsedDiscount}%):</span>
                <span className="font-mono">-{formatJMD(discountAmount)}</span>
              </div>
            </>
          )}

          <div className="flex justify-between text-slate-500 text-[10px] pt-1">
            <span>Unrounded Base Price:</span>
            <span className="font-mono">{formatJMD(rawSellingPrice)}</span>
          </div>
        </div>
      </div>

      {/* Hero Output Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col justify-between items-center text-center shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
        
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
          Total Selling Price
        </span>
        <div className="text-2xl font-black tracking-tight text-white mt-1 font-mono">
          {formatJMD(finalSellingPrice)}
        </div>
        
        {parsedDiscount > 0 && (
          <div className="text-[10px] text-emerald-300 font-bold mt-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Saved {parsedDiscount}% ({formatJMD(discountAmount)})
          </div>
        )}

        {parsedQty > 1 && (
          <div className="text-[10px] text-slate-400 mt-1 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5 font-mono">
            {formatJMD(unitBookSellingPrice)} per book
          </div>
        )}
      </div>

      {/* Customer Response Message Card */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2.5">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Customer Response Quote</span>
          
          <div className="flex items-center gap-2">
            <button
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
              onClick={handleCopyMessage}
              className="text-[9px] font-bold text-indigo-700 hover:text-indigo-900 uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/60"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600 font-extrabold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-indigo-600" />
                  <span>Copy Quote Message</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-3.5 rounded-xl text-[11px] text-slate-800 font-medium leading-relaxed font-sans whitespace-pre-wrap select-all">
          {getFormattedCustomerQuote()}
        </div>
      </div>
    </div>
  );
}
