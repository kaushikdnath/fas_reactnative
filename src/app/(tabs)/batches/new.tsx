import { router } from "expo-router";

import { BatchForm } from "@/components/forms/batch-form";
import PageContainer from "@/components/PageContainer";
import { AppBar } from "@/components/ui/AppBar";
import { logAudit } from "@/data/audit-repository";
import { createBatch } from "@/data/batch-repository";

export default function NewBatch() {
  return (
    <>
      <AppBar title="New Batch" />
      <PageContainer scrollable={false}>
        <BatchForm
          title="New batch"
          onSubmit={async (draft) => {
            const result = await createBatch(draft);
            if (result.ok) {
              await logAudit("batch.create", {
                batchId: result.value.id,
                name: result.value.name,
              });
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
