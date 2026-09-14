import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, Field, Sub, Title } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import type { Role } from "@/firebase/types";
import { useSession } from "@/session/SessionContext";
import { getNfc } from "@/nfc";

export default function RolePicker() {
  const router = useRouter();
  const session = useSession();
  const [name, setName] = useState(session.displayName);
  const nfc = getNfc();

  async function go(role: Role) {
    await session.setDisplayName(name.trim() || "Guest");
    await session.enterRole(role);
    router.push(`/${role}`);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Title>TapPay</Title>
      <Sub>Closed-loop NFC tap-to-pay. The phone is the POS. The tag is only an ID.</Sub>

      <View style={styles.pills}>
        <Text style={styles.pill}>Ledger: {session.backend}</Text>
        <Text style={styles.pill}>NFC: {nfc.kind}</Text>
      </View>

      <Field
        value={name}
        onChangeText={setName}
        placeholder="Display name"
        autoCapitalize="words"
      />

      <Pressable accessibilityRole="button" accessibilityLabel="User" style={[styles.role, { borderColor: Colors.user }]} onPress={() => go("user")}>
        <Text style={styles.roleKicker}>User</Text>
        <Text style={styles.roleTitle}>Bind tag, load rupees, watch balance</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Merchant" style={[styles.role, { borderColor: Colors.merchant }]} onPress={() => go("merchant")}>
        <Text style={[styles.roleKicker, { color: Colors.merchant }]}>Merchant</Text>
        <Text style={styles.roleTitle}>Amount keypad + tap to deduct</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Admin" style={[styles.role, { borderColor: Colors.admin }]} onPress={() => go("admin")}>
        <Text style={[styles.roleKicker, { color: Colors.admin }]}>Admin</Text>
        <Text style={styles.roleTitle}>Freeze tags, replay ledger</Text>
      </Pressable>

      {!session.ready ? <Sub>Signing in…</Sub> : null}
      <Button label="Continue as user" onPress={() => go("user")} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  pills: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pill: {
    color: Colors.muted,
    borderColor: Colors.line,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
  },
  role: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    backgroundColor: Colors.card,
    gap: 4,
  },
  roleKicker: {
    color: Colors.user,
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 1,
  },
  roleTitle: { color: Colors.text, fontSize: 16 },
});
