import { db } from "@/db";
import { bookings, clients, payments, reviews, services, staff } from "@/db/schema";
import { ProGate } from "@/components/ProGate";
import { requireBusiness } from "@/lib/auth";
import { formatLkr } from "@/lib/utils";
import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts";
import { DealAnalyticsPanel } from "@/components/dashboard/DealAnalyticsPanel";
import { StatCard } from "@/components/dashboard/StatCard";
import { getDealAnalytics } from "@/lib/deals/analytics";
import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { startOfWeek, subWeeks } from "date-fns";
import { BarChart3, CalendarDays, Star, Users } from "lucide-react";

export default async function ReportsPage() {
  const { businessId } = await requireBusiness();

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const previousWeekStart = subWeeks(weekStart, 1);
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const [
    [{ totalBookings }],
    [{ completedBookings }],
    [{ cancelledBookings }],
    [{ noShows }],
    [{ totalClients }],
    [{ totalRevenue }],
    [{ averageRating }],
    revenueByService,
    bookingsByStaff,
    bookingsBySource,
    dailyRevenueThisWeek,
    dailyRevenueLastWeek,
    busiestHours,
    topClients,
  ] = await Promise.all([
    db.select({ totalBookings: count() }).from(bookings).where(eq(bookings.businessId, businessId)),
    db.select({ completedBookings: count() }).from(bookings).where(and(eq(bookings.businessId, businessId), eq(bookings.status, "completed"))),
    db.select({ cancelledBookings: count() }).from(bookings).where(and(eq(bookings.businessId, businessId), eq(bookings.status, "cancelled"))),
    db.select({ noShows: count() }).from(bookings).where(and(eq(bookings.businessId, businessId), eq(bookings.status, "no_show"))),
    db.select({ totalClients: count() }).from(clients).where(eq(clients.businessId, businessId)),
    db
      .select({ totalRevenue: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int` })
      .from(payments)
      .innerJoin(bookings, eq(bookings.id, payments.bookingId))
      .where(and(eq(bookings.businessId, businessId), eq(payments.status, "success"))),
    db
      .select({ averageRating: sql<number>`coalesce(avg(${reviews.rating}), 0)` })
      .from(reviews)
      .where(eq(reviews.businessId, businessId)),
    db
      .select({
        serviceName: services.name,
        revenue: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int`,
      })
      .from(payments)
      .innerJoin(bookings, eq(bookings.id, payments.bookingId))
      .innerJoin(services, eq(services.id, bookings.serviceId))
      .where(and(eq(bookings.businessId, businessId), eq(payments.status, "success")))
      .groupBy(services.name)
      .orderBy(desc(sql`coalesce(sum(${payments.amountLkr}), 0)`))
      .limit(8),
    db
      .select({
        staffName: staff.name,
        value: count(bookings.id),
      })
      .from(bookings)
      .innerJoin(staff, eq(staff.id, bookings.staffId))
      .where(eq(bookings.businessId, businessId))
      .groupBy(staff.name)
      .orderBy(desc(count(bookings.id)))
      .limit(8),
    db
      .select({
        source: bookings.source,
        value: count(bookings.id),
      })
      .from(bookings)
      .where(eq(bookings.businessId, businessId))
      .groupBy(bookings.source)
      .orderBy(desc(count(bookings.id)))
      .limit(12),
    db
      .select({
        dayIndex: sql<number>`extract(dow from ${payments.createdAt})::int`,
        revenue: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int`,
      })
      .from(payments)
      .innerJoin(bookings, eq(bookings.id, payments.bookingId))
      .where(and(
        eq(bookings.businessId, businessId),
        eq(payments.status, "success"),
        gte(payments.createdAt, weekStart),
      ))
      .groupBy(sql`extract(dow from ${payments.createdAt})`),
    db
      .select({
        dayIndex: sql<number>`extract(dow from ${payments.createdAt})::int`,
        revenue: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int`,
      })
      .from(payments)
      .innerJoin(bookings, eq(bookings.id, payments.bookingId))
      .where(and(
        eq(bookings.businessId, businessId),
        eq(payments.status, "success"),
        gte(payments.createdAt, previousWeekStart),
        lt(payments.createdAt, weekStart),
      ))
      .groupBy(sql`extract(dow from ${payments.createdAt})`),
    db
      .select({
        hour: sql<number>`extract(hour from ${bookings.startsAt})::int`,
        value: count(bookings.id),
      })
      .from(bookings)
      .where(eq(bookings.businessId, businessId))
      .groupBy(sql`extract(hour from ${bookings.startsAt})`)
      .orderBy(desc(count(bookings.id)))
      .limit(8),
    db
      .select({
        name: clients.name,
        spend: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int`,
      })
      .from(clients)
      .innerJoin(bookings, eq(bookings.clientId, clients.id))
      .innerJoin(payments, eq(payments.bookingId, bookings.id))
      .where(and(eq(clients.businessId, businessId), eq(payments.status, "success")))
      .groupBy(clients.name)
      .orderBy(desc(sql`coalesce(sum(${payments.amountLkr}), 0)`))
      .limit(5),
  ]);

  const total = Number(totalBookings);
  const cancellationRate = total > 0 ? Math.round((Number(cancelledBookings) / total) * 100) : 0;
  const noShowRate = total > 0 ? Math.round((Number(noShows) / total) * 100) : 0;

  const thisWeekMap = new Map(dailyRevenueThisWeek.map((row) => [Number(row.dayIndex), Number(row.revenue)]));
  const lastWeekMap = new Map(dailyRevenueLastWeek.map((row) => [Number(row.dayIndex), Number(row.revenue)]));

  const revenueByDay = dayLabels.map((day, index) => {
    const pgDow = index === 6 ? 0 : index + 1;
    return {
      day,
      thisWeek: thisWeekMap.get(pgDow) ?? 0,
      lastWeek: lastWeekMap.get(pgDow) ?? 0,
    };
  });

  const formatHour = (hour: number) => {
    const suffix = hour >= 12 ? "pm" : "am";
    const normalized = hour % 12 === 0 ? 12 : hour % 12;
    return `${normalized}${suffix}`;
  };

  const dealAnalytics = await getDealAnalytics(businessId);

  return (
    <ProGate businessId={businessId} feature="reports">
      <div className="space-y-6">
        <div>
          <h1 className="font-cal text-2xl">Analytics & Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revenue trends, booking patterns, client spend, and staff workload.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Revenue" value={formatLkr(Number(totalRevenue ?? 0))} icon={BarChart3} tone="cobalt" />
          <StatCard label="Bookings" value={totalBookings} icon={CalendarDays} tone="amber" />
          <StatCard label="Clients" value={totalClients} icon={Users} tone="slate" />
          <StatCard label="Avg. rating" value={Number(averageRating).toFixed(1)} icon={Star} tone="violet" />
        </div>

        <AnalyticsCharts
          revenueByDay={revenueByDay}
          revenueByService={revenueByService.map((row) => ({
            name: row.serviceName,
            value: Number(row.revenue),
          }))}
          busiestHours={[...busiestHours]
            .sort((a, b) => Number(a.hour) - Number(b.hour))
            .map((row) => ({
              name: formatHour(Number(row.hour)),
              value: Number(row.value),
            }))}
          bookingHealth={[
            { name: "Completed", value: Number(completedBookings) },
            { name: "Cancelled", value: Number(cancelledBookings) },
            { name: "No-show", value: Number(noShows) },
          ].filter((item) => item.value > 0)}
          topClients={topClients.map((row) => ({
            name: row.name,
            spend: Number(row.spend),
          }))}
          formatCurrency={formatLkr}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 font-semibold">Booking health summary</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-2xl font-bold">{completedBookings}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-2xl font-bold">{cancellationRate}%</p>
                <p className="text-xs text-muted-foreground">Cancelled</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-2xl font-bold">{noShowRate}%</p>
                <p className="text-xs text-muted-foreground">No-show</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 lg:col-span-2">
            <h2 className="mb-4 font-semibold">Bookings by source</h2>
            {bookingsBySource.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {bookingsBySource.map((row) => (
                  <div key={row.source} className="rounded-lg border px-4 py-3">
                    <p className="font-medium capitalize">{row.source.replace(/_/g, " ")}</p>
                    <p className="text-sm text-muted-foreground">{row.value} bookings</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-white p-5 lg:col-span-2">
            <h2 className="mb-4 font-semibold">Bookings by staff</h2>
            {bookingsByStaff.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {bookingsByStaff.map((row) => (
                  <div key={row.staffName} className="rounded-lg border px-4 py-3">
                    <p className="font-medium">{row.staffName}</p>
                    <p className="text-sm text-muted-foreground">{row.value} bookings</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DealAnalyticsPanel analytics={dealAnalytics} />
      </div>
    </ProGate>
  );
}
