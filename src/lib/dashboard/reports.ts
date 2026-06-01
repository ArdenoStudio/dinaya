import { addDays, endOfDay, startOfDay, startOfWeek, subDays } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, businesses, clients, payments, reviews, services, staff } from "@/db/schema";

export type DashboardReportsRange = {
  from: string;
  to: string;
};

export type DashboardReportsOverview = Awaited<ReturnType<typeof getReportsDashboardOverview>>;

function ymd(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return value;
}

export function normalizeReportsRange(input: {
  from?: string | null;
  now?: Date;
  timezone?: string;
  to?: string | null;
}): DashboardReportsRange {
  const timezone = input.timezone ?? "Asia/Colombo";
  const now = input.now ?? new Date();
  const localNow = toZonedTime(now, timezone);
  const defaultTo = ymd(localNow);
  const defaultFrom = ymd(subDays(localNow, 29));
  const from = parseDateInput(input.from) ?? defaultFrom;
  const to = parseDateInput(input.to) ?? defaultTo;

  if (from > to) {
    return { from: to, to: from };
  }

  return { from, to };
}

function rangeBounds(range: DashboardReportsRange, timezone: string) {
  return {
    endUtc: fromZonedTime(endOfDay(new Date(`${range.to}T12:00:00`)), timezone),
    startUtc: fromZonedTime(startOfDay(new Date(`${range.from}T12:00:00`)), timezone),
  };
}

function weekBounds(now: Date, timezone: string) {
  const localNow = toZonedTime(now, timezone);
  const currentStartLocal = startOfWeek(localNow, { weekStartsOn: 1 });
  const currentEndLocal = addDays(currentStartLocal, 7);
  const previousStartLocal = subDays(currentStartLocal, 7);

  return {
    currentEndUtc: fromZonedTime(currentEndLocal, timezone),
    currentStartUtc: fromZonedTime(currentStartLocal, timezone),
    previousStartUtc: fromZonedTime(previousStartLocal, timezone),
  };
}

function money(value: number): string {
  return `LKR ${value.toLocaleString("en-LK")}`;
}

