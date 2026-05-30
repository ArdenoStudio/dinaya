import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { aiWorkflowRuns, locations } from "@/db/schema";
import {
  approveContentItem,
  generateThirtyDayContentCalendar,
  listContentCalendar,
  publishContentItem,
} from "@/lib/ai/content";
import { runManualReactivation } from "@/lib/ai/workflows";
import { getLocationForBusiness, parseLocationAiConfig, updateLocationAiConfig, type LocationAiConfig } from "@/lib/locations";
import { AI_FEATURES, AI_FEATURE_META, type AiFeatureKey } from "@/lib/plan-features";
import { z } from "@/lib/validation";

export type DashboardAiWorkflowRunDetail = Awaited<ReturnType<typeof getAiWorkflowRunDashboardDetail>>;
export type DashboardAiWorkflowRunsList = Awaited<ReturnType<typeof getAiWorkflowRunsDashboardList>>;
export type DashboardAiHubData = Awaited<ReturnType<typeof getAiHubDashboardData>>;
export type DashboardAiContentAction = "approve" | "publish";
export type DashboardAiWorkflowRunStatusFilter =
  | "all"
  | "completed"
  | "duplicate"
  | "failed"
  | "queued"
  | "sent"
  | "skipped";

export const dashboardAiWorkflowRunStatusFilters = [
  "all",
  "queued",
  "sent",
  "failed",
  "skipped",
  "duplicate",
  "completed",
] as const;

export type DashboardAiWorkflowRunsListOptions = {
  limit?: number;
  q?: string;
  status?: DashboardAiWorkflowRunStatusFilter;
};

export const aiLocationConfigPatchSchema = z.object({
  aiBookingAutopilot: z.boolean().optional(),
  smartReminderSystem: z.boolean().optional(),
  reviewEngine: z.boolean().optional(),
  clientReactivationCampaign: z.boolean().optional(),
  aiUpsellAssistant: z.boolean().optional(),
  aiContentMachine: z.boolean().optional(),
  vipLoyaltySequence: z.boolean().optional(),
  aiDealSuggestions: z.boolean().optional(),
});

export const aiContentRequestSchema = z.object({
  locationId: z.uuid().optional(),
});

export const aiContentActionSchema = z.object({
  action: z.enum(["approve", "publish"]),
});

export const aiReactivationRequestSchema = z.object({
  clientId: z.uuid().optional(),
});

const DEFAULT_AI_RUN_LIMIT = 80;
const MAX_AI_RUN_LIMIT = 150;

function normalizeAiRunLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_AI_RUN_LIMIT;
  return Math.min(MAX_AI_RUN_LIMIT, Math.max(1, Math.round(limit ?? DEFAULT_AI_RUN_LIMIT)));
}

