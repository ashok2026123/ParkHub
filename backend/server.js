import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import Razorpay from 'razorpay';

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_T71PJdC3zXI1H8',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'i4AoBu4S0Vt6vNStcOV3bqq6'
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

            owners[ownerIndex].walletBalance = (owners[ownerIndex].walletBalance || 0) - platformFee;
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
