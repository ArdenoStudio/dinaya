import { handlers } from "@/auth";
import type { NextRequest } from "next/server";
import {
  CREDENTIALS_EMAIL_LIMIT,
  CREDENTIALS_IP_LIMIT,
  getCredentialsEmailFromRequest,
  isCredentialsCallbackPath,
} from "@/lib/auth-rate-limit";
import { withRateLimit } from "@/lib/rate-limit";

export const { GET } = handlers;

export async function POST(req: NextRequest): Promise<Response> {
  if (isCredentialsCallbackPath(req.nextUrl.pathname)) {
    const ipLimited = await withRateLimit(req, CREDENTIALS_IP_LIMIT);
    if (!ipLimited.ok) return ipLimited.response;

    const email = await getCredentialsEmailFromRequest(req);
    if (email) {
      const emailLimited = await withRateLimit(req, CREDENTIALS_EMAIL_LIMIT, { keySuffix: email });
      if (!emailLimited.ok) return emailLimited.response;
    }
  }

  return handlers.POST(req);
}
