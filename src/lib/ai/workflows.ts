import { addDays, addHours, addMinutes, format, startOfDay, subDays } from "date-fns";
import { and, asc, count, desc, eq, gte, inArray, lt, lte } from "drizzle-orm";
import { toZonedTime } from "date-fns-tz";
import { db } from "@/db";
import {
  aiContentCalendar,
  aiWorkflowRuns,
  availability,
  availabilityOverrides,
  bookings,
  businesses,
  clients,
  locations,
  reviews,
  services,
  staff,
} from "@/db/schema";
import { getAvailableSlots } from "@/lib/availability";
import { buildPublicBookingUrl } from "@/lib/booking-url";
import { generateAiCopy } from "@/lib/ai/copy";
import { buildReviewUrl } from "@/lib/ai/review-links";
import { sendAiMessage, type ProviderSendResult } from "@/lib/ai/providers";
import { generateThirtyDayContentCalendar } from "@/lib/ai/content";
import { getUpsellRecommendation } from "@/lib/ai/upsell";
import { canUseFeature, type Plan, type PlanFeature } from "@/lib/plan";
import { parseLocationAiConfig, type LocationAiConfig } from "@/lib/locations";

type WorkflowStats = {
  checked: number;
  sent: number;
  skipped: number;
  failed: number;
  duplicate: number;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  plan: "free" | "pro" | "max";
  timezone: string;
  customDomain: string | null;
  customDomainVerifiedAt: Date | null;
};

const AI_FEATURES: PlanFeature[] = [
  "aiBookingAutopilot",
  "smartReminderSystem",
  "reviewEngine",
  "clientReactivationCampaign",
  "aiUpsellAssistant",
  "aiContentMachine",
  "vipLoyaltySequence",
];

function emptyStats(): WorkflowStats {
  return { checked: 0, sent: 0, skipped: 0, failed: 0, duplicate: 0 };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await fn(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

export function canRunAiWorkflow(plan: Plan, feature: PlanFeature): boolean {
  return canUseFeature(plan, feature);
}

export function cooldownHasElapsed(
  lastContactAt: Date | string | null | undefined,
  cooldownDays: number,
  now = new Date(),
): boolean {
  if (!lastContactAt) return true;
  const lastContactDate = lastContactAt instanceof Date ? lastContactAt : new Date(lastContactAt);
  if (Number.isNaN(lastContactDate.getTime())) return false;
  return lastContactDate <= subDays(now, cooldownDays);
}

function addResult(stats: WorkflowStats, result: ProviderSendResult | "skipped" | "duplicate") {
  stats.checked++;
  if (result === "skipped") stats.skipped++;
  else if (result === "duplicate") stats.duplicate++;
  else if (result.status === "sent") stats.sent++;
  else if (result.status === "failed") stats.failed++;
  else if (result.status === "duplicate") stats.duplicate++;
  else stats.skipped++;
}

function bookingUrl(business: Pick<BusinessRow, "slug" | "customDomain" | "customDomainVerifiedAt">): string {
  return buildPublicBookingUrl(business);
}

function localLabel(date: Date, timezone: string): string {
  return format(toZonedTime(date, timezone), "EEE, d MMM 'at' h:mm a");
}

async function runExists(businessId: string, idempotencyKey: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: aiWorkflowRuns.id })
    .from(aiWorkflowRuns)
    .where(and(
      eq(aiWorkflowRuns.businessId, businessId),
      eq(aiWorkflowRuns.idempotencyKey, idempotencyKey),
    ))
    .limit(1);
  return Boolean(existing);
}

