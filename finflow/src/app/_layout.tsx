import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { PhoneFrame } from "@/components/PhoneFrame";
import { Colors } from "@/constants/theme";
import { ChromeProvider } from "@/layout/ChromeContext";
import { SessionProvider } from "@/session/SessionContext";

export default function RootLayout() {
  return (
    <SessionProvider>
      <ChromeProvider>
        <StatusBar style="dark" />
        <PhoneFrame>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.cream },
              animation: "fade",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(app)" />
            <Stack.Screen name="merchant/index" />
            <Stack.Screen name="admin/index" />
            <Stack.Screen name="user/index" />
          </Stack>
        </PhoneFrame>
      </ChromeProvider>
    </SessionProvider>
  );
}
