import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { availability, bookings, locations, services, staff, staffLocations, staffServices } from "@/db/schema";
import { replaceStaffLocations } from "@/lib/locations";
import { isPublicHttpsUrl } from "@/lib/public-url";
import { z } from "@/lib/validation";

export type DashboardStaffDetail = Awaited<ReturnType<typeof getStaffDashboardDetail>>;
export type DashboardStaffUpdate = z.infer<typeof staffDashboardUpdateSchema>;
export type DashboardStaffUpdateResult =
  | { status: "invalid"; error: string }
  | { status: "not_found"; error: string }
  | { status: "updated" };

export const staffDashboardUpdateSchema = z.object({
  avatarUrl: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .nullable()
    .refine((value) => !value || value === "" || isPublicHttpsUrl(value), {
      message: "Avatar URL must be a public HTTPS link.",
    }),
  bio: z.string().trim().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
  locationIds: z.array(z.uuid()).optional(),
  name: z.string().trim().min(1, "Name is required.").max(100).optional(),
  serviceIds: z.array(z.uuid()).optional(),
});

export async function getStaffDashboardDetail(businessId: string, staffId: string) {
  const [member] = await db
    .select({
      avatarUrl: staff.avatarUrl,
      bio: staff.bio,
      createdAt: staff.createdAt,
      id: staff.id,
      isActive: staff.isActive,
      name: staff.name,
    })
    .from(staff)
    .where(and(eq(staff.id, staffId), eq(staff.businessId, businessId)))
    .limit(1);

  if (!member) return null;

  const [
    assignedServices,
    assignedLocations,
    weeklyAvailability,
    recentBookings,
    availableServices,
    availableLocations,
  ] = await Promise.all([
    db
      .select({
        durationMinutes: services.durationMinutes,
        id: services.id,
        isActive: services.isActive,
        name: services.name,
        priceLkr: services.priceLkr,
        priceOverrideLkr: staffServices.priceOverrideLkr,
      })
      .from(staffServices)
      .innerJoin(services, eq(services.id, staffServices.serviceId))
      .where(and(eq(staffServices.staffId, staffId), eq(services.businessId, businessId)))
      .orderBy(asc(services.name)),
    db
      .select({
        id: locations.id,
        isActive: locations.isActive,
        isPrimary: staffLocations.isPrimary,
        name: locations.name,
        timezone: locations.timezone,
      })
      .from(staffLocations)
      .innerJoin(locations, eq(locations.id, staffLocations.locationId))
      .where(and(eq(staffLocations.staffId, staffId), eq(locations.businessId, businessId)))
      .orderBy(desc(staffLocations.isPrimary), asc(locations.name)),
    db
      .select({
        dayOfWeek: availability.dayOfWeek,
        endTime: availability.endTime,
        id: availability.id,
        startTime: availability.startTime,
      })
      .from(availability)
      .where(eq(availability.staffId, staffId))
      .orderBy(asc(availability.dayOfWeek), asc(availability.startTime)),
    db
      .select({
        clientName: bookings.clientName,
        id: bookings.id,
        serviceName: services.name,
        startsAt: bookings.startsAt,
        status: bookings.status,
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(and(eq(bookings.staffId, staffId), eq(bookings.businessId, businessId)))
      .orderBy(desc(bookings.startsAt))
      .limit(30),
    db
      .select({
        durationMinutes: services.durationMinutes,
        id: services.id,
        isActive: services.isActive,
        name: services.name,
        priceLkr: services.priceLkr,
      })
      .from(services)
      .where(eq(services.businessId, businessId))
      .orderBy(asc(services.name)),
    db
      .select({
        id: locations.id,
        isActive: locations.isActive,
        name: locations.name,
        timezone: locations.timezone,
      })
      .from(locations)
      .where(eq(locations.businessId, businessId))
      .orderBy(desc(locations.isDefault), asc(locations.sortOrder), asc(locations.name)),
  ]);

  return {
    assignedLocations,
    assignedServices,
    availability: weeklyAvailability,
    availableLocations,
    availableServices,
    recentBookings: recentBookings.map((booking) => ({
      ...booking,
      startsAt: booking.startsAt.toISOString(),
    })),
    staff: {
      ...member,
      createdAt: member.createdAt.toISOString(),
    },
  };
}

export async function updateStaffDashboardFields(
  businessId: string,
  staffId: string,
  patch: DashboardStaffUpdate,
): Promise<DashboardStaffUpdateResult> {
  const [existing] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.id, staffId), eq(staff.businessId, businessId)))
    .limit(1);

  if (!existing) return { status: "not_found", error: "Not found." };

  const serviceIds = patch.serviceIds ? [...new Set(patch.serviceIds)] : undefined;
  const locationIds = patch.locationIds ? [...new Set(patch.locationIds)] : undefined;

  if (serviceIds) {
    const validServices = serviceIds.length
      ? await db
          .select({ id: services.id })
          .from(services)
          .where(eq(services.businessId, businessId))
      : [];
    const validServiceIds = new Set(validServices.map((service) => service.id));
    if (serviceIds.some((serviceId) => !validServiceIds.has(serviceId))) {
      return { status: "invalid", error: "One or more services are invalid." };
    }
  }

  if (locationIds) {
    if (locationIds.length === 0) {
      return { status: "invalid", error: "At least one active location must be assigned to this staff member." };
    }

    const validLocations = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.businessId, businessId), eq(locations.isActive, true)));
    const validLocationIds = new Set(validLocations.map((location) => location.id));
    if (locationIds.some((locationId) => !validLocationIds.has(locationId))) {
      return { status: "invalid", error: "One or more locations are invalid or inactive." };
    }
  }

  const update: Partial<typeof staff.$inferInsert> = {};
  if (patch.avatarUrl !== undefined) update.avatarUrl = patch.avatarUrl || null;
  if (patch.bio !== undefined) update.bio = patch.bio || null;
  if (patch.isActive !== undefined) update.isActive = patch.isActive;
  if (patch.name !== undefined) update.name = patch.name;

  if (Object.keys(update).length > 0) {
    await db.update(staff).set(update).where(eq(staff.id, staffId));
  }

  if (serviceIds) {
    await db.delete(staffServices).where(eq(staffServices.staffId, staffId));
    if (serviceIds.length > 0) {
      await db.insert(staffServices).values(serviceIds.map((serviceId) => ({ staffId, serviceId })));
    }
  }

  if (locationIds) {
    await replaceStaffLocations(staffId, locationIds);
  }

  return { status: "updated" };
}
