import type { Staff } from "@/db/schema";

export function getEligibleStaff(
  allStaff: Staff[],
  staffServiceMap: { staffId: string; serviceId: string }[],
  serviceId: string
): Staff[] {
  const eligibleIds = new Set(
    staffServiceMap.filter((m) => m.serviceId === serviceId).map((m) => m.staffId)
  );
  return allStaff.filter((s) => eligibleIds.has(s.id));
}

/** Auto-select when only one person can perform the service. */
export function pickDefaultStaff(
  allStaff: Staff[],
  staffServiceMap: { staffId: string; serviceId: string }[],
  serviceId: string
): Staff | null {
  const eligible = getEligibleStaff(allStaff, staffServiceMap, serviceId);
  return eligible.length === 1 ? eligible[0]! : null;
}
