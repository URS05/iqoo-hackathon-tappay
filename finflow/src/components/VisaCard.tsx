import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { Colors, Radius } from "@/constants/theme";

type Props = {
  holder: string;
  last4: string;
  label?: string;
  valid?: string;
  compact?: boolean;
};

export function VisaCard({ holder, last4, label = "TapPay Visa", valid = "09/29", compact }: Props) {
  return (
    <LinearGradient
      colors={[Colors.forest, Colors.forestMid, "#249166"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, compact && styles.compact]}
    >
      <View style={styles.glow} />
      <View style={styles.top}>
        <Text style={styles.brand}>{label}</Text>
        <Text style={styles.visa}>VISA</Text>
      </View>
      <View style={styles.chip} />
      <Text style={styles.pan}>••••  ••••  ••••  {last4.slice(-4).padStart(4, "0")}</Text>
      <View style={styles.bottom}>
        <View>
          <Text style={styles.kicker}>CARD HOLDER</Text>
          <Text style={styles.holder}>{holder.toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.kicker}>VALID THRU</Text>
          <Text style={styles.holder}>{valid}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 320,
    height: 176,
    borderRadius: Radius.lg,
    padding: 22,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  compact: {
    width: "100%",
    height: 188,
  },
  glow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.lime,
    opacity: 0.12,
    right: -40,
    top: -50,
  },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { color: Colors.lime, fontWeight: "800", letterSpacing: 0.4 },
  visa: {
    color: Colors.white,
    fontWeight: "900",
    fontSize: 20,
    fontStyle: "italic",
    letterSpacing: 1,
  },
  chip: {
    width: 42,
    height: 30,
    borderRadius: 6,
    backgroundColor: Colors.lime,
    opacity: 0.9,
  },
  pan: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 2.4,
  },
  bottom: { flexDirection: "row", justifyContent: "space-between" },
  kicker: { color: "rgba(255,255,255,0.55)", fontSize: 9, letterSpacing: 1.2, marginBottom: 4 },
  holder: { color: Colors.white, fontWeight: "700", fontSize: 13 },
});
