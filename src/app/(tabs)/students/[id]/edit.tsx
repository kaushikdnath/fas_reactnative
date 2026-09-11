import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { StudentForm } from '@/components/forms/student-form';
import { getStudent, updateStudent } from '@/data/student-repository';
import { listBatches } from '@/data/batch-repository';
import { logAudit } from '@/data/audit-repository';
import { LoadingView } from '@/components/ui/state-views';
import { ThemedView } from '@/components/themed-view';
import type { Batch, Student } from '@/types/models';

export default function EditStudent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const studentId = Number(id);
  const [student, setStudent] = useState<Student | null>(null);
  const [batches, setBatches] = useState<Batch[] | null>(null);

  useEffect(() => {
    getStudent(studentId).then((r) => { if (r.ok) setStudent(r.value); });
    listBatches(false).then((r) => { if (r.ok) setBatches(r.value); });
  }, [studentId]);

  if (!student || !batches) {
    return (
      <ThemedView style={{ flex: 1 }}>
        <LoadingView />
      </ThemedView>
    );
  }

  return (
    <StudentForm
      title="Edit student"
      initial={student}
      batches={batches}
      onSubmit={async (draft) => {
        const result = await updateStudent(studentId, draft);
        if (result.ok) {
          await logAudit('student.update', { studentId });
          router.back();
          return { ok: true };
        }
        return { ok: false, error: result.failure.message };
      }}
    />
  );
}
