import { NativeTabs } from "expo-router/unstable-native-tabs";

import { useTheme } from "@/hooks/use-theme";

/**
 * Native bottom tab bar (Android: Material 3 BottomNavigationView,
 * powered by expo-router's native-tabs integration) -- styled with the
 * dynamic theme tokens for seamless dark/light and palette switching.
 */
export default function TabLayout() {
  const colors = useTheme();

  return (
    <NativeTabs
      backgroundColor={colors.surface}
      tintColor={colors.tabBarIconSelected}
      indicatorColor={colors.tabBarIndicator}
      iconColor={{
        default: colors.tabBarIcon,
        selected: colors.tabBarIconSelected,
      }}
      labelStyle={{
        default: { color: colors.textSecondary },
        selected: { color: colors.tabBarIconSelected, fontWeight: "600" },
      }}
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
