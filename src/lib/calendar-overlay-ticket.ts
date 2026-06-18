import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getAppSecret } from "@/lib/app-secret";
import type { BookingLanguage } from "@/lib/i18n";

const TICKET_TTL_MS = 30 * 60 * 1000;

type CalendarOverlayTicketPayload = {
  origin: string;
  channel: string;
  exp: number;
  language?: BookingLanguage;
};

function encode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function decode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payload: string): string {
  return createHmac("sha256", getAppSecret("Calendar overlay ticket"))
    .update(payload)
    .digest("base64url");
}

export function createCalendarOverlayTicket(
  origin: string,
  language: BookingLanguage = "en",
): {
  ticket: string;
  channel: string;
} {
  const normalizedOrigin = new URL(origin).origin;
  const channel = randomBytes(18).toString("base64url");
  const payload = encode(
    JSON.stringify({
      origin: normalizedOrigin,
      channel,
      language,
      exp: Date.now() + TICKET_TTL_MS,
    } satisfies CalendarOverlayTicketPayload),
  );

  return {
    ticket: `${payload}.${sign(payload)}`,
    channel,
  };
}

export function verifyCalendarOverlayTicket(
  ticket: string,
): CalendarOverlayTicketPayload | null {
  const [payload, signature] = ticket.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(decode(payload)) as CalendarOverlayTicketPayload;
    const origin = new URL(parsed.origin);
    if (!["http:", "https:"].includes(origin.protocol)) return null;
    if (!parsed.channel || parsed.exp < Date.now()) return null;
    const language =
      parsed.language === "si" || parsed.language === "ta" ? parsed.language : "en";
    return { ...parsed, origin: origin.origin, language };
  } catch {
    return null;
  }
}
