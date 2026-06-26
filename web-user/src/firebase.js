import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBFXRLesk1jU56fSzmR0kjoNmLM_b_EfjU",
  authDomain: "parkhub-2343e.firebaseapp.com",
  projectId: "parkhub-2343e",
  storageBucket: "parkhub-2343e.firebasestorage.app",
  messagingSenderId: "196449294246",
  appId: "1:196449294246:web:2494c63e9667ebc74fe167",
  measurementId: "G-0718WFE316"
};

let app;
let auth;
let googleProvider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { 
  auth,
  googleProvider,
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
};
// Wake-up Vercel build trigger
