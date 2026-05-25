import { appendReferralToUrl, type BookingAttribution } from "@/lib/booking-attribution";
import { buildPublicBookingUrl, type PublicBookingUrlInput } from "@/lib/booking-url";

export function normalizeReferralCode(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export function buildReferralBookingUrl(
  business: PublicBookingUrlInput & { referralCode?: string | null },
): string {
  const baseUrl = buildPublicBookingUrl(business);
  const code = business.referralCode?.trim();
  if (!code) return baseUrl;
  return appendReferralToUrl(baseUrl, code);
}

function resolveAppBaseForUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    try {
      return new URL(`https://${raw}`).toString().replace(/\/$/, "");
    } catch {
      return "http://localhost:3000";
    }
  }
}

export function buildPlatformReferralUrl(referralCode: string): string {
  const url = new URL("/register", resolveAppBaseForUrl());
  url.searchParams.set("ref", normalizeReferralCode(referralCode));
  return url.toString();
}

export function attributionFromReferralCode(referralCode: string): BookingAttribution {
  return { referralCode: normalizeReferralCode(referralCode) };
}
