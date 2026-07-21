import React, { useState, useEffect } from "react";
import { Calculator, MapPin, RefreshCw, Info, Navigation, ArrowRightLeft, DollarSign, Copy, Check } from "lucide-react";
import { SystemSettings } from "../types";

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
  const [tripType, setTripType] = useState<"one_way" | "round_trip">(() => {
    return (localStorage.getItem("calc_loc_trip_type") as "one_way" | "round_trip") || "round_trip";
  });

  // Copy state
  const [copied, setCopied] = useState(false);

  // Persist values in localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("calc_loc_name", locationName);
    localStorage.setItem("calc_loc_distance", distance);
    localStorage.setItem("calc_loc_cost_per_km", costPerKm);
    localStorage.setItem("calc_loc_toll_fee", tollFee);
    localStorage.setItem("calc_loc_trip_type", tripType);
  }, [locationName, distance, costPerKm, tollFee, tripType]);

  // Reset to absolute standard defaults
  const handleReset = () => {
    setLocationName("Kingston");
    setDistance("181");
    setCostPerKm("75");
    setTollFee("2400");
    setTripType("round_trip");
    setCopied(false);
  };

  // Parsed values
  const parsedDistance = parseFloat(distance) || 0;
  const parsedCostPerKm = parseFloat(costPerKm) || 0;
  const parsedTollFee = parseFloat(tollFee) || 0;

  // Calculation Logic:
  // One Way Formula: (Distance * Cost Per KM) + Toll Fee
  // Round Trip Formula: (Distance * Cost Per KM) + (Toll Fee * 2)
  const baseDistanceCost = parsedDistance * parsedCostPerKm;
  const distanceCostTotal = baseDistanceCost; // Same distance cost for both One Way and Round Trip
  
  const tollMultiplier = tripType === "round_trip" ? 2 : 1;
  const tollCostTotal = parsedTollFee * tollMultiplier;
  const totalTravelCost = distanceCostTotal + tollCostTotal;

  // Format helper for JMD currency
  const formatJMD = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "JMD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleCopyMessage = () => {
    const generatedMessage = `Delivery to ${locationName || "your location"} is available for ${formatJMD(totalTravelCost)}. Let me know if you would like to proceed.`;
    navigator.clipboard.writeText(generatedMessage);
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
        <div className="space-y-1.5">
          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Trip Direction
          </label>
          <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setTripType("one_way")}
              className={`py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                tripType === "one_way"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              One Way
            </button>
            <button
              onClick={() => setTripType("round_trip")}
              className={`py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                tripType === "round_trip"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              Round Trip
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Summary Panel */}
      <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Cost Breakdown</span>
          <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest font-mono">
            {tripType === "one_way" ? "One Way (1x)" : "Round Trip (2x)"}
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
            </div>
          </div>
          <div className="flex justify-between text-slate-600 pb-1.5 border-b border-dashed border-slate-200">
            <span>Trip Type Adjustment:</span>
            <span className="font-bold text-slate-700 flex items-center gap-0.5">
              <ArrowRightLeft className="w-3 h-3 text-indigo-500" /> {tripType === "round_trip" ? "Double Toll (Round-trip)" : "Single Toll (One-way)"}
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
          "Delivery to {locationName || "your location"} is available for {formatJMD(totalTravelCost)}. Let me know if you would like to proceed."
        </div>
      </div>
    </div>
  );
}
