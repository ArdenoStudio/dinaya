import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/auth";
import { Logo } from "@/components/Logo";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { DashboardLocaleProvider } from "@/components/dashboard/DashboardLocaleProvider";
import { DashboardToastProvider } from "@/components/dashboard/ToastProvider";
import { requireBusiness } from "@/lib/auth";
import { getDashboardCopy } from "@/lib/dashboard-i18n";
import type { DashboardLanguage } from "@/lib/dashboard-i18n";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { BookOpen, Menu, Search, ShieldCheck, UserCircle } from "lucide-react";

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
    <div className="min-h-screen bg-muted/20 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      {readOnlyImpersonation && (
        <div className="col-span-full border-b border-amber-500/30 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          Read-only impersonation session
          {impersonatedBy ? ` (admin: ${impersonatedBy})` : ""}. Mutations are blocked.
        </div>
      )}
      <aside className="hidden border-r bg-white lg:flex lg:flex-col" aria-label="Sidebar">
        <div className="border-b px-6 py-5">
          <Logo href="/dashboard" size="sm" />
        </div>
        <SidebarNav />
        <div className="border-t px-6 py-4">
          <Link
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <BookOpen className="size-3.5 shrink-0" aria-hidden="true" />
            Help &amp; docs
          </Link>
          {showAdminLink && (
            <Link
              href="/admin"
              className="mb-3 flex items-center gap-2 rounded-md border border-primary/20 bg-primary/[0.04] px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {copy.layout.platformAdmin}
            </Link>
          )}
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-xs capitalize text-muted-foreground/70">{business.plan} {copy.layout.planSuffix}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/auth/signin" });
            }}
          >
            <button className="mt-3 text-xs text-muted-foreground hover:text-foreground">
              {copy.layout.signOut}
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <details className="group lg:hidden">
              <summary className="flex size-9 cursor-pointer list-none items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <Menu className="size-4" aria-hidden="true" />
                <span className="sr-only">Open navigation</span>
              </summary>
              <div className="absolute left-3 top-14 w-[min(20rem,calc(100vw-1.5rem))] rounded-lg border bg-white p-2 shadow-lg">
                <SidebarNav />
              </div>
            </details>

            <div className="hidden lg:block">
              <p className="max-w-[13rem] truncate rounded-md border bg-white px-3 py-2 text-sm font-medium text-foreground">
                {business.name}
              </p>
            </div>

            <form action="/dashboard/search" method="get" className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                name="q"
                type="search"
                aria-label="Search dashboard"
                className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30"
                placeholder={copy.layout.searchPlaceholder}
              />
            </form>

            <div className="hidden items-center gap-2 rounded-md border bg-white px-2.5 py-2 sm:flex">
              <UserCircle className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="max-w-[10rem] truncate text-sm">{user.name ?? user.email}</span>
            </div>
          </div>
        </header>

        <DashboardToastProvider>
          <main className="min-h-[calc(100vh-4rem)] overflow-auto">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
          </main>
        </DashboardToastProvider>
      </div>
    </div>
    </DashboardLocaleProvider>
  );
}
