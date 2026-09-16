import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DatabaseProvider, LoadingProvider } from "@/context";
import { ThemeModeProvider, useThemeMode } from "@/hooks/theme-mode-context";
import { useTheme } from "@/hooks/use-theme";

/**
 * Root stack. The primary five sections live inside the `(tabs)` group
 * (its own layout renders the native bottom tab bar); routes declared
 * here directly -- device, fingerprints, sms-log -- are full-screen
 * pushes reachable from Settings/Dashboard/Student detail and render
 * without the tab bar, with their own in-screen AppBar back button.
 */
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
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.background },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="device" options={{ presentation: "card" }} />
            <Stack.Screen
              name="fingerprints"
              options={{ presentation: "card" }}
            />
            <Stack.Screen name="sms-log" options={{ presentation: "card" }} />
          </Stack>
        </DatabaseProvider>
      </LoadingProvider>
    </>
  );
}
