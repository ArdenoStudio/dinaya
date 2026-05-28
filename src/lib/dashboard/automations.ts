import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { automationRules, automationRuns } from "@/db/schema";

export type DashboardAutomationDetail = Awaited<ReturnType<typeof getAutomationDashboardDetail>>;
export type DashboardAutomationsList = Awaited<ReturnType<typeof getAutomationsDashboardList>>;
export type DashboardAutomationStatusFilter = "active" | "all" | "paused";

export const dashboardAutomationStatusFilters = ["all", "active", "paused"] as const;

export type DashboardAutomationsListOptions = {
  limit?: number;
  q?: string;
  status?: DashboardAutomationStatusFilter;
};

export type DashboardAutomationUpdate = {
  isActive?: boolean;
};

const DEFAULT_AUTOMATION_LIMIT = 80;
const MAX_AUTOMATION_LIMIT = 150;

function normalizeAutomationLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_AUTOMATION_LIMIT;
  return Math.min(MAX_AUTOMATION_LIMIT, Math.max(1, Math.round(limit ?? DEFAULT_AUTOMATION_LIMIT)));
}

export function isDashboardAutomationStatusFilter(value: string): value is DashboardAutomationStatusFilter {
  return dashboardAutomationStatusFilters.includes(value as DashboardAutomationStatusFilter);
}

export async function getAutomationsDashboardList(
  businessId: string,
  options: DashboardAutomationsListOptions = {},
) {
  const rules = await db
    .select()
    .from(automationRules)
    .where(eq(automationRules.businessId, businessId))
    .orderBy(desc(automationRules.createdAt))
    .limit(MAX_AUTOMATION_LIMIT);

  const ruleIds = rules.map((rule) => rule.id);
  const runSummary = ruleIds.length
    ? await db
        .select({
          ruleId: automationRuns.ruleId,
          status: automationRuns.status,
          value: count(),
        })
        .from(automationRuns)
        .where(inArray(automationRuns.ruleId, ruleIds))
        .groupBy(automationRuns.ruleId, automationRuns.status)
    : [];

  const query = options.q?.trim().toLowerCase() ?? "";
  const status = options.status ?? "all";
  const limit = normalizeAutomationLimit(options.limit);

  const runCountsByRule = new Map<string, {
    failed: number;
    pending: number;
    sent: number;
    skipped: number;
    total: number;
  }>();

  for (const row of runSummary) {
    const current = runCountsByRule.get(row.ruleId) ?? {
      failed: 0,
      pending: 0,
      sent: 0,
      skipped: 0,
      total: 0,
    };
    const value = Number(row.value);
    current.total += value;
    if (row.status === "failed") current.failed += value;
    if (row.status === "pending") current.pending += value;
    if (row.status === "sent") current.sent += value;
    if (row.status === "skipped") current.skipped += value;
    runCountsByRule.set(row.ruleId, current);
  }

  const mappedRows = rules.map((rule) => ({
    actions: rule.actions,
    conditions: rule.conditions,
    createdAt: rule.createdAt.toISOString(),
    delayMinutes: rule.delayMinutes,
    id: rule.id,
    isActive: rule.isActive,
    name: rule.name,
    runSummary: runCountsByRule.get(rule.id) ?? {
      failed: 0,
      pending: 0,
      sent: 0,
      skipped: 0,
      total: 0,
    },
    trigger: rule.trigger,
    updatedAt: rule.updatedAt.toISOString(),
  }));

  const filteredRows = mappedRows.filter((rule) => {
    const statusMatch = status === "all" || (status === "active" ? rule.isActive : !rule.isActive);
    const queryMatch = !query || [
      rule.name,
      rule.trigger,
      rule.isActive ? "active" : "paused",
      String(rule.delayMinutes),
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
      activeRules: mappedRows.filter((rule) => rule.isActive).length,
      delayedRules: mappedRows.filter((rule) => rule.delayMinutes > 0).length,
      failedRuns: mappedRows.reduce((sum, rule) => sum + rule.runSummary.failed, 0),
      instantRules: mappedRows.filter((rule) => rule.delayMinutes === 0).length,
      pausedRules: mappedRows.filter((rule) => !rule.isActive).length,
      pendingRuns: mappedRows.reduce((sum, rule) => sum + rule.runSummary.pending, 0),
      sentRuns: mappedRows.reduce((sum, rule) => sum + rule.runSummary.sent, 0),
      skippedRuns: mappedRows.reduce((sum, rule) => sum + rule.runSummary.skipped, 0),
      totalRules: mappedRows.length,
      totalRuns: mappedRows.reduce((sum, rule) => sum + rule.runSummary.total, 0),
    },
  };
}

export async function getAutomationDashboardDetail(businessId: string, ruleId: string) {
  const [rule] = await db
    .select()
    .from(automationRules)
    .where(and(eq(automationRules.id, ruleId), eq(automationRules.businessId, businessId)))
    .limit(1);

  if (!rule) return null;

  const runSummary = await db
    .select({
      status: automationRuns.status,
      value: count(),
    })
    .from(automationRuns)
    .where(eq(automationRuns.ruleId, ruleId))
    .groupBy(automationRuns.status);

  const recentRuns = await db
    .select({
      createdAt: automationRuns.createdAt,
      entityId: automationRuns.entityId,
      error: automationRuns.error,
      id: automationRuns.id,
      status: automationRuns.status,
      triggerVersion: automationRuns.triggerVersion,
    })
    .from(automationRuns)
    .where(eq(automationRuns.ruleId, ruleId))
    .orderBy(desc(automationRuns.createdAt))
    .limit(20);

  return {
    recentRuns: recentRuns.map((run) => ({
      ...run,
      createdAt: run.createdAt.toISOString(),
    })),
    rule: {
      actions: rule.actions,
      conditions: rule.conditions,
      createdAt: rule.createdAt.toISOString(),
      delayMinutes: rule.delayMinutes,
      id: rule.id,
      isActive: rule.isActive,
      name: rule.name,
      trigger: rule.trigger,
      updatedAt: rule.updatedAt.toISOString(),
    },
    summary: {
      failed: runSummary.find((row) => row.status === "failed")?.value ?? 0,
      pending: runSummary.find((row) => row.status === "pending")?.value ?? 0,
      sent: runSummary.find((row) => row.status === "sent")?.value ?? 0,
      skipped: runSummary.find((row) => row.status === "skipped")?.value ?? 0,
      total: runSummary.reduce((sum, row) => sum + Number(row.value), 0),
    },
  };
}

export async function updateAutomationDashboardFields(
  businessId: string,
  ruleId: string,
  patch: DashboardAutomationUpdate,
) {
  const updates: {
    isActive?: boolean;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (patch.isActive !== undefined) {
    updates.isActive = Boolean(patch.isActive);
  }

  const [updated] = await db
    .update(automationRules)
    .set(updates)
    .where(and(eq(automationRules.id, ruleId), eq(automationRules.businessId, businessId)))
    .returning();

  return updated ?? null;
}
