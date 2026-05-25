import { db } from "@/db";
import { deals } from "@/db/schema";
import { inArray, sql } from "drizzle-orm";
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

export async function incrementDealImpressions(dealIds: string[]): Promise<void> {
  if (dealIds.length === 0) return;
  await db
    .update(deals)
    .set({ impressionCount: sql`${deals.impressionCount} + 1` })
    .where(inArray(deals.id, dealIds));
}
