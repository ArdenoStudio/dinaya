import { NextResponse, type NextRequest } from "next/server";

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/icon", request.url), 308);
}
