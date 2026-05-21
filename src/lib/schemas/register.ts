import { z } from "@/lib/validation";

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  businessName: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens."),
  email: z.email(),
  password: z.string().min(8).max(128),
  businessType: z
    .enum([
      "salon_barber",
      "clinic",
      "tuition",
      "vehicle_service",
      "photography",
      "consulting",
      "spa_wellness",
      "other",
    ])
    .optional(),
  language: z.enum(["en", "si", "ta"]).optional(),
  referrerCode: z.string().trim().max(40).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
