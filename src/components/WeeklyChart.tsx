import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, Radius } from "@/constants/theme";

type Props = {
  days: string[];
  income: number[];
  spend: number[];
  demo?: boolean;
};

export function WeeklyChart({ days, income, spend, demo }: Props) {
  const [tab, setTab] = useState<"both" | "in" | "out">("both");
  const max = Math.max(1, ...income, ...spend);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>Analytics</Text>
        <View style={styles.tabs}>
          {(["both", "in", "out"] as const).map((t) => (
            <Pressable
              key={t}
              accessibilityRole="button"
              accessibilityLabel={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabOn]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>
                {t === "both" ? "All" : t === "in" ? "Income" : "Spend"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {demo ? <Text style={styles.demo}>Sample week — live bars appear after your first tap</Text> : null}
      <View style={styles.chart}>
        {days.map((d, i) => (
          <View key={`${d}-${i}`} style={styles.col}>
            <View style={styles.bars}>
              {(tab === "both" || tab === "in") && (
                <View style={[styles.bar, styles.in, { height: Math.max(8, (income[i] / max) * 92) }]} />
              )}
              {(tab === "both" || tab === "out") && (
                <View style={[styles.bar, styles.out, { height: Math.max(8, (spend[i] / max) * 92) }]} />
              )}
            </View>
            <Text style={styles.day}>{d}</Text>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legRow}>
          <View style={[styles.dot, { backgroundColor: Colors.forest }]} />
          <Text style={styles.leg}>Income</Text>
        </View>
        <View style={styles.legRow}>
          <View style={[styles.dot, { backgroundColor: Colors.limeDeep }]} />
          <Text style={styles.leg}>Spending</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.paper,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.line,
    gap: 12,
  },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "800", color: Colors.ink },
  tabs: { flexDirection: "row", backgroundColor: Colors.creamDark, borderRadius: 999, padding: 3, gap: 2 },
  tab: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  tabOn: { backgroundColor: Colors.forest },
  tabText: { fontSize: 11, fontWeight: "700", color: Colors.muted },
  tabTextOn: { color: Colors.lime },
  demo: { color: Colors.mutedSoft, fontSize: 12 },
  chart: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 120, paddingHorizontal: 4 },
  col: { alignItems: "center", gap: 6, flex: 1 },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 100 },
  bar: { width: 8, borderRadius: 8 },
  in: { backgroundColor: Colors.forest },
  out: { backgroundColor: Colors.limeDeep },
  day: { fontSize: 11, color: Colors.muted, fontWeight: "700" },
  legend: { flexDirection: "row", gap: 16 },
  legRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  leg: { color: Colors.muted, fontSize: 12, fontWeight: "600" },
});
