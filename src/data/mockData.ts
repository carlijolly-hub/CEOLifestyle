import { Client, LuxeBookInventoryItem } from "../types";

export const INITIAL_CLIENTS: Client[] = [
  {
    id: "10001",
    firstName: "Daniel",
    lastName: "Williams",
    gender: "Male",
    occupation: "Business Owner",
    drive: "Yes",
    tier: "Gold",
    homeBrand: "CEO Lifestyle",
    contact: {
      phoneNumber: "+1 (876) 555-0182",
      email: "daniel.williams@email.com",
      city: "Montego Bay",
      parish: "St. James",
      country: "Jamaica",
      deliveryAddress: "Ironshore, Montego Bay",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Patricia Williams",
      fatherName: "Robert Williams",
      wifeName: "Amanda Williams",
      husbandName: "N/A",
      children: [
        { name: "Joshua Williams", birthday: "May 6" },
        { name: "Mia Williams", birthday: "November 19" }
      ],
      pets: "Bruno (Dog)",
      personalNotes: "Prefers premium packaging and early notifications for new collections."
    },
    importantDates: [
      { label: "Birthday", date: "March 14" },
      { label: "Anniversary", date: "August 22" },
      { label: "Wedding Date", date: "August 22, 2018" },
      { label: "Proposal Date", date: "December 10, 2017" },
      { label: "Joshua Birthday", date: "May 6" },
      { label: "Mia Birthday", date: "November 19" },
      { label: "Business Anniversary", date: "January 15" }
    ],
    history: {
      firstOrderDate: "2024-02-12",
      lastOrderDate: "2026-06-28",
      totalOrders: 8,
      productsPurchased: [
        "Custom T-Shirts",
        "Business Branding",
        "Luxury Gift Boxes",
        "Mindset Books"
      ],
      preferredCategories: ["Premium Apparel", "Personalized Gifts"],
      clientPreferences: ["Black and gold designs", "Luxury presentation"],
      lifetimeRevenue: 385000,
      averageOrderValue: 48125
    },
    interests: {
      sports: {
        sport: "Football",
        favoriteTeam: "Manchester United",
        teamOne: "Manchester United",
        teamTwo: "Chelsea FC",
        favoritePlayer: "Cristiano Ronaldo",
        nationalTeam: "Jamaica National Football Team"
      },
      hobbies: ["Business", "Football", "Travel"],
      favoriteColors: ["Black", "Gold", "White"],
      giftPreferences: ["Luxury personalized gifts"]
    },
    timeline: [
      { id: "e1", type: "Order", date: "2026-06-28", content: "Placed order for Corporate Luxury Gift Box bundle (CEO Printing)", amount: 55000 },
      { id: "e2", type: "Conversation", date: "2026-06-15", content: "Called Daniel to confirm delivery of Mindset book set. He loved the handwritten gift note." },
      { id: "e3", type: "Gift", date: "2026-05-06", content: "Sent complimentary customized birthday shirt to Joshua Williams" },
      { id: "e4", type: "Order", date: "2026-03-14", content: "Purchased customized apparel and Librarium book set", amount: 45000 },
      { id: "e5", type: "Note", date: "2026-01-15", content: "Congratulated on Business Anniversary. Added note: client prefers text over email." }
    ],
    reminders: [
      { id: "r1", date: "2026-08-15", task: "Prepare custom gift box recommendation for Daniel's wedding anniversary (August 22)", completed: false },
      { id: "r2", date: "2026-11-10", task: "Send birthday card and small gift voucher for Mia (Nov 19)", completed: false }
    ],
    preferredCommunication: "WhatsApp",
    lastContactedDate: "2026-06-15"
  },
  {
    id: "10002",
    firstName: "Sarah",
    lastName: "Thompson",
    gender: "Female",
    occupation: "Marketing Manager",
    drive: "Yes",
    tier: "Platinum",
    homeBrand: "CEO Printing Services",
    contact: {
      phoneNumber: "+1 (416) 555-0245",
      email: "sarah.thompson@email.com",
      city: "Toronto",
      parish: "N/A",
      country: "Canada",
      deliveryAddress: "Kingston, Jamaica (Recipient Delivery)",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Linda Thompson",
      fatherName: "Michael Thompson",
      wifeName: "N/A",
      husbandName: "David Thompson",
      children: [
        { name: "Emily Thompson", birthday: "January 22" }
      ],
      pets: "Coco (Cat)",
      personalNotes: "Lives abroad and frequently purchases gifts for family in Jamaica."
    },
    importantDates: [
      { label: "Birthday", date: "July 8" },
      { label: "Anniversary", date: "October 15" },
      { label: "Wedding Date", date: "October 15, 2020" },
      { label: "Proposal Date", date: "February 14, 2019" },
      { label: "Emily Birthday", date: "January 22" },
      { label: "Mother's Birthday", date: "September 3" }
    ],
    history: {
      firstOrderDate: "2025-03-05",
      lastOrderDate: "2026-05-30",
      totalOrders: 12,
      productsPurchased: [
        "Corporate Shirts",
        "Employee Gifts",
        "Anniversary Gifts"
      ],
      preferredCategories: ["Corporate Branding", "Premium Gifts"],
      clientPreferences: ["Professional designs", "Fast communication"],
      lifetimeRevenue: 620000,
      averageOrderValue: 51667
    },
    interests: {
      sports: {
        sport: "Basketball",
        favoriteTeam: "Toronto Raptors",
        teamOne: "Toronto Raptors",
        teamTwo: "Golden State Warriors",
        favoritePlayer: "Scottie Barnes",
        nationalTeam: "Jamaica Reggae Boyz"
      },
      hobbies: ["Marketing", "Fitness", "Travel"],
      favoriteColors: ["Blue", "White"],
      giftPreferences: ["Elegant romantic gifts"]
    },
    timeline: [
      { id: "e1_2", type: "Order", date: "2026-05-30", content: "Ordered customized corporate shirts for Jamaica-based team marketing campaign", amount: 120000 },
      { id: "e2_2", type: "Conversation", date: "2026-05-10", content: "Email thread discussing team custom apparel designs. Approved blue & white layout." },
      { id: "e3_2", type: "Order", date: "2026-01-20", content: "Sent custom luxury gift basket to Emily in Kingston, Jamaica for her birthday", amount: 45000 }
    ],
    reminders: [
      { id: "r1_2", date: "2026-07-07", task: "Send birthday congratulations to Sarah today!", completed: false },
      { id: "r2_2", date: "2026-08-25", task: "Reach out to prepare a gift for her mother's birthday (Sept 3)", completed: false }
    ],
    preferredCommunication: "Email",
    lastContactedDate: "2026-05-10"
  },
  {
    id: "10003",
    firstName: "Michael",
    lastName: "Brown",
    gender: "Male",
    occupation: "Accountant",
    drive: "Yes",
    tier: "Silver",
    homeBrand: "Librarium Luxe",
    contact: {
      phoneNumber: "+1 (305) 555-0119",
      email: "michael.brown@email.com",
      city: "Miami",
      parish: "N/A",
      country: "United States",
      deliveryAddress: "Kingston, Jamaica",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Denise Brown",
      fatherName: "Carl Brown",
      wifeName: "Rebecca Brown",
      husbandName: "N/A",
      children: [
        { name: "Liam Brown", birthday: "September 12" }
      ],
      pets: "Max (Dog)",
      personalNotes: "Interested in personal development books and gift bundles."
    },
    importantDates: [
      { label: "Birthday", date: "January 26" },
      { label: "Anniversary", date: "June 18" },
      { label: "Wedding Date", date: "June 18, 2021" },
      { label: "Proposal Date", date: "November 5, 2020" },
      { label: "Liam Birthday", date: "September 12" }
    ],
    history: {
      firstOrderDate: "2025-04-20",
      lastOrderDate: "2026-06-15",
      totalOrders: 3,
      productsPurchased: [
        "Atomic Habits",
        "Psychology of Money",
        "Gift Sets"
      ],
      preferredCategories: ["Mindset Books"],
      clientPreferences: ["Finance and business books"],
      lifetimeRevenue: 45000,
      averageOrderValue: 15000
    },
    interests: {
      sports: {
        sport: "Basketball",
        favoriteTeam: "Miami Heat",
        teamOne: "Miami Heat",
        teamTwo: "Los Angeles Lakers",
        favoritePlayer: "Jimmy Butler",
        nationalTeam: "Brazil National Football Team"
      },
      hobbies: ["Reading", "Investing"],
      favoriteColors: ["Navy", "Black"],
      giftPreferences: ["Book bundles"]
    },
    timeline: [
      { id: "e1_3", type: "Order", date: "2026-06-15", content: "Purchased 'Psychology of Money' and curated coffee gift bundle.", amount: 18000 },
      { id: "e2_3", type: "Conversation", date: "2026-06-01", content: "Inquired on Instagram about upcoming finance and investment book releases." }
    ],
    reminders: [
      { id: "r1_3", date: "2026-09-01", task: "Suggest a birthday special gift for Liam's birthday on Sept 12", completed: false }
    ],
    preferredCommunication: "Email",
    lastContactedDate: "2026-06-15"
  },
  {
    id: "10004",
    firstName: "Alicia",
    lastName: "Grant",
    gender: "Female",
    occupation: "Entrepreneur",
    drive: "Yes",
    tier: "Gold",
    homeBrand: "CEO Lifestyle",
    contact: {
      phoneNumber: "+1 (876) 555-0321",
      email: "alicia.grant@email.com",
      city: "Kingston",
      parish: "St. Andrew",
      country: "Jamaica",
      deliveryAddress: "Constant Spring, Kingston",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Sharon Grant",
      fatherName: "Anthony Grant",
      wifeName: "N/A",
      husbandName: "Kevin Grant",
      children: [
        { name: "Ava Grant", birthday: "December 3" }
      ],
      pets: "Bella (Dog)",
      personalNotes: "High-value client who enjoys limited edition products."
    },
    importantDates: [
      { label: "Birthday", date: "February 11" },
      { label: "Anniversary", date: "September 9" },
      { label: "Wedding Date", date: "September 9, 2019" },
      { label: "Proposal Date", date: "March 17, 2019" },
      { label: "Ava Birthday", date: "December 3" }
    ],
    history: {
      firstOrderDate: "2024-01-10",
      lastOrderDate: "2026-06-30",
      totalOrders: 15,
      productsPurchased: [
        "Luxury Gifts",
        "Custom Apparel",
        "Books"
      ],
      preferredCategories: ["Premium Collections"],
      clientPreferences: ["Exclusive launches"],
      lifetimeRevenue: 750000,
      averageOrderValue: 50000
    },
    interests: {
      sports: {
        sport: "Football",
        favoriteTeam: "Arsenal",
        teamOne: "Arsenal",
        teamTwo: "Real Madrid",
        favoritePlayer: "Bukayo Saka",
        nationalTeam: "Jamaica Reggae Girlz"
      },
      hobbies: ["Fashion", "Business", "Interior Design"],
      favoriteColors: ["Pink", "Gold"],
      giftPreferences: ["Luxury feminine gifts"]
    },
    timeline: [
      { id: "e1_4", type: "Order", date: "2026-06-30", content: "Preordered limited-edition Rose Gold leather journal and gift pen pack", amount: 80000 },
      { id: "e2_4", type: "Conversation", date: "2026-05-18", content: "Met Alicia in-person at Librarium popup. Discussed her corporate branding ideas for end of year." },
      { id: "e3_4", type: "Note", date: "2026-04-12", content: "Enrolled in early access SMS notifications list." }
    ],
    reminders: [
      { id: "r1_4", date: "2026-09-01", task: "Send custom proposal for wedding anniversary on Sept 9", completed: false }
    ],
    preferredCommunication: "Phone",
    lastContactedDate: "2026-05-18"
  },
  {
    id: "10005",
    firstName: "Kevin",
    lastName: "Clarke",
    gender: "Male",
    occupation: "Software Developer",
    drive: "Yes",
    tier: "Silver",
    homeBrand: "CEO Printing Services",
    contact: {
      phoneNumber: "+44 7700 900123",
      email: "kevin.clarke@email.com",
      city: "London",
      parish: "N/A",
      country: "United Kingdom",
      deliveryAddress: "Montego Bay, Jamaica",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Cynthia Clarke",
      fatherName: "Peter Clarke",
      wifeName: "Rachel Clarke",
      husbandName: "N/A",
      children: [
        { name: "Noah Clarke", birthday: "February 16" }
      ],
      pets: "None",
      personalNotes: "Overseas client ordering birthday and family gifts."
    },
    importantDates: [
      { label: "Birthday", date: "October 7" },
      { label: "Anniversary", date: "April 21" },
      { label: "Wedding Date", date: "April 21, 2022" },
      { label: "Proposal Date", date: "July 14, 2021" },
      { label: "Noah Birthday", date: "February 16" }
    ],
    history: {
      firstOrderDate: "2025-08-15",
      lastOrderDate: "2026-05-12",
      totalOrders: 5,
      productsPurchased: [
        "Custom Shirts",
        "Family Gifts"
      ],
      preferredCategories: ["Apparel"],
      clientPreferences: ["Simple premium designs"],
      lifetimeRevenue: 180000,
      averageOrderValue: 36000
    },
    interests: {
      sports: {
        sport: "Football",
        favoriteTeam: "Chelsea FC",
        teamOne: "Chelsea FC",
        teamTwo: "Barcelona",
        favoritePlayer: "Cole Palmer",
        nationalTeam: "England National Team"
      },
      hobbies: ["Technology", "Gaming"],
      favoriteColors: ["Black", "Blue"],
      giftPreferences: ["Practical personalized gifts"]
    },
    timeline: [
      { id: "e1_5", type: "Order", date: "2026-05-12", content: "Ordered family reunion matching custom t-shirts delivered to Montego Bay villa", amount: 45000 },
      { id: "e2_5", type: "Conversation", date: "2026-02-14", content: "WhatsApp discussion finalizing dimensions for child custom graphics." }
    ],
    reminders: [
      { id: "r1_5", date: "2026-10-01", task: "Email birthday promotion ahead of his birthday on Oct 7", completed: false }
    ],
    preferredCommunication: "WhatsApp",
    lastContactedDate: "2026-02-14"
  },
  {
    id: "10006",
    firstName: "Rachel",
    lastName: "Morgan",
    gender: "Female",
    occupation: "Teacher",
    drive: "Yes",
    tier: "Gold",
    homeBrand: "CEO Lifestyle",
    contact: {
      phoneNumber: "+1 (876) 555-0468",
      email: "rachel.morgan@email.com",
      city: "Ocho Rios",
      parish: "St. Ann",
      country: "Jamaica",
      deliveryAddress: "Discovery Bay, St. Ann",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Marcia Morgan",
      fatherName: "Winston Morgan",
      wifeName: "N/A",
      husbandName: "Daniel Morgan",
      children: [
        { name: "Elijah Morgan", birthday: "March 8" },
        { name: "Chloe Morgan", birthday: "October 21" }
      ],
      pets: "Milo (Cat)",
      personalNotes: "Enjoys curated book collections and personalized gifts for family occasions. Responds well to early access promotions and seasonal collections."
    },
    importantDates: [
      { label: "Birthday", date: "May 25" },
      { label: "Anniversary", date: "December 12" },
      { label: "Wedding Date", date: "December 12, 2016" },
      { label: "Proposal Date", date: "June 30, 2016" },
      { label: "Elijah Birthday", date: "March 8" },
      { label: "Chloe Birthday", date: "October 21" },
      { label: "Mother's Birthday", date: "February 2" }
    ],
    history: {
      firstOrderDate: "2024-02-18",
      lastOrderDate: "2026-06-20",
      totalOrders: 10,
      productsPurchased: [
        "Romance Books",
        "Mindset Books",
        "Luxury Gift Boxes",
        "Personalized Mugs",
        "Custom Shirts"
      ],
      preferredCategories: ["Romance Collection", "Gift Sets", "Self Development Books"],
      clientPreferences: ["Feminine packaging", "Personalized recommendations", "Premium presentation"],
      lifetimeRevenue: 420000,
      averageOrderValue: 42000
    },
    interests: {
      sports: {
        sport: "Football",
        favoriteTeam: "Liverpool FC",
        teamOne: "Liverpool FC",
        teamTwo: "Aston Villa",
        favoritePlayer: "Mohamed Salah",
        nationalTeam: "Jamaica Reggae Girlz"
      },
      hobbies: ["Reading", "Teaching", "Travel"],
      favoriteColors: ["Purple", "Gold", "White"],
      giftPreferences: ["Romantic gifts", "Personalized keepsakes", "Book bundles"]
    },
    timeline: [
      { id: "e1_6", type: "Order", date: "2026-06-20", content: "Purchased 'Lover's Escape' book collection and premium bath set combo", amount: 35000 },
      { id: "e2_6", type: "Conversation", date: "2026-05-20", content: "Sent customized email containing early catalogs for Summer romance novels. Handled positive feedback." },
      { id: "e3_6", type: "Gift", date: "2026-05-25", content: "Sent complementary anniversary mug on her birthday" }
    ],
    reminders: [
      { id: "r1_6", date: "2026-10-15", task: "Follow up with premium gift ideas for daughter Chloe's birthday (Oct 21)", completed: false },
      { id: "r2_6", date: "2026-12-01", task: "Suggest romantic customizable gifts for their 10th wedding anniversary on Dec 12", completed: false }
    ],
    preferredCommunication: "WhatsApp",
    lastContactedDate: "2026-05-20"
  },
  {
    id: "10007",
    firstName: "Christopher",
    lastName: "Reid",
    gender: "Male",
    occupation: "Business Executive",
    drive: "Yes",
    tier: "Platinum",
    homeBrand: "CEO Printing Services",
    contact: {
      phoneNumber: "+1 (786) 555-0935",
      email: "christopher.reid@email.com",
      city: "Miami",
      parish: "N/A",
      country: "United States",
      deliveryAddress: "Kingston, Jamaica",
      deliveryCountry: "Jamaica"
    },
    profile: {
      motherName: "Angela Reid",
      fatherName: "Carlton Reid",
      wifeName: "Vanessa Reid",
      husbandName: "N/A",
      children: [
        { name: "Carter Reid", birthday: "April 14" },
        { name: "Madison Reid", birthday: "August 29" }
      ],
      pets: "Rocky (Dog)",
      personalNotes: "Overseas corporate client. Uses CEO Printing Services for employee appreciation gifts, company apparel, and Jamaica-based events. Requires professional invoices and scheduled delivery."
    },
    importantDates: [
      { label: "Birthday", date: "November 16" },
      { label: "Anniversary", date: "July 4" },
      { label: "Wedding Date", date: "July 4, 2015" },
      { label: "Proposal Date", date: "January 1, 2015" },
      { label: "Carter Birthday", date: "April 14" },
      { label: "Madison Birthday", date: "August 29" },
      { label: "Company Anniversary", date: "March 10" }
    ],
    history: {
      firstOrderDate: "2023-06-06",
      lastOrderDate: "2026-06-25",
      totalOrders: 20,
      productsPurchased: [
        "Corporate T-Shirts",
        "Staff Uniforms",
        "Event Branding",
        "Promotional Items",
        "Custom Jerseys"
      ],
      preferredCategories: ["Corporate Branding", "Bulk Orders", "Event Merchandise"],
      clientPreferences: ["Fast turnaround", "Professional communication", "Consistent branding"],
      lifetimeRevenue: 1250000,
      averageOrderValue: 62500
    },
    interests: {
      sports: {
        sport: "Basketball",
        favoriteTeam: "Miami Heat",
        teamOne: "Miami Heat",
        teamTwo: "Boston Celtics",
        favoritePlayer: "LeBron James",
        nationalTeam: "Jamaica Reggae Boyz"
      },
      hobbies: ["Business Networking", "Golf", "Travel"],
      favoriteColors: ["Black", "Navy", "Silver"],
      giftPreferences: ["Premium corporate gifts", "Executive gift boxes", "Personalized luxury items"]
    },
    timeline: [
      { id: "e1_7", type: "Order", date: "2026-06-25", content: "Placed massive corporate order for Event Jerseys and Custom Banners", amount: 350000 },
      { id: "e2_7", type: "Conversation", date: "2026-06-10", content: "Conference call detailing branding specifications and delivery timelines to Kingston venue." },
      { id: "e3_7", type: "Order", date: "2026-03-05", content: "Company Anniversary corporate custom employee appreciation packages", amount: 150000 }
    ],
    reminders: [
      { id: "r1_7", date: "2026-08-20", task: "Design custom birthday collection box for daughter Madison Reid (Aug 29)", completed: false }
    ],
    preferredCommunication: "Email",
    lastContactedDate: "2026-06-10"
  }
];

