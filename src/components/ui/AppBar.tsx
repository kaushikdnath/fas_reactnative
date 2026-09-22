import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type AppBarProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  action?: ReactNode;
  onNotificationPress?: () => void;
  onMenuPress?: () => void;
};

export function AppBar({
  title,
  subtitle,
  showBack = false,
  action,
  onNotificationPress,
  onMenuPress,
}: AppBarProps) {
  const theme = useTheme();

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      {/* ─────────────────────────────────────────
          Application Header
         ───────────────────────────────────────── */}
      <View
        style={[
          styles.appHeader,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
          },
        ]}
      >
        {/* Brand */}
        <View style={styles.brand}>
          <Image
            source={require("@/assets/images/icons/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.titleContainer}>
            <Text style={styles.brandTitle}>
              Ankit <Text style={styles.fas}>FAS</Text>
            </Text>

            <Text style={styles.brandSubtitle}>
              Fingerprint Attendance System
            </Text>
          </View>
        </View>

        {/* Global actions */}
        <View style={styles.actions}>
          <Pressable
            style={styles.actionButton}
            onPress={onNotificationPress}
            hitSlop={8}
          >
            <MaterialIcons
              name="notifications-none"
              size={25}
              color={theme.text}
            />
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={onMenuPress}
            hitSlop={8}
          >
            <MaterialIcons name="more-vert" size={25} color={theme.text} />
          </Pressable>
        </View>
      </View>

      {/* ─────────────────────────────────────────
          Page Header
         ───────────────────────────────────────── */}
      <View
        style={[
          styles.pageHeader,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
          },
        ]}
      >
        {showBack && (
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={10}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
        )}

        <View style={styles.pageTitleContainer}>
          <Text
            style={[styles.pageTitle, { color: theme.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>

          {subtitle && (
            <Text
              style={[styles.pageSubtitle, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {action && <View style={styles.pageAction}>{action}</View>}
      </View>
    </SafeAreaView>
  );
}

export const goBack = () => router.back();

const styles = StyleSheet.create({
  safeArea: {
    width: "100%",
  },

  /* ─────────────────────────────────────────
     Application Header
     ───────────────────────────────────────── */

  appHeader: {
    height: 64,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 14,

    borderBottomWidth: StyleSheet.hairlineWidth,

    elevation: 2,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  logo: {
    width: 52,
    height: 52,
  },

  titleContainer: {
    marginLeft: 8,
  },

  brandTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#172B4D",
    lineHeight: 23,
  },

  fas: {
    color: "#2878D7",
  },

  brandSubtitle: {
    fontSize: 8.5,
    color: "#64748B",
    marginTop: 1,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
  },

  actionButton: {
    width: 42,
    height: 42,

    alignItems: "center",
    justifyContent: "center",
  },

  /* ─────────────────────────────────────────
     Page Header
     ───────────────────────────────────────── */

  pageHeader: {
    minHeight: 52,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: Spacing.four,

    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  backButton: {
    width: 40,
    height: 40,

    alignItems: "center",
    justifyContent: "center",

    marginLeft: -8,
    marginRight: 4,
  },

  pageTitleContainer: {
    flex: 1,
  },

  pageTitle: {
    fontSize: 23,
    fontWeight: "700",
  },

  pageSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },

  pageAction: {
    marginLeft: 8,
  },
});
