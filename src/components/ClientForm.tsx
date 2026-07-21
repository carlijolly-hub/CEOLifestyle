import React, { useState, useEffect } from "react";
import { Client, ClientTier, HomeBrand, Gender, YesNo } from "../types";
import { X, User, MapPin, Heart, Trophy, Save, ShoppingCart, AlertCircle } from "lucide-react";
import { parseMonthDay } from "../utils/dateHelpers";

interface ClientFormProps {
  customer?: Client | null; // If provided, we are editing. Otherwise, adding.
  onSave: (customer: Client) => void;
  onCancel: () => void;
  existingCustomers?: Client[];
}

export default function ClientForm({ customer, onSave, onCancel, existingCustomers = [] }: ClientFormProps) {
  const isEditing = !!customer;

  // Track active section/tab in form wizard
  const [activeTab, setActiveTab] = useState<"personal" | "contact" | "family" | "interests">("personal");

  // Error and Warning States
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    type: "id" | "name" | "phone" | "email";
    message: string;
    clientId: string;
  } | null>(null);
  const [bypassDuplicate, setBypassDuplicate] = useState(false);

  // State bindings
  const [id, setId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<Gender>("N/A");
  const [occupation, setOccupation] = useState("");
  const [drive, setDrive] = useState<YesNo>("No");
  const [tier, setTier] = useState<ClientTier>("Silver");
  const [homeBrand, setHomeBrand] = useState<HomeBrand>("CEO Lifestyle");

  // Contact
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [parish, setParish] = useState("N/A");
  const [country, setCountry] = useState("Jamaica");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCountry, setDeliveryCountry] = useState("Jamaica");

  // Family Relations
  const [motherName, setMotherName] = useState("");
  const [motherBirthday, setMotherBirthday] = useState("");
  const [motherDeceased, setMotherDeceased] = useState(false);

  const [fatherName, setFatherName] = useState("");
  const [fatherBirthday, setFatherBirthday] = useState("");
  const [fatherDeceased, setFatherDeceased] = useState(false);

  const [wifeName, setWifeName] = useState("");
  const [wifeBirthday, setWifeBirthday] = useState("");
  const [wifeDeceased, setWifeDeceased] = useState(false);

  const [husbandName, setHusbandName] = useState("");
  const [husbandBirthday, setHusbandBirthday] = useState("");
  const [husbandDeceased, setHusbandDeceased] = useState(false);

  const [children, setChildren] = useState<{ name: string; birthday?: string; deceased?: boolean }[]>([]);
  const [otherFamilyMembers, setOtherFamilyMembers] = useState<{ relationship: string; name: string; birthday?: string; deceased?: boolean }[]>([]);
  const [pets, setPets] = useState("");
  const [personalNotes, setPersonalNotes] = useState("");

  // Important Dates
  const [birthday, setBirthday] = useState("");
  const [anniversary, setAnniversary] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [proposalDate, setProposalDate] = useState("");
  const [otherDatesStr, setOtherDatesStr] = useState(""); // Company Anniversary: March 10

  // History & Spend Value (Defaults for new, filled for edit)
  const [firstOrderDate, setFirstOrderDate] = useState("");
  const [lastOrderDate, setLastOrderDate] = useState("");
  const [totalOrders, setTotalOrders] = useState(0);
  const [lifetimeRevenue, setLifetimeRevenue] = useState(0);
  const [productsPurchased, setProductsPurchased] = useState("");
  const [preferredCategories, setPreferredCategories] = useState("");
  const [clientPreferences, setClientPreferences] = useState("");

  // Lifestyle Interests
  const [sport, setSport] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const [teamOne, setTeamOne] = useState("");
  const [teamTwo, setTeamTwo] = useState("");
  const [favoritePlayer, setFavoritePlayer] = useState("");
  const [nationalTeam, setNationalTeam] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [favoriteColors, setFavoriteColors] = useState("");
  const [giftPreferences, setGiftPreferences] = useState("");

  // Communication Prefs
  const [preferredCommunication, setPreferredCommunication] = useState<Client["preferredCommunication"]>("Email");
  const [marketingPermission, setMarketingPermission] = useState<YesNo>("Yes");

  // Load fields when customer prop changes (for Editing)
  useEffect(() => {
    if (customer) {
      setId(customer.id);
      setFirstName(customer.firstName);
      setLastName(customer.lastName);
      setGender(customer.gender);
      setOccupation(customer.occupation);
      setDrive(customer.drive);
      setTier(customer.tier);
      setHomeBrand(customer.homeBrand);

      setPhoneNumber(customer.contact.phoneNumber);
      setEmail(customer.contact.email);
      setCity(customer.contact.city);
      setParish(customer.contact.parish);
      setCountry(customer.contact.country);
      setDeliveryAddress(customer.contact.deliveryAddress);
      setDeliveryCountry(customer.contact.deliveryCountry);

      setMotherName(customer.profile.motherName || "");
      setMotherBirthday(customer.profile.motherBirthday || "");
      setMotherDeceased(!!customer.profile.motherDeceased);

      setFatherName(customer.profile.fatherName || "");
      setFatherBirthday(customer.profile.fatherBirthday || "");
      setFatherDeceased(!!customer.profile.fatherDeceased);

      setWifeName(customer.profile.wifeName || "");
      setWifeBirthday(customer.profile.wifeBirthday || "");
      setWifeDeceased(!!customer.profile.wifeDeceased);

      setHusbandName(customer.profile.husbandName || "");
      setHusbandBirthday(customer.profile.husbandBirthday || "");
      setHusbandDeceased(!!customer.profile.husbandDeceased);
      
      setChildren(customer.profile.children || []);
      setOtherFamilyMembers(customer.profile.otherFamilyMembers || []);
      
      setPets(customer.profile.pets);
      setPersonalNotes(customer.profile.personalNotes);

      // Extract specific important dates
      setBirthday(customer.importantDates.find(d => d.label === "Birthday")?.date || "");
      setAnniversary(customer.importantDates.find(d => d.label === "Anniversary")?.date || "");
      setWeddingDate(customer.importantDates.find(d => d.label === "Wedding Date")?.date || "");
      setProposalDate(customer.importantDates.find(d => d.label === "Proposal Date")?.date || "");
      
      const others = customer.importantDates
        .filter(d => !["Birthday", "Anniversary", "Wedding Date", "Proposal Date"].includes(d.label))
        .map(d => `${d.label}: ${d.date}`)
        .join("; ");
      setOtherDatesStr(others);

      // History
      setFirstOrderDate(customer.history.firstOrderDate);
      setLastOrderDate(customer.history.lastOrderDate);
      setTotalOrders(customer.history.totalOrders);
      setLifetimeRevenue(customer.history.lifetimeRevenue);
      setProductsPurchased(customer.history.productsPurchased.join(", "));
      setPreferredCategories(customer.history.preferredCategories.join(", "));
      setClientPreferences(customer.history.clientPreferences.join(", "));

      // Interests
      setSport(customer.interests.sports.sport || "");
      setFavoriteTeam(customer.interests.sports.favoriteTeam);
      setTeamOne(customer.interests.sports.teamOne);
      setTeamTwo(customer.interests.sports.teamTwo);
      setFavoritePlayer(customer.interests.sports.favoritePlayer);
      setNationalTeam(customer.interests.sports.nationalTeam || "");
      setHobbies(customer.interests.hobbies.join(", "));
      setFavoriteColors(customer.interests.favoriteColors.join(", "));
      setGiftPreferences(customer.interests.giftPreferences.join(", "));

      setPreferredCommunication(customer.preferredCommunication);
      setMarketingPermission(customer.marketingPermission || "Yes");
    } else {
      // Clear all state to default empty
      const generatedId = String(Math.floor(100000 + Math.random() * 900000));
      setId(generatedId);
      setFirstName("");
      setLastName("");
      setGender("Female");
      setOccupation("Business Executive");
      setDrive("Yes");
      setTier("Silver");
      setHomeBrand("CEO Lifestyle");

      setPhoneNumber("");
      setEmail("");
      setCity("");
      setParish("St. Andrew");
      setCountry("Jamaica");
      setDeliveryAddress("");
      setDeliveryCountry("Jamaica");
      setMarketingPermission("Yes");

      setMotherName("");
      setMotherBirthday("");
      setMotherDeceased(false);
      setFatherName("");
      setFatherBirthday("");
      setFatherDeceased(false);
      setWifeName("");
      setWifeBirthday("");
      setWifeDeceased(false);
      setHusbandName("");
      setHusbandBirthday("");
      setHusbandDeceased(false);
      setChildren([]);
      setOtherFamilyMembers([]);
      setPets("None");
      setPersonalNotes("");

      setBirthday("");
      setAnniversary("");
      setWeddingDate("");
      setProposalDate("");
      setOtherDatesStr("");

      setFirstOrderDate(new Date().toISOString().split("T")[0]);
      setLastOrderDate(new Date().toISOString().split("T")[0]);
      setTotalOrders(0);
      setLifetimeRevenue(0);
      setProductsPurchased("");
      setPreferredCategories("");
      setClientPreferences("");

      setSport("");
      setFavoriteTeam("");
      setTeamOne("");
      setTeamTwo("");
      setFavoritePlayer("");
      setNationalTeam("");
      setHobbies("");
      setFavoriteColors("");
      setGiftPreferences("");
      setPreferredCommunication("Email");
    }
  }, [customer]);

  // Dynamic duplicate checking
  useEffect(() => {
    if (!existingCustomers || existingCustomers.length === 0) return;
    setDuplicateWarning(null);

    const checkId = id.trim().toLowerCase();
    const checkFirst = firstName.trim().toLowerCase();
    const checkLast = lastName.trim().toLowerCase();
    const checkPhone = phoneNumber.trim().replace(/\D/g, "");
    const checkEmail = email.trim().toLowerCase();

    if (!checkFirst && !checkLast && !checkPhone && !checkEmail && !checkId) return;

    for (const c of existingCustomers) {
      if (customer && c.id === customer.id) continue;

      if (checkId && c.id.toLowerCase() === checkId) {
        setDuplicateWarning({
          type: "id",
          message: `Customer ID "${id}" is already assigned to ${c.firstName} ${c.lastName}.`,
          clientId: c.id
        });
        return;
      }
      if (checkFirst && checkLast && c.firstName.toLowerCase() === checkFirst && c.lastName.toLowerCase() === checkLast) {
        setDuplicateWarning({
          type: "name",
          message: `A client named "${firstName} ${lastName}" already exists.`,
          clientId: c.id
        });
        return;
      }
      if (checkPhone && c.contact.phoneNumber.replace(/\D/g, "") === checkPhone) {
        setDuplicateWarning({
          type: "phone",
          message: `Phone number "${phoneNumber}" is registered to ${c.firstName} ${c.lastName}.`,
          clientId: c.id
        });
        return;
      }
      if (checkEmail && c.contact.email.toLowerCase() === checkEmail) {
        setDuplicateWarning({
          type: "email",
          message: `Email "${email}" is registered to ${c.firstName} ${c.lastName}.`,
          clientId: c.id
        });
        return;
      }
    }
  }, [id, firstName, lastName, phoneNumber, email, existingCustomers, customer]);

  // Handle Save
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Missing required client information
    if (!firstName.trim() || !lastName.trim()) {
      setFormError("First Name and Last Name are required.");
      setActiveTab("personal");
      return;
    }

    if (!phoneNumber.trim()) {
      setFormError("Phone Number is required for client validation.");
      setActiveTab("contact");
      return;
    }

    if (!email.trim()) {
      setFormError("Email Address is required for client validation.");
      setActiveTab("contact");
      return;
    }

    // 2. Validate format of email address
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError("Please enter a valid email address (e.g. name@domain.com).");
      setActiveTab("contact");
      return;
    }

    // 3. Date format and plausibility validation
    const textDatesToValidate = [
      { label: "Birthday", value: birthday },
      { label: "Anniversary", value: anniversary },
      { label: "Wedding Date", value: weddingDate },
      { label: "Proposal Date", value: proposalDate },
      { label: "Mother's Birthday", value: motherBirthday },
      { label: "Father's Birthday", value: fatherBirthday },
      { label: "Wife's Birthday", value: wifeBirthday },
      { label: "Husband's Birthday", value: husbandBirthday },
    ];

    for (const dt of textDatesToValidate) {
      if (dt.value && dt.value.trim()) {
        const parsed = parseMonthDay(dt.value);
        if (!parsed) {
          setFormError(`"${dt.label}" has an invalid date format. Please use a format like "May 10" or "August 22".`);
          setActiveTab(dt.label.includes("Mother") || dt.label.includes("Father") || dt.label.includes("Wife") || dt.label.includes("Husband") ? "family" : "personal");
          return;
        }
      }
    }

    // Children's birthdays
    for (let idx = 0; idx < children.length; idx++) {
      const child = children[idx];
      if (child.birthday && child.birthday.trim()) {
        const parsed = parseMonthDay(child.birthday);
        if (!parsed) {
          setFormError(`Child #${idx + 1} ("${child.name || "Unnamed"}") has an invalid birthday. Use format like "May 10".`);
          setActiveTab("family");
          return;
        }
      }
    }

    // Other family members
    for (let idx = 0; idx < otherFamilyMembers.length; idx++) {
      const member = otherFamilyMembers[idx];
      if (member.birthday && member.birthday.trim()) {
        const parsed = parseMonthDay(member.birthday);
        if (!parsed) {
          setFormError(`Family Member "${member.name || member.relationship}" has an invalid birthday. Use format like "May 10".`);
          setActiveTab("family");
          return;
        }
      }
    }

    // ISO Dates validation
    if (firstOrderDate && new Date(firstOrderDate) > new Date()) {
      setFormError("First Order Date cannot be in the future.");
      setActiveTab("interests");
      return;
    }
    if (lastOrderDate && new Date(lastOrderDate) > new Date()) {
      setFormError("Last Order Date cannot be in the future.");
      setActiveTab("interests");
      return;
    }
    if (firstOrderDate && lastOrderDate && new Date(lastOrderDate) < new Date(firstOrderDate)) {
      setFormError("Last Order Date cannot be before First Order Date.");
      setActiveTab("interests");
      return;
    }

    // 4. Duplicate checks
    if (duplicateWarning) {
      if (duplicateWarning.type === "id") {
        setFormError(`Save blocked: Customer ID "${id}" is already assigned to another profile.`);
        setActiveTab("personal");
        return;
      }
      if (!bypassDuplicate) {
        setFormError("Please review the duplicate warnings and check 'Confirm this is a unique client profile' to save.");
        return;
      }
    }

    // Parse Comma Separated lists
    const parseList = (val: string): string[] => {
      return val ? val.split(",").map(s => s.trim()).filter(Boolean) : [];
    };

    // Assemble Important Dates
    const importantDates = [];
    if (birthday) importantDates.push({ label: "Birthday", date: birthday });
    if (anniversary) importantDates.push({ label: "Anniversary", date: anniversary });
    if (weddingDate) importantDates.push({ label: "Wedding Date", date: weddingDate });
    if (proposalDate) importantDates.push({ label: "Proposal Date", date: proposalDate });
    if (otherDatesStr) {
      otherDatesStr.split(";").forEach(s => {
        const parts = s.split(":");
        if (parts.length >= 2) {
          importantDates.push({ label: parts[0].trim(), date: parts.slice(1).join(":").trim() });
        }
      });
    }

    const calculatedAOV = totalOrders > 0 ? Math.round(lifetimeRevenue / totalOrders) : 0;

    const savedClient: Client = {
      id: id || String(Math.floor(100000 + Math.random() * 900000)),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      occupation: occupation.trim() || "Business Owner",
      drive,
      tier,
      homeBrand,
      contact: {
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
        city: city.trim(),
        parish,
        country: country.trim(),
        deliveryAddress: deliveryAddress.trim(),
        deliveryCountry: deliveryCountry.trim()
      },
      profile: {
        motherName: motherName.trim(),
        motherBirthday: motherBirthday.trim(),
        motherDeceased,
        fatherName: fatherName.trim(),
        fatherBirthday: fatherBirthday.trim(),
        fatherDeceased,
        wifeName: wifeName.trim(),
        wifeBirthday: wifeBirthday.trim(),
        wifeDeceased,
        husbandName: husbandName.trim(),
        husbandBirthday: husbandBirthday.trim(),
        husbandDeceased,
        children,
        otherFamilyMembers,
        pets: pets.trim() || "None",
        personalNotes: personalNotes.trim()
      },
      importantDates,
      history: {
        firstOrderDate: firstOrderDate || new Date().toISOString().split("T")[0],
        lastOrderDate: lastOrderDate || new Date().toISOString().split("T")[0],
        totalOrders: Number(totalOrders) || 0,
        productsPurchased: parseList(productsPurchased),
        preferredCategories: parseList(preferredCategories),
        clientPreferences: parseList(clientPreferences),
        lifetimeRevenue: Number(lifetimeRevenue) || 0,
        averageOrderValue: calculatedAOV
      },
      interests: {
        sports: {
          sport: sport.trim(),
          favoriteTeam: favoriteTeam.trim(),
          teamOne: teamOne.trim(),
          teamTwo: teamTwo.trim(),
          favoritePlayer: favoritePlayer.trim(),
          nationalTeam: nationalTeam.trim()
        },
        hobbies: parseList(hobbies),
        favoriteColors: parseList(favoriteColors),
        giftPreferences: parseList(giftPreferences)
      },
      timeline: customer?.timeline || [
        {
          id: `t_${Date.now()}`,
          type: "Note",
          date: new Date().toISOString().split("T")[0],
          content: isEditing ? "Client information updated." : "New client profile established."
        }
      ],
      reminders: customer?.reminders || [],
      preferredCommunication,
      lastContactedDate: customer?.lastContactedDate || new Date().toISOString().split("T")[0],
      marketingPermission
    };

    onSave(savedClient);
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl shadow-md text-left max-w-4xl mx-auto animate-fade-in overflow-hidden text-slate-800">
      
      {/* Title Header Cover */}
      <div className="bg-gradient-to-tr from-slate-50 via-slate-100/40 to-slate-100/80 border-b border-slate-200/60 px-6 py-5 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-950">
            {isEditing ? "Modify Client Account" : "Register New Premium Client"}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-bold">
            {isEditing ? `Adjust specifications for account: ${id}` : "Establish a complete 360-degree relationship file"}
          </p>
        </div>
        <button 
          onClick={onCancel}
          className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="divide-y divide-slate-100">
        
        {/* Apple style sub-navigation tabs */}
        <div className="flex border-b border-slate-200/60 px-6 bg-slate-50/40">
          <button
            type="button"
            onClick={() => setActiveTab("personal")}
            className={`flex items-center gap-1.5 py-3.5 px-4 text-xs font-bold border-b-2 transition-all -mb-px ${
              activeTab === "personal" 
                ? "border-slate-900 text-slate-950" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="w-4 h-4" /> Personal Identity
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("contact")}
            className={`flex items-center gap-1.5 py-3.5 px-4 text-xs font-bold border-b-2 transition-all -mb-px ${
              activeTab === "contact" 
                ? "border-slate-900 text-slate-950" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <MapPin className="w-4 h-4" /> Contact & Logistics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("family")}
            className={`flex items-center gap-1.5 py-3.5 px-4 text-xs font-bold border-b-2 transition-all -mb-px ${
              activeTab === "family" 
                ? "border-slate-900 text-slate-950" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Heart className="w-4 h-4" /> Family Ties & Dates
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("interests")}
            className={`flex items-center gap-1.5 py-3.5 px-4 text-xs font-bold border-b-2 transition-all -mb-px ${
              activeTab === "interests" 
                ? "border-slate-900 text-slate-950" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Trophy className="w-4 h-4" /> Interests & Sales History
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 md:p-8 space-y-6">
          
          {/* PERSONAL IDENTITY TAB */}
          {activeTab === "personal" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in text-xs">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client ID (CID)</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., 10001"
                  value={id}
                  onChange={(e) => setId(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Tier</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as ClientTier)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 font-bold transition-colors"
                >
                  <option value="Silver">Silver Tier</option>
                  <option value="Gold">Gold Tier</option>
                  <option value="Platinum">Platinum Tier</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">First Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Daniel"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Williams"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 font-bold transition-colors"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Occupation</label>
                <input
                  type="text"
                  placeholder="E.g., Business Owner"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Drive (Yes/No)</label>
                <select
                  value={drive}
                  onChange={(e) => setDrive(e.target.value as YesNo)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 font-bold transition-colors"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Home Brand Connection</label>
                <select
                  value={homeBrand}
                  onChange={(e) => setHomeBrand(e.target.value as HomeBrand)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 font-bold transition-colors"
                >
                  <option value="CEO Lifestyle">CEO Lifestyle (CEO Printing & Librarium)</option>
                  <option value="CEO Printing Services">CEO Printing Services Only</option>
                  <option value="Librarium Luxe">Librarium Luxe Only</option>
                </select>
              </div>
            </div>
          )}

          {/* CONTACT & LOGISTICS TAB */}
          {activeTab === "contact" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in text-xs">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                <input
                  type="text"
                  placeholder="E.g., +1 (876) 555-0182"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  placeholder="E.g., name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Home/Residence City</label>
                <input
                  type="text"
                  placeholder="E.g., Montego Bay, Toronto"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Residing Country</label>
                <input
                  type="text"
                  placeholder="E.g., Jamaica, Canada, United States"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium transition-colors"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Local Recipient Delivery Address in Jamaica</label>
                <textarea
                  placeholder="E.g., Ironshore, Montego Bay"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-450 font-medium transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parish (Jamaica Local Recipients)</label>
                <select
                  value={parish}
                  onChange={(e) => setParish(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 font-bold transition-colors"
                >
                  <option value="N/A">N/A (Overseas Only)</option>
                  <option value="St. James">St. James (Montego Bay)</option>
                  <option value="St. Andrew">St. Andrew</option>
                  <option value="Kingston">Kingston</option>
                  <option value="St. Ann">St. Ann (Ocho Rios)</option>
                  <option value="Westmoreland">Westmoreland (Negril)</option>
                  <option value="St. Catherine">St. Catherine</option>
                  <option value="Clarendon">Clarendon</option>
                  <option value="Manchester">Manchester</option>
                  <option value="Hanover">Hanover</option>
                  <option value="Trelawny">Trelawny</option>
                  <option value="Portland">Portland</option>
                  <option value="St. Mary">St. Mary</option>
                  <option value="St. Elizabeth">St. Elizabeth</option>
                  <option value="Thomas">St. Thomas</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delivery Country</label>
                <input
                  type="text"
                  placeholder="E.g., Jamaica"
                  value={deliveryCountry}
                  onChange={(e) => setDeliveryCountry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preferred Outreach Channel</label>
                <select
                  value={preferredCommunication}
                  onChange={(e) => setPreferredCommunication(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 font-bold transition-colors"
                >
                  <option value="WhatsApp">WhatsApp Message</option>
                  <option value="Email">Standard Email</option>
                  <option value="Phone">Phone Calls</option>
                  <option value="N/A">No Contact Requested</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Marketing Notifications</label>
                <select
                  value={marketingPermission}
                  onChange={(e) => setMarketingPermission(e.target.value as YesNo)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 font-bold transition-colors"
                >
                  <option value="Yes">Yes (Enable marketing campaigns)</option>
                  <option value="No">No (Opt-out from marketing campaign targeting)</option>
                </select>
              </div>
            </div>
          )}

          {/* FAMILY TIES & DATES TAB */}
          {activeTab === "family" && (
            <div className="space-y-6 animate-fade-in text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mother Card */}
                <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 space-y-3 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Mother</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Name</label>
                      <input
                        type="text"
                        placeholder="Mother's Name"
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-lg p-2.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Birthday</label>
                      <input
                        type="text"
                        placeholder="E.g., May 10"
                        value={motherBirthday}
                        onChange={(e) => setMotherBirthday(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-lg p-2.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={motherDeceased}
                      onChange={(e) => setMotherDeceased(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-600">Deceased</span>
                  </label>
                </div>

                {/* Father Card */}
                <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 space-y-3 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Father</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Name</label>
                      <input
                        type="text"
                        placeholder="Father's Name"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-lg p-2.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Birthday</label>
                      <input
                        type="text"
                        placeholder="E.g., September 12"
                        value={fatherBirthday}
                        onChange={(e) => setFatherBirthday(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-lg p-2.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={fatherDeceased}
                      onChange={(e) => setFatherDeceased(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-600">Deceased</span>
                  </label>
                </div>

                {/* Wife Card */}
                <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 space-y-3 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Partner / Wife</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Name</label>
                      <input
                        type="text"
                        placeholder="Wife's Name"
                        value={wifeName}
                        onChange={(e) => setWifeName(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-lg p-2.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Birthday</label>
                      <input
                        type="text"
                        placeholder="E.g., October 24"
                        value={wifeBirthday}
                        onChange={(e) => setWifeBirthday(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-lg p-2.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={wifeDeceased}
                      onChange={(e) => setWifeDeceased(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-600">Deceased</span>
                  </label>
                </div>

                {/* Husband Card */}
                <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 space-y-3 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Partner / Husband</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Name</label>
                      <input
                        type="text"
                        placeholder="Husband's Name"
                        value={husbandName}
                        onChange={(e) => setHusbandName(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-lg p-2.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Birthday</label>
                      <input
                        type="text"
                        placeholder="E.g., December 5"
                        value={husbandBirthday}
                        onChange={(e) => setHusbandBirthday(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-lg p-2.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={husbandDeceased}
                      onChange={(e) => setHusbandDeceased(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-600">Deceased</span>
                  </label>
                </div>

                {/* Children Section */}
                <div className="md:col-span-2 bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 space-y-3 text-left">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Children</span>
                    <button
                      type="button"
                      onClick={() => setChildren([...children, { name: "", birthday: "", deceased: false }])}
                      className="text-slate-700 hover:text-slate-950 text-xs font-bold flex items-center gap-1 bg-white border border-slate-200 hover:border-slate-400 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      + Add Child
                    </button>
                  </div>
                  {children.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-1">No children added yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {children.map((child, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end bg-white border border-slate-100 p-3 rounded-xl relative group">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Child's Name</label>
                            <input
                              type="text"
                              required
                              placeholder="Name"
                              value={child.name}
                              onChange={(e) => {
                                const updated = [...children];
                                updated[idx].name = e.target.value;
                                setChildren(updated);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-lg p-2 text-xs font-semibold text-slate-800"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Birthday</label>
                            <input
                              type="text"
                              placeholder="E.g., November 19"
                              value={child.birthday || ""}
                              onChange={(e) => {
                                const updated = [...children];
                                updated[idx].birthday = e.target.value;
                                setChildren(updated);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-lg p-2 text-xs font-semibold text-slate-800"
                            />
                          </div>
                          <div className="flex justify-between items-center gap-2 h-10">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!child.deceased}
                                onChange={(e) => {
                                  const updated = [...children];
                                  updated[idx].deceased = e.target.checked;
                                  setChildren(updated);
                                }}
                                className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                              />
                              <span className="text-xs font-bold text-slate-600">Deceased</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setChildren(children.filter((_, i) => i !== idx));
                              }}
                              className="text-red-500 hover:text-red-700 text-xs font-bold bg-red-50 border border-red-100 px-2 py-1 rounded"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Other Family Members Section */}
                <div className="md:col-span-2 bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 space-y-3 text-left">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Other Family Members</span>
                      <p className="text-[9px] text-slate-400 mt-0.5 font-bold">Add brothers, sisters, and other relations</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtherFamilyMembers([...otherFamilyMembers, { relationship: "Brother", name: "", birthday: "", deceased: false }])}
                      className="text-slate-700 hover:text-slate-950 text-xs font-bold flex items-center gap-1 bg-white border border-slate-200 hover:border-slate-400 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      + Add Family Member
                    </button>
                  </div>
                  {otherFamilyMembers.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-1">No other family members added yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {otherFamilyMembers.map((member, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end bg-white border border-slate-100 p-3 rounded-xl relative group">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Relationship</label>
                            <input
                              type="text"
                              required
                              placeholder="E.g. Brother, Sister"
                              value={member.relationship}
                              onChange={(e) => {
                                const updated = [...otherFamilyMembers];
                                updated[idx].relationship = e.target.value;
                                setOtherFamilyMembers(updated);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-lg p-2 text-xs font-semibold text-slate-800"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                            <input
                              type="text"
                              required
                              placeholder="Name"
                              value={member.name}
                              onChange={(e) => {
                                const updated = [...otherFamilyMembers];
                                updated[idx].name = e.target.value;
                                setOtherFamilyMembers(updated);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-lg p-2 text-xs font-semibold text-slate-800"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Birthday</label>
                            <input
                              type="text"
                              placeholder="E.g. April 12"
                              value={member.birthday || ""}
                              onChange={(e) => {
                                const updated = [...otherFamilyMembers];
                                updated[idx].birthday = e.target.value;
                                setOtherFamilyMembers(updated);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-lg p-2 text-xs font-semibold text-slate-800"
                            />
                          </div>
                          <div className="flex justify-between items-center gap-2 h-10">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!member.deceased}
                                onChange={(e) => {
                                  const updated = [...otherFamilyMembers];
                                  updated[idx].deceased = e.target.checked;
                                  setOtherFamilyMembers(updated);
                                }}
                                className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                              />
                              <span className="text-xs font-bold text-slate-600">Deceased</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setOtherFamilyMembers(otherFamilyMembers.filter((_, i) => i !== idx));
                              }}
                              className="text-red-500 hover:text-red-700 text-xs font-bold bg-red-50 border border-red-100 px-2 py-1 rounded"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pets Description</label>
                  <input
                    type="text"
                    placeholder="E.g., Bruno (Dog), Coco (Cat)"
                    value={pets}
                    onChange={(e) => setPets(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Birthday (Month Day)</label>
                  <input
                    type="text"
                    placeholder="E.g., March 14"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Anniversary (Month Day)</label>
                  <input
                    type="text"
                    placeholder="E.g., August 22"
                    value={anniversary}
                    onChange={(e) => setAnniversary(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wedding Date</label>
                  <input
                    type="text"
                    placeholder="E.g., August 22, 2018"
                    value={weddingDate}
                    onChange={(e) => setWeddingDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proposal Date</label>
                  <input
                    type="text"
                    placeholder="E.g., December 10, 2017"
                    value={proposalDate}
                    onChange={(e) => setProposalDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium transition-colors"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Other Important Dates (Label: Date, separated by semi-colon)</label>
                  <input
                    type="text"
                    placeholder="E.g., Business Anniversary: January 15; Mother's Birthday: September 3"
                    value={otherDatesStr}
                    onChange={(e) => setOtherDatesStr(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium transition-colors"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Internal Client Notes & Packaging Directives</label>
                  <textarea
                    placeholder="E.g., Prefers premium packaging and early notifications for new collections."
                    value={personalNotes}
                    onChange={(e) => setPersonalNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium transition-colors"
                  />
                </div>
              </div>

            </div>
          )}

          {/* INTERESTS & HISTORY TAB */}
          {activeTab === "interests" && (
            <div className="space-y-6 animate-fade-in text-xs">
              
              {/* Historical Purchase Values */}
              <div className="bg-slate-50/50 p-5 border border-slate-200/60 rounded-2xl space-y-4">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold uppercase tracking-wider pb-2 border-b border-slate-200">
                  <ShoppingCart className="w-4 h-4 text-slate-600" />
                  <span>Legacy Purchase Statistics (Initial Values)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Orders Placed</label>
                    <input
                      type="number"
                      placeholder="E.g., 8"
                      value={totalOrders}
                      onChange={(e) => setTotalOrders(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-slate-800 font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Liftiver Value (JMD)</label>
                    <input
                      type="number"
                      placeholder="E.g., 385000"
                      value={lifetimeRevenue}
                      onChange={(e) => setLifetimeRevenue(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-slate-800 font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">First Order Date</label>
                    <input
                      type="date"
                      value={firstOrderDate}
                      onChange={(e) => setFirstOrderDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Order Date</label>
                    <input
                      type="date"
                      value={lastOrderDate}
                      onChange={(e) => setLastOrderDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bespoke Product Preferences (Comma Separated)</label>
                    <input
                      type="text"
                      placeholder="E.g., Black and gold designs, Luxury presentation, Exclusive launches"
                      value={clientPreferences}
                      onChange={(e) => setClientPreferences(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preferred Products & Categories (Comma Separated)</label>
                    <input
                      type="text"
                      placeholder="E.g., Premium Apparel, Personalized Gifts, Mindset Books"
                      value={preferredCategories}
                      onChange={(e) => setPreferredCategories(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Specific Products Purchased (Comma Separated)</label>
                    <input
                      type="text"
                      placeholder="E.g., Custom T-Shirts, Business Branding, Luxury Gift Boxes"
                      value={productsPurchased}
                      onChange={(e) => setProductsPurchased(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Sports Alignment */}
              <div className="bg-slate-50/50 p-5 border border-slate-200/60 rounded-2xl space-y-4">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold uppercase tracking-wider pb-2 border-b border-slate-200">
                  <Trophy className="w-4 h-4 text-slate-600" />
                  <span>Sports Alignment Profile</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sport / League Type</label>
                    <input
                      type="text"
                      placeholder="E.g., Football (NFL), Formula 1"
                      value={sport}
                      onChange={(e) => setSport(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Favorite Sports Team</label>
                    <input
                      type="text"
                      placeholder="E.g., Manchester United"
                      value={favoriteTeam}
                      onChange={(e) => setFavoriteTeam(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team One (Primary Club)</label>
                    <input
                      type="text"
                      placeholder="E.g., Manchester United, Toronto Raptors"
                      value={teamOne}
                      onChange={(e) => setTeamOne(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Two (Secondary Club)</label>
                    <input
                      type="text"
                      placeholder="E.g., Liverpool FC, Golden State Warriors"
                      value={teamTwo}
                      onChange={(e) => setTeamTwo(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">National Team</label>
                    <input
                      type="text"
                      placeholder="E.g., Jamaica National Football Team"
                      value={nationalTeam}
                      onChange={(e) => setNationalTeam(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Favorite Player</label>
                    <input
                      type="text"
                      placeholder="E.g., Cristiano Ronaldo, Scottie Barnes"
                      value={favoritePlayer}
                      onChange={(e) => setFavoritePlayer(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Hobbies & Style Preferences */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hobbies (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="E.g., Business, Football, Travel"
                    value={hobbies}
                    onChange={(e) => setHobbies(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Favorite Colors (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="E.g., Black, Gold, White"
                    value={favoriteColors}
                    onChange={(e) => setFavoriteColors(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gift Preferences & Visual Presentation Guidelines (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="E.g., Luxury personalized gifts, Book bundles, Romantic keepsakes"
                    value={giftPreferences}
                    onChange={(e) => setGiftPreferences(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white focus:outline-none rounded-xl p-3 text-slate-800 placeholder-slate-400 font-medium transition-colors"
                  />
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Validation Errors & Soft Warnings Banner */}
        {(formError || duplicateWarning) && (
          <div className="px-6 py-4 bg-amber-50/45 border-t border-slate-200/60 text-left space-y-2 animate-fade-in">
            {formError && (
              <div className="text-rose-600 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {duplicateWarning && (
              <div className="text-amber-800 text-xs font-bold flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                  <span><strong>⚠️ Potential Duplicate Detected:</strong> {duplicateWarning.message}</span>
                </div>
                {duplicateWarning.type !== "id" && (
                  <label className="flex items-center gap-2.5 cursor-pointer pl-6 mt-0.5 select-none text-slate-700">
                    <input
                      type="checkbox"
                      checked={bypassDuplicate}
                      onChange={(e) => setBypassDuplicate(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-700">
                      I confirm this is a separate, unique portfolio client profile and not a duplicate
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom Save bar */}
        <div className="px-6 py-5 bg-slate-50 flex justify-end gap-3 rounded-b-3xl border-t border-slate-200/60">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
          >
            Discard Changes
          </button>
          
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-md"
          >
            <Save className="w-4 h-4" />
            {isEditing ? "Save Configuration" : "Establish Client Record"}
          </button>
        </div>

      </form>
    </div>
  );
}
