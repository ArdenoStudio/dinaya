import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, locations, payments, services, staff } from "@/db/schema";

export type DashboardPaymentDetail = Awaited<ReturnType<typeof getPaymentDashboardDetail>>;
export type DashboardPaymentStatus = "pending" | "success" | "failed" | "refunded";
export type DashboardPaymentStatusFilter = DashboardPaymentStatus | "all";

export const dashboardPaymentStatuses = ["pending", "success", "failed", "refunded"] as const;

export type DashboardPaymentsListOptions = {
  limit?: number;
  q?: string;
  status?: DashboardPaymentStatusFilter;
};

export type DashboardPaymentsList = Awaited<ReturnType<typeof getPaymentsDashboardList>>;

const DEFAULT_PAYMENT_LIMIT = 80;
const MAX_PAYMENT_LIMIT = 150;

function normalizePaymentLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_PAYMENT_LIMIT;
  return Math.min(MAX_PAYMENT_LIMIT, Math.max(1, Math.round(limit ?? DEFAULT_PAYMENT_LIMIT)));
}

export function isDashboardPaymentStatus(value: string): value is DashboardPaymentStatus {
  return dashboardPaymentStatuses.includes(value as DashboardPaymentStatus);
}

export async function getPaymentsDashboardList(
  businessId: string,
  options: DashboardPaymentsListOptions = {},
) {
  const status = options.status && options.status !== "all" ? options.status : null;
  const query = options.q?.trim() ?? "";
  const limit = normalizePaymentLimit(options.limit);

  const baseFilters = [eq(bookings.businessId, businessId)];
  const filters = [
    ...baseFilters,
    ...(status ? [eq(payments.status, status)] : []),
    ...(query
      ? [
          or(
            ilike(bookings.clientName, `%${query}%`),
            ilike(bookings.clientPhone, `%${query}%`),
            ilike(services.name, `%${query}%`),
            ilike(payments.payhereOrderId, `%${query}%`),
          ),
        ]
      : []),
  ];

  const [summaryRows, rows] = await Promise.all([
    db
      .select({
        failedPayments: sql<number>`coalesce(count(*) filter (where ${payments.status} = 'failed'), 0)::int`,
        pendingPayments: sql<number>`coalesce(count(*) filter (where ${payments.status} = 'pending'), 0)::int`,
        refundedPayments: sql<number>`coalesce(count(*) filter (where ${payments.status} = 'refunded'), 0)::int`,
        successfulPayments: sql<number>`coalesce(count(*) filter (where ${payments.status} = 'success'), 0)::int`,
        successfulRevenueLkr: sql<number>`coalesce(sum(${payments.amountLkr}) filter (where ${payments.status} = 'success'), 0)::int`,
        totalPayments: count(),
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(and(...baseFilters)),
    db
      .select({
        amountLkr: payments.amountLkr,
        bookingId: bookings.id,
        bookingStatus: bookings.status,
        clientName: bookings.clientName,
        clientPhone: bookings.clientPhone,
        createdAt: payments.createdAt,
        id: payments.id,
        locationName: locations.name,
        orderId: payments.payhereOrderId,
        receiptSentAt: payments.receiptSentAt,
        serviceName: services.name,
        staffName: staff.name,
        startsAt: bookings.startsAt,
        status: payments.status,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(staff, eq(bookings.staffId, staff.id))
      .leftJoin(locations, eq(bookings.locationId, locations.id))
      .where(and(...filters))
      .orderBy(desc(payments.createdAt))
      .limit(limit),
  ]);
  const summary = summaryRows[0];

  return {
    filters: {
      limit,
      q: query,
      status: options.status ?? "all",
    },
    rows: rows.map((row) => ({
      amountLkr: row.amountLkr,
      bookingId: row.bookingId,
      bookingStatus: row.bookingStatus,
      clientName: row.clientName,
      clientPhone: row.clientPhone,
      createdAt: row.createdAt.toISOString(),
      id: row.id,
      locationName: row.locationName,
      orderId: row.orderId,
      receiptSentAt: row.receiptSentAt?.toISOString() ?? null,
      serviceName: row.serviceName,
      staffName: row.staffName,
      startsAt: row.startsAt.toISOString(),
      status: row.status,
      webUrl: `/dashboard/bookings/${row.bookingId}`,
    })),
    summary: summary ?? {
      failedPayments: 0,
      pendingPayments: 0,
      refundedPayments: 0,
      successfulPayments: 0,
      successfulRevenueLkr: 0,
      totalPayments: 0,
    },
  };
}

export async function getPaymentDashboardDetail(businessId: string, paymentId: string) {
  const [detail] = await db
    .select({
      amountLkr: payments.amountLkr,
      bookingId: bookings.id,
      bookingStatus: bookings.status,
      clientEmail: bookings.clientEmail,
      clientName: bookings.clientName,
      clientPhone: bookings.clientPhone,
      createdAt: payments.createdAt,
      endsAt: bookings.endsAt,
      id: payments.id,
      locationName: locations.name,
      orderId: payments.payhereOrderId,
      receiptSentAt: payments.receiptSentAt,
      serviceName: services.name,
      staffName: staff.name,
      startsAt: bookings.startsAt,
      status: payments.status,
    })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(staff, eq(bookings.staffId, staff.id))
    .leftJoin(locations, eq(bookings.locationId, locations.id))
    .where(and(eq(payments.id, paymentId), eq(bookings.businessId, businessId)))
    .limit(1);

  if (!detail) return null;

  return {
    payment: {
      amountLkr: detail.amountLkr,
      createdAt: detail.createdAt.toISOString(),
      id: detail.id,
      orderId: detail.orderId,
      receiptSentAt: detail.receiptSentAt?.toISOString() ?? null,
      status: detail.status,
    },
    booking: {
      clientEmail: detail.clientEmail,
      clientName: detail.clientName,
      clientPhone: detail.clientPhone,
      endsAt: detail.endsAt.toISOString(),
      id: detail.bookingId,
      locationName: detail.locationName,
      serviceName: detail.serviceName,
      staffName: detail.staffName,
      startsAt: detail.startsAt.toISOString(),
      status: detail.bookingStatus,
    },
  };
}
