import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { CustomDomainPanel } from "@/components/dashboard/CustomDomainPanel";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { GoogleCalendarDisconnect } from "@/components/dashboard/GoogleCalendarDisconnect";
import { getIntegrationsDashboardList } from "@/lib/dashboard/integrations";
import { dashboardCardClass, dashboardPageClass } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

export default async function IntegrationsPage() {
  const { businessId } = await requireOwner();
  const integrations = await getIntegrationsDashboardList(businessId, { limit: 80 });
  const domain = integrations.domain;

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        title="Integrations"
        description="Connect payments, messaging, calendar sync, and external systems."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.rows.map((item) => (
          <div key={item.name} className={cn(dashboardCardClass, "p-5")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">{item.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {item.statusLabel}
              </span>
            </div>
            {item.id === "google-calendar" && item.status === "connected" ? (
              <GoogleCalendarDisconnect />
            ) : (
              <Link href={item.setupPath} className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">
                {item.actionLabel}
              </Link>
            )}
          </div>
        ))}
      </div>

      <CustomDomainPanel
        initialDomain={domain.customDomain}
        initialVerified={domain.customDomainVerified}
        initialStatus={domain.customDomainStatus}
        initialError={domain.customDomainError}
        initialVerificationHost={
          domain.customDomain && domain.customDomainVerificationToken
            ? `_dinaya-verify.${domain.customDomain}`
            : null
        }
        initialVerificationValue={
          domain.customDomainVerificationToken
            ? `dinaya-verify=${domain.customDomainVerificationToken}`
            : null
        }
        initialDnsInstructions={
          typeof domain.customDomainConfig === "object" &&
          domain.customDomainConfig &&
          "dnsInstructions" in domain.customDomainConfig &&
          Array.isArray(domain.customDomainConfig.dnsInstructions)
            ? domain.customDomainConfig.dnsInstructions
            : []
        }
        initialVercelVerification={
          Array.isArray(domain.customDomainVerification)
            ? domain.customDomainVerification
            : []
        }
      />
    </div>
  );
}
