import { z } from "@/lib/validation";

/**
 * Per-service price options (e.g. a wax service priced differently by product
 * used). Options live on `services.price_variants` (jsonb); the option chosen
 * at booking time is snapshotted onto `bookings.price_variant` (jsonb) —
 * including its label and price — so later edits to a service's options never
 * rewrite the price (or the product used) on a past booking. Mirrors the
 * intake-questions/intake-answers snapshot idiom in `src/lib/intake.ts`.
 */

export const MAX_PRICE_VARIANTS = 10;

export interface ServicePriceVariant {
  id: string;
  label: string;
  priceLkr: number;
}

export const servicePriceVariantSchema = z.object({
  id: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(120),
  priceLkr: z.coerce.number().int().min(0),
});

export const servicePriceVariantsSchema = z.array(servicePriceVariantSchema).max(MAX_PRICE_VARIANTS);

export type PriceVariantResolution =
  | { ok: true; variant: ServicePriceVariant | null }
  | { ok: false; error: string };

/**
 * Resolve + validate a client-submitted variant id against a service's
 * actual stored options. Pure + side-effect free so it can run on both the
 * public booking path and in tests. `variant: null` means "no options
 * configured — use the base priceLkr", the outcome for most services.
 */
export function resolvePriceVariantSelection(
  variants: ServicePriceVariant[] | null | undefined,
  submittedId: string | null | undefined,
): PriceVariantResolution {
  const list = variants ?? [];
  if (list.length === 0) return { ok: true, variant: null };

  if (!submittedId) {
    return { ok: false, error: "Please choose an option for this service." };
  }

  const match = list.find((v) => v.id === submittedId);
  if (!match) {
    return { ok: false, error: "That option is no longer available. Please choose again." };
  }

  return { ok: true, variant: match };
}

/** Lowest price among a service's options — used for "From LKR X" display before a customer picks one. */
export function minPriceVariantLkr(variants: ServicePriceVariant[] | null | undefined): number | null {
  const list = variants ?? [];
  if (list.length === 0) return null;
  return list.reduce((min, v) => Math.min(min, v.priceLkr), list[0]!.priceLkr);
}
