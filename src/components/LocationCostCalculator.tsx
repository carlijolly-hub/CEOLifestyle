import React, { useState, useEffect } from "react";
import { Calculator, MapPin, RefreshCw, Info, Navigation, ArrowRightLeft, DollarSign, Copy, Check, FileText } from "lucide-react";
import { SystemSettings, SavedQuotation } from "../types";
import { DEFAULT_QUOTE_TEMPLATES, formatQuoteTemplate } from "../utils/settingsHelper";
import { normalizeQuotation } from "../utils/quotationUtils";
import { loadEnvironmentQuotations, saveEnvironmentQuotations } from "../utils/environmentUtils";

interface LocationCostCalculatorProps {
  settings?: SystemSettings;
}

export default function LocationCostCalculator({ settings }: LocationCostCalculatorProps) {
  // Use localStorage to persist the calculator values for a premium user experience
  const [locationName, setLocationName] = useState(() => {
    return localStorage.getItem("calc_loc_name") || "Kingston";
  });
  const [distance, setDistance] = useState(() => {
    return localStorage.getItem("calc_loc_distance") || "181";
  });
  const [costPerKm, setCostPerKm] = useState(() => {
    return localStorage.getItem("calc_loc_cost_per_km") || "75";
  });
  const [tollFee, setTollFee] = useState(() => {
    return localStorage.getItem("calc_loc_toll_fee") || "2400";
  });
  const [tripType, setTripType] = useState<"one_way" | "round_trip" | "no_toll">( () => {
    return (localStorage.getItem("calc_loc_trip_type") as any) || "round_trip";
  });
  const [discountPercent, setDiscountPercent] = useState(() => {
    return localStorage.getItem("calc_loc_discount") || "0";
  });

  // Copy state
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveQuotation = () => {
    const tripStr = tripType === "round_trip" ? "Round Trip" : tripType === "one_way" ? "One Way" : "Direct Delivery (No Toll)";
    const newQuote: SavedQuotation = normalizeQuotation({
      id: "quote_" + Date.now(),
      quoteNumber: `LOC-QT-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: `Delivery: ${locationName || 'Kingston'}`,
      toolType: "location",
      title: `Logistics Transport to ${locationName || 'Kingston'} (${parsedDistance} km)`,
      date: new Date().toISOString().split("T")[0],
      totalCost: subtotalCost * 0.7,
      quotedPrice: totalTravelCost,
      details: `Destination: ${locationName}, Distance: ${parsedDistance} km, Trip: ${tripStr}. Total: $${totalTravelCost.toLocaleString()} JMD.`,
      summaryText: `Logistics to ${locationName || 'Kingston'} (${tripStr})`,
      subtotalJMD: subtotalCost,
      discountPercent: parsedDiscount,
      discountAmountJMD: discountAmount,
      totalJMD: totalTravelCost,
      formattedResponseText: getCustomerResponseMessage(),
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

  // Persist values in localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("calc_loc_name", locationName);
    localStorage.setItem("calc_loc_distance", distance);
    localStorage.setItem("calc_loc_cost_per_km", costPerKm);
    localStorage.setItem("calc_loc_toll_fee", tollFee);
    localStorage.setItem("calc_loc_trip_type", tripType);
    localStorage.setItem("calc_loc_discount", discountPercent);
  }, [locationName, distance, costPerKm, tollFee, tripType, discountPercent]);

  // Reset to absolute standard defaults
  const handleReset = () => {
    setLocationName("Kingston");
    setDistance("181");
    setCostPerKm("75");
    setTollFee("2400");
    setTripType("round_trip");
    setDiscountPercent("0");
    setCopied(false);
  };

  // Parsed values
  const parsedDistance = parseFloat(distance) || 0;
  const parsedCostPerKm = parseFloat(costPerKm) || 0;
  const parsedTollFee = parseFloat(tollFee) || 0;
  const parsedDiscount = Math.min(100, Math.max(0, parseFloat(discountPercent) || 0));

  // Calculation Logic:
  // Distance Cost = Distance * Cost Per KM
  // Toll Cost: Round Trip = Toll * 2, One Way = Toll * 1, No Toll = 0
  const distanceCostTotal = parsedDistance * parsedCostPerKm;
  const tollMultiplier = tripType === "round_trip" ? 2 : tripType === "one_way" ? 1 : 0;
  const tollCostTotal = tripType === "no_toll" ? 0 : (parsedTollFee * tollMultiplier);
  
  const subtotalCost = distanceCostTotal + tollCostTotal;
  const discountAmount = subtotalCost * (parsedDiscount / 100);
  const totalTravelCost = Math.max(0, subtotalCost - discountAmount);

  // Format helper for JMD currency
  const formatJMD = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "JMD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const getCustomerResponseMessage = () => {
    const locTemplate = settings?.quoteTemplates?.find(t => t.active && (t.toolKey === "location" || t.id === "tpl_location_logistics_quote" || t.id === "tpl_location_logistics"))
      || DEFAULT_QUOTE_TEMPLATES.find(t => t.id === "tpl_location_logistics_quote");

    const customerRespTpl = settings?.quoteTemplates?.find(t => t.active && (t.id === "tpl_customer_response" || t.name === "Customer Response"))
      || DEFAULT_QUOTE_TEMPLATES.find(t => t.id === "tpl_customer_response");
    const customerResponseStr = customerRespTpl?.content.trim() || "Thank you so much for providing those details.\n\nHere is your personalized quotation based on your request.";

    const noTollText = tripType === "no_toll" ? " (No toll charges applied)." : "";
    const deliveryMsg = `Delivery to ${locationName || "your location"} is available for ${formatJMD(totalTravelCost)}.${noTollText}`;
    const serviceTierStr = tripType === "round_trip" ? "Round Trip (2x Toll)" : tripType === "one_way" ? "One Way (1x Toll)" : "No Toll Direct Delivery";
    const hasDiscount = parsedDiscount > 0 && discountAmount > 0;

    if (locTemplate) {
      return formatQuoteTemplate(locTemplate.content, {
        CustomerResponse: customerResponseStr,
        ParishLocation: locationName || "Kingston",
        ServiceTier: serviceTierStr,
        DiscountPercent: hasDiscount ? parsedDiscount : 0,
        DiscountAmount: hasDiscount ? formatJMD(discountAmount) : "",
        GrandTotal: formatJMD(totalTravelCost),
        DeliveryMethod: "Direct Dispatch",
        DeliveryMessage: deliveryMsg,
        BusinessName: settings?.companyName || "CEO Lifestyle"
      });
    }

    const sections: string[] = [];
    sections.push("Thank you so much for providing those details. Here is your personalized quote based on your request:");
    sections.push(`Logistics Details:\n* Location / Parish: ${locationName || "Kingston"}\n* Service Tier: ${serviceTierStr}`);

    if (hasDiscount) {
      sections.push(`Discount\n* You save ${parsedDiscount}% = ${formatJMD(discountAmount)}`);
    }

    sections.push(`Total: ${formatJMD(totalTravelCost)}`);
    sections.push(`Delivery Method: Direct Dispatch\n${deliveryMsg}`);
    sections.push("Let me know if you would like to proceed.");

    return sections.join("\n\n");
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(getCustomerResponseMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-5 text-left animate-fade-in" id="location-cost-calculator-widget">
      <div className="flex items-center justify-between border-b pb-3 border-slate-100">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <Navigation className="w-4 h-4 text-indigo-600" />
          Location Cost Calculator
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
        {/* Destination / Location Name (col-span-2) */}
        <div className="space-y-1.5 col-span-2">
          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Destination / Location Name
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <MapPin className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Kingston"
              className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Distance (KM) */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Distance (KM)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="181"
              className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-slate-400">
              KM
            </span>
          </div>
        </div>

        {/* Cost Per KM (JMD) */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Cost Per KM
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              J$
            </span>
            <input
              type="number"
              step="1"
              min="0"
              value={costPerKm}
              onChange={(e) => setCostPerKm(e.target.value)}
              placeholder="75"
              className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Toll Fee (JMD) */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Toll Fee (JMD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              J$
            </span>
            <input
              type="number"
              step="100"
              min="0"
              value={tollFee}
              onChange={(e) => setTollFee(e.target.value)}
              placeholder="2400"
              className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-slate-400 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Trip Direction */}
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Trip Direction
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setTripType("one_way")}
              className={`py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                tripType === "one_way"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              One Way
            </button>
            <button
              onClick={() => setTripType("round_trip")}
              className={`py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                tripType === "round_trip"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              Round Trip
            </button>
            <button
              onClick={() => setTripType("no_toll")}
              className={`py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                tripType === "no_toll"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              No Toll
            </button>
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
      </div>

      {/* Dynamic Summary Panel */}
      <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Cost Breakdown</span>
          <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest font-mono">
            {tripType === "one_way" ? "One Way (1x Toll)" : tripType === "round_trip" ? "Round Trip (2x Toll)" : "No Toll ($0 Toll)"}
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-700">
            <span>Distance Cost:</span>
            <div className="text-right">
              <span className="font-mono font-semibold">{formatJMD(distanceCostTotal)}</span>
              <span className="text-[9px] text-slate-400 block">({parsedDistance} KM × {formatJMD(parsedCostPerKm)})</span>
            </div>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Toll Cost:</span>
            <div className="text-right">
              <span className="font-mono font-semibold">{formatJMD(tollCostTotal)}</span>
              {tripType === "round_trip" && (
                <span className="text-[9px] text-slate-400 block">({formatJMD(parsedTollFee)} × 2)</span>
              )}
              {tripType === "one_way" && (
                <span className="text-[9px] text-slate-400 block">({formatJMD(parsedTollFee)})</span>
              )}
              {tripType === "no_toll" && (
                <span className="text-[9px] text-amber-600 font-bold block">(No Toll Applied)</span>
              )}
            </div>
          </div>

          {parsedDiscount > 0 && (
            <>
              <div className="flex justify-between text-slate-600 pt-1 border-t border-dashed border-slate-200">
                <span>Subtotal (Before Discount):</span>
                <span className="font-mono font-semibold text-slate-800">{formatJMD(subtotalCost)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Discount ({parsedDiscount}%):</span>
                <span className="font-mono">-{formatJMD(discountAmount)}</span>
              </div>
            </>
          )}

          <div className="flex justify-between text-slate-600 pb-1.5 border-b border-dashed border-slate-200">
            <span>Trip Type Option:</span>
            <span className="font-bold text-slate-700 flex items-center gap-0.5">
              <ArrowRightLeft className="w-3 h-3 text-indigo-500" /> {tripType === "round_trip" ? "Double Toll (Round-trip)" : tripType === "one_way" ? "Single Toll (One-way)" : "Zero Toll (No Toll)"}
            </span>
          </div>
        </div>
      </div>

      {/* Hero Output Banner */}
      <div className="bg-indigo-950 text-white rounded-2xl p-4 flex flex-col justify-between items-center text-center shadow-md relative overflow-hidden font-sans">
        {/* Subtle decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
        
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-300">
          Total Location Travel Cost
        </span>
        <div className="text-2xl font-black tracking-tight text-white mt-1 font-mono">
          {formatJMD(totalTravelCost)}
        </div>
        {parsedDiscount > 0 && (
          <div className="text-[10px] text-emerald-300 font-bold mt-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Saved {parsedDiscount}% ({formatJMD(discountAmount)})
          </div>
        )}
      </div>

      {/* Customer Response Message Card */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Customer Response</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveQuotation}
              className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded-md border ${
                savedSuccess
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400"
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-extrabold">Saved to Log!</span>
                </>
              ) : (
                <>
                  <FileText className="w-3 h-3 text-slate-950" />
                  <span>Save Quotation</span>
                </>
              )}
            </button>

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
        </div>
        <div className="bg-white border border-slate-100 p-3 rounded-xl text-[11px] text-slate-700 font-medium leading-relaxed font-sans select-all">
          "{getCustomerResponseMessage()}"
        </div>
      </div>
    </div>
  );
}
