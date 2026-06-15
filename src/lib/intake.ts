import { z } from "@/lib/validation";

/**
 * Per-service intake (booking) questions and the answers captured on a booking.
 *
 * Questions live on `services.intake_questions` (jsonb); answers are snapshotted
 * onto `bookings.intake_answers` (jsonb) at booking time — including the label
 * and `sensitive` flag — so later edits to a service never rewrite history.
 *
 * PDPA note: intake can capture health/sensitive data (symptoms, reason for a
 * clinic visit). Questions flagged `sensitive` must be kept out of marketing,
 * broadcast, and AI surfaces — only shown to the business on the booking record.
 */

export const MAX_INTAKE_QUESTIONS = 12;

export type IntakeQuestionType = "text" | "textarea" | "select" | "boolean";

export interface IntakeQuestion {
  id: string;
  label: string;
  type: IntakeQuestionType;
  required: boolean;
  /** Only for `type: "select"`. */
  options?: string[];
  /** PDPA: treat the answer as sensitive — exclude from marketing/AI surfaces. */
  sensitive?: boolean;
}

export interface IntakeAnswer {
  questionId: string;
  /** Snapshot of the question label at booking time. */
  label: string;
  /** boolean → "Yes"/"No"; select → the chosen option; text → free text. */
  value: string;
  sensitive?: boolean;
}

export const intakeQuestionSchema = z
  .object({
    id: z.string().trim().min(1).max(40),
    label: z.string().trim().min(1).max(160),
    type: z.enum(["text", "textarea", "select", "boolean"]),
    required: z.boolean(),
    options: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
    sensitive: z.boolean().optional(),
  })
  .refine((q) => q.type !== "select" || (q.options != null && q.options.length >= 1), {
    message: "Select questions need at least one option.",
  });

export const intakeQuestionsSchema = z.array(intakeQuestionSchema).max(MAX_INTAKE_QUESTIONS);

export const intakeAnswerInputSchema = z.object({
  questionId: z.string().trim().min(1).max(40),
  value: z.string().trim().max(2000),
});

export const intakeAnswersInputSchema = z.array(intakeAnswerInputSchema).max(MAX_INTAKE_QUESTIONS);

export type IntakeAnswerInput = z.infer<typeof intakeAnswerInputSchema>;

export type IntakeValidationResult =
  | { ok: true; answers: IntakeAnswer[] }
  | { ok: false; error: string };

/**
 * Validate submitted answers against a service's questions: enforce required
 * questions, legal select/boolean values, and snapshot label + sensitive onto
 * each stored answer. Blank optional answers are dropped. Pure + side-effect
 * free so it can run on both the public booking path and in tests.
 */
export function validateIntakeAnswers(
  questions: IntakeQuestion[] | null | undefined,
  submitted: IntakeAnswerInput[] | null | undefined,
): IntakeValidationResult {
  const list = questions ?? [];
  if (list.length === 0) return { ok: true, answers: [] };

  const byId = new Map((submitted ?? []).map((a) => [a.questionId, (a.value ?? "").trim()]));
  const answers: IntakeAnswer[] = [];

  for (const q of list) {
    const raw = byId.get(q.id) ?? "";

    if (!raw) {
      if (q.required) return { ok: false, error: `Please answer: ${q.label}` };
      continue;
    }

    if (q.type === "select" && q.options && !q.options.includes(raw)) {
      return { ok: false, error: `Invalid answer for: ${q.label}` };
    }
    if (q.type === "boolean" && raw !== "Yes" && raw !== "No") {
      return { ok: false, error: `Invalid answer for: ${q.label}` };
    }

    answers.push({
      questionId: q.id,
      label: q.label,
      value: raw,
      ...(q.sensitive ? { sensitive: true } : {}),
    });
  }

  return { ok: true, answers };
}
