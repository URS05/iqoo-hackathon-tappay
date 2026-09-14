import * as Crypto from "expo-crypto";

const APP_ID = "tappay";
const SCHEMA_VERSION = 1;

function secret(): string {
  return process.env.EXPO_PUBLIC_TAG_HMAC_SECRET || "tappay-demo-hmac";
}

export async function hmacForTag(uidHex: string, displayName: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${uidHex.toUpperCase()}|${displayName}|${secret()}`,
  );
}

export function encodeNdefPayload(input: {
  uidHex: string;
  displayName: string;
  hmac: string;
}): string {
  return JSON.stringify({
    app: APP_ID,
    v: SCHEMA_VERSION,
    name: input.displayName,
    hmac: input.hmac,
  });
}

export function parseNdefPayload(text?: string): {
  displayName?: string;
  ndefVersion?: number;
  hmac?: string;
} {
  if (!text) {
    return {};
  }
  try {
    const parsed = JSON.parse(text) as {
      app?: string;
      v?: number;
      name?: string;
      hmac?: string;
    };
    if (parsed.app && parsed.app !== APP_ID) {
      return {};
    }
    return {
      displayName: parsed.name,
      ndefVersion: parsed.v,
      hmac: parsed.hmac,
    };
  } catch {
    return { displayName: text };
  }
}

export { APP_ID, SCHEMA_VERSION };
