import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";

const ONBOARD_KEY = "tappay.finflow.onboarded";

const SLIDES = [
  {
    kicker: "01",
    title: "Your money,\nbeautifully simple.",
    body: "A forest-green wallet with lime energy. Balance lives in the ledger — the tag is only an ID.",
  },
  {
    kicker: "02",
    title: "Tap. Pay.\nWalk away.",
    body: "Bind an NFC wristband once. Merchants deduct from the cloud ledger, never from the chip.",
  },
  {
    kicker: "03",
    title: "See every rupee\nin motion.",
    body: "Cards, weekly spend, freeze controls, and a stall POS — one APK, three roles.",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(ONBOARD_KEY).then((v) => {
      if (v === "1") {
        router.replace("/(app)");
        return;
      }
      setReady(true);
    });
  }, [router]);

  async function finish() {
    await AsyncStorage.setItem(ONBOARD_KEY, "1");
    router.replace("/(app)");
  }

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: Colors.forest }} />;
  }

  const slide = SLIDES[index];

  return (
    <LinearGradient colors={[Colors.forestDeep, Colors.forest, "#1F6B4A"]} style={styles.fill}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.top}>
          <Text style={styles.logo}>TapPay</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Skip" onPress={() => void finish()}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>

        <Animated.View key={index} entering={FadeIn.duration(280)} exiting={FadeOut.duration(180)} style={styles.copy}>
          <Text style={styles.kicker}>{slide.kicker} — FINFLOW</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>
        </Animated.View>

        <View style={styles.art}>
          <View style={styles.orb} />
          <View style={styles.miniCard}>
            <Text style={styles.miniVisa}>VISA</Text>
            <Text style={styles.miniPan}>••••  4821</Text>
          </View>
        </View>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>

        {index < SLIDES.length - 1 ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Next" style={styles.cta} onPress={() => setIndex((i) => i + 1)}>
            <Text style={styles.ctaText}>Next</Text>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" accessibilityLabel="Get started" style={styles.cta} onPress={() => void finish()}>
            <Text style={styles.ctaText}>Get started</Text>
          </Pressable>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 24, paddingBottom: 24 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8 },
  logo: { color: Colors.lime, fontWeight: "800", fontSize: 18, letterSpacing: 0.4 },
  skip: { color: "rgba(255,255,255,0.7)", fontWeight: "700" },
  copy: { marginTop: 36, gap: 14 },
  kicker: { color: Colors.lime, fontWeight: "800", letterSpacing: 2, fontSize: 12 },
  title: { color: Colors.white, fontSize: 40, fontWeight: "800", letterSpacing: -1.2, lineHeight: 44 },
  body: { color: "rgba(255,255,255,0.72)", fontSize: 16, lineHeight: 24, maxWidth: 340 },
  art: { flex: 1, justifyContent: "center", alignItems: "center" },
  orb: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.lime,
    opacity: 0.16,
  },
  miniCard: {
    width: 220,
    height: 128,
    borderRadius: 20,
    backgroundColor: "rgba(8,38,28,0.55)",
    borderWidth: 1,
    borderColor: "rgba(212,241,87,0.35)",
    padding: 18,
    justifyContent: "space-between",
  },
  miniVisa: { color: Colors.white, fontStyle: "italic", fontWeight: "900", fontSize: 18, alignSelf: "flex-end" },
  miniPan: { color: Colors.lime, fontWeight: "700", letterSpacing: 2 },
  dots: { flexDirection: "row", gap: 8, marginBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.25)" },
  dotOn: { width: 24, backgroundColor: Colors.lime },
  cta: {
    backgroundColor: Colors.lime,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaText: { color: Colors.forestDeep, fontWeight: "800", fontSize: 16 },
});
