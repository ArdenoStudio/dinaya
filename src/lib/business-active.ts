import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses } from "@/db/schema";

export type BusinessActiveStatus = "active" | "suspended" | "deleted" | "not_found";

export async function getBusinessActiveStatus(
  businessId: string,
): Promise<BusinessActiveStatus> {
  const [business] = await db
    .select({
      isSuspended: businesses.isSuspended,
      deletedAt: businesses.deletedAt,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) return "not_found";
  if (business.deletedAt) return "deleted";
  if (business.isSuspended) return "suspended";
  return "active";
}

export function businessInactiveMessage(status: Exclude<BusinessActiveStatus, "active">): string {
  switch (status) {
    case "suspended":
      return "This account has been suspended.";
    case "deleted":
      return "This account is no longer active.";
    case "not_found":
      return "Business not found.";
  }
}
