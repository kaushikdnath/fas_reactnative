import { router } from 'expo-router';

import { BatchForm } from '@/components/forms/batch-form';
import { createBatch } from '@/data/batch-repository';
import { logAudit } from '@/data/audit-repository';

export default function NewBatch() {
  return (
    <BatchForm
      title="New batch"
      onSubmit={async (draft) => {
        const result = await createBatch(draft);
        if (result.ok) {
          await logAudit('batch.create', { batchId: result.value.id, name: result.value.name });
          router.back();
          return { ok: true };
        }
        return { ok: false, error: result.failure.message };
      }}
    />
  );
}
