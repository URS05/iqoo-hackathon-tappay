import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getFirebase, isFirebaseConfigured } from "@/firebase/config";
import type { Role } from "@/firebase/types";

const LOCAL_ID_KEY = "tappay.finflow.localUserId";
const NAME_KEY = "tappay.finflow.displayName";
const LAST_TAG_KEY = "tappay.finflow.lastBoundUid";

type Session = {
  ready: boolean;
  role: Role | null;
  userId: string;
  displayName: string;
  merchantId: string;
  lastTagUid: string | null;
  backend: "local" | "firestore";
  nfcMocked: boolean;
  setDisplayName: (name: string) => Promise<void>;
  setLastTagUid: (uid: string) => Promise<void>;
  enterRole: (role: Role) => Promise<void>;
  leaveRole: () => void;
};

const SessionContext = createContext<Session | null>(null);

async function ensureLocalUserId() {
  const existing = await AsyncStorage.getItem(LOCAL_ID_KEY);
  if (existing) {
    return existing;
  }
  const id = `local_${Date.now().toString(16)}`;
  await AsyncStorage.setItem(LOCAL_ID_KEY, id);
  return id;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [userId, setUserId] = useState("");
  const [displayName, setDisplayNameState] = useState("Guest");
  const [lastTagUid, setLastTagUidState] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const [name, tag] = await Promise.all([
          AsyncStorage.getItem(NAME_KEY),
          AsyncStorage.getItem(LAST_TAG_KEY),
        ]);
        if (name) {
          setDisplayNameState(name);
        }
        if (tag) {
          setLastTagUidState(tag);
        }

        const fb = getFirebase();
        if (!fb) {
          setUserId(await ensureLocalUserId());
          setReady(true);
          return;
        }
        unsub = onAuthStateChanged(fb.auth, async (user) => {
          if (user) {
            setUserId(user.uid);
            setReady(true);
            return;
          }
          await signInAnonymously(fb.auth);
        });
      } catch {
        setUserId(await ensureLocalUserId());
        setReady(true);
      }
    })();
    return () => unsub?.();
  }, []);

  const value = useMemo<Session>(
    () => ({
      ready,
      role,
      userId,
      displayName,
      merchantId: userId || "stall-01",
      lastTagUid,
      backend: isFirebaseConfigured() ? "firestore" : "local",
      nfcMocked: process.env.EXPO_PUBLIC_FORCE_MOCK_NFC === "1",
      setDisplayName: async (name: string) => {
        setDisplayNameState(name);
        await AsyncStorage.setItem(NAME_KEY, name);
      },
      setLastTagUid: async (uid: string) => {
        const next = uid.toUpperCase();
        setLastTagUidState(next);
        await AsyncStorage.setItem(LAST_TAG_KEY, next);
      },
      enterRole: async (nextRole) => {
        const fb = getFirebase();
        if (fb && userId) {
          if (nextRole === "user") {
            await setDoc(
              doc(fb.db, "users", userId),
              { displayName, tagUids: lastTagUid ? [lastTagUid] : [] },
              { merge: true },
            );
          }
          if (nextRole === "merchant") {
            await setDoc(
              doc(fb.db, "merchants", userId),
              { name: displayName, stall: "Stall 01", deviceId: userId },
              { merge: true },
            );
          }
          if (nextRole === "admin") {
            await setDoc(doc(fb.db, "admins", userId), { name: displayName }, { merge: true });
          }
        }
        setRole(nextRole);
      },
      leaveRole: () => setRole(null),
    }),
    [ready, role, userId, displayName, lastTagUid],
  );

  return createElement(SessionContext.Provider, { value }, children);
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return ctx;
}
