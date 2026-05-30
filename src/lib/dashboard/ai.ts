import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { aiWorkflowRuns, locations } from "@/db/schema";

export type DashboardAiWorkflowRunDetail = Awaited<ReturnType<typeof getAiWorkflowRunDashboardDetail>>;
export type DashboardAiWorkflowRunsList = Awaited<ReturnType<typeof getAiWorkflowRunsDashboardList>>;
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

const DEFAULT_AI_RUN_LIMIT = 80;
const MAX_AI_RUN_LIMIT = 150;

function normalizeAiRunLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_AI_RUN_LIMIT;
  return Math.min(MAX_AI_RUN_LIMIT, Math.max(1, Math.round(limit ?? DEFAULT_AI_RUN_LIMIT)));
}

function dateString(value: Date | null): string | null {
  return value?.toISOString() ?? null;
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
