"use client";

import { invoke } from "@tauri-apps/api/core";
import { useMemo } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getDashboardCopy } from "@/lib/dashboard-i18n";
import type { DashboardLanguage } from "@/lib/dashboard-i18n";
import type { PlanUsage } from "@/lib/dashboard-usage";
import { DesktopProviders } from "../providers/DesktopProviders";
import type { DesktopShellMeta } from "../views/DashboardOverviewPage";

type DesktopAppShellProps = {
  activeHref: string;
  banner?: React.ReactNode;
  businessName: string;
  children: React.ReactNode;
  onNavigate: (href: string) => void;
  onSearchQueryChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSignOut: () => void;
  plan: string;
  searchQuery: string;
  shellMeta: DesktopShellMeta | null;
  userEmail: string;
  userName: string | null;
  userRole: "owner" | "staff";
};

export function DesktopAppShell({
  activeHref,
  banner,
  businessName,
  children,
  onNavigate,
  onSearchQueryChange,
  onSearchSubmit,
  onSignOut,
  plan,
  searchQuery,
  shellMeta,
  userEmail,
  userName,
  userRole,
}: DesktopAppShellProps) {
  const language = (shellMeta?.language ?? "en") as DashboardLanguage;
  const copy = getDashboardCopy(language);
  const planUsage: PlanUsage | undefined =
    userRole === "owner" ? shellMeta?.planUsage : undefined;

  const navigation = useMemo(
    () => ({
      activeHref,
      navigate: onNavigate,
      signOut: onSignOut,
      openExternal: (href: string) => {
        if (href.startsWith("http://") || href.startsWith("https://")) {
          void invoke("desktop_open_app_path", { path: href });
          return;
        }
        void invoke("desktop_open_dashboard_path", { path: href });
      },
      searchQuery,
      onSearchQueryChange,
      onSearchSubmit,
    }),
    [activeHref, onNavigate, onSearchSubmit, onSearchQueryChange, onSignOut, searchQuery],
  );

  return (
    <DesktopProviders language={language} navigation={navigation} role={userRole}>
      <DashboardShell
        banner={banner}
        businessName={businessName}
        copy={copy}
        plan={plan}
        planUsage={planUsage}
        readOnlyImpersonation={false}
        showAdminLink={false}
        trialDaysLeft={shellMeta?.trialDaysLeft ?? null}
        userEmail={userEmail}
        userName={userName}
      >
        {children}
      </DashboardShell>
    </DesktopProviders>
  );
}
