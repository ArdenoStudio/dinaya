import { NextRequest, NextResponse } from "next/server";
import { hasApiKeyAuth, requireApiKey } from "@/lib/api-key-auth";
import { POST as createBooking } from "@/app/api/bookings/route";

export async function POST(req: NextRequest) {
  if (!hasApiKeyAuth(req)) {
    return NextResponse.json({ error: "API key required" }, { status: 401 });
  }
  const keyResult = await requireApiKey(req, "bookings:write");
  if (!keyResult.ok) return keyResult.response;
  return createBooking(req);
}
