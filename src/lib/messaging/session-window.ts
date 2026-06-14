import { and, eq, gte, sql } from "drizzle-orm";
import { subHours } from "date-fns";
import { db } from "@/db";
import { communications } from "@/db/schema";
import { toWhatsAppPhone } from "@/lib/phone";

/** Meta's free customer-service window after a user messages the business. */
export const SERVICE_WINDOW_HOURS = 24;

/**
 * True when the client has sent an inbound WhatsApp message within the last 24h.
 * Inside this window we can reply with free-form text and any utility/template
 * message is free — used to avoid charging the allowance for in-window sends.
 * Inbound rows store the sender in `meta.fromPhone` (see inbound-router).
 */
export async function isWithinServiceWindow(
  clientPhone: string,
  now = new Date(),
): Promise<boolean> {
  const normalized = toWhatsAppPhone(clientPhone);
  if (!normalized) return false;
  const since = subHours(now, SERVICE_WINDOW_HOURS);
  const [row] = await db
    .select({ id: communications.id })
    .from(communications)
    .where(
      and(
        eq(communications.channel, "whatsapp"),
        eq(communications.direction, "inbound"),
        gte(communications.createdAt, since),
        sql`${communications.meta}->>'fromPhone' = ${normalized}`,
      ),
    )
    .limit(1);
  return Boolean(row);
}
