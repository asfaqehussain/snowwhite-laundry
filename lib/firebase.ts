import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const auth = getAuth(app); // Disabled for custom auth

// Initialize Firestore with settings to avoid "offline" issues
let db: Firestore;
try {
    db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
    });
} catch (error) {
    // If already initialized, use existing instance
    db = getFirestore(app);
}

// Debug logging
if (typeof window !== "undefined") {
    console.log("Firebase initialized. Project:", firebaseConfig.projectId);
}

export { app, /* auth, */ db };
