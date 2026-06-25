import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

const MOCK_CUSTOMER = {
  uid: "customer-789",
  name: "Karthik Raja",
  email: "karthik@mymail.com",
  phone: "+91 88833 99999",
  role: "customer",
  profilePic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
  referralCode: "KARTHIK9",
  favoriteLocations: ["loc-1"],
  language: 'en',
  walletBalance: 1250,
  transactions: [
    { id: 'tx-1', type: 'credit', amount: 1500, description: 'Initial Wallet Loading', date: '2026-06-20T10:30:00Z' },
    { id: 'tx-2', type: 'debit', amount: 250, description: 'Paid for Booking #BK-9021', date: '2026-06-22T14:15:00Z' }
  ],
  createdAt: new Date().toISOString()
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('parkeasy_customer');
    return saved ? JSON.parse(saved) : null;
  });

  const logout = () => {
    setUser(null);
    localStorage.removeItem('parkeasy_customer');
  };

  const loginWithCredentials = (emailOrPhone, password) => {
    const cleanInput = emailOrPhone.trim().toLowerCase().replace(/\s+/g, '');
    const isEmail = emailOrPhone.includes('@');
    const defaultUser = {
      ...MOCK_CUSTOMER,
      email: isEmail ? emailOrPhone : `${cleanInput}@mymail.com`,
      phone: isEmail ? "+91 88833 99999" : emailOrPhone,
      name: isEmail ? emailOrPhone.split('@')[0] : "Karthik Raja"
    };
    setUser(defaultUser);
    localStorage.setItem('parkeasy_customer', JSON.stringify(defaultUser));
    return defaultUser;
  };

  const loginAsGuest = () => {
    const guestUser = {
      uid: "guest-user",
      name: "Guest User",
      email: "guest@parkeasy.in",
      phone: "+91 00000 00000",
      role: "guest",
      profilePic: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
      referralCode: "GUEST101",
      favoriteLocations: [],
      language: 'en',
      createdAt: new Date().toISOString()
    };
    setUser(guestUser);
    localStorage.setItem('parkeasy_customer', JSON.stringify(guestUser));
    return guestUser;
  };

  const toggleFavorite = (locationId) => {
    if (!user) return;
    setUser(prev => {
      const favs = prev.favoriteLocations || [];
      const isFav = favs.includes(locationId);
      const newFavs = isFav ? favs.filter(id => id !== locationId) : [...favs, locationId];
      const updated = { ...prev, favoriteLocations: newFavs };
      localStorage.setItem('parkeasy_customer', JSON.stringify(updated));
      return updated;
    });
  };

  const updateProfile = (newData) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...newData };
      localStorage.setItem('parkeasy_customer', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, logout, loginWithCredentials, loginAsGuest, toggleFavorite, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
