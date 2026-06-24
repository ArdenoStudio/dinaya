import { z } from "@/lib/validation";

export const bookingPageBackgroundSchema = z.enum(["white", "grouped", "custom"]);
export const bookingHeroOverlaySchema = z.enum(["light", "dark", "brand", "none"]);
export const bookingThemePresetSchema = z.enum(["classic", "salon", "spa", "bold", "custom"]);

export const bookingThemeFieldsSchema = z.object({
  accentColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Accent color must be a hex value like #2563eb.")
    .optional()
    .nullable(),
  bookingPageBackground: bookingPageBackgroundSchema.optional(),
  bookingPageBackgroundColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Background color must be a hex value.")
    .optional()
    .nullable(),
  bookingHeroOverlay: bookingHeroOverlaySchema.optional(),
  bookingHeroOverlayOpacity: z.number().int().min(0).max(100).optional(),
  bookingThemePreset: bookingThemePresetSchema.optional().nullable(),
});

export type BookingThemeFieldsInput = z.infer<typeof bookingThemeFieldsSchema>;
