import { and, count, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { businesses } from "@/db/schema";

export type AcquisitionDays = 7 | 30 | 90;

export type AcquisitionKpis = {
  signups: number;
  onboarded: number;
  activated: number;
  paid: number;
  onboardingRate: number;
  activationRate: number;
  paidRate: number;
};

export type AcquisitionSourceRow = {
  source: string;
  count: number;
};

export type AcquisitionCohortRow = {
  weekStart: string;
  signups: number;
  onboardedRate: number;
  activatedRate: number;
};

export type StuckAccountRow = {
  id: string;
  name: string;
  slug: string;
  onboardingStep: number;
  createdAt: Date;
};

export function acquisitionRate(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function rate(part: number, whole: number): number {
  return acquisitionRate(part, whole);
}

function sinceDate(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function getAcquisitionKpis(days: AcquisitionDays): Promise<AcquisitionKpis> {
  const since = sinceDate(days);
  const [row] = await db
    .select({
      signups: count(),
      onboarded: sql<number>`count(${businesses.onboardingCompletedAt})::int`,
      activated: sql<number>`count(${businesses.firstBookingAt})::int`,
      paid: sql<number>`count(*) filter (where ${businesses.plan} in ('pro', 'max'))::int`,
    })
    .from(businesses)
    .where(and(gte(businesses.createdAt, since), isNull(businesses.deletedAt)));

  const signups = Number(row?.signups ?? 0);
  const onboarded = Number(row?.onboarded ?? 0);
  const activated = Number(row?.activated ?? 0);
  const paid = Number(row?.paid ?? 0);

  return {
    signups,
    onboarded,
    activated,
    paid,
    onboardingRate: rate(onboarded, signups),
    activationRate: rate(activated, signups),
    paidRate: rate(paid, signups),
  };
}

export async function getAcquisitionSourceMix(days: AcquisitionDays): Promise<AcquisitionSourceRow[]> {
  const since = sinceDate(days);
  const rows = await db
    .select({
      source: sql<string>`coalesce(${businesses.signupUtmSource}, case when ${businesses.referredByBusinessId} is not null then 'referral' else 'direct' end)`,
      count: count(),
    })
    .from(businesses)
    .where(and(gte(businesses.createdAt, since), isNull(businesses.deletedAt)))
    .groupBy(
      sql`coalesce(${businesses.signupUtmSource}, case when ${businesses.referredByBusinessId} is not null then 'referral' else 'direct' end)`,
    )
    .orderBy(desc(count()));

  return rows.map((row) => ({
    source: row.source || "direct",
    count: Number(row.count),
  }));
}

export async function getAcquisitionCohorts(days: AcquisitionDays): Promise<AcquisitionCohortRow[]> {
  const since = sinceDate(Math.max(days, 56));
  const result = await db.execute(sql`
    SELECT
      to_char(date_trunc('week', created_at), 'YYYY-MM-DD') AS week_start,
      count(*)::int AS signups,
      count(onboarding_completed_at)::int AS onboarded,
      count(first_booking_at)::int AS activated
    FROM businesses
    WHERE created_at >= ${since}
      AND deleted_at IS NULL
    GROUP BY 1
    ORDER BY 1 DESC
    LIMIT 8
  `);

  type CohortSqlRow = {
    week_start: string;
    signups: number;
    onboarded: number;
    activated: number;
  };
  const rows = Array.isArray(result)
    ? (result as CohortSqlRow[])
    : (((result as { rows?: CohortSqlRow[] }).rows) ?? []);

  return rows.map((row) => ({
    weekStart: row.week_start,
    signups: Number(row.signups),
    onboardedRate: rate(Number(row.onboarded), Number(row.signups)),
    activatedRate: rate(Number(row.activated), Number(row.signups)),
  }));
}

export async function getStuckOnboardingAccounts(limit = 50): Promise<StuckAccountRow[]> {
  const cutoff = sinceDate(3);
  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      onboardingStep: businesses.onboardingStep,
      createdAt: businesses.createdAt,
    })
    .from(businesses)
    .where(
      and(
        isNull(businesses.onboardingCompletedAt),
        isNull(businesses.deletedAt),
        lt(businesses.createdAt, cutoff),
      ),
    )
    .orderBy(desc(businesses.createdAt))
    .limit(limit);

  return rows;
}

export async function getBusinessTypeMix(days: AcquisitionDays): Promise<AcquisitionSourceRow[]> {
  const since = sinceDate(days);
  const rows = await db
    .select({
      source: sql<string>`coalesce(${businesses.businessType}, 'unknown')`,
      count: count(),
    })
    .from(businesses)
    .where(and(gte(businesses.createdAt, since), isNull(businesses.deletedAt)))
    .groupBy(sql`coalesce(${businesses.businessType}, 'unknown')`)
    .orderBy(desc(count()));

  return rows.map((row) => ({
    source: row.source,
    count: Number(row.count),
  }));
}

/** Mark first booking once — safe to call on every booking create. */
export async function markFirstBookingAt(businessId: string): Promise<boolean> {
  const updated = await db
    .update(businesses)
    .set({ firstBookingAt: new Date() })
    .where(and(eq(businesses.id, businessId), isNull(businesses.firstBookingAt)))
    .returning({ id: businesses.id });
  return updated.length > 0;
}
