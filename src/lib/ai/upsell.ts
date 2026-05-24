import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { services } from "@/db/schema";

export type UpsellRecommendation = {
  serviceId: string;
  name: string;
  priceLkr: number;
  reason: string;
};

type ServiceCandidate = {
  id: string;
  name: string;
  priceLkr: number;
  durationMinutes: number;
};

export function selectUpsellRecommendation(
  base: ServiceCandidate,
  candidates: ServiceCandidate[],
): UpsellRecommendation | null {
  const upgrade = candidates
    .filter((service) => service.priceLkr > base.priceLkr)
    .sort((a, b) => a.priceLkr - b.priceLkr)[0];

  if (upgrade) {
    return {
      serviceId: upgrade.id,
      name: upgrade.name,
      priceLkr: upgrade.priceLkr,
      reason: `A popular upgrade from ${base.name}.`,
    };
  }

  const addOn = [...candidates].sort((a, b) => a.durationMinutes - b.durationMinutes)[0];
  if (!addOn) return null;
  return {
    serviceId: addOn.id,
    name: addOn.name,
    priceLkr: addOn.priceLkr,
    reason: `Pairs well with ${base.name}.`,
  };
}

export async function getUpsellRecommendation(input: {
  businessId: string;
  serviceId: string;
}): Promise<UpsellRecommendation | null> {
  const [base] = await db
    .select({
      id: services.id,
      name: services.name,
      priceLkr: services.priceLkr,
      durationMinutes: services.durationMinutes,
    })
    .from(services)
    .where(and(
      eq(services.id, input.serviceId),
      eq(services.businessId, input.businessId),
      eq(services.isActive, true),
    ))
    .limit(1);

  if (!base) return null;

  const candidates = await db
    .select({
      id: services.id,
      name: services.name,
      priceLkr: services.priceLkr,
      durationMinutes: services.durationMinutes,
    })
    .from(services)
    .where(and(
      eq(services.businessId, input.businessId),
      eq(services.isActive, true),
      ne(services.id, base.id),
    ))
    .orderBy(asc(services.priceLkr))

  return selectUpsellRecommendation(base, candidates);
}
