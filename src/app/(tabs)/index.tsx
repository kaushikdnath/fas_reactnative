import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dashboardStats, todayAttendance } from '@/data/attendance-repository';
import { FingerprintScanner } from '@/services/fingerprint-scanner';
import { getInstitutionName } from '@/services/settings';
import { Badge } from '@/components/ui/badge';
import { ListRow } from '@/components/ui/list-row';
import { StatCard } from '@/components/ui/stat-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { AttendanceRecord, DashboardStats } from '@/types/models';

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<AttendanceRecord[]>([]);
  const [scannerConnected, setScannerConnected] = useState<boolean | null>(null);
  const [institutionName, setInstitutionName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [statsResult, attendanceResult, connected, name] = await Promise.all([
      dashboardStats(),
      todayAttendance(),
      FingerprintScanner.isConnected().catch(() => false),
      getInstitutionName(),
    ]);
    if (statsResult.ok) setStats(statsResult.value);
    if (attendanceResult.ok) setRecent(attendanceResult.value.slice(0, 6));
    setScannerConnected(connected);
    setInstitutionName(name);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ThemedView style={styles.page}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
          <ThemedText type="small" themeColor="textSecondary">{institutionName || 'Attendance Manager'}</ThemedText>
          <ThemedText type="title">Dashboard</ThemedText>
        </View>

        <View style={styles.grid}>
          <StatCard label="Students" value={stats ? String(stats.students) : '\u2014'} tone="primary" onPress={() => router.push('/students')} />
          <StatCard label="Batches" value={stats ? String(stats.batches) : '\u2014'} tone="secondary" onPress={() => router.push('/batches')} />
          <StatCard label="Present today" value={stats ? String(stats.presentToday) : '\u2014'} tone="success" onPress={() => router.push('/attendance')} />
          <StatCard label="Failed SMS" value={stats ? String(stats.pendingSms) : '\u2014'} tone={stats && stats.pendingSms > 0 ? 'error' : 'neutral'} onPress={() => router.push('/sms-log')} />
        </View>

        <ListRow
          title="Fingerprint scanner"
          subtitle={scannerConnected === null ? 'Checking\u2026' : scannerConnected ? 'Connected' : 'Not connected'}
          trailing={<Badge label={scannerConnected ? 'Online' : 'Offline'} tone={scannerConnected ? 'success' : 'neutral'} />}
          onPress={() => router.push('/device')}
        />
        <ListRow title="Manage all fingerprints" subtitle="View or remove enrolled templates" onPress={() => router.push('/fingerprints')} />

        <ThemedText type="label" themeColor="textSecondary" style={styles.sectionLabel}>RECENT ACTIVITY</ThemedText>
        {recent.length === 0 ? (
          <ThemedText type="body" themeColor="textSecondary" style={styles.emptyInline}>No attendance recorded yet today.</ThemedText>
        ) : (
          recent.map((r) => (
            <ListRow
              key={r.id}
              title={r.studentName}
              subtitle={`${r.batchName} \u00B7 ${r.outTime ? 'Checked out' : 'Checked in'}`}
              onPress={() => router.push(`/students/${r.studentId}`)}
            />
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  scroll: { paddingBottom: 96 },
  header: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.three, gap: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, paddingHorizontal: Spacing.four, marginBottom: Spacing.three },
  sectionLabel: { marginHorizontal: Spacing.four, marginTop: Spacing.two, marginBottom: Spacing.two },
  emptyInline: { marginHorizontal: Spacing.four },
});
