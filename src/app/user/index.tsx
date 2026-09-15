import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, Card, Field, Label, Screen, Sub, Title } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { hmacForTag } from "@/nfc/hmac";
import { getNfc } from "@/nfc";
import { useSession } from "@/session/SessionContext";
import { formatInr, getLedger, rupeesToPaise } from "@/wallet";
import type { TxnDoc, WalletDoc } from "@/firebase/types";

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
      Alert.alert("Bind a tag first");
      return;
    }
    setUpiOpen(true);
    setStatus("Mock UPI…");
    await new Promise((r) => setTimeout(r, 900));
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
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
        <Title>Wallet</Title>
        <Sub>{status}</Sub>
        <Card>
          <Text style={styles.kicker}>{uid ?? "No tag bound"}</Text>
          <Text style={styles.balance}>{formatInr(wallet?.balancePaise ?? 0)}</Text>
          <Label>Cloud ledger · integer paise</Label>
        </Card>

        <Button label="Hold tag to bind (NFC write)" onPress={() => bind(false)} disabled={busy} />
        <Button label="Simulate bind (no hardware)" tone="ghost" onPress={() => bind(true)} disabled={busy} />

        <Card>
          <Label>Mock UPI top-up</Label>
          <View style={styles.row}>
            <Button label="₹100" onPress={() => load(100)} disabled={upiOpen} />
            <Button label="₹500" onPress={() => load(500)} disabled={upiOpen} />
          </View>
          <Field value={custom} onChangeText={setCustom} keyboardType="numeric" placeholder="Custom rupees" />
          <Button label={`Load ₹${custom || "0"}`} tone="ok" onPress={() => load(Number(custom) || 0)} disabled={upiOpen} />
          {upiOpen ? (
            <View style={styles.upi}>
              <ActivityIndicator color={Colors.accent} />
              <Label>UPI success (fake)</Label>
            </View>
          ) : null}
        </Card>

        <Card>
          <Label>Recent txns</Label>
          {txns.length === 0 ? <Sub>None yet</Sub> : null}
          {txns.map((t) => (
            <Text key={t.id} style={styles.txn}>
              {t.type} {formatInr(t.amountPaise)} · {t.status}
            </Text>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: Colors.muted, fontSize: 12, letterSpacing: 1 },
  balance: { color: Colors.ok, fontSize: 40, fontWeight: "800" },
  row: { gap: 8 },
  upi: { flexDirection: "row", alignItems: "center", gap: 8 },
  txn: { color: Colors.text, fontSize: 14 },
});
