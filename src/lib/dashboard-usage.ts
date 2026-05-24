import type { PlanLimit } from "@/lib/plan";

export type PlanUsageItem = {
  used: number;
  limit: number | null;
};

export type PlanUsage = {
  services: PlanUsageItem;
  staff: PlanUsageItem;
  locations: PlanUsageItem;
};

export function formatPlanUsage({ used, limit }: PlanUsageItem): string | null {
  if (limit === null) return null;
  return `${used}/${limit}`;
}

export function isNearPlanLimit({ used, limit }: PlanUsageItem): boolean {
  if (limit === null) return false;
  return used >= limit;
}

export function planLimitLabel(limit: PlanLimit): string {
  const labels: Record<PlanLimit, string> = {
    bookingsPerMonth: "bookings/mo",
    staff: "staff",
    services: "services",
    locations: "locations",
  };
  return labels[limit];
}
