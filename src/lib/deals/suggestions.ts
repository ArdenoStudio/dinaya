import { addDays, format, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  availability,
  availabilityOverrides,
  bookings,
  businesses,
  dealSuggestions,
  locations,
  services,
  staff,
  staffServices,
} from "@/db/schema";
import { generateDealSuggestionCopy } from "@/lib/ai/deals";
import { getAvailableSlots } from "@/lib/availability";
import { recommendDiscountPercent, formatDiscountLearningMessage } from "@/lib/deals/conversion";
import { canUseFeature } from "@/lib/plan";

const MIN_GAP_MINUTES = 45;
const SLOT_INTERVAL_MINUTES = 15;

export function suggestDiscountPercent(gapMinutes: number): number {
  if (gapMinutes >= 180) return 40;
  if (gapMinutes >= 90) return 30;
  return 20;
}

export function suggestSlotCount(gapMinutes: number, serviceDurationMinutes: number): number {
  const slots = Math.floor(gapMinutes / Math.max(serviceDurationMinutes, SLOT_INTERVAL_MINUTES));
  return Math.max(1, Math.min(5, slots));
}

type GapWindow = {
  apptWindowStart: Date;
  apptWindowEnd: Date;
  gapMinutes: number;
};

export function findLongestGap(slots: { startUtc: Date; endUtc: Date }[]): GapWindow | null {
  if (slots.length === 0) return null;

  let best: GapWindow | null = null;
  let runStart = slots[0]!.startUtc;
  let runEnd = slots[0]!.endUtc;

  for (let i = 1; i < slots.length; i++) {
    const slot = slots[i]!;
    const gapMs = slot.startUtc.getTime() - runEnd.getTime();
    if (gapMs <= SLOT_INTERVAL_MINUTES * 60_000) {
      runEnd = slot.endUtc;
      continue;
    }

    const gapMinutes = Math.round((runEnd.getTime() - runStart.getTime()) / 60_000);
    if (gapMinutes >= MIN_GAP_MINUTES && (!best || gapMinutes > best.gapMinutes)) {
      best = { apptWindowStart: runStart, apptWindowEnd: runEnd, gapMinutes };
    }
    runStart = slot.startUtc;
    runEnd = slot.endUtc;
  }

  const finalGapMinutes = Math.round((runEnd.getTime() - runStart.getTime()) / 60_000);
  if (finalGapMinutes >= MIN_GAP_MINUTES && (!best || finalGapMinutes > best.gapMinutes)) {
    best = { apptWindowStart: runStart, apptWindowEnd: runEnd, gapMinutes: finalGapMinutes };
  }

  return best;
}

function formatWindowLabel(start: Date, end: Date, timezone: string): string {
  const localStart = toZonedTime(start, timezone);
  const localEnd = toZonedTime(end, timezone);
  return `${format(localStart, "EEE h:mm a")} – ${format(localEnd, "h:mm a")}`;
}

