import { getDb, now } from '@/database/db';
import { Err, Ok, Result } from '@/core/result';
import { Logger } from '@/core/logger';
import type { Student, StudentDraft, StudentFilter } from '@/types/models';

type StudentRow = {
  id: number; code: string; name: string; photo_uri: string | null; address: string | null;
  student_mobile: string | null; guardian_name: string; guardian_relationship: string | null;
  guardian_mobile: string | null; batch_id: number; batch_name: string | null; active: number;
  created_at: string; updated_at: string; fingerprint_count: number;
};

function mapRow(r: StudentRow): Student {
  return {
    id: r.id, code: r.code, name: r.name, photoUri: r.photo_uri, address: r.address,
    studentMobile: r.student_mobile, guardianName: r.guardian_name,
    guardianRelationship: r.guardian_relationship, guardianMobile: r.guardian_mobile,
    batchId: r.batch_id, batchName: r.batch_name, active: r.active === 1,
    createdAt: r.created_at, updatedAt: r.updated_at, fingerprintCount: r.fingerprint_count,
  };
}

const BASE_SELECT = `
  SELECT s.*, b.name batch_name,
    (SELECT COUNT(*) FROM fingerprints f WHERE f.student_id = s.id) fingerprint_count
  FROM students s LEFT JOIN batches b ON b.id = s.batch_id`;

export type StudentPage = { students: Student[]; totalCount: number; hasMore: boolean };

export async function listStudents(
  filter: StudentFilter = {},
  page = 0,
  pageSize = 50,
): Promise<Result<StudentPage>> {
  try {
    const d = await getDb();
    const clauses: string[] = [];
    const params: (string | number)[] = [];

    if (filter.status === 'active') { clauses.push('s.active = 1'); }
    else if (filter.status === 'inactive') { clauses.push('s.active = 0'); }

    if (filter.batchId !== undefined) { clauses.push('s.batch_id = ?'); params.push(filter.batchId); }

    if (filter.query && filter.query.trim()) {
      clauses.push('(s.name LIKE ? OR s.code LIKE ? OR s.guardian_mobile LIKE ?)');
      const q = `%${filter.query.trim()}%`;
      params.push(q, q, q);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const countRow = await d.getFirstAsync<{ c: number }>(
      `SELECT COUNT(*) c FROM students s ${where}`, ...params,
    );
    const totalCount = countRow?.c ?? 0;

    const rows = await d.getAllAsync<StudentRow>(
      `${BASE_SELECT} ${where} ORDER BY s.name LIMIT ? OFFSET ?`,
      ...params, pageSize, page * pageSize,
    );

    return Ok({ students: rows.map(mapRow), totalCount, hasMore: (page + 1) * pageSize < totalCount });
  } catch (e) {
    Logger.e('listStudents failed', e);
    return Err('Could not load students', e);
  }
}

export async function getStudent(id: number): Promise<Result<Student>> {
  try {
    const d = await getDb();
    const row = await d.getFirstAsync<StudentRow>(`${BASE_SELECT} WHERE s.id = ?`, id);
    if (!row) return Err('Student not found');
    return Ok(mapRow(row));
  } catch (e) {
    Logger.e('getStudent failed', e);
    return Err('Could not load student', e);
  }
}

export async function findStudentBySlot(slot: number): Promise<Result<Student>> {
  try {
    const d = await getDb();
    const row = await d.getFirstAsync<StudentRow>(
      `${BASE_SELECT} JOIN fingerprints f ON f.student_id = s.id WHERE f.device_slot = ? AND s.active = 1`,
      slot,
    );
    if (!row) return Err(`No active student is mapped to device slot ${slot}`);
    return Ok(mapRow(row));
  } catch (e) {
    Logger.e('findStudentBySlot failed', e);
    return Err('Could not look up student for this fingerprint', e);
  }
}

export async function createStudent(draft: StudentDraft): Promise<Result<Student>> {
  try {
    const d = await getDb();
    const t = now();
    const r = await d.runAsync(
      `INSERT INTO students(code, name, photo_uri, address, student_mobile, guardian_name,
        guardian_relationship, guardian_mobile, batch_id, active, created_at, updated_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
      draft.code.trim(), draft.name.trim(), draft.photoUri ?? null, draft.address ?? null,
      draft.studentMobile ?? null, draft.guardianName.trim(), draft.guardianRelationship ?? null,
      draft.guardianMobile ?? null, draft.batchId, draft.active === false ? 0 : 1, t, t,
    );
    return getStudent(r.lastInsertRowId);
  } catch (e) {
    Logger.e('createStudent failed', e);
    return Err('Could not create student -- the student code may already be in use', e);
  }
}

export async function updateStudent(id: number, draft: StudentDraft): Promise<Result<Student>> {
  try {
    const d = await getDb();
    await d.runAsync(
      `UPDATE students SET code=?, name=?, photo_uri=?, address=?, student_mobile=?, guardian_name=?,
        guardian_relationship=?, guardian_mobile=?, batch_id=?, active=?, updated_at=? WHERE id=?`,
      draft.code.trim(), draft.name.trim(), draft.photoUri ?? null, draft.address ?? null,
      draft.studentMobile ?? null, draft.guardianName.trim(), draft.guardianRelationship ?? null,
      draft.guardianMobile ?? null, draft.batchId, draft.active === false ? 0 : 1, now(), id,
    );
    return getStudent(id);
  } catch (e) {
    Logger.e('updateStudent failed', e);
    return Err('Could not update student', e);
  }
}

export async function moveStudentToBatch(studentId: number, batchId: number): Promise<Result<void>> {
  try {
    const d = await getDb();
    await d.runAsync('UPDATE students SET batch_id = ?, updated_at = ? WHERE id = ?', batchId, now(), studentId);
    return Ok(undefined);
  } catch (e) {
    Logger.e('moveStudentToBatch failed', e);
    return Err('Could not move student', e);
  }
}

export type StudentDeleteOptions = { cascadeAttendance?: boolean; cascadeFingerprints?: boolean };

export async function deleteStudent(id: number, options: StudentDeleteOptions = {}): Promise<Result<void>> {
  try {
    const d = await getDb();
    await d.withTransactionAsync(async () => {
      if (options.cascadeFingerprints) await d.runAsync('DELETE FROM fingerprints WHERE student_id = ?', id);
      if (options.cascadeAttendance) await d.runAsync('DELETE FROM attendance WHERE student_id = ?', id);
      await d.runAsync('DELETE FROM students WHERE id = ?', id);
    });
    return Ok(undefined);
  } catch (e) {
    Logger.e('deleteStudent failed', e);
    return Err('Could not delete student -- it may still have fingerprint or attendance records', e);
  }
}
