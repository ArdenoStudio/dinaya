/**
 * Guards public booking APIs that accept a booking UUID.
 * The business slug must match — UUID alone is not sufficient.
 */

export function parseRequiredBusinessSlug(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length > 80) return null;
  return trimmed;
}

export function bookingBelongsToSlug(businessSlug: string, requestedSlug: string): boolean {
  return businessSlug === requestedSlug;
}
