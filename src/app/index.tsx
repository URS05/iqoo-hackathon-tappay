import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge, Button, Card, Field, Row } from "@/components/ui";
import { Colors, Spacing, withAlpha } from "@/constants/theme";
import type { Role } from "@/firebase/types";
import { getNfc } from "@/nfc";
import { useSession } from "@/session/SessionContext";

const ROLES: { id: Role; title: string; description: string; color: string }[] = [
  {
    id: "user",
    title: "User",
    description: "Bind tag, load rupees, watch balance",
    color: Colors.user,
  },
  {
    id: "merchant",
    title: "Merchant",
    description: "Amount keypad and tap to deduct",
    color: Colors.merchant,
  },
  {
    id: "admin",
    title: "Admin",
    description: "Freeze tags and replay ledger",
    color: Colors.admin,
  },
];

export default function RolePicker() {
  const router = useRouter();
  const session = useSession();
  const [name, setName] = useState(session.displayName);
  const [selected, setSelected] = useState<Role | null>(null);
  const nfc = getNfc();

  async function go(role: Role) {
    await session.setDisplayName(name.trim() || "Guest");
    await session.enterRole(role);
    router.push(`/${role}`);
  }

  const continueTone = selected ?? "accent";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.brand}>TapPay</Text>
        <Text style={styles.tagline}>Closed-loop NFC payments</Text>
        <Row style={styles.badges}>
          <Badge label={`Ledger: ${session.backend}`} tone="accent" />
          <Badge label={`NFC: ${nfc.kind}`} tone={nfc.kind === "mock" ? "warn" : "ok"} />
        </Row>
      </View>

      <Field
        value={name}
        onChangeText={setName}
        placeholder="Display name"
        autoCapitalize="words"
      />

      <View style={styles.cards}>
        {ROLES.map((role) => {
          const active = selected === role.id;
          return (
            <Card
              key={role.id}
              accessibilityLabel={role.title}
              onPress={() => setSelected(role.id)}
              style={[
                styles.roleCard,
                { borderLeftColor: role.color },
                active ? { backgroundColor: withAlpha(role.color, 0.08) } : null,
              ]}
            >
              <Text style={[styles.roleTitle, { color: role.color }]}>{role.title}</Text>
              <Text style={styles.roleDescription}>{role.description}</Text>
            </Card>
          );
        })}
      </View>

      <View style={styles.footer}>
        {!session.ready ? <Text style={styles.signingIn}>Signing in…</Text> : null}
        <Button
          label={selected ? `Continue as ${ROLES.find((r) => r.id === selected)?.title}` : "Select a role"}
          tone={continueTone}
          disabled={!selected || !session.ready}
          onPress={() => selected && go(selected)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  header: {
    gap: 6,
    marginBottom: Spacing.md,
  },
  brand: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: "700",
  },
  tagline: {
    color: Colors.muted,
    fontSize: 13,
  },
  badges: {
    marginTop: Spacing.sm,
    flexWrap: "wrap",
  },
  cards: {
    flex: 1,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  roleCard: {
    borderLeftWidth: 3,
    gap: 4,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  roleDescription: {
    color: Colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    gap: Spacing.sm,
    paddingTop: Spacing.md,
  },
  signingIn: {
    color: Colors.muted,
    fontSize: 13,
    textAlign: "center",
  },
});