function dateString(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

function normalizeAiConfig(raw: unknown): Record<AiFeatureKey, boolean> {
  const parsed = parseLocationAiConfig(raw);
  return AI_FEATURES.reduce((acc, feature) => {
    acc[feature] = Boolean(parsed[feature]);
    return acc;
  }, {} as Record<AiFeatureKey, boolean>);
}

function serializeContentItem(item: Awaited<ReturnType<typeof listContentCalendar>>[number]) {
  return {
    approvedAt: item.approvedAt?.toISOString() ?? null,
    caption: item.caption,
    channel: item.channel,
    contentDate: item.contentDate,
    createdAt: item.createdAt.toISOString(),
    error: item.error,
    id: item.id,
    locationId: item.locationId,
    meta: item.meta,
    provider: item.provider,
    providerMessageId: item.providerMessageId,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    status: item.status,
    title: item.title,
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function isDashboardAiWorkflowRunStatusFilter(value: string): value is DashboardAiWorkflowRunStatusFilter {
  return dashboardAiWorkflowRunStatusFilters.includes(value as DashboardAiWorkflowRunStatusFilter);
}

export async function getAiWorkflowRunsDashboardList(
  businessId: string,
  options: DashboardAiWorkflowRunsListOptions = {},
) {
  const rows = await db
    .select({
      body: aiWorkflowRuns.body,
      channel: aiWorkflowRuns.channel,
      createdAt: aiWorkflowRuns.createdAt,
      entityId: aiWorkflowRuns.entityId,
      entityType: aiWorkflowRuns.entityType,
      error: aiWorkflowRuns.error,
      executedAt: aiWorkflowRuns.executedAt,
      feature: aiWorkflowRuns.feature,
      id: aiWorkflowRuns.id,
      locationId: locations.id,
      locationName: locations.name,
      provider: aiWorkflowRuns.provider,
      scheduledFor: aiWorkflowRuns.scheduledFor,
      status: aiWorkflowRuns.status,
      subject: aiWorkflowRuns.subject,
      workflowKey: aiWorkflowRuns.workflowKey,
    })
    .from(aiWorkflowRuns)
    .leftJoin(locations, eq(aiWorkflowRuns.locationId, locations.id))
    .where(eq(aiWorkflowRuns.businessId, businessId))
    .orderBy(desc(aiWorkflowRuns.createdAt))
    .limit(MAX_AI_RUN_LIMIT);

  const query = options.q?.trim().toLowerCase() ?? "";
  const status = options.status ?? "all";
  const limit = normalizeAiRunLimit(options.limit);
  const mappedRows = rows.map((row) => ({
    body: row.body,
    channel: row.channel,
    createdAt: row.createdAt.toISOString(),
    entityId: row.entityId,
    entityType: row.entityType,
    error: row.error,
    executedAt: dateString(row.executedAt),
    feature: row.feature,
    id: row.id,
    locationId: row.locationId,
    locationName: row.locationName,
    provider: row.provider,
    scheduledFor: dateString(row.scheduledFor),
    status: row.status,
    subject: row.subject,
    workflowKey: row.workflowKey,
  }));

  const filteredRows = mappedRows.filter((row) => {
    const statusMatch = status === "all" || row.status === status;
    const queryMatch = !query || [
      row.body ?? "",
      row.channel ?? "",
      row.entityType ?? "",
      row.error ?? "",
      row.feature,
      row.locationName ?? "",
      row.provider ?? "",
      row.status,
      row.subject ?? "",
      row.workflowKey,
    ].some((value) => value.toLowerCase().includes(query));
    return statusMatch && queryMatch;
  });

  return {
    filters: {
      limit,
      q: query,
      status,
    },
    rows: filteredRows.slice(0, limit),
    summary: {
      completedRuns: mappedRows.filter((row) => row.status === "completed").length,
      duplicateRuns: mappedRows.filter((row) => row.status === "duplicate").length,
      failedRuns: mappedRows.filter((row) => row.status === "failed").length,
      queuedRuns: mappedRows.filter((row) => row.status === "queued").length,
      sentRuns: mappedRows.filter((row) => row.status === "sent").length,
      skippedRuns: mappedRows.filter((row) => row.status === "skipped").length,
      totalRuns: mappedRows.length,
      workflows: new Set(mappedRows.map((row) => row.workflowKey)).size,
    },
  };
}

export async function getAiHubDashboardData(
  businessId: string,
  options: DashboardAiWorkflowRunsListOptions = {},
) {
  const [runs, locationRows, contentRows] = await Promise.all([
    getAiWorkflowRunsDashboardList(businessId, options),
    db
      .select({
        address: locations.address,
        aiConfig: locations.aiConfig,
        id: locations.id,
        isDefault: locations.isDefault,
        name: locations.name,
      })
      .from(locations)
      .where(and(eq(locations.businessId, businessId), eq(locations.isActive, true)))
      .orderBy(asc(locations.sortOrder), asc(locations.name)),
    listContentCalendar(businessId),
  ]);

  return {
    ...runs,
    content: contentRows.map(serializeContentItem),
    features: AI_FEATURES.map((key) => ({
      description: AI_FEATURE_META[key].description,
      key,
      label: AI_FEATURE_META[key].label,
    })),
    locations: locationRows.map((location) => ({
      address: location.address,
      aiConfig: normalizeAiConfig(location.aiConfig),
      id: location.id,
      isDefault: location.isDefault,
      name: location.name,
    })),
  };
}

export async function getAiWorkflowRunDashboardDetail(businessId: string, runId: string) {
  const [row] = await db
    .select({
      body: aiWorkflowRuns.body,
      channel: aiWorkflowRuns.channel,
      createdAt: aiWorkflowRuns.createdAt,
      entityId: aiWorkflowRuns.entityId,
      entityType: aiWorkflowRuns.entityType,
      error: aiWorkflowRuns.error,
      executedAt: aiWorkflowRuns.executedAt,
      feature: aiWorkflowRuns.feature,
      id: aiWorkflowRuns.id,
      idempotencyKey: aiWorkflowRuns.idempotencyKey,
      locationId: locations.id,
      locationName: locations.name,
      meta: aiWorkflowRuns.meta,
      provider: aiWorkflowRuns.provider,
      scheduledFor: aiWorkflowRuns.scheduledFor,
      status: aiWorkflowRuns.status,
      subject: aiWorkflowRuns.subject,
      workflowKey: aiWorkflowRuns.workflowKey,
    })
    .from(aiWorkflowRuns)
    .leftJoin(locations, eq(aiWorkflowRuns.locationId, locations.id))
    .where(and(eq(aiWorkflowRuns.id, runId), eq(aiWorkflowRuns.businessId, businessId)))
    .limit(1);

  if (!row) return null;

  return {
    location: row.locationId
      ? {
          id: row.locationId,
          name: row.locationName,
        }
      : null,
    run: {
      body: row.body,
      channel: row.channel,
      createdAt: row.createdAt.toISOString(),
      entityId: row.entityId,
      entityType: row.entityType,
      error: row.error,
      executedAt: row.executedAt?.toISOString() ?? null,
      feature: row.feature,
      id: row.id,
      idempotencyKey: row.idempotencyKey,
      meta: row.meta,
      provider: row.provider,
      scheduledFor: row.scheduledFor?.toISOString() ?? null,
      status: row.status,
      subject: row.subject,
      workflowKey: row.workflowKey,
    },
  };
}

export async function updateAiLocationDashboardConfig(
  businessId: string,
  locationId: string,
  patch: Partial<LocationAiConfig>,
) {
  const location = await getLocationForBusiness(businessId, locationId);
  if (!location) return null;

  const aiConfig = await updateLocationAiConfig(businessId, locationId, patch);
  return {
    aiConfig: normalizeAiConfig(aiConfig),
    locationId,
  };
}

export async function generateAiContentDashboardCalendar(
  businessId: string,
  requestedLocationId?: string,
) {
  let locationId = requestedLocationId;
  if (locationId) {
    const [location] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(
        eq(locations.id, locationId),
        eq(locations.businessId, businessId),
        eq(locations.isActive, true),
      ))
      .limit(1);
    locationId = location?.id;
  } else {
    const [location] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.businessId, businessId), eq(locations.isActive, true)))
      .orderBy(asc(locations.sortOrder), asc(locations.name))
      .limit(1);
    locationId = location?.id;
  }

  if (!locationId) return null;

  const items = await generateThirtyDayContentCalendar({ businessId, locationId });
  return items.map(serializeContentItem);
}

export async function updateAiContentDashboardAction(
  businessId: string,
  contentId: string,
  action: DashboardAiContentAction,
) {
  const item = action === "approve"
    ? await approveContentItem(businessId, contentId)
    : await publishContentItem(businessId, contentId);
  return item ? serializeContentItem(item) : null;
}

export async function runAiReactivationDashboard(
  businessId: string,
  options?: { clientId?: string },
) {
  return runManualReactivation(businessId, options);
}
