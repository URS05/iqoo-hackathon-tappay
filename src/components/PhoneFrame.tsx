import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useSegments } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/theme";
import { useChrome } from "@/layout/ChromeContext";

export function PhoneFrame({ children }: { children: ReactNode }) {
  const { mode, setMode, wide } = useChrome();
  const router = useRouter();
  const segments = useSegments();

  if (!wide) {
    return <View style={styles.fill}>{children}</View>;
  }

  return (
    <LinearGradient colors={["#E8F3C8", Colors.cream, "#D7E8C8"]} style={styles.stage}>
      <View style={styles.stageTop}>
        <View>
          <Text style={styles.kicker}>TAPPAY × FINFLOW</Text>
          <Text style={styles.hero}>Modern tap-to-pay, forest & lime.</Text>
        </View>
        <View style={styles.toggle}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Phone layout"
            onPress={() => setMode("phone")}
            style={[styles.toggleBtn, mode === "phone" && styles.toggleOn]}
          >
            <Ionicons name="phone-portrait-outline" size={16} color={mode === "phone" ? Colors.forestDeep : Colors.muted} />
            <Text style={[styles.toggleText, mode === "phone" && styles.toggleTextOn]}>Phone</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Desktop layout"
            onPress={() => setMode("desktop")}
            style={[styles.toggleBtn, mode === "desktop" && styles.toggleOn]}
          >
            <Ionicons name="desktop-outline" size={16} color={mode === "desktop" ? Colors.forestDeep : Colors.muted} />
            <Text style={[styles.toggleText, mode === "desktop" && styles.toggleTextOn]}>Desktop</Text>
          </Pressable>
        </View>
      </View>

      {mode === "desktop" ? (
        <View style={styles.desktop}>
          <View style={styles.sidebar}>
            <Text style={styles.logo}>TapPay</Text>
            <Text style={styles.logoSub}>finflow edition</Text>
            <SideLink label="Home" icon="home-outline" onPress={() => router.push("/(app)")} active={inApp(segments, "index")} />
            <SideLink label="Cards" icon="card-outline" onPress={() => router.push("/(app)/cards")} active={inApp(segments, "cards")} />
            <SideLink label="Activity" icon="stats-chart-outline" onPress={() => router.push("/(app)/activity")} active={inApp(segments, "activity")} />
            <SideLink label="Profile" icon="person-outline" onPress={() => router.push("/(app)/profile")} active={inApp(segments, "profile")} />
            <View style={styles.sideGap} />
            <SideLink label="Merchant POS" icon="storefront-outline" onPress={() => router.push("/merchant")} active={segments[0] === "merchant"} />
            <SideLink label="Admin" icon="shield-checkmark-outline" onPress={() => router.push("/admin")} active={segments[0] === "admin"} />
          </View>
          <View style={styles.desktopMain}>{children}</View>
        </View>
      ) : (
        <View style={styles.phoneWrap}>
          <View style={styles.bezel}>
            <View style={styles.island} />
            <View style={styles.screen}>
              <View style={styles.islandSpacer} />
              {children}
            </View>
            <View style={styles.homeBar} />
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

function inApp(segments: string[], name: string) {
  if (segments[0] !== "(app)") {
    return false;
  }
  if (name === "index") {
    return segments.length === 1 || segments[1] === "index";
  }
  return segments[1] === name;
}

function SideLink({
  label,
  icon,
  onPress,
  active,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  active: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.link, active && styles.linkOn]}>
      <Ionicons name={icon} size={18} color={active ? Colors.forestDeep : Colors.lime} />
      <Text style={[styles.linkText, active && styles.linkTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: Colors.cream },
  stage: { flex: 1, padding: 28, gap: 20 },
  stageTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  kicker: { color: Colors.forest, fontWeight: "800", letterSpacing: 2, fontSize: 12 },
  hero: { color: Colors.ink, fontSize: 28, fontWeight: "800", letterSpacing: -0.6, marginTop: 6, maxWidth: 420 },
  toggle: { flexDirection: "row", backgroundColor: Colors.paper, borderRadius: 999, padding: 4, gap: 4, borderWidth: 1, borderColor: Colors.line },
  toggleBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  toggleOn: { backgroundColor: Colors.lime },
  toggleText: { fontWeight: "700", color: Colors.muted },
  toggleTextOn: { color: Colors.forestDeep },
  phoneWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  bezel: {
    width: 390,
    height: 844,
    maxHeight: "100%",
    backgroundColor: "#0A1A14",
    borderRadius: 48,
    padding: 10,
    shadowColor: "#08261C",
    shadowOpacity: 0.35,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 18 },
  },
  island: {
    position: "absolute",
    top: 18,
    alignSelf: "center",
    width: 118,
    height: 28,
    borderRadius: 20,
    backgroundColor: "#000",
    zIndex: 2,
    left: "50%",
    marginLeft: -59,
  },
  screen: {
    flex: 1,
    borderRadius: 38,
    overflow: "hidden",
    backgroundColor: Colors.cream,
  },
  homeBar: {
    position: "absolute",
    bottom: 18,
    alignSelf: "center",
    width: 128,
    height: 5,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.28)",
    left: "50%",
    marginLeft: -64,
  },
  desktop: { flex: 1, flexDirection: "row", gap: 18, minHeight: 0 },
  sidebar: {
    width: 240,
    backgroundColor: Colors.forest,
    borderRadius: 28,
    padding: 22,
    gap: 8,
  },
  logo: { color: Colors.lime, fontSize: 26, fontWeight: "800" },
  logoSub: { color: "rgba(212,241,87,0.6)", marginBottom: 18, fontWeight: "600" },
  sideGap: { flex: 1 },
  link: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14 },
  linkOn: { backgroundColor: Colors.lime },
  linkText: { color: Colors.lime, fontWeight: "700" },
  linkTextOn: { color: Colors.forestDeep },
  desktopMain: {
    flex: 1,
    backgroundColor: Colors.paper,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.line,
  },
});
