import { Spacing } from "@/constants/theme";
import { ReactNode, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet } from "react-native";
import { ThemedView } from "./themed-view";

type PageContainerProps = {
  children?: ReactNode;
  onRefresh?: () => Promise<void> | void;
  scrollable?: boolean;
};
export default function PageContainer({
  children,
  onRefresh,
  scrollable = true,
}: PageContainerProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
    }
  };
  if (!scrollable) {
    return <ThemedView style={styles.page}>{children}</ThemedView>;
  }
  return (
    <ThemedView style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          ) : undefined
        }
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, paddingTop: 25 },
  scroll: { paddingBottom: 96 },
  header: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    gap: 2,
  },
  title: {
    fontSize: 24,
  },
});
