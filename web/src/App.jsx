import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { useTranslation } from './context/LangContext';
import { 
  INITIAL_LOCATIONS, 
  INITIAL_BOOKINGS, 
  INITIAL_REVIEWS, 
  INITIAL_COUPONS 
} from './services/mockDb';
import { 
  MapPin, Search, Navigation, Filter, Clock, DollarSign, Bike, Car, Star, 
  Share2, Compass, Shield, AlertCircle, LogOut, Globe, Calendar, Users, 
  Percent, Activity, RefreshCw, QrCode, Smartphone, HelpCircle,
  User, Plus, Trash2, Edit2, Bell, Settings, CreditCard, ChevronRight, Lock, Eye, Camera, Check, Wallet
} from 'lucide-react';

function BookingTimer({ endTime, status, onZero }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (status !== 'active') return;

    const calculateTime = () => {
      const end = new Date(endTime).getTime();
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Slot closed / Overdue');
        setIsOverdue(true);
        if (onZero) onZero();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formattedHours = hours.toString().padStart(2, '0');
      const formattedMins = minutes.toString().padStart(2, '0');
      const formattedSecs = seconds.toString().padStart(2, '0');

      setTimeLeft(`${formattedHours}h ${formattedMins}m ${formattedSecs}s`);
      setIsOverdue(false);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endTime, status]);

  if (status !== 'active') return null;

  return (
    <div style={{
      marginTop: '12px',
      padding: '12px 16px',
      background: isOverdue ? 'rgba(255,23,68,0.1)' : 'rgba(0, 229, 160, 0.1)',
      border: isOverdue ? '1px solid #FF1744' : '1px solid var(--primary)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Clock size={16} color={isOverdue ? '#FF1744' : 'var(--primary)'} />
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
          {isOverdue ? 'Booking Overdue:' : 'Time Remaining:'}
        </span>
      </div>
      <span style={{
        fontSize: '14px',
        fontWeight: '800',
        color: isOverdue ? '#FF1744' : 'var(--primary)',
        fontFamily: 'monospace'
      }}>
        {timeLeft}
      </span>
    </div>
  );
}

export default function App() {
  const { user, logout, toggleFavorite, loginWithCredentials, loginWithGoogle, loginAsGuest, updateProfile } = useAuth();
  const { language, toggleLanguage, t } = useTranslation();

  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://parkhub-wefh.onrender.com/api';

  const [locations, setLocations] = useState(INITIAL_LOCATIONS);
  const [leafletLoaded, setLeafletLoaded] = useState(!!window.L);

  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }
    const interval = setInterval(() => {
      if (window.L) {
        setLeafletLoaded(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [complaints, setComplaints] = useState([]);
  
  const [searchMode, setSearchMode] = useState('parking'); // 'parking' | 'ev'
  const [evStations, setEvStations] = useState([]);
  const [evReservations, setEvReservations] = useState([]);
  const [evConnectorFilter, setEvConnectorFilter] = useState('all');
  const [evTypeFilter, setEvTypeFilter] = useState('all');
  
  const [showEvReserveModal, setShowEvReserveModal] = useState(false);
  const [selectedEvStation, setSelectedEvStation] = useState(null);
  const [selectedCharger, setSelectedCharger] = useState(null);
  const [reserveHours, setReserveHours] = useState(1);
  const [isProcessingEvPay, setIsProcessingEvPay] = useState(false);
  const [evPaySuccess, setEvPaySuccess] = useState(false);

  const [customAlert, setCustomAlert] = useState(null); 
  const [customConfirm, setCustomConfirm] = useState(null); 
  const [supportSubject, setSupportSubject] = useState('');
  const [supportDesc, setSupportDesc] = useState(''); 

  const mapRef = useRef(null);
  const leafletMapInstance = useRef(null);
  const markersGroupRef = useRef(null);
  const userLocationMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

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
        const evRes = await fetch(`${API_URL}/ev-stations`);
        if (evRes.ok) setEvStations(await evRes.json());
      } catch (err) { console.error("Error fetching EV stations:", err); }

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
    };

    fetchData();

    // Poll for updates (e.g. available slots fluctuating on server)
    const interval = setInterval(async () => {
      try {
        const locRes = await fetch(`${API_URL}/locations`);
        if (locRes.ok) setLocations(await locRes.json());
      } catch (err) { console.error("Error polling locations:", err); }

      try {
        const evRes = await fetch(`${API_URL}/ev-stations`);
        if (evRes.ok) setEvStations(await evRes.json());
      } catch (err) { console.error("Error polling EV stations:", err); }
      
      try {
        const bookRes = await fetch(`${API_URL}/bookings`);
        if (bookRes.ok) setBookings(await bookRes.json());
      } catch (err) { console.error("Error polling bookings:", err); }

      try {
        const compRes = await fetch(`${API_URL}/complaints`);
        if (compRes.ok) setComplaints(await compRes.json());
      } catch (err) { console.error("Error polling complaints:", err); }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const prevBookingsRef = useRef([]);
  useEffect(() => {
    bookings.forEach(b => {
      const prev = prevBookingsRef.current.find(p => p.id === b.id);
      if (prev && prev.paymentStatus === 'pending' && b.paymentStatus === 'completed') {
        showAlert(`Payment of ₹${b.totalAmount} for Booking ID: ${b.id} has been verified by the host! ✅`, "Payment Completed");
      }
    });
    prevBookingsRef.current = bookings;
  }, [bookings]);

  const [userCoords, setUserCoords] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [hasCentered, setHasCentered] = useState(false);
  const watchIdRef = useRef(null);

  // Haversine formula to calculate distance in km
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  };

  const formatDistance = (km) => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  };

  const [currentTab, setCurrentTab] = useState('home'); // home | bookings | profile
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all'); 
  const [sortBy, setSortBy] = useState('nearest');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getEstimatedTime = (km) => {
    if (!km) return null;
    const mins = Math.max(1, Math.round(km * 2.5));
    return `${mins} min`;
  };

  const [cctvFilter, setCctvFilter] = useState(false);

  const [topUpAmount, setTopUpAmount] = useState('');
  const [showTopUpQRModal, setShowTopUpQRModal] = useState(false);
  const [qrAmount, setQrAmount] = useState(0);

  const handleTopUpWallet = () => {
    const amt = parseFloat(topUpAmount);
    if (isNaN(amt) || amt <= 0) return;
    setQrAmount(amt);
    setShowTopUpQRModal(true);
  };

  const handleConfirmQRPayment = () => {
    setShowTopUpQRModal(false);
    setIsProcessingPayment(true);
    setTimeout(() => {
      const newBalance = (user.walletBalance ?? 0) + qrAmount;
      const newTx = {
        id: 'tx-' + Date.now(),
        type: 'credit',
        amount: qrAmount,
        description: 'Wallet Top-Up Success (QR)',
        date: new Date().toISOString()
      };
      const updatedTxs = [newTx, ...(user.transactions || [])];
      
      updateProfile({ walletBalance: newBalance, transactions: updatedTxs });
      setIsProcessingPayment(false);
      setTopUpAmount('');
      showAlert(`Successfully topped up ₹${qrAmount.toLocaleString('en-IN')} to your wallet!`, "Wallet Balance");
    }, 1500);
  };

  // Profile Dashboard states
  const [profileSubTab, setProfileSubTab] = useState('overview');
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileAddress, setProfileAddress] = useState(user?.address || '123, Anna Salai, Chennai, Tamil Nadu, 600002');
  const [profilePic, setProfilePic] = useState(user?.profilePic || '');

  // Sync profile fields when user changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfilePhone(user.phone || '');
      setProfileAddress(user.address || '123, Anna Salai, Chennai, Tamil Nadu, 600002');
      setProfilePic(user.profilePic || '');
    }
  }, [user]);

  // Vehicle states
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Car'); // Car | Bike | EV
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleIsDefault, setVehicleIsDefault] = useState(false);

  // Security states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.security?.twoFactorEnabled || false);

  // Notification Preferences
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(true);
  const [notifPromo, setNotifPromo] = useState(false);
  const [notifPush, setNotifPush] = useState(true);

  // Mock Login Activity
  const loginActivities = [
    { device: 'Chrome on Windows 11', location: 'Chennai, India', time: 'Active Now', ip: '192.168.1.5' },
    { device: 'Safari on iPhone 15', location: 'Chennai, India', time: '2 hours ago', ip: '192.168.1.12' },
    { device: 'Chrome on macOS Sonoma', location: 'Bengaluru, India', time: 'June 20, 2026', ip: '10.0.0.4' }
  ];

  const userVehicles = user?.vehicles || [
    { id: 1, number: "TN-01-AB-1234", type: "Car", brand: "Honda", model: "Civic", isDefault: true }
  ];

  const handleSetDefaultVehicle = (id) => {
    const updated = userVehicles.map(v => ({ ...v, isDefault: v.id === id }));
    updateProfile({ vehicles: updated });
    showAlert("Default vehicle updated successfully!", "My Vehicles");
  };

  const handleDeleteVehicle = (id) => {
    showConfirm("Are you sure you want to delete this vehicle?", () => {
      const updated = userVehicles.filter(v => v.id !== id);
      if (updated.length > 0 && !updated.some(v => v.isDefault)) {
        updated[0].isDefault = true;
      }
      updateProfile({ vehicles: updated });
      showAlert("Vehicle deleted successfully!", "My Vehicles");
    }, "Delete Vehicle");
  };

  const handleSaveVehicle = (e) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) {
      showAlert("Please enter a vehicle plate number.");
      return;
    }

    let updated;
    if (editingVehicleId) {
      updated = userVehicles.map(v => {
        if (v.id === editingVehicleId) {
          return {
            ...v,
            number: vehicleNumber.toUpperCase(),
            type: vehicleType,
            brand: vehicleBrand,
            model: vehicleModel,
            isDefault: vehicleIsDefault ? true : (v.isDefault && userVehicles.length > 1 ? false : v.isDefault)
          };
        }
        return vehicleIsDefault ? { ...v, isDefault: false } : v;
      });
      showAlert("Vehicle details updated successfully!", "My Vehicles");
    } else {
      const newVeh = {
        id: Date.now(),
        number: vehicleNumber.toUpperCase(),
        type: vehicleType,
        brand: vehicleBrand,
        model: vehicleModel,
        isDefault: vehicleIsDefault || userVehicles.length === 0
      };
      updated = vehicleIsDefault ? userVehicles.map(v => ({ ...v, isDefault: false })) : [...userVehicles];
      updated.push(newVeh);
      showAlert("New vehicle added successfully!", "My Vehicles");
    }

    updateProfile({ vehicles: updated });
    setVehicleNumber('');
    setVehicleBrand('');
    setVehicleModel('');
    setVehicleIsDefault(false);
    setShowAddVehicle(false);
    setEditingVehicleId(null);
  };

  const handleSaveProfileChanges = (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showAlert("Please enter your name.");
      return;
    }
    if (!profileEmail.trim()) {
      showAlert("Please enter your email.");
      return;
    }
    updateProfile({
      name: profileName,
      email: profileEmail,
      phone: profilePhone,
      address: profileAddress,
      profilePic: profilePic
    });
    showAlert("Profile changes saved successfully!", "Profile Updated");
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!oldPassword) {
      showAlert("Please enter your current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      showAlert("Password must be at least 6 characters.");
      return;
    }
    showAlert("Your password has been changed successfully!", "Security Settings");
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleLogoutAllDevices = () => {
    showConfirm("Are you sure you want to log out from all devices? This will terminate your current session.", () => {
      logout();
    }, "Logout All Devices");
  };

  const handleQuickAccessFavorite = (loc) => {
    setCurrentTab('home');
    setSelectedLocation(loc);
  };

  const handleDownloadInvoice = (booking) => {
    const loc = locations.find(l => l.id === booking.locationId) || {};
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${booking.id}</title>
          <style>
            body { font-family: 'Inter', sans-serif; background: #060B18; color: #FFF; padding: 40px; margin: 0; }
            .invoice-card { background: #0D1526; border: 1px solid rgba(0, 212, 255, 0.15); border-radius: 16px; padding: 40px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 24px; margin-bottom: 24px; }
            .brand { font-size: 24px; font-weight: 800; color: #00D4FF; letter-spacing: -0.5px; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; font-size: 13px; color: #8B9AC4; }
            .details h4 { color: #FFF; margin: 0 0 8px 0; font-size: 14px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
            .table th { text-align: left; padding: 12px; background: rgba(0, 212, 255, 0.05); color: #00D4FF; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            .table td { padding: 16px 12px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
            .totals { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; font-size: 13px; color: #8B9AC4; }
            .totals div { display: flex; justify-content: space-between; width: 220px; }
            .totals .grand-total { color: #00E5A0; font-weight: 800; font-size: 18px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-top: 4px; }
            .footer { text-align: center; font-size: 11px; color: #4A5580; margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px; }
          </style>
        </head>
        <body>
          <div class="invoice-card">
            <div class="header">
              <div>
                <div class="brand">🚗 ParkHub</div>
                <div style="font-size: 11px; color: #4A5580; margin-top: 4px;">Smart Parking Network</div>
              </div>
              <div style="text-align: right;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 800;">INVOICE</h2>
                <div style="font-size: 12px; color: #8B9AC4; margin-top: 4px;">ID: #${booking.id}</div>
              </div>
            </div>
            <div class="details">
              <div>
                <h4>Billed To:</h4>
                <div>${profileName}</div>
                <div>${profileEmail}</div>
                <div>${profilePhone}</div>
              </div>
              <div style="text-align: right;">
                <h4>Booking Info:</h4>
                <div>Date: ${new Date(booking.createdAt || booking.bookingDate || Date.now()).toLocaleDateString()}</div>
                <div>Status: Paid (UPI)</div>
                <div>Vehicle: ${booking.vehicleType === 'four-wheeler' ? '🚗' : '🏍️'} ${booking.vehicleNumber}</div>
              </div>
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Rate</th>
                  <th>Hours</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>${loc.name || 'Parking Location'}</strong><br/>
                    <span style="font-size: 11px; color: #8B9AC4;">${loc.address || ''}</span>
                  </td>
                  <td>₹${loc.rates?.hourly || 40}/hr</td>
                  <td>${booking.duration || 2} hrs</td>
                  <td>₹${(loc.rates?.hourly || 40) * (booking.duration || 2)}</td>
                </tr>
              </tbody>
            </table>
            <div class="totals">
              <div><span>Subtotal:</span><span>₹${(loc.rates?.hourly || 40) * (booking.duration || 2)}</span></div>
              ${booking.couponApplied ? `<div><span>Discount:</span><span>-${booking.couponDiscount}%</span></div>` : ''}
              <div class="grand-total"><span>Amount Paid:</span><span>₹${booking.totalAmount}</span></div>
            </div>
            <div class="footer">
              Thank you for parking with ParkHub! For support, contact support@parkeasy.in
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [bookingVehicles, setBookingVehicles] = useState([
    { id: 1, type: 'four-wheeler', number: '' }
  ]);

  useEffect(() => {
    if (selectedLocation) {
      const defaultVeh = userVehicles.find(v => v.isDefault) || userVehicles[0];
      const initialNum = defaultVeh ? defaultVeh.number : '';
      const initialType = defaultVeh && (defaultVeh.type?.toLowerCase().includes('bike') || defaultVeh.type?.toLowerCase().includes('two')) ? 'two-wheeler' : 'four-wheeler';
      
      setBookingVehicles([{ id: Date.now(), type: initialType, number: initialNum }]);
      setBookingDuration(2);
      setAppliedCoupon('');
      setCouponDiscount(0);
      setCouponError('');
    }
  }, [selectedLocation, userVehicles]);

  const [bookingDuration, setBookingDuration] = useState(2);
  const [selectedPastBookings, setSelectedPastBookings] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [showUPIScreen, setShowUPIScreen] = useState(false);
  const [upiPin, setUpiPin] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('online');
  const [razorpayTab, setRazorpayTab] = useState('card');
  const [dummyCard, setDummyCard] = useState('');
  const [dummyExpiry, setDummyExpiry] = useState('');
  const [dummyCvv, setDummyCvv] = useState('');

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const mapCenter = { lat: 13.0827, lng: 80.2707 };

  const filteredLocations = locations.filter(loc => {
    const matchesSearch = searchQuery === '' || 
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVehicle = vehicleFilter === 'all' || 
      (vehicleFilter === 'two-wheeler' && loc.totalSlots.twoWheeler > 0) ||
      (vehicleFilter === 'four-wheeler' && loc.totalSlots.fourWheeler > 0);
    const matchesCCTV = !cctvFilter || loc.cctvEnabled;
    const isOnline = loc.status !== 'inactive';
    
    return matchesSearch && matchesVehicle && matchesCCTV && isOnline;
  });

  const sortedLocations = React.useMemo(() => {
    const mapped = filteredLocations.map(loc => {
      if (userCoords) {
        const dist = getDistance(userCoords.lat, userCoords.lng, loc.latitude, loc.longitude);
        return { ...loc, distance: dist };
      }
      return { ...loc, distance: undefined };
    });

    return mapped.sort((a, b) => {
      if (sortBy === 'nearest') {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        if (a.distance !== undefined) return -1;
        if (b.distance !== undefined) return 1;
        return 0;
      }
      if (sortBy === 'price-low-high') {
        return a.rates.hourly - b.rates.hourly;
      }
      if (sortBy === 'slots') {
        const slotsA = (a.availableSlots?.fourWheeler || 0) + (a.availableSlots?.twoWheeler || 0);
        const slotsB = (b.availableSlots?.fourWheeler || 0) + (b.availableSlots?.twoWheeler || 0);
        return slotsB - slotsA;
      }
      return 0;
    });
  }, [filteredLocations, userCoords, sortBy]);

  const filteredEvStations = React.useMemo(() => {
    return evStations.filter(station => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || 
        station.name.toLowerCase().includes(query) || 
        station.address.toLowerCase().includes(query);
      const matchesApproved = station.isApproved;
      return matchesSearch && matchesApproved;
    });
  }, [evStations, searchQuery]);

  const sortedEvStations = React.useMemo(() => {
    const mapped = filteredEvStations.map(station => {
      if (userCoords) {
        const dist = getDistance(userCoords.lat, userCoords.lng, station.latitude, station.longitude);
        return { ...station, distance: dist };
      }
      return { ...station, distance: undefined };
    });

    return mapped.sort((a, b) => {
      if (sortBy === 'nearest') {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        if (a.distance !== undefined) return -1;
        if (b.distance !== undefined) return 1;
        return 0;
      }
      if (sortBy === 'price-low-high') {
        return (a.rates?.perKwh || 0) - (b.rates?.perKwh || 0);
      }
      return 0;
    });
  }, [filteredEvStations, userCoords, sortBy]);

  // Compute top 3 nearest parking location IDs (always based on distance)
  const nearestThreeIds = React.useMemo(() => {
    if (!userCoords) return [];
    return [...filteredLocations]
      .map(loc => ({
        id: loc.id,
        distance: getDistance(userCoords.lat, userCoords.lng, loc.latitude, loc.longitude)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(item => item.id);
  }, [filteredLocations, userCoords]);

  const activeLoc = selectedLocation ? sortedLocations.find(l => l.id === selectedLocation.id) || selectedLocation : null;

  // Initialize and clean up Leaflet Map
  useEffect(() => {
    const L = window.L;
    if (!L || !mapRef.current) return;

    let centerLat = 13.0827;
    let centerLng = 80.2707;
    let zoomLevel = 12;

    if (userCoords) {
      const distanceToChennai = getDistance(userCoords.lat, userCoords.lng, 13.0827, 80.2707);
      if (distanceToChennai < 50) {
        centerLat = userCoords.lat;
        centerLng = userCoords.lng;
        zoomLevel = 14;
      }
    }

    const map = L.map(mapRef.current).setView([centerLat, centerLng], zoomLevel);
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
      if (routeLineRef.current) {
        routeLineRef.current = null;
      }
    };
  }, [currentTab, leafletLoaded]); // Re-run whenever tab changes or Leaflet loads so it mounts correctly

  // Sync markers when sortedLocations, selectedLocation, or currentTab changes
  useEffect(() => {
    const L = window.L;
    if (!L || !leafletMapInstance.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    if (searchMode === 'ev') {
      sortedEvStations.forEach(station => {
        const isSelected = selectedEvStation && selectedEvStation.id === station.id;
        const availableChargers = station.chargers?.filter(c => c.status === 'Available').length || 0;
        let pinColor = '#00E676'; // Green = Available
        if (availableChargers === 0) {
          pinColor = '#FF1744'; // Red = Full
        }
        
        const borderCol = isSelected ? '#FFFFFF' : '#000000';
        const scale = isSelected ? 'scale(1.2)' : 'scale(1)';

        const iconHtml = `
          <div style="display: flex; flex-direction: column; align-items: center; transform: ${scale}; transition: all 0.2s; width: 100px;">
            <div style="background: ${isSelected ? '#FFF' : '#1e1e1e'}; color: ${isSelected ? '#000' : '#FFF'}; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 6px; border: 1.5px solid ${pinColor}; margin-bottom: 2px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 5px; justify-content: center; width: fit-content; max-width: 90px; box-sizing: border-box;">
              <span>⚡ ₹${station.rates?.perKwh}/kwh</span>
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
          iconSize: [100, 60],
          iconAnchor: [50, 60]
        });

        const marker = L.marker([station.latitude, station.longitude], { icon: customIcon });
        marker.on('click', () => {
          setSelectedEvStation(station);
        });
        marker.addTo(markersGroupRef.current);

        if (isSelected) {
          leafletMapInstance.current.panTo([station.latitude, station.longitude]);
        }
      });
    } else {
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
          <div style="display: flex; flex-direction: column; align-items: center; transform: ${scale}; transition: all 0.2s; width: 100px;">
            <div style="background: ${isSelected ? '#FFF' : '#1e1e1e'}; color: ${isSelected ? '#000' : '#FFF'}; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 6px; border: 1.5px solid ${pinColor}; margin-bottom: 2px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 5px; justify-content: center; width: fit-content; max-width: 90px; box-sizing: border-box;">
              <span>&#8377;${loc.rates.hourly}/hr</span>
              ${loc.distance !== undefined ? `<span style="opacity: 0.75; font-size: 9.5px; border-left: 1px solid ${isSelected ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)'}; padding-left: 5px;">${formatDistance(loc.distance)}</span>` : ''}
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
          iconSize: [100, 60],
          iconAnchor: [50, 60]
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
    }
  }, [sortedLocations, sortedEvStations, selectedLocation, selectedEvStation, searchMode, currentTab]);

  // Center to India or user location based on SearchMode
  useEffect(() => {
    if (!leafletMapInstance.current) return;
    if (searchMode === 'ev') {
      leafletMapInstance.current.setView([20.5937, 78.9629], 5);
    } else {
      if (userCoords) {
        leafletMapInstance.current.setView([userCoords.lat, userCoords.lng], 14);
      } else {
        leafletMapInstance.current.setView([13.0827, 80.2707], 12);
      }
    }
  }, [searchMode]);

  // Draw route line from user location to selected location
  useEffect(() => {
    const L = window.L;
    if (!L || !leafletMapInstance.current || !userCoords || !selectedLocation) {
      if (routeLineRef.current && leafletMapInstance.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }
      return;
    }

    const drawRoute = async () => {
      if (routeLineRef.current && leafletMapInstance.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userCoords.lng},${userCoords.lat};${selectedLocation.longitude},${selectedLocation.latitude}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates;
            const latlngs = coords.map(c => [c[1], c[0]]);
            
            if (leafletMapInstance.current) {
              routeLineRef.current = L.polyline(latlngs, {
                color: '#00D4FF',
                weight: 5,
                opacity: 0.85,
                lineJoin: 'round'
              }).addTo(leafletMapInstance.current);

              const bounds = L.latLngBounds([
                [userCoords.lat, userCoords.lng],
                [selectedLocation.latitude, selectedLocation.longitude]
              ]);
              leafletMapInstance.current.fitBounds(bounds, { padding: [50, 50] });
              return;
            }
          }
        }
      } catch (err) {
        console.error("OSRM routing failed, falling back to direct line:", err);
      }

      if (leafletMapInstance.current) {
        routeLineRef.current = L.polyline(
          [[userCoords.lat, userCoords.lng], [selectedLocation.latitude, selectedLocation.longitude]],
          {
            color: '#7B61FF',
            weight: 4,
            opacity: 0.8,
            dashArray: '8, 8'
          }
        ).addTo(leafletMapInstance.current);

        const bounds = L.latLngBounds([
          [userCoords.lat, userCoords.lng],
          [selectedLocation.latitude, selectedLocation.longitude]
        ]);
        leafletMapInstance.current.fitBounds(bounds, { padding: [50, 50] });
      }
    };

    drawRoute();

    return () => {
      if (routeLineRef.current && leafletMapInstance.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }
    };
  }, [userCoords, selectedLocation]);



  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    if (!user) return; // Only track when logged in

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setLocationLoading(false);
      return;
    }

    setLocationLoading(true);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setLocationLoading(false);
        setLocationError(null);
      },
      (error) => {
        console.error("Error watching location:", error);
        setLocationError("GPS signal blocked. Please enable location permissions.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [user]);

  useEffect(() => {
    if (userCoords && leafletMapInstance.current && !hasCentered) {
      const distanceToChennai = getDistance(userCoords.lat, userCoords.lng, 13.0827, 80.2707);
      if (distanceToChennai < 50) {
        leafletMapInstance.current.setView([userCoords.lat, userCoords.lng], 14);
      } else {
        const defaultLoc = sortedLocations[0] || { latitude: 13.0827, longitude: 80.2707 };
        leafletMapInstance.current.setView([defaultLoc.latitude, defaultLoc.longitude], 12);
      }
      setHasCentered(true);
    }
  }, [userCoords, hasCentered, sortedLocations]);

  useEffect(() => {
    const L = window.L;
    if (!L || !leafletMapInstance.current || !userCoords) return;

    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
    } else {
      const pulseIcon = L.divIcon({
        html: `
          <div style="position: relative; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 14px; height: 14px; background: #2979FF; border: 2px solid #FFF; border-radius: 50%; box-shadow: 0 0 8px rgba(41, 121, 255, 0.6); z-index: 2;"></div>
            <div style="position: absolute; width: 32px; height: 32px; background: rgba(41, 121, 255, 0.3); border-radius: 50%; animation: pulse 2s infinite; z-index: 1;"></div>
          </div>
        `,
        className: 'user-loc-pulse',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      userLocationMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon: pulseIcon })
        .addTo(leafletMapInstance.current)
        .bindPopup("You are here");
    }
  }, [userCoords]);

  const handleLocateUser = () => {
    if (userCoords && leafletMapInstance.current) {
      leafletMapInstance.current.setView([userCoords.lat, userCoords.lng], 14);
    } else {
      showAlert("GPS signal not acquired yet. Please ensure location permissions are enabled.", "Location Services");
    }
  };

  const handleApplyCoupon = () => {
    const code = appliedCoupon.trim().toUpperCase();
    const c = INITIAL_COUPONS.find(x => x.code === code && x.active);
    if (c) {
      setCouponDiscount(c.discountPercent);
      setCouponError('');
    } else {
      setCouponError('Invalid Coupon Code');
      setCouponDiscount(0);
    }
  };

  const handleSubmitSupportTicket = (e) => {
    e.preventDefault();
    if (!supportSubject || !supportDesc) return;
    const ticket = {
      userId: user.uid || 'guest-user',
      userName: user.name || 'Guest User',
      userEmail: user.email || 'guest@spotuser.com',
      userRole: 'customer',
      subject: supportSubject,
      description: supportDesc,
      status: 'pending'
    };

    fetch(`${API_URL}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket)
    })
    .then(res => res.json())
    .then(savedTicket => {
      setComplaints(prev => [savedTicket, ...prev]);
      showAlert("Your support request has been submitted successfully.", "Ticket Submitted");
      setSupportSubject('');
      setSupportDesc('');
    })
    .catch(err => console.error("Error submitting support ticket:", err));
  };

  const handlePayAndBook = () => {
    for (let i = 0; i < bookingVehicles.length; i++) {
      const v = bookingVehicles[i];
      if (!v.number.trim()) {
        showAlert(`Please enter vehicle number for Vehicle #${i + 1}!`, "Missing Information");
        return;
      }
    }
    
    // Check available slots for all vehicle types in the booking
    const counts = { 'four-wheeler': 0, 'two-wheeler': 0 };
    bookingVehicles.forEach(v => {
      counts[v.type]++;
    });
    
    if (counts['four-wheeler'] > (activeLoc?.availableSlots?.fourWheeler ?? 0)) {
      showAlert(`Not enough available slots for Four Wheelers! Requested: ${counts['four-wheeler']}, Available: ${activeLoc?.availableSlots?.fourWheeler ?? 0}`, "No Slots Available");
      return;
    }
    if (counts['two-wheeler'] > (activeLoc?.availableSlots?.twoWheeler ?? 0)) {
      showAlert(`Not enough available slots for Two Wheelers! Requested: ${counts['two-wheeler']}, Available: ${activeLoc?.availableSlots?.twoWheeler ?? 0}`, "No Slots Available");
      return;
    }
    
    const bookingTotalAmount = Math.max(0, Math.round(
      bookingVehicles.reduce((sum, v) => {
        const base = v.type === 'four-wheeler'
          ? selectedLocation.rates.hourly * bookingDuration
          : (selectedLocation.rates.hourly * 0.6) * bookingDuration;
        return sum + base;
      }, 0) * (1 - couponDiscount/100)
    ));

    if (selectedPaymentMethod === 'wallet') {
      const balance = user.walletBalance ?? 0;
      if (balance < bookingTotalAmount) {
        showAlert(`Insufficient Wallet Balance! Total required: ₹${bookingTotalAmount}, Available: ₹${balance}. Please top up your wallet or choose another payment method.`, "Insufficient Balance");
        return;
      }
      
      setIsProcessingPayment(true);
      setTimeout(() => {
        const newBalance = balance - bookingTotalAmount;
        const newTx = {
          id: 'tx-' + Date.now(),
          type: 'debit',
          amount: bookingTotalAmount,
          description: `Paid for Booking at ${selectedLocation.name}`,
          date: new Date().toISOString()
        };
        const updatedTxs = [newTx, ...(user.transactions || [])];
        updateProfile({ walletBalance: newBalance, transactions: updatedTxs });

        const promises = bookingVehicles.map(v => {
          const basePrice = v.type === 'four-wheeler' 
            ? selectedLocation.rates.hourly * bookingDuration
            : (selectedLocation.rates.hourly * 0.6) * bookingDuration;
          const discounted = basePrice * (1 - couponDiscount / 100);
          const itemAmount = Math.max(0, Math.round(discounted));

          const newBooking = {
            userId: user ? user.uid : "guest-user",
            locationId: selectedLocation.id,
            vehicleNumber: v.number.toUpperCase(),
            vehicleType: v.type,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + bookingDuration * 3600000).toISOString(),
            status: "active",
            totalAmount: itemAmount,
            paymentMethod: 'wallet',
            qrCodeData: `QR_PE_${selectedLocation.id}_${v.number.toUpperCase()}`
          };

          return fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBooking)
          }).then(res => res.json());
        });

        Promise.all(promises)
        .then(savedBookings => {
          setBookings(prev => [...savedBookings, ...prev]);
          fetch(`${API_URL}/locations`)
            .then(r => r.json())
            .then(data => setLocations(data))
            .catch(() => {});
          setIsProcessingPayment(false);
          setSelectedLocation(null);
          setCurrentTab('bookings');
          showAlert("Payment completed using your ParkHub Wallet! Booking confirmed.", "Payment Success ✅");
        })
        .catch(err => {
          console.error("Error creating wallet bookings:", err);
          setIsProcessingPayment(false);
        });
      }, 1500);
    } else if (selectedPaymentMethod === 'online') {
      setShowUPIScreen(true);
    } else {
      // Cash payment
      setIsProcessingPayment(true);
      const promises = bookingVehicles.map(v => {
        const basePrice = v.type === 'four-wheeler' 
          ? selectedLocation.rates.hourly * bookingDuration
          : (selectedLocation.rates.hourly * 0.6) * bookingDuration;
        const discounted = basePrice * (1 - couponDiscount / 100);
        const totalAmount = Math.max(0, Math.round(discounted));

        const newBooking = {
          userId: user ? user.uid : "guest-user",
          locationId: selectedLocation.id,
          vehicleNumber: v.number.toUpperCase(),
          vehicleType: v.type,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + bookingDuration * 3600000).toISOString(),
          status: "active",
          totalAmount,
          paymentMethod: 'cash',
          qrCodeData: `QR_PE_${selectedLocation.id}_${v.number.toUpperCase()}`
        };

        return fetch(`${API_URL}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBooking)
        }).then(res => res.json());
      });

      Promise.all(promises)
      .then(savedBookings => {
        setBookings(prev => [...savedBookings, ...prev]);
        // Refresh locations from server to get accurate slot counts
        fetch(`${API_URL}/locations`)
          .then(r => r.json())
          .then(data => setLocations(data))
          .catch(() => {});
        setIsProcessingPayment(false);
        setSelectedLocation(null);
        setCurrentTab('bookings');
        showAlert("Booking generated successfully! Please pay cash to host using OTP or QR code.", "Booking Generated ✅");
      })
      .catch(err => {
        console.error("Error creating cash bookings:", err);
        setIsProcessingPayment(false);
      });
    }
  };

  const handleConfirmUPIPayment = () => {
    if (razorpayTab === 'upi' && upiPin.length < 4) {
      showAlert("Please enter a valid UPI ID", "Security Verification");
      return;
    }
    if (razorpayTab === 'card' && (dummyCard.length < 16 || dummyExpiry.length < 4 || dummyCvv.length < 3)) {
      showAlert("Please enter valid card details", "Security Verification");
      return;
    }
    
    setIsProcessingPayment(true);
    setTimeout(() => {
      const promises = bookingVehicles.map(v => {
        const basePrice = v.type === 'four-wheeler' 
          ? selectedLocation.rates.hourly * bookingDuration
          : (selectedLocation.rates.hourly * 0.6) * bookingDuration;
        const discounted = basePrice * (1 - couponDiscount / 100);
        const totalAmount = Math.max(0, Math.round(discounted));

        const newBooking = {
          userId: user ? user.uid : "guest-user",
          locationId: selectedLocation.id,
          vehicleNumber: v.number.toUpperCase(),
          vehicleType: v.type,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + bookingDuration * 3600000).toISOString(),
          status: "active",
          totalAmount,
          paymentMethod: 'online',
          qrCodeData: `QR_PE_${selectedLocation.id}_${v.number.toUpperCase()}`
        };

        return fetch(`${API_URL}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBooking)
        }).then(res => res.json());
      });

      Promise.all(promises)
      .then(savedBookings => {
        setBookings(prev => [...savedBookings, ...prev]);
        // Refresh locations from server to get accurate slot counts
        fetch(`${API_URL}/locations`)
          .then(r => r.json())
          .then(data => setLocations(data))
          .catch(() => {});
        setIsProcessingPayment(false);
        setShowUPIScreen(false);
        setUpiPin('');
        setDummyCard('');
        setDummyExpiry('');
        setDummyCvv('');
        setSelectedLocation(null);
        setCurrentTab('bookings');
        showAlert("Payment processed via Razorpay simulation! Booking confirmed.", "Payment Success ✅");
      })
      .catch(err => {
        console.error("Error creating bookings:", err);
        setIsProcessingPayment(false);
      });
    }, 2000);
  };

  const handleCancelBooking = (bookingId) => {
    fetch(`${API_URL}/bookings/${bookingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' })
    })
    .then(res => res.json())
    .then(updatedBooking => {
      setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));
      // Refresh locations from server to get accurate slot counts
      fetch(`${API_URL}/locations`)
        .then(r => r.json())
        .then(data => setLocations(data))
        .catch(() => {});
      showAlert("Your booking has been cancelled successfully.", "Booking Cancelled");
    })
    .catch(err => {
      console.error("Error cancelling booking:", err);
      showAlert("Failed to cancel booking. Please try again.", "Error");
    });
  };


  const handleCheckOut = (bookingId) => {
    fetch(`${API_URL}/bookings/${bookingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    })
    .then(res => res.json())
    .then(updatedBooking => {
      setBookings(prev => prev.map(b => b.id === bookingId ? updatedBooking : b));
      // Refresh locations from server to get accurate slot counts
      fetch(`${API_URL}/locations`)
        .then(r => r.json())
        .then(data => setLocations(data))
        .catch(() => {});
      showAlert("Exit gate barrier open. Drive safe! \nYour booking has been completed.", "Check-out Successful ✅");
    })
    .catch(err => {
      console.error("Error checking out:", err);
      showAlert("Failed to check out. Please try again.", "Error");
    });
  };

  const handleDeleteBooking = (bookingId) => {
    fetch(`${API_URL}/bookings/${bookingId}`, {
      method: 'DELETE'
    })
    .then(res => {
      if (res.ok) {
        setBookings(prev => prev.filter(b => b.id !== bookingId));
        setSelectedPastBookings(prev => prev.filter(id => id !== bookingId));
        showAlert("Booking history entry deleted.", "Success");
      } else {
        showAlert("Failed to delete booking.", "Error");
      }
    })
    .catch(err => {
      console.error("Error deleting booking:", err);
      showAlert("Error deleting booking.", "Error");
    });
  };

  const handleDeleteSelectedBookings = () => {
    if (selectedPastBookings.length === 0) return;
    showConfirm(`Are you sure you want to delete the ${selectedPastBookings.length} selected bookings from your history?`, () => {
      const promises = selectedPastBookings.map(bookingId => 
        fetch(`${API_URL}/bookings/${bookingId}`, {
          method: 'DELETE'
        })
      );
      Promise.all(promises)
      .then(() => {
        setBookings(prev => prev.filter(b => !selectedPastBookings.includes(b.id)));
        setSelectedPastBookings([]);
        showAlert("Selected bookings deleted successfully.", "Success");
      })
      .catch(err => {
        console.error("Error deleting selected bookings:", err);
        showAlert("Error deleting some bookings.", "Error");
      });
    }, "Confirm Deletion");
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

  if (!user) {
    return <LoginScreen onLogin={(emailOrPhone, password) => loginWithCredentials(emailOrPhone, password)} onGoogleLogin={loginWithGoogle} onGuestLogin={loginAsGuest} roleHint="Customer" />;
  }

  return (
    <div className="dashboard-grid" style={{ 
      display: 'grid', 
      gridTemplateColumns: isMobile ? '1fr' : '250px 1fr', 
      minHeight: '100vh',
      width: '100vw',
      overflowX: 'hidden'
    }}>
      {/* Mobile Top Header */}
      {isMobile && (
        <header style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'rgba(6, 11, 24, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0, 212, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
          zIndex: 99
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,212,255,0.3)' }}>
              <img src="/parkhub_logo.png" alt="ParkHub Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '21px', fontWeight: '800', background: 'linear-gradient(135deg, #00D4FF, #7B61FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>{t('appName')}</h1>
          </div>
        </header>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '0', borderRight: '1px solid rgba(0,212,255,0.1)', background: 'rgba(6,11,24,0.95)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,212,255,0.35)' }}>
                <img src="/parkhub_logo.png" alt="ParkHub Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: '800', background: 'linear-gradient(135deg, #00D4FF, #7B61FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>{t('appName')}</h1>
                <p style={{ fontSize: '9px', color: 'var(--primary)', fontWeight: '700', letterSpacing: '1.5px', opacity: 0.8 }}>CUSTOMER PORTAL</p>
              </div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button onClick={() => setCurrentTab('home')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '11px 14px', borderRadius: '10px', border: 'none', borderLeft: currentTab === 'home' ? '3px solid var(--primary)' : '3px solid transparent', background: currentTab === 'home' ? 'rgba(0,212,255,0.1)' : 'transparent', color: currentTab === 'home' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: currentTab === 'home' ? '700' : '500', transition: 'all 0.2s ease', fontSize: '14px' }}>
                <MapPin size={17} />
                <span>{t('home')}</span>
              </button>
              <button onClick={() => setCurrentTab('bookings')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '11px 14px', borderRadius: '10px', border: 'none', borderLeft: currentTab === 'bookings' ? '3px solid var(--primary)' : '3px solid transparent', background: currentTab === 'bookings' ? 'rgba(0,212,255,0.1)' : 'transparent', color: currentTab === 'bookings' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: currentTab === 'bookings' ? '700' : '500', transition: 'all 0.2s ease', fontSize: '14px' }}>
                <Calendar size={17} />
                <span>{t('bookings')}</span>
              </button>
              <button onClick={() => setCurrentTab('wallet')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '11px 14px', borderRadius: '10px', border: 'none', borderLeft: currentTab === 'wallet' ? '3px solid var(--primary)' : '3px solid transparent', background: currentTab === 'wallet' ? 'rgba(0,212,255,0.1)' : 'transparent', color: currentTab === 'wallet' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: currentTab === 'wallet' ? '700' : '500', transition: 'all 0.2s ease', fontSize: '14px' }}>
                <Wallet size={17} />
                <span>Wallet Balance</span>
              </button>
              <button onClick={() => setCurrentTab('profile')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '11px 14px', borderRadius: '10px', border: 'none', borderLeft: currentTab === 'profile' ? '3px solid var(--secondary)' : '3px solid transparent', background: currentTab === 'profile' ? 'rgba(123,97,255,0.1)' : 'transparent', color: currentTab === 'profile' ? 'var(--secondary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: currentTab === 'profile' ? '700' : '500', transition: 'all 0.2s ease', fontSize: '14px' }}>
                <Users size={17} />
                <span>{t('profile')}</span>
              </button>
              <button onClick={() => setCurrentTab('support')} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '11px 14px', borderRadius: '10px', border: 'none', borderLeft: currentTab === 'support' ? '3px solid var(--primary)' : '3px solid transparent', background: currentTab === 'support' ? 'rgba(0,212,255,0.1)' : 'transparent', color: currentTab === 'support' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: currentTab === 'support' ? '700' : '500', transition: 'all 0.2s ease', fontSize: '14px' }}>
                <HelpCircle size={17} />
                <span>{t('support')}</span>
              </button>
            </nav>
          </div>

          <div>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', marginBottom: '16px' }}>
                <img src={user.profilePic} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600' }}>{user.name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('roleCustomer')}</p>
                </div>
              </div>
            )}

            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid rgba(255,51,102,0.2)', background: 'rgba(255,51,102,0.06)', color: '#FF3366', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.2s ease', letterSpacing: '0.3px' }}>
              <LogOut size={16} />
              <span>{t('logout')}</span>
            </button>
          </div>
        </aside>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '65px',
          background: 'rgba(6, 11, 24, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(0, 212, 255, 0.15)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 99,
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
          {[
            { id: 'home', label: t('home'), icon: <MapPin size={20} /> },
            { id: 'bookings', label: t('bookings'), icon: <Calendar size={20} /> },
            { id: 'wallet', label: 'Wallet', icon: <Wallet size={20} /> },
            { id: 'profile', label: t('profile'), icon: <User size={20} /> },
            { id: 'support', label: t('support'), icon: <HelpCircle size={20} /> }
          ].map(tab => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px 0',
                  width: '20%',
                  gap: '4px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.2s'
                }}>
                  {tab.icon}
                </div>
                <span style={{ fontSize: '10px', fontWeight: isActive ? '700' : '500' }}>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      <main style={{ 
        padding: isMobile ? '16px' : '32px', 
        overflowY: 'auto', 
        maxHeight: isMobile ? 'calc(100vh - 125px)' : '100vh',
        marginTop: isMobile ? '60px' : '0',
        paddingBottom: isMobile ? '90px' : '32px'
      }}>
        {currentTab === 'home' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '26px', fontWeight: '800', background: 'linear-gradient(135deg, #F0F4FF 0%, #8B9AC4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('tagline')}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '5px' }}>Find and reserve secure vehicle spots instantly.</p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button 
                onClick={() => { setSearchMode('parking'); setSelectedEvStation(null); setSearchQuery(''); }} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '10px 20px', 
                  borderRadius: '30px', 
                  border: searchMode === 'parking' ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)', 
                  background: searchMode === 'parking' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)', 
                  color: searchMode === 'parking' ? 'var(--primary)' : '#FFF', 
                  fontSize: '13px', 
                  fontWeight: '700', 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: searchMode === 'parking' ? '0 4px 15px rgba(0, 212, 255, 0.2)' : 'none'
                }}
              >
                🚗 Find Parking Spaces
              </button>
              <button 
                onClick={() => { setSearchMode('ev'); setSelectedLocation(null); setSearchQuery(''); }} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '10px 20px', 
                  borderRadius: '30px', 
                  border: searchMode === 'ev' ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)', 
                  background: searchMode === 'ev' ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)', 
                  color: searchMode === 'ev' ? 'var(--primary)' : '#FFF', 
                  fontSize: '13px', 
                  fontWeight: '700', 
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: searchMode === 'ev' ? '0 4px 15px rgba(0, 212, 255, 0.2)' : 'none'
                }}
              >
                ⚡ EV Charging Spots
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flex: 1, minWidth: '240px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" value={searchQuery} onChange={handleSearch} placeholder={t('searchPlaceholder')} style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#FFF', fontSize: '14px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-primary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <button onClick={() => setVehicleFilter('all')} style={{ padding: '8px 12px', background: vehicleFilter === 'all' ? 'var(--bg-tertiary)' : 'transparent', border: 'none', color: '#FFF', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>{t('all')}</button>
                <button onClick={() => setVehicleFilter('two-wheeler')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: vehicleFilter === 'two-wheeler' ? 'var(--bg-tertiary)' : 'transparent', border: 'none', color: '#FFF', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}><Bike size={14} /><span>{t('twoWheeler')}</span></button>
                <button onClick={() => setVehicleFilter('four-wheeler')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: vehicleFilter === 'four-wheeler' ? 'var(--bg-tertiary)' : 'transparent', border: 'none', color: '#FFF', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}><Car size={14} /><span>{t('fourWheeler')}</span></button>
              </div>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#FFF', fontSize: '13px', cursor: 'pointer', outline: 'none' }}>
                <option value="nearest">{t('distanceNear')}</option>
                <option value="price-low-high">{t('priceLowHigh')}</option>
                <option value="slots">{t('availableSlots')}</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <div 
                    ref={mapRef} 
                    className="glass-panel" 
                    style={{ 
                      width: '100%', 
                      height: isMobile ? 'calc(100vw - 32px)' : '600px', 
                      minWidth: '100%', 
                      minHeight: isMobile ? 'calc(100vw - 32px)' : '600px', 
                      zIndex: 1, 
                      borderRadius: '8px',
                    }} 
                  />
                  {locationLoading && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1000,
                      gap: '12px',
                      borderRadius: '8px'
                    }}>
                      <RefreshCw className="spinning" size={28} color="var(--primary)" style={{ animation: 'spin 1.5s linear infinite' }} />
                      <p style={{ color: '#FFF', fontSize: '13px', fontWeight: '600', letterSpacing: '0.5px' }}>Acquiring Live GPS Signal...</p>
                    </div>
                  )}
                  {locationError && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      right: '12px',
                      background: 'rgba(255, 23, 68, 0.95)',
                      color: '#FFF',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      zIndex: 999,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}>
                      <span>⚠️ GPS Signal Blocked. Enable location permissions for nearest routing.</span>
                      <button 
                        onClick={() => setLocationError(null)} 
                        style={{ background: 'transparent', border: 'none', color: '#FFF', fontWeight: 'bold', cursor: 'pointer', padding: '0 4px' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
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

              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '560px', overflowY: 'auto' }}>
                {searchMode === 'ev' ? (
                  selectedEvStation ? (
                    <div className="glass-panel animate-fade-in" style={{ padding: '24px', position: 'relative' }}>
                      <button onClick={() => setSelectedEvStation(null)} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                        <img 
                          src="https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=400" 
                          alt={selectedEvStation.name} 
                          style={{ width: '120px', height: '90px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ fontSize: '11px', background: 'rgba(0, 212, 255, 0.1)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: '600', width: 'fit-content' }}>⚡ EV Charging Hub</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: 'bold' }}><Star size={11} fill="gold" stroke="gold" /> {selectedEvStation.rating}</span>
                          {selectedEvStation.distance !== undefined && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📍 {formatDistance(selectedEvStation.distance)}</span>
                          )}
                        </div>
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '6px' }}>{selectedEvStation.name}</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedEvStation.address}</p>
                      
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', margin: '16px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '12px 0' }}>
                        <div style={{ flex: 1, minWidth: '100px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Price per kWh</span>
                          <p style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)', marginTop: '2px' }}>₹{selectedEvStation.rates?.perKwh}/kWh</p>
                        </div>
                        <div style={{ flex: 1, minWidth: '100px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Amenities</span>
                          <p style={{ fontSize: '12px', fontWeight: '600', marginTop: '2px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {selectedEvStation.amenities?.map(a => <span key={a} style={{ background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '4px' }}>{a}</span>)}
                          </p>
                        </div>
                      </div>

                      <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>Select Charger & Reserve</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedEvStation.chargers?.map(charger => {
                          const isAvailable = charger.status === 'Available';
                          return (
                            <div key={charger.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                              <div>
                                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{charger.type} Connector</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>({charger.power} kW)</span>
                              </div>
                              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <span style={{ 
                                  fontSize: '11px', 
                                  fontWeight: '700', 
                                  color: charger.status === 'Available' ? '#00E676' : charger.status === 'Reserved' ? '#FF9100' : charger.status === 'Occupied' ? '#FF1744' : '#90A4AE' 
                                }}>
                                  {charger.status}
                                </span>
                                {isAvailable && (
                                  <button 
                                    onClick={() => { setSelectedCharger(charger); setShowEvReserveModal(true); }}
                                    className="glow-button" 
                                    style={{ padding: '6px 12px', fontSize: '11px' }}
                                  >
                                    Book
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Nearby EV Charging Spots ({sortedEvStations.length})</h3>
                      {sortedEvStations.map(station => {
                        const isSelected = selectedEvStation && selectedEvStation.id === station.id;
                        const availableChargers = station.chargers?.filter(c => c.status === 'Available').length || 0;
                        return (
                          <div 
                            key={station.id}
                            className="glass-panel"
                            style={{ 
                              padding: '16px', 
                              cursor: 'pointer',
                              border: isSelected ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                              background: isSelected ? 'rgba(0, 212, 255, 0.05)' : 'var(--glass-bg)',
                              transition: 'all 0.2s'
                            }} 
                            onClick={() => setSelectedEvStation(station)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>₹{station.rates?.perKwh}/kWh</span>
                                {station.distance && (
                                  <span style={{ fontSize: '10px', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                                    {formatDistance(station.distance)}
                                  </span>
                                )}
                                <span style={{ fontSize: '10px', background: 'rgba(0,230,118,0.1)', color: '#00E676', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                                  {availableChargers} / {station.chargers?.length} Available
                                </span>
                              </div>
                              <a 
                                href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '6px 12px',
                                  background: 'var(--primary)',
                                  color: '#000',
                                  borderRadius: '6px',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  textDecoration: 'none',
                                  transition: 'all 0.2s',
                                  boxShadow: '0 2px 8px rgba(0, 212, 255, 0.2)'
                                }}
                              >
                                <Navigation size={10} style={{ transform: 'rotate(45deg)', fill: '#000' }} />
                                <span>Navigate</span>
                              </a>
                            </div>
                            <h4 style={{ fontSize: '15px', fontWeight: '700', marginTop: '8px' }}>{station.name}</h4>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{station.address}</p>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                              {station.chargers?.map(c => (
                                <span key={c.id} style={{ fontSize: '9px', background: 'rgba(255,255,255,0.03)', padding: '2px 5px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                                  {c.type} ({c.power}kW)
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )
                ) : (
                  selectedLocation && activeLoc ? (
                    <div className="glass-panel animate-fade-in" style={{ padding: '24px', position: 'relative' }}>
                      <button onClick={() => setSelectedLocation(null)} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                        <img 
                          src={activeLoc.images && activeLoc.images[0] && activeLoc.images[0].trim() !== "" ? activeLoc.images[0] : "https://images.unsplash.com/photo-1506521788723-85811181d4db?auto=format&fit=crop&q=80&w=400"} 
                          alt={activeLoc.name} 
                          style={{ width: '120px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} 
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>{activeLoc.cctvEnabled ? t('cctvActive') : t('cctvReady')}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: 'bold' }}><Star size={11} fill="gold" stroke="gold" /> {activeLoc.rating}</span>
                            {activeLoc.distance !== undefined && activeLoc.distance !== null && (
                              <>
                                <span style={{ fontSize: '11px', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                                  📍 {formatDistance(activeLoc.distance)}
                                </span>
                                <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.05)', color: '#FFF', padding: '2px 6px', borderRadius: '4px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Clock size={11} />
                                  {getEstimatedTime(activeLoc.distance)}
                                </span>
                                {nearestThreeIds.includes(activeLoc.id) && (
                                  <span style={{
                                    fontSize: '10px',
                                    background: 'rgba(0, 230, 118, 0.15)',
                                    color: '#00E676',
                                    border: '1px solid rgba(0, 230, 118, 0.3)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: '800',
                                    letterSpacing: '0.5px'
                                  }}>
                                    NEAREST
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '6px' }}>{activeLoc.name}</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{activeLoc.address}</p>
                        <a 
                          href={userCoords 
                            ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${activeLoc.latitude},${activeLoc.longitude}&travelmode=driving` 
                            : `https://www.google.com/maps/dir/?api=1&destination=${activeLoc.latitude},${activeLoc.longitude}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '8px',
                            padding: '8px 16px',
                            background: 'var(--primary)',
                            color: '#000',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(0, 212, 255, 0.3)'
                          }}
                        >
                          <Navigation size={12} style={{ transform: 'rotate(45deg)', fill: '#000' }} />
                          <span>Navigate Now</span>
                        </a>
                      </div>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>{activeLoc.description}</p>

                    {/* Live Slot Inventory Display */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: (activeLoc.availableSlots?.twoWheeler ?? 0) > 0 ? 'rgba(0, 229, 160, 0.15)' : 'rgba(255, 51, 102, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px'
                        }}>
                          🏍️
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>2-Wheeler Available</div>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: (activeLoc.availableSlots?.twoWheeler ?? 0) > 0 ? '#00E5A0' : '#FF3366' }}>
                            {activeLoc.availableSlots?.twoWheeler ?? 0} / {activeLoc.totalSlots?.twoWheeler ?? 0}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: (activeLoc.availableSlots?.fourWheeler ?? 0) > 0 ? 'rgba(0, 229, 160, 0.15)' : 'rgba(255, 51, 102, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px'
                        }}>
                          🚗
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>4-Wheeler Available</div>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: (activeLoc.availableSlots?.fourWheeler ?? 0) > 0 ? '#00E5A0' : '#FF3366' }}>
                            {activeLoc.availableSlots?.fourWheeler ?? 0} / {activeLoc.totalSlots?.fourWheeler ?? 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--primary)' }}>Book a Spot</h4>
                      
                      {bookingVehicles.map((veh, index) => (
                        <div key={veh.id} style={{ 
                          background: 'rgba(255,255,255,0.01)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '10px', 
                          padding: '12px', 
                          marginBottom: '12px', 
                          position: 'relative'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vehicle #{index + 1}</span>
                            {bookingVehicles.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => setBookingVehicles(bookingVehicles.filter(v => v.id !== veh.id))} 
                                style={{ 
                                  background: 'transparent', 
                                  border: 'none', 
                                  color: '#FF1744', 
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 'bold'
                                }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                             <div>
                               <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>Select Vehicle Type</label>
                               <div style={{ display: 'flex', gap: '8px' }}>
                                 <button
                                   type="button"
                                   onClick={() => {
                                     const newVehs = [...bookingVehicles];
                                     newVehs[index].type = 'four-wheeler';
                                     setBookingVehicles(newVehs);
                                   }}
                                   style={{
                                     flex: 1,
                                     padding: '10px',
                                     borderRadius: '8px',
                                     border: veh.type === 'four-wheeler' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                     background: veh.type === 'four-wheeler' ? 'rgba(0, 212, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                                     color: veh.type === 'four-wheeler' ? 'var(--primary)' : '#FFF',
                                     cursor: 'pointer',
                                     fontWeight: 'bold',
                                     fontSize: '12px',
                                     display: 'flex',
                                     alignItems: 'center',
                                     justifyContent: 'center',
                                     gap: '6px',
                                     transition: 'all 0.2s ease'
                                   }}
                                 >
                                   🚗 Car / SUV
                                 </button>
                                 <button
                                   type="button"
                                   onClick={() => {
                                     const newVehs = [...bookingVehicles];
                                     newVehs[index].type = 'two-wheeler';
                                     setBookingVehicles(newVehs);
                                   }}
                                   style={{
                                     flex: 1,
                                     padding: '10px',
                                     borderRadius: '8px',
                                     border: veh.type === 'two-wheeler' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                     background: veh.type === 'two-wheeler' ? 'rgba(0, 212, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                                     color: veh.type === 'two-wheeler' ? 'var(--primary)' : '#FFF',
                                     cursor: 'pointer',
                                     fontWeight: 'bold',
                                     fontSize: '12px',
                                     display: 'flex',
                                     alignItems: 'center',
                                     justifyContent: 'center',
                                     gap: '6px',
                                     transition: 'all 0.2s ease'
                                   }}
                                 >
                                   🏍️ Two-Wheeler
                                 </button>
                               </div>
                             </div>
                             <div>
                               <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600' }}>Vehicle Number Plate</label>
                               <input 
                                 type="text" 
                                 value={veh.number} 
                                 onChange={(e) => {
                                   const newVehs = [...bookingVehicles];
                                   newVehs[index].number = e.target.value;
                                   setBookingVehicles(newVehs);
                                 }} 
                                 placeholder="e.g. TN-01-AB-1234" 
                                 style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF', textTransform: 'uppercase', fontSize: '13px', fontWeight: 'bold', outline: 'none', boxSizing: 'border-box' }} 
                               />
                               {userVehicles && userVehicles.length > 0 && (
                                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px', alignItems: 'center' }}>
                                   <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Quick Select:</span>
                                   {userVehicles.map(v => (
                                     <button
                                       key={v.id}
                                       type="button"
                                       onClick={() => {
                                         const newVehs = [...bookingVehicles];
                                         newVehs[index].number = v.number;
                                         newVehs[index].type = (v.type?.toLowerCase().includes('bike') || v.type?.toLowerCase().includes('two')) ? 'two-wheeler' : 'four-wheeler';
                                         setBookingVehicles(newVehs);
                                       }}
                                       style={{
                                         background: 'rgba(255, 255, 255, 0.04)',
                                         border: '1px solid var(--border-color)',
                                         color: 'var(--primary)',
                                         padding: '3px 8px',
                                         borderRadius: '6px',
                                         fontSize: '10px',
                                         cursor: 'pointer',
                                         fontWeight: '700',
                                         transition: 'all 0.2s'
                                       }}
                                       onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 212, 255, 0.08)'}
                                       onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
                                     >
                                       {v.number} {v.brand ? `(${v.brand})` : ''}
                                     </button>
                                   ))}
                                 </div>
                               )}
                             </div>
                           </div>
                        </div>
                      ))}
                      
                      <button 
                        type="button" 
                        onClick={() => setBookingVehicles([...bookingVehicles, { id: Date.now() + Math.random(), type: 'four-wheeler', number: '' }])}
                        style={{ 
                          width: '100%', 
                          padding: '10px', 
                          background: 'rgba(0, 212, 255, 0.05)', 
                          border: '1px dashed var(--primary-border)', 
                          borderRadius: '8px', 
                          color: 'var(--primary)', 
                          cursor: 'pointer', 
                          fontWeight: 'bold', 
                          fontSize: '12px', 
                          marginBottom: '16px',
                          transition: 'all 0.2s'
                        }}
                      >
                        + Add Another Vehicle (Multiple Spot Booking)
                      </button>
 
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>{t('bookingDuration')}</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button 
                              type="button" 
                              onClick={() => setBookingDuration(Math.max(1, bookingDuration - 1))}
                              style={{ width: '34px', height: '34px', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '14px', fontWeight: '800', width: '32px', textAlign: 'center' }}>{bookingDuration}h</span>
                            <button 
                              type="button" 
                              onClick={() => setBookingDuration(Math.min(24, bookingDuration + 1))}
                              style={{ width: '34px', height: '34px', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: '#FFF', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('couponCode')}</label>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input type="text" value={appliedCoupon} onChange={(e) => setAppliedCoupon(e.target.value)} placeholder="CHENNAI50" style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF', fontSize: '12px' }} />
                            <button onClick={handleApplyCoupon} style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>{t('apply')}</button>
                          </div>
                          {couponDiscount > 0 && <span style={{ color: 'var(--primary)', fontSize: '10px' }}>Coupon Applied! {couponDiscount}% Off</span>}
                        </div>
                      </div>

                      {/* Payment Method Selector */}
                      <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-secondary)' }}>SELECT PAYMENT METHOD</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                          <div 
                            onClick={() => setSelectedPaymentMethod('online')} 
                            style={{ 
                              padding: '10px 4px', 
                              borderRadius: '6px', 
                              border: selectedPaymentMethod === 'online' ? '2px solid var(--primary)' : '1px solid var(--border-color)', 
                              background: selectedPaymentMethod === 'online' ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                              cursor: 'pointer',
                              textAlign: 'center',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}
                          >
                            💳 Online
                          </div>
                          <div 
                            onClick={() => setSelectedPaymentMethod('cash')} 
                            style={{ 
                              padding: '10px 4px', 
                              borderRadius: '6px', 
                              border: selectedPaymentMethod === 'cash' ? '2px solid var(--primary)' : '1px solid var(--border-color)', 
                              background: selectedPaymentMethod === 'cash' ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                              cursor: 'pointer',
                              textAlign: 'center',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}
                          >
                            💵 Cash
                          </div>
                          <div 
                            onClick={() => setSelectedPaymentMethod('wallet')} 
                            style={{ 
                              padding: '10px 4px', 
                              borderRadius: '6px', 
                              border: selectedPaymentMethod === 'wallet' ? '2px solid var(--primary)' : '1px solid var(--border-color)', 
                              background: selectedPaymentMethod === 'wallet' ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                              cursor: 'pointer',
                              textAlign: 'center',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}
                          >
                            👛 Wallet (₹{user.walletBalance ?? 0})
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total amount:</span>
                          <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)' }}>
                            ₹{Math.max(0, Math.round(
                              bookingVehicles.reduce((sum, v) => {
                                const base = v.type === 'four-wheeler'
                                  ? selectedLocation.rates.hourly * bookingDuration
                                  : (selectedLocation.rates.hourly * 0.6) * bookingDuration;
                                return sum + base;
                              }, 0) * (1 - couponDiscount/100)
                            ))}
                          </h3>
                        </div>
                        <button onClick={handlePayAndBook} className="glow-button" style={{ padding: '14px 28px' }}>
                          <Smartphone size={16} />
                          <span>{selectedPaymentMethod === 'online' ? t('payWithUPI') : selectedPaymentMethod === 'wallet' ? 'Pay with Wallet' : 'Book Now (Cash)'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                ) : (
                  <>
                <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Nearby Parking Spaces ({sortedLocations.length})</h3>
                {sortedLocations.map(loc => {
                  const isFav = user && user.favoriteLocations.includes(loc.id);
                  const isSelected = selectedLocation && selectedLocation.id === loc.id;
                  const isNearest = nearestThreeIds.includes(loc.id);
                  return (
                    <div 
                      key={loc.id} 
                      className="glass-panel" 
                      style={{ 
                        padding: '16px', 
                        cursor: 'pointer',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                        background: isSelected ? 'rgba(0, 212, 255, 0.05)' : 'var(--glass-bg)',
                        transition: 'all 0.2s'
                      }} 
                      onClick={() => setSelectedLocation(loc)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>₹{loc.rates.hourly}/hr</span>
                          {loc.distance && (
                            <>
                              <span style={{ fontSize: '10px', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                                {formatDistance(loc.distance)}
                              </span>
                              <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={9} />
                                {getEstimatedTime(loc.distance)}
                              </span>
                            </>
                          )}
                          {isNearest && (
                            <span style={{
                              fontSize: '9px',
                              background: 'rgba(0, 230, 118, 0.15)',
                              color: '#00E676',
                              border: '1px solid rgba(0, 230, 118, 0.3)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontWeight: '800',
                              letterSpacing: '0.5px'
                            }}>
                              NEAREST
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <a 
                            href={userCoords 
                              ? `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${loc.latitude},${loc.longitude}&travelmode=driving` 
                              : `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              background: 'var(--primary)',
                              color: '#000',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              textDecoration: 'none',
                              transition: 'all 0.2s',
                              boxShadow: '0 2px 8px rgba(0, 212, 255, 0.2)'
                            }}
                          >
                            <Navigation size={10} style={{ transform: 'rotate(45deg)', fill: '#000' }} />
                            <span>Navigate Now</span>
                          </a>
                          <button onClick={(e) => { e.stopPropagation(); toggleFavorite(loc.id); }} style={{ background: 'transparent', border: 'none', color: isFav ? '#FF1744' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <Star size={16} fill={isFav ? '#FF1744' : 'none'} />
                          </button>
                        </div>
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: '700', marginTop: '8px' }}>{loc.name}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{loc.address}</p>
                      
                      {/* Available Slots Badges in List */}
                      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                        <span style={{ fontSize: '10px', color: (loc.availableSlots?.twoWheeler ?? 0) > 0 ? '#00E5A0' : '#FF3366', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                          🏍️ {loc.availableSlots?.twoWheeler ?? 0} / {loc.totalSlots?.twoWheeler ?? 0} {t('available')}
                        </span>
                        <span style={{ fontSize: '10px', color: (loc.availableSlots?.fourWheeler ?? 0) > 0 ? '#00E5A0' : '#FF3366', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                          🚗 {loc.availableSlots?.fourWheeler ?? 0} / {loc.totalSlots?.fourWheeler ?? 0} {t('available')}
                        </span>
                      </div>
                    </div>
                  );
                })}

                  </>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'wallet' && (
          <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>My Wallet</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              {/* Card 1: Balance & Display */}
              <div className="glass-panel" style={{ 
                padding: '32px', 
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(123, 97, 255, 0.1) 100%)', 
                border: '1px solid rgba(0, 212, 255, 0.25)', 
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '200px',
                boxSizing: 'border-box'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Available Balance</span>
                    <Wallet style={{ color: 'var(--primary)' }} size={24} />
                  </div>
                  <h1 style={{ fontSize: '36px', fontWeight: '800', marginTop: '16px', color: '#FFF' }}>
                    ₹{(user.walletBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </h1>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Card Number: **** **** **** {user.phone ? user.phone.slice(-4) : '7890'}
                </div>
              </div>

              {/* Card 2: Top-Up Form */}
              <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', height: '200px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#FFF' }}>Top-Up Wallet</h4>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#FFF', fontWeight: 'bold', fontSize: '16px' }}>₹</span>
                    <input 
                      type="number" 
                      value={topUpAmount} 
                      onChange={(e) => setTopUpAmount(e.target.value)} 
                      placeholder="Enter amount" 
                      style={{ width: '100%', padding: '10px 12px 10px 28px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#FFF', fontSize: '15px', fontWeight: 'bold', outline: 'none', boxSizing: 'border-box' }} 
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    {[100, 200, 500, 1000].map(amt => (
                      <button 
                        key={amt} 
                        onClick={() => setTopUpAmount(amt.toString())} 
                        style={{ flex: 1, padding: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--primary)', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 212, 255, 0.08)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={handleTopUpWallet} 
                  disabled={!topUpAmount || parseFloat(topUpAmount) <= 0} 
                  style={{ width: '100%', padding: '10px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: 'opacity 0.2s', opacity: (!topUpAmount || parseFloat(topUpAmount) <= 0) ? 0.5 : 1 }}
                >
                  Proceed to Top-Up
                </button>
              </div>
            </div>

            {/* Transaction History Section */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#FFF', marginBottom: '16px' }}>Transaction History</h3>
              {(!user.transactions || user.transactions.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>No transactions recorded yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {user.transactions.map((tx) => (
                    <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFF' }}>{tx.description}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: tx.type === 'credit' ? '#00E676' : '#FF1744' }}>
                        {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* UPI QR Payment Modal */}
            {showTopUpQRModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                <div className="glass-panel animate-fade-in" style={{ width: '360px', padding: '24px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(0, 212, 255, 0.25)' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px', color: '#FFF' }}>Scan UPI QR to Pay</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Scan using any UPI app (GPay, PhonePe, Paytm, etc.) to deposit <strong>₹{qrAmount}</strong></p>
                  
                  {/* Styled Mock QR Code */}
                  <div style={{ background: '#FFF', padding: '16px', borderRadius: '12px', width: '200px', height: '200px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 4px 20px rgba(0,212,255,0.2)' }}>
                    {/* SVG QR Code graphic */}
                    <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="180" height="180" fill="white"/>
                      {/* Quiet Zone & Position Markers */}
                      <rect x="10" y="10" width="40" height="40" stroke="black" strokeWidth="6" fill="none"/>
                      <rect x="20" y="20" width="20" height="20" fill="black"/>
                      <rect x="130" y="10" width="40" height="40" stroke="black" strokeWidth="6" fill="none"/>
                      <rect x="140" y="20" width="20" height="20" fill="black"/>
                      <rect x="10" y="130" width="40" height="40" stroke="black" strokeWidth="6" fill="none"/>
                      <rect x="20" y="140" width="20" height="20" fill="black"/>
                      {/* Random QR pixels */}
                      <rect x="65" y="15" width="10" height="10" fill="black"/>
                      <rect x="85" y="25" width="20" height="10" fill="black"/>
                      <rect x="110" y="15" width="10" height="15" fill="black"/>
                      <rect x="65" y="45" width="30" height="10" fill="black"/>
                      <rect x="65" y="65" width="10" height="20" fill="black"/>
                      <rect x="90" y="70" width="20" height="10" fill="black"/>
                      <rect x="120" y="60" width="10" height="30" fill="black"/>
                      <rect x="15" y="65" width="20" height="10" fill="black"/>
                      <rect x="35" y="85" width="15" height="15" fill="black"/>
                      <rect x="15" y="110" width="10" height="10" fill="black"/>
                      <rect x="60" y="120" width="30" height="20" fill="black"/>
                      <rect x="110" y="130" width="10" height="10" fill="black"/>
                      <rect x="130" y="110" width="20" height="10" fill="black"/>
                      <rect x="140" y="135" width="15" height="15" fill="black"/>
                      <rect x="100" y="100" width="20" height="20" fill="black"/>
                      <rect x="75" y="95" width="10" height="10" fill="black"/>
                      <rect x="135" y="80" width="30" height="10" fill="black"/>
                      {/* Center Logo */}
                      <rect x="75" y="75" width="30" height="30" rx="6" fill="var(--primary)"/>
                      <path d="M85 85 L95 85 L95 95 L85 95 Z" fill="#000"/>
                    </svg>
                  </div>
                  
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Reference ID: WL-QR-{Date.now().toString().slice(-6)}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => setShowTopUpQRModal(false)} 
                      style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleConfirmQRPayment} 
                      className="glow-button" 
                      style={{ flex: 1, padding: '10px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      I Have Paid
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentTab === 'bookings' && (
          <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Your Parking Bookings</h2>
            {(() => {
              const activeBookings = bookings.filter(b => b.userId === user.uid && b.status === 'active');
              if (activeBookings.length === 0) return null;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
                  {activeBookings.map(activeBooking => (
                    <div key={activeBooking.id} className="glass-panel" style={{ padding: '32px', border: '1px solid var(--primary)', borderRadius: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
                        <div>
                          <span style={{ fontSize: '11px', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '4px', fontWeight: '600' }}>ACTIVE BOOKING</span>
                          <h3 style={{ fontSize: '20px', fontWeight: '800', marginTop: '8px' }}>{locations.find(l => l.id === activeBooking.locationId)?.name}</h3>
                        </div>
                        <p style={{ fontSize: '14px', fontWeight: 'bold' }}>ID: {activeBooking.id}</p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                        <div>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Vehicle Plate</p>
                          <p style={{ fontSize: '16px', fontWeight: '700' }}>{activeBooking.vehicleType === 'four-wheeler' ? '🚗' : '🏍️'} {activeBooking.vehicleNumber}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Amount & Status</p>
                          <p style={{ fontSize: '16px', fontWeight: '700', color: activeBooking.paymentStatus === 'pending' ? '#FFC107' : 'var(--primary)' }}>
                            ₹{activeBooking.totalAmount} ({activeBooking.paymentMethod === 'cash' ? 'Cash' : 'Online'}) - {activeBooking.paymentStatus ? activeBooking.paymentStatus.toUpperCase() : 'PAID'}
                          </p>
                        </div>
                      </div>

                      {activeBooking.paymentMethod === 'cash' && activeBooking.paymentStatus === 'pending' && (
                        <div style={{ background: 'rgba(255, 193, 7, 0.1)', border: '1px solid #FFC107', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <QrCode size={48} color="#FFC107" />
                          <div>
                            <span style={{ fontSize: '11px', color: '#FFC107', fontWeight: 'bold' }}>PENDING PAYMENT</span>
                            <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#FFF' }}>
                              Verification OTP: <strong style={{ fontSize: '18px', color: '#FFC107' }}>{activeBooking.verificationCode}</strong>
                            </p>
                            <p style={{ fontSize: '11px', margin: '2px 0 0 0', color: 'var(--text-muted)' }}>
                              Show this QR or tell the 4-digit code to the parking owner to pay in cash.
                            </p>
                          </div>
                        </div>
                      )}

                      <div style={{ marginBottom: '24px' }}>
                        <BookingTimer endTime={activeBooking.endTime} status={activeBooking.status} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', background: 'rgba(0,0,0,0.1)', padding: '16px 24px', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button onClick={() => handleCancelBooking(activeBooking.id)} style={{ padding: '10px 20px', background: 'rgba(255,23,68,0.1)', color: '#FF1744', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Cancel Booking</button>
                          {activeBooking.paymentMethod !== 'cash' && (
                            <button onClick={() => handleCheckOut(activeBooking.id)} style={{ padding: '10px 20px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Simulate Exit (Check Out)</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Past Bookings</h3>
                {selectedPastBookings.length > 0 && (
                  <button 
                    onClick={handleDeleteSelectedBookings}
                    style={{ 
                      padding: '8px 16px', 
                      background: '#FF1744', 
                      color: '#FFF', 
                      border: 'none', 
                      borderRadius: '6px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold', 
                      fontSize: '12px',
                      boxShadow: '0 0 10px rgba(255, 23, 68, 0.4)',
                      transition: 'all 0.2s'
                    }}
                  >
                    🗑️ Delete Selected ({selectedPastBookings.length})
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(() => {
                  const pastBookings = bookings.filter(b => b.userId === user.uid && b.status !== 'active');
                  if (pastBookings.length === 0) {
                    return <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No past bookings found.</p>;
                  }
                  return pastBookings.map(b => {
                    const loc = locations.find(l => l.id === b.locationId);
                    const isSelected = selectedPastBookings.includes(b.id);
                    return (
                      <div 
                        key={b.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '16px', 
                          padding: '16px', 
                          background: isSelected ? 'rgba(0, 212, 255, 0.03)' : 'rgba(255,255,255,0.02)', 
                          borderRadius: '8px', 
                          border: isSelected ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid var(--border-color)',
                          transition: 'all 0.2s'
                        }}
                      >
                        {/* Checkbox for multi-select */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPastBookings(prev => [...prev, b.id]);
                              } else {
                                setSelectedPastBookings(prev => prev.filter(id => id !== b.id));
                              }
                            }}
                            style={{ 
                              width: '18px', 
                              height: '18px', 
                              accentColor: 'var(--primary)', 
                              cursor: 'pointer' 
                            }}
                          />
                        </div>

                        {/* Booking Details */}
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ fontSize: '14px', fontWeight: '700' }}>{loc ? loc.name : 'Unknown Location'}</h4>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {b.vehicleType === 'four-wheeler' ? '🚗' : '🏍️'} {b.vehicleNumber} • Date: {new Date(b.startTime).toLocaleDateString()}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: '14px', fontWeight: '800' }}>₹{b.totalAmount}</p>
                              <span style={{ fontSize: '10px', color: b.status === 'completed' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '600' }}>
                                {b.status.toUpperCase()}
                              </span>
                            </div>
                            
                            {/* Individual Delete Button */}
                            <button 
                              onClick={() => {
                                showConfirm("Are you sure you want to delete this booking entry from your history?", () => {
                                  handleDeleteBooking(b.id);
                                }, "Confirm Deletion");
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#FF1744',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'opacity 0.2s',
                                opacity: 0.7
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
                              title="Delete booking history entry"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'profile' && (
          <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={28} color="var(--primary)" />
              <span>User Account Management</span>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '280px 1fr',
              gap: '24px',
              alignItems: 'start'
            }}>
              {/* Left Column: Sub-navigation sidebar */}
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Mini User Summary */}
                <div style={{ padding: '12px 8px', borderBottom: '1px solid var(--border-color)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'} alt="Avatar" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                  <div style={{ textAlign: 'left', minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profileName || 'Karthik Raja'}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>{user?.role === 'guest' ? 'Guest Account' : 'Customer Account'}</div>
                  </div>
                </div>

                {/* Sub-tabs buttons */}
                {[
                  { id: 'overview', label: 'Dashboard Overview', icon: <Activity size={16} /> },
                  { id: 'edit-profile', label: 'Personal Information', icon: <User size={16} /> },
                  { id: 'my-vehicles', label: 'Manage Vehicles', icon: <Car size={16} /> },
                  { id: 'history', label: 'Bookings & Payments', icon: <CreditCard size={16} /> },
                  { id: 'security', label: 'Security & Alerts', icon: <Shield size={16} /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setProfileSubTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: profileSubTab === tab.id ? 'var(--primary-glow)' : 'transparent',
                      color: profileSubTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: profileSubTab === tab.id ? '700' : '500',
                      fontSize: '13px',
                      transition: 'all 0.2s',
                      borderLeft: profileSubTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent'
                    }}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Right Column: Active Sub-tab View */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* 1. OVERVIEW & STATS */}
                {profileSubTab === 'overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '16px' }}>
                      {[
                        { label: 'Total Bookings', value: bookings.filter(b => b.userId === user?.uid || (user?.role === 'guest' && b.userId === 'guest-user')).length, icon: <Calendar size={20} color="var(--primary)" />, bg: 'var(--primary-glow)' },
                        { label: 'Total Spent', value: `₹${bookings.filter(b => (b.userId === user?.uid || (user?.role === 'guest' && b.userId === 'guest-user')) && b.status !== 'cancelled').reduce((sum, b) => sum + (b.totalAmount || 0), 0)}`, icon: <DollarSign size={20} color="var(--accent-green)" />, bg: 'rgba(0, 229, 160, 0.1)' },
                        { label: 'Top Location', value: (() => {
                          const userBookings = bookings.filter(b => b.userId === user?.uid || (user?.role === 'guest' && b.userId === 'guest-user'));
                          if (userBookings.length === 0) return 'None';
                          const counts = {};
                          userBookings.forEach(b => { counts[b.locationId] = (counts[b.locationId] || 0) + 1; });
                          const topLocId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, null);
                          return topLocId ? (locations.find(l => String(l.id) === String(topLocId))?.name || 'None') : 'None';
                        })(), icon: <Star size={20} color="#FFD700" />, bg: 'rgba(255, 215, 0, 0.1)' },
                        { label: 'Parking Hours', value: `${bookings.filter(b => (b.userId === user?.uid || (user?.role === 'guest' && b.userId === 'guest-user')) && b.status === 'completed').reduce((sum, b) => sum + (b.duration || 0), 0)}h`, icon: <Clock size={20} color="var(--secondary)" />, bg: 'var(--secondary-glow)' }
                      ].map((stat, i) => (
                        <div key={i} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {stat.icon}
                          </div>
                          <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>{stat.label}</div>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: '#FFF', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={stat.value}>{stat.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Default Vehicle Card */}
                    <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                          {(() => {
                            const defVeh = (user?.vehicles || userVehicles).find(v => v.isDefault) || (user?.vehicles || userVehicles)[0];
                            if (defVeh?.type === 'Bike') return '🏍️';
                            if (defVeh?.type === 'EV') return '⚡';
                            return '🚗';
                          })()}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#FFF' }}>Primary Vehicle</h4>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {(() => {
                              const defVeh = (user?.vehicles || userVehicles).find(v => v.isDefault) || (user?.vehicles || userVehicles)[0];
                              return defVeh ? `${defVeh.brand} ${defVeh.model} (${defVeh.number})` : 'No vehicle configured yet';
                            })()}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setProfileSubTab('my-vehicles')} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Manage</button>
                    </div>

                    {/* Quick Access Favorites */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#FFF', textAlign: 'left' }}>⭐ Favorite Parking Spots</h3>
                      {(user?.favoriteLocations || []).length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                          {(user.favoriteLocations || []).map(favId => {
                            const loc = locations.find(l => l.id === favId);
                            if (!loc) return null;
                            return (
                              <div key={favId} className="card-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                                <div style={{ textAlign: 'left' }}>
                                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#FFF' }}>{loc.name}</p>
                                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{loc.address}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button onClick={() => handleQuickAccessFavorite(loc)} style={{ background: 'var(--primary)', border: 'none', color: '#000', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>Go to Map</button>
                                  <button onClick={() => toggleFavorite(favId)} style={{ background: 'rgba(255,23,68,0.1)', border: 'none', color: '#FF1744', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={12} /></button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'left' }}>No favorite spots added yet. Tap stars on the map to save locations!</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. EDIT PROFILE */}
                {profileSubTab === 'edit-profile' && (
                  <form onSubmit={handleSaveProfileChanges} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFF', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '4px', textAlign: 'left' }}>Personal Information</h3>
                    
                    {/* Avatar Selection Block */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '12px' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }} />
                        <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--secondary)', color: '#FFF', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--bg-primary)' }}>
                          <Camera size={14} />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setProfilePic(reader.result);
                                reader.readAsDataURL(file);
                              }
                            }}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#FFF' }}>Upload New Photo</h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>PNG, JPG or base64 format under 1MB. Or select standard avatar.</p>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          {[
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100',
                            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100'
                          ].map((url, idx) => (
                            <img key={idx} src={url} alt="Avatar Selection" onClick={() => setProfilePic(url)} style={{ width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', border: profilePic === url ? '2px solid var(--primary)' : '1px solid var(--border-color)', objectFit: 'cover' }} />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                      <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Full Name</label>
                        <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#FFF', outline: 'none' }} required />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Mobile Number</label>
                        <input type="text" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#FFF', outline: 'none' }} required />
                      </div>
                    </div>

                    <div style={{ textAlign: 'left' }}>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Email Address</label>
                      <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#FFF', outline: 'none' }} required />
                    </div>

                    <div style={{ textAlign: 'left' }}>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Billing Address</label>
                      <textarea value={profileAddress} onChange={(e) => setProfileAddress(e.target.value)} style={{ width: '100%', height: '80px', padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#FFF', outline: 'none', resize: 'none' }} required />
                    </div>

                    <button type="submit" className="glow-button" style={{ width: '100%', padding: '12px', marginTop: '8px' }}>Save Profile Changes</button>
                  </form>
                )}

                {/* 3. MANAGE VEHICLES */}
                {profileSubTab === 'my-vehicles' && (
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFF' }}>My Registered Vehicles</h3>
                      {!showAddVehicle && (
                        <button onClick={() => { setShowAddVehicle(true); setEditingVehicleId(null); setVehicleNumber(''); setVehicleBrand(''); setVehicleModel(''); setVehicleType('Car'); setVehicleIsDefault(false); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--primary)', border: 'none', color: '#000', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                          <Plus size={12} />
                          <span>Add Vehicle</span>
                        </button>
                      )}
                    </div>

                    {showAddVehicle && (
                      <form onSubmit={handleSaveVehicle} style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--primary-border)', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', textAlign: 'left' }}>{editingVehicleId ? 'Edit Vehicle Details' : 'Register New Vehicle'}</h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr 1fr', gap: '12px' }}>
                          <div style={{ textAlign: 'left' }}>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Plate Number</label>
                            <input type="text" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="e.g., TN-01-AB-1234" style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF', textTransform: 'uppercase' }} required />
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Type</label>
                            <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }}>
                              <option value="Car">Car</option>
                              <option value="Bike">Bike</option>
                              <option value="EV">EV (Electric)</option>
                            </select>
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Brand</label>
                            <input type="text" value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)} placeholder="e.g., Honda" style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} required />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                          <div style={{ textAlign: 'left' }}>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Model</label>
                            <input type="text" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="e.g., Civic" style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} required />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px' }}>
                            <input type="checkbox" id="isDefault" checked={vehicleIsDefault} onChange={(e) => setVehicleIsDefault(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                            <label htmlFor="isDefault" style={{ fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>Set as default vehicle</label>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                          <button type="button" onClick={() => setShowAddVehicle(false)} style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                          <button type="submit" style={{ padding: '10px 16px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Save Vehicle</button>
                        </div>
                      </form>
                    )}

                    {/* Vehicles Queue */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {userVehicles.map(veh => (
                        <div key={veh.id} className="card-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                              {veh.type === 'Bike' ? '🏍️' : veh.type === 'EV' ? '⚡' : '🚗'}
                            </div>
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '15px', fontWeight: '800', color: '#FFF', letterSpacing: '0.5px' }}>{veh.number}</span>
                                {veh.isDefault && (
                                  <span style={{ fontSize: '9px', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', letterSpacing: '0.5px' }}>DEFAULT</span>
                                )}
                              </div>
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{veh.brand} {veh.model} • {veh.type}</p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            {!veh.isDefault && (
                              <button onClick={() => handleSetDefaultVehicle(veh.id)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' }}>Make Default</button>
                            )}
                            <button onClick={() => { setShowAddVehicle(true); setEditingVehicleId(veh.id); setVehicleNumber(veh.number); setVehicleType(veh.type); setVehicleBrand(veh.brand); setVehicleModel(veh.model); setVehicleIsDefault(veh.isDefault); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#FFF', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}><Edit2 size={12} /></button>
                            <button onClick={() => handleDeleteVehicle(veh.id)} style={{ background: 'rgba(255,23,68,0.1)', border: 'none', color: '#FF1744', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={12} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. BOOKINGS & PAYMENTS HISTORY */}
                {profileSubTab === 'history' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Booking History */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFF', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', textAlign: 'left' }}>Past Bookings History</h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '360px', overflowY: 'auto' }}>
                        {bookings.filter(b => b.userId === user?.uid || (user?.role === 'guest' && b.userId === 'guest-user')).length === 0 ? (
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '20px 0' }}>No booking records found.</p>
                        ) : (
                          bookings
                            .filter(b => b.userId === user?.uid || (user?.role === 'guest' && b.userId === 'guest-user'))
                            .map(b => {
                              const loc = locations.find(l => l.id === b.locationId) || {};
                              return (
                                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                                  <div style={{ textAlign: 'left' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#FFF' }}>{loc.name || 'Chennai Parking'}</h4>
                                      <span style={{
                                        fontSize: '8px',
                                        fontWeight: '800',
                                        textTransform: 'uppercase',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: b.status === 'completed' ? 'rgba(0, 229, 160, 0.12)' : b.status === 'active' ? 'rgba(0, 212, 255, 0.12)' : 'rgba(255, 23, 68, 0.12)',
                                        color: b.status === 'completed' ? '#00E5A0' : b.status === 'active' ? 'var(--primary)' : '#FF1744'
                                      }}>
                                        {b.status}
                                      </span>
                                    </div>
                                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Plate: {b.vehicleNumber} • Duration: {b.duration} hrs</p>
                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(b.createdAt || b.bookingDate || Date.now()).toLocaleDateString()} • {new Date(b.createdAt || b.bookingDate || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary)' }}>₹{b.totalAmount}</span>
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>

                    {/* Payment & Transaction History */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFF', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', textAlign: 'left' }}>Transaction & Invoices</h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {bookings
                          .filter(b => (b.userId === user?.uid || (user?.role === 'guest' && b.userId === 'guest-user')) && b.status !== 'cancelled')
                          .map(b => (
                            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(0, 229, 160, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Smartphone size={16} color="#00E5A0" />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#FFF' }}>UPI Booking Payment</h4>
                                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(b.createdAt || b.bookingDate || Date.now()).toLocaleDateString()} • Txn: #TXN-{b.id}</p>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#FFF' }}>₹{b.totalAmount}</span>
                                  <span style={{ display: 'block', fontSize: '9px', color: '#00E5A0', fontWeight: 'bold', marginTop: '2px' }}>SUCCESS</span>
                                </div>
                                <button onClick={() => handleDownloadInvoice(b)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--primary)', padding: '6px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '600', cursor: 'pointer' }}>Invoice</button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. SECURITY & ALERTS */}
                {profileSubTab === 'security' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Toggles and Alerts Preferences */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFF', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', textAlign: 'left' }}>Notifications & Preferences</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                          { label: 'Booking Confirmation Receipts', desc: 'Receive invoice and reservation breakdown via email.', state: notifEmail, set: setNotifEmail },
                          { label: 'SMS Reminders & Parking Expiry', desc: 'Receive real-time text warnings 15 mins before parking duration ends.', state: notifSms, set: setNotifSms },
                          { label: 'Promotional Offers & Coupon Alerts', desc: 'Receive discount coupons for Chennai local lots.', state: notifPromo, set: setNotifPromo },
                          { label: 'Live App Push Alerts', desc: 'Receive updates when host accepts or checks out vehicles.', state: notifPush, set: setNotifPush }
                        ].map((pref, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx < 3 ? '1px solid rgba(255,255,255,0.03)' : 'none', paddingBottom: idx < 3 ? '12px' : '0' }}>
                            <div style={{ textAlign: 'left', paddingRight: '12px', flex: 1 }}>
                              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#FFF' }}>{pref.label}</h4>
                              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{pref.desc}</p>
                            </div>
                            <input type="checkbox" checked={pref.state} onChange={(e) => { pref.set(e.target.checked); updateProfile({ notificationPreferences: { ...user?.notificationPreferences, [idx === 0 ? 'email' : idx === 1 ? 'sms' : idx === 2 ? 'promo' : 'push']: e.target.checked } }); }} style={{ width: '42px', height: '20px', cursor: 'pointer', flexShrink: 0 }} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Change Password */}
                    <form onSubmit={handleChangePassword} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFF', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', textAlign: 'left' }}>Change Password</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                        <div style={{ textAlign: 'left' }}>
                          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Current Password</label>
                          <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} required />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>New Password</label>
                          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} required />
                        </div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Confirm New Password</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} required />
                      </div>
                      <button type="submit" className="glow-button" style={{ width: '100%', padding: '12px', marginTop: '8px' }}>Update Password</button>
                    </form>

                    {/* 2FA and Login Activity */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFF', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', textAlign: 'left' }}>Security Lock & Session Activity</h3>
                      
                      {/* 2FA Sim */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                        <div style={{ textAlign: 'left', paddingRight: '12px', flex: 1 }}>
                          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#FFF' }}>Enable Two-Factor Authentication (2FA)</h4>
                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Verify booking checkouts with extra mobile SMS pins.</p>
                        </div>
                        <input type="checkbox" checked={twoFactorEnabled} onChange={(e) => { setTwoFactorEnabled(e.target.checked); updateProfile({ security: { twoFactorEnabled: e.target.checked } }); showAlert(e.target.checked ? "2FA Enabled! Verification pins will be simulated." : "2FA Disabled.", "Security"); }} style={{ width: '42px', height: '20px', cursor: 'pointer', flexShrink: 0 }} />
                      </div>

                      {/* Login activity list */}
                      <div style={{ textAlign: 'left' }}>
                        <h4 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>Recent Active Sessions</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {loginActivities.map((act, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '11px' }}>
                              <div>
                                <span style={{ fontWeight: 'bold', color: '#FFF' }}>{act.device}</span> • <span style={{ color: 'var(--text-secondary)' }}>{act.location} ({act.ip})</span>
                              </div>
                              <span style={{ color: idx === 0 ? '#00E5A0' : 'var(--text-muted)', fontWeight: 'bold' }}>{act.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Logout all devices button */}
                      <button onClick={handleLogoutAllDevices} style={{ width: '100%', padding: '12px', background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.2)', color: '#FF1744', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <LogOut size={16} />
                        <span>Logout From All Devices</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {currentTab === 'support' && (
          <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(360px, 1fr))', gap: '28px' }}>
              
              {/* Left Column: Create Ticket */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: '#FFF' }}>{t('support')}</h3>
                <form onSubmit={handleSubmitSupportTicket} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>{t('ticketSubject')}</label>
                    <input 
                      type="text" 
                      value={supportSubject} 
                      onChange={(e) => setSupportSubject(e.target.value)} 
                      placeholder="e.g., Wrong pricing displayed, UPI issue" 
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(10, 18, 38, 0.7)',
                        border: '1px solid rgba(0, 212, 255, 0.15)',
                        borderRadius: '8px',
                        color: '#FFF',
                        outline: 'none'
                      }} 
                      required 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>{t('ticketDetails')}</label>
                    <textarea 
                      value={supportDesc} 
                      onChange={(e) => setSupportDesc(e.target.value)} 
                      placeholder="Describe your issue or query..." 
                      style={{
                        width: '100%',
                        height: '120px',
                        padding: '10px 12px',
                        background: 'rgba(10, 18, 38, 0.7)',
                        border: '1px solid rgba(0, 212, 255, 0.15)',
                        borderRadius: '8px',
                        color: '#FFF',
                        resize: 'none',
                        outline: 'none'
                      }} 
                      required 
                    />
                  </div>
                  <button type="submit" className="glow-button" style={{ width: '100%', padding: '12px' }}>{t('submitTicket')}</button>
                </form>
              </div>

              {/* Right Column: Past Tickets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', color: '#FFF' }}>{t('ticketQueue')}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Track the status of your current and resolved support inquiries.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                  {complaints.filter(c => c.userId === user.uid || c.userId === 'guest-user').length === 0 ? (
                    <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {t('noTickets')}
                    </div>
                  ) : (
                    complaints
                      .filter(c => c.userId === user.uid || c.userId === 'guest-user')
                      .map(comp => (
                        <div key={comp.id} className="glass-panel" style={{ padding: '16px', borderLeft: comp.status === 'resolved' ? '4px solid #00E5A0' : '4px solid #FF8C42' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold' }}>ID: #{comp.id}</span>
                              <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF', margin: '2px 0 0 0' }}>{comp.subject}</h4>
                            </div>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: comp.status === 'resolved' ? 'rgba(0, 229, 160, 0.12)' : 'rgba(255, 140, 66, 0.12)',
                              color: comp.status === 'resolved' ? '#00E5A0' : '#FF8C42'
                            }}>
                              {comp.status === 'resolved' ? t('completedBooking') : 'Pending'}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: '1.4' }}>{comp.description}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>
                            <span>Submitted: {new Date(comp.createdAt).toLocaleDateString()}</span>
                            {comp.status === 'resolved' && (
                              <span style={{ color: '#00E5A0', fontWeight: '600' }}>✓ {t('resolvedByAdmin')}</span>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* EV RESERVATION MODAL */}
      {showEvReserveModal && selectedEvStation && selectedCharger && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '420px', padding: '24px', position: 'relative' }}>
            <button onClick={() => { setShowEvReserveModal(false); setEvPaySuccess(false); }} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            
            {evPaySuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0, 230, 118, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid #00E676' }}>
                  <span style={{ fontSize: '32px', color: '#00E676' }}>✓</span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#FFF' }}>Booking Confirmed!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>Your charger slot at {selectedEvStation.name} has been successfully reserved.</p>
                
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', margin: '20px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Station:</span>
                    <span style={{ fontWeight: 'bold' }}>{selectedEvStation.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Connector Type:</span>
                    <span style={{ fontWeight: 'bold' }}>{selectedCharger.type} ({selectedCharger.power} kW)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Duration:</span>
                    <span style={{ fontWeight: 'bold' }}>{reserveHours} hours</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Estimated Cost:</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>₹{reserveHours * selectedCharger.power * selectedEvStation.rates?.perKwh}</span>
                  </div>
                </div>

                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedEvStation.latitude},${selectedEvStation.longitude}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="glow-button"
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '12px 0', textDecoration: 'none', color: '#000', fontWeight: 'bold', borderRadius: '8px' }}
                >
                  Start Google Maps Navigation
                </a>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', background: 'linear-gradient(135deg, #00D4FF, #7B61FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Reserve EV Charging Slot</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Station:</span>
                    <span style={{ fontWeight: 'bold' }}>{selectedEvStation.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Connector type:</span>
                    <span style={{ fontWeight: 'bold' }}>{selectedCharger.type} ({selectedCharger.power} kW)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Rate:</span>
                    <span style={{ fontWeight: 'bold' }}>₹{selectedEvStation.rates?.perKwh} / kWh</span>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>Select Duration:</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)' }}>{reserveHours} Hours</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="8" 
                    value={reserveHours} 
                    onChange={(e) => setReserveHours(parseInt(e.target.value))} 
                    style={{ width: '100%', accentColor: 'var(--primary)' }} 
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span>1 Hr</span>
                    <span>4 Hrs</span>
                    <span>8 Hrs</span>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated consumption:</span>
                    <p style={{ fontSize: '15px', fontWeight: '800' }}>{reserveHours * selectedCharger.power} kWh</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated Cost:</span>
                    <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>₹{reserveHours * selectedCharger.power * selectedEvStation.rates?.perKwh}</p>
                  </div>
                </div>

                <button 
                  onClick={async () => {
                    setIsProcessingEvPay(true);
                    
                    // Simulate Razorpay popup delay
                    setTimeout(async () => {
                      const newReservation = {
                        userId: user.uid,
                        stationId: selectedEvStation.id,
                        chargerId: selectedCharger.id,
                        connectorType: selectedCharger.type,
                        startTime: new Date().toISOString(),
                        durationHours: reserveHours,
                        totalAmount: reserveHours * selectedCharger.power * selectedEvStation.rates?.perKwh,
                        paymentId: "pay_EV" + Math.floor(Math.random() * 1000000)
                      };

                      try {
                        // Post EV reservation to backend
                        const res = await fetch(`${API_URL}/ev-reservations`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(newReservation)
                        });

                        if (res.ok) {
                          // Toggle charger status to "Reserved" on backend
                          const updatedChargers = selectedEvStation.chargers.map(c => {
                            if (c.id === selectedCharger.id) return { ...c, status: 'Reserved' };
                            return c;
                          });

                          await fetch(`${API_URL}/ev-stations/${selectedEvStation.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ chargers: updatedChargers })
                          });

                          setEvPaySuccess(true);
                          setIsProcessingEvPay(false);
                          
                          // Mock notification triggers
                          showAlert(`Charging session of ${reserveHours} hours is scheduled to start!`, "Charging Starting");
                        }
                      } catch (e) {
                        console.error(e);
                        setIsProcessingEvPay(false);
                      }
                    }, 1500);
                  }} 
                  className="glow-button" 
                  style={{ width: '100%', padding: '14px 0', fontSize: '14px', display: 'flex', justifyContent: 'center' }}
                  disabled={isProcessingEvPay}
                >
                  {isProcessingEvPay ? "Processing Secure Razorpay..." : `Pay ₹${reserveHours * selectedCharger.power * selectedEvStation.rates?.perKwh} & Book Now`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* UPI / RAZORPAY MODAL */}
      {showUPIScreen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '380px', padding: '0px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #3399FF', background: '#0c1a30' }}>
            {/* Razorpay Premium Header */}
            <div style={{ background: '#3399FF', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' }}>SpotPark Secure Payment</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <Shield size={16} color="#FFF" />
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFF' }}>Razorpay</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)' }}>Amount to Pay</span>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFF' }}>
                  ₹{Math.max(0, Math.round(
                    bookingVehicles.reduce((sum, v) => {
                      const base = v.type === 'four-wheeler'
                        ? selectedLocation.rates.hourly * bookingDuration
                        : (selectedLocation.rates.hourly * 0.6) * bookingDuration;
                      return sum + base;
                    }, 0) * (1 - couponDiscount/100)
                  ))}
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div style={{ padding: '24px' }}>
              {isProcessingPayment ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <RefreshCw className="spinning" size={32} style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite', color: '#3399FF' }} />
                  <p style={{ color: '#FFF', fontWeight: '600' }}>Processing Secure Transaction...</p>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Do not press back or refresh</span>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#a0aec0', marginBottom: '8px' }}>PAYMENT METHOD</label>
                  
                  {/* Tabs */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button 
                      onClick={() => setRazorpayTab('card')}
                      style={{ 
                        flex: 1, 
                        padding: '8px', 
                        fontSize: '12px', 
                        fontWeight: 'bold', 
                        borderRadius: '6px', 
                        border: 'none',
                        background: razorpayTab === 'card' ? '#3399FF' : 'rgba(255,255,255,0.05)',
                        color: '#FFF',
                        cursor: 'pointer'
                      }}
                    >
                      Credit/Debit Card
                    </button>
                    <button 
                      onClick={() => setRazorpayTab('upi')}
                      style={{ 
                        flex: 1, 
                        padding: '8px', 
                        fontSize: '12px', 
                        fontWeight: 'bold', 
                        borderRadius: '6px', 
                        border: 'none',
                        background: razorpayTab === 'upi' ? '#3399FF' : 'rgba(255,255,255,0.05)',
                        color: '#FFF',
                        cursor: 'pointer'
                      }}
                    >
                      UPI
                    </button>
                  </div>

                  {razorpayTab === 'card' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#a0aec0', marginBottom: '4px' }}>Card Number</label>
                        <input 
                          type="text" 
                          placeholder="4111 2222 3333 4444" 
                          value={dummyCard}
                          onChange={(e) => setDummyCard(e.target.value.replace(/\D/g, '').substring(0, 16))}
                          style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid #3399FF', borderRadius: '6px', color: '#FFF' }} 
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: '#a0aec0', marginBottom: '4px' }}>Expiry (MM/YY)</label>
                          <input 
                            type="text" 
                            placeholder="12/29" 
                            value={dummyExpiry}
                            onChange={(e) => setDummyExpiry(e.target.value.substring(0, 5))}
                            style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid #3399FF', borderRadius: '6px', color: '#FFF' }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', color: '#a0aec0', marginBottom: '4px' }}>CVV</label>
                          <input 
                            type="password" 
                            placeholder="***" 
                            maxLength="3"
                            value={dummyCvv}
                            onChange={(e) => setDummyCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                            style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid #3399FF', borderRadius: '6px', color: '#FFF', letterSpacing: '4px' }} 
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '11px', color: '#a0aec0', marginBottom: '4px' }}>UPI ID</label>
                      <input 
                        type="text" 
                        placeholder="username@okaxis" 
                        value={upiPin}
                        onChange={(e) => setUpiPin(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid #3399FF', borderRadius: '6px', color: '#FFF' }} 
                      />
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button onClick={() => setShowUPIScreen(false)} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                    <button onClick={handleConfirmUPIPayment} style={{ padding: '12px', background: '#3399FF', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Simulate Success</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ALERTS */}
      {customAlert && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '320px', padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
            <AlertCircle size={32} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>{customAlert.title}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>{customAlert.message}</p>
            <button onClick={() => setCustomAlert(null)} className="glow-button" style={{ width: '100%', padding: '10px' }}>Okay</button>
          </div>
        </div>
      )}

      {customConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '320px', padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
            <HelpCircle size={32} color="var(--secondary)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>{customConfirm.title}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>{customConfirm.message}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button onClick={() => setCustomConfirm(null)} style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => { customConfirm.onConfirm(); setCustomConfirm(null); }} style={{ padding: '10px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spinning { animation: spin 0.8s linear infinite; }
        @keyframes pulse {
          0% { transform: scale(0.85); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.8; }
          100% { transform: scale(0.85); opacity: 0.5; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #00D4FF, #7B61FF, #00D4FF);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .nav-btn-hover:hover { background: rgba(0,212,255,0.07) !important; color: var(--primary) !important; }
        .card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,212,255,0.18) !important; }
      `}</style>
    </div>
  );
}

function LoginScreen({ onLogin, onGoogleLogin, onGuestLogin, roleHint }) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const [showIntro, setShowIntro] = useState(false);
  const [fadeOutIntro, setFadeOutIntro] = useState(true);

  useEffect(() => {
    // Intro sequence disabled by user request
  }, []);

  const handleSkip = () => {
    setFadeOutIntro(true);
    setShowIntro(false);
  };

  const handleGuestLogin = () => {
    try {
      if (onGuestLogin) onGuestLogin();
    } catch (e) {
      setError(e.message || "Guest login failed.");
    }
  };


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
    } catch (e) {
      setError(e.message || "Login failed.");
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #060B18 0%, #0D1526 50%, #060B18 100%)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-main, sans-serif)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100vw'
    }}>
      <style>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 10px rgba(0, 212, 255, 0.4); }
          50% { box-shadow: 0 0 30px rgba(0, 212, 255, 0.8), 0 0 60px rgba(123, 97, 255, 0.3); }
          100% { box-shadow: 0 0 10px rgba(0, 212, 255, 0.4); }
        }

        @keyframes driveLeftToRight {
          0% { transform: translateX(-100vw) scale(0.5) rotateY(45deg) rotateX(10deg); opacity: 0; filter: blur(6px); }
          60% { transform: translateX(5vw) scale(0.85) rotateY(-20deg) rotateX(-5deg); opacity: 1; filter: blur(0); }
          80% { transform: translateX(-2vw) scale(0.95) rotateY(10deg) rotateX(2deg); opacity: 1; }
          100% { transform: translateX(0) scale(1) rotateY(-10deg) rotateX(5deg); opacity: 1; }
        }

        @keyframes suspensionBounce {
          0% { transform: rotate(0deg) translateY(0); }
          40% { transform: rotate(-1.5deg) translateY(4px); }
          70% { transform: rotate(0.5deg) translateY(-1px); }
          100% { transform: rotate(0deg) translateY(0); }
        }

        @keyframes headlightFlash {
          0%, 100% { box-shadow: none; opacity: 0; }
          50% { box-shadow: 0 0 30px #00E676, 0 0 60px #00E676; opacity: 1; }
        }

        @keyframes textFadeIn {
          from { opacity: 0; transform: translateY(-15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes underglowFade {
          0% { opacity: 0; transform: scaleX(0.5); }
          100% { opacity: 1; transform: scaleX(1); }
        }

        @keyframes underglowPulse {
          0%, 100% { opacity: 0.8; filter: blur(8px) drop-shadow(0 0 5px rgba(0, 230, 118, 0.4)); }
          50% { opacity: 1.0; filter: blur(10px) drop-shadow(0 0 15px rgba(0, 230, 118, 0.8)); }
        }

        .ferrari-container {
          position: relative;
          width: 850px;
          height: 320px;
          display: flex;
          align-items: center;
          justifyContent: center;
          animation: driveLeftToRight 1.3s cubic-bezier(0.25, 1, 0.5, 1) forwards, suspensionBounce 0.5s ease-out 1.3s;
          z-index: 101;
          transform-style: preserve-3d;
          perspective: 1000px;
        }

        @keyframes engineVibration {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-0.8px) translateX(0.3px); }
        }

        .ferrari-body {
          width: 100%;
          height: 100%;
          mix-blend-mode: screen;
          animation: engineVibration 0.12s infinite 1.3s;
        }

        .ferrari-svg-hologram {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 0 10px rgba(0, 230, 118, 0.3));
        }

        .radar-ring {
          transform-origin: 190px 220px;
          animation: pulseRadar 3s infinite linear;
        }

        .radar-ring-reverse {
          transform-origin: 550px 225px;
          animation: pulseRadar 3s infinite linear reverse;
        }

        @keyframes pulseRadar {
          0% { transform: scale(0.9); opacity: 0.2; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(0.9); opacity: 0.2; }
        }

        .holo-draw-path {
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: drawOutline 2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        @keyframes drawOutline {
          to { stroke-dashoffset: 0; }
        }

        .holo-interior {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: drawOutline 1.5s cubic-bezier(0.25, 1, 0.5, 1) 0.5s forwards;
        }

        .holo-wheel-spin {
          animation: spinHoloWheel 1.3s cubic-bezier(0.25, 1, 0.5, 1) forwards, spinHoloWheelConstant 4s linear infinite 1.3s;
        }

        @keyframes spinHoloWheel {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(1080deg); }
        }

        @keyframes spinHoloWheelConstant {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .ferrari-underglow {
          position: absolute;
          bottom: 25px;
          left: 120px;
          width: 610px;
          height: 15px;
          background: radial-gradient(ellipse at center, rgba(0, 230, 118, 0.85) 0%, rgba(0, 230, 118, 0) 75%);
          filter: blur(8px);
          opacity: 0;
          animation: underglowFade 0.8s ease-out 1.3s forwards, underglowPulse 2s infinite ease-in-out 2.1s;
          z-index: 99;
          pointer-events: none;
        }

        .ferrari-headlight {
          position: absolute;
          right: 95px;
          top: 212px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FFF;
          opacity: 0;
          animation: headlightFlash 0.5s ease-in-out 1.3s 2 forwards;
          z-index: 102;
        }

        .headlight-beam {
          position: absolute;
          left: 8px;
          top: -142px;
          width: 500px;
          height: 300px;
          background: radial-gradient(ellipse at left center, rgba(0, 230, 118, 0.22) 0%, rgba(0, 230, 118, 0) 70%);
          clip-path: polygon(0% 48%, 100% 0%, 100% 100%, 0% 52%);
          opacity: 0;
          animation: beamFlash 0.5s ease-in-out 1.3s 2 forwards;
          transform-origin: left center;
          z-index: 101;
          pointer-events: none;
        }

        @keyframes beamFlash {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }

        .ferrari-holo-door {
          position: absolute;
          left: 310px;
          top: 135px;
          width: 170px;
          height: 85px;
          background: linear-gradient(135deg, rgba(0, 230, 118, 0.15) 0%, rgba(0, 230, 118, 0.02) 100%);
          border: 1.5px solid #00E676;
          box-shadow: 0 0 20px rgba(0, 230, 118, 0.4), inset 0 0 15px rgba(0, 230, 118, 0.2);
          transform-origin: bottom right;
          opacity: 0;
          animation: openHoloDoor 0.8s cubic-bezier(0.25, 1, 0.5, 1) 1.7s forwards, holoGlowPulse 1.5s infinite alternate ease-in-out 2.5s;
          z-index: 103;
          pointer-events: none;
          clip-path: polygon(0% 25%, 90% 0%, 100% 45%, 85% 100%, 10% 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: center;
          overflow: hidden;
        }

        .holo-grid {
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(0, 230, 118, 0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0, 230, 118, 0.1) 1px, transparent 1px);
          background-size: 6px 6px;
          opacity: 0.6;
          pointer-events: none;
        }

        .holo-scanline {
          position: absolute;
          top: -10%;
          left: 0;
          width: 100%;
          height: 4px;
          background: rgba(0, 230, 118, 0.8);
          box-shadow: 0 0 8px #00E676;
          animation: holoScan 2.5s linear infinite;
          pointer-events: none;
        }

        .holo-hud-text {
          font-family: monospace;
          color: #00E676;
          text-shadow: 0 0 5px #00E676;
          font-size: 8px;
          font-weight: bold;
          letter-spacing: 0.5px;
          line-height: 1.2;
          text-align: center;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: textPulse 1s infinite alternate;
        }

        .holo-tag {
          font-size: 9px;
          border: 1px solid rgba(0, 230, 118, 0.4);
          padding: 1px 4px;
          border-radius: 2px;
          margin-bottom: 2px;
          background: rgba(0, 230, 118, 0.1);
        }

        .holo-status {
          opacity: 0.9;
        }

        .holo-code {
          font-size: 6px;
          opacity: 0.6;
        }

        @keyframes openHoloDoor {
          0% {
            transform: perspective(1000px) rotateY(0deg) rotateZ(0deg) translateZ(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: perspective(1000px) rotateY(-35deg) rotateZ(-30deg) translateY(-40px) translateX(15px) translateZ(50px);
            opacity: 1;
          }
        }

        @keyframes holoGlowPulse {
          from { box-shadow: 0 0 20px rgba(0, 230, 118, 0.4), inset 0 0 15px rgba(0, 230, 118, 0.2); border-color: rgba(0, 230, 118, 0.8); }
          to { box-shadow: 0 0 35px rgba(0, 230, 118, 0.7), inset 0 0 25px rgba(0, 230, 118, 0.4); border-color: rgba(0, 230, 118, 1); }
        }

        @keyframes holoScan {
          0% { top: -10%; }
          100% { top: 110%; }
        }

        @keyframes textPulse {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }

        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        @keyframes floatBlob {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes borderRotate {
          100% { transform: rotate(360deg); }
        }
        .tech-grid-bg {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(0, 212, 255, 0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 212, 255, 0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: gridMove 8s linear infinite;
          opacity: 0.7;
          z-index: 1;
          pointer-events: none;
        }
        .glow-blob-1 {
          position: absolute;
          top: 10%;
          left: 10%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(0, 212, 255, 0.14) 0%, transparent 70%);
          filter: blur(50px);
          animation: floatBlob 15s ease-in-out infinite;
          z-index: 0;
          pointer-events: none;
        }
        .glow-blob-2 {
          position: absolute;
          bottom: 10%;
          right: 10%;
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(123, 97, 255, 0.12) 0%, transparent 70%);
          filter: blur(50px);
          animation: floatBlob 20s ease-in-out infinite reverse;
          z-index: 0;
          pointer-events: none;
        }
        .border-glow-wrapper {
          position: relative;
          padding: 1.5px;
          border-radius: 24px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.02);
          z-index: 2;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.7), 0 0 60px rgba(0, 212, 255, 0.06);
          transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.5s ease;
        }
        .border-glow-wrapper::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(
            transparent,
            rgba(0, 212, 255, 0.7),
            transparent 30%,
            transparent 50%,
            rgba(123, 97, 255, 0.7),
            transparent 80%
          );
          animation: borderRotate 5s linear infinite;
          z-index: 0;
        }
        .border-glow-wrapper:hover {
          transform: perspective(1000px) rotateX(2deg) rotateY(-2deg) translateZ(8px) !important;
          box-shadow: 0 40px 80px rgba(0, 212, 255, 0.12), 0 25px 50px rgba(0, 0, 0, 0.8) !important;
        }
        .new-glass-card {
          position: relative;
          width: 100%;
          background: rgba(6, 11, 24, 0.94);
          backdrop-filter: blur(30px);
          border-radius: 23px;
          padding: 40px;
          box-sizing: border-box;
          z-index: 1;
        }

      `}</style>



      {/* Intro Overlay */}
      {showIntro && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: '#000',
          zIndex: 100,
          opacity: fadeOutIntro ? 0 : 1,
          transition: 'opacity 0.6s ease-in-out',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          <button
            onClick={handleSkip}
            style={{
              position: 'absolute',
              top: '30px',
              right: '30px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#B0BEC5',
              padding: '8px 16px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              letterSpacing: '1px',
              zIndex: 110,
              pointerEvents: 'auto'
            }}
          >
            SKIP INTRO
          </button>
          <div style={{
            position: 'absolute',
            top: '8%',
            textAlign: 'center',
            zIndex: 105,
            animation: 'textFadeIn 1s ease-out'
          }}>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '24px', fontWeight: '900', color: '#FFF', letterSpacing: '1px', textTransform: 'uppercase' }}>ParkHub</h1>
            <p style={{ fontSize: '11px', color: 'var(--primary, #00E676)', fontWeight: '700', letterSpacing: '3px' }}>
              {roleHint ? `${roleHint} Secure Portal` : 'Smart Network'}
            </p>
          </div>
          <div className="ferrari-container">
            <div className="ferrari-underglow"></div>
            <div className="ferrari-body">
              <svg viewBox="0 0 800 300" width="100%" height="100%" className="ferrari-svg-hologram">
                <defs>
                  <linearGradient id="holo-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00E676" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#00b0ff" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#00E676" stopOpacity="0.8" />
                  </linearGradient>
                  <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                
                {/* Tech Radar Rings around wheels */}
                <circle cx="190" cy="220" r="50" stroke="rgba(0, 230, 118, 0.2)" strokeWidth="1" strokeDasharray="4 8" fill="none" className="radar-ring" />
                <circle cx="550" cy="225" r="50" stroke="rgba(0, 230, 118, 0.2)" strokeWidth="1" strokeDasharray="4 8" fill="none" className="radar-ring-reverse" />
                
                {/* Ground grid shadow/laser line */}
                <line x1="80" y1="230" x2="720" y2="230" stroke="rgba(0, 230, 118, 0.4)" strokeWidth="1" strokeDasharray="5 5" />
                
                {/* Main Body Outline - Ferrari SF90 Stradale 3/4 Front Perspective */}
                <path 
                  d="M 100,220 
                     L 100,215 
                     C 100,195 120,182 145,182 
                     C 190,182 250,175 290,165 
                     C 320,135 340,122 380,120 
                     C 410,118 450,118 480,125 
                     C 520,135 560,152 590,165 
                     C 620,175 660,185 700,195 
                     C 715,198 720,205 710,215 
                     L 700,225 
                     L 680,228 
                     L 592,228 
                     A 42,42 0 0,0 508,228 
                     L 228,222 
                     A 38,38 0 0,0 152,218 
                     L 105,220 
                     Z" 
                  fill="rgba(0, 230, 118, 0.03)" 
                  stroke="url(#holo-glow)" 
                  strokeWidth="2.5" 
                  filter="url(#glow-filter)"
                  className="holo-draw-path"
                />

                {/* Canopy and Windshield lines */}
                <path 
                  d="M 380,120 C 420,123 480,132 505,162 L 485,155 L 380,120 Z" 
                  fill="none" 
                  stroke="rgba(0, 230, 118, 0.7)" 
                  strokeWidth="1.5" 
                  className="holo-interior"
                />
                {/* Left A-pillar */}
                <path 
                  d="M 380,120 L 485,155" 
                  stroke="rgba(0, 230, 118, 0.6)" 
                  strokeWidth="1.5" 
                />
                {/* Right A-pillar */}
                <path 
                  d="M 425,118 L 525,165" 
                  stroke="rgba(0, 230, 118, 0.6)" 
                  strokeWidth="1.5" 
                />
                {/* Near side window */}
                <path 
                  d="M 425,118 C 455,142 470,158 480,165" 
                  stroke="rgba(0, 230, 118, 0.6)" 
                  strokeWidth="1.5" 
                  fill="none"
                />
                {/* Cabin rear pillar */}
                <path 
                  d="M 345,130 C 375,155 375,165 375,170" 
                  stroke="rgba(0, 230, 118, 0.6)" 
                  strokeWidth="1.5" 
                  fill="none"
                />

                {/* S-Duct intake on hood */}
                <path 
                  d="M 515,165 C 540,172 580,178 610,183 C 585,188 545,180 515,165 Z" 
                  fill="rgba(0, 230, 118, 0.08)" 
                  stroke="rgba(0, 230, 118, 0.7)" 
                  strokeWidth="1.2" 
                />
                {/* S-Duct channel exit lines */}
                <path d="M 550,170 Q 560,185 580,190" stroke="rgba(0, 230, 118, 0.5)" strokeWidth="1" fill="none" />
                <path d="M 570,174 Q 580,192 600,196" stroke="rgba(0, 230, 118, 0.5)" strokeWidth="1" fill="none" />
                {/* Centerline of the hood */}
                <path d="M 505,162 C 550,172 610,185 680,200" stroke="rgba(0, 230, 118, 0.4)" strokeWidth="1" fill="none" />

                {/* Near headlight (right) */}
                <path d="M 655,190 Q 685,194 695,202 Q 675,206 655,190 Z" fill="rgba(0,230,118,0.2)" stroke="#00E676" strokeWidth="2" filter="url(#glow-filter)" />
                <path d="M 660,193 L 688,197 L 678,202" fill="none" stroke="#FFF" strokeWidth="1" />
                {/* Far headlight (left) */}
                <path d="M 610,176 Q 630,178 638,184 Q 622,186 610,176 Z" fill="rgba(0,230,118,0.2)" stroke="#00E676" strokeWidth="1.5" filter="url(#glow-filter)" />
                <path d="M 614,178 L 632,180" fill="none" stroke="#FFF" strokeWidth="0.8" />

                {/* Side Mirror */}
                <path d="M 490,156 C 505,152 510,154 505,160 Z" fill="rgba(0, 230, 118, 0.2)" stroke="rgba(0, 230, 118, 0.7)" strokeWidth="1.2" />
                <line x1="485" y1="160" x2="490" y2="156" stroke="rgba(0, 230, 118, 0.7)" strokeWidth="1.2" />

                {/* B-pillar side intake scoop */}
                <path 
                  d="M 315,168 L 275,208 L 255,192 Z" 
                  fill="rgba(0, 230, 118, 0.1)" 
                  stroke="rgba(0, 230, 118, 0.7)" 
                  strokeWidth="1.2" 
                />
                <path d="M 285,185 L 265,200" stroke="rgba(0, 230, 118, 0.5)" strokeWidth="1" fill="none" />
                <path d="M 295,180 L 275,195" stroke="rgba(0, 230, 118, 0.5)" strokeWidth="1" fill="none" />
                {/* Front bumper intakes */}
                <path d="M 650,210 L 690,212 L 675,224 Z" fill="rgba(0, 230, 118, 0.05)" stroke="rgba(0, 230, 118, 0.5)" strokeWidth="1" />
                <path d="M 610,194 L 630,196 L 622,204 Z" fill="rgba(0, 230, 118, 0.05)" stroke="rgba(0, 230, 118, 0.5)" strokeWidth="1" />

                {/* Character Lines */}
                <path d="M 145,185 C 220,185 300,195 440,205 C 500,205 530,208 550,210" fill="none" stroke="rgba(0, 230, 118, 0.4)" strokeWidth="1" />
                <path d="M 320,165 L 315,221" stroke="rgba(0, 230, 118, 0.4)" strokeWidth="1" fill="none" />
                <path d="M 480,165 L 490,225" stroke="rgba(0, 230, 118, 0.4)" strokeWidth="1" fill="none" />
                <path d="M 220,182 C 255,182 275,195 285,215" fill="none" stroke="rgba(0, 230, 118, 0.4)" strokeWidth="1" />

                {/* Rotating wheels (5-spoke dynamic star alloys in 3D perspective) */}
                <g style={{ transform: 'translate(190px, 220px) rotateY(-55deg) rotateX(5deg)', transformStyle: 'preserve-3d' }}>
                  <g className="holo-wheel-spin" style={{ transformOrigin: '0px 0px' }}>
                    <circle cx="0" cy="0" r="32" stroke="rgba(0, 230, 118, 0.8)" strokeWidth="2" fill="none" />
                    <circle cx="0" cy="0" r="26" stroke="rgba(0, 230, 118, 0.3)" strokeWidth="1" fill="none" />
                    <circle cx="0" cy="0" r="7" stroke="#00E676" strokeWidth="1.5" fill="rgba(0, 0, 0, 0.9)" />
                    {[0, 72, 144, 216, 288].map((angle, idx) => (
                      <g key={idx} transform={`rotate(${angle}, 0, 0)`}>
                        <line x1="0" y1="0" x2="0" y2="-32" stroke="rgba(0, 230, 118, 0.8)" strokeWidth="1.5" />
                        <line x1="0" y1="-10" x2="-3" y2="-32" stroke="rgba(0, 230, 118, 0.6)" strokeWidth="1" />
                        <line x1="0" y1="-10" x2="3" y2="-32" stroke="rgba(0, 230, 118, 0.6)" strokeWidth="1" />
                      </g>
                    ))}
                  </g>
                </g>

                <g style={{ transform: 'translate(550px, 225px) rotateY(-55deg) rotateX(5deg)', transformStyle: 'preserve-3d' }}>
                  <g className="holo-wheel-spin" style={{ transformOrigin: '0px 0px' }}>
                    <circle cx="0" cy="0" r="38" stroke="rgba(0, 230, 118, 0.8)" strokeWidth="2" fill="none" />
                    <circle cx="0" cy="0" r="32" stroke="rgba(0, 230, 118, 0.3)" strokeWidth="1" fill="none" />
                    <circle cx="0" cy="0" r="8" stroke="#00E676" strokeWidth="1.5" fill="rgba(0, 0, 0, 0.9)" />
                    {[0, 72, 144, 216, 288].map((angle, idx) => (
                      <g key={idx} transform={`rotate(${angle}, 0, 0)`}>
                        <line x1="0" y1="0" x2="0" y2="-38" stroke="rgba(0, 230, 118, 0.8)" strokeWidth="1.5" />
                        <line x1="0" y1="-12" x2="-3" y2="-38" stroke="rgba(0, 230, 118, 0.6)" strokeWidth="1" />
                        <line x1="0" y1="-12" x2="3" y2="-38" stroke="rgba(0, 230, 118, 0.6)" strokeWidth="1" />
                      </g>
                    ))}
                  </g>
                </g>
              </svg>
            </div>
            
            <div className="ferrari-headlight">
              <div className="headlight-beam"></div>
            </div>
            
            <div className="ferrari-holo-door">
              <div className="holo-grid"></div>
              <div className="holo-scanline"></div>
              <div className="holo-hud-text">
                <span className="holo-tag">SECURE LINK</span>
                <span className="holo-status">SYS: OPENING</span>
                <span className="holo-code">PORT_3000_OK</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Background Tech Elements */}
      <div className="tech-grid-bg"></div>
      <div className="glow-blob-1"></div>
      <div className="glow-blob-2"></div>

      {/* Centered Glass Login Card */}
      <div className="border-glow-wrapper" style={{
        width: '90%',
        maxWidth: '430px',
        opacity: fadeOutIntro ? 1 : 0,
        transform: fadeOutIntro 
          ? 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0) translateY(0)' 
          : 'perspective(1000px) rotateX(15deg) rotateY(-10deg) translateZ(-120px) translateY(50px)',
        transition: fadeOutIntro 
          ? 'opacity 1.0s ease-out, transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' 
          : 'opacity 1.0s ease-out, transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        pointerEvents: fadeOutIntro ? 'auto' : 'none'
      }}>
        <div className="new-glass-card">
          {/* Brand Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px',
            gap: '12px'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 0 20px rgba(0, 230, 118, 0.4)'
            }}>
              <img src="/parkhub_logo.png" alt="ParkHub Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '22px', fontWeight: '900', color: '#FFF', margin: 0, letterSpacing: '-0.5px' }}>ParkHub</h2>
              <p style={{ fontSize: '10px', color: 'var(--primary, #00E676)', margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>
                {roleHint} Portal
              </p>
            </div>
          </div>

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
                placeholder="email@mymail.com or +91 88833 99999"
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
            <button
              type="button"
              onClick={async () => {
                try {
                  if (onGoogleLogin) await onGoogleLogin();
                } catch (e) {
                  setError(e.message || "Google sign-in failed.");
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                color: '#FFF',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: '600',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxSizing: 'border-box'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
            <button
              type="button"
              onClick={handleGuestLogin}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                color: '#B0BEC5',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: '600',
                marginTop: '8px',
                textAlign: 'center',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary, #00E676)'; e.currentTarget.style.color = '#FFF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.color = '#B0BEC5'; }}
            >
              🌐 Continue as Guest
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

