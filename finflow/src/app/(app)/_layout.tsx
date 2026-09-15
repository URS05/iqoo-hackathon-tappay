import { Tabs } from "expo-router";

import { FinTabBar } from "@/components/FinTabBar";
import { useChrome } from "@/layout/ChromeContext";

export default function AppTabs() {
  const { mode } = useChrome();
  return (
    <Tabs
      tabBar={mode === "desktop" ? () => null : (props) => <FinTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { position: "relative", backgroundColor: "transparent", borderTopWidth: 0, elevation: 0 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="cards" options={{ title: "Cards" }} />
      <Tabs.Screen name="activity" options={{ title: "Activity" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
