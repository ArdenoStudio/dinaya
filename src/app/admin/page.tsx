import Link from "next/link";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { format, subDays } from "date-fns";
import { ArrowUpRight, Building2, CalendarCheck, CreditCard, TrendingUp, UserPlus, Users } from "lucide-react";
import { db } from "@/db";
import { activityLog, bookings, businesses, payments, subscriptions, users } from "@/db/schema";
import { safeAdminQuery } from "@/lib/admin-db";
import { formatLkr } from "@/lib/utils";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requirePlatformAdmin();

  const now = new Date();
  const last30 = subDays(now, 30);
  const last60 = subDays(now, 60);

  const [
    [{ totalAccounts }],
    [{ proAccounts }],
    [{ newAccounts30 }],
    [{ newAccounts60to30 }],
    [{ activeSubs }],
    [{ pastDueSubs }],
    [{ cancelledSubs30 }],
    [{ mrrLkr }],
    [{ totalUsers }],
    [{ bookings30 }],
    [{ bookings60to30 }],
    [{ gmv30 }],
    topAccounts,
    recentSignups,
    recentActivity,
  ] = await Promise.all([
    safeAdminQuery(db.select({ totalAccounts: count() }).from(businesses), [{ totalAccounts: 0 }] as { totalAccounts: number }[]),
    safeAdminQuery(
      db.select({ proAccounts: count() }).from(businesses).where(eq(businesses.plan, "pro")),
      [{ proAccounts: 0 }] as { proAccounts: number }[]
    ),
    safeAdminQuery(
      db.select({ newAccounts30: count() }).from(businesses).where(gte(businesses.createdAt, last30)),
      [{ newAccounts30: 0 }] as { newAccounts30: number }[]
    ),
    safeAdminQuery(
      db
        .select({ newAccounts60to30: count() })
        .from(businesses)
        .where(and(gte(businesses.createdAt, last60), sql`${businesses.createdAt} < ${last30}`)),
      [{ newAccounts60to30: 0 }] as { newAccounts60to30: number }[]
    ),
    safeAdminQuery(
      db.select({ activeSubs: count() }).from(subscriptions).where(eq(subscriptions.status, "active")),
      [{ activeSubs: 0 }] as { activeSubs: number }[]
    ),
    safeAdminQuery(
      db.select({ pastDueSubs: count() }).from(subscriptions).where(eq(subscriptions.status, "past_due")),
      [{ pastDueSubs: 0 }] as { pastDueSubs: number }[]
    ),
    safeAdminQuery(
      db
        .select({ cancelledSubs30: count() })
        .from(subscriptions)
        .where(and(eq(subscriptions.status, "cancelled"), gte(subscriptions.cancelledAt, last30))),
      [{ cancelledSubs30: 0 }] as { cancelledSubs30: number }[]
    ),
    safeAdminQuery(
      db
        .select({
          mrrLkr: sql<number>`coalesce(sum(${subscriptions.amountLkr}), 0)::int`,
        })
        .from(subscriptions)
        .where(eq(subscriptions.status, "active")),
      [{ mrrLkr: 0 }] as { mrrLkr: number }[]
    ),
    safeAdminQuery(db.select({ totalUsers: count() }).from(users), [{ totalUsers: 0 }] as { totalUsers: number }[]),
    safeAdminQuery(
      db.select({ bookings30: count() }).from(bookings).where(gte(bookings.createdAt, last30)),
      [{ bookings30: 0 }] as { bookings30: number }[]
    ),
    safeAdminQuery(
      db
        .select({ bookings60to30: count() })
        .from(bookings)
        .where(and(gte(bookings.createdAt, last60), sql`${bookings.createdAt} < ${last30}`)),
      [{ bookings60to30: 0 }] as { bookings60to30: number }[]
    ),
    safeAdminQuery(
      db
        .select({ gmv30: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int` })
        .from(payments)
        .where(and(eq(payments.status, "success"), gte(payments.createdAt, last30))),
      [{ gmv30: 0 }] as { gmv30: number }[]
    ),
    safeAdminQuery(
      db
        .select({
          id: businesses.id,
          name: businesses.name,
          slug: businesses.slug,
          plan: businesses.plan,
          bookingCount: count(bookings.id),
        })
        .from(businesses)
        .leftJoin(bookings, and(eq(bookings.businessId, businesses.id), gte(bookings.createdAt, last30)))
        .groupBy(businesses.id)
        .orderBy(desc(count(bookings.id)))
        .limit(6),
      [] as { id: string; name: string; slug: string; plan: "free" | "pro"; bookingCount: number }[]
    ),
    safeAdminQuery(
      db
        .select({
          id: businesses.id,
          name: businesses.name,
          slug: businesses.slug,
          plan: businesses.plan,
          createdAt: businesses.createdAt,
        })
        .from(businesses)
        .orderBy(desc(businesses.createdAt))
        .limit(5),
      [] as { id: string; name: string; slug: string; plan: "free" | "pro"; createdAt: Date }[]
    ),
    safeAdminQuery(
      db
        .select({
          businessName: businesses.name,
          businessSlug: businesses.slug,
          entity: activityLog.entity,
          action: activityLog.action,
          createdAt: activityLog.createdAt,
        })
        .from(activityLog)
        .innerJoin(businesses, eq(businesses.id, activityLog.businessId))
        .orderBy(desc(activityLog.createdAt))
        .limit(8),
      [] as {
        businessName: string;
        businessSlug: string;
        entity: string;
        action: string;
        createdAt: Date;
      }[]
    ),
  ]);

  const total = Number(totalAccounts ?? 0);
  const pro = Number(proAccounts ?? 0);
  const free = Math.max(total - pro, 0);
  const proShare = total > 0 ? Math.round((pro / total) * 100) : 0;

  const signupsCurr = Number(newAccounts30 ?? 0);
  const signupsPrev = Number(newAccounts60to30 ?? 0);
  const signupsDelta =
    signupsPrev > 0
      ? Math.round(((signupsCurr - signupsPrev) / signupsPrev) * 100)
      : signupsCurr > 0
      ? 100
      : 0;

  const bookingsCurr = Number(bookings30 ?? 0);
  const bookingsPrev = Number(bookings60to30 ?? 0);
  const bookingsDelta =
    bookingsPrev > 0
      ? Math.round(((bookingsCurr - bookingsPrev) / bookingsPrev) * 100)
      : bookingsCurr > 0
      ? 100
      : 0;

  const churnRate =
    Number(activeSubs) + Number(cancelledSubs30) > 0
      ? Math.round(
          (Number(cancelledSubs30) / (Number(activeSubs) + Number(cancelledSubs30))) * 100
        )
      : 0;

  const kpis = [
    {
      label: "Total accounts",
      value: total.toLocaleString(),
      sub: `${pro} on Pro · ${free} on Free`,
      delta: null as null | { value: number; label: string },
      accent: "bg-primary",
      icon: Building2,
    },
    {
      label: "Active subscriptions",
      value: Number(activeSubs).toLocaleString(),
      sub: `${Number(pastDueSubs)} past due · ${Number(cancelledSubs30)} cancelled 30d`,
      delta: null,
      accent: "bg-violet-600",
      icon: CreditCard,
    },
    {
      label: "MRR",
      value: formatLkr(Number(mrrLkr ?? 0)),
      sub: `From ${Number(activeSubs)} active subs`,
      delta: null,
      accent: "bg-amber-500",
      icon: TrendingUp,
    },
    {
      label: "Bookings (30d)",
      value: bookingsCurr.toLocaleString(),
      sub: `${formatLkr(Number(gmv30 ?? 0))} GMV`,
      delta: { value: bookingsDelta, label: "vs prior 30d" },
      accent: "bg-emerald-500",
      icon: CalendarCheck,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
          Platform admin · {format(now, "EEEE, MMMM d")}
        </p>
        <h1 className="font-cal text-3xl tracking-tight">Dinaya control center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Accounts, subscriptions, and platform health across all tenants.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="overflow-hidden rounded-xl border bg-white">
              <div className={`h-[3px] ${kpi.accent}`} />
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight">{kpi.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
                  </div>
                </div>
                {kpi.delta && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs">
                    <span
                      className={
                        kpi.delta.value >= 0
                          ? "rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600"
                          : "rounded-full bg-rose-500/10 px-2 py-0.5 font-medium text-rose-600"
                      }
                    >
                      {kpi.delta.value >= 0 ? "+" : ""}
                      {kpi.delta.value}%
                    </span>
                    <span className="text-muted-foreground">{kpi.delta.label}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-xs text-muted-foreground">New signups (30d)</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{signupsCurr}</p>
          <p className="mt-1 text-xs">
            <span
              className={
                signupsDelta >= 0
                  ? "font-medium text-emerald-600"
                  : "font-medium text-rose-600"
              }
            >
              {signupsDelta >= 0 ? "+" : ""}
              {signupsDelta}%
            </span>{" "}
            <span className="text-muted-foreground">vs prior 30d</span>
          </p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-xs text-muted-foreground">Pro adoption</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{proShare}%</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${proShare}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {pro} of {total} accounts
          </p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-xs text-muted-foreground">Churn (30d)</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{churnRate}%</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {Number(cancelledSubs30)} cancelled / {Number(activeSubs) + Number(cancelledSubs30)} base
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-xl border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Top accounts by bookings (30d)</h2>
            <Link
              href="/admin/accounts"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              All accounts <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          {topAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No booking activity yet.</p>
          ) : (
            <div className="space-y-2">
              {topAccounts.map((a, i) => {
                const max = Math.max(...topAccounts.map((x) => Number(x.bookingCount)), 1);
                const pct = Math.round((Number(a.bookingCount) / max) * 100);
                return (
                  <Link
                    key={a.id}
                    href={`/admin/accounts/${a.id}`}
                    className="block rounded-lg border px-3 py-2.5 hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[0.65rem] font-semibold text-muted-foreground">
                          {i + 1}
                        </span>
                        <span className="truncate text-sm font-medium">{a.name}</span>
                        <span
                          className={
                            a.plan === "pro"
                              ? "rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-primary"
                              : "rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground"
                          }
                        >
                          {a.plan}
                        </span>
                      </div>
                      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                        {Number(a.bookingCount)}
                      </span>
                    </div>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserPlus className="size-4" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold">Recent signups</p>
            </div>
            {recentSignups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No signups yet.</p>
            ) : (
              <div className="space-y-2">
                {recentSignups.map((s) => (
                  <Link
                    key={s.id}
                    href={`/admin/accounts/${s.id}`}
                    className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-sm hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.name}</p>
                      <p className="truncate text-xs text-muted-foreground">/{s.slug}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {format(s.createdAt, "d MMM")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 font-semibold">Recent platform activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, index) => (
                  <div
                    key={`${item.entity}-${item.createdAt.toISOString()}-${index}`}
                    className="border-b pb-3 last:border-b-0 last:pb-0"
                  >
                    <p className="text-sm">
                      <span className="font-medium capitalize">
                        {item.entity} {item.action.replace("_", " ")}
                      </span>{" "}
                      <span className="text-muted-foreground">· {item.businessName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(item.createdAt, "d MMM, h:mm a")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-50/60 p-4">
            <div className="flex items-center gap-2 text-amber-900">
              <Users className="size-4" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-wider">Total users</p>
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight text-amber-950">
              {Number(totalUsers).toLocaleString()}
            </p>
            <p className="text-xs text-amber-900/70">
              Across all tenants (owners + staff)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
