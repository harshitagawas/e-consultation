// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration (prefer env vars; fallback to literals)
// Note: In Next.js, expose config via NEXT_PUBLIC_* for client usage
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyDM71LlfcmZL-OVXwJJvDV8Ec0n2XZm-ao",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "econsultation-e37b0.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "econsultation-e37b0",
  // storageBucket should be the bucket name (appspot.com), not firebasestorage.app
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "econsultation-e37b0.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "573487423540",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:573487423540:web:09fd046b9194ca8e372a61",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-VBMS5ZMVY3",
};

// Initialize Firebase once (safe for hot reload/SSR)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Export commonly used SDK instances
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
export default app;
