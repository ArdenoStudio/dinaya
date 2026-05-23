"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BookOpen, Menu, Search, ShieldCheck, UserCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { DashboardToastProvider } from "@/components/dashboard/ToastProvider";
import { useDashboardCopy, useDashboardRole } from "@/components/dashboard/DashboardLocaleProvider";
import { MacOSSidebar } from "@/components/ui/macos-sidebar";
import { dashboardNavGroups } from "@/lib/dashboard-nav";
import type { DashboardCopy } from "@/lib/dashboard-i18n";

type DashboardShellProps = {
  businessName: string;
  userEmail: string;
  userName: string | null;
  plan: string;
  showAdminLink: boolean;
  readOnlyImpersonation: boolean;
  impersonatedBy?: string;
  copy: DashboardCopy;
  children: React.ReactNode;
};

export function DashboardShell({
  businessName,
  userEmail,
  userName,
  plan,
  showAdminLink,
  readOnlyImpersonation,
  impersonatedBy,
  copy,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const navCopy = useDashboardCopy();
  const role = useDashboardRole();
  const isOwner = role === "owner";

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

  return (
    <div className="min-h-screen bg-neutral-200 dark:bg-neutral-900">
      {readOnlyImpersonation ? (
        <div className="border-b border-amber-500/30 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          Read-only impersonation session
          {impersonatedBy ? ` (admin: ${impersonatedBy})` : ""}. Mutations are blocked.
        </div>
      ) : null}

      <MacOSSidebar
        activeHref={pathname}
        sections={sections}
        className="min-h-[calc(100vh-0px)]"
        header={<Logo href="/dashboard" size="sm" />}
        footer={
          <div className="space-y-3 border-t border-neutral-200/80 dark:border-neutral-700/80 px-2 pt-3">
            <Link
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 transition-colors hover:bg-neutral-200/70 dark:hover:bg-neutral-700/70 hover:text-neutral-900 dark:hover:text-neutral-100"
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
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="px-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              {copy.layout.signOut}
            </button>
          </div>
        }
      >
        <header className="sticky top-0 z-20 border-b border-neutral-200/80 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <details className="group lg:hidden">
              <summary className="flex size-9 cursor-pointer list-none items-center justify-center rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <Menu className="size-4" aria-hidden="true" />
                <span className="sr-only">Open navigation</span>
              </summary>
              <div className="absolute left-3 top-14 z-30 w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2 shadow-xl">
                <nav className="space-y-4" aria-label="Mobile navigation">
                  {sections.map((section) => (
                    <div key={section.label}>
                      <p className="mb-2 px-2 text-[0.68rem] font-semibold uppercase tracking-wider text-neutral-500">
                        {section.label}
                      </p>
                      <div className="space-y-1">
                        {section.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            {item.icon}
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>
            </details>

            <div className="hidden lg:block">
              <p className="max-w-[13rem] truncate rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
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
                className="h-10 w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-neutral-400 focus:ring-2 focus:ring-primary/30"
                placeholder={copy.layout.searchPlaceholder}
              />
            </form>

            <div className="hidden items-center gap-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-2 sm:flex">
              <UserCircle className="size-4 text-neutral-400" aria-hidden="true" />
              <span className="max-w-[10rem] truncate text-sm text-neutral-800 dark:text-neutral-100">
                {userName ?? userEmail}
              </span>
            </div>
          </div>
        </header>

        <DashboardToastProvider>
          <main className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-950">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
          </main>
        </DashboardToastProvider>
      </MacOSSidebar>
    </div>
  );
}
