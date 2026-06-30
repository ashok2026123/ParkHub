// @ts-nocheck
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import helmet from 'helmet';
import compression from 'compression';
import axios from 'axios';
import admin from 'firebase-admin';

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_T71PJdC3zXI1H8',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'i4AoBu4S0Vt6vNStcOV3bqq6'
});

const app = express();
const PORT = process.env.PORT || 5000;

// Security and Compression
app.use(helmet());
app.use(compression());
app.use(cors({ origin: 'http://localhost:3000' })); // Enable CORS only for frontend
app.use(express.json());

// Initialize Firebase Admin (Firestore)
let db: any;
try {
  if (!(admin as any).apps || (admin as any).apps.length === 0) {
    admin.initializeApp({
      credential: (admin as any).credential.applicationDefault()
    });
  }
  db = (admin as any).firestore();
} catch (e) {
  console.warn("Firebase Admin Initialization Failed. Using Mock Firestore...", e);
  // Basic mock for Firestore to prevent crashes without credentials
  const mockStorage: Record<string, any> = {};
  db = {
    collection: (col: string) => ({
      doc: (id: string) => ({
        set: async (data: any) => { mockStorage[`${col}/${id}`] = data; },
        get: async () => ({
          exists: !!mockStorage[`${col}/${id}`],
          data: () => mockStorage[`${col}/${id}`]
        })
      }),
      where: () => ({ get: async () => ({ empty: true, forEach: () => {} }) }),
      add: async (data: any) => { mockStorage[`${col}/${Date.now()}`] = data; }
    })
  };
}

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
      fetch(`${FIREBASE_DB_URL}/fuelStations.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fuelStations) }),
      fetch(`${FIREBASE_DB_URL}/walletTransactions.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(walletTransactions) }),
      fetch(`${FIREBASE_DB_URL}/settlements.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settlements) })
    ]);
  } catch (err) {
    console.error("Error saving data to Firebase:", err);
  }
}

async function loadAllData() {
  try {
    const [locRes, bookRes, revRes, compRes, ownRes, coupRes, setRes, auditRes, broadRes, custRes, evLocRes, evBookRes, fuelRes, walletTxRes, settlementRes] = await Promise.all([
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
      fetch(`${FIREBASE_DB_URL}/fuelStations.json`).then(r => r.json()),
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
    if (fuelRes) fuelStations = fuelRes;
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
let locations = [];
let bookings = [];
let reviews = [];
let complaints = [];
let walletTransactions = [];
let settlements = [];

let owners = [];
let coupons = [];

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
let evStations = [];
let evReservations = [];
let fuelStations = [];
let saved_trips = [];
let trip_history = [];
let trip_preferences = [];
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
        
        // Update owner financials: deduct platform commission from wallet
        const loc = locations.find(l => l.id === oldBooking.locationId);
        if (loc) {
          const ownerIndex = owners.findIndex(o => o.uid === loc.ownerId);
          if (ownerIndex !== -1) {
            const total = oldBooking.totalAmount;
            const commType = settings.commissionType || 'percentage';
            const commVal = Number(settings.commissionValue !== undefined ? settings.commissionValue : 10);
            const commEnabled = settings.commissionEnabled !== false;

            let platformFee = 0;
            if (commEnabled) {
              if (commType === 'percentage') {
                platformFee = Math.round(total * (commVal / 100));
              } else {
                platformFee = commVal;
              }
            }

            // User requested process: automatically increase the wallet when OTP is entered
            owners[ownerIndex].walletBalance = (owners[ownerIndex].walletBalance || 0) + total;
            owners[ownerIndex].cashEarnings = (owners[ownerIndex].cashEarnings || 0) + total;
            owners[ownerIndex].earnings = (owners[ownerIndex].earnings || 0) + total;

            req.body.commission_type = commType;
            req.body.commission_value = commVal;
            req.body.commission_amount = platformFee;
            req.body.owner_amount = total - platformFee;
            req.body.wallet_balance_after = owners[ownerIndex].walletBalance;
            req.body.payment_status = 'completed';
            req.body.payment_type = 'cash';

            // Record transaction log
            const newTx = {
              id: "tx-" + Math.floor(Math.random() * 100000),
              ownerId: loc.ownerId,
              bookingId: id,
              amount: total,
              commission: platformFee,
              netAmount: -platformFee,
              type: "debit",
              status: "success",
              timestamp: new Date().toISOString()
            };
            walletTransactions.unshift(newTx);
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
  
  if (index !== -1) {
    // Merge existing customer data to prevent overwriting fields like location/name
    customers[index] = {
      ...customers[index],
      ...req.body,
      uid
    };
    saveAllData();
    res.json(customers[index]);
  } else {
    const newCustomer = {
      ...req.body,
      uid,
      registeredAt: new Date().toISOString(),
      status: 'active',
      bookingsCount: 0
    };
    customers.push(newCustomer);
    saveAllData();
    res.json(newCustomer);
  }
});

app.get('/api/customers/:uid', (req, res) => {
  const customer = customers.find(c => c.uid === req.params.uid);
  if (customer) res.json(customer);
  else res.status(404).json({ error: "Customer not found" });
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

app.post('/api/ev-stations/sync', async (req, res) => {
  try {
    await syncHybridEvData();
    res.json({ success: true, count: evStations.length });
  } catch (err) {
    res.status(500).json({ error: "Sync failed" });
  }
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

app.post('/api/owners/:uid/adjust-wallet', async (req, res) => {
  const { uid } = req.params;
  const { type, amount, remarks } = req.body;
  const ownerIndex = owners.findIndex(o => o.uid === uid);
  if (ownerIndex === -1) {
    return res.status(404).json({ error: "Owner not found" });
  }

  const amt = Number(amount);
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  if (type === 'credit') {
    owners[ownerIndex].walletBalance = (owners[ownerIndex].walletBalance || 0) + amt;
  } else {
    owners[ownerIndex].walletBalance = (owners[ownerIndex].walletBalance || 0) - amt;
  }

  // Record transaction log
  const newTx = {
    id: "tx-" + Math.floor(Math.random() * 100000),
    ownerId: uid,
    bookingId: type === 'credit' ? 'manual-credit' : 'manual-debit',
    amount: amt,
    commission: 0,
    netAmount: type === 'credit' ? amt : -amt,
    type: type,
    status: "success",
    remarks: remarks || "Platform Adjustment",
    timestamp: new Date().toISOString()
  };
  walletTransactions.unshift(newTx);
  await saveAllData();
  res.json({ success: true, owner: owners[ownerIndex] });
});

app.put('/api/owners/:uid', (req, res) => {
  const { uid } = req.params;
  const index = owners.findIndex(o => o.uid === uid);
  
  if (index !== -1) {
    owners[index] = {
      ...owners[index],
      ...req.body,
      uid
    };
    saveAllData();
    res.json(owners[index]);
  } else {
    const newOwner = {
      ...req.body,
      uid,
      registeredAt: new Date().toISOString(),
      status: 'active',
      earnings: 0
    };
    owners.push(newOwner);
    saveAllData();
    res.json(newOwner);
  }
});

async function syncHybridEvData() {
  try {
    let updated = false;

    // 1. Fetch from Open Charge Map
    try {
      const ocmRes = await fetch("https://api.openchargemap.io/v3/poi/?output=json&countrycode=IN&maxresults=3000&compact=true&verbose=false&key=5dbb2c9b-640a-471a-85d3-f542a3eb946f");
      if (ocmRes.ok) {
        const ocmData = await ocmRes.json();
        ocmData.forEach(poi => {
          const stationId = `ev-ocm-${poi.ID}`;
          if (!evStations.some(s => s.id === stationId)) {
            // Deduplication check: distance < 0.05 km (50 meters)
            const lat = poi.AddressInfo?.Latitude;
            const lng = poi.AddressInfo?.Longitude;
            if (lat && lng) {
              const isDuplicate = evStations.some(s => getDistance(s.latitude, s.longitude, lat, lng) < 0.05);
              if (!isDuplicate) {
                const networkTitle = poi.OperatorInfo?.Title || "Public EV Charger";
                const chargers = (poi.Connections || []).map((conn, idx) => ({
                  id: `charger-${poi.ID}-${idx}`,
                  type: conn.ConnectionType?.Title || "CCS2",
                  power: conn.PowerKW || 22,
                  status: conn.StatusType?.IsOperational ? "Available" : "Offline"
                }));

                evStations.push({
                  id: stationId,
                  ownerId: "system",
                  name: poi.AddressInfo?.Title || "EV Charging Station",
                  network: networkTitle,
                  address: `${poi.AddressInfo?.AddressLine1 || ""}, ${poi.AddressInfo?.Town || ""}, ${poi.AddressInfo?.StateOrProvince || ""}`.trim().replace(/^,|,$/g, ''),
                  latitude: lat,
                  longitude: lng,
                  description: poi.GeneralComments || `Monitored by Open Charge Map.`,
                  rates: { hourly: 0, perKwh: 15 },
                  chargers: chargers.length > 0 ? chargers : [{ id: `charger-${poi.ID}-0`, type: "CCS2", power: 50, status: "Available" }],
                  amenities: ["Restroom"],
                  rating: 4.5,
                  reviewCount: Math.floor(Math.random() * 50) + 5,
                  isApproved: true,
                  isSuspended: false,
                  lastUpdated: new Date().toISOString()
                });
                updated = true;
              }
            }
          }
        });
      }
    } catch (e) { console.error("Error syncing OCM:", e); }

    // 2. Fetch from OpenStreetMap (Overpass API)
    try {
      const overpassQuery = `
        [out:json][timeout:30];
        area["name"="India"]->.searchArea;
        node["amenity"="charging_station"](area.searchArea);
        out body;
      `;
      const osmRes = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(overpassQuery)
      });
      if (osmRes.ok) {
        const osmData = await osmRes.json();
        if (osmData.elements) {
          osmData.elements.forEach(node => {
            const stationId = `ev-osm-${node.id}`;
            if (!evStations.some(s => s.id === stationId)) {
              // Deduplication check: distance < 0.05 km (50 meters)
              const lat = node.lat;
              const lng = node.lon;
              if (lat && lng) {
                const isDuplicate = evStations.some(s => getDistance(s.latitude, s.longitude, lat, lng) < 0.05);
                if (!isDuplicate) {
                  const tags = node.tags || {};
                  const network = tags.brand || tags.operator || tags.network || "Public EV Charger";
                  const name = tags.name || `${network} Station`;
                  
                  const chargers = [];
                  let chargerCount = parseInt(tags.capacity, 10) || 1;
                  for(let i = 0; i < chargerCount; i++) {
                    chargers.push({
                      id: `charger-osm-${node.id}-${i}`,
                      type: tags["socket:type2"] ? "Type 2" : tags["socket:ccs2"] ? "CCS2" : tags["socket:chademo"] ? "CHAdeMO" : "CCS2",
                      power: parseFloat(tags["socket:type2:output"] || tags["socket:ccs2:output"]) || 50,
                      status: "Available"
                    });
                  }

                  evStations.push({
                    id: stationId,
                    ownerId: "system",
                    name: name,
                    network: network,
                    address: `${tags["addr:street"] || ""} ${tags["addr:city"] || ""} ${tags["addr:state"] || ""}`.trim() || "India",
                    latitude: lat,
                    longitude: lng,
                    description: `Sourced from OpenStreetMap.`,
                    rates: { hourly: 0, perKwh: tags.fee === "no" ? 0 : 18 },
                    chargers: chargers,
                    amenities: tags.wheelchair ? ["Wheelchair Accessible"] : [],
                    rating: 4.2,
                    reviewCount: Math.floor(Math.random() * 20) + 1,
                    isApproved: true,
                    isSuspended: false,
                    lastUpdated: new Date().toISOString()
                  });
                  updated = true;
                }
              }
            }
          });
        }
      }
    } catch (e) { console.error("Error syncing OSM:", e); }

    if (updated) {
      saveAllData();
      console.log(`Synced & updated Hybrid EV Data: ${evStations.length} total stations.`);
    }
  } catch (e) {
    console.error("Error in hybrid EV sync:", e);
  }
}

// Sync EV Stations every 24 hours (86400000 ms)
setInterval(syncHybridEvData, 86400000);
setTimeout(syncHybridEvData, 5000);

// ==========================================
// FUEL STATIONS (OpenStreetMap Overpass API)
// ==========================================

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

app.get('/api/fuel-stations/search', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius) || 10; // km
  
  if (!lat || !lng) return res.status(400).json({ error: "Missing lat/lng" });

  try {
    const nearbyCached = fuelStations.filter(s => getDistance(lat, lng, s.latitude, s.longitude) <= radius * 1.5);
    
    // Always return cached first, the backend syncs it in background
    return res.json(nearbyCached);
  } catch (err) {
    console.error("Error in local fuel search endpoint:", err);
    res.status(500).json({ error: "Failed to search fuel stations locally" });
  }
});

// Admin manual force sync
app.post('/api/fuel-stations/sync', async (req, res) => {
  await syncFuelStationsData();
  res.json({ message: "Fuel stations synced", count: fuelStations.length });
});

async function syncFuelStationsData() {
  console.log("Starting background OSM fuel stations sync for major Indian cities...");
  
  // Bounding boxes for top Indian cities
  const cities = [
    { name: "Chennai", minLat: 12.8, minLon: 80.0, maxLat: 13.2, maxLon: 80.3 },
    { name: "Bangalore", minLat: 12.7, minLon: 77.4, maxLat: 13.1, maxLon: 77.8 },
    { name: "Mumbai", minLat: 18.9, minLon: 72.8, maxLat: 19.3, maxLon: 73.1 },
    { name: "Delhi", minLat: 28.4, minLon: 76.8, maxLat: 28.9, maxLon: 77.4 },
    { name: "Hyderabad", minLat: 17.2, minLon: 78.3, maxLat: 17.6, maxLon: 78.6 },
    { name: "Kolkata", minLat: 22.4, minLon: 88.2, maxLat: 22.7, maxLon: 88.5 },
    { name: "Pune", minLat: 18.4, minLon: 73.7, maxLat: 18.7, maxLon: 74.0 },
    { name: "Ahmedabad", minLat: 22.9, minLon: 72.5, maxLat: 23.1, maxLon: 72.7 }
  ];

  let updated = false;

  for (let city of cities) {
    try {
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"="fuel"](${city.minLat},${city.minLon},${city.maxLat},${city.maxLon});
          way["amenity"="fuel"](${city.minLat},${city.minLon},${city.maxLat},${city.maxLon});
        );
        out center;
      `;

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: overpassQuery,
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        data.elements.forEach(el => {
          const id = `fuel-osm-${el.id}`;
          if (!fuelStations.some(s => s.id === id)) {
            const tags = el.tags || {};
            const eLat = el.lat || el.center?.lat;
            const eLon = el.lon || el.center?.lon;
            
            if (eLat && eLon) {
              const operator = (tags.operator || tags.brand || "Independent").toLowerCase();
              let brand = "Independent";
              if (operator.includes("indianoil") || operator.includes("ioc")) brand = "IndianOil";
              else if (operator.includes("bharat") || operator.includes("bpcl")) brand = "BPCL";
              else if (operator.includes("hindustan") || operator.includes("hpcl")) brand = "HPCL";
              else if (operator.includes("shell")) brand = "Shell";
              else if (operator.includes("reliance") || operator.includes("jio")) brand = "Reliance";
              else if (operator.includes("nayara") || operator.includes("essar")) brand = "Nayara";
              else brand = tags.brand || tags.operator || "Independent";

              const newStation = {
                id,
                osm_id: el.id,
                name: tags.name || `${brand} Fuel Station`,
                brand: brand,
                address: `${tags["addr:street"] || ""} ${tags["addr:city"] || city.name} India`.trim(),
                latitude: eLat,
                longitude: eLon,
                diesel: tags.fuel_diesel === "yes" || true,
                petrol: tags.fuel_octane_91 === "yes" || tags.fuel_octane_95 === "yes" || true,
                cng: tags.fuel_cng === "yes" || false,
                lastUpdated: new Date().toISOString()
              };
              
              // Deduplication
              const isDuplicate = fuelStations.some(s => getDistance(newStation.latitude, newStation.longitude, s.latitude, s.longitude) < 0.05);
              if (!isDuplicate) {
                fuelStations.push(newStation);
                updated = true;
              }
            }
          }
        });
      }
    } catch (err) {
      console.error(`Error syncing fuel stations for ${city.name}:`, err);
    }
  }

  if (updated) {
    saveAllData();
    console.log(`Synced & updated Fuel Stations: ${fuelStations.length} total stations.`);
  }
}

