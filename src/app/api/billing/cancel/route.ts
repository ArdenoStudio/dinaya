import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { cancelPayhereSubscription } from "@/lib/payhere-subscriptions";

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as { businessId: string }).businessId;

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(and(
      eq(subscriptions.businessId, businessId),
      inArray(subscriptions.status, ["active", "past_due"]),
    ))
    .limit(1);

  if (!sub) {
    return NextResponse.json({ error: "No active subscription to cancel." }, { status: 404 });
  }

  if (!sub.payhereSubscriptionId) {
    // Hasn't been activated by PayHere yet — just mark cancelled locally.
    await db
      .update(subscriptions)
      .set({ status: "cancelled", cancelledAt: new Date() })
      .where(eq(subscriptions.id, sub.id));
    return NextResponse.json({ success: true, note: "Cancelled before activation." });
  }

  try {
    await cancelPayhereSubscription(sub.payhereSubscriptionId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cancel failed." },
      { status: 502 },
    );
  }

  await db
    .update(subscriptions)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(eq(subscriptions.id, sub.id));

  // The plan stays "pro" until currentPeriodEnd (handled by the webhook on expiry).
  return NextResponse.json({ success: true });
}
