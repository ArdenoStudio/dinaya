import { format } from "date-fns";
import { Gift } from "lucide-react";
import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import {
  getRecentReferralSignups,
  getReferralSummary,
  getReferralTotals,
} from "@/lib/admin-referrals";

export const dynamic = "force-dynamic";

export default async function AdminReferralsPage() {
  await requirePlatformAdmin();

  const [totals, summary, recent] = await Promise.all([
    getReferralTotals(),
    getReferralSummary(),
    getRecentReferralSignups(50),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Gift className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-cal text-3xl tracking-tight">Referral reporting</h1>
            <p className="text-sm text-muted-foreground">
              Track businesses referred by existing tenants through referral codes at signup.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-xs text-muted-foreground">Referred signups</p>
          <p className="mt-1 text-2xl font-bold">{totals.referredBusinesses}</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-xs text-muted-foreground">Active referrers</p>
          <p className="mt-1 text-2xl font-bold">{totals.activeReferrers}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-white">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Top referrers</h2>
        </div>
        {summary.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted-foreground">No referred signups yet.</p>
        ) : (
          <div className="divide-y">
            {summary.map((row) => (
              <div key={row.referrerId} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <div>
                  <Link href={`/admin/accounts/${row.referrerId}`} className="font-medium hover:underline">
                    {row.referrerName}
                  </Link>
                  <p className="text-xs text-muted-foreground">{row.referrerSlug}.dinaya.lk</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {row.referralCount} referral{row.referralCount === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-white">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Recent referred signups</h2>
        </div>
        {recent.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted-foreground">No referred signups yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Referred by</th>
                  <th className="px-4 py-3">Signed up</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recent.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/accounts/${row.id}`} className="font-medium hover:underline">
                        {row.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{row.slug}.dinaya.lk</p>
                    </td>
                    <td className="px-4 py-3 capitalize">{row.plan}</td>
                    <td className="px-4 py-3">{row.referrerName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(row.createdAt, "d MMM yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
