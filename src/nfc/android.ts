import { Platform } from "react-native";
import NfcManager, { Ndef, NfcAdapter, NfcEvents, NfcTech, type TagEvent } from "react-native-nfc-manager";

import { encodeNdefPayload, hmacForTag, parseNdefPayload } from "@/nfc/hmac";
import { mockNfc } from "@/nfc/mock";
import type { TagPayload, TapPayNfc } from "@/nfc/types";

function bytesToHex(id?: number[] | string): string {
  if (!id) {
    return "";
  }
  if (typeof id === "string") {
    return id.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
  }
  return id
    .map((b) => (b & 0xff).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function decodeNdefText(ndefMessage?: TagEvent["ndefMessage"]): string | undefined {
  if (!ndefMessage?.length) {
    return undefined;
  }
  try {
    const record = ndefMessage[0];
    if (!record?.payload) {
      return undefined;
    }
    return Ndef.text.decodePayload(Uint8Array.from(record.payload as number[]));
  } catch {
    return undefined;
  }
}

function tagToPayload(tag: TagEvent): TagPayload {
  const uidHex = bytesToHex(tag.id);
  const rawNdef = decodeNdefText(tag.ndefMessage);
  return { uidHex, rawNdef, ...parseNdefPayload(rawNdef) };
}

let started = false;

async function ensureStarted() {
  if (started) {
    return;
  }
  await NfcManager.start();
  started = true;
}

export const androidNfc: TapPayNfc = {
  kind: "android",
  async isAvailable() {
    if (Platform.OS !== "android") {
      return false;
    }
    try {
      await ensureStarted();
      const supported = await NfcManager.isSupported();
      if (!supported) {
        return false;
      }
      return NfcManager.isEnabled();
    } catch {
      return false;
    }
  },
  async writeTag(displayName) {
    await ensureStarted();
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      const uidHex = bytesToHex(tag?.id as number[] | string | undefined);
      if (!uidHex) {
        throw new Error("No tag UID");
      }
      const hmac = await hmacForTag(uidHex, displayName);
      const text = encodeNdefPayload({ uidHex, displayName, hmac });
      const bytes = Ndef.encodeMessage([Ndef.textRecord(text)]);
      if (!bytes) {
        throw new Error("Failed to encode NDEF");
      }
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      return { uidHex, displayName, ndefVersion: 1, hmac, rawNdef: text };
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch {
        // ignore
      }
    }
  },
  async startReader(onTag) {
    await ensureStarted();
    NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
      const payload = tagToPayload(tag);
      if (payload.uidHex) {
        onTag(payload);
      }
    });
    await NfcManager.registerTagEvent({
      alertMessage: "Hold the wristband to this phone",
      isReaderModeEnabled: true,
      readerModeFlags:
        NfcAdapter.FLAG_READER_NFC_A |
        NfcAdapter.FLAG_READER_NFC_B |
        NfcAdapter.FLAG_READER_NFC_F |
        NfcAdapter.FLAG_READER_NFC_V,
      readerModeDelay: 250,
    });
  },
  async stopReader() {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    try {
      await NfcManager.unregisterTagEvent();
    } catch {
      // ignore
    }
  },
  simulateWrite: mockNfc.simulateWrite,
  simulateTap: mockNfc.simulateTap,
};