async function recordRun(input: {
  businessId: string;
  locationId?: string | null;
  feature: PlanFeature;
  workflowKey: string;
  entityType?: string | null;
  entityId?: string | null;
  idempotencyKey: string;
  result: ProviderSendResult | "skipped" | "duplicate";
  subject?: string | null;
  body?: string | null;
  error?: string | null;
  meta?: Record<string, unknown>;
}) {
  if (await runExists(input.businessId, input.idempotencyKey)) return;
  const result = typeof input.result === "string" ? null : input.result;
  await db.insert(aiWorkflowRuns).values({
    businessId: input.businessId,
    locationId: input.locationId ?? null,
    feature: input.feature,
    workflowKey: input.workflowKey,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    channel: result?.channel ?? null,
    provider: result?.provider ?? null,
    status: typeof input.result === "string" ? input.result : input.result.status,
    subject: input.subject ?? null,
    body: input.body ?? null,
    executedAt: new Date(),
    idempotencyKey: input.idempotencyKey,
    error: input.error ?? result?.error ?? null,
    meta: input.meta ?? null,
  });
}

async function activeAiLocations(businessId: string, feature: keyof LocationAiConfig) {
  const rows = await db
    .select()
    .from(locations)
    .where(and(eq(locations.businessId, businessId), eq(locations.isActive, true)))
    .orderBy(asc(locations.sortOrder), asc(locations.name));

  return rows.filter((location) => Boolean(parseLocationAiConfig(location.aiConfig)[feature]));
}

async function sendWorkflowMessage(input: {
  business: BusinessRow;
  locationId?: string | null;
  bookingId?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  feature: PlanFeature;
  workflowKey: string;
  idempotencyKey: string;
  serviceName?: string;
  staffName?: string;
  startsAtLabel?: string;
  reviewUrl?: string;
  extra?: string;
  meta?: Record<string, unknown>;
}) {
  if (await runExists(input.business.id, input.idempotencyKey)) return "duplicate" as const;
  const copy = await generateAiCopy({
    businessName: input.business.name,
    clientName: input.clientName ?? undefined,
    feature: input.feature,
    serviceName: input.serviceName,
    staffName: input.staffName,
    startsAtLabel: input.startsAtLabel,
    bookingUrl: bookingUrl(input.business),
    reviewUrl: input.reviewUrl,
    extra: input.extra,
  });

  const result = await sendAiMessage({
    businessId: input.business.id,
    bookingId: input.bookingId,
    clientId: input.clientId,
    clientEmail: input.clientEmail,
    clientPhone: input.clientPhone,
    feature: input.feature,
    idempotencyKey: input.idempotencyKey,
    subject: copy.subject,
    body: copy.body,
    meta: { ...input.meta, copySource: copy.source },
  });

  await recordRun({
    businessId: input.business.id,
    locationId: input.locationId,
    feature: input.feature,
    workflowKey: input.workflowKey,
    entityType: input.bookingId ? "booking" : input.clientId ? "client" : "business",
    entityId: input.bookingId ?? input.clientId ?? input.business.id,
    idempotencyKey: input.idempotencyKey,
    result,
    subject: copy.subject,
    body: copy.body,
    meta: { ...input.meta, copySource: copy.source },
  });

  if (result.status === "sent" && input.clientId) {
    await db
      .update(clients)
      .set({ lastAiContactAt: new Date() })
      .where(eq(clients.id, input.clientId));
  }

  return result;
}

