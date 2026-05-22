import Link from "next/link";
import { format, subDays } from "date-fns";
import { and, count, desc, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, businesses, platformEvents, subscriptions } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export const dynamic = "force-dynamic";

async function safe<T>(query: Promise<T>, fallback: T): Promise<T> {
  try {
    return await query;
  } catch {
    return fallback;
  }
}

export default async function AdminAnalyticsPage() {
  await requirePlatformAdmin();

  const now = new Date();
  const last30 = subDays(now, 30);

  const [
    eventCounts,
    recentEvents,
    [{ signups30 }],
    [{ activated14 }],
    [{ firstBookings30 }],
    [{ checkoutStarts30 }],
    [{ paidConversions30 }],
  ] = await Promise.all([
    safe(
      db
        .select({
          event: platformEvents.event,
          total: count(),
        })
        .from(platformEvents)
        .where(gte(platformEvents.createdAt, last30))
        .groupBy(platformEvents.event)
        .orderBy(desc(count()))
        .limit(20),
      [] as { event: string; total: number }[],
    ),
    safe(
      db
        .select({
          businessId: platformEvents.businessId,
          createdAt: platformEvents.createdAt,
          event: platformEvents.event,
          props: platformEvents.props,
        })
        .from(platformEvents)
        .orderBy(desc(platformEvents.createdAt))
        .limit(12),
      [] as { businessId: string | null; createdAt: Date; event: string; props: unknown }[],
    ),
    safe(
      db.select({ signups30: count() }).from(businesses).where(gte(businesses.createdAt, last30)),
      [{ signups30: 0 }] as { signups30: number }[],
    ),
    safe(
      db
        .select({ activated14: sql<number>`count(*)::int` })
        .from(businesses)
        .where(
          and(
            gte(businesses.createdAt, last30),
            sql`exists (
              select 1
              from ${bookings} activation_bookings
              where activation_bookings.business_id = ${businesses.id}
                and activation_bookings.created_at <= ${businesses.createdAt} + interval '14 days'
            )`,
          ),
        ),
      [{ activated14: 0 }] as { activated14: number }[],
    ),
    safe(
      db
        .select({ firstBookings30: count() })
        .from(platformEvents)
        .where(and(gte(platformEvents.createdAt, last30), sql`${platformEvents.event} = 'activation.first_booking'`)),
      [{ firstBookings30: 0 }] as { firstBookings30: number }[],
    ),
    safe(
      db
        .select({ checkoutStarts30: count() })
        .from(platformEvents)
        .where(and(gte(platformEvents.createdAt, last30), sql`${platformEvents.event} in ('billing.checkout_started', 'billing.checkout_created')`)),
      [{ checkoutStarts30: 0 }] as { checkoutStarts30: number }[],
    ),
    safe(
      db
        .select({ paidConversions30: count() })
        .from(subscriptions)
        .where(and(gte(subscriptions.createdAt, last30), sql`${subscriptions.status} in ('active', 'past_due')`)),
      [{ paidConversions30: 0 }] as { paidConversions30: number }[],
    ),
  ]);

  const activationRate = Number(signups30) > 0 ? Math.round((Number(activated14) / Number(signups30)) * 100) : 0;
  const paidConversionRate = Number(signups30) > 0 ? Math.round((Number(paidConversions30) / Number(signups30)) * 100) : 0;

  const funnel = [
    { label: "Signups", value: Number(signups30), sub: "Accounts created in 30d" },
    { label: "Activated", value: Number(activated14), sub: `${activationRate}% got a booking in 14d` },
    { label: "First-booking events", value: Number(firstBookings30), sub: "Instrumented activation events" },
    { label: "Checkout intent", value: Number(checkoutStarts30), sub: "Upgrade checkout started/created" },
    { label: "Paid conversions", value: Number(paidConversions30), sub: `${paidConversionRate}% of 30d signups` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
          Platform analytics · {format(now, "EEEE, MMMM d")}
        </p>
        <h1 className="font-cal text-3xl tracking-tight">Activation and funnel analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track signup, activation, upgrade intent, paid conversion, and platform events.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {funnel.map((item) => (
          <div key={item.label} className="rounded-xl border bg-white p-5">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{item.value.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 font-semibold">Top events (30d)</h2>
          {eventCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No platform events recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {eventCounts.map((item) => (
                <div key={item.event} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span className="font-medium">{item.event}</span>
                  <span className="text-muted-foreground">{Number(item.total).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 font-semibold">Recent event stream</h2>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Events will appear here after users move through the product funnel.</p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((item, index) => (
                <div key={`${item.event}-${item.createdAt.toISOString()}-${index}`} className="border-b pb-3 last:border-b-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{item.event}</p>
                    <p className="text-xs text-muted-foreground">{format(item.createdAt, "d MMM, h:mm a")}</p>
                  </div>
                  {item.businessId ? (
                    <Link href={`/admin/accounts/${item.businessId}`} className="text-xs text-primary hover:underline">
                      View account
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