function csvEscape(value: string | number | null | undefined): string {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function csvLine(values: Array<string | number | null | undefined>): string {
  return values.map(csvEscape).join(",");
}

export async function getReportsDashboardOverview(
  businessId: string,
  rangeInput: { from?: string | null; to?: string | null } = {},
  now = new Date(),
) {
  const [business] = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      timezone: businesses.timezone,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  const timezone = business?.timezone ?? "Asia/Colombo";
  const range = normalizeReportsRange({ ...rangeInput, now, timezone });
  const { endUtc, startUtc } = rangeBounds(range, timezone);
  const weeks = weekBounds(now, timezone);
  const localPaymentDate = sql<string>`to_char(${payments.createdAt} AT TIME ZONE ${timezone}, 'YYYY-MM-DD')`;
  const localPaymentWeekday = sql<number>`extract(dow from ${payments.createdAt} AT TIME ZONE ${timezone})::int`;
  const localBookingHour = sql<number>`extract(hour from ${bookings.startsAt} AT TIME ZONE ${timezone})::int`;
  const bookingRange = and(
    eq(bookings.businessId, businessId),
    gte(bookings.startsAt, startUtc),
    lt(bookings.startsAt, endUtc),
  );
  const paymentRange = and(
    eq(bookings.businessId, businessId),
    eq(payments.status, "success"),
    gte(payments.createdAt, startUtc),
    lt(payments.createdAt, endUtc),
  );

  const [
    [{ totalBookings }],
    [{ completedBookings }],
    [{ cancelledBookings }],
    [{ noShows }],
    [{ newClients }],
    [{ totalClients }],
    [{ totalRevenue }],
    [{ averageRating }],
    bookingsByStatus,
    bookingsBySource,
    revenueByService,
    staffLoad,
    topClients,
    revenueByDay,
    dailyRevenueThisWeek,
    dailyRevenueLastWeek,
    busiestHours,
  ] = await Promise.all([
    db.select({ totalBookings: count() }).from(bookings).where(bookingRange),
    db.select({ completedBookings: count() }).from(bookings).where(and(bookingRange, eq(bookings.status, "completed"))),
    db.select({ cancelledBookings: count() }).from(bookings).where(and(bookingRange, eq(bookings.status, "cancelled"))),
    db.select({ noShows: count() }).from(bookings).where(and(bookingRange, eq(bookings.status, "no_show"))),
    db
      .select({ newClients: count() })
      .from(clients)
      .where(and(eq(clients.businessId, businessId), gte(clients.createdAt, startUtc), lt(clients.createdAt, endUtc))),
    db.select({ totalClients: count() }).from(clients).where(eq(clients.businessId, businessId)),
    db
      .select({ totalRevenue: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int` })
      .from(payments)
      .innerJoin(bookings, eq(bookings.id, payments.bookingId))
      .where(paymentRange),
    db
      .select({ averageRating: sql<number>`coalesce(avg(${reviews.rating}), 0)` })
      .from(reviews)
      .where(and(eq(reviews.businessId, businessId), gte(reviews.createdAt, startUtc), lt(reviews.createdAt, endUtc))),
    db
      .select({ status: bookings.status, value: count(bookings.id) })
      .from(bookings)
      .where(bookingRange)
      .groupBy(bookings.status)
      .orderBy(desc(count(bookings.id))),
    db
      .select({ source: bookings.source, value: count(bookings.id) })
      .from(bookings)
      .where(bookingRange)
      .groupBy(bookings.source)
      .orderBy(desc(count(bookings.id)))
      .limit(12),
    db
      .select({
        serviceName: services.name,
        value: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int`,
      })
      .from(payments)
      .innerJoin(bookings, eq(bookings.id, payments.bookingId))
      .innerJoin(services, eq(services.id, bookings.serviceId))
      .where(paymentRange)
      .groupBy(services.name)
      .orderBy(desc(sql`coalesce(sum(${payments.amountLkr}), 0)`))
      .limit(8),
    db
      .select({ staffName: staff.name, value: count(bookings.id) })
      .from(bookings)
      .innerJoin(staff, eq(staff.id, bookings.staffId))
      .where(bookingRange)
      .groupBy(staff.name)
      .orderBy(desc(count(bookings.id)))
      .limit(8),
    db
      .select({
        name: clients.name,
        value: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int`,
      })
      .from(clients)
      .innerJoin(bookings, eq(bookings.clientId, clients.id))
      .innerJoin(payments, eq(payments.bookingId, bookings.id))
      .where(paymentRange)
      .groupBy(clients.name)
      .orderBy(desc(sql`coalesce(sum(${payments.amountLkr}), 0)`))
      .limit(6),
    db
      .select({
        date: localPaymentDate,
        value: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int`,
      })
      .from(payments)
      .innerJoin(bookings, eq(bookings.id, payments.bookingId))
      .where(paymentRange)
      .groupBy(localPaymentDate)
      .orderBy(localPaymentDate),
    db
      .select({
        dayIndex: localPaymentWeekday,
        revenue: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int`,
      })
      .from(payments)
      .innerJoin(bookings, eq(bookings.id, payments.bookingId))
      .where(and(
        eq(bookings.businessId, businessId),
        eq(payments.status, "success"),
        gte(payments.createdAt, weeks.currentStartUtc),
        lt(payments.createdAt, weeks.currentEndUtc),
      ))
      .groupBy(localPaymentWeekday),
    db
      .select({
        dayIndex: localPaymentWeekday,
        revenue: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int`,
      })
      .from(payments)
      .innerJoin(bookings, eq(bookings.id, payments.bookingId))
      .where(and(
        eq(bookings.businessId, businessId),
        eq(payments.status, "success"),
        gte(payments.createdAt, weeks.previousStartUtc),
        lt(payments.createdAt, weeks.currentStartUtc),
      ))
      .groupBy(localPaymentWeekday),
    db
      .select({
        hour: localBookingHour,
        value: count(bookings.id),
      })
      .from(bookings)
      .where(bookingRange)
      .groupBy(localBookingHour)
      .orderBy(desc(count(bookings.id)))
      .limit(8),
  ]);

  const bookingCount = Number(totalBookings ?? 0);
  const cancelled = Number(cancelledBookings ?? 0);
  const noShowCount = Number(noShows ?? 0);
  const revenue = Number(totalRevenue ?? 0);
  const metrics = {
    averageRating: Number(averageRating ?? 0),
    cancellationRate: bookingCount > 0 ? Math.round((cancelled / bookingCount) * 100) : 0,
    cancelledBookings: cancelled,
    completedBookings: Number(completedBookings ?? 0),
    newClients: Number(newClients ?? 0),
    noShowRate: bookingCount > 0 ? Math.round((noShowCount / bookingCount) * 100) : 0,
    noShows: noShowCount,
    totalClients: Number(totalClients ?? 0),
    totalBookings: bookingCount,
    totalRevenueLkr: revenue,
  };

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const thisWeekMap = new Map(dailyRevenueThisWeek.map((row) => [Number(row.dayIndex), Number(row.revenue)]));
  const lastWeekMap = new Map(dailyRevenueLastWeek.map((row) => [Number(row.dayIndex), Number(row.revenue)]));

  const csv = [
    csvLine(["Dinaya reports export", business?.name ?? businessId]),
    csvLine(["Range", range.from, range.to]),
    csvLine(["Metric", "Value"]),
    csvLine(["Revenue", revenue]),
    csvLine(["Bookings", bookingCount]),
    csvLine(["Completed bookings", metrics.completedBookings]),
    csvLine(["Cancelled bookings", metrics.cancelledBookings]),
    csvLine(["No-shows", metrics.noShows]),
    csvLine(["New clients", metrics.newClients]),
    csvLine(["Average rating", metrics.averageRating.toFixed(1)]),
    "",
    csvLine(["Revenue by service", "Value"]),
    ...revenueByService.map((row) => csvLine([row.serviceName, Number(row.value)])),
    "",
    csvLine(["Bookings by staff", "Value"]),
    ...staffLoad.map((row) => csvLine([row.staffName, Number(row.value)])),
  ].join("\n");

  return {
    breakdowns: {
      bookingsBySource: bookingsBySource.map((row) => ({
        label: row.source.replace(/_/g, " "),
        value: Number(row.value),
      })),
      bookingsByStatus: bookingsByStatus.map((row) => ({
        label: row.status,
        value: Number(row.value),
      })),
      revenueByDay: revenueByDay.map((row) => ({
        label: row.date,
        value: Number(row.value),
      })),
      revenueByService: revenueByService.map((row) => ({
        label: row.serviceName,
        value: Number(row.value),
      })),
      staffLoad: staffLoad.map((row) => ({
        label: row.staffName,
        value: Number(row.value),
      })),
      topClients: topClients.map((row) => ({
        label: row.name,
        value: Number(row.value),
      })),
    },
    business: {
      id: business?.id ?? businessId,
      name: business?.name ?? "Dinaya",
      timezone,
    },
    export: {
      csv,
      filename: `dinaya-reports-${range.from}-to-${range.to}.csv`,
      generatedAt: now.toISOString(),
    },
    metrics: {
      ...metrics,
      totalRevenueLabel: money(revenue),
    },
    range,
    trends: {
      busiestHours: [...busiestHours]
        .sort((a, b) => Number(a.hour) - Number(b.hour))
        .map((row) => ({
          hour: Number(row.hour),
          value: Number(row.value),
        })),
      revenueByWeekday: dayLabels.map((day, index) => {
        const pgDow = index === 6 ? 0 : index + 1;
        return {
          day,
          lastWeek: lastWeekMap.get(pgDow) ?? 0,
          thisWeek: thisWeekMap.get(pgDow) ?? 0,
        };
      }),
    },
  };
}
