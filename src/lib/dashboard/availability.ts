import { and, asc, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { availability, availabilityOverrides, locations, staff, staffLocations } from "@/db/schema";
import { z } from "@/lib/validation";

export type DashboardAvailabilityOverview = Awaited<ReturnType<typeof getAvailabilityDashboardOverview>>;
export type AvailabilityWindowInput = z.infer<typeof availabilityWindowSchema>;
export type AvailabilityWindowUpdateResult =
  | { status: "invalid"; error: string }
  | { status: "not_found"; error: string }
  | { status: "updated" };
export type AvailabilityOverrideUpsertInput = z.infer<typeof availabilityOverrideUpsertSchema>;
export type AvailabilityOverrideDeleteInput = z.infer<typeof availabilityOverrideDeleteSchema>;
export type AvailabilityOverrideUpsertResult =
  | { status: "invalid"; error: string }
  | { status: "not_found"; error: string }
  | { status: "updated"; override: typeof availabilityOverrides.$inferSelect };
export type AvailabilityOverrideDeleteResult =
  | { status: "deleted" }
  | { status: "not_found"; error: string };

export const availabilityWindowSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().trim().min(1).max(8),
  endTime: z.string().trim().min(1).max(8),
});

export const availabilityWindowsUpdateSchema = z.object({
  staffId: z.uuid(),
  rows: z.array(availabilityWindowSchema).default([]),
});

export const availabilityOverrideUpsertSchema = z.object({
  date: z.string().trim().min(1).max(20),
  endTime: z.string().trim().max(8).optional().nullable(),
  isBlocked: z.boolean().default(true),
  reason: z.string().trim().max(200).optional().nullable(),
  staffId: z.uuid(),
  startTime: z.string().trim().max(8).optional().nullable(),
});

export const availabilityOverrideDeleteSchema = z.object({
  id: z.uuid(),
  staffId: z.uuid(),
});

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function validateAvailabilityRows(rows: AvailabilityWindowInput[]): string | null {
  for (const row of rows) {
    if (row.startTime >= row.endTime) {
      return "Availability contains an invalid day or time range.";
    }
  }

  for (const day of [0, 1, 2, 3, 4, 5, 6]) {
    const dayRows = rows
      .filter((row) => row.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let i = 1; i < dayRows.length; i++) {
      if (dayRows[i - 1].endTime > dayRows[i].startTime) {
        return "Availability blocks cannot overlap.";
      }
    }
  }

  return null;
}

async function verifyStaffForBusiness(businessId: string, staffId: string) {
  const [member] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.id, staffId), eq(staff.businessId, businessId)))
    .limit(1);

  return member ?? null;
}

export async function getAvailabilityDashboardOverview(businessId: string, now = new Date()) {
  const members = await db
    .select({
      avatarUrl: staff.avatarUrl,
      bio: staff.bio,
      createdAt: staff.createdAt,
      id: staff.id,
      isActive: staff.isActive,
      name: staff.name,
    })
    .from(staff)
    .where(eq(staff.businessId, businessId))
    .orderBy(asc(staff.name));

  if (members.length === 0) {
    return { members: [] };
  }

  const [weeklyWindows, upcomingOverrides, staffLocationRows] = await Promise.all([
    db
      .select({
        dayOfWeek: availability.dayOfWeek,
        endTime: availability.endTime,
        id: availability.id,
        staffId: availability.staffId,
        startTime: availability.startTime,
      })
      .from(availability)
      .innerJoin(staff, eq(staff.id, availability.staffId))
      .where(eq(staff.businessId, businessId))
      .orderBy(asc(availability.dayOfWeek), asc(availability.startTime)),
    db
      .select({
        date: availabilityOverrides.date,
        endTime: availabilityOverrides.endTime,
        id: availabilityOverrides.id,
        isBlocked: availabilityOverrides.isBlocked,
        reason: availabilityOverrides.reason,
        staffId: availabilityOverrides.staffId,
        startTime: availabilityOverrides.startTime,
      })
      .from(availabilityOverrides)
      .innerJoin(staff, eq(staff.id, availabilityOverrides.staffId))
      .where(and(eq(staff.businessId, businessId), gte(availabilityOverrides.date, dateOnly(now))))
      .orderBy(asc(availabilityOverrides.date)),
    db
      .select({
        id: locations.id,
        isActive: locations.isActive,
        isPrimary: staffLocations.isPrimary,
        name: locations.name,
        staffId: staffLocations.staffId,
        timezone: locations.timezone,
      })
      .from(staffLocations)
      .innerJoin(staff, eq(staff.id, staffLocations.staffId))
      .innerJoin(locations, eq(locations.id, staffLocations.locationId))
      .where(eq(staff.businessId, businessId))
      .orderBy(desc(staffLocations.isPrimary), asc(locations.name)),
  ]);

  return {
    members: members.map((member) => {
      const windows = weeklyWindows.filter((row) => row.staffId === member.id);
      const overrides = upcomingOverrides.filter((row) => row.staffId === member.id).slice(0, 12);
      const assignedLocations = staffLocationRows.filter((row) => row.staffId === member.id);

      return {
        assignedLocations: assignedLocations.map((location) => ({
          id: location.id,
          isActive: location.isActive,
          isPrimary: location.isPrimary,
          name: location.name,
          timezone: location.timezone,
        })),
        overrides: overrides.map((override) => ({
          date: override.date,
          endTime: override.endTime,
          id: override.id,
          isBlocked: override.isBlocked,
          reason: override.reason,
          startTime: override.startTime,
        })),
        staff: {
          ...member,
          createdAt: member.createdAt.toISOString(),
        },
        windows: windows.map((window) => ({
          dayOfWeek: window.dayOfWeek,
          endTime: window.endTime,
          id: window.id,
          startTime: window.startTime,
        })),
      };
    }),
  };
}

