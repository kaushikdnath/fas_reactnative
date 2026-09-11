import { getDb, now } from '@/database/db';
import { Err, Ok, Result } from '@/core/result';
import { Logger } from '@/core/logger';
import type { Fingerprint } from '@/types/models';

type FingerprintRow = {
  id: number; student_id: number; student_name: string; student_code: string;
  finger_name: string; device_slot: number; created_at: string;
};

function mapRow(r: FingerprintRow): Fingerprint {
  return {
    id: r.id, studentId: r.student_id, studentName: r.student_name, studentCode: r.student_code,
    fingerName: r.finger_name, deviceSlot: r.device_slot, createdAt: r.created_at,
  };
}

const BASE_SELECT = `
  SELECT f.*, s.name student_name, s.code student_code
  FROM fingerprints f JOIN students s ON s.id = f.student_id`;

export async function listFingerprintsForStudent(studentId: number): Promise<Result<Fingerprint[]>> {
  try {
    const d = await getDb();
    const rows = await d.getAllAsync<FingerprintRow>(`${BASE_SELECT} WHERE f.student_id = ? ORDER BY f.finger_name`, studentId);
    return Ok(rows.map(mapRow));
  } catch (e) {
    Logger.e('listFingerprintsForStudent failed', e);
    return Err('Could not load fingerprints', e);
  }
}

export async function listAllFingerprints(): Promise<Result<Fingerprint[]>> {
  try {
    const d = await getDb();
    const rows = await d.getAllAsync<FingerprintRow>(`${BASE_SELECT} ORDER BY s.name, f.finger_name`);
    return Ok(rows.map(mapRow));
  } catch (e) {
    Logger.e('listAllFingerprints failed', e);
    return Err('Could not load fingerprints', e);
  }
}

/** Called once the sensor + phone-side template upload both succeed --
 *  the phone copy (this row's `template`) is the master; the sensor's
 *  onboard flash is a disposable cache keyed by `deviceSlot`. */
export async function saveFingerprint(
  studentId: number,
  fingerName: string,
  slot: number,
  template: string,
): Promise<Result<Fingerprint>> {
  try {
    const d = await getDb();
    const t = now();
    const r = await d.runAsync(
      'INSERT INTO fingerprints(student_id, finger_name, device_slot, template, created_at, updated_at) VALUES(?,?,?,?,?,?)',
      studentId, fingerName, slot, template, t, t,
    );
    const row = await d.getFirstAsync<FingerprintRow>(`${BASE_SELECT} WHERE f.id = ?`, r.lastInsertRowId);
    return row ? Ok(mapRow(row)) : Err('Fingerprint saved but could not be reloaded');
  } catch (e) {
    Logger.e('saveFingerprint failed', e);
    return Err('Could not save fingerprint -- this student/finger or device slot may already be enrolled', e);
  }
}

export async function getFingerprintTemplate(id: number): Promise<Result<string>> {
  try {
    const d = await getDb();
    const row = await d.getFirstAsync<{ template: string }>('SELECT template FROM fingerprints WHERE id = ?', id);
    if (!row) return Err('Fingerprint not found');
    return Ok(row.template);
  } catch (e) {
    Logger.e('getFingerprintTemplate failed', e);
    return Err('Could not load fingerprint template', e);
  }
}

/** Deletes only the SQLite mapping. Clearing the corresponding slot on
 *  the physical sensor is a separate, explicit native call the screen
 *  must also make -- kept decoupled per README_ATTENDANCE.md. */
export async function deleteFingerprint(id: number): Promise<Result<void>> {
  try {
    const d = await getDb();
    await d.runAsync('DELETE FROM fingerprints WHERE id = ?', id);
    return Ok(undefined);
  } catch (e) {
    Logger.e('deleteFingerprint failed', e);
    return Err('Could not delete fingerprint', e);
  }
}

export async function countFingerprints(): Promise<Result<number>> {
  try {
    const d = await getDb();
    const row = await d.getFirstAsync<{ c: number }>('SELECT COUNT(*) c FROM fingerprints');
    return Ok(row?.c ?? 0);
  } catch (e) {
    Logger.e('countFingerprints failed', e);
    return Err('Could not count fingerprints', e);
  }
}
