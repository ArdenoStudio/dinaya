import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { format } from "date-fns";
import { CreditCard } from "lucide-react";
import { db } from "@/db";
import { businesses, subscriptions } from "@/db/schema";
import { formatLkr } from "@/lib/utils";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700",
  past_due: "bg-amber-500/10 text-amber-700",
  cancelled: "bg-rose-500/10 text-rose-700",
  ended: "bg-muted text-muted-foreground",
};

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePlatformAdmin();
  const sp = await searchParams;
  const statusFilter =
    sp.status && ["active", "past_due", "cancelled", "ended"].includes(sp.status)
      ? (sp.status as "active" | "past_due" | "cancelled" | "ended")
      : null;

  const rows = await db
    .select({
      id: subscriptions.id,
      payhereOrderId: subscriptions.payhereOrderId,
      plan: subscriptions.plan,
      status: subscriptions.status,
      amountLkr: subscriptions.amountLkr,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelledAt: subscriptions.cancelledAt,
      createdAt: subscriptions.createdAt,
      businessId: businesses.id,
      businessName: businesses.name,
    })
    .from(subscriptions)
    .innerJoin(businesses, eq(businesses.id, subscriptions.businessId))
    .where(statusFilter ? eq(subscriptions.status, statusFilter) : undefined)
    .orderBy(desc(subscriptions.createdAt))
    .limit(200);

  const summary = await db
    .select({
      status: subscriptions.status,
      count: sql<number>`count(*)::int`,
      sum: sql<number>`coalesce(sum(${subscriptions.amountLkr}), 0)::int`,
    })
    .from(subscriptions)
    .groupBy(subscriptions.status);

  const byStatus = Object.fromEntries(
    summary.map((s) => [s.status, { count: Number(s.count), sum: Number(s.sum) }])
  );

  const tiles = [
    {
      label: "Active",
      value: byStatus.active?.count ?? 0,
      sub: formatLkr(byStatus.active?.sum ?? 0) + " MRR",
      accent: "bg-emerald-500",
    },
    {
      label: "Past due",
      value: byStatus.past_due?.count ?? 0,
      sub: formatLkr(byStatus.past_due?.sum ?? 0) + " at risk",
      accent: "bg-amber-500",
    },
    {
      label: "Cancelled",
      value: byStatus.cancelled?.count ?? 0,
      sub: "lifetime",
      accent: "bg-rose-500",
    },
    {
      label: "Ended",
      value: byStatus.ended?.count ?? 0,
      sub: "lifetime",
      accent: "bg-muted-foreground",
    },
  ];

  const statusChips: { value: string | null; label: string }[] = [
    { value: null, label: "All" },
    { value: "active", label: "Active" },
    { value: "past_due", label: "Past due" },
    { value: "cancelled", label: "Cancelled" },
    { value: "ended", label: "Ended" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cal text-3xl tracking-tight">Subscriptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pro plan billing across all tenants.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="overflow-hidden rounded-xl border bg-white">
            <div className={`h-[3px] ${t.accent}`} />
            <div className="p-5">
              <p className="text-xs text-muted-foreground">{t.label}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight">{t.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {statusChips.map((chip) => {
          const active = (sp.status ?? null) === (chip.value ?? null);
          const href = chip.value ? `?status=${chip.value}` : "?";
          return (
            <Link
              key={chip.label}
              href={href}
              className={
                active
                  ? "rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                  : "rounded-full border bg-white px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              }
            >
              {chip.label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium">Renews</th>
                <th className="px-4 py-3 font-medium">PayHere order</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <CreditCard className="mx-auto mb-2 size-6 text-muted-foreground/50" aria-hidden="true" />
                    No subscriptions {statusFilter ? `with status "${statusFilter}"` : "yet"}.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/accounts/${r.businessId}`} className="font-medium hover:text-primary hover:underline">
                      {r.businessName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
                      {r.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${STATUS_STYLES[r.status] ?? "bg-muted text-muted-foreground"}`}>
                      {r.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatLkr(r.amountLkr)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.currentPeriodEnd ? format(r.currentPeriodEnd, "d MMM yyyy") : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.payhereOrderId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
