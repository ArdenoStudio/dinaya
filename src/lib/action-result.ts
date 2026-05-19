import type { z } from "zod";

export type FieldErrors = Record<string, string[]>;

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string, fieldErrors?: FieldErrors): ActionResult<never> {
  return fieldErrors ? { ok: false, error, fieldErrors } : { ok: false, error };
}

export function validationError(
  error: z.ZodError,
  message = "Please check the highlighted fields."
): ActionResult<never> {
  const { fieldErrors } = error.flatten();
  return fail(message, fieldErrors);
}
