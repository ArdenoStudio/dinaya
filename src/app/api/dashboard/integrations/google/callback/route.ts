import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { socialConnections } from "@/db/schema";
import { exchangeGoogleCode, GOOGLE_PROVIDER } from "@/lib/google-calendar";
import { verifyGoogleOAuthState } from "@/lib/google-oauth-state";
import { encryptSecret } from "@/lib/secrets";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? req.nextUrl.origin;

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings/integrations?google=error`);
  }

  const statePayload = verifyGoogleOAuthState(state);
  if (!statePayload) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings/integrations?google=error`);
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
    return NextResponse.redirect(`${appUrl}/dashboard/settings/integrations?google=error`);
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

    return NextResponse.redirect(`${appUrl}/dashboard/settings/integrations?google=connected`);
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/settings/integrations?google=error`);
  }
}
