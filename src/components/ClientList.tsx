import React, { useState, useMemo } from "react";
import { Client, ClientTier, HomeBrand } from "../types";
import { parseMonthDay, getDaysRemaining } from "../utils/dateHelpers";
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Sparkles, 
  UserPlus, 
  Check, 
  X,
  CreditCard,
  Briefcase,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Smartphone,
  Mail,
  Calendar,
  DollarSign,
  Megaphone,
  Trash2,
  Archive,
  RefreshCw
} from "lucide-react";

interface ClientListProps {
  clients: Client[];
  selectedClientId: string | null;
  onSelectClient: (clientId: string) => void;
  onAddNewClient: () => void;
  onDeleteClient?: (clientId: string) => void;
}

export default function ClientList({ 
  clients, 
  selectedClientId, 
  onSelectClient,
  onAddNewClient,
  onDeleteClient
}: ClientListProps) {
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [showDeactivated, setShowDeactivated] = useState<boolean>(false);
  
  // Filter panel toggle
  const [showFilters, setShowFilters] = useState(false);

  // Filters state
  const [filterBrand, setFilterBrand] = useState<string>("All");
  const [filterTier, setFilterTier] = useState<string>("All");
  const [filterCountry, setFilterCountry] = useState<string>("All");
  const [filterParish, setFilterParish] = useState<string>("All");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterFrequency, setFilterFrequency] = useState<string>("All");
  const [filterValue, setFilterValue] = useState<string>("All");
  const [filterUpcoming, setFilterUpcoming] = useState<string>("All");
  const [filterMarketing, setFilterMarketing] = useState<string>("All");

  // Get unique lists for filter select dropdowns
  const countries = useMemo(() => {
    const list = new Set(clients.map(c => c.contact.country).filter(Boolean));
    return ["All", ...Array.from(list)];
  }, [clients]);

  const parishes = useMemo(() => {
    const list = new Set(clients.map(c => c.contact.parish).filter(p => p && p !== "N/A"));
    return ["All", "N/A", ...Array.from(list)];
  }, [clients]);

  const productCategories = useMemo(() => {
    const categories = new Set<string>();
    clients.forEach(c => {
      c.history.preferredCategories.forEach(cat => categories.add(cat));
    });
    return ["All", ...Array.from(categories)];
  }, [clients]);

  // Handle clearing all filters
  const resetFilters = () => {
    setFilterBrand("All");
    setFilterTier("All");
    setFilterCountry("All");
    setFilterParish("All");
    setFilterCategory("All");
    setFilterFrequency("All");
    setFilterValue("All");
    setFilterUpcoming("All");
    setFilterMarketing("All");
    setSearchTerm("");
  };

  // Filter and Search execution logic
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // 0. Deactivation status filter
      const isDeactivated = !!client.deactivated;
      if (showDeactivated !== isDeactivated) return false;

      // 1. Plain text search matching name, email, phone, city, occupation, notes
      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        fullName.includes(searchLower) ||
        client.id.toLowerCase().includes(searchLower) ||
        client.contact.email.toLowerCase().includes(searchLower) ||
        client.contact.phoneNumber.includes(searchLower) ||
        client.contact.city.toLowerCase().includes(searchLower) ||
        client.occupation.toLowerCase().includes(searchLower) ||
        client.profile.personalNotes.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // 2. Brand Filter
      if (filterBrand !== "All") {
        if (filterBrand === "CEO Printing Services") {
          if (client.homeBrand !== "CEO Printing Services" && client.homeBrand !== "CEO Lifestyle") return false;
        } else if (filterBrand === "Librarium Luxe") {
          if (client.homeBrand !== "Librarium Luxe" && client.homeBrand !== "CEO Lifestyle") return false;
        } else if (filterBrand === "CEO Lifestyle") {
          if (client.homeBrand !== "CEO Lifestyle") return false;
        }
      }

      // 3. Tier Filter
      if (filterTier !== "All" && client.tier !== filterTier) return false;

      // 4. Country Filter
      if (filterCountry !== "All" && client.contact.country !== filterCountry) return false;

      // 5. Parish Filter
      if (filterParish !== "All" && client.contact.parish !== filterParish) return false;

      // 6. Category Filter
      if (filterCategory !== "All") {
        const hasCategory = client.history.preferredCategories.some(cat => cat.toLowerCase() === filterCategory.toLowerCase());
        if (!hasCategory) return false;
      }

      // 7. Order Frequency Filter
      if (filterFrequency !== "All") {
        const total = client.history.totalOrders;
        if (filterFrequency === "1") {
          if (total !== 1) return false;
        } else if (filterFrequency === "2-5") {
          if (total < 2 || total > 5) return false;
        } else if (filterFrequency === "5-10") {
          if (total < 5 || total > 10) return false;
        } else if (filterFrequency === "10+") {
          if (total < 10) return false;
        }
      }

      // 8. Client Value (LTV in JMD)
      if (filterValue !== "All") {
        const ltv = client.history.lifetimeRevenue;
        if (filterValue === "vip_tier") {
          if (ltv < 500000) return false;
        } else if (filterValue === "high_tier") {
          if (ltv < 200000 || ltv >= 500000) return false;
        } else if (filterValue === "medium_tier") {
          if (ltv < 50000 || ltv >= 200000) return false;
        } else if (filterValue === "standard_tier") {
          if (ltv >= 50000) return false;
        }
      }

      // 9. Upcoming Events (Next 30 days)
      if (filterUpcoming !== "All") {
        const hasUpcomingEvent = client.importantDates.some(d => {
          const parsed = parseMonthDay(d.date);
          if (parsed) {
            const days = getDaysRemaining(parsed.month, parsed.day);
            return days >= 0 && days <= 30;
          }
          return false;
        });
        if (filterUpcoming === "yes" && !hasUpcomingEvent) return false;
        if (filterUpcoming === "no" && hasUpcomingEvent) return false;
      }

      // 10. Marketing Permission
      if (filterMarketing !== "All") {
        const hasOptedIn = client.marketingPermission !== "No";
        if (filterMarketing === "Yes" && !hasOptedIn) return false;
        if (filterMarketing === "No" && hasOptedIn) return false;
      }

      return true;
    });
  }, [
    clients,
    searchTerm,
    filterBrand,
    filterTier,
    filterCountry,
    filterParish,
    filterCategory,
    filterFrequency,
    filterValue,
    filterUpcoming,
    filterMarketing,
    showDeactivated
  ]);

  // Money formatting
  const formatCurrency = (val: number) => {
    return `J$${Math.round(val).toLocaleString()}`;
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Search Bar & Action Buttons */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients by name, ID, phone, city, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 shadow-sm transition-all font-medium"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-2.5 items-stretch flex-wrap md:flex-nowrap">
          {/* DEACTIVATED ARCHIVE TOGGLE */}
          <button
            onClick={() => setShowDeactivated(!showDeactivated)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl border transition-all ${
              showDeactivated 
                ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100/50" 
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
            }`}
            title="Toggle between active and inactive/deactivated client profiles"
          >
            <Archive className="w-4 h-4" />
            {showDeactivated ? "Show Active Profiles" : "Show Deactivated Archive"}
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all ${
              showFilters || [filterBrand, filterTier, filterCountry, filterParish, filterCategory, filterFrequency, filterValue, filterUpcoming, filterMarketing].some(v => v !== "All")
                ? "bg-slate-100 border-slate-900 text-slate-900"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {/* Filter Count badge */}
            {[filterBrand, filterTier, filterCountry, filterParish, filterCategory, filterFrequency, filterValue, filterUpcoming, filterMarketing].filter(v => v !== "All").length > 0 && (
              <span className="bg-slate-900 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                {[filterBrand, filterTier, filterCountry, filterParish, filterCategory, filterFrequency, filterValue, filterUpcoming, filterMarketing].filter(v => v !== "All").length}
              </span>
            )}
          </button>

          <button
            onClick={onAddNewClient}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            Add Client
          </button>
        </div>
      </div>

      {/* Advanced Filter drawer */}
      {showFilters && (
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 md:p-6 space-y-4 animate-fade-in text-left">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Refine Client Directory</h3>
            <button 
              onClick={resetFilters}
              className="text-slate-600 hover:text-slate-900 text-[11px] font-semibold flex items-center gap-1 hover:underline"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Brand */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Home Brand</label>
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none focus:border-slate-800"
              >
                <option value="All">All Brands</option>
                <option value="CEO Printing Services">CEO Printing Services</option>
                <option value="Librarium Luxe">Librarium Luxe</option>
                <option value="CEO Lifestyle">CEO Lifestyle</option>
              </select>
            </div>

            {/* Client Tier */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tier</label>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none focus:border-slate-800"
              >
                <option value="All">All Tiers</option>
                <option value="Gold">Gold Clients</option>
                <option value="Platinum">Platinum Clients</option>
                <option value="Silver">Silver Clients</option>
              </select>
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Residing Country</label>
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none focus:border-slate-800"
              >
                {countries.map(c => (
                  <option key={c} value={c}>{c === "All" ? "All Countries" : c}</option>
                ))}
              </select>
            </div>

            {/* Parish */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jamaica Parish</label>
              <select
                value={filterParish}
                onChange={(e) => setFilterParish(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none focus:border-slate-800"
              >
                {parishes.map(p => (
                  <option key={p} value={p}>{p === "All" ? "All Parishes" : p}</option>
                ))}
              </select>
            </div>

            {/* Product Category */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preferred Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none focus:border-slate-800"
              >
                {productCategories.map(cat => (
                  <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
                ))}
              </select>
            </div>

            {/* Order Frequency */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Frequency</label>
              <select
                value={filterFrequency}
                onChange={(e) => setFilterFrequency(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none focus:border-slate-800"
              >
                <option value="All">Any frequency</option>
                <option value="1">Exactly 1 Order</option>
                <option value="2-5">2 to 5 Orders (Regular)</option>
                <option value="5-10">5 to 10 Orders</option>
                <option value="10+">10+ Orders (Highly Active)</option>
              </select>
            </div>

            {/* Lifetime Revenue */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lifetime Spend (JMD)</label>
              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none focus:border-slate-800"
              >
                <option value="All">Any volume</option>
                <option value="vip_tier">Over $500,000 (Elite)</option>
                <option value="high_tier">$200,000 - $500,000</option>
                <option value="medium_tier">$50,000 - $200,000</option>
                <option value="standard_tier">Under $50,000</option>
              </select>
            </div>

            {/* Upcoming Occasions */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event in Next 30 Days</label>
              <select
                value={filterUpcoming}
                onChange={(e) => setFilterUpcoming(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none focus:border-slate-800"
              >
                <option value="All">Show All</option>
                <option value="yes">Occasion Coming Up</option>
                <option value="no">No Upcoming Occasions</option>
              </select>
            </div>

            {/* Marketing Permission */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Marketing Status</label>
              <select
                value={filterMarketing}
                onChange={(e) => setFilterMarketing(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none focus:border-slate-800"
              >
                <option value="All">All Permissions</option>
                <option value="Yes">Opted In (Yes)</option>
                <option value="No">Opted Out (No)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Grid of client cards */}
      {filteredClients.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-800">No Clients Match Selection</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters, clearing your search query, or import a new file.</p>
          <button 
            onClick={resetFilters} 
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Reset Search
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Showing {filteredClients.length} of {clients.length} Clients
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredClients.map(client => {
              const isSelected = client.id === selectedClientId;
              const isExpanded = expandedClientId === client.id;
              const isOverseas = client.contact.country !== "Jamaica";

              // Calculate Average Order Value and Relationship Span
              const computedAOV = client.history.averageOrderValue || (client.history.totalOrders > 0 ? Math.round(client.history.lifetimeRevenue / client.history.totalOrders) : 0);
              const relationshipSpanStr = `Since ${client.history.firstOrderDate ? client.history.firstOrderDate.slice(0, 4) : "2024"}`;

              return (
                <div
                  key={client.id}
                  onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                  className={`bg-white border text-left rounded-xl cursor-pointer hover:shadow-md transition-all relative overflow-hidden flex flex-col ${
                    isExpanded 
                      ? "ring-1 ring-slate-900 border-transparent shadow-md" 
                      : isSelected
                        ? "border-slate-800 shadow-sm"
                        : "border-slate-200/60 shadow-[0_1px_4px_rgba(0,0,0,0.01)]"
                  }`}
                  id={`client-card-${client.id}`}
                >
                  {/* Always Visible Card Body */}
                  <div className="p-3 sm:p-4 flex flex-col gap-3">
                    
                    {/* Header Row: Info & Avatar */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* elegant initials circle */}
                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-extrabold flex items-center justify-center flex-shrink-0 shadow-2xs">
                           {client.firstName[0]}{client.lastName[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-950 truncate leading-tight">
                              {client.firstName} {client.lastName}
                            </h3>
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider border ${
                              client.tier === "Gold" 
                                ? "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-amber-950 border-amber-600/30" 
                                : client.tier === "Platinum" 
                                  ? "bg-slate-900 text-slate-100 border-slate-950" 
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}>
                              {client.tier}
                            </span>
                            {isOverseas && (
                              <span className="bg-amber-50 text-amber-900 border border-amber-200 px-1 py-0.2 rounded-full text-[7.5px] font-bold uppercase tracking-wider">
                                Overseas
                              </span>
                            )}
                            {client.deactivated && (
                              <span className="bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded text-[7.5px] font-bold uppercase tracking-wider animate-pulse">
                                Inactive
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-400 font-semibold truncate">
                            <span className="font-bold">ID: {client.id}</span>
                            <span>•</span>
                            <span className="truncate">{client.homeBrand === "Both" ? "CEO Lifestyle" : client.homeBrand}</span>
                            <span>•</span>
                            <span className="truncate">{client.contact.city}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expansion trigger button */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded text-[7.5px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold uppercase tracking-wider hidden sm:inline-block">
                            Active
                          </span>
                        )}
                        <div className="text-slate-400 hover:text-slate-700 p-1 rounded-full transition-colors">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                        </div>
                      </div>
                    </div>

                    {/* Compact Metric Directory Summary (Always Visible, Optimized for Laptop/Desktop) */}
                    <div className="grid grid-cols-4 gap-1 p-1.5 bg-slate-50/50 rounded-xl border border-slate-100">
                      <div className="text-left min-w-0">
                        <span className="text-slate-400 block font-bold uppercase text-[6.5px] sm:text-[7px] tracking-tight truncate">Lifetime Value</span>
                        <span className="text-slate-900 font-extrabold text-[9px] sm:text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight font-mono">
                          {formatCurrency(client.history.lifetimeRevenue)}
                        </span>
                      </div>
                      <div className="text-left min-w-0">
                        <span className="text-slate-400 block font-bold uppercase text-[6.5px] sm:text-[7px] tracking-tight truncate">Total Orders</span>
                        <span className="text-slate-900 font-extrabold text-[9px] sm:text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight font-mono">
                          {client.history.totalOrders}
                        </span>
                      </div>
                      <div className="text-left min-w-0">
                        <span className="text-slate-400 block font-bold uppercase text-[6.5px] sm:text-[7px] tracking-tight truncate">Avg Order Value</span>
                        <span className="text-indigo-600 font-extrabold text-[9px] sm:text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight font-mono">
                          {formatCurrency(computedAOV)}
                        </span>
                      </div>
                      <div className="text-left min-w-0">
                        <span className="text-slate-400 block font-bold uppercase text-[6.5px] sm:text-[7px] tracking-tight truncate">Rel. Span</span>
                        <span className="text-slate-800 font-bold text-[9px] sm:text-[10px] xl:text-[11px] block mt-0.5 truncate leading-tight">
                          {relationshipSpanStr}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Expandable Info Area */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/20 p-4 space-y-4">
                      
                      {/* Contact Channels & preferences */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Contact details */}
                        <div className="space-y-2 text-left bg-white p-3 rounded-xl border border-slate-100 shadow-3xs">
                          <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest block">Contact Channels:</span>
                          <div className="flex items-center gap-2 text-slate-700 font-medium text-[11px]">
                            <Smartphone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{client.contact.phoneNumber}</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-[8.5px] text-indigo-600 font-extrabold uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-1 py-0.2 rounded">
                              {client.preferredCommunication || "WhatsApp"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-700 font-medium text-[11px]">
                            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{client.contact.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-700 font-medium text-[11px]">
                            <Megaphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Outreach:</span>
                            <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase tracking-wider border ${
                              client.marketingPermission !== "No"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                                : "bg-rose-50 text-rose-800 border-rose-100"
                            }`}>
                              {client.marketingPermission !== "No" ? "Marketing Active" : "Opted Out"}
                            </span>
                          </div>
                          <div className="flex items-start gap-2 text-slate-600 leading-normal text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span>
                              {client.contact.addressLine1 ? `${client.contact.addressLine1}, ` : ""}
                              {client.contact.city}, {client.contact.parish || client.contact.country}
                            </span>
                          </div>
                        </div>

                        {/* Preferences & Taste guidelines */}
                        <div className="space-y-2 text-left flex flex-col justify-between">
                          <div>
                            <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest block">Preferred Product Lines:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {client.history.preferredCategories.length > 0 ? (
                                client.history.preferredCategories.map((cat, i) => (
                                  <span key={i} className="bg-slate-100 text-slate-700 border border-slate-200/40 px-1.5 py-0.5 rounded font-semibold text-[9px] uppercase tracking-wider">
                                    {cat}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 italic text-[10px]">No specific lines cataloged.</span>
                              )}
                            </div>
                          </div>

                          <div className="pt-1">
                            <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest block">Client Taste & Notes:</span>
                            <p className="text-slate-500 font-semibold leading-relaxed mt-0.5 text-[11px]">
                              {client.history.clientPreferences.length > 0 
                                ? `Interests: ${client.history.clientPreferences.join(", ")}` 
                                : "No custom preference tags recorded."}
                            </p>
                            {client.profile.personalNotes && (
                              <p className="text-slate-400 text-[10px] italic leading-normal mt-1">
                                "{client.profile.personalNotes}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          STATUS: <span className="text-slate-700 font-extrabold">{client.occupation || "PROFESSIONAL"}</span>
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {onDeleteClient && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to permanently delete client profile: ${client.firstName} ${client.lastName}?`)) {
                                  onDeleteClient(client.id);
                                }
                              }}
                              className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                              title="Delete Client Profile"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectClient(client.id);
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold text-slate-900 hover:text-slate-700 bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-lg hover:bg-slate-200/60 transition-all cursor-pointer"
                          >
                            Open File
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
