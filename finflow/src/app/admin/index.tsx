import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui";
import { Colors, Radius } from "@/constants/theme";
import type { TagDoc, TxnDoc, WalletDoc } from "@/firebase/types";
import { formatInr, getLedger } from "@/wallet";

export default function AdminScreen() {
  const router = useRouter();
  const ledger = getLedger();
  const [tags, setTags] = useState<{ uid: string; tag: TagDoc; wallet?: WalletDoc }[]>([]);
  const [txns, setTxns] = useState<TxnDoc[]>([]);
  const [status, setStatus] = useState("Freeze a cloned or lost tag. Ledger stays the source of truth.");

  const refresh = useCallback(async () => {
    setTags(await ledger.listTags());
  }, [ledger]);

  useEffect(() => {
    return ledger.subscribeTxns((all) => {
      setTxns(all.slice(0, 20));
      void refresh();
    });
  }, [ledger, refresh]);

  async function toggle(uid: string, frozen: boolean) {
    await ledger.freezeTag(uid, frozen);
    setStatus(frozen ? `Frozen ${uid}` : `Unfrozen ${uid}`);
    await refresh();
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()}>
          <Text style={styles.back}>← Profile</Text>
        </Pressable>
        <Text style={styles.kicker}>ADMIN</Text>
        <Text style={styles.title}>Control room</Text>
        <Text style={styles.sub}>{status}</Text>
        <Button label="Refresh tags" tone="ghost" onPress={() => void refresh()} />
        {tags.length === 0 ? <Text style={styles.sub}>No tags yet. Bind from Cards.</Text> : null}
        {tags.map((row) => (
          <View key={row.uid} style={styles.card}>
            <Text style={styles.name}>{row.tag.displayName}</Text>
            <Text style={styles.mono}>{row.uid}</Text>
            <Text style={styles.meta}>
              {row.tag.status} · {formatInr(row.wallet?.balancePaise ?? 0)}
            </Text>
            {row.tag.status === "frozen" ? (
              <Button label="Unfreeze" onPress={() => void toggle(row.uid, false)} />
            ) : (
              <Button label="Freeze tag" tone="danger" onPress={() => void toggle(row.uid, true)} />
            )}
          </View>
        ))}
        <View style={styles.card}>
          <Text style={styles.name}>Ledger</Text>
          {txns.map((t) => (
            <Text key={t.id} style={styles.meta}>
              {new Date(t.createdAt).toLocaleTimeString()} · {t.type} {formatInr(t.amountPaise)} · {t.status} ·{" "}
              {t.uid.slice(0, 10)}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  scroll: { padding: 20, gap: 12, paddingBottom: 40 },
  back: { color: Colors.forest, fontWeight: "800" },
  kicker: { color: Colors.forestSoft, fontWeight: "800", letterSpacing: 2, fontSize: 12 },
  title: { fontSize: 30, fontWeight: "800", color: Colors.ink, letterSpacing: -0.8 },
  sub: { color: Colors.muted, lineHeight: 20 },
  card: {
    backgroundColor: Colors.paper,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  name: { fontWeight: "800", color: Colors.ink, fontSize: 16 },
  mono: { color: Colors.forestMid, fontFamily: "monospace" },
  meta: { color: Colors.muted },
});
