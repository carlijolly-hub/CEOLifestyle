import React, { useState, useMemo } from "react";
import { Client, ClientTier, HomeBrand } from "../types";
import { parseMonthDay, getDaysRemaining } from "../utils/dateHelpers";
import { getClientHome, getOpenPromisesCount } from "../utils/clientTierUtils";
import AdventistAlert from "./AdventistAlert";
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
  RefreshCw,
  RotateCcw,
  Download
} from "lucide-react";
import ClientExportModal from "./ClientExportModal";

interface CompactFilterOption {
  value: string;
  label: string;
}

interface CompactFilterSelectProps {
  id: string;
  label: string;
  value: string;
  defaultValue?: string;
  onChange: (value: string) => void;
  options: CompactFilterOption[];
}

interface CollapsibleFilterGroupProps {
  id: string;
  title: string;
  subtitle: string;
  isOpen: boolean;
  onToggle: () => void;
  activeCount: number;
  children: React.ReactNode;
}

function CollapsibleFilterGroup({
  id,
  title,
  subtitle,
  isOpen,
  onToggle,
  activeCount,
  children
}: CollapsibleFilterGroupProps) {
  return (
    <div className="border-b border-slate-200/80 last:border-b-0 transition-colors">
      <button
        type="button"
        id={`filter-group-${id}-header`}
        onClick={onToggle}
        className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between text-left transition-all cursor-pointer group ${
          isOpen ? "bg-slate-100/60" : "hover:bg-slate-50/70"
        }`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0 pr-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">
            {title}
          </span>
          <span className="text-slate-300 font-normal select-none hidden sm:inline">•</span>
          <span className="text-[11px] text-slate-400 font-medium truncate">
            {subtitle}
          </span>
          {activeCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-900 text-white shadow-2xs">
              {activeCount} Active
            </span>
          )}
        </div>
        <div className="text-slate-400 group-hover:text-slate-700 ml-2 shrink-0 transition-colors">
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 sm:px-5 pt-2 pb-4 bg-slate-50/40 border-t border-slate-100/90 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function CompactFilterSelect({ id, label, value, defaultValue = "All", onChange, options }: CompactFilterSelectProps) {
  const isActive = value !== defaultValue;

  return (
    <div className="space-y-1.5 text-left">
      <div className="flex items-center justify-between px-0.5">
        <label 
          htmlFor={id} 
          className={`text-[10.5px] font-bold uppercase tracking-wider transition-colors ${
            isActive ? "text-slate-900 font-extrabold" : "text-slate-500"
          }`}
        >
          {label}
        </label>
        {isActive && (
          <span className="inline-flex items-center text-[9px] font-extrabold text-slate-800 bg-slate-200/90 px-1.5 py-0.5 rounded-md tracking-tight">
            Active
          </span>
        )}
      </div>

      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none rounded-xl px-3.5 py-2.5 pr-8 text-xs transition-all cursor-pointer font-medium focus:outline-none focus:ring-1 focus:ring-slate-800 truncate ${
            isActive
              ? "bg-white border-2 border-slate-900 text-slate-900 font-semibold shadow-xs"
              : "bg-white border border-slate-200/90 text-slate-700 hover:border-slate-300 shadow-2xs"
          }`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-slate-800 bg-white py-1 font-normal">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown 
          className={`w-3.5 h-3.5 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
            isActive ? "text-slate-900" : "text-slate-400"
          }`} 
        />
      </div>
    </div>
  );
}

interface ClientListProps {
  clients: Client[];
  selectedClientId: string | null;
  onSelectClient: (clientId: string) => void;
  onAddNewClient: () => void;
  onDeleteClient?: (clientId: string) => void;
  onToggleCheckIn?: (clientId: string, checkedIn: boolean) => void;
}

type FilterGroupId = "client" | "geography" | "commercial" | "engagement" | "relationship" | "records";

const DEFAULT_EXPANDED_GROUPS: Record<FilterGroupId, boolean> = {
  client: false,
  geography: false,
  commercial: false,
  engagement: false,
  relationship: false,
  records: false,
};

