import type { BookingLanguage } from "@/lib/i18n";

/**
 * A business-initiated WhatsApp message must be sent as a pre-approved template
 * (Meta rejects free-form `type:"text"` outside an open 24h service window).
 * This descriptor is built where the booking data lives and passed through to
 * the WhatsApp channel.
 */
export type WhatsAppTemplate = {
  name: string;
  languageCode: string;
  bodyParams: string[];
};

const META_LANGUAGE_CODES: Record<BookingLanguage, string> = {
  en: "en",
  si: "si",
  ta: "ta",
};

/**
 * Approved template names. Submit these in Meta Business Manager (utility
 * category) with the variable order documented alongside each call site before
 * enabling WhatsApp sends. See docs/whatsapp-template-setup.md.
 */
export const WHATSAPP_TEMPLATES = {
  confirmation: "booking_confirmation",
  reminder: "booking_reminder",
  cancellation: "booking_cancellation",
  reschedule: "booking_reschedule",
  ownerNewBooking: "owner_new_booking",
} as const;

function resolveLanguage(language: BookingLanguage | undefined): string {
  return META_LANGUAGE_CODES[language ?? "en"] ?? "en";
}

/**
 * Meta requires body parameters to be non-empty and free of newlines, tabs, or
 * runs of 4+ spaces — otherwise the send fails at delivery time. Sanitize each
 * value so an approved template always renders.
 */
function sanitizeParam(value: string | null | undefined, fallback = "—"): string {
  const cleaned = (value ?? "")
    .replace(/[\n\t]+/g, " ")
    .replace(/ {4,}/g, "   ")
    .trim();
  return cleaned.length > 0 ? cleaned : fallback;
}

export function buildWhatsAppTemplate(
  name: string,
  language: BookingLanguage | undefined,
  params: Array<string | null | undefined>,
): WhatsAppTemplate {
  return {
    name,
    languageCode: resolveLanguage(language),
    bodyParams: params.map((param) => sanitizeParam(param)),
  };
}
