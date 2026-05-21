import { desc, eq, ilike, or } from "drizzle-orm";
import { LifeBuoy, Search } from "lucide-react";
import { db } from "@/db";
import { businesses, users } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { SupportClient } from "./SupportClient";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePlatformAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  const whereExpr = q
    ? or(ilike(users.email, `%${q}%`), ilike(users.name, `%${q}%`), ilike(businesses.name, `%${q}%`))
    : undefined;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      businessName: businesses.name,
    })
    .from(users)
    .innerJoin(businesses, eq(businesses.id, users.businessId))
    .where(whereExpr)
    .orderBy(desc(users.createdAt))
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-cal text-3xl tracking-tight">Support</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-rose-700">
            <LifeBuoy className="size-3" aria-hidden="true" />
            Internal use
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Resetting a password generates a one-time temporary password to share with the user.
          All actions are recorded in the security audit log.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by user name, email, or business name"
            className="h-10 w-full rounded-md border bg-white pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Search
        </button>
      </form>

      <SupportClient users={rows} />

      <div className="rounded-xl border border-amber-500/20 bg-amber-50/60 p-4 text-xs text-amber-900">
        <p className="font-semibold">Additional support tools</p>
        <ul className="mt-1 list-disc pl-5 text-amber-900/80">
          <li>Impersonate a user (read-only session) — planned</li>
          <li>Suspend / unsuspend accounts — available on the account detail page</li>
          <li>Manually refund a booking payment — planned</li>
          <li>Replay failed PayHere or webhook deliveries — planned</li>
        </ul>
      </div>
    </div>
  );
}
