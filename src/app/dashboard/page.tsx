import { db } from "@/db";
import { activityLog, availability, bookings, businesses, clients, payments, services, staff } from "@/db/schema";
import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { addDays, endOfWeek, format, startOfDay, startOfWeek, subWeeks } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/auth";
import { formatLkr } from "@/lib/utils";
import { OnboardingWizard } from "@/components/dashboard/OnboardingWizard";
import { StatCard } from "@/components/dashboard/StatCard";
import { buildPublicBookingUrl, buildPublicBookingUrlLabel } from "@/lib/booking-url";
import { Icon } from "@/components/ui/Icon";
import { Banknote, CalendarCheck, TrendingUp, UserPlus } from "lucide-react";

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

export default async function DashboardOverview() {
  const { businessId } = await requireBusiness();

  const [business] = await db
    .select({
      address: businesses.address,
      description: businesses.description,
      name: businesses.name,
      payhereEnabled: businesses.payhereEnabled,
      payhereMerchantId: businesses.payhereMerchantId,
      phone: businesses.phone,
      plan: businesses.plan,
      slug: businesses.slug,
      customDomain: businesses.customDomain,
      customDomainVerified: businesses.customDomainVerified,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) notFound();

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
    db.select({ newClientsThisWeek: count() }).from(clients).where(and(eq(clients.businessId, businessId), gte(clients.createdAt, weekStart))),
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
      .where(and(eq(bookings.businessId, businessId), eq(payments.status, "success"), gte(payments.createdAt, todayStart), lt(payments.createdAt, tomorrow))),
    db
      .select({ weekRevenue: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int` })
      .from(payments)
      .innerJoin(bookings, eq(bookings.id, payments.bookingId))
      .where(and(eq(bookings.businessId, businessId), eq(payments.status, "success"), gte(payments.createdAt, weekStart), lt(payments.createdAt, weekEnd))),
    db
      .select({ previousWeekRevenue: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int` })
      .from(payments)
      .innerJoin(bookings, eq(bookings.id, payments.bookingId))
      .where(and(eq(bookings.businessId, businessId), eq(payments.status, "success"), gte(payments.createdAt, previousWeekStart), lt(payments.createdAt, weekStart))),
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
  const revenueDelta = previousRevenue > 0
    ? Math.round(((currentWeekRevenue - previousRevenue) / previousRevenue) * 100)
    : currentWeekRevenue > 0 ? 100 : 0;

  const onboarding = [
    { label: "Add business info", done: Boolean(business.description && business.phone && business.address), href: "/dashboard/settings", description: "Add your phone, address, and a short description clients will see." },
    { label: "Create first service", done: Number(servicesCount) > 0, href: "/dashboard/services/new", description: "List what clients can book — price, duration, and deposit rules." },
    { label: "Add staff", done: Number(staffCount) > 0, href: "/dashboard/staff/new", description: "Add yourself or your team so bookings can be assigned." },
    { label: "Set availability", done: Number(availabilityCount) > 0, href: "/dashboard/availability", description: "Choose the days and hours clients can book online." },
    { label: "Connect PayHere", done: Boolean(business.payhereEnabled && business.payhereMerchantId), href: "/dashboard/settings", description: "Accept card payments online via PayHere, or take bank transfers and LankaQR." },
    { label: "Share booking link", done: Number(totalBookings) > 0, href: bookingUrl, description: "Post your link on WhatsApp Status, Instagram bio, or send it directly to clients." },
  ];
  const showOnboarding = onboarding.some((item) => !item.done);

  const stats = [
    { label: "Today revenue", value: formatLkr(Number(todayRevenue ?? 0)), icon: Banknote, tone: "cobalt" as const, delta: undefined },
    { label: "Today bookings", value: todayBookings, icon: CalendarCheck, tone: "amber" as const, delta: undefined },
    {
      label: "Week revenue",
      value: formatLkr(currentWeekRevenue),
      icon: TrendingUp,
      tone: "violet" as const,
      delta: `${revenueDelta >= 0 ? "+" : ""}${revenueDelta}% vs last week`,
    },
    { label: "New clients", value: newClientsThisWeek, icon: UserPlus, tone: "cobalt" as const, delta: "This week" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
          {format(now, "EEEE, MMMM d")}
        </p>
        <h1 className="font-cal text-3xl tracking-tight">Good day, {business.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Today&apos;s bookings, revenue, and setup progress.</p>
      </div>

      {Number(totalBookings) === 0 && showOnboarding ? null : (
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              tone={stat.tone}
              delta={stat.delta}
            />
          ))}
        </div>
      )}

      {showOnboarding && (
        <OnboardingWizard steps={onboarding} bookingUrl={bookingUrl} whatsappShare={whatsappShare} />
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-xl border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Today timeline</h2>
            <Link href="/dashboard/calendar" className="text-sm text-primary hover:underline">Calendar</Link>
          </div>
          {todayRows.length === 0 ? (
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">No bookings today.</p>
              {nextRows.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next appointments</p>
                  {nextRows.map((row) => (
                    <Link key={row.id} href={`/dashboard/bookings/${row.id}`} className="block rounded-md border bg-white px-3 py-2 text-sm hover:border-primary/40">
                      <span className="font-medium">{row.clientName}</span>
                      <span className="text-muted-foreground"> - {row.serviceName} on {format(row.startsAt, "d MMM, h:mm a")}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {todayRows.map((row) => (
                <Link key={row.id} href={`/dashboard/bookings/${row.id}`} className="flex items-center gap-4 rounded-lg border px-4 py-3 hover:border-primary/40">
                  <span className="w-20 text-sm font-semibold tabular-nums text-primary">{format(row.startsAt, "h:mm a")}</span>
                  <span className="flex-1 text-sm">
                    <span className="font-medium">{row.clientName}</span>
                    <span className="text-muted-foreground"> - {row.serviceName} with {row.staffName}</span>
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">{row.status.replace("_", " ")}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon name="link-45deg" className="text-sm" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold">Share booking link</p>
            </div>
            <code className="block truncate rounded-lg border border-primary/15 bg-white px-3 py-2 font-mono text-sm text-primary">
              {bookingDisplayUrl}
            </code>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border bg-white px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5">Open</a>
              <a href={whatsappShare} target="_blank" rel="noopener noreferrer" className="rounded-md border bg-white px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5">WhatsApp</a>
              <Link href="/dashboard/marketing" className="rounded-md border bg-white px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5">QR & embed</Link>
            </div>
            <textarea readOnly value={embedSnippet} className="mt-3 h-16 w-full resize-none rounded-md border bg-white p-2 text-xs text-muted-foreground" />
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 font-semibold">Recent activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, index) => (
                  <div key={`${item.entity}-${item.createdAt.toISOString()}-${index}`} className="border-b pb-3 last:border-b-0 last:pb-0">
                    <p className="text-sm font-medium capitalize">{item.entity} {item.action.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{format(item.createdAt, "d MMM, h:mm a")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
