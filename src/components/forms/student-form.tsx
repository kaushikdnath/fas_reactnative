import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChipRow } from "@/components/ui/chip";
import { TextField } from "@/components/ui/text-field";
import { Radius, Spacing } from "@/constants/theme";
import { Logger } from "@/core/logger";
import { Validators } from "@/core/validators";
import type { Batch, Student, StudentDraft } from "@/types/models";
import { AppBar } from "../ui/AppBar";

const RELATIONSHIPS = ["Father", "Mother", "Guardian", "Sibling", "Other"];

export function StudentForm({
  title,
  initial,
  batches,
  presetBatchId,
  onSubmit,
}: {
  title: string;
  initial?: Student;
  batches: Batch[];
  presetBatchId?: number;
  onSubmit: (draft: StudentDraft) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [photoUri, setPhotoUri] = useState<string | null>(
    initial?.photoUri ?? null,
  );
  const [batchId, setBatchId] = useState<number | undefined>(
    initial?.batchId ?? presetBatchId,
  );
  const [address, setAddress] = useState(initial?.address ?? "");
  const [studentMobile, setStudentMobile] = useState(
    initial?.studentMobile ?? "",
  );
  const [guardianName, setGuardianName] = useState(initial?.guardianName ?? "");
  const [guardianRelationship, setGuardianRelationship] = useState(
    initial?.guardianRelationship ?? "",
  );
  const [guardianMobile, setGuardianMobile] = useState(
    initial?.guardianMobile ?? "",
  );
  const [active, setActive] = useState(initial?.active ?? true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [permissionNote, setPermissionNote] = useState<string | null>(null);

  useEffect(() => {
    if (!initial && batchId === undefined && batches.length > 0)
      setBatchId(batches[0].id);
  }, [initial, batchId, batches]);

  const pickPhoto = async (source: "camera" | "gallery") => {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      setPermissionNote(
        `${source === "camera" ? "Camera" : "Photo library"} permission was denied. Enable it in system settings.`,
      );
      return;
    }
    try {
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
      if (!result.canceled && result.assets[0]) {
        setPermissionNote(null);
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      Logger.e("pickPhoto failed", e);
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    const codeErr = Validators.code(code);
    if (codeErr) next.code = codeErr;
    const nameErr = Validators.name(name);
    if (nameErr) next.name = nameErr;
    if (batchId === undefined) next.batch = "Select a batch";
    const guardianNameErr = Validators.name(guardianName, "Guardian name");
    if (guardianNameErr) next.guardianName = guardianNameErr;
    const guardianMobileErr = Validators.mobile(guardianMobile, true);
    if (guardianMobileErr) next.guardianMobile = guardianMobileErr;
    const studentMobileErr = Validators.mobile(studentMobile, true);
    if (studentMobileErr) next.studentMobile = studentMobileErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || batchId === undefined) return;
    setSubmitting(true);
    setSubmitError(null);

    // Photos picked from the camera/gallery live in a transient cache URI;
    // copy into the app's permanent documents dir (keyed by student code,
    // which is stable and unique) before it's persisted on the row --
    // mirrors how fingerprint templates are kept phone-side as the master.
    let persistedPhotoUri = photoUri;
    const isNewPhoto = photoUri && photoUri !== initial?.photoUri;
    if (isNewPhoto) {
      try {
        const photosDir = new Directory(Paths.document, "photos");
        if (!photosDir.exists) {
          photosDir.create({ intermediates: true, idempotent: true });
        }
        const ext = photoUri!.split(".").pop()?.split("?")[0] || "jpg";
        const sourceFile = new File(photoUri!);
        const destFile = new File(
          photosDir,
          `${code.trim() || "student"}.${ext}`,
        );
        await sourceFile.copy(destFile, { overwrite: true });
        persistedPhotoUri = destFile.uri;
      } catch (e) {
        Logger.e("photo copy failed", e);
      }
    }

    const result = await onSubmit({
      code: code.trim(),
      name: name.trim(),
      photoUri: persistedPhotoUri,
      address: address.trim() || null,
      studentMobile: studentMobile.trim() || null,
      guardianName: guardianName.trim(),
      guardianRelationship: guardianRelationship.trim() || null,
      guardianMobile: guardianMobile.trim() || null,
      batchId,
      active,
    });

    setSubmitting(false);
    if (!result.ok) setSubmitError(result.error ?? "Could not save student");
  };

  return (
    <ThemedView>
      <AppBar title={title} showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.photoSection}>
          <Pressable
            onPress={() => pickPhoto("camera")}
            onLongPress={() => pickPhoto("gallery")}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <Avatar name={name || "?"} size={96} />
            )}
          </Pressable>
          <View style={styles.photoActions}>
            <Button
              label="Camera"
              variant="outlined"
              onPress={() => pickPhoto("camera")}
            />
            <Button
              label="Gallery"
              variant="outlined"
              onPress={() => pickPhoto("gallery")}
            />
          </View>
          {permissionNote ? (
            <ThemedText
              type="small"
              themeColor="error"
              style={styles.permissionNote}
            >
              {permissionNote}
            </ThemedText>
          ) : null}
        </View>

        <TextField
          label="Student code"
          value={code}
          onChangeText={setCode}
          placeholder="e.g. STU-0001"
          autoCapitalize="characters"
          error={errors.code}
        />
        <TextField
          label="Full name"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />

        <ThemedText
          type="label"
          themeColor="textSecondary"
          style={styles.groupLabel}
        >
          BATCH
        </ThemedText>
        <ChipRow
          options={batches.map((b) => ({ value: b.id, label: b.name }))}
          selected={batchId ?? -1}
          onSelect={setBatchId}
        />
        {errors.batch ? (
          <ThemedText type="small" themeColor="error" style={styles.batchError}>
            {errors.batch}
          </ThemedText>
        ) : null}

        <TextField
          label="Address (optional)"
          value={address}
          onChangeText={setAddress}
          multiline
        />
        <TextField
          label="Guardian name"
          value={guardianName}
          onChangeText={setGuardianName}
          error={errors.guardianName}
        />

        <ThemedText
          type="label"
          themeColor="textSecondary"
          style={styles.groupLabel}
        >
          RELATIONSHIP
        </ThemedText>
        <ChipRow
          options={RELATIONSHIPS.map((r) => ({ value: r, label: r }))}
          selected={guardianRelationship}
          onSelect={setGuardianRelationship}
        />

        <TextField
          label="Guardian mobile"
          value={guardianMobile}
          onChangeText={setGuardianMobile}
          keyboardType="phone-pad"
          error={errors.guardianMobile}
        />
        <TextField
          label="Student mobile (optional)"
          value={studentMobile}
          onChangeText={setStudentMobile}
          keyboardType="phone-pad"
          error={errors.studentMobile}
        />

        <View style={styles.switchRow}>
          <ThemedText type="bodyBold">Active</ThemedText>
          <Switch value={active} onValueChange={setActive} />
        </View>

        {submitError ? (
          <ThemedText
            type="small"
            themeColor="error"
            style={styles.submitError}
          >
            {submitError}
          </ThemedText>
        ) : null}

        <Button
          label={initial ? "Save changes" : "Add student"}
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitBtn}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: Spacing.four, paddingBottom: Spacing.six },
  photoSection: {
    alignItems: "center",
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  photo: { width: 96, height: 96, borderRadius: Radius.full },
  photoActions: { flexDirection: "row", gap: Spacing.two },
  permissionNote: { textAlign: "center", maxWidth: 260 },
  groupLabel: { marginBottom: Spacing.one },
  batchError: { marginBottom: Spacing.two },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.two,
  },
  submitError: { marginBottom: Spacing.two },
  submitBtn: { marginTop: Spacing.three },
});
