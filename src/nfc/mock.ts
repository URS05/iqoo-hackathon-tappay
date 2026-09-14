import * as Crypto from "expo-crypto";

import { hmacForTag } from "@/nfc/hmac";
import type { TagPayload, TapPayNfc } from "@/nfc/types";

const LAST_UID_KEY = "tappay.lastBoundUid";

type Listener = (tag: TagPayload) => void;

let reader: Listener | null = null;
let lastUid = "04DEADBEEF010203";

export function setMockLastUid(uidHex: string) {
  lastUid = uidHex.toUpperCase();
}

export function getMockLastUid() {
  return lastUid;
}

async function randomUid(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(7);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

async function finishWrite(displayName: string, uidHex: string): Promise<TagPayload> {
  const hmac = await hmacForTag(uidHex, displayName);
  lastUid = uidHex;
  const payload: TagPayload = {
    uidHex,
    displayName,
    ndefVersion: 1,
    hmac,
  };
  return payload;
}

export const mockNfc: TapPayNfc = {
  kind: "mock",
  async isAvailable() {
    return true;
  },
  async writeTag(displayName) {
    return this.simulateWrite(displayName);
  },
  async startReader(onTag) {
    reader = onTag;
  },
  async stopReader() {
    reader = null;
  },
  async simulateWrite(displayName) {
    const uidHex = await randomUid();
    return finishWrite(displayName, uidHex);
  },
  async simulateTap(uidHex) {
    const uid = (uidHex || lastUid).toUpperCase();
    lastUid = uid;
    const payload: TagPayload = { uidHex: uid, ndefVersion: 1 };
    reader?.(payload);
    return payload;
  },
};

export { LAST_UID_KEY };
