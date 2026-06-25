import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { useTranslation } from './context/LangContext';
import { 
  INITIAL_LOCATIONS, 
  INITIAL_BOOKINGS, 
  INITIAL_REVIEWS, 
  INITIAL_COMPLAINTS,
  INITIAL_COUPONS 
} from './services/mockDb';
import { 
  MapPin, Search, Navigation, Filter, Clock, DollarSign, Bike, Car, Plus, 
  Trash2, CheckCircle, XCircle, Star, Share2, Compass, Shield, AlertCircle, 
  LogOut, Globe, Calendar, Users, Percent, Activity, Camera, FileText, 
  RefreshCw, TrendingUp, Check, QrCode, ArrowRight, Smartphone, HelpCircle,
  Lock, Settings, Download, Bell, UserCheck, UserX, FileSpreadsheet, AlertTriangle
} from 'lucide-react';

export default function App() {
  const { user, login, loginWithCredentials, register, logout, toggleFavorite } = useAuth();
  const { language, setLanguage, toggleLanguage, t } = useTranslation();

  const API_URL = 'http://localhost:5000/api';

  // State Management mimicking Firestore sync
  const [locations, setLocations] = useState(INITIAL_LOCATIONS);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);
  const [coupons, setCoupons] = useState(INITIAL_COUPONS);

  // Custom Alert and Confirm Modal State
  const [customAlert, setCustomAlert] = useState(null); 
  const [customConfirm, setCustomConfirm] = useState(null); 

  const [editingLocId, setEditingLocId] = useState(null);
  const [editHourlyRate, setEditHourlyRate] = useState('');
  const [editDailyRate, setEditDailyRate] = useState(''); 

  const mapRef = useRef(null);
  const leafletMapInstance = useRef(null);
  const markersGroupRef = useRef(null);
  const userLocationMarkerRef = useRef(null);

  const showAlert = (message, title = "Notification") => {
    setCustomAlert({ title, message });
  };

  const showConfirm = (message, onConfirm, title = "Confirmation") => {
    setCustomConfirm({ title, message, onConfirm });
  };

  // Sync state from backend in real-time
  useEffect(() => {
    const fetchData = async () => {
      try {
        const locRes = await fetch(`${API_URL}/locations`);
        if (locRes.ok) setLocations(await locRes.json());
      } catch (err) { console.error("Error fetching locations:", err); }

      try {
        const bookRes = await fetch(`${API_URL}/bookings`);
        if (bookRes.ok) setBookings(await bookRes.json());
      } catch (err) { console.error("Error fetching bookings:", err); }

      try {
        const revRes = await fetch(`${API_URL}/reviews`);
        if (revRes.ok) setReviews(await revRes.json());
      } catch (err) { console.error("Error fetching reviews:", err); }

      try {
        const compRes = await fetch(`${API_URL}/complaints`);
        if (compRes.ok) setComplaints(await compRes.json());
      } catch (err) { console.error("Error fetching complaints:", err); }

      try {
        const settingsRes = await fetch(`${API_URL}/settings`);
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setCommissionPercentage(data.commissionPercentage);
          setBookingGracePeriod(data.bookingGracePeriod);
        }
      } catch (err) { console.error("Error fetching settings:", err); }

      try {
        const auditRes = await fetch(`${API_URL}/audit-logs`);
        if (auditRes.ok) setAuditLogs(await auditRes.json());
      } catch (err) { console.error("Error fetching audit logs:", err); }

      try {
        const bcRes = await fetch(`${API_URL}/broadcasts`);
        if (bcRes.ok) setBroadcastLogs(await bcRes.json());
      } catch (err) { console.error("Error fetching broadcasts:", err); }
    };

    fetchData();

    // Poll for updates (e.g. available slots fluctuating on server, new bookings, complaints)
    const interval = setInterval(async () => {
      try {
        const locRes = await fetch(`${API_URL}/locations`);
        if (locRes.ok) setLocations(await locRes.json());
      } catch (err) { console.error("Error polling locations:", err); }
      
      try {
        const bookRes = await fetch(`${API_URL}/bookings`);
        if (bookRes.ok) setBookings(await bookRes.json());
      } catch (err) { console.error("Error polling bookings:", err); }

      try {
        const compRes = await fetch(`${API_URL}/complaints`);
        if (compRes.ok) setComplaints(await compRes.json());
      } catch (err) { console.error("Error polling complaints:", err); }

      try {
        const auditRes = await fetch(`${API_URL}/audit-logs`);
        if (auditRes.ok) setAuditLogs(await auditRes.json());
      } catch (err) { console.error("Error polling audit logs:", err); }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // UI Navigation states
  const [currentTab, setCurrentTab] = useState('home'); // home | bookings | profile | dashboard | admin_...
  const [roleMode, setRoleMode] = useState(user ? user.role : 'customer'); // admin | owner | customer



  // Admin Dashboard sub-states
  const [selectedAdminUser, setSelectedAdminUser] = useState(null);
  const [selectedAdminOwner, setSelectedAdminOwner] = useState(null);
  const [selectedAdminParking, setSelectedAdminParking] = useState(null);
  const [commissionPercentage, setCommissionPercentage] = useState(10);
  const [bookingGracePeriod, setBookingGracePeriod] = useState(15);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState('announcement');
  const [broadcastLogs, setBroadcastLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Admin Entities state mimicking Firestore collections
  const [adminUsers, setAdminUsers] = useState([
    { uid: 'customer-789', name: 'Karthik Raja', email: 'karthik@mymail.com', phone: '+91 88833 99999', role: 'customer', registeredAt: '2026-01-15T10:00:00Z', bookingsCount: 14, status: 'active' },
    { uid: 'customer-222', name: 'Meena Sundaram', email: 'meena.s@outlook.com', phone: '+91 95000 88888', role: 'customer', registeredAt: '2026-02-18T14:30:00Z', bookingsCount: 8, status: 'active' },
    { uid: 'customer-333', name: 'Anand Selvam', email: 'anand.selvam@gmail.com', phone: '+91 90033 11111', role: 'customer', registeredAt: '2026-03-05T09:15:00Z', bookingsCount: 22, status: 'active' },
    { uid: 'customer-444', name: 'Priya Dharshini', email: 'priya.d@yahoo.com', phone: '+91 94455 22222', role: 'customer', registeredAt: '2026-04-12T11:45:00Z', bookingsCount: 5, status: 'blocked' }
  ]);

  const [adminOwners, setAdminOwners] = useState([
    { uid: 'owner-456', name: 'Suresh Perumal', email: 'suresh@spotowner.com', phone: '+91 94440 12345', role: 'owner', registeredAt: '2026-01-10T08:00:00Z', locationsCount: 3, earnings: 12450, verified: true, status: 'active' },
    { uid: 'owner-101', name: 'Arun Moorthi', email: 'arun@marinaowner.in', phone: '+91 98400 55555', role: 'owner', registeredAt: '2026-02-20T16:20:00Z', locationsCount: 1, earnings: 4500, verified: true, status: 'active' },
    { uid: 'owner-999', name: 'Venkatesh Prasad', email: 'venky@vpkparking.com', phone: '+91 93822 44444', role: 'owner', registeredAt: '2026-03-15T12:00:00Z', locationsCount: 1, earnings: 6200, verified: false, status: 'suspended' }
  ]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all'); // all | two-wheeler | four-wheeler
  const [priceSort, setPriceSort] = useState('default'); // default | low-high
  const [cctvFilter, setCctvFilter] = useState(false);

  // Booking states
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [bookingVehicleNo, setBookingVehicleNo] = useState('');
  const [bookingVehicleType, setBookingVehicleType] = useState('four-wheeler');
  const [bookingDuration, setBookingDuration] = useState(2);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [showUPIScreen, setShowUPIScreen] = useState(false);
  const [upiPin, setUpiPin] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currentActiveBooking, setCurrentActiveBooking] = useState(null);

  // Owner form states
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocDesc, setNewLocDesc] = useState('');
  const [newLocHourly, setNewLocHourly] = useState('');
  const [newLocDaily, setNewLocDaily] = useState('');
  const [newLoc2WSlots, setNewLoc2WSlots] = useState('');
  const [newLoc4WSlots, setNewLoc4WSlots] = useState('');
  const [newLocCCTV, setNewLocCCTV] = useState(true);
  const [newLocLat, setNewLocLat] = useState('');
  const [newLocLng, setNewLocLng] = useState('');

  // Review & Complaint form states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');

  // Sync roleMode with authenticated user
  useEffect(() => {
    if (user) {
      setRoleMode(user.role);
      // Switch default tab on role change
      if (user.role === 'admin') {
        setCurrentTab('admin_overview');
      } else if (user.role === 'owner') {
        setCurrentTab('dashboard');
      } else {
        setCurrentTab('home');
      }
    }
  }, [user]);

  // Coordinates mapping for Interactive Map view
  const mapCenter = { lat: 13.0827, lng: 80.2707 } // Centered in Chennai

  // Handlers
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      showAlert("Geolocation is not supported by your browser.", "Error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (leafletMapInstance.current) {
          leafletMapInstance.current.setView([latitude, longitude], 14);

          // Add or update current location marker
          const L = window.L;
          if (L) {
            if (userLocationMarkerRef.current) {
              userLocationMarkerRef.current.setLatLng([latitude, longitude]);
            } else {
              const pulseIcon = L.divIcon({
                html: `
                  <div style="position: relative; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">
                    <div style="position: absolute; width: 14px; height: 14px; background: #2979FF; border: 2px solid #FFF; border-radius: 50%; box-shadow: 0 0 8px rgba(0,0,0,0.5); z-index: 2;"></div>
                    <div style="position: absolute; width: 32px; height: 32px; background: rgba(41, 121, 255, 0.4); border-radius: 50%; animation: pulse 2s infinite; z-index: 1;"></div>
                  </div>
                `,
                className: 'user-loc-pulse',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              });
              userLocationMarkerRef.current = L.marker([latitude, longitude], { icon: pulseIcon })
                .addTo(leafletMapInstance.current)
                .bindPopup("You are here");
            }
          }
        }
      },
      (error) => {
        console.error("Error getting user location:", error);
        showAlert("Unable to retrieve your location. Make sure GPS/location services are enabled.", "Location Error");
      }
    );
  };

  const handleApplyCoupon = () => {
    const code = appliedCoupon.trim().toUpperCase();
    const c = coupons.find(x => x.code === code && x.active);
    if (c) {
      setCouponDiscount(c.discountPercent);
      setCouponError('');
    } else {
      setCouponError('Invalid Coupon Code');
      setCouponDiscount(0);
    }
  };

  const startBookingFlow = (loc) => {
    setSelectedLocation(loc);
    setBookingVehicleNo('');
    setAppliedCoupon('');
    setCouponDiscount(0);
    setCouponError('');
  };

  const handlePayAndBook = () => {
    if (!bookingVehicleNo.trim()) {
      showAlert("Please enter vehicle number!", "Missing Information");
      return;
    }
    setShowUPIScreen(true);
  };

  const handleConfirmUPIPayment = () => {
    if (upiPin.length < 4) {
      showAlert("Please enter a valid 4-digit UPI PIN", "Security Verification");
      return;
    }
    setIsProcessingPayment(true);
    setTimeout(() => {
      // Calculate amount
      const basePrice = bookingVehicleType === 'four-wheeler' 
        ? selectedLocation.rates.hourly * bookingDuration
        : (selectedLocation.rates.hourly * 0.6) * bookingDuration; // 2W is cheaper
      const discounted = basePrice * (1 - couponDiscount / 100);
      const totalAmount = Math.max(0, Math.round(discounted));

      // Create booking record
      const newBooking = {
        userId: user ? user.uid : "guest-user",
        locationId: selectedLocation.id,
        vehicleNumber: bookingVehicleNo.toUpperCase(),
        vehicleType: bookingVehicleType,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + bookingDuration * 3600000).toISOString(),
        status: "active",
        totalAmount,
        paymentId: "pay_UPI" + Math.floor(Math.random()*10000000),
        qrCodeData: `QR_PE_${selectedLocation.id}_${bookingVehicleNo.toUpperCase()}`
      };

      fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking)
      })
      .then(res => res.json())
      .then(savedBooking => {
        setBookings(prev => [savedBooking, ...prev]);
        setCurrentActiveBooking(savedBooking);
        
        // Update locations state locally
        setLocations(prev => prev.map(loc => {
          if (loc.id === selectedLocation.id) {
            const wType = bookingVehicleType === 'four-wheeler' ? 'fourWheeler' : 'twoWheeler';
            return {
              ...loc,
              availableSlots: {
                ...loc.availableSlots,
                [wType]: Math.max(0, loc.availableSlots[wType] - 1)
              }
            };
          }
          return loc;
        }));
        
        setIsProcessingPayment(false);
        setShowUPIScreen(false);
        setUpiPin('');
        setSelectedLocation(null);
        setCurrentTab('bookings');

        addAuditLog("System", `New booking processed: ${savedBooking.id} (${savedBooking.vehicleNumber})`, 'system');
      })
      .catch(err => {
        console.error("Error creating booking:", err);
        setIsProcessingPayment(false);
      });
    }, 2000);
  };

  const addAuditLog = (adminName, action, type) => {
    const newLog = {
      admin: adminName,
      action,
      type
    };

    fetch(`${API_URL}/audit-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    })
    .then(res => res.json())
    .then(savedLog => {
      setAuditLogs(prev => [savedLog, ...prev]);
    })
    .catch(err => console.error("Error adding audit log:", err));
  };

  const handleCancelBooking = (bookingId) => {
    showConfirm("Are you sure you want to cancel this booking?", () => {
      fetch(`${API_URL}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      })
      .then(res => res.json())
      .then(updatedBooking => {
        setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));
        const locId = updatedBooking.locationId;
        setLocations(locs => locs.map(loc => {
          if (loc.id === locId) {
            const wType = updatedBooking.vehicleType === 'four-wheeler' ? 'fourWheeler' : 'twoWheeler';
            return {
              ...loc,
              availableSlots: {
                ...loc.availableSlots,
                [wType]: Math.min(loc.totalSlots[wType], loc.availableSlots[wType] + 1)
              }
            };
          }
          return loc;
        }));
        addAuditLog(user ? user.name : "Karthik Raja", `Cancelled booking ${bookingId}`, 'booking');
      })
      .catch(err => console.error("Error cancelling booking:", err));
    }, "Cancel Booking");
  };

  const handleAddReview = (locationId) => {
    if (!reviewComment.trim()) return;
    const newReview = {
      userId: user ? user.uid : "anonymous",
      userName: user ? user.name : "Anonymous User",
      locationId,
      rating: reviewRating,
      comment: reviewComment
    };

    fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReview)
    })
    .then(res => res.json())
    .then(savedReview => {
      setReviews(prev => [savedReview, ...prev]);
      fetch(`${API_URL}/locations`)
        .then(res => res.json())
        .then(data => setLocations(data))
        .catch(err => console.error("Error fetching locations:", err));
    })
    .catch(err => console.error("Error adding review:", err));

    setReviewComment('');
  };

  const handleAddLocation = (e) => {
    e.preventDefault();
    if (!newLocName || !newLocAddress) return;
    const newLoc = {
      ownerId: user ? user.uid : "owner-456",
      name: newLocName,
      address: newLocAddress,
      latitude: parseFloat(newLocLat) || 13.04 + (Math.random() - 0.5) * 0.05,
      longitude: parseFloat(newLocLng) || 80.24 + (Math.random() - 0.5) * 0.05,
      description: newLocDesc,
      rates: {
        hourly: parseFloat(newLocHourly) || 30,
        daily: parseFloat(newLocDaily) || 200
      },
      totalSlots: {
        twoWheeler: parseInt(newLoc2WSlots) || 40,
        fourWheeler: parseInt(newLoc4WSlots) || 20
      },
      availableSlots: {
        twoWheeler: parseInt(newLoc2WSlots) || 40,
        fourWheeler: parseInt(newLoc4WSlots) || 20
      },
      images: ["https://images.unsplash.com/photo-1506521788723-85811181d4db?auto=format&fit=crop&q=80&w=400"],
      isApproved: false,
      cctvEnabled: newLocCCTV
    };

    fetch(`${API_URL}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLoc)
    })
    .then(res => res.json())
    .then(savedLoc => {
      setLocations(prev => [...prev, savedLoc]);
      showAlert("Parking location listed successfully and is pending admin approval.", "Listing Submitted");
      setNewLocName('');
      setNewLocAddress('');
      setNewLocDesc('');
      setNewLocHourly('');
      setNewLocDaily('');
      setNewLoc2WSlots('');
      setNewLoc4WSlots('');
      setNewLocLat('');
      setNewLocLng('');
    })
    .catch(err => console.error("Error creating location:", err));
  };

  const handleApproveLocation = (id) => {
    const loc = locations.find(l => l.id === id);
    fetch(`${API_URL}/locations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isApproved: true })
    })
    .then(res => res.json())
    .then(updatedLoc => {
      setLocations(prev => prev.map(l => l.id === id ? updatedLoc : l));
      addAuditLog(user ? user.name : "Admin", `Approved parking location "${loc ? loc.name : id}"`, 'approval');
    })
    .catch(err => console.error("Error approving location:", err));
  };

  const handleSuspendLocation = (id, suspendState) => {
    fetch(`${API_URL}/locations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isApproved: !suspendState })
    })
    .then(res => res.json())
    .then(updatedLoc => {
      setLocations(prev => prev.map(l => l.id === id ? updatedLoc : l));
      addAuditLog(user ? user.name : "Admin", `${suspendState ? 'Suspended' : 'Unsuspended'} parking location ID: ${id}`, 'parking');
    })
    .catch(err => console.error("Error suspending location:", err));
  };

  const handleDeleteLocation = (id) => {
    showConfirm("Are you sure you want to delete this parking location permanently?", () => {
      fetch(`${API_URL}/locations/${id}`, {
        method: 'DELETE'
      })
      .then(res => {
        if (res.ok) {
          setLocations(prev => prev.filter(loc => loc.id !== id));
          addAuditLog(user ? user.name : "Admin", `Deleted parking location ID: ${id}`, 'parking');
          showAlert("Parking location deleted successfully.", "Listing Deleted");
        }
      })
      .catch(err => console.error("Error deleting location:", err));
    }, "Confirm Delete");
  };

  const handleStartEditRates = (loc) => {
    setEditingLocId(loc.id);
    setEditHourlyRate(loc.rates.hourly);
    setEditDailyRate(loc.rates.daily);
  };

  const handleSaveRates = (id) => {
    const hourly = parseFloat(editHourlyRate);
    const daily = parseFloat(editDailyRate);
    if (isNaN(hourly) || isNaN(daily)) {
      showAlert("Please enter valid rates.", "Invalid Input");
      return;
    }

    fetch(`${API_URL}/locations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rates: { hourly, daily }
      })
    })
    .then(res => res.json())
    .then(updatedLoc => {
      setLocations(prev => prev.map(loc => loc.id === id ? updatedLoc : loc));
      addAuditLog(user ? user.name : "Admin", `Updated rates for location ID: ${id} to Hourly: ₹${hourly}, Daily: ₹${daily}`, 'parking');
      setEditingLocId(null);
      showAlert("Tariff rates updated successfully.", "Rates Saved");
    })
    .catch(err => console.error("Error updating location rates:", err));
  };

  const handleAddComplaint = (e) => {
    e.preventDefault();
    if (!complaintSubject || !complaintDesc) return;
    const newComp = {
      userId: user ? user.uid : "customer-789",
      userName: user ? user.name : "Karthik Raja",
      subject: complaintSubject,
      description: complaintDesc
    };

    fetch(`${API_URL}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newComp)
    })
    .then(res => res.json())
    .then(savedComp => {
      setComplaints(prev => [savedComp, ...prev]);
      showAlert("Complaint lodged successfully! Our admin team will investigate.", "Complaint Lodged");
      setComplaintSubject('');
      setComplaintDesc('');
    })
    .catch(err => console.error("Error creating complaint:", err));
  };

  const handleResolveComplaint = (id) => {
    fetch(`${API_URL}/complaints/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: "resolved" })
    })
    .then(res => res.json())
    .then(updatedComplaint => {
      setComplaints(prev => prev.map(c => c.id === id ? updatedComplaint : c));
      addAuditLog(user ? user.name : "Admin", `Resolved complaint ticket ID: ${id}`, 'complaint');
    })
    .catch(err => console.error("Error resolving complaint:", err));
  };

  const handleManualOccupancy = (locId, type, increase) => {
    const loc = locations.find(l => l.id === locId);
    if (!loc) return;
    
    const currentVal = loc.availableSlots[type];
    const maxVal = loc.totalSlots[type];
    let newVal = increase ? currentVal + 1 : currentVal - 1;
    newVal = Math.max(0, Math.min(maxVal, newVal));

    const updatedSlots = {
      ...loc.availableSlots,
      [type]: newVal
    };

    fetch(`${API_URL}/locations/${locId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availableSlots: updatedSlots })
    })
    .then(res => res.json())
    .then(updatedLoc => {
      setLocations(prev => prev.map(l => l.id === locId ? updatedLoc : l));
      addAuditLog(user ? user.name : "Admin", `Manual occupancy gate update at "${loc.name}": Available ${type} slots set to ${newVal}/${maxVal}`, 'parking');
    })
    .catch(err => console.error("Error updating manual occupancy:", err));
  };

  // Admin actions
  const handleToggleUserBlock = (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    setAdminUsers(prev => prev.map(u => u.uid === userId ? { ...u, status: newStatus } : u));
    addAuditLog(user ? user.name : "Admin", `${newStatus === 'blocked' ? 'Blocked' : 'Unblocked'} user uid: ${userId}`, 'security');
  };

  const handleToggleOwnerSuspend = (ownerId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setAdminOwners(prev => prev.map(o => o.uid === ownerId ? { ...o, status: newStatus } : o));
    addAuditLog(user ? user.name : "Admin", `${newStatus === 'suspended' ? 'Suspended' : 'Activated'} owner uid: ${ownerId}`, 'security');
  };

  const handleVerifyOwner = (ownerId) => {
    setAdminOwners(prev => prev.map(o => o.uid === ownerId ? { ...o, verified: true } : o));
    addAuditLog(user ? user.name : "Admin", `Verified GSTIN/documents for owner uid: ${ownerId}`, 'approval');
  };

  const handleSendBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    
    const newLog = {
      title: broadcastTitle,
      body: broadcastMessage,
      type: broadcastType,
      recipients: Math.floor(Math.random() * 200) + 100
    };

    fetch(`${API_URL}/broadcasts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    })
    .then(res => res.json())
    .then(savedBroadcast => {
      setBroadcastLogs(prev => [savedBroadcast, ...prev]);
      addAuditLog(user ? user.name : "Admin", `Sent system broadcast: "${broadcastTitle}" (${broadcastType})`, 'notification');
      showAlert(`Broadcast notification successfully dispatched to ${savedBroadcast.recipients} users in Chennai!`, "Broadcast Sent");
      setBroadcastTitle('');
      setBroadcastMessage('');
    })
    .catch(err => console.error("Error sending broadcast:", err));
  };

  // Export report simulation generating actual client file downloads
  const handleExportData = (format, type) => {
    let headers = '';
    let rows = '';
    
    if (type === 'revenue') {
      headers = 'Booking ID,User ID,Location ID,Vehicle,Date,Amount,Commission (10%)\n';
      rows = bookings.map(b => `${b.id},${b.userId},${b.locationId},${b.vehicleNumber},${b.startTime},₹${b.totalAmount},₹${(b.totalAmount * 0.1).toFixed(0)}`).join('\n');
    } else {
      headers = 'Location ID,Location Name,Address,Total Slots,Occupancy Rate,Rates (Hourly)\n';
      rows = locations.map(l => `${l.id},${l.name},"${l.address}",${l.totalSlots.fourWheeler + l.totalSlots.twoWheeler},${Math.round(100 - ((l.availableSlots.fourWheeler + l.availableSlots.twoWheeler)/(l.totalSlots.fourWheeler + l.totalSlots.twoWheeler))*100)}%,₹${l.rates.hourly}`).join('\n');
    }

    const content = headers + rows;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `parkeasy_${type}_report_${new Date().toISOString().slice(0,10)}.${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog(user ? user.name : "Admin", `Exported ${type} reports as ${format.toUpperCase()}`, 'settings');
  };

  // Filter and Search calculations
  const filteredLocations = locations.filter(loc => {
    // Search query matching
    const matchesSearch = searchQuery === '' || 
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Approval check (only approved spots for customers)
    const matchesApproval = roleMode === 'admin' || loc.isApproved;

    // Vehicle Type check
    const matchesVehicle = vehicleFilter === 'all' || 
      (vehicleFilter === 'two-wheeler' && loc.totalSlots.twoWheeler > 0) ||
      (vehicleFilter === 'four-wheeler' && loc.totalSlots.fourWheeler > 0);

    // CCTV check
    const matchesCCTV = !cctvFilter || loc.cctvEnabled;

    return matchesSearch && matchesApproval && matchesVehicle && matchesCCTV;
  });

  const sortedLocations = [...filteredLocations].sort((a, b) => {
    if (priceSort === 'low-high') {
      return a.rates.hourly - b.rates.hourly;
    }
    return 0; // Default ordering
  });

  // Analytics Calculations
  const ownerLocations = locations.filter(l => l.ownerId === (user ? user.uid : 'owner-456'));
  const ownerLocationIds = ownerLocations.map(l => l.id);
  const ownerBookings = bookings.filter(b => ownerLocationIds.includes(b.locationId));
  const ownerEarnings = ownerBookings.reduce((sum, b) => b.status === 'completed' || b.status === 'active' ? sum + b.totalAmount : sum, 0);

  const adminApprovedLocs = locations.filter(l => l.isApproved).length;
  const adminPendingLocs = locations.filter(l => !l.isApproved).length;
  const adminPlatformRevenue = bookings.reduce((sum, b) => b.status === 'completed' || b.status === 'active' ? sum + b.totalAmount * (commissionPercentage/100) : sum, 0);

  // Initialize and clean up Leaflet Map
  useEffect(() => {
    const L = window.L;
    if (!L || !mapRef.current) return;

    const map = L.map(mapRef.current).setView([13.0827, 80.2707], 12);
    leafletMapInstance.current = map;

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    });

    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri'
    });

    osm.addTo(map);

    const baseMaps = {
      "Road Map": osm,
      "Satellite View": satellite
    };

    L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);
    markersGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      leafletMapInstance.current = null;
      markersGroupRef.current = null;
      userLocationMarkerRef.current = null;
    };
  }, [currentTab]); // Re-run whenever tab changes so it mounts on the new div

  // Sync markers when sortedLocations, selectedLocation, or currentTab changes
  useEffect(() => {
    const L = window.L;
    if (!L || !leafletMapInstance.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    sortedLocations.forEach(loc => {
      const isSelected = selectedLocation && selectedLocation.id === loc.id;
      const slotsAvailable = loc.availableSlots.fourWheeler + loc.availableSlots.twoWheeler;
      const totalSlots = loc.totalSlots.fourWheeler + loc.totalSlots.twoWheeler;
      let pinColor = '#00E676'; // Green = Available
      if (slotsAvailable === 0) {
        pinColor = '#FF1744'; // Red = Full
      } else if (slotsAvailable <= 5 || slotsAvailable <= totalSlots * 0.2) {
        pinColor = '#FF9100'; // Orange = Limited
      }
      
      const borderCol = isSelected ? '#FFFFFF' : '#000000';
      const scale = isSelected ? 'scale(1.2)' : 'scale(1)';

      const iconHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; transform: ${scale}; transition: all 0.2s;">
          <div style="background: ${isSelected ? '#FFF' : '#1e1e1e'}; color: ${isSelected ? '#000' : '#FFF'}; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; border: 1px solid ${pinColor}; margin-bottom: 2px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            ₹${loc.rates.hourly}/hr
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="${pinColor}" stroke="${borderCol}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3" fill="${isSelected ? '#000' : '#FFF'}"></circle>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-map-marker',
        iconSize: [40, 50],
        iconAnchor: [20, 50]
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon });
      marker.on('click', () => {
        setSelectedLocation(loc);
      });
      marker.addTo(markersGroupRef.current);

      if (isSelected) {
        leafletMapInstance.current.panTo([loc.latitude, loc.longitude]);
      }
    });
  }, [sortedLocations, selectedLocation, currentTab]);

  if (!user) {
    return <LoginScreen onLogin={(emailOrPhone, password) => loginWithCredentials(emailOrPhone, password)} />;
  }

  return (
    <div className="dashboard-grid">
      {/* 1. Sidebar Navigation (Adapts if in admin roleMode) */}
      <aside className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid var(--border-color)', borderRadius: '0' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ background: 'var(--primary)', color: '#000', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Compass size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '800', tracking: '-0.5px' }}>{t('appName')}</h1>
              <p style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase' }}>Chennai Metro</p>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {roleMode === 'admin' ? (
              // ADMIN CONTROL CENTER NAVIGATION OPTIONS
              <>
                <div style={{ padding: '4px 8px', fontSize: '9px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', tracking: '1.5px', marginBottom: '4px' }}>Admin Controls</div>
                <button 
                  onClick={() => setCurrentTab('admin_overview')} 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', borderRadius: '6px', border: 'none', background: currentTab === 'admin_overview' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'admin_overview' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px'
                  }}
                >
                  <Activity size={16} />
                  <span>Overview</span>
                </button>
                <button 
                  onClick={() => setCurrentTab('admin_analytics')} 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', borderRadius: '6px', border: 'none', background: currentTab === 'admin_analytics' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'admin_analytics' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px'
                  }}
                >
                  <TrendingUp size={16} />
                  <span>Analytics Console</span>
                </button>
                <button 
                  onClick={() => setCurrentTab('admin_parking')} 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', borderRadius: '6px', border: 'none', background: currentTab === 'admin_parking' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'admin_parking' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px'
                  }}
                >
                  <MapPin size={16} />
                  <span>Parking Locations</span>
                </button>
                <button 
                  onClick={() => setCurrentTab('admin_users')} 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', borderRadius: '6px', border: 'none', background: currentTab === 'admin_users' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'admin_users' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px'
                  }}
                >
                  <Users size={16} />
                  <span>Customers</span>
                </button>
                <button 
                  onClick={() => setCurrentTab('admin_owners')} 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', borderRadius: '6px', border: 'none', background: currentTab === 'admin_owners' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'admin_owners' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px'
                  }}
                >
                  <Shield size={16} />
                  <span>Parking Owners</span>
                </button>
                <button 
                  onClick={() => setCurrentTab('admin_bookings')} 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', borderRadius: '6px', border: 'none', background: currentTab === 'admin_bookings' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'admin_bookings' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px'
                  }}
                >
                  <Calendar size={16} />
                  <span>Bookings Ledger</span>
                </button>
                <button 
                  onClick={() => setCurrentTab('admin_revenue')} 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', borderRadius: '6px', border: 'none', background: currentTab === 'admin_revenue' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'admin_revenue' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px'
                  }}
                >
                  <DollarSign size={16} />
                  <span>Commissions & Payouts</span>
                </button>
                <button 
                  onClick={() => setCurrentTab('admin_complaints')} 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', borderRadius: '6px', border: 'none', background: currentTab === 'admin_complaints' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'admin_complaints' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px'
                  }}
                >
                  <AlertCircle size={16} />
                  <span>Complaints Queue</span>
                </button>
                <button 
                  onClick={() => setCurrentTab('admin_notifications')} 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', borderRadius: '6px', border: 'none', background: currentTab === 'admin_notifications' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'admin_notifications' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px'
                  }}
                >
                  <Bell size={16} />
                  <span>Broadcast System</span>
                </button>
                <button 
                  onClick={() => setCurrentTab('admin_settings')} 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', borderRadius: '6px', border: 'none', background: currentTab === 'admin_settings' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'admin_settings' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px'
                  }}
                >
                  <Settings size={16} />
                  <span>System Settings</span>
                </button>
                <button 
                  onClick={() => setCurrentTab('admin_logs')} 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', borderRadius: '6px', border: 'none', background: currentTab === 'admin_logs' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'admin_logs' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px'
                  }}
                >
                  <Lock size={16} />
                  <span>Security Audit Logs</span>
                </button>
                <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />
                <button 
                  onClick={() => setCurrentTab('home')} 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', borderRadius: '6px', border: 'none', background: currentTab === 'home' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'home' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px'
                  }}
                >
                  <Compass size={16} />
                  <span>Customer Live Map</span>
                </button>
              </>
            ) : (
              // REGULAR USER/OWNER SIDEBAR NAVIGATION OPTIONS
              <>
                <button 
                  onClick={() => setCurrentTab('home')} 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', background: currentTab === 'home' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'home' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', transition: 'all 0.2s'
                  }}
                >
                  <MapPin size={18} />
                  <span>{t('home')}</span>
                </button>

                <button 
                  onClick={() => setCurrentTab('bookings')} 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', background: currentTab === 'bookings' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'bookings' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', transition: 'all 0.2s'
                  }}
                >
                  <Calendar size={18} />
                  <span>{t('bookings')}</span>
                </button>

                <button 
                  onClick={() => setCurrentTab('profile')} 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', background: currentTab === 'profile' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'profile' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', transition: 'all 0.2s'
                  }}
                >
                  <Users size={18} />
                  <span>{t('profile')}</span>
                </button>

                {roleMode === 'owner' && (
                  <button 
                    onClick={() => setCurrentTab('dashboard')} 
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', background: currentTab === 'dashboard' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'dashboard' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', transition: 'all 0.2s', marginTop: '16px'
                    }}
                  >
                    <Activity size={18} />
                    <span>{t('dashboard')}</span>
                  </button>
                )}
              </>
            )}
          </nav>
        </div>

        {/* User Details & Switcher */}
        <div>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', marginBottom: '16px' }}>
              <img src={user.profilePic} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600' }}>{user.name}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t(`role${roleMode.charAt(0).toUpperCase() + roleMode.slice(1)}`)}</p>
              </div>
            </div>
          )}

          {/* Quick Language Toggle */}
          <button 
            onClick={toggleLanguage} 
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', justifyContent: 'center', fontSize: '12px', fontWeight: '600', marginBottom: '12px'
            }}
          >
            <Globe size={14} />
            <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>

          {/* Quick Role Switcher for Evaluation */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px', border: '1px dashed var(--border-color)', marginBottom: '12px' }}>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '6px' }}>Demo Role Switcher</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
              <button onClick={() => { login('customer'); setRoleMode('customer'); setCurrentTab('home'); }} style={{ fontSize: '10px', padding: '4px', background: roleMode === 'customer' ? 'var(--primary)' : 'transparent', color: roleMode === 'customer' ? '#000' : 'var(--text-secondary)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>User</button>
              <button onClick={() => { login('owner'); setRoleMode('owner'); setCurrentTab('dashboard'); }} style={{ fontSize: '10px', padding: '4px', background: roleMode === 'owner' ? 'var(--primary)' : 'transparent', color: roleMode === 'owner' ? '#000' : 'var(--text-secondary)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Owner</button>
              <button onClick={() => { login('admin'); setRoleMode('admin'); setCurrentTab('admin_overview'); }} style={{ fontSize: '10px', padding: '4px', background: roleMode === 'admin' ? 'var(--primary)' : 'transparent', color: roleMode === 'admin' ? '#000' : 'var(--text-secondary)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Admin</button>
            </div>
          </div>

          <button 
            onClick={logout} 
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: 'rgba(255, 23, 68, 0.1)', color: '#FF1744', cursor: 'pointer', fontWeight: '600', fontSize: '13px'
            }}
          >
            <LogOut size={16} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main style={{ padding: '32px', overflowY: 'auto', maxHeight: '100vh' }}>
        
        {/* ================= TAB: HOME (CUSTOMER MAP & RESERVATIONS) ================= */}
        {currentTab === 'home' && (
          <div className="animate-fade-in">
            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: '800' }}>{t('tagline')}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Book pre-screened, secure parking plots across Chennai.</p>
              </div>

              {/* Referral alert widget */}
              <div className="glass-panel" style={{ padding: '12px 16px', maxWidth: '380px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '4px solid var(--primary)' }}>
                <Percent size={28} style={{ color: 'var(--primary)' }} />
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: '700' }}>{t('referralTitle')}</h4>
                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Code: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{user ? user.referralCode : "PARKEASY50"}</span></p>
                </div>
              </div>
            </div>

            {/* Search & Filters block */}
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flex: 1, minWidth: '260px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder={t('searchPlaceholder')}
                  style={{
                    width: '100%', padding: '12px 12px 12px 40px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#FFF', fontSize: '14px', outline: 'none'
                  }}
                />
              </div>

              {/* Vehicle filter */}
              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-primary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => setVehicleFilter('all')} 
                  style={{
                    padding: '8px 12px', background: vehicleFilter === 'all' ? 'var(--bg-tertiary)' : 'transparent', border: 'none', color: '#FFF', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  {t('all')}
                </button>
                <button 
                  onClick={() => setVehicleFilter('two-wheeler')} 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: vehicleFilter === 'two-wheeler' ? 'var(--bg-tertiary)' : 'transparent', border: 'none', color: '#FFF', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  <Bike size={14} />
                  <span>{t('twoWheeler')}</span>
                </button>
                <button 
                  onClick={() => setVehicleFilter('four-wheeler')} 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: vehicleFilter === 'four-wheeler' ? 'var(--bg-tertiary)' : 'transparent', border: 'none', color: '#FFF', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  <Car size={14} />
                  <span>{t('fourWheeler')}</span>
                </button>
              </div>

              {/* Price filter */}
              <select 
                value={priceSort}
                onChange={(e) => setPriceSort(e.target.value)}
                style={{
                  padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#FFF', fontSize: '13px', cursor: 'pointer', outline: 'none'
                }}
              >
                <option value="default">Sort: Default</option>
                <option value="low-high">Sort: {t('priceLowHigh')}</option>
              </select>

              {/* CCTV Filter toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  checked={cctvFilter} 
                  onChange={(e) => setCctvFilter(e.target.checked)} 
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} 
                />
                <span>CCTV Enabled Only</span>
              </label>
            </div>

            {/* Split Screen: Interactive Mock Map & Location List */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
              {/* Left Column: Interactive Map Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Simulated Google Map */}
                <div style={{ position: 'relative', width: '100%' }}>
                  <div 
                    ref={mapRef} 
                    className="glass-panel" 
                    style={{ 
                      height: '360px', 
                      width: '100%', 
                      zIndex: 1, 
                      borderRadius: '8px',
                    }} 
                  />
                  <button 
                    onClick={handleLocateUser} 
                    style={{ 
                      position: 'absolute', 
                      bottom: '16px', 
                      right: '16px', 
                      zIndex: 10, 
                      background: '#1e1e1e', 
                      color: 'var(--primary)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '50%', 
                      width: '40px', 
                      height: '40px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      cursor: 'pointer', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                      transition: 'all 0.2s'
                    }}
                    title="Find My Location"
                  >
                    <Navigation size={18} />
                  </button>
                </div>

                {/* AI prediction alert panel if slot is selected */}
                {selectedLocation && (
                  <div className="glass-panel" style={{ padding: '16px', background: 'rgba(41, 121, 255, 0.05)', border: '1px solid rgba(41, 121, 255, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <Activity size={20} style={{ color: 'var(--secondary)', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--secondary)' }}>{t('aiPredictionTitle')}</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                          {t('aiPredictionDesc')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Location Card & Booking Trigger */}
                {selectedLocation ? (
                  <div className="glass-panel animate-fade-in" style={{ padding: '24px', position: 'relative' }}>
                    <button 
                      onClick={() => setSelectedLocation(null)} 
                      style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      ✕
                    </button>

                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                      <img src={selectedLocation.images[0]} alt={selectedLocation.name} style={{ width: '120px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                            {selectedLocation.cctvEnabled ? t('cctvActive') : t('cctvReady')}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: 'bold' }}>
                            <Star size={11} fill="gold" stroke="gold" /> {selectedLocation.rating || 'New'}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '6px' }}>{selectedLocation.name}</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedLocation.address}</p>
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.latitude},${selectedLocation.longitude}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '8px',
                            padding: '6px 12px',
                            background: 'rgba(41, 121, 255, 0.1)',
                            color: 'var(--secondary)',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            border: '1px solid rgba(41, 121, 255, 0.2)',
                            transition: 'all 0.2s'
                          }}
                        >
                          <Navigation size={12} style={{ transform: 'rotate(45deg)' }} />
                          <span>Navigate</span>
                        </a>
                      </div>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                      {selectedLocation.description}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                      <div>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hourly Tariff</p>
                        <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>₹{selectedLocation.rates.hourly}<span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-secondary)' }}> / hr</span></p>
                      </div>
                      <div>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Slots Available</p>
                        <p style={{ fontSize: '14px', fontWeight: '700' }}>
                          🚗 {selectedLocation.availableSlots.fourWheeler} / 🏍️ {selectedLocation.availableSlots.twoWheeler}
                        </p>
                      </div>
                    </div>

                    {/* Booking Form Overlay inside current card */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Book a Spot</h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Vehicle Type</label>
                          <select 
                            value={bookingVehicleType} 
                            onChange={(e) => setBookingVehicleType(e.target.value)}
                            style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }}
                          >
                            <option value="four-wheeler">Four Wheeler</option>
                            <option value="two-wheeler">Two Wheeler</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('vehicleNo')}</label>
                          <input 
                            type="text" 
                            value={bookingVehicleNo}
                            onChange={(e) => setBookingVehicleNo(e.target.value)}
                            placeholder="TN-01-AB-1234" 
                            style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF', textTransform: 'uppercase' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('bookingDuration')}</label>
                          <input 
                            type="number" 
                            min="1" 
                            max="24"
                            value={bookingDuration}
                            onChange={(e) => setBookingDuration(parseInt(e.target.value) || 1)}
                            style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('couponCode')}</label>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              type="text" 
                              value={appliedCoupon}
                              onChange={(e) => setAppliedCoupon(e.target.value)}
                              placeholder="PE50" 
                              style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }}
                            />
                            <button onClick={handleApplyCoupon} style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>{t('apply')}</button>
                          </div>
                          {couponError && <span style={{ color: 'var(--accent-occupied)', fontSize: '10px' }}>{couponError}</span>}
                          {couponDiscount > 0 && <span style={{ color: 'var(--primary)', fontSize: '10px' }}>Coupon Applied! {couponDiscount}% Off</span>}
                        </div>
                      </div>

                      {/* Total Pricing calculation */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total amount:</span>
                          <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)' }}>
                            ₹{Math.max(0, Math.round(
                              (bookingVehicleType === 'four-wheeler' 
                                ? selectedLocation.rates.hourly * bookingDuration
                                : (selectedLocation.rates.hourly * 0.6) * bookingDuration) * (1 - couponDiscount/100)
                            ))}
                          </h3>
                        </div>

                        <button 
                          onClick={handlePayAndBook}
                          className="glow-button"
                          style={{ padding: '14px 28px' }}
                        >
                          <Smartphone size={16} />
                          <span>{t('payWithUPI')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Ratings & reviews view sub-section */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>{t('ratingsAndReviews')}</h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '160px', overflowY: 'auto', marginBottom: '12px' }}>
                        {reviews.filter(r => r.locationId === selectedLocation.id).map(r => (
                          <div key={r.id} style={{ background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                              <span>{r.userName}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'gold' }}><Star size={10} fill="gold" /> {r.rating}</span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.comment}</p>
                          </div>
                        ))}
                      </div>

                      {/* Add review form */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select value={reviewRating} onChange={(e) => setReviewRating(parseInt(e.target.value))} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', padding: '6px' }}>
                          <option value="5">5 ★</option>
                          <option value="4">4 ★</option>
                          <option value="3">3 ★</option>
                          <option value="2">2 ★</option>
                          <option value="1">1 ★</option>
                        </select>
                        <input 
                          type="text" 
                          placeholder={t('commentPlaceholder')} 
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF', fontSize: '12px' }}
                        />
                        <button onClick={() => handleAddReview(selectedLocation.id)} style={{ padding: '8px 12px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>Send</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <MapPin size={48} style={{ margin: '0 auto 16px', display: 'block' }} />
                    <p>Select a parking location from the map pins or directory to book a slot.</p>
                  </div>
                )}
              </div>

              {/* Right Column: Listing Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '720px', overflowY: 'auto' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  Nearby Locations ({sortedLocations.length})
                </h3>

                {sortedLocations.map(loc => {
                  const slotsAvailable = loc.availableSlots.fourWheeler + loc.availableSlots.twoWheeler;
                  const isFav = user && user.favoriteLocations.includes(loc.id);

                  return (
                    <div 
                      key={loc.id} 
                      className="glass-panel" 
                      style={{
                        padding: '16px', border: selectedLocation && selectedLocation.id === loc.id ? '1px solid var(--primary)' : '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      onClick={() => setSelectedLocation(loc)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                          ₹{loc.rates.hourly}/hr • ₹{loc.rates.daily}/day
                        </span>
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(loc.id); }}
                          style={{ background: 'transparent', border: 'none', color: isFav ? '#FF1744' : 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <Star size={16} fill={isFav ? '#FF1744' : 'none'} />
                        </button>
                      </div>

                      <h4 style={{ fontSize: '15px', fontWeight: '700', marginTop: '8px' }}>{loc.name}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{loc.address}</p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '11px' }}>
                        <div>
                          <span style={{ color: slotsAvailable > 0 ? 'var(--primary)' : 'var(--accent-occupied)', fontWeight: 'bold' }}>
                            {slotsAvailable > 0 ? `${slotsAvailable} Slots Left` : 'Full / Occupied'}
                          </span>
                        </div>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 'bold' }}>
                          ★ {loc.rating || 'New'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: BOOKINGS (CUSTOMER TICKET & HISTORY) ================= */}
        {currentTab === 'bookings' && (
          <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Your Parking Bookings</h2>

            {/* If there is an active booking, highlight it with a ticketing QR */}
            {bookings.some(b => b.status === 'active') && (
              <div className="glass-panel" style={{ padding: '32px', border: '1px solid var(--primary)', borderRadius: '16px', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', pointerEvents: 'none' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px dashed var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
                  <div>
                    <span style={{ fontSize: '11px', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>
                      {t('activeBooking').toUpperCase()}
                    </span>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', marginTop: '8px' }}>
                      {locations.find(l => l.id === bookings.find(b => b.status === 'active').locationId)?.name}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {locations.find(l => l.id === bookings.find(b => b.status === 'active').locationId)?.address}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Booking ID</p>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace' }}>{bookings.find(b => b.status === 'active').id}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Vehicle Plate</p>
                    <p style={{ fontSize: '16px', fontWeight: '700' }}>🚗 {bookings.find(b => b.status === 'active').vehicleNumber}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Paid</p>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)' }}>₹{bookings.find(b => b.status === 'active').totalAmount} (via UPI)</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Starts At</p>
                    <p style={{ fontSize: '13px' }}>{new Date(bookings.find(b => b.status === 'active').startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Ends At</p>
                    <p style={{ fontSize: '13px' }}>{new Date(bookings.find(b => b.status === 'active').endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                {/* QR Code and checkin/checkout flow emulator */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px' }}>
                  <div style={{ background: '#FFF', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Simulated vector QR layout */}
                    <div style={{ width: '128px', height: '128px', background: '#000', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', padding: '4px' }}>
                      <div style={{ background: '#FFF' }}></div><div style={{ background: '#000' }}></div><div style={{ background: '#FFF' }}></div><div style={{ background: '#FFF' }}></div>
                      <div style={{ background: '#000' }}></div><div style={{ background: '#FFF' }}></div><div style={{ background: '#000' }}></div><div style={{ background: '#FFF' }}></div>
                      <div style={{ background: '#FFF' }}></div><div style={{ background: '#FFF' }}></div><div style={{ background: '#000' }}></div><div style={{ background: '#000' }}></div>
                      <div style={{ background: '#FFF' }}></div><div style={{ background: '#000' }}></div><div style={{ background: '#FFF' }}></div><div style={{ background: '#FFF' }}></div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', fontWeight: 'bold' }}>{t('scanQR')}</p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Hold this screen in front of the gate scanner upon entering or leaving the lot.</p>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button 
                      onClick={() => handleCancelBooking(bookings.find(b => b.status === 'active').id)}
                      style={{ padding: '10px 20px', background: 'rgba(255, 23, 68, 0.1)', color: '#FF1744', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                    >
                      Cancel Booking
                    </button>
                    
                    <button 
                      onClick={() => {
                        const actId = bookings.find(b => b.status === 'active').id;
                        setBookings(prev => prev.map(b => b.id === actId ? { ...b, status: 'completed' } : b));
                        showAlert("Checked out successfully! Thank you for using ParkEasy Chennai.", "Exit Gate Clearance");
                      }}
                      style={{ padding: '10px 20px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                    >
                      Simulate Exit (Check Out)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* History Table */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Past Bookings</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {bookings.filter(b => b.status !== 'active').map(b => {
                  const loc = locations.find(l => l.id === b.locationId);
                  return (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '700' }}>{loc ? loc.name : 'Unknown Location'}</h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Plate: {b.vehicleNumber} • Date: {new Date(b.startTime).toLocaleDateString()}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '14px', fontWeight: '800' }}>₹{b.totalAmount}</p>
                        <span style={{ fontSize: '10px', color: b.status === 'completed' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '600' }}>
                          {b.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: USER PROFILE & SETTINGS ================= */}
        {currentTab === 'profile' && (
          <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>{t('profile')} Management</h2>

            <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
              <img src={user ? user.profilePic : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: '800' }}>{user ? user.name : 'Guest User'}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{user ? user.email : ''}</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user ? user.phone : ''}</p>
            </div>

            {/* Favorite Parking Spots List */}
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>⭐ Favorite Parking Locations</h3>
              {user && user.favoriteLocations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {user.favoriteLocations.map(favId => {
                    const loc = locations.find(l => l.id === favId);
                    if (!loc) return null;
                    return (
                      <div key={favId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{loc.name}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{loc.address}</p>
                        </div>
                        <button onClick={() => toggleFavorite(favId)} style={{ background: 'transparent', border: 'none', color: '#FF1744', cursor: 'pointer', fontSize: '12px' }}>Remove</button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No favorite spots added yet. Pin spots on map using star icon.</p>
              )}
            </div>

            {/* Raise complaint support ticket */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>✉️ Submit Support Complaint</h3>
              
              <form onSubmit={handleAddComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Subject</label>
                  <input 
                    type="text" 
                    value={complaintSubject}
                    onChange={(e) => setComplaintSubject(e.target.value)}
                    placeholder="e.g., Charged twice / Gate barrier sensor issue"
                    style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Details</label>
                  <textarea 
                    value={complaintDesc}
                    onChange={(e) => setComplaintDesc(e.target.value)}
                    placeholder="Provide txn details, dates, times or slot numbers..."
                    style={{ width: '100%', height: '80px', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF', resize: 'none' }}
                    required
                  />
                </div>
                <button type="submit" style={{ padding: '12px', background: 'var(--primary)', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Submit Ticket</button>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB: PARKING OWNER DASHBOARD ================= */}
        {currentTab === 'dashboard' && roleMode === 'owner' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Parking Owner Portal</h2>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('totalEarnings')}</p>
                <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary)', marginTop: '8px' }}>₹{ownerEarnings}</h3>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>From active/completed slots</span>
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('totalBookings')}</p>
                <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '8px' }}>{ownerBookings.length}</h3>
                <span style={{ fontSize: '10px', color: 'var(--primary)' }}>+10% this week</span>
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('occupancyRate')}</p>
                <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '8px', color: 'var(--secondary)' }}>
                  {ownerLocations.length > 0 
                    ? Math.round(100 - (ownerLocations.reduce((sum, l) => sum + l.availableSlots.fourWheeler + l.availableSlots.twoWheeler, 0) / ownerLocations.reduce((sum, l) => sum + l.totalSlots.fourWheeler + l.totalSlots.twoWheeler, 0)) * 100)
                    : 0}%
                </h3>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Live slot updates</span>
              </div>
            </div>

            {/* Add Location Form & Existing Locations Split */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'flex-start' }}>
              
              {/* Add New Listing */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>➕ List a New Parking Space</h3>
                
                <form onSubmit={handleAddLocation} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('locationName')}</label>
                    <input type="text" value={newLocName} onChange={(e) => setNewLocName(e.target.value)} placeholder="e.g. Mylapore Central Car Spot" style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('address')}</label>
                    <input type="text" value={newLocAddress} onChange={(e) => setNewLocAddress(e.target.value)} placeholder="Street name, landmark, Chennai" style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Latitude</label>
                      <input type="number" step="any" value={newLocLat} onChange={(e) => setNewLocLat(e.target.value)} placeholder="e.g. 13.0405" style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Longitude</label>
                      <input type="number" step="any" value={newLocLng} onChange={(e) => setNewLocLng(e.target.value)} placeholder="e.g. 80.2337" style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} required />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Description</label>
                    <textarea value={newLocDesc} onChange={(e) => setNewLocDesc(e.target.value)} placeholder="Provide parking features, operating hours, etc." style={{ width: '100%', height: '60px', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF', resize: 'none' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('hourlyRate')}</label>
                      <input type="number" value={newLocHourly} onChange={(e) => setNewLocHourly(e.target.value)} placeholder="40" style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('dailyRate')}</label>
                      <input type="number" value={newLocDaily} onChange={(e) => setNewLocDaily(e.target.value)} placeholder="300" style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>2-Wheeler Slots</label>
                      <input type="number" value={newLoc2WSlots} onChange={(e) => setNewLoc2WSlots(e.target.value)} placeholder="20" style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>4-Wheeler Slots</label>
                      <input type="number" value={newLoc4WSlots} onChange={(e) => setNewLoc4WSlots(e.target.value)} placeholder="15" style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} required />
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', marginTop: '4px' }}>
                    <input type="checkbox" checked={newLocCCTV} onChange={(e) => setNewLocCCTV(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
                    <span>CCTV Cameras Installed</span>
                  </label>

                  <button type="submit" style={{ padding: '12px', background: 'var(--primary)', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '8px' }}>{t('submitListing')}</button>
                </form>
              </div>

              {/* Manage Listings & Live occupancy manually (Simulating CCTV Auto sensor updates) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Manage Live Space Occupancy</h3>
                
                {ownerLocations.map(loc => (
                  <div key={loc.id} className="glass-panel" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '700' }}>{loc.name}</h4>
                      <span style={{ fontSize: '10px', background: loc.isApproved ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 23, 68, 0.1)', color: loc.isApproved ? 'var(--primary)' : 'var(--accent-occupied)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {loc.isApproved ? 'APPROVED' : 'PENDING'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>🏍️ 2-Wheeler Available</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                          <button onClick={() => handleManualOccupancy(loc.id, 'twoWheeler', false)} style={{ width: '28px', height: '28px', background: 'var(--bg-tertiary)', border: 'none', color: '#FFF', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                          <span style={{ fontWeight: 'bold' }}>{loc.availableSlots.twoWheeler} / {loc.totalSlots.twoWheeler}</span>
                          <button onClick={() => handleManualOccupancy(loc.id, 'twoWheeler', true)} style={{ width: '28px', height: '28px', background: 'var(--bg-tertiary)', border: 'none', color: '#FFF', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>

                      <div>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>🚗 4-Wheeler Available</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                          <button onClick={() => handleManualOccupancy(loc.id, 'fourWheeler', false)} style={{ width: '28px', height: '28px', background: 'var(--bg-tertiary)', border: 'none', color: '#FFF', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                          <span style={{ fontWeight: 'bold' }}>{loc.availableSlots.fourWheeler} / {loc.totalSlots.fourWheeler}</span>
                          <button onClick={() => handleManualOccupancy(loc.id, 'fourWheeler', true)} style={{ width: '28px', height: '28px', background: 'var(--bg-tertiary)', border: 'none', color: '#FFF', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ====================== ENTERPRISE ADMIN TABS VIEW ======================= */}
        {/* ========================================================================= */}

        {/* 1. ADMIN TAB: OVERVIEW */}
        {currentTab === 'admin_overview' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Platform Overview Analytics</h2>

            {/* Top 8 Statistics Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Users</p>
                <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '8px' }}>{adminUsers.length}</h3>
                <span style={{ fontSize: '10px', color: 'var(--primary)' }}>👥 Active Customers</span>
              </div>
              
              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--secondary)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Parking Owners</p>
                <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '8px' }}>{adminOwners.length}</h3>
                <span style={{ fontSize: '10px', color: 'var(--secondary)' }}>🏢 Partner Hosts</span>
              </div>

              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Parking Locations</p>
                <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '8px' }}>{locations.length}</h3>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>📍 Chennai Network</span>
              </div>

              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid Colors.amber' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Bookings</p>
                <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '8px', color: '#FFD54F' }}>
                  {bookings.filter(b => b.status === 'active').length}
                </h3>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>🚗 Occupying slots now</span>
              </div>

              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Today's Revenue</p>
                <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary)', marginTop: '8px' }}>
                  ₹{bookings.reduce((sum, b) => b.status === 'active' || b.status === 'completed' ? sum + b.totalAmount : sum, 0)}
                </h3>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Commission: ₹{adminPlatformRevenue.toFixed(0)}</span>
              </div>

              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly Revenue</p>
                <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary)', marginTop: '8px' }}>₹23,150</h3>
                <span style={{ fontSize: '10px', color: 'var(--primary)' }}>📈 +14.2% Growth</span>
              </div>

              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--accent-occupied)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Approvals</p>
                <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent-occupied)', marginTop: '8px' }}>{adminPendingLocs}</h3>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Locations review pool</span>
              </div>

              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--secondary)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Occupancy Rate</p>
                <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--secondary)', marginTop: '8px' }}>
                  {Math.round(100 - (locations.reduce((sum, l) => sum + l.availableSlots.fourWheeler + l.availableSlots.twoWheeler, 0) / locations.reduce((sum, l) => sum + l.totalSlots.fourWheeler + l.totalSlots.twoWheeler, 0)) * 100)}%
                </h3>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Average across Chennai</span>
              </div>
            </div>

            {/* Split Screen Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
              {/* Left Column: Live activities */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Pending Listing Approvals Alert Box */}
                {adminPendingLocs > 0 && (
                  <div className="glass-panel animate-fade-in" style={{ padding: '20px', border: '1px solid var(--accent-occupied)', background: 'rgba(255, 23, 68, 0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <AlertTriangle size={24} style={{ color: 'var(--accent-occupied)' }} />
                      <h4 style={{ fontSize: '16px', fontWeight: 'bold' }}>New Parking Properties Awaiting Approval</h4>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>There are listing applications pending document and coordinate verification.</p>
                    <button 
                      onClick={() => setCurrentTab('admin_parking')}
                      style={{ padding: '8px 16px', background: 'var(--accent-occupied)', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                    >
                      Open Review Queue
                    </button>
                  </div>
                )}

                {/* Platform Activity Feed Log ticker */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Real-time Audit Ticker</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {auditLogs.slice(0, 4).map(log => (
                      <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{log.action}</p>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>By {log.admin} • {new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', height: '18px', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{log.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Mini analytics graphs widget */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Local Area Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>T. Nagar</span>
                      <span>45% bookings</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '45%', background: 'var(--primary)' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>Adyar</span>
                      <span>30% bookings</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '30%', background: 'var(--secondary)' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>Velachery</span>
                      <span>15% bookings</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '15%', background: 'var(--primary)' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>Marina Beach</span>
                      <span>10% bookings</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '10%', background: 'var(--text-muted)' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ADMIN TAB: ANALYTICS CONSOLE */}
        {currentTab === 'admin_analytics' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Platform Revenue & Trends</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Daily revenue line chart */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Daily Platform Revenue (₹)</h3>
                
                {/* SVG Graph rendering */}
                <div style={{ position: 'relative', height: '200px', width: '100%' }}>
                  <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 100 50" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0"/>
                      </linearGradient>
                    </defs>
                    <path d="M 0,45 Q 15,30 30,38 T 60,15 T 90,20 L 100,20 L 100,50 L 0,50 Z" fill="url(#chartGlow)" />
                    <path d="M 0,45 Q 15,30 30,38 T 60,15 T 90,20 L 100,20" fill="none" stroke="var(--primary)" strokeWidth="1" />
                  </svg>
                  
                  {/* Grid overlay values */}
                  <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', color: 'var(--primary)', fontWeight: 'bold' }}>Max: ₹4,200</div>
                  <div style={{ position: 'absolute', bottom: '0', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', paddingTop: '4px' }}>
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
                </div>
              </div>

              {/* Weekly Bookings Volume bar chart */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Bookings Frequency</h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '180px', paddingTop: '10px' }}>
                  {[
                    { day: 'Mon', h: '40%' },
                    { day: 'Tue', h: '55%' },
                    { day: 'Wed', h: '35%' },
                    { day: 'Thu', h: '60%' },
                    { day: 'Fri', h: '80%' },
                    { day: 'Sat', h: '95%' },
                    { day: 'Sun', h: '90%' }
                  ].map((bar, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{ height: '140px', width: '16px', background: 'var(--bg-primary)', borderRadius: '4px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                        <div style={{ height: bar.h, width: '100%', background: i >= 4 ? 'var(--primary)' : 'var(--secondary)', borderRadius: '4px' }}></div>
                      </div>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '8px' }}>{bar.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Most booked list */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Most Booked Locations</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { name: 'T. Nagar Smart Parking Plaza', count: 184, rate: '85%' },
                    { name: 'Velachery Junction Safe Space', count: 142, rate: '92%' },
                    { name: 'Adyar Metro Parking Hub', count: 98, rate: '60%' },
                    { name: 'Marina Beach Parking Bay', count: 76, rate: '45%' }
                  ].map((loc, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{loc.name}</p>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{loc.count} bookings this month</span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>{loc.rate} Utilized</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* User/Owner signup growth statistics */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Platform Growth Index</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', height: '100%' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span>Customer Signups (Monthly)</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+120 Users</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--bg-primary)', borderRadius: '4px' }}>
                      <div style={{ height: '100%', width: '75%', background: 'var(--primary)', borderRadius: '4px' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span>Owner Signups (Monthly)</span>
                      <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>+18 Hosts</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--bg-primary)', borderRadius: '4px' }}>
                      <div style={{ height: '100%', width: '45%', background: 'var(--secondary)', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. ADMIN TAB: PARKING LOCATIONS MANAGEMENT */}
        {currentTab === 'admin_parking' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Manage Parking Spaces</h2>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={adminSearchQuery} 
                  onChange={(e) => setAdminSearchQuery(e.target.value)} 
                  placeholder="Search locations/addresses..." 
                  style={{ width: '100%', padding: '8px 8px 8px 32px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF', fontSize: '13px' }} 
                />
              </div>
            </div>

            {/* List Awaiting Approval */}
            {locations.filter(l => !l.isApproved).length > 0 && (
              <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', border: '1px solid rgba(255, 23, 68, 0.3)' }}>
                <h3 style={{ fontSize: '16px', color: 'var(--accent-occupied)', fontWeight: '700', marginBottom: '16px' }}>Awaiting Verification Approvals</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {locations.filter(l => !l.isApproved).map(loc => (
                    <div key={loc.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: '700' }}>{loc.name}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{loc.address}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Rate: ₹{loc.rates.hourly}/hr • 🚗 {loc.totalSlots.fourWheeler} slots • 🏍️ {loc.totalSlots.twoWheeler} slots</p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button onClick={() => handleApproveLocation(loc.id)} style={{ padding: '6px 12px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>Approve</button>
                        <button onClick={() => { if (window.confirm("Delete this listing?")) setLocations(prev => prev.filter(l => l.id !== loc.id)); }} style={{ padding: '6px 12px', background: 'rgba(255,23,68,0.1)', color: '#FF1744', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Database list */}
            <div className="glass-panel" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px' }}>ID</th>
                    <th style={{ padding: '12px' }}>Parking Space</th>
                    <th style={{ padding: '12px' }}>Area Address</th>
                    <th style={{ padding: '12px' }}>Hourly Price</th>
                    <th style={{ padding: '12px' }}>Live Occupancy</th>
                    <th style={{ padding: '12px' }}>CCTV State</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.filter(loc => loc.name.toLowerCase().includes(adminSearchQuery.toLowerCase())).map(loc => {
                    const isSuspended = !loc.isApproved;
                    return (
                      <tr key={loc.id} style={{ borderBottom: '1px solid var(--border-color)', hover: 'background: rgba(255,255,255,0.01)' }}>
                        <td style={{ padding: '14px', fontFamily: 'monospace' }}>{loc.id}</td>
                        <td style={{ padding: '14px', fontWeight: 'bold' }}>{loc.name}</td>
                        <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>{loc.address.split(',')[0]}</td>
                        <td style={{ padding: '14px' }}>₹{loc.rates.hourly}/hr</td>
                        <td style={{ padding: '14px' }}>
                          🚗 {loc.availableSlots.fourWheeler}/{loc.totalSlots.fourWheeler} • 🏍️ {loc.availableSlots.twoWheeler}/{loc.totalSlots.twoWheeler}
                        </td>
                        <td style={{ padding: '14px' }}>{loc.cctvEnabled ? '🟢 CCTV Active' : '🟡 CCTV Ready'}</td>
                        <td style={{ padding: '14px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: isSuspended ? 'rgba(255,23,68,0.1)' : 'rgba(0, 230, 118, 0.1)', color: isSuspended ? '#FF1744' : 'var(--primary)', fontWeight: 'bold' }}>
                            {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setSelectedAdminParking(loc)} style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Edit</button>
                            <button onClick={() => handleSuspendLocation(loc.id, !isSuspended)} style={{ padding: '4px 8px', background: isSuspended ? 'var(--primary-glow)' : 'rgba(255,23,68,0.1)', color: isSuspended ? 'var(--primary)' : '#FF1744', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
                              {isSuspended ? 'Activate' : 'Suspend'}
                            </button>
                            <button onClick={() => handleDeleteLocation(loc.id)} style={{ padding: '4px 8px', background: 'rgba(255,23,68,0.1)', color: '#FF1744', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. ADMIN TAB: USERS MANAGEMENT */}
        {currentTab === 'admin_users' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Platform Customers</h2>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={adminSearchQuery} 
                  onChange={(e) => setAdminSearchQuery(e.target.value)} 
                  placeholder="Search user name/email..." 
                  style={{ width: '100%', padding: '8px 8px 8px 32px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF', fontSize: '13px' }} 
                />
              </div>
            </div>

            <div className="glass-panel" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px' }}>Name</th>
                    <th style={{ padding: '12px' }}>Email Address</th>
                    <th style={{ padding: '12px' }}>Mobile Phone</th>
                    <th style={{ padding: '12px' }}>Registered On</th>
                    <th style={{ padding: '12px' }}>Total Bookings</th>
                    <th style={{ padding: '12px' }}>Account Status</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.filter(u => u.name.toLowerCase().includes(adminSearchQuery.toLowerCase())).map(u => {
                    const isBlocked = u.status === 'blocked';
                    return (
                      <tr key={u.uid} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px', fontWeight: 'bold' }}>{u.name}</td>
                        <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td style={{ padding: '14px' }}>{u.phone}</td>
                        <td style={{ padding: '14px' }}>{new Date(u.registeredAt).toLocaleDateString()}</td>
                        <td style={{ padding: '14px', textAlign: 'center' }}>{u.bookingsCount}</td>
                        <td style={{ padding: '14px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: isBlocked ? 'rgba(255,23,68,0.1)' : 'rgba(0, 230, 118, 0.1)', color: isBlocked ? '#FF1744' : 'var(--primary)', fontWeight: 'bold' }}>
                            {u.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setSelectedAdminUser(u)} style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Details</button>
                            <button onClick={() => handleToggleUserBlock(u.uid, u.status)} style={{ padding: '4px 8px', background: isBlocked ? 'var(--primary-glow)' : 'rgba(255,23,68,0.1)', color: isBlocked ? 'var(--primary)' : '#FF1744', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
                              {isBlocked ? 'Unblock' : 'Block'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. ADMIN TAB: OWNERS MANAGEMENT */}
        {currentTab === 'admin_owners' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Platform Parking Hosts</h2>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={adminSearchQuery} 
                  onChange={(e) => setAdminSearchQuery(e.target.value)} 
                  placeholder="Search owners/IDs..." 
                  style={{ width: '100%', padding: '8px 8px 8px 32px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF', fontSize: '13px' }} 
                />
              </div>
            </div>

            <div className="glass-panel" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px' }}>Owner Name</th>
                    <th style={{ padding: '12px' }}>Email Address</th>
                    <th style={{ padding: '12px' }}>Mobile Phone</th>
                    <th style={{ padding: '12px' }}>Listed Properties</th>
                    <th style={{ padding: '12px' }}>Owner Earnings</th>
                    <th style={{ padding: '12px' }}>Documents KYC</th>
                    <th style={{ padding: '12px' }}>Account Status</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminOwners.filter(o => o.name.toLowerCase().includes(adminSearchQuery.toLowerCase())).map(o => {
                    const isSuspended = o.status === 'suspended';
                    return (
                      <tr key={o.uid} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px', fontWeight: 'bold' }}>{o.name}</td>
                        <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>{o.email}</td>
                        <td style={{ padding: '14px' }}>{o.phone}</td>
                        <td style={{ padding: '14px', textAlign: 'center' }}>{o.locationsCount}</td>
                        <td style={{ padding: '14px', color: 'var(--primary)', fontWeight: 'bold' }}>₹{o.earnings}</td>
                        <td style={{ padding: '14px' }}>
                          {o.verified ? (
                            <span style={{ color: 'var(--primary)' }}>🟢 Verified Documents</span>
                          ) : (
                            <button onClick={() => handleVerifyOwner(o.uid)} style={{ padding: '2px 6px', background: 'var(--secondary)', border: 'none', color: '#FFF', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Verify KYC</button>
                          )}
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: isSuspended ? 'rgba(255,23,68,0.1)' : 'rgba(0, 230, 118, 0.1)', color: isSuspended ? '#FF1744' : 'var(--primary)', fontWeight: 'bold' }}>
                            {o.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setSelectedAdminOwner(o)} style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Details</button>
                            <button onClick={() => handleToggleOwnerSuspend(o.uid, o.status)} style={{ padding: '4px 8px', background: isSuspended ? 'var(--primary-glow)' : 'rgba(255,23,68,0.1)', color: isSuspended ? 'var(--primary)' : '#FF1744', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
                              {isSuspended ? 'Activate' : 'Suspend'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. ADMIN TAB: BOOKINGS LEDGER */}
        {currentTab === 'admin_bookings' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Global Bookings Registry</h2>

            <div className="glass-panel" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px' }}>Booking ID</th>
                    <th style={{ padding: '12px' }}>Customer ID</th>
                    <th style={{ padding: '12px' }}>Vehicle Plate</th>
                    <th style={{ padding: '12px' }}>Type</th>
                    <th style={{ padding: '12px' }}>Dates/Time</th>
                    <th style={{ padding: '12px' }}>Gross Revenue</th>
                    <th style={{ padding: '12px' }}>Transaction ID</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px', fontFamily: 'monospace' }}>{b.id}</td>
                      <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>{b.userId}</td>
                      <td style={{ padding: '14px', fontWeight: 'bold' }}>{b.vehicleNumber}</td>
                      <td style={{ padding: '14px' }}>{b.vehicleType === 'four-wheeler' ? '🚗 4W' : '🏍️ 2W'}</td>
                      <td style={{ padding: '14px' }}>{new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ padding: '14px', fontWeight: 'bold', color: 'var(--primary)' }}>₹{b.totalAmount}</td>
                      <td style={{ padding: '14px', color: 'var(--text-muted)' }}>{b.paymentId}</td>
                      <td style={{ padding: '14px' }}>
                        <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: b.status === 'active' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.05)', color: b.status === 'active' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 'bold' }}>
                          {b.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        {b.status === 'active' && (
                          <button onClick={() => handleCancelBooking(b.id)} style={{ padding: '4px 8px', background: 'rgba(255,23,68,0.1)', color: '#FF1744', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Cancel & Refund</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. ADMIN TAB: COMMISSIONS & PAYOUTS */}
        {currentTab === 'admin_revenue' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Platform Commission & Payout Management</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '24px', alignItems: 'flex-start' }}>
              {/* Settings and sliders */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Platform Config Rules</h3>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span>Platform Commission (%)</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{commissionPercentage}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="5" 
                    max="25" 
                    value={commissionPercentage} 
                    onChange={(e) => handleUpdateCommission(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary)' }} 
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Fee deducted from all host earnings automatically on checkout.</span>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>Download Revenue Reports</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={() => handleExportData('csv', 'revenue')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: 'var(--secondary)', border: 'none', borderRadius: '6px', color: '#FFF', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      <FileSpreadsheet size={16} /> Export Revenue Ledger (.CSV)
                    </button>
                    <button onClick={() => handleExportData('csv', 'locations')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                      <Download size={16} /> Export Space Occupancies (.CSV)
                    </button>
                  </div>
                </div>
              </div>

              {/* Host payouts table */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Pending Owner Payout Payouts</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {adminOwners.map(owner => {
                    const gross = owner.earnings;
                    const commission = gross * (commissionPercentage/100);
                    const netPayout = gross - commission;

                    return (
                      <div key={owner.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 'bold' }}>{owner.name}</p>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Email: {owner.email} • Mobile: {owner.phone}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Commission: ₹{commission.toFixed(0)}</p>
                          <p style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)', margin: '2px 0' }}>Payout: ₹{netPayout.toFixed(0)}</p>
                          <button 
                            onClick={() => {
                              showAlert(`Payout of ₹${netPayout.toFixed(0)} processed successfully to Suresh Perumal's verified bank account!`, "Payout Cleared");
                              addAuditLog(user ? user.name : "Admin", `Cleared payout of ₹${netPayout.toFixed(0)} for host ${owner.name}`, 'revenue');
                            }} 
                            style={{ padding: '4px 8px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            Release Funds
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. ADMIN TAB: COMPLAINTS QUEUE */}
        {currentTab === 'admin_complaints' && (
          <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Customer Complaints Resolution Queue</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {complaints.map(comp => (
                <div key={comp.id} className="glass-panel" style={{ padding: '20px', borderLeft: comp.status === 'pending' ? '4px solid var(--accent-occupied)' : '4px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 'bold' }}>{comp.subject}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Submitted by: {comp.userName} • Date: {new Date(comp.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: comp.status === 'resolved' ? 'rgba(0,230,118,0.1)' : 'rgba(255,23,68,0.1)', color: comp.status === 'resolved' ? 'var(--primary)' : 'var(--accent-occupied)', fontWeight: 'bold' }}>
                      {comp.status.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '16px' }}>{comp.description}</p>
                  
                  {comp.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleResolveComplaint(comp.id)}
                        className="glow-button"
                        style={{ padding: '8px 16px', fontSize: '12px' }}
                      >
                        Refund & Resolve Ticket
                      </button>
                      <button 
                        onClick={() => {
                          setComplaints(prev => prev.map(c => c.id === comp.id ? { ...c, status: "resolved" } : c));
                          showAlert("Ticket resolved without payout.", "Ticket Resolved");
                        }}
                        style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        Dismiss Ticket
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. ADMIN TAB: BROADCAST SYSTEM */}
        {currentTab === 'admin_notifications' && (
          <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>System Broadcast and Announcements</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'flex-start' }}>
              {/* Notification creation form */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Compose Push Alert</h3>
                
                <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Alert Title</label>
                    <input 
                      type="text" 
                      value={broadcastTitle} 
                      onChange={(e) => setBroadcastTitle(e.target.value)} 
                      placeholder="e.g. Marina Beach road diversion" 
                      style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Message Body</label>
                    <textarea 
                      value={broadcastMessage} 
                      onChange={(e) => setBroadcastMessage(e.target.value)} 
                      placeholder="Type push message details..." 
                      style={{ width: '100%', height: '80px', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF', resize: 'none' }} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Target Category</label>
                    <select 
                      value={broadcastType} 
                      onChange={(e) => setBroadcastType(e.target.value)}
                      style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }}
                    >
                      <option value="announcement">Announcement (General)</option>
                      <option value="emergency">Emergency Alert (High Priority)</option>
                      <option value="promo">Coupon Code Promotion</option>
                    </select>
                  </div>
                  <button type="submit" className="glow-button" style={{ width: '100%', padding: '12px', marginTop: '6px' }}>
                    Send Push Notification
                  </button>
                </form>
              </div>

              {/* History logs */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Broadcast Logs</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {broadcastLogs.map(log => (
                    <div key={log.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 'bold' }}>{log.title}</h4>
                        <span style={{ fontSize: '9px', background: log.type === 'emergency' ? 'rgba(255,23,68,0.1)' : 'rgba(255,255,255,0.05)', color: log.type === 'emergency' ? '#FF1744' : 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                          {log.type.toUpperCase()}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{log.body}</p>
                      <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '6px' }}>Dispatched to {log.recipients} users • {new Date(log.sentAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. ADMIN TAB: SYSTEM SETTINGS */}
        {currentTab === 'admin_settings' && (
          <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>System Configurations</h2>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Commission Rate (%)</label>
                  <input type="number" value={commissionPercentage} onChange={(e) => setCommissionPercentage(parseInt(e.target.value) || 10)} style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Booking Grace Period (Minutes)</label>
                  <input type="number" value={bookingGracePeriod} onChange={(e) => setBookingGracePeriod(parseInt(e.target.value) || 15)} style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Minimum Hours Allowed</label>
                  <select style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }}>
                    <option value="1">1 Hour</option>
                    <option value="2">2 Hours</option>
                    <option value="3">3 Hours</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Billing Currencies</label>
                  <select style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }}>
                    <option value="INR">INR (₹) Indian Rupee</option>
                  </select>
                </div>
                <button 
                  onClick={() => {
                    fetch(`${API_URL}/settings`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ commissionPercentage, bookingGracePeriod })
                    })
                    .then(res => res.json())
                    .then(() => {
                      showAlert("System settings successfully synchronized with central backend configurations!", "Settings Sync");
                      addAuditLog(user ? user.name : "Admin", "Updated system settings configuration profile", 'settings');
                    })
                    .catch(err => console.error("Error saving settings:", err));
                  }} 
                  className="glow-button" 
                  style={{ width: '100%', padding: '12px', marginTop: '10px' }}
                >
                  Save Settings Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 11. ADMIN TAB: AUDIT LOGS */}
        {currentTab === 'admin_logs' && (
          <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Security Audit Log Center</h2>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {auditLogs.map(log => (
                  <div key={log.id} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace' }}>{log.action}</p>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Admin: {log.admin} • IP address: {log.ip} • Date: {new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <span style={{ fontSize: '10px', background: 'rgba(0, 230, 118, 0.1)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      {log.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* ============================== MOCK MODALS ============================== */}
      {/* ========================================================================= */}

      {/* USER DETAILS MODAL */}
      {selectedAdminUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '450px', padding: '28px', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>Customer Profile Summary</h3>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                {selectedAdminUser.name.charAt(0)}
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedAdminUser.name}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Email: {selectedAdminUser.email}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Mobile: {selectedAdminUser.phone}</p>
              </div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '12px' }}>
              <p style={{ marginBottom: '6px' }}><strong>Joined network:</strong> {new Date(selectedAdminUser.registeredAt).toLocaleDateString()}</p>
              <p style={{ marginBottom: '6px' }}><strong>Status:</strong> {selectedAdminUser.status.toUpperCase()}</p>
              <p><strong>Total platform bookings:</strong> {selectedAdminUser.bookingsCount} reservations</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedAdminUser(null)} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Close</button>
              <button 
                onClick={() => {
                  handleToggleUserBlock(selectedAdminUser.uid, selectedAdminUser.status);
                  setSelectedAdminUser(null);
                }} 
                style={{ padding: '10px 20px', background: selectedAdminUser.status === 'active' ? 'rgba(255,23,68,0.1)' : 'var(--primary)', color: selectedAdminUser.status === 'active' ? '#FF1744' : '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
              >
                {selectedAdminUser.status === 'active' ? 'Block Account' : 'Unblock Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OWNER DETAILS MODAL */}
      {selectedAdminOwner && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '450px', padding: '28px', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>Parking Owner Profile</h3>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--secondary-glow)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                {selectedAdminOwner.name.charAt(0)}
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedAdminOwner.name}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Email: {selectedAdminOwner.email}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Mobile: {selectedAdminOwner.phone}</p>
              </div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '12px' }}>
              <p style={{ marginBottom: '6px' }}><strong>Joined network:</strong> {new Date(selectedAdminOwner.registeredAt).toLocaleDateString()}</p>
              <p style={{ marginBottom: '6px' }}><strong>Gross Earnings:</strong> ₹{selectedAdminOwner.earnings}</p>
              <p style={{ marginBottom: '6px' }}><strong>Locations Count:</strong> {selectedAdminOwner.locationsCount} spaces listed</p>
              <p><strong>KYC Verification State:</strong> {selectedAdminOwner.verified ? "Verified ✅" : "Awaiting document review 🟡"}</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedAdminOwner(null)} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Close</button>
              <button 
                onClick={() => {
                  handleToggleOwnerSuspend(selectedAdminOwner.uid, selectedAdminOwner.status);
                  setSelectedAdminOwner(null);
                }} 
                style={{ padding: '10px 20px', background: selectedAdminOwner.status === 'active' ? 'rgba(255,23,68,0.1)' : 'var(--primary)', color: selectedAdminOwner.status === 'active' ? '#FF1744' : '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
              >
                {selectedAdminOwner.status === 'active' ? 'Suspend Host' : 'Activate Host'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PARKING DETAILS MODAL */}
      {selectedAdminParking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '480px', padding: '28px', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>Edit Parking Spot Metadata</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              fetch(`${API_URL}/locations/${selectedAdminParking.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: selectedAdminParking.name,
                  address: selectedAdminParking.address,
                  rates: selectedAdminParking.rates
                })
              })
              .then(res => res.json())
              .then(updatedLoc => {
                setLocations(prev => prev.map(loc => loc.id === selectedAdminParking.id ? updatedLoc : loc));
                addAuditLog(user ? user.name : "Admin", `Updated details for parking spot ID: ${selectedAdminParking.id}`, 'parking');
                setSelectedAdminParking(null);
                showAlert("Parking space details successfully updated and saved!", "Details Updated");
              })
              .catch(err => console.error("Error saving location changes:", err));
            }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Space Name</label>
                <input type="text" value={selectedAdminParking.name} onChange={(e) => {
                  const updatedVal = e.target.value;
                  setLocations(prev => prev.map(loc => loc.id === selectedAdminParking.id ? { ...loc, name: updatedVal } : loc));
                  setSelectedAdminParking(prev => ({ ...prev, name: updatedVal }));
                }} style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} required />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Area Address</label>
                <input type="text" value={selectedAdminParking.address} onChange={(e) => {
                  const updatedVal = e.target.value;
                  setLocations(prev => prev.map(loc => loc.id === selectedAdminParking.id ? { ...loc, address: updatedVal } : loc));
                  setSelectedAdminParking(prev => ({ ...prev, address: updatedVal }));
                }} style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Hourly Rate (₹)</label>
                  <input type="number" value={selectedAdminParking.rates.hourly} onChange={(e) => {
                    const updatedVal = parseFloat(e.target.value) || 0;
                    setLocations(prev => prev.map(loc => loc.id === selectedAdminParking.id ? { ...loc, rates: { ...loc.rates, hourly: updatedVal } } : loc));
                    setSelectedAdminParking(prev => ({ ...prev, rates: { ...prev.rates, hourly: updatedVal } }));
                  }} style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Daily Rate (₹)</label>
                  <input type="number" value={selectedAdminParking.rates.daily} onChange={(e) => {
                    const updatedVal = parseFloat(e.target.value) || 0;
                    setLocations(prev => prev.map(loc => loc.id === selectedAdminParking.id ? { ...loc, rates: { ...loc.rates, daily: updatedVal } } : loc));
                    setSelectedAdminParking(prev => ({ ...prev, rates: { ...prev.rates, daily: updatedVal } }));
                  }} style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setSelectedAdminParking(null)} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. SIMULATED PHONE UPI TRANSACTION MODAL OVERLAY */}
      {showUPIScreen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '340px', padding: '24px', border: '1px solid var(--border-color)', borderRadius: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <Smartphone size={36} color="var(--primary)" style={{ marginBottom: '8px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>UPI Payment Portal</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Simulating Secure Bank Gateway Connection</p>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PAYING TO</span>
              <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: '4px 0 8px' }}>ParkEasy Chennai Pvt Ltd</h4>
              
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AMOUNT DUE</span>
              <h2 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary)' }}>
                ₹{Math.max(0, Math.round(
                  (bookingVehicleType === 'four-wheeler' 
                    ? selectedLocation.rates.hourly * bookingDuration
                    : (selectedLocation.rates.hourly * 0.6) * bookingDuration) * (1 - couponDiscount/100)
                ))}
              </h2>
            </div>

            {isProcessingPayment ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <RefreshCw className="spinning" size={24} style={{ margin: '0 auto 12px', animation: 'spin 1.5s linear infinite' }} />
                <p style={{ fontSize: '13px', fontWeight: 'bold' }}>Securing Transaction...</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Do not close this window or press Back.</p>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>ENTER 4-DIGIT SECURE UPI PIN</label>
                <input 
                  type="password" 
                  maxLength="4" 
                  value={upiPin}
                  onChange={(e) => setUpiPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••" 
                  style={{
                    display: 'block', width: '120px', padding: '10px', margin: '0 auto 20px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#FFF', textAlign: 'center', fontSize: '20px', letterSpacing: '8px', outline: 'none'
                  }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button 
                    onClick={() => { setShowUPIScreen(false); setUpiPin(''); }}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmUPIPayment}
                    style={{ padding: '12px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                  >
                    Confirm Pay
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. CUSTOM ALERT MODAL */}
      {customAlert && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '320px', padding: '24px', border: '1px solid var(--border-color)', borderRadius: '16px', textAlign: 'center' }}>
            <AlertCircle size={32} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>{customAlert.title}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.4' }}>{customAlert.message}</p>
            <button 
              onClick={() => setCustomAlert(null)}
              className="glow-button"
              style={{ width: '100%', padding: '10px' }}
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* 5. CUSTOM CONFIRM MODAL */}
      {customConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '320px', padding: '24px', border: '1px solid var(--border-color)', borderRadius: '16px', textAlign: 'center' }}>
            <HelpCircle size={32} color="var(--secondary)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>{customConfirm.title}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.4' }}>{customConfirm.message}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button 
                onClick={() => setCustomConfirm(null)}
                style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  customConfirm.onConfirm();
                  setCustomConfirm(null);
                }}
                style={{ padding: '10px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Spinner CSS */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>

    </div>
  );
}

function LoginScreen({ onLogin, roleHint }) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      setError("Please enter your email or phone number.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }
    try {
      onLogin(emailOrPhone, password);
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    }
  };

  const handleQuickLogin = (email, pass) => {
    setEmailOrPhone(email);
    setPassword(pass);
    try {
      onLogin(email, pass);
    } catch (err) {
      setError(err.message || "Login failed.");
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#040404',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-main, sans-serif)',
      display: 'flex',
      flexDirection: 'row',
      width: '100vw'
    }}>
      <style>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 10px rgba(0, 230, 118, 0.4); }
          50% { box-shadow: 0 0 25px rgba(0, 230, 118, 0.8); }
          100% { box-shadow: 0 0 10px rgba(0, 230, 118, 0.4); }
        }
        @media (max-width: 991px) {
          .web-login-image-panel {
            display: none !important;
          }
          .web-login-form-panel {
            width: 100% !important;
          }
        }
      `}</style>

      {/* Split Screen Layout */}

      {/* Left Panel: Branded */}
      <div className="web-login-image-panel" style={{
        width: '55%',
        height: '100vh',
        position: 'relative',
        background: 'linear-gradient(135deg, #040404 0%, #0a1a0f 50%, #040404 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
        boxSizing: 'border-box'
      }}>
        {/* Subtle grid pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(0,230,118,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          zIndex: 0
        }} />
        {/* Green glow accent */}
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,230,118,0.12) 0%, transparent 70%)',
          zIndex: 0
        }} />
        <div style={{ zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🅿️</div>
          <h2 style={{ fontSize: '42px', fontWeight: '900', color: '#FFF', marginBottom: '12px', letterSpacing: '-1px' }}>ParkEasy</h2>
          <p style={{ fontSize: '14px', color: 'var(--primary, #00E676)', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '24px' }}>
            Smart Parking Management
          </p>
          <p style={{ fontSize: '14px', color: '#78909C', maxWidth: '380px', lineHeight: '1.8', margin: '0 auto' }}>
            Chennai's unified smart parking platform — book spots, manage listings, and control the entire network in one place.
          </p>
          <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', marginTop: '48px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#00E676' }}>500+</div>
              <div style={{ fontSize: '11px', color: '#546E7A', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '4px' }}>Parking Spots</div>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#00E676' }}>24/7</div>
              <div style={{ fontSize: '11px', color: '#546E7A', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '4px' }}>Live Support</div>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#00E676' }}>10K+</div>
              <div style={{ fontSize: '11px', color: '#546E7A', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '4px' }}>Happy Users</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Glassmorphic Form Card */}
      <div className="web-login-form-panel" style={{
        width: '45%',
        height: '100vh',
        background: '#040404',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
         {/* Glassmorphic Card */}
         <div className="glass-panel" style={{
           width: '100%',
           maxWidth: '420px',
           padding: '40px',
           borderRadius: '24px',
           border: '1px solid rgba(255, 255, 255, 0.08)',
           boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
           background: 'rgba(20, 20, 20, 0.75)',
           opacity: fadeOutIntro ? 1 : 0,
           transform: fadeOutIntro ? 'scale(1)' : 'scale(0.95)',
           transition: 'opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
           pointerEvents: fadeOutIntro ? 'auto' : 'none'
         }}>
           {/* App Logo */}
           <div style={{
             display: 'inline-flex',
             alignItems: 'center',
             justifyContent: 'center',
             background: 'var(--primary, #00E676)',
             color: '#000',
             width: '56px',
             height: '56px',
             borderRadius: '16px',
             marginBottom: '20px',
             boxShadow: '0 0 20px rgba(0, 230, 118, 0.4)',
             animation: 'pulseGlow 2s infinite'
           }}>
             <Compass size={28} />
           </div>

           <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '6px' }}>ParkEasy Chennai</h2>
           <p style={{ fontSize: '11px', color: 'var(--primary, #00E676)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '32px' }}>
             Smart Parking Network
           </p>

           {error && (
             <div style={{
               background: 'rgba(255, 23, 68, 0.1)',
               border: '1px solid rgba(255, 23, 68, 0.2)',
               color: '#FF1744',
               padding: '12px',
               borderRadius: '10px',
               fontSize: '12px',
               marginBottom: '20px',
               textAlign: 'left'
             }}>
               ⚠️ {error}
             </div>
           )}

           <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <div style={{ textAlign: 'left' }}>
               <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted, #78909C)', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Email or Phone Number</label>
               <input
                 type="text"
                 value={emailOrPhone}
                 onChange={(e) => { setEmailOrPhone(e.target.value); setError(''); }}
                 placeholder="email@mymail.com or +91 99999 99999"
                 style={{
                   width: '100%',
                   padding: '14px 16px',
                   background: '#0d0d0d',
                   border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                   borderRadius: '12px',
                   color: '#FFF',
                   fontSize: '14px',
                   outline: 'none',
                   transition: 'all 0.2s',
                   boxSizing: 'border-box'
                 }}
               />
             </div>

             <div style={{ textAlign: 'left' }}>
               <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted, #78909C)', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Password</label>
               <div style={{ position: 'relative' }}>
                 <input
                   type={showPassword ? "text" : "password"}
                   value={password}
                   onChange={(e) => { setPassword(e.target.value); setError(''); }}
                   placeholder="••••••••"
                   style={{
                     width: '100%',
                     padding: '14px 44px 14px 16px',
                     background: '#0d0d0d',
                     border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                     borderRadius: '12px',
                     color: '#FFF',
                     fontSize: '14px',
                     outline: 'none',
                     transition: 'all 0.2s',
                     boxSizing: 'border-box'
                   }}
                 />
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   style={{
                     position: 'absolute',
                     right: '12px',
                     top: '50%',
                     transform: 'translateY(-50%)',
                     background: 'transparent',
                     border: 'none',
                     color: 'var(--text-muted, #78909C)',
                     cursor: 'pointer',
                     fontSize: '12px',
                     fontWeight: '600'
                   }}
                 >
                   {showPassword ? "Hide" : "Show"}
                 </button>
               </div>
             </div>

             <button
               type="submit"
               className="glow-button"
               style={{
                 width: '100%',
                 padding: '14px',
                 borderRadius: '12px',
                 fontSize: '14px',
                 fontWeight: '700',
                 marginTop: '10px'
               }}
             >
               Secure Login
             </button>
           </form>

           {/* Quick Demo Connections */}
           <div style={{ marginTop: '32px' }}>
             <div style={{
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: '10px',
               marginBottom: '16px'
             }}>
               <div style={{ height: '1px', background: 'var(--border-color, rgba(255, 255, 255, 0.08))', flex: 1 }} />
               <span style={{ fontSize: '10px', color: 'var(--text-muted, #78909C)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Quick Connect Demo</span>
               <div style={{ height: '1px', background: 'var(--border-color, rgba(255, 255, 255, 0.08))', flex: 1 }} />
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <button
                 onClick={() => handleQuickLogin("karthik@mymail.com", "user123")}
                 style={{
                   padding: '10px 14px',
                   background: 'rgba(255,255,255,0.02)',
                   border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                   borderRadius: '10px',
                   color: 'var(--text-secondary, #B0BEC5)',
                   fontSize: '12px',
                   cursor: 'pointer',
                   fontWeight: '500',
                   textAlign: 'left',
                   display: 'flex',
                   justifyContent: 'space-between',
                   alignItems: 'center',
                   transition: 'all 0.2s'
                 }}
               >
                 <span>👤 Customer Portal</span>
                 <span style={{ color: 'var(--primary, #00E676)', fontSize: '10px', fontWeight: 'bold' }}>Karthik Raja</span>
               </button>

               <button
                 onClick={() => handleQuickLogin("suresh@spotowner.com", "owner123")}
                 style={{
                   padding: '10px 14px',
                   background: 'rgba(255,255,255,0.02)',
                   border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                   borderRadius: '10px',
                   color: 'var(--text-secondary, #B0BEC5)',
                   fontSize: '12px',
                   cursor: 'pointer',
                   fontWeight: '500',
                   textAlign: 'left',
                   display: 'flex',
                   justifyContent: 'space-between',
                   alignItems: 'center',
                   transition: 'all 0.2s'
                 }}
               >
                 <span>🏠 Parking Host Portal</span>
                 <span style={{ color: 'var(--secondary, #2979FF)', fontSize: '10px', fontWeight: 'bold' }}>Suresh Perumal</span>
               </button>

               <button
                 onClick={() => handleQuickLogin("admin@parkeasy.in", "admin123")}
                 style={{
                   padding: '10px 14px',
                   background: 'rgba(255,255,255,0.02)',
                   border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                   borderRadius: '10px',
                   color: 'var(--text-secondary, #B0BEC5)',
                   fontSize: '12px',
                   cursor: 'pointer',
                   fontWeight: '500',
                   textAlign: 'left',
                   display: 'flex',
                   justifyContent: 'space-between',
                   alignItems: 'center',
                   transition: 'all 0.2s'
                 }}
               >
                 <span>🛡️ Super Admin Console</span>
                 <span style={{ color: '#FF9100', fontSize: '10px', fontWeight: 'bold' }}>Rajesh Kumar</span>
               </button>
             </div>
           </div>
         </div>
      </div>
    </div>
  );
}
