import { EmptyState } from "@/components/dashboard/EmptyState";
import { ProGate } from "@/lib/plan";
import { requireBusiness } from "@/lib/auth";
import { BarChart3 } from "lucide-react";

export default async function ReportsPage() {
  const { businessId } = await requireBusiness();

  return (
    <ProGate businessId={businessId} feature="reports">
      <EmptyState
        icon={BarChart3}
        title="Reports are empty"
        description="Metrics will appear after bookings, clients, payments, and reviews create enough activity."
      />
    </ProGate>
  );
}
