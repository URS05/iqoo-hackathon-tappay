import AsyncStorage from "@react-native-async-storage/async-storage";

import type { DeductResult, TagDoc, TxnDoc, WalletDoc } from "@/firebase/types";

const STORAGE_KEY = "tappay.finflow.ledger.v1";

type LedgerState = {
  tags: Record<string, TagDoc>;
  wallets: Record<string, WalletDoc>;
  txns: TxnDoc[];
};

type Unsub = () => void;

let state: LedgerState = { tags: {}, wallets: {}, txns: [] };
let loaded = false;
let loading: Promise<void> | null = null;
let lock: Promise<void> = Promise.resolve();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

async function load() {
  if (loaded) {
    return;
  }
  if (!loading) {
    loading = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          state = JSON.parse(raw) as LedgerState;
          state.tags ??= {};
          state.wallets ??= {};
          state.txns ??= [];
        }
      } catch {
        state = { tags: {}, wallets: {}, txns: [] };
      } finally {
        loaded = true;
      }
    })();
  }
  await loading;
}

async function persist() {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  emit();
}

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function newTxnId() {
  return `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export const localLedger = {
  async bindTag(input: {
    uidHex: string;
    userId: string;
    displayName: string;
    hmac: string;
  }): Promise<{ tag: TagDoc; wallet: WalletDoc }> {
    return withLock(async () => {
      await load();
      const uid = input.uidHex.toUpperCase();
      const existing = state.tags[uid];
      const tag: TagDoc = {
        userId: input.userId,
        status: existing?.status ?? "active",
        ndefVersion: 1,
        hmac: input.hmac,
        createdAt: existing?.createdAt ?? Date.now(),
        displayName: input.displayName,
      };
      const wallet: WalletDoc = state.wallets[uid] ?? {
        balancePaise: 0,
        updatedAt: Date.now(),
        lastMerchantId: null,
      };
      state.tags[uid] = tag;
      state.wallets[uid] = wallet;
      await persist();
      return { tag, wallet };
    });
  },

  async loadMoney(uidHex: string, amountPaise: number): Promise<TxnDoc> {
    return withLock(async () => {
      await load();
      const uid = uidHex.toUpperCase();
      const wallet = state.wallets[uid];
      if (!wallet) {
        throw new Error("Wallet not found. Bind a tag first.");
      }
      if (state.tags[uid]?.status === "frozen") {
        throw new Error("Tag is frozen.");
      }
      wallet.balancePaise += amountPaise;
      wallet.updatedAt = Date.now();
      const txn: TxnDoc = {
        id: newTxnId(),
        uid,
        merchantId: null,
        amountPaise,
        type: "load",
        status: "ok",
        fraudScore: 0,
        createdAt: Date.now(),
      };
      state.txns.unshift(txn);
      await persist();
      return txn;
    });
  },

  async deduct(input: {
    uidHex: string;
    amountPaise: number;
    merchantId: string;
    fraudScore: number;
  }): Promise<DeductResult> {
    return withLock(async () => {
      await load();
      const uid = input.uidHex.toUpperCase();
      const tag = state.tags[uid];
      const wallet = state.wallets[uid];
      if (!tag || !wallet) {
        return { ok: false, reason: "missing", message: "Unknown tag. Bind it first." };
      }
      if (tag.status === "frozen") {
        const txn: TxnDoc = {
          id: newTxnId(),
          uid,
          merchantId: input.merchantId,
          amountPaise: input.amountPaise,
          type: "pay",
          status: "frozen",
          fraudScore: input.fraudScore,
          createdAt: Date.now(),
        };
        state.txns.unshift(txn);
        await persist();
        return { ok: false, reason: "frozen", message: "This tag is frozen." };
      }
      if (wallet.balancePaise < input.amountPaise) {
        const txn: TxnDoc = {
          id: newTxnId(),
          uid,
          merchantId: input.merchantId,
          amountPaise: input.amountPaise,
          type: "pay",
          status: "insufficient",
          fraudScore: input.fraudScore,
          createdAt: Date.now(),
        };
        state.txns.unshift(txn);
        await persist();
        return { ok: false, reason: "insufficient", message: "Insufficient funds." };
      }
      wallet.balancePaise -= input.amountPaise;
      wallet.updatedAt = Date.now();
      wallet.lastMerchantId = input.merchantId;
      const txn: TxnDoc = {
        id: newTxnId(),
        uid,
        merchantId: input.merchantId,
        amountPaise: input.amountPaise,
        type: "pay",
        status: "ok",
        fraudScore: input.fraudScore,
        createdAt: Date.now(),
      };
      state.txns.unshift(txn);
      await persist();
      return { ok: true, txn, balancePaise: wallet.balancePaise };
    });
  },

  async freezeTag(uidHex: string, frozen: boolean) {
    return withLock(async () => {
      await load();
      const uid = uidHex.toUpperCase();
      const tag = state.tags[uid];
      if (!tag) {
        throw new Error("Tag not found");
      }
      tag.status = frozen ? "frozen" : "active";
      await persist();
    });
  },

  async listTags(): Promise<{ uid: string; tag: TagDoc; wallet?: WalletDoc }[]> {
    await load();
    return Object.entries(state.tags).map(([uid, tag]) => ({
      uid,
      tag,
      wallet: state.wallets[uid],
    }));
  },

  subscribeWallet(uidHex: string, cb: (wallet: WalletDoc | null) => void): Unsub {
    const uid = uidHex.toUpperCase();
    const notify = () => cb(state.wallets[uid] ?? null);
    void load().then(notify);
    listeners.add(notify);
    return () => listeners.delete(notify);
  },

  subscribeTxns(cb: (txns: TxnDoc[]) => void): Unsub {
    const notify = () => cb([...state.txns].sort((a, b) => b.createdAt - a.createdAt));
    void load().then(notify);
    listeners.add(notify);
    return () => listeners.delete(notify);
  },
};
