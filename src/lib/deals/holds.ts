import { and, eq, isNotNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { logActivity } from "@/lib/activity-log";
import { releaseDealSlotForBooking } from "@/lib/deals/claim";

const STALE_PENDING_MINUTES = 30;

export async function releaseStaleDealHolds(): Promise<{ cancelled: number; released: number }> {
  const cutoff = new Date(Date.now() - STALE_PENDING_MINUTES * 60_000);

  const stale = await db
    .select({
      id: bookings.id,
      businessId: bookings.businessId,
      status: bookings.status,
    })
    .from(bookings)
    .where(and(
      isNotNull(bookings.dealId),
      eq(bookings.status, "pending"),
      lt(bookings.createdAt, cutoff),
    ));

  let released = 0;
  for (const row of stale) {
    await db
      .update(bookings)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancellationReason: "Deal hold expired — payment not completed in time.",
      })
      .where(eq(bookings.id, row.id));

    const didRelease = await releaseDealSlotForBooking(row.id, "pending");
    if (didRelease) released++;

    void logActivity({
      businessId: row.businessId,
      entity: "booking",
      entityId: row.id,
      action: "cancelled",
      meta: { reason: "deal_hold_expired" },
    }).catch((error) => {
      console.error("Activity log write failed:", error);
    });
  }

  return { cancelled: stale.length, released };
}
