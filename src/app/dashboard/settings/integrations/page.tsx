import Link from "next/link";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses, socialConnections, webhooks } from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import { CustomDomainPanel } from "@/components/dashboard/CustomDomainPanel";
import { GoogleCalendarDisconnect } from "@/components/dashboard/GoogleCalendarDisconnect";
import { GOOGLE_PROVIDER, googleOAuthConfigured } from "@/lib/google-calendar";

export default async function IntegrationsPage() {
  const { businessId } = await requireOwner();
  const [[business], [{ webhookCount }], [{ googleCount }]] = await Promise.all([
    db
      .select({
        payhereEnabled: businesses.payhereEnabled,
        payhereMerchantId: businesses.payhereMerchantId,
        customDomain: businesses.customDomain,
        customDomainVerified: businesses.customDomainVerified,
        customDomainVerificationToken: businesses.customDomainVerificationToken,
        customDomainStatus: businesses.customDomainStatus,
        customDomainError: businesses.customDomainError,
        customDomainConfig: businesses.customDomainConfig,
        customDomainVerification: businesses.customDomainVerification,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1),
    db.select({ webhookCount: count() }).from(webhooks).where(eq(webhooks.businessId, businessId)),
    db
      .select({ googleCount: count() })
      .from(socialConnections)
      .where(
        and(
          eq(socialConnections.businessId, businessId),
          eq(socialConnections.provider, GOOGLE_PROVIDER),
          eq(socialConnections.isActive, true),
        ),
      ),
  ]);

  const googleConnected = Number(googleCount) > 0;
  const googleStatus = !googleOAuthConfigured()
    ? "Env required"
    : googleConnected
      ? "Connected"
      : "Not connected";

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
      name: "Google Calendar",
      description: "Push confirmed bookings to your Google Calendar.",
      status: googleStatus,
      href: googleConnected ? "/dashboard/settings/integrations" : "/api/dashboard/integrations/google",
      action: googleConnected ? "Connected" : googleOAuthConfigured() ? "Connect" : "Configure env",
    },
    {
      name: "Resend",
      description: "Transactional email for confirmations, reminders, and automations.",
      status: process.env.RESEND_API_KEY ? "Configured" : "Env required",
      href: "/dashboard/automations",
      action: "Use in automations",
    },
    {
      name: "WhatsApp / SMS",
      description: "AI reminders and campaigns through Meta WhatsApp or a configured local SMS gateway.",
      status: process.env.META_WHATSAPP_TOKEN || process.env.SMS_HTTP_ENDPOINT ? "Configured" : "Env required",
      href: "/dashboard/automations",
      action: "Use in AI Hub",
    },
    {
      name: "AI Voice Receptionist",
      description: "Let callers ask questions and book appointments through a managed phone agent.",
      status: "Max add-on",
      href: "/dashboard/settings/voice-receptionist",
      action: "Set up",
    },
    {
      name: "API keys",
      description: "Scoped API access for custom integrations and /api/v1 routes.",
      status: "Available",
      href: "/dashboard/settings/api-keys",
      action: "Manage keys",
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
            {item.name === "Google Calendar" && googleConnected ? (
              <GoogleCalendarDisconnect />
            ) : (
              <Link href={item.href} className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">
                {item.action}
              </Link>
            )}
          </div>
        ))}
      </div>

      <CustomDomainPanel
        initialDomain={business?.customDomain ?? null}
        initialVerified={Boolean(business?.customDomainVerified)}
        initialStatus={business?.customDomainStatus ?? "none"}
        initialError={business?.customDomainError ?? null}
        initialVerificationHost={
          business?.customDomain && business.customDomainVerificationToken
            ? `_dinaya-verify.${business.customDomain}`
            : null
        }
        initialVerificationValue={
          business?.customDomainVerificationToken
            ? `dinaya-verify=${business.customDomainVerificationToken}`
            : null
        }
        initialDnsInstructions={
          typeof business?.customDomainConfig === "object" &&
          business.customDomainConfig &&
          "dnsInstructions" in business.customDomainConfig &&
          Array.isArray(business.customDomainConfig.dnsInstructions)
            ? business.customDomainConfig.dnsInstructions
            : []
        }
        initialVercelVerification={
          Array.isArray(business?.customDomainVerification)
            ? business.customDomainVerification
            : []
        }
      />
    </div>
  );
}
