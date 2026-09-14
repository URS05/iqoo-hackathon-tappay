import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";

import type { DeductResult, TagDoc, TxnDoc, WalletDoc } from "@/firebase/types";

type Unsub = () => void;

function tagRef(db: Firestore, uid: string) {
  return doc(db, "tags", uid);
}
function walletRef(db: Firestore, uid: string) {
  return doc(db, "wallets", uid);
}

export function firestoreLedger(db: Firestore) {
  return {
    async bindTag(input: {
      uidHex: string;
      userId: string;
      displayName: string;
      hmac: string;
    }): Promise<{ tag: TagDoc; wallet: WalletDoc }> {
      const uid = input.uidHex.toUpperCase();
      const tag: TagDoc = {
        userId: input.userId,
        status: "active",
        ndefVersion: 1,
        hmac: input.hmac,
        createdAt: Date.now(),
        displayName: input.displayName,
      };
      const existingTag = await getDoc(tagRef(db, uid));
      if (existingTag.exists()) {
        const prev = existingTag.data() as TagDoc;
        tag.status = prev.status;
        tag.createdAt = prev.createdAt;
        tag.userId = prev.userId;
      }
      const existingWallet = await getDoc(walletRef(db, uid));
      const wallet: WalletDoc = existingWallet.exists()
        ? (existingWallet.data() as WalletDoc)
        : { balancePaise: 0, updatedAt: Date.now(), lastMerchantId: null };

      await setDoc(tagRef(db, uid), tag, { merge: true });
      if (!existingWallet.exists()) {
        await setDoc(walletRef(db, uid), wallet);
      }
      return { tag, wallet };
    },

    async loadMoney(uidHex: string, amountPaise: number): Promise<TxnDoc> {
      const uid = uidHex.toUpperCase();
      return runTransaction(db, async (tx) => {
        const tSnap = await tx.get(tagRef(db, uid));
        const wSnap = await tx.get(walletRef(db, uid));
        if (!tSnap.exists() || !wSnap.exists()) {
          throw new Error("Wallet not found. Bind a tag first.");
        }
        const tag = tSnap.data() as TagDoc;
        if (tag.status === "frozen") {
          throw new Error("Tag is frozen.");
        }
        const wallet = wSnap.data() as WalletDoc;
        const next = wallet.balancePaise + amountPaise;
        tx.update(walletRef(db, uid), { balancePaise: next, updatedAt: Date.now() });
        const txnRef = doc(collection(db, "txns"));
        const txn: TxnDoc = {
          id: txnRef.id,
          uid,
          merchantId: null,
          amountPaise,
          type: "load",
          status: "ok",
          fraudScore: 0,
          createdAt: Date.now(),
        };
        tx.set(txnRef, txn);
        return txn;
      });
    },

    async deduct(input: {
      uidHex: string;
      amountPaise: number;
      merchantId: string;
      fraudScore: number;
    }): Promise<DeductResult> {
      const uid = input.uidHex.toUpperCase();
      try {
        return await runTransaction(db, async (tx) => {
          const tSnap = await tx.get(tagRef(db, uid));
          const wSnap = await tx.get(walletRef(db, uid));
          const txnRef = doc(collection(db, "txns"));
          if (!tSnap.exists() || !wSnap.exists()) {
            return { ok: false, reason: "missing", message: "Unknown tag. Bind it first." };
          }
          const tag = tSnap.data() as TagDoc;
          const wallet = wSnap.data() as WalletDoc;
          if (tag.status === "frozen") {
            const txn: TxnDoc = {
              id: txnRef.id,
              uid,
              merchantId: input.merchantId,
              amountPaise: input.amountPaise,
              type: "pay",
              status: "frozen",
              fraudScore: input.fraudScore,
              createdAt: Date.now(),
            };
            tx.set(txnRef, txn);
            return { ok: false, reason: "frozen", message: "This tag is frozen." };
          }
          if (wallet.balancePaise < input.amountPaise) {
            const txn: TxnDoc = {
              id: txnRef.id,
              uid,
              merchantId: input.merchantId,
              amountPaise: input.amountPaise,
              type: "pay",
              status: "insufficient",
              fraudScore: input.fraudScore,
              createdAt: Date.now(),
            };
            tx.set(txnRef, txn);
            return { ok: false, reason: "insufficient", message: "Insufficient funds." };
          }
          const next = wallet.balancePaise - input.amountPaise;
          tx.update(walletRef(db, uid), {
            balancePaise: next,
            updatedAt: Date.now(),
            lastMerchantId: input.merchantId,
          });
          const txn: TxnDoc = {
            id: txnRef.id,
            uid,
            merchantId: input.merchantId,
            amountPaise: input.amountPaise,
            type: "pay",
            status: "ok",
            fraudScore: input.fraudScore,
            createdAt: Date.now(),
          };
          tx.set(txnRef, txn);
          return { ok: true, txn, balancePaise: next };
        });
      } catch (err) {
        return {
          ok: false,
          reason: "error",
          message: err instanceof Error ? err.message : "Deduct failed",
        };
      }
    },

    async freezeTag(uidHex: string, frozen: boolean) {
      await updateDoc(tagRef(db, uidHex.toUpperCase()), {
        status: frozen ? "frozen" : "active",
      });
    },

    async listTags(): Promise<{ uid: string; tag: TagDoc; wallet?: WalletDoc }[]> {
      const { getDocs } = await import("firebase/firestore");
      const snap = await getDocs(collection(db, "tags"));
      const rows: { uid: string; tag: TagDoc; wallet?: WalletDoc }[] = [];
      for (const d of snap.docs) {
        const w = await getDoc(walletRef(db, d.id));
        rows.push({
          uid: d.id,
          tag: d.data() as TagDoc,
          wallet: w.exists() ? (w.data() as WalletDoc) : undefined,
        });
      }
      return rows;
    },

    subscribeWallet(uidHex: string, cb: (wallet: WalletDoc | null) => void): Unsub {
      return onSnapshot(walletRef(db, uidHex.toUpperCase()), (snap) => {
        cb(snap.exists() ? (snap.data() as WalletDoc) : null);
      });
    },

    subscribeTxns(cb: (txns: TxnDoc[]) => void): Unsub {
      return onSnapshot(collection(db, "txns"), (snap) => {
        const txns = snap.docs.map((d) => ({ ...(d.data() as TxnDoc), id: d.id }));
        txns.sort((a, b) => b.createdAt - a.createdAt);
        cb(txns);
      });
    },
  };
}
