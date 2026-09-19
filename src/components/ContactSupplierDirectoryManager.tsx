import React, { useState } from "react";
import { 
  Search, 
  Plus, 
  Building2, 
  Users, 
  Phone, 
  MessageSquare, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  X, 
  Edit3, 
  Power, 
  Star, 
  CheckCircle2, 
  Tag, 
  FileText, 
  PhoneCall, 
  Clock, 
  DollarSign, 
  Briefcase, 
  Truck, 
  Layers, 
  ArrowUpRight,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Info,
  Store,
  Package,
  Handshake,
  UserCheck,
  Wrench,
  ShoppingBag
} from "lucide-react";
import { ContactSupplierRecord, ContactType, ContactPhoneContact, SupplierOperatingHours, SupplierDaySchedule } from "../types";
import { DEFAULT_CONTACT_SUPPLIER_DIRECTORY } from "../utils/settingsHelper";
import { VendorOperatingStatusBadge, useLiveSystemTime } from "../utils/vendorOperatingHours";

interface ContactSupplierDirectoryManagerProps {
  contacts?: ContactSupplierRecord[];
  onUpdateContacts?: (updatedContacts: ContactSupplierRecord[]) => void;
  hideHeader?: boolean;
}

export type MainDirectoryCategory = "Operational & Business Contacts" | "Suppliers & Vendors" | "All";

const OPERATIONAL_ROLE_FINDERS = [
  "All Roles",
  "Business Advisor",
  "Consultant",
  "Courier",
  "Delivery Driver",
  "Service Provider",
  "Strategic Partner",
  "Operational Contact",
  "Professional Contact",
  "Business Associate"
];

const SUPPLIER_ROLE_FINDERS = [
  "All Roles",
  "Product Supplier",
  "Printing Supplier",
  "Material Supplier",
  "Packaging Supplier",
  "Equipment Vendor",
  "Wholesale Vendor",
  "Service Vendor",
  "Garment Blanks"
];

const OPERATIONAL_ROLE_TAGS = [
  "Business Advisor",
  "Consultant",
  "Courier",
  "Delivery Driver",
  "Delivery Contact",
  "Service Provider",
  "Strategic Partner",
  "Operational Contact",
  "Professional Contact",
  "Business Associate",
  "Industry Contact",
  "Referral Contact"
];

const SUPPLIER_ROLE_TAGS = [
  "Product Supplier",
  "Printing Supplier",
  "Material Supplier",
  "Packaging Supplier",
  "Equipment Vendor",
  "Wholesale Vendor",
  "Garment Blanks",
  "Service Vendor",
  "Supplier"
];

