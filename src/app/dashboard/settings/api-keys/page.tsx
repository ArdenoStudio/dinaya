import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { ApiKeysClient } from "@/components/dashboard/ApiKeysClient";

export default async function ApiKeysPage() {
  await requireOwner();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/settings/integrations" className="text-sm text-primary hover:underline">
          ← Integrations
        </Link>
        <h1 className="mt-2 font-cal text-2xl">API keys</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create scoped keys for custom integrations. Send keys as{" "}
          <code className="rounded bg-muted px-1">Authorization: Bearer dinaya_…</code>
        </p>
      </div>
      <ApiKeysClient />
    </div>
  );
}
