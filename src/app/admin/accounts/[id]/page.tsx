import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { format, subDays } from "date-fns";
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  CreditCard,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  User as UserIcon,
} from "lucide-react";
import { db } from "@/db";
import {
  activityLog,
  bookings,
  businesses,
  clients as clientsTbl,
  payments,
  staff,
  services,
  subscriptions,
  users,
} from "@/db/schema";
import {
  adminBusinessProfileSelect,
  adminSubscriptionHistorySelect,
  safeAdminQuery,
} from "@/lib/admin-db";
import { planDisplayName, type Plan } from "@/lib/plan";
import { formatLkr } from "@/lib/utils";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { AccountModerationPanel } from "./AccountModerationPanel";

export const dynamic = "force-dynamic";

export default async function AdminAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformAdmin();
  const { id } = await params;

  const [biz] = await db
    .select(adminBusinessProfileSelect)
    .from(businesses)
    .where(eq(businesses.id, id))
    .limit(1);

  if (!biz) notFound();

  const last30 = subDays(new Date(), 30);

  const [
    [{ totalBookings }],
    [{ bookings30 }],
    [{ totalClients }],
    [{ staffCount }],
    [{ servicesCount }],
    [{ gmv30 }],
    [{ totalGmv }],
    accountUsers,
    accountSubs,
    recentBookings,
    recentActivity,
  ] = await Promise.all([
    db.select({ totalBookings: count() }).from(bookings).where(eq(bookings.businessId, id)),
    db
      .select({ bookings30: count() })
      .from(bookings)
      .where(and(eq(bookings.businessId, id), gte(bookings.createdAt, last30))),
    db.select({ totalClients: count() }).from(clientsTbl).where(eq(clientsTbl.businessId, id)),
    db.select({ staffCount: count() }).from(staff).where(eq(staff.businessId, id)),
    db.select({ servicesCount: count() }).from(services).where(eq(services.businessId, id)),
    db
      .select({ gmv30: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int` })
      .from(payments)
      .innerJoin(bookings, eq(bookings.id, payments.bookingId))
      .where(
        and(
          eq(bookings.businessId, id),
          eq(payments.status, "success"),
          gte(payments.createdAt, last30)
        )
      ),
    db
      .select({ totalGmv: sql<number>`coalesce(sum(${payments.amountLkr}), 0)::int` })
      .from(payments)
      .innerJoin(bookings, eq(bookings.id, payments.bookingId))
      .where(and(eq(bookings.businessId, id), eq(payments.status, "success"))),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.businessId, id))
      .orderBy(desc(users.createdAt)),
    safeAdminQuery(
      db
        .select(adminSubscriptionHistorySelect)
        .from(subscriptions)
        .where(eq(subscriptions.businessId, id))
        .orderBy(desc(subscriptions.createdAt)),
      [],
    ),
    db
      .select({
        id: bookings.id,
        clientName: bookings.clientName,
        startsAt: bookings.startsAt,
        status: bookings.status,
        serviceName: services.name,
      })
      .from(bookings)
      .innerJoin(services, eq(services.id, bookings.serviceId))
      .where(eq(bookings.businessId, id))
      .orderBy(desc(bookings.createdAt))
      .limit(8),
    db
      .select({
        id: activityLog.id,
        entity: activityLog.entity,
        action: activityLog.action,
        createdAt: activityLog.createdAt,
      })
      .from(activityLog)
      .where(eq(activityLog.businessId, id))
      .orderBy(desc(activityLog.createdAt))
      .limit(10),
  ]);

  const activeSub = accountSubs.find((s) => s.status === "active");

  const kpis = [
    {
      label: "Total bookings",
      value: Number(totalBookings).toLocaleString(),
      sub: `${Number(bookings30)} in last 30d`,
      icon: CalendarCheck,
      accent: "bg-emerald-500",
    },
    {
      label: "GMV (30d)",
      value: formatLkr(Number(gmv30)),
      sub: `${formatLkr(Number(totalGmv))} lifetime`,
      icon: CreditCard,
      accent: "bg-amber-500",
    },
    {
      label: "Clients",
      value: Number(totalClients).toLocaleString(),
      sub: `${Number(staffCount)} staff · ${Number(servicesCount)} services`,
      icon: UserIcon,
      accent: "bg-violet-600",
    },
    {
      label: "Plan",
      value: biz.plan,
      sub: activeSub ? `${formatLkr(activeSub.amountLkr)}/mo` : "No active sub",
      icon: Building2,
      accent: "bg-primary",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/accounts"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" aria-hidden="true" /> All accounts
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-cal text-3xl tracking-tight">{biz.name}</h1>
              <span
                className={
                  biz.plan === "pro"
                    ? "rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-primary"
                    : biz.plan === "starter"
                      ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-700"
                    : biz.plan === "max"
                      ? "rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-700"
                    : "rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground"
                }
              >
                {planDisplayName(biz.plan as Plan)}
              </span>
              {biz.deletedAt && (
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-rose-700">
                  Deleted
                </span>
              )}
              {!biz.deletedAt && biz.isSuspended && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-700">
                  Suspended
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              /{biz.slug} · joined {format(biz.createdAt, "d MMM yyyy")}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={`/book/${biz.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              View booking page <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </div>
        </div>
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
                    <p className="mt-1 text-2xl font-bold capitalize tracking-tight">{kpi.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 font-semibold">Profile</h2>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Business type</dt>
                <dd className="mt-0.5">{biz.businessType ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Timezone</dt>
                <dd className="mt-0.5">{biz.timezone}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="size-3" /> Email
                </dt>
                <dd className="mt-0.5 break-all">{biz.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="size-3" /> Phone
                </dt>
                <dd className="mt-0.5">{biz.phone ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3" /> Address
                </dt>
                <dd className="mt-0.5">{biz.address ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Description</dt>
                <dd className="mt-0.5 text-muted-foreground">{biz.description ?? "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 font-semibold">Subscription history</h2>
            {accountSubs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subscriptions on record.</p>
            ) : (
              <div className="space-y-2">
                {accountSubs.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium capitalize">
                        {s.plan} · {s.status.replace("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(s.createdAt, "d MMM yyyy")} ·{" "}
                        {s.payhereOrderId}
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums">{formatLkr(s.amountLkr)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 font-semibold">Recent bookings</h2>
            {recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <div className="space-y-2">
                {recentBookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{b.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.serviceName} · {format(b.startsAt, "d MMM, h:mm a")}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
                      {b.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 font-semibold">Team ({accountUsers.length})</h2>
            <div className="space-y-2">
              {accountUsers.map((u) => (
                <div key={u.id} className="rounded-md border px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium">{u.name}</p>
                    <span
                      className={
                        u.role === "owner"
                          ? "rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-primary"
                          : "rounded-full bg-muted px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground"
                      }
                    >
                      {u.role}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-4 font-semibold">Recent activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((a) => (
                  <div key={a.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                    <p className="text-sm font-medium capitalize">
                      {a.entity} {a.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(a.createdAt, "d MMM, h:mm a")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <AccountModerationPanel
            businessId={biz.id}
            isSuspended={biz.isSuspended}
            deletedAt={biz.deletedAt ? biz.deletedAt.toISOString() : null}
          />
        </div>
      </div>
    </div>
  );
}
