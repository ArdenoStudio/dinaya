import { requireOwner } from "@/lib/auth";
import { ProGate } from "@/lib/plan";
import { WebhooksClient } from "@/components/dashboard/WebhooksClient";

export default async function WebhooksPage() {
  const { businessId } = await requireOwner();

  return (
    <ProGate businessId={businessId} feature="webhooks">
      <WebhooksClient />
    </ProGate>
  );
}
