import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardLocaleProvider } from "@/components/dashboard/DashboardLocaleProvider";
import { OnboardingGate } from "@/components/dashboard/OnboardingGate";
import { db } from "@/db";
import { businesses, locations, services, staff } from "@/db/schema";
import { requireBusiness } from "@/lib/auth";
import { getDashboardCopy } from "@/lib/dashboard-i18n";
import type { DashboardLanguage } from "@/lib/dashboard-i18n";
import type { PlanUsage } from "@/lib/dashboard-usage";
import { getEntitlements, type Plan } from "@/lib/plan";
import { isPlatformAdmin } from "@/lib/platform-admin-members";

export const metadata: Metadata = {
  title: "Dashboard | Dinaya",
  description:
    "Manage your bookings, clients, services, and settings from your Dinaya dashboard.",
};

async function getPlanUsage(businessId: string, plan: Plan): Promise<PlanUsage> {
  const limits = getEntitlements(plan).limits;
  try {
    const [[{ servicesCount }], [{ staffCount }], [{ locationsCount }]] = await Promise.all([
      db.select({ servicesCount: count() }).from(services).where(eq(services.businessId, businessId)),
      db.select({ staffCount: count() }).from(staff).where(eq(staff.businessId, businessId)),
      db.select({ locationsCount: count() }).from(locations).where(eq(locations.businessId, businessId)),
    ]);
    return {
      services: { used: Number(servicesCount), limit: limits.services },
      staff: { used: Number(staffCount), limit: limits.staff },
      locations: { used: Number(locationsCount), limit: limits.locations },
    };
  } catch {
    return {
      services: { used: 0, limit: limits.services },
      staff: { used: 0, limit: limits.staff },
      locations: { used: 0, limit: limits.locations },
    };
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { business, user, role, readOnlyImpersonation, impersonatedBy, businessId } =
    await requireBusiness();
  const showAdminLink = await isPlatformAdmin(user.email);
  const language = (business.language ?? "en") as DashboardLanguage;
  const copy = getDashboardCopy(language);
  const planUsage = role === "owner" ? await getPlanUsage(businessId, business.plan as Plan) : undefined;

  let onboardingCompleted = true; // default to completed so existing users aren't blocked
  try {
    const [onboardingRow] = await db
      .select({ onboardingCompletedAt: businesses.onboardingCompletedAt })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);
    onboardingCompleted = Boolean(onboardingRow?.onboardingCompletedAt);
  } catch {
    // column may not exist yet if migrations are pending; treat as completed
  }

  return (
    <DashboardLocaleProvider language={language} role={role}>
      <OnboardingGate completed={onboardingCompleted}>
        <DashboardShell
          businessName={business.name}
          userEmail={user.email ?? ""}
          userName={user.name ?? null}
          plan={business.plan}
          showAdminLink={showAdminLink}
          readOnlyImpersonation={Boolean(readOnlyImpersonation)}
          impersonatedBy={impersonatedBy}
          planUsage={planUsage}
          copy={copy}
          minimalChrome={!onboardingCompleted}
        >
          {children}
        </DashboardShell>
      </OnboardingGate>
    </DashboardLocaleProvider>
  );
}
