import { getDb, now } from '@/database/db';
import { Err, Ok, Result } from '@/core/result';
import { Logger } from '@/core/logger';
import type { SmsLog } from '@/types/models';

type SmsLogRow = {
  id: number; student_id: number | null; message: string; numbers: string;
  status: 'SENT' | 'FAILED'; error: string | null; created_at: string;
};

function mapRow(r: SmsLogRow): SmsLog {
  return {
    id: r.id, studentId: r.student_id, message: r.message, numbers: r.numbers,
    status: r.status, error: r.error, createdAt: r.created_at,
  };
}

export async function logSms(entry: {
  studentId?: number | null; message: string; numbers: string; status: 'SENT' | 'FAILED'; error?: string | null;
}): Promise<Result<void>> {
  try {
    const d = await getDb();
    await d.runAsync(
      'INSERT INTO sms_logs(student_id, message, numbers, status, error, created_at) VALUES(?,?,?,?,?,?)',
      entry.studentId ?? null, entry.message, entry.numbers, entry.status, entry.error ?? null, now(),
    );
    return Ok(undefined);
  } catch (e) {
    Logger.e('logSms failed', e);
    return Err('Could not save SMS log entry', e);
  }
}

export async function listSmsLogs(limit = 100): Promise<Result<SmsLog[]>> {
  try {
    const d = await getDb();
    const rows = await d.getAllAsync<SmsLogRow>('SELECT * FROM sms_logs ORDER BY id DESC LIMIT ?', limit);
    return Ok(rows.map(mapRow));
  } catch (e) {
    Logger.e('listSmsLogs failed', e);
    return Err('Could not load SMS log', e);
  }
}

export async function countPendingSms(): Promise<Result<number>> {
  try {
    const d = await getDb();
    const row = await d.getFirstAsync<{ c: number }>(`SELECT COUNT(*) c FROM sms_logs WHERE status = 'FAILED'`);
    return Ok(row?.c ?? 0);
  } catch (e) {
    Logger.e('countPendingSms failed', e);
    return Err('Could not count pending SMS', e);
  }
}
