import { requireOwner } from "@/lib/auth";
import { ApiKeysClient } from "@/components/dashboard/ApiKeysClient";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";

export default async function ApiKeysPage() {
  await requireOwner();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="API keys"
        description={
          <>
            Create scoped keys for custom integrations. Send keys as{" "}
            <code className="rounded bg-muted px-1">Authorization: Bearer dinaya_…</code>
          </>
        }
        backHref="/dashboard/settings/integrations"
        backLabel="Integrations"
      />
      <ApiKeysClient />
    </div>
  );
}
