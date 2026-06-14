import { startOfMonth } from "date-fns";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { communications } from "@/db/schema";

/**
 * Free-form replies the bot sends inside an open 24h service window are free on
 * Meta, so they're tagged with this feature and excluded from billable usage.
 */
export const FREE_WHATSAPP_REPLY_FEATURE = "whatsapp_inbound_reply";

/**
 * WhatsApp usage is derived from the existing `communications` log — every send
 * is recorded there — so metering needs no new table. Counts only billable
 * outbound WhatsApp messages that actually went out this calendar month.
 */
export async function getWhatsAppUsageThisMonth(
  businessId: string,
  now = new Date(),
): Promise<number> {
  const monthStart = startOfMonth(now);
  const [row] = await db
    .select({ value: count() })
    .from(communications)
    .where(
      and(
        eq(communications.businessId, businessId),
        eq(communications.channel, "whatsapp"),
        eq(communications.status, "sent"),
        gte(communications.sentAt, monthStart),
        // Free in-window bot replies don't draw down the paid allowance.
        sql`${communications.feature} is distinct from ${FREE_WHATSAPP_REPLY_FEATURE}`,
      ),
    );
  return Number(row?.value ?? 0);
}

export type WhatsAppAllowanceState = {
  used: number;
  /** `null` means unlimited (no cap configured for the plan). */
  included: number | null;
  remaining: number | null;
  overBy: number;
  isOver: boolean;
  /** 0–1 fraction of the allowance used (null when unlimited). */
  ratio: number | null;
};

/** Pure helper: turn a usage count + plan allowance into a display/enforcement state. */
export function whatsappAllowanceState(
  used: number,
  included: number | null,
): WhatsAppAllowanceState {
  if (included === null) {
    return { used, included: null, remaining: null, overBy: 0, isOver: false, ratio: null };
  }
  const remaining = Math.max(0, included - used);
  const overBy = Math.max(0, used - included);
  return {
    used,
    included,
    remaining,
    overBy,
    isOver: included > 0 ? used >= included : true,
    ratio: included > 0 ? Math.min(1, used / included) : 1,
  };
}
