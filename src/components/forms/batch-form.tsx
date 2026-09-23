import { useState } from "react";
import { ScrollView, StyleSheet, Switch, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { Spacing } from "@/constants/theme";
import { Validators } from "@/core/validators";
import type { Batch, BatchDraft } from "@/types/models";

export function BatchForm({
  title,
  initial,
  onSubmit,
}: {
  title?: string;
  initial?: Batch;
  onSubmit: (draft: BatchDraft) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [academicYear, setAcademicYear] = useState(
    initial?.academicYear ?? "2026-27",
  );
  const [active, setActive] = useState(initial?.active ?? true);
  const [errors, setErrors] = useState<{
    name?: string;
    academicYear?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const nameError = Validators.name(name, "Batch name");
    const yearError = Validators.required(academicYear, "Academic year");
    setErrors({
      name: nameError ?? undefined,
      academicYear: yearError ?? undefined,
    });
    return !nameError && !yearError;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await onSubmit({
      name: name.trim(),
      academicYear: academicYear.trim(),
      active,
    });
    setSubmitting(false);
    if (!result.ok) setSubmitError(result.error ?? "Could not save batch");
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <TextField
        label="Batch name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Batch A"
        error={errors.name}
      />
      <TextField
        label="Academic year"
        value={academicYear}
        onChangeText={setAcademicYear}
        placeholder="e.g. 2026-27"
        error={errors.academicYear}
      />

      <View style={styles.switchRow}>
        <ThemedText type="bodyBold">Active</ThemedText>
        <Switch value={active} onValueChange={setActive} />
      </View>

      {submitError ? (
        <ThemedText type="small" themeColor="error" style={styles.submitError}>
          {submitError}
        </ThemedText>
      ) : null}

      <Button
        label={initial ? "Save changes" : "Create batch"}
        onPress={handleSubmit}
        loading={submitting}
        style={styles.submitBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: Spacing.three },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.two,
  },
  submitError: { marginBottom: Spacing.two },
  submitBtn: { marginTop: Spacing.three },
});
