import { EmptyState } from "@/components/dashboard/EmptyState";
import { Megaphone } from "lucide-react";

export default function MarketingPage() {
  return (
    <EmptyState
      icon={Megaphone}
      title="No marketing assets yet"
      description="Booking page assets and share tools will appear here."
    />
  );
}
