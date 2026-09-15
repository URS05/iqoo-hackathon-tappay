import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, Field } from "@/components/ui";
import { Colors, Radius } from "@/constants/theme";
import { getNfc } from "@/nfc";
import { useSession } from "@/session/SessionContext";
import type { Role } from "@/firebase/types";

export default function ProfileScreen() {
  const router = useRouter();
  const session = useSession();
  const nfc = getNfc();
  const [name, setName] = useState(session.displayName);

  async function go(role: Role) {
    await session.setDisplayName(name.trim() || "Guest");
    await session.enterRole(role);
    if (role === "user") {
      router.push("/(app)/cards");
      return;
    }
    router.push(`/${role}`);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>PROFILE</Text>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(name || "G").slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{name || "Guest"}</Text>
            <Text style={styles.sub}>TapPay member · FinFlow UI</Text>
          </View>
        </View>

        <Field value={name} onChangeText={setName} placeholder="Display name" autoCapitalize="words" />
        <Button label="Save name" tone="forest" onPress={() => void session.setDisplayName(name.trim() || "Guest")} />

        <View style={styles.pills}>
          <Text style={styles.pill}>Ledger {session.backend}</Text>
          <Text style={styles.pill}>NFC {nfc.kind}</Text>
        </View>

        <Text style={styles.section}>Switch role</Text>
        <RoleRow title="User wallet" body="Bind tag, load rupees, send" onPress={() => void go("user")} />
        <RoleRow title="Merchant POS" body="Keypad + tap to deduct" onPress={() => void go("merchant")} />
        <RoleRow title="Admin" body="Freeze tags, replay ledger" onPress={() => void go("admin")} />
      </ScrollView>
    </SafeAreaView>
  );
}

function RoleRow({ title, body, onPress }: { title: string; body: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={styles.role}>
      <View>
        <Text style={styles.roleTitle}>{title}</Text>
        <Text style={styles.sub}>{body}</Text>
      </View>
      <Text style={styles.chev}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  scroll: { padding: 20, gap: 12, paddingBottom: 36 },
  kicker: { color: Colors.forestSoft, fontWeight: "800", letterSpacing: 2, fontSize: 12 },
  hero: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 4 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: Colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: Colors.lime, fontSize: 28, fontWeight: "800" },
  title: { fontSize: 24, fontWeight: "800", color: Colors.ink },
  sub: { color: Colors.muted },
  pills: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pill: {
    color: Colors.forest,
    borderColor: Colors.line,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: Colors.paper,
  },
  section: { fontSize: 18, fontWeight: "800", color: Colors.ink, marginTop: 8 },
  role: {
    backgroundColor: Colors.paper,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roleTitle: { fontWeight: "800", color: Colors.ink, fontSize: 16, marginBottom: 2 },
  chev: { color: Colors.forest, fontSize: 20, fontWeight: "700" },
});
