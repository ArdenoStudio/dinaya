import { requireOwner } from "@/lib/auth";
import { getEffectiveEntitlements, planDisplayName } from "@/lib/plan";
import { ensureBusinessHasDefaultLocation } from "@/lib/locations";
import LocationsClient from "./LocationsClient";

export default async function LocationsPage() {
  const { business } = await requireOwner();
  await ensureBusinessHasDefaultLocation(business.id);

  const entitlements = getEffectiveEntitlements(business.plan);

  return (
    <LocationsClient
      plan={planDisplayName(business.plan)}
      locationLimit={entitlements.limits.locations}
    />
  );
}