async function runSmartReminders(business: BusinessRow): Promise<WorkflowStats> {
  const stats = emptyStats();
  const enabled = await activeAiLocations(business.id, "smartReminderSystem");
  if (enabled.length === 0) return stats;
  const enabledIds = new Set(enabled.map((location) => location.id));
  const windows = [
    { key: "24h", start: addHours(new Date(), 23), end: addHours(new Date(), 25) },
    { key: "2h", start: addMinutes(new Date(), 90), end: addMinutes(new Date(), 150) },
  ];

  for (const window of windows) {
    const rows = await db
      .select({
        id: bookings.id,
        locationId: bookings.locationId,
        clientId: bookings.clientId,
        clientName: bookings.clientName,
        clientEmail: bookings.clientEmail,
        clientPhone: bookings.clientPhone,
        startsAt: bookings.startsAt,
        serviceName: services.name,
        staffName: staff.name,
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(staff, eq(bookings.staffId, staff.id))
      .where(and(
        eq(bookings.businessId, business.id),
        eq(bookings.status, "confirmed"),
        gte(bookings.startsAt, window.start),
        lt(bookings.startsAt, window.end),
      ))
      .limit(50);

    const eligibleRows = rows.filter(
      (row) => !row.locationId || enabledIds.has(row.locationId),
    );
    const results = await mapWithConcurrency(eligibleRows, 5, async (row) =>
      sendWorkflowMessage({
        business,
        locationId: row.locationId,
        bookingId: row.id,
        clientId: row.clientId,
        clientName: row.clientName,
        clientEmail: row.clientEmail,
        clientPhone: row.clientPhone,
        feature: "smartReminderSystem",
        workflowKey: `smart-reminder-${window.key}`,
        idempotencyKey: `smart-reminder:${window.key}:${row.id}`,
        serviceName: row.serviceName,
        staffName: row.staffName,
        startsAtLabel: localLabel(new Date(row.startsAt), business.timezone),
      }),
    );
    for (const result of results) addResult(stats, result);
  }
  return stats;
}

async function runReviewEngine(business: BusinessRow): Promise<WorkflowStats> {
  const stats = emptyStats();
  const enabled = await activeAiLocations(business.id, "reviewEngine");
  if (enabled.length === 0) return stats;
  const enabledIds = new Set(enabled.map((location) => location.id));
  const rows = await db
    .select({
      id: bookings.id,
      locationId: bookings.locationId,
      clientId: bookings.clientId,
      clientName: bookings.clientName,
      clientEmail: bookings.clientEmail,
      clientPhone: bookings.clientPhone,
      endsAt: bookings.endsAt,
    })
    .from(bookings)
    .where(and(
      eq(bookings.businessId, business.id),
      eq(bookings.status, "completed"),
      lte(bookings.endsAt, addHours(new Date(), -2)),
      gte(bookings.endsAt, subDays(new Date(), 14)),
    ))
    .limit(50);

  const eligibleRows = rows.filter(
    (row) => !row.locationId || enabledIds.has(row.locationId),
  );
  const results = await mapWithConcurrency(eligibleRows, 5, async (row) => {
    const [existingReview] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.bookingId, row.id))
      .limit(1);
    if (existingReview) return null;
    return sendWorkflowMessage({
      business,
      locationId: row.locationId,
      bookingId: row.id,
      clientId: row.clientId,
      clientName: row.clientName,
      clientEmail: row.clientEmail,
      clientPhone: row.clientPhone,
      feature: "reviewEngine",
      workflowKey: "review-request",
      idempotencyKey: `review-request:${row.id}`,
      reviewUrl: buildReviewUrl({
        bookingId: row.id,
        businessSlug: business.slug,
        clientName: row.clientName,
      }),
    });
  });
  for (const result of results) {
    if (result) addResult(stats, result);
  }
  return stats;
}

async function clientHasFutureBooking(clientId: string): Promise<boolean> {
  const [future] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(
      eq(bookings.clientId, clientId),
      inArray(bookings.status, ["pending", "confirmed"]),
      gte(bookings.startsAt, new Date()),
    ))
    .limit(1);
  return Boolean(future);
}

