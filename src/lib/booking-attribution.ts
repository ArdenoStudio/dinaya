export type BookingAttribution = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referralCode?: string | null;
  channel?: string | null;
};

const STORAGE_PREFIX = "dinaya_attribution_";

export function attributionStorageKey(businessId: string): string {
  return `${STORAGE_PREFIX}${businessId}`;
}

export function parseAttributionFromSearchParams(params: URLSearchParams): BookingAttribution {
  const utmSource = params.get("utm_source")?.trim() || null;
  const utmMedium = params.get("utm_medium")?.trim() || null;
  const utmCampaign = params.get("utm_campaign")?.trim() || null;
  const referralCode = params.get("ref")?.trim().toLowerCase() || null;
  const channel = params.get("channel")?.trim().toLowerCase() || null;

  if (!utmSource && !utmMedium && !utmCampaign && !referralCode && !channel) {
    return {};
  }

  return {
    utmSource,
    utmMedium,
    utmCampaign,
    referralCode,
    channel,
  };
}

export function mergeAttribution(
  base: BookingAttribution,
  extra: BookingAttribution,
): BookingAttribution {
  return {
    utmSource: extra.utmSource ?? base.utmSource ?? null,
    utmMedium: extra.utmMedium ?? base.utmMedium ?? null,
    utmCampaign: extra.utmCampaign ?? base.utmCampaign ?? null,
    referralCode: extra.referralCode ?? base.referralCode ?? null,
    channel: extra.channel ?? base.channel ?? null,
  };
}

export function resolveBookingSource(attribution?: BookingAttribution | null): string {
  if (!attribution) return "public";

  if (attribution.referralCode) return "referral";
  if (attribution.channel === "directory") return "directory";
  if (attribution.channel === "embed") return "embed";

  const utmSource = attribution.utmSource?.toLowerCase();
  if (!utmSource) return "public";

  if (["instagram", "ig", "insta"].includes(utmSource)) return "instagram";
  if (["whatsapp", "wa"].includes(utmSource)) return "whatsapp";
  if (["facebook", "fb"].includes(utmSource)) return "facebook";
  if (["discover", "directory"].includes(utmSource)) return "directory";
  if (["google", "gmb"].includes(utmSource)) return "google";

  return utmSource.slice(0, 40);
}

export function resolveClientSource(
  bookingSource: string,
  attribution?: BookingAttribution | null,
): string {
  if (bookingSource === "manual") return "manual";
  if (attribution?.referralCode) return `referral:${attribution.referralCode}`;
  if (attribution?.utmSource) return `utm:${attribution.utmSource}`;
  if (bookingSource !== "public") return bookingSource;
  return "booking_page";
}

export function readStoredAttribution(businessId: string): BookingAttribution | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(attributionStorageKey(businessId));
    if (!raw) return null;
    return JSON.parse(raw) as BookingAttribution;
  } catch {
    return null;
  }
}

export function storeAttribution(businessId: string, attribution: BookingAttribution): void {
  if (typeof window === "undefined") return;
  if (!Object.values(attribution).some(Boolean)) return;

  sessionStorage.setItem(attributionStorageKey(businessId), JSON.stringify(attribution));
}

export function appendReferralToUrl(url: string, referralCode: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set("ref", referralCode);
  return parsed.toString();
}
