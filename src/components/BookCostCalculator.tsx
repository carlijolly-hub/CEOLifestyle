import React, { useState, useEffect, useRef } from "react";
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
  Trash2,
  Search,
  BookOpen
} from "lucide-react";
import { SystemSettings, LuxeBookInventoryItem, DeliveryMethod, SavedQuotation } from "../types";
import { DEFAULT_DELIVERY_METHODS, DEFAULT_QUOTE_TEMPLATES, DEFAULT_TARGET_DESTINATIONS, getSystemSettings, saveSystemSettings, formatQuoteTemplate } from "../utils/settingsHelper";
import { normalizeQuotation } from "../utils/quotationUtils";
import { loadEnvironmentQuotations, saveEnvironmentQuotations } from "../utils/environmentUtils";

interface AdditionalCharge {
  id: string;
  name: string;
  amount: string;
}

export interface BookItem {
  id: string;
  title: string;
  costUSD: string;
  quantity: string;
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

  // Multi-book state with localStorage persistence and backward compatibility migration
  const [books, setBooks] = useState<BookItem[]>(() => {
    const stored = localStorage.getItem("calc_books_list");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    // Migration fallback for legacy single-book state
    const oldName = localStorage.getItem("calc_book_name");
    const oldCost = localStorage.getItem("calc_book_cost");
    const oldQty = localStorage.getItem("calc_quantity");
    return [
      {
        id: "book_1",
        title: oldName || "The 48 Laws of Power",
        costUSD: oldCost || "11.09",
        quantity: oldQty || "1"
      }
    ];
  });

