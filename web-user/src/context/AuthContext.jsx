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
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('parkeasy_customer');
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse localStorage:", e);
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 3 second safety timeout to force load completion if Firebase is blocked or fails to connect
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    if (!auth) {
      console.warn("Firebase Auth is not available. Running in local mock mode.");
      clearTimeout(safetyTimeout);
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        clearTimeout(safetyTimeout);
        if (firebaseUser) {
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
          setUser(u);
          localStorage.setItem('parkeasy_customer', JSON.stringify(u));
        } else {
          // Only sign out if we didn't log in as a local guest
          const current = localStorage.getItem('parkeasy_customer');
          const parsed = current ? JSON.parse(current) : null;
          if (parsed && parsed.role !== 'guest') {
            setUser(null);
            localStorage.removeItem('parkeasy_customer');
          }
        }
        setLoading(false);
      }, (error) => {
        console.error("onAuthStateChanged error:", error);
        clearTimeout(safetyTimeout);
        setLoading(false);
      });

      return () => {
        clearTimeout(safetyTimeout);
        unsubscribe();
      };
    } catch (err) {
      console.error("Firebase auth subscription error:", err);
      clearTimeout(safetyTimeout);
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("SignOut error:", err);
      }
    }
    setUser(null);
    localStorage.removeItem('parkeasy_customer');
  };

  const loginWithCredentials = async (email, password) => {
    // If Firebase Auth failed to initialize, run local mock credentials authentication
    if (!auth) {
      const cleanInput = email.trim().toLowerCase().replace(/\s+/g, '');
      const isEmail = email.includes('@');
      const mockUser = {
        uid: "customer-789",
        name: isEmail ? email.split('@')[0] : "Karthik Raja",
        email: isEmail ? email : `${cleanInput}@mymail.com`,
        phone: isEmail ? "+91 88833 99999" : email,
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
      setUser(mockUser);
      localStorage.setItem('parkeasy_customer', JSON.stringify(mockUser));
      return mockUser;
    }

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
    if (!auth) {
      throw new Error("Google Sign-In is unavailable because Firebase could not initialize. Try logging in with credentials or guest mode.");
    }
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
