import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Badge } from "@/components/ui/badge";
import { Fab } from "@/components/ui/fab";
import { ListRow } from "@/components/ui/list-row";
import {
  EmptyStateView,
  ErrorView,
  LoadingView,
} from "@/components/ui/state-views";
import { Spacing } from "@/constants/theme";
import { listBatches } from "@/data/batch-repository";
import type { Batch } from "@/types/models";

export default function BatchList() {
  const [batches, setBatches] = useState<Batch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const result = await listBatches(true);
    if (result.ok) {
      setBatches(result.value);
      setError(null);
    } else {
      setError(result.failure.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.page}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <ThemedText type="title">Batches</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          {batches
            ? `${batches.length} batch${batches.length === 1 ? "" : "es"}`
            : " "}
        </ThemedText>
      </View>

      {batches === null && !error ? (
        <LoadingView message="Loading batches\u2026" />
      ) : error ? (
        <ErrorView message={error} onRetry={load} />
      ) : batches!.length === 0 ? (
        <EmptyStateView
          icon="U+1F600"
          title="No batches yet"
          subtitle="Create your first batch to start enrolling students."
          actionLabel="Create batch"
          onAction={() => router.push("/batches/new")}
        />
      ) : (
        <FlatList
          data={batches!}
          keyExtractor={(b) => String(b.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={item.academicYear}
              onPress={() => router.push(`/batches/${item.id}`)}
              trailing={
                <View style={styles.trailing}>
                  <ThemedText type="bodyBold">{item.studentCount}</ThemedText>
                  {!item.active ? (
                    <Badge label="Inactive" tone="warning" />
                  ) : null}
                </View>
              }
            />
          )}
        />
      )}

      <Fab onPress={() => router.push("/batches/new")} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    gap: 2,
  },
  list: { paddingBottom: 96 },
  trailing: { alignItems: "flex-end", gap: 4 },
});
