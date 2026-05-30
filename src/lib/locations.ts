import { db } from "@/db";
import { locations, staffLocations, staff, businesses } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import type { Plan } from "@/lib/plan";
import { getEntitlements, requirePlanLimit } from "@/lib/plan";

export type LocationRow = typeof locations.$inferSelect;

export type LocationAiConfig = {
  aiBookingAutopilot?: boolean;
  smartReminderSystem?: boolean;
  reviewEngine?: boolean;
  clientReactivationCampaign?: boolean;
  aiUpsellAssistant?: boolean;
  aiContentMachine?: boolean;
  vipLoyaltySequence?: boolean;
  aiDealSuggestions?: boolean;
};

export function slugifyLocationName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export async function listActiveLocations(businessId: string): Promise<LocationRow[]> {
  return db
    .select()
    .from(locations)
    .where(and(eq(locations.businessId, businessId), eq(locations.isActive, true)))
    .orderBy(asc(locations.sortOrder), asc(locations.name));
}

export async function listAllLocations(businessId: string): Promise<LocationRow[]> {
  return db
    .select()
    .from(locations)
    .where(eq(locations.businessId, businessId))
    .orderBy(asc(locations.sortOrder), asc(locations.name));
}

export async function getDefaultLocation(businessId: string): Promise<LocationRow | null> {
  const [row] = await db
    .select()
    .from(locations)
    .where(and(eq(locations.businessId, businessId), eq(locations.isDefault, true)))
    .limit(1);
  return row ?? null;
}

export async function getLocationForBusiness(
  businessId: string,
  locationId: string
): Promise<LocationRow | null> {
  const [row] = await db
    .select()
    .from(locations)
    .where(and(eq(locations.id, locationId), eq(locations.businessId, businessId)))
    .limit(1);
  return row ?? null;
}

export async function countLocations(businessId: string): Promise<number> {
  const rows = await db
    .select({ id: locations.id })
    .from(locations)
    .where(eq(locations.businessId, businessId));
  return rows.length;
}

export function canAddLocation(plan: Plan, currentCount: number): boolean {
  const max = getEntitlements(plan).limits.locations;
  return max === null || currentCount < max;
}

export async function requireCanAddLocation(businessId: string): Promise<void> {
  const count = await countLocations(businessId);
  await requirePlanLimit(businessId, "locations", count);
}

export async function createDefaultLocationForBusiness(
  businessId: string,
  opts: { name: string; address?: string | null; phone?: string | null; timezone?: string }
): Promise<LocationRow> {
  const [row] = await db
    .insert(locations)
    .values({
      businessId,
      name: opts.name,
      slug: "main",
      address: opts.address ?? null,
      phone: opts.phone ?? null,
      timezone: opts.timezone ?? "Asia/Colombo",
      isDefault: true,
      isActive: true,
      sortOrder: 0,
    })
    .returning();
  return row!;
}

export async function assignStaffToLocation(
  staffId: string,
  locationId: string,
  isPrimary = false
): Promise<void> {
  await db
    .insert(staffLocations)
    .values({ staffId, locationId, isPrimary })
    .onConflictDoNothing({ target: [staffLocations.staffId, staffLocations.locationId] });
}

export async function replaceStaffLocations(
  staffId: string,
  locationIds: string[],
  primaryLocationId?: string
): Promise<void> {
  await db.delete(staffLocations).where(eq(staffLocations.staffId, staffId));
  if (locationIds.length === 0) return;
  await db.insert(staffLocations).values(
    locationIds.map((locationId) => ({
      staffId,
      locationId,
      isPrimary: locationId === (primaryLocationId ?? locationIds[0]),
    }))
  );
}

export async function getStaffLocationMap(businessId: string) {
  const rows = await db
    .select({
      staffId: staffLocations.staffId,
      locationId: staffLocations.locationId,
      isPrimary: staffLocations.isPrimary,
    })
    .from(staffLocations)
    .innerJoin(staff, eq(staff.id, staffLocations.staffId))
    .where(eq(staff.businessId, businessId));
  return rows;
}

export async function getStaffIdsAtLocation(locationId: string): Promise<string[]> {
  const rows = await db
    .select({ staffId: staffLocations.staffId })
    .from(staffLocations)
    .where(eq(staffLocations.locationId, locationId));
  return rows.map((r) => r.staffId);
}

export async function resolveBookingLocationId(
  businessId: string,
  locationId: string | null | undefined
): Promise<string> {
  const active = await listActiveLocations(businessId);
  if (active.length === 0) {
    throw new Error("No locations configured for this business.");
  }
  if (active.length === 1) {
    return active[0]!.id;
  }
  if (!locationId) {
    throw new Error("Please select a branch for this booking.");
  }
  const match = active.find((l) => l.id === locationId);
  if (!match) {
    throw new Error("Invalid branch selected.");
  }
  return match.id;
}

export async function syncBusinessPrimaryLocation(
  businessId: string,
  patch: { name?: string; address?: string | null; phone?: string | null; timezone?: string }
): Promise<void> {
  const def = await getDefaultLocation(businessId);
  if (!def) return;
  await db
    .update(locations)
    .set({
      name: patch.name ?? def.name,
      address: patch.address !== undefined ? patch.address : def.address,
      phone: patch.phone !== undefined ? patch.phone : def.phone,
      timezone: patch.timezone ?? def.timezone,
    })
    .where(eq(locations.id, def.id));
}

export async function ensureBusinessHasDefaultLocation(businessId: string): Promise<LocationRow> {
  const existing = await getDefaultLocation(businessId);
  if (existing) return existing;

  const [business] = await db
    .select({
      name: businesses.name,
      address: businesses.address,
      phone: businesses.phone,
      timezone: businesses.timezone,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) throw new Error("Business not found.");
  return createDefaultLocationForBusiness(businessId, business);
}

export function parseLocationAiConfig(raw: unknown): LocationAiConfig {
  if (!raw || typeof raw !== "object") return {};
  return raw as LocationAiConfig;
}

export async function updateLocationAiConfig(
  businessId: string,
  locationId: string,
  patch: Partial<LocationAiConfig>
): Promise<LocationAiConfig> {
  const loc = await getLocationForBusiness(businessId, locationId);
  if (!loc) throw new Error("Location not found.");

  const current = parseLocationAiConfig(loc.aiConfig);
  const next = { ...current, ...patch };
  await db
    .update(locations)
    .set({ aiConfig: next })
    .where(eq(locations.id, locationId));
  return next;
}

export function staffAtLocation<T extends { id: string }>(
  allStaff: T[],
  staffLocationMap: { staffId: string; locationId: string }[],
  locationId: string
): T[] {
  const ids = new Set(
    staffLocationMap.filter((m) => m.locationId === locationId).map((m) => m.staffId)
  );
  if (ids.size === 0) return allStaff;
  return allStaff.filter((s) => ids.has(s.id));
}
