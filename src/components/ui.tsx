import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
  type ViewProps,
} from "react-native";

import { Colors, Radius, Spacing } from "@/constants/theme";

export function Screen({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.screen, style]} {...rest}>
      {children}
    </View>
  );
}

export function Card({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Sub({ children }: { children: ReactNode }) {
  return <Text style={styles.sub}>{children}</Text>;
}

export function Label({ children, color }: { children: ReactNode; color?: string }) {
  return <Text style={[styles.label, color ? { color } : null]}>{children}</Text>;
}

export function Button({
  label,
  tone = "lime",
  ...rest
}: PressableProps & {
  label: string;
  tone?: "lime" | "forest" | "ghost" | "danger" | "ok" | "warn" | "accent" | "merchant";
}) {
  const map = toneMap(tone);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: map.bg, borderColor: map.border, borderWidth: map.border === "transparent" ? 0 : 1 },
        { opacity: pressed || rest.disabled ? 0.7 : 1 },
      ]}
      {...rest}
    >
      <Text style={[styles.btnText, { color: map.fg }]}>{label}</Text>
    </Pressable>
  );
}

function toneMap(tone: string) {
  switch (tone) {
    case "forest":
    case "merchant":
    case "accent":
      return { bg: Colors.forest, fg: Colors.lime, border: "transparent" };
    case "ghost":
      return { bg: "transparent", fg: Colors.ink, border: Colors.line };
    case "danger":
      return { bg: Colors.danger, fg: Colors.white, border: "transparent" };
    case "ok":
      return { bg: Colors.lime, fg: Colors.forestDeep, border: "transparent" };
    case "warn":
      return { bg: Colors.warn, fg: Colors.forestDeep, border: "transparent" };
    default:
      return { bg: Colors.lime, fg: Colors.forestDeep, border: "transparent" };
  }
}

export function Field(props: TextInputProps) {
  return <TextInput placeholderTextColor={Colors.mutedSoft} style={styles.input} {...props} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.paper,
    borderColor: Colors.line,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 8,
  },
  title: {
    color: Colors.ink,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  sub: {
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    color: Colors.ink,
    fontSize: 15,
    fontWeight: "600",
  },
  btn: {
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: {
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: Colors.paper,
    borderColor: Colors.line,
    borderWidth: 1,
    borderRadius: Radius.md,
    color: Colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
});
