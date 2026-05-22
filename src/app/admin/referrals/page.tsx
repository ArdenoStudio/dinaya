import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export const dynamic = "force-dynamic";

export default async function AdminReferralsPage() {
  await requirePlatformAdmin();

  type ReferralRow = {
    id: string;
    name: string;
    referral_code: string | null;
    referred_signups: number;
    paid_referrals: number;
  };

  const result = await db.execute(sql`
    select
      referrers.id,
      referrers.name,
      referrers.referral_code,
      count(referred.id)::int as referred_signups,
      count(subscriptions.id) filter (where subscriptions.status in ('active', 'past_due'))::int as paid_referrals
    from businesses referrers
    join businesses referred on referred.referred_by_business_id = referrers.id
    left join subscriptions on subscriptions.business_id = referred.id
    group by referrers.id, referrers.name, referrers.referral_code
    order by referred_signups desc, paid_referrals desc
    limit 50
  `);
  const rows = (Array.isArray(result) ? result : result.rows ?? []) as ReferralRow[];

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
          Platform growth
        </p>
        <h1 className="font-cal text-3xl tracking-tight">Referral incentives</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track tenant-to-tenant referrals and paid conversion before granting Pro credits.
        </p>
      </div>

      <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-5">
        <p className="text-sm font-semibold text-violet-950">Recommended incentive</p>
        <p className="mt-1 text-sm text-violet-900/75">
          Offer one month of Pro credit when a referred business becomes an active paid subscriber. Use this report to approve rewards manually before automating credit fulfillment.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Referrer</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Signups</th>
              <th className="px-4 py-3">Paid referrals</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No referral signups yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/accounts/${row.id}`} className="font-medium text-primary hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.referral_code ?? "-"}</td>
                  <td className="px-4 py-3 tabular-nums">{Number(row.referred_signups)}</td>
                  <td className="px-4 py-3 tabular-nums">{Number(row.paid_referrals)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