async function runReactivation(business: BusinessRow): Promise<WorkflowStats> {
  const stats = emptyStats();
  if ((await activeAiLocations(business.id, "clientReactivationCampaign")).length === 0) return stats;
  const rows = await db
    .select({
      id: clients.id,
      name: clients.name,
      phone: clients.phone,
      email: clients.email,
      lastAiContactAt: clients.lastAiContactAt,
    })
    .from(clients)
    .where(and(
      eq(clients.businessId, business.id),
      eq(clients.communicationOptOut, false),
    ))
    .orderBy(asc(clients.lastAiContactAt))
    .limit(30);

  const results = await mapWithConcurrency(rows, 5, async (client) => {
    if (!cooldownHasElapsed(client.lastAiContactAt, 30)) return null;
    if (await clientHasFutureBooking(client.id)) return null;
    const [lastCompleted] = await db
      .select({ startsAt: bookings.startsAt })
      .from(bookings)
      .where(and(
        eq(bookings.clientId, client.id),
        eq(bookings.status, "completed"),
      ))
      .orderBy(desc(bookings.startsAt))
      .limit(1);
    if (!lastCompleted || lastCompleted.startsAt > subDays(new Date(), 45)) return null;
    return sendWorkflowMessage({
      business,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
      feature: "clientReactivationCampaign",
      workflowKey: "client-reactivation",
      idempotencyKey: `reactivation:${client.id}:${format(new Date(), "yyyy-MM")}`,
      meta: { lastVisit: lastCompleted.startsAt.toISOString() },
    });
  });
  for (const result of results) {
    if (result) addResult(stats, result);
  }
  return stats;
}

async function runVipLoyalty(business: BusinessRow): Promise<WorkflowStats> {
  const stats = emptyStats();
  if ((await activeAiLocations(business.id, "vipLoyaltySequence")).length === 0) return stats;
  const rows = await db
    .select({
      id: clients.id,
      name: clients.name,
      phone: clients.phone,
      email: clients.email,
      loyaltyTier: clients.loyaltyTier,
      lastAiContactAt: clients.lastAiContactAt,
    })
    .from(clients)
    .where(and(
      eq(clients.businessId, business.id),
      eq(clients.communicationOptOut, false),
    ))
    .limit(40);

  const results = await mapWithConcurrency(rows, 5, async (client) => {
    if (!cooldownHasElapsed(client.lastAiContactAt, 30)) return null;
    const [{ value }] = await db
      .select({ value: count() })
      .from(bookings)
      .where(and(eq(bookings.clientId, client.id), eq(bookings.status, "completed")));
    if (Number(value) < 3) return null;
    const result = await sendWorkflowMessage({
      business,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
      feature: "vipLoyaltySequence",
      workflowKey: "vip-loyalty",
      idempotencyKey: `vip-loyalty:${client.id}:${format(new Date(), "yyyy-MM")}`,
      meta: { completedBookings: Number(value), previousTier: client.loyaltyTier },
    });
    if (typeof result !== "string" && result.status === "sent") {
      await db.update(clients).set({ loyaltyTier: "vip" }).where(eq(clients.id, client.id));
    }
    return result;
  });
  for (const result of results) {
    if (result) addResult(stats, result);
  }
  return stats;
}

