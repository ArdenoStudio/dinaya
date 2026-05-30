import { db } from "@/db";
import { bookings, deals } from "@/db/schema";
import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import type { DealRow } from "@/lib/deals/validation";

export async function claimDealSlot(dealId: string): Promise<DealRow | null> {
  const result = await db.execute(sql`
    UPDATE deals
    SET slots_redeemed = slots_redeemed + 1,
        status = CASE
          WHEN slots_redeemed + 1 >= slots_total THEN 'sold_out'::deal_status
          ELSE status
        END
    WHERE id = ${dealId}
      AND status = 'active'
      AND slots_redeemed < slots_total
      AND now() >= deal_window_start
      AND now() <= deal_window_end
    RETURNING *
  `);

  const rows = (result as unknown as { rows?: DealRow[] }).rows ?? [];
  return rows[0] ?? null;
}

export async function releaseDealSlot(dealId: string): Promise<DealRow | null> {
  const result = await db.execute(sql`
    UPDATE deals
    SET slots_redeemed = GREATEST(0, slots_redeemed - 1),
        status = CASE
          WHEN status = 'sold_out'::deal_status
            AND slots_redeemed - 1 < slots_total THEN 'active'::deal_status
          ELSE status
        END
    WHERE id = ${dealId}
      AND slots_redeemed > 0
    RETURNING *
  `);

  const rows = (result as unknown as { rows?: DealRow[] }).rows ?? [];
  return rows[0] ?? null;
}

export function shouldReleaseDealSlotOnCancel(priorStatus: string): boolean {
  return priorStatus === "pending";
}

export async function releaseDealSlotForBooking(
  bookingId: string,
  priorStatus: string,
): Promise<boolean> {
  if (!shouldReleaseDealSlotOnCancel(priorStatus)) {
    return false;
  }

  // Atomically claim the release: a single UPDATE flips deal_slot_released
  // false -> true and returns the deal id. Only the call that actually flips
  // the flag proceeds to decrement, so two concurrent cancels of the same
  // booking can't double-release the slot. The dealId guard also leaves
  // non-deal bookings untouched (matching the previous behaviour).
  const [claimed] = await db
    .update(bookings)
    .set({ dealSlotReleased: true })
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.dealSlotReleased, false),
        isNotNull(bookings.dealId),
      ),
    )
    .returning({ dealId: bookings.dealId });

  if (!claimed?.dealId) {
    return false;
  }

  const released = await releaseDealSlot(claimed.dealId);
  return Boolean(released);
}

export async function incrementDealImpressions(dealIds: string[]): Promise<void> {
  if (dealIds.length === 0) return;
  await db
    .update(deals)
    .set({ impressionCount: sql`${deals.impressionCount} + 1` })
    .where(inArray(deals.id, dealIds));
}
