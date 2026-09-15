import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, Card, Field, Screen, Sub, Title } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
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
  const navigation = useNavigation();
  const session = useSession();
  const ledger = getLedger();
  const nfc = getNfc();
  const [amount, setAmount] = useState("80");
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("Enter amount, then listen for a tap.");
  const [balance, setBalance] = useState<number | null>(null);
  const [txns, setTxns] = useState<TxnDoc[]>([]);
  const [uidOverride, setUidOverride] = useState(session.lastTagUid ?? "");

  useEffect(() => {
    if (session.lastTagUid && !uidOverride) {
      setUidOverride(session.lastTagUid);
    }
  }, [session.lastTagUid, uidOverride]);
  const debounce = useRef(0);

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

  const listening = phase === "listen" || phase === "processing";

  useEffect(() => {
    navigation.setOptions({ headerShown: !listening });
    return () => {
      navigation.setOptions({ headerShown: true });
    };
  }, [navigation, listening]);

  function key(k: string) {
    if (k === "⌫") {
      setAmount((a) => a.slice(0, -1));
      return;
    }
    setAmount((a) => (a + k).replace(/^0+(?=\d)/, "").slice(0, 8));
  }

  const tone =
    phase === "success"
      ? Colors.ok
      : phase === "insufficient" || phase === "frozen"
        ? Colors.warn
        : phase === "error"
          ? Colors.danger
          : phase === "listen" || phase === "processing"
            ? Colors.merchant
            : Colors.accent;

  async function simulateTap() {
    const payload = await nfc.simulateTap(uidOverride || session.lastTagUid || undefined);
    await onTag(payload);
  }

  function cancelListen() {
    setPhase("idle");
    setMessage("Enter amount, then listen for a tap.");
  }

  if (listening) {
    return (
      <SafeAreaView style={styles.listenSafe} edges={["top", "bottom"]}>
        <Text style={styles.listenAmount}>₹{amount || "0"}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="LISTEN"
          style={[styles.listenZone, { borderColor: tone }]}
          onPress={nfc.kind === "mock" && phase === "listen" ? () => void simulateTap() : undefined}
          disabled={phase !== "listen"}
        >
          <Text style={[styles.listenWord, { color: tone }]}>LISTEN</Text>
          <Text style={styles.listenHint}>Hold the wristband to this phone</Text>
        </Pressable>
        <Button label="Cancel" tone="ghost" onPress={cancelListen} disabled={phase === "processing"} />
      </SafeAreaView>
    );
  }

  return (
    <Screen>
      <Title>Stall POS</Title>
      <Sub>Screen stays awake. Tag is ID only — deduct is atomic in the ledger.</Sub>

      <View style={[styles.target, { borderColor: tone }]}>
        <Text style={styles.amount}>₹{amount || "0"}</Text>
        <Text style={[styles.phase, { color: tone }]}>{phase.toUpperCase()}</Text>
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

      <Button
        label="Listen for tap"
        tone="merchant"
        onPress={() => {
          setPhase("listen");
          setMessage("Hold the wristband to this phone.");
        }}
      />

      <Field
        value={uidOverride}
        onChangeText={setUidOverride}
        placeholder="UID for simulate tap"
        autoCapitalize="characters"
      />
      <Button label="Simulate tap" onPress={() => void simulateTap()} />

      <Card>
        {txns.map((t) => (
          <Text key={t.id} style={styles.txn}>
            {t.type} {formatInr(t.amountPaise)} · {t.uid.slice(0, 8)} · {t.status}
          </Text>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  target: {
    minHeight: 180,
    borderWidth: 2,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: Colors.card,
    gap: 6,
  },
  amount: { color: Colors.text, fontSize: 48, fontWeight: "800" },
  phase: { fontWeight: "800", letterSpacing: 2 },
  msg: { color: Colors.muted, textAlign: "center" },
  keys: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  key: {
    width: "31%",
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  keyText: { color: Colors.text, fontSize: 20, fontWeight: "700" },
  txn: { color: Colors.text },
  listenSafe: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  listenAmount: {
    color: Colors.text,
    fontSize: 56,
    fontWeight: "800",
    textAlign: "center",
    paddingTop: Spacing.sm,
  },
  listenZone: {
    flex: 1,
    marginVertical: Spacing.lg,
    borderWidth: 3,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  listenWord: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 6,
  },
  listenHint: {
    color: Colors.muted,
    fontSize: 18,
    textAlign: "center",
    lineHeight: 26,
  },
});
