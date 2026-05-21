import { NextRequest } from "next/server";
import { GET as getAvailability } from "@/app/api/availability/route";

export async function GET(req: NextRequest) {
  return getAvailability(req);
}