export function ContactSupplierDirectoryManager({
  contacts,
  onUpdateContacts,
  hideHeader = false
}: ContactSupplierDirectoryManagerProps) {
  const systemTime = useLiveSystemTime();

  // Local state initialized with fallback
  const [contactsList, setContactsList] = useState<ContactSupplierRecord[]>(() => {
    if (contacts && Array.isArray(contacts) && contacts.length > 0) {
      return contacts;
    }
    const saved = localStorage.getItem("ceo_contact_supplier_directory_v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_CONTACT_SUPPLIER_DIRECTORY;
  });

  const updateList = (newList: ContactSupplierRecord[]) => {
    setContactsList(newList);
    localStorage.setItem("ceo_contact_supplier_directory_v1", JSON.stringify(newList));
    if (onUpdateContacts) {
      onUpdateContacts(newList);
    }
  };

  // Main Category Selector: Operational & Business Contacts vs Suppliers & Vendors
  const [activeMainCategory, setActiveMainCategory] = useState<MainDirectoryCategory>("Operational & Business Contacts");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState<"Active" | "All" | "Inactive">("Active");

  // Modals state
  const [viewingContact, setViewingContact] = useState<ContactSupplierRecord | null>(null);
  const [editingContact, setEditingContact] = useState<ContactSupplierRecord | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [formPrimaryCategory, setFormPrimaryCategory] = useState<"Operational & Business Contacts" | "Suppliers & Vendors">("Operational & Business Contacts");
  const [formFullName, setFormFullName] = useState("");
  const [formOrganization, setFormOrganization] = useState("");
  const [formRolePosition, setFormRolePosition] = useState("");
  const [formContactType, setFormContactType] = useState<ContactType>("Business Contact");
  const [formRoles, setFormRoles] = useState<string[]>([]);
  const [formCustomRoleInput, setFormCustomRoleInput] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formWhatsapp, setFormWhatsapp] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formRelationshipDetails, setFormRelationshipDetails] = useState("");
  const [formKeyNotes, setFormKeyNotes] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formPreferredContactMethod, setFormPreferredContactMethod] = useState<"Phone" | "WhatsApp" | "Email" | "In-Person">("WhatsApp");
  const [formStatus, setFormStatus] = useState<"Active" | "Inactive">("Active");
  const [formPhoneContacts, setFormPhoneContacts] = useState<ContactPhoneContact[]>([]);

  // Supplier Specific Form Fields
  const [formProductsServicesSupplied, setFormProductsServicesSupplied] = useState("");
  const [formPricingNotes, setFormPricingNotes] = useState("");
  const [formPaymentTerms, setFormPaymentTerms] = useState("");
  const [formLeadTime, setFormLeadTime] = useState("");
  const [formReliability, setFormReliability] = useState<"High" | "Medium" | "Low" | "Unrated">("High");
  const [formLastOrder, setFormLastOrder] = useState("");
  const [formSupplierNotes, setFormSupplierNotes] = useState("");
  const [formOperatingHours, setFormOperatingHours] = useState<SupplierOperatingHours>({
    monday: { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" },
    tuesday: { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" },
    wednesday: { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" },
    thursday: { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" },
    friday: { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" },
    saturday: { isOpen: false, openTime: "9:00 AM", closeTime: "2:00 PM" },
    sunday: { isOpen: false, openTime: "9:00 AM", closeTime: "2:00 PM" }
  });

  // Switch Main Category reset role filter
  const handleSelectMainCategory = (cat: MainDirectoryCategory) => {
    setActiveMainCategory(cat);
    setRoleFilter("All Roles");
  };

  // Open Form Modal (Add / Edit)
  const handleOpenAddModal = () => {
    const targetCat = activeMainCategory === "Suppliers & Vendors" ? "Suppliers & Vendors" : "Operational & Business Contacts";
    setFormPrimaryCategory(targetCat);
    setFormFullName("");
    setFormOrganization("");
    setFormRolePosition("");
    setFormContactType(targetCat === "Suppliers & Vendors" ? "Supplier" : "Business Contact");
    setFormRoles(targetCat === "Suppliers & Vendors" ? ["Supplier"] : ["Business Associate"]);
    setFormCustomRoleInput("");
    setFormPhone("");
    setFormWhatsapp("");
    setFormEmail("");
    setFormLocation("");
    setFormRelationshipDetails("");
    setFormKeyNotes("");
    setFormNotes("");
    setFormPreferredContactMethod("WhatsApp");
    setFormStatus("Active");
    setFormPhoneContacts([]);

    setFormProductsServicesSupplied("");
    setFormPricingNotes("");
    setFormPaymentTerms("");
    setFormLeadTime("");
    setFormReliability("High");
    setFormLastOrder("");
    setFormSupplierNotes("");
    setFormOperatingHours({
      monday: { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" },
      tuesday: { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" },
      wednesday: { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" },
      thursday: { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" },
      friday: { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" },
      saturday: { isOpen: false, openTime: "9:00 AM", closeTime: "2:00 PM" },
      sunday: { isOpen: false, openTime: "9:00 AM", closeTime: "2:00 PM" }
    });

    setEditingContact(null);
    setIsAddOpen(true);
  };

  const handleOpenEditModal = (rec: ContactSupplierRecord) => {
    setEditingContact(rec);
    const isSup = rec.primaryClassification === "Suppliers & Vendors" || rec.contactType === "Supplier" || rec.isSupplier;
    const cat = isSup ? "Suppliers & Vendors" : "Operational & Business Contacts";
    
    setFormPrimaryCategory(cat);
    setFormFullName(rec.fullName || rec.contactPerson || "");
    setFormOrganization(rec.organization || rec.company || rec.supplierName || "");
    setFormRolePosition(rec.rolePosition || "");
    setFormContactType(rec.contactType || (isSup ? "Supplier" : "Business Contact"));
    setFormRoles(rec.roles || [isSup ? "Supplier" : "Business Associate"]);
    setFormCustomRoleInput("");
    setFormPhone(rec.phone || rec.phoneNumber || "");
    setFormWhatsapp(rec.whatsapp || rec.whatsappNumber || "");
    setFormEmail(rec.email || "");
    setFormLocation(rec.location || rec.address || "");
    setFormRelationshipDetails(rec.relationshipDetails || rec.servicesProvided || "");
    setFormKeyNotes(rec.keyNotes || "");
    setFormNotes(rec.notes || "");
    setFormPreferredContactMethod(rec.preferredContactMethod || "WhatsApp");
    setFormStatus(rec.status || "Active");
    setFormPhoneContacts(rec.phoneContacts || []);

    setFormProductsServicesSupplied(rec.productsServicesSupplied || rec.servicesProvided || (rec.supplies ? rec.supplies.join(", ") : ""));
    setFormPricingNotes(rec.pricingNotes || "");
    setFormPaymentTerms(rec.paymentTerms || "");
    setFormLeadTime(rec.leadTime || "");
    setFormReliability(rec.reliability || "High");
    setFormLastOrder(rec.lastOrder || "");
    setFormSupplierNotes(rec.supplierNotes || "");
    setFormOperatingHours(rec.operatingHours || {
      monday: { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" },
      tuesday: { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" },
      wednesday: { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" },
      thursday: { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" },
      friday: { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" },
      saturday: { isOpen: false, openTime: "9:00 AM", closeTime: "2:00 PM" },
      sunday: { isOpen: false, openTime: "9:00 AM", closeTime: "2:00 PM" }
    });

    setIsAddOpen(true);
  };

  const handleToggleRoleTag = (tag: string) => {
    if (formRoles.includes(tag)) {
      setFormRoles(formRoles.filter(r => r !== tag));
    } else {
      setFormRoles([...formRoles, tag]);
    }
  };

  const handleAddCustomRoleTag = () => {
    const trimmed = formCustomRoleInput.trim();
    if (trimmed && !formRoles.includes(trimmed)) {
      setFormRoles([...formRoles, trimmed]);
      setFormCustomRoleInput("");
    }
  };

  const handleAddPhoneContactRow = () => {
    const newEntry: ContactPhoneContact = {
      id: "ph_" + Date.now(),
      location: "",
      phoneNumber: "",
      contactPerson: "",
      notes: ""
    };
    setFormPhoneContacts([...formPhoneContacts, newEntry]);
  };

  const handleRemovePhoneContactRow = (id: string) => {
    setFormPhoneContacts(formPhoneContacts.filter(p => p.id !== id));
  };

  const handleUpdatePhoneContactRow = (id: string, field: keyof ContactPhoneContact, val: string) => {
    setFormPhoneContacts(formPhoneContacts.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim() && !formOrganization.trim()) {
      alert("Please provide at least a Contact Name or Company.");
      return;
    }

    const isSupplierType = formPrimaryCategory === "Suppliers & Vendors" || formContactType === "Supplier" || formRoles.includes("Supplier");
    const suppliesArray = formProductsServicesSupplied
      ? formProductsServicesSupplied.split(",").map(s => s.trim()).filter(Boolean)
      : formRelationshipDetails.split(",").map(s => s.trim()).filter(Boolean);

    const updatedRecord: ContactSupplierRecord = {
      id: editingContact ? editingContact.id : "cnt_" + Date.now(),
      fullName: formFullName.trim() || formOrganization.trim(),
      organization: formOrganization.trim(),
      company: formOrganization.trim(),
      rolePosition: formRolePosition.trim(),
      contactType: isSupplierType ? "Supplier" : formContactType,
      primaryClassification: formPrimaryCategory,
      roles: formRoles.length > 0 ? formRoles : [isSupplierType ? "Supplier" : formContactType],
      phone: formPhone.trim(),
      whatsapp: formWhatsapp.trim() || formPhone.trim(),
      email: formEmail.trim(),
      location: formLocation.trim(),
      address: formLocation.trim(),
      servicesProvided: formRelationshipDetails.trim() || formProductsServicesSupplied.trim(),
      relationshipDetails: formRelationshipDetails.trim(),
      keyNotes: formKeyNotes.trim(),
      notes: formNotes.trim(),
      preferredContactMethod: formPreferredContactMethod,
      status: formStatus,
      phoneContacts: formPhoneContacts.filter(p => p.phoneNumber.trim() !== ""),
      dateAdded: editingContact?.dateAdded || new Date().toISOString(),
      lastUpdated: new Date().toISOString(),

      // Supplier Specific Information
      isSupplier: isSupplierType,
      supplies: suppliesArray,
      productsServicesSupplied: formProductsServicesSupplied.trim() || formRelationshipDetails.trim(),
      pricingNotes: formPricingNotes.trim(),
      paymentTerms: formPaymentTerms.trim(),
      leadTime: formLeadTime.trim(),
      reliability: formReliability,
      lastOrder: formLastOrder.trim(),
      supplierNotes: formSupplierNotes.trim(),
      operatingHours: isSupplierType ? formOperatingHours : undefined,

      // Legacy fields mapping
      supplierName: formOrganization.trim() || formFullName.trim(),
      contactPerson: formFullName.trim(),
      phoneNumber: formPhone.trim(),
      whatsappNumber: formWhatsapp.trim() || formPhone.trim()
    };

    if (editingContact) {
      const newList = contactsList.map(item => item.id === editingContact.id ? updatedRecord : item);
      updateList(newList);
      if (viewingContact?.id === editingContact.id) {
        setViewingContact(updatedRecord);
      }
    } else {
      updateList([updatedRecord, ...contactsList]);
    }

    setIsAddOpen(false);
    setEditingContact(null);
  };

  const handleToggleStatus = (rec: ContactSupplierRecord) => {
    const nextStatus: "Active" | "Inactive" = rec.status === "Active" ? "Inactive" : "Active";
    const updated = contactsList.map(item => item.id === rec.id ? { ...item, status: nextStatus } : item);
    updateList(updated);
    if (viewingContact?.id === rec.id) {
      setViewingContact({ ...viewingContact, status: nextStatus });
    }
  };

  // Helper check if record is supplier
  const isSupplierRecord = (rec: ContactSupplierRecord) => {
    return (
      rec.primaryClassification === "Suppliers & Vendors" ||
      rec.contactType === "Supplier" ||
      rec.isSupplier === true ||
      rec.roles?.some(r => r.toLowerCase().includes("supplier") || r.toLowerCase().includes("vendor"))
    );
  };

  // Filtered Contacts Logic strictly respecting the active category
  const filteredContacts = contactsList.filter(rec => {
    // 1. Primary Classification Category Filter
    const recIsSupplier = isSupplierRecord(rec);
    if (activeMainCategory === "Operational & Business Contacts" && recIsSupplier) {
      return false;
    }
    if (activeMainCategory === "Suppliers & Vendors" && !recIsSupplier) {
      return false;
    }

    // 2. Status Filter
    if (statusFilter === "Active" && rec.status !== "Active") return false;
    if (statusFilter === "Inactive" && rec.status !== "Inactive") return false;

    // 3. Quick Role Filter
    if (roleFilter !== "All Roles") {
      const matchRole = rec.roles?.some(r => r.toLowerCase().includes(roleFilter.toLowerCase())) ||
        rec.servicesProvided?.toLowerCase().includes(roleFilter.toLowerCase()) ||
        rec.productsServicesSupplied?.toLowerCase().includes(roleFilter.toLowerCase()) ||
        rec.contactType?.toLowerCase().includes(roleFilter.toLowerCase()) ||
        rec.rolePosition?.toLowerCase().includes(roleFilter.toLowerCase());
      if (!matchRole) return false;
    }

    // 4. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = rec.fullName?.toLowerCase().includes(q) || rec.contactPerson?.toLowerCase().includes(q);
      const matchCompany = rec.organization?.toLowerCase().includes(q) || rec.company?.toLowerCase().includes(q) || rec.supplierName?.toLowerCase().includes(q);
      const matchRolePos = rec.rolePosition?.toLowerCase().includes(q);
      const matchPhone = rec.phone?.includes(q) || rec.phoneNumber?.includes(q) || rec.whatsapp?.includes(q);
      const matchEmail = rec.email?.toLowerCase().includes(q);
      const matchServices = rec.servicesProvided?.toLowerCase().includes(q) || rec.relationshipDetails?.toLowerCase().includes(q) || rec.productsServicesSupplied?.toLowerCase().includes(q) || rec.supplies?.some(s => s.toLowerCase().includes(q));
      const matchLocation = rec.location?.toLowerCase().includes(q) || rec.address?.toLowerCase().includes(q);
      const matchRoles = rec.roles?.some(r => r.toLowerCase().includes(q));
      const matchNotes = rec.notes?.toLowerCase().includes(q) || rec.keyNotes?.toLowerCase().includes(q) || rec.supplierNotes?.toLowerCase().includes(q);

      return matchName || matchCompany || matchRolePos || matchPhone || matchEmail || matchServices || matchLocation || matchRoles || matchNotes;
    }

    return true;
  });

  const totalActive = contactsList.filter(c => c.status === "Active").length;
  const totalSuppliersCount = contactsList.filter(c => isSupplierRecord(c)).length;
  const totalOperationalCount = contactsList.length - totalSuppliersCount;

  const currentRoleFinders = activeMainCategory === "Suppliers & Vendors" 
    ? SUPPLIER_ROLE_FINDERS 
    : OPERATIONAL_ROLE_FINDERS;

  return (
    <div className="space-y-6">
      {/* 1. Primary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Central Relationship Hub</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Contact Directory
          </h2>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Contact</span>
        </button>
      </div>

      {/* 2. Directory Classifications & Controls */}
      <div className="space-y-4">
        {/* Classification Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 self-start">
            <button
              type="button"
              onClick={() => handleSelectMainCategory("Operational & Business Contacts")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeMainCategory === "Operational & Business Contacts"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <span>Operational &amp; Business Contacts</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMainCategory("Suppliers & Vendors")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeMainCategory === "Suppliers & Vendors"
                  ? "bg-amber-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-4 h-4 text-amber-200" />
              <span>Suppliers &amp; Vendors</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMainCategory("All")}
              className={`hidden md:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMainCategory === "All"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Directory</span>
            </button>
          </div>
        </div>

        {/* Compact Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={
                  activeMainCategory === "Suppliers & Vendors"
                    ? "Search suppliers by name, company, products, address, phone..."
                    : "Search contacts by name, organization, role, phone, email..."
                }
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                {currentRoleFinders.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setStatusFilter("Active")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === "Active"
                      ? "bg-white text-emerald-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("All")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === "All"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("Inactive")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === "Inactive"
                      ? "bg-white text-rose-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Deactivated
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Grid View */}
      {filteredContacts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            {activeMainCategory === "Suppliers & Vendors" ? (
              <Building2 className="w-8 h-8 text-amber-500" />
            ) : (
              <Users className="w-8 h-8 text-indigo-500" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              No {activeMainCategory === "Suppliers & Vendors" ? "suppliers or vendors" : "operational contacts"} found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search keywords, role filters, or switching category views.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("All Roles");
              setStatusFilter("Active");
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContacts.map(rec => {
            const isSup = isSupplierRecord(rec);
            const isInactive = rec.status === "Inactive";

            return (
              <div
                key={rec.id}
                onClick={() => setViewingContact(rec)}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:shadow-md cursor-pointer ${
                  isInactive
                    ? "border-slate-200 bg-slate-50/50 opacity-75"
                    : isSup
                    ? "border-amber-200/80 hover:border-amber-300"
                    : "border-slate-200/90 hover:border-indigo-300"
                }`}
              >
                {/* Card Main Body */}
                <div className="p-5 space-y-3.5">
                  {/* Top Header: Name, Organization & Type Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                          {rec.fullName || rec.contactPerson || rec.supplierName || "Unnamed Record"}
                        </h3>
                        {rec.status === "Active" ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50 shrink-0" title="Active Record" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" title="Deactivated Record" />
                        )}
                      </div>

                      {rec.organization && (
                        <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 min-w-0 truncate">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{rec.organization}</span>
                        </p>
                      )}

                      {rec.rolePosition && (
                        <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{rec.rolePosition}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                          isSup
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : rec.contactType === "Service Provider"
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : rec.contactType === "Business Contact"
                            ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {isSup ? "Supplier / Vendor" : rec.contactType || "Contact"}
                      </span>
                      {isSup && (
                        <VendorOperatingStatusBadge operatingHours={rec.operatingHours} size="xs" />
                      )}
                    </div>
                  </div>

                  {/* Role Tags */}
                  {rec.roles && rec.roles.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      {rec.roles.map((r, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200/60"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Key Notes Highlight Callout */}
                  {rec.keyNotes && (
                    <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2 text-xs text-amber-900 flex items-start gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="label-value-row flex-1 text-[11px]">
                        <span className="label-value-label font-bold text-amber-800 uppercase text-[9px] pt-0.5">Notes:</span>
                        <span className="label-value-val font-medium leading-relaxed">{rec.keyNotes}</span>
                      </div>
                    </div>
                  )}

                  {/* Services / Products Provided */}
                  {(rec.servicesProvided || rec.relationshipDetails || rec.productsServicesSupplied) && (
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                      <div className="label-value-row text-xs">
                        <span className="label-value-label text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {isSup ? "Supplier:" : "Details:"}
                        </span>
                        <span className="label-value-val text-slate-700 leading-relaxed font-medium">
                          {rec.productsServicesSupplied || rec.relationshipDetails || rec.servicesProvided}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Location & Phone Details */}
                  <div className="space-y-1 text-xs text-slate-600">
                    {(rec.location || rec.address) && (
                      <div className="label-value-row items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="label-value-val">{rec.location || rec.address}</span>
                      </div>
                    )}
                    {(rec.phone || rec.whatsapp) && (
                      <div className="label-value-row items-center gap-1.5 font-mono font-medium text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="label-value-val">{rec.phone || rec.whatsapp}</span>
                      </div>
                    )}
                    {rec.email && (
                      <div className="label-value-row items-center gap-1.5 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="label-value-val">{rec.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Supplier Details Highlights & Operating Status (If applicable) */}
                  {isSup && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Operating Hours
                        </span>
                        <VendorOperatingStatusBadge operatingHours={rec.operatingHours} size="xs" />
                      </div>
                      {(rec.leadTime || rec.paymentTerms || rec.reliability) && (
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 block">Lead Time</span>
                            <span className="font-bold text-slate-800 truncate block">{rec.leadTime || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 block">Payment</span>
                            <span className="font-bold text-slate-800 truncate block">{rec.paymentTerms || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 block">Reliability</span>
                            <span className="font-bold text-emerald-700 truncate block">{rec.reliability || "High"}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer Quick Action Bar */}
                <div 
                  onClick={e => e.stopPropagation()} 
                  className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between gap-2"
                >
                  {/* Direct Contact Reachout Shortcuts */}
                  <div className="flex items-center gap-1.5">
                    {rec.phone && (
                      <a
                        href={`tel:${rec.phone}`}
                        title="Call Contact"
                        className="p-1.5 rounded-lg bg-white text-emerald-600 hover:bg-emerald-50 border border-slate-200 transition-all shadow-2xs"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {(rec.whatsapp || rec.phone) && (
                      <a
                        href={`https://wa.me/${(rec.whatsapp || rec.phone).replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Send WhatsApp Message"
                        className="p-1.5 rounded-lg bg-white text-emerald-600 hover:bg-emerald-50 border border-slate-200 transition-all shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {rec.email && (
                      <a
                        href={`mailto:${rec.email}`}
                        title="Send Email"
                        className="p-1.5 rounded-lg bg-white text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-all shadow-2xs"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setViewingContact(rec)}
                      className="px-2.5 py-1 rounded-lg bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(rec)}
                      title="Edit Record"
                      className="p-1.5 rounded-lg bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(rec)}
                      title={isInactive ? "Reactivate Record" : "Deactivate Record"}
                      className={`p-1.5 rounded-lg bg-white border border-slate-200 transition-all cursor-pointer ${
                        isInactive ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW CONTACT PROFILE MODAL */}
      {viewingContact && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className={`p-6 sm:p-8 relative text-white ${
              isSupplierRecord(viewingContact)
                ? "bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900"
                : "bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900"
            }`}>
              <button
                onClick={() => setViewingContact(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-2 max-w-lg">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold border border-white/10">
                    {isSupplierRecord(viewingContact) ? "Suppliers & Vendors" : "Operational & Business Contacts"}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    viewingContact.status === "Active" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}>
                    {viewingContact.status}
                  </span>
                  {isSupplierRecord(viewingContact) && (
                    <VendorOperatingStatusBadge operatingHours={viewingContact.operatingHours} size="sm" />
                  )}
                </div>

                <h2 className="text-2xl font-extrabold text-white">
                  {viewingContact.fullName || viewingContact.contactPerson || viewingContact.supplierName}
                </h2>

                {viewingContact.organization && (
                  <p className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <span>{viewingContact.organization}</span>
                  </p>
                )}

                {viewingContact.rolePosition && (
                  <p className="text-xs font-medium text-slate-300 flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-300" />
                    <span>{viewingContact.rolePosition}</span>
                  </p>
                )}

                {/* Role tags */}
                {viewingContact.roles && viewingContact.roles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {viewingContact.roles.map((r, i) => (
                      <span key={i} className="px-2.5 py-0.5 rounded-md bg-white/10 text-slate-200 text-xs font-medium">
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Quick Contact Bar */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Preferred Reachout Channel
                  </span>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 inline-block">
                    {viewingContact.preferredContactMethod || "WhatsApp"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {viewingContact.phone && (
                    <a
                      href={`tel:${viewingContact.phone}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  )}
                  {(viewingContact.whatsapp || viewingContact.phone) && (
                    <a
                      href={`https://wa.me/${(viewingContact.whatsapp || viewingContact.phone).replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  {viewingContact.email && (
                    <a
                      href={`mailto:${viewingContact.email}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Key Notes Banner */}
              {viewingContact.keyNotes && (
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-amber-900 space-y-1">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-600" />
                    Key Notes
                  </span>
                  <p className="text-xs font-medium leading-relaxed">{viewingContact.keyNotes}</p>
                </div>
              )}

              {/* Contact Channels Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                  <span className="font-bold text-slate-900">{viewingContact.phone || "N/A"}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">WhatsApp Number</span>
                  <span className="font-bold text-slate-900">{viewingContact.whatsapp || viewingContact.phone || "N/A"}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                  <span className="font-bold text-slate-900">{viewingContact.email || "N/A"}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Address / Location</span>
                  <span className="font-bold text-slate-900">{viewingContact.location || viewingContact.address || "N/A"}</span>
                </div>
              </div>

              {/* Multiple Phone Contacts */}
              {viewingContact.phoneContacts && viewingContact.phoneContacts.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                    Branch / Location Phone Contacts:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewingContact.phoneContacts.map(ph => (
                      <div key={ph.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{ph.location || "Branch"}</span>
                          {ph.contactPerson && <span className="text-[11px] text-slate-500">{ph.contactPerson}</span>}
                        </div>
                        <a href={`tel:${ph.phoneNumber}`} className="text-indigo-600 font-bold hover:underline block">
                          {ph.phoneNumber}
                        </a>
                        {ph.notes && <p className="text-[11px] text-slate-500 italic">{ph.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relationship Details or Services/Products Provided */}
              {(viewingContact.servicesProvided || viewingContact.relationshipDetails || viewingContact.productsServicesSupplied) && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                    {isSupplierRecord(viewingContact) ? "Products / Services Provided:" : "Relationship Details / Services Provided:"}
                  </span>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-800 leading-relaxed font-medium">
                    {viewingContact.productsServicesSupplied || viewingContact.relationshipDetails || viewingContact.servicesProvided}
                  </div>
                </div>
              )}

              {/* Supplier Specifics Section */}
              {isSupplierRecord(viewingContact) && (
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    Supplier &amp; Vendor Specifics
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block">Lead Time</span>
                      <span className="font-bold text-slate-900">{viewingContact.leadTime || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block">Payment Terms</span>
                      <span className="font-bold text-slate-900">{viewingContact.paymentTerms || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block">Reliability</span>
                      <span className="font-bold text-emerald-700">{viewingContact.reliability || "High"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block">Last Order</span>
                      <span className="font-bold text-slate-900">{viewingContact.lastOrder || "N/A"}</span>
                    </div>
                  </div>

                  {viewingContact.pricingNotes && (
                    <div className="text-xs text-slate-800 bg-white p-3 rounded-xl border border-amber-200">
                      <span className="font-bold text-amber-900 block mb-0.5">Pricing Notes:</span>
                      {viewingContact.pricingNotes}
                    </div>
                  )}

                  {/* Supplier Operating Hours */}
                  {viewingContact.operatingHours && (
                    <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="font-bold text-amber-900 text-xs block">Operating Hours</span>
                          <span className="text-[10px] text-slate-500">Live status synchronized with authoritative system time</span>
                        </div>
                        <VendorOperatingStatusBadge operatingHours={viewingContact.operatingHours} size="sm" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700">
                        {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map(dayKey => {
                          const sched = viewingContact.operatingHours?.[dayKey];
                          const dayLabel = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
                          const isToday = systemTime.dayName === dayKey;
                          return (
                            <div
                              key={dayKey}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-colors ${
                                isToday
                                  ? "bg-amber-100/70 border-amber-300 ring-1 ring-amber-300/60 font-semibold"
                                  : "bg-amber-50/50 border-amber-100"
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-900 capitalize">{dayLabel}:</span>
                                {isToday && (
                                  <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                                    Today
                                  </span>
                                )}
                              </div>
                              {sched?.isOpen ? (
                                <span className="font-medium text-emerald-800">
                                  {sched.openTime || "8:00 AM"} – {sched.closeTime || "5:00 PM"}
                                </span>
                              ) : (
                                <span className="font-semibold text-slate-400 italic">Closed</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Additional Notes */}
              {viewingContact.notes && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                    Additional Notes:
                  </span>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                    {viewingContact.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-5 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => handleToggleStatus(viewingContact)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  viewingContact.status === "Active"
                    ? "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                    : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500"
                }`}
              >
                {viewingContact.status === "Active" ? "Deactivate Record" : "Reactivate Record"}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const rec = viewingContact;
                    setViewingContact(null);
                    handleOpenEditModal(rec);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setViewingContact(null)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT CONTACT MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 sm:p-8 flex items-center justify-between border-b border-slate-800">
              <div>
                <h2 className="text-xl font-extrabold text-white">
                  {editingContact 
                    ? `Edit ${formPrimaryCategory === "Suppliers & Vendors" ? "Supplier / Vendor" : "Contact"} Record`
                    : `Add New ${formPrimaryCategory === "Suppliers & Vendors" ? "Supplier / Vendor" : "Contact"}`}
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  {formPrimaryCategory === "Suppliers & Vendors"
                    ? "Enter vendor details, products, payment terms, lead times, and pricing notes."
                    : "Enter relationship details, company information, role/position, and contact details."}
                </p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveContact} className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Category Selector inside Form */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Directory Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setFormPrimaryCategory("Operational & Business Contacts");
                      if (formContactType === "Supplier") setFormContactType("Business Contact");
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                      formPrimaryCategory === "Operational & Business Contacts"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Operational &amp; Business Contacts</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormPrimaryCategory("Suppliers & Vendors");
                      setFormContactType("Supplier");
                      if (!formRoles.includes("Supplier")) setFormRoles([...formRoles, "Supplier"]);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                      formPrimaryCategory === "Suppliers & Vendors"
                        ? "bg-amber-700 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-amber-200" />
                    <span>Suppliers &amp; Vendors</span>
                  </button>
                </div>
              </div>

              {/* Name & Company Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    {formPrimaryCategory === "Suppliers & Vendors" ? "Contact Person / Representative" : "Full Name"} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formFullName}
                    onChange={e => setFormFullName(e.target.value)}
                    placeholder={formPrimaryCategory === "Suppliers & Vendors" ? "e.g., Marcus Vance" : "e.g., John Brown"}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    {formPrimaryCategory === "Suppliers & Vendors" ? "Supplier / Vendor Name / Company" : "Company / Organization"} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formOrganization}
                    onChange={e => setFormOrganization(e.target.value)}
                    placeholder={formPrimaryCategory === "Suppliers & Vendors" ? "e.g., ABC Packaging & Wraps" : "e.g., Sterling Financial Advisory"}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Role Position & Contact Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formPrimaryCategory === "Operational & Business Contacts" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Role / Position
                    </label>
                    <input
                      type="text"
                      value={formRolePosition}
                      onChange={e => setFormRolePosition(e.target.value)}
                      placeholder="e.g., Chief Financial Advisor, Senior Logistics Manager"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Vendor Classification
                    </label>
                    <select
                      value={formContactType}
                      onChange={e => setFormContactType(e.target.value as ContactType)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Supplier">Product &amp; Material Supplier</option>
                      <option value="Partner / Vendor">Partner / Vendor</option>
                      <option value="Service Provider">Service Vendor</option>
                    </select>
                  </div>
                )}

                {formPrimaryCategory === "Operational & Business Contacts" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Contact Type
                    </label>
                    <select
                      value={formContactType}
                      onChange={e => setFormContactType(e.target.value as ContactType)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Business Contact">Business Contact / Associate</option>
                      <option value="Service Provider">Service Provider (Logistics, Couriers, Drivers)</option>
                      <option value="Partner / Vendor">Strategic Partner</option>
                      <option value="General Contact">General Operational Contact</option>
                      <option value="Other Important Contact">Other Key Relationship</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Address / Operating Location
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    placeholder="e.g., Kingston Industrial Estate, Kingston 11"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Roles & Tags */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Roles &amp; Tags (Multiple Allowed):
                </label>
                <div className="flex flex-wrap gap-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  {(formPrimaryCategory === "Suppliers & Vendors" ? SUPPLIER_ROLE_TAGS : OPERATIONAL_ROLE_TAGS).map(tag => {
                    const isSelected = formRoles.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => handleToggleRoleTag(tag)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? formPrimaryCategory === "Suppliers & Vendors"
                              ? "bg-amber-700 text-white font-bold shadow-2xs"
                              : "bg-indigo-600 text-white font-bold shadow-2xs"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {tag} {isSelected && "✓"}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={formCustomRoleInput}
                    onChange={e => setFormCustomRoleInput(e.target.value)}
                    placeholder="Add custom tag..."
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomRoleTag}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl"
                  >
                    Add Tag
                  </button>
                </div>
              </div>

              {/* Phone, WhatsApp, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="e.g., 876-555-0192"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">WhatsApp</label>
                  <input
                    type="text"
                    value={formWhatsapp}
                    onChange={e => setFormWhatsapp(e.target.value)}
                    placeholder="e.g., 876-555-0192"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="e.g., contact@company.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Category-Specific Fields */}
              {formPrimaryCategory === "Suppliers & Vendors" ? (
                /* SUPPLIERS & VENDORS FIELDS */
                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-4">
                  <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    Suppliers &amp; Vendors Information
                  </h4>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-amber-900 block">Products / Services Provided</label>
                    <textarea
                      rows={2}
                      value={formProductsServicesSupplied}
                      onChange={e => setFormProductsServicesSupplied(e.target.value)}
                      placeholder="e.g., Cellophane rolls, custom tissue paper, decorative ribbon, luxury gift boxes"
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-amber-900 block">Pricing Notes</label>
                      <input
                        type="text"
                        value={formPricingNotes}
                        onChange={e => setFormPricingNotes(e.target.value)}
                        placeholder="e.g., Bulk discounts over 50 units."
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-amber-900 block">Payment Terms</label>
                      <input
                        type="text"
                        value={formPaymentTerms}
                        onChange={e => setFormPaymentTerms(e.target.value)}
                        placeholder="e.g., Net 15, Cash on Delivery, 50% deposit"
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-amber-900 block">Lead Time</label>
                      <input
                        type="text"
                        value={formLeadTime}
                        onChange={e => setFormLeadTime(e.target.value)}
                        placeholder="e.g., 2-3 Business Days"
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-amber-900 block">Reliability</label>
                      <select
                        value={formReliability}
                        onChange={e => setFormReliability(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none"
                      >
                        <option value="High">High Reliability</option>
                        <option value="Medium">Medium Reliability</option>
                        <option value="Low">Low Reliability</option>
                        <option value="Unrated">Unrated</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-amber-900 block">Last Order</label>
                      <input
                        type="text"
                        value={formLastOrder}
                        onChange={e => setFormLastOrder(e.target.value)}
                        placeholder="e.g., 2026-02-01"
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Daily Operating Hours Inputs */}
                  <div className="space-y-3 pt-3 border-t border-amber-200/80">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <label className="text-xs font-bold text-amber-900 block">
                          Daily Operating Hours
                        </label>
                        <span className="text-[10px] text-amber-700 font-medium">
                          Set open/closed status &amp; hours per day
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Live Status:</span>
                        <VendorOperatingStatusBadge operatingHours={formOperatingHours} size="xs" />
                      </div>
                    </div>

                    <div className="space-y-2 bg-white/80 p-3 rounded-2xl border border-amber-200/90">
                      {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map(dayKey => {
                        const daySched = formOperatingHours[dayKey] || { isOpen: true, openTime: "8:00 AM", closeTime: "5:00 PM" };
                        const dayLabel = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
                        const isToday = systemTime.dayName === dayKey;
                        return (
                          <div key={dayKey} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl border transition-colors ${
                            isToday
                              ? "bg-amber-100/50 border-amber-300 ring-1 ring-amber-300/60"
                              : "bg-amber-50/50 border-amber-100"
                          }`}>
                            <div className="flex items-center justify-between sm:justify-start gap-3 min-w-[130px]">
                              <div className="flex items-center gap-1.5 min-w-[100px]">
                                <span className="text-xs font-bold text-slate-800 capitalize">
                                  {dayLabel}
                                </span>
                                {isToday && (
                                  <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                                    Today
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormOperatingHours({
                                    ...formOperatingHours,
                                    [dayKey]: {
                                      ...daySched,
                                      isOpen: !daySched.isOpen
                                    }
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                                  daySched.isOpen
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "bg-slate-200 text-slate-700 border-slate-300"
                                }`}
                              >
                                {daySched.isOpen ? "Open" : "Closed"}
                              </button>
                            </div>

                            {daySched.isOpen ? (
                              <div className="flex items-center gap-2 flex-1 sm:justify-end">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-500 font-medium">Open:</span>
                                  <input
                                    type="text"
                                    value={daySched.openTime || ""}
                                    onChange={e => {
                                      setFormOperatingHours({
                                        ...formOperatingHours,
                                        [dayKey]: {
                                          ...daySched,
                                          openTime: e.target.value
                                        }
                                      });
                                    }}
                                    placeholder="8:00 AM"
                                    className="w-24 px-2 py-1 bg-white border border-amber-200 rounded-lg text-xs text-slate-900 font-medium focus:outline-none"
                                  />
                                </div>
                                <span className="text-slate-400 text-xs font-bold">–</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-500 font-medium">Close:</span>
                                  <input
                                    type="text"
                                    value={daySched.closeTime || ""}
                                    onChange={e => {
                                      setFormOperatingHours({
                                        ...formOperatingHours,
                                        [dayKey]: {
                                          ...daySched,
                                          closeTime: e.target.value
                                        }
                                      });
                                    }}
                                    placeholder="5:00 PM"
                                    className="w-24 px-2 py-1 bg-white border border-amber-200 rounded-lg text-xs text-slate-900 font-medium focus:outline-none"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 font-medium italic sm:text-right flex-1">
                                Closed for business
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* OPERATIONAL & BUSINESS CONTACTS FIELDS */
                <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-4 space-y-4">
                  <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    Operational &amp; Relationship Details
                  </h4>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-indigo-900 block">Relationship Details / Services Offered</label>
                    <textarea
                      rows={2}
                      value={formRelationshipDetails}
                      onChange={e => setFormRelationshipDetails(e.target.value)}
                      placeholder="e.g., Tax compliance, financial advisory, corporate structuring, and referral networking"
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Key Notes Callout */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Key Notes (High Visibility Highlight)
                </label>
                <input
                  type="text"
                  value={formKeyNotes}
                  onChange={e => setFormKeyNotes(e.target.value)}
                  placeholder="e.g., Key point of contact for priority package shipments and waybill handling."
                  className="w-full px-3.5 py-2.5 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-950 placeholder:text-amber-800/40 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Additional Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="e.g., Available for weekend deliveries in Kingston and St. Andrew."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Preferred Reachout Channel & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Preferred Reachout Channel</label>
                  <select
                    value={formPreferredContactMethod}
                    onChange={e => setFormPreferredContactMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="Phone">Phone Call</option>
                    <option value="Email">Email Communication</option>
                    <option value="In-Person">In-Person Meeting</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Record Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Active">Active Relationship</option>
                    <option value="Inactive">Deactivated Record</option>
                  </select>
                </div>
              </div>

              {/* Branch / Phone Contacts List */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    Branch / Location Phone Contacts:
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPhoneContactRow}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Branch Number
                  </button>
                </div>

                {formPhoneContacts.map(ph => (
                  <div key={ph.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      value={ph.location}
                      onChange={e => handleUpdatePhoneContactRow(ph.id, "location", e.target.value)}
                      placeholder="Location (e.g. Kingston)"
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={ph.phoneNumber}
                      onChange={e => handleUpdatePhoneContactRow(ph.id, "phoneNumber", e.target.value)}
                      placeholder="Phone (e.g. 876-555-0193)"
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={ph.contactPerson || ""}
                      onChange={e => handleUpdatePhoneContactRow(ph.id, "contactPerson", e.target.value)}
                      placeholder="Contact Person"
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={ph.notes || ""}
                        onChange={e => handleUpdatePhoneContactRow(ph.id, "notes", e.target.value)}
                        placeholder="Notes"
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoneContactRow(ph.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  {editingContact ? "Save Changes" : "Create Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
