import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Button,
  Card,
  Row,
  Screen,
  SectionHeader,
  Sub,
  TransactionRow,
} from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import type { TagDoc, TxnDoc, TxnStatus, TxnType, WalletDoc } from "@/firebase/types";
import { formatInr, getLedger } from "@/wallet";

function txnTone(type: TxnType, status: TxnStatus) {
  if (status === "error") {
    return "danger" as const;
  }
  if (status === "insufficient" || status === "frozen") {
    return "warn" as const;
  }
  if (type === "load") {
    return "ok" as const;
  }
  if (type === "pay") {
    return "merchant" as const;
  }
  return "accent" as const;
}

export default function AdminScreen() {
  const ledger = getLedger();
  const [tags, setTags] = useState<{ uid: string; tag: TagDoc; wallet?: WalletDoc }[]>([]);
  const [txns, setTxns] = useState<TxnDoc[]>([]);
  const [status, setStatus] = useState("Freeze a cloned or lost tag. Ledger stays the source of truth.");
  const [replayOpen, setReplayOpen] = useState(true);

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

  async function replayLedger() {
    await refresh();
    setReplayOpen(true);
    setStatus("Ledger replay refreshed from local store.");
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Admin</Text>
        <Sub>{status}</Sub>

        <Row>
          <Button label="Refresh tags" tone="ghost" style={styles.flexBtn} onPress={() => void refresh()} />
          <Button label="Replay ledger" tone="accent" style={styles.flexBtn} onPress={() => void replayLedger()} />
        </Row>

        <SectionHeader>Tags</SectionHeader>
        {tags.length === 0 ? <Sub>No tags yet. Bind from the user role.</Sub> : null}
        {tags.map((row) => (
          <Card key={row.uid}>
            <Row style={styles.tagHeader}>
              <Text style={styles.tagName}>{row.tag.displayName}</Text>
              <Badge
                label={row.tag.status === "frozen" ? "Frozen" : "Active"}
                tone={row.tag.status === "frozen" ? "danger" : "ok"}
              />
            </Row>
            <Text style={styles.mono}>{row.uid}</Text>
            <Text style={styles.meta}>Balance {formatInr(row.wallet?.balancePaise ?? 0)}</Text>
            {row.tag.status === "frozen" ? (
              <Button label="Unfreeze" onPress={() => void toggle(row.uid, false)} />
            ) : (
              <Button label="Freeze tag" tone="danger" onPress={() => void toggle(row.uid, true)} />
            )}
          </Card>
        ))}

        {replayOpen ? (
          <Card>
            <SectionHeader>Ledger replay</SectionHeader>
            {txns.length === 0 ? <Sub>No ledger entries yet</Sub> : null}
            {txns.map((t) => (
              <TransactionRow
                key={t.id}
                title={t.type.toUpperCase()}
                subtitle={`${t.uid.slice(0, 10)} · ${t.status}`}
                amount={formatInr(t.amountPaise)}
                time={new Date(t.createdAt).toLocaleTimeString()}
                tone={txnTone(t.type, t.status)}
              />
            ))}
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  scroll: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 48,
  },
  headerTitle: {
    color: Colors.admin,
    fontSize: 24,
    fontWeight: "700",
    paddingTop: Spacing.sm,
  },
  flexBtn: {
    flex: 1,
  },
  tagHeader: {
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  mono: {
    color: Colors.accent,
    fontFamily: "monospace",
    fontSize: 12,
  },
  meta: {
    color: Colors.muted,
    fontSize: 13,
  },
});
