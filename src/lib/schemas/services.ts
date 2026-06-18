import { z } from "@/lib/validation";
import { intakeQuestionsSchema } from "@/lib/intake";

export const serviceCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  imageUrl: z.string().trim().max(2000).optional().nullable(),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  priceLkr: z.coerce.number().int().min(0).optional(),
  requiresPayment: z.boolean().optional(),
  depositPercent: z.coerce.number().int().min(0).max(100).optional(),
  beforeBuffer: z.coerce.number().int().min(0).max(120).optional(),
  afterBuffer: z.coerce.number().int().min(0).max(120).optional(),
  minimumNoticeHours: z.coerce.number().int().min(0).max(168).optional(),
  dailyCapacity: z.coerce.number().int().min(1).max(1000).optional().nullable(),
  maximumAdvanceDays: z.coerce.number().int().min(1).max(365).optional().nullable(),
  intakeQuestions: intakeQuestionsSchema.optional().nullable(),
  successRedirectUrl: z
    .string()
    .trim()
    .max(2000)
    .refine(
      (value) =>
        !value ||
        /^https:\/\/[^\s/$.?#].[^\s]*$/i.test(value) ||
        /^\/(?!\/)[a-zA-Z0-9/_\-?=&%.]*$/.test(value),
      { message: "Enter an https:// URL or a same-site path starting with /." },
    )
    .optional()
    .nullable(),
});

export const serviceUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
  imageUrl: z.string().trim().max(2000).optional().nullable(),
    durationMinutes: z.coerce.number().int().min(5).max(480).optional(),
    priceLkr: z.coerce.number().int().min(0).optional(),
    depositPercent: z.coerce.number().int().min(0).max(100).optional(),
    requiresPayment: z.boolean().optional(),
    isActive: z.boolean().optional(),
    forceDeactivate: z.boolean().optional(),
    beforeBuffer: z.coerce.number().int().min(0).max(120).optional(),
    afterBuffer: z.coerce.number().int().min(0).max(120).optional(),
    minimumNoticeHours: z.coerce.number().int().min(0).max(168).optional(),
    dailyCapacity: z.coerce.number().int().min(1).max(1000).optional().nullable(),
    maximumAdvanceDays: z.coerce.number().int().min(1).max(365).optional().nullable(),
    intakeQuestions: intakeQuestionsSchema.optional().nullable(),
    successRedirectUrl: z
      .string()
      .trim()
      .max(2000)
      .refine(
        (value) =>
        !value ||
        /^https:\/\/[^\s/$.?#].[^\s]*$/i.test(value) ||
        /^\/(?!\/)[a-zA-Z0-9/_\-?=&%.]*$/.test(value),
        { message: "Enter an https:// URL or a same-site path starting with /." },
      )
      .optional()
      .nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required.",
  });
