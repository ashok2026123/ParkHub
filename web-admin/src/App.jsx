import React, { useState, useEffect } from 'react';
import { 
  INITIAL_LOCATIONS, 
  INITIAL_BOOKINGS, 
  INITIAL_REVIEWS, 
  INITIAL_COMPLAINTS,
  INITIAL_COUPONS 
} from './mockDb'; // Local copy of shared seed schemas
import { 
  MapPin, Search, Navigation, Filter, DollarSign, Activity, Users, 
  Percent, FileText, CheckCircle, XCircle, Shield, AlertCircle, LogOut, 
  Globe, Calendar, Settings, Download, Bell, Lock, HelpCircle, 
  TrendingUp, RefreshCw, Smartphone, FileSpreadsheet, AlertTriangle,
  Compass, Eye, EyeOff
} from 'lucide-react';

const INDIAN_BANKS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "IndusInd Bank",
  "Bank of Baroda",
  "Punjab National Bank",
  "Canara Bank",
  "Union Bank of India",
  "Bank of India",
  "Indian Bank",
  "Central Bank of India",
  "UCO Bank",
  "Bank of Maharashtra",
  "Indian Overseas Bank",
  "YES Bank",
  "IDFC FIRST Bank",
  "Federal Bank",
  "South Indian Bank",
  "Karur Vysya Bank",
  "Karnataka Bank",
  "RBL Bank",
  "Bandhan Bank",
  "Jammu & Kashmir Bank"
];

