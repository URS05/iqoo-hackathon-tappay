export type Role = "user" | "merchant" | "admin";
export type TagStatus = "active" | "frozen";
export type TxnType = "load" | "pay" | "refund";
export type TxnStatus = "ok" | "insufficient" | "frozen" | "error";

export type TagDoc = {
  userId: string;
  status: TagStatus;
  ndefVersion: number;
  hmac: string;
  createdAt: number;
  displayName: string;
};

export type WalletDoc = {
  balancePaise: number;
  updatedAt: number;
  lastMerchantId: string | null;
};

export type TxnDoc = {
  id: string;
  uid: string;
  merchantId: string | null;
  amountPaise: number;
  type: TxnType;
  status: TxnStatus;
  fraudScore: number;
  createdAt: number;
};

export type UserDoc = {
  displayName: string;
  tagUids: string[];
};

export type MerchantDoc = {
  name: string;
  stall: string;
  deviceId: string;
};

export type DeductResult =
  | { ok: true; txn: TxnDoc; balancePaise: number }
  | { ok: false; reason: "insufficient" | "frozen" | "missing" | "error"; message: string };
