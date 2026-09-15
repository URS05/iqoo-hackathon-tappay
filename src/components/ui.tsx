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

import { Colors, Spacing } from "@/constants/theme";

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

export function Title({ children }: { children: string }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Sub({ children }: { children: string }) {
  return <Text style={styles.sub}>{children}</Text>;
}

export function Label({ children, color }: { children: string; color?: string }) {
  return <Text style={[styles.label, color ? { color } : null]}>{children}</Text>;
}

export function Button({
  label,
  tone = "accent",
  ...rest
}: PressableProps & { label: string; tone?: "accent" | "ok" | "warn" | "danger" | "ghost" | "merchant" }) {
  const bg =
    tone === "ghost"
      ? "transparent"
      : tone === "ok"
        ? Colors.ok
        : tone === "warn"
          ? Colors.warn
          : tone === "danger"
            ? Colors.danger
            : tone === "merchant"
              ? Colors.merchant
              : Colors.accent;
  const fg = tone === "ghost" ? Colors.text : "#0B0F14";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.btn, { backgroundColor: bg, opacity: pressed || rest.disabled ? 0.7 : 1 }]}
      {...rest}
    >
      <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={Colors.muted}
      style={styles.input}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderColor: Colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.md,
    gap: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
  sub: {
    color: Colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    color: Colors.text,
    fontSize: 15,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: {
    fontWeight: "700",
    fontSize: 16,
  },
  input: {
    backgroundColor: Colors.cardAlt,
    borderColor: Colors.line,
    borderWidth: 1,
    borderRadius: 12,
    color: Colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
});
