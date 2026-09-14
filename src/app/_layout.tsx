import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { Colors } from "@/constants/theme";
import { SessionProvider } from "@/session/SessionContext";

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.bg },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: "TapPay", headerShown: false }} />
        <Stack.Screen name="user/index" options={{ title: "User wallet" }} />
        <Stack.Screen name="merchant/index" options={{ title: "Merchant POS" }} />
        <Stack.Screen name="admin/index" options={{ title: "Admin" }} />
      </Stack>
    </SessionProvider>
  );
}
