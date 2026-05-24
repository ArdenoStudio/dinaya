import type { ReferencePage } from "../types";
import { planLimitsReference } from "./plan-limits";

export const allReferences: ReferencePage[] = [planLimitsReference];

export const referencesBySlug = Object.fromEntries(
  allReferences.map((r) => [r.slug, r]),
) as Record<string, ReferencePage>;
