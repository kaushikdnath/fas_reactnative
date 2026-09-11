/** Domain-layer types -- camelCase, decoupled from the raw SQLite column
 *  names. Repositories in `src/data/` map DB rows into these; screens
 *  never see a raw snake_case row. */

export type Batch = {
  id: number;
  name: string;
  academicYear: string;
  active: boolean;
  createdAt: string;
  studentCount: number;
};

export type BatchDraft = { name: string; academicYear: string; active?: boolean };

export type StudentStatusFilter = 'active' | 'inactive' | 'all';

export type Student = {
  id: number;
  code: string;
  name: string;
  photoUri: string | null;
  address: string | null;
  studentMobile: string | null;
  guardianName: string;
  guardianRelationship: string | null;
  guardianMobile: string | null;
  batchId: number;
  batchName: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  fingerprintCount: number;
};

export type StudentDraft = {
  code: string;
  name: string;
  photoUri?: string | null;
  address?: string | null;
  studentMobile?: string | null;
  guardianName: string;
  guardianRelationship?: string | null;
  guardianMobile?: string | null;
  batchId: number;
  active?: boolean;
};

export type StudentFilter = { batchId?: number; query?: string; status?: StudentStatusFilter };

export type Fingerprint = {
  id: number;
  studentId: number;
  studentName: string;
  studentCode: string;
  fingerName: string;
  deviceSlot: number;
  createdAt: string;
};

export type AttendanceDirection = 'IN' | 'OUT';

export type AttendanceRecord = {
  id: number;
  studentId: number;
  studentName: string;
  studentCode: string;
  batchName: string;
  attendanceDate: string;
  inTime: string | null;
  outTime: string | null;
  status: string;
  confidence: number | null;
  createdAt: string;
};

export type SmsLog = {
  id: number;
  studentId: number | null;
  message: string;
  numbers: string;
  status: 'SENT' | 'FAILED';
  error: string | null;
  createdAt: string;
};

export type AuditEntry = { id: number; action: string; details: string | null; createdAt: string };

export type DeviceInfo = { deviceId: number; deviceName?: string; productName?: string; vendorId?: number; productId?: number };

export type FingerprintMatch = { id: number; confidence: number };

export type DashboardStats = { students: number; batches: number; presentToday: number; pendingSms: number };
