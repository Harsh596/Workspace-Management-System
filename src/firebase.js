import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  reauthenticateWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCRzam0e1Ajr-sCUU1zZ7AsEpbARjbni_o",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "resource-radar-d10da.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "resource-radar-d10da",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "resource-radar-d10da.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "514740008390",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:514740008390:web:25e8dedac8c365b68c2ec7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { 
  auth, 
  db,
  storage,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  reauthenticateWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
};
