import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

// Mock pre-configured users for easier testing/development
const MOCK_USERS = {
  admin: {
    uid: "admin-123",
    name: "Rajesh Kumar",
    email: "admin@parkeasy.in",
    phone: "+91 98765 43210",
    role: "admin",
    profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    referralCode: "ADMINPE",
    favoriteLocations: [],
    language: 'en',
    createdAt: new Date().toISOString()
  },
  owner: {
    uid: "owner-456",
    name: "Suresh Perumal",
    email: "suresh@spotowner.com",
    phone: "+91 94440 12345",
    role: "owner",
    profilePic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    referralCode: "SURESH50",
    favoriteLocations: [],
    language: 'en',
    createdAt: new Date().toISOString()
  },
  customer: {
    uid: "customer-789",
    name: "Karthik Raja",
    email: "karthik@mymail.com",
    phone: "+91 88833 99999",
    role: "customer",
    profilePic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    referralCode: "KARTHIK9",
    favoriteLocations: ["loc-1", "loc-3"],
    language: 'en',
    createdAt: new Date().toISOString()
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('parkeasy_user');
    return saved ? JSON.parse(saved) : null; // Defaults to null to display the login page
  });

  const login = (role) => {
    const selectedUser = MOCK_USERS[role] || MOCK_USERS.customer;
    setUser(selectedUser);
    localStorage.setItem('parkeasy_user', JSON.stringify(selectedUser));
    return selectedUser;
  };

  const loginWithCredentials = (emailOrPhone, password) => {
    // Check match by email or phone (ignoring spaces)
    const cleanInput = emailOrPhone.trim().toLowerCase().replace(/\s+/g, '');
    let foundUser = Object.values(MOCK_USERS).find(u => 
      u.email.toLowerCase() === cleanInput || 
      u.phone.replace(/\s+/g, '').includes(cleanInput)
    );
    
    if (!foundUser) {
      // Create dynamically
      foundUser = {
        uid: "user-" + Math.floor(Math.random()*1000),
        name: emailOrPhone.includes('@') ? emailOrPhone.split('@')[0] : "User",
        email: emailOrPhone.includes('@') ? emailOrPhone : `${cleanInput}@parkeasy.in`,
        phone: emailOrPhone.includes('@') ? "+91 90000 00000" : emailOrPhone,
        role: "customer",
        profilePic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
        referralCode: "PE" + Math.floor(Math.random()*1000),
        favoriteLocations: [],
        language: 'en',
        createdAt: new Date().toISOString()
      };
    }
    setUser(foundUser);
    localStorage.setItem('parkeasy_user', JSON.stringify(foundUser));
    return foundUser;
  };

  const register = (name, email, phone, role) => {
    const newUser = {
      uid: "user-" + Math.floor(Math.random()*1000),
      name,
      email,
      phone,
      role,
      profilePic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
      referralCode: name.toUpperCase().slice(0, 3) + Math.floor(Math.random() * 1000),
      favoriteLocations: [],
      language: 'en',
      createdAt: new Date().toISOString()
    };
    setUser(newUser);
    localStorage.setItem('parkeasy_user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('parkeasy_user');
  };

  const toggleFavorite = (locationId) => {
    if (!user) return;
    setUser(prev => {
      const favs = prev.favoriteLocations || [];
      const isFav = favs.includes(locationId);
      const newFavs = isFav ? favs.filter(id => id !== locationId) : [...favs, locationId];
      const updated = { ...prev, favoriteLocations: newFavs };
      localStorage.setItem('parkeasy_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithCredentials, register, logout, toggleFavorite }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
