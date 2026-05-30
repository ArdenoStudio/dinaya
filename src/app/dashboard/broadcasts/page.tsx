import { requireOwner } from "@/lib/auth";
import { ProGate } from "@/components/ProGate";
import { BroadcastsClient } from "@/components/dashboard/BroadcastsClient";

export default async function BroadcastsPage() {
  const { businessId } = await requireOwner();

  return (
    <ProGate businessId={businessId} feature="broadcasts">
      <BroadcastsClient />
    </ProGate>
  );
}
