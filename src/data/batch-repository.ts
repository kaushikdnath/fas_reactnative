import { globalLoading } from "@/context";
import { Logger } from "@/core/logger";
import { Err, Ok, Result } from "@/core/result";
import { getDb, now } from "@/database/db";
import type { Batch, BatchDraft } from "@/types/models";

type BatchRow = {
  id: number;
  name: string;
  academic_year: string;
  active: number;
  created_at: string;
  student_count: number;
};

function mapRow(r: BatchRow): Batch {
  return {
    id: r.id,
    name: r.name,
    academicYear: r.academic_year,
    active: r.active === 1,
    createdAt: r.created_at,
    studentCount: r.student_count,
  };
}

export type ListBatchesOptions = {
  includeInactive?: boolean;
  showLoader?: boolean;
  loaderMessage?: string;
};

export async function listBatches(
  includeInactive: boolean = true,
): Promise<Result<Batch[]>> {
  try {
    const d = await getDb();
    const rows = await globalLoading.withLoading(
      () =>
        d.getAllAsync<BatchRow>(
          `SELECT b.*, (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id AND s.active = 1) student_count
         FROM batches b ${includeInactive ? "" : "WHERE b.active = 1"} ORDER BY b.name`,
        ),
      "Loading Batches...",
    );
    return Ok(rows.map(mapRow));
  } catch (e) {
    Logger.e("listBatches failed", e);
    return Err("Could not load batches", e);
  }
}

export async function getBatch(id: number): Promise<Result<Batch>> {
  try {
    const d = await getDb();
    const row = await globalLoading.withLoading(
      async () =>
        await d.getFirstAsync<BatchRow>(
          `SELECT b.*, (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id AND s.active = 1) student_count
       FROM batches b WHERE b.id = ?`,
          id,
        ),
      "Loading Batch...",
    );
    if (!row) return Err("Batch not found");
    return Ok(mapRow(row));
  } catch (e) {
    Logger.e("getBatch failed", e);
    return Err("Could not load batch", e);
  }
}

export async function createBatch(draft: BatchDraft): Promise<Result<Batch>> {
  try {
    const d = await getDb();
    const r = await d.runAsync(
      "INSERT INTO batches(name, academic_year, active, created_at) VALUES(?,?,?,?)",
      draft.name,
      draft.academicYear,
      draft.active === false ? 0 : 1,
      now(),
    );
    return getBatch(r.lastInsertRowId);
  } catch (e) {
    Logger.e("createBatch failed", e);
    return Err("Could not create batch", e);
  }
}

export async function updateBatch(
  id: number,
  draft: BatchDraft,
): Promise<Result<Batch>> {
  try {
    const d = await getDb();
    await d.runAsync(
      "UPDATE batches SET name = ?, academic_year = ?, active = ? WHERE id = ?",
      draft.name,
      draft.academicYear,
      draft.active === false ? 0 : 1,
      id,
    );
    return getBatch(id);
  } catch (e) {
    Logger.e("updateBatch failed", e);
    return Err("Could not update batch", e);
  }
}

export type BatchDeleteOptions = {
  cascadeStudents?: boolean;
  cascadeAttendance?: boolean;
  cascadeFingerprints?: boolean;
};

/** Fingerprint templates are cleared from the physical AS608 module by
 *  the caller (see `students/[id]/index.tsx`) *before* this runs --
 *  intentionally kept a separate, explicit step per README_ATTENDANCE.md
 *  ("device clearing must not be coupled to deleting SQLite records"). */
export async function deleteBatch(
  id: number,
  options: BatchDeleteOptions = {},
): Promise<Result<void>> {
  try {
    const d = await getDb();
    await d.withTransactionAsync(async () => {
      if (options.cascadeStudents) {
        const students = await d.getAllAsync<{ id: number }>(
          "SELECT id FROM students WHERE batch_id = ?",
          id,
        );
        const ids = students.map((s) => s.id);
        if (ids.length > 0) {
          const placeholders = ids.map(() => "?").join(",");
          if (options.cascadeFingerprints) {
            await d.runAsync(
              `DELETE FROM fingerprints WHERE student_id IN (${placeholders})`,
              ...ids,
            );
          }
          if (options.cascadeAttendance) {
            await d.runAsync(
              `DELETE FROM attendance WHERE student_id IN (${placeholders})`,
              ...ids,
            );
          }
          await d.runAsync(`DELETE FROM students WHERE batch_id = ?`, id);
        }
      }
      await d.runAsync("DELETE FROM batches WHERE id = ?", id);
    });
    return Ok(undefined);
  } catch (e) {
    Logger.e("deleteBatch failed", e);
    return Err(
      "Could not delete batch -- move or remove its students first",
      e,
    );
  }
}
