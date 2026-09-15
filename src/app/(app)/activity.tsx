import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TxnRow } from "@/components/TxnRow";
import { WeeklyChart } from "@/components/WeeklyChart";
import { Colors, Radius } from "@/constants/theme";
import { useWalletLive } from "@/hooks/useWalletLive";
import { formatInr } from "@/wallet";

export default function ActivityScreen() {
  const { wallet, txns, weekly } = useWalletLive();
  const spent = txns.filter((t) => t.type === "pay" && t.status === "ok").reduce((s, t) => s + t.amountPaise, 0);
  const loaded = txns.filter((t) => t.type === "load" && t.status === "ok").reduce((s, t) => s + t.amountPaise, 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>ACTIVITY</Text>
        <Text style={styles.title}>Income & spending</Text>
        <View style={styles.pills}>
          <View style={styles.pill}>
            <Text style={styles.pillK}>Wallet</Text>
            <Text style={styles.pillV}>{formatInr(wallet?.balancePaise ?? 0)}</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillK}>Loaded</Text>
            <Text style={styles.pillV}>{formatInr(loaded)}</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillK}>Spent</Text>
            <Text style={styles.pillV}>{formatInr(spent)}</Text>
          </View>
        </View>
        <WeeklyChart days={weekly.days} income={weekly.income} spend={weekly.spend} demo={weekly.demo} />
        <Text style={styles.section}>History</Text>
        <View style={styles.list}>
          {txns.length === 0 ? <Text style={styles.empty}>Nothing yet. Top up from Cards, then Quick send on Home.</Text> : null}
          {txns.map((t) => (
            <TxnRow key={t.id} txn={t} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  scroll: { padding: 20, gap: 14, paddingBottom: 36 },
  kicker: { color: Colors.forestSoft, fontWeight: "800", letterSpacing: 2, fontSize: 12 },
  title: { fontSize: 30, fontWeight: "800", color: Colors.ink, letterSpacing: -0.8 },
  pills: { flexDirection: "row", gap: 8 },
  pill: {
    flex: 1,
    backgroundColor: Colors.forest,
    borderRadius: Radius.md,
    padding: 12,
  },
  pillK: { color: "rgba(212,241,87,0.7)", fontSize: 11, fontWeight: "700" },
  pillV: { color: Colors.lime, fontWeight: "800", fontSize: 14, marginTop: 4 },
  section: { fontSize: 18, fontWeight: "800", color: Colors.ink },
  list: {
    backgroundColor: Colors.paper,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  empty: { color: Colors.muted, padding: 16 },
});
