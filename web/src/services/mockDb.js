// Mock Firebase Database for ParkEasy Chennai

export const INITIAL_LOCATIONS = [
  {
    id: "loc-1",
    ownerId: "owner-456",
    name: "T. Nagar Smart Parking Plaza",
    address: "Pondy Bazaar, T. Nagar, Chennai - 600017",
    latitude: 13.0405,
    longitude: 80.2337,
    description: "Multilevel automated smart parking in the heart of Pondy Bazaar. Covered slots, EV charging stations, and CCTV monitored.",
    rates: { hourly: 40, daily: 300 },
    totalSlots: { twoWheeler: 60, fourWheeler: 40 },
    availableSlots: { twoWheeler: 12, fourWheeler: 8 },
    images: [
      "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=400"
    ],
    isApproved: true,
    cctvEnabled: true,
    rating: 4.8,
    reviewCount: 34
  },
  {
    id: "loc-2",
    ownerId: "owner-456",
    name: "Adyar Metro Parking Hub",
    address: "Kasturba Nagar, Adyar, Chennai - 600020",
    latitude: 13.0063,
    longitude: 80.2525,
    description: "Secure open and covered parking near Adyar Metro/Bus depot. Ideal for daily commuters.",
    rates: { hourly: 30, daily: 200 },
    totalSlots: { twoWheeler: 80, fourWheeler: 30 },
    availableSlots: { twoWheeler: 45, fourWheeler: 15 },
    images: [
      "https://images.unsplash.com/photo-1506521788723-85811181d4db?auto=format&fit=crop&q=80&w=400"
    ],
    isApproved: true,
    cctvEnabled: true,
    rating: 4.2,
    reviewCount: 19
  },
  {
    id: "loc-3",
    ownerId: "owner-999",
    name: "Velachery Junction Safe Space",
    address: "Bypass Road, Velachery, Chennai - 600042",
    latitude: 12.9796,
    longitude: 80.2196,
    description: "Spacious private parking plot with CCTV security. Walking distance from Phoenix Marketcity Mall.",
    rates: { hourly: 50, daily: 350 },
    totalSlots: { twoWheeler: 40, fourWheeler: 40 },
    availableSlots: { twoWheeler: 0, fourWheeler: 2 }, // High occupancy
    images: [
      "https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?auto=format&fit=crop&q=80&w=400"
    ],
    isApproved: true,
    cctvEnabled: true,
    rating: 4.5,
    reviewCount: 27
  },
  {
    id: "loc-4",
    ownerId: "owner-101",
    name: "Marina Beach Parking Bay",
    address: "Kamarajar Salai, Marina Beach Road, Triplicane, Chennai - 600005",
    latitude: 13.0500,
    longitude: 80.2824,
    description: "Wide beachside parking lot managed by local owners. Easily accessible and secure.",
    rates: { hourly: 20, daily: 150 },
    totalSlots: { twoWheeler: 150, fourWheeler: 80 },
    availableSlots: { twoWheeler: 90, fourWheeler: 38 },
    images: [
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=400"
    ],
    isApproved: true,
    cctvEnabled: false,
    rating: 3.9,
    reviewCount: 42
  },
  {
    id: "loc-5",
    ownerId: "owner-456",
    name: "Nungambakkam High Road Parking",
    address: "Khader Nawaz Khan Rd, Nungambakkam, Chennai - 600006",
    latitude: 13.0612,
    longitude: 80.2496,
    description: "Premium shopping-district parking space. Features automated QR scanners and high security.",
    rates: { hourly: 60, daily: 450 },
    totalSlots: { twoWheeler: 30, fourWheeler: 20 },
    availableSlots: { twoWheeler: 15, fourWheeler: 10 },
    images: [
      "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=400"
    ],
    isApproved: false, // Needs admin approval
    cctvEnabled: true,
    rating: 0,
    reviewCount: 0
  }
];

export const INITIAL_BOOKINGS = [
  {
    id: "book-101",
    userId: "customer-789",
    locationId: "loc-1",
    vehicleNumber: "TN-01-AB-1234",
    vehicleType: "four-wheeler",
    startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hr ago
    endTime: new Date(Date.now() + 7200000).toISOString(),  // 2 hrs from now
    status: "active",
    totalAmount: 120,
    paymentId: "pay_UPI9817265",
    qrCodeData: "QR_PE_book-101_TN01AB1234",
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "book-102",
    userId: "customer-789",
    locationId: "loc-2",
    vehicleNumber: "TN-07-CD-5678",
    vehicleType: "two-wheeler",
    startTime: new Date(Date.now() - 7200000).toISOString(),
    endTime: new Date(Date.now() - 3600000).toISOString(),
    status: "completed",
    totalAmount: 30,
    paymentId: "pay_UPI0918237",
    qrCodeData: "QR_PE_book-102_TN07CD5678",
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

export const INITIAL_REVIEWS = [
  {
    id: "rev-1",
    userId: "customer-789",
    userName: "Karthik Raja",
    locationId: "loc-1",
    rating: 5,
    comment: "Excellent covered parking. Scanned QR code at entrance and the barrier opened immediately! EV charging was a nice bonus.",
    timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    id: "rev-2",
    userId: "customer-222",
    userName: "Meena Sundaram",
    locationId: "loc-1",
    rating: 4,
    comment: "Very easy to book and find using the maps direction. Rates are reasonable for Pondy Bazaar area.",
    timestamp: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  },
  {
    id: "rev-3",
    userId: "customer-333",
    userName: "Anand Selvam",
    locationId: "loc-2",
    rating: 4,
    comment: "Convenient spot near the metro station. Quick booking and checkout.",
    timestamp: new Date(Date.now() - 259200000).toISOString()
  }
];

export const INITIAL_COMPLAINTS = [
  {
    id: "comp-1",
    userId: "customer-789",
    userName: "Karthik Raja",
    subject: "QR code scanner did not scan on exit",
    description: "The QR code was showing invalid on exit, and I had to call the operator to raise the barrier. Please check.",
    status: "pending",
    createdAt: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
  },
  {
    id: "comp-2",
    userId: "customer-101",
    userName: "Arun Moorthi",
    subject: "Charged twice for the same booking",
    description: "My UPI payment debited twice. Refer to Transaction IDs txn_9831 and txn_9832. Requesting refund.",
    status: "resolved",
    createdAt: new Date(Date.now() - 172800000).toISOString()
  }
];

export const INITIAL_COUPONS = [
  { code: "PARKEASY10", discountPercent: 10, maxDiscount: 50, active: true },
  { code: "CHENNAI50", discountPercent: 50, maxDiscount: 100, active: true },
  { code: "FREEPARK", discountPercent: 100, maxDiscount: 150, active: true }
];
