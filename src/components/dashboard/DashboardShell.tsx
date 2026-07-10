"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { BookOpen, LogOut, Search, ShieldCheck, UserCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardToastProvider } from "@/components/dashboard/ToastProvider";
import { useDashboardNavigationOptional } from "@/components/dashboard/DashboardNavigation";
import { useDashboardCopy, useDashboardRole } from "@/components/dashboard/DashboardLocaleProvider";
import { DashboardBottomNav } from "@/components/dashboard/DashboardBottomNav";
import { MacOSSidebar } from "@/components/ui/macos-sidebar";
import { dashboardNavGroups } from "@/lib/dashboard-nav";
import type { DashboardCopy } from "@/lib/dashboard-i18n";
import type { PlanUsage } from "@/lib/dashboard-usage";
import { formatPlanUsage, isNearPlanLimit } from "@/lib/dashboard-usage";
import { planDisplayName } from "@/lib/plan-display";
import { trackDashboardNavClick } from "@/lib/analytics/gtag";
import { cn } from "@/lib/utils";
import { shouldShowPlanBanner } from "@/lib/dashboard-ui";

type DashboardShellProps = {
  businessName: string;
  userEmail: string;
  userName: string | null;
  plan: string;
  trialDaysLeft?: number | null;
  showAdminLink: boolean;
  readOnlyImpersonation: boolean;
  impersonatedBy?: string;
  planUsage?: PlanUsage;
  copy: DashboardCopy;
  minimalChrome?: boolean;
  banner?: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardShell({
  businessName,
  userEmail,
  userName,
  plan,
  trialDaysLeft,
  showAdminLink,
  readOnlyImpersonation,
  impersonatedBy,
  planUsage,
  copy,
  minimalChrome = false,
  banner,
  children,
}: DashboardShellProps) {
  const navigation = useDashboardNavigationOptional();
  const pathname = usePathname();
  const activeHref = navigation?.activeHref ?? pathname;
  const navCopy = useDashboardCopy();
  const role = useDashboardRole();
  const isOwner = role === "owner";
  const isSetupFlow = minimalChrome || activeHref.startsWith("/dashboard/setup");
  const [tabletCollapsedDefault] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 768px) and (max-width: 1023px)").matches
      ? false
      : true;
  });

  if (isSetupFlow) {
    return (
      <DashboardToastProvider>
        {children}
      </DashboardToastProvider>
    );
  }

  const primaryHrefs = new Set([
    "/dashboard",
    "/dashboard/calendar",
    "/dashboard/bookings",
    "/dashboard/clients",
  ]);

  const sections = dashboardNavGroups
    .map((group) => {
      const items = group.links
        .filter((link) => isOwner || !link.ownerOnly)
        .map((link) => {
          const Icon = link.icon;
          return {
            href: link.href,
            exact: link.exact,
            label: navCopy.nav[link.labelKey],
            routeId: link.labelKey,
            Icon,
            icon: <Icon className="size-4" aria-hidden="true" />,
          };
        });

      if (items.length === 0) return null;

      return {
        label: navCopy.navGroups[group.labelKey],
        items,
      };
    })
    .filter((section): section is NonNullable<typeof section> => section !== null);

  const moreSections = sections
    .map((section) => ({
      label: section.label,
      items: section.items
        .filter((item) => !primaryHrefs.has(item.href))
        .map((item) => ({
          href: item.href,
          label: item.label,
          icon: item.Icon,
          exact: item.exact,
          routeId: item.routeId,
        })),
    }))
    .filter((section) => section.items.length > 0);

  const sidebarSections = sections.map((section) => ({
    label: section.label,
    items: section.items.map((item) => ({
      href: item.href,
      label: item.label,
      exact: item.exact,
      icon: item.icon,
    })),
  }));

  const usageLines = planUsage
    ? [
        { label: "Services", value: formatPlanUsage(planUsage.services) },
        { label: "Staff", value: formatPlanUsage(planUsage.staff) },
        { label: "Locations", value: formatPlanUsage(planUsage.locations) },
      ].filter((item) => item.value !== null)
    : [];

  const planLabel = planDisplayName(plan);
  const handleSignOut = () => {
    if (navigation?.signOut) {
      navigation.signOut();
      return;
    }
    void signOut({ redirectTo: "/auth/signin" });
  };

  const accountFooter = (
    <div className="space-y-3 border-t border-neutral-200/80 px-2 pt-3 dark:border-neutral-700/80">
      <Link
        href="/docs"
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-11 items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-200/70 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700/70 dark:hover:text-neutral-100"
      >
        <BookOpen className="size-3.5 shrink-0" aria-hidden="true" />
        Help &amp; docs
      </Link>
      {showAdminLink ? (
        <Link
          href="/admin"
          className="flex min-h-11 items-center gap-2 rounded-md border border-primary/20 bg-primary/[0.06] px-2 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
        >
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          {copy.layout.platformAdmin}
        </Link>
      ) : null}
      <div className="px-1">
        <p className="truncate text-xs text-neutral-600 dark:text-neutral-300">{userEmail}</p>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {planLabel} {copy.layout.planSuffix}
        </p>
        {usageLines.length > 0 ? (
          <div className="mt-2 space-y-1">
            {usageLines.map((line) => {
              const usageItem =
                line.label === "Services"
                  ? planUsage!.services
                  : line.label === "Staff"
                    ? planUsage!.staff
                    : planUsage!.locations;
              return (
                <p
                  key={line.label}
                  className={cn(
                    "text-[0.68rem] text-neutral-500 dark:text-neutral-400",
                    isNearPlanLimit(usageItem) && "font-medium text-amber-700 dark:text-amber-400",
                  )}
                >
                  {line.label}: {line.value}
                </p>
              );
            })}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        className="flex min-h-11 w-full items-center rounded-md px-2 text-xs font-medium text-neutral-500 hover:bg-neutral-200/70 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700/70 dark:hover:text-neutral-100"
      >
        {copy.layout.signOut}
      </button>
    </div>
  );

  const collapsedAccountFooter = (
    <button
      type="button"
      onClick={handleSignOut}
      aria-label={copy.layout.signOut}
      className="mx-auto flex size-11 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-200/70 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700/70 dark:hover:text-neutral-100"
    >
      <LogOut className="size-4" aria-hidden="true" />
    </button>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-200 dark:bg-neutral-900">
      {readOnlyImpersonation ? (
        <div className="shrink-0 border-b border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 px-4 py-2 text-center text-sm text-amber-900 dark:text-amber-200">
          Read-only impersonation session
          {impersonatedBy ? ` (admin: ${impersonatedBy})` : ""}. Mutations are blocked.
        </div>
      ) : null}

      {shouldShowPlanBanner(activeHref, plan) && plan === "trial" ? (
        <Link
          href="/dashboard/billing"
          className="flex min-h-11 shrink-0 items-center justify-center border-b border-blue-500/30 bg-blue-50 px-4 py-2.5 text-center text-sm text-blue-900 transition-colors hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-100 dark:hover:bg-blue-950/60"
        >
          {trialDaysLeft != null && trialDaysLeft > 0
            ? `${trialDaysLeft} ${trialDaysLeft === 1 ? "day" : "days"} left in your free trial`
            : "Your free trial ends today"}
          {" — subscribe to keep your booking page live →"}
        </Link>
      ) : null}

      {shouldShowPlanBanner(activeHref, plan) && plan === "expired" ? (
        <Link
          href="/dashboard/billing"
          className="flex min-h-11 shrink-0 items-center justify-center border-b border-red-500/30 bg-red-50 px-4 py-2.5 text-center text-sm font-medium text-red-900 transition-colors hover:bg-red-100 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60"
        >
          Your free trial has ended — your booking page is offline. Reactivate by subscribing →
        </Link>
      ) : null}

      <div data-dashboard-shell-inert className="min-h-0 flex-1">
      <MacOSSidebar
        activeHref={activeHref}
        sections={sidebarSections}
        className="min-h-0 flex-1"
        header={<Logo href={navigation ? null : "/dashboard"} size="sm" />}
        footer={accountFooter}
        collapsedFooter={collapsedAccountFooter}
        defaultOpen={tabletCollapsedDefault}
        onItemSelect={(href) => {
          trackDashboardNavClick({ href, surface: "sidebar" });
          navigation?.navigate?.(href);
        }}
      >
        <header className="sticky top-0 z-20 border-b border-neutral-200/80 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <div className="hidden md:block">
              <p className="max-w-[13rem] truncate rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100">
                {businessName}
              </p>
            </div>

            <form
              action={navigation?.onSearchSubmit ? undefined : "/dashboard/search"}
              method={navigation?.onSearchSubmit ? undefined : "get"}
              className="relative min-w-0 flex-1"
              onSubmit={(event) => {
                if (!navigation?.onSearchSubmit) return;
                event.preventDefault();
                navigation.onSearchSubmit();
              }}
            >
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                aria-hidden="true"
              />
              <input
                name="q"
                type="search"
                aria-label="Search dashboard"
                className="h-11 w-full rounded-md border border-neutral-200 bg-white pl-9 pr-3 text-base outline-none transition-shadow placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-sm dark:border-neutral-700 dark:bg-neutral-900"
                placeholder={copy.layout.searchPlaceholder}
                {...(navigation?.searchQuery !== undefined
                  ? {
                      value: navigation.searchQuery,
                      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                        navigation.onSearchQueryChange?.(event.target.value),
                    }
                  : {})}
              />
            </form>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="hidden items-center gap-2 rounded-md border border-neutral-200 bg-white px-2.5 py-2 sm:flex dark:border-neutral-700 dark:bg-neutral-900">
                <UserCircle className="size-4 text-neutral-400" aria-hidden="true" />
                <span className="max-w-[10rem] truncate text-sm text-neutral-800 dark:text-neutral-100">
                  {userName ?? userEmail}
                </span>
              </div>
            </div>
          </div>
        </header>

        {banner}

        <DashboardToastProvider>
          <main className="min-h-0 flex-1 overflow-auto bg-neutral-50 pb-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] dark:bg-neutral-950 md:pb-0">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
          </main>
        </DashboardToastProvider>
      </MacOSSidebar>
      </div>

      <DashboardBottomNav
        activeHref={activeHref}
        moreSections={moreSections}
        userEmail={userEmail}
        planLabel={`${planLabel} ${copy.layout.planSuffix}`.trim()}
        showAdminLink={showAdminLink}
        onSignOut={handleSignOut}
        onNavigate={(href) => navigation?.navigate?.(href)}
      />
    </div>
  );
}
