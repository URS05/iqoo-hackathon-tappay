import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";

import { Button, Card, Label, Screen, Sub, Title } from "@/components/ui";
import { Colors } from "@/constants/theme";
import type { TagDoc, TxnDoc, WalletDoc } from "@/firebase/types";
import { formatInr, getLedger } from "@/wallet";

export default function AdminScreen() {
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
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
        <Title>Admin</Title>
        <Sub>{status}</Sub>
        <Button label="Refresh tags" tone="ghost" onPress={() => void refresh()} />
        {tags.length === 0 ? <Sub>No tags yet. Bind from the user role.</Sub> : null}
        {tags.map((row) => (
          <Card key={row.uid}>
            <Label>{row.tag.displayName}</Label>
            <Text style={styles.mono}>{row.uid}</Text>
            <Text style={styles.meta}>
              {row.tag.status} · {formatInr(row.wallet?.balancePaise ?? 0)}
            </Text>
            {row.tag.status === "frozen" ? (
              <Button label="Unfreeze" onPress={() => void toggle(row.uid, false)} />
            ) : (
              <Button label="Freeze tag" tone="danger" onPress={() => void toggle(row.uid, true)} />
            )}
          </Card>
        ))}
        <Card>
          <Label>Ledger</Label>
          {txns.map((t) => (
            <Text key={t.id} style={styles.meta}>
              {new Date(t.createdAt).toLocaleTimeString()} · {t.type} {formatInr(t.amountPaise)} · {t.status} ·{" "}
              {t.uid.slice(0, 10)}
            </Text>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mono: { color: Colors.accent, fontFamily: "monospace" },
  meta: { color: Colors.muted },
});
