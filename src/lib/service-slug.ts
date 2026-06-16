import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { services } from "@/db/schema";

const MAX_SLUG_LENGTH = 72;

export function slugifyServiceName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);

  return base || "service";
}

/** Allocate a unique slug within a business. */
export async function allocateServiceSlug(
  businessId: string,
  name: string,
  excludeServiceId?: string,
): Promise<string> {
  const base = slugifyServiceName(name);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const conditions = [eq(services.businessId, businessId), eq(services.slug, candidate)];
    if (excludeServiceId) {
      conditions.push(ne(services.id, excludeServiceId));
    }

    const [existing] = await db
      .select({ id: services.id })
      .from(services)
      .where(and(...conditions))
      .limit(1);

    if (!existing) return candidate;

    const suffixPart = `-${suffix}`;
    candidate = `${base.slice(0, MAX_SLUG_LENGTH - suffixPart.length)}${suffixPart}`;
    suffix += 1;
  }
}

export function resolveServiceSlug(service: { slug: string | null; name: string; id: string }): string {
  return service.slug ?? (slugifyServiceName(service.name) || service.id.slice(0, 8));
}
