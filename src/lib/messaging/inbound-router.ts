import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { format } from "date-fns";
import { db } from "@/db";
import { bookings, businesses, communications, services } from "@/db/schema";
import { sendWhatsApp } from "@/lib/messaging/channels/whatsapp";
import { buildClientBookingUrl } from "@/lib/client-tokens";
import { normalizeSriLankanPhone, toWhatsAppPhone } from "@/lib/phone";
import { generateAiCopy } from "@/lib/ai/copy";
import { FREE_WHATSAPP_REPLY_FEATURE } from "@/lib/messaging/usage";

export type InboundWhatsAppMessage = {
  fromPhone: string;
  text: string;
  waMessageId: string;
};

type Intent = "cancel" | "reschedule" | "status" | "other";

function classifyIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (/cancel|අවලංගු|ரத்து/.test(t)) return "cancel";
  if (/reschedul|re-schedul|change.*(time|book)|move.*book|වෙනස්|மாற்ற/.test(t)) return "reschedule";
  if (/status|confirm|when|what time|\btime\b|\bdate\b|වේලාව|நேரம்|දිනය/.test(t)) return "status";
  return "other";
}

/**
 * A booking's clientPhone may be stored as +94…, 94…, or 0… depending on entry.
 * Build the likely variants so an inbound number (Meta sends bare digits) matches.
 */
function phoneVariants(raw: string): string[] {
  const norm = normalizeSriLankanPhone(raw); // +94XXXXXXXXX
  const digits = norm.replace(/\D/g, ""); // 94XXXXXXXXX
  const local = digits.startsWith("94") ? `0${digits.slice(2)}` : digits;
  return Array.from(new Set([norm, digits, local, raw.trim()].filter(Boolean)));
}

const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"] as const;

const bookingColumns = {
  id: bookings.id,
  businessId: bookings.businessId,
  clientName: bookings.clientName,
  clientPhone: bookings.clientPhone,
  startsAt: bookings.startsAt,
  serviceId: bookings.serviceId,
};

function activeBookingFilter(variants: string[], businessId: string) {
  return and(
    eq(bookings.businessId, businessId),
    inArray(bookings.clientPhone, variants),
    inArray(bookings.status, [...ACTIVE_BOOKING_STATUSES]),
  );
}

/**
 * Dinaya uses one platform WhatsApp number. When a phone has bookings at multiple
 * tenants, attribute inbound messages to a single business before replying.
 */
export async function resolveInboundBusinessId(fromPhone: string): Promise<string | null> {
  const variants = phoneVariants(fromPhone);
  if (variants.length === 0) return null;

  const tenantRows = await db
    .selectDistinct({ businessId: bookings.businessId })
    .from(bookings)
    .where(and(
      inArray(bookings.clientPhone, variants),
      inArray(bookings.status, [...ACTIVE_BOOKING_STATUSES]),
    ));

  if (tenantRows.length === 0) return null;
  if (tenantRows.length === 1) return tenantRows[0]!.businessId;

  const normalized = toWhatsAppPhone(fromPhone);

  const [recentOutbound] = await db
    .select({ businessId: communications.businessId })
    .from(communications)
    .innerJoin(bookings, eq(bookings.id, communications.bookingId))
    .where(and(
      eq(communications.channel, "whatsapp"),
      eq(communications.direction, "outbound"),
      inArray(bookings.clientPhone, variants),
    ))
    .orderBy(desc(communications.sentAt), desc(communications.createdAt))
    .limit(1);

  if (recentOutbound) return recentOutbound.businessId;

  const [recentInbound] = await db
    .select({ businessId: communications.businessId })
    .from(communications)
    .where(and(
      eq(communications.channel, "whatsapp"),
      eq(communications.direction, "inbound"),
      sql`${communications.meta}->>'fromPhone' = ${normalized}`,
    ))
    .orderBy(desc(communications.createdAt))
    .limit(1);

  if (recentInbound) return recentInbound.businessId;

  return null;
}

async function findRecentBooking(fromPhone: string, now: Date, businessId: string) {
  const variants = phoneVariants(fromPhone);
  if (variants.length === 0) return null;

  const scoped = activeBookingFilter(variants, businessId);

  // Prefer the soonest upcoming booking; fall back to the most recent past one.
  const [upcoming] = await db
    .select(bookingColumns)
    .from(bookings)
    .where(and(scoped, gte(bookings.startsAt, now)))
    .orderBy(bookings.startsAt)
    .limit(1);
  if (upcoming) return upcoming;

  const [recent] = await db
    .select(bookingColumns)
    .from(bookings)
    .where(scoped)
    .orderBy(desc(bookings.startsAt))
    .limit(1);
  return recent ?? null;
}

