import { Spacing } from "@/constants/theme";
import { ReactNode, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
  onRefresh?: () => Promise<void> | void;
  scrollable?: boolean;
};
export default function PageHeader({
  title,
  children,
  onRefresh,
  scrollable = true,
}: PageHeaderProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
    }
  };
  const content = (
    <>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
      </View>

      {children}
    </>
  );
  if (!scrollable) {
    return <ThemedView style={styles.page}>{content}</ThemedView>;
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
      >
        <View style={[styles.header, { paddingTop: Spacing.two }]}>
          <ThemedText type="title" style={styles.title}>
            {title}
          </ThemedText>
        </View>
        {children}
      </ScrollView>
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1 },
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
