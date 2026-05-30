import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, locations, services, staff, staffLocations } from "@/db/schema";
import { getLocationForBusiness, slugifyLocationName } from "@/lib/locations";
import { z } from "@/lib/validation";

export type DashboardLocationDetail = Awaited<ReturnType<typeof getLocationDashboardDetail>>;
export type DashboardLocationUpdate = z.infer<typeof locationDashboardUpdateSchema>;
export type DashboardLocationUpdateResult =
  | { status: "conflict"; error: string }
  | { status: "invalid"; error: string }
  | { status: "not_found"; error: string }
  | { status: "updated" };

export const locationDashboardUpdateSchema = z.object({
  address: z.string().trim().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(20).optional().nullable(),
  slug: z.string().trim().max(50).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
});

export async function getLocationDashboardDetail(businessId: string, locationId: string) {
  const [location] = await db
    .select({
      address: locations.address,
      createdAt: locations.createdAt,
      id: locations.id,
      isActive: locations.isActive,
      isDefault: locations.isDefault,
      name: locations.name,
      phone: locations.phone,
      slug: locations.slug,
      sortOrder: locations.sortOrder,
      timezone: locations.timezone,
    })
    .from(locations)
    .where(and(eq(locations.id, locationId), eq(locations.businessId, businessId)))
    .limit(1);

  if (!location) return null;

  const [assignedStaff, recentBookings] = await Promise.all([
    db
      .select({
        id: staff.id,
        isActive: staff.isActive,
        isPrimary: staffLocations.isPrimary,
        name: staff.name,
      })
      .from(staffLocations)
      .innerJoin(staff, eq(staff.id, staffLocations.staffId))
      .where(and(eq(staffLocations.locationId, locationId), eq(staff.businessId, businessId)))
      .orderBy(desc(staffLocations.isPrimary), asc(staff.name)),
    db
      .select({
        clientName: bookings.clientName,
        id: bookings.id,
        serviceName: services.name,
        staffName: staff.name,
        startsAt: bookings.startsAt,
        status: bookings.status,
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(staff, eq(bookings.staffId, staff.id))
      .where(and(eq(bookings.locationId, locationId), eq(bookings.businessId, businessId)))
      .orderBy(desc(bookings.startsAt))
      .limit(30),
  ]);

  return {
    assignedStaff,
    location: {
      ...location,
      createdAt: location.createdAt.toISOString(),
    },
    recentBookings: recentBookings.map((booking) => ({
      ...booking,
      startsAt: booking.startsAt.toISOString(),
    })),
  };
}

export async function updateLocationDashboardFields(
  businessId: string,
  locationId: string,
  patch: DashboardLocationUpdate,
): Promise<DashboardLocationUpdateResult> {
  const existing = await getLocationForBusiness(businessId, locationId);
  if (!existing) return { status: "not_found", error: "Not found." };

  const update: Partial<typeof locations.$inferInsert> = {};

  if (patch.address !== undefined) update.address = patch.address || null;
  if (patch.isActive !== undefined) update.isActive = patch.isActive;
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.phone !== undefined) update.phone = patch.phone || null;
  if (patch.sortOrder !== undefined) update.sortOrder = patch.sortOrder;
  if (patch.timezone !== undefined) update.timezone = patch.timezone;

  if (patch.slug !== undefined) {
    const slug = patch.slug?.trim() || slugifyLocationName(patch.name ?? existing.name);
    if (slug) {
      const [conflict] = await db
        .select({ id: locations.id })
        .from(locations)
        .where(and(eq(locations.businessId, businessId), eq(locations.slug, slug)))
        .limit(1);
      if (conflict && conflict.id !== locationId) {
        return { status: "conflict", error: "That branch slug is already in use." };
      }
      update.slug = slug;
    }
  }

  if (patch.isDefault === true) {
    await db
      .update(locations)
      .set({ isDefault: false })
      .where(eq(locations.businessId, businessId));
    update.isDefault = true;
  }

  if (Object.keys(update).length > 0) {
    await db.update(locations).set(update).where(eq(locations.id, locationId));
  }

  return { status: "updated" };
}