// Sync Fuel Stations every 24 hours (86400000 ms)
setInterval(syncFuelStationsData, 86400000);
setTimeout(syncFuelStationsData, 10000); // Run 10 seconds after boot

app.get('/api/fuel-stations/admin', (req, res) => {
  res.json(fuelStations);
});

app.post('/api/fuel-stations/admin', (req, res) => {
  const newStation = {
    id: `fuel-custom-${Date.now()}`,
    source: 'admin',
    is_active: true,
    last_updated: new Date().toISOString(),
    ...req.body
  };
  fuelStations.push(newStation);
  res.status(201).json(newStation);
});

app.put('/api/fuel-stations/admin/:id', (req, res) => {
  const idx = fuelStations.findIndex(s => s.id === req.params.id);
  if (idx !== -1) {
    fuelStations[idx] = { ...fuelStations[idx], ...req.body, last_updated: new Date().toISOString() };
    res.json(fuelStations[idx]);
  } else {
    res.status(404).json({ error: "Station not found" });
  }
});

app.delete('/api/fuel-stations/admin/:id', (req, res) => {
  const idx = fuelStations.findIndex(s => s.id === req.params.id);
  if (idx !== -1) {
    fuelStations.splice(idx, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Station not found" });
  }
});

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
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_live_T71PJdC3zXI1H8'
    });
  } catch (err) {
    console.error("Error creating Razorpay Order:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Verify Signature and Confirm Booking
app.post('/api/payments/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
  
  let isVerified = false;
  try {
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'i4AoBu4S0Vt6vNStcOV3bqq6');
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');
    isVerified = (generatedSignature === razorpay_signature);
  } catch (e) {
    console.error("Signature calculation error:", e);
  }

  const bookingIndex = bookings.findIndex(b => b.id === bookingId);
  
  if (isVerified) {
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
          const commType = settings.commissionType || 'percentage';
          const commVal = Number(settings.commissionValue !== undefined ? settings.commissionValue : 10);
          const commEnabled = settings.commissionEnabled !== false;

          let platformFee = 0;
          if (commEnabled) {
            if (commType === 'percentage') {
              platformFee = Math.round(total * (commVal / 100));
            } else {
              platformFee = commVal;
            }
          }
          const ownerShare = total - platformFee;

          owners[ownerIndex].walletBalance = (owners[ownerIndex].walletBalance || 0) + ownerShare;
          owners[ownerIndex].onlineEarnings = (owners[ownerIndex].onlineEarnings || 0) + ownerShare;
          owners[ownerIndex].earnings = (owners[ownerIndex].earnings || 0) + ownerShare;

          bookings[bookingIndex].commission_type = commType;
          bookings[bookingIndex].commission_value = commVal;
          bookings[bookingIndex].commission_amount = platformFee;
          bookings[bookingIndex].owner_amount = ownerShare;
          bookings[bookingIndex].wallet_balance_after = owners[ownerIndex].walletBalance;
          bookings[bookingIndex].payment_status = 'paid';
          bookings[bookingIndex].payment_type = 'online';

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

// Create Wallet Top-Up Order
app.post('/api/wallet/create-order', async (req, res) => {
  const { amount, userId } = req.body;
  try {
    const options = {
      amount: Math.round(amount * 100), // amount in paisa
      currency: "INR",
      receipt: `wallet_${userId}_${Date.now()}`
    };
    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_live_T71PJdC3zXI1H8'
    });
  } catch (err) {
    console.error("Error creating Wallet Top-Up Order:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Verify Wallet Top-Up Signature
app.post('/api/wallet/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, amount } = req.body;
  
  let isVerified = false;
  try {
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'i4AoBu4S0Vt6vNStcOV3bqq6');
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');
    isVerified = (generatedSignature === razorpay_signature);
  } catch (e) {
    console.error("Wallet Signature calculation error:", e);
  }

  if (isVerified) {
    const userIndex = customers.findIndex(c => c.uid === userId);
    if (userIndex !== -1) {
      customers[userIndex].walletBalance = (customers[userIndex].walletBalance || 0) + Number(amount);
      
      const newTx = {
        id: "tx-wallet-" + Math.floor(Math.random() * 1000000),
        userId,
        amount: Number(amount),
        type: 'credit',
        status: 'success',
        remarks: 'Wallet Top-Up via Razorpay',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        timestamp: new Date().toISOString()
      };
      walletTransactions.unshift(newTx);
      
      await saveAllData();
      res.json({ success: true, newBalance: customers[userIndex].walletBalance, transaction: newTx });
    } else {
      res.status(404).json({ error: "Customer not found" });
    }
  } else {
    // Failed verification
    const newTx = {
        id: "tx-wallet-" + Math.floor(Math.random() * 1000000),
        userId,
        amount: Number(amount),
        type: 'credit',
        status: 'failed',
        remarks: 'Wallet Top-Up Failed Verification',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        timestamp: new Date().toISOString()
    };
    walletTransactions.unshift(newTx);
    await saveAllData();
    res.status(400).json({ error: "Invalid payment signature" });
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

// ==========================================
// SMART TRIP PLANNER APIs
// ==========================================

app.post('/api/trip/plan', async (req, res) => {
  try {
    const { waypoints, avoidTolls, avoidHighways, userId } = req.body;
    // waypoints should be an array of {lat, lng}, at least 2 (start and destination)
    if (!waypoints || waypoints.length < 2) return res.status(400).json({ error: "Missing or insufficient waypoints" });
    
    const coordString = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
    
    let exclude = [];
    if (avoidTolls) exclude.push('toll');
    if (avoidHighways) exclude.push('motorway');
    const excludeParam = exclude.length > 0 ? `&exclude=${exclude.join(',')}` : '';

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson${excludeParam}`;
    const response = await fetch(osrmUrl);
    const data = await response.json();
    
    if (userId && data.code === 'Ok') {
       const historyEntry = {
         id: "hist-" + Date.now(),
         userId,
         waypoints,
         distance: data.routes[0].distance,
         duration: data.routes[0].duration,
         timestamp: new Date().toISOString()
       };
       trip_history.unshift(historyEntry);
    }
    
    res.json(data);
  } catch (error) {
    console.error("Trip plan error:", error);
    res.status(500).json({ error: "Failed to plan trip" });
  }
});

// For a route, the frontend will send waypoints=lat,lng|lat,lng
app.get('/api/trip/nearby', async (req, res) => {
  try {
    const { waypoints, radius = 2000, categories } = req.query;
    if (!waypoints) return res.status(400).json({ error: "Missing waypoints" });
    
    const pts = waypoints.split('|').map(p => { const [lat, lng] = p.split(','); return { lat, lng }; });
    const cats = categories ? categories.split(',') : ['parking'];
    const results = {};
    
    // ParkHub Parking (Simple implementation: just return all locations, frontend filters by distance)
    if (cats.includes('parking')) {
      results.parking = locations; 
    }
    
    if (cats.includes('ev')) {
      results.evStations = evStations;
    }
    
    const overpassCats = [];
    if (cats.includes('restaurants')) overpassCats.push('node["amenity"~"restaurant|cafe|fast_food"]');
    if (cats.includes('hotels')) overpassCats.push('node["tourism"~"hotel|motel|guest_house|hostel|resort|apartment"]');
    if (cats.includes('hospitals')) overpassCats.push('node["amenity"~"hospital|clinic"]');
    if (cats.includes('atms')) overpassCats.push('node["amenity"="atm"]');
    if (cats.includes('restrooms')) overpassCats.push('node["amenity"="toilets"]');
    if (cats.includes('mechanic')) overpassCats.push('node["shop"="car_repair"]');
    if (cats.includes('carwash')) overpassCats.push('node["amenity"="car_wash"]');
    if (cats.includes('fuel')) overpassCats.push('node["amenity"="fuel"]');

    if (overpassCats.length > 0) {
      // Build a union of around clauses for all waypoints (OR logic)
      let combinedQueries = '';
      overpassCats.forEach(cat => {
        pts.forEach(pt => {
          combinedQueries += `  ${cat}(around:${radius},${pt.lat},${pt.lng});\n`;
        });
      });
      
      const overpassQuery = `
        [out:json][timeout:25];
        (
${combinedQueries}
        );
        out body;
        >;
        out skel qt;
      `;
      try {
        const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: overpassQuery
        });
        const overpassData = await overpassRes.json();
        const externalPois = [];
        overpassData.elements.forEach(el => {
          if (el.type === 'node' && el.tags) {
            let type = 'unknown';
            const tags = el.tags;
            if (tags.tourism && tags.tourism.match(/hotel|motel|guest_house|hostel|resort|apartment/)) type = 'hotels';
            else if (tags.amenity && tags.amenity.match(/restaurant|cafe|fast_food/)) type = 'restaurants';
            else if (tags.amenity && tags.amenity.match(/hospital|clinic/)) type = 'hospitals';
            else if (tags.amenity === 'atm') type = 'atms';
            else if (tags.amenity === 'toilets') type = 'restrooms';
            else if (tags.shop === 'car_repair') type = 'mechanic';
            else if (tags.amenity === 'car_wash') type = 'carwash';
            else if (tags.amenity === 'fuel') type = 'fuel';
            
            externalPois.push({
              id: el.id,
              lat: el.lat,
              lng: el.lon,
              name: el.tags.name || `Unnamed ${type}`,
              poiType: type,
              ...el.tags
            });
          }
        });
        results.external = externalPois;
      } catch (e) {
        console.error("Overpass error:", e);
      }
    }
    
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch nearby" });
  }
});

app.get('/api/trip/history', (req, res) => {
  const { userId } = req.query;
  const history = trip_history.filter(t => t.userId === userId).slice(0, 20);
  const saved = saved_trips.filter(t => t.userId === userId);
  res.json({ history, saved });
});

app.post('/api/trip/save', (req, res) => {
  const trip = { id: "trip-" + Date.now(), ...req.body, timestamp: new Date().toISOString() };
  saved_trips.unshift(trip);
  res.json(trip);
});

app.delete('/api/trip/:id', (req, res) => {
  saved_trips = saved_trips.filter(t => t.id !== req.params.id);
  res.json({ success: true });
});

app.get('/api/trip/preferences', (req, res) => {
  const pref = trip_preferences.find(p => p.userId === req.query.userId) || { vehicleType: 'Petrol', evDetails: null };
  res.json(pref);
});

app.post('/api/trip/preferences', (req, res) => {
  const { userId, vehicleType, evDetails } = req.body;
  const idx = trip_preferences.findIndex(p => p.userId === userId);
  const newPref = { userId, vehicleType, evDetails };
  if (idx > -1) trip_preferences[idx] = newPref;
  else trip_preferences.push(newPref);
  res.json(newPref);
});

// --- Dynamic Nationwide API with Firestore Caching ---

function getCacheKey(s: number, w: number, n: number, e: number) {
  return `${s.toFixed(2)}_${w.toFixed(2)}_${n.toFixed(2)}_${e.toFixed(2)}`;
}

async function fetchWithRetry(url: string, options: any, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios({ url, timeout: 10000, ...options });
      return res.data;
    } catch (err: any) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // exponential backoff
    }
  }
}

app.get('/api/fuel', async (req, res) => {
  try {
    const { south, west, north, east } = req.query;
    if (!south || !west || !north || !east) return res.status(400).json({ error: "Missing bounds" });

    const s = parseFloat(south as string); const w = parseFloat(west as string);
    const n = parseFloat(north as string); const e = parseFloat(east as string);
    const cacheKey = getCacheKey(s, w, n, e);
    const cacheRef = db.collection('fuel_cache').doc(cacheKey);

    const doc = await cacheRef.get();
    if (doc.exists) {
      const data = doc.data();
      if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        return res.json(data.stations); // return cached
      }
    }

    const overpassQuery = `[out:json][timeout:10];(node["amenity"="fuel"](${s},${w},${n},${e});way["amenity"="fuel"](${s},${w},${n},${e});relation["amenity"="fuel"](${s},${w},${n},${e}););out body;>;out skel qt;`;
    const opData = await fetchWithRetry('https://overpass-api.de/api/interpreter', { method: 'POST', data: overpassQuery });
    
    const stations: any[] = [];
    const seen = new Set();
    
    opData.elements?.forEach((el: any) => {
      if (el.tags && el.tags.amenity === 'fuel') {
        const lat = el.lat || (el.center && el.center.lat);
        const lon = el.lon || (el.center && el.center.lon);
        if (!lat || !lon) return;

        let brand = el.tags.brand || el.tags.operator || 'Unknown';
        const bLower = brand.toLowerCase();
        if (bLower.includes('indianoil') || bLower.includes('ioc')) brand = 'IndianOil';
        else if (bLower.includes('hpcl') || bLower.includes('hindustan')) brand = 'HPCL';
        else if (bLower.includes('bpcl') || bLower.includes('bharat')) brand = 'BPCL';
        else if (bLower.includes('shell')) brand = 'Shell';
        else if (bLower.includes('reliance') || bLower.includes('jio')) brand = 'Reliance';
        else if (bLower.includes('nayara') || bLower.includes('essar')) brand = 'Nayara';

        const id = `osm-${el.id}`;
        if (!seen.has(id)) {
          seen.add(id);
          stations.push({
            id, name: el.tags.name || `${brand} Fuel Station`, brand,
            latitude: lat, longitude: lon, address: el.tags['addr:full'] || el.tags['addr:street'] || 'Address unavailable',
            opening_hours: el.tags.opening_hours || '24/7', phone: el.tags.phone || el.tags['contact:phone'] || 'N/A'
          });
        }
      }
    });

    await cacheRef.set({ timestamp: Date.now(), stations });
    res.json(stations);
  } catch (error) {
    console.error("Fuel API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/api/ev', async (req, res) => {
  try {
    const { south, west, north, east } = req.query;
    if (!south || !west || !north || !east) return res.status(400).json({ error: "Missing bounds" });

    const s = parseFloat(south as string); const w = parseFloat(west as string);
    const n = parseFloat(north as string); const e = parseFloat(east as string);
    const cacheKey = getCacheKey(s, w, n, e);
    const cacheRef = db.collection('ev_cache').doc(cacheKey);

    const doc = await cacheRef.get();
    if (doc.exists) {
      const data = doc.data();
      if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        return res.json(data.stations);
      }
    }

    const ocmData = await fetchWithRetry(`https://api.openchargemap.io/v3/poi/?output=json&boundingbox=(${s},${w}),(${n},${e})&maxresults=100`, { 
      method: 'GET', headers: { 'User-Agent': 'ParkHub-Bot' } 
    });
    
    const stations: any[] = [];
    const seen = new Set();

    if (Array.isArray(ocmData)) {
      ocmData.forEach(poi => {
        const id = `ocm-${poi.ID}`;
        if (!seen.has(id)) {
          seen.add(id);
          stations.push({
            id, stationName: poi.AddressInfo.Title || 'EV Charging Station',
            operator: poi.OperatorInfo?.Title || 'Unknown', latitude: poi.AddressInfo.Latitude, longitude: poi.AddressInfo.Longitude,
            address: `${poi.AddressInfo.AddressLine1 || ''} ${poi.AddressInfo.Town || ''}`.trim() || 'Address unavailable',
            connectorTypes: (poi.Connections || []).map((c: any) => c.ConnectionType?.Title || 'Unknown'),
            powerKW: (poi.Connections || []).map((c: any) => c.PowerKW || 50),
            phone: poi.AddressInfo.ContactTelephone1 || 'N/A', website: poi.AddressInfo.RelatedURL || 'N/A'
          });
        }
      });
    }

    await cacheRef.set({ timestamp: Date.now(), stations });
    res.json(stations);
  } catch (error) {
    console.error("EV API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start Server
app.listen(PORT, () => {
  locations.forEach(loc => recalcSlots(loc.id));
  console.log(`🚀 ParkHub Backend running at http://localhost:${PORT}`);
});
