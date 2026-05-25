const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;
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
