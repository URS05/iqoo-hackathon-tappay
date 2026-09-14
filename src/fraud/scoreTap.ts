export type TapFeatures = {
  amountPaise: number;
  minutesSinceLast: number;
  tapsLast2Min: number;
  hourOfDay: number;
  sameMerchantRepeat: number;
  balanceRatio: number;
};

/** CPU stub. Real tabular scorer / NPU comes later. */
export function scoreTap(_features?: Partial<TapFeatures>): number {
  return 0;
}
