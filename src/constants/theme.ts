export const Colors = {
  bg: "#0B0F14",
  card: "#151B22",
  cardAlt: "#1C242D",
  line: "#2A3440",
  text: "#F4F7FA",
  muted: "#8B97A4",
  accent: "#5CE1E6",
  ok: "#3DFF9A",
  warn: "#FFB020",
  danger: "#FF4D6A",
  merchant: "#FF7A3D",
  user: "#6EA8FF",
  admin: "#C792EA",
} as const;

export const Spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export type ToneColor =
  | "accent"
  | "ok"
  | "warn"
  | "danger"
  | "muted"
  | "merchant"
  | "user"
  | "admin";

export function toneColor(tone: ToneColor): string {
  return Colors[tone];
}

/** Hex color with alpha channel for borders and tinted surfaces. */
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
