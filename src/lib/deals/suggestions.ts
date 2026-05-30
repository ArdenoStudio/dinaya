import { addDays, format } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
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
import { assessDemandForGap } from "@/lib/deals/demand";
import { loadGoogleCalendarBusyWindows, type ExternalBusyResult } from "@/lib/deals/external-demand";
import { canUseFeature, resolveEffectivePlan } from "@/lib/plan";

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

type ServiceCandidate = {
  id: string;
  name: string;
  durationMinutes: number;
  priceLkr: number;
  beforeBuffer: number;
  afterBuffer: number;
  minimumNoticeHours: number;
};

export function selectBestServiceForGap(
  services: ServiceCandidate[],
  gapMinutes: number,
): ServiceCandidate | null {
  if (services.length === 0) return null;

  const fitting = services.filter((service) => service.durationMinutes <= gapMinutes);
  const candidates = fitting.length > 0 ? fitting : services;

  return [...candidates].sort((a, b) => {
    const revenueScore = b.priceLkr - a.priceLkr;
    if (revenueScore !== 0) return revenueScore;
    return b.durationMinutes - a.durationMinutes;
  })[0] ?? null;
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
      planExpiresAt: businesses.planExpiresAt,
      timezone: businesses.timezone,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) {
    return 0;
  }

  const effectivePlan = resolveEffectivePlan({
    storedPlan: business.plan,
    planExpiresAt: business.planExpiresAt,
  });
  if (!canUseFeature(effectivePlan, "aiDealSuggestions")) {
    return 0;
  }

  const activeLocations = await db
    .select({ id: locations.id, name: locations.name })
    .from(locations)
    .where(and(eq(locations.businessId, businessId), eq(locations.isActive, true)));

  let created = 0;
  const now = new Date();
  const googleBusyByDate = new Map<string, Promise<ExternalBusyResult>>();

  function loadExternalBusyForDate(date: string, dayStart: Date, dayEnd: Date) {
    const existing = googleBusyByDate.get(date);
    if (existing) return existing;

    const pending = loadGoogleCalendarBusyWindows({
      businessId,
      timeMin: dayStart,
      timeMax: dayEnd,
      timezone: business.timezone,
    });
    googleBusyByDate.set(date, pending);
    return pending;
  }

  for (const location of activeLocations) {
    const staffRows = await db
      .select({ id: staff.id, name: staff.name })
      .from(staff)
      .where(and(eq(staff.businessId, businessId), eq(staff.isActive, true)))
      .limit(8);

    for (const member of staffRows) {
      for (let offset = 1; offset <= 3; offset++) {
        const date = format(toZonedTime(addDays(now, offset), business.timezone), "yyyy-MM-dd");
        const dayStart = fromZonedTime(`${date}T00:00:00`, business.timezone);
        const dayEnd = addDays(dayStart, 1);

        const [staffAvailability, overrides, existingBookings, assignedServices, externalBusy] = await Promise.all([
          db.select().from(availability).where(eq(availability.staffId, member.id)),
          db
            .select()
            .from(availabilityOverrides)
            .where(and(eq(availabilityOverrides.staffId, member.id), eq(availabilityOverrides.date, date))),
          db
            .select({
              startsAt: bookings.startsAt,
              endsAt: bookings.endsAt,
              status: bookings.status,
              googleCalendarEventId: bookings.googleCalendarEventId,
            })
            .from(bookings)
            .where(and(
              eq(bookings.staffId, member.id),
              gte(bookings.startsAt, dayStart),
              lt(bookings.startsAt, dayEnd),
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
          loadExternalBusyForDate(date, dayStart, dayEnd),
        ]);

        if (assignedServices.length === 0) continue;
        const googleBusyBookings = externalBusy.busyWindows.map((window) => ({
          startsAt: window.startsAt,
          endsAt: window.endsAt,
          status: "confirmed" as const,
          googleCalendarEventId: null,
          source: window.source,
        }));
        const demandBookings = [...existingBookings, ...googleBusyBookings];

        const probeService = assignedServices[0]!;
        const slots = getAvailableSlots({
          date,
          durationMinutes: probeService.durationMinutes,
          beforeBuffer: probeService.beforeBuffer,
          afterBuffer: probeService.afterBuffer,
          minimumNoticeHours: probeService.minimumNoticeHours,
          staffAvailability,
          overrides,
          existingBookings: demandBookings,
          timezone: business.timezone,
        });

        const gap = findLongestGap(slots);
        if (!gap) continue;

        const service = selectBestServiceForGap(assignedServices, gap.gapMinutes);
        if (!service) continue;

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

        const historicalBookings = await db
          .select({
            startsAt: bookings.startsAt,
            endsAt: bookings.endsAt,
            status: bookings.status,
            googleCalendarEventId: bookings.googleCalendarEventId,
          })
          .from(bookings)
          .where(and(
            eq(bookings.businessId, businessId),
            eq(bookings.locationId, location.id),
            eq(bookings.staffId, member.id),
            eq(bookings.serviceId, service.id),
            gte(bookings.startsAt, addDays(dayStart, -84)),
            lt(bookings.startsAt, dayStart),
          ));

        const demand = assessDemandForGap({
          targetWindowStart: gap.apptWindowStart,
          targetWindowEnd: gap.apptWindowEnd,
          gapMinutes: gap.gapMinutes,
          availableSlotCount: slots.length,
          currentBookings: demandBookings,
          historicalBookings,
          timezone: business.timezone,
          sourceStatuses: [externalBusy.sourceStatus],
        });
        if (!demand.shouldSuggest) continue;

        const { discountPercent, meta } = await recommendDiscountPercent({
          businessId,
          serviceId: service.id,
          gapMinutes: gap.gapMinutes,
          demand,
        });
        const suggestedSlotsTotal = suggestSlotCount(gap.gapMinutes, service.durationMinutes);
        const learningLine = formatDiscountLearningMessage(meta);
        const reason = learningLine
          ?? `${demand.reason} ${Math.round(gap.gapMinutes / 60)} free hours ${formatWindowLabel(gap.apptWindowStart, gap.apptWindowEnd, business.timezone)}.`;
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
