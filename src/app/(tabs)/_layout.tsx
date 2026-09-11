import { NativeTabs } from "expo-router/unstable-native-tabs";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

/**
 * Native bottom tab bar (Android: Material 3 BottomNavigationView,
 * powered by expo-router's native-tabs integration) -- no extra
 * navigation or icon-set dependency required. `md` icon names are
 * Android Material Symbols, resolved by the OS at runtime.
 */
export default function TabLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" || !scheme ? "light" : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.surface}
      tintColor={colors.primary}
      labelStyle={{ color: colors.textSecondary }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon md="grid_view" />
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="batches">
        <NativeTabs.Trigger.Icon md="groups" />
        <NativeTabs.Trigger.Label>Batches</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="students">
        <NativeTabs.Trigger.Icon md="school" />
        <NativeTabs.Trigger.Label>Students</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="attendance">
        <NativeTabs.Trigger.Icon md="fact_check" />
        <NativeTabs.Trigger.Label>Attendance</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon md="settings" />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
