import Link from "next/link";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Plug } from "lucide-react";

export default function IntegrationsPage() {
  return (
    <EmptyState
      icon={Plug}
      title="Integrations"
      description="Connected payment, calendar, messaging, webhook, and API services will appear here."
      action={
        <Link
          href="/dashboard/settings/webhooks"
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Open webhooks
        </Link>
      }
    />
  );
}
