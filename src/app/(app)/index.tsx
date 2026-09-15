import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TxnRow } from "@/components/TxnRow";
import { VisaCard } from "@/components/VisaCard";
import { WeeklyChart } from "@/components/WeeklyChart";
import { Button, Field } from "@/components/ui";
import { Colors, Radius } from "@/constants/theme";
import { CONTACTS } from "@/data/contacts";
import { scoreTap } from "@/fraud/scoreTap";
import { useWalletLive } from "@/hooks/useWalletLive";
import { formatInr, getLedger, rupeesToPaise } from "@/wallet";

export default function HomeScreen() {
  const router = useRouter();
  const { uid, wallet, txns, weekly, displayName } = useWalletLive();
  const [sendTo, setSendTo] = useState<string | null>(null);
  const [amount, setAmount] = useState("80");
  const [status, setStatus] = useState("");
  const last4 = (uid ?? "4821").replace(/[^A-Z0-9]/g, "").slice(-4) || "4821";
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  async function send(name: string) {
    if (!uid) {
      Alert.alert("Bind a card first", "Open Cards and simulate bind, then send.");
      return;
    }
    const paise = rupeesToPaise(Number(amount) || 0);
    const result = await getLedger().deduct({
      uidHex: uid,
      amountPaise: paise,
      merchantId: name,
      fraudScore: scoreTap({ amountPaise: paise }),
    });
    if (result.ok) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatus(`Sent ${formatInr(paise)} to ${name}`);
      setSendTo(null);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStatus(result.message);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>{hello}</Text>
            <Text style={styles.name}>{displayName || "Guest"} 👋</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Notifications" style={styles.bell}>
            <Ionicons name="notifications-outline" size={20} color={Colors.forest} />
          </Pressable>
        </View>

        <Text style={styles.balanceLabel}>Available balance</Text>
        <Text style={styles.balance}>{formatInr(wallet?.balancePaise ?? 0)}</Text>
        {status ? <Text style={styles.status}>{status}</Text> : null}

        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
          <VisaCard holder={displayName || "Guest"} last4={last4} />
          <VisaCard holder={displayName || "Guest"} last4="9001" label="Campus Flex" valid="12/28" />
        </ScrollView>

        <View style={styles.rowHead}>
          <Text style={styles.section}>Quick send</Text>
          <Text style={styles.link}>Contacts</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contacts}>
          {CONTACTS.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={c.name}
              onPress={() => setSendTo(c.name)}
              style={styles.contact}
            >
              <View style={[styles.avatar, { backgroundColor: c.color }]}>
                <Text style={styles.initials}>{c.initials}</Text>
              </View>
              <Text style={styles.contactName}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {sendTo ? (
          <View style={styles.sendSheet}>
            <Text style={styles.section}>Send to {sendTo}</Text>
            <Field value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="Amount in ₹" />
            <View style={styles.sendRow}>
              <Button label="Cancel" tone="ghost" onPress={() => setSendTo(null)} />
              <View style={{ flex: 1 }}>
                <Button label={`Pay ₹${amount || "0"}`} onPress={() => void send(sendTo)} />
              </View>
            </View>
          </View>
        ) : null}

        <WeeklyChart days={weekly.days} income={weekly.income} spend={weekly.spend} demo={weekly.demo} />

        <View style={styles.rowHead}>
          <Text style={styles.section}>Transactions</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push("/(app)/activity")}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>
        <View style={styles.list}>
          {txns.slice(0, 5).length === 0 ? <Text style={styles.empty}>No taps yet. Bind a card, load ₹500, then send.</Text> : null}
          {txns.slice(0, 5).map((t) => (
            <TxnRow key={t.id} txn={t} />
          ))}
        </View>
        <View style={{ height: 12 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  scroll: { padding: 20, paddingBottom: 36, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hello: { color: Colors.muted, fontWeight: "600" },
  name: { color: Colors.ink, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceLabel: { color: Colors.muted, marginTop: 8 },
  balance: { color: Colors.forest, fontSize: 36, fontWeight: "800", letterSpacing: -1 },
  status: { color: Colors.forestMid, fontWeight: "600" },
  cards: { gap: 14, paddingVertical: 8 },
  rowHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  section: { fontSize: 18, fontWeight: "800", color: Colors.ink },
  link: { color: Colors.forestSoft, fontWeight: "700" },
  contacts: { gap: 14, paddingVertical: 4 },
  contact: { alignItems: "center", gap: 6, width: 72 },
  avatar: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" },
  initials: { color: Colors.lime, fontWeight: "800", fontSize: 13 },
  contactName: { fontSize: 12, fontWeight: "700", color: Colors.ink },
  sendSheet: {
    backgroundColor: Colors.paper,
    borderRadius: Radius.lg,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  sendRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  list: {
    backgroundColor: Colors.paper,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  empty: { color: Colors.muted, padding: 16 },
});
