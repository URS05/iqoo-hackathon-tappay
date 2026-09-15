import * as Haptics from "expo-haptics";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, Field } from "@/components/ui";
import { VisaCard } from "@/components/VisaCard";
import { Colors, Radius } from "@/constants/theme";
import { hmacForTag } from "@/nfc/hmac";
import { getNfc } from "@/nfc";
import { useSession } from "@/session/SessionContext";
import { formatInr, getLedger, rupeesToPaise } from "@/wallet";
import { useWalletLive } from "@/hooks/useWalletLive";

export default function CardsScreen() {
  const session = useSession();
  const ledger = getLedger();
  const nfc = getNfc();
  const { uid, wallet, displayName } = useWalletLive();
  const [busy, setBusy] = useState(false);
  const [custom, setCustom] = useState("500");
  const [upiOpen, setUpiOpen] = useState(false);
  const [status, setStatus] = useState("Bind a wristband. Rupees never live on the tag.");
  const last4 = (uid ?? "0000").replace(/[^A-Z0-9]/g, "").slice(-4) || "0000";

  async function bind(simulate: boolean) {
    setBusy(true);
    setStatus(simulate ? "Simulating bind…" : "Hold the NTAG to this phone…");
    try {
      const tag = simulate ? await nfc.simulateWrite(session.displayName) : await nfc.writeTag(session.displayName);
      const hmac = tag.hmac ?? (await hmacForTag(tag.uidHex, session.displayName));
      await ledger.bindTag({
        uidHex: tag.uidHex,
        userId: session.userId || "local-user",
        displayName: session.displayName,
        hmac,
      });
      await session.setLastTagUid(tag.uidHex);
      setStatus(`Card bound · ${tag.uidHex}`);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Bind failed");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBusy(false);
    }
  }

  async function load(rupees: number) {
    if (!uid) {
      Alert.alert("Bind a card first");
      return;
    }
    setUpiOpen(true);
    await new Promise((r) => setTimeout(r, 700));
    try {
      await ledger.loadMoney(uid, rupeesToPaise(rupees));
      setStatus(`Loaded ${formatInr(rupeesToPaise(rupees))}. Tag was not rewritten.`);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Load failed");
    } finally {
      setUpiOpen(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>CARDS</Text>
        <Text style={styles.title}>Manage cards</Text>
        <Text style={styles.sub}>{status}</Text>

        <VisaCard holder={displayName || "Guest"} last4={last4} compact />

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statK}>Balance</Text>
            <Text style={styles.statV}>{formatInr(wallet?.balancePaise ?? 0)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statK}>Tag</Text>
            <Text style={styles.statV}>{uid ? uid.slice(0, 8) : "Unbound"}</Text>
          </View>
        </View>

        <Button label="Hold tag to bind (NFC)" tone="forest" onPress={() => void bind(false)} disabled={busy} />
        <Button label="Simulate bind" tone="ghost" onPress={() => void bind(true)} disabled={busy} />

        <Text style={styles.section}>Mock UPI top-up</Text>
        <View style={styles.row}>
          <Pressable accessibilityRole="button" style={styles.chip} accessibilityLabel="Load 100 rupees" onPress={() => void load(100)}>
            <Text style={styles.chipText}>₹100</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.chip} accessibilityLabel="Load 500 rupees" onPress={() => void load(500)}>
            <Text style={styles.chipText}>₹500</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.chip} accessibilityLabel="Load 1000 rupees" onPress={() => void load(1000)}>
            <Text style={styles.chipText}>₹1000</Text>
          </Pressable>
        </View>
        <Field value={custom} onChangeText={setCustom} keyboardType="numeric" placeholder="Custom rupees" />
        <Button label={`Load ₹${custom || "0"}`} onPress={() => void load(Number(custom) || 0)} disabled={upiOpen} />
        {upiOpen ? (
          <View style={styles.upi}>
            <ActivityIndicator color={Colors.forest} />
            <Text style={styles.sub}>UPI success (demo)</Text>
          </View>
        ) : null}

        <View style={styles.note}>
          <Text style={styles.noteTitle}>Campus Flex</Text>
          <Text style={styles.sub}>Second decorative card in the home carousel. Live spend always hits the bound NFC card.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  scroll: { padding: 20, gap: 12, paddingBottom: 36 },
  kicker: { color: Colors.forestSoft, fontWeight: "800", letterSpacing: 2, fontSize: 12 },
  title: { fontSize: 30, fontWeight: "800", color: Colors.ink, letterSpacing: -0.8 },
  sub: { color: Colors.muted, lineHeight: 20 },
  stats: { flexDirection: "row", gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: Colors.paper,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  statK: { color: Colors.muted, fontSize: 12, fontWeight: "700" },
  statV: { color: Colors.ink, fontSize: 18, fontWeight: "800", marginTop: 4 },
  section: { fontSize: 16, fontWeight: "800", color: Colors.ink, marginTop: 8 },
  row: { flexDirection: "row", gap: 8 },
  chip: {
    backgroundColor: Colors.forest,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  chipText: { color: Colors.lime, fontWeight: "800" },
  upi: { flexDirection: "row", alignItems: "center", gap: 8 },
  note: {
    backgroundColor: Colors.paper,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    gap: 6,
  },
  noteTitle: { fontWeight: "800", color: Colors.ink },
});
