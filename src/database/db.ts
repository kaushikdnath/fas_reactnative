import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Opens (once) the shared SQLite database. Table/column names are
 * unchanged from the original schema -- only indexes were added -- since
 * the AS608 enrollment/identify flow in `src/data/fingerprint-repository.ts`
 * and `src/data/attendance-repository.ts` writes into these exact tables
 * and nothing in the native module touches SQLite directly.
 */
export async function getDb() {
  if (!db) db = await SQLite.openDatabaseAsync('attendance.db');
  await db.execAsync(`
    PRAGMA journal_mode=WAL;
    PRAGMA foreign_keys=ON;

    CREATE TABLE IF NOT EXISTS batches(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      academic_year TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      photo_uri TEXT,
      address TEXT,
      student_mobile TEXT,
      guardian_name TEXT NOT NULL,
      guardian_relationship TEXT,
      guardian_mobile TEXT,
      batch_id INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(batch_id) REFERENCES batches(id)
    );
    CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batch_id);
    CREATE INDEX IF NOT EXISTS idx_students_active ON students(active);
    CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);

    CREATE TABLE IF NOT EXISTS fingerprints(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      finger_name TEXT NOT NULL,
      device_slot INTEGER UNIQUE NOT NULL,
      template TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(student_id, finger_name),
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_fingerprints_student ON fingerprints(student_id);

    CREATE TABLE IF NOT EXISTS attendance(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      attendance_date TEXT NOT NULL,
      in_time TEXT,
      out_time TEXT,
      status TEXT NOT NULL,
      confidence INTEGER,
      created_at TEXT NOT NULL,
      UNIQUE(student_id, attendance_date),
      FOREIGN KEY(student_id) REFERENCES students(id)
    );
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
    CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);

    CREATE TABLE IF NOT EXISTS sms_logs(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      message TEXT,
      numbers TEXT,
      status TEXT,
      error TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);

    CREATE TABLE IF NOT EXISTS audit_log(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );
  `);
  return db;
}

export const now = () => new Date().toISOString();
export const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local time
