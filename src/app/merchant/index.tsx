import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Badge,
  Button,
  Card,
  Field,
  KeypadKey,
  PulsingText,
  Row,
  Screen,
  SectionHeader,
  Sub,
  TransactionRow,
} from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { scoreTap } from "@/fraud/scoreTap";
import type { TxnDoc, TxnStatus, TxnType } from "@/firebase/types";
import { getNfc, type TagPayload } from "@/nfc";
import { hmacForTag } from "@/nfc/hmac";
import { useSession } from "@/session/SessionContext";
import { formatInr, getLedger, rupeesToPaise } from "@/wallet";

type Phase = "idle" | "listen" | "processing" | "success" | "insufficient" | "frozen" | "error";

const KEY_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "⌫"],
] as const;

function txnTone(type: TxnType, status: TxnStatus) {
  if (status === "error") {
    return "danger" as const;
  }
  if (status === "insufficient" || status === "frozen") {
    return "warn" as const;
  }
  if (type === "pay") {
    return "merchant" as const;
  }
  return "accent" as const;
}

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

  const statusTone =
    phase === "success"
      ? "ok"
      : phase === "insufficient" || phase === "frozen"
        ? "warn"
        : phase === "error"
          ? "danger"
          : "muted";

  async function simulateTap() {
    const payload = await nfc.simulateTap(uidOverride || session.lastTagUid || undefined);
    await onTag(payload);
  }

  function startListen() {
    setPhase("listen");
    setMessage("Hold the wristband to this phone.");
  }

  function cancelListen() {
    setPhase("idle");
    setMessage("Enter amount, then listen for a tap.");
  }

  if (listening) {
    return (
      <SafeAreaView style={styles.listenSafe} edges={["top", "bottom"]}>
        <Text style={styles.listenAmount}>₹{amount || "0"}</Text>
        <View style={styles.listenCenter}>
          <PulsingText color={Colors.merchant}>WAITING FOR TAP</PulsingText>
          <Text style={styles.listenHint}>Hold the wristband to this phone</Text>
          {nfc.kind === "mock" && phase === "listen" ? (
            <Button label="Simulate tap" tone="merchant" onPress={() => void simulateTap()} />
          ) : null}
        </View>
        <Button label="Cancel" tone="ghost" onPress={cancelListen} disabled={phase === "processing"} />
      </SafeAreaView>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Point of Sale</Text>

        <Card style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amount}>₹{amount || "0"}</Text>
          <Row style={styles.statusRow}>
            <Badge label={phase.toUpperCase()} tone={statusTone} />
            <Text style={styles.statusMessage}>{message}</Text>
          </Row>
          {balance != null ? <Text style={styles.balanceLeft}>Wallet {formatInr(balance)}</Text> : null}
        </Card>

        <View style={styles.keypad}>
          {KEY_ROWS.map((row, rowIndex) => (
            <Row key={`row-${rowIndex}`}>
              {row.map((k) => (
                <KeypadKey key={k} label={k} onPress={() => key(k)} />
              ))}
            </Row>
          ))}
        </View>

        <Button label="Confirm & listen" tone="merchant" onPress={startListen} />

        <Card>
          <SectionHeader>Developer tools</SectionHeader>
          <Field
            value={uidOverride}
            onChangeText={setUidOverride}
            placeholder="UID for simulate tap"
            autoCapitalize="characters"
          />
          <Button label="Simulate tap" tone="ghost" onPress={() => void simulateTap()} />
        </Card>

        <Card>
          <SectionHeader>Recent transactions</SectionHeader>
          {txns.length === 0 ? <Sub>No transactions yet</Sub> : null}
          {txns.map((t) => (
            <TransactionRow
              key={t.id}
              title={t.type.toUpperCase()}
              subtitle={`${t.uid.slice(0, 8)} · ${t.status}`}
              amount={formatInr(t.amountPaise)}
              time={new Date(t.createdAt).toLocaleTimeString()}
              tone={txnTone(t.type, t.status)}
            />
          ))}
        </Card>
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
    color: Colors.merchant,
    fontSize: 24,
    fontWeight: "700",
    paddingTop: Spacing.sm,
  },
  amountCard: {
    alignItems: "center",
    gap: 6,
  },
  amountLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  amount: {
    color: Colors.text,
    fontSize: 48,
    fontWeight: "700",
    letterSpacing: -1,
  },
  statusRow: {
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 4,
  },
  statusMessage: {
    color: Colors.muted,
    fontSize: 13,
    flex: 1,
  },
  balanceLeft: {
    color: Colors.muted,
    fontSize: 13,
  },
  keypad: {
    gap: Spacing.sm,
  },
  listenSafe: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    justifyContent: "space-between",
  },
  listenAmount: {
    color: Colors.text,
    fontSize: 56,
    fontWeight: "700",
    textAlign: "center",
    paddingTop: Spacing.sm,
  },
  listenCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  listenHint: {
    color: Colors.muted,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
});
