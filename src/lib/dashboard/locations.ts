import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { bookings, locations, services, staff, staffLocations } from "@/db/schema";
import { isoDateString, nullableIsoDateString } from "@/lib/dashboard/serialization";
import { getLocationForBusiness, slugifyLocationName } from "@/lib/locations";
import { z } from "@/lib/validation";

export type DashboardLocationsList = Awaited<ReturnType<typeof getLocationsDashboardList>>;
export type DashboardLocationDetail = Awaited<ReturnType<typeof getLocationDashboardDetail>>;
export type DashboardLocationStatusFilter = "active" | "all" | "inactive";
export type DashboardLocationUpdate = z.infer<typeof locationDashboardUpdateSchema>;
export type DashboardLocationUpdateResult =
  | { status: "conflict"; error: string }
  | { status: "invalid"; error: string }
  | { status: "not_found"; error: string }
  | { status: "updated" };

export const dashboardLocationStatusFilters = ["all", "active", "inactive"] as const;

export type DashboardLocationsListOptions = {
  limit?: number;
  q?: string;
  status?: DashboardLocationStatusFilter;
};

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

const DEFAULT_LOCATION_LIMIT = 200;
const MAX_LOCATION_LIMIT = 500;

function normalizeLocationLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_LOCATION_LIMIT;
  return Math.min(MAX_LOCATION_LIMIT, Math.max(1, Math.round(limit ?? DEFAULT_LOCATION_LIMIT)));
}

export function isDashboardLocationStatusFilter(value: string): value is DashboardLocationStatusFilter {
  return dashboardLocationStatusFilters.includes(value as DashboardLocationStatusFilter);
}

export async function getLocationsDashboardList(
  businessId: string,
  options: DashboardLocationsListOptions = {},
) {
  const query = options.q?.trim().toLowerCase() ?? "";
  const status = options.status ?? "all";
  const limit = normalizeLocationLimit(options.limit);
  const conditions: SQL[] = [eq(locations.businessId, businessId)];

  if (status === "active") conditions.push(eq(locations.isActive, true));
  if (status === "inactive") conditions.push(eq(locations.isActive, false));
  if (query) {
    conditions.push(or(
      ilike(locations.name, `%${query}%`),
      ilike(locations.address, `%${query}%`),
      ilike(locations.phone, `%${query}%`),
      ilike(locations.slug, `%${query}%`),
      ilike(locations.timezone, `%${query}%`),
    )!);
  }

  const [summaryRows, rows] = await Promise.all([
    db
      .select({
        activeLocations: sql<number>`coalesce(count(*) filter (where ${locations.isActive} = true), 0)::int`,
        defaultLocations: sql<number>`coalesce(count(*) filter (where ${locations.isDefault} = true), 0)::int`,
        inactiveLocations: sql<number>`coalesce(count(*) filter (where ${locations.isActive} = false), 0)::int`,
        totalLocations: count(),
        withAddress: sql<number>`coalesce(count(*) filter (where ${locations.address} is not null), 0)::int`,
      })
      .from(locations)
      .where(eq(locations.businessId, businessId)),
    db
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
      .where(and(...conditions))
      .orderBy(asc(locations.sortOrder), asc(locations.name))
      .limit(limit),
  ]);

  const locationIds = rows.map((row) => row.id);
  const now = new Date();
  const [staffRows, bookingSummary] = locationIds.length
    ? await Promise.all([
        db
          .select({
            isPrimary: staffLocations.isPrimary,
            locationId: staffLocations.locationId,
            staffId: staffLocations.staffId,
          })
          .from(staffLocations)
          .innerJoin(staff, eq(staff.id, staffLocations.staffId))
          .where(and(eq(staff.businessId, businessId), inArray(staffLocations.locationId, locationIds))),
        db
          .select({
            bookingCount: count(),
            futureBookingCount: sql<number>`coalesce(count(*) filter (where ${bookings.startsAt} >= ${now} and ${bookings.status} in ('pending', 'confirmed')), 0)::int`,
            lastBookingAt: sql<Date | null>`max(${bookings.startsAt})`,
            locationId: bookings.locationId,
          })
          .from(bookings)
          .where(and(eq(bookings.businessId, businessId), inArray(bookings.locationId, locationIds)))
          .groupBy(bookings.locationId),
      ])
    : [[], []];

  const staffRowsByLocation = new Map<string, Array<(typeof staffRows)[number]>>();
  for (const row of staffRows) {
    if (!row.locationId) continue;
    const list = staffRowsByLocation.get(row.locationId) ?? [];
    list.push(row);
    staffRowsByLocation.set(row.locationId, list);
  }
  const bookingSummaryByLocation = new Map(bookingSummary.map((row) => [row.locationId, row]));
  const summary = summaryRows[0];

  return {
    filters: {
      limit,
      q: query,
      status,
    },
    rows: rows.map((row) => {
      const assignedStaff = staffRowsByLocation.get(row.id) ?? [];
      const rowBookingSummary = bookingSummaryByLocation.get(row.id);
      return {
        ...row,
        bookingCount: Number(rowBookingSummary?.bookingCount ?? 0),
        createdAt: isoDateString(row.createdAt),
        futureBookingCount: Number(rowBookingSummary?.futureBookingCount ?? 0),
        lastBookingAt: nullableIsoDateString(rowBookingSummary?.lastBookingAt),
        primaryStaffCount: assignedStaff.filter((assignment) => assignment.isPrimary).length,
        staffCount: assignedStaff.length,
      };
    }),
    summary: {
      activeLocations: Number(summary?.activeLocations ?? 0),
      defaultLocations: Number(summary?.defaultLocations ?? 0),
      inactiveLocations: Number(summary?.inactiveLocations ?? 0),
      totalLocations: Number(summary?.totalLocations ?? 0),
      withAddress: Number(summary?.withAddress ?? 0),
    },
  };
}

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
      createdAt: isoDateString(location.createdAt),
    },
    recentBookings: recentBookings.map((booking) => ({
      ...booking,
      startsAt: isoDateString(booking.startsAt),
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
