
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCThjETkAH8HpFoclhmXtgjm2lIr1506dg",
  authDomain: "orderflow-r7jsk.firebaseapp.com",
  projectId: "orderflow-r7jsk",
  storageBucket: "orderflow-r7jsk.firebasestorage.app",
  messagingSenderId: "954515661623",
  appId: "1:954515661623:web:19d89bf3722600e02ef0b2"
};

// Initialize Firebase using a singleton pattern
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;


export { app, auth, db, storage, messaging };
