import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import { getFirestore, collection } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDB-kldTmTDZAxf5nQQH01cmRbQtySCUYQ",
  authDomain: "appdevactivity-1578e.firebaseapp.com",
  projectId: "appdevactivity-1578e",
  storageBucket: "appdevactivity-1578e.firebasestorage.app",
  messagingSenderId: "1037488049381",
  appId: "1:1037488049381:web:d215cfd1c4713f34f9d80c",
  measurementId: "G-HJBYT34YTD",
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app);
export const db = getFirestore(app);

// Collections
export const userRef = collection(db, "users");
export const roomRef = collection(db, "rooms");
