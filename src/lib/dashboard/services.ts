import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { bookings, services, staff, staffServices } from "@/db/schema";
import type { serviceUpdateSchema } from "@/lib/schemas/services";
import type { z } from "@/lib/validation";

export type DashboardServiceDetail = Awaited<ReturnType<typeof getServiceDashboardDetail>>;
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
  depositPercent: number;
  description: string | null;
  durationMinutes: number;
  id: string;
  isActive: boolean;
  minimumNoticeHours: number;
  name: string;
  priceLkr: number;
  requiresPayment: boolean;
};

const serviceUpdateFields = [
  "name",
  "description",
  "durationMinutes",
  "priceLkr",
  "depositPercent",
  "requiresPayment",
  "isActive",
  "beforeBuffer",
  "afterBuffer",
  "minimumNoticeHours",
  "dailyCapacity",
] as const;

export async function getServiceDashboardDetail(businessId: string, serviceId: string) {
  const [service] = await db
    .select({
      afterBuffer: services.afterBuffer,
      beforeBuffer: services.beforeBuffer,
      createdAt: services.createdAt,
      dailyCapacity: services.dailyCapacity,
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
      createdAt: service.createdAt.toISOString(),
    },
    assignedStaff,
    recentBookings: recentBookings.map((booking) => ({
      ...booking,
      startsAt: booking.startsAt.toISOString(),
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
          gte(bookings.startsAt, new Date()),
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
      depositPercent: services.depositPercent,
      description: services.description,
      durationMinutes: services.durationMinutes,
      id: services.id,
      isActive: services.isActive,
      minimumNoticeHours: services.minimumNoticeHours,
      name: services.name,
      priceLkr: services.priceLkr,
      requiresPayment: services.requiresPayment,
    });

  if (!updated) return { status: "not_found", error: "Not found" };
  return { status: "updated", service: updated };
}
