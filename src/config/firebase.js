import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCIMzTkoGlAjiJhGfJ4o0KtnEEp26jizVM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mystoreapp-bed62.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mystoreapp-bed62",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mystoreapp-bed62.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "979027037489",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:979027037489:web:203e9643d399a01570b410",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-EQYXVL7XR9"
};

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
