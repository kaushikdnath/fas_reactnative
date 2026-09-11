import { getDb, now } from '@/database/db';
import { Err, Ok, Result } from '@/core/result';
import { Logger } from '@/core/logger';
import type { AuditEntry } from '@/types/models';

export async function logAudit(action: string, details?: Record<string, unknown>): Promise<void> {
  try {
    const d = await getDb();
    await d.runAsync(
      'INSERT INTO audit_log(action, details, created_at) VALUES(?,?,?)',
      action, details ? JSON.stringify(details) : null, now(),
    );
  } catch (e) {
    // Audit logging must never block the primary action it's recording.
    Logger.e('logAudit failed', e);
  }
}

export async function listAuditLog(limit = 100): Promise<Result<AuditEntry[]>> {
  try {
    const d = await getDb();
    const rows = await d.getAllAsync<AuditEntry & { created_at: string }>(
      'SELECT id, action, details, created_at FROM audit_log ORDER BY id DESC LIMIT ?', limit,
    );
    return Ok(rows.map((r) => ({ id: r.id, action: r.action, details: r.details, createdAt: r.created_at })));
  } catch (e) {
    Logger.e('listAuditLog failed', e);
    return Err('Could not load audit log', e);
  }
}
