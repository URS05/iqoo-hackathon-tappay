import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, Field } from "@/components/ui";
import { Colors, Radius } from "@/constants/theme";
import { scoreTap } from "@/fraud/scoreTap";
import type { TxnDoc } from "@/firebase/types";
import { getNfc, type TagPayload } from "@/nfc";
import { hmacForTag } from "@/nfc/hmac";
import { useSession } from "@/session/SessionContext";
import { formatInr, getLedger, rupeesToPaise } from "@/wallet";

type Phase = "idle" | "listen" | "processing" | "success" | "insufficient" | "frozen" | "error";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

export default function MerchantPos() {
  useKeepAwake();
  const router = useRouter();
  const session = useSession();
  const ledger = getLedger();
  const nfc = getNfc();
  const [amount, setAmount] = useState("80");
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("Enter amount, then listen for a tap.");
  const [balance, setBalance] = useState<number | null>(null);
  const [txns, setTxns] = useState<TxnDoc[]>([]);
  const [uidOverride, setUidOverride] = useState(session.lastTagUid ?? "");
  const debounce = useRef(0);

  useEffect(() => {
    if (session.lastTagUid && !uidOverride) {
      setUidOverride(session.lastTagUid);
    }
  }, [session.lastTagUid, uidOverride]);

  useEffect(() => {
    return ledger.subscribeTxns((all) => setTxns(all.slice(0, 8)));
  }, [ledger]);

  const onTag = useCallback(
    async (tag: TagPayload) => {
      const now = Date.now();
      if (now - debounce.current < 2000) {
        return;
      }
      debounce.current = now;
      setPhase("processing");
      setMessage(`UID ${tag.uidHex}`);
      try {
        if (tag.hmac && tag.displayName) {
          const expected = await hmacForTag(tag.uidHex, tag.displayName);
          if (expected !== tag.hmac) {
            setMessage("NDEF HMAC mismatch — still using UID as account key.");
          }
        }
        const paise = rupeesToPaise(Number(amount) || 0);
        const fraudScore = scoreTap({ amountPaise: paise });
        const result = await ledger.deduct({
          uidHex: tag.uidHex,
          amountPaise: paise,
          merchantId: session.merchantId,
          fraudScore,
        });
        if (result.ok) {
          setPhase("success");
          setBalance(result.balancePaise);
          setMessage(`Paid ${formatInr(paise)}. Left ${formatInr(result.balancePaise)}.`);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (result.reason === "insufficient") {
          setPhase("insufficient");
          setMessage(result.message);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else if (result.reason === "frozen") {
          setPhase("frozen");
          setMessage(result.message);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          setPhase("error");
          setMessage(result.message);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch (err) {
        setPhase("error");
        setMessage(err instanceof Error ? err.message : "Tap failed");
      }
    },
    [amount, ledger, session.merchantId],
  );

  useEffect(() => {
    if (phase !== "listen") {
      void nfc.stopReader();
      return;
    }
    void nfc.startReader(onTag);
    return () => {
      void nfc.stopReader();
    };
  }, [phase, nfc, onTag]);

  function key(k: string) {
    if (k === "⌫") {
      setAmount((a) => a.slice(0, -1));
      return;
    }
    setAmount((a) => (a + k).replace(/^0+(?=\d)/, "").slice(0, 8));
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()}>
          <Text style={styles.back}>← Profile</Text>
        </Pressable>
        <Text style={styles.kicker}>MERCHANT</Text>
        <Text style={styles.title}>Stall POS</Text>
        <Text style={styles.sub}>Screen stays awake. Tag is ID only — deduct is atomic in the ledger.</Text>

        <View style={styles.target}>
          <Text style={styles.amount}>₹{amount || "0"}</Text>
          <View style={styles.phasePill}>
            <Text style={styles.phase}>{phase.toUpperCase()}</Text>
          </View>
          <Text style={styles.msg}>{message}</Text>
          {balance != null ? <Text style={styles.msg}>Wallet {formatInr(balance)}</Text> : null}
        </View>

        <View style={styles.keys}>
          {KEYS.map((k) => (
            <Pressable accessibilityRole="button" accessibilityLabel={k} key={k} onPress={() => key(k)} style={styles.key}>
              <Text style={styles.keyText}>{k}</Text>
            </Pressable>
          ))}
        </View>

        {phase === "listen" ? (
          <Button label="Cancel listen" tone="ghost" onPress={() => setPhase("idle")} />
        ) : (
          <Button
            label="Listen for tap"
            tone="forest"
            onPress={() => {
              setPhase("listen");
              setMessage("Hold the wristband to this phone.");
            }}
          />
        )}

        <Field
          value={uidOverride}
          onChangeText={setUidOverride}
          placeholder="UID for simulate tap"
          autoCapitalize="characters"
        />
        <Button
          label="Simulate tap"
          onPress={async () => {
            const payload = await nfc.simulateTap(uidOverride || session.lastTagUid || undefined);
            await onTag(payload);
          }}
        />

        <View style={styles.list}>
          {txns.map((t) => (
            <Text key={t.id} style={styles.txn}>
              {t.type} {formatInr(t.amountPaise)} · {t.uid.slice(0, 8)} · {t.status}
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
  target: {
    minHeight: 168,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    backgroundColor: Colors.forest,
    gap: 8,
  },
  amount: { color: Colors.lime, fontSize: 48, fontWeight: "800", letterSpacing: -1 },
  phasePill: { backgroundColor: "rgba(212,241,87,0.16)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  phase: { color: Colors.lime, fontWeight: "800", letterSpacing: 2, fontSize: 12 },
  msg: { color: "rgba(255,255,255,0.7)", textAlign: "center" },
  keys: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  key: {
    width: "31%",
    backgroundColor: Colors.paper,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.line,
  },
  keyText: { color: Colors.ink, fontSize: 20, fontWeight: "700" },
  list: {
    backgroundColor: Colors.paper,
    borderRadius: Radius.lg,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  txn: { color: Colors.ink, fontWeight: "600" },
});
