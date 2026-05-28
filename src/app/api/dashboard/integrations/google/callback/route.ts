import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { socialConnections } from "@/db/schema";
import { exchangeGoogleCode, GOOGLE_PROVIDER } from "@/lib/google-calendar";
import { verifyGoogleOAuthState } from "@/lib/google-oauth-state";
import { encryptSecret } from "@/lib/secrets";

function appUrlFor(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? req.nextUrl.origin;
}

function integrationRedirect(req: NextRequest, status: "connected" | "error") {
  return NextResponse.redirect(
    `${appUrlFor(req)}/dashboard/settings/integrations?google=${status}`,
  );
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

function renderPostBridge(req: NextRequest, code: string, state: string): Response {
  const actionUrl = `${appUrlFor(req)}/api/dashboard/integrations/google/callback`;
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Connecting Google Calendar</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><form method="post" action="${escapeHtml(actionUrl)}"><input type="hidden" name="code" value="${escapeHtml(code)}"><input type="hidden" name="state" value="${escapeHtml(state)}"><noscript><button type="submit">Continue</button></noscript></form><script>document.forms[0].submit();</script></body></html>`,
    {
      headers: {
        "Cache-Control": "no-store",
        "Content-Security-Policy":
          "default-src 'none'; script-src 'unsafe-inline'; form-action 'self'; base-uri 'none'",
        "Content-Type": "text/html; charset=utf-8",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return integrationRedirect(req, "error");
  }

  return renderPostBridge(req, code, state);
}

async function completeGoogleOAuth(req: NextRequest, code: string | null, state: string | null) {
  if (!code || !state) {
    return integrationRedirect(req, "error");
  }

  const statePayload = verifyGoogleOAuthState(state);
  if (!statePayload) {
    return integrationRedirect(req, "error");
  }

  const session = await auth();
  const businessId = session?.user?.businessId;
  const userId = session?.user?.id;
  const role = session?.user?.role;

  if (
    !businessId ||
    !userId ||
    role !== "owner" ||
    businessId !== statePayload.businessId ||
    userId !== statePayload.userId
  ) {
    return integrationRedirect(req, "error");
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    const refreshTokenEncrypted = tokens.refreshToken
      ? encryptSecret(tokens.refreshToken)
      : null;
    const accessTokenEncrypted = encryptSecret(tokens.accessToken);
    const meta = refreshTokenEncrypted ? { refreshTokenEncrypted } : {};

    const [existing] = await db
      .select({ id: socialConnections.id })
      .from(socialConnections)
      .where(
        and(
          eq(socialConnections.businessId, businessId),
          eq(socialConnections.provider, GOOGLE_PROVIDER),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(socialConnections)
        .set({
          accessTokenEncrypted,
          isActive: true,
          meta,
          updatedAt: new Date(),
        })
        .where(eq(socialConnections.id, existing.id));
    } else {
      await db.insert(socialConnections).values({
        businessId,
        provider: GOOGLE_PROVIDER,
        accountName: "Google Calendar",
        accessTokenEncrypted,
        isActive: true,
        meta,
      });
    }

    return integrationRedirect(req, "connected");
  } catch {
    return integrationRedirect(req, "error");
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const code = String(formData.get("code") ?? "");
  const state = String(formData.get("state") ?? "");
  return completeGoogleOAuth(req, code, state);
}
