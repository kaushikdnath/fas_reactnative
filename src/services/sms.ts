import { logSms } from '@/data/sms-repository';
import { getAutoSmsOnAttendance, getSmsConfig } from '@/services/settings';
import type { AttendanceDirection } from '@/types/models';

export type SmsConfig = { baseUrl: string; token: string };

export async function sendSms(config: SmsConfig, numbers: string[], message: string): Promise<string> {
  if (!config.baseUrl || !config.token) throw new Error('SMS gateway is not configured');
  const r = await fetch(config.baseUrl.replace(/\/$/, '') + '/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.token}` },
    body: JSON.stringify({ numbers, message }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(text || `SMS gateway HTTP ${r.status}`);
  return text;
}

/**
 * Fire-and-log SMS for an attendance event: respects the "auto SMS on
 * attendance" setting, sends via the configured gateway, and always
 * writes an sms_logs row (SENT or FAILED) regardless of outcome so the
 * pending/failed count on the dashboard and the SMS log stay accurate.
 * Never throws -- a messaging failure must not block attendance capture.
 */
export async function notifyAttendance(params: {
  studentId: number;
  studentName: string;
  guardianMobile: string | null;
  direction: AttendanceDirection;
  time: string;
}): Promise<void> {
  const enabled = await getAutoSmsOnAttendance();
  if (!enabled || !params.guardianMobile) return;

  const message = `${params.studentName} checked ${params.direction === 'IN' ? 'in' : 'out'} at ${new Date(params.time).toLocaleTimeString()}.`;

  try {
    const config = await getSmsConfig();
    await sendSms(config, [params.guardianMobile], message);
    await logSms({ studentId: params.studentId, message, numbers: params.guardianMobile, status: 'SENT' });
  } catch (e) {
    await logSms({
      studentId: params.studentId,
      message,
      numbers: params.guardianMobile,
      status: 'FAILED',
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
