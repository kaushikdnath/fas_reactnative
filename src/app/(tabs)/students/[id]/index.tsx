import { useCallback, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { deleteStudent, getStudent, moveStudentToBatch } from '@/data/student-repository';
import { listBatches } from '@/data/batch-repository';
import { deleteFingerprint, listFingerprintsForStudent } from '@/data/fingerprint-repository';
import { historyForStudent } from '@/data/attendance-repository';
import { logAudit } from '@/data/audit-repository';
import { FingerprintScanner } from '@/services/fingerprint-scanner';
import { AppBar, goBack } from '@/components/ui/app-bar';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErrorView, LoadingView } from '@/components/ui/state-views';
import { ListRow } from '@/components/ui/list-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import type { AttendanceRecord, Batch, Fingerprint, Student } from '@/types/models';

export default function StudentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const studentId = Number(id);

  const [student, setStudent] = useState<Student | null>(null);
  const [fingerprints, setFingerprints] = useState<Fingerprint[]>([]);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [moveVisible, setMoveVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [cascadeAttendance, setCascadeAttendance] = useState(false);
  const [cascadeFingerprints, setCascadeFingerprints] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [s, fps, hist, b] = await Promise.all([
      getStudent(studentId),
      listFingerprintsForStudent(studentId),
      historyForStudent(studentId, 10),
      listBatches(false),
    ]);
    if (s.ok) setStudent(s.value); else setError(s.failure.message);
    if (fps.ok) setFingerprints(fps.value);
    if (hist.ok) setHistory(hist.value);
    if (b.ok) setBatches(b.value);
  }, [studentId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleMove = async (batchId: number) => {
    setBusy(true);
    const result = await moveStudentToBatch(studentId, batchId);
    setBusy(false);
    setMoveVisible(false);
    if (result.ok) { await logAudit('student.move', { studentId, batchId }); load(); }
  };

  const handleDeleteFingerprint = async (fp: Fingerprint) => {
    // Clear the physical sensor slot first (best-effort -- it's just a
    // disposable cache), then remove the phone-side master record.
    try {
      if (await FingerprintScanner.isConnected()) await FingerprintScanner.deleteModel(fp.deviceSlot);
    } catch {
      // Sensor may be disconnected; the SQLite row is still removed below.
    }
    const result = await deleteFingerprint(fp.id);
    if (result.ok) { await logAudit('fingerprint.delete', { fingerprintId: fp.id, studentId }); load(); }
  };

  const handleDeleteStudent = async () => {
    setBusy(true);
    const result = await deleteStudent(studentId, { cascadeAttendance, cascadeFingerprints });
    setBusy(false);
    setDeleteVisible(false);
    if (result.ok) { await logAudit('student.delete', { studentId, cascadeAttendance, cascadeFingerprints }); router.back(); }
    else setError(result.failure.message);
  };

  if (error && !student) {
    return (
      <ThemedView style={styles.page}>
        <AppBar title="Student" onBack={goBack} />
        <ErrorView message={error} onRetry={load} />
      </ThemedView>
    );
  }
  if (!student) {
    return (
      <ThemedView style={styles.page}>
        <AppBar title="Student" onBack={goBack} />
        <LoadingView message="Loading student\u2026" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.page}>
      <AppBar
        title={student.name}
        subtitle={student.code}
        onBack={goBack}
        action={<Button label="Edit" variant="text" onPress={() => router.push(`/students/${studentId}/edit`)} />}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Avatar name={student.name} uri={student.photoUri} size={80} />
          <View style={styles.badges}>
            <Badge label={student.batchName ?? 'Unassigned'} tone="neutral" />
            <Badge label={student.active ? 'Active' : 'Inactive'} tone={student.active ? 'success' : 'warning'} />
            <Badge label={`${fingerprints.length}/5 fingerprints`} tone={fingerprints.length > 0 ? 'success' : 'neutral'} />
          </View>
        </View>

        <InfoRow label="Guardian" value={student.guardianName} />
        <InfoRow label="Relationship" value={student.guardianRelationship || '\u2014'} />
        <InfoRow label="Guardian mobile" value={student.guardianMobile || '\u2014'} />
        <InfoRow label="Student mobile" value={student.studentMobile || '\u2014'} />
        <InfoRow label="Address" value={student.address || '\u2014'} />

        <View style={styles.actionsRow}>
          <Button label="Move batch" variant="outlined" onPress={() => setMoveVisible(true)} style={styles.actionBtn} />
          <Button label="Enroll fingerprint" variant="tonal" onPress={() => router.push(`/students/${studentId}/enroll`)} style={styles.actionBtn} />
        </View>

        <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>FINGERPRINTS</ThemedText>
        {fingerprints.length === 0 ? (
          <ThemedText type="body" themeColor="textSecondary" style={styles.emptyInline}>None enrolled yet.</ThemedText>
        ) : (
          fingerprints.map((fp) => (
            <ListRow
              key={fp.id}
              title={fp.fingerName}
              subtitle={`Sensor slot ${fp.deviceSlot}`}
              trailing={<Button label="Remove" variant="text" onPress={() => handleDeleteFingerprint(fp)} />}
            />
          ))
        )}

        <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>RECENT ATTENDANCE</ThemedText>
        {history.length === 0 ? (
          <ThemedText type="body" themeColor="textSecondary" style={styles.emptyInline}>No attendance recorded yet.</ThemedText>
        ) : (
          history.map((h) => (
            <ListRow key={h.id} title={h.attendanceDate} subtitle={`In ${fmtTime(h.inTime)} \u00B7 Out ${fmtTime(h.outTime)}`} />
          ))
        )}

        <Button label="Delete student" variant="danger" onPress={() => setDeleteVisible(true)} style={styles.deleteBtn} />
      </ScrollView>

      <Modal visible={moveVisible} transparent animationType="fade" onRequestClose={() => setMoveVisible(false)}>
        <View style={styles.backdrop}>
          <ThemedView type="surface" style={styles.moveCard}>
            <ThemedText type="subtitle" style={styles.moveTitle}>Move to batch</ThemedText>
            <FlatList
              data={batches.filter((b) => b.id !== student.batchId)}
              keyExtractor={(b) => String(b.id)}
              style={styles.moveList}
              renderItem={({ item }) => (
                <ListRow title={item.name} subtitle={item.academicYear} onPress={() => handleMove(item.id)} />
              )}
            />
            <Button label="Cancel" variant="text" onPress={() => setMoveVisible(false)} />
          </ThemedView>
        </View>
      </Modal>

      <ConfirmDialog
        visible={deleteVisible}
        title="Delete this student?"
        confirmLabel="Delete"
        confirmVariant="danger"
        busy={busy}
        onCancel={() => setDeleteVisible(false)}
        onConfirm={handleDeleteStudent}>
        <ThemedText type="body" style={styles.dialogBody}>{student.name} will be removed. Choose what else to remove:</ThemedText>
        <ToggleRow label="Attendance history" value={cascadeAttendance} onChange={setCascadeAttendance} />
        <ToggleRow label="Fingerprint templates" value={cascadeFingerprints} onChange={setCascadeFingerprints} />
      </ConfirmDialog>
    </ThemedView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.infoLabel}>{label}</ThemedText>
      <ThemedText type="body">{value}</ThemedText>
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <ThemedText type="body" style={styles.toggleLabel}>{label}</ThemedText>
      <Button label={value ? 'On' : 'Off'} variant={value ? 'tonal' : 'outlined'} onPress={() => onChange(!value)} />
    </View>
  );
}

function fmtTime(iso: string | null) {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: Spacing.four, paddingBottom: Spacing.six },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginBottom: Spacing.four },
  badges: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  infoRow: { marginBottom: Spacing.two },
  infoLabel: { marginBottom: 2 },
  actionsRow: { flexDirection: 'row', gap: Spacing.two, marginVertical: Spacing.three },
  actionBtn: { flex: 1 },
  sectionLabel: { marginTop: Spacing.three, marginBottom: Spacing.two },
  emptyInline: { marginBottom: Spacing.two },
  deleteBtn: { marginTop: Spacing.five },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.four },
  moveCard: { borderRadius: Radius.xlarge, padding: Spacing.four, maxHeight: '70%' },
  moveTitle: { marginBottom: Spacing.two },
  moveList: { marginBottom: Spacing.two },
  dialogBody: { marginBottom: Spacing.two },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.two },
  toggleLabel: { flex: 1, marginRight: Spacing.two },
});
