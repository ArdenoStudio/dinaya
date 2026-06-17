import { NextRequest, NextResponse } from "next/server";
import { expireAbandonedPayhereBookings } from "@/lib/booking-expiry";
import { getCronSecret } from "@/lib/env";

export async function GET(req: NextRequest) {
  const expected = getCronSecret();
  if (!expected) {
    return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await expireAbandonedPayhereBookings();
  return NextResponse.json(result);
}
