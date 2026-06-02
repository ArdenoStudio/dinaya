"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BookOpen, Menu, Search, ShieldCheck, UserCircle, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { DashboardToastProvider } from "@/components/dashboard/ToastProvider";
import { useDashboardCopy, useDashboardRole } from "@/components/dashboard/DashboardLocaleProvider";
import { MacOSSidebar } from "@/components/ui/macos-sidebar";
import { dashboardNavGroups } from "@/lib/dashboard-nav";
import type { DashboardCopy } from "@/lib/dashboard-i18n";
import type { PlanUsage } from "@/lib/dashboard-usage";
import { formatPlanUsage, isNearPlanLimit } from "@/lib/dashboard-usage";
import { cn } from "@/lib/utils";

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
  children: React.ReactNode;
};

function isNavItemActive(item: { exact?: boolean; href: string }, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

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
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const navCopy = useDashboardCopy();
  const role = useDashboardRole();
  const isOwner = role === "owner";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isSetupFlow = minimalChrome || pathname.startsWith("/dashboard/setup");

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileNavOpen]);

  if (isSetupFlow) {
    return (
      <DashboardToastProvider>
        {children}
      </DashboardToastProvider>
    );
  }

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

  const usageLines = planUsage
    ? [
        { label: "Services", value: formatPlanUsage(planUsage.services) },
        { label: "Staff", value: formatPlanUsage(planUsage.staff) },
        { label: "Locations", value: formatPlanUsage(planUsage.locations) },
      ].filter((item) => item.value !== null)
    : [];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-200 dark:bg-neutral-900">
      {readOnlyImpersonation ? (
        <div className="shrink-0 border-b border-amber-500/30 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          Read-only impersonation session
          {impersonatedBy ? ` (admin: ${impersonatedBy})` : ""}. Mutations are blocked.
        </div>
      ) : null}

      {plan === "trial" ? (
        <Link
          href="/dashboard/billing"
          className="shrink-0 border-b border-blue-500/30 bg-blue-50 px-4 py-2 text-center text-sm text-blue-900 transition-colors hover:bg-blue-100"
        >
          {trialDaysLeft != null && trialDaysLeft > 0
            ? `${trialDaysLeft} ${trialDaysLeft === 1 ? "day" : "days"} left in your free trial`
            : "Your free trial ends today"}
          {" — subscribe to keep your booking page live →"}
        </Link>
      ) : null}

      {plan === "expired" ? (
        <Link
          href="/dashboard/billing"
          className="shrink-0 border-b border-red-500/30 bg-red-50 px-4 py-2 text-center text-sm font-medium text-red-900 transition-colors hover:bg-red-100"
        >
          Your free trial has ended — your booking page is offline. Reactivate by subscribing →
        </Link>
      ) : null}

      <MacOSSidebar
        activeHref={pathname}
        sections={sections}
        className="min-h-0 flex-1"
        header={<Logo href="/dashboard" size="sm" />}
        footer={
          <div className="space-y-3 border-t border-neutral-200/80 px-2 pt-3 dark:border-neutral-700/80">
            <Link
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-200/70 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700/70 dark:hover:text-neutral-100"
            >
              <BookOpen className="size-3.5 shrink-0" aria-hidden="true" />
              Help &amp; docs
            </Link>
            {showAdminLink ? (
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/[0.06] px-2 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                {copy.layout.platformAdmin}
              </Link>
            ) : null}
            <div className="px-1">
              <p className="truncate text-xs text-neutral-600 dark:text-neutral-300">{userEmail}</p>
              <p className="mt-1 text-xs capitalize text-neutral-500 dark:text-neutral-400">
                {plan} {copy.layout.planSuffix}
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
              onClick={() => void signOut({ redirectTo: "/auth/signin" })}
              className="px-1 text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              {copy.layout.signOut}
            </button>
          </div>
        }
      >
        <header className="sticky top-0 z-20 border-b border-neutral-200/80 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-100 lg:hidden dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              {mobileNavOpen ? (
                <X className="size-4" aria-hidden="true" />
              ) : (
                <Menu className="size-4" aria-hidden="true" />
              )}
            </button>

            {mobileNavOpen ? (
              <>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  className="fixed inset-0 top-16 z-20 bg-black/10 backdrop-blur-[1px] lg:hidden"
                  onClick={() => setMobileNavOpen(false)}
                />
                <div className="absolute left-3 top-14 z-30 w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                  <nav className="max-h-[min(70vh,32rem)] space-y-4 overflow-y-auto pr-1" aria-label="Mobile navigation">
                    {sections.map((section) => (
                      <div key={section.label}>
                        <p className="mb-2 px-2 text-[0.68rem] font-semibold uppercase tracking-wider text-neutral-500">
                          {section.label}
                        </p>
                        <div className="space-y-1">
                          {section.items.map((item) => {
                            const active = isNavItemActive(item, pathname);
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? "page" : undefined}
                                onClick={() => setMobileNavOpen(false)}
                                className={cn(
                                  "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                                  active
                                    ? "bg-neutral-100 font-medium text-neutral-950 dark:bg-neutral-800 dark:text-neutral-50"
                                    : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800",
                                )}
                              >
                                {item.icon}
                                {item.label}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </nav>
                </div>
              </>
            ) : null}

            <div className="hidden lg:block">
              <p className="max-w-[13rem] truncate rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100">
                {businessName}
              </p>
            </div>

            <form action="/dashboard/search" method="get" className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                aria-hidden="true"
              />
              <input
                name="q"
                type="search"
                aria-label="Search dashboard"
                className="h-10 w-full rounded-md border border-neutral-200 bg-white pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-neutral-400 focus:ring-2 focus:ring-primary/30 dark:border-neutral-700 dark:bg-neutral-900"
                placeholder={copy.layout.searchPlaceholder}
              />
            </form>

            <div className="hidden items-center gap-2 rounded-md border border-neutral-200 bg-white px-2.5 py-2 sm:flex dark:border-neutral-700 dark:bg-neutral-900">
              <UserCircle className="size-4 text-neutral-400" aria-hidden="true" />
              <span className="max-w-[10rem] truncate text-sm text-neutral-800 dark:text-neutral-100">
                {userName ?? userEmail}
              </span>
            </div>
          </div>
        </header>

        <DashboardToastProvider>
          <main className="min-h-0 flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-950">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
          </main>
        </DashboardToastProvider>
      </MacOSSidebar>
    </div>
  );
}
