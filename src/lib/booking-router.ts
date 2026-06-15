import { z } from "@/lib/validation";

/**
 * Service router: an optional first-step question on the booking page whose
 * answers each map to a service ("What do you need? → Cleaning / Emergency").
 * Picking an option selects that service, after which the normal date/staff
 * flow runs — so routing reuses the existing service→staff eligibility.
 *
 * Stored on `businesses.booking_router` (jsonb). Pro+ feature.
 */

export const MAX_ROUTER_OPTIONS = 8;

export interface BookingRouterOption {
  id: string;
  label: string;
  serviceId: string;
}

export interface BookingRouter {
  enabled: boolean;
  question: string;
  options: BookingRouterOption[];
}

export const bookingRouterOptionSchema = z.object({
  id: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(120),
  serviceId: z.uuid(),
});

export const bookingRouterSchema = z.object({
  enabled: z.boolean(),
  question: z.string().trim().min(1).max(160),
  options: z.array(bookingRouterOptionSchema).max(MAX_ROUTER_OPTIONS),
});

/**
 * Reduce a stored router to what should actually drive the booking page:
 * keep only options whose service still exists and is bookable. Returns null
 * when the router is disabled, missing, or has no usable options — callers can
 * treat null as "no router, show the normal service list".
 */
export function resolveActiveRouter(
  router: BookingRouter | null | undefined,
  validServiceIds: Iterable<string>,
): BookingRouter | null {
  if (!router || !router.enabled) return null;

  const valid = validServiceIds instanceof Set ? validServiceIds : new Set(validServiceIds);
  const seen = new Set<string>();
  const options = router.options.filter((o) => {
    if (!valid.has(o.serviceId) || seen.has(o.serviceId)) return false;
    seen.add(o.serviceId);
    return true;
  });

  if (options.length === 0) return null;
  return { ...router, options };
}

/** The service id an option points at, or null if the option isn't found. */
export function routerOptionServiceId(
  router: BookingRouter | null | undefined,
  optionId: string,
): string | null {
  return router?.options.find((o) => o.id === optionId)?.serviceId ?? null;
}
