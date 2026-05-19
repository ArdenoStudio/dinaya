import { EmptyState } from "@/components/dashboard/EmptyState";
import { ProGate } from "@/lib/plan";
import { requireBusiness } from "@/lib/auth";
import { CreditCard } from "lucide-react";

export default async function PaymentsPage() {
  const { businessId } = await requireBusiness();

  return (
    <ProGate businessId={businessId} feature="payments">
      <EmptyState
        icon={CreditCard}
        title="No payments yet"
        description="Payment records will appear here once online payments are connected."
      />
    </ProGate>
  );
}
