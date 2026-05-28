import { startOfMonth } from "date-fns";
import { and, count, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { bookings, businesses, locations, services, staff, subscriptions } from "@/db/schema";
import {
  annualSavingsPercent,
  getPlanConfigAsync,
  isPaidPlanAvailable,
  planDisplayName,
  resolveEffectivePlan,
  type Entitlements,
  type Plan,
  type PlanConfig,
} from "@/lib/plan";

export type DashboardBillingOverview = Awaited<ReturnType<typeof getBillingDashboardOverview>>;

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function effectiveEntitlements(config: PlanConfig, plan: Plan): Entitlements {
  if (plan !== "max") return config.plans[plan];
  return {
    limits: config.plans.max.limits,
    features: {
      ...config.plans.pro.features,
      ...config.plans.max.features,
    },
  };
}

function serializeSubscription(row: typeof subscriptions.$inferSelect) {
  return {
    amountLkr: row.amountLkr,
    billingInterval: row.billingInterval,
    cancelledAt: iso(row.cancelledAt),
    createdAt: row.createdAt.toISOString(),
    currentPeriodEnd: iso(row.currentPeriodEnd),
    id: row.id,
    payhereOrderId: row.payhereOrderId,
    payhereSubscriptionId: row.payhereSubscriptionId,
    plan: row.plan,
    status: row.status,
  };
}

function usageItem(
  key: keyof Entitlements["limits"],
  label: string,
  used: number,
  limit: number | null,
) {
  return {
    key,
    label,
    limit,
    percent: limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : null,
    remaining: limit === null ? null : Math.max(0, limit - used),
    used,
  };
}

export async function getBillingDashboardOverview(businessId: string, now = new Date()) {
  const config = await getPlanConfigAsync();
  const [business] = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      plan: businesses.plan,
      planExpiresAt: businesses.planExpiresAt,
      slug: businesses.slug,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  const storedPlan = (business?.plan ?? "free") as Plan;
  const effectivePlan = resolveEffectivePlan({
    storedPlan,
    planExpiresAt: business?.planExpiresAt,
    now,
  });
  const entitlements = effectiveEntitlements(config, effectivePlan);
  const monthStart = startOfMonth(now);

  const [
    [activeSubscription],
    subscriptionRows,
    [{ activeLocations }],
    [{ activeStaff }],
    [{ activeServices }],
    [{ monthlyBookings }],
  ] = await Promise.all([
    db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.businessId, businessId),
        inArray(subscriptions.status, ["pending", "active", "past_due"]),
      ))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1),
    db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.businessId, businessId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(8),
    db
      .select({ activeLocations: count() })
      .from(locations)
      .where(and(eq(locations.businessId, businessId), eq(locations.isActive, true))),
    db
      .select({ activeStaff: count() })
      .from(staff)
      .where(and(eq(staff.businessId, businessId), eq(staff.isActive, true))),
    db
      .select({ activeServices: count() })
      .from(services)
      .where(and(eq(services.businessId, businessId), eq(services.isActive, true))),
    db
      .select({ monthlyBookings: count() })
      .from(bookings)
      .where(and(eq(bookings.businessId, businessId), gte(bookings.createdAt, monthStart))),
  ]);

  return {
    actions: {
      billingPath: "/dashboard/billing",
      contactPath: "/contact",
      managePath: "/dashboard/billing",
      upgradeMaxPath: "/dashboard/billing",
      upgradeProPath: "/dashboard/billing",
    },
    business: {
      effectivePlan,
      id: business?.id ?? businessId,
      name: business?.name ?? "Dinaya",
      planExpiresAt: iso(business?.planExpiresAt),
      planLabel: planDisplayName(effectivePlan),
      slug: business?.slug ?? null,
      storedPlan,
    },
    currentSubscription: activeSubscription ? serializeSubscription(activeSubscription) : null,
    features: {
      automations: entitlements.features.automations,
      broadcasts: entitlements.features.broadcasts,
      deals: entitlements.features.deals,
      googleCalendarSync: entitlements.features.googleCalendarSync,
      payments: entitlements.features.payments,
      reports: entitlements.features.reports,
      reviewReplies: entitlements.features.reviewReplies,
      voiceReceptionist: entitlements.features.aiVoiceReceptionist,
      webhooks: entitlements.features.webhooks,
    },
    pricing: {
      max: {
        annualLkr: config.maxAnnualPriceLkr,
        annualSavingsPercent: annualSavingsPercent(config.maxMonthlyPriceLkr, config.maxAnnualPriceLkr),
        available: isPaidPlanAvailable("max", config),
        monthlyLkr: config.maxMonthlyPriceLkr,
      },
      pro: {
        annualLkr: config.proAnnualPriceLkr,
        annualSavingsPercent: annualSavingsPercent(config.proMonthlyPriceLkr, config.proAnnualPriceLkr),
        available: isPaidPlanAvailable("pro", config),
        monthlyLkr: config.proMonthlyPriceLkr,
      },
    },
    subscriptions: subscriptionRows.map(serializeSubscription),
    usage: [
      usageItem("locations", "Locations", Number(activeLocations), entitlements.limits.locations),
      usageItem("staff", "Staff", Number(activeStaff), entitlements.limits.staff),
      usageItem("services", "Services", Number(activeServices), entitlements.limits.services),
      usageItem("bookingsPerMonth", "Bookings this month", Number(monthlyBookings), entitlements.limits.bookingsPerMonth),
    ],
  };
}
