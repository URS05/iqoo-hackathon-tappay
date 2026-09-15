import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

export type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

function env(key: string): string {
  return (process.env[key] ?? "").trim();
}

export function isFirebaseConfigured(): boolean {
  return Boolean(env("EXPO_PUBLIC_FIREBASE_API_KEY") && env("EXPO_PUBLIC_FIREBASE_PROJECT_ID"));
}

let cached: FirebaseServices | null | undefined;

export function getFirebase(): FirebaseServices | null {
  if (cached !== undefined) {
    return cached;
  }
  if (!isFirebaseConfigured()) {
    cached = null;
    return null;
  }

  const config = {
    apiKey: env("EXPO_PUBLIC_FIREBASE_API_KEY"),
    authDomain: env("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: env("EXPO_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: env("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: env("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: env("EXPO_PUBLIC_FIREBASE_APP_ID"),
  };

  const app = getApps()[0] ?? initializeApp(config);
  const auth: Auth = getAuth(app);
  cached = { app, auth, db: getFirestore(app) };
  return cached;
}
