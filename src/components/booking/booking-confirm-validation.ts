import type { IntakeQuestion } from "@/lib/intake";

export type ConfirmFieldErrors = {
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  intake?: Record<string, string>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

export function validateConfirmFields(input: {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  intakeQuestions: IntakeQuestion[];
  intakeAnswers: Record<string, string>;
  messages: {
    nameRequired: string;
    phoneRequired: string;
    phoneInvalid: string;
    emailInvalid: string;
    intakeRequired: (label: string) => string;
  };
}): { valid: boolean; errors: ConfirmFieldErrors; firstError?: string } {
  const errors: ConfirmFieldErrors = {};
  const intakeErrors: Record<string, string> = {};

  const name = input.clientName.trim();
  if (!name) {
    errors.clientName = input.messages.nameRequired;
  }

  const phone = input.clientPhone.trim();
  if (!phone) {
    errors.clientPhone = input.messages.phoneRequired;
  } else if (!isValidPhone(phone)) {
    errors.clientPhone = input.messages.phoneInvalid;
  }

  const email = input.clientEmail.trim();
  if (email && !isValidEmail(email)) {
    errors.clientEmail = input.messages.emailInvalid;
  }

  for (const q of input.intakeQuestions) {
    if (!q.required) continue;
    const value = (input.intakeAnswers[q.id] ?? "").trim();
    if (!value) {
      intakeErrors[q.id] = input.messages.intakeRequired(q.label);
    }
  }

  if (Object.keys(intakeErrors).length > 0) {
    errors.intake = intakeErrors;
  }

  const firstError =
    errors.clientName ??
    errors.clientPhone ??
    errors.clientEmail ??
    Object.values(intakeErrors)[0];

  return {
    valid: !errors.clientName && !errors.clientPhone && !errors.clientEmail && !errors.intake,
    errors,
    firstError,
  };
}

/** DOM id of the first invalid field — for focus + scroll on submit. */
export function firstConfirmFieldId(
  errors: ConfirmFieldErrors,
  intakeQuestions: IntakeQuestion[],
): string | null {
  if (errors.clientName) return "clientName";
  if (errors.clientPhone) return "clientPhone";
  if (errors.clientEmail) return "clientEmail";
  if (errors.intake) {
    const question = intakeQuestions.find((q) => errors.intake?.[q.id]);
    if (question) return `intake-${question.id}`;
  }
  return null;
}
