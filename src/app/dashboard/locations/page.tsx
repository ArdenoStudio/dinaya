import { requireBusiness } from "@/lib/auth";
import { getEffectiveEntitlements, planDisplayName } from "@/lib/plan";
import { ensureBusinessHasDefaultLocation } from "@/lib/locations";
import LocationsClient from "./LocationsClient";

export default async function LocationsPage() {
  const { business } = await requireBusiness();
  await ensureBusinessHasDefaultLocation(business.id);

  const entitlements = getEffectiveEntitlements(business.plan as "free" | "pro" | "max");

  return (
    <LocationsClient
      plan={planDisplayName(business.plan as "free" | "pro" | "max")}
      locationLimit={entitlements.limits.locations}
    />
  );
}
