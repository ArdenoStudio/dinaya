import { and, asc, count, desc, eq, gte, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { bookings, services, staff, staffServices } from "@/db/schema";
import type { IntakeQuestion } from "@/lib/intake";
import type { serviceUpdateSchema } from "@/lib/schemas/services";
import { isoDateString, nullableIsoDateString } from "@/lib/dashboard/serialization";
import type { z } from "@/lib/validation";

export type DashboardServicesList = Awaited<ReturnType<typeof getServicesDashboardList>>;
export type DashboardServiceDetail = Awaited<ReturnType<typeof getServiceDashboardDetail>>;
export type DashboardServiceStatusFilter = "active" | "all" | "inactive";
export type ServiceDashboardUpdateInput = z.infer<typeof serviceUpdateSchema>;
export type ServiceDashboardUpdateResult =
  | { status: "future_bookings"; error: string }
  | { status: "not_found"; error: string }
  | { status: "updated"; service: ServiceDashboardUpdatedService };

export type ServiceDashboardUpdatedService = {
  afterBuffer: number;
  beforeBuffer: number;
  businessId: string;
  createdAt: Date;
  dailyCapacity: number | null;
  maximumAdvanceDays: number | null;
  intakeQuestions: IntakeQuestion[] | null;
  depositPercent: number;
  description: string | null;
  imageUrl: string | null;
  durationMinutes: number;
  id: string;
  isActive: boolean;
  minimumNoticeHours: number;
  name: string;
  priceLkr: number;
  requiresPayment: boolean;
  successRedirectUrl: string | null;
};

export const dashboardServiceStatusFilters = ["all", "active", "inactive"] as const;

export type DashboardServicesListOptions = {
  limit?: number;
  q?: string;
  status?: DashboardServiceStatusFilter;
};

const serviceUpdateFields = [
  "name",
  "description",
  "imageUrl",
  "durationMinutes",
  "priceLkr",
  "depositPercent",
  "requiresPayment",
  "isActive",
  "beforeBuffer",
  "afterBuffer",
  "minimumNoticeHours",
  "dailyCapacity",
  "maximumAdvanceDays",
  "intakeQuestions",
  "successRedirectUrl",
] as const;

const DEFAULT_SERVICE_LIMIT = 200;
const MAX_SERVICE_LIMIT = 500;

function normalizeServiceLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_SERVICE_LIMIT;
  return Math.min(MAX_SERVICE_LIMIT, Math.max(1, Math.round(limit ?? DEFAULT_SERVICE_LIMIT)));
}

export function isDashboardServiceStatusFilter(value: string): value is DashboardServiceStatusFilter {
  return dashboardServiceStatusFilters.includes(value as DashboardServiceStatusFilter);
}

export async function getServicesDashboardList(
  businessId: string,
  options: DashboardServicesListOptions = {},
) {
  const query = options.q?.trim().toLowerCase() ?? "";
  const status = options.status ?? "all";
  const limit = normalizeServiceLimit(options.limit);
  const conditions: SQL[] = [eq(services.businessId, businessId)];

  if (status === "active") conditions.push(eq(services.isActive, true));
  if (status === "inactive") conditions.push(eq(services.isActive, false));
  if (query) {
    conditions.push(or(
      ilike(services.name, `%${query}%`),
      ilike(services.description, `%${query}%`),
    )!);
  }

  const [summaryRows, rows] = await Promise.all([
    db
      .select({
        activeServices: sql<number>`coalesce(count(*) filter (where ${services.isActive} = true), 0)::int`,
        averageDurationMinutes: sql<number>`coalesce(round(avg(${services.durationMinutes})), 0)::int`,
        averagePriceLkr: sql<number>`coalesce(round(avg(${services.priceLkr})), 0)::int`,
        inactiveServices: sql<number>`coalesce(count(*) filter (where ${services.isActive} = false), 0)::int`,
        paymentRequiredServices: sql<number>`coalesce(count(*) filter (where ${services.requiresPayment} = true), 0)::int`,
        totalServices: count(),
      })
      .from(services)
      .where(eq(services.businessId, businessId)),
    db
      .select({
        afterBuffer: services.afterBuffer,
        beforeBuffer: services.beforeBuffer,
        createdAt: services.createdAt,
        dailyCapacity: services.dailyCapacity,
        maximumAdvanceDays: services.maximumAdvanceDays,
        depositPercent: services.depositPercent,
        description: services.description,
        durationMinutes: services.durationMinutes,
        id: services.id,
        isActive: services.isActive,
        minimumNoticeHours: services.minimumNoticeHours,
        name: services.name,
        priceLkr: services.priceLkr,
        requiresPayment: services.requiresPayment,
      })
      .from(services)
      .where(and(...conditions))
      .orderBy(asc(services.createdAt))
      .limit(limit),
  ]);

  const serviceIds = rows.map((row) => row.id);
  const nowIso = new Date().toISOString();
  const [bookingSummary, staffSummary] = serviceIds.length
    ? await Promise.all([
        db
          .select({
            bookingCount: count(),
            futureBookingCount: sql<number>`coalesce(count(*) filter (where ${bookings.startsAt} >= ${nowIso} and ${bookings.status} in ('pending', 'confirmed')), 0)::int`,
            lastBookingAt: sql<Date | null>`max(${bookings.startsAt})`,
            serviceId: bookings.serviceId,
          })
          .from(bookings)
          .where(and(eq(bookings.businessId, businessId), inArray(bookings.serviceId, serviceIds)))
          .groupBy(bookings.serviceId),
        db
          .select({
            assignedStaffCount: count(),
            serviceId: staffServices.serviceId,
          })
          .from(staffServices)
          .innerJoin(staff, eq(staff.id, staffServices.staffId))
          .where(and(eq(staff.businessId, businessId), inArray(staffServices.serviceId, serviceIds)))
          .groupBy(staffServices.serviceId),
      ])
    : [[], []];

  const bookingSummaryByService = new Map(bookingSummary.map((row) => [row.serviceId, row]));
  const staffSummaryByService = new Map(staffSummary.map((row) => [row.serviceId, row]));
  const summary = summaryRows[0];

  return {
    filters: {
      limit,
      q: query,
      status,
    },
    rows: rows.map((row) => {
      const rowBookingSummary = bookingSummaryByService.get(row.id);
      const rowStaffSummary = staffSummaryByService.get(row.id);
      return {
        ...row,
        assignedStaffCount: Number(rowStaffSummary?.assignedStaffCount ?? 0),
        bookingCount: Number(rowBookingSummary?.bookingCount ?? 0),
        createdAt: isoDateString(row.createdAt),
        futureBookingCount: Number(rowBookingSummary?.futureBookingCount ?? 0),
        lastBookingAt: nullableIsoDateString(rowBookingSummary?.lastBookingAt),
      };
    }),
    summary: {
      activeServices: Number(summary?.activeServices ?? 0),
      averageDurationMinutes: Number(summary?.averageDurationMinutes ?? 0),
      averagePriceLkr: Number(summary?.averagePriceLkr ?? 0),
      inactiveServices: Number(summary?.inactiveServices ?? 0),
      paymentRequiredServices: Number(summary?.paymentRequiredServices ?? 0),
      totalServices: Number(summary?.totalServices ?? 0),
    },
  };
}

