import Link from "next/link";
import { db } from "@/db";
import { businesses, webhooks } from "@/db/schema";
import { requireBusiness } from "@/lib/auth";
import { count, eq } from "drizzle-orm";

export default async function IntegrationsPage() {
  const { businessId } = await requireBusiness();
  const [[business], [{ webhookCount }]] = await Promise.all([
    db
      .select({
        payhereEnabled: businesses.payhereEnabled,
        payhereMerchantId: businesses.payhereMerchantId,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1),
    db.select({ webhookCount: count() }).from(webhooks).where(eq(webhooks.businessId, businessId)),
  ]);

  const integrations = [
    {
      name: "PayHere",
      description: "Accept LKR deposits and full payments from clients.",
      status: business?.payhereEnabled && business.payhereMerchantId ? "Connected" : "Not connected",
      href: "/dashboard/settings",
      action: "Configure",
    },
    {
      name: "Webhooks",
      description: "Send booking events to your own systems or Zapier-style workflows.",
      status: Number(webhookCount) > 0 ? `${webhookCount} endpoint${Number(webhookCount) === 1 ? "" : "s"}` : "Not connected",
      href: "/dashboard/settings/webhooks",
      action: "Manage",
    },
    {
      name: "Resend",
      description: "Transactional email for confirmations, reminders, and automations.",
      status: process.env.RESEND_API_KEY ? "Configured" : "Env required",
      href: "/dashboard/automations",
      action: "Use in automations",
    },
    {
      name: "Google Calendar",
      description: "Two-way calendar sync per staff member.",
      status: "Phase 2 adapter",
      href: "/dashboard/settings/integrations",
      action: "Roadmap",
    },
    {
      name: "WhatsApp / SMS",
      description: "Reminder and broadcast adapters for Meta, Twilio, or local SMS providers.",
      status: "Phase 2 adapter",
      href: "/dashboard/automations",
      action: "Roadmap",
    },
    {
      name: "API keys",
      description: "Scoped API access for custom integrations.",
      status: "Phase 3",
      href: "/dashboard/settings/integrations",
      action: "Roadmap",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cal text-2xl">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect payments, messaging, calendar sync, and external systems.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((item) => (
          <div key={item.name} className="rounded-xl border bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">{item.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {item.status}
              </span>
            </div>
            <Link href={item.href} className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">
              {item.action}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
