import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { socialConnections } from "@/db/schema";
import { requireApiBusiness } from "@/lib/api-auth";
import {
  GOOGLE_PROVIDER,
  buildGoogleAuthUrl,
  googleOAuthConfigured,
} from "@/lib/google-calendar";
import { createGoogleOAuthState } from "@/lib/google-oauth-state";
import { PlanRequiredError, requirePro } from "@/lib/plan";

export async function GET() {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  if (!googleOAuthConfigured()) {
    return NextResponse.json({ error: "Google OAuth is not configured." }, { status: 503 });
  }

  try {
    await requirePro(businessId, "googleCalendarSync");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }

  const state = createGoogleOAuthState(businessId);
  return NextResponse.redirect(buildGoogleAuthUrl(state));
}

export async function DELETE() {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  await db
    .delete(socialConnections)
    .where(
      and(
        eq(socialConnections.businessId, businessId),
        eq(socialConnections.provider, GOOGLE_PROVIDER),
      ),
    );

  return NextResponse.json({ success: true });
}
