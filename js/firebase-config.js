import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
// Firebase Storage removed — it now requires the Blaze (billing) plan.
// Profile photos are uploaded to Cloudinary instead — see js/cloudinary-config.js

// ============================================================
// PASTE YOUR FIREBASE CONFIG HERE (same object in one place now)
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyCuWRS2ZM5fHMYKzM141OgJ7CARj3Z9H9I",
  authDomain: "rccg-champions-media.firebaseapp.com",
  projectId: "rccg-champions-media",
  storageBucket: "rccg-champions-media.firebasestorage.app",
  messagingSenderId: "457166432992",
  appId: "1:457166432992:web:f065ea066a5fca0fa9fe85",
};
// ============================================================

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