export default function ClientList({ 
  clients, 
  selectedClientId, 
  onSelectClient,
  onAddNewClient,
  onDeleteClient,
  onToggleCheckIn
}: ClientListProps) {
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  
  // Filter panel toggle — Hidden by default per design specification
  const [showFilters, setShowFilters] = useState(false);

  // Collapsible filter groups state
  const [expandedGroups, setExpandedGroups] = useState<Record<FilterGroupId, boolean>>(DEFAULT_EXPANDED_GROUPS);

  const toggleGroup = (groupId: FilterGroupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Filters state
  const [filterClientStatus, setFilterClientStatus] = useState<string>("Active"); // "Active" | "Archived" | "All"
  const [filterBrand, setFilterBrand] = useState<string>("All");
  const [filterBusinessRelationship, setFilterBusinessRelationship] = useState<string>("All");
  const [filterManagement, setFilterManagement] = useState<string>("All");
  const [filterTier, setFilterTier] = useState<string>("All");
  const [filterCountry, setFilterCountry] = useState<string>("All");
  const [filterParish, setFilterParish] = useState<string>("All");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterFrequency, setFilterFrequency] = useState<string>("All");
  const [filterValue, setFilterValue] = useState<string>("All");
  const [filterUpcoming, setFilterUpcoming] = useState<string>("All");
  const [filterMarketing, setFilterMarketing] = useState<string>("All");
  const [filterCommStatus, setFilterCommStatus] = useState<string>("All");
  const [filterRemembrance, setFilterRemembrance] = useState<string>("All");
  const [filterCheckIn, setFilterCheckIn] = useState<string>("All"); // "All" | "Checked In" | "Not Checked In"

  // Base client scope for counting based on Client Status filter
  const scopedClients = useMemo(() => {
    if (filterClientStatus === "Archived") return clients.filter(c => !!c.deactivated);
    if (filterClientStatus === "All") return clients;
    return clients.filter(c => !c.deactivated);
  }, [clients, filterClientStatus]);

  // Dynamic count calculations (ONLY for Client Home, Client Tier, Jamaica Parish, and WhatsApp Check-In)
  const clientHomeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "CEO Lifestyle": 0,
      "Librarium Luxe": 0,
      "CEO Lifestyle | Librarium Luxe": 0,
    };
    scopedClients.forEach(c => {
      const home = getClientHome(c);
      if (counts[home] !== undefined) {
        counts[home]++;
      }
    });
    return counts;
  }, [scopedClients]);

  const clientTierCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "Silver": 0,
      "Gold": 0,
      "Platinum": 0,
      "Founders Family": 0,
      "Delinquent": 0,
      "Problematic": 0,
    };
    scopedClients.forEach(c => {
      if (counts[c.tier] !== undefined) {
        counts[c.tier]++;
      }
    });
    return counts;
  }, [scopedClients]);

  // Get unique lists for filter select dropdowns
  const countries = useMemo(() => {
    const canonicalCountries = ["Jamaica"];
    const clientCountries = clients.map(c => c.contact?.country).filter((c): c is string => Boolean(c));
    const combined = new Set([...canonicalCountries, ...clientCountries]);
    return ["All", ...Array.from(combined)];
  }, [clients]);

  const parishes = useMemo(() => {
    const canonicalParishes = [
      "St. Andrew",
      "St. James",
      "St. Ann",
      "St. Catherine",
      "Kingston",
      "Westmoreland",
      "Clarendon",
      "Manchester",
      "Hanover",
      "Trelawny",
      "Portland",
      "St. Mary",
      "St. Elizabeth",
      "St. Thomas"
    ];
    const clientParishes = clients.map(c => c.contact?.parish).filter((p): p is string => Boolean(p && p !== "N/A"));
    const combined = new Set([...canonicalParishes, ...clientParishes]);
    return ["All", "N/A", ...Array.from(combined)];
  }, [clients]);

  const parishCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    parishes.forEach(p => {
      if (p !== "All") counts[p] = 0;
    });
    scopedClients.forEach(c => {
      const p = c.contact?.parish;
      if (!p || p === "N/A") {
        if (counts["N/A"] !== undefined) counts["N/A"]++;
      } else if (counts[p] !== undefined) {
        counts[p]++;
      }
    });
    return counts;
  }, [scopedClients, parishes]);

  const whatsAppCheckedInCount = useMemo(() => {
    return scopedClients.filter(c => !!c.checkedIn).length;
  }, [scopedClients]);

  const whatsAppNotCheckedInCount = useMemo(() => {
    return scopedClients.filter(c => !c.checkedIn).length;
  }, [scopedClients]);

  const productCategories = useMemo(() => {
    const categories = new Set<string>();
    clients.forEach(c => {
      (c.history?.preferredCategories || []).forEach(cat => {
        if (cat) categories.add(cat);
      });
    });
    return ["All", ...Array.from(categories).sort()];
  }, [clients]);

  // Options configuration for compact filter dropdowns
  // 1. Client Status Options (NO counts)
  const clientStatusOptions = [
    { value: "Active", label: "Active" },
    { value: "Archived", label: "Archived" },
    { value: "All", label: "All" },
  ];

  // 2. Client Home Options (Dynamic counts on non-All options)
  const clientHomeOptions = [
    { value: "All", label: "All Client Homes" },
    { value: "CEO Lifestyle", label: `CEO Lifestyle (${clientHomeCounts["CEO Lifestyle"] || 0})` },
    { value: "Librarium Luxe", label: `Librarium Luxe (${clientHomeCounts["Librarium Luxe"] || 0})` },
    { value: "CEO Lifestyle | Librarium Luxe", label: `CEO Lifestyle | Librarium Luxe (${clientHomeCounts["CEO Lifestyle | Librarium Luxe"] || 0})` },
  ];

  // 3. Client Tier Options (Dynamic counts on non-All options)
  const clientTierOptions = [
    { value: "All", label: "All Tiers" },
    { value: "Silver", label: `Silver Tier (${clientTierCounts["Silver"] || 0})` },
    { value: "Gold", label: `Gold Tier (${clientTierCounts["Gold"] || 0})` },
    { value: "Platinum", label: `Platinum Tier (${clientTierCounts["Platinum"] || 0})` },
    { value: "Founders Family", label: `Founders Family (Permanent) (${clientTierCounts["Founders Family"] || 0})` },
    { value: "Delinquent", label: `Delinquent Risk (${clientTierCounts["Delinquent"] || 0})` },
    { value: "Problematic", label: `Problematic Risk (${clientTierCounts["Problematic"] || 0})` },
  ];

  // 4. Management Status Options (NO counts)
  const managementStatusOptions = [
    { value: "All", label: "All Statuses" },
    { value: "Standard", label: "Standard Account" },
    { value: "VIP Priority", label: "VIP Priority" },
    { value: "Problematic", label: "Problematic Review" },
    { value: "Delinquent", label: "Delinquent Payment" },
  ];

  // 5. Residing Country Options (NO counts)
  const countryOptions = countries.map(c => ({
    value: c,
    label: c === "All" ? "All Countries" : c,
  }));

  // 6. Jamaica Parish Options (Dynamic counts on non-All options)
  const parishOptions = parishes.map(p => {
    if (p === "All") {
      return { value: "All", label: "All Parishes" };
    }
    const count = parishCounts[p] || 0;
    return {
      value: p,
      label: `${p} (${count})`
    };
  });

  // 7. Preferred Category Options (NO counts)
  const categoryOptions = productCategories.map(cat => ({
    value: cat,
    label: cat === "All" ? "All Categories" : cat,
  }));

  // 8. Order Frequency Options (NO counts)
  const orderFrequencyOptions = [
    { value: "All", label: "Any Frequency" },
    { value: "1", label: "Exactly 1 Order" },
    { value: "2-5", label: "2 to 5 Orders (Regular)" },
    { value: "5-10", label: "5 to 10 Orders" },
    { value: "10+", label: "10+ Orders (Highly Active)" },
  ];

  // 9. Lifetime Spend Options (NO counts)
  const lifetimeSpendOptions = [
    { value: "All", label: "Any Volume" },
    { value: "vip_tier", label: "Over $500,000 (Elite)" },
    { value: "high_tier", label: "$200,000 - $500,000" },
    { value: "medium_tier", label: "$50,000 - $200,000" },
    { value: "standard_tier", label: "Under $50,000" },
  ];

  // 10. Event Options (NO counts)
  const eventOptions = [
    { value: "All", label: "Show All" },
    { value: "yes", label: "Occasion Coming Up" },
    { value: "no", label: "No Upcoming Occasions" },
  ];

  // 11. Marketing Status Options (NO counts)
  const marketingStatusOptions = [
    { value: "All", label: "All Permissions" },
    { value: "Yes", label: "Opted In (Yes)" },
    { value: "No", label: "Opted Out (No)" },
  ];

  // 12. Communication Status Options (NO counts)
  const communicationStatusOptions = [
    { value: "All", label: "All Statuses" },
    { value: "Active", label: "Active" },
    { value: "Not Active", label: "Not Active" },
    { value: "Unknown", label: "Unknown" },
  ];

  // 13. Personal Remembrance Options (NO counts)
  const personalRemembranceOptions = [
    { value: "All", label: "All Clients" },
    { value: "Mother Remembered", label: "Mother Remembered" },
    { value: "Father Remembered", label: "Father Remembered" },
    { value: "Any Personal Remembrance", label: "Any Personal Remembrance" },
  ];

  // 14. WhatsApp Check-In Options (Dynamic counts, NO checkbox symbols)
  const whatsAppCheckInOptions = [
    { value: "All", label: "All Clients" },
    { value: "Not Checked In", label: `Not Checked In (${whatsAppNotCheckedInCount})` },
    { value: "Checked In", label: `Checked In (${whatsAppCheckedInCount})` },
  ];

  // Active filter count per collapsible category
  const clientGroupActiveCount = useMemo(() => {
    let count = 0;
    if (filterBusinessRelationship !== "All") count++;
    if (filterTier !== "All") count++;
    if (filterManagement !== "All") count++;
    return count;
  }, [filterBusinessRelationship, filterTier, filterManagement]);

  const geographyGroupActiveCount = useMemo(() => {
    let count = 0;
    if (filterCountry !== "All") count++;
    if (filterParish !== "All") count++;
    return count;
  }, [filterCountry, filterParish]);

  const commercialGroupActiveCount = useMemo(() => {
    let count = 0;
    if (filterCategory !== "All") count++;
    if (filterFrequency !== "All") count++;
    if (filterValue !== "All") count++;
    return count;
  }, [filterCategory, filterFrequency, filterValue]);

  const engagementGroupActiveCount = useMemo(() => {
    let count = 0;
    if (filterMarketing !== "All") count++;
    if (filterCommStatus !== "All") count++;
    if (filterCheckIn !== "All") count++;
    return count;
  }, [filterMarketing, filterCommStatus, filterCheckIn]);

  const relationshipGroupActiveCount = useMemo(() => {
    let count = 0;
    if (filterUpcoming !== "All") count++;
    if (filterRemembrance !== "All") count++;
    return count;
  }, [filterUpcoming, filterRemembrance]);

  const recordsGroupActiveCount = useMemo(() => {
    let count = 0;
    if (filterClientStatus !== "Active") count++;
    return count;
  }, [filterClientStatus]);

  const activeFilterCount = useMemo(() => {
    return [
      filterClientStatus !== "Active" ? filterClientStatus : "default",
      filterBusinessRelationship,
      filterTier,
      filterManagement,
      filterCountry,
      filterParish,
      filterCategory,
      filterFrequency,
      filterValue,
      filterUpcoming,
      filterMarketing,
      filterCommStatus,
      filterRemembrance,
      filterCheckIn
    ].filter(v => v !== "All" && v !== "default").length;
  }, [
    filterClientStatus,
    filterBusinessRelationship,
    filterTier,
    filterManagement,
    filterCountry,
    filterParish,
    filterCategory,
    filterFrequency,
    filterValue,
    filterUpcoming,
    filterMarketing,
    filterCommStatus,
    filterRemembrance,
    filterCheckIn
  ]);

  // Structured active filter chips for summary bar
  interface ActiveFilterChip {
    id: string;
    label: string;
    onRemove: () => void;
  }

  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];

    if (filterBusinessRelationship !== "All") {
      chips.push({
        id: "home",
        label: filterBusinessRelationship,
        onRemove: () => setFilterBusinessRelationship("All"),
      });
    }

    if (filterTier !== "All") {
      chips.push({
        id: "tier",
        label: filterTier.includes("Tier") || filterTier.includes("Family") || filterTier.includes("Risk")
          ? filterTier
          : `${filterTier} Tier`,
        onRemove: () => setFilterTier("All"),
      });
    }

    if (filterManagement !== "All") {
      chips.push({
        id: "mgmt",
        label: filterManagement === "Standard" ? "Standard Account" : `Status: ${filterManagement}`,
        onRemove: () => setFilterManagement("All"),
      });
    }

    if (filterCountry !== "All") {
      chips.push({
        id: "country",
        label: `Country: ${filterCountry}`,
        onRemove: () => setFilterCountry("All"),
      });
    }

    if (filterParish !== "All") {
      chips.push({
        id: "parish",
        label: filterParish === "N/A" ? "Parish: N/A" : filterParish,
        onRemove: () => setFilterParish("All"),
      });
    }

    if (filterCategory !== "All") {
      chips.push({
        id: "category",
        label: `Category: ${filterCategory}`,
        onRemove: () => setFilterCategory("All"),
      });
    }

    if (filterFrequency !== "All") {
      const freqLabel =
        filterFrequency === "1"
          ? "1 Order"
          : filterFrequency === "2-5"
          ? "2–5 Orders"
          : filterFrequency === "5-10"
          ? "5–10 Orders"
          : "10+ Orders";
      chips.push({
        id: "frequency",
        label: freqLabel,
        onRemove: () => setFilterFrequency("All"),
      });
    }

    if (filterValue !== "All") {
      const spendLabel =
        filterValue === "vip_tier"
          ? "Spend > $500k"
          : filterValue === "high_tier"
          ? "Spend $200k–$500k"
          : filterValue === "medium_tier"
          ? "Spend $50k–$200k"
          : "Spend < $50k";
      chips.push({
        id: "spend",
        label: spendLabel,
        onRemove: () => setFilterValue("All"),
      });
    }

    if (filterMarketing !== "All") {
      chips.push({
        id: "marketing",
        label: `Marketing: ${filterMarketing === "Yes" ? "Opted In" : "Opted Out"}`,
        onRemove: () => setFilterMarketing("All"),
      });
    }

    if (filterCommStatus !== "All") {
      chips.push({
        id: "comm",
        label: `Comm: ${filterCommStatus}`,
        onRemove: () => setFilterCommStatus("All"),
      });
    }

    if (filterCheckIn !== "All") {
      chips.push({
        id: "checkIn",
        label: filterCheckIn,
        onRemove: () => setFilterCheckIn("All"),
      });
    }

    if (filterUpcoming !== "All") {
      chips.push({
        id: "upcoming",
        label: filterUpcoming === "yes" ? "Occasion in 30 Days" : "No Upcoming Occasion",
        onRemove: () => setFilterUpcoming("All"),
      });
    }

    if (filterRemembrance !== "All") {
      chips.push({
        id: "remembrance",
        label: filterRemembrance,
        onRemove: () => setFilterRemembrance("All"),
      });
    }

    if (filterClientStatus !== "Active") {
      chips.push({
        id: "status",
        label: filterClientStatus === "Archived" ? "Archived" : "All Records",
        onRemove: () => setFilterClientStatus("Active"),
      });
    }

    return chips;
  }, [
    filterBusinessRelationship,
    filterTier,
    filterManagement,
    filterCountry,
    filterParish,
    filterCategory,
    filterFrequency,
    filterValue,
    filterMarketing,
    filterCommStatus,
    filterCheckIn,
    filterUpcoming,
    filterRemembrance,
    filterClientStatus,
  ]);

  // Handle clearing all filters
  const resetFilters = () => {
    setFilterClientStatus("Active");
    setFilterBrand("All");
    setFilterBusinessRelationship("All");
    setFilterManagement("All");
    setFilterTier("All");
    setFilterCountry("All");
    setFilterParish("All");
    setFilterCategory("All");
    setFilterFrequency("All");
    setFilterValue("All");
    setFilterUpcoming("All");
    setFilterMarketing("All");
    setFilterCommStatus("All");
    setFilterRemembrance("All");
    setFilterCheckIn("All");
    setSearchTerm("");
    setExpandedGroups({ ...DEFAULT_EXPANDED_GROUPS });
  };

  // Filter and Search execution logic
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // 0. Client Status filter (Active / Archived / All)
      const isDeactivated = !!client.deactivated;
      if (filterClientStatus === "Active" && isDeactivated) return false;
      if (filterClientStatus === "Archived" && !isDeactivated) return false;
      // if filterClientStatus === "All", show both active and archived

      // 1. Plain text search matching name, email, phone, city, occupation, notes
      const fullName = `${client.firstName || ""} ${client.lastName || ""}`.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        fullName.includes(searchLower) ||
        (client.id || "").toLowerCase().includes(searchLower) ||
        (client.contact?.email || "").toLowerCase().includes(searchLower) ||
        (client.contact?.phoneNumber && client.contact.phoneNumber.includes(searchLower)) ||
        (client.contact?.city || "").toLowerCase().includes(searchLower) ||
        (client.occupation || "").toLowerCase().includes(searchLower) ||
        (client.communicationStatus || "Unknown").toLowerCase().includes(searchLower) ||
        (client.profile?.personalNotes || "").toLowerCase().includes(searchLower) ||
        (client.favouriteAuthors && client.favouriteAuthors.some(a => (a || "").toLowerCase().includes(searchLower)));

      if (!matchesSearch) return false;

      // 2. Client Home Filter
      if (filterBusinessRelationship !== "All") {
        const ch = getClientHome(client);
        if (ch !== filterBusinessRelationship) return false;
      }

      // 2c. Management Classification Filter
      if (filterManagement !== "All") {
        const mgmt = client.managementClassification || (client.tier === "Delinquent" ? "Delinquent" : client.tier === "Problematic" ? "Problematic" : client.tier === "Founders Family" ? "VIP Priority" : "Standard");
        if (mgmt !== filterManagement) return false;
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
        const ltv = client.history?.lifetimeRevenue || 0;
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

      // 11. Communication Status Filter
      if (filterCommStatus !== "All") {
        const status = client.communicationStatus || "Unknown";
        if (status !== filterCommStatus) return false;
      }

      // 12. Personal Remembrance Filter
      if (filterRemembrance !== "All") {
        const rems = client.remembrances || [];
        if (filterRemembrance === "Mother Remembered") {
          const hasMother = rems.some(r => (r.relationship || "").toLowerCase() === "mother");
          if (!hasMother) return false;
        } else if (filterRemembrance === "Father Remembered") {
          const hasFather = rems.some(r => (r.relationship || "").toLowerCase() === "father");
          if (!hasFather) return false;
        } else if (filterRemembrance === "Any Personal Remembrance") {
          if (rems.length === 0) return false;
        }
      }

      // 13. WhatsApp Check-In Filter
      if (filterCheckIn !== "All") {
        const isChecked = !!client.checkedIn;
        if (filterCheckIn === "Checked In" && !isChecked) return false;
        if (filterCheckIn === "Not Checked In" && isChecked) return false;
      }

      return true;
    });
  }, [
    clients,
    searchTerm,
    filterClientStatus,
    filterBrand,
    filterBusinessRelationship,
    filterManagement,
    filterTier,
    filterCountry,
    filterParish,
    filterCategory,
    filterFrequency,
    filterValue,
    filterUpcoming,
    filterMarketing,
    filterCommStatus,
    filterRemembrance,
    filterCheckIn
  ]);

  // Money formatting
  const formatCurrency = (val: number) => {
    return `J$${Math.round(val).toLocaleString()}`;
  };

  const currentViewClients = useMemo(() => {
    if (filterClientStatus === "Archived") return clients.filter(c => !!c.deactivated);
    if (filterClientStatus === "All") return clients;
    return clients.filter(c => !c.deactivated);
  }, [clients, filterClientStatus]);

  return (
    <div className="space-y-4 text-slate-800">
      {/* Search & Management Area */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative w-full">
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

        {/* Action Controls */}
        <div className="flex gap-2.5 items-center justify-between flex-wrap">
          <button
            type="button"
            id="client-directory-filters-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              showFilters
                ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                : activeFilterCount > 0
                ? "bg-slate-100 border-slate-900 text-slate-900 font-bold shadow-xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
            }`}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className={`inline-flex items-center text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                showFilters 
                  ? "bg-white/20 text-white" 
                  : "bg-slate-900 text-white"
              }`}>
                • {activeFilterCount} Active
              </span>
            )}
          </button>

          <div className="flex gap-2.5 items-center">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-bold rounded-xl transition-all shadow-xs"
              title="Export current client database (V2.1)"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              Export Database
            </button>

            <button
              onClick={onAddNewClient}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              Add Client
            </button>
          </div>
        </div>
      </div>

      {/* Refine Client Directory Filter System */}
      {showFilters && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden animate-fade-in text-left shadow-xs">
          {/* Top Panel Header */}
          <div className="flex justify-between items-center px-4 sm:px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Refine Client Directory
              </h3>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-900 text-white shadow-2xs">
                  {activeFilterCount} active
                </span>
              )}
            </div>
            <button 
              type="button"
              onClick={resetFilters}
              disabled={activeFilterCount === 0 && !searchTerm}
              className={`text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeFilterCount > 0 || searchTerm
                  ? "text-slate-600 hover:text-slate-950 hover:underline cursor-pointer"
                  : "text-slate-400 cursor-default opacity-50"
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>

          {/* Collapsible Filter Categories */}
          <div className="divide-y divide-slate-200/80">
            {/* 1. CLIENT */}
            <CollapsibleFilterGroup
              id="client"
              title="CLIENT"
              subtitle="Client Home · Tier · Management Status"
              isOpen={expandedGroups.client}
              onToggle={() => toggleGroup("client")}
              activeCount={clientGroupActiveCount}
            >
              <CompactFilterSelect
                id="filter-client-home"
                label="Client Home"
                value={filterBusinessRelationship}
                onChange={setFilterBusinessRelationship}
                options={clientHomeOptions}
              />
              <CompactFilterSelect
                id="filter-client-tier"
                label="Client Tier"
                value={filterTier}
                onChange={setFilterTier}
                options={clientTierOptions}
              />
              <CompactFilterSelect
                id="filter-management-status"
                label="Management Status"
                value={filterManagement}
                onChange={setFilterManagement}
                options={managementStatusOptions}
              />
            </CollapsibleFilterGroup>

            {/* 2. GEOGRAPHY */}
            <CollapsibleFilterGroup
              id="geography"
              title="GEOGRAPHY"
              subtitle="Residing Country · Jamaica Parish"
              isOpen={expandedGroups.geography}
              onToggle={() => toggleGroup("geography")}
              activeCount={geographyGroupActiveCount}
            >
              <CompactFilterSelect
                id="filter-residing-country"
                label="Residing Country"
                value={filterCountry}
                onChange={setFilterCountry}
                options={countryOptions}
              />
              <CompactFilterSelect
                id="filter-jamaica-parish"
                label="Jamaica Parish"
                value={filterParish}
                onChange={setFilterParish}
                options={parishOptions}
              />
            </CollapsibleFilterGroup>

            {/* 3. COMMERCIAL */}
            <CollapsibleFilterGroup
              id="commercial"
              title="COMMERCIAL"
              subtitle="Preferred Category · Order Frequency · Lifetime Spend"
              isOpen={expandedGroups.commercial}
              onToggle={() => toggleGroup("commercial")}
              activeCount={commercialGroupActiveCount}
            >
              <CompactFilterSelect
                id="filter-preferred-category"
                label="Preferred Category"
                value={filterCategory}
                onChange={setFilterCategory}
                options={categoryOptions}
              />
              <CompactFilterSelect
                id="filter-order-frequency"
                label="Order Frequency"
                value={filterFrequency}
                onChange={setFilterFrequency}
                options={orderFrequencyOptions}
              />
              <CompactFilterSelect
                id="filter-lifetime-spend"
                label="Lifetime Spend"
                value={filterValue}
                onChange={setFilterValue}
                options={lifetimeSpendOptions}
              />
            </CollapsibleFilterGroup>

            {/* 4. ENGAGEMENT */}
            <CollapsibleFilterGroup
              id="engagement"
              title="ENGAGEMENT"
              subtitle="Marketing Status · Communication Status · WhatsApp Check-In"
              isOpen={expandedGroups.engagement}
              onToggle={() => toggleGroup("engagement")}
              activeCount={engagementGroupActiveCount}
            >
              <CompactFilterSelect
                id="filter-marketing-status"
                label="Marketing Status"
                value={filterMarketing}
                onChange={setFilterMarketing}
                options={marketingStatusOptions}
              />
              <CompactFilterSelect
                id="filter-communication-status"
                label="Communication Status"
                value={filterCommStatus}
                onChange={setFilterCommStatus}
                options={communicationStatusOptions}
              />
              <CompactFilterSelect
                id="filter-whatsapp-check-in"
                label="WhatsApp Check-In"
                value={filterCheckIn}
                onChange={setFilterCheckIn}
                options={whatsAppCheckInOptions}
              />
            </CollapsibleFilterGroup>

            {/* 5. RELATIONSHIP */}
            <CollapsibleFilterGroup
              id="relationship"
              title="RELATIONSHIP"
              subtitle="Event in Next 30 Days · Personal Remembrance"
              isOpen={expandedGroups.relationship}
              onToggle={() => toggleGroup("relationship")}
              activeCount={relationshipGroupActiveCount}
            >
              <CompactFilterSelect
                id="filter-event-upcoming"
                label="Event in Next 30 Days"
                value={filterUpcoming}
                onChange={setFilterUpcoming}
                options={eventOptions}
              />
              <CompactFilterSelect
                id="filter-personal-remembrance"
                label="Personal Remembrance"
                value={filterRemembrance}
                onChange={setFilterRemembrance}
                options={personalRemembranceOptions}
              />
            </CollapsibleFilterGroup>

            {/* 6. RECORDS */}
            <CollapsibleFilterGroup
              id="records"
              title="RECORDS"
              subtitle="Archived"
              isOpen={expandedGroups.records}
              onToggle={() => toggleGroup("records")}
              activeCount={recordsGroupActiveCount}
            >
              <CompactFilterSelect
                id="filter-client-status"
                label="Archived"
                value={filterClientStatus}
                defaultValue="Active"
                onChange={setFilterClientStatus}
                options={clientStatusOptions}
              />
            </CollapsibleFilterGroup>
          </div>
        </div>
      )}

      {/* Active Filter Summary Chips */}
      {activeFilterChips.length > 0 && (
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 flex flex-wrap items-center gap-2 text-xs shadow-2xs animate-fade-in">
          <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 shrink-0 pl-1">
            <SlidersHorizontal className="w-3 h-3 text-slate-600" />
            Filters:
          </span>
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {activeFilterChips.map((chip) => (
              <span
                key={chip.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold text-[11px] shadow-2xs group hover:border-slate-300 transition-all"
              >
                <span className="truncate max-w-[220px]">{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="text-slate-400 hover:text-slate-900 p-0.5 rounded-xs hover:bg-slate-100 transition-colors cursor-pointer"
                  title={`Remove ${chip.label}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-900 underline decoration-slate-300 hover:decoration-slate-900 transition-colors cursor-pointer shrink-0 ml-auto pr-1"
          >
            Reset Filters
          </button>
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
              const computedAOV = client.history?.averageOrderValue || (client.history?.totalOrders ? Math.round((client.history.lifetimeRevenue || 0) / client.history.totalOrders) : 0);
              const relationshipSpanStr = `Since ${client.history?.firstOrderDate ? client.history.firstOrderDate.slice(0, 4) : "2024"}`;

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
                            <h3 className="text-xs sm:text-sm font-bold text-slate-950 break-words leading-tight">
                              {client.firstName} {client.lastName}
                            </h3>
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider border ${
                              client.tier === "Founders Family"
                                ? "bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white border-purple-400"
                                : client.tier === "Gold" 
                                  ? "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-amber-950 border-amber-600/30" 
                                  : client.tier === "Platinum" 
                                    ? "bg-slate-900 text-slate-100 border-slate-950" 
                                    : client.tier === "Delinquent"
                                      ? "bg-rose-600 text-white border-rose-700 animate-pulse"
                                      : client.tier === "Problematic"
                                        ? "bg-black text-rose-400 border-rose-900"
                                        : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}>
                              {client.tier}
                            </span>
                            {isOverseas && (
                              <span className="bg-amber-50 text-amber-900 border border-amber-200 px-1 py-0.2 rounded-full text-[7.5px] font-bold uppercase tracking-wider">
                                Overseas
                              </span>
                            )}
                            {client.adventist === "Yes" && (
                              <span className="text-[10px] font-bold text-slate-700">
                                • Adventist ✝
                              </span>
                            )}
                            {client.deactivated && (
                              <span className="bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded text-[7.5px] font-bold uppercase tracking-wider animate-pulse">
                                Inactive
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[9px] text-slate-400 font-semibold">
                            <span className="font-bold">ID: {client.id}</span>
                            <span>•</span>
                            <span className="break-words">{getClientHome(client)}</span>
                            <span>•</span>
                            <span className="break-words">{client.contact.city}</span>
                            {getOpenPromisesCount(client) > 0 && (
                              <>
                                <span>•</span>
                                <span
                                  className="text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded text-[8.5px] font-extrabold"
                                  title={`${getOpenPromisesCount(client)} Open Client Promises`}
                                >
                                  ({getOpenPromisesCount(client)} {getOpenPromisesCount(client) === 1 ? 'CMT' : 'CMTs'})
                                </span>
                              </>
                            )}
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
                          <div className="flex items-center gap-2 text-slate-700 font-medium text-[11px] flex-wrap">
                            <Smartphone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{client.contact.phoneNumber}</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-[10px] text-slate-600 font-bold">
                              Communication Status: {client.communicationStatus || "Unknown"}
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="text-[8.5px] text-indigo-600 font-extrabold uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-1 py-0.2 rounded">
                              {client.preferredCommunication || "WhatsApp"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-700 font-medium text-[11px]">
                            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{client.contact.email}</span>
                          </div>
                          <div className="label-value-row items-center gap-1.5 text-slate-700 font-medium text-[11px]">
                            <Megaphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="label-value-label text-[9px] text-slate-400 font-bold uppercase tracking-wide">Outreach:</span>
                            <span className="label-value-val">
                              <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase tracking-wider border ${
                                client.marketingPermission !== "No"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                                  : "bg-rose-50 text-rose-800 border-rose-100"
                              }`}>
                                {client.marketingPermission !== "No" ? "Marketing Active" : "Opted Out"}
                              </span>
                            </span>
                          </div>
                          <div className="flex items-start gap-2 text-slate-600 leading-normal text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span className="flex-1 min-w-0 break-words">
                              {(client.contact as any).addressLine1 ? `${(client.contact as any).addressLine1}, ` : ""}
                              {client.contact.city}, {client.contact.parish || client.contact.country}
                            </span>
                          </div>
                        </div>

                        {/* Preferences & Taste guidelines */}
                        <div className="space-y-2 text-left flex flex-col justify-between">
                          <div>
                            <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest block">Preferred Product Lines:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {client.history?.preferredCategories && client.history.preferredCategories.length > 0 ? (
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

                          <div className="pt-1 space-y-1">
                            <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest block">Client Taste & Notes:</span>
                            <div className="label-value-row text-[11px]">
                              <span className="label-value-label font-bold text-slate-400 uppercase text-[9px]">Interests:</span>
                              <span className="label-value-val text-slate-600 font-semibold leading-relaxed">
                                {client.history?.clientPreferences && client.history.clientPreferences.length > 0 
                                  ? client.history.clientPreferences.join(", ") 
                                  : "No custom preference tags recorded."}
                              </span>
                            </div>
                            {client.profile.personalNotes && (
                              <div className="label-value-row text-[10px] italic">
                                <span className="label-value-label text-[9px] font-bold text-slate-400 uppercase not-italic">Notes:</span>
                                <span className="label-value-val text-slate-500 leading-normal">
                                  "{client.profile.personalNotes}"
                                </span>
                              </div>
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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleCheckIn?.(client.id, !client.checkedIn);
                            }}
                            className={`flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                              client.checkedIn
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                            title="Toggle WhatsApp Check-In"
                          >
                            <span className="font-mono text-xs">{client.checkedIn ? "☑" : "☐"}</span>
                            <span>{client.checkedIn ? "Checked In (WhatsApp)" : "Not Checked In"}</span>
                          </button>

                          {onDeleteClient && !client.deactivated && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to deactivate client profile: ${client.firstName} ${client.lastName}? This keeps all historical interaction notes but archives them.`)) {
                                  onDeleteClient(client.id);
                                }
                              }}
                              className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                              title="Deactivate Client Profile"
                            >
                              <Archive className="w-3.5 h-3.5" />
                              Deactivate
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

      <ClientExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        clients={clients}
      />
    </div>
  );
}
