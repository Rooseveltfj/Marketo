import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, getFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

import { Config } from '@/constants/config';

const firebaseConfig = {
  apiKey: Config.firebase.apiKey,
  authDomain: Config.firebase.authDomain,
  projectId: Config.firebase.projectId,
  storageBucket: Config.firebase.storageBucket,
  messagingSenderId: Config.firebase.messagingSenderId,
  appId: Config.firebase.appId,
  measurementId: Config.firebase.measurementId
};

import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize Firebase Modular
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const authModular = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore with experimentalForceLongPolling to prevent offline errors in mobile environments
const dbModular = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Initialize Firebase Compat
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Compat Firestore setup (linked to the same settings if possible, but compat uses different config)
firebase.firestore().settings({
  experimentalForceLongPolling: true,
});

// Named exports for Modular SDK
export { dbModular }; // Export the specifically initialized instance
export const storageModular = getStorage(app);

// Default exports as Compat
export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();

export default app;
