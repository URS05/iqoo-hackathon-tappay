import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Button,
  Card,
  Field,
  Row,
  Screen,
  SectionHeader,
  Sub,
  Toast,
  TransactionRow,
} from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import type { TxnDoc, TxnStatus, TxnType, WalletDoc } from "@/firebase/types";
import { getNfc } from "@/nfc";
import { hmacForTag } from "@/nfc/hmac";
import { useSession } from "@/session/SessionContext";
import { formatInr, getLedger, rupeesToPaise } from "@/wallet";

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

export default function UserWallet() {
  const session = useSession();
  const ledger = getLedger();
  const nfc = getNfc();
  const [wallet, setWallet] = useState<WalletDoc | null>(null);
  const [txns, setTxns] = useState<TxnDoc[]>([]);
  const [custom, setCustom] = useState("250");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Bind a tag, then load money. Balance never lives on the tag.");
  const [upiOpen, setUpiOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "ok" | "danger" } | null>(null);

  const uid = session.lastTagUid;

  useEffect(() => {
    if (!uid) {
      setWallet(null);
      return;
    }
    return ledger.subscribeWallet(uid, setWallet);
  }, [uid, ledger]);

  useEffect(() => {
    return ledger.subscribeTxns((all) => {
      setTxns(uid ? all.filter((t) => t.uid === uid).slice(0, 12) : all.slice(0, 12));
    });
  }, [uid, ledger]);

  async function bind(simulate: boolean) {
    setBusy(true);
    setStatus(simulate ? "Simulating tag bind…" : "Hold the NTAG to this phone…");
    try {
      const tag = simulate
        ? await nfc.simulateWrite(session.displayName)
        : await nfc.writeTag(session.displayName);
      const hmac = tag.hmac ?? (await hmacForTag(tag.uidHex, session.displayName));
      await ledger.bindTag({
        uidHex: tag.uidHex,
        userId: session.userId || "local-user",
        displayName: session.displayName,
        hmac,
      });
      await session.setLastTagUid(tag.uidHex);
      setStatus(`Bound ${tag.uidHex}. Wallet starts at ₹0.`);
      setToast({ message: "Tag bound successfully", tone: "ok" });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Bind failed");
      setToast({ message: err instanceof Error ? err.message : "Bind failed", tone: "danger" });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBusy(false);
    }
  }

  async function load(rupees: number) {
    if (!uid) {
      Alert.alert("Bind a tag first");
      return;
    }
    setUpiOpen(true);
    setStatus("Mock UPI…");
    await new Promise((r) => setTimeout(r, 900));
    try {
      await ledger.loadMoney(uid, rupeesToPaise(rupees));
      setStatus(`Loaded ${formatInr(rupeesToPaise(rupees))}. Tag was not rewritten.`);
      setToast({ message: `Loaded ${formatInr(rupeesToPaise(rupees))}`, tone: "ok" });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Load failed");
      setToast({ message: err instanceof Error ? err.message : "Load failed", tone: "danger" });
    } finally {
      setUpiOpen(false);
    }
  }

  const balancePaise = wallet?.balancePaise ?? 0;

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Wallet</Text>
          <Text style={styles.balance}>₹{(balancePaise / 100).toFixed(2)}</Text>
          <Row style={styles.headerMeta}>
            <Badge label={uid ? "Tag bound" : "No tag"} tone={uid ? "ok" : "warn"} />
            {uid ? <Text style={styles.uid}>{uid}</Text> : null}
          </Row>
        </View>

        <Sub>{status}</Sub>

        <Card>
          <SectionHeader>Bind wristband</SectionHeader>
          <Button label="Hold tag to bind (NFC write)" onPress={() => bind(false)} disabled={busy} />
          <Button label="Simulate bind (no hardware)" tone="ghost" onPress={() => bind(true)} disabled={busy} />
        </Card>

        <Card>
          <SectionHeader>Top up</SectionHeader>
          <Row>
            <Button label="₹100" tone="ok" style={styles.flexBtn} onPress={() => load(100)} disabled={upiOpen} />
            <Button label="₹500" tone="ok" style={styles.flexBtn} onPress={() => load(500)} disabled={upiOpen} />
          </Row>
          <Field value={custom} onChangeText={setCustom} keyboardType="numeric" placeholder="Custom amount" />
          <Button
            label={`Load ₹${custom || "0"}`}
            tone="ok"
            onPress={() => load(Number(custom) || 0)}
            disabled={upiOpen}
          />
          {upiOpen ? (
            <View style={styles.upi}>
              <ActivityIndicator color={Colors.accent} />
              <Text style={styles.upiLabel}>Processing UPI…</Text>
            </View>
          ) : null}
        </Card>

        <Card>
          <SectionHeader>Recent transactions</SectionHeader>
          {txns.length === 0 ? <Sub>None yet</Sub> : null}
          {txns.map((t) => (
            <TransactionRow
              key={t.id}
              title={t.type.toUpperCase()}
              subtitle={t.status}
              amount={formatInr(t.amountPaise)}
              time={new Date(t.createdAt).toLocaleTimeString()}
              tone={txnTone(t.type, t.status)}
            />
          ))}
        </Card>
      </ScrollView>

      <Toast
        message={toast?.message ?? ""}
        tone={toast?.tone ?? "ok"}
        visible={toast != null}
        onDismiss={() => setToast(null)}
      />
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
  header: {
    gap: 6,
    paddingTop: Spacing.sm,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  balance: {
    color: Colors.accent,
    fontSize: 40,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerMeta: {
    alignItems: "center",
    flexWrap: "wrap",
  },
  uid: {
    color: Colors.muted,
    fontSize: 11,
    fontFamily: "monospace",
  },
  flexBtn: {
    flex: 1,
  },
  upi: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  upiLabel: {
    color: Colors.muted,
    fontSize: 13,
  },
});
