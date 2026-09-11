/* eslint-disable no-console */
/** Thin logging facade so the rest of the app depends on one API instead
 *  of console.* directly -- swap the sink here if crash reporting is
 *  added later without touching call sites. */
export const Logger = {
  i: (message: string, data?: unknown) => console.info(`[INFO] ${message}`, data ?? ''),
  w: (message: string, data?: unknown) => console.warn(`[WARN] ${message}`, data ?? ''),
  e: (message: string, error?: unknown) => console.error(`[ERROR] ${message}`, error ?? ''),
};
