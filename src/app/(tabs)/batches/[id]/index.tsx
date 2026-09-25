import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import PageContainer from "@/components/PageContainer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppBar } from "@/components/ui/AppBar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListRow } from "@/components/ui/list-row";
import {
  EmptyStateView,
  ErrorView,
  LoadingView,
} from "@/components/ui/state-views";
import { Spacing } from "@/constants/theme";
import { logAudit } from "@/data/audit-repository";
import { deleteBatch, getBatch } from "@/data/batch-repository";
import { listStudents } from "@/data/student-repository";
import type { Batch, Student } from "@/types/models";

export default function BatchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const batchId = Number(id);

  const [batch, setBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [deleteVisible, setDeleteVisible] = useState(false);
  const [cascadeStudents, setCascadeStudents] = useState(false);
  const [cascadeAttendance, setCascadeAttendance] = useState(false);
  const [cascadeFingerprints, setCascadeFingerprints] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const [batchResult, studentsResult] = await Promise.all([
      getBatch(batchId),
      listStudents({ batchId }, 0, 100),
    ]);
    if (batchResult.ok) setBatch(batchResult.value);
    else setError(batchResult.failure.message);
    if (studentsResult.ok) setStudents(studentsResult.value.students);
  }, [batchId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteBatch(batchId, {
      cascadeStudents,
      cascadeAttendance: cascadeStudents && cascadeAttendance,
      cascadeFingerprints: cascadeStudents && cascadeFingerprints,
    });
    setDeleting(false);
    setDeleteVisible(false);
    if (result.ok) {
      await logAudit("batch.delete", {
        batchId,
        cascadeStudents,
        cascadeAttendance,
        cascadeFingerprints,
      });
      router.back();
    } else {
      setError(result.failure.message);
    }
  };

  if (error && !batch) {
    return (
      <ThemedView style={styles.page}>
        <AppBar title="Batch" showBack />
        <ErrorView message={error} onRetry={load} />
      </ThemedView>
    );
  }

  if (!batch) {
    return (
      <ThemedView style={styles.page}>
        <AppBar title="Batch" showBack />
        <LoadingView message="Loading batch\u2026" />
      </ThemedView>
    );
  }

  return (
    <>
      <AppBar
        title={batch.name}
        subtitle={batch.academicYear}
        showBack
        action={
          <View style={styles.headerActions}>
            <Button
              label="Edit"
              variant="text"
              onPress={() => router.push(`/batches/${batchId}/edit`)}
            />
          </View>
        }
      />
      <PageContainer scrollable={false}>
        <View style={styles.summaryRow}>
          <Badge
            label={batch.active ? "Active" : "Inactive"}
            tone={batch.active ? "success" : "warning"}
          />
          <Badge label={`${batch.studentCount} students`} tone="neutral" />
        </View>

        <ThemedText
          type="label"
          themeColor="textSecondary"
          style={styles.sectionLabel}
        >
          STUDENTS IN THIS BATCH
        </ThemedText>

        {students.length === 0 ? (
          <EmptyStateView
            icon="\uD83C\uDF93"
            title="No students yet"
            subtitle="Add students to this batch from the Students tab."
          />
        ) : (
          <FlatList
            data={students}
            keyExtractor={(s) => String(s.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <ListRow
                title={item.name}
                subtitle={`${item.code} \u00B7 ${item.guardianMobile ?? "No guardian mobile"}`}
                leading={
                  <Avatar name={item.name} uri={item.photoUri} size={40} />
                }
                onPress={() => router.push(`/students/${item.id}`)}
              />
            )}
          />
        )}

        <View style={styles.footer}>
          <Button
            label="Delete batch"
            variant="danger"
            onPress={() => setDeleteVisible(true)}
          />
        </View>

        <ConfirmDialog
          visible={deleteVisible}
          title="Delete this batch?"
          confirmLabel="Delete"
          confirmVariant="danger"
          busy={deleting}
          onCancel={() => setDeleteVisible(false)}
          onConfirm={handleDelete}
        >
          <ThemedText type="body" style={styles.dialogBody}>
            The batch itself will always be removed. Choose what else to remove
            with it:
          </ThemedText>
          <ToggleRow
            label="Remove students in this batch"
            value={cascadeStudents}
            onChange={setCascadeStudents}
          />
          <ToggleRow
            label="&#8230; and their attendance history"
            value={cascadeAttendance}
            onChange={setCascadeAttendance}
            disabled={!cascadeStudents}
          />
          <ToggleRow
            label="&#8230; and their fingerprint templates"
            value={cascadeFingerprints}
            onChange={setCascadeFingerprints}
            disabled={!cascadeStudents}
          />
        </ConfirmDialog>
      </PageContainer>
    </>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.toggleRow, disabled && styles.toggleRowDisabled]}
      onPress={() => !disabled && onChange(!value)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled }}
    >
      <ThemedText type="body" style={styles.toggleLabel}>
        {label}
      </ThemedText>
      <Checkbox checked={value} onChange={onChange} disabled={disabled} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerActions: { flexDirection: "row" },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  sectionLabel: { marginHorizontal: Spacing.four, marginBottom: Spacing.two },
  list: { paddingBottom: Spacing.three },
  footer: { padding: Spacing.four },
  dialogBody: { marginBottom: Spacing.two },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.two,
  },
  toggleRowDisabled: { opacity: 0.4 },
  toggleLabel: { flex: 1, marginRight: Spacing.two },
});
