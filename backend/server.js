import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import Razorpay from 'razorpay';

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_fakeKeyId1234',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'fakeSecretKey1234567890'
});

const app = express();
const PORT = process.env.PORT || 5000;

const FIREBASE_DB_URL = 'https://parkhub-2343e-default-rtdb.firebaseio.com';

async function saveAllData() {
  try {
    await Promise.all([
      fetch(`${FIREBASE_DB_URL}/locations.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(locations) }),
      fetch(`${FIREBASE_DB_URL}/bookings.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bookings) }),
      fetch(`${FIREBASE_DB_URL}/reviews.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reviews) }),
      fetch(`${FIREBASE_DB_URL}/complaints.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(complaints) }),
      fetch(`${FIREBASE_DB_URL}/owners.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(owners) }),
      fetch(`${FIREBASE_DB_URL}/coupons.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(coupons) }),
      fetch(`${FIREBASE_DB_URL}/settings.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }),
      fetch(`${FIREBASE_DB_URL}/auditLogs.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(auditLogs) }),
      fetch(`${FIREBASE_DB_URL}/broadcastLogs.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(broadcastLogs) }),
      fetch(`${FIREBASE_DB_URL}/customers.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(customers) }),
      fetch(`${FIREBASE_DB_URL}/evStations.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(evStations) }),
      fetch(`${FIREBASE_DB_URL}/evReservations.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(evReservations) }),
      fetch(`${FIREBASE_DB_URL}/walletTransactions.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(walletTransactions) }),
      fetch(`${FIREBASE_DB_URL}/settlements.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settlements) })
    ]);
  } catch (err) {
    console.error("Error saving data to Firebase:", err);
  }
}

async function loadAllData() {
  try {
    const [locRes, bookRes, revRes, compRes, ownRes, coupRes, setRes, auditRes, broadRes, custRes, evLocRes, evBookRes, walletTxRes, settlementRes] = await Promise.all([
      fetch(`${FIREBASE_DB_URL}/locations.json`).then(r => r.json()),
      fetch(`${FIREBASE_DB_URL}/bookings.json`).then(r => r.json()),
      fetch(`${FIREBASE_DB_URL}/reviews.json`).then(r => r.json()),
      fetch(`${FIREBASE_DB_URL}/complaints.json`).then(r => r.json()),
      fetch(`${FIREBASE_DB_URL}/owners.json`).then(r => r.json()),
      fetch(`${FIREBASE_DB_URL}/coupons.json`).then(r => r.json()),
      fetch(`${FIREBASE_DB_URL}/settings.json`).then(r => r.json()),
      fetch(`${FIREBASE_DB_URL}/auditLogs.json`).then(r => r.json()),
      fetch(`${FIREBASE_DB_URL}/broadcastLogs.json`).then(r => r.json()),
      fetch(`${FIREBASE_DB_URL}/customers.json`).then(r => r.json()),
      fetch(`${FIREBASE_DB_URL}/evStations.json`).then(r => r.json()),
      fetch(`${FIREBASE_DB_URL}/evReservations.json`).then(r => r.json()),
      fetch(`${FIREBASE_DB_URL}/walletTransactions.json`).then(r => r.json()),
      fetch(`${FIREBASE_DB_URL}/settlements.json`).then(r => r.json())
    ]);
    if (locRes) locations = locRes;
    if (bookRes) bookings = bookRes;
    if (revRes) reviews = revRes;
    if (compRes) complaints = compRes;
    if (ownRes) owners = ownRes;
    if (coupRes) coupons = coupRes;
    if (setRes) settings = setRes;
    if (auditRes) auditLogs = auditRes;
    if (broadRes) broadcastLogs = broadRes;
    if (custRes) customers = custRes;
    if (evLocRes) evStations = evLocRes;
    if (evBookRes) evReservations = evBookRes;
    if (walletTxRes) walletTransactions = walletTxRes;
    if (settlementRes) settlements = settlementRes;

    if (!locRes && !bookRes) {
      console.log("No data found in Firebase. Seeding default data...");
      await saveAllData();
    } else {
      console.log("Successfully loaded database state from Firebase Realtime Database.");
    }
  } catch (err) {
    console.error("Error loading data from Firebase:", err);
  }
}

// Load data immediately on startup with a brief delay for variable initialization
setTimeout(loadAllData, 1000);

app.use(cors());
app.use(express.json());

// Auto-save mutations to Firebase Database
app.use((req, res, next) => {
  res.on('finish', () => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      saveAllData();
    }
  });
  next();
});

// In-memory data seeded from initial mock db schemas
let locations = [
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
    images: [
      "https://images.unsplash.com/photo-1506521788723-85811181d4db?auto=format&fit=crop&q=80&w=400"
    ],
    isApproved: true,
    cctvEnabled: true,
    rating: 4.2,
    reviewCount: 19
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
    images: [
      "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=400"
    ],
    isApproved: true,
    cctvEnabled: true,
    rating: 0,
    reviewCount: 0
  }
];

