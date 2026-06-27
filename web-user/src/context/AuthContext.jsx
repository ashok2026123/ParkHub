import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://parkhub-wefh.onrender.com/api';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Build user object from firebase user details
        const u = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email: firebaseUser.email,
          phone: firebaseUser.phoneNumber || "+91 88833 99999",
          role: "customer",
          profilePic: firebaseUser.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
          referralCode: "PARK" + firebaseUser.uid.substring(0, 5).toUpperCase(),
          favoriteLocations: [],
          language: 'en',
          walletBalance: 1250,
          transactions: [
            { id: 'tx-1', type: 'credit', amount: 1500, description: 'Initial Wallet Loading', date: '2026-06-20T10:30:00Z' },
            { id: 'tx-2', type: 'debit', amount: 250, description: 'Paid for Booking #BK-9021', date: '2026-06-22T14:15:00Z' }
          ]
        };

        try {
          await fetch(`${API_URL}/customers/${u.uid}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(u)
          });
        } catch (e) {
          console.error("Error syncing customer profile:", e);
        }

        setUser(u);
        localStorage.setItem('parkeasy_customer', JSON.stringify(u));
      } else {
        setUser(null);
        localStorage.removeItem('parkeasy_customer');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [API_URL]);

  const logout = () => {
    signOut(auth);
  };

  const loginWithCredentials = async (email, password) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), password);
      return res.user;
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        // Auto register if user doesn't exist
        try {
          const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
          return res.user;
        } catch (regErr) {
          throw regErr;
        }
      }
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      return res.user;
    } catch (err) {
      console.error("Google Auth error:", err);
      throw err;
    }
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
    <AuthContext.Provider value={{ user, loading, logout, loginWithCredentials, loginWithGoogle, loginAsGuest, toggleFavorite, updateProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
