import { NextRequest, NextResponse } from "next/server";
import { retryDueWebhookDeliveries } from "@/lib/webhook-retries";

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const retried = await retryDueWebhookDeliveries();
    return NextResponse.json({ retried });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/webhook-retries] unhandled error:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