export async function generateDealSuggestionsForBusiness(businessId: string): Promise<number> {
  const [business] = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      plan: businesses.plan,
      timezone: businesses.timezone,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business || !canUseFeature(business.plan, "aiDealSuggestions")) {
    return 0;
  }

  const activeLocations = await db
    .select({ id: locations.id, name: locations.name })
    .from(locations)
    .where(and(eq(locations.businessId, businessId), eq(locations.isActive, true)));

  let created = 0;
  const now = new Date();

  for (const location of activeLocations) {
    const staffRows = await db
      .select({ id: staff.id, name: staff.name })
      .from(staff)
      .where(and(eq(staff.businessId, businessId), eq(staff.isActive, true)))
      .limit(8);

    for (const member of staffRows) {
      for (let offset = 1; offset <= 3; offset++) {
        const date = format(toZonedTime(addDays(now, offset), business.timezone), "yyyy-MM-dd");
        const dayStart = startOfDay(addDays(now, offset));

        const [staffAvailability, overrides, existingBookings, assignedServices] = await Promise.all([
          db.select().from(availability).where(eq(availability.staffId, member.id)),
          db
            .select()
            .from(availabilityOverrides)
            .where(and(eq(availabilityOverrides.staffId, member.id), eq(availabilityOverrides.date, date))),
          db
            .select({ startsAt: bookings.startsAt, endsAt: bookings.endsAt, status: bookings.status })
            .from(bookings)
            .where(and(
              eq(bookings.staffId, member.id),
              gte(bookings.startsAt, dayStart),
              lt(bookings.startsAt, addDays(dayStart, 1)),
            )),
          db
            .select({
              id: services.id,
              name: services.name,
              durationMinutes: services.durationMinutes,
              priceLkr: services.priceLkr,
              beforeBuffer: services.beforeBuffer,
              afterBuffer: services.afterBuffer,
              minimumNoticeHours: services.minimumNoticeHours,
            })
            .from(staffServices)
            .innerJoin(services, eq(services.id, staffServices.serviceId))
            .where(and(
              eq(staffServices.staffId, member.id),
              eq(services.businessId, businessId),
              eq(services.isActive, true),
            ))
            .orderBy(asc(services.priceLkr)),
        ]);

        if (assignedServices.length === 0) continue;
        const service = assignedServices[assignedServices.length - 1]!;

        const slots = getAvailableSlots({
          date,
          durationMinutes: service.durationMinutes,
          beforeBuffer: service.beforeBuffer,
          afterBuffer: service.afterBuffer,
          minimumNoticeHours: service.minimumNoticeHours,
          staffAvailability,
          overrides,
          existingBookings,
          timezone: business.timezone,
        });

        const gap = findLongestGap(slots);
        if (!gap) continue;

        const [existingSuggestion] = await db
          .select({ id: dealSuggestions.id })
          .from(dealSuggestions)
          .where(and(
            eq(dealSuggestions.businessId, businessId),
            eq(dealSuggestions.staffId, member.id),
            eq(dealSuggestions.status, "pending"),
            eq(dealSuggestions.apptWindowStart, gap.apptWindowStart),
          ))
          .limit(1);

        if (existingSuggestion) continue;

        const { discountPercent, meta } = await recommendDiscountPercent({
          businessId,
          serviceId: service.id,
          gapMinutes: gap.gapMinutes,
        });
        const suggestedSlotsTotal = suggestSlotCount(gap.gapMinutes, service.durationMinutes);
        const learningLine = formatDiscountLearningMessage(meta);
        const reason = learningLine
          ?? `You have ${Math.round(gap.gapMinutes / 60)} free hours ${formatWindowLabel(gap.apptWindowStart, gap.apptWindowEnd, business.timezone)}.`;
        const copy = await generateDealSuggestionCopy({
          businessName: business.name,
          serviceName: service.name,
          staffName: member.name,
          gapMinutes: gap.gapMinutes,
          suggestedDiscountPercent: discountPercent,
          reason,
        });

        await db.insert(dealSuggestions).values({
          businessId,
          locationId: location.id,
          staffId: member.id,
          serviceId: service.id,
          suggestedDiscountPercent: discountPercent,
          suggestedSlotsTotal,
          apptWindowStart: gap.apptWindowStart,
          apptWindowEnd: gap.apptWindowEnd,
          gapMinutes: gap.gapMinutes,
          reason: copy.headline,
          meta,
          expiresAt: gap.apptWindowStart,
        });
        created++;
      }
    }
  }

  return created;
}

export async function generateDealSuggestions(): Promise<{ businesses: number; created: number; expired: number }> {
  const maxBusinesses = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.plan, "max"), sql`${businesses.deletedAt} IS NULL`, eq(businesses.isSuspended, false)));

  let created = 0;
  for (const business of maxBusinesses) {
    created += await generateDealSuggestionsForBusiness(business.id);
  }

  const expired = await db
    .update(dealSuggestions)
    .set({ status: "expired" })
    .where(and(
      eq(dealSuggestions.status, "pending"),
      lt(dealSuggestions.expiresAt, sql`now()`),
    ))
    .returning({ id: dealSuggestions.id });

  return { businesses: maxBusinesses.length, created, expired: expired.length };
}

export async function listPendingDealSuggestions(businessId: string) {
  return db
    .select({
      id: dealSuggestions.id,
      serviceId: dealSuggestions.serviceId,
      serviceName: services.name,
      staffId: dealSuggestions.staffId,
      staffName: staff.name,
      locationId: dealSuggestions.locationId,
      suggestedDiscountPercent: dealSuggestions.suggestedDiscountPercent,
      suggestedSlotsTotal: dealSuggestions.suggestedSlotsTotal,
      apptWindowStart: dealSuggestions.apptWindowStart,
      apptWindowEnd: dealSuggestions.apptWindowEnd,
      reason: dealSuggestions.reason,
      meta: dealSuggestions.meta,
    })
    .from(dealSuggestions)
    .innerJoin(services, eq(services.id, dealSuggestions.serviceId))
    .innerJoin(staff, eq(staff.id, dealSuggestions.staffId))
    .where(and(eq(dealSuggestions.businessId, businessId), eq(dealSuggestions.status, "pending")))
    .orderBy(dealSuggestions.apptWindowStart)
    .limit(3);
}

export async function updateDealSuggestionStatus(
  businessId: string,
  suggestionId: string,
  status: "accepted" | "dismissed",
) {
  const [row] = await db
    .update(dealSuggestions)
    .set({ status })
    .where(and(
      eq(dealSuggestions.id, suggestionId),
      eq(dealSuggestions.businessId, businessId),
      eq(dealSuggestions.status, "pending"),
    ))
    .returning({ id: dealSuggestions.id });
  return row ?? null;
}
