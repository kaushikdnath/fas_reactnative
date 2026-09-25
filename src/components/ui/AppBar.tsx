import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type AppBarProps = {
  title?: string;
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
          {showBack ? (
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              hitSlop={10}
            >
              <MaterialIcons name="arrow-back" size={24} color={theme.text} />
            </Pressable>
          ) : (
            !title && (
              <Image
                source={require("@/assets/images/icons/icon.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            )
          )}

          <View style={styles.titleContainer}>
            {title ? (
              <Text style={[styles.brandTitle, { color: theme.text }]}>
                {title}
              </Text>
            ) : (
              <Text style={[styles.brandTitle, { color: theme.text }]}>
                Ankit <Text style={styles.fas}>FAS</Text>
              </Text>
            )}

            <Text style={[styles.brandSubtitle, { color: theme.text }]}>
              {subtitle ?? (!title && "Fingerprint Attendance System")}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          {action ?? (
            <Pressable
              style={styles.actionButton}
              onPress={() => {}}
              hitSlop={8}
            >
              <MaterialIcons
                name="notifications-none"
                size={25}
                color={theme.text}
              />
            </Pressable>
          )}
        </View>
      </View>
      <View style={styles.bottomShadow} />
    </SafeAreaView>
  );
}

export const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/");

const styles = StyleSheet.create({
  safeArea: {
    width: "100%",
  },
  appHeader: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    // borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#fefeff",
    // elevation: 2,
    position: "relative",
  },
  bottomShadow: {
    height: 0.2,
    backgroundColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
    fontSize: 24,
    fontWeight: "900",
    color: "#172B4D",
    lineHeight: 27,
  },
  fas: {
    color: "#2878D7",
  },
  brandSubtitle: {
    fontSize: 10,
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
  pageHeader: {
    minHeight: 52,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: Spacing.four,

    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 52,
    height: 52,
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
    fontSize: 10,
    marginTop: 1,
  },
  pageAction: {
    marginLeft: 8,
  },
});
