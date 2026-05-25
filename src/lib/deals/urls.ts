export function buildDealBookingUrl(slug: string, dealId: string): string {
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost:3000";
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const appUrl = rawAppUrl.startsWith("http") ? rawAppUrl : `https://${rawAppUrl}`;
  const base = appDomain === "dinaya.lk"
    ? `https://${slug}.dinaya.lk`
    : `${appUrl}/book/${slug}`;
  const params = new URLSearchParams({
    dealId,
    channel: "deals",
    utm_source: "discover",
    utm_medium: "deals",
  });
  return `${base}?${params.toString()}`;
}

export function buildDealFormUrl(params: {
  serviceId?: string;
  staffId?: string;
  locationId?: string;
  discountPercent?: number;
  slotsTotal?: number;
  apptWindowStart?: string;
  apptWindowEnd?: string;
  suggestionId?: string;
}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `/dashboard/deals/new?${query}` : "/dashboard/deals/new";
}
