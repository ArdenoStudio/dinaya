import { z } from "zod";
import { validationError, type ActionResult } from "./action-result";

export { z };

export function parseActionInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown
): ActionResult<z.infer<TSchema>> {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  return { ok: true, data: parsed.data };
}
