import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppBar } from "@/components/ui/AppBar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListRow } from "@/components/ui/list-row";
import {
  EmptyStateView,
  ErrorView,
  LoadingView,
} from "@/components/ui/state-views";
import { Spacing } from "@/constants/theme";
import { logAudit } from "@/data/audit-repository";
import {
  deleteFingerprint,
  listAllFingerprints,
} from "@/data/fingerprint-repository";
import { FingerprintScanner } from "@/services/fingerprint-scanner";
import type { Fingerprint } from "@/types/models";

export default function FingerprintsOverview() {
  const [fingerprints, setFingerprints] = useState<Fingerprint[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Fingerprint | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await listAllFingerprints();
    if (result.ok) {
      setFingerprints(result.value);
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

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      if (await FingerprintScanner.isConnected())
        await FingerprintScanner.deleteModel(pendingDelete.deviceSlot);
    } catch {
      // Sensor may be offline; the phone-side record is still removed.
    }
    const result = await deleteFingerprint(pendingDelete.id);
    if (result.ok)
      await logAudit("fingerprint.delete", { fingerprintId: pendingDelete.id });
    setBusy(false);
    setPendingDelete(null);
    load();
  };

  return (
    <ThemedView style={styles.page}>
      <AppBar
        title="Fingerprints"
        subtitle={fingerprints ? `${fingerprints.length} enrolled` : undefined}
        showBack
      />

      {fingerprints === null && !error ? (
        <LoadingView message="Loading fingerprints\u2026" />
      ) : error ? (
        <ErrorView message={error} onRetry={load} />
      ) : fingerprints!.length === 0 ? (
        <EmptyStateView
          icon="\uD83D\uDD90\uFE0F"
          title="No fingerprints enrolled"
          subtitle="Enroll fingerprints from a student's detail screen."
        />
      ) : (
        <FlatList
          data={fingerprints!}
          keyExtractor={(f) => String(f.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ListRow
              title={`${item.studentName} \u2014 ${item.fingerName}`}
              subtitle={`${item.studentCode} \u00B7 Sensor slot ${item.deviceSlot}`}
              onPress={() => router.push(`/students/${item.studentId}`)}
              trailing={
                <Button
                  label="Remove"
                  variant="text"
                  onPress={() => setPendingDelete(item)}
                />
              }
            />
          )}
        />
      )}

      <ConfirmDialog
        visible={!!pendingDelete}
        title="Remove this fingerprint?"
        confirmLabel="Remove"
        confirmVariant="danger"
        busy={busy}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      >
        <ThemedText type="body">
          {pendingDelete
            ? `${pendingDelete.fingerName} for ${pendingDelete.studentName} will be removed from both the sensor and this phone.`
            : ""}
        </ThemedText>
      </ConfirmDialog>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  list: { paddingBottom: Spacing.four },
});
