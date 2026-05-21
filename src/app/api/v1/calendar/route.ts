import { NextRequest } from "next/server";
import { GET as getCalendar } from "@/app/api/calendar/route";

export async function GET(req: NextRequest) {
  return getCalendar(req);
}
