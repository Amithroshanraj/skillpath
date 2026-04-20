// Firebase core
import { initializeApp } from "firebase/app";

// Firebase services you ACTUALLY need
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ❌ Do NOT import analytics for Capacitor
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBEeAmrrQNwzos7Fu1X03jg5KnDdsmJcvE",
  authDomain: "skillpath-3d322.firebaseapp.com",
  projectId: "skillpath-3d322",
  storageBucket: "skillpath-3d322.appspot.com",
  messagingSenderId: "933495658210",
  appId: "1:933495658210:web:7666c5683590007c50f0bb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
