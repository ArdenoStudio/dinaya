import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses, webhookDeliveries, webhooks } from "@/db/schema";
import { safeAdminQuery } from "@/lib/admin-db";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { WebhooksAdminClient } from "./WebhooksAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminWebhooksPage() {
  await requirePlatformAdmin();

  const rows = await safeAdminQuery(
    db
      .select({
        id: webhookDeliveries.id,
        event: webhookDeliveries.event,
        status: webhookDeliveries.status,
        attempts: webhookDeliveries.attempts,
        error: webhookDeliveries.error,
        createdAt: webhookDeliveries.createdAt,
        webhookUrl: webhooks.url,
        businessName: businesses.name,
      })
      .from(webhookDeliveries)
      .innerJoin(webhooks, eq(webhookDeliveries.webhookId, webhooks.id))
      .innerJoin(businesses, eq(webhooks.businessId, businesses.id))
      .where(eq(webhookDeliveries.status, "failed"))
      .orderBy(desc(webhookDeliveries.createdAt))
      .limit(100),
    [] as {
      id: string;
      event: string;
      status: string;
      attempts: number;
      error: string | null;
      createdAt: Date;
      webhookUrl: string;
      businessName: string;
    }[],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cal text-3xl tracking-tight">Webhook deliveries</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Failed outbound webhook deliveries across all businesses. Replay is logged in the security audit.
        </p>
      </div>
      <WebhooksAdminClient
        deliveries={rows.map((row) => ({
          ...row,
          createdAt: row.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
