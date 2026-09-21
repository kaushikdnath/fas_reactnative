import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import PageHeader from "@/components/PageHeader";
import { ThemedText } from "@/components/themed-text";
import { Badge } from "@/components/ui/badge";
import { ListRow } from "@/components/ui/list-row";
import { StatCard } from "@/components/ui/stat-card";
import { Spacing } from "@/constants/theme";
import { dashboardStats, todayAttendance } from "@/data/attendance-repository";
import { FingerprintScanner } from "@/services/fingerprint-scanner";
import { getInstitutionName } from "@/services/settings";
import type { AttendanceRecord, DashboardStats } from "@/types/models";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<AttendanceRecord[]>([]);
  const [scannerConnected, setScannerConnected] = useState<boolean | null>(
    null,
  );
  const [institutionName, setInstitutionName] = useState("");

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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <PageHeader title={institutionName || "Dashboard"} onRefresh={load}>
      <View style={styles.grid}>
        <StatCard
          label="Students"
          value={stats ? String(stats.students) : "\u2014"}
          tone="primary"
          onPress={() => router.push("/students")}
        />
        <StatCard
          label="Batches"
          value={stats ? String(stats.batches) : "\u2014"}
          tone="secondary"
          onPress={() => router.push("/batches")}
        />
        <StatCard
          label="Present today"
          value={stats ? String(stats.presentToday) : "\u2014"}
          tone="success"
          onPress={() => router.push("/attendance")}
        />
        <StatCard
          label="Failed SMS"
          value={stats ? String(stats.pendingSms) : "\u2014"}
          tone={stats && stats.pendingSms > 0 ? "error" : "neutral"}
          onPress={() => router.push("/sms-log")}
        />
      </View>

      <ListRow
        title="Fingerprint scanner"
        subtitle={
          scannerConnected === null
            ? "Checking\u2026"
            : scannerConnected
              ? "Connected"
              : "Not connected"
        }
        trailing={
          <Badge
            label={scannerConnected ? "Online" : "Offline"}
            tone={scannerConnected ? "success" : "neutral"}
          />
        }
        onPress={() => router.push("/device")}
      />
      <ListRow
        title="Manage all fingerprints"
        subtitle="View or remove enrolled templates"
        onPress={() => router.push("/fingerprints")}
      />

      <ThemedText
        type="label"
        themeColor="textSecondary"
        style={styles.sectionLabel}
      >
        RECENT ACTIVITY
      </ThemedText>
      {recent.length === 0 ? (
        <ThemedText
          type="body"
          themeColor="textSecondary"
          style={styles.emptyInline}
        >
          No attendance recorded yet today.
        </ThemedText>
      ) : (
        recent.map((r) => (
          <ListRow
            key={r.id}
            title={r.studentName}
            subtitle={`${r.batchName} \u00B7 ${r.outTime ? "Checked out" : "Checked in"}`}
            onPress={() => router.push(`/students/${r.studentId}`)}
          />
        ))
      )}
    </PageHeader>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  sectionLabel: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  emptyInline: { marginHorizontal: Spacing.four },
});
