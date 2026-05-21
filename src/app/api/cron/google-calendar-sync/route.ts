import { NextResponse } from "next/server";
import { syncGoogleCalendarBookings } from "@/lib/google-calendar-sync";

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const synced = await syncGoogleCalendarBookings();
  return NextResponse.json({ ok: true, synced });
}
