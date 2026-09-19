import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Copy, 
  Check, 
  MessageSquareQuote, 
  Building2, 
  BookOpen, 
  Search, 
  Filter, 
  FileText, 
  Sparkles, 
  Clock, 
  User, 
  AlertCircle,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { OperationsOrder, Client, SystemSettings, SystemQuoteTemplate } from "../types";
import { DEFAULT_QUOTE_TEMPLATES, formatQuoteTemplate, getSystemSettings } from "../utils/settingsHelper";
import { isAdventistCommunicationRestricted } from "../utils/adventistGuard";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

interface OperationsCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OperationsOrder | null;
  clients: Client[];
  settings?: SystemSettings;
  onOpenCommunicationsLibrary?: () => void;
}

export const OperationsCommunicationModal: React.FC<OperationsCommunicationModalProps> = ({
  isOpen,
  onClose,
  order,
  clients,
  settings,
  onOpenCommunicationsLibrary
}) => {
  useBodyScrollLock(isOpen);

  // Business company context
  const company: "CEO Lifestyle" | "Librarium Luxe" = useMemo(() => {
    if (!order) return "CEO Lifestyle";
    if (order.company === "Librarium Luxe" || order.company === "CEO Lifestyle") {
      return order.company;
    }
    if (order.clientHome === "Librarium Luxe") return "Librarium Luxe";
    const itemsStr = typeof order.items === "string" 
      ? order.items 
      : (Array.isArray(order.items) ? order.items.map(i => i.productName || "").join(" ") : "");
    if (/book|hardcover|paperback|novel|author|librarium/i.test(itemsStr)) {
      return "Librarium Luxe";
    }
    return "CEO Lifestyle";
  }, [order]);

  const isLuxe = company === "Librarium Luxe";

  // Match Client
  const clientObj = useMemo(() => {
    if (!order) return null;
    return clients.find(c => 
      c.id === order.clientId || 
      `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase() === (order.clientName || '').trim().toLowerCase()
    ) || null;
  }, [order, clients]);

  // Adventist Check
  const isAdventistRestricted = useMemo(() => {
    if (!order) return false;
    const isAdv = order.adventist === "Yes" || clientObj?.adventist === "Yes";
    return isAdv && isAdventistCommunicationRestricted("Yes");
  }, [order, clientObj]);

  // Prepare Items & Variable Map
  const orderDataMap = useMemo(() => {
    if (!order) return {};
    const rawItems = Array.isArray(order.items) ? order.items : [];
    const itemSummary = Array.isArray(order.items)
      ? order.items.map(i => `${i.quantity}x ${i.productName}${i.colour ? ` (${i.colour})` : ''}${i.size ? ` [${i.size}]` : ''}`).join(", ")
      : (order.items || "");

    const firstItem = rawItems[0];
    const depositVal = typeof order.depositAmount === "number" ? order.depositAmount : (order.depositPaid ? (order.totalAmount || 0) : 0);
    const totalVal = order.totalAmount || 0;
    const balanceDueVal = Math.max(0, totalVal - depositVal);

    // Book-specific vs General merchandise
    const bookTitle = isLuxe 
      ? (firstItem ? firstItem.productName : (typeof order.items === "string" ? order.items : "Curated Selection"))
      : "";
    const booksList = isLuxe && rawItems.length > 0
      ? rawItems.map(i => {
          const cost = i.unitPrice ?? (i as any).itemCost;
          return `* ${i.quantity}x ${i.productName}${cost ? ` — JMD $${Number(cost).toLocaleString()}` : ''}`;
        }).join("\n")
      : (bookTitle ? `* ${order.quantityTotal || 1}x ${bookTitle}` : "");

    const garmentItems = !isLuxe && rawItems.length > 0
      ? rawItems.map(i => {
          const cost = i.unitPrice ?? (i as any).itemCost;
          const varDetails = [i.colour, i.size].filter(Boolean).join(" - ");
          return `* ${i.quantity}x ${i.productName}${varDetails ? ` (${varDetails})` : ''}${cost ? ` — JMD $${Number(cost).toLocaleString()}` : ''}`;
        }).join("\n")
      : (!isLuxe ? itemSummary : "");

    const firstCost = firstItem ? (firstItem.unitPrice ?? (firstItem as any).itemCost) : undefined;
    const firstColor = firstItem?.color || firstItem?.colour || (!isLuxe ? "Standard" : "");
    const firstSubColor = firstItem?.substituteColor || firstItem?.substituteColour || "None specified";
    const firstSize = firstItem?.size || (!isLuxe ? "Standard" : "");
    const firstCustomization = firstItem?.customization || firstItem?.notes || "None";
    const firstDescription = firstItem?.itemDescription || firstItem?.details || firstItem?.productName || itemSummary;
    const phoneContact = order.clientPhone || clientObj?.contact?.phoneNumber || "N/A";
    const orderTotalStr = totalVal > 0 ? `JMD $${totalVal.toLocaleString()}` : "$0";
    const depositStr = depositVal > 0 ? `JMD $${depositVal.toLocaleString()}` : (order.depositPaid ? orderTotalStr : "Pending");
    const balanceStr = balanceDueVal > 0 ? `JMD $${balanceDueVal.toLocaleString()}` : "Settled (JMD $0)";

    return {
      CustomerName: order.clientName || clientObj?.firstName || "Valued Client",
      ClientName: order.clientName || clientObj?.firstName || "Valued Client",
      customer_name: order.clientName || clientObj?.firstName || "Valued Client",
      client_name: order.clientName || clientObj?.firstName || "Valued Client",
      Company: company,
      BusinessName: company,
      businessName: company,
      company_name: company,
      OrderNumber: order.orderNumber || order.id,
      order_number: order.orderNumber || order.id,
      DueDate: order.dueDate || "TBD",
      dueDate: order.dueDate || "TBD",
      TargetDueDate: order.dueDate || "TBD",
      target_due_date: order.dueDate || "TBD",
      OrderDate: order.dateOrderCreated || order.createdDate || order.orderDate || "",
      QuoteDate: order.dateOrderCreated || order.orderDate || "",
      DeliveryMethod: order.deliveryMethod || "Store Pickup",
      deliveryMethod: order.deliveryMethod || "Store Pickup",
      delivery_method: order.deliveryMethod || "Store Pickup",
      DeliveryLocation: order.deliveryLocation || "Office",
      delivery_location: order.deliveryLocation || "Office",
      Location: order.deliveryLocation || "Office",
      Destination: order.deliveryLocation || "Office",
      TargetDestination: order.deliveryLocation || "Office",
      PickupLocation: order.deliveryLocation || (isLuxe ? "Librarium Luxe Desk" : "Fresh Drip Outlet"),
      DeliveryInformation: `${order.deliveryMethod || "Store Pickup"} • Location: ${order.deliveryLocation || "Office / Desk"}`,
      DeliveryInfo: `${order.deliveryMethod || "Store Pickup"} (${order.deliveryLocation || "Office / Desk"})`,
      delivery_info: `${order.deliveryMethod || "Store Pickup"} (${order.deliveryLocation || "Office / Desk"})`,
      GrandTotal: orderTotalStr,
      OrderTotal: orderTotalStr,
      order_total: orderTotalStr,
      total_amount: orderTotalStr,
      TotalAmount: orderTotalStr,
      Subtotal: orderTotalStr,
      DepositAmount: depositStr,
      DepositPaid: depositStr,
      deposit_paid: depositStr,
      deposit_amount: depositStr,
      BalanceDue: balanceStr,
      balance_due: balanceStr,
      PaymentInformation: `Total: ${orderTotalStr} | Deposit: ${depositStr} | Balance Due: ${balanceStr}`,
      PaymentInfo: `Total: ${orderTotalStr} | Deposit: ${depositStr} | Balance Due: ${balanceStr}`,
      payment_info: `Total: ${orderTotalStr} | Deposit: ${depositStr} | Balance Due: ${balanceStr}`,
      ProductionStatus: order.productionStatus || "New",
      ClientTier: order.clientTier || clientObj?.tier || "Silver",
      Priority: order.priority || "Normal",
      AssignedStaff: order.assignedStaff || "Operations Team",
      InternalNotes: order.internalNotes || "",
      PhoneContact: phoneContact,
      phone_contact: phoneContact,
      Phone: phoneContact,
      phone: phoneContact,
      ClientPhone: phoneContact,
      ItemTitle: isLuxe ? bookTitle : itemSummary,
      Product: itemSummary || (isLuxe ? "Curated Edition" : "Bespoke Apparel"),
      product: itemSummary || (isLuxe ? "Curated Edition" : "Bespoke Apparel"),
      ItemDescription: firstDescription,
      item_description: firstDescription,
      Quantity: order.quantityTotal || 1,
      quantity: order.quantityTotal || 1,
      QuantityUnit: isLuxe ? "copies" : "units",
      Color: firstColor,
      color: firstColor,
      Colour: firstColor,
      colour: firstColor,
      SubstituteColor: firstSubColor,
      substitute_color: firstSubColor,
      SubstituteColour: firstSubColor,
      substitute_colour: firstSubColor,
      Size: firstSize,
      size: firstSize,
      Customization: firstCustomization,
      customization: firstCustomization,
      UnitPrice: firstCost ? `JMD $${Number(firstCost).toLocaleString()}` : "",
      BooksSubtotal: orderTotalStr,
      BookTitle: bookTitle || "Curated Edition",
      BookTitles: bookTitle || "Curated Edition",
      book_title: bookTitle || "Curated Edition",
      book_titles: bookTitle || "Curated Edition",
      BookPrice: firstCost ? `JMD $${Number(firstCost).toLocaleString()}` : orderTotalStr,
      book_price: firstCost ? `JMD $${Number(firstCost).toLocaleString()}` : orderTotalStr,
      BundleInfo: rawItems.length > 1 ? `${rawItems.length}-Volume Bespoke Literary Collection` : (firstItem?.details || "Single Curated Volume"),
      bundle_info: rawItems.length > 1 ? `${rawItems.length}-Volume Bespoke Literary Collection` : (firstItem?.details || "Single Curated Volume"),
      Availability: isLuxe ? "Reserved in Archival Vault / Literary Import" : "In Stock",
      availability: isLuxe ? "Reserved in Archival Vault / Literary Import" : "In Stock",
      BooksList: booksList,
      GarmentItems: garmentItems,
      StockStatus: isLuxe ? "Reserved in Archival Vault / Literary Import" : "In Stock",
      CustomerResponse: `Thank you for choosing ${company}.`
    };
  }, [order, clientObj, company, isLuxe]);

  // Quick Order Summary text (business-aware)
  const quickSummaryText = useMemo(() => {
    if (!order) return "";
    const itemsSummary = Array.isArray(order.items)
      ? order.items.map(i => `${i.quantity}x ${i.productName}${i.colour ? ` (${i.colour})` : ''}${i.size ? ` [${i.size}]` : ''}`).join(", ")
      : (order.items || "");
    const deposit = typeof order.depositAmount === "number" ? order.depositAmount : (order.depositPaid ? (order.totalAmount || 0) : 0);
    const balance = Math.max(0, (order.totalAmount || 0) - deposit);

    if (isLuxe) {
      return `*LIBRARIUM LUXE BOOK ACQUISITION UPDATE*
Order Reference: ${order.orderNumber}
Company: Librarium Luxe
Client: ${order.clientName} (${order.clientTier || "Silver"} Tier)
Phone: ${order.clientPhone || clientObj?.contact.phoneNumber || "N/A"}
Curated Volumes: ${itemsSummary}
Acquisition Total: JMD $${(order.totalAmount || 0).toLocaleString()}
${deposit > 0 ? `Deposit Paid: JMD $${deposit.toLocaleString()}` : 'Deposit: Pending'}
${balance > 0 ? `Balance Due: JMD $${balance.toLocaleString()}` : 'Balance: Settled'}
Fulfillment Status: ${order.productionStatus}
Invoice Logged: ${order.invoiceLogged ? "Yes (Verified)" : "No (Pending)"}
Target Availability Date: ${order.dueDate || "N/A"}
Delivery / Collection: ${order.deliveryMethod} (${order.deliveryLocation || "Librarium Luxe Desk"})
${order.expressOrder === "Yes" ? `Express Curatorial Rush: Yes (${order.expressNote || "Priority handling"})` : ""}
${order.internalNotes ? `Curatorial Notes: ${order.internalNotes}` : ""}`.trim();
    } else {
      return `*CEO LIFESTYLE OPERATIONS ORDER UPDATE*
Order Number: ${order.orderNumber}
Company: CEO Lifestyle
Client: ${order.clientName} (${order.clientTier || "Silver"} Tier)
Phone: ${order.clientPhone || clientObj?.contact.phoneNumber || "N/A"}
Products: ${itemsSummary}
Cost of Order: JMD $${(order.totalAmount || 0).toLocaleString()}
${deposit > 0 ? `Deposit Paid: JMD $${deposit.toLocaleString()}` : 'Deposit: Pending'}
${balance > 0 ? `Balance Due: JMD $${balance.toLocaleString()}` : 'Balance: Settled'}
Status: ${order.productionStatus}
Invoice Logged: ${order.invoiceLogged ? "Yes (Verified)" : "No (Pending)"}
Due Date: ${order.dueDate || "N/A"}
Delivery Method: ${order.deliveryMethod} (${order.deliveryLocation || "Fresh Drip Outlet"})
Express Order: ${order.expressOrder || "No"}${order.expressOrder === "Yes" && order.expressNote ? ` (${order.expressNote})` : ""}
${order.internalNotes ? `Internal Notes: ${order.internalNotes}` : ""}`.trim();
    }
  }, [order, clientObj, isLuxe]);

  // Retrieve templates from Central Communications Library
  const allTemplates: SystemQuoteTemplate[] = useMemo(() => {
    const activeSettings = settings || getSystemSettings();
    return activeSettings.quoteTemplates || DEFAULT_QUOTE_TEMPLATES;
  }, [settings]);

  // Filter templates strictly for the operational Company context from the Client Communication Library
  const companyTemplates = useMemo(() => {
    return allTemplates.filter(tpl => {
      if (!tpl.active) return false;
      const tplCompany = tpl.company || tpl.businessHome || "CEO Lifestyle";
      if (tplCompany === "Both" || tplCompany === "All") return true;
      if (isLuxe) {
        return tplCompany === "Librarium Luxe" || tpl.category === "LIBRARIUM LUXE";
      } else {
        return tplCompany === "CEO Lifestyle" && tpl.category !== "LIBRARIUM LUXE";
      }
    });
  }, [allTemplates, isLuxe]);

  // Primary Order Details template resolved from Communication Library:
  // Strictly matches: Company + Location ('Operations Dashboard') + Category ('ORDER DETAILS')
  const primaryOrderDetailsTemplate = useMemo(() => {
    const strictMatch = companyTemplates.find(tpl => {
      const isOrderDetails = (tpl.category || "").toUpperCase().replace(/\s+/g, "_") === "ORDER_DETAILS" || (tpl.category || "").toUpperCase() === "ORDER DETAILS";
      const isOperationsLocation = tpl.location === "Operations Dashboard" || (tpl.location && tpl.location.includes("Operations"));
      return isOrderDetails && isOperationsLocation;
    });
    if (strictMatch) return strictMatch;

    const catMatch = companyTemplates.find(tpl => {
      return (tpl.category || "").toUpperCase().replace(/\s+/g, "_") === "ORDER_DETAILS" || (tpl.category || "").toUpperCase() === "ORDER DETAILS";
    });
    if (catMatch) return catMatch;

    return companyTemplates[0] || null;
  }, [companyTemplates]);

  // Categories for the filter chips - prioritizes ORDER DETAILS
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    companyTemplates.forEach(t => {
      if (t.category) cats.add(t.category);
    });
    const arr = Array.from(cats);
    const sorted = arr.sort((a, b) => {
      const isAOrder = a.toUpperCase().includes("ORDER");
      const isBOrder = b.toUpperCase().includes("ORDER");
      if (isAOrder && !isBOrder) return -1;
      if (!isAOrder && isBOrder) return 1;
      return a.localeCompare(b);
    });
    return ["ALL", ...sorted];
  }, [companyTemplates]);

  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => primaryOrderDetailsTemplate?.id || "quick_summary");
  const [editedContent, setEditedContent] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Automatically select the primary Order Details template when modal opens or order changes
  useEffect(() => {
    if (isOpen) {
      if (primaryOrderDetailsTemplate) {
        setSelectedTemplateId(primaryOrderDetailsTemplate.id);
      } else {
        setSelectedTemplateId("quick_summary");
      }
    }
  }, [isOpen, order?.id, primaryOrderDetailsTemplate]);

  // Filtered template list
  const filteredTemplates = useMemo(() => {
    return companyTemplates.filter(tpl => {
      if (selectedCategory !== "ALL" && tpl.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = tpl.name.toLowerCase().includes(q);
        const matchDesc = (tpl.description || "").toLowerCase().includes(q);
        const matchContent = (tpl.content || "").toLowerCase().includes(q);
        const matchLoc = (tpl.location || "").toLowerCase().includes(q);
        return matchName || matchDesc || matchContent || matchLoc;
      }
      return true;
    });
  }, [companyTemplates, selectedCategory, searchQuery]);

  // When selected template changes, format and populate
  useEffect(() => {
    if (selectedTemplateId === "quick_summary") {
      setEditedContent(quickSummaryText);
    } else {
      const found = companyTemplates.find(t => t.id === selectedTemplateId);
      if (found) {
        const formatted = formatQuoteTemplate(found.content, orderDataMap);
        setEditedContent(formatted);
      }
    }
  }, [selectedTemplateId, quickSummaryText, companyTemplates, orderDataMap]);

  if (!isOpen || !order) return null;

  const handleCopy = () => {
    if (!editedContent) return;
    navigator.clipboard.writeText(editedContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isLuxe ? "bg-emerald-950 text-white border-emerald-900" : "bg-slate-950 text-white border-slate-900"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              isLuxe ? "bg-emerald-800/80 text-amber-300 border border-emerald-700" : "bg-slate-800 text-blue-400 border border-slate-700"
            }`}>
              <MessageSquareQuote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black tracking-tight">Operations Communication Templates</h3>
                {/* COMPANY BADGE */}
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide uppercase flex items-center gap-1.5 shadow-2xs ${
                  isLuxe 
                    ? "bg-amber-400 text-emerald-950 border border-amber-300" 
                    : "bg-blue-500 text-white border border-blue-400"
                }`}>
                  {isLuxe ? <BookOpen className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                  <span>{company}</span>
                </span>

                {/* Client Home reference badge if Client profile has Home */}
                {clientObj?.clientHome && (
                  <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
                    Client Profile Home: {clientObj.clientHome}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Order <span className="font-bold text-white">#{order.orderNumber}</span> • {order.clientName} • Showing only <strong className="text-white">{company}</strong> communication templates
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ADVENTIST SABBATH GUARD ALERT */}
        {isAdventistRestricted && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-950 font-bold">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Adventist Interaction Protection is active. Please avoid sending client messages during Sabbath hours (Friday sunset to Saturday night).</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-black">
              Sabbath Restricted
            </span>
          </div>
        )}

        {/* MAIN MODAL BODY: 2 COLUMNS */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* LEFT COLUMN: TEMPLATE LIST & SELECTOR (md:col-span-5) */}
          <div className="md:col-span-5 border-r border-slate-200/90 flex flex-col bg-slate-50/70 overflow-hidden">
            {/* SEARCH & FILTER BAR */}
            <div className="p-3.5 border-b border-slate-200 space-y-2 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search ${company} templates...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className={`px-2.5 py-1 rounded-lg font-extrabold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === "ALL"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All ({companyTemplates.length + 1})
                </button>
                {availableCategories.filter(c => c !== "ALL").map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* TEMPLATE LIST */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* Special Card: Quick Order Summary */}
              <button
                type="button"
                onClick={() => setSelectedTemplateId("quick_summary")}
                className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-2 shadow-2xs ${
                  selectedTemplateId === "quick_summary"
                    ? isLuxe 
                      ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20" 
                      : "bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20"
                    : "bg-white hover:bg-slate-100/80 border-slate-200"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className={`w-3.5 h-3.5 ${isLuxe ? "text-emerald-600" : "text-blue-600"}`} />
                    <span className="text-xs font-black text-slate-900">
                      {isLuxe ? "Librarium Luxe Quick Summary" : "CEO Lifestyle Quick Summary"}
                    </span>
                    <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                      One-Click
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {isLuxe 
                      ? "Complete operational brief: curated volumes, acquisition totals, deposit, and delivery."
                      : "Standard operational brief: customer info, garments/products, deposit, and due date."}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 shrink-0 mt-1 ${selectedTemplateId === "quick_summary" ? "text-slate-900" : "text-slate-300"}`} />
              </button>

              {/* Template Items */}
              {filteredTemplates.map(tpl => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-2 shadow-2xs ${
                      isSelected
                        ? isLuxe 
                          ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20" 
                          : "bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20"
                        : "bg-white hover:bg-slate-100/80 border-slate-200"
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {tpl.name}
                        </span>
                        {tpl.id === primaryOrderDetailsTemplate?.id && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 shrink-0">
                            Primary
                          </span>
                        )}
                      </div>

                      {/* Operational Badges: Company, Category, Location */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-semibold">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200/70 font-mono">
                          {tpl.company || tpl.businessHome || company}
                        </span>
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                          {tpl.category}
                        </span>
                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-100">
                          {tpl.location || "Operations Dashboard"}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 mt-1 ${isSelected ? "text-slate-900" : "text-slate-300"}`} />
                  </button>
                );
              })}

              {filteredTemplates.length === 0 && selectedTemplateId !== "quick_summary" && (
                <div className="p-6 text-center text-slate-400 space-y-1 text-xs">
                  <p className="font-bold text-slate-600">No templates found matching "{searchQuery}"</p>
                  <p>Try searching for a different keyword or select another category.</p>
                </div>
              )}
            </div>

            {/* Footer with link to Central Communications Library */}
            {onOpenCommunicationsLibrary && (
              <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Want to edit or add templates?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCommunicationsLibrary();
                  }}
                  className="text-slate-900 hover:text-blue-600 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Communications Library</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: PREVIEW, CUSTOMIZATION & COPY (md:col-span-7) */}
          <div className="md:col-span-7 flex flex-col bg-white overflow-hidden">
            {/* PREVIEW TOOLBAR */}
            <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                  {selectedTemplateId === "quick_summary" 
                    ? "Quick Order Brief Preview" 
                    : (companyTemplates.find(t => t.id === selectedTemplateId)?.name || "Template Preview")}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    copied
                      ? "bg-emerald-600 text-white"
                      : isLuxe
                        ? "bg-emerald-900 hover:bg-emerald-800 text-amber-200"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Template</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* PREVIEW & EDITABLE CONTENT */}
            <div className="flex-1 p-6 flex flex-col space-y-3 overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Variables automatically populated from operational record:</span>
                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {editedContent.length} characters
                </span>
              </div>

              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono leading-relaxed text-slate-900 focus:outline-none focus:border-slate-800 resize-none selection:bg-amber-200"
                placeholder="Template content will appear here..."
              />

              {/* POPULATED VARIABLE TAGS */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Injected Context:</span>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  Company: {company}
                </span>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  Client: {order.clientName}
                </span>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  Order #{order.orderNumber}
                </span>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  Due: {order.dueDate || "N/A"}
                </span>
                {order.totalAmount && (
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                    Total: JMD ${order.totalAmount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Tip: You can edit or fine-tune the message above before copying.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    copied
                      ? "bg-emerald-600 text-white"
                      : isLuxe
                        ? "bg-emerald-900 hover:bg-emerald-800 text-amber-200"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy for Messaging</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OperationsCommunicationModal;
