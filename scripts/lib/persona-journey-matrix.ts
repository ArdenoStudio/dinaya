/**
 * Plan-aware expectations for persona API journey tests.
 * Uses the same entitlements as production (src/lib/plan.ts).
 */
import {
  canUseFeature,
  getEffectiveEntitlements,
  type Plan,
  type PlanFeature,
} from "@/lib/plan";
import type { PersonaPlan, PersonaRecord } from "./persona-seed-core";

export type PersonaPlanTier = PersonaPlan;

export function toPlan(plan: PersonaPlan): Plan {
  return plan;
}

export function hasProFeatures(plan: PersonaPlan): boolean {
  return canUseFeature(toPlan(plan), "automations");
}

export function hasGrowthFeatures(plan: PersonaPlan): boolean {
  return canUseFeature(toPlan(plan), "aiBookingAutopilot");
}

export function statusMatches(actual: number, expected: number | number[]): boolean {
  return Array.isArray(expected) ? expected.includes(actual) : actual === expected;
}

export type ApiProbe = {
  id: string;
  method: "GET" | "POST" | "PATCH";
  path: string;
  buildPath?: (persona: PersonaRecord) => string;
  body?: Record<string, unknown>;
  expectedStatus: (plan: PersonaPlan) => number | number[];
};

/** Ungated dashboard reads — every active plan should return 200. */
export const UNGATED_READ_PROBES: ApiProbe[] = [
  { id: "read_bookings", method: "GET", path: "/api/dashboard/bookings", expectedStatus: () => 200 },
  { id: "read_clients", method: "GET", path: "/api/dashboard/clients", expectedStatus: () => 200 },
  { id: "read_services", method: "GET", path: "/api/dashboard/services", expectedStatus: () => 200 },
  { id: "read_staff", method: "GET", path: "/api/dashboard/staff", expectedStatus: () => 200 },
  { id: "read_locations", method: "GET", path: "/api/dashboard/locations", expectedStatus: () => 200 },
  {
    id: "read_availability",
    method: "GET",
    path: "/api/dashboard/availability",
    buildPath: (persona) => `/api/dashboard/availability?staffId=${persona.staffId}`,
    expectedStatus: () => 200,
  },
  { id: "read_reviews", method: "GET", path: "/api/dashboard/reviews", expectedStatus: () => 200 },
  { id: "read_onboarding", method: "GET", path: "/api/dashboard/onboarding", expectedStatus: () => 200 },
  {
    id: "read_deal_suggestions",
    method: "GET",
    path: "/api/dashboard/deals/suggestions",
    expectedStatus: () => 200,
  },
];

/** Pro-gated reads — Starter blocked; Trial/Pro/Growth allowed. */
export const PRO_READ_PROBES: ApiProbe[] = [
  {
    id: "read_export",
    method: "GET",
    path: "/api/dashboard/export",
    expectedStatus: (plan) => (hasProFeatures(plan) ? 200 : 402),
  },
  {
    id: "read_webhooks",
    method: "GET",
    path: "/api/dashboard/webhooks",
    expectedStatus: (plan) => (hasProFeatures(plan) ? 200 : 402),
  },
  {
    id: "read_automations",
    method: "GET",
    path: "/api/dashboard/automations",
    expectedStatus: (plan) => (hasProFeatures(plan) ? 200 : 402),
  },
  {
    id: "read_deals",
    method: "GET",
    path: "/api/dashboard/deals",
    expectedStatus: (plan) => (hasProFeatures(plan) ? 200 : 402),
  },
];

/** Growth-gated reads — only Growth (max) gets 200. */
export const GROWTH_READ_PROBES: ApiProbe[] = [
  {
    id: "read_ai_runs",
    method: "GET",
    path: "/api/dashboard/ai/runs",
    expectedStatus: (plan) => (hasGrowthFeatures(plan) ? 200 : 402),
  },
  {
    id: "read_ai_content",
    method: "GET",
    path: "/api/dashboard/ai/content",
    expectedStatus: (plan) => (hasGrowthFeatures(plan) ? 200 : 402),
  },
  {
    id: "read_voice",
    method: "GET",
    path: "/api/dashboard/voice-receptionist",
    expectedStatus: () => 200,
  },
];

/** POST probes that should fail with 402 when plan lacks the feature (gate before validation). */
export const NEGATIVE_POST_PROBES: ApiProbe[] = [
  {
    id: "post_automations",
    method: "POST",
    path: "/api/dashboard/automations",
    body: { name: "E2E", trigger: "booking.created", actions: {} },
    expectedStatus: (plan) => (hasProFeatures(plan) ? [201, 400] : 402),
  },
  {
    id: "post_webhooks",
    method: "POST",
    path: "/api/dashboard/webhooks",
    body: {
      url: "https://example.com/hook",
      events: ["booking.created"],
      secret: "0123456789abcdef",
    },
    expectedStatus: (plan) => (hasProFeatures(plan) ? [201, 400] : 402),
  },
  {
    id: "post_deals",
    method: "POST",
    path: "/api/dashboard/deals",
    body: {},
    expectedStatus: (plan) => (hasProFeatures(plan) ? [400, 201] : 402),
  },
  {
    id: "post_broadcasts",
    method: "POST",
    path: "/api/dashboard/broadcasts",
    body: { message: "Hello", audienceStage: "active" },
    expectedStatus: (plan) => (hasProFeatures(plan) ? [400, 201] : 402),
  },
  {
    id: "post_ai_content",
    method: "POST",
    path: "/api/dashboard/ai/content",
    body: {},
    expectedStatus: (plan) =>
      hasGrowthFeatures(plan) ? [200, 201, 400, 429] : 402,
  },
];

export const DASHBOARD_PAGE_PROBES: { id: string; path: string; heading: RegExp }[] = [
  { id: "page_overview", path: "/dashboard", heading: /Good day/i },
  { id: "page_calendar", path: "/dashboard/calendar", heading: /Calendar/i },
  { id: "page_bookings", path: "/dashboard/bookings", heading: /Bookings/i },
  { id: "page_clients", path: "/dashboard/clients", heading: /Clients/i },
  { id: "page_services", path: "/dashboard/services", heading: /Services/i },
  { id: "page_availability", path: "/dashboard/availability", heading: /Availability/i },
  { id: "page_billing", path: "/dashboard/billing", heading: /Billing/i },
];

export function locationLimit(plan: PersonaPlan): number | null {
  return getEffectiveEntitlements(toPlan(plan)).limits.locations;
}

export function staffLimit(plan: PersonaPlan): number | null {
  return getEffectiveEntitlements(toPlan(plan)).limits.staff;
}

export function featureAllowed(plan: PersonaPlan, feature: PlanFeature): boolean {
  return canUseFeature(toPlan(plan), feature);
}

export const RICH_PERSONA_INTERVAL = 50;

export function isRichPersonaIndex(index: number): boolean {
  return index % RICH_PERSONA_INTERVAL === 0;
}
