import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

// Firebase Analytics attempts a dynamic config fetch that can 400 in local/dev setups.
// Avoid initializing analytics on localhost/dev to prevent noisy console logs.
export const firebaseAnalytics =
  typeof window !== "undefined" &&
  import.meta.env.PROD &&
  !!firebaseConfig.measurementId &&
  !window.location.hostname.includes("localhost") &&
  !window.location.hostname.includes("127.0.0.1")
    ? (await import("firebase/analytics")).getAnalytics(firebaseApp)
    : null;
