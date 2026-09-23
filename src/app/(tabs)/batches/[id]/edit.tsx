import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import { BatchForm } from "@/components/forms/batch-form";
import PageContainer from "@/components/PageContainer";
import { ThemedView } from "@/components/themed-view";
import { AppBar } from "@/components/ui/AppBar";
import { LoadingView } from "@/components/ui/state-views";
import { logAudit } from "@/data/audit-repository";
import { getBatch, updateBatch } from "@/data/batch-repository";
import type { Batch } from "@/types/models";

export default function EditBatch() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const batchId = Number(id);
  const [batch, setBatch] = useState<Batch | null>(null);

  useEffect(() => {
    getBatch(batchId).then((r) => {
      if (r.ok) setBatch(r.value);
    });
  }, [batchId]);

  if (!batch) {
    return (
      <ThemedView style={{ flex: 1 }}>
        <LoadingView />
      </ThemedView>
    );
  }

  return (
    <>
      <AppBar title="Edit Batch" showBack />
      <PageContainer scrollable={false}>
        <BatchForm
          title="Edit batch"
          initial={batch}
          onSubmit={async (draft) => {
            const result = await updateBatch(batchId, draft);
            if (result.ok) {
              await logAudit("batch.update", { batchId });
              router.back();
              return { ok: true };
            }
            return { ok: false, error: result.failure.message };
          }}
        />
      </PageContainer>
    </>
  );
}
