const DEFAULT_FLAG = true;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function desktopNativeBookingsEnabled(businessId: string): boolean {
  const configured = process.env.DESKTOP_NATIVE_BOOKINGS_BUSINESS_IDS;
  if (!configured) return DEFAULT_FLAG;

  const values = configured
    .split(",")
    .map(normalize)
    .filter(Boolean);

  if (values.includes("*")) return true;
  return values.includes(normalize(businessId));
}
