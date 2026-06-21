import { db } from "@/db";
import {
  activityLog,
  availability,
  bookings,
  businesses,
  clients,
  payments,
  services,
  staff,
} from "@/db/schema";
import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import {
  addDays,
  endOfWeek,
  format,
  formatDistanceToNow,
  startOfDay,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { buildPublicBookingUrl, buildPublicBookingUrlLabel } from "@/lib/booking-url";
import { formatLkr } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Banknote, CalendarCheck, Scissors, Star, TrendingUp, UserPlus, Users } from "lucide-react";

async function safeRecentActivity(businessId: string) {
  try {
    return await db
      .select({
        action: activityLog.action,
        createdAt: activityLog.createdAt,
        entity: activityLog.entity,
        meta: activityLog.meta,
      })
      .from(activityLog)
      .where(eq(activityLog.businessId, businessId))
      .orderBy(desc(activityLog.createdAt))
      .limit(8);
  } catch {
    return [];
  }
}

export type DashboardOverviewOnboardingStep = {
  label: string;
  done: boolean;
  href: string;
  description: string;
};

export type DashboardOverviewStat = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: "cobalt" | "amber" | "violet" | "slate";
  delta?: string;
};

export type DashboardOverviewTodayRow = {
  id: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  startsAt: Date;
  status: string;
};

export type DashboardOverviewNextRow = {
  id: string;
  clientName: string;
  serviceName: string;
  startsAt: Date;
};

export type DashboardOverviewActivityItem = {
  action: string;
  createdAt: Date;
  entity: string;
};

export type DashboardOverviewData = {
  businessName: string;
  greetingDate: string;
  stats: DashboardOverviewStat[];
  showStats: boolean;
  showOnboarding: boolean;
  showShareCard: boolean;
  onboarding: DashboardOverviewOnboardingStep[];
  bookingUrl: string;
  bookingDisplayUrl: string;
  whatsappShare: string;
  embedSnippet: string;
  todayRows: DashboardOverviewTodayRow[];
  nextRows: DashboardOverviewNextRow[];
  recentActivity: DashboardOverviewActivityItem[];
};

export const overviewStatusBorder: Record<string, string> = {
  confirmed: "border-l-blue-500",
  pending: "border-l-amber-400",
  completed: "border-l-green-500",
  no_show: "border-l-red-400",
  cancelled: "border-l-slate-300",
};

export const overviewStatusBadge: Record<string, string> = {
  confirmed: "bg-blue-50 dark:bg-blue-950/40 text-blue-700",
  pending: "bg-amber-50 dark:bg-amber-950/40 text-amber-700",
  completed: "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300",
  no_show: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300",
  cancelled: "bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-slate-400",
};

export const overviewEntityIconMap: Record<string, LucideIcon> = {
  booking: CalendarCheck,
  client: UserPlus,
  payment: Banknote,
  staff: Users,
  service: Scissors,
  review: Star,
};

export const overviewActionDot: Record<string, string> = {
  created: "bg-green-500",
  updated: "bg-blue-400",
  cancelled: "bg-red-400",
  completed: "bg-green-500",
  deleted: "bg-red-400",
  no_show: "bg-amber-400",
};

