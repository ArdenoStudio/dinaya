import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, isNull, lt } from "drizzle-orm";
import { subDays } from "date-fns";
import { db } from "@/db";
import { bookings, businesses, platformEvents, users } from "@/db/schema";
import { buildPublicBookingUrl } from "@/lib/booking-url";
import { captureException } from "@/lib/monitoring";
import { trackPlatformEvent } from "@/lib/platform-events";
import { sendOnboardingNudgeEmail } from "@/lib/resend";

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 });
  }

  if (req.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const candidates = await db
    .select({
      businessId: businesses.id,
      businessName: businesses.name,
      createdAt: businesses.createdAt,
      customDomain: businesses.customDomain,
      customDomainVerified: businesses.customDomainVerified,
      ownerEmail: users.email,
      ownerName: users.name,
      slug: businesses.slug,
    })
    .from(businesses)
    .innerJoin(users, and(eq(users.businessId, businesses.id), eq(users.role, "owner")))
    .where(
      and(
        eq(businesses.isSuspended, false),
        isNull(businesses.deletedAt),
        lt(businesses.createdAt, subDays(now, 3)),
      ),
    )
    .limit(100);

  let checked = 0;
  let sent = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    checked++;

    const [{ bookingCount }] = await db
      .select({ bookingCount: count() })
      .from(bookings)
      .where(eq(bookings.businessId, candidate.businessId));

    if (Number(bookingCount) > 0) {
      skipped++;
      continue;
    }

    const [{ nudgeCount }] = await db
      .select({ nudgeCount: count() })
      .from(platformEvents)
      .where(and(eq(platformEvents.businessId, candidate.businessId), eq(platformEvents.event, "activation.nudge_sent")));

    const sentCount = Number(nudgeCount);
    const milestoneDay = candidate.createdAt <= subDays(now, 7) ? 7 : 3;
    if (sentCount >= 2 || (sentCount >= 1 && milestoneDay === 3)) {
      skipped++;
      continue;
    }

    const bookingUrl = buildPublicBookingUrl({
      slug: candidate.slug,
      customDomain: candidate.customDomain,
      customDomainVerified: candidate.customDomainVerified,
    });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

    try {
      await sendOnboardingNudgeEmail({
        bookingUrl,
        businessName: candidate.businessName,
        email: candidate.ownerEmail,
        milestoneDay,
        name: candidate.ownerName,
        nextStepUrl: `${appUrl.replace(/\/$/, "")}/dashboard`,
      });
      await trackPlatformEvent({
        businessId: candidate.businessId,
        event: "activation.nudge_sent",
        props: {
          milestoneDay,
          nudgeNumber: sentCount + 1,
        },
      });
      sent++;
    } catch (error) {
      skipped++;
      await captureException(error, {
        businessId: candidate.businessId,
        component: "onboarding-nudges-cron",
        extra: { milestoneDay },
      });
    }
  }

  return NextResponse.json({ checked, sent, skipped });
}
