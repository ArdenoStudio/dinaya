import { and, eq, gt, lt, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { services, slotReservations } from "@/db/schema";
import { SLOT_HOLD_MINUTES } from "@/lib/booking-session";
import { allocateServiceSlug } from "@/lib/service-slug";
import { hasPublicColumn } from "@/lib/dashboard/db-compat";

export type SlotReservationInput = {
  businessId: string;
  staffId: string;
  serviceId: string;
  startsAt: Date;
  endsAt: Date;
  sessionToken: string;
};

export async function purgeExpiredSlotReservations(): Promise<void> {
  await db.delete(slotReservations).where(lt(slotReservations.expiresAt, new Date()));
}

export async function createSlotReservation(input: SlotReservationInput) {
  await purgeExpiredSlotReservations();

  const expiresAt = new Date(Date.now() + SLOT_HOLD_MINUTES * 60 * 1000);

  // Release any prior hold for this browser session.
  await db
    .delete(slotReservations)
    .where(eq(slotReservations.sessionToken, input.sessionToken));

  const overlapping = await db
    .select({ id: slotReservations.id })
    .from(slotReservations)
    .where(
      and(
        eq(slotReservations.staffId, input.staffId),
        lt(slotReservations.startsAt, input.endsAt),
        gt(slotReservations.endsAt, input.startsAt),
        gt(slotReservations.expiresAt, new Date()),
        ne(slotReservations.sessionToken, input.sessionToken),
      ),
    )
    .limit(1);

  if (overlapping.length > 0) {
    return { ok: false as const, reason: "slot_taken" as const };
  }

  const [row] = await db
    .insert(slotReservations)
    .values({
      businessId: input.businessId,
      staffId: input.staffId,
      serviceId: input.serviceId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      sessionToken: input.sessionToken,
      expiresAt,
    })
    .returning({
      id: slotReservations.id,
      expiresAt: slotReservations.expiresAt,
    });

  return { ok: true as const, reservation: row };
}

export async function releaseSlotReservation(sessionToken: string): Promise<void> {
  await db.delete(slotReservations).where(eq(slotReservations.sessionToken, sessionToken));
}

export async function getActiveReservationsForStaff(
  staffId: string,
  dayStartUtc: Date,
  dayEndUtc: Date,
  excludeSessionToken?: string,
) {
  await purgeExpiredSlotReservations();

  const conditions = [
    eq(slotReservations.staffId, staffId),
    lt(slotReservations.startsAt, dayEndUtc),
    gt(slotReservations.endsAt, dayStartUtc),
    gt(slotReservations.expiresAt, new Date()),
  ];

  if (excludeSessionToken) {
    conditions.push(ne(slotReservations.sessionToken, excludeSessionToken));
  }

  return db
    .select({
      startsAt: slotReservations.startsAt,
      endsAt: slotReservations.endsAt,
    })
    .from(slotReservations)
    .where(and(...conditions));
}

export async function verifySlotReservation(input: {
  sessionToken: string;
  staffId: string;
  startsAt: Date;
  endsAt: Date;
}): Promise<boolean> {
  await purgeExpiredSlotReservations();

  const [row] = await db
    .select({ id: slotReservations.id })
    .from(slotReservations)
    .where(
      and(
        eq(slotReservations.sessionToken, input.sessionToken),
        eq(slotReservations.staffId, input.staffId),
        eq(slotReservations.startsAt, input.startsAt),
        eq(slotReservations.endsAt, input.endsAt),
        gt(slotReservations.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return Boolean(row);
}

/** Overlap check used before confirming a booking. */
export async function isSlotBlockedByReservation(
  staffId: string,
  startsAt: Date,
  endsAt: Date,
  sessionToken?: string,
): Promise<boolean> {
  await purgeExpiredSlotReservations();

  const conditions = [
    eq(slotReservations.staffId, staffId),
    lt(slotReservations.startsAt, endsAt),
    gt(slotReservations.endsAt, startsAt),
    gt(slotReservations.expiresAt, new Date()),
  ];

  if (sessionToken) {
    conditions.push(ne(slotReservations.sessionToken, sessionToken));
  }

  const [row] = await db
    .select({ id: slotReservations.id })
    .from(slotReservations)
    .where(and(...conditions))
    .limit(1);

  return Boolean(row);
}

export async function touchSlotReservation(sessionToken: string): Promise<Date | null> {
  const expiresAt = new Date(Date.now() + SLOT_HOLD_MINUTES * 60 * 1000);
  const [row] = await db
    .update(slotReservations)
    .set({ expiresAt })
    .where(
      and(eq(slotReservations.sessionToken, sessionToken), gt(slotReservations.expiresAt, new Date())),
    )
    .returning({ expiresAt: slotReservations.expiresAt });

  return row?.expiresAt ?? null;
}

export async function backfillServiceSlugsForBusiness(businessId: string): Promise<void> {
  if (!(await hasPublicColumn("services", "slug"))) return;

  const rows = await db
    .select({ id: services.id, name: services.name, slug: services.slug })
    .from(services)
    .where(and(eq(services.businessId, businessId), sql`${services.slug} IS NULL`));

  for (const row of rows) {
    const slug = await allocateServiceSlug(businessId, row.name, row.id);
    await db.update(services).set({ slug }).where(eq(services.id, row.id));
  }
}
