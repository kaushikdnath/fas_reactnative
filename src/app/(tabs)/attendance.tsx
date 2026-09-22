import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PageContainer from "@/components/PageContainer";
import { ThemedText } from "@/components/themed-text";
import { AppBar } from "@/components/ui/AppBar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ListRow } from "@/components/ui/list-row";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyStateView } from "@/components/ui/state-views";
import { Spacing } from "@/constants/theme";
import { recordScan, todayAttendance } from "@/data/attendance-repository";
import { logAudit } from "@/data/audit-repository";
import { findStudentBySlot, listStudents } from "@/data/student-repository";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  AS608_EVENTS,
  FingerprintScanner,
} from "@/services/fingerprint-scanner";
import { notifyAttendance } from "@/services/sms";
import type { AttendanceRecord, Student } from "@/types/models";

type Mode = "scan" | "manual";
type ScanState = "idle" | "scanning" | "success" | "error";

export default function Attendance() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("scan");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [statusText, setStatusText] = useState(
    'Tap "Scan fingerprint" to begin',
  );
  const [resultLine, setResultLine] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [searchResults, setSearchResults] = useState<Student[]>([]);

  const [today, setToday] = useState<AttendanceRecord[]>([]);

  const loadToday = useCallback(async () => {
    const result = await todayAttendance();
    if (result.ok) setToday(result.value);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadToday();
    }, [loadToday]),
  );

  useEffect(() => {
    if (mode !== "manual" || !debouncedQuery.trim()) {
      setSearchResults([]);
      return;
    }
    listStudents({ query: debouncedQuery, status: "active" }, 0, 20).then(
      (r) => {
        if (r.ok) setSearchResults(r.value.students);
      },
    );
  }, [mode, debouncedQuery]);

  useEffect(() => {
    if (!FingerprintScanner.events) return;
    const sub = FingerprintScanner.events.addListener(
      AS608_EVENTS.status,
      (e: { message: string }) => {
        if (scanState === "scanning") setStatusText(e.message);
      },
    );
    return () => sub.remove();
  }, [scanState]);

  const finalizeAttendance = async (
    student: Student,
    confidence: number | null,
  ) => {
    const result = await recordScan(student.id, confidence ?? 0);
    if (!result.ok) {
      if (result.failure.message === "already-out") {
        setResultLine(`${student.name} has already checked in and out today.`);
      } else {
        setResultLine(result.failure.message);
      }
      return;
    }
    setResultLine(
      `${student.name} \u2014 checked ${result.value.direction === "IN" ? "in" : "out"}`,
    );
    await logAudit("attendance.record", {
      studentId: student.id,
      direction: result.value.direction,
      method: confidence !== null ? "fingerprint" : "manual",
    });
    await notifyAttendance({
      studentId: student.id,
      studentName: student.name,
      guardianMobile: student.guardianMobile,
      direction: result.value.direction,
      time:
        result.value.direction === "IN"
          ? result.value.record.inTime!
          : result.value.record.outTime!,
    });
    loadToday();
  };

  const handleScan = async () => {
    setScanState("scanning");
    setResultLine(null);
    setStatusText("Place finger on sensor\u2026");
    try {
      const connected = await FingerprintScanner.isConnected();
      if (!connected)
        throw new Error(
          "Scanner not connected -- open the Device screen to connect it.",
        );

      const match = await FingerprintScanner.identify(true);
      if (!match) {
        setScanState("error");
        setStatusText("No match found -- try again or use manual entry.");
        return;
      }

      const studentResult = await findStudentBySlot(match.id);
      if (!studentResult.ok) {
        setScanState("error");
        setStatusText(studentResult.failure.message);
        return;
      }

      setScanState("success");
      await finalizeAttendance(studentResult.value, match.confidence);
      setStatusText("Ready for next scan");
      setScanState("idle");
    } catch (e) {
      setScanState("error");
      setStatusText(e instanceof Error ? e.message : "Scan failed");
    }
  };

  const handleManualPick = async (student: Student) => {
    await finalizeAttendance(student, null);
    setQuery("");
    setSearchResults([]);
  };

  return (
    <>
      <AppBar title="Attendance" subtitle="Record student attendance" />
      <PageContainer>
        <View
          style={{
            flexDirection: "row",
            marginBottom: 20,
            paddingHorizontal: Spacing.three,
          }}
        >
          <Chip
            label="Fingerprint scan"
            key="scan"
            selected={mode === "scan"}
            onPress={() => setMode("scan")}
            styleCss={{ flex: 1, width: "auto", height: 40 }}
          />
          <Chip
            label="Manual entry"
            key="manual"
            selected={mode === "manual"}
            onPress={() => setMode("manual")}
            styleCss={{ flex: 1, width: "auto", height: 40 }}
          />
        </View>

        {mode === "scan" ? (
          <View style={styles.scanCard}>
            <ThemedText type="subtitle">{statusText}</ThemedText>
            {resultLine ? (
              <ThemedText
                type="body"
                themeColor={scanState === "error" ? "error" : "success"}
                style={styles.resultLine}
              >
                {resultLine}
              </ThemedText>
            ) : null}
            <Button
              label={
                scanState === "scanning" ? "Scanning\u2026" : "Scan fingerprint"
              }
              onPress={handleScan}
              loading={scanState === "scanning"}
              disabled={scanState === "scanning"}
              style={styles.scanBtn}
            />
            <Button
              label="Open device settings"
              variant="text"
              onPress={() => router.push("/device")}
            />
          </View>
        ) : (
          <View style={styles.manualCard}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Search name, code, or guardian mobile"
            />
            {searchResults.map((s) => (
              <ListRow
                key={s.id}
                title={s.name}
                subtitle={`${s.code} \u00B7 ${s.batchName ?? ""}`}
                leading={<Avatar name={s.name} uri={s.photoUri} size={40} />}
                onPress={() => handleManualPick(s)}
              />
            ))}
          </View>
        )}

        <ThemedText
          type="label"
          themeColor="textSecondary"
          style={styles.sectionLabel}
        >
          TODAY&apos;S LOG
        </ThemedText>
        {today.length === 0 ? (
          <EmptyStateView icon="\uD83D\uDCCB" title="No attendance yet today" />
        ) : (
          <FlatList
            data={today}
            keyExtractor={(a) => String(a.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <ListRow
                title={item.studentName}
                subtitle={item.batchName}
                trailing={
                  <Badge
                    label={
                      item.outTime
                        ? `Out ${fmtTime(item.outTime)}`
                        : `In ${fmtTime(item.inTime)}`
                    }
                    tone={item.outTime ? "neutral" : "success"}
                  />
                }
                onPress={() => router.push(`/students/${item.studentId}`)}
              />
            )}
          />
        )}
      </PageContainer>
    </>
  );
}

function fmtTime(iso: string | null) {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.two },
  scanCard: { alignItems: "center", padding: Spacing.four, gap: Spacing.two },
  resultLine: { textAlign: "center" },
  scanBtn: { minWidth: 220, marginTop: Spacing.two },
  manualCard: { paddingTop: Spacing.one },
  sectionLabel: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  list: { paddingBottom: 96 },
});
