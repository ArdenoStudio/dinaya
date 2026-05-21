import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { requireApiBusiness } from "@/lib/api-auth";
import { PlanRequiredError, requirePro } from "@/lib/plan";
import { withApiHandler } from "@/lib/api-handler";
import { z } from "@/lib/validation";

const domainSchema = z.object({
  customDomain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, "Enter a valid domain like book.yoursalon.lk")
    .optional()
    .nullable(),
  verify: z.boolean().optional(),
});

function normalizeDomain(value: string): string {
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/")[0] ?? value;
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  return withApiHandler(async () => {
    try {
      await requirePro(businessId, "publicBookingPageCustomization");
    } catch (error) {
      if (error instanceof PlanRequiredError) {
        return NextResponse.json({ error: error.message }, { status: 402 });
      }
      throw error;
    }

    const parsed = domainSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Please check the domain." }, { status: 400 });
    }

    if (parsed.data.verify) {
      const [business] = await db
        .select({ customDomain: businesses.customDomain })
        .from(businesses)
        .where(eq(businesses.id, businessId))
        .limit(1);
      if (!business?.customDomain) {
        return NextResponse.json({ error: "Save a custom domain before verifying." }, { status: 400 });
      }
      await db
        .update(businesses)
        .set({ customDomainVerified: true })
        .where(eq(businesses.id, businessId));
      return NextResponse.json({ success: true, customDomainVerified: true });
    }

    const customDomain = parsed.data.customDomain
      ? normalizeDomain(parsed.data.customDomain)
      : null;

    await db
      .update(businesses)
      .set({
        customDomain,
        customDomainVerified: false,
      })
      .where(eq(businesses.id, businessId));

    return NextResponse.json({ success: true, customDomain, customDomainVerified: false });
  }, "Unable to update custom domain.");
}
