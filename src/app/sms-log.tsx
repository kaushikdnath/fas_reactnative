import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { AppBar } from "@/components/ui/AppBar";
import { Badge } from "@/components/ui/badge";
import { ListRow } from "@/components/ui/list-row";
import {
  EmptyStateView,
  ErrorView,
  LoadingView,
} from "@/components/ui/state-views";
import { Spacing } from "@/constants/theme";
import { listSmsLogs } from "@/data/sms-repository";
import type { SmsLog } from "@/types/models";

export default function SmsLogScreen() {
  const [logs, setLogs] = useState<SmsLog[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await listSmsLogs(200);
    if (result.ok) {
      setLogs(result.value);
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

  return (
    <ThemedView style={styles.page}>
      <AppBar
        title="SMS log"
        subtitle={logs ? `${logs.length} messages` : undefined}
        showBack
      />

      {logs === null && !error ? (
        <LoadingView message="Loading SMS log\u2026" />
      ) : error ? (
        <ErrorView message={error} onRetry={load} />
      ) : logs!.length === 0 ? (
        <EmptyStateView
          icon="\uD83D\uDCE9"
          title="No SMS sent yet"
          subtitle="Messages sent on attendance events will appear here."
        />
      ) : (
        <FlatList
          data={logs!}
          keyExtractor={(l) => String(l.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ListRow
              title={item.numbers}
              subtitle={`${item.message}${item.error ? ` \u2014 ${item.error}` : ""}`}
              trailing={
                <Badge
                  label={item.status}
                  tone={item.status === "SENT" ? "success" : "error"}
                />
              }
            />
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  list: { paddingBottom: Spacing.four },
});
