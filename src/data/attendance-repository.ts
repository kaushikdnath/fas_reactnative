import { getDb, now, today } from '@/database/db';
import { Err, Ok, Result } from '@/core/result';
import { Logger } from '@/core/logger';
import type { AttendanceDirection, AttendanceRecord, DashboardStats } from '@/types/models';

type AttendanceRow = {
  id: number; student_id: number; student_name: string; student_code: string; batch_name: string;
  attendance_date: string; in_time: string | null; out_time: string | null; status: string;
  confidence: number | null; created_at: string;
};

function mapRow(r: AttendanceRow): AttendanceRecord {
  return {
    id: r.id, studentId: r.student_id, studentName: r.student_name, studentCode: r.student_code,
    batchName: r.batch_name, attendanceDate: r.attendance_date, inTime: r.in_time, outTime: r.out_time,
    status: r.status, confidence: r.confidence, createdAt: r.created_at,
  };
}

const BASE_SELECT = `
  SELECT a.*, s.name student_name, s.code student_code, b.name batch_name
  FROM attendance a JOIN students s ON s.id = a.student_id JOIN batches b ON b.id = s.batch_id`;

export async function todayAttendance(): Promise<Result<AttendanceRecord[]>> {
  try {
    const d = await getDb();
    const rows = await d.getAllAsync<AttendanceRow>(
      `${BASE_SELECT} WHERE a.attendance_date = ? ORDER BY COALESCE(a.out_time, a.in_time) DESC`,
      today(),
    );
    return Ok(rows.map(mapRow));
  } catch (e) {
    Logger.e('todayAttendance failed', e);
    return Err('Could not load today\u2019s attendance', e);
  }
}

export async function historyForStudent(studentId: number, limit = 30): Promise<Result<AttendanceRecord[]>> {
  try {
    const d = await getDb();
    const rows = await d.getAllAsync<AttendanceRow>(
      `${BASE_SELECT} WHERE a.student_id = ? ORDER BY a.attendance_date DESC LIMIT ?`,
      studentId, limit,
    );
    return Ok(rows.map(mapRow));
  } catch (e) {
    Logger.e('historyForStudent failed', e);
    return Err('Could not load attendance history', e);
  }
}

/**
 * Automatic IN/OUT toggle: if the student has no row for today, this
 * records IN; if IN is already set but OUT is not, this records OUT;
 * if both are already set, a fresh scan is treated as a corrected IN
 * time isn't overwritten -- it's surfaced to the caller as `'already-out'`
 * so the UI can offer a manual override instead of silently no-op'ing.
 */
export async function recordScan(
  studentId: number,
  confidence: number,
): Promise<Result<{ direction: AttendanceDirection; record: AttendanceRecord }>> {
  try {
    const d = await getDb();
    const date = today();
    const existing = await d.getFirstAsync<AttendanceRow>(
      `${BASE_SELECT} WHERE a.student_id = ? AND a.attendance_date = ?`, studentId, date,
    );

    if (!existing) {
      const r = await d.runAsync(
        `INSERT INTO attendance(student_id, attendance_date, in_time, status, confidence, created_at)
         VALUES(?,?,?,'PRESENT',?,?)`,
        studentId, date, now(), confidence, now(),
      );
      const row = await d.getFirstAsync<AttendanceRow>(`${BASE_SELECT} WHERE a.id = ?`, r.lastInsertRowId);
      return Ok({ direction: 'IN', record: mapRow(row!) });
    }

    if (existing.in_time && !existing.out_time) {
      await d.runAsync('UPDATE attendance SET out_time = ?, confidence = ? WHERE id = ?', now(), confidence, existing.id);
      const row = await d.getFirstAsync<AttendanceRow>(`${BASE_SELECT} WHERE a.id = ?`, existing.id);
      return Ok({ direction: 'OUT', record: mapRow(row!) });
    }

    return Err('already-out');
  } catch (e) {
    Logger.e('recordScan failed', e);
    return Err('Could not record attendance', e);
  }
}

/** Manual fallback for the operator to force a direction, e.g. after a
 *  same-day correction or when re-entering after `'already-out'`. */
export async function recordManual(
  studentId: number,
  direction: AttendanceDirection,
  operatorNote?: string,
): Promise<Result<AttendanceRecord>> {
  try {
    const d = await getDb();
    const date = today();
    const existing = await d.getFirstAsync<AttendanceRow>(
      `SELECT * FROM attendance WHERE student_id = ? AND attendance_date = ?`, studentId, date,
    );

    if (!existing) {
      const r = await d.runAsync(
        `INSERT INTO attendance(student_id, attendance_date, in_time, out_time, status, created_at)
         VALUES(?,?,?,?,'PRESENT',?)`,
        studentId, date, direction === 'IN' ? now() : null, direction === 'OUT' ? now() : null, now(),
      );
      const row = await d.getFirstAsync<AttendanceRow>(`${BASE_SELECT} WHERE a.id = ?`, r.lastInsertRowId);
      return Ok(mapRow(row!));
    }

    await d.runAsync(
      direction === 'IN'
        ? 'UPDATE attendance SET in_time = ? WHERE id = ?'
        : 'UPDATE attendance SET out_time = ? WHERE id = ?',
      now(), existing.id,
    );
    void operatorNote; // reserved for the audit-log entry the caller writes alongside this
    const row = await d.getFirstAsync<AttendanceRow>(`${BASE_SELECT} WHERE a.id = ?`, existing.id);
    return Ok(mapRow(row!));
  } catch (e) {
    Logger.e('recordManual failed', e);
    return Err('Could not record manual attendance', e);
  }
}

export async function dashboardStats(): Promise<Result<DashboardStats>> {
  try {
    const d = await getDb();
    const students = await d.getFirstAsync<{ c: number }>('SELECT COUNT(*) c FROM students WHERE active = 1');
    const batches = await d.getFirstAsync<{ c: number }>('SELECT COUNT(*) c FROM batches WHERE active = 1');
    const present = await d.getFirstAsync<{ c: number }>(
      'SELECT COUNT(*) c FROM attendance WHERE attendance_date = ? AND in_time IS NOT NULL', today(),
    );
    const pendingSms = await d.getFirstAsync<{ c: number }>(`SELECT COUNT(*) c FROM sms_logs WHERE status = 'FAILED'`);
    return Ok({
      students: students?.c ?? 0,
      batches: batches?.c ?? 0,
      presentToday: present?.c ?? 0,
      pendingSms: pendingSms?.c ?? 0,
    });
  } catch (e) {
    Logger.e('dashboardStats failed', e);
    return Err('Could not load dashboard stats', e);
  }
}