export async function updateAvailabilityDashboardWindows(
  businessId: string,
  staffId: string,
  rows: AvailabilityWindowInput[],
): Promise<AvailabilityWindowUpdateResult> {
  const member = await verifyStaffForBusiness(businessId, staffId);
  if (!member) return { status: "not_found", error: "Not found" };

  const validationError = validateAvailabilityRows(rows);
  if (validationError) return { status: "invalid", error: validationError };

  await db.delete(availability).where(eq(availability.staffId, staffId));

  if (rows.length) {
    await db.insert(availability).values(
      rows.map((row) => ({
        dayOfWeek: row.dayOfWeek,
        endTime: row.endTime,
        staffId,
        startTime: row.startTime,
      })),
    );
  }

  return { status: "updated" };
}

export async function listAvailabilityDashboardOverrides(businessId: string, staffId: string) {
  const member = await verifyStaffForBusiness(businessId, staffId);
  if (!member) return { status: "not_found" as const, error: "Not found" };

  const rows = await db
    .select()
    .from(availabilityOverrides)
    .where(eq(availabilityOverrides.staffId, staffId))
    .orderBy(availabilityOverrides.date);

  return { status: "ok" as const, rows };
}

export async function upsertAvailabilityDashboardOverride(
  businessId: string,
  input: AvailabilityOverrideUpsertInput,
): Promise<AvailabilityOverrideUpsertResult> {
  const member = await verifyStaffForBusiness(businessId, input.staffId);
  if (!member) return { status: "not_found", error: "Not found" };

  const startTime = input.startTime?.trim() || null;
  const endTime = input.endTime?.trim() || null;
  if (!input.isBlocked && (!startTime || !endTime || startTime >= endTime)) {
    return { status: "invalid", error: "Override hours require a valid start and end time." };
  }

  await db
    .delete(availabilityOverrides)
    .where(and(eq(availabilityOverrides.staffId, input.staffId), eq(availabilityOverrides.date, input.date)));

  const [override] = await db
    .insert(availabilityOverrides)
    .values({
      date: input.date,
      endTime: input.isBlocked ? null : endTime,
      isBlocked: input.isBlocked,
      reason: input.reason?.trim() || null,
      staffId: input.staffId,
      startTime: input.isBlocked ? null : startTime,
    })
    .returning();

  return { status: "updated", override };
}

export async function deleteAvailabilityDashboardOverride(
  businessId: string,
  input: AvailabilityOverrideDeleteInput,
): Promise<AvailabilityOverrideDeleteResult> {
  const member = await verifyStaffForBusiness(businessId, input.staffId);
  if (!member) return { status: "not_found", error: "Not found" };

  await db
    .delete(availabilityOverrides)
    .where(and(eq(availabilityOverrides.id, input.id), eq(availabilityOverrides.staffId, input.staffId)));

  return { status: "deleted" };
}