async function alreadyProcessed(waMessageId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: communications.id })
    .from(communications)
    .where(
      and(
        eq(communications.direction, "inbound"),
        eq(communications.providerMessageId, waMessageId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

async function logComm(row: {
  businessId: string;
  bookingId: string | null;
  direction: "inbound" | "outbound";
  status: string;
  body: string;
  waMessageId: string;
  fromPhone?: string;
  providerMessageId?: string | null;
  sent?: boolean;
}) {
  await db
    .insert(communications)
    .values({
      businessId: row.businessId,
      bookingId: row.bookingId,
      channel: "whatsapp",
      direction: row.direction,
      status: row.status,
      body: row.body,
      provider: "meta-whatsapp",
      providerMessageId: row.providerMessageId ?? null,
      // Tagged free: in-window bot traffic doesn't draw down the paid allowance.
      feature: FREE_WHATSAPP_REPLY_FEATURE,
      idempotencyKey: `wa-${row.direction}:${row.waMessageId}`,
      meta: row.fromPhone ? { fromPhone: row.fromPhone } : null,
      sentAt: row.sent ? new Date() : null,
    })
    .onConflictDoNothing();
}

function whenLabel(startsAt: Date | string): string {
  return format(new Date(startsAt), "d MMM 'at' h:mm a");
}

/**
 * Handle one inbound WhatsApp message: resolve the client's booking (and thus
 * business), classify intent, and reply with free-form text (allowed because the
 * inbound message just opened a 24h service window). Replies point to the secure
 * client manage page rather than mutating bookings directly.
 */
export async function handleInboundWhatsApp(msg: InboundWhatsAppMessage): Promise<void> {
  const text = msg.text?.trim();
  if (!text || !msg.waMessageId) return;
  if (await alreadyProcessed(msg.waMessageId)) return;

  const now = new Date();
  const normalizedFrom = toWhatsAppPhone(msg.fromPhone);
  const businessId = await resolveInboundBusinessId(msg.fromPhone);
  const booking = businessId ? await findRecentBooking(msg.fromPhone, now, businessId) : null;

  if (!booking) {
    // No unambiguous tenant context — never disclose another business's booking details.
    await sendWhatsApp({
      clientPhone: msg.fromPhone,
      body: "Thanks for your message! We couldn't find a booking linked to this number. To book, please use the link your provider shared with you.",
    });
    return;
  }

  await logComm({
    businessId: booking.businessId,
    bookingId: booking.id,
    direction: "inbound",
    status: "received",
    body: text,
    waMessageId: msg.waMessageId,
    fromPhone: normalizedFrom,
    providerMessageId: msg.waMessageId,
  });

  const [business] = await db
    .select({ name: businesses.name })
    .from(businesses)
    .where(eq(businesses.id, booking.businessId))
    .limit(1);
  const [service] = booking.serviceId
    ? await db
        .select({ name: services.name })
        .from(services)
        .where(eq(services.id, booking.serviceId))
        .limit(1)
    : [];

  const businessName = business?.name ?? "your provider";
  const serviceName = service?.name ?? "appointment";
  const manageUrl = buildClientBookingUrl({ bookingId: booking.id, clientPhone: booking.clientPhone });
  const when = whenLabel(booking.startsAt);
  const intent = classifyIntent(text);

  let reply: string;
  if (intent === "status") {
    reply = `Hi ${booking.clientName}, your ${serviceName} at ${businessName} is on ${when}. Manage it here: ${manageUrl}`;
  } else if (intent === "cancel") {
    reply = `To cancel your ${serviceName} at ${businessName} on ${when}, tap here: ${manageUrl}`;
  } else if (intent === "reschedule") {
    reply = `To reschedule your ${serviceName} at ${businessName} (currently ${when}), tap here: ${manageUrl}`;
  } else {
    const ai = await generateAiCopy({
      businessName,
      clientName: booking.clientName,
      feature: "whatsappSms",
      serviceName,
      startsAtLabel: when,
      bookingUrl: manageUrl,
      extra: `The client messaged on WhatsApp: "${text}". Write a short, warm, helpful reply.`,
    });
    reply = ai.body?.trim()
      || `Hi ${booking.clientName}, thanks for messaging ${businessName}. Your ${serviceName} is on ${when}: ${manageUrl}`;
  }

  const result = await sendWhatsApp({ clientPhone: msg.fromPhone, body: reply });
  await logComm({
    businessId: booking.businessId,
    bookingId: booking.id,
    direction: "outbound",
    status: result.status,
    body: reply,
    waMessageId: msg.waMessageId,
    providerMessageId: result.providerMessageId,
    sent: result.status === "sent",
  });
}
