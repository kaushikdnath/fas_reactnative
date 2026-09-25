import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppBar } from "@/components/ui/AppBar";
import { Button } from "@/components/ui/button";
import { ChipRow } from "@/components/ui/chip";
import { EmptyStateView, LoadingView } from "@/components/ui/state-views";
import { FINGER_NAMES, MAX_FINGERPRINTS_PER_STUDENT } from "@/constants/app";
import { Spacing } from "@/constants/theme";
import { logAudit } from "@/data/audit-repository";
import {
  listFingerprintsForStudent,
  saveFingerprint,
} from "@/data/fingerprint-repository";
import { getStudent } from "@/data/student-repository";
import {
  AS608_EVENTS,
  FingerprintScanner,
} from "@/services/fingerprint-scanner";
import type { Fingerprint, Student } from "@/types/models";

type Stage = "idle" | "enrolling" | "uploading" | "done" | "error";

export default function EnrollFingerprint() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const studentId = Number(id);

  const [student, setStudent] = useState<Student | null>(null);
  const [existing, setExisting] = useState<Fingerprint[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [fingerName, setFingerName] = useState<string>(FINGER_NAMES[0]);
  const [stage, setStage] = useState<Stage>("idle");
  const [statusText, setStatusText] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    getStudent(studentId).then((r) => {
      if (r.ok) setStudent(r.value);
    });
    listFingerprintsForStudent(studentId).then((r) => {
      if (r.ok) setExisting(r.value);
    });
    FingerprintScanner.isConnected()
      .then(setConnected)
      .catch(() => setConnected(false));
  }, [studentId]);

  useEffect(() => {
    if (!FingerprintScanner.events) return;
    const sub = FingerprintScanner.events.addListener(
      AS608_EVENTS.enroll,
      (e: { message: string }) => {
        setStatusText(e.message);
      },
    );
    return () => sub.remove();
  }, []);

  const availableFingerNames = FINGER_NAMES.filter(
    (f) => !existing.some((e) => e.fingerName === f),
  );
  const atCapacity = existing.length >= MAX_FINGERPRINTS_PER_STUDENT;

  const handleEnroll = async () => {
    setStage("enrolling");
    setErrorText(null);
    setStatusText("Getting a free sensor slot\u2026");
    try {
      const freeSlots = await FingerprintScanner.getFreeSlots();
      const slot = freeSlots[0];
      if (slot === undefined)
        throw new Error(
          "The sensor has no free slots. Clear unused templates first.",
        );

      await FingerprintScanner.enroll(slot);

      setStage("uploading");
      setStatusText("Reading template from sensor\u2026");
      const { base64 } = await FingerprintScanner.uploadTemplate(slot);

      const saved = await saveFingerprint(studentId, fingerName, slot, base64);
      if (!saved.ok) throw new Error(saved.failure.message);

      await logAudit("fingerprint.enroll", { studentId, fingerName, slot });
      setStage("done");
      setStatusText("Enrolled successfully");
      setTimeout(() => router.back(), 700);
    } catch (e) {
      setStage("error");
      setErrorText(
        e instanceof Error
          ? e.message
          : "Enrollment failed -- please try again",
      );
    }
  };

  if (!student) {
    return (
      <ThemedView style={styles.page}>
        <AppBar title="Enroll fingerprint" showBack />
        <LoadingView />
      </ThemedView>
    );
  }

  if (connected === false) {
    return (
      <ThemedView style={styles.page}>
        <AppBar title="Enroll fingerprint" showBack />
        <EmptyStateView
          icon="\uD83D\uDD0C"
          title="Scanner not connected"
          subtitle="Connect the AS608 sensor from the Device screen before enrolling a fingerprint."
          actionLabel="Open Device screen"
          onAction={() => router.push("/device")}
        />
      </ThemedView>
    );
  }

  if (atCapacity) {
    return (
      <ThemedView style={styles.page}>
        <AppBar title="Enroll fingerprint" showBack />
        <EmptyStateView
          icon="\u2705"
          title="All 5 slots enrolled"
          subtitle={`${student.name} already has the maximum of ${MAX_FINGERPRINTS_PER_STUDENT} fingerprints.`}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.page}>
      <AppBar title="Enroll fingerprint" subtitle={student.name} showBack />
      <View style={styles.content}>
        <ThemedText
          type="label"
          themeColor="textSecondary"
          style={styles.label}
        >
          WHICH FINGER?
        </ThemedText>
        <ChipRow
          options={availableFingerNames.map((f) => ({ value: f, label: f }))}
          selected={fingerName}
          onSelect={setFingerName}
        />

        <View style={styles.statusCard}>
          <ThemedText type="subtitle" style={styles.statusTitle}>
            {stage === "idle" && "Ready to enroll"}
            {stage === "enrolling" && "Place finger on sensor"}
            {stage === "uploading" && "Saving template"}
            {stage === "done" && "Done"}
            {stage === "error" && "Enrollment failed"}
          </ThemedText>
          <ThemedText
            type="body"
            themeColor="textSecondary"
            style={styles.statusBody}
          >
            {stage === "error"
              ? errorText
              : statusText ||
                "The sensor will ask for the same finger twice to build a reliable template."}
          </ThemedText>
        </View>

        <Button
          label={
            stage === "enrolling" || stage === "uploading"
              ? "Enrolling\u2026"
              : "Start enrollment"
          }
          onPress={handleEnroll}
          loading={stage === "enrolling" || stage === "uploading"}
          disabled={stage === "enrolling" || stage === "uploading"}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: Spacing.four, flex: 1 },
  label: { marginBottom: Spacing.one },
  statusCard: { marginVertical: Spacing.four, gap: Spacing.one },
  statusTitle: {},
  statusBody: {},
});
