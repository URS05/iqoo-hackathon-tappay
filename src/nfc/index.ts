import { Platform } from "react-native";

import { androidNfc } from "@/nfc/android";
import { mockNfc } from "@/nfc/mock";
import type { TapPayNfc } from "@/nfc/types";

function forceMock(): boolean {
  return process.env.EXPO_PUBLIC_FORCE_MOCK_NFC === "1";
}

export function getNfc(): TapPayNfc {
  if (forceMock() || Platform.OS !== "android") {
    return mockNfc;
  }
  return androidNfc;
}

export { mockNfc };
export type { TagPayload, TapPayNfc } from "@/nfc/types";