export const INITIAL_INVENTORY: LuxeBookInventoryItem[] = [
  {
    id: "LUX-101",
    title: "Shakespeare First Folio (Luxe Blue Leather)",
    category: "Fine Art",
    quantity: 8,
    dateAdded: "2026-05-15",
    salesHistory: [
      { id: "sh-1", clientName: "Daniel Williams", date: "2026-06-12", quantitySold: 1 }
    ],
    rankingStatus: "Healthy",
    bookRank: "Best Seller",
    archived: false,
    inStore: 2,
    office: 6,
    sellingPrice: 5000
  },
  {
    id: "LUX-102",
    title: "The Wealth of Nations (Signature Gold Edition)",
    category: "Business & Philosophy",
    quantity: 12,
    dateAdded: "2026-04-10",
    salesHistory: [],
    rankingStatus: "Stacked",
    bookRank: "Top Seller",
    archived: false,
    inStore: 4,
    office: 8,
    sellingPrice: 4500
  },
  {
    id: "LUX-103",
    title: "The Odyssey of Homer (Handcrafted Codex)",
    category: "History & Classics",
    quantity: 5,
    dateAdded: "2026-06-01",
    salesHistory: [],
    rankingStatus: "Test Again",
    bookRank: "New Release",
    archived: false,
    inStore: 1,
    office: 4,
    sellingPrice: 3800
  },
  {
    id: "LUX-104",
    title: "Principia Mathematica (Platinum Hardcover)",
    category: "Science",
    quantity: 7,
    dateAdded: "2026-03-20",
    salesHistory: [],
    rankingStatus: "Urgent Restock",
    bookRank: "Slow Moving",
    archived: false,
    inStore: 4,
    office: 4, // This creates a discrepancy: 4 + 4 = 8 !== 7! Perfect for showcasing the warning feature.
    sellingPrice: 6000
  }
];

