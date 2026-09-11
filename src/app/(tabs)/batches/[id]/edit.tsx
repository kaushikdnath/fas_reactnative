import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { BatchForm } from '@/components/forms/batch-form';
import { getBatch, updateBatch } from '@/data/batch-repository';
import { logAudit } from '@/data/audit-repository';
import { LoadingView } from '@/components/ui/state-views';
import { ThemedView } from '@/components/themed-view';
import type { Batch } from '@/types/models';

export default function EditBatch() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const batchId = Number(id);
  const [batch, setBatch] = useState<Batch | null>(null);

  useEffect(() => {
    getBatch(batchId).then((r) => { if (r.ok) setBatch(r.value); });
  }, [batchId]);

  if (!batch) {
    return (
      <ThemedView style={{ flex: 1 }}>
        <LoadingView />
      </ThemedView>
    );
  }

  return (
    <BatchForm
      title="Edit batch"
      initial={batch}
      onSubmit={async (draft) => {
        const result = await updateBatch(batchId, draft);
        if (result.ok) {
          await logAudit('batch.update', { batchId });
          router.back();
          return { ok: true };
        }
        return { ok: false, error: result.failure.message };
      }}
    />
  );
}
