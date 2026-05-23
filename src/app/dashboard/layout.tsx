import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardLocaleProvider } from "@/components/dashboard/DashboardLocaleProvider";
import { requireBusiness } from "@/lib/auth";
import { getDashboardCopy } from "@/lib/dashboard-i18n";
import type { DashboardLanguage } from "@/lib/dashboard-i18n";
import { isPlatformAdmin } from "@/lib/platform-admin";

export const metadata: Metadata = {
  title: "Dashboard | Dinaya",
  description:
    "Manage your bookings, clients, services, and settings from your Dinaya dashboard.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { business, user, role, readOnlyImpersonation, impersonatedBy } = await requireBusiness();
  const showAdminLink = isPlatformAdmin(user.email);
  const language = (business.language ?? "en") as DashboardLanguage;
  const copy = getDashboardCopy(language);

  return (
    <DashboardLocaleProvider language={language} role={role}>
      <DashboardShell
        businessName={business.name}
        userEmail={user.email ?? ""}
        userName={user.name ?? null}
        plan={business.plan}
        showAdminLink={showAdminLink}
        readOnlyImpersonation={Boolean(readOnlyImpersonation)}
        impersonatedBy={impersonatedBy}
        copy={copy}
      >
        {children}
      </DashboardShell>
    </DashboardLocaleProvider>
  );
}
