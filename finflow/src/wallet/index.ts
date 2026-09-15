import { getFirebase, isFirebaseConfigured } from "@/firebase/config";
import type { DeductResult, TagDoc, TxnDoc, WalletDoc } from "@/firebase/types";
import { firestoreLedger } from "@/wallet/firestoreLedger";
import { localLedger } from "@/wallet/localLedger";

export type LedgerBackend = "local" | "firestore";

export type Ledger = {
  backend: LedgerBackend;
  bindTag(input: {
    uidHex: string;
    userId: string;
    displayName: string;
    hmac: string;
  }): Promise<{ tag: TagDoc; wallet: WalletDoc }>;
  loadMoney(uidHex: string, amountPaise: number): Promise<TxnDoc>;
  deduct(input: {
    uidHex: string;
    amountPaise: number;
    merchantId: string;
    fraudScore: number;
  }): Promise<DeductResult>;
  freezeTag(uidHex: string, frozen: boolean): Promise<void>;
  listTags(): Promise<{ uid: string; tag: TagDoc; wallet?: WalletDoc }[]>;
  subscribeWallet(uidHex: string, cb: (wallet: WalletDoc | null) => void): () => void;
  subscribeTxns(cb: (txns: TxnDoc[]) => void): () => void;
};

let cachedLedger: Ledger | null = null;

function localFacade(): Ledger {
  return {
    backend: "local",
    bindTag: (input) => localLedger.bindTag(input),
    loadMoney: (uid, amount) => localLedger.loadMoney(uid, amount),
    deduct: (input) => localLedger.deduct(input),
    freezeTag: (uid, frozen) => localLedger.freezeTag(uid, frozen),
    listTags: () => localLedger.listTags(),
    subscribeWallet: (uid, cb) => localLedger.subscribeWallet(uid, cb),
    subscribeTxns: (cb) => localLedger.subscribeTxns(cb),
  };
}

export function getLedger(): Ledger {
  if (cachedLedger) {
    return cachedLedger;
  }
  const fb = getFirebase();
  cachedLedger = fb ? { backend: "firestore", ...firestoreLedger(fb.db) } : localFacade();
  return cachedLedger;
}

export function rupeesToPaise(rupees: number) {
  return Math.round(rupees * 100);
}

export function formatInr(paise: number) {
  const rupees = paise / 100;
  return `₹${rupees.toFixed(2)}`;
}

export { isFirebaseConfigured };
