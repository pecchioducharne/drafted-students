import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore
import { getStorage } from "firebase/storage"; // Import Firebase Storage

const firebaseConfig = {
  apiKey: "AIzaSyCmQRXoSyXy5rGm8JjF5JGH_eFQibKW_0g",
  authDomain: "drafted-6c302.firebaseapp.com",
  projectId: "drafted-6c302",
  storageBucket: "drafted-6c302.appspot.com",
  messagingSenderId: "739427449972",
  appId: "1:739427449972:web:c02c6a8cdf544c30e52521",
  measurementId: "G-2C3DWJC6W6",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Initialize Firebase Authentication
const db = getFirestore(app); // Initialize Firestore
const storage = getStorage(app); // Initialize Firebase Storage

export { app, auth, db, storage }; // Export app, auth, and db
