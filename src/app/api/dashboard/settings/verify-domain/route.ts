import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { requireApiBusiness } from "@/lib/api-auth";
import { verifyCustomDomainDns } from "@/lib/custom-domains";
import { PlanRequiredError, requirePro } from "@/lib/plan";

export async function POST() {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;

  try {
    await requirePro(authResult.context.businessId, "publicBookingPageCustomization");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json(
        { error: "Custom domains are available on Pro." },
        { status: 402 },
      );
    }
    throw error;
  }

  const [business] = await db
    .select({
      slug: businesses.slug,
      customDomain: businesses.customDomain,
    })
    .from(businesses)
    .where(eq(businesses.id, authResult.context.businessId))
    .limit(1);

  if (!business?.customDomain) {
    return NextResponse.json({ error: "Add a custom domain before verifying." }, { status: 400 });
  }

  const verification = await verifyCustomDomainDns(business.customDomain, business.slug);
  if (!verification.ok) {
    return NextResponse.json({
      ok: false,
      expectedTarget: verification.expectedTarget,
      records: verification.records,
      error: `Point a CNAME to ${verification.expectedTarget}, or add a TXT record with dinaya-verify=${business.slug}.`,
    });
  }

  await db
    .update(businesses)
    .set({ customDomainVerifiedAt: new Date() })
    .where(eq(businesses.id, authResult.context.businessId));

  return NextResponse.json({
    ok: true,
    verifiedAt: new Date().toISOString(),
    domain: business.customDomain,
  });
}
