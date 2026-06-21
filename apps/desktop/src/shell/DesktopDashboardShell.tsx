import { LogOut, RefreshCw, Search, UserCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { MacOSSidebar } from "@/components/ui/macos-sidebar";
import { dashboardCopy } from "@/lib/dashboard-i18n";
import { dashboardNavGroups } from "@/lib/dashboard-nav";
import { planDisplayName } from "@/lib/plan-display";
import { cn } from "@/lib/utils";

type DesktopDashboardShellProps = {
  activeHref: string;
  businessName: string;
  children: React.ReactNode;
  error?: string | null;
  offlineNotice?: string | null;
  onCommandPalette: () => void;
  onNavigate: (href: string) => void;
  onQueryChange: (value: string) => void;
  onRefresh: () => void;
  onSearch: () => void;
  onSignOut: () => void;
  plan: string;
  query: string;
  refreshing: boolean;
  userEmail: string;
  userName: string | null;
};

export function DesktopDashboardShell({
  activeHref,
  businessName,
  children,
  error,
  offlineNotice,
  onCommandPalette,
  onNavigate,
  onQueryChange,
  onRefresh,
  onSearch,
  onSignOut,
  plan,
  query,
  refreshing,
  userEmail,
  userName,
}: DesktopDashboardShellProps) {
  const copy = dashboardCopy.en;

  const sections = dashboardNavGroups.map((group) => ({
    label: copy.navGroups[group.labelKey],
    items: group.links.map((link) => {
      const Icon = link.icon;
      return {
        exact: link.exact,
        href: link.href,
        icon: <Icon className="size-4" aria-hidden="true" />,
        label: copy.nav[link.labelKey],
      };
    }),
  }));

  const planLabel = planDisplayName(plan);

  const accountFooter = (
    <div className="space-y-3 border-t border-neutral-200/80 px-2 pt-3 dark:border-neutral-700/80">
      <div className="px-1">
        <p className="truncate text-xs text-neutral-600 dark:text-neutral-300">{userEmail}</p>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {planLabel} {copy.layout.planSuffix}
        </p>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        className="flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-xs font-medium text-neutral-500 hover:bg-neutral-200/70 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700/70 dark:hover:text-neutral-100"
      >
        <LogOut className="size-3.5 shrink-0" aria-hidden="true" />
        {copy.layout.signOut}
      </button>
    </div>
  );

  const collapsedAccountFooter = (
    <button
      type="button"
      onClick={onSignOut}
      aria-label={copy.layout.signOut}
      className="mx-auto flex size-11 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-200/70 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700/70 dark:hover:text-neutral-100"
    >
      <LogOut className="size-4" aria-hidden="true" />
    </button>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-200 dark:bg-neutral-900">
      <MacOSSidebar
        activeHref={activeHref}
        sections={sections}
        className="min-h-0 flex-1"
        header={<Logo href={null} size="sm" short />}
        footer={accountFooter}
        collapsedFooter={collapsedAccountFooter}
        onItemSelect={onNavigate}
      >
        <header className="sticky top-0 z-20 border-b border-neutral-200/80 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <div className="hidden lg:block">
              <p className="max-w-[13rem] truncate rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100">
                {businessName}
              </p>
            </div>

            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search dashboard"
                className="h-10 w-full rounded-md border border-neutral-200 bg-white pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-neutral-400 focus:ring-2 focus:ring-primary/30 dark:border-neutral-700 dark:bg-neutral-900"
                placeholder={copy.layout.searchPlaceholder}
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onSearch();
                }}
              />
            </div>

            <button
              type="button"
              className="hidden rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 sm:inline-flex dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              onClick={onCommandPalette}
            >
              Command
            </button>

            <button
              type="button"
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onRefresh}
            >
              <RefreshCw className={cn("size-4", refreshing && "animate-spin")} aria-hidden="true" />
              {refreshing ? "Syncing…" : "Refresh"}
            </button>

            <div className="hidden items-center gap-2 rounded-md border border-neutral-200 bg-white px-2.5 py-2 sm:flex dark:border-neutral-700 dark:bg-neutral-900">
              <UserCircle className="size-4 text-neutral-400" aria-hidden="true" />
              <span className="max-w-[10rem] truncate text-sm text-neutral-800 dark:text-neutral-100">
                {userName ?? userEmail}
              </span>
            </div>
          </div>
        </header>

        {error ? (
          <div
            aria-live="assertive"
            className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {offlineNotice ? (
          <div
            className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
            role="status"
          >
            {offlineNotice}
          </div>
        ) : null}

        <main id="desktop-main" tabIndex={-1} className="min-h-0 flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-950">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </MacOSSidebar>
    </div>
  );
}
