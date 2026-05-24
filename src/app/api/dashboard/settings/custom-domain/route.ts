import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { requireApiBusiness } from "@/lib/api-auth";
import { withApiHandler } from "@/lib/api-handler";
import {
  expectedVerificationRecord,
  generateDomainVerificationToken,
  verificationHost,
  verifyDomainTxtRecord,
} from "@/lib/custom-domain-dns";
import { isReservedAppDomain, normalizeCustomDomain } from "@/lib/custom-domains";
import { PlanRequiredError, requirePro } from "@/lib/plan";
import {
  removeVercelProjectDomain,
  syncVercelDomain,
  type CustomDomainDnsInstruction,
  type VercelVerificationChallenge,
} from "@/lib/vercel-domains";
import { z } from "@/lib/validation";

const domainSchema = z.object({
  customDomain: z.string().trim().max(255).optional().nullable(),
  verify: z.boolean().optional(),
  check: z.boolean().optional(),
});

type CustomDomainStatus =
  | "none"
  | "pending_dns"
  | "pending_vercel"
  | "active"
  | "misconfigured"
  | "error";

type StoredDomainConfig = {
  dnsInstructions?: CustomDomainDnsInstruction[];
  vercel?: unknown;
};

function ownershipResponse(domain: string | null, token: string | null) {
  return {
    verificationHost: domain && token ? verificationHost(domain) : null,
    verificationValue: token ? expectedVerificationRecord(token) : null,
  };
}

function domainStateResponse(input: {
  customDomain: string | null;
  customDomainVerified: boolean;
  customDomainStatus: string;
  customDomainVerificationToken: string | null;
  customDomainError?: string | null;
  customDomainConfig?: unknown;
  customDomainVerification?: unknown;
}) {
  const config = input.customDomainConfig as StoredDomainConfig | null;
  return {
    success: true,
    customDomain: input.customDomain,
    customDomainVerified: input.customDomainVerified,
    customDomainStatus: input.customDomainStatus,
    customDomainError: input.customDomainError ?? null,
    dnsInstructions: config?.dnsInstructions ?? [],
    vercelVerification: (input.customDomainVerification as VercelVerificationChallenge[] | null) ?? [],
    ...ownershipResponse(input.customDomain, input.customDomainVerificationToken),
  };
}

async function assertDomainAvailable(domain: string, businessId: string): Promise<NextResponse | null> {
  const [existing] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.customDomain, domain), ne(businesses.id, businessId)))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "This domain is already connected to another business." }, { status: 409 });
  }

  return null;
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
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

    if (parsed.data.verify || parsed.data.check) {
      const [business] = await db
        .select({
          customDomain: businesses.customDomain,
          customDomainVerificationToken: businesses.customDomainVerificationToken,
        })
        .from(businesses)
        .where(eq(businesses.id, businessId))
        .limit(1);
      if (!business?.customDomain || !business.customDomainVerificationToken) {
        return NextResponse.json({ error: "Save a custom domain before verifying." }, { status: 400 });
      }

      const verified = await verifyDomainTxtRecord(
        business.customDomain,
        business.customDomainVerificationToken,
      );
      if (!verified) {
        await db
          .update(businesses)
          .set({
            customDomainVerified: false,
            customDomainStatus: "pending_dns",
            customDomainLastCheckedAt: new Date(),
            customDomainError: `Add TXT record on ${verificationHost(business.customDomain)} with value ${expectedVerificationRecord(business.customDomainVerificationToken)}`,
          })
          .where(eq(businesses.id, businessId));

        return NextResponse.json(
          {
            ...domainStateResponse({
              customDomain: business.customDomain,
              customDomainVerified: false,
              customDomainStatus: "pending_dns",
              customDomainVerificationToken: business.customDomainVerificationToken,
            }),
            error: `Add TXT record on ${verificationHost(business.customDomain)} with value ${expectedVerificationRecord(business.customDomainVerificationToken)}`,
          },
          { status: 400 },
        );
      }

      const sync = await syncVercelDomain(business.customDomain);
      const status: CustomDomainStatus = sync.active
        ? "active"
        : sync.status === "error"
          ? "error"
          : "pending_vercel";
      const config: StoredDomainConfig = {
        dnsInstructions: sync.dnsInstructions,
        vercel: sync.config,
      };

      await db
        .update(businesses)
        .set({
          customDomainVerified: sync.active,
          customDomainStatus: status,
          customDomainLastCheckedAt: new Date(),
          customDomainError: sync.error,
          customDomainConfig: config,
          customDomainVerification: sync.verification,
        })
        .where(eq(businesses.id, businessId));

      return NextResponse.json({
        ...domainStateResponse({
          customDomain: business.customDomain,
          customDomainVerified: sync.active,
          customDomainStatus: status,
          customDomainVerificationToken: business.customDomainVerificationToken,
          customDomainError: sync.error,
          customDomainConfig: config,
          customDomainVerification: sync.verification,
        }),
        vercelConfigured: sync.configured,
      });
    }

    const customDomain = parsed.data.customDomain
      ? normalizeCustomDomain(parsed.data.customDomain)
      : null;

    if (parsed.data.customDomain && !customDomain) {
      return NextResponse.json({ error: "Enter a valid domain like book.yoursalon.lk." }, { status: 400 });
    }

    if (customDomain && isReservedAppDomain(customDomain)) {
      return NextResponse.json({ error: "Use the built-in booking subdomain instead of adding a Dinaya domain here." }, { status: 400 });
    }

    if (customDomain) {
      const unavailable = await assertDomainAvailable(customDomain, businessId);
      if (unavailable) return unavailable;
    }

    const [current] = await db
      .select({ customDomain: businesses.customDomain })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    const customDomainVerificationToken = customDomain
      ? generateDomainVerificationToken()
      : null;
    const status: CustomDomainStatus = customDomain ? "pending_dns" : "none";

    await db
      .update(businesses)
      .set({
        customDomain,
        customDomainVerified: false,
        customDomainVerificationToken,
        customDomainStatus: status,
        customDomainLastCheckedAt: null,
        customDomainError: null,
        customDomainConfig: null,
        customDomainVerification: null,
      })
      .where(eq(businesses.id, businessId));

    if (current?.customDomain && current.customDomain !== customDomain) {
      void removeVercelProjectDomain(current.customDomain).then((removed) => {
        if (!removed.ok) {
          console.error("[custom-domain] failed to remove old Vercel domain", removed.message);
        }
      });
    }

    return NextResponse.json(domainStateResponse({
      customDomain,
      customDomainVerified: false,
      customDomainStatus: status,
      customDomainVerificationToken,
    }));
  }, "Unable to update custom domain.");
}
