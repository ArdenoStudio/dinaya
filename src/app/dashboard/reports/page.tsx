import { db } from "@/db";
import { bookings, clients, payments, reviews, services, staff } from "@/db/schema";
import { ProGate } from "@/lib/plan";
import { requireBusiness } from "@/lib/auth";
import { formatLkr } from "@/lib/utils";
import { and, count, desc, eq, sql } from "drizzle-orm";

export default async function ReportsPage() {
  const { businessId } = await requireBusiness();

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
  ]);

  const total = Number(totalBookings);
  const cancellationRate = total > 0 ? Math.round((Number(cancelledBookings) / total) * 100) : 0;
  const noShowRate = total > 0 ? Math.round((Number(noShows) / total) * 100) : 0;

  return (
    <ProGate businessId={businessId} feature="reports">
      <div className="space-y-6">
        <div>
          <h1 className="font-cal text-2xl">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Revenue, booking quality, clients, and staff workload.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Revenue", formatLkr(Number(totalRevenue ?? 0))],
            ["Bookings", totalBookings],
            ["Clients", totalClients],
            ["Avg. rating", Number(averageRating).toFixed(1)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border bg-white p-5">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 font-semibold">Booking health</h2>
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

          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 font-semibold">Revenue by service</h2>
            {revenueByService.length === 0 ? (
              <p className="text-sm text-muted-foreground">No successful payments yet.</p>
            ) : (
              <div className="space-y-3">
                {revenueByService.map((row) => (
                  <div key={row.serviceName} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                    <span className="text-sm">{row.serviceName}</span>
                    <span className="text-sm font-semibold">{formatLkr(Number(row.revenue))}</span>
                  </div>
                ))}
              </div>
            )}
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
      </div>
    </ProGate>
  );
}
