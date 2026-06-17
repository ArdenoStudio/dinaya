const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
// Auto-on under `next dev`; opt-in elsewhere via NEXT_PUBLIC_ANALYTICS_DEBUG=true.
const ANALYTICS_DEBUG =
  process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true" ||
  process.env.NODE_ENV === "development";

type DealEventParams = {
  dealId: string;
  businessSlug: string;
  discountPercent: number;
  city?: string | null;
  category?: string | null;
  sourcePage?: string;
  serviceId?: string;
  discountedPriceLkr?: number;
  bookingId?: string;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function trackEvent(eventName: string, params: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // Surface events in the browser console so wiring can be verified without a
  // GA account. No-op in production unless the debug flag is explicitly set.
  if (ANALYTICS_DEBUG) {
    console.log(`[analytics] ${eventName}`, params);
  }
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  window.gtag("event", eventName, params);
}

export function trackDealImpression(params: DealEventParams) {
  trackEvent("deal_impression", {
    deal_id: params.dealId,
    business_slug: params.businessSlug,
    discount_percent: params.discountPercent,
    city: params.city ?? undefined,
    category: params.category ?? undefined,
    source_page: params.sourcePage ?? "discover",
  });
}

export function trackDealClick(params: DealEventParams) {
  trackEvent("deal_click", {
    deal_id: params.dealId,
    business_slug: params.businessSlug,
    discount_percent: params.discountPercent,
    city: params.city ?? undefined,
    category: params.category ?? undefined,
    source_page: params.sourcePage ?? "discover",
  });
}

export function trackDealBookingStart(params: DealEventParams) {
  trackEvent("deal_booking_start", {
    deal_id: params.dealId,
    service_id: params.serviceId,
    business_slug: params.businessSlug,
  });
}

export function trackDealBookingComplete(params: DealEventParams) {
  trackEvent("deal_booking_complete", {
    deal_id: params.dealId,
    booking_id: params.bookingId,
    discounted_price_lkr: params.discountedPriceLkr,
    business_slug: params.businessSlug,
  });
}

// ── Core funnel events (fire for ALL bookings/signups, not just deals) ──────

export function trackBookingStart(params: {
  businessSlug: string;
  serviceId?: string;
  isDeal?: boolean;
}) {
  trackEvent("booking_start", {
    business_slug: params.businessSlug,
    service_id: params.serviceId,
    is_deal: params.isDeal ?? false,
  });
}

export function trackBookingComplete(params: {
  businessSlug: string;
  serviceId?: string;
  bookingId?: string;
  amountLkr?: number;
  isDeal?: boolean;
  requiresPayment?: boolean;
}) {
  trackEvent("booking_complete", {
    business_slug: params.businessSlug,
    service_id: params.serviceId,
    booking_id: params.bookingId,
    // GA4 revenue convention — lets GA compute booking value automatically.
    value: params.amountLkr,
    currency: "LKR",
    is_deal: params.isDeal ?? false,
    requires_payment: params.requiresPayment ?? false,
  });
}

export function trackSignup(params: { businessType?: string; language?: string }) {
  trackEvent("sign_up", {
    business_type: params.businessType,
    language: params.language,
  });
}

export function trackOnboardingComplete(params: { businessSlug?: string } = {}) {
  trackEvent("onboarding_complete", {
    business_slug: params.businessSlug,
  });
}

export function trackPlanUpgradeStart(params: { plan: string; interval: string }) {
  trackEvent("plan_upgrade_start", {
    plan: params.plan,
    interval: params.interval,
  });
}
