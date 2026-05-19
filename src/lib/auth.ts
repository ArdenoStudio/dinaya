import { auth } from "@/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

const SIGN_IN_PATH = "/auth/signin";

export type BusinessContext = {
  business: typeof businesses.$inferSelect;
  businessId: string;
  role: "owner" | "staff";
  user: {
    email?: string | null;
    id: string;
    name?: string | null;
  };
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
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) {
    return null;
  }

  return {
    business,
    businessId,
    role,
    user: {
      email: session.user.email,
      id: userId,
      name: session.user.name,
    },
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
