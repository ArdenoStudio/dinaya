import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { availability, bookings, locations, services, staff, staffLocations, staffServices } from "@/db/schema";
import { replaceStaffLocations } from "@/lib/locations";
import { isPublicHttpsUrl } from "@/lib/public-url";
import { z } from "@/lib/validation";

export type DashboardStaffList = Awaited<ReturnType<typeof getStaffDashboardList>>;
export type DashboardStaffDetail = Awaited<ReturnType<typeof getStaffDashboardDetail>>;
export type DashboardStaffStatusFilter = "active" | "all" | "inactive";
export type DashboardStaffUpdate = z.infer<typeof staffDashboardUpdateSchema>;
export type DashboardStaffUpdateResult =
  | { status: "invalid"; error: string }
  | { status: "not_found"; error: string }
  | { status: "updated" };

export const dashboardStaffStatusFilters = ["all", "active", "inactive"] as const;

export type DashboardStaffListOptions = {
  limit?: number;
  q?: string;
  status?: DashboardStaffStatusFilter;
};

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

const DEFAULT_STAFF_LIMIT = 200;
const MAX_STAFF_LIMIT = 500;
const SCHEMA_DRIFT_ERROR_CODES = new Set(["42703", "42P01", "42704"]);

type NormalizedStaffListOptions = {
  limit: number;
  query: string;
  status: DashboardStaffStatusFilter;
};

function normalizeStaffLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_STAFF_LIMIT;
  return Math.min(MAX_STAFF_LIMIT, Math.max(1, Math.round(limit ?? DEFAULT_STAFF_LIMIT)));
}

function normalizeStaffListOptions(options: DashboardStaffListOptions): NormalizedStaffListOptions {
  return {
    limit: normalizeStaffLimit(options.limit),
    query: options.q?.trim().toLowerCase() ?? "",
    status: options.status ?? "all",
  };
}

function isSchemaDriftError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { cause?: unknown; code?: unknown; message?: unknown };
  if (typeof candidate.code === "string" && SCHEMA_DRIFT_ERROR_CODES.has(candidate.code)) {
    return true;
  }
  if (typeof candidate.message === "string") {
    const message = candidate.message.toLowerCase();
    if (
      (message.includes("column") && message.includes("does not exist")) ||
      (message.includes("relation") && message.includes("does not exist")) ||
      message.includes("undefined column") ||
      message.includes("undefined table")
    ) {
      return true;
    }
  }
  return isSchemaDriftError(candidate.cause);
}

export function isDashboardStaffStatusFilter(value: string): value is DashboardStaffStatusFilter {
  return dashboardStaffStatusFilters.includes(value as DashboardStaffStatusFilter);
}

export async function getStaffDashboardList(
  businessId: string,
  options: DashboardStaffListOptions = {},
) {
  const normalizedOptions = normalizeStaffListOptions(options);

  try {
    return await getStaffDashboardListStrict(businessId, normalizedOptions);
  } catch (error) {
    if (!isSchemaDriftError(error)) throw error;
    console.error("[dashboard-staff] Falling back to basic staff list because the database schema is behind.", {
      businessId,
      error,
    });
    return getStaffDashboardListBasic(businessId, normalizedOptions);
  }
}

async function getStaffDashboardListBasic(
  businessId: string,
  { limit, query, status }: NormalizedStaffListOptions,
) {
  const conditions: SQL[] = [eq(staff.businessId, businessId)];

  if (status === "active") conditions.push(eq(staff.isActive, true));
  if (status === "inactive") conditions.push(eq(staff.isActive, false));
  if (query) conditions.push(ilike(staff.name, `%${query}%`));

  const [summaryRows, rows] = await Promise.all([
    db
      .select({
        activeStaff: sql<number>`coalesce(count(*) filter (where ${staff.isActive} = true), 0)::int`,
        inactiveStaff: sql<number>`coalesce(count(*) filter (where ${staff.isActive} = false), 0)::int`,
        totalStaff: count(),
      })
      .from(staff)
      .where(eq(staff.businessId, businessId)),
    db
      .select({
        createdAt: staff.createdAt,
        id: staff.id,
        isActive: staff.isActive,
        name: staff.name,
      })
      .from(staff)
      .where(and(...conditions))
      .orderBy(asc(staff.name))
      .limit(limit),
  ]);
  const summary = summaryRows[0];

  return {
    filters: {
      limit,
      q: query,
      status,
    },
    rows: rows.map((row) => ({
      avatarUrl: null,
      bio: null,
      ...row,
      assignedLocationsCount: 0,
      assignedServicesCount: 0,
      availabilityWindowCount: 0,
      createdAt: row.createdAt.toISOString(),
      futureBookingCount: 0,
      lastBookingAt: null,
      locationIds: [],
      primaryLocationName: null,
      todayBookingCount: 0,
    })),
    summary: {
      activeStaff: Number(summary?.activeStaff ?? 0),
      inactiveStaff: Number(summary?.inactiveStaff ?? 0),
      totalStaff: Number(summary?.totalStaff ?? 0),
      withBio: 0,
    },
  };
}

