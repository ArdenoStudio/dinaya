import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyRecurringWebhook } from "@/lib/payhere-subscriptions";
import { payhereAmountMatches } from "@/lib/payhere";
import { addMonths, addYears } from "date-fns";

// PayHere status codes:
//   2  = success (initial or renewal payment captured)
//   0  = pending
//  -1  = cancelled (by us via API, or by customer)
//  -2  = failed
//  -3  = chargedback

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const merchantId = String(form.get("merchant_id") ?? "");
  const orderId = String(form.get("order_id") ?? "");
  const payhereAmount = String(form.get("payhere_amount") ?? "");
  const payhereCurrency = String(form.get("payhere_currency") ?? "");
  const statusCode = String(form.get("status_code") ?? "");
  const md5sig = String(form.get("md5sig") ?? "");
  const subscriptionId = form.get("subscription_id")
    ? String(form.get("subscription_id"))
    : null;
  const paymentId = form.get("payment_id")
    ? String(form.get("payment_id"))
    : null;

  if (!merchantId || !orderId || !payhereAmount || !payhereCurrency || !statusCode || !md5sig) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const merchantSecret = process.env.DINAYA_PAYHERE_MERCHANT_SECRET;
  if (!merchantSecret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const platformMerchantId = process.env.DINAYA_PAYHERE_MERCHANT_ID;
  if (platformMerchantId && platformMerchantId !== merchantId) {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }

  const valid = verifyRecurringWebhook({
    merchantId,
    orderId,
    payhereAmount,
    payhereCurrency,
    statusCode,
    md5sig,
    merchantSecret,
  });
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.payhereOrderId, orderId))
    .limit(1);

  if (!sub) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  switch (statusCode) {
    case "2": {
      // Recurring charges reuse the same order_id, so dedupe on PayHere's
      // per-charge payment_id. A time-window heuristic would wrongly treat a
      // renewal that arrives while the current period is still active as a
      // duplicate and silently drop it. Fall back to the time heuristic only
      // when no payment_id is present on the notification.
      const isDuplicate = paymentId
        ? paymentId === sub.lastPaymentId
        : sub.status === "active" &&
          !!sub.currentPeriodEnd &&
          sub.currentPeriodEnd > new Date();
      if (isDuplicate) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      if (
        payhereCurrency !== "LKR" ||
        !payhereAmountMatches(sub.amountLkr, payhereAmount)
      ) {
        return NextResponse.json({ error: "Invalid webhook amount" }, { status: 400 });
      }

      const anchor =
        sub.currentPeriodEnd && sub.currentPeriodEnd > new Date()
          ? sub.currentPeriodEnd
          : new Date();
      const periodEnd =
        sub.billingInterval === "annual"
          ? addYears(anchor, 1)
          : addMonths(anchor, 1);

      await db
        .update(subscriptions)
        .set({
          status: "active",
          payhereSubscriptionId: subscriptionId ?? sub.payhereSubscriptionId,
          currentPeriodEnd: periodEnd,
          lastPaymentId: paymentId ?? sub.lastPaymentId,
        })
        .where(eq(subscriptions.id, sub.id));

      await db
        .update(businesses)
        .set({ plan: sub.plan, planExpiresAt: periodEnd })
        .where(eq(businesses.id, sub.businessId));
      break;
    }
    case "-1": {
      const cancelledAt = new Date();

      await db
        .update(subscriptions)
        .set({ status: "cancelled", cancelledAt })
        .where(eq(subscriptions.id, sub.id));

      if (sub.currentPeriodEnd) {
        await db
          .update(businesses)
          .set({ plan: sub.plan, planExpiresAt: sub.currentPeriodEnd })
          .where(eq(businesses.id, sub.businessId));
      } else {
        await db
          .update(businesses)
          .set({ plan: "expired", planExpiresAt: null })
          .where(eq(businesses.id, sub.businessId));
      }

      break;
    }
    case "-2": {
      await db
        .update(subscriptions)
        .set({ status: "past_due" })
        .where(eq(subscriptions.id, sub.id));
      break;
    }
    case "-3": {
      await db
        .update(subscriptions)
        .set({ status: "ended", cancelledAt: new Date() })
        .where(eq(subscriptions.id, sub.id));
      await db
        .update(businesses)
        .set({ plan: "expired", planExpiresAt: null })
        .where(eq(businesses.id, sub.businessId));
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ ok: true });
}
