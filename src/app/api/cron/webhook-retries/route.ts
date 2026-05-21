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

  const retried = await retryDueWebhookDeliveries();
  return NextResponse.json({ retried });
}