export async function getServiceDashboardDetail(businessId: string, serviceId: string) {
  const [service] = await db
    .select({
      afterBuffer: services.afterBuffer,
      beforeBuffer: services.beforeBuffer,
      createdAt: services.createdAt,
      dailyCapacity: services.dailyCapacity,
      maximumAdvanceDays: services.maximumAdvanceDays,
      intakeQuestions: services.intakeQuestions,
      depositPercent: services.depositPercent,
      description: services.description,
      imageUrl: services.imageUrl,
      durationMinutes: services.durationMinutes,
      id: services.id,
      isActive: services.isActive,
      minimumNoticeHours: services.minimumNoticeHours,
      name: services.name,
      priceLkr: services.priceLkr,
      requiresPayment: services.requiresPayment,
      successRedirectUrl: services.successRedirectUrl,
    })
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)))
    .limit(1);

  if (!service) return null;

  const assignedStaff = await db
    .select({
      id: staff.id,
      isActive: staff.isActive,
      name: staff.name,
      priceOverrideLkr: staffServices.priceOverrideLkr,
    })
    .from(staffServices)
    .innerJoin(staff, eq(staffServices.staffId, staff.id))
    .where(and(eq(staffServices.serviceId, serviceId), eq(staff.businessId, businessId)))
    .orderBy(asc(staff.name));

  const recentBookings = await db
    .select({
      clientName: bookings.clientName,
      id: bookings.id,
      staffName: staff.name,
      startsAt: bookings.startsAt,
      status: bookings.status,
    })
    .from(bookings)
    .innerJoin(staff, eq(bookings.staffId, staff.id))
    .where(and(eq(bookings.serviceId, serviceId), eq(bookings.businessId, businessId)))
    .orderBy(desc(bookings.startsAt))
    .limit(30);

  return {
    service: {
      ...service,
      createdAt: isoDateString(service.createdAt),
    },
    assignedStaff,
    recentBookings: recentBookings.map((booking) => ({
      ...booking,
      startsAt: isoDateString(booking.startsAt),
    })),
  };
}

export async function updateServiceDashboardFields(
  businessId: string,
  serviceId: string,
  body: ServiceDashboardUpdateInput,
): Promise<ServiceDashboardUpdateResult> {
  const [existing] = await db
    .select({ id: services.id })
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)))
    .limit(1);

  if (!existing) return { status: "not_found", error: "Not found" };

  if (body.isActive === false && !body.forceDeactivate) {
    const futureBookings = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.businessId, businessId),
          eq(bookings.serviceId, serviceId),
          gte(bookings.startsAt, new Date().toISOString()),
          inArray(bookings.status, ["pending", "confirmed"]),
        ),
      )
      .limit(1);

    if (futureBookings.length > 0) {
      return {
        status: "future_bookings",
        error:
          "This service has future bookings. Confirm deactivation to keep existing bookings but hide it from public booking.",
      };
    }
  }

  const update: Record<string, unknown> = {};
  for (const field of serviceUpdateFields) {
    if (field in body) {
      update[field] = body[field] === "" || body[field] === null ? null : body[field];
    }
  }
  if ("depositPercent" in update) {
    update.depositPercent = Math.min(100, Math.max(0, Number(update.depositPercent) || 0));
  }

  const [updated] = await db
    .update(services)
    .set(update)
    .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)))
    .returning({
      afterBuffer: services.afterBuffer,
      beforeBuffer: services.beforeBuffer,
      businessId: services.businessId,
      createdAt: services.createdAt,
      dailyCapacity: services.dailyCapacity,
      maximumAdvanceDays: services.maximumAdvanceDays,
      intakeQuestions: services.intakeQuestions,
      depositPercent: services.depositPercent,
      description: services.description,
      imageUrl: services.imageUrl,
      durationMinutes: services.durationMinutes,
      id: services.id,
      isActive: services.isActive,
      minimumNoticeHours: services.minimumNoticeHours,
      name: services.name,
      priceLkr: services.priceLkr,
      requiresPayment: services.requiresPayment,
      successRedirectUrl: services.successRedirectUrl,
    });

  if (!updated) return { status: "not_found", error: "Not found" };
  return { status: "updated", service: updated };
}
