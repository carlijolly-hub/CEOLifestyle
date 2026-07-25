import { Client, LuxeBookInventoryItem, AspiringClient, BusinessEvent, AppUser, UserRole, UserStatus, BackupRecord, SavedQuotation } from "../types";

// ============================================================================
// CEO LIFESTYLE MANAGEMENT - V2.1 HIGH DENSITY STRESS TEST DATASET
// Testing Period: 14 Days (August 1, 2026 – August 14, 2026)
// ============================================================================

// 1. ACTIVE CLIENT DATABASE (45 CLIENTS: 15 PLATINUM, 15 GOLD, 15 SILVER)
export const INITIAL_CLIENTS: Client[] = [
  // --------------------------------------------------------------------------
  // PLATINUM CLIENTS (15) - High-Value VIP Accounts with Complete Profiles
  // --------------------------------------------------------------------------
  {
    id: "CEO0001",
    firstName: "Sarah",
    lastName: "Thompson",
    gender: "Female",
    occupation: "Corporate Marketing VP",
    drive: "Yes",
    tier: "Platinum",
    homeBrand: "CEO Printing Services",
    contact: {
      phoneNumber: "+1 (876) 555-0101",
      email: "sthompson@corpbrand.com",
      city: "Kingston",
      parish: "St. Andrew",
      country: "Jamaica",
      deliveryAddress: "7 Financial Square, New Kingston",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Linda Thompson",
      fatherName: "Michael Thompson",
      wifeName: "N/A",
      husbandName: "David Thompson",
      husbandBirthday: "August 5",
      children: [{ name: "Emily Thompson", birthday: "August 12" }],
      pets: "Coco (Cat)",
      personalNotes: "VP of Marketing ordering premium DTF apparel, corporate embroidery polos, and custom executive gift boxes."
    },
    importantDates: [
      { label: "Birthday", date: "August 3" },
      { label: "Anniversary", date: "August 14" },
      { label: "David's Birthday", date: "August 5" },
      { label: "Emily's Birthday", date: "August 12" },
      { label: "Corporate Anniversary", date: "August 1" }
    ],
    history: {
      firstOrderDate: "2025-01-10",
      lastOrderDate: "2026-08-01",
      totalOrders: 18,
      productsPurchased: ["Corporate Shirts", "Embroidery Polos", "Executive Gift Boxes", "Branded Banners"],
      preferredCategories: ["Corporate Apparel", "Executive Gifts"],
      clientPreferences: ["High thread count", "Navy & Gold branding", "Express delivery"],
      lifetimeRevenue: 1250000,
      averageOrderValue: 69444
    },
    interests: {
      sports: { sport: "Tennis", favoriteTeam: "Wimbledon", teamOne: "Jamaica Tennis Assoc", teamTwo: "US Open", favoritePlayer: "Coco Gauff", nationalTeam: "Jamaica" },
      hobbies: ["Corporate Strategy", "Golf", "Wine Tasting"],
      favoriteColors: ["Navy", "Gold", "White"],
      giftPreferences: ["Luxury Stationery", "Custom Wine Boxes"]
    },
    timeline: [
      { id: "e1_ceo1", type: "Order", date: "2026-08-01", content: "Placed Q3 Corporate Polo Order (50 shirts) with express embroidery", amount: 145000 },
      { id: "e2_ceo1", type: "Conversation", date: "2026-08-01", content: "Confirmed David's upcoming birthday gift box specifications" }
    ],
    reminders: [
      { id: "r1_ceo1", date: "2026-08-01", task: "Deliver sample proof for 50 Corporate Polos", completed: false },
      { id: "r2_ceo1", date: "2026-08-04", task: "Prepare David's Birthday Executive Wine Box (Birthday Aug 5)", completed: false }
    ],
    preferredCommunication: "WhatsApp",
    lastContactedDate: "2026-08-01"
  },

  {
    id: "CEO0002",
    firstName: "Christopher",
    lastName: "Reid",
    gender: "Male",
    occupation: "Luxury Hotel & Resort Director",
    drive: "Yes",
    tier: "Platinum",
    homeBrand: "CEO Printing Services",
    contact: {
      phoneNumber: "+1 (876) 555-0102",
      email: "chris@reidevents.jm",
      city: "Montego Bay",
      parish: "St. James",
      country: "Jamaica",
      deliveryAddress: "Rose Hall Estate, Montego Bay",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Grace Reid",
      fatherName: "Arthur Reid",
      wifeName: "Vanessa Reid",
      wifeBirthday: "August 7",
      husbandName: "N/A",
      children: [{ name: "Carter Reid", birthday: "August 10" }],
      pets: "Max (German Shepherd)",
      personalNotes: "Director of luxury resort group. Orders high-end guest amenities, customized leather folios, and event banners."
    },
    importantDates: [
      { label: "Birthday", date: "August 2" },
      { label: "Anniversary", date: "August 11" },
      { label: "Vanessa's Birthday", date: "August 7" },
      { label: "Carter's Birthday", date: "August 10" },
      { label: "Hotel Launch Anniversary", date: "August 4" }
    ],
    history: {
      firstOrderDate: "2024-11-15",
      lastOrderDate: "2026-08-02",
      totalOrders: 22,
      productsPurchased: ["Guest Welcome Boxes", "Gold Foil Booklets", "Embroidery Staff Apparel"],
      preferredCategories: ["Hospitality Apparel", "Luxury Print"],
      clientPreferences: ["Gold Foil Embossing", "Hand Delivery to Montego Bay"],
      lifetimeRevenue: 1890000,
      averageOrderValue: 85909
    },
    interests: {
      sports: { sport: "Golf", favoriteTeam: "PGA Tour", teamOne: "Tryall Club", teamTwo: "Cinnamon Hill", favoritePlayer: "Tiger Woods", nationalTeam: "Jamaica" },
      hobbies: ["Yachting", "Fine Dining", "Rare Books"],
      favoriteColors: ["Emerald", "Gold", "Black"],
      giftPreferences: ["Leather Journals", "Engraved Pen Sets"]
    },
    timeline: [
      { id: "e1_ceo2", type: "Order", date: "2026-08-02", content: "Ordered 100 Gold Embossed Guest Welcome Guides", amount: 180000 },
      { id: "e2_ceo2", type: "Gift", date: "2026-08-02", content: "Sent complimentary anniversary leather folio mock-up", amount: 15000 }
    ],
    reminders: [
      { id: "r1_ceo2", date: "2026-08-02", task: "Call Christopher for Birthday Greetings (Today!)", completed: false },
      { id: "r2_ceo2", date: "2026-08-06", task: "Dispatch Vanessa's Birthday Gift Package (Birthday Aug 7)", completed: false }
    ],
    preferredCommunication: "Phone",
    lastContactedDate: "2026-08-02"
  },

  {
    id: "CEO0003",
    firstName: "Victoria",
    lastName: "St. Claire",
    gender: "Female",
    occupation: "Managing Director, Luxe Group",
    drive: "Yes",
    tier: "Platinum",
    homeBrand: "Librarium Luxe",
    contact: {
      phoneNumber: "+1 (876) 555-0103",
      email: "v.stclaire@luxeresorts.com",
      city: "Ocho Rios",
      parish: "St. Ann",
      country: "Jamaica",
      deliveryAddress: "Palms Villa, Tower Isle",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Evelyn St. Claire",
      fatherName: "Julian St. Claire Sr.",
      wifeName: "N/A",
      husbandName: "Julian St. Claire",
      husbandBirthday: "August 13",
      children: [{ name: "Alexander St. Claire", birthday: "August 6" }],
      pets: "Bella (Poodle)",
      personalNotes: "Top collector of Librarium Luxe rare leather books and fine art folios."
    },
    importantDates: [
      { label: "Birthday", date: "August 8" },
      { label: "Anniversary", date: "August 12" },
      { label: "Julian's Birthday", date: "August 13" },
      { label: "Alexander's Birthday", date: "August 6" },
      { label: "Corporate Foundation Anniversary", date: "August 9" }
    ],
    history: {
      firstOrderDate: "2025-03-20",
      lastOrderDate: "2026-08-01",
      totalOrders: 14,
      productsPurchased: ["Shakespeare First Folio", "Wealth of Nations Gold", "Custom Velvet Box"],
      preferredCategories: ["Fine Art Folios", "Rare Collector Books"],
      clientPreferences: ["Blue Leather", "Numbered Editions", "Personal Note from CEO"],
      lifetimeRevenue: 1420000,
      averageOrderValue: 101428
    },
    interests: {
      sports: { sport: "Polo", favoriteTeam: "St. Ann Polo Club", teamOne: "Jamaica Polo", teamTwo: "Guards Polo Club", favoritePlayer: "Adolfo Cambiaso", nationalTeam: "Jamaica" },
      hobbies: ["Art Collecting", "Classical Music", "Literature"],
      favoriteColors: ["Royal Blue", "Gold", "Cream"],
      giftPreferences: ["Rare Hardcovers", "Fine Crystal"]
    },
    timeline: [
      { id: "e1_ceo3", type: "Order", date: "2026-08-01", content: "Reserved Shakespeare First Folio Blue Leather Edition", amount: 350000 }
    ],
    reminders: [
      { id: "r1_ceo3", date: "2026-08-05", task: "Prepare Alexander's 10th Birthday Gift Book (Birthday Aug 6)", completed: false },
      { id: "r2_ceo3", date: "2026-08-07", task: "Send Victoria's Birthday Greetings & Special Collector Gift (Birthday Aug 8)", completed: false }
    ],
    preferredCommunication: "Email",
    lastContactedDate: "2026-08-01"
  },

  {
    id: "CEO0004",
    firstName: "Marcus",
    lastName: "Sterling",
    gender: "Male",
    occupation: "CEO, Sterling Financial Holdings",
    drive: "Yes",
    tier: "Platinum",
    homeBrand: "CEO Printing Services",
    contact: {
      phoneNumber: "+1 (876) 555-0104",
      email: "m.sterling@sterlingholdings.jm",
      city: "Kingston",
      parish: "St. Andrew",
      country: "Jamaica",
      deliveryAddress: "12 Corporate Park, Kingston 10",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Beatrice Sterling",
      fatherName: "Harrison Sterling",
      wifeName: "Rachel Sterling",
      wifeBirthday: "August 9",
      husbandName: "N/A",
      children: [{ name: "Marcus Sterling Jr.", birthday: "August 14" }],
      pets: "Duke (Doberman)",
      personalNotes: "High-value executive ordering large-volume corporate uniforms, executive signage, and customized leather planners."
    },
    importantDates: [
      { label: "Birthday", date: "August 4" },
      { label: "Anniversary", date: "August 10" },
      { label: "Rachel's Birthday", date: "August 9" },
      { label: "Marcus Jr.'s Birthday", date: "August 14" },
      { label: "Firm Founding Date", date: "August 3" }
    ],
    history: {
      firstOrderDate: "2024-08-01",
      lastOrderDate: "2026-08-02",
      totalOrders: 25,
      productsPurchased: ["DTF Staff Uniforms", "Executive Leather Folios", "Large Format Acrylic Signage"],
      preferredCategories: ["Corporate Branding", "Executive Gifts"],
      clientPreferences: ["Black & Silver motif", "Bulk discount rates"],
      lifetimeRevenue: 2100000,
      averageOrderValue: 84000
    },
    interests: {
      sports: { sport: "Formula 1", favoriteTeam: "Mercedes AMG", teamOne: "Lewis Hamilton", teamTwo: "Ferrari", favoritePlayer: "Lewis Hamilton", nationalTeam: "UK" },
      hobbies: ["Watch Collecting", "Stock Trading", "Golf"],
      favoriteColors: ["Silver", "Charcoal", "Black"],
      giftPreferences: ["Custom Leather Folios", "Premium Spirits"]
    },
    timeline: [
      { id: "e1_ceo4", type: "Order", date: "2026-08-02", content: "Approved $250k JMD order for Q3 Staff Apparel", amount: 250000 }
    ],
    reminders: [
      { id: "r1_ceo4", date: "2026-08-03", task: "Prepare Birthday Gift & Delivery for Marcus Sterling (Birthday Aug 4)", completed: false },
      { id: "r2_ceo4", date: "2026-08-08", task: "Send Flowers & Gift Box for Rachel Sterling's Birthday (Birthday Aug 9)", completed: false }
    ],
    preferredCommunication: "WhatsApp",
    lastContactedDate: "2026-08-02"
  },

  {
    id: "CEO0005",
    firstName: "Alicia",
    lastName: "Grant",
    gender: "Female",
    occupation: "Senior Partner, Grant & Associates Law",
    drive: "Yes",
    tier: "Platinum",
    homeBrand: "CEO Lifestyle",
    contact: {
      phoneNumber: "+1 (876) 555-0105",
      email: "agrant@grantlaw.jm",
      city: "Kingston",
      parish: "St. Andrew",
      country: "Jamaica",
      deliveryAddress: "15 Trafalgar Road, Kingston 10",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Patricia Grant",
      fatherName: "Samuel Grant",
      wifeName: "N/A",
      husbandName: "Kevin Grant",
      husbandBirthday: "August 11",
      children: [{ name: "Ava Grant", birthday: "August 13" }],
      pets: "None",
      personalNotes: "Senior partner ordering bespoke stationery, legal presentation folios, and Magic Heart Cube gifts."
    },
    importantDates: [
      { label: "Birthday", date: "August 6" },
      { label: "Anniversary", date: "August 13" },
      { label: "Kevin's Birthday", date: "August 11" },
      { label: "Ava's Birthday", date: "August 13" },
      { label: "Law Firm Anniversary", date: "August 5" }
    ],
    history: {
      firstOrderDate: "2025-02-14",
      lastOrderDate: "2026-08-01",
      totalOrders: 16,
      productsPurchased: ["Magic Heart Cubes", "Bespoke Legal Folders", "Gold Foil Business Cards"],
      preferredCategories: ["Bespoke Stationery", "Magic Heart Cubes"],
      clientPreferences: ["Burgundy accents", "Thick 400gsm cardstock"],
      lifetimeRevenue: 1150000,
      averageOrderValue: 71875
    },
    interests: {
      sports: { sport: "Athletics", favoriteTeam: "Team Jamaica", teamOne: "MVP Track Club", teamTwo: "Racers TC", favoritePlayer: "Shelly-Ann Fraser-Pryce", nationalTeam: "Jamaica" },
      hobbies: ["Theater", "Interior Design", "Baking"],
      favoriteColors: ["Burgundy", "Gold", "Rose"],
      giftPreferences: ["Magic Heart Cubes", "Designer Candles"]
    },
    timeline: [
      { id: "e1_ceo5", type: "Order", date: "2026-08-01", content: "Ordered 5 Magic Heart Cubes for anniversary gifts", amount: 92500 }
    ],
    reminders: [
      { id: "r1_ceo5", date: "2026-08-05", task: "Send Birthday Cake & Gift to Alicia Grant (Birthday Aug 6)", completed: false },
      { id: "r2_ceo5", date: "2026-08-10", task: "Prepare Kevin's Birthday Gift & Note (Birthday Aug 11)", completed: false }
    ],
    preferredCommunication: "Phone",
    lastContactedDate: "2026-08-01"
  },

  {
    id: "CEO0006",
    firstName: "Jonathan",
    lastName: "Blake",
    gender: "Male",
    occupation: "CEO, Blake Energy & Tech",
    drive: "Yes",
    tier: "Platinum",
    homeBrand: "CEO Printing Services",
    contact: {
      phoneNumber: "+1 (876) 555-0106",
      email: "jblake@blakeenergy.com",
      city: "Kingston",
      parish: "St. Andrew",
      country: "Jamaica",
      deliveryAddress: "45 Hope Road, Kingston 6",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Margaret Blake",
      fatherName: "Edward Blake",
      wifeName: "Sophia Blake",
      wifeBirthday: "August 3",
      husbandName: "N/A",
      children: [{ name: "Oliver Blake", birthday: "August 9" }],
      pets: "Zeus (Rottweiler)",
      personalNotes: "Energy CEO ordering bulk corporate apparel, safety vests branding, and executive gifts."
    },
    importantDates: [
      { label: "Birthday", date: "August 7" },
      { label: "Anniversary", date: "August 12" },
      { label: "Sophia's Birthday", date: "August 3" },
      { label: "Oliver's Birthday", date: "August 9" }
    ],
    history: {
      firstOrderDate: "2025-01-20",
      lastOrderDate: "2026-08-02",
      totalOrders: 15,
      productsPurchased: ["Safety Vests", "Custom Polos", "Branded Hard Hats"],
      preferredCategories: ["Industrial Apparel", "Corporate Signage"],
      clientPreferences: ["High-visibility printing", "Express turnaround"],
      lifetimeRevenue: 1350000,
      averageOrderValue: 90000
    },
    interests: {
      sports: { sport: "Cricket", favoriteTeam: "West Indies", teamOne: "Jamaica Tallawahs", teamTwo: "Barbados Royals", favoritePlayer: "Chris Gayle", nationalTeam: "West Indies" },
      hobbies: ["Renewable Tech", "Boating", "Barbecue"],
      favoriteColors: ["Yellow", "Black", "Grey"],
      giftPreferences: ["High-end Barbecue Tool Set", "Custom Leather Travel Bags"]
    },
    timeline: [
      { id: "e1_ceo6", type: "Order", date: "2026-08-02", content: "Ordered 100 Safety Vests with reflective print", amount: 120000 }
    ],
    reminders: [
      { id: "r1_ceo6", date: "2026-08-02", task: "Dispatch Sophia's Birthday Gift Box (Birthday Aug 3)", completed: false },
      { id: "r2_ceo6", date: "2026-08-06", task: "Send Jonathan's Birthday Gift (Birthday Aug 7)", completed: false }
    ],
    preferredCommunication: "WhatsApp",
    lastContactedDate: "2026-08-02"
  },

  {
    id: "CEO0007",
    firstName: "Elizabeth",
    lastName: "Vance",
    gender: "Female",
    occupation: "Founder, Vance Media Group",
    drive: "Yes",
    tier: "Platinum",
    homeBrand: "CEO Printing Services",
    contact: {
      phoneNumber: "+1 (876) 555-0107",
      email: "evance@vancemedia.jm",
      city: "Kingston",
      parish: "St. Andrew",
      country: "Jamaica",
      deliveryAddress: "22 Constant Spring Road, Kingston 10",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Clara Vance",
      fatherName: "Robert Vance",
      wifeName: "N/A",
      husbandName: "Richard Vance",
      husbandBirthday: "August 10",
      children: [{ name: "James Vance", birthday: "August 14" }],
      pets: "Milo (Beagle)",
      personalNotes: "Media executive ordering high-density DTF prints, event backdrops, and promotional merchandise."
    },
    importantDates: [
      { label: "Birthday", date: "August 9" },
      { label: "Anniversary", date: "August 14" },
      { label: "Richard's Birthday", date: "August 10" },
      { label: "James's Birthday", date: "August 14" }
    ],
    history: {
      firstOrderDate: "2024-09-10",
      lastOrderDate: "2026-08-01",
      totalOrders: 20,
      productsPurchased: ["DTF Gang Sheets", "Vinyl Banners", "Branded Mugs"],
      preferredCategories: ["Media Production", "Event Graphics"],
      clientPreferences: ["Ultra-vibrant colors", "Gang sheet maximization"],
      lifetimeRevenue: 1650000,
      averageOrderValue: 82500
    },
    interests: {
      sports: { sport: "Basketball", favoriteTeam: "LA Lakers", teamOne: "Miami Heat", teamTwo: "Golden State", favoritePlayer: "LeBron James", nationalTeam: "USA" },
      hobbies: ["Photography", "Digital Media", "Podcasting"],
      favoriteColors: ["Purple", "Gold", "Teal"],
      giftPreferences: ["Camera Accessories", "Designer Notebooks"]
    },
    timeline: [
      { id: "e1_ceo7", type: "Order", date: "2026-08-01", content: "Ordered 5 DTF Gang Sheets for media conference", amount: 95000 }
    ],
    reminders: [
      { id: "r1_ceo7", date: "2026-08-08", task: "Prepare Elizabeth's Birthday Gift & Card (Birthday Aug 9)", completed: false },
      { id: "r2_ceo7", date: "2026-08-09", task: "Send Richard's Birthday Greetings (Birthday Aug 10)", completed: false }
    ],
    preferredCommunication: "Email",
    lastContactedDate: "2026-08-01"
  },

  {
    id: "CEO0008",
    firstName: "Raymond",
    lastName: "Sterling",
    gender: "Male",
    occupation: "Owner, Sterling Construction",
    drive: "Yes",
    tier: "Platinum",
    homeBrand: "CEO Printing Services",
    contact: {
      phoneNumber: "+1 (876) 555-0108",
      email: "rsterling@sterlingconst.jm",
      city: "Spanish Town",
      parish: "St. Catherine",
      country: "Jamaica",
      deliveryAddress: "8 Industrial Way, Spanish Town",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Bernice Sterling",
      fatherName: "George Sterling",
      wifeName: "Maria Sterling",
      wifeBirthday: "August 6",
      husbandName: "N/A",
      children: [{ name: "Lucas Sterling", birthday: "August 11" }],
      pets: "Rex (Boxer)",
      personalNotes: "Construction firm owner ordering branded workwear, site signs, and employee reward boxes."
    },
    importantDates: [
      { label: "Birthday", date: "August 11" },
      { label: "Anniversary", date: "August 8" },
      { label: "Maria's Birthday", date: "August 6" },
      { label: "Lucas's Birthday", date: "August 11" }
    ],
    history: {
      firstOrderDate: "2025-04-12",
      lastOrderDate: "2026-08-03",
      totalOrders: 12,
      productsPurchased: ["Work Vests", "Custom Helmets", "Outdoor Banners"],
      preferredCategories: ["Industrial Workwear", "Large Format"],
      clientPreferences: ["Heavy-duty durability", "Orange & Navy"],
      lifetimeRevenue: 980000,
      averageOrderValue: 81666
    },
    interests: {
      sports: { sport: "Football", favoriteTeam: "Chelsea FC", teamOne: "Jamaica Reggae Boyz", teamTwo: "Real Madrid", favoritePlayer: "Raheem Sterling", nationalTeam: "Jamaica" },
      hobbies: ["Heavy Machinery", "Fishing", "Dominoes"],
      favoriteColors: ["Orange", "Navy", "Gray"],
      giftPreferences: ["Custom Engraved Pocket Knife", "Premium Rum"]
    },
    timeline: [
      { id: "e1_ceo8", type: "Order", date: "2026-08-03", content: "Ordered 80 custom work shirts for highway project", amount: 160000 }
    ],
    reminders: [
      { id: "r1_ceo8", date: "2026-08-05", task: "Prepare Maria's Birthday Floral Gift (Birthday Aug 6)", completed: false },
      { id: "r2_ceo8", date: "2026-08-10", task: "Send Raymond's Birthday Gift & Lucas's Gift Box (Birthday Aug 11)", completed: false }
    ],
    preferredCommunication: "Phone",
    lastContactedDate: "2026-08-03"
  },

  {
    id: "CEO0009",
    firstName: "Dr. Karen",
    lastName: "Rochester",
    gender: "Female",
    occupation: "Chief Medical Officer, CareMed",
    drive: "Yes",
    tier: "Platinum",
    homeBrand: "CEO Lifestyle",
    contact: {
      phoneNumber: "+1 (876) 555-0109",
      email: "dr.rochester@caremed.jm",
      city: "Kingston",
      parish: "St. Andrew",
      country: "Jamaica",
      deliveryAddress: "18 Medical Drive, Kingston 5",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Audrey Rochester",
      fatherName: "Dr. Paul Rochester",
      wifeName: "N/A",
      husbandName: "Michael Rochester",
      husbandBirthday: "August 8",
      children: [{ name: "Chloe Rochester", birthday: "August 13" }],
      pets: "Sasha (Siamese Cat)",
      personalNotes: "Medical director ordering lab coats branding, medical conference gifts, and Magic Heart Cubes."
    },
    importantDates: [
      { label: "Birthday", date: "August 12" },
      { label: "Anniversary", date: "August 5" },
      { label: "Michael's Birthday", date: "August 8" },
      { label: "Chloe's Birthday", date: "August 13" }
    ],
    history: {
      firstOrderDate: "2024-10-05",
      lastOrderDate: "2026-08-02",
      totalOrders: 19,
      productsPurchased: ["Embroidered Scrubs", "Magic Heart Cubes", "Medical Conference Folders"],
      preferredCategories: ["Medical Apparel", "Executive Gifts"],
      clientPreferences: ["Teal & White", "Antimicrobial fabric"],
      lifetimeRevenue: 1580000,
      averageOrderValue: 83157
    },
    interests: {
      sports: { sport: "Swimming", favoriteTeam: "Jamaican Aquatics", teamOne: "USA Swimming", teamTwo: "Speedo Team", favoritePlayer: "Alia Atkinson", nationalTeam: "Jamaica" },
      hobbies: ["Gardening", "Wellness", "Piano"],
      favoriteColors: ["Teal", "White", "Silver"],
      giftPreferences: ["Magic Heart Cubes", "Aromatherapy Sets"]
    },
    timeline: [
      { id: "e1_ceo9", type: "Order", date: "2026-08-02", content: "Ordered 40 Embroidered Medical Scrubs", amount: 110000 }
    ],
    reminders: [
      { id: "r1_ceo9", date: "2026-08-04", task: "Prepare Anniversary Gift for Dr. Rochester (Anniversary Aug 5)", completed: false },
      { id: "r2_ceo9", date: "2026-08-07", task: "Send Michael's Birthday Gift Box (Birthday Aug 8)", completed: false }
    ],
    preferredCommunication: "WhatsApp",
    lastContactedDate: "2026-08-02"
  },

  {
    id: "CEO0010",
    firstName: "Harrison",
    lastName: "Brooks",
    gender: "Male",
    occupation: "CEO, Brooks Investment Bank",
    drive: "Yes",
    tier: "Platinum",
    homeBrand: "Librarium Luxe",
    contact: {
      phoneNumber: "+1 (876) 555-0110",
      email: "hbrooks@brooksbank.jm",
      city: "Kingston",
      parish: "St. Andrew",
      country: "Jamaica",
      deliveryAddress: "1 Financial Center, New Kingston",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Diana Brooks",
      fatherName: "Charles Brooks Sr.",
      wifeName: "Eleanor Brooks",
      wifeBirthday: "August 12",
      husbandName: "N/A",
      children: [{ name: "Mason Brooks", birthday: "August 7" }],
      pets: "Baron (Golden Retriever)",
      personalNotes: "Investment banker collecting rare leather financial classics and ordering VIP client gift boxes."
    },
    importantDates: [
      { label: "Birthday", date: "August 10" },
      { label: "Anniversary", date: "August 3" },
      { label: "Eleanor's Birthday", date: "August 12" },
      { label: "Mason's Birthday", date: "August 7" }
    ],
    history: {
      firstOrderDate: "2025-01-05",
      lastOrderDate: "2026-08-01",
      totalOrders: 17,
      productsPurchased: ["Wealth of Nations Gold", "Intelligent Investor Leather", "Executive Leather Planners"],
      preferredCategories: ["Finance Classics", "Executive Leather"],
      clientPreferences: ["Burgundy leather", "Gold leaf edges"],
      lifetimeRevenue: 1750000,
      averageOrderValue: 102941
    },
    interests: {
      sports: { sport: "Golf", favoriteTeam: "Augusta National", teamOne: "Caymanas Golf", teamTwo: "PGA", favoritePlayer: "Rory McIlroy", nationalTeam: "Northern Ireland" },
      hobbies: ["Economic History", "Fine Wine", "Sailing"],
      favoriteColors: ["Navy", "Burgundy", "Gold"],
      giftPreferences: ["Leather Bound Books", "Vintage Port"]
    },
    timeline: [
      { id: "e1_ceo10", type: "Order", date: "2026-08-01", content: "Purchased 2 copies of The Intelligent Investor Leather Edition", amount: 44000 }
    ],
    reminders: [
      { id: "r1_ceo10", date: "2026-08-02", task: "Send Harrison's Anniversary Gift Box (Anniversary Aug 3)", completed: false },
      { id: "r2_ceo10", date: "2026-08-06", task: "Prepare Mason's Birthday Book Gift (Birthday Aug 7)", completed: false }
    ],
    preferredCommunication: "Email",
    lastContactedDate: "2026-08-01"
  },

  {
    id: "CEO0011",
    firstName: "Simone",
    lastName: "Campbell",
    gender: "Female",
    occupation: "Creative Director, Island Chic",
    drive: "Yes",
    tier: "Platinum",
    homeBrand: "CEO Printing Services",
    contact: {
      phoneNumber: "+1 (876) 555-0111",
      email: "simone@islandchic.jm",
      city: "Montego Bay",
      parish: "St. James",
      country: "Jamaica",
      deliveryAddress: "14 Hip Strip, Montego Bay",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Valerie Campbell",
      fatherName: "Dennis Campbell",
      wifeName: "N/A",
      husbandName: "Adrian Campbell",
      husbandBirthday: "August 4",
      children: [{ name: "Maya Campbell", birthday: "August 9" }],
      pets: "Luna (Cat)",
      personalNotes: "Fashion creative director ordering DTF printed boutique merchandise and custom gift packaging."
    },
    importantDates: [
      { label: "Birthday", date: "August 5" },
      { label: "Anniversary", date: "August 13" },
      { label: "Adrian's Birthday", date: "August 4" },
      { label: "Maya's Birthday", date: "August 9" }
    ],
    history: {
      firstOrderDate: "2025-05-18",
      lastOrderDate: "2026-08-03",
      totalOrders: 13,
      productsPurchased: ["Custom DTF Tees", "Silk Screen Tote Bags", "Satin Gift Ribbons"],
      preferredCategories: ["Fashion Merch", "Custom Packaging"],
      clientPreferences: ["Pastel tones", "Soft cotton finish"],
      lifetimeRevenue: 890000,
      averageOrderValue: 68461
    },
    interests: {
      sports: { sport: "Gymnastics", favoriteTeam: "USA Gymnastics", teamOne: "Jamaica Gymnastics", teamTwo: "FIG", favoritePlayer: "Simone Biles", nationalTeam: "USA" },
      hobbies: ["Fashion Design", "Painting", "Photography"],
      favoriteColors: ["Coral", "Gold", "Ivory"],
      giftPreferences: ["Custom Art Prints", "Luxury Silk Scarves"]
    },
    timeline: [
      { id: "e1_ceo11", type: "Order", date: "2026-08-03", content: "Ordered 60 Custom DTF Tees for Summer Boutique Collection", amount: 105000 }
    ],
    reminders: [
      { id: "r1_ceo11", date: "2026-08-03", task: "Send Adrian's Birthday Greetings & Wine (Birthday Aug 4)", completed: false },
      { id: "r2_ceo11", date: "2026-08-04", task: "Prepare Simone's Birthday Flowers (Birthday Aug 5)", completed: false }
    ],
    preferredCommunication: "WhatsApp",
    lastContactedDate: "2026-08-03"
  },

  {
    id: "CEO0012",
    firstName: "Derrick",
    lastName: "Lewis",
    gender: "Male",
    occupation: "General Manager, Island Logistics",
    drive: "Yes",
    tier: "Platinum",
    homeBrand: "CEO Printing Services",
    contact: {
      phoneNumber: "+1 (876) 555-0112",
      email: "dlewis@islandlogistics.jm",
      city: "Kingston",
      parish: "St. Andrew",
      country: "Jamaica",
      deliveryAddress: "5 Port Royal Street, Kingston",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Yvonne Lewis",
      fatherName: "Carl Lewis",
      wifeName: "Samantha Lewis",
      wifeBirthday: "August 11",
      husbandName: "N/A",
      children: [{ name: "Leo Lewis", birthday: "August 14" }],
      pets: "Bruno (Bulldog)",
      personalNotes: "Logistics manager requiring high-volume vehicle stickers, cargo labels, and staff uniforms."
    },
    importantDates: [
      { label: "Birthday", date: "August 13" },
      { label: "Anniversary", date: "August 2" },
      { label: "Samantha's Birthday", date: "August 11" },
      { label: "Leo's Birthday", date: "August 14" }
    ],
    history: {
      firstOrderDate: "2024-12-01",
      lastOrderDate: "2026-08-02",
      totalOrders: 21,
      productsPurchased: ["Vehicle Decals", "Cargo Labels", "Reflective Jackets"],
      preferredCategories: ["Logistics Supplies", "Decals"],
      clientPreferences: ["Weatherproof vinyl", "Bulk packaging"],
      lifetimeRevenue: 1950000,
      averageOrderValue: 92857
    },
    interests: {
      sports: { sport: "Motorsports", favoriteTeam: "Red Bull Racing", teamOne: "Jamaica Karting", teamTwo: "NASCAR", favoritePlayer: "Max Verstappen", nationalTeam: "Netherlands" },
      hobbies: ["Car Restoration", "Karting", "Camping"],
      favoriteColors: ["Red", "Navy", "White"],
      giftPreferences: ["Automotive Tools", "Leather Keyrings"]
    },
    timeline: [
      { id: "e1_ceo12", type: "Order", date: "2026-08-02", content: "Ordered 500 Weatherproof Cargo Labels & Truck Decals", amount: 165000 }
    ],
    reminders: [
      { id: "r1_ceo12", date: "2026-08-01", task: "Call Derrick for Anniversary Wishes (Anniversary Aug 2)", completed: false },
      { id: "r2_ceo12", date: "2026-08-10", task: "Prepare Samantha's Birthday Gift Box (Birthday Aug 11)", completed: false }
    ],
    preferredCommunication: "Phone",
    lastContactedDate: "2026-08-02"
  },

  {
    id: "CEO0013",
    firstName: "Dr. Angela",
    lastName: "Prescott",
    gender: "Female",
    occupation: "Executive Director, Caribbean Health Institute",
    drive: "Yes",
    tier: "Platinum",
    homeBrand: "CEO Lifestyle",
    contact: {
      phoneNumber: "+1 (876) 555-0113",
      email: "aprescott@healthinstitute.jm",
      city: "Kingston",
      parish: "St. Andrew",
      country: "Jamaica",
      deliveryAddress: "10 University Road, Kingston 7",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Florence Prescott",
      fatherName: "Dr. Arthur Prescott",
      wifeName: "N/A",
      husbandName: "Robert Prescott",
      husbandBirthday: "August 6",
      children: [{ name: "Olivia Prescott", birthday: "August 10" }],
      pets: "Coco (Pomeranian)",
      personalNotes: "Health institute director ordering custom conference gift bags, engraved plaques, and Magic Heart Cubes."
    },
    importantDates: [
      { label: "Birthday", date: "August 14" },
      { label: "Anniversary", date: "August 7" },
      { label: "Robert's Birthday", date: "August 6" },
      { label: "Olivia's Birthday", date: "August 10" }
    ],
    history: {
      firstOrderDate: "2025-02-01",
      lastOrderDate: "2026-08-01",
      totalOrders: 11,
      productsPurchased: ["Magic Heart Cubes", "Glass Awards", "Custom Conference Tote Bags"],
      preferredCategories: ["Corporate Recognition", "Magic Heart Cubes"],
      clientPreferences: ["Crystal glass finish", "Gold trim"],
      lifetimeRevenue: 820000,
      averageOrderValue: 74545
    },
    interests: {
      sports: { sport: "Athletics", favoriteTeam: "Team Jamaica", teamOne: "UWI Track", teamTwo: "MVP", favoritePlayer: "Shericka Jackson", nationalTeam: "Jamaica" },
      hobbies: ["Medical Research", "Violin", "Gardening"],
      favoriteColors: ["Purple", "Silver", "White"],
      giftPreferences: ["Magic Heart Cubes", "Engraved Glassware"]
    },
    timeline: [
      { id: "e1_ceo13", type: "Order", date: "2026-08-01", content: "Ordered 10 Engraved Glass Awards for Health Symposium", amount: 125000 }
    ],
    reminders: [
      { id: "r1_ceo13", date: "2026-08-05", task: "Prepare Robert's Birthday Gift & Card (Birthday Aug 6)", completed: false },
      { id: "r2_ceo13", date: "2026-08-09", task: "Send Olivia's Birthday Gift Box (Birthday Aug 10)", completed: false }
    ],
    preferredCommunication: "WhatsApp",
    lastContactedDate: "2026-08-01"
  },

  {
    id: "CEO0014",
    firstName: "Charles",
    lastName: "Sterling",
    gender: "Male",
    occupation: "Chairman, Sterling Real Estate",
    drive: "Yes",
    tier: "Platinum",
    homeBrand: "CEO Printing Services",
    contact: {
      phoneNumber: "+1 (876) 555-0114",
      email: "charles@sterlingrealty.jm",
      city: "Kingston",
      parish: "St. Andrew",
      country: "Jamaica",
      deliveryAddress: "30 Hope Road, Kingston 6",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Rosemary Sterling",
      fatherName: "Charles Sterling Sr.",
      wifeName: "Claire Sterling",
      wifeBirthday: "August 14",
      husbandName: "N/A",
      children: [{ name: "Nathan Sterling", birthday: "August 8" }],
      pets: "Sam (Labrador)",
      personalNotes: "Real estate chairman ordering luxury home handover keys boxes, acrylic signage, and custom leather closing folders."
    },
    importantDates: [
      { label: "Birthday", date: "August 1" },
      { label: "Anniversary", date: "August 9" },
      { label: "Claire's Birthday", date: "August 14" },
      { label: "Nathan's Birthday", date: "August 8" }
    ],
    history: {
      firstOrderDate: "2024-07-15",
      lastOrderDate: "2026-08-01",
      totalOrders: 24,
      productsPurchased: ["Leather Closing Folders", "Acrylic Realty Signs", "Custom Key Boxes"],
      preferredCategories: ["Real Estate Gifts", "Signage"],
      clientPreferences: ["Black leather with gold foil", "Express delivery"],
      lifetimeRevenue: 2400000,
      averageOrderValue: 100000
    },
    interests: {
      sports: { sport: "Golf", favoriteTeam: "PGA", teamOne: "Caymanas", teamTwo: "Tryall", favoritePlayer: "Rory McIlroy", nationalTeam: "UK" },
      hobbies: ["Architecture", "Sailing", "Fine Wine"],
      favoriteColors: ["Black", "Gold", "Navy"],
      giftPreferences: ["Custom Leather Boxes", "Rare Wine"]
    },
    timeline: [
      { id: "e1_ceo14", type: "Order", date: "2026-08-01", content: "Ordered 20 Custom Leather Closing Folders", amount: 200000 }
    ],
    reminders: [
      { id: "r1_ceo14", date: "2026-08-01", task: "Call Charles Sterling for Birthday Greetings (Today!)", completed: false },
      { id: "r2_ceo14", date: "2026-08-07", task: "Prepare Nathan's Birthday Gift Box (Birthday Aug 8)", completed: false }
    ],
    preferredCommunication: "Phone",
    lastContactedDate: "2026-08-01"
  },

  {
    id: "CEO0015",
    firstName: "Penelope",
    lastName: "Croft",
    gender: "Female",
    occupation: "CEO, Croft Luxury Goods",
    drive: "Yes",
    tier: "Platinum",
    homeBrand: "Librarium Luxe",
    contact: {
      phoneNumber: "+1 (876) 555-0115",
      email: "pcroft@croftluxury.jm",
      city: "Kingston",
      parish: "St. Andrew",
      country: "Jamaica",
      deliveryAddress: "12 Manor Park, Kingston 8",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Lady Beatrice Croft",
      fatherName: "Lord Arthur Croft",
      wifeName: "N/A",
      husbandName: "Anthony Croft",
      husbandBirthday: "August 12",
      children: [{ name: "Grace Croft", birthday: "August 5" }],
      pets: "Duchess (Persian Cat)",
      personalNotes: "Luxury retail CEO ordering leather-bound classics, custom velvet book sleeves, and VIP gift folios."
    },
    importantDates: [
      { label: "Birthday", date: "August 11" },
      { label: "Anniversary", date: "August 4" },
      { label: "Anthony's Birthday", date: "August 12" },
      { label: "Grace's Birthday", date: "August 5" }
    ],
    history: {
      firstOrderDate: "2025-02-28",
      lastOrderDate: "2026-08-02",
      totalOrders: 16,
      productsPurchased: ["Leather Classics Collection", "Velvet Gift Sleeves", "Special Edition Hardcovers"],
      preferredCategories: ["Luxury Books", "Gift Packaging"],
      clientPreferences: ["Emerald velvet", "Gold leafing"],
      lifetimeRevenue: 1550000,
      averageOrderValue: 96875
    },
    interests: {
      sports: { sport: "Equestrian", favoriteTeam: "FEI World Cup", teamOne: "Jamaica Equestrian", teamTwo: "Royal Windsor", favoritePlayer: "Charlotte Dujardin", nationalTeam: "UK" },
      hobbies: ["Antiques", "Opera", "Horse Riding"],
      favoriteColors: ["Emerald", "Burgundy", "Gold"],
      giftPreferences: ["Rare Leather Editions", "Perfume Sets"]
    },
    timeline: [
      { id: "e1_ceo15", type: "Order", date: "2026-08-02", content: "Purchased 3 Leather Classics Collection Books", amount: 78000 }
    ],
    reminders: [
      { id: "r1_ceo15", date: "2026-08-03", task: "Prepare Anniversary Gift Box for Penelope & Anthony (Anniversary Aug 4)", completed: false },
      { id: "r2_ceo15", date: "2026-08-04", task: "Send Grace's Birthday Greetings & Book Gift (Birthday Aug 5)", completed: false }
    ],
    preferredCommunication: "Email",
    lastContactedDate: "2026-08-02"
  },

  // --------------------------------------------------------------------------
  // GOLD CLIENTS (15) - Established Accounts with Active Reminders
  // --------------------------------------------------------------------------
  {
    id: "CEO0016",
    firstName: "Daniel",
    lastName: "Williams",
    gender: "Male",
    occupation: "Managing Director, Williams Construction",
    drive: "Yes",
    tier: "Gold",
    homeBrand: "CEO Printing Services",
    contact: { phoneNumber: "+1 (876) 555-0116", email: "daniel.w@williamsconst.jm", city: "Kingston", parish: "St. Andrew", country: "Jamaica", deliveryAddress: "14 Industrial Terrace", deliveryCountry: "Jamaica" },
    profile: { motherName: "Mary Williams", fatherName: "Paul Williams", wifeName: "Amanda Williams", husbandName: "N/A", children: [{ name: "Joshua Williams", birthday: "August 8" }], pets: "Buster", personalNotes: "Active Gold client ordering site safety gear and custom polo shirts." },
    importantDates: [{ label: "Birthday", date: "August 4" }, { label: "Amanda's Birthday", date: "August 10" }, { label: "Joshua's Birthday", date: "August 8" }],
    history: { firstOrderDate: "2025-06-10", lastOrderDate: "2026-08-01", totalOrders: 8, productsPurchased: ["Safety Vests", "Custom Polos"], preferredCategories: ["Workwear"], clientPreferences: ["Express shipping"], lifetimeRevenue: 480000, averageOrderValue: 60000 },
    interests: { sports: { sport: "Football", favoriteTeam: "Manchester United", teamOne: "Reggae Boyz", teamTwo: "Man Utd", favoritePlayer: "Marcus Rashford", nationalTeam: "Jamaica" }, hobbies: ["Fishing"], favoriteColors: ["Blue", "Yellow"], giftPreferences: ["Toolsets"] },
    timeline: [{ id: "e1_g1", type: "Order", date: "2026-08-01", content: "Ordered 30 Custom Safety Vests", amount: 45000 }],
    reminders: [{ id: "r1_g1", date: "2026-08-03", task: "Send Daniel's Birthday Greetings (Birthday Aug 4)", completed: false }],
    preferredCommunication: "WhatsApp",
    lastContactedDate: "2026-08-01"
  },

  {
    id: "CEO0017",
    firstName: "Rachel",
    lastName: "Morgan",
    gender: "Female",
    occupation: "Director, Educational Services",
    drive: "Yes",
    tier: "Gold",
    homeBrand: "Librarium Luxe",
    contact: { phoneNumber: "+1 (876) 555-0117", email: "rachel.m@education.gov.jm", city: "Kingston", parish: "St. Andrew", country: "Jamaica", deliveryAddress: "2 National Heroes Circle", deliveryCountry: "Jamaica" },
    profile: { motherName: "Janet Morgan", fatherName: "Thomas Morgan", wifeName: "N/A", husbandName: "Daniel Morgan", husbandBirthday: "August 12", children: [{ name: "Chloe Morgan", birthday: "August 6" }], pets: "Mimi", personalNotes: "Educational director purchasing book collections for government libraries." },
    importantDates: [{ label: "Birthday", date: "August 9" }, { label: "Chloe's Birthday", date: "August 6" }, { label: "Daniel's Birthday", date: "August 12" }],
    history: { firstOrderDate: "2025-04-15", lastOrderDate: "2026-08-02", totalOrders: 7, productsPurchased: ["Atomic Habits", "Psychology of Money"], preferredCategories: ["Mindset & Finance"], clientPreferences: ["Hardcover preferred"], lifetimeRevenue: 390000, averageOrderValue: 55714 },
    interests: { sports: { sport: "Track & Field", favoriteTeam: "Team Jamaica", teamOne: "MVP", teamTwo: "Racers", favoritePlayer: "Usain Bolt", nationalTeam: "Jamaica" }, hobbies: ["Reading"], favoriteColors: ["Purple", "White"], giftPreferences: ["Book Sets"] },
    timeline: [{ id: "e1_g2", type: "Order", date: "2026-08-02", content: "Purchased 15 Atomic Habits Hardcover copies", amount: 247500 }],
    reminders: [{ id: "r1_g2", date: "2026-08-05", task: "Prepare Chloe's Birthday Book Gift (Birthday Aug 6)", completed: false }],
    preferredCommunication: "Email",
    lastContactedDate: "2026-08-02"
  },

  {
    id: "CEO0018",
    firstName: "Michael",
    lastName: "Brown",
    gender: "Male",
    occupation: "Operations Manager, Carib Freight",
    drive: "Yes",
    tier: "Gold",
    homeBrand: "CEO Printing Services",
    contact: { phoneNumber: "+1 (876) 555-0118", email: "mbrown@caribfreight.jm", city: "Kingston", parish: "St. Andrew", country: "Jamaica", deliveryAddress: "12 Portway, Kingston Port", deliveryCountry: "Jamaica" },
    profile: { motherName: "Dorothy Brown", fatherName: "James Brown Sr.", wifeName: "Rebecca Brown", wifeBirthday: "August 14", husbandName: "N/A", children: [{ name: "Liam Brown", birthday: "August 3" }], pets: "Shadow", personalNotes: "Freight manager ordering shipping labels and custom uniforms." },
    importantDates: [{ label: "Birthday", date: "August 11" }, { label: "Liam's Birthday", date: "August 3" }, { label: "Rebecca's Birthday", date: "August 14" }],
    history: { firstOrderDate: "2025-02-10", lastOrderDate: "2026-08-01", totalOrders: 9, productsPurchased: ["Cargo Decals", "DTF Tees"], preferredCategories: ["Logistics"], clientPreferences: ["Durable print"], lifetimeRevenue: 520000, averageOrderValue: 57777 },
    interests: { sports: { sport: "Football", favoriteTeam: "Liverpool FC", teamOne: "Reggae Boyz", teamTwo: "Liverpool", favoritePlayer: "Mohamed Salah", nationalTeam: "Egypt" }, hobbies: ["Cars"], favoriteColors: ["Red", "Black"], giftPreferences: ["Keychains"] },
    timeline: [{ id: "e1_g3", type: "Order", date: "2026-08-01", content: "Ordered 200 Custom Cargo Decals", amount: 80000 }],
    reminders: [{ id: "r1_g3", date: "2026-08-02", task: "Send Liam's Birthday Gift Box (Birthday Aug 3)", completed: false }],
    preferredCommunication: "Phone",
    lastContactedDate: "2026-08-01"
  },

  {
    id: "CEO0019",
    firstName: "Michelle",
    lastName: "Campbell",
    gender: "Female",
    occupation: "Owner, Velvet Event Planning",
    drive: "Yes",
    tier: "Gold",
    homeBrand: "CEO Lifestyle",
    contact: { phoneNumber: "+1 (876) 555-0119", email: "michelle@velvetevents.jm", city: "Ocho Rios", parish: "St. Ann", country: "Jamaica", deliveryAddress: "5 Main Street, Ocho Rios", deliveryCountry: "Jamaica" },
    profile: { motherName: "Grace Campbell", fatherName: "Donald Campbell", wifeName: "N/A", husbandName: "David Campbell", husbandBirthday: "August 7", children: [{ name: "Maya Campbell", birthday: "August 13" }], pets: "Pearl", personalNotes: "Event planner ordering acrylic menu cards, welcome signs, and Magic Heart Cubes." },
    importantDates: [{ label: "Birthday", date: "August 10" }, { label: "David's Birthday", date: "August 7" }, { label: "Maya's Birthday", date: "August 13" }],
    history: { firstOrderDate: "2025-07-01", lastOrderDate: "2026-08-03", totalOrders: 6, productsPurchased: ["Magic Heart Cubes", "Acrylic Signs"], preferredCategories: ["Event Decor"], clientPreferences: ["Gold foil"], lifetimeRevenue: 410000, averageOrderValue: 68333 },
    interests: { sports: { sport: "Tennis", favoriteTeam: "US Open", teamOne: "Wimbledon", teamTwo: "French Open", favoritePlayer: "Serena Williams", nationalTeam: "USA" }, hobbies: ["Event Styling"], favoriteColors: ["Gold", "Pink"], giftPreferences: ["Magic Heart Cubes"] },
    timeline: [{ id: "e1_g4", type: "Order", date: "2026-08-03", content: "Ordered 3 Magic Heart Cubes for wedding clients", amount: 55500 }],
    reminders: [{ id: "r1_g4", date: "2026-08-06", task: "Prepare David's Birthday Gift (Birthday Aug 7)", completed: false }],
    preferredCommunication: "WhatsApp",
    lastContactedDate: "2026-08-03"
  },

  {
    id: "CEO0020",
    firstName: "David",
    lastName: "Alexander",
    gender: "Male",
    occupation: "Partner, Alexander Tech",
    drive: "Yes",
    tier: "Gold",
    homeBrand: "CEO Printing Services",
    contact: { phoneNumber: "+1 (876) 555-0120", email: "dalexander@alexandertech.jm", city: "Kingston", parish: "St. Andrew", country: "Jamaica", deliveryAddress: "10 Tech Parkway, Kingston 10", deliveryCountry: "Jamaica" },
    profile: { motherName: "Helen Alexander", fatherName: "David Alexander Sr.", wifeName: "Karen Alexander", wifeBirthday: "August 12", husbandName: "N/A", children: [{ name: "Ethan Alexander", birthday: "August 5" }], pets: "Gizmo", personalNotes: "Tech startup founder ordering company hoodies, mugs, and laptop stickers." },
    importantDates: [{ label: "Birthday", date: "August 8" }, { label: "Ethan's Birthday", date: "August 5" }, { label: "Karen's Birthday", date: "August 12" }],
    history: { firstOrderDate: "2025-03-12", lastOrderDate: "2026-08-02", totalOrders: 10, productsPurchased: ["DTF Hoodies", "Custom Mugs"], preferredCategories: ["Apparel"], clientPreferences: ["Black & Green"], lifetimeRevenue: 620000, averageOrderValue: 62000 },
    interests: { sports: { sport: "Basketball", favoriteTeam: "Golden State Warriors", teamOne: "Lakers", teamTwo: "Warriors", favoritePlayer: "Stephen Curry", nationalTeam: "USA" }, hobbies: ["Coding"], favoriteColors: ["Black", "Neon Green"], giftPreferences: ["Tech Gadgets"] },
    timeline: [{ id: "e1_g5", type: "Order", date: "2026-08-02", content: "Ordered 25 Branded Hoodies", amount: 87500 }],
    reminders: [{ id: "r1_g5", date: "2026-08-04", task: "Send Ethan's Birthday Gift Box (Birthday Aug 5)", completed: false }],
    preferredCommunication: "Email",
    lastContactedDate: "2026-08-02"
  },

  {
    id: "CEO0021",
    firstName: "Dr. Sophia",
    lastName: "Roberts",
    gender: "Female",
    occupation: "Principal, Roberts Academy",
    drive: "Yes",
    tier: "Gold",
    homeBrand: "Librarium Luxe",
    contact: { phoneNumber: "+1 (876) 555-0121", email: "s.roberts@robertsacademy.edu.jm", city: "Kingston", parish: "St. Andrew", country: "Jamaica", deliveryAddress: "25 Hope Road", deliveryCountry: "Jamaica" },
    profile: { motherName: "Evelyn Roberts", fatherName: "Dr. Mark Roberts", wifeName: "N/A", husbandName: "Mark Roberts", husbandBirthday: "August 11", children: [{ name: "Oliver Roberts", birthday: "August 2" }], pets: "Whiskey", personalNotes: "School principal ordering graduation gift books and prize folios." },
    importantDates: [{ label: "Birthday", date: "August 13" }, { label: "Oliver's Birthday", date: "August 2" }, { label: "Mark's Birthday", date: "August 11" }],
    history: { firstOrderDate: "2025-01-15", lastOrderDate: "2026-08-01", totalOrders: 6, productsPurchased: ["Think and Grow Rich Gold", "Deep Work White"], preferredCategories: ["Education & Mindset"], clientPreferences: ["Embossed gold"], lifetimeRevenue: 340000, averageOrderValue: 56666 },
    interests: { sports: { sport: "Netball", favoriteTeam: "Jamaica Sunshine Girls", teamOne: "Sunshine Girls", teamTwo: "Australia", favoritePlayer: "Jhaniele Fowler", nationalTeam: "Jamaica" }, hobbies: ["Reading"], favoriteColors: ["Navy", "Gold"], giftPreferences: ["Book Sets"] },
    timeline: [{ id: "e1_g6", type: "Order", date: "2026-08-01", content: "Ordered 10 Think and Grow Rich Embossed Gold editions", amount: 145000 }],
    reminders: [{ id: "r1_g6", date: "2026-08-01", task: "Call Dr. Sophia Roberts for Oliver's Birthday Wishes (Today!)", completed: false }],
    preferredCommunication: "Phone",
    lastContactedDate: "2026-08-01"
  },

  {
    id: "CEO0022",
    firstName: "Brandon",
    lastName: "Miller",
    gender: "Male",
    occupation: "Manager, Miller Auto Parts",
    drive: "Yes",
    tier: "Gold",
    homeBrand: "CEO Printing Services",
    contact: { phoneNumber: "+1 (876) 555-0122", email: "brandon@millerauto.jm", city: "Spanish Town", parish: "St. Catherine", country: "Jamaica", deliveryAddress: "40 Burke Road, Spanish Town", deliveryCountry: "Jamaica" },
    profile: { motherName: "Clara Miller", fatherName: "Brandon Miller Sr.", wifeName: "Tanya Miller", wifeBirthday: "August 9", husbandName: "N/A", children: [{ name: "Brandon Jr.", birthday: "August 14" }], pets: "Diesel", personalNotes: "Auto parts store manager ordering storefront banners and team shirts." },
    importantDates: [{ label: "Birthday", date: "August 5" }, { label: "Tanya's Birthday", date: "August 9" }, { label: "Brandon Jr.'s Birthday", date: "August 14" }],
    history: { firstOrderDate: "2025-05-10", lastOrderDate: "2026-08-03", totalOrders: 7, productsPurchased: ["Outdoor Vinyl Banners", "DTF Shirts"], preferredCategories: ["Signage & Apparel"], clientPreferences: ["High durability"], lifetimeRevenue: 430000, averageOrderValue: 61428 },
    interests: { sports: { sport: "Motorsports", favoriteTeam: "Dover Raceway", teamOne: "Jamaica Race Drivers", teamTwo: "NASCAR", favoritePlayer: "David Summerbell", nationalTeam: "Jamaica" }, hobbies: ["Racing"], favoriteColors: ["Yellow", "Black"], giftPreferences: ["Car Care Kits"] },
    timeline: [{ id: "e1_g7", type: "Order", date: "2026-08-03", content: "Ordered 2 Vinyl Banners for Store Anniversary Sale", amount: 32000 }],
    reminders: [{ id: "r1_g7", date: "2026-08-04", task: "Send Brandon's Birthday Gift (Birthday Aug 5)", completed: false }],
    preferredCommunication: "WhatsApp",
    lastContactedDate: "2026-08-03"
  },

  {
    id: "CEO0023",
    firstName: "Amanda",
    lastName: "Vasquez",
    gender: "Female",
    occupation: "Head Chef, Savor Catering",
    drive: "Yes",
    tier: "Gold",
    homeBrand: "CEO Printing Services",
    contact: { phoneNumber: "+1 (876) 555-0123", email: "amanda@savorcatering.jm", city: "Kingston", parish: "St. Andrew", country: "Jamaica", deliveryAddress: "8 Barbican Road", deliveryCountry: "Jamaica" },
    profile: { motherName: "Maria Vasquez", fatherName: "Carlos Vasquez Sr.", wifeName: "N/A", husbandName: "Carlos Vasquez", husbandBirthday: "August 13", children: [{ name: "Isabella Vasquez", birthday: "August 7" }], pets: "Pepper", personalNotes: "Catering business owner ordering chef aprons, menu printing, and branded napkins." },
    importantDates: [{ label: "Birthday", date: "August 12" }, { label: "Isabella's Birthday", date: "August 7" }, { label: "Carlos's Birthday", date: "August 13" }],
    history: { firstOrderDate: "2025-03-22", lastOrderDate: "2026-08-01", totalOrders: 8, productsPurchased: ["Custom Aprons", "Menu Cards"], preferredCategories: ["Catering Merch"], clientPreferences: ["Stain resistant"], lifetimeRevenue: 490000, averageOrderValue: 61250 },
    interests: { sports: { sport: "Culinary Arts", favoriteTeam: "Iron Chef", teamOne: "Jamaica Culinary", teamTwo: "Food Network", favoritePlayer: "Gordon Ramsay", nationalTeam: "UK" }, hobbies: ["Cooking"], favoriteColors: ["White", "Burgundy"], giftPreferences: ["Custom Knife Engraving"] },
    timeline: [{ id: "e1_g8", type: "Order", date: "2026-08-01", content: "Ordered 20 Custom Embroidered Chef Aprons", amount: 50000 }],
    reminders: [{ id: "r1_g8", date: "2026-08-06", task: "Send Isabella's Birthday Gift Box (Birthday Aug 7)", completed: false }],
    preferredCommunication: "Phone",
    lastContactedDate: "2026-08-01"
  },

  {
    id: "CEO0024",
    firstName: "Ryan",
    lastName: "Reynolds",
    gender: "Male",
    occupation: "Director, Reynolds Realty",
    drive: "Yes",
    tier: "Gold",
    homeBrand: "CEO Printing Services",
    contact: { phoneNumber: "+1 (876) 555-0124", email: "ryan@reynoldsrealty.jm", city: "Montego Bay", parish: "St. James", country: "Jamaica", deliveryAddress: "15 Marine Drive, Montego Bay", deliveryCountry: "Jamaica" },
    profile: { motherName: "Sandra Reynolds", fatherName: "Paul Reynolds", wifeName: "Jessica Reynolds", wifeBirthday: "August 8", husbandName: "N/A", children: [{ name: "Lucas Reynolds", birthday: "August 12" }], pets: "Scooby", personalNotes: "Realtor ordering signboards, business cards, and client closing gift boxes." },
    importantDates: [{ label: "Birthday", date: "August 14" }, { label: "Jessica's Birthday", date: "August 8" }, { label: "Lucas's Birthday", date: "August 12" }],
    history: { firstOrderDate: "2025-01-28", lastOrderDate: "2026-08-02", totalOrders: 9, productsPurchased: ["Realty Signs", "Business Cards"], preferredCategories: ["Real Estate"], clientPreferences: ["Heavy cardstock"], lifetimeRevenue: 580000, averageOrderValue: 64444 },
    interests: { sports: { sport: "Golf", favoriteTeam: "Tryall Club", teamOne: "Jamaica Golf", teamTwo: "PGA", favoritePlayer: "Tiger Woods", nationalTeam: "USA" }, hobbies: ["Golf"], favoriteColors: ["Green", "Gold"], giftPreferences: ["Golf Accessories"] },
    timeline: [{ id: "e1_g9", type: "Order", date: "2026-08-02", content: "Ordered 500 Gold Foil Business Cards", amount: 42000 }],
    reminders: [{ id: "r1_g9", date: "2026-08-07", task: "Prepare Jessica's Birthday Gift Box (Birthday Aug 8)", completed: false }],
    preferredCommunication: "Email",
    lastContactedDate: "2026-08-02"
  },

  {
    id: "CEO0025",
    firstName: "Nicole",
    lastName: "Wright",
    gender: "Female",
    occupation: "VP, Wright Insurance Brokers",
    drive: "Yes",
    tier: "Gold",
    homeBrand: "Librarium Luxe",
    contact: { phoneNumber: "+1 (876) 555-0125", email: "nicole.w@wrightinsurance.jm", city: "Kingston", parish: "St. Andrew", country: "Jamaica", deliveryAddress: "12 Knutsford Boulevard", deliveryCountry: "Jamaica" },
    profile: { motherName: "Barbara Wright", fatherName: "Stephen Wright Sr.", wifeName: "N/A", husbandName: "Stephen Wright", husbandBirthday: "August 10", children: [{ name: "Hannah Wright", birthday: "August 4" }], pets: "Princess", personalNotes: "Insurance executive ordering executive gift planners and finance book sets." },
    importantDates: [{ label: "Birthday", date: "August 7" }, { label: "Hannah's Birthday", date: "August 4" }, { label: "Stephen's Birthday", date: "August 10" }],
    history: { firstOrderDate: "2025-02-18", lastOrderDate: "2026-08-03", totalOrders: 7, productsPurchased: ["Psychology of Money", "Executive Planners"], preferredCategories: ["Finance Books"], clientPreferences: ["Navy cover"], lifetimeRevenue: 410000, averageOrderValue: 58571 },
    interests: { sports: { sport: "Squash", favoriteTeam: "Jamaica Squash Assoc", teamOne: "Jamaica Squash", teamTwo: "WSA", favoritePlayer: "Chris Binnie", nationalTeam: "Jamaica" }, hobbies: ["Fitness"], favoriteColors: ["Navy", "Silver"], giftPreferences: ["Executive Planners"] },
    timeline: [{ id: "e1_g10", type: "Order", date: "2026-08-03", content: "Ordered 5 Psychology of Money Hardcovers", amount: 75000 }],
    reminders: [{ id: "r1_g10", date: "2026-08-03", task: "Prepare Hannah's Birthday Gift (Birthday Aug 4)", completed: false }],
    preferredCommunication: "WhatsApp",
    lastContactedDate: "2026-08-03"
  },

  {
    id: "CEO0026",
    firstName: "Trevor",
    lastName: "Phillips",
    gender: "Male",
    occupation: "CEO, Phillips Logistics",
    drive: "Yes",
    tier: "Gold",
    homeBrand: "CEO Printing Services",
    contact: { phoneNumber: "+1 (876) 555-0126", email: "trevor@phillipslog.jm", city: "Kingston", parish: "St. Andrew", country: "Jamaica", deliveryAddress: "3 Marcus Garvey Drive", deliveryCountry: "Jamaica" },
    profile: { motherName: "Ruth Phillips", fatherName: "Trevor Phillips Sr.", wifeName: "Karen Phillips", wifeBirthday: "August 13", husbandName: "N/A", children: [{ name: "Trevor Jr.", birthday: "August 9" }], pets: "Tyson", personalNotes: "Logistics owner ordering truck branding and staff poloshirts." },
    importantDates: [{ label: "Birthday", date: "August 11" }, { label: "Trevor Jr.'s Birthday", date: "August 9" }, { label: "Karen's Birthday", date: "August 13" }],
    history: { firstOrderDate: "2025-04-01", lastOrderDate: "2026-08-01", totalOrders: 8, productsPurchased: ["Truck Decals", "Polo Shirts"], preferredCategories: ["Logistics"], clientPreferences: ["Red print"], lifetimeRevenue: 470000, averageOrderValue: 58750 },
    interests: { sports: { sport: "Cricket", favoriteTeam: "West Indies", teamOne: "Jamaica", teamTwo: "Windies", favoritePlayer: "Nicholas Pooran", nationalTeam: "West Indies" }, hobbies: ["Dominos"], favoriteColors: ["Red", "White"], giftPreferences: ["Domino Set"] },
    timeline: [{ id: "e1_g11", type: "Order", date: "2026-08-01", content: "Ordered 15 Custom Polo Shirts", amount: 37500 }],
    reminders: [{ id: "r1_g11", date: "2026-08-08", task: "Send Trevor Jr.'s Birthday Gift Box (Birthday Aug 9)", completed: false }],
    preferredCommunication: "Phone",
    lastContactedDate: "2026-08-01"
  },

  {
    id: "CEO0027",
    firstName: "Kevin",
    lastName: "Clarke",
    gender: "Male",
    occupation: "Director, Clarke Security",
    drive: "Yes",
    tier: "Gold",
    homeBrand: "CEO Printing Services",
    contact: { phoneNumber: "+1 (876) 555-0127", email: "kclarke@clarkesecurity.jm", city: "Kingston", parish: "St. Andrew", country: "Jamaica", deliveryAddress: "18 Eastwood Park Road", deliveryCountry: "Jamaica" },
    profile: { motherName: "Angela Clarke", fatherName: "Samuel Clarke", wifeName: "Diana Clarke", wifeBirthday: "August 5", husbandName: "N/A", children: [{ name: "Kevin Jr.", birthday: "August 12" }], pets: "Major", personalNotes: "Security firm owner ordering high-visibility tactical vests and ID badges." },
    importantDates: [{ label: "Birthday", date: "August 9" }, { label: "Diana's Birthday", date: "August 5" }, { label: "Kevin Jr.'s Birthday", date: "August 12" }],
    history: { firstOrderDate: "2025-03-05", lastOrderDate: "2026-08-02", totalOrders: 10, productsPurchased: ["Tactical Vests", "ID Badges"], preferredCategories: ["Security Gear"], clientPreferences: ["Reflective yellow"], lifetimeRevenue: 610000, averageOrderValue: 61000 },
    interests: { sports: { sport: "Martial Arts", favoriteTeam: "Jamaica Karate", teamOne: "UFC", teamTwo: "Jamaica Taekwondo", favoritePlayer: "Israel Adesanya", nationalTeam: "Nigeria" }, hobbies: ["Fitness"], favoriteColors: ["Black", "Yellow"], giftPreferences: ["Tactical Gear"] },
    timeline: [{ id: "e1_g12", type: "Order", date: "2026-08-02", content: "Ordered 50 Tactical Vests with reflective security text", amount: 95000 }],
    reminders: [{ id: "r1_g12", date: "2026-08-04", task: "Prepare Diana's Birthday Gift (Birthday Aug 5)", completed: false }],
    preferredCommunication: "WhatsApp",
    lastContactedDate: "2026-08-02"
  },

  {
    id: "CEO0028",
    firstName: "Samantha",
    lastName: "Hayes",
    gender: "Female",
    occupation: "Manager, Hayes Fitness Studio",
    drive: "Yes",
    tier: "Gold",
    homeBrand: "CEO Printing Services",
    contact: { phoneNumber: "+1 (876) 555-0128", email: "samantha@hayesfitness.jm", city: "Kingston", parish: "St. Andrew", country: "Jamaica", deliveryAddress: "22 Liguanea Plaza", deliveryCountry: "Jamaica" },
    profile: { motherName: "Carol Hayes", fatherName: "Robert Hayes", wifeName: "N/A", husbandName: "Patrick Hayes", husbandBirthday: "August 8", children: [{ name: "Zoe Hayes", birthday: "August 14" }], pets: "Kobe", personalNotes: "Gym owner ordering dri-fit workout apparel and shaker bottles." },
    importantDates: [{ label: "Birthday", date: "August 12" }, { label: "Patrick's Birthday", date: "August 8" }, { label: "Zoe's Birthday", date: "August 14" }],
    history: { firstOrderDate: "2025-05-01", lastOrderDate: "2026-08-03", totalOrders: 6, productsPurchased: ["Dri-Fit Tees", "Water Bottles"], preferredCategories: ["Fitness Apparel"], clientPreferences: ["Neon colors"], lifetimeRevenue: 380000, averageOrderValue: 63333 },
    interests: { sports: { sport: "Crossfit", favoriteTeam: "Crossfit Games", teamOne: "Jamaica Fitness", teamTwo: "Rogue", favoritePlayer: "Mat Fraser", nationalTeam: "USA" }, hobbies: ["Crossfit"], favoriteColors: ["Neon Pink", "Black"], giftPreferences: ["Fitness Wear"] },
    timeline: [{ id: "e1_g13", type: "Order", date: "2026-08-03", content: "Ordered 40 Dri-Fit Gym Shirts", amount: 68000 }],
    reminders: [{ id: "r1_g13", date: "2026-08-07", task: "Send Patrick's Birthday Greetings (Birthday Aug 8)", completed: false }],
    preferredCommunication: "WhatsApp",
    lastContactedDate: "2026-08-03"
  },

  {
    id: "CEO0029",
    firstName: "James",
    lastName: "Carter",
    gender: "Male",
    occupation: "Owner, Carter Automotive",
    drive: "Yes",
    tier: "Gold",
    homeBrand: "CEO Printing Services",
    contact: { phoneNumber: "+1 (876) 555-0129", email: "jcarter@carterauto.jm", city: "Montego Bay", parish: "St. James", country: "Jamaica", deliveryAddress: "5 Alice Eldemire Drive", deliveryCountry: "Jamaica" },
    profile: { motherName: "Nancy Carter", fatherName: "James Carter Sr.", wifeName: "Lisa Carter", wifeBirthday: "August 10", husbandName: "N/A", children: [{ name: "James Jr.", birthday: "August 6" }], pets: "Buster", personalNotes: "Auto repair owner ordering mechanic overalls and storefront signs." },
    importantDates: [{ label: "Birthday", date: "August 6" }, { label: "James Jr.'s Birthday", date: "August 6" }, { label: "Lisa's Birthday", date: "August 10" }],
    history: { firstOrderDate: "2025-02-14", lastOrderDate: "2026-08-01", totalOrders: 7, productsPurchased: ["Mechanic Shirts", "Window Stickers"], preferredCategories: ["Automotive"], clientPreferences: ["Durable fabric"], lifetimeRevenue: 420000, averageOrderValue: 60000 },
    interests: { sports: { sport: "Formula 1", favoriteTeam: "Ferrari", teamOne: "Scuderia Ferrari", teamTwo: "Red Bull", favoritePlayer: "Charles Leclerc", nationalTeam: "Monaco" }, hobbies: ["Car Repair"], favoriteColors: ["Red", "Black"], giftPreferences: ["Toolsets"] },
    timeline: [{ id: "e1_g14", type: "Order", date: "2026-08-01", content: "Ordered 15 Mechanic Shirts", amount: 37500 }],
    reminders: [{ id: "r1_g14", date: "2026-08-05", task: "Call James for Joint Birthday Wishes with James Jr. (Birthday Aug 6)", completed: false }],
    preferredCommunication: "Phone",
    lastContactedDate: "2026-08-01"
  },

  {
    id: "CEO0030",
    firstName: "Natalie",
    lastName: "Cole",
    gender: "Female",
    occupation: "Founder, Cole PR Agency",
    drive: "Yes",
    tier: "Gold",
    homeBrand: "CEO Lifestyle",
    contact: { phoneNumber: "+1 (876) 555-0130", email: "natalie@colepr.jm", city: "Kingston", parish: "St. Andrew", country: "Jamaica", deliveryAddress: "10 Hillcrest Avenue", deliveryCountry: "Jamaica" },
    profile: { motherName: "Shirley Cole", fatherName: "David Cole", wifeName: "N/A", husbandName: "Andrew Cole", husbandBirthday: "August 9", children: [{ name: "Sophia Cole", birthday: "August 11" }], pets: "Bella", personalNotes: "PR agency owner ordering media press kits, Magic Heart Cubes, and luxury gift boxes." },
    importantDates: [{ label: "Birthday", date: "August 14" }, { label: "Andrew's Birthday", date: "August 9" }, { label: "Sophia's Birthday", date: "August 11" }],
    history: { firstOrderDate: "2025-04-10", lastOrderDate: "2026-08-02", totalOrders: 9, productsPurchased: ["Magic Heart Cubes", "Press Folders"], preferredCategories: ["PR & Media"], clientPreferences: ["Rose gold foil"], lifetimeRevenue: 510000, averageOrderValue: 56666 },
    interests: { sports: { sport: "Athletics", favoriteTeam: "Team Jamaica", teamOne: "MVP", teamTwo: "Racers", favoritePlayer: "Elaine Thompson-Herah", nationalTeam: "Jamaica" }, hobbies: ["Event Styling"], favoriteColors: ["Rose Gold", "White"], giftPreferences: ["Magic Heart Cubes"] },
    timeline: [{ id: "e1_g15", type: "Order", date: "2026-08-02", content: "Ordered 2 Magic Heart Cubes for PR campaign launch", amount: 37000 }],
    reminders: [{ id: "r1_g15", date: "2026-08-08", task: "Prepare Andrew's Birthday Gift (Birthday Aug 9)", completed: false }],
    preferredCommunication: "WhatsApp",
    lastContactedDate: "2026-08-02"
  },

  // --------------------------------------------------------------------------
  // SILVER CLIENTS (15) - Standard Customer Base & Future Opportunities
  // --------------------------------------------------------------------------
  ...Array.from({ length: 15 }, (_, i) => {
    const idNum = 31 + i;
    const names = [
      ["Andrew", "Scott"], ["Lisa", "Taylor"], ["Patrick", "Henderson"], ["Megan", "Foster"],
      ["Justin", "Reed"], ["Jessica", "Diaz"], ["Ethan", "Hall"], ["Stephanie", "Young"],
      ["Anthony", "King"], ["Karen", "Adams"], ["Brian", "Nelson"], ["Vanessa", "Mitchell"],
      ["Eric", "Perez"], ["Chloe", "Campbell"], ["Matthew", "Morgan"]
    ];
    const [firstName, lastName] = names[i] || ["Silver", `Client${idNum}`];
    const day = (i % 14) + 1; // Days 1 to 14 in August
    return {
      id: `CEO${String(idNum).padStart(4, "0")}`,
      firstName,
      lastName,
      gender: (i % 2 === 0 ? "Male" : "Female") as any,
      occupation: "Business Professional",
      drive: "Yes" as const,
      tier: "Silver" as const,
      homeBrand: (i % 3 === 0 ? "CEO Printing Services" : i % 3 === 1 ? "Librarium Luxe" : "CEO Lifestyle") as any,
      contact: {
        phoneNumber: `+1 (876) 555-01${idNum}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        city: i % 2 === 0 ? "Kingston" : "Montego Bay",
        parish: i % 2 === 0 ? "St. Andrew" : "St. James",
        country: "Jamaica",
        deliveryAddress: `${idNum} Main Street, Kingston`,
        deliveryCountry: "Jamaica"
      },
      profile: {
        motherName: `Mother ${lastName}`,
        fatherName: `Father ${lastName}`,
        wifeName: i % 2 === 0 ? `Wife ${lastName}` : "N/A",
        husbandName: i % 2 !== 0 ? `Husband ${lastName}` : "N/A",
        children: [{ name: `Child ${lastName}`, birthday: `August ${day}` }],
        pets: "None",
        personalNotes: "Standard retail client with purchase history and future repeat potential."
      },
      importantDates: [
        { label: "Birthday", date: `August ${day}` },
        { label: "Anniversary", date: `August ${Math.min(14, day + 2)}` }
      ],
      history: {
        firstOrderDate: "2026-05-10",
        lastOrderDate: `2026-08-0${(i % 5) + 1}`,
        totalOrders: 2 + (i % 2),
        productsPurchased: ["Custom T-Shirts", "Book Bundles", "Business Cards"],
        preferredCategories: ["Apparel", "Books"],
        clientPreferences: ["Standard delivery"],
        lifetimeRevenue: 45000 + (i * 3000),
        averageOrderValue: 22500
      },
      interests: {
        sports: { sport: "Football", favoriteTeam: "Jamaica", teamOne: "Jamaica", teamTwo: "Reggae Boyz", favoritePlayer: "Leon Bailey", nationalTeam: "Jamaica" },
        hobbies: ["Shopping", "Travel"],
        favoriteColors: ["Blue", "Black"],
        giftPreferences: ["Gift Cards"]
      },
      timeline: [
        { id: "e1_std_" + idNum, type: "Order" as const, date: `2026-08-0${(i % 5) + 1}`, content: "Completed standard retail purchase", amount: 22500 }
      ],
      reminders: [
        { id: "r1_std_" + idNum, date: `2026-08-${String(day).padStart(2, "0")}`, task: `Follow up with ${firstName} for upcoming birthday on August ${day}`, completed: false }
      ],
      preferredCommunication: "Email" as const,
      lastContactedDate: `2026-08-0${(i % 5) + 1}`
    };
  })
];

// ============================================================================
// 2. ASPIRING CLIENTS (15 PROSPECTIVE ACCOUNTS)
// Statuses: New Inquiry, Quote Sent, Awaiting Response, Follow-up Required
// ============================================================================
export const INITIAL_ASPIRING_CLIENTS: AspiringClient[] = [
  // 1. Due Today (Aug 1) / Immediate Focus
  {
    id: "ASP001",
    name: "Samantha Wright",
    contactInfo: "+1 (876) 555-0192 | samantha.w@example.com",
    sourceOfInquiry: "Instagram",
    serviceInterestedIn: "Magic Heart Cube Custom Anniversary Package",
    dateContacted: "2026-08-01",
    notes: "Inquired on Instagram for custom photo Magic Heart Cube for 5th wedding anniversary. Requested gift box quote.",
    assignedUser: "Master Administrator",
    status: "Follow Up Required",
    followUpDate: "2026-08-01"
  },
  {
    id: "ASP002",
    name: "Dr. Aris Thorne",
    contactInfo: "+1 (876) 555-9201 | dr.thorne@medtech.jm",
    sourceOfInquiry: "Website",
    serviceInterestedIn: "Corporate Branding & Large Format Medical Banners",
    dateContacted: "2026-07-30",
    notes: "Inquired regarding large format print layout, outdoor vinyl banners, and location delivery to Montego Bay facility.",
    assignedUser: "Master Administrator",
    status: "Quote Sent",
    followUpDate: "2026-08-01"
  },
  {
    id: "ASP003",
    name: "Kevin Jackson",
    contactInfo: "+1 (876) 555-0891 | k.jackson@techjm.com",
    sourceOfInquiry: "Walk-in",
    serviceInterestedIn: "50 Custom DTF Printed Corporate Polos",
    dateContacted: "2026-08-01",
    notes: "Walked into store asking for 50 company polos with DTF printed back logo and chest embroidery.",
    assignedUser: "Janelle Bennett",
    status: "Follow Up Required",
    followUpDate: "2026-08-01"
  },

  // 2. Due Tomorrow (Aug 2) / 1 Day Lead Time
  {
    id: "ASP004",
    name: "Natalie Myers",
    contactInfo: "+1 (876) 555-0482 | natalie@myersdecor.com",
    sourceOfInquiry: "Instagram",
    serviceInterestedIn: "Librarium Luxe Rare Leather Collector Set (10 Books)",
    dateContacted: "2026-07-31",
    notes: "Sent DM interested in rare leather collector books for luxury living room styling. Sent initial pricing catalog.",
    assignedUser: "Master Administrator",
    status: "Awaiting Response",
    followUpDate: "2026-08-02"
  },
  {
    id: "ASP005",
    name: "Garrett Cole",
    contactInfo: "+1 (876) 555-0371 | gcole@islandtours.jm",
    sourceOfInquiry: "Phone Call",
    serviceInterestedIn: "Tour Vehicle Stickers & Floral Welcome Packages",
    dateContacted: "2026-08-01",
    notes: "Called regarding delivery costs to Ocho Rios for 10 vinyl outdoor banners and luxury tour welcome packages.",
    assignedUser: "Marcus Sterling (Manager)",
    status: "New Inquiry",
    followUpDate: "2026-08-02"
  },

  // 3. Due 3 Days (Aug 4)
  {
    id: "ASP006",
    name: "Tanya Redwood",
    contactInfo: "+1 (876) 555-0219 | tanya@redwoodevents.com",
    sourceOfInquiry: "Referral",
    serviceInterestedIn: "80 Corporate Branding Welcome Gift Boxes",
    dateContacted: "2026-08-01",
    notes: "Referred by Christopher Reid. Interested in 80 customized acrylic wedding gift boxes and luxury favors.",
    assignedUser: "Master Administrator",
    status: "Quote Sent",
    followUpDate: "2026-08-04"
  },
  {
    id: "ASP007",
    name: "Oshane Palmer",
    contactInfo: "+1 (876) 555-0633 | oshane@fitnesshub.jm",
    sourceOfInquiry: "Instagram",
    serviceInterestedIn: "100 Custom Gym Dri-Fit T-Shirts",
    dateContacted: "2026-08-01",
    notes: "Requested price list for 100 gym dri-fit tees with chest DTF printing and custom neck labels.",
    assignedUser: "Janelle Bennett",
    status: "Follow Up Required",
    followUpDate: "2026-08-04"
  },
  {
    id: "ASP008",
    name: "Fiona Bennett",
    contactInfo: "+1 (876) 555-0144 | f.bennett@lawfirm.jm",
    sourceOfInquiry: "Website",
    serviceInterestedIn: "Gold Foil Business Cards & T-Shirt Package",
    dateContacted: "2026-08-02",
    notes: "Inquired about 500 thick cardstock business cards with gold foil borders and staff uniform tees.",
    assignedUser: "Master Administrator",
    status: "New Inquiry",
    followUpDate: "2026-08-04"
  },

  // 4. Due 7 Days (Aug 8)
  {
    id: "ASP009",
    name: "Dominic Vance",
    contactInfo: "+1 (876) 555-0988 | dvance@vancemotors.com",
    sourceOfInquiry: "Phone Call",
    serviceInterestedIn: "Magic Heart Cubes & Dealership Vehicle Stickers",
    dateContacted: "2026-08-01",
    notes: "Inquired on bulk pricing for car dealership keytags, window stickers, and VIP handover Magic Heart Cubes.",
    assignedUser: "Marcus Sterling (Manager)",
    status: "Quote Sent",
    followUpDate: "2026-08-08"
  },
  {
    id: "ASP010",
    name: "Janice Lawson",
    contactInfo: "+1 (876) 555-0722 | janicelawson@email.com",
    sourceOfInquiry: "Walk-in",
    serviceInterestedIn: "Librarium Luxe Bespoke Hardcover Bundle (15 Books)",
    dateContacted: "2026-08-01",
    notes: "Came in store seeking 15 copies of leather-bound business classics for corporate executive library.",
    assignedUser: "Master Administrator",
    status: "Awaiting Response",
    followUpDate: "2026-08-08"
  },
  {
    id: "ASP011",
    name: "Carlton Davis",
    contactInfo: "+1 (876) 555-0322 | cdavis@davislogistics.jm",
    sourceOfInquiry: "Website",
    serviceInterestedIn: "Floral & Corporate Branding Package",
    dateContacted: "2026-08-01",
    notes: "Sent DTF quote for Earl Prints supplier; follow-up needed regarding gang sheet density and venue floral delivery.",
    assignedUser: "Janelle Bennett",
    status: "Follow Up Required",
    followUpDate: "2026-08-08"
  },

  // 5. Due 14 Days (Aug 14)
  {
    id: "ASP012",
    name: "Sasha Pink",
    contactInfo: "+1 (876) 555-0411 | sasha@pinkglam.com",
    sourceOfInquiry: "Instagram",
    serviceInterestedIn: "Apparel Studio T-Shirt Package (30 Shirts)",
    dateContacted: "2026-08-01",
    notes: "Quote prepared for 30 ladies fitted shirts. Awaiting deposit confirmation.",
    assignedUser: "Master Administrator",
    status: "Follow Up Required",
    followUpDate: "2026-08-14"
  },
  {
    id: "ASP013",
    name: "Brian Ferguson",
    contactInfo: "+1 (876) 555-0567 | brian@fergusonbuild.jm",
    sourceOfInquiry: "Phone Call",
    serviceInterestedIn: "Location Trip to Mandeville & Site Signage",
    dateContacted: "2026-08-01",
    notes: "Quoted $45,000 JMD for delivery and site setup in Mandeville. Follow up on schedule.",
    assignedUser: "Marcus Sterling (Manager)",
    status: "New Inquiry",
    followUpDate: "2026-08-14"
  },
  {
    id: "ASP014",
    name: "Evelyn Beckford",
    contactInfo: "+1 (876) 555-0899 | evelyn@beckfordgal.com",
    sourceOfInquiry: "Walk-in",
    serviceInterestedIn: "Fine Art Leather Folio & Magic Heart Cube Gift Set",
    dateContacted: "2026-08-01",
    notes: "Viewed Shakespeare Folio in store. Needs follow-up regarding anniversary surprise package.",
    assignedUser: "Master Administrator",
    status: "Quote Sent",
    followUpDate: "2026-08-14"
  },
  {
    id: "ASP015",
    name: "Rohan Miller",
    contactInfo: "+1 (876) 555-0300 | rmiller@caribtech.com",
    sourceOfInquiry: "Website",
    serviceInterestedIn: "Production Layout 200 Corporate Flyers & Polos",
    dateContacted: "2026-08-01",
    notes: "Proof sent via email. Follow up needed to confirm paper weight selection and polo shirt sizes.",
    assignedUser: "Janelle Bennett",
    status: "Awaiting Response",
    followUpDate: "2026-08-14"
  }
];

// ============================================================================
// 3. CALENDAR EVENTS & CAMPAIGNS (50+ EVENTS: AUG 1 - AUG 14 & FULL MONTH)
// Spread naturally over the 14-day stress test window
// ============================================================================
export const INITIAL_BUSINESS_EVENTS: BusinessEvent[] = [
  // CEO Business Days (August 1 - August 14)
  {
    id: "be_st_01",
    title: "KRZ & Earl Prints Supplier Audit Meeting",
    date: "2026-08-02",
    type: "CEO Business Day",
    category: "CEO Business Day",
    importanceLevel: "Critical",
    alertTiming: "Same Day",
    repeatSchedule: "Does Not Repeat",
    description: "Review DTF sheet costs, print quality, and delivery schedules with Earl Prints & KRZ suppliers.",
    preparationChecklist: [
      { id: "chk_1", task: "Compile DTF pricing history logs", completed: true },
      { id: "chk_2", task: "Review gang sheet print defects", completed: false }
    ]
  },
  {
    id: "be_st_02",
    title: "Summer T-Shirt Promotion Drive Launch",
    date: "2026-08-05",
    type: "CEO Business Day",
    category: "CEO Business Day",
    importanceLevel: "Critical",
    alertTiming: "3 Days Before",
    repeatSchedule: "Does Not Repeat",
    description: "Launch DTF summer apparel promotion campaign across social media and email newsletters.",
    preparationChecklist: [
      { id: "chk_3", task: "Finalize social media ad graphics", completed: true },
      { id: "chk_4", task: "Check blank shirt stock levels", completed: false }
    ]
  },
  {
    id: "be_st_03",
    title: "Mid-Month Apparel Inventory Review",
    date: "2026-08-08",
    type: "CEO Business Day",
    category: "CEO Business Day",
    importanceLevel: "Important",
    alertTiming: "1 Day Before",
    repeatSchedule: "Every Month",
    description: "Audit raw t-shirt blanks, embroidery threads, and packaging boxes.",
    preparationChecklist: [
      { id: "chk_5", task: "Count store vs office shirt stock", completed: false }
    ]
  },
  {
    id: "be_st_04",
    title: "Corporate Uniforms Q3 Fulfillment Drive",
    date: "2026-08-11",
    type: "CEO Business Day",
    category: "CEO Business Day",
    importanceLevel: "Critical",
    alertTiming: "7 Days Before",
    repeatSchedule: "Does Not Repeat",
    description: "Execute Q3 staff polo orders for Marcus Sterling, Sarah Thompson, and corporate clients."
  },
  {
    id: "be_st_05",
    title: "Early Valentine's Day Campaign Prep Kickoff",
    date: "2026-08-14",
    type: "CEO Business Day",
    category: "CEO Business Day",
    importanceLevel: "Important",
    alertTiming: "14 Days Before",
    repeatSchedule: "Every Year",
    description: "Begin early supplier sourcing for luxury Valentine gift boxes and custom acrylic heart cubes."
  },

  // Librarium Luxe Business Days (August 1 - August 14)
  {
    id: "be_ll_01",
    title: "Romance Book Promotion Drive",
    date: "2026-08-03",
    type: "Librarium Luxe Business Day",
    category: "Librarium Luxe Business Day",
    importanceLevel: "Important",
    alertTiming: "1 Day Before",
    repeatSchedule: "Does Not Repeat",
    description: "Featured promotion for romance collection and velvet gift box sets for VIP clients."
  },
  {
    id: "be_ll_02",
    title: "Librarium Luxe Leather Classics Restock",
    date: "2026-08-07",
    type: "Librarium Luxe Business Day",
    category: "Librarium Luxe Business Day",
    importanceLevel: "Critical",
    alertTiming: "3 Days Before",
    repeatSchedule: "Every Month",
    description: "Receive international shipment of leather-bound classics and rare folios."
  },
  {
    id: "be_ll_03",
    title: "Mindset Mastery Hardcover Series Book Launch",
    date: "2026-08-10",
    type: "Librarium Luxe Business Day",
    category: "Librarium Luxe Business Day",
    importanceLevel: "Critical",
    alertTiming: "7 Days Before",
    repeatSchedule: "Does Not Repeat",
    description: "Unveil 10 new hardcovers in the Mindset & Personal Growth series to VIP collectors."
  },
  {
    id: "be_ll_04",
    title: "Rare Leather Folio Preview for Platinum Collectors",
    date: "2026-08-13",
    type: "Librarium Luxe Business Day",
    category: "Librarium Luxe Business Day",
    importanceLevel: "Important",
    alertTiming: "3 Days Before",
    repeatSchedule: "Does Not Repeat",
    description: "Private digital preview sent to Victoria St. Claire, Harrison Brooks, and Penelope Croft."
  },

  // General Business Events (August 1 - August 14)
  {
    id: "be_gen_01",
    title: "Monthly Banking & Cashflow Reconciliation",
    date: "2026-08-04",
    type: "General Business Day",
    category: "General Business Day",
    importanceLevel: "Important",
    alertTiming: "1 Day Before",
    repeatSchedule: "Every Month",
    description: "Reconcile JMD merchant payments, courier charges, and supplier bank transfers."
  },
  {
    id: "be_gen_02",
    title: "GCT & Statutory Tax Filing Reminder",
    date: "2026-08-09",
    type: "General Business Day",
    category: "General Business Day",
    importanceLevel: "Critical",
    alertTiming: "3 Days Before",
    repeatSchedule: "Every Month",
    description: "Submit monthly GCT returns and payroll statutory declarations."
  },
  {
    id: "be_gen_03",
    title: "DTF Printers & Heat Presses Equipment Maintenance",
    date: "2026-08-12",
    type: "General Business Day",
    category: "General Business Day",
    importanceLevel: "Important",
    alertTiming: "1 Day Before",
    repeatSchedule: "Every Month",
    description: "Clean print heads, calibrate heat press temperatures, and inspect laser cutters."
  },

  // Client Family Milestones (Natural Naming in 14-day window)
  { id: "pe_st_01", title: "Carli's Wife's Birthday (Nickellia)", date: "2026-08-02", type: "Gold / Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Critical", description: "Special birthday celebration for Nickellia." },
  { id: "pe_st_02", title: "Sarah's Husband's Birthday (David)", date: "2026-08-05", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "David Thompson's birthday." },
  { id: "pe_st_03", title: "Sarah's Daughter's Birthday (Emily)", date: "2026-08-12", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Emily Thompson's birthday." },
  { id: "pe_st_04", title: "Christopher's Birthday", date: "2026-08-02", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Critical", description: "Christopher Reid's birthday." },
  { id: "pe_st_05", title: "Christopher's Wife's Birthday (Vanessa)", date: "2026-08-07", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Vanessa Reid's birthday." },
  { id: "pe_st_06", title: "Christopher's Son's Birthday (Carter)", date: "2026-08-10", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Carter Reid's birthday." },
  { id: "pe_st_07", title: "Victoria's Son's Birthday (Alexander)", date: "2026-08-06", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Alexander St. Claire's birthday." },
  { id: "pe_st_08", title: "Victoria's Birthday", date: "2026-08-08", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Critical", description: "Victoria St. Claire's birthday." },
  { id: "pe_st_09", title: "Victoria's Husband's Birthday (Julian)", date: "2026-08-13", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Julian St. Claire's birthday." },
  { id: "pe_st_10", title: "Marcus Sterling's Birthday", date: "2026-08-04", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Critical", description: "Marcus Sterling's birthday." },
  { id: "pe_st_11", title: "Marcus's Wife's Birthday (Rachel)", date: "2026-08-09", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Rachel Sterling's birthday." },
  { id: "pe_st_12", title: "Marcus's Son's Birthday (Marcus Jr.)", date: "2026-08-14", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Marcus Sterling Jr.'s birthday." },
  { id: "pe_st_13", title: "Alicia's Birthday", date: "2026-08-06", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Critical", description: "Alicia Grant's birthday." },
  { id: "pe_st_14", title: "Alicia's Husband's Birthday (Kevin)", date: "2026-08-11", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Kevin Grant's birthday." },
  { id: "pe_st_15", title: "Alicia's Daughter's Birthday (Ava)", date: "2026-08-13", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Ava Grant's birthday." },
  { id: "pe_st_16", title: "Jonathan's Wife's Birthday (Sophia)", date: "2026-08-03", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Sophia Blake's birthday." },
  { id: "pe_st_17", title: "Jonathan's Birthday", date: "2026-08-07", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Critical", description: "Jonathan Blake's birthday." },
  { id: "pe_st_18", title: "Jonathan's Son's Birthday (Oliver)", date: "2026-08-09", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Oliver Blake's birthday." },
  { id: "pe_st_19", title: "Elizabeth's Birthday", date: "2026-08-09", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Critical", description: "Elizabeth Vance's birthday." },
  { id: "pe_st_20", title: "Elizabeth's Husband's Birthday (Richard)", date: "2026-08-10", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Richard Vance's birthday." },
  { id: "pe_st_21", title: "Raymond's Wife's Birthday (Maria)", date: "2026-08-06", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Maria Sterling's birthday." },
  { id: "pe_st_22", title: "Raymond's Birthday & Son's Birthday (Lucas)", date: "2026-08-11", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Critical", description: "Raymond & Lucas Sterling birthday." },
  { id: "pe_st_23", title: "Dr. Karen's Husband's Birthday (Michael)", date: "2026-08-08", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Michael Rochester's birthday." },
  { id: "pe_st_24", title: "Dr. Karen's Birthday", date: "2026-08-12", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Critical", description: "Dr. Karen Rochester's birthday." },
  { id: "pe_st_25", title: "Harrison's Son's Birthday (Mason)", date: "2026-08-07", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Mason Brooks's birthday." },
  { id: "pe_st_26", title: "Harrison's Birthday", date: "2026-08-10", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Critical", description: "Harrison Brooks's birthday." },
  { id: "pe_st_27", title: "Simone's Husband's Birthday (Adrian)", date: "2026-08-04", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Adrian Campbell's birthday." },
  { id: "pe_st_28", title: "Simone's Birthday", date: "2026-08-05", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Critical", description: "Simone Campbell's birthday." },
  { id: "pe_st_29", title: "Derrick's Wife's Birthday (Samantha)", date: "2026-08-11", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Samantha Lewis's birthday." },
  { id: "pe_st_30", title: "Derrick's Birthday", date: "2026-08-13", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Critical", description: "Derrick Lewis's birthday." },
  { id: "pe_st_31", title: "Dr. Angela's Husband's Birthday (Robert)", date: "2026-08-06", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Robert Prescott's birthday." },
  { id: "pe_st_32", title: "Dr. Angela's Birthday", date: "2026-08-14", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Critical", description: "Dr. Angela Prescott's birthday." },
  { id: "pe_st_33", title: "Charles Sterling's Birthday", date: "2026-08-01", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Critical", description: "Charles Sterling's birthday." },
  { id: "pe_st_34", title: "Charles's Son's Birthday (Nathan)", date: "2026-08-08", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Nathan Sterling's birthday." },
  { id: "pe_st_35", title: "Penelope's Daughter's Birthday (Grace)", date: "2026-08-05", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Important", description: "Grace Croft's birthday." },
  { id: "pe_st_36", title: "Penelope's Birthday", date: "2026-08-11", type: "Platinum Client Events", category: "Platinum Client Events", importanceLevel: "Critical", description: "Penelope Croft's birthday." },

  // Additional 15 Events for Silver Clients across 14-day window
  ...Array.from({ length: 15 }, (_, idx) => {
    const day = (idx % 14) + 1;
    return {
      id: `pe_silver_${idx + 1}`,
      title: `Silver Client Milestone Event #${idx + 1}`,
      date: `2026-08-${String(day).padStart(2, "0")}`,
      type: "Silver Client Events" as const,
      category: "Silver Client Events" as const,
      importanceLevel: "Standard" as const,
      description: `Scheduled milestone check for Silver Account #${idx + 1}`
    };
  })
];

// ============================================================================
// 4. LIBRARIUM LUXE INVENTORY (50 BOOKS WITH STOCK ALERTS & RATINGS)
// ============================================================================
export const INITIAL_INVENTORY: LuxeBookInventoryItem[] = [
  // Healthy Stock
  { id: "LUX-101", title: "Shakespeare First Folio (Luxe Blue Leather)", category: "Fine Art", quantity: 15, dateAdded: "2026-08-01", salesHistory: [{ id: "sh-1", clientName: "Victoria St. Claire", date: "2026-08-01", quantitySold: 2 }], rankingStatus: "Healthy", bookRank: "Best Seller", inStore: 5, office: 10, sellingPrice: 35000 },
  { id: "LUX-102", title: "The Wealth of Nations (Signature Gold Edition)", category: "Business & Philosophy", quantity: 12, dateAdded: "2026-08-01", salesHistory: [], rankingStatus: "Stacked", bookRank: "Top Seller", inStore: 4, office: 8, sellingPrice: 28000 },
  { id: "LUX-103", title: "48 Laws of Power (Collector Hardcover)", category: "Mindset & Strategy", quantity: 20, dateAdded: "2026-08-01", salesHistory: [{ id: "sh-2", clientName: "Daniel Williams", date: "2026-08-01", quantitySold: 2 }], rankingStatus: "Healthy", bookRank: "Top Seller", inStore: 8, office: 12, sellingPrice: 18500 },
  { id: "LUX-104", title: "Atomic Habits (Luxe Leatherette Edition)", category: "Personal Growth", quantity: 25, dateAdded: "2026-08-01", salesHistory: [{ id: "sh-3", clientName: "Rachel Morgan", date: "2026-08-02", quantitySold: 15 }], rankingStatus: "Healthy", bookRank: "Best Seller", inStore: 10, office: 15, sellingPrice: 16500 },
  { id: "LUX-105", title: "The Psychology of Money (Hardcover)", category: "Finance", quantity: 18, dateAdded: "2026-08-01", salesHistory: [{ id: "sh-4", clientName: "Nicole Wright", date: "2026-08-03", quantitySold: 5 }], rankingStatus: "Healthy", bookRank: "Top Seller", inStore: 6, office: 12, sellingPrice: 15000 },
  { id: "LUX-106", title: "Think and Grow Rich (Embossed Gold)", category: "Finance", quantity: 14, dateAdded: "2026-08-01", salesHistory: [{ id: "sh-5", clientName: "Dr. Sophia Roberts", date: "2026-08-01", quantitySold: 10 }], rankingStatus: "Healthy", bookRank: "Standard", inStore: 4, office: 10, sellingPrice: 14500 },
  { id: "LUX-107", title: "The Intelligent Investor (Leather Bound)", category: "Finance", quantity: 10, dateAdded: "2026-08-01", salesHistory: [{ id: "sh-6", clientName: "Harrison Brooks", date: "2026-08-01", quantitySold: 2 }], rankingStatus: "Healthy", bookRank: "High Performer", inStore: 3, office: 7, sellingPrice: 22000 },
  { id: "LUX-108", title: "Deep Work (Signature White Edition)", category: "Productivity", quantity: 16, dateAdded: "2026-08-01", salesHistory: [], rankingStatus: "Healthy", bookRank: "Standard", inStore: 6, office: 10, sellingPrice: 15500 },
  { id: "LUX-109", title: "Can't Hurt Me (Special Hardcover)", category: "Mindset", quantity: 22, dateAdded: "2026-08-01", salesHistory: [], rankingStatus: "Healthy", bookRank: "Best Seller", inStore: 8, office: 14, sellingPrice: 17500 },
  { id: "LUX-110", title: "Never Split the Difference (Executive Edition)", category: "Negotiation", quantity: 15, dateAdded: "2026-08-01", salesHistory: [], rankingStatus: "Healthy", bookRank: "High Performer", inStore: 5, office: 10, sellingPrice: 16800 },

  // Low Stock Items (Restock)
  { id: "LUX-111", title: "The Art of War (Gilded Edge Folio)", category: "Classics", quantity: 3, dateAdded: "2026-08-01", salesHistory: [], rankingStatus: "Restock", bookRank: "Top Seller", inStore: 1, office: 2, sellingPrice: 32000 },
  { id: "LUX-112", title: "Meditations by Marcus Aurelius (Leather)", category: "Philosophy", quantity: 2, dateAdded: "2026-08-01", salesHistory: [], rankingStatus: "Restock", bookRank: "Best Seller", inStore: 1, office: 1, sellingPrice: 26000 },
  { id: "LUX-113", title: "Principles for Dealing with the Changing World Order", category: "Finance", quantity: 3, dateAdded: "2026-08-01", salesHistory: [], rankingStatus: "Restock", bookRank: "High Performer", inStore: 1, office: 2, sellingPrice: 24000 },
  { id: "LUX-114", title: "Man's Search for Meaning (Special Edition)", category: "Psychology", quantity: 2, dateAdded: "2026-08-01", salesHistory: [], rankingStatus: "Restock", bookRank: "Standard", inStore: 0, office: 2, sellingPrice: 14000 },
  { id: "LUX-115", title: "Zero to One (Hardcover)", category: "Business", quantity: 3, dateAdded: "2026-08-01", salesHistory: [], rankingStatus: "Restock", bookRank: "Standard", inStore: 1, office: 2, sellingPrice: 15000 },

  // Out of Stock / Urgent Restock Items
  { id: "LUX-121", title: "Principia Mathematica (Platinum Hardcover)", category: "Science", quantity: 0, dateAdded: "2026-08-01", salesHistory: [], rankingStatus: "Urgent Restock", bookRank: "Slow Moving", inStore: 0, office: 0, sellingPrice: 42000 },
  { id: "LUX-122", title: "The Odyssey of Homer (Handcrafted Codex)", category: "Classics", quantity: 0, dateAdded: "2026-08-01", salesHistory: [], rankingStatus: "Urgent Restock", bookRank: "New Release", inStore: 0, office: 0, sellingPrice: 38000 },
  { id: "LUX-123", title: "Mastery by Robert Greene (Hardcover)", category: "Mindset", quantity: 0, dateAdded: "2026-08-01", salesHistory: [], rankingStatus: "Urgent Restock", bookRank: "Best Seller", inStore: 0, office: 0, sellingPrice: 19000 },

  // Additional 32 Items for 50 Total Inventory Items
  ...Array.from({ length: 32 }, (_, idx) => {
    const bookNum = 124 + idx;
    return {
      id: `LUX-${bookNum}`,
      title: `Librarium Collector Series Vol. ${idx + 1}`,
      category: idx % 2 === 0 ? "Classics" : "Personal Growth",
      quantity: 5 + (idx % 8),
      dateAdded: "2026-08-01",
      salesHistory: [],
      rankingStatus: "Healthy" as const,
      bookRank: "Standard" as const,
      inStore: 2 + (idx % 3),
      office: 3 + (idx % 5),
      sellingPrice: 12000 + (idx * 500)
    };
  })
];

// ============================================================================
// 5. APPLICATION USERS
// ============================================================================
export const INITIAL_USERS: AppUser[] = [
  {
    id: "USR-001",
    fullName: "Charles Jolly",
    username: "admin",
    password: "ceo",
    role: UserRole.MASTER_ADMINISTRATOR,
    status: UserStatus.ACTIVE
  },
  {
    id: "USR-002",
    fullName: "Janelle Bennett",
    username: "janelle",
    password: "staffpass",
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE
  },
  {
    id: "USR-003",
    fullName: "Marcus Sterling (Manager)",
    username: "marcus",
    password: "managerpass",
    role: UserRole.MANAGER,
    status: UserStatus.ACTIVE
  }
];

// ============================================================================
// 6. BACKUP HISTORY PRESETS
// ============================================================================
export const INITIAL_BACKUP_HISTORY: BackupRecord[] = [
  {
    id: "b_hist_14",
    backupId: "CLM-20260814-001",
    date: "August 14, 2026",
    createdBy: "Master Administrator",
    version: "2.1.0",
    notes: "V2.1 Stress Test 14-Day High Density Simulation Master Backup",
    fileFormat: "XLSX",
    fileName: "CEO_Master_Backup_14Day_StressTest.xlsx",
    itemCounts: { clients: 45, aspiringClients: 15, inventory: 50, users: 3 }
  },
  {
    id: "b_hist_07",
    backupId: "CLM-20260807-001",
    date: "August 07, 2026",
    createdBy: "Master Administrator",
    version: "2.1.0",
    notes: "Mid-Period Day 7 Operational Backup Snapshot",
    fileFormat: "XLSX",
    fileName: "CEO_Backup_Day7_Simulation.xlsx",
    itemCounts: { clients: 45, aspiringClients: 15, inventory: 50, users: 3 }
  },
  {
    id: "b_hist_01",
    backupId: "CLM-20260801-001",
    date: "August 01, 2026",
    createdBy: "Master Administrator",
    version: "2.1.0",
    notes: "Baseline Day 1 Simulation Initialization Snapshot",
    fileFormat: "XLSX",
    fileName: "CEO_Backup_Baseline_Day1.xlsx",
    itemCounts: { clients: 45, aspiringClients: 15, inventory: 50, users: 3 }
  }
];

// ============================================================================
// 7. PRODUCTION CALCULATORS SAVED QUOTATIONS (15 REALISTIC QUOTATIONS)
// ============================================================================
export const INITIAL_QUOTATIONS: SavedQuotation[] = [
  // Production Layout (3)
  {
    id: "QUOTE-LAY-001",
    toolType: "layout",
    clientName: "Marcus Sterling (Sterling Holdings)",
    title: "100 Units Custom Acrylic Executive Signage",
    date: "2026-08-01",
    totalCost: 75000,
    quotedPrice: 125000,
    details: "100 units on 1/4 inch clear acrylic sheet layout. Includes flame polished edges & stainless standoffs."
  },
  {
    id: "QUOTE-LAY-002",
    toolType: "layout",
    clientName: "Victoria St. Claire (Luxe Group)",
    title: "50 Gold Foil Presentation Folios",
    date: "2026-08-02",
    totalCost: 110000,
    quotedPrice: 180000,
    details: "A4 Card Stock layout, hot stamp gold foil embossing on front cover, 400gsm linen stock."
  },
  {
    id: "QUOTE-LAY-003",
    toolType: "layout",
    clientName: "Derrick Lewis (Island Logistics)",
    title: "500 Weatherproof Vehicle & Truck Decals",
    date: "2026-08-03",
    totalCost: 95000,
    quotedPrice: 165000,
    details: "Vinyl sheet gang layout optimization. Weatherproof UV laminate finish."
  },

  // Apparel Studio (3)
  {
    id: "QUOTE-APP-001",
    toolType: "apparel",
    clientName: "Sarah Thompson (CorpBrand)",
    title: "50 Premium Executive Embroidered Polos",
    date: "2026-08-01",
    totalCost: 88000,
    quotedPrice: 145000,
    details: "Navy blue high-thread count cotton polos with gold metallic left-chest logo embroidery."
  },
  {
    id: "QUOTE-APP-002",
    toolType: "apparel",
    clientName: "Jonathan Blake (Blake Energy)",
    title: "100 Branded Reflective Safety Vests",
    date: "2026-08-02",
    totalCost: 70000,
    quotedPrice: 120000,
    details: "High-visibility neon yellow vests with double-sided reflective back & front logo screen print."
  },
  {
    id: "QUOTE-APP-003",
    toolType: "apparel",
    clientName: "Simone Campbell (Island Chic)",
    title: "60 Custom DTF Summer Collection Tees",
    date: "2026-08-03",
    totalCost: 60000,
    quotedPrice: 105000,
    details: "100% combed ring-spun cotton tees in Coral & Ivory with multi-color front chest art."
  },

  // Book Cost Calculator (3)
  {
    id: "QUOTE-BK-001",
    toolType: "book",
    clientName: "Harrison Brooks (Brooks Investment Bank)",
    title: "2 Copies The Intelligent Investor (Leather Gold Edition)",
    date: "2026-08-01",
    totalCost: 28000,
    quotedPrice: 44000,
    details: "Italian navy leather bound, 24k gold leaf edges, custom bookmark silk ribbon."
  },
  {
    id: "QUOTE-BK-002",
    toolType: "book",
    clientName: "Dr. Sophia Roberts (Roberts Academy)",
    title: "10 Copies Think and Grow Rich (Embossed Gold)",
    date: "2026-08-02",
    totalCost: 90000,
    quotedPrice: 145000,
    details: "Hardcover collector set for academic excellence award ceremony."
  },
  {
    id: "QUOTE-BK-003",
    toolType: "book",
    clientName: "Penelope Croft (Croft Luxury Goods)",
    title: "3 Leather Classics Collector Sets",
    date: "2026-08-03",
    totalCost: 50000,
    quotedPrice: 78000,
    details: "Emerald green leather with custom velvet presentation sleeves."
  },

  // Location Logistics (3)
  {
    id: "QUOTE-LOC-001",
    toolType: "location",
    clientName: "Christopher Reid (Rose Hall Estate, Montego Bay)",
    title: "Round-Trip Logistics Kingston <-> Montego Bay (181 km)",
    date: "2026-08-01",
    totalCost: 18500,
    quotedPrice: 29550,
    details: "Round-trip transport, North-South Highway toll fees included. VIP direct venue drop-off."
  },
  {
    id: "QUOTE-LOC-002",
    toolType: "location",
    clientName: "Michelle Campbell (Velvet Events, Ocho Rios)",
    title: "Round-Trip Event Styling Transport (110 km)",
    date: "2026-08-02",
    totalCost: 11500,
    quotedPrice: 18900,
    details: "Fragile acrylic signage and decor transport to Ocho Rios venue."
  },
  {
    id: "QUOTE-LOC-003",
    toolType: "location",
    clientName: "Raymond Sterling (Sterling Const, Spanish Town)",
    title: "Heavy Workwear Site Logistics (35 km)",
    date: "2026-08-03",
    totalCost: 4500,
    quotedPrice: 7625,
    details: "Direct delivery to highway construction site office in Spanish Town."
  },

  // DTF Printing Calculator (3)
  {
    id: "QUOTE-DTF-001",
    toolType: "dtf",
    clientName: "Elizabeth Vance (Vance Media)",
    title: "5 DTF Gang Sheets (12x17 in) Media Summit Graphics",
    date: "2026-08-01",
    totalCost: 55000,
    quotedPrice: 95000,
    details: "Ultra-vibrant high density white underbase DTF gang sheets."
  },
  {
    id: "QUOTE-DTF-002",
    toolType: "dtf",
    clientName: "Dr. Karen Rochester (CareMed)",
    title: "40 Custom DTF Chest & Sleeve Transfers for Scrubs",
    date: "2026-08-02",
    totalCost: 65000,
    quotedPrice: 110000,
    details: "Medical logo transfers with antimicrobial washing durability."
  },
  {
    id: "QUOTE-DTF-003",
    toolType: "dtf",
    clientName: "Alicia Grant (Grant & Associates Law)",
    title: "5 Magic Heart Cubes & Custom Foil Accent Transfers",
    date: "2026-08-03",
    totalCost: 52000,
    quotedPrice: 92500,
    details: "Custom photo cubes and gold foil metallic transfers for anniversary gifts."
  }
];

