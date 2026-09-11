/**
 * Minimal Either-style result type. Every repository function returns
 * `Promise<Result<T>>` instead of throwing, so screens branch on
 * success/failure explicitly instead of wrapping every call in try/catch.
 */
export type Failure = { message: string; cause?: unknown };

export type Result<T> = { ok: true; value: T } | { ok: false; failure: Failure };

export const Ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const Err = (message: string, cause?: unknown): Result<never> => ({
  ok: false,
  failure: { message, cause },
});

export function unwrapOr<T>(result: Result<T>, fallback: T): T {
  return result.ok ? result.value : fallback;
}
