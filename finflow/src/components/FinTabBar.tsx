import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  index: { on: "home", off: "home-outline" },
  cards: { on: "card", off: "card-outline" },
  activity: { on: "stats-chart", off: "stats-chart-outline" },
  profile: { on: "person", off: "person-outline" },
};

const LABELS: Record<string, string> = {
  index: "Home",
  cards: "Cards",
  activity: "Activity",
  profile: "Profile",
};

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
};

export function FinTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const icon = ICONS[route.name] ?? { on: "ellipse" as const, off: "ellipse-outline" as const };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={LABELS[route.name] ?? route.name}
              onPress={() => navigation.navigate(route.name)}
              style={styles.item}
            >
              <View style={[styles.iconWrap, focused && styles.iconOn]}>
                <Ionicons name={focused ? icon.on : icon.off} size={20} color={focused ? Colors.forestDeep : Colors.muted} />
              </View>
              <Text style={[styles.label, focused && styles.labelOn]}>{LABELS[route.name] ?? route.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.cream,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  bar: {
    flexDirection: "row",
    backgroundColor: Colors.forest,
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  item: { flex: 1, alignItems: "center", gap: 2 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  iconOn: { backgroundColor: Colors.lime },
  label: { color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: "700" },
  labelOn: { color: Colors.lime },
});
