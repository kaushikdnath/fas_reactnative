import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DatabaseProvider, LoadingProvider } from "@/context";
import { ThemeModeProvider, useThemeMode } from "@/hooks/theme-mode-context";
import { useTheme } from "@/hooks/use-theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeModeProvider>
        <RootStack />
      </ThemeModeProvider>
    </SafeAreaProvider>
  );
}

function RootStack() {
  const { resolvedScheme } = useThemeMode();
  const theme = useTheme();

  return (
    <>
      <StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
      <LoadingProvider>
        <DatabaseProvider>
          {/* <AppHeader /> */}
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.background },
            }}
          >
            {/* <Stack.Screen name="(tabs)" /> */}
            {/* <Stack.Screen name="device" options={{ presentation: "card" }} /> */}
            {/* <Stack.Screen
              name="fingerprints"
              options={{ presentation: "card" }}
            /> */}
            {/* <Stack.Screen name="sms-log" options={{ presentation: "card" }} /> */}
          </Stack>
        </DatabaseProvider>
      </LoadingProvider>
    </>
  );
}