export default function App() {
  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://parkhub-wefh.onrender.com/api';

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('parkeasy_admin');
    return saved ? JSON.parse(saved) : null;
  });

  const [locations, setLocations] = useState(INITIAL_LOCATIONS);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);
  const [auditLogs, setAuditLogs] = useState([]);
  const [broadcastLogs, setBroadcastLogs] = useState([]);

  const handleLoginWithCredentials = (emailOrPhone, password) => {
    const cleanInput = emailOrPhone.trim().toLowerCase().replace(/\s+/g, '');
    
    // Check if it's owner or customer credentials to show role restriction error
    const isOwner = cleanInput === 'suresh@spotowner.com' || cleanInput === '+919444012345' || cleanInput === '9444012345';
    const isCustomer = cleanInput === 'karthik@mymail.com' || cleanInput === '+918883399999' || cleanInput === '8883399999';
    
    if (isOwner) {
      throw new Error("This portal is restricted to Administrators. Please log in at the Host/Owner Portal.");
    }
    if (isCustomer) {
      throw new Error("This portal is restricted to Administrators. Please log in at the Customer App.");
    }
    
    const isAdmin = cleanInput === 'admin@parkeasy.in' || cleanInput === '+919876543210' || cleanInput === '9876543210';
    
    let loggedUser;
    if (isAdmin) {
      loggedUser = {
        uid: "admin-123",
        name: "Rajesh Kumar",
        email: "admin@parkeasy.in",
        phone: "+91 98765 43210",
        role: "admin",
        profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        createdAt: new Date().toISOString()
      };
    } else {
      loggedUser = {
        uid: "admin-" + Math.floor(Math.random() * 1000),
        name: emailOrPhone.includes('@') ? emailOrPhone.split('@')[0] : "Admin User",
        email: emailOrPhone.includes('@') ? emailOrPhone : `${cleanInput}@parkeasy.in`,
        phone: emailOrPhone.includes('@') ? "+91 90000 00000" : emailOrPhone,
        role: "admin",
        profilePic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
        createdAt: new Date().toISOString()
      };
    }
    
    setUser(loggedUser);
    localStorage.setItem('parkeasy_admin', JSON.stringify(loggedUser));
    return loggedUser;
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('parkeasy_admin');
  };

  const [currentTab, setCurrentTab] = useState('overview'); // overview | analytics | parking | users | owners | bookings | revenue | complaints | notifications | settings | logs
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [selectedAdminUser, setSelectedAdminUser] = useState(null);
  const [selectedAdminOwner, setSelectedAdminOwner] = useState(null);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [isRejectingKyc, setIsRejectingKyc] = useState(false);
  const [unmaskAccountOwner, setUnmaskAccountOwner] = useState(false);
  const [selectedAdminParking, setSelectedAdminParking] = useState(null);
  const [commissionPercentage, setCommissionPercentage] = useState(10);
  const [bookingGracePeriod, setBookingGracePeriod] = useState(15);
  const [global30MinRate, setGlobal30MinRate] = useState(20);
  const [globalHourlyRate, setGlobalHourlyRate] = useState(50);
  const [globalDailyRate, setGlobalDailyRate] = useState(300);
  const [editing30Min, setEditing30Min] = useState('20');
  const [editingHourly, setEditingHourly] = useState('50');
  const [editingDaily, setEditingDaily] = useState('300');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState('announcement');

  const [customAlert, setCustomAlert] = useState(null); 
  const [customConfirm, setCustomConfirm] = useState(null); 

  const [editingLocId, setEditingLocId] = useState(null);
  const [editHourlyRate, setEditHourlyRate] = useState('');
  const [editDailyRate, setEditDailyRate] = useState(''); 
  const [editingOwnerId, setEditingOwnerId] = useState(null);
  const [editOwnerEarnings, setEditOwnerEarnings] = useState('');
  const [isEditingOwnerPayout, setIsEditingOwnerPayout] = useState(false);
  const [editOwnerPayoutMethod, setEditOwnerPayoutMethod] = useState('bank');
  const [editOwnerBankHolder, setEditOwnerBankHolder] = useState('');
  const [editOwnerBankName, setEditOwnerBankName] = useState('');
  const [editOwnerBankAccNum, setEditOwnerBankAccNum] = useState('');
  const [editOwnerBankIfsc, setEditOwnerBankIfsc] = useState('');
  const [editOwnerBankBranch, setEditOwnerBankBranch] = useState('');
  const [editOwnerUpiId, setEditOwnerUpiId] = useState('');
  const [showAdminBankDropdown, setShowAdminBankDropdown] = useState(false);
  const [adminBankSearchQuery, setAdminBankSearchQuery] = useState('');

  // Entities state — declared early so useEffect below can reference them
  const [adminUsers, setAdminUsers] = useState([
    { uid: 'customer-789', name: 'Karthik Raja', email: 'karthik@mymail.com', phone: '+91 88833 99999', role: 'customer', registeredAt: '2026-01-15T10:00:00Z', bookingsCount: 14, status: 'active' },
    { uid: 'customer-222', name: 'Meena Sundaram', email: 'meena.s@outlook.com', phone: '+91 95000 88888', role: 'customer', registeredAt: '2026-02-18T14:30:00Z', bookingsCount: 8, status: 'active' },
    { uid: 'customer-333', name: 'Anand Selvam', email: 'anand.selvam@gmail.com', phone: '+91 90033 11111', role: 'customer', registeredAt: '2026-03-05T09:15:00Z', bookingsCount: 22, status: 'active' }
  ]);

  const [adminOwners, setAdminOwners] = useState([
    { uid: 'owner-456', name: 'Suresh Perumal', email: 'suresh@spotowner.com', phone: '+91 94440 12345', role: 'owner', registeredAt: '2026-01-10T08:00:00Z', locationsCount: 3, earnings: 12450, verified: true, status: 'active' },
    { uid: 'owner-101', name: 'Arun Moorthi', email: 'arun@marinaowner.in', phone: '+91 98400 55555', role: 'owner', registeredAt: '2026-02-20T16:20:00Z', locationsCount: 1, earnings: 4500, verified: true, status: 'active' }
  ]);

  useEffect(() => {
    if (selectedAdminOwner) {
      const activeOwner = adminOwners.find(o => o.uid === selectedAdminOwner.uid) || selectedAdminOwner;
      setEditOwnerPayoutMethod(activeOwner.payoutMethod || 'bank');
      setEditOwnerBankHolder(activeOwner.bankDetails?.holderName || '');
      setEditOwnerBankName(activeOwner.bankDetails?.bankName || '');
      setEditOwnerBankAccNum(activeOwner.bankDetails?.accountNumber || '');
      setEditOwnerBankIfsc(activeOwner.bankDetails?.ifscCode || '');
      setEditOwnerBankBranch(activeOwner.bankDetails?.branchName || '');
      setEditOwnerUpiId(activeOwner.upiDetails?.upiId || '');
      setIsEditingOwnerPayout(false);
    }
  }, [selectedAdminOwner, adminOwners]);

  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedOwnerIds, setSelectedOwnerIds] = useState([]);

  const handleDeleteUser = (userId) => {
    showConfirm("Are you sure you want to delete this customer permanently? This action cannot be undone.", () => {
      setAdminUsers(prev => prev.filter(u => u.uid !== userId));
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
      addAuditLog(`Deleted customer ID: ${userId}`, 'security');
      showAlert("Customer deleted successfully!", "Customers");
    });
  };

  const handleDeleteOwner = (ownerId) => {
    showConfirm("Are you sure you want to delete this host owner permanently? This action cannot be undone.", () => {
      setAdminOwners(prev => prev.filter(o => o.uid !== ownerId));
      setSelectedOwnerIds(prev => prev.filter(id => id !== ownerId));
      addAuditLog(`Deleted host owner ID: ${ownerId}`, 'security');
      showAlert("Host owner deleted successfully!", "Parking Owners");
    });
  };

  const handleBulkDeleteUsers = () => {
    if (selectedUserIds.length === 0) return;
    showConfirm(`Are you sure you want to delete ${selectedUserIds.length} selected customers permanently?`, () => {
      setAdminUsers(prev => prev.filter(u => !selectedUserIds.includes(u.uid)));
      addAuditLog(`Bulk deleted customers: ${selectedUserIds.join(', ')}`, 'security');
      setSelectedUserIds([]);
      showAlert("Selected customers deleted successfully!", "Bulk Action");
    });
  };

  const handleBulkDeleteOwners = () => {
    if (selectedOwnerIds.length === 0) return;
    showConfirm(`Are you sure you want to delete ${selectedOwnerIds.length} selected host owners permanently?`, () => {
      setAdminOwners(prev => prev.filter(o => !selectedOwnerIds.includes(o.uid)));
      addAuditLog(`Bulk deleted host owners: ${selectedOwnerIds.join(', ')}`, 'security');
      setSelectedOwnerIds([]);
      showAlert("Selected host owners deleted successfully!", "Bulk Action");
    });
  };

  const handleBulkToggleBlockUsers = () => {
    if (selectedUserIds.length === 0) return;
    showConfirm(`Are you sure you want to toggle block status for ${selectedUserIds.length} selected customers?`, () => {
      setAdminUsers(prev => prev.map(u => {
        if (selectedUserIds.includes(u.uid)) {
          return { ...u, status: u.status === 'active' ? 'blocked' : 'active' };
        }
        return u;
      }));
      addAuditLog(`Bulk toggled block status for customers: ${selectedUserIds.join(', ')}`, 'security');
      setSelectedUserIds([]);
      showAlert("Selected customers status toggled successfully!", "Bulk Action");
    });
  };

  const handleBulkSuspendOwners = () => {
    if (selectedOwnerIds.length === 0) return;
    showConfirm(`Are you sure you want to toggle suspension for ${selectedOwnerIds.length} selected host owners?`, () => {
      setAdminOwners(prev => prev.map(o => {
        if (selectedOwnerIds.includes(o.uid)) {
          return { ...o, status: o.status === 'active' ? 'suspended' : 'active' };
        }
        return o;
      }));
      addAuditLog(`Bulk toggled suspension for host owners: ${selectedOwnerIds.join(', ')}`, 'security');
      setSelectedOwnerIds([]);
      showAlert("Selected host owners status toggled successfully!", "Bulk Action");
    });
  };

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
        const compRes = await fetch(`${API_URL}/complaints`);
        if (compRes.ok) setComplaints(await compRes.json());
      } catch (err) { console.error("Error fetching complaints:", err); }

      try {
        const settingsRes = await fetch(`${API_URL}/settings`);
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setCommissionPercentage(data.commissionPercentage);
          setBookingGracePeriod(data.bookingGracePeriod);
          if (data.globalHourlyRate) { setGlobalHourlyRate(data.globalHourlyRate); setEditingHourly(String(data.globalHourlyRate)); }
          if (data.globalDailyRate) { setGlobalDailyRate(data.globalDailyRate); setEditingDaily(String(data.globalDailyRate)); }
          if (data.global30MinRate) { setGlobal30MinRate(data.global30MinRate); setEditing30Min(String(data.global30MinRate)); }
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

      try {
        const ownerRes = await fetch(`${API_URL}/owners`);
        if (ownerRes.ok) setAdminOwners(await ownerRes.json());
      } catch (err) { console.error("Error fetching owners:", err); }
    };

    fetchData();

    // Poll for updates (e.g. available slots fluctuating on server, new bookings, complaints, owners KYC status)
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

      try {
        const ownerRes = await fetch(`${API_URL}/owners`);
        if (ownerRes.ok) setAdminOwners(await ownerRes.json());
      } catch (err) { console.error("Error polling owners:", err); }
    }, 3000);

    return () => clearInterval(interval);
  }, []);



  const addAuditLog = (action, type) => {
    const newLog = {
      admin: user ? user.name : "Rajesh Kumar",
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

  const handleApproveLocation = (id) => {
    fetch(`${API_URL}/locations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isApproved: true })
    })
    .then(res => res.json())
    .then(updatedLoc => {
      setLocations(prev => prev.map(loc => loc.id === id ? updatedLoc : loc));
      addAuditLog(`Approved parking location ID: ${id}`, 'approval');
      showAlert("Parking listing has been approved and is now visible on the map!", "Listing Approved");
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
      setLocations(prev => prev.map(loc => loc.id === id ? updatedLoc : loc));
      addAuditLog(`${suspendState ? 'Suspended' : 'Unsuspended'} parking spot ID: ${id}`, 'parking');
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
          addAuditLog(`Deleted parking location ID: ${id}`, 'parking');
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
      addAuditLog(`Updated rates for location ID: ${id} to Hourly: ₹${hourly}, Daily: ₹${daily}`, 'parking');
      setEditingLocId(null);
      showAlert("Tariff rates updated successfully.", "Rates Saved");
    })
    .catch(err => console.error("Error updating location rates:", err));
  };

  const handleToggleUserBlock = (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    setAdminUsers(prev => prev.map(u => u.uid === userId ? { ...u, status: newStatus } : u));
    addAuditLog(`${newStatus === 'blocked' ? 'Blocked' : 'Unblocked'} customer ID: ${userId}`, 'security');
  };

  const handleToggleOwnerSuspend = async (ownerId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const owner = adminOwners.find(o => o.uid === ownerId);
      if (owner) {
        const saveRes = await fetch(`${API_URL}/owners/${ownerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...owner, status: newStatus })
        });
        if (saveRes.ok) {
          const savedOwner = await saveRes.json();
          setAdminOwners(prev => prev.map(o => o.uid === ownerId ? savedOwner : o));
          addAuditLog(`${newStatus === 'suspended' ? 'Suspended' : 'Activated'} host ID: ${ownerId}`, 'security');
          showAlert(`Host status updated to ${newStatus}.`, "Status Saved");
        }
      }
    } catch (err) {
      console.error("Error toggling owner status:", err);
    }
  };

  const handleVerifyOwner = async (ownerId) => {
    try {
      const owner = adminOwners.find(o => o.uid === ownerId);
      if (owner) {
        const nextOwner = {
          ...owner,
          kycStatus: 'verified',
          kycDate: new Date().toISOString(),
          kycRemarks: 'KYC approved by admin Rajesh Kumar'
        };
        const saveRes = await fetch(`${API_URL}/owners/${ownerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextOwner)
        });
        if (saveRes.ok) {
          const savedOwner = await saveRes.json();
          setAdminOwners(prev => prev.map(o => o.uid === ownerId ? savedOwner : o));
          addAuditLog(`Verified KYC for owner ID: ${ownerId}`, 'approval');
          showAlert(`KYC details verified successfully for ${owner.name}.`, "KYC Verified");
        }
      }
    } catch (err) {
      console.error("Error verifying owner KYC:", err);
    }
  };

  const handleRejectOwnerKYC = async (ownerId, remarks) => {
    if (!remarks.trim()) {
      showAlert("Please enter remarks explaining why verification was rejected.", "Remarks Required");
      return;
    }
    try {
      const owner = adminOwners.find(o => o.uid === ownerId);
      if (owner) {
        const nextOwner = {
          ...owner,
          kycStatus: 'rejected',
          kycRemarks: remarks,
          kycDate: new Date().toISOString()
        };
        const saveRes = await fetch(`${API_URL}/owners/${ownerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextOwner)
        });
        if (saveRes.ok) {
          const savedOwner = await saveRes.json();
          setAdminOwners(prev => prev.map(o => o.uid === ownerId ? savedOwner : o));
          addAuditLog(`Rejected KYC for owner ID: ${ownerId}. Reason: ${remarks}`, 'approval');
          showAlert(`KYC details rejected for ${owner.name}.`, "KYC Rejected");
        }
      }
    } catch (err) {
      console.error("Error rejecting owner KYC:", err);
    }
  };

  const handleSaveOwnerPayoutDetails = async (ownerId) => {
    try {
      const owner = adminOwners.find(o => o.uid === ownerId);
      if (owner) {
        const nextOwner = {
          ...owner,
          payoutMethod: editOwnerPayoutMethod,
          bankDetails: {
            ...owner.bankDetails,
            holderName: editOwnerBankHolder,
            bankName: editOwnerBankName,
            accountNumber: editOwnerBankAccNum,
            ifscCode: editOwnerBankIfsc,
            branchName: editOwnerBankBranch
          },
          upiDetails: {
            ...owner.upiDetails,
            upiId: editOwnerUpiId
          }
        };
        const saveRes = await fetch(`${API_URL}/owners/${ownerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextOwner)
        });
        if (saveRes.ok) {
          const savedOwner = await saveRes.json();
          setAdminOwners(prev => prev.map(o => o.uid === ownerId ? savedOwner : o));
          addAuditLog(`Updated payout details/settlement credentials for owner ID: ${ownerId}`, 'settings');
          setIsEditingOwnerPayout(false);
          showAlert(`Payout details updated successfully for ${owner.name}.`, "Payout Credentials Saved ✅");
        }
      }
    } catch (err) {
      console.error("Error saving owner payout details:", err);
      showAlert("Failed to save owner payout details.", "Error");
    }
  };

  const handleSaveOwnerBalance = async (ownerId) => {
    const earnings = parseFloat(editOwnerEarnings);
    if (isNaN(earnings) || earnings < 0) {
      showAlert("Please enter a valid balance.", "Invalid Input");
      return;
    }
    try {
      const owner = adminOwners.find(o => o.uid === ownerId);
      if (owner) {
        const saveRes = await fetch(`${API_URL}/owners/${ownerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...owner, earnings })
        });
        if (saveRes.ok) {
          const savedOwner = await saveRes.json();
          setAdminOwners(prev => prev.map(o => o.uid === ownerId ? savedOwner : o));
          addAuditLog(`Adjusted wallet balance for host ID: ${ownerId} to ₹${earnings}`, 'settings');
          setEditingOwnerId(null);
          showAlert("Host payout balance updated successfully.", "Balance Saved");
        }
      }
    } catch (err) {
      console.error("Error saving owner balance:", err);
    }
  };

  const handleProcessPayout = async (owner) => {
    if (!owner.earnings || owner.earnings <= 0) {
      showAlert("This owner has no pending balance to settle.", "No Balance");
      return;
    }

    showConfirm(`Are you sure you want to release settlement of ₹${Math.round(owner.earnings * 0.9)} (90% of ₹${owner.earnings}) to ${owner.name}?`, async () => {
      try {
        const payoutAmount = Math.round(owner.earnings * 0.9);
        const payoutMethodStr = owner.payoutMethod === 'bank'
          ? `Bank Transfer (•••• ${owner.bankDetails?.accountNumber?.slice(-4) || '1234'})`
          : `UPI Payout (${owner.upiDetails?.upiId || ''})`;
        
        const newSettlement = {
          id: 'set-' + Math.floor(Math.random() * 1000),
          date: new Date().toISOString().split('T')[0],
          amount: payoutAmount,
          method: payoutMethodStr,
          status: 'completed'
        };

        const newNotification = {
          id: 'notif-' + Math.floor(Math.random() * 1000),
          text: `Settlement payout of ₹${payoutAmount} has been processed successfully to your ${owner.payoutMethod === 'bank' ? 'bank account' : 'UPI ID'}.`,
          date: new Date().toISOString()
        };

        const nextOwnerData = {
          ...owner,
          earnings: 0,
          settlementHistory: [newSettlement, ...(owner.settlementHistory || [])],
          notifications: [newNotification, ...(owner.notifications || [])]
        };

        const saveRes = await fetch(`${API_URL}/owners/${owner.uid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextOwnerData)
        });

        if (saveRes.ok) {
          const savedOwner = await saveRes.json();
          setAdminOwners(prev => prev.map(o => o.uid === owner.uid ? savedOwner : o));
          addAuditLog(`Processed payout settlement of ₹${payoutAmount} for host ${owner.name} (${owner.uid})`, 'settings');
          showAlert(`Settlement payout of ₹${payoutAmount} processed successfully! Host balance reset.`, "Payout Completed ✅");
        } else {
          showAlert("Failed to process settlement on server. Please try again.", "Error");
        }
      } catch (err) {
        console.error("Error processing payout:", err);
        showAlert("Error connecting to server.", "Error");
      }
    }, "Confirm Payout");
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
      addAuditLog(`Resolved complaint ticket ID: ${id}`, 'complaint');
      showAlert("Ticket resolved and refund processed successfully!", "Complaint Resolved");
    })
    .catch(err => console.error("Error resolving complaint:", err));
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
      addAuditLog(`Sent push announcement: "${broadcastTitle}"`, 'notification');
      showAlert(`Broadcast alert dispatched to ${savedBroadcast.recipients} users in Chennai.`, "Broadcast Dispatched");
      setBroadcastTitle('');
      setBroadcastMessage('');
    })
    .catch(err => console.error("Error sending broadcast:", err));
  };

  const handleUpdateCommission = (newPercentage) => {
    setCommissionPercentage(newPercentage);
    fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commissionPercentage: newPercentage })
    })
    .then(res => res.json())
    .then(() => {
      addAuditLog(`Adjusted platform commission rate to ${newPercentage}%`, 'settings');
    })
    .catch(err => console.error("Error updating settings:", err));
  };

  const handleUpdateGlobalRates = () => {
    const thirtyMin = parseFloat(editing30Min);
    const hourly = parseFloat(editingHourly);
    const daily = parseFloat(editingDaily);
    if (isNaN(thirtyMin) || thirtyMin <= 0 || isNaN(hourly) || hourly <= 0 || isNaN(daily) || daily <= 0) {
      showAlert("Please enter valid positive numbers for all rates.", "Invalid Input");
      return;
    }
    setGlobal30MinRate(thirtyMin);
    setGlobalHourlyRate(hourly);
    setGlobalDailyRate(daily);
    fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ global30MinRate: thirtyMin, globalHourlyRate: hourly, globalDailyRate: daily })
    })
    .then(res => res.json())
    .then(() => {
      addAuditLog(`Updated global parking rates: 30min ₹${thirtyMin}, Hourly ₹${hourly}, Daily ₹${daily}`, 'settings');
      showAlert(`Global rates updated!\n30 Min: ₹${thirtyMin} | Hourly: ₹${hourly}/hr | Daily: ₹${daily}/day\n\nAll new parking spaces will use these rates.`, "Rates Updated ✅");
    })
    .catch(err => console.error("Error updating global rates:", err));
  };

  const handleExportData = (format, type) => {
    const content = 'Booking ID,User,Location,Amount,Date\n' + bookings.map(b => `${b.id},${b.userId},${b.locationId},₹${b.totalAmount},${b.startTime}`).join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `parkeasy_${type}_report.${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addAuditLog(`Exported ${type} reports as CSV`, 'settings');
  };

  // Calculations
  const adminApprovedLocs = locations.filter(l => l.isApproved).length;
  const adminPendingLocs = locations.filter(l => !l.isApproved).length;
  const grossBookings = bookings.reduce((sum, b) => b.status === 'completed' || b.status === 'active' ? sum + b.totalAmount : sum, 0);
  const platformRevenue = grossBookings * (commissionPercentage / 100);

  if (!user) {
    return <LoginScreen onLogin={handleLoginWithCredentials} roleHint="Super Admin" />;
  }

  return (
    <div className="dashboard-grid">
      {/* Sidebar Navigation */}
      <aside className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '0' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0,212,255,0.50), 0 0 36px rgba(108,99,255,0.25)', animation: 'diamondPulse 3s ease-in-out infinite' }}>
              <img src="/parkhub_logo_admin.png" alt="ParkHub Admin Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: '900', fontFamily: "'Outfit', 'Space Grotesk', sans-serif", letterSpacing: '-0.5px' }}>
              <span style={{ color: '#00D4FF' }}>Park</span><span style={{ color: '#6C63FF' }}>Hub</span>
            </span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button onClick={() => setCurrentTab('overview')} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', borderRadius: '6px', border: 'none', background: currentTab === 'overview' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'overview' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px' }}>
              <Activity size={16} /><span>Overview</span>
            </button>
            <button onClick={() => setCurrentTab('analytics')} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', borderRadius: '6px', border: 'none', background: currentTab === 'analytics' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'analytics' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px' }}>
              <TrendingUp size={16} /><span>Analytics</span>
            </button>
            <button onClick={() => setCurrentTab('parking')} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', borderRadius: '6px', border: 'none', background: currentTab === 'parking' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'parking' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px' }}>
              <MapPin size={16} /><span>Parking Locations</span>
            </button>
            <button onClick={() => setCurrentTab('users')} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', borderRadius: '6px', border: 'none', background: currentTab === 'users' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'users' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px' }}>
              <Users size={16} /><span>Customers</span>
            </button>
            <button onClick={() => setCurrentTab('owners')} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', borderRadius: '6px', border: 'none', background: currentTab === 'owners' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'owners' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px' }}>
              <Shield size={16} /><span>Parking Owners</span>
            </button>
            <button onClick={() => setCurrentTab('bookings')} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', borderRadius: '6px', border: 'none', background: currentTab === 'bookings' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'bookings' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px' }}>
              <Calendar size={16} /><span>Bookings Registry</span>
            </button>
            <button onClick={() => setCurrentTab('revenue')} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', borderRadius: '6px', border: 'none', background: currentTab === 'revenue' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'revenue' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px' }}>
              <DollarSign size={16} /><span>Commissions & Payouts</span>
            </button>
            <button onClick={() => setCurrentTab('complaints')} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', borderRadius: '6px', border: 'none', background: currentTab === 'complaints' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'complaints' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px' }}>
              <AlertCircle size={16} /><span>Complaints Queue</span>
            </button>
            <button onClick={() => setCurrentTab('notifications')} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', borderRadius: '6px', border: 'none', background: currentTab === 'notifications' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'notifications' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px' }}>
              <Bell size={16} /><span>Broadcast Alerts</span>
            </button>
            <button onClick={() => setCurrentTab('settings')} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', borderRadius: '6px', border: 'none', background: currentTab === 'settings' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'settings' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px' }}>
              <Settings size={16} /><span>System Config</span>
            </button>
            <button onClick={() => setCurrentTab('logs')} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', borderRadius: '6px', border: 'none', background: currentTab === 'logs' ? 'var(--primary-glow)' : 'transparent', color: currentTab === 'logs' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: '500', fontSize: '13px' }}>
              <Lock size={16} /><span>Audit Trails</span>
            </button>
          </nav>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user ? user.name.charAt(0).toUpperCase() : 'R'}
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '600' }}>{user ? user.name : "Rajesh Kumar"}</p>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Super Admin</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: 'rgba(255, 23, 68, 0.1)', color: '#FF1744', cursor: 'pointer', fontWeight: '600', fontSize: '13px', marginTop: '12px' }}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main style={{ padding: '32px', overflowY: 'auto', maxHeight: '100vh' }}>
        
        {currentTab === 'overview' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Super Admin Cockpit</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TOTAL USERS</p>
                <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '8px' }}>{adminUsers.length}</h3>
              </div>
              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--secondary)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TOTAL HOSTS</p>
                <h3 style={{ fontSize: '28px', fontWeight: '800', marginTop: '8px' }}>{adminOwners.length}</h3>
              </div>
              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PLATFORM REVENUE</p>
                <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary)', marginTop: '8px' }}>₹{platformRevenue.toFixed(0)}</h3>
              </div>
              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--accent-occupied)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PENDING APPROVALS</p>
                <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent-occupied)', marginTop: '8px' }}>{adminPendingLocs}</h3>
              </div>
            </div>

            {adminPendingLocs > 0 && (
              <div className="glass-panel" style={{ padding: '20px', border: '1px solid var(--accent-occupied)', background: 'rgba(255, 23, 68, 0.03)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <AlertTriangle size={24} style={{ color: 'var(--accent-occupied)' }} />
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold' }}>New Landlord Parking Listings Awaiting Approval</h4>
                </div>
                <button onClick={() => setCurrentTab('parking')} style={{ padding: '8px 16px', background: 'var(--accent-occupied)', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Verify Properties</button>
              </div>
            )}
          </div>
        )}

        {currentTab === 'analytics' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Global Statistics Analytics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Daily Platform Revenues</h3>
                <div style={{ height: '180px', position: 'relative' }}>
                  <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 100 50" preserveAspectRatio="none">
                    <path d="M 0,45 Q 15,30 30,38 T 60,15 T 90,20 L 100,20 L 100,50 L 0,50 Z" fill="rgba(0,230,118,0.15)" />
                    <path d="M 0,45 Q 15,30 30,38 T 60,15 T 90,20 L 100,20" fill="none" stroke="var(--primary)" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Weekly Bookings Volumes</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '160px' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{ height: '120px', width: '12px', background: 'var(--bg-primary)', borderRadius: '4px', display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ height: `${(i+2)*13}%`, width: '100%', background: 'var(--secondary)', borderRadius: '4px' }}></div>
                      </div>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '8px' }}>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'parking' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Manage Parking Spots</h2>
            
            {locations.filter(l => !l.isApproved).map(loc => (
              <div key={loc.id} className="glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
                <h4>{loc.name}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{loc.address}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button onClick={() => handleApproveLocation(loc.id)} style={{ padding: '6px 12px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Approve Spot</button>
                </div>
              </div>
            ))}

            <div className="glass-panel" style={{ padding: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th>ID</th><th>Name</th><th>Tariff Rates</th><th>CCTV</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map(loc => (
                    <tr key={loc.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px', fontFamily: 'monospace' }}>{loc.id}</td>
                      <td style={{ padding: '14px', fontWeight: 'bold' }}>{loc.name}</td>
                      <td style={{ padding: '14px' }}>
                        {editingLocId === loc.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '11px', minWidth: '45px' }}>Hourly:</span>
                              <input 
                                type="number" 
                                value={editHourlyRate} 
                                onChange={(e) => setEditHourlyRate(e.target.value)} 
                                style={{ width: '60px', padding: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#FFF', fontSize: '12px' }}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '11px', minWidth: '45px' }}>Daily:</span>
                              <input 
                                type="number" 
                                value={editDailyRate} 
                                onChange={(e) => setEditDailyRate(e.target.value)} 
                                style={{ width: '60px', padding: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#FFF', fontSize: '12px' }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div>Hourly: ₹{loc.rates.hourly}/hr</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Daily: ₹{loc.rates.daily}/day</div>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px' }}>{loc.cctvEnabled ? '🟢 CCTV' : '🟡 Ready'}</td>
                      <td style={{ padding: '14px' }}>{loc.isApproved ? '🟢 ACTIVE' : '🔴 SUSPENDED'}</td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {editingLocId === loc.id ? (
                            <>
                              <button onClick={() => handleSaveRates(loc.id)} style={{ padding: '4px 8px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
                              <button onClick={() => setEditingLocId(null)} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleSuspendLocation(loc.id, loc.isApproved)} style={{ padding: '4px 8px', background: loc.isApproved ? 'rgba(255,23,68,0.1)' : 'var(--primary-glow)', color: loc.isApproved ? '#FF1744' : 'var(--primary)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{loc.isApproved ? 'Suspend' : 'Activate'}</button>
                              <button onClick={() => handleStartEditRates(loc)} style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', color: 'var(--secondary)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit Price</button>
                              <button onClick={() => handleDeleteLocation(loc.id)} style={{ padding: '4px 8px', background: 'rgba(255,23,68,0.1)', color: '#FF1744', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentTab === 'users' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Platform Customers</h2>
            
            {selectedUserIds.length > 0 && (
              <div className="glass-panel animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', marginBottom: '16px', background: 'rgba(255, 51, 102, 0.05)', border: '1px solid rgba(255, 51, 102, 0.2)' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF' }}>{selectedUserIds.length} Customers Selected</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleBulkToggleBlockUsers} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Toggle Block Status</button>
                  <button onClick={handleBulkDeleteUsers} style={{ padding: '6px 12px', background: '#FF1744', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Delete Selected</button>
                </div>
              </div>
            )}

            <div className="glass-panel">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '14px', width: '40px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedUserIds.length === adminUsers.length && adminUsers.length > 0} 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserIds(adminUsers.map(u => u.uid));
                          } else {
                            setSelectedUserIds([]);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ padding: '14px' }}>Name</th>
                    <th style={{ padding: '14px' }}>Email</th>
                    <th style={{ padding: '14px' }}>Phone</th>
                    <th style={{ padding: '14px' }}>Status</th>
                    <th style={{ padding: '14px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map(u => (
                    <tr key={u.uid} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px', width: '40px' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedUserIds.includes(u.uid)} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds(prev => [...prev, u.uid]);
                            } else {
                              setSelectedUserIds(prev => prev.filter(id => id !== u.uid));
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '14px', fontWeight: 'bold', color: '#FFF' }}>{u.name}</td>
                      <td style={{ padding: '14px' }}>{u.email}</td>
                      <td style={{ padding: '14px' }}>{u.phone}</td>
                      <td style={{ padding: '14px' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 'bold', 
                          color: u.status === 'active' ? 'var(--primary)' : '#FF1744', 
                          background: u.status === 'active' ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 23, 68, 0.12)', 
                          padding: '3px 8px', 
                          borderRadius: '4px' 
                        }}>{u.status.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleToggleUserBlock(u.uid, u.status)} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Toggle Block</button>
                          <button onClick={() => handleDeleteUser(u.uid)} style={{ padding: '6px 12px', background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.2)', color: '#FF1744', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentTab === 'owners' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Parking Owners Management</h2>
            
            {selectedOwnerIds.length > 0 && (
              <div className="glass-panel animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', marginBottom: '16px', background: 'rgba(255, 51, 102, 0.05)', border: '1px solid rgba(255, 51, 102, 0.2)' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF' }}>{selectedOwnerIds.length} Hosts Selected</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleBulkSuspendOwners} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Toggle Suspension</button>
                  <button onClick={handleBulkDeleteOwners} style={{ padding: '6px 12px', background: '#FF1744', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Delete Selected</button>
                </div>
              </div>
            )}

            <div className="glass-panel">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '14px', width: '40px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedOwnerIds.length === adminOwners.length && adminOwners.length > 0} 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOwnerIds(adminOwners.map(o => o.uid));
                          } else {
                            setSelectedOwnerIds([]);
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ padding: '14px' }}>Name</th>
                    <th style={{ padding: '14px' }}>Contact Info</th>
                    <th style={{ padding: '14px' }}>Listed Spots</th>
                    <th style={{ padding: '14px' }}>KYC Verification</th>
                    <th style={{ padding: '14px' }}>Wallet Balance</th>
                    <th style={{ padding: '14px' }}>Status</th>
                    <th style={{ padding: '14px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminOwners.map(o => (
                    <tr key={o.uid} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px', width: '40px' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedOwnerIds.includes(o.uid)} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOwnerIds(prev => [...prev, o.uid]);
                            } else {
                              setSelectedOwnerIds(prev => prev.filter(id => id !== o.uid));
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '14px', fontWeight: 'bold', color: '#FFF' }}>{o.name}</td>
                      <td style={{ padding: '14px' }}>
                        <div>{o.email}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{o.phone}</div>
                      </td>
                      <td style={{ padding: '14px', fontWeight: 'bold' }}>{o.locationsCount} spots</td>
                      <td style={{ padding: '14px' }}>
                        {o.kycStatus === 'verified' ? (
                          <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '11px', background: 'rgba(0, 230, 118, 0.12)', padding: '3px 8px', borderRadius: '4px' }}>✓ VERIFIED</span>
                        ) : o.kycStatus === 'rejected' ? (
                          <span style={{ color: '#FF3366', fontWeight: 'bold', fontSize: '11px', background: 'rgba(255, 51, 102, 0.12)', padding: '3px 8px', borderRadius: '4px' }}>🔴 REJECTED</span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#FFC107', fontWeight: 'bold', fontSize: '11px', background: 'rgba(255, 193, 7, 0.12)', padding: '3px 8px', borderRadius: '4px' }}>⏳ PENDING</span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px' }}>
                        {editingOwnerId === o.uid ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>₹</span>
                            <input 
                              type="number" 
                              value={editOwnerEarnings} 
                              onChange={(e) => setEditOwnerEarnings(e.target.value)} 
                              style={{ width: '90px', padding: '6px', background: '#0a0a0a', border: '1px solid var(--primary)', borderRadius: '6px', color: '#FFF', fontSize: '13px', fontWeight: 'bold', outline: 'none' }}
                            />
                          </div>
                        ) : (
                          <span style={{ color: 'var(--primary)', fontSize: '15px', fontWeight: '800' }}>₹{o.earnings}</span>
                        )}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 'bold', 
                          color: o.status === 'active' ? 'var(--primary)' : '#FF1744', 
                          background: o.status === 'active' ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 23, 68, 0.12)', 
                          padding: '3px 8px', 
                          borderRadius: '4px' 
                        }}>{o.status.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setSelectedAdminOwner(o)} style={{ padding: '6px 12px', background: 'rgba(123, 97, 255, 0.1)', border: '1px solid rgba(123, 97, 255, 0.3)', color: '#7B61FF', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Payout Profile</button>
                          {editingOwnerId === o.uid ? (
                            <>
                              <button onClick={() => handleSaveOwnerBalance(o.uid)} style={{ padding: '6px 12px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Save</button>
                              <button onClick={() => setEditingOwnerId(null)} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', color: '#FFF', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditingOwnerId(o.uid); setEditOwnerEarnings(String(o.earnings)); }} style={{ padding: '6px 12px', background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.2)', color: 'var(--primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Edit Balance</button>
                              <button onClick={() => handleToggleOwnerSuspend(o.uid, o.status)} style={{ padding: '6px 12px', background: o.status === 'active' ? 'rgba(255,23,68,0.1)' : 'rgba(0, 230, 118, 0.08)', border: o.status === 'active' ? '1px solid rgba(255,23,68,0.2)' : '1px solid var(--primary)', color: o.status === 'active' ? '#FF1744' : 'var(--primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>{o.status === 'active' ? 'Suspend' : 'Activate'}</button>
                            </>
                          )}
                          <button onClick={() => handleDeleteOwner(o.uid)} style={{ padding: '6px 12px', background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.2)', color: '#FF1744', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentTab === 'revenue' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Revenues & Commissions Payouts</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="glass-panel" style={{ padding: '24px', borderLeft: '3px solid #FFC107' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🔒 Global Parking Rates
                    <span style={{ fontSize: '9px', background: 'rgba(255,193,7,0.15)', color: '#FFC107', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>ADMIN ONLY</span>
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>These rates apply to all new parking spaces. Owners cannot change them.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>30-Minute Rate (₹ per 30 min)</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="number" value={editing30Min} onChange={(e) => setEditing30Min(e.target.value)} min="1" style={{ flex: 1, padding: '10px', background: 'var(--bg-primary)', border: '1px solid rgba(255,193,7,0.4)', borderRadius: '6px', color: '#FFF', fontSize: '14px', fontWeight: '700' }} />
                        <span style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '12px', alignSelf: 'center' }}>/30m</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Hourly Rate (₹ per hour)</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="number" value={editingHourly} onChange={(e) => setEditingHourly(e.target.value)} min="1" style={{ flex: 1, padding: '10px', background: 'var(--bg-primary)', border: '1px solid rgba(255,193,7,0.4)', borderRadius: '6px', color: '#FFF', fontSize: '14px', fontWeight: '700' }} />
                        <span style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '12px', alignSelf: 'center' }}>/hr</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Daily Rate (₹ per day)</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="number" value={editingDaily} onChange={(e) => setEditingDaily(e.target.value)} min="1" style={{ flex: 1, padding: '10px', background: 'var(--bg-primary)', border: '1px solid rgba(255,193,7,0.4)', borderRadius: '6px', color: '#FFF', fontSize: '14px', fontWeight: '700' }} />
                        <span style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '12px', alignSelf: 'center' }}>/day</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', padding: '10px', background: 'rgba(255,193,7,0.06)', borderRadius: '8px', border: '1px solid rgba(255,193,7,0.15)' }}>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <p style={{ fontSize: '9px', color: 'var(--text-muted)' }}>30 Min</p>
                        <p style={{ fontSize: '16px', fontWeight: '800', color: '#FFC107' }}>₹{global30MinRate}</p>
                      </div>
                      <div style={{ width: '1px', background: 'var(--border-color)' }} />
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <p style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Hourly</p>
                        <p style={{ fontSize: '16px', fontWeight: '800', color: '#FFC107' }}>₹{globalHourlyRate}</p>
                      </div>
                      <div style={{ width: '1px', background: 'var(--border-color)' }} />
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <p style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Daily</p>
                        <p style={{ fontSize: '16px', fontWeight: '800', color: '#FFC107' }}>₹{globalDailyRate}</p>
                      </div>
                    </div>
                    <button onClick={handleUpdateGlobalRates} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #FFC107, #FF8C42)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}>💾 Save Global Rates</button>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3>Adjust Platform Commission</h3>
                  <div style={{ margin: '20px 0' }}>
                    <input type="range" min="5" max="25" value={commissionPercentage} onChange={(e) => handleUpdateCommission(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                    <p style={{ marginTop: '10px' }}>Rate: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{commissionPercentage}%</span></p>
                  </div>
                  <button onClick={() => handleExportData('csv', 'revenue')} style={{ display: 'flex', gap: '8px', width: '100%', padding: '10px', background: 'var(--secondary)', border: 'none', borderRadius: '6px', color: '#FFF', cursor: 'pointer', justifyContent: 'center' }}><FileSpreadsheet size={16} /> Export CSV Ledger</button>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3>Hosts payout pools</h3>
                {adminOwners.map(owner => (
                  <div key={owner.uid} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <p style={{ fontWeight: 'bold' }}>{owner.name}</p>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Gross: ₹{owner.earnings}</span>
                    </div>
                    <button onClick={() => handleProcessPayout(owner)} style={{ padding: '6px 12px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Pay Out: ₹{(owner.earnings * 0.9).toFixed(0)}</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'complaints' && (
          <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Complaints & Support Tickets Queue</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Track, audit, and resolve operational issues filed by Customers and hosts/owners.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Pending</span>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-orange)' }}>{complaints.filter(c => c.status === 'pending').length}</span>
                </div>
                <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Resolved</span>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-green)' }}>{complaints.filter(c => c.status === 'resolved').length}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {complaints.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Complaints queue is empty. No issues filed.
                </div>
              ) : (
                complaints.map(comp => (
                  <div key={comp.id} className="glass-panel" style={{ padding: '24px', borderLeft: comp.status === 'resolved' ? '4px solid var(--accent-green)' : '4px solid var(--accent-orange)' }}>
                    
                    {/* Ticket Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold' }}>TICKET ID: #{comp.id}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: comp.userRole === 'owner' ? 'rgba(123, 97, 255, 0.15)' : 'rgba(0, 212, 255, 0.15)',
                              color: comp.userRole === 'owner' ? 'var(--secondary)' : 'var(--primary)'
                            }}>
                              {comp.userRole === 'owner' ? 'Host/Owner' : 'Customer'}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFF' }}>{comp.userName || 'Unknown User'}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>({comp.userEmail || 'no-email'})</span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: comp.status === 'resolved' ? 'rgba(0, 229, 160, 0.1)' : 'rgba(255, 140, 66, 0.1)',
                          color: comp.status === 'resolved' ? 'var(--accent-green)' : 'var(--accent-orange)'
                        }}>
                          {comp.status}
                        </span>
                      </div>
                    </div>

                    {/* Ticket Subject & Body */}
                    <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFF', marginBottom: '8px' }}>{comp.subject}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: '1.5' }}>{comp.description}</p>
                    
                    {/* Actions / Timestamps */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Created: {new Date(comp.createdAt).toLocaleString()}</span>
                      
                      {comp.status === 'pending' ? (
                        <button 
                          onClick={() => handleResolveComplaint(comp.id)} 
                          className="glow-button"
                          style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '700' }}
                        >
                          Resolve & Close Ticket
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ✓ RESOLVED BY SYSTEM
                        </span>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {currentTab === 'notifications' && (
          <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>Send Notification Broadcast</h2>
              <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>Title</label>
                  <input type="text" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} placeholder="Marina Beach road diversion..." style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px' }}>Message Body</label>
                  <textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} placeholder="Write details here..." style={{ width: '100%', height: '80px', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#FFF', resize: 'none' }} required />
                </div>
                <button type="submit" className="glow-button" style={{ width: '100%', padding: '12px' }}>Dispatch Broadcast</button>
              </form>
            </div>
          </div>
        )}

        {currentTab === 'logs' && (
          <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Security Audit Logs</h2>
            <div className="glass-panel" style={{ padding: '24px' }}>
              {auditLogs.map(log => (
                <div key={log.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                  <p style={{ fontFamily: 'monospace' }}><strong>{log.action}</strong></p>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Admin: {log.admin} • IP: {log.ip} • Date: {new Date(log.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

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

      {/* CONFIRMS */}
      {customConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '360px', padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
            <AlertCircle size={32} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>{customConfirm.title}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>{customConfirm.message}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => { 
                  customConfirm.onConfirm(); 
                  setCustomConfirm(null); 
                }} 
                className="glow-button" 
                style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: 'bold' }}
              >
                Confirm
              </button>
              <button 
                onClick={() => setCustomConfirm(null)} 
                style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#FFF', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYOUT PROFILE MODAL */}
      {selectedAdminOwner && (() => {
        const activeOwner = adminOwners.find(o => o.uid === selectedAdminOwner.uid) || selectedAdminOwner;
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '20px', border: '1px solid rgba(0, 212, 255, 0.15)', background: '#0a0e1a', color: '#FFF' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#FFF', margin: '0' }}>Payout Profile & KYC Details</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: '4px 0 0 0' }}>
                    Host: <strong>{activeOwner.name}</strong> ({activeOwner.email} | {activeOwner.phone})
                  </p>
                </div>
                <button 
                  onClick={() => { setSelectedAdminOwner(null); setIsRejectingKyc(false); setRejectionRemarks(''); }}
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#FFF', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}
                >
                  ×
                </button>
              </div>

              {/* Status Banner */}
              <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                {activeOwner.kycStatus === 'verified' && (
                  <div style={{ background: 'rgba(0, 229, 160, 0.08)', border: '1px solid rgba(0, 229, 160, 0.25)', borderRadius: '12px', padding: '12px 16px', color: '#00E5A0', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>✓ KYC Verification Approved on {activeOwner.kycDate ? new Date(activeOwner.kycDate).toLocaleDateString() : 'recent date'}.</span>
                    <span style={{ fontSize: '10px', background: 'rgba(0, 229, 160, 0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>VERIFIED</span>
                  </div>
                )}
                {activeOwner.kycStatus === 'pending' && (
                  <div style={{ background: 'rgba(255, 140, 66, 0.08)', border: '1px solid rgba(255, 140, 66, 0.25)', borderRadius: '12px', padding: '12px 16px', color: '#FF8C42', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>⏳ KYC Verification Pending review of uploaded document proofs.</span>
                    <span style={{ fontSize: '10px', background: 'rgba(255, 140, 66, 0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>PENDING REVIEW</span>
                  </div>
                )}
                {activeOwner.kycStatus === 'rejected' && (
                  <div style={{ background: 'rgba(255, 51, 102, 0.08)', border: '1px solid rgba(255, 51, 102, 0.25)', borderRadius: '12px', padding: '12px 16px', color: '#FF3366', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 'bold' }}>🔴 KYC Verification Rejected</span>
                      <span style={{ fontSize: '10px', background: 'rgba(255, 51, 102, 0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>REJECTED</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}><strong>Remarks:</strong> {activeOwner.kycRemarks || 'None provided.'}</p>
                  </div>
                )}
              </div>

              {/* Two Column Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px', marginBottom: '28px' }}>
                {/* Payout Details */}
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'left', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', marginBottom: '14px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#FFF', margin: '0' }}>
                      🏦 Settlement Credentials
                    </h4>
                    {!isEditingOwnerPayout && (
                      <button 
                        onClick={() => setIsEditingOwnerPayout(true)} 
                        style={{ padding: '4px 10px', background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.3)', borderRadius: '6px', color: 'var(--primary)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Edit Credentials
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                    
                    {isEditingOwnerPayout ? (
                      <>
                        <div>
                          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', marginBottom: '4px' }}>Preferred Payout Channel:</span>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              type="button"
                              onClick={() => setEditOwnerPayoutMethod('bank')}
                              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: editOwnerPayoutMethod === 'bank' ? '1.5px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)', background: editOwnerPayoutMethod === 'bank' ? 'var(--primary-glow)' : 'transparent', color: '#FFF', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                            >
                              Bank Deposit
                            </button>
                            <button 
                              type="button"
                              onClick={() => setEditOwnerPayoutMethod('upi')}
                              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: editOwnerPayoutMethod === 'upi' ? '1.5px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)', background: editOwnerPayoutMethod === 'upi' ? 'var(--primary-glow)' : 'transparent', color: '#FFF', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}
                            >
                              UPI Payout
                            </button>
                          </div>
                        </div>

                        {editOwnerPayoutMethod === 'bank' ? (
                          <>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', marginBottom: '4px' }}>Account Holder Name:</span>
                              <input 
                                type="text" 
                                value={editOwnerBankHolder} 
                                onChange={(e) => setEditOwnerBankHolder(e.target.value)} 
                                style={{ width: '100%', padding: '8px 10px', background: '#0a0a0a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#FFF', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }}
                              />
                            </div>

                            <div style={{ position: 'relative' }}>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', marginBottom: '4px' }}>Bank Name:</span>
                              <div 
                                onClick={() => { setShowAdminBankDropdown(!showAdminBankDropdown); setAdminBankSearchQuery(''); }}
                                style={{ 
                                  width: '100%', 
                                  padding: '8px 10px', 
                                  background: '#0a0a0a', 
                                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                                  borderRadius: '6px', 
                                  color: editOwnerBankName ? '#FFF' : 'var(--text-muted)', 
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  boxSizing: 'border-box',
                                  height: '35px'
                                }}
                              >
                                <span>{editOwnerBankName || 'Select Bank'}</span>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', transform: showAdminBankDropdown ? 'rotate(180deg)' : 'none' }}>▼</span>
                              </div>

                              {showAdminBankDropdown && (
                                <>
                                  <div 
                                    onClick={() => setShowAdminBankDropdown(false)} 
                                    style={{ position: 'fixed', inset: 0, zIndex: 999 }} 
                                  />
                                  <div style={{ 
                                    position: 'absolute', 
                                    top: '100%', 
                                    left: 0, 
                                    right: 0, 
                                    marginTop: '4px',
                                    background: '#121620', 
                                    border: '1px solid rgba(0, 212, 255, 0.2)', 
                                    borderRadius: '6px', 
                                    zIndex: 1000,
                                    maxHeight: '180px',
                                    overflowY: 'auto',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                                    padding: '8px',
                                    boxSizing: 'border-box'
                                  }}>
                                    <input 
                                      type="text"
                                      placeholder="Search Bank..."
                                      value={adminBankSearchQuery}
                                      onChange={(e) => setAdminBankSearchQuery(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      autoFocus
                                      style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        background: '#0a0a0a',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '4px',
                                        color: '#FFF',
                                        fontSize: '12px',
                                        marginBottom: '8px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                      }}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      {INDIAN_BANKS.filter(bank => 
                                        bank.toLowerCase().includes(adminBankSearchQuery.toLowerCase())
                                      ).map(bank => (
                                        <div
                                          key={bank}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditOwnerBankName(bank);
                                            setShowAdminBankDropdown(false);
                                          }}
                                          style={{
                                            padding: '6px 8px',
                                            borderRadius: '4px',
                                            color: bank === editOwnerBankName ? '#00D4FF' : '#E2E8F0',
                                            background: bank === editOwnerBankName ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            transition: 'all 0.1s ease',
                                            textAlign: 'left'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.target.style.background = 'rgba(0, 212, 255, 0.12)';
                                            e.target.style.color = '#FFF';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.target.style.background = bank === editOwnerBankName ? 'rgba(0, 212, 255, 0.08)' : 'transparent';
                                            e.target.style.color = bank === editOwnerBankName ? '#00D4FF' : '#E2E8F0';
                                          }}
                                        >
                                          {bank}
                                        </div>
                                      ))}
                                      {INDIAN_BANKS.filter(bank => 
                                        bank.toLowerCase().includes(adminBankSearchQuery.toLowerCase())
                                      ).length === 0 && (
                                        <div style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center' }}>
                                          No banks found
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>

                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', marginBottom: '4px' }}>Account Number:</span>
                              <input 
                                type="text" 
                                value={editOwnerBankAccNum} 
                                onChange={(e) => setEditOwnerBankAccNum(e.target.value.replace(/\D/g,''))} 
                                style={{ width: '100%', padding: '8px 10px', background: '#0a0a0a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#FFF', outline: 'none', fontSize: '13px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                              />
                            </div>

                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', marginBottom: '4px' }}>IFSC Code:</span>
                              <input 
                                type="text" 
                                value={editOwnerBankIfsc} 
                                onChange={(e) => setEditOwnerBankIfsc(e.target.value.toUpperCase())} 
                                style={{ width: '100%', padding: '8px 10px', background: '#0a0a0a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#FFF', outline: 'none', fontSize: '13px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                              />
                            </div>

                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', marginBottom: '4px' }}>Branch Name (Optional):</span>
                              <input 
                                type="text" 
                                value={editOwnerBankBranch} 
                                onChange={(e) => setEditOwnerBankBranch(e.target.value)} 
                                style={{ width: '100%', padding: '8px 10px', background: '#0a0a0a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#FFF', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }}
                              />
                            </div>
                          </>
                        ) : (
                          <div>
                            <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', marginBottom: '4px' }}>UPI Virtual Address:</span>
                            <input 
                              type="text" 
                              value={editOwnerUpiId} 
                              onChange={(e) => setEditOwnerUpiId(e.target.value)} 
                              placeholder="username@bank"
                              style={{ width: '100%', padding: '8px 10px', background: '#0a0a0a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#FFF', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }}
                            />
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          <button 
                            onClick={() => handleSaveOwnerPayoutDetails(activeOwner.uid)}
                            style={{ flex: 1, padding: '8px 12px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                          >
                            Save Credentials
                          </button>
                          <button 
                            onClick={() => setIsEditingOwnerPayout(false)}
                            style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>Preferred Payout Channel:</span>
                          <strong style={{ color: 'var(--primary)', textTransform: 'uppercase' }}>{activeOwner.payoutMethod === 'upi' ? 'UPI / VPA' : 'Direct Bank Deposit'}</strong>
                        </div>

                        {activeOwner.payoutMethod === 'bank' ? (
                          <>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>Account Holder:</span>
                              <span style={{ color: '#FFF', fontWeight: 'bold' }}>{activeOwner.bankDetails?.holderName || 'N/A'}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>Bank Name:</span>
                              <span style={{ color: '#FFF', fontWeight: 'bold' }}>{activeOwner.bankDetails?.bankName || 'N/A'}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>Account Number:</span>
                              <span style={{ color: '#FFF', fontWeight: 'bold', fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                {unmaskAccountOwner ? activeOwner.bankDetails?.accountNumber : `•••• •••• ${activeOwner.bankDetails?.accountNumber?.slice(-4) || '1234'}`}
                                {activeOwner.bankDetails?.accountNumber && (
                                  <button 
                                    onClick={() => setUnmaskAccountOwner(!unmaskAccountOwner)} 
                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}
                                  >
                                    {unmaskAccountOwner ? <EyeOff size={14} /> : <Eye size={14} />}
                                  </button>
                                )}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>IFSC Code:</span>
                              <span style={{ color: '#FFF', fontWeight: 'bold', fontFamily: 'monospace' }}>{activeOwner.bankDetails?.ifscCode || 'N/A'}</span>
                            </div>
                            {activeOwner.bankDetails?.branchName && (
                              <div>
                                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>Branch:</span>
                                <span style={{ color: '#FFF' }}>{activeOwner.bankDetails.branchName}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>UPI Virtual Address:</span>
                              <span style={{ color: '#FFF', fontWeight: 'bold', fontFamily: 'monospace' }}>{activeOwner.upiDetails?.upiId || 'N/A'}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>UPI Status:</span>
                              <span style={{ color: activeOwner.upiDetails?.verifiedUpi ? 'var(--primary)' : '#FF3366', fontWeight: 'bold' }}>
                                {activeOwner.upiDetails?.verifiedUpi ? '🟢 Verified / Authed' : '🔴 Unverified'}
                              </span>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Document Attachments */}
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'left', background: 'rgba(255,255,255,0.01)' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#FFF', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', marginBottom: '14px', marginTop: '0' }}>
                    📄 KYC Document Attachments
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Passbook */}
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', marginBottom: '6px' }}>Bank Passbook Front Page:</span>
                      {activeOwner.kycDocuments?.passbook ? (
                        <a href={activeOwner.kycDocuments.passbook} target="_blank" rel="noreferrer" style={{ display: 'block', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden', width: '100%', height: '80px', background: '#000' }}>
                          <img src={activeOwner.kycDocuments.passbook} alt="Bank Passbook" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </a>
                      ) : (
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                          No file uploaded
                        </div>
                      )}
                    </div>

                    {/* PAN Card */}
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px', marginBottom: '6px' }}>PAN Card (Optional):</span>
                      {activeOwner.kycDocuments?.panCard ? (
                        <a href={activeOwner.kycDocuments.panCard} target="_blank" rel="noreferrer" style={{ display: 'block', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden', width: '100%', height: '80px', background: '#000' }}>
                          <img src={activeOwner.kycDocuments.panCard} alt="PAN Card" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </a>
                      ) : (
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                          No file uploaded
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>

              {/* KYC Verification Actions */}
              <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', textAlign: 'left', borderLeft: '4px solid var(--secondary)', background: 'rgba(255,255,255,0.01)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF', marginBottom: '12px', marginTop: '0' }}>
                  ⚙️ KYC Verification Controls
                </h4>
                
                {isRejectingKyc ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Provide rejection remarks/feedback for host:</label>
                    <textarea 
                      value={rejectionRemarks} 
                      onChange={(e) => setRejectionRemarks(e.target.value)} 
                      placeholder="e.g. Cancelled cheque image is blurry. Please upload a high-resolution photo."
                      style={{ width: '100%', height: '80px', padding: '10px', background: '#0a0a0a', border: '1px solid #FF3366', borderRadius: '8px', color: '#FFF', fontSize: '13px', resize: 'none', outline: 'none' }}
                      required
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => {
                          handleRejectOwnerKYC(activeOwner.uid, rejectionRemarks);
                          setIsRejectingKyc(false);
                          setRejectionRemarks('');
                        }} 
                        style={{ padding: '8px 16px', background: '#FF3366', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                      >
                        Confirm Rejection
                      </button>
                      <button 
                        onClick={() => { setIsRejectingKyc(false); setRejectionRemarks(''); }} 
                        style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => handleVerifyOwner(activeOwner.uid)} 
                      style={{ padding: '10px 20px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      ✓ Approve Payout Credentials
                    </button>
                    <button 
                      onClick={() => setIsRejectingKyc(true)} 
                      style={{ padding: '10px 20px', background: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.3)', color: '#FF3366', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                    >
                      ✕ Reject & Input Feedback
                    </button>
                  </div>
                )}
              </div>

              {/* Settlement Processor Console */}
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'left', borderLeft: '4px solid var(--primary)', background: 'rgba(255,255,255,0.01)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF', marginBottom: '8px', marginTop: '0' }}>
                  💰 Balance Settlement Processor
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pending Earnings Wallet Balance:</span>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>
                      ₹{activeOwner.earnings || 0}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '12px' }}>
                        (Host Net Settlement [90%]: <strong>₹{Math.round((activeOwner.earnings || 0) * 0.9)}</strong>)
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleProcessPayout(activeOwner)}
                    disabled={!activeOwner.earnings || activeOwner.earnings <= 0}
                    className="glow-button"
                    style={{ padding: '12px 24px', fontSize: '13px', fontWeight: '800', opacity: (!activeOwner.earnings || activeOwner.earnings <= 0) ? 0.5 : 1, cursor: (!activeOwner.earnings || activeOwner.earnings <= 0) ? 'not-allowed' : 'pointer' }}
                  >
                    💸 Process Weekly Payout
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}

function LoginScreen({ onLogin, roleHint }) {
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
      setError(err.message);
    }
  };

  const handleQuickLogin = (email, pass) => {
    setEmailOrPhone(email);
    setPassword(pass);
    try {
      onLogin(email, pass);
    } catch (err) {
      setError(err.message);
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
      alignItems: 'center',
      justifyContent: 'center',
      width: '100vw'
    }}>
      <style>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 10px rgba(0, 230, 118, 0.4); }
          50% { box-shadow: 0 0 25px rgba(0, 230, 118, 0.8); }
          100% { box-shadow: 0 0 10px rgba(0, 230, 118, 0.4); }
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
          background-image: linear-gradient(rgba(0, 230, 118, 0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 230, 118, 0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: gridMove 8s linear infinite;
          opacity: 0.8;
          z-index: 1;
          pointer-events: none;
        }
        .glow-blob-1 {
          position: absolute;
          top: 15%;
          left: 15%;
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(0, 230, 118, 0.12) 0%, transparent 70%);
          filter: blur(40px);
          animation: floatBlob 15s ease-in-out infinite;
          z-index: 0;
          pointer-events: none;
        }
        .glow-blob-2 {
          position: absolute;
          bottom: 15%;
          right: 15%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(41, 121, 255, 0.08) 0%, transparent 70%);
          filter: blur(40px);
          animation: floatBlob 20s ease-in-out infinite reverse;
          z-index: 0;
          pointer-events: none;
        }
        .border-glow-wrapper {
          position: relative;
          padding: 1.5px;
          border-radius: 24px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.03);
          z-index: 2;
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.8);
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
            rgba(0, 230, 118, 0.6), 
            transparent 30%, 
            transparent 50%, 
            rgba(41, 121, 255, 0.6), 
            transparent 80%
          );
          animation: borderRotate 6s linear infinite;
          z-index: 0;
        }
        .border-glow-wrapper:hover {
          transform: perspective(1000px) rotateX(3deg) rotateY(-3deg) translateZ(10px) !important;
          box-shadow: 0 35px 80px rgba(0, 230, 118, 0.15), 0 25px 50px rgba(0, 0, 0, 0.9) !important;
        }
        .new-glass-card {
          position: relative;
          width: 100%;
          background: rgba(12, 12, 12, 0.92);
          backdrop-filter: blur(30px);
          border-radius: 23px;
          padding: 40px;
          box-sizing: border-box;
          z-index: 1;
        }
      `}</style>

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
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 0 28px rgba(0, 212, 255, 0.55), 0 0 50px rgba(108, 99, 255, 0.25)'
            }}>
              <img src="/parkhub_logo_admin.png" alt="ParkHub Admin Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                placeholder="admin@parkeasy.in or +91 98765 43210"
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
