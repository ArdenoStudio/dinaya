import { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/api-key-auth";
import { GET as getCalendar } from "@/app/api/calendar/route";

export async function GET(req: NextRequest) {
  const keyResult = await requireApiKey(req, "bookings:read");
  if (!keyResult.ok) return keyResult.response;
  return getCalendar(req);
}
