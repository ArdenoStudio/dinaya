import { EmptyState } from "@/components/dashboard/EmptyState";
import { ProGate } from "@/lib/plan";
import { requireBusiness } from "@/lib/auth";
import { Bot } from "lucide-react";

export default async function AutomationsPage() {
  const { businessId } = await requireBusiness();

  return (
    <ProGate businessId={businessId} feature="automations">
      <EmptyState
        icon={Bot}
        title="No automations yet"
        description="Active reminder and follow-up rules will appear here."
      />
    </ProGate>
  );
}
