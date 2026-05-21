import { auth } from "@/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { resolveEffectivePlan } from "@/lib/plan";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

const SIGN_IN_PATH = "/auth/signin";

export type BusinessContext = {
  business: {
    id: string;
    name: string;
    plan: "free" | "pro" | "max";
    slug: string;
  };
  businessId: string;
  role: "owner" | "staff";
  user: {
    email?: string | null;
    id: string;
    name?: string | null;
  };
  readOnlyImpersonation?: boolean;
  impersonatedBy?: string;
};

export async function getBusinessContext(): Promise<BusinessContext | null> {
  const session = await auth();
  const businessId = session?.user?.businessId;
  const userId = session?.user?.id;
  const role = session?.user?.role;

  if (!businessId || !userId || !role) {
    return null;
  }

  const [business] = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      plan: businesses.plan,
      planExpiresAt: businesses.planExpiresAt,
      slug: businesses.slug,
      isSuspended: businesses.isSuspended,
      deletedAt: businesses.deletedAt,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business || business.isSuspended || business.deletedAt) {
    return null;
  }

  const effectivePlan = resolveEffectivePlan({
    storedPlan: business.plan,
    planExpiresAt: business.planExpiresAt,
  });

  return {
    business: {
      id: business.id,
      name: business.name,
      plan: effectivePlan,
      slug: business.slug,
    },
    businessId,
    role,
    user: {
      email: session.user.email,
      id: userId,
      name: session.user.name,
    },
    readOnlyImpersonation: session.user.readOnlyImpersonation,
    impersonatedBy: session.user.impersonatedBy,
  };
}

export async function requireBusiness(): Promise<BusinessContext> {
  const context = await getBusinessContext();

  if (!context) {
    redirect(SIGN_IN_PATH);
  }

  return context;
}

export async function requireOwner(): Promise<BusinessContext> {
  const context = await requireBusiness();

  if (context.role !== "owner") {
    redirect("/dashboard");
  }

  return context;
}

export function getSignInPath(): string {
  return SIGN_IN_PATH;
}
