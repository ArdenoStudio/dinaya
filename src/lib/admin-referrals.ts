import { db } from "@/db";
import { businesses } from "@/db/schema";
import { count, desc, eq, isNotNull } from "drizzle-orm";

export type ReferralSummaryRow = {
  referrerId: string;
  referrerName: string;
  referrerSlug: string;
  referralCount: number;
};

export type ReferralSignupRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: Date;
  referrerName: string;
  referrerSlug: string;
};

export async function getReferralSummary(): Promise<ReferralSummaryRow[]> {
  const referred = await db
    .select({
      referrerId: businesses.referredByBusinessId,
      referralCount: count(),
    })
    .from(businesses)
    .where(isNotNull(businesses.referredByBusinessId))
    .groupBy(businesses.referredByBusinessId)
    .orderBy(desc(count()));

  const rows: ReferralSummaryRow[] = [];
  for (const item of referred) {
    if (!item.referrerId) continue;
    const [referrer] = await db
      .select({ id: businesses.id, name: businesses.name, slug: businesses.slug })
      .from(businesses)
      .where(eq(businesses.id, item.referrerId))
      .limit(1);
    if (!referrer) continue;
    rows.push({
      referrerId: referrer.id,
      referrerName: referrer.name,
      referrerSlug: referrer.slug,
      referralCount: Number(item.referralCount),
    });
  }

  return rows.sort((a, b) => b.referralCount - a.referralCount);
}

export async function getRecentReferralSignups(limit = 50): Promise<ReferralSignupRow[]> {
  const referredBusinesses = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      plan: businesses.plan,
      createdAt: businesses.createdAt,
      referredByBusinessId: businesses.referredByBusinessId,
    })
    .from(businesses)
    .where(isNotNull(businesses.referredByBusinessId))
    .orderBy(desc(businesses.createdAt))
    .limit(limit);

  const rows: ReferralSignupRow[] = [];
  for (const business of referredBusinesses) {
    if (!business.referredByBusinessId) continue;
    const [referrer] = await db
      .select({ name: businesses.name, slug: businesses.slug })
      .from(businesses)
      .where(eq(businesses.id, business.referredByBusinessId))
      .limit(1);
    rows.push({
      id: business.id,
      name: business.name,
      slug: business.slug,
      plan: business.plan,
      createdAt: business.createdAt,
      referrerName: referrer?.name ?? "Unknown",
      referrerSlug: referrer?.slug ?? "unknown",
    });
  }

  return rows;
}

export async function getReferralTotals(): Promise<{ referredBusinesses: number; activeReferrers: number }> {
  const [referredRow] = await db
    .select({ referredBusinesses: count() })
    .from(businesses)
    .where(isNotNull(businesses.referredByBusinessId));

  const summary = await getReferralSummary();
  return {
    referredBusinesses: Number(referredRow?.referredBusinesses ?? 0),
    activeReferrers: summary.length,
  };
}
