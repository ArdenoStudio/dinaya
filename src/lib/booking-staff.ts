import type { Staff } from "@/db/schema";

export function getEligibleStaff(
  allStaff: Staff[],
  staffServiceMap: { staffId: string; serviceId: string }[],
  serviceId: string,
  staffLocationMap?: { staffId: string; locationId: string }[],
  locationId?: string | null
): Staff[] {
  const eligibleIds = new Set(
    staffServiceMap.filter((m) => m.serviceId === serviceId).map((m) => m.staffId)
  );
  let result = allStaff.filter((s) => eligibleIds.has(s.id));

  if (locationId && staffLocationMap && staffLocationMap.length > 0) {
    const atLocation = new Set(
      staffLocationMap.filter((m) => m.locationId === locationId).map((m) => m.staffId)
    );
    // Always filter — empty set means no staff at this branch, not "show everyone"
    result = result.filter((s) => atLocation.has(s.id));
  }

  return result;
}

/** Auto-select when only one person can perform the service. */
export function pickDefaultStaff(
  allStaff: Staff[],
  staffServiceMap: { staffId: string; serviceId: string }[],
  serviceId: string,
  staffLocationMap?: { staffId: string; locationId: string }[],
  locationId?: string | null
): Staff | null {
  const eligible = getEligibleStaff(
    allStaff,
    staffServiceMap,
    serviceId,
    staffLocationMap,
    locationId
  );
  return eligible.length === 1 ? eligible[0]! : null;
}
