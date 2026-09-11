# Attendance AS608 — React Native

This project is the first working foundation of the attendance application, built on the previously tested AS608 React Native native module and the uploaded SMS Gateway project.

## Included
- SQLite local database: batches, students, fingerprints, attendance, SMS logs, audit log foundation.
- Batch creation.
- Student creation with guardian/student mobile fields.
- AS608/CH340 USB discovery, connection and initialization.
- Fingerprint enrollment: free-slot allocation → sensor enrollment → template upload → SQLite mapping.
- Fingerprint attendance identification and IN record.
- SMS Gateway adapter using `POST /send` with `Authorization: Bearer <token>` and `{numbers,message}`.
- Settings for gateway URL and bearer token.

## Important device behavior
Clearing the AS608 device is intentionally exposed only through the native service and is **not** coupled to deleting SQLite records. Database deletion must remain a separate explicit operation.

## Run
1. `npm install`
2. `npx expo prebuild -p android --clean`
3. `npx expo run:android`

A physical Android device with the AS608/CH340 attached is required for fingerprint functions. The native source is copied into the generated Android project by `plugins/withAs608.js`.

## Current milestone
Stage 1 + fingerprint enrollment/attendance foundation. Reports, Google Sheets synchronization, batch-wise device synchronization, IN/OUT rules, SMS-on-attendance workflow, backup/restore, and production hardening are the next implementation stages.
