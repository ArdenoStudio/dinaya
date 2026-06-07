const LEGACY_FALLBACK_DATE = "1970-01-01T00:00:00.000Z";

type DateLike = Date | number | string | null | undefined;

function parseDateLike(value: DateLike): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export function isoDateString(value: DateLike): string {
  return parseDateLike(value)?.toISOString() ?? LEGACY_FALLBACK_DATE;
}

export function nullableIsoDateString(value: DateLike): string | null {
  return parseDateLike(value)?.toISOString() ?? null;
}
