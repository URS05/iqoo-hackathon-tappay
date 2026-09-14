export type TagPayload = {
  uidHex: string;
  displayName?: string;
  ndefVersion?: number;
  hmac?: string;
  rawNdef?: string;
};

export type TapPayNfc = {
  kind: "mock" | "android";
  isAvailable(): Promise<boolean>;
  writeTag(displayName: string): Promise<TagPayload>;
  startReader(onTag: (tag: TagPayload) => void): Promise<void>;
  stopReader(): Promise<void>;
  simulateWrite(displayName: string): Promise<TagPayload>;
  simulateTap(uidHex?: string): Promise<TagPayload>;
};
