import { formatInr } from "@/wallet";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/theme";
import type { TxnDoc } from "@/firebase/types";

const ICONS: Record<string, string> = {
  load: "↓",
  pay: "↑",
  refund: "↺",
};

export function TxnRow({ txn, onPress }: { txn: TxnDoc; onPress?: () => void }) {
  const inFlow = txn.type === "load" || txn.type === "refund";
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={[styles.icon, inFlow ? styles.in : styles.out]}>
        <Text style={styles.glyph}>{ICONS[txn.type] ?? "•"}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.title}>{labelFor(txn)}</Text>
        <Text style={styles.sub}>
          {new Date(txn.createdAt).toLocaleString([], { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
          {` · ${txn.status}`}
        </Text>
      </View>
      <Text style={[styles.amt, { color: inFlow ? Colors.ok : Colors.ink }]}>
        {inFlow ? "+" : "−"}
        {formatInr(txn.amountPaise)}
      </Text>
    </Pressable>
  );
}

function labelFor(txn: TxnDoc) {
  if (txn.type === "load") {
    return "Wallet top-up";
  }
  if (txn.type === "refund") {
    return "Refund";
  }
  return txn.merchantId ? `Paid · ${txn.merchantId.slice(0, 16)}` : "Tap payment";
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  in: { backgroundColor: "#E3F3D8" },
  out: { backgroundColor: Colors.creamDark },
  glyph: { fontSize: 16, fontWeight: "800", color: Colors.forest },
  meta: { flex: 1 },
  title: { fontWeight: "700", color: Colors.ink, fontSize: 15 },
  sub: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  amt: { fontWeight: "800", fontSize: 14 },
});
