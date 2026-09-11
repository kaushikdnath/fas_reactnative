import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { StudentForm } from '@/components/forms/student-form';
import { createStudent } from '@/data/student-repository';
import { listBatches } from '@/data/batch-repository';
import { logAudit } from '@/data/audit-repository';
import { LoadingView } from '@/components/ui/state-views';
import { ThemedView } from '@/components/themed-view';
import type { Batch } from '@/types/models';

export default function NewStudent() {
  const { batchId } = useLocalSearchParams<{ batchId?: string }>();
  const [batches, setBatches] = useState<Batch[] | null>(null);

  useEffect(() => { listBatches(false).then((r) => { if (r.ok) setBatches(r.value); }); }, []);

  if (!batches) {
    return (
      <ThemedView style={{ flex: 1 }}>
        <LoadingView />
      </ThemedView>
    );
  }

  return (
    <StudentForm
      title="New student"
      batches={batches}
      presetBatchId={batchId ? Number(batchId) : undefined}
      onSubmit={async (draft) => {
        const result = await createStudent(draft);
        if (result.ok) {
          await logAudit('student.create', { studentId: result.value.id, code: result.value.code });
          router.back();
          return { ok: true };
        }
        return { ok: false, error: result.failure.message };
      }}
    />
  );
}