export async function getDashboardOverviewData(businessId: string): Promise<DashboardOverviewData | null> {
  const [business] = await db
    .select({
      address: businesses.address,
      description: businesses.description,
      name: businesses.name,
      payhereEnabled: businesses.payhereEnabled,
      payhereMerchantId: businesses.payhereMerchantId,
      phone: businesses.phone,
      slug: businesses.slug,
      customDomain: businesses.customDomain,
      customDomainVerified: businesses.customDomainVerified,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) return null;

  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrow = addDays(todayStart, 1);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const previousWeekStart = subWeeks(weekStart, 1);

  const [
    [{ todayBookings }],
    [{ totalBookings }],
    [{ newClientsThisWeek }],
    [{ servicesCount }],
    [{ staffCount }],
    [{ availabilityCount }],
    [{ todayRevenue }],
    [{ weekRevenue }],
    [{ previousWeekRevenue }],
    todayRows,
    nextRows,
    recentActivity,
  ] = await Promise.all([
    db
      .select({ todayBookings: count() })
      .from(bookings)
      .where(and(eq(bookings.businessId, businessId), gte(bookings.startsAt, todayStart), lt(bookings.startsAt, tomorrow))),
    db.select({ totalBookings: count() }).from(bookings).where(eq(bookings.businessId, businessId)),
    db
      .select({ newClientsThisWeek: count() })
      .from(clients)
      .where(and(eq(clients.businessId, businessId), gte(clients.createdAt, weekStart))),
    db.select({ servicesCount: count() }).from(services).where(eq(services.businessId, businessId)),
    db.select({ staffCount: count() }).from(staff).where(eq(staff.businessId, businessId)),
    db
      .select({ availabilityCount: count() })
      .from(availability)
      .innerJoin(staff, eq(staff.id, availability.staffId))
      .where(eq(staff.businessId, businessId)),
    db
      .select({ todayRevenue: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int` })
      .from(payments)
      .innerJoin(bookings, eq(bookings.id, payments.bookingId))
      .where(
        and(
          eq(bookings.businessId, businessId),
          eq(payments.status, "success"),
          gte(payments.createdAt, todayStart),
          lt(payments.createdAt, tomorrow),
        ),
      ),
    db
      .select({ weekRevenue: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int` })
      .from(payments)
      .innerJoin(bookings, eq(bookings.id, payments.bookingId))
      .where(
        and(
          eq(bookings.businessId, businessId),
          eq(payments.status, "success"),
          gte(payments.createdAt, weekStart),
          lt(payments.createdAt, weekEnd),
        ),
      ),
    db
      .select({ previousWeekRevenue: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int` })
      .from(payments)
      .innerJoin(bookings, eq(bookings.id, payments.bookingId))
      .where(
        and(
          eq(bookings.businessId, businessId),
          eq(payments.status, "success"),
          gte(payments.createdAt, previousWeekStart),
          lt(payments.createdAt, weekStart),
        ),
      ),
    db
      .select({
        id: bookings.id,
        clientName: bookings.clientName,
        serviceName: services.name,
        staffName: staff.name,
        startsAt: bookings.startsAt,
        status: bookings.status,
      })
      .from(bookings)
      .innerJoin(services, eq(services.id, bookings.serviceId))
      .innerJoin(staff, eq(staff.id, bookings.staffId))
      .where(and(eq(bookings.businessId, businessId), gte(bookings.startsAt, todayStart), lt(bookings.startsAt, tomorrow)))
      .orderBy(bookings.startsAt)
      .limit(10),
    db
      .select({
        id: bookings.id,
        clientName: bookings.clientName,
        serviceName: services.name,
        startsAt: bookings.startsAt,
      })
      .from(bookings)
      .innerJoin(services, eq(services.id, bookings.serviceId))
      .where(and(eq(bookings.businessId, businessId), gte(bookings.startsAt, now)))
      .orderBy(bookings.startsAt)
      .limit(3),
    safeRecentActivity(businessId),
  ]);

  const bookingUrl = buildPublicBookingUrl({
    slug: business.slug,
    customDomain: business.customDomain,
    customDomainVerified: business.customDomainVerified,
  });
  const bookingDisplayUrl = buildPublicBookingUrlLabel({
    slug: business.slug,
    customDomain: business.customDomain,
    customDomainVerified: business.customDomainVerified,
  });
  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(`Book online with ${business.name}: ${bookingUrl}`)}`;
  const embedSnippet = `<iframe src="${bookingUrl}" width="100%" height="720" style="border:0;border-radius:8px"></iframe>`;
  const currentWeekRevenue = Number(weekRevenue ?? 0);
  const previousRevenue = Number(previousWeekRevenue ?? 0);
  const revenueDelta =
    previousRevenue > 0
      ? Math.round(((currentWeekRevenue - previousRevenue) / previousRevenue) * 100)
      : currentWeekRevenue > 0
        ? 100
        : 0;

  const onboarding: DashboardOverviewOnboardingStep[] = [
    {
      label: "Add business info",
      done: Boolean(business.description && business.phone && business.address),
      href: "/dashboard/settings",
      description: "Add your phone, address, and a short description clients will see.",
    },
    {
      label: "Create first service",
      done: Number(servicesCount) > 0,
      href: "/dashboard/services/new",
      description: "List what clients can book — price, duration, and deposit rules.",
    },
    {
      label: "Add staff",
      done: Number(staffCount) > 0,
      href: "/dashboard/staff/new",
      description: "Add yourself or your team so bookings can be assigned.",
    },
    {
      label: "Set availability",
      done: Number(availabilityCount) > 0,
      href: "/dashboard/availability",
      description: "Choose the days and hours clients can book online.",
    },
    {
      label: "Connect PayHere",
      done: Boolean(business.payhereEnabled && business.payhereMerchantId),
      href: "/dashboard/settings",
      description: "Accept card payments online via PayHere, or take bank transfers and LankaQR.",
    },
    {
      label: "Share booking link",
      done: Number(totalBookings) > 0,
      href: bookingUrl,
      description: "Post your link on WhatsApp Status, Instagram bio, or send it directly to clients.",
    },
  ];
  const showOnboarding = onboarding.some((item) => !item.done);
  const nextOnboardingStep = onboarding.find((item) => !item.done);
  const showShareCard = !showOnboarding || nextOnboardingStep?.label === "Share booking link";

  const stats: DashboardOverviewStat[] = [
    {
      label: "Today revenue",
      value: formatLkr(Number(todayRevenue ?? 0)),
      icon: Banknote,
      tone: "cobalt",
    },
    {
      label: "Today bookings",
      value: todayBookings,
      icon: CalendarCheck,
      tone: "amber",
    },
    {
      label: "Week revenue",
      value: formatLkr(currentWeekRevenue),
      icon: TrendingUp,
      tone: "violet",
      delta: `${revenueDelta >= 0 ? "+" : ""}${revenueDelta}% vs last week`,
    },
    {
      label: "New clients",
      value: newClientsThisWeek,
      icon: UserPlus,
      tone: "cobalt",
      delta: "This week",
    },
  ];

  return {
    businessName: business.name,
    greetingDate: format(now, "EEEE, MMMM d"),
    stats,
    showStats: !(Number(totalBookings) === 0 && showOnboarding),
    showOnboarding,
    showShareCard,
    onboarding,
    bookingUrl,
    bookingDisplayUrl,
    whatsappShare,
    embedSnippet,
    todayRows,
    nextRows,
    recentActivity,
  };
}

export function serializeDashboardOverviewData(data: DashboardOverviewData) {
  return {
    ...data,
    stats: data.stats.map(({ icon, ...stat }) => {
      void icon;
      return stat;
    }),
    todayRows: data.todayRows.map((row) => ({
      ...row,
      startsAt: row.startsAt.toISOString(),
    })),
    nextRows: data.nextRows.map((row) => ({
      ...row,
      startsAt: row.startsAt.toISOString(),
    })),
    recentActivity: data.recentActivity.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}

export function formatOverviewActivityAge(createdAt: Date | string): string {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  return formatDistanceToNow(date, { addSuffix: true });
}
