import { ProGate } from "@/components/ProGate";
import { requireBusiness } from "@/lib/auth";
import AiHubClient from "./AiHubClient";

export default async function AiHubPage() {
  const { businessId } = await requireBusiness();

  return (
    <ProGate businessId={businessId} feature="aiBookingAutopilot">
      <AiHubClient />
    </ProGate>
  );
}