let bookings = [
  {
    id: "book-101",
    userId: "customer-789",
    locationId: "loc-1",
    vehicleNumber: "TN-01-AB-1234",
    vehicleType: "four-wheeler",
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date(Date.now() + 7200000).toISOString(),
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

let reviews = [
  {
    id: "rev-1",
    userId: "customer-789",
    userName: "Karthik Raja",
    locationId: "loc-1",
    rating: 5,
    comment: "Excellent covered parking. Scanned QR code at entrance and the barrier opened immediately! EV charging was a nice bonus.",
    timestamp: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "rev-2",
    userId: "customer-222",
    userName: "Meena Sundaram",
    locationId: "loc-1",
    rating: 4,
    comment: "Very easy to book and find using the maps direction. Rates are reasonable for Pondy Bazaar area.",
    timestamp: new Date(Date.now() - 172800000).toISOString()
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

let complaints = [
  {
    id: "comp-1",
    userId: "customer-789",
    userName: "Karthik Raja",
    subject: "QR code scanner did not scan on exit",
    description: "The QR code was showing invalid on exit, and I had to call the operator to raise the barrier. Please check.",
    status: "pending",
    createdAt: new Date(Date.now() - 43200000).toISOString()
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

let walletTransactions = [
  {
    id: "tx-1",
    ownerId: "owner-456",
    bookingId: "book-1",
    amount: 180,
    commission: 20,
    netAmount: 160,
    type: "credit",
    status: "success",
    timestamp: new Date(Date.now() - 86400000).toISOString()
  }
];

let settlements = [
  {
    id: "set-1",
    ownerId: "owner-456",
    amount: 15600,
    status: "completed",
    bankAccount: "HDFC ****9812",
    createdAt: new Date(Date.now() - 172800000).toISOString()
  }
];

let owners = [
  {
    uid: 'owner-456',
    name: 'Suresh Perumal',
    email: 'suresh@spotowner.com',
    phone: '+91 94440 12345',
    role: 'owner',
    verified: true,
    status: 'active',
    locationsCount: 3,
    earnings: 12450,
    onlineEarnings: 12450,
    cashEarnings: 3500,
    pendingCommission: 350,
    walletBalance: 15600,
    companyName: 'SpotPark Chennai Operations Ltd',
    gstin: '33AABCP8921J1Z0',
    companyAddress: '45, Cathedral Road, Chennai, Tamil Nadu, 600086',
    profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    payoutMethod: 'bank',
    bankDetails: {
      holderName: 'Suresh Perumal',
      bankName: 'State Bank of India',
      accountNumber: '330099441122',
      ifscCode: 'SBIN0001234',
      branchName: 'Cathedral Road, Chennai'
    },
    upiDetails: {
      upiId: 'suresh@okaxis',
      verifiedUpi: true
    },
    kycDocuments: {
      cancelledCheque: '',
      passbook: '',
      panCard: ''
    },
    kycStatus: 'verified',
    kycDate: '2026-06-15T12:00:00Z',
    kycRemarks: 'All initial bank documents verified successfully.',
    settlementHistory: [
      { id: 'set-101', date: '2026-06-08', amount: 4800, method: 'Bank Transfer (•••• 1122)', status: 'completed' },
      { id: 'set-102', date: '2026-06-15', amount: 5200, method: 'Bank Transfer (•••• 1122)', status: 'completed' }
    ],
    notifications: [
      { id: 'notif-1', text: 'Welcome to SpotPark Host Console!', date: '2026-06-01T10:00:00Z', read: true }
    ]
  },
  {
    uid: 'owner-101',
    name: 'Arun Moorthi',
    email: 'arun@marinaowner.in',
    phone: '+91 98400 55555',
    role: 'owner',
    verified: true,
    status: 'active',
    locationsCount: 1,
    earnings: 4500,
    onlineEarnings: 4500,
    cashEarnings: 0,
    pendingCommission: 0,
    walletBalance: 4500,
    companyName: 'Marina Beach Parking Ventures',
    gstin: '33AAACM4421L1Z2',
    companyAddress: '12, Marina Beach Road, Chennai, Tamil Nadu, 600005',
    profilePic: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    payoutMethod: 'upi',
    bankDetails: {
      holderName: 'Arun Moorthi',
      bankName: 'HDFC Bank',
      accountNumber: '5010022334455',
      ifscCode: 'HDFC0000123',
      branchName: 'Mylapore, Chennai'
    },
    upiDetails: {
      upiId: 'arun@okhdfcbank',
      verifiedUpi: true
    },
    kycDocuments: {
      cancelledCheque: '',
      passbook: '',
      panCard: ''
    },
    kycStatus: 'pending',
    kycDate: '',
    kycRemarks: 'Awaiting cheque and passbook uploads.',
    settlementHistory: [],
    notifications: []
  }
];

let coupons = [
  { code: "PARKEASY10", discountPercent: 10, maxDiscount: 50, active: true },
  { code: "CHENNAI50", discountPercent: 50, maxDiscount: 100, active: true },
  { code: "FREEPARK", discountPercent: 100, maxDiscount: 150, active: true }
];

let settings = {
  commissionPercentage: 10,
  bookingGracePeriod: 15,
  global30MinRate: 20,
  globalHourlyRate: 50,
  globalDailyRate: 300
};

let auditLogs = [];
let broadcastLogs = [];
let customers = [];

let evStations = [
  {
    id: "ev-1",
    ownerId: "owner-456",
    name: "Adyar EV Hypercharger Hub",
    address: "Gandhi Nagar, Adyar, Chennai, Tamil Nadu - 600020",
    latitude: 13.0125,
    longitude: 80.2562,
    description: "Multi-connector DC Hypercharger hub supporting super fast charging. Conveniently located near Adyar Metro.",
    rates: { hourly: 15, perKwh: 18 },
    chargers: [
      { id: "charger-1", type: "CCS2", power: 60, status: "Available" },
      { id: "charger-2", type: "CCS2", power: 60, status: "Occupied" },
      { id: "charger-3", type: "Type 2", power: 22, status: "Reserved" },
      { id: "charger-4", type: "GB/T", power: 50, status: "Offline" }
    ],
    amenities: ["Restroom", "Cafe", "Wi-Fi"],
    rating: 4.9,
    reviewCount: 18,
    isApproved: true,
    isSuspended: false
  },
  {
    id: "ev-2",
    ownerId: "owner-456",
    name: "T. Nagar Smart EV Plaza",
    address: "G N Chetty Rd, T. Nagar, Chennai, Tamil Nadu - 600017",
    latitude: 13.0425,
    longitude: 80.2368,
    description: "Vibrant high-speed AC & DC charging facilities with convenient shopping options nearby.",
    rates: { hourly: 12, perKwh: 15 },
    chargers: [
      { id: "charger-5", type: "CCS2", power: 120, status: "Available" },
      { id: "charger-6", type: "Type 2", power: 22, status: "Available" }
    ],
    amenities: ["Cafe", "Shopping Mall"],
    rating: 4.7,
    reviewCount: 22,
    isApproved: true,
    isSuspended: false
  },
  {
    id: "ev-3",
    ownerId: "owner-456",
    name: "Bandra Kurla Complex EV Station",
    address: "BKC Road, Bandra East, Mumbai, Maharashtra - 400051",
    latitude: 19.0607,
    longitude: 72.8642,
    description: "BKC's premium high-speed EV charging hub. Safe, CCTV-monitored, with dining amenities adjacent.",
    rates: { hourly: 20, perKwh: 22 },
    chargers: [
      { id: "charger-7", type: "CCS2", power: 150, status: "Available" },
      { id: "charger-8", type: "CCS2", power: 150, status: "Available" },
      { id: "charger-9", type: "Type 2", power: 22, status: "Available" }
    ],
    amenities: ["Restroom", "Cafe", "Wi-Fi", "CCTV"],
    rating: 4.8,
    reviewCount: 35,
    isApproved: true,
    isSuspended: false
  },
  {
    id: "ev-4",
    ownerId: "owner-456",
    name: "Nariman Point Fast Charge Hub",
    address: "Marine Drive, Nariman Point, Mumbai, Maharashtra - 400021",
    latitude: 18.9282,
    longitude: 72.8227,
    description: "DC Fast Charging station situated by the scenic Marine Drive. Supports rapid charging for 4W vehicles.",
    rates: { hourly: 18, perKwh: 19 },
    chargers: [
      { id: "charger-10", type: "CCS2", power: 120, status: "Available" },
      { id: "charger-11", type: "GB/T", power: 50, status: "Occupied" }
    ],
    amenities: ["CCTV", "Restroom"],
    rating: 4.6,
    reviewCount: 14,
    isApproved: true,
    isSuspended: false
  },
  {
    id: "ev-5",
    ownerId: "owner-456",
    name: "Connaught Place EV Charging Plaza",
    address: "Radial Road 2, Connaught Place, New Delhi, Delhi - 110001",
    latitude: 28.6304,
    longitude: 77.2177,
    description: "Central Delhi's prominent EV plaza. Supports all connector types and offers rapid DC hypercharging.",
    rates: { hourly: 15, perKwh: 17 },
    chargers: [
      { id: "charger-12", type: "CCS2", power: 100, status: "Available" },
      { id: "charger-13", type: "Type 2", power: 22, status: "Available" },
      { id: "charger-14", type: "GB/T", power: 60, status: "Available" }
    ],
    amenities: ["Shopping Mall", "Restroom", "Wi-Fi", "Cafe"],
    rating: 4.9,
    reviewCount: 42,
    isApproved: true,
    isSuspended: false
  },
  {
    id: "ev-6",
    ownerId: "owner-456",
    name: "Indira Gandhi Airport EV Station",
    address: "Terminal 3 Arrival Road, IGI Airport, New Delhi, Delhi - 110037",
    latitude: 28.5562,
    longitude: 77.1001,
    description: "Airport EV station serving travelers and cabs. Efficient high-output charging open 24/7.",
    rates: { hourly: 25, perKwh: 24 },
    chargers: [
      { id: "charger-15", type: "CCS2", power: 150, status: "Available" },
      { id: "charger-16", type: "CCS2", power: 150, status: "Occupied" }
    ],
    amenities: ["Restroom", "24/7 Support", "Cafe"],
    rating: 4.7,
    reviewCount: 29,
    isApproved: true,
    isSuspended: false
  },
  {
    id: "ev-7",
    ownerId: "owner-456",
    name: "Indiranagar Smart EV Station",
    address: "100 Feet Rd, Indiranagar, Bangalore, Karnataka - 560038",
    latitude: 12.9719,
    longitude: 77.6412,
    description: "Ultra-fast charging hub nestled in Bangalore's retail and food hub. Best-in-class service.",
    rates: { hourly: 12, perKwh: 16 },
    chargers: [
      { id: "charger-17", type: "CCS2", power: 80, status: "Available" },
      { id: "charger-18", type: "Type 2", power: 22, status: "Available" }
    ],
    amenities: ["Cafe", "Wi-Fi", "Restroom"],
    rating: 4.8,
    reviewCount: 51,
    isApproved: true,
    isSuspended: false
  },
  {
    id: "ev-8",
    ownerId: "owner-456",
    name: "Whitefield Hypercharge Plaza",
    address: "ITPL Main Road, Whitefield, Bangalore, Karnataka - 560066",
    latitude: 12.9876,
    longitude: 77.7343,
    description: "Tech park EV station optimized for daily office commutes. Fully automated contactless billing.",
    rates: { hourly: 15, perKwh: 18 },
    chargers: [
      { id: "charger-19", type: "CCS2", power: 120, status: "Available" },
      { id: "charger-20", type: "CCS2", power: 120, status: "Reserved" }
    ],
    amenities: ["Restroom", "CCTV"],
    rating: 4.5,
    reviewCount: 19,
    isApproved: true,
    isSuspended: false
  },
  {
    id: "ev-9",
    ownerId: "owner-456",
    name: "Gachibowli EV Charging Hub",
    address: "HITEC City Road, Gachibowli, Hyderabad, Telangana - 500032",
    latitude: 17.4401,
    longitude: 78.3489,
    description: "Hyderabad's premium IT-corridor EV charging hub. High-power DC fast charging connectors.",
    rates: { hourly: 14, perKwh: 16 },
    chargers: [
      { id: "charger-21", type: "CCS2", power: 100, status: "Available" },
      { id: "charger-22", type: "Type 2", power: 22, status: "Available" }
    ],
    amenities: ["Cafe", "Restroom", "Wi-Fi"],
    rating: 4.8,
    reviewCount: 23,
    isApproved: true,
    isSuspended: false
  },
  {
    id: "ev-10",
    ownerId: "owner-456",
    name: "Jubilee Hills Charging Point",
    address: "Road No. 36, Jubilee Hills, Hyderabad, Telangana - 500033",
    latitude: 17.4325,
    longitude: 78.4074,
    description: "High-end DC charging services close to prime commercial centers. Open all days.",
    rates: { hourly: 16, perKwh: 19 },
    chargers: [
      { id: "charger-23", type: "CCS2", power: 120, status: "Available" },
      { id: "charger-24", type: "GB/T", power: 60, status: "Available" }
    ],
    amenities: ["CCTV", "Restroom"],
    rating: 4.7,
    reviewCount: 31,
    isApproved: true,
    isSuspended: false
  },
  {
    id: "ev-11",
    ownerId: "owner-456",
    name: "Salt Lake Sector V EV Plaza",
    address: "Block EP & GP, Sector V, Salt Lake, Kolkata, West Bengal - 700091",
    latitude: 22.5735,
    longitude: 88.4331,
    description: "Kolkata's IT sector EV hub. Fast AC/DC charging stations for office employees and cabs.",
    rates: { hourly: 10, perKwh: 14 },
    chargers: [
      { id: "charger-25", type: "CCS2", power: 90, status: "Available" },
      { id: "charger-26", type: "Type 2", power: 22, status: "Available" }
    ],
    amenities: ["Restroom", "Wi-Fi"],
    rating: 4.6,
    reviewCount: 17,
    isApproved: true,
    isSuspended: false
  },
  {
    id: "ev-12",
    ownerId: "owner-456",
    name: "Koregaon Park Charging Hub",
    address: "North Main Road, Koregaon Park, Pune, Maharashtra - 411001",
    latitude: 18.5362,
    longitude: 73.8940,
    description: "Conveniently located high-speed EV station in Koregaon Park. Cafe options next door.",
    rates: { hourly: 15, perKwh: 17 },
    chargers: [
      { id: "charger-27", type: "CCS2", power: 80, status: "Available" },
      { id: "charger-28", type: "Type 2", power: 22, status: "Available" }
    ],
    amenities: ["Cafe", "Restroom", "Wi-Fi"],
    rating: 4.9,
    reviewCount: 26,
    isApproved: true,
    isSuspended: false
  }
];

let evReservations = [
  {
    id: "ev-res-101",
    userId: "customer-789",
    stationId: "ev-1",
    chargerId: "charger-3",
    connectorType: "Type 2",
    startTime: new Date(Date.now() - 3600000).toISOString(),
    durationHours: 2,
    totalAmount: 36,
    paymentId: "pay_EV9817265",
    status: "active",
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

// ==========================================
// ACCURATE SLOT RECALCULATION FROM BOOKINGS
// ==========================================
// Recomputes availableSlots for a location based on actual active bookings.
// A slot is occupied only while its booking has status 'active'.
// This replaces the old random fluctuation which was causing inaccurate counts.
const recalcSlots = (locId) => {
  const locIndex = locations.findIndex(l => l.id === locId);
  if (locIndex === -1) return;
  const loc = locations[locIndex];

  // Count active (currently occupying) bookings per vehicle type
  const activeBookings = bookings.filter(b => b.locationId === locId && b.status === 'active');
  const usedTwoWheeler = activeBookings.filter(b => b.vehicleType === 'two-wheeler').length;
  const usedFourWheeler = activeBookings.filter(b => b.vehicleType === 'four-wheeler').length;

  const totalTwo = loc.totalSlots?.twoWheeler ?? 0;
  const totalFour = loc.totalSlots?.fourWheeler ?? 0;

  locations[locIndex].availableSlots = {
    twoWheeler: Math.max(0, totalTwo - usedTwoWheeler),
    fourWheeler: Math.max(0, totalFour - usedFourWheeler)
  };
};

// Periodically sync all locations every 4 seconds so the dashboard stays live
setInterval(() => {
  locations.forEach(loc => recalcSlots(loc.id));
}, 4000);

// ==========================
// API ENDPOINTS
// ==========================

// Locations
app.get('/api/locations', (req, res) => {
  res.json(locations);
});

app.post('/api/locations', (req, res) => {
  const newLoc = {
    id: "loc-" + Math.floor(Math.random() * 1000),
    ...req.body,
    rating: 0,
    reviewCount: 0,
    isApproved: req.body.isApproved !== undefined ? req.body.isApproved : true,
    createdAt: new Date().toISOString()
  };
  locations.push(newLoc);
  res.status(201).json(newLoc);
});

app.put('/api/locations/:id', (req, res) => {
  const { id } = req.params;
  const index = locations.findIndex(l => l.id === id);
  if (index !== -1) {
    locations[index] = { ...locations[index], ...req.body };
    res.json(locations[index]);
  } else {
    res.status(404).json({ error: 'Location not found' });
  }
});

app.delete('/api/locations/:id', (req, res) => {
  const { id } = req.params;
  const index = locations.findIndex(l => l.id === id);
  if (index !== -1) {
    const deletedLoc = locations.splice(index, 1)[0];
    res.json(deletedLoc);
  } else {
    res.status(404).json({ error: 'Location not found' });
  }
});

// Bookings
app.get('/api/bookings', (req, res) => {
  res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
  const paymentMethod = req.body.paymentMethod || 'online';
  const totalAmount = req.body.totalAmount || 0;
  
  let paymentStatus = 'pending';
  let status = req.body.status || 'active';
  let paymentId = '';
  let verificationCode = '';
  
  if (paymentMethod === 'online' || paymentMethod === 'wallet') {
    paymentStatus = 'paid';
    paymentId = paymentMethod === 'wallet' ? "pay_WL" + Math.floor(Math.random() * 10000000) : "pay_RP" + Math.floor(Math.random() * 10000000);
  } else {
    // Cash booking
    paymentStatus = 'pending';
    verificationCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit code
  }

  const newBooking = {
    id: "book-" + Math.floor(Math.random() * 10000),
    createdAt: new Date().toISOString(),
    qrUsed: false,
    ...req.body,
    paymentMethod,
    paymentStatus,
    status,
    paymentId,
    verificationCode
  };
  
  bookings.unshift(newBooking);

  // Recompute slot availability from actual active bookings (accurate, no drift)
  recalcSlots(newBooking.locationId);

  // Online / Wallet bookings: deduct commission and add net to owner wallet immediately
  if (paymentMethod === 'online' || paymentMethod === 'wallet') {
    const loc = locations.find(l => l.id === newBooking.locationId);
    if (loc) {
      const owner = owners.find(o => o.uid === loc.ownerId);
      if (owner) {
        const commPct = settings.commissionPercentage || 10;
        const commission = totalAmount * (commPct / 100);
        const netAmount = totalAmount - commission;
        owner.onlineEarnings = (owner.onlineEarnings || 0) + netAmount;
        owner.earnings = (owner.earnings || 0) + netAmount;
        owner.walletBalance = (owner.walletBalance || 0) + netAmount;
      }
    }
  }

  res.status(201).json(newBooking);
});

app.put('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const index = bookings.findIndex(b => b.id === id);
  if (index !== -1) {
    const oldBooking = bookings[index];
    
    // Check if cash OTP is being verified or cash is accepted
    let forceVerify = req.body.acceptCash === true || req.body.acceptCash === 'true';
    let otpProvided = req.body.otpCode ? req.body.otpCode.toString().trim() : '';
    let expectedOtp = oldBooking.verificationCode ? oldBooking.verificationCode.toString().trim() : '';
    
    console.log("PUT /api/bookings/:id matching details:", {
      id,
      otpProvided,
      expectedOtp,
      forceVerify,
      paymentMethod: oldBooking.paymentMethod,
      paymentStatus: oldBooking.paymentStatus
    });
    
    if (oldBooking.paymentMethod === 'cash' && oldBooking.paymentStatus === 'pending') {
      if (otpProvided && expectedOtp && otpProvided !== expectedOtp) {
        return res.status(400).json({ error: 'Invalid 4-digit verification code.' });
      }
      
      if (forceVerify || (otpProvided && expectedOtp && otpProvided === expectedOtp)) {
        // Mark cash received
        req.body.paymentStatus = 'completed';
        req.body.status = 'completed';
        req.body.qrUsed = true;
        
        // Update owner financials: add total amount to wallet, add pending commission
        const loc = locations.find(l => l.id === oldBooking.locationId);
        if (loc) {
          const owner = owners.find(o => o.uid === loc.ownerId);
          if (owner) {
            const commPct = settings.commissionPercentage || 10;
            const commission = oldBooking.totalAmount * (commPct / 100);
            
            owner.cashEarnings = (owner.cashEarnings || 0) + oldBooking.totalAmount;
            owner.earnings = (owner.earnings || 0) + oldBooking.totalAmount;
            owner.walletBalance = (owner.walletBalance || 0) + oldBooking.totalAmount;
            owner.pendingCommission = (owner.pendingCommission || 0) + commission;
          }
        }
      }
    }

    bookings[index] = { ...bookings[index], ...req.body };
    
    // Recompute slot availability from actual active bookings after any status change
    recalcSlots(oldBooking.locationId);
    
    res.json(bookings[index]);
  } else {
    res.status(404).json({ error: 'Booking not found' });
  }
});

app.delete('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const index = bookings.findIndex(b => b.id === id);
  if (index !== -1) {
    const deletedBooking = bookings.splice(index, 1)[0];
    res.json(deletedBooking);
  } else {
    res.status(404).json({ error: 'Booking not found' });
  }
});

// Reviews
app.get('/api/reviews', (req, res) => {
  res.json(reviews);
});

app.post('/api/reviews', (req, res) => {
  const newReview = {
    id: "rev-" + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    ...req.body
  };
  reviews.unshift(newReview);

  // Recalculate average rating for that location
  const locIndex = locations.findIndex(l => l.id === newReview.locationId);
  if (locIndex !== -1) {
    const matching = reviews.filter(r => r.locationId === newReview.locationId);
    const avg = matching.reduce((sum, r) => sum + r.rating, 0) / matching.length;
    locations[locIndex].rating = parseFloat(avg.toFixed(1));
    locations[locIndex].reviewCount = matching.length;
  }

  res.status(201).json(newReview);
});

// Complaints
app.get('/api/complaints', (req, res) => {
  res.json(complaints);
});

app.post('/api/complaints', (req, res) => {
  const newComplaint = {
    id: "comp-" + Math.floor(Math.random() * 1000),
    status: "pending",
    createdAt: new Date().toISOString(),
    ...req.body
  };
  complaints.unshift(newComplaint);
  res.status(201).json(newComplaint);
});

app.put('/api/complaints/:id', (req, res) => {
  const { id } = req.params;
  const index = complaints.findIndex(c => c.id === id);
  if (index !== -1) {
    complaints[index] = { ...complaints[index], ...req.body };
    res.json(complaints[index]);
  } else {
    res.status(404).json({ error: 'Complaint not found' });
  }
});

// Settings
app.get('/api/settings', (req, res) => {
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  settings = { ...settings, ...req.body };
  res.json(settings);
});

// Audit Logs
app.get('/api/audit-logs', (req, res) => {
  res.json(auditLogs);
});

app.post('/api/audit-logs', (req, res) => {
  const newLog = {
    id: "log-" + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    ip: req.ip || '127.0.0.1',
    ...req.body
  };
  auditLogs.unshift(newLog);
  res.status(201).json(newLog);
});

// Broadcast Notifications
app.get('/api/broadcasts', (req, res) => {
  res.json(broadcastLogs);
});

app.post('/api/broadcasts', (req, res) => {
  const newBroadcast = {
    id: "bc-" + Math.floor(Math.random() * 1000),
    sentAt: new Date().toISOString(),
    ...req.body
  };
  broadcastLogs.unshift(newBroadcast);
  res.status(201).json(newBroadcast);
});

// Coupons
// Customers API
app.get('/api/customers', (req, res) => {
  res.json(customers);
});

app.put('/api/customers/:uid', (req, res) => {
  const { uid } = req.params;
  const index = customers.findIndex(c => c.uid === uid);
  const updatedCustomer = {
    ...req.body,
    uid,
    registeredAt: index !== -1 && customers[index].registeredAt ? customers[index].registeredAt : new Date().toISOString(),
    status: index !== -1 && customers[index].status ? customers[index].status : 'active',
    bookingsCount: index !== -1 && customers[index].bookingsCount ? customers[index].bookingsCount : 0
  };
  
  if (index !== -1) {
    customers[index] = updatedCustomer;
  } else {
    customers.push(updatedCustomer);
  }
  res.json(updatedCustomer);
});

// EV Stations API
app.get('/api/ev-stations', async (req, res) => {
  try {
    const response = await fetch(`${FIREBASE_DB_URL}/evStations.json`);
    if (response.ok) {
      const data = await response.json();
      if (data) {
        evStations = data;
      }
    }
  } catch (e) {
    console.error("Error loading EV stations dynamically:", e);
  }
  res.json(evStations);
});

app.post('/api/ev-stations', (req, res) => {
  const newStation = {
    id: "ev-" + Math.floor(Math.random() * 1000),
    rating: 0,
    reviewCount: 0,
    isApproved: false,
    isSuspended: false,
    chargers: req.body.chargers || [],
    ...req.body
  };
  evStations.push(newStation);
  res.status(201).json(newStation);
});

app.put('/api/ev-stations/:id', (req, res) => {
  const { id } = req.params;
  const index = evStations.findIndex(s => s.id === id);
  if (index !== -1) {
    evStations[index] = { ...evStations[index], ...req.body };
    res.json(evStations[index]);
  } else {
    res.status(404).json({ error: "Station not found" });
  }
});

// EV Reservations API
app.get('/api/ev-reservations', (req, res) => {
  res.json(evReservations);
});

app.post('/api/ev-reservations', (req, res) => {
  const newReservation = {
    id: "ev-res-" + Math.floor(Math.random() * 1000),
    createdAt: new Date().toISOString(),
    status: "active",
    ...req.body
  };
  evReservations.push(newReservation);
  res.status(201).json(newReservation);
});

app.put('/api/ev-reservations/:id', (req, res) => {
  const { id } = req.params;
  const index = evReservations.findIndex(r => r.id === id);
  if (index !== -1) {
    evReservations[index] = { ...evReservations[index], ...req.body };
    res.json(evReservations[index]);
  } else {
    res.status(404).json({ error: "Reservation not found" });
  }
});

app.get('/api/coupons', (req, res) => {
  res.json(coupons);
});

// Owners API
app.get('/api/owners', (req, res) => {
  res.json(owners);
});

app.get('/api/owners/:uid', (req, res) => {
  const { uid } = req.params;
  const owner = owners.find(o => o.uid === uid);
  if (owner) {
    res.json(owner);
  } else {
    // If not found, dynamically initialize a stub so demo users don't break
    const newOwner = {
      uid,
      name: "Host User",
      email: uid.includes('@') ? uid : `${uid}@spotowner.com`,
      phone: "+91 90000 00000",
      role: "owner",
      verified: true,
      status: "active",
      locationsCount: 0,
      earnings: 0,
      onlineEarnings: 0,
      cashEarnings: 0,
      pendingCommission: 0,
      walletBalance: 0,
      kycStatus: "pending",
      settlementHistory: [],
      notifications: []
    };
    owners.push(newOwner);
    res.json(newOwner);
  }
});

// Admin Settlement endpoints
app.post('/api/owners/:uid/settle', (req, res) => {
  const { uid } = req.params;
  const owner = owners.find(o => o.uid === uid);
  if (!owner) {
    return res.status(404).json({ error: 'Owner not found' });
  }

  const online = owner.onlineEarnings || 0;
  const debt = owner.pendingCommission || 0;
  const netPayout = online - debt;

  const settlement = {
    id: 'set-' + Math.floor(Math.random() * 10000),
    date: new Date().toISOString().split('T')[0],
    amount: netPayout,
    method: owner.payoutMethod === 'upi' ? `UPI (${owner.upiDetails?.upiId || 'UPI'})` : `Bank Transfer (•••• ${owner.bankDetails?.accountNumber?.slice(-4) || '1122'})`,
    status: 'completed'
  };

  owner.settlementHistory = owner.settlementHistory || [];
  owner.settlementHistory.unshift(settlement);

  // Reset/deduct values
  owner.onlineEarnings = 0;
  owner.pendingCommission = 0;
  owner.walletBalance = Math.max(0, (owner.walletBalance || 0) - netPayout - debt);

  res.json(owner);
});

app.post('/api/admin/settle-all', (req, res) => {
  owners.forEach(owner => {
    const online = owner.onlineEarnings || 0;
    const debt = owner.pendingCommission || 0;
    const netPayout = online - debt;

    const settlement = {
      id: 'set-' + Math.floor(Math.random() * 10000),
      date: new Date().toISOString().split('T')[0],
      amount: netPayout,
      method: owner.payoutMethod === 'upi' ? `UPI (${owner.upiDetails?.upiId || 'UPI'})` : `Bank Transfer (•••• ${owner.bankDetails?.accountNumber?.slice(-4) || '1122'})`,
      status: 'completed'
    };

    owner.settlementHistory = owner.settlementHistory || [];
    owner.settlementHistory.unshift(settlement);

    owner.onlineEarnings = 0;
    owner.pendingCommission = 0;
    owner.walletBalance = Math.max(0, (owner.walletBalance || 0) - netPayout - debt);
  });

  res.json(owners);
});

app.put('/api/owners/:uid', (req, res) => {
  const { uid } = req.params;
  const index = owners.findIndex(o => o.uid === uid);
  if (index !== -1) {
    owners[index] = { ...owners[index], ...req.body };
    res.json(owners[index]);
  } else {
    res.status(404).json({ error: 'Owner profile not found' });
  }
});

async function syncOpenChargeMapData() {
  try {
    const res = await fetch("https://api.openchargemap.io/v3/poi/?output=json&countrycode=IN&maxresults=100&compact=true&verbose=false&key=5dbb2c9b-640a-471a-85d3-f542a3eb946f");
    if (!res.ok) return;
    const data = await res.json();
    let updated = false;

    data.forEach(poi => {
      const stationId = `ev-ocm-${poi.ID}`;
      if (!evStations.some(s => s.id === stationId)) {
        const chargers = (poi.Connections || []).map((conn, idx) => ({
          id: `charger-${poi.ID}-${idx}`,
          type: conn.ConnectionType?.Title || "CCS (Type 2)",
          power: conn.PowerKW || 22,
          status: conn.StatusType?.IsOperational ? "Available" : "Offline"
        }));

        const newStation = {
          id: stationId,
          ownerId: "system",
          name: poi.AddressInfo?.Title || "EV Charging Station",
          address: `${poi.AddressInfo?.AddressLine1 || ""}, ${poi.AddressInfo?.Town || ""}, ${poi.AddressInfo?.StateOrProvince || ""}`.trim().replace(/^,|,$/g, ''),
          latitude: poi.AddressInfo?.Latitude,
          longitude: poi.AddressInfo?.Longitude,
          description: poi.GeneralComments || "Public EV Charger station monitored by Open Charge Map.",
          rates: { hourly: 0, perKwh: 15 },
          chargers: chargers.length > 0 ? chargers : [{ id: `charger-${poi.ID}-0`, type: "CCS2", power: 50, status: "Available" }],
          amenities: ["Restroom", "Wi-Fi"],
          rating: 4.5,
          reviewCount: 5,
          isApproved: true,
          isSuspended: false
        };
        evStations.push(newStation);
        updated = true;
      }
    });

    if (updated) {
      saveAllData();
      console.log(`Synced & updated Open Charge Map: ${evStations.length} total stations.`);
    }
  } catch (e) {
    console.error("Error syncing Open Charge Map:", e);
  }
}

// Sync OCM every hour
setInterval(syncOpenChargeMapData, 3600000);
setTimeout(syncOpenChargeMapData, 5000);

// ==========================================
// RAZORPAY & SETTLEMENT APIS
// ==========================================

// Create Razorpay Order
app.post('/api/payments/order', async (req, res) => {
  const { amount, bookingId } = req.body;
  try {
    const options = {
      amount: Math.round(amount * 100), // amount in paisa
      currency: "INR",
      receipt: `receipt_${bookingId}_${Date.now()}`
    };
    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount / 100,
      currency: order.currency
    });
  } catch (err) {
    console.error("Error creating Razorpay Order:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Verify Signature and Confirm Booking
app.post('/api/payments/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
  
  const hmac = crypto.createHmac('sha256', razorpay.key_secret);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generatedSignature = hmac.digest('hex');

  const bookingIndex = bookings.findIndex(b => b.id === bookingId);
  
  if (generatedSignature === razorpay_signature) {
    // Signature verified
    if (bookingIndex !== -1) {
      bookings[bookingIndex].paymentStatus = 'paid';
      bookings[bookingIndex].status = 'active';
      bookings[bookingIndex].paymentId = razorpay_payment_id;
      bookings[bookingIndex].razorpayOrderId = razorpay_order_id;
      bookings[bookingIndex].razorpayPaymentId = razorpay_payment_id;

      // Credit Owner Wallet and deduct Platform Commission
      const loc = locations.find(l => l.id === bookings[bookingIndex].locationId);
      if (loc) {
        const ownerIndex = owners.findIndex(o => o.uid === loc.ownerId);
        if (ownerIndex !== -1) {
          const total = bookings[bookingIndex].totalAmount;
          const commRate = settings.commissionPercentage || 10;
          const platformFee = total * (commRate / 100);
          const ownerShare = total - platformFee;

          owners[ownerIndex].walletBalance = (owners[ownerIndex].walletBalance || 0) + ownerShare;
          owners[ownerIndex].onlineEarnings = (owners[ownerIndex].onlineEarnings || 0) + ownerShare;
          owners[ownerIndex].earnings = (owners[ownerIndex].earnings || 0) + ownerShare;

          // Record transaction log
          const newTx = {
            id: "tx-" + Math.floor(Math.random() * 100000),
            ownerId: loc.ownerId,
            bookingId: bookingId,
            amount: total,
            commission: platformFee,
            netAmount: ownerShare,
            type: "credit",
            status: "success",
            timestamp: new Date().toISOString()
          };
          walletTransactions.unshift(newTx);
        }
      }
      recalcSlots(bookings[bookingIndex].locationId);
      await saveAllData();
      res.json({ success: true, booking: bookings[bookingIndex] });
    } else {
      res.status(404).json({ error: "Booking not found" });
    }
  } else {
    // Verification failed
    if (bookingIndex !== -1) {
      bookings[bookingIndex].paymentStatus = 'failed';
      bookings[bookingIndex].status = 'cancelled';
      await saveAllData();
    }
    res.status(400).json({ error: "Signature verification failed" });
  }
});

// Run Weekly Settlements
app.post('/api/settlements/process', async (req, res) => {
  try {
    let processedCount = 0;
    owners.forEach(owner => {
      const balance = owner.walletBalance || 0;
      if (balance > 0) {
        // Record settlement history
        const newSet = {
          id: "set-" + Math.floor(Math.random() * 100000),
          ownerId: owner.uid,
          amount: balance,
          status: "completed",
          bankAccount: "BANK-X-XXXX-9812",
          createdAt: new Date().toISOString()
        };
        settlements.unshift(newSet);

        // Record debit transaction in wallet logs
        const newTx = {
          id: "tx-" + Math.floor(Math.random() * 100000),
          ownerId: owner.uid,
          bookingId: "settlement",
          amount: balance,
          commission: 0,
          netAmount: balance,
          type: "debit",
          status: "success",
          timestamp: new Date().toISOString()
        };
        walletTransactions.unshift(newTx);

        // Reset owner balance
        owner.walletBalance = 0;
        processedCount++;
      }
    });
    if (processedCount > 0) {
      await saveAllData();
    }
    res.json({ success: true, processedCount });
  } catch (err) {
    console.error("Error processing weekly settlements:", err);
    res.status(500).json({ error: "Failed to process settlements" });
  }
});

// Get Settlements History
app.get('/api/settlements', (req, res) => {
  res.json(settlements);
});

// Get Wallet Transactions
app.get('/api/wallet-transactions', (req, res) => {
  res.json(walletTransactions);
});

// Start Server
app.listen(PORT, () => {
  // Initial calculation of slots on startup
  locations.forEach(loc => recalcSlots(loc.id));
  console.log(`🚀 ParkHub Backend running at http://localhost:${PORT}`);
});