  const [exchangeRate, setExchangeRate] = useState(() => {
    return localStorage.getItem("calc_exchange_rate") || defaultRate;
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

  // Active search dropdown focus index for book suggestions
  const [activeSearchBookId, setActiveSearchBookId] = useState<string | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Centralized Delivery Method Selection
  const [deliveryMethodId, setDeliveryMethodId] = useState<string>(() => {
    const saved = localStorage.getItem("calc_book_delivery_method_id");
    if (saved && activeDeliveryMethods.some(m => m.id === saved)) {
      return saved;
    }
    return activeDeliveryMethods[0]?.id || "del_knutsford";
  });

  // Target Destination logistics & planning
  const [targetDestination, setTargetDestination] = useState(() => {
    return localStorage.getItem("calc_book_target_destination") || "Montego Bay";
  });

  // Target Destinations Library List
  const [destinationList, setDestinationList] = useState<string[]>(() => {
    return settings?.targetDestinations && settings.targetDestinations.length > 0
      ? settings.targetDestinations
      : DEFAULT_TARGET_DESTINATIONS;
  });

  useEffect(() => {
    if (settings?.targetDestinations && settings.targetDestinations.length > 0) {
      setDestinationList(settings.targetDestinations);
    }
  }, [settings?.targetDestinations]);

  const handleSaveNewDestination = (newDest: string) => {
    const trimmed = newDest.trim();
    if (!trimmed || destinationList.includes(trimmed)) return;
    const updated = [...destinationList, trimmed];
    setDestinationList(updated);
    setTargetDestination(trimmed);

    // Save into system settings in localStorage
    const currentSettings = getSystemSettings();
    currentSettings.targetDestinations = updated;
    saveSystemSettings(currentSettings);
  };

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

  // Click outside listener for auto-suggest dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setActiveSearchBookId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Multi-Book CRUD Actions
  const handleAddBook = () => {
    const newBook: BookItem = {
      id: "book_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      title: "",
      costUSD: "10.00",
      quantity: "1"
    };
    setBooks(prev => [...prev, newBook]);
    setActiveSearchBookId(newBook.id);
  };

  const handleRemoveBook = (id: string) => {
    if (books.length <= 1) {
      // Keep at least one book row, but reset fields
      setBooks([{ id: "book_" + Date.now(), title: "", costUSD: "10.00", quantity: "1" }]);
    } else {
      setBooks(books.filter(b => b.id !== id));
    }
  };

  const handleBookChange = (id: string, field: keyof BookItem, value: string) => {
    setBooks(books.map(b => {
      if (b.id === id) {
        return { ...b, [field]: value };
      }
      return b;
    }));
  };

  const handleSelectInventoryBook = (bookIdInList: string, invItem: LuxeBookInventoryItem) => {
    const currentRate = parseFloat(exchangeRate) || 160;
    const markupDivisor = 1 + (markupPercent / 100);
    
    // Estimate cost USD based on selling price if available
    let estUSD = "10.00";
    if (invItem.sellingPrice && invItem.sellingPrice > 0) {
      const calculatedUSD = (invItem.sellingPrice / markupDivisor) / currentRate;
      estUSD = calculatedUSD > 0 ? calculatedUSD.toFixed(2) : "10.00";
    }

    setBooks(books.map(b => {
      if (b.id === bookIdInList) {
        return {
          ...b,
          title: invItem.title,
          costUSD: estUSD
        };
      }
      return b;
    }));
    setActiveSearchBookId(null);
  };

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

  // Sync shipping cost when delivery method changes
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
    localStorage.setItem("calc_books_list", JSON.stringify(books));
    localStorage.setItem("calc_exchange_rate", exchangeRate);
    localStorage.setItem("calc_shipping_cost", shippingCost);
    localStorage.setItem("calc_book_delivery_method_id", deliveryMethodId);
    localStorage.setItem("calc_book_target_destination", targetDestination);
    localStorage.setItem("calc_shipping_override", String(isOverride));
    localStorage.setItem("calc_book_discount", discountPercent);
    localStorage.setItem("calc_book_additional_charges", JSON.stringify(additionalCharges));
  }, [books, exchangeRate, shippingCost, deliveryMethodId, targetDestination, isOverride, discountPercent, additionalCharges]);

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
    const rate = settings ? settings.exchangeRate.toString() : "160";
    setBooks([
      {
        id: "book_1",
        title: "The 48 Laws of Power",
        costUSD: "11.09",
        quantity: "1"
      }
    ]);
    setExchangeRate(rate);
    const defaultMethod = activeDeliveryMethods[0] || DEFAULT_DELIVERY_METHODS[0];
    setDeliveryMethodId(defaultMethod.id);
    setShippingCost(defaultMethod.type === "collection" ? "0" : defaultMethod.defaultCost.toString());
    setDiscountPercent("0");
    setAdditionalCharges([]);
    setTargetDestination("Montego Bay");
    setIsOverride(false);
    setCopied(false);
    setSavedSuccess(false);
    setActiveSearchBookId(null);
  };

  // Numeric calculations
  const parsedRate = parseFloat(exchangeRate) || 0;
  const parsedShipping = isPickup ? 0 : (parseFloat(shippingCost) || 0);
  const parsedDiscount = Math.min(100, Math.max(0, parseFloat(discountPercent) || 0));

  const totalAdditionalCharges = additionalCharges.reduce((sum, item) => {
    const amt = parseFloat(item.amount) || 0;
    return sum + amt;
  }, 0);

  // Per-book calculations breakdown
  const booksCalculatedList = books.map(b => {
    const costUSD = parseFloat(b.costUSD) || 0;
    const qty = Math.max(1, parseInt(b.quantity, 10) || 1);
    const totalCostJMD = costUSD * qty * parsedRate;
    const rawSellingPrice = totalCostJMD * (1 + (markupPercent / 100));
    const bookSubtotalJMD = roundingUnit > 0 ? Math.ceil(rawSellingPrice / roundingUnit) * roundingUnit : Math.ceil(rawSellingPrice);
    const unitPriceJMD = qty > 0 ? Math.round(bookSubtotalJMD / qty) : 0;

    return {
      ...b,
      parsedCostUSD: costUSD,
      parsedQty: qty,
      totalCostJMD,
      bookSubtotalJMD,
      unitPriceJMD
    };
  });

  // Aggregate totals
  const totalBooksSellingSubtotal = booksCalculatedList.reduce((sum, b) => sum + b.bookSubtotalJMD, 0);
  const totalBooksCount = booksCalculatedList.reduce((sum, b) => sum + b.parsedQty, 0);

  // Total quotation before discount
  const subtotalBeforeDiscount = totalBooksSellingSubtotal + parsedShipping + totalAdditionalCharges;
  const discountAmount = subtotalBeforeDiscount * (parsedDiscount / 100);
  const finalSellingPrice = Math.max(0, subtotalBeforeDiscount - discountAmount);

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
    // Multi-book itemized list
    const validBooksList = booksCalculatedList.filter(b => b.title.trim() !== "");

    const isMultiBook = validBooksList.length > 1;
    const multiBookTemplate = isMultiBook
      ? settings?.quoteTemplates?.find(t => t.active && (t.id === "tpl_multi_book_quote" || t.name.toLowerCase().includes("multi-book")))
      : null;

    const bookTemplate = multiBookTemplate || (settings?.quoteTemplates?.find(t => t.active && (t.toolKey === "book" || t.id === "tpl_book_quote" || t.id === "tpl_book_cost_calculator"))
      || DEFAULT_QUOTE_TEMPLATES.find(t => t.id === "tpl_book_quote"));

    const customerRespTpl = settings?.quoteTemplates?.find(t => t.active && t.id === "tpl_customer_response")
      || DEFAULT_QUOTE_TEMPLATES.find(t => t.id === "tpl_customer_response");
    const customerResponseStr = customerRespTpl?.content.trim() || "Thank you so much for providing those details.\n\nHere is your personalized quotation based on your request.";

    const deliveryMsg = (selectedDeliveryMethod?.messageTemplate || 
      "Your order will be dispatched via courier once your order has been processed. Collection details and tracking information will be provided once your order is ready for shipment.").trim();

    const methodName = selectedDeliveryMethod ? selectedDeliveryMethod.name : "Knutsford Express";
    
    // Multi-book itemized string
    const bookLines = validBooksList.map(b => `• ${b.title.trim()} ×${b.parsedQty} — ${formatJMDVal(b.bookSubtotalJMD)}`);
    const booksFormattedString = bookLines.length > 0
      ? bookLines.join("\n")
      : "• " + (books[0]?.title || "Book") + " — " + formatJMDVal(totalBooksSellingSubtotal);

    // Additional charges list
    const addChargeLines: string[] = [];
    additionalCharges.forEach((item) => {
      const amt = parseFloat(item.amount) || 0;
      if (item.name && amt > 0) {
        addChargeLines.push(`• ${item.name} — ${formatJMDVal(amt)}`);
      }
    });

    if (!isPickup && parsedShipping > 0) {
      addChargeLines.push(`• Delivery Fee (${methodName}) — ${formatJMDVal(parsedShipping)}`);
    }

    const addChargesStr = addChargeLines.join("\n");
    const hasDiscount = parsedDiscount > 0 && discountAmount > 0;

    const primaryBookName = validBooksList.length === 1 
      ? validBooksList[0].title 
      : validBooksList.length > 1 
        ? `${validBooksList[0].title} + ${validBooksList.length - 1} other title(s)` 
        : "Book Bundle";

    if (bookTemplate) {
      return formatQuoteTemplate(bookTemplate.content, {
        CustomerResponse: customerResponseStr,
        BookTitle: primaryBookName,
        BooksList: booksFormattedString,
        Quantity: totalBooksCount,
        QuantityUnit: totalBooksCount === 1 ? "Book" : "Books",
        UnitPrice: validBooksList.length === 1 ? formatJMDVal(validBooksList[0].unitPriceJMD) : "",
        BooksSubtotal: formatJMDVal(totalBooksSellingSubtotal),
        AdditionalCharges: addChargesStr,
        Destination: targetDestination,
        TargetDestination: targetDestination,
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
    sections.push("Thank you so much for providing those details.\n\nHere is your personalized quotation based on your request.");

    sections.push(`Books Selected\n${booksFormattedString}`);

    if (addChargesStr) {
      sections.push(`Additional Charges\n${addChargesStr}`);
    }

    sections.push(`Subtotal\n${formatJMDVal(totalBooksSellingSubtotal)}`);

    if (!isPickup) {
      sections.push(`Delivery\n${methodName}${parsedShipping > 0 ? ` (${formatJMDVal(parsedShipping)})` : ""}`);
    } else {
      sections.push(`Collection\n${methodName}`);
    }

    if (hasDiscount) {
      sections.push(`Discount (${parsedDiscount}%)\n-${formatJMDVal(discountAmount)}`);
    }

    sections.push(`Total\n${formatJMDVal(finalSellingPrice)}`);

    if (deliveryMsg) {
      sections.push(deliveryMsg);
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
    const validBooks = booksCalculatedList.filter(b => b.title.trim() !== "");
    const titleSummary = validBooks.length === 1
      ? `${validBooks[0].title} (${validBooks[0].parsedQty} ${validBooks[0].parsedQty === 1 ? 'copy' : 'copies'})`
      : `Librarium Multi-Book Bundle (${validBooks.length} titles, ${totalBooksCount} books total)`;

    const itemDetails = validBooks.map(b => ({
      name: `Book: ${b.title}`,
      quantity: b.parsedQty,
      unitPriceJMD: b.unitPriceJMD,
      subtotalJMD: b.bookSubtotalJMD
    }));

    if (!isPickup && parsedShipping > 0) {
      itemDetails.push({
        name: `Delivery: ${selectedDeliveryMethod?.name || 'Shipping'}`,
        quantity: 1,
        unitPriceJMD: parsedShipping,
        subtotalJMD: parsedShipping
      });
    }

    const newQuote: SavedQuotation = normalizeQuotation({
      id: "quote_" + Date.now(),
      quoteNumber: `BK-QT-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: "Bespoke Book Order",
      toolType: "book",
      title: titleSummary,
      date: new Date().toISOString().split("T")[0],
      totalCost: subtotalBeforeDiscount * 0.65,
      quotedPrice: finalSellingPrice,
      details: `${titleSummary} via ${selectedDeliveryMethod?.name || 'Delivery'}. Discount: ${parsedDiscount}%. Total: $${finalSellingPrice.toLocaleString()} JMD.`,
      summaryText: titleSummary,
      itemDetails,
      subtotalJMD: subtotalBeforeDiscount,
      discountPercent: parsedDiscount,
      discountAmountJMD: discountAmount,
      totalJMD: finalSellingPrice,
      formattedResponseText: getFormattedCustomerQuote(),
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

  const activeInventoryBooks = (inventory || []).filter(item => !item.archived);

  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm space-y-3.5 text-left animate-fade-in relative" id="book-cost-calculator-widget" ref={searchDropdownRef}>
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2.5 border-slate-100">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-slate-800" />
          Librarium Multi-Book Cost Calculator
        </span>
        <button
          onClick={handleReset}
          className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
          title="Reset calculator to defaults"
        >
          <RefreshCw className="w-2.5 h-2.5" />
          Reset
        </button>
      </div>

      {/* Global Setting: Compact Exchange Rate Display */}
      <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
          <DollarSign className="w-3.5 h-3.5 text-amber-600" />
          <span>Exchange Rate</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-600">1 USD =</span>
          <div className="relative w-24">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">J$</span>
            <input
              type="number"
              step="1"
              min="1"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              placeholder="160"
              className="w-full bg-white border border-slate-200/80 rounded-lg pl-6 pr-2 py-1 text-xs font-mono font-bold text-slate-900 focus:border-indigo-500 focus:outline-none transition-all text-right shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* MULTI-BOOK QUOTE BUILDER SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-rose-600" />
            Selected Books ({booksCalculatedList.length})
          </label>

          <button
            type="button"
            onClick={handleAddBook}
            className="text-[10px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/60 rounded-xl px-3 py-1.5 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Book</span>
          </button>
        </div>

        {/* LIST OF BOOK ROWS */}
        <div className="space-y-3">
          {booksCalculatedList.map((bookItem, index) => {
            const isSearching = activeSearchBookId === bookItem.id;
            const titleQuery = bookItem.title.trim().toLowerCase();
            const matchingSuggestions = titleQuery.length > 0 && activeInventoryBooks.length > 0
              ? activeInventoryBooks.filter(item => item.title.toLowerCase().includes(titleQuery))
              : [];

            return (
              <div 
                key={bookItem.id} 
                className="bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 rounded-2xl p-3.5 space-y-3 transition-all animate-fade-in relative group"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-extrabold text-[10px] flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      Book {index + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-rose-700 bg-rose-50 border border-rose-200/60 px-2.5 py-0.5 rounded-lg">
                      {formatJMD(bookItem.bookSubtotalJMD)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveBook(bookItem.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove this book from quote"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Book Title */}
                <div className="relative">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                    Book Title
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={bookItem.title}
                      onFocus={() => setActiveSearchBookId(bookItem.id)}
                      onChange={(e) => handleBookChange(bookItem.id, "title", e.target.value)}
                      placeholder="e.g. The 48 Laws of Power..."
                      className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-slate-400 focus:outline-none transition-all shadow-2xs"
                    />
                    {activeInventoryBooks.length > 0 && (
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>

                  {/* Auto-suggest dropdown popover */}
                  {isSearching && matchingSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100 animate-fade-in">
                      <div className="px-3 py-1.5 bg-slate-50 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Inventory Suggestions
                      </div>
                      {matchingSuggestions.map(invItem => (
                        <button
                          key={invItem.id}
                          type="button"
                          onClick={() => handleSelectInventoryBook(bookItem.id, invItem)}
                          className="w-full text-left px-3 py-2 hover:bg-rose-50/60 transition-colors flex justify-between items-center text-xs group/item cursor-pointer"
                        >
                          <span className="font-bold text-slate-800 group-hover/item:text-rose-900 truncate">
                            {invItem.title}
                          </span>
                          {invItem.sellingPrice && (
                            <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0 ml-2">
                              ${invItem.sellingPrice.toLocaleString()} JMD
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quantity & Cost USD */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Quantity */}
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                      Quantity
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Qty</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={bookItem.quantity}
                        onChange={(e) => handleBookChange(bookItem.id, "quantity", e.target.value)}
                        placeholder="1"
                        className="w-full bg-white border border-slate-200/80 rounded-xl pl-9 pr-2.5 py-2 text-xs font-mono font-bold text-slate-900 focus:border-slate-400 focus:outline-none transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Cost USD */}
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                      Cost (USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={bookItem.costUSD}
                        onChange={(e) => handleBookChange(bookItem.id, "costUSD", e.target.value)}
                        placeholder="30.00"
                        className="w-full bg-white border border-slate-200/80 rounded-xl pl-7 pr-2.5 py-2 text-xs font-mono font-bold text-slate-900 focus:border-slate-400 focus:outline-none transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {bookItem.parsedQty > 1 && (
                  <div className="text-[9px] font-bold text-slate-400 text-right font-mono pr-1">
                    {formatJMD(bookItem.unitPriceJMD)} per book
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DELIVERY & DISCOUNT OPTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
        {/* Delivery Method */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-indigo-600" />
            Delivery Method
          </label>
          <select
            value={deliveryMethodId}
            onChange={(e) => handleDeliveryMethodChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all cursor-pointer shadow-2xs"
          >
            {activeDeliveryMethods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Destination (Searchable/Editable Dropdown + Custom Library Addition) */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Destination
            </label>
            {!destinationList.includes(targetDestination.trim()) && targetDestination.trim().length > 0 && (
              <button
                type="button"
                onClick={() => handleSaveNewDestination(targetDestination)}
                className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                title="Add destination to saved library"
              >
                ➕
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              list="target-destinations-list"
              value={targetDestination}
              onChange={(e) => setTargetDestination(e.target.value)}
              placeholder="Type or select destination..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all shadow-2xs"
            />
            <datalist id="target-destinations-list">
              {destinationList.map((dest) => (
                <option key={dest} value={dest} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Shipping / Delivery Fee (JMD) */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block">
              Delivery Charge (JMD)
            </label>
            {isOverride && (
              <span className="text-[8px] font-black uppercase bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 tracking-wider">
                Modified
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
              className={`w-full border rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold transition-all focus:bg-white focus:border-indigo-600 focus:outline-none shadow-2xs ${
                isOverride 
                  ? "bg-amber-50/50 border-amber-300 text-amber-900" 
                  : "bg-slate-50 border-slate-200 text-slate-900"
              }`}
            />
          </div>
        </div>

        {/* Discount (%) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block">
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all shadow-2xs"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">
              %
            </span>
          </div>
        </div>

        {/* Additional Charges / Custom Fees Section */}
        <div className="space-y-2 col-span-1 sm:col-span-2 pt-2 border-t border-slate-100">
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
                    placeholder="Charge Name (e.g. Custom Bookmark, Packaging)"
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

      {/* Dynamic Summary Panel */}
      <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Bundle Cost Summary</span>
          <span className="text-[9px] font-bold text-slate-500 font-mono">
            {booksCalculatedList.length} {booksCalculatedList.length === 1 ? "title" : "titles"} ({totalBooksCount} books total)
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Books Subtotal ({totalBooksCount} {totalBooksCount === 1 ? "book" : "books"}):</span>
            <span className="font-mono font-semibold">{formatJMD(totalBooksSellingSubtotal)}</span>
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
        </div>
      </div>

      {/* Hero Output Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col justify-between items-center text-center shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
        
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
          Total Quotation Price
        </span>
        <div className="text-2xl font-black tracking-tight text-white mt-1 font-mono">
          {formatJMD(finalSellingPrice)}
        </div>
        
        {parsedDiscount > 0 && (
          <div className="text-[10px] text-emerald-300 font-bold mt-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Saved {parsedDiscount}% ({formatJMD(discountAmount)})
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

