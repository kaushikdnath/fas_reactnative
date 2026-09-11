import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function LoadingView({ message }: { message?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
      {message ? (
        <ThemedText
          type="body"
          themeColor="textSecondary"
          style={styles.spaceTop}
        >
          {message}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ThemedText style={{ fontSize: 40 }}>{"\u26A0\uFE0F"}</ThemedText>
      <ThemedText
        type="body"
        style={[styles.spaceTop, styles.centerText, { color: theme.error }]}
      >
        {message}
      </ThemedText>
      {onRetry ? (
        <Button
          label="Retry"
          variant="tonal"
          onPress={onRetry}
          style={styles.spaceTopLg}
        />
      ) : null}
    </View>
  );
}

export function EmptyStateView({
  title,
  subtitle,
  actionLabel,
  onAction,
  icon = "\uD83D\uDCED",
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
}) {
  return (
    <View style={styles.center}>
      <ThemedText style={{ fontSize: 40, padding: 10 }}>
        {unicodeToEmoji(icon)}
      </ThemedText>
      <ThemedText type="subtitle" style={styles.spaceTop}>
        {title}
      </ThemedText>
      {subtitle ? (
        <ThemedText
          type="body"
          themeColor="textSecondary"
          style={[styles.centerText, styles.spaceSmall]}
        >
          {subtitle}
        </ThemedText>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          style={styles.spaceTopLg}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.five,
  },
  centerText: { textAlign: "center" },
  spaceTop: { marginTop: Spacing.three },
  spaceTopLg: { marginTop: Spacing.four },
  spaceSmall: { marginTop: Spacing.one },
});
const unicodeToEmoji = (unicode: string) => {
  const value = !unicode
    ? "U+26A0"
    : !unicode.trim().startsWith("U+")
      ? "U+26A0"
      : unicode.trim();
  const codePoint = parseInt(value.substring(2), 16);
  if (Number.isNaN(codePoint)) return "";
  return String.fromCodePoint(codePoint);
};