async function getStaffDashboardListStrict(
  businessId: string,
  { limit, query, status }: NormalizedStaffListOptions,
) {
  const conditions: SQL[] = [eq(staff.businessId, businessId)];

  if (status === "active") conditions.push(eq(staff.isActive, true));
  if (status === "inactive") conditions.push(eq(staff.isActive, false));
  if (query) {
    conditions.push(or(
      ilike(staff.name, `%${query}%`),
      ilike(staff.bio, `%${query}%`),
    )!);
  }

  const [summaryRows, rows] = await Promise.all([
    db
      .select({
        activeStaff: sql<number>`coalesce(count(*) filter (where ${staff.isActive} = true), 0)::int`,
        inactiveStaff: sql<number>`coalesce(count(*) filter (where ${staff.isActive} = false), 0)::int`,
        totalStaff: count(),
        withBio: sql<number>`coalesce(count(*) filter (where ${staff.bio} is not null), 0)::int`,
      })
      .from(staff)
      .where(eq(staff.businessId, businessId)),
    db
      .select({
        avatarUrl: staff.avatarUrl,
        bio: staff.bio,
        createdAt: staff.createdAt,
        id: staff.id,
        isActive: staff.isActive,
        name: staff.name,
      })
      .from(staff)
      .where(and(...conditions))
      .orderBy(asc(staff.name))
      .limit(limit),
  ]);

  const staffIds = rows.map((row) => row.id);
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const nowIso = now.toISOString();
  const todayStartIso = todayStart.toISOString();
  const todayEndIso = todayEnd.toISOString();

  const [serviceSummary, locationRows, availabilitySummary, bookingSummary] = staffIds.length
    ? await Promise.all([
        db
          .select({
            assignedServicesCount: count(),
            staffId: staffServices.staffId,
          })
          .from(staffServices)
          .innerJoin(services, eq(services.id, staffServices.serviceId))
          .where(and(eq(services.businessId, businessId), inArray(staffServices.staffId, staffIds)))
          .groupBy(staffServices.staffId),
        db
          .select({
            isActive: locations.isActive,
            isPrimary: staffLocations.isPrimary,
            locationId: staffLocations.locationId,
            locationName: locations.name,
            staffId: staffLocations.staffId,
          })
          .from(staffLocations)
          .innerJoin(locations, eq(locations.id, staffLocations.locationId))
          .where(and(eq(locations.businessId, businessId), inArray(staffLocations.staffId, staffIds)))
          .orderBy(desc(staffLocations.isPrimary), asc(locations.name)),
        db
          .select({
            availabilityWindowCount: count(),
            staffId: availability.staffId,
          })
          .from(availability)
          .where(inArray(availability.staffId, staffIds))
          .groupBy(availability.staffId),
        db
          .select({
            futureBookingCount: sql<number>`coalesce(count(*) filter (where ${bookings.startsAt} >= ${nowIso} and ${bookings.status} in ('pending', 'confirmed')), 0)::int`,
            lastBookingAt: sql<Date | null>`max(${bookings.startsAt})`,
            staffId: bookings.staffId,
            todayBookingCount: sql<number>`coalesce(count(*) filter (where ${bookings.startsAt} >= ${todayStartIso} and ${bookings.startsAt} < ${todayEndIso}), 0)::int`,
          })
          .from(bookings)
          .where(and(eq(bookings.businessId, businessId), inArray(bookings.staffId, staffIds)))
          .groupBy(bookings.staffId),
      ])
    : [[], [], [], []];

  const serviceSummaryByStaff = new Map(serviceSummary.map((row) => [row.staffId, row]));
  const availabilitySummaryByStaff = new Map(availabilitySummary.map((row) => [row.staffId, row]));
  const bookingSummaryByStaff = new Map(bookingSummary.map((row) => [row.staffId, row]));
  const locationRowsByStaff = new Map<string, typeof locationRows>();
  for (const row of locationRows) {
    const list = locationRowsByStaff.get(row.staffId) ?? [];
    list.push(row);
    locationRowsByStaff.set(row.staffId, list);
  }
  const summary = summaryRows[0];

  return {
    filters: {
      limit,
      q: query,
      status,
    },
    rows: rows.map((row) => {
      const rowBookingSummary = bookingSummaryByStaff.get(row.id);
      const rowLocationRows = locationRowsByStaff.get(row.id) ?? [];
      return {
        ...row,
        assignedLocationsCount: rowLocationRows.length,
        assignedServicesCount: Number(serviceSummaryByStaff.get(row.id)?.assignedServicesCount ?? 0),
        availabilityWindowCount: Number(availabilitySummaryByStaff.get(row.id)?.availabilityWindowCount ?? 0),
        createdAt: row.createdAt.toISOString(),
        futureBookingCount: Number(rowBookingSummary?.futureBookingCount ?? 0),
        lastBookingAt: rowBookingSummary?.lastBookingAt != null ? new Date(rowBookingSummary.lastBookingAt as Date | string).toISOString() : null,
        locationIds: rowLocationRows.map((location) => location.locationId),
        primaryLocationName: rowLocationRows.find((location) => location.isPrimary)?.locationName ?? rowLocationRows[0]?.locationName ?? null,
        todayBookingCount: Number(rowBookingSummary?.todayBookingCount ?? 0),
      };
    }),
    summary: {
      activeStaff: Number(summary?.activeStaff ?? 0),
      inactiveStaff: Number(summary?.inactiveStaff ?? 0),
      totalStaff: Number(summary?.totalStaff ?? 0),
      withBio: Number(summary?.withBio ?? 0),
    },
  };
}

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