async function runUpsells(business: BusinessRow): Promise<WorkflowStats> {
  const stats = emptyStats();
  const enabled = await activeAiLocations(business.id, "aiUpsellAssistant");
  if (enabled.length === 0) return stats;
  const enabledIds = new Set(enabled.map((location) => location.id));
  const rows = await db
    .select({
      id: bookings.id,
      locationId: bookings.locationId,
      clientId: bookings.clientId,
      clientName: bookings.clientName,
      clientEmail: bookings.clientEmail,
      clientPhone: bookings.clientPhone,
      serviceId: bookings.serviceId,
      serviceName: services.name,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(and(
      eq(bookings.businessId, business.id),
      eq(bookings.status, "confirmed"),
      gte(bookings.startsAt, new Date()),
      lte(bookings.startsAt, addDays(new Date(), 3)),
    ))
    .limit(40);

  const eligibleRows = rows.filter(
    (row) => !row.locationId || enabledIds.has(row.locationId),
  );
  const results = await mapWithConcurrency(eligibleRows, 5, async (row) => {
    const recommendation = await getUpsellRecommendation({
      businessId: business.id,
      serviceId: row.serviceId,
    });
    if (!recommendation) return null;
    return sendWorkflowMessage({
      business,
      locationId: row.locationId,
      bookingId: row.id,
      clientId: row.clientId,
      clientName: row.clientName,
      clientEmail: row.clientEmail,
      clientPhone: row.clientPhone,
      feature: "aiUpsellAssistant",
      workflowKey: "pre-visit-upsell",
      idempotencyKey: `upsell:${row.id}:${recommendation.serviceId}`,
      serviceName: row.serviceName,
      extra: recommendation.name,
      meta: { recommendation },
    });
  });
  for (const result of results) {
    if (result) addResult(stats, result);
  }
  return stats;
}

async function findOpenSlot(business: BusinessRow, locationId: string) {
  const [service] = await db
    .select()
    .from(services)
    .where(and(eq(services.businessId, business.id), eq(services.isActive, true)))
    .orderBy(asc(services.priceLkr))
    .limit(1);
  if (!service) return null;

  const staffRows = await db
    .select()
    .from(staff)
    .where(and(eq(staff.businessId, business.id), eq(staff.isActive, true)))
    .limit(5);

  for (const member of staffRows) {
    const staffAvailability = await db.select().from(availability).where(eq(availability.staffId, member.id));
    for (let offset = 1; offset <= 7; offset++) {
      const date = format(toZonedTime(addDays(new Date(), offset), business.timezone), "yyyy-MM-dd");
      const dayStart = startOfDay(addDays(new Date(), offset));
      const existingBookings = await db
        .select({ startsAt: bookings.startsAt, endsAt: bookings.endsAt, status: bookings.status })
        .from(bookings)
        .where(and(
          eq(bookings.staffId, member.id),
          gte(bookings.startsAt, dayStart),
          lt(bookings.startsAt, addDays(dayStart, 1)),
        ));
      const overrides = await db
        .select()
        .from(availabilityOverrides)
        .where(and(eq(availabilityOverrides.staffId, member.id), eq(availabilityOverrides.date, date)));
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
      const slot = slots[0];
      if (slot) {
        return { service, member, slot, locationId };
      }
    }
  }
  return null;
}

async function runBookingAutopilot(business: BusinessRow): Promise<WorkflowStats> {
  const stats = emptyStats();
  const enabled = await activeAiLocations(business.id, "aiBookingAutopilot");
  for (const location of enabled) {
    const openSlot = await findOpenSlot(business, location.id);
    if (!openSlot) continue;
    const candidates = await db
      .select({
        id: clients.id,
        name: clients.name,
        phone: clients.phone,
        email: clients.email,
        lastAiContactAt: clients.lastAiContactAt,
      })
      .from(clients)
      .where(and(eq(clients.businessId, business.id), eq(clients.communicationOptOut, false)))
      .orderBy(asc(clients.lastAiContactAt))
      .limit(10);
    for (const client of candidates) {
      if (!cooldownHasElapsed(client.lastAiContactAt, 14)) continue;
      if (await clientHasFutureBooking(client.id)) continue;
      const result = await sendWorkflowMessage({
        business,
        locationId: location.id,
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.phone,
        feature: "aiBookingAutopilot",
        workflowKey: "open-slot-autopilot",
        idempotencyKey: `autopilot:${client.id}:${format(openSlot.slot.startUtc, "yyyy-MM-dd")}`,
        serviceName: openSlot.service.name,
        staffName: openSlot.member.name,
        startsAtLabel: localLabel(openSlot.slot.startUtc, business.timezone),
      });
      addResult(stats, result);
      if (stats.sent + stats.skipped + stats.failed >= 3) break;
    }
  }
  return stats;
}

async function runContentMachine(business: BusinessRow): Promise<WorkflowStats> {
  const stats = emptyStats();
  const enabled = await activeAiLocations(business.id, "aiContentMachine");
  const locationResults = await mapWithConcurrency(enabled, 5, async (location) => {
    const locationStats = emptyStats();
    await generateThirtyDayContentCalendar({ businessId: business.id, locationId: location.id });
    const [{ value }] = await db
      .select({ value: count() })
      .from(aiContentCalendar)
      .where(and(
        eq(aiContentCalendar.businessId, business.id),
        eq(aiContentCalendar.locationId, location.id),
        gte(aiContentCalendar.contentDate, format(new Date(), "yyyy-MM-dd")),
        lte(aiContentCalendar.contentDate, format(addDays(new Date(), 7), "yyyy-MM-dd")),
      ));
    if (!business.email) {
      await recordRun({
        businessId: business.id,
        locationId: location.id,
        feature: "aiContentMachine",
        workflowKey: "weekly-content-digest",
        idempotencyKey: `content-digest:${location.id}:${format(new Date(), "yyyy-'W'II")}`,
        result: "skipped",
        error: "Business email missing.",
        meta: { drafts: Number(value) },
      });
      addResult(locationStats, "skipped");
      return locationStats;
    }
    const result = await sendWorkflowMessage({
      business,
      locationId: location.id,
      clientEmail: business.email,
      clientName: business.name,
      feature: "aiContentMachine",
      workflowKey: "weekly-content-digest",
      idempotencyKey: `content-digest:${location.id}:${format(new Date(), "yyyy-'W'II")}`,
      extra: `${Number(value)} content drafts are ready for ${location.name}.`,
      meta: { drafts: Number(value) },
    });
    addResult(locationStats, result);
    return locationStats;
  });
  return locationResults.reduce(mergeStats, stats);
}

export async function runAiWorkflows(): Promise<Record<PlanFeature, WorkflowStats>> {
  const summary = Object.fromEntries(AI_FEATURES.map((feature) => [feature, emptyStats()])) as Record<PlanFeature, WorkflowStats>;
  const businessRows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      email: businesses.email,
      plan: businesses.plan,
      timezone: businesses.timezone,
      customDomain: businesses.customDomain,
      customDomainVerifiedAt: businesses.customDomainVerifiedAt,
    })
    .from(businesses)
    .where(inArray(businesses.plan, ["pro", "max"]));

  const eligibleBusinesses = businessRows.filter((business) =>
    AI_FEATURES.some((feature) => canRunAiWorkflow(business.plan as Plan, feature)),
  );

  const businessSummaries = await mapWithConcurrency(eligibleBusinesses, 5, async (business) => {
    const typedBusiness = business as BusinessRow;
    return {
      aiBookingAutopilot: await runBookingAutopilot(typedBusiness),
      smartReminderSystem: await runSmartReminders(typedBusiness),
      reviewEngine: await runReviewEngine(typedBusiness),
      clientReactivationCampaign: await runReactivation(typedBusiness),
      aiUpsellAssistant: await runUpsells(typedBusiness),
      aiContentMachine: await runContentMachine(typedBusiness),
      vipLoyaltySequence: await runVipLoyalty(typedBusiness),
    };
  });

  for (const partial of businessSummaries) {
    summary.aiBookingAutopilot = mergeStats(summary.aiBookingAutopilot, partial.aiBookingAutopilot);
    summary.smartReminderSystem = mergeStats(summary.smartReminderSystem, partial.smartReminderSystem);
    summary.reviewEngine = mergeStats(summary.reviewEngine, partial.reviewEngine);
    summary.clientReactivationCampaign = mergeStats(
      summary.clientReactivationCampaign,
      partial.clientReactivationCampaign,
    );
    summary.aiUpsellAssistant = mergeStats(summary.aiUpsellAssistant, partial.aiUpsellAssistant);
    summary.aiContentMachine = mergeStats(summary.aiContentMachine, partial.aiContentMachine);
    summary.vipLoyaltySequence = mergeStats(summary.vipLoyaltySequence, partial.vipLoyaltySequence);
  }
  return summary;
}

function mergeStats(a: WorkflowStats, b: WorkflowStats): WorkflowStats {
  return {
    checked: a.checked + b.checked,
    sent: a.sent + b.sent,
    skipped: a.skipped + b.skipped,
    failed: a.failed + b.failed,
    duplicate: a.duplicate + b.duplicate,
  };
}
