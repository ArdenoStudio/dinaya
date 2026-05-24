import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/auth";
import { Logo } from "@/components/Logo";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { logAdminEvent } from "@/lib/admin-audit";
import { headers } from "next/headers";
import { Menu, Search, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Platform Admin | Dinaya",
  description:
    "Dinaya platform administration dashboard for managing accounts, users, and subscriptions.",
  robots: "noindex, nofollow",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requirePlatformAdmin();
  // Fire-and-forget audit entry per page view (don't block render on file IO)
  try {
    const h = await headers();
    const pathHeader = h.get("x-invoke-path") ?? h.get("referer") ?? "";
    void logAdminEvent({
      actorEmail: admin.email,
      action: "admin.view",
      target: pathHeader || undefined,
    });
  } catch {
    // ignore
  }

  return (
    <div className="min-h-screen bg-muted/20 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside
        className="hidden border-r bg-white lg:flex lg:flex-col"
        aria-label="Platform admin sidebar"
      >
        <div className="border-b px-6 py-5">
          <Logo href="/admin" size="sm" />
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
            <ShieldCheck className="size-3" aria-hidden="true" />
            Platform admin
          </span>
        </div>
        <AdminSidebarNav />
        <div className="border-t px-6 py-4">
          <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
          <p className="mt-1 text-xs capitalize text-muted-foreground/70">
            Internal staff
          </p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/auth/signin" });
            }}
          >
            <button className="mt-3 text-xs text-muted-foreground hover:text-foreground">
              Sign out
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
                <AdminSidebarNav />
              </div>
            </details>

            <form action="/admin/accounts" method="get" className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                name="q"
                type="search"
                aria-label="Search platform"
                className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30"
                placeholder="Search accounts, users, subscriptions"
              />
            </form>

            <Link
              href="/dashboard"
              className="hidden rounded-md border bg-white px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              Exit to business view
            </Link>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] overflow-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
