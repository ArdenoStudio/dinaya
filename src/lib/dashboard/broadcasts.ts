import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { broadcasts } from "@/db/schema";
import {
  BROADCAST_CHANNELS,
  BROADCAST_STATUSES,
  MAX_BROADCAST_RECIPIENTS,
  listBroadcastsForBusiness,
  resolveBroadcastRecipients,
  serializeBroadcast,
  type BroadcastAudienceFilter,
  type BroadcastChannel,
  type BroadcastStatus,
} from "@/lib/broadcasts";
import { hasPublicTable, isMissingSchemaError } from "@/lib/dashboard/db-compat";

export type DashboardBroadcastDetail = Awaited<ReturnType<typeof getBroadcastDashboardDetail>>;
export type DashboardBroadcastsList = Awaited<ReturnType<typeof getBroadcastsDashboardList>>;
export type DashboardBroadcastStatusFilter = BroadcastStatus | "all";
export type DashboardBroadcastChannelFilter = BroadcastChannel | "all";

export const dashboardBroadcastStatusFilters = ["all", ...BROADCAST_STATUSES] as const;
export const dashboardBroadcastChannelFilters = ["all", ...BROADCAST_CHANNELS] as const;

export type DashboardBroadcastsListOptions = {
  channel?: DashboardBroadcastChannelFilter;
  limit?: number;
  q?: string;
  status?: DashboardBroadcastStatusFilter;
};

const DEFAULT_BROADCAST_LIMIT = 80;
const MAX_BROADCAST_LIMIT = 150;

function normalizeBroadcastLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_BROADCAST_LIMIT;
  return Math.min(MAX_BROADCAST_LIMIT, Math.max(1, Math.round(limit ?? DEFAULT_BROADCAST_LIMIT)));
}

export function isDashboardBroadcastStatusFilter(value: string): value is DashboardBroadcastStatusFilter {
  return dashboardBroadcastStatusFilters.includes(value as DashboardBroadcastStatusFilter);
}

export function isDashboardBroadcastChannelFilter(value: string): value is DashboardBroadcastChannelFilter {
  return dashboardBroadcastChannelFilters.includes(value as DashboardBroadcastChannelFilter);
}

function audienceLabel(type: string, filter: unknown): string {
  if (type === "all") return "All clients";
  if (type === "stage" && filter && typeof filter === "object" && "stage" in filter) {
    return `Stage: ${String((filter as { stage: string }).stage)}`;
  }
  if (type === "tags" && filter && typeof filter === "object" && "tags" in filter) {
    const tags = (filter as { tags?: unknown }).tags;
    return Array.isArray(tags) ? `Tags: ${tags.join(", ")}` : "Tags";
  }
  return type;
}

function percent(part: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((part / total) * 100);
}

export async function getBroadcastsDashboardList(
  businessId: string,
  options: DashboardBroadcastsListOptions = {},
) {
  const allBroadcasts = await listBroadcastsForBusiness(businessId);
  const query = options.q?.trim().toLowerCase() ?? "";
  const status = options.status ?? "all";
  const channel = options.channel ?? "all";
  const limit = normalizeBroadcastLimit(options.limit);

  const mappedRows = allBroadcasts.map((row) => {
    const serialized = serializeBroadcast(row);
    return {
      ...serialized,
      audienceLabel: audienceLabel(row.audienceType ?? "all", row.audienceFilter),
      deliveryRatePercent: percent(row.sentCount, row.recipientCount),
      failureRatePercent: percent(row.failedCount, row.recipientCount),
      remainingCount: Math.max(row.recipientCount - row.sentCount - row.skippedCount - row.failedCount, 0),
    };
  });

  const filteredRows = mappedRows.filter((row) => {
    const statusMatch = status === "all" || row.status === status;
    const channelMatch = channel === "all" || row.channel === channel;
    const queryMatch = !query || [
      row.name,
      row.subject ?? "",
      row.body,
      row.audienceLabel,
      row.channel,
      row.status,
    ].some((value) => String(value ?? "").toLowerCase().includes(query));
    return statusMatch && channelMatch && queryMatch;
  });

  return {
    filters: {
      channel,
      limit,
      q: query,
      status,
    },
    rows: filteredRows.slice(0, limit),
    summary: {
      draftBroadcasts: mappedRows.filter((row) => row.status === "draft").length,
      emailBroadcasts: mappedRows.filter((row) => row.channel === "email").length,
      failedBroadcasts: mappedRows.filter((row) => row.status === "failed").length,
      failedMessages: mappedRows.reduce((sum, row) => sum + row.failedCount, 0),
      sentBroadcasts: mappedRows.filter((row) => row.status === "sent").length,
      sentMessages: mappedRows.reduce((sum, row) => sum + row.sentCount, 0),
      sendingBroadcasts: mappedRows.filter((row) => row.status === "sending").length,
      skippedMessages: mappedRows.reduce((sum, row) => sum + row.skippedCount, 0),
      smsBroadcasts: mappedRows.filter((row) => row.channel === "sms").length,
      totalBroadcasts: mappedRows.length,
      totalRecipients: mappedRows.reduce((sum, row) => sum + row.recipientCount, 0),
      whatsappBroadcasts: mappedRows.filter((row) => row.channel === "whatsapp").length,
    },
  };
}

export async function getBroadcastDashboardDetail(businessId: string, broadcastId: string) {
  if (!(await hasPublicTable("broadcasts"))) return null;

  let row: Awaited<ReturnType<typeof listBroadcastsForBusiness>>[number] | undefined;
  try {
    [row] = await db
      .select({
        audienceFilter: broadcasts.audienceFilter,
        audienceType: broadcasts.audienceType,
        body: broadcasts.body,
        businessId: broadcasts.businessId,
        channel: broadcasts.channel,
        createdAt: broadcasts.createdAt,
        failedCount: broadcasts.failedCount,
        id: broadcasts.id,
        name: broadcasts.name,
        recipientCount: broadcasts.recipientCount,
        sentAt: broadcasts.sentAt,
        sentCount: broadcasts.sentCount,
        skippedCount: broadcasts.skippedCount,
        status: broadcasts.status,
        subject: broadcasts.subject,
      })
      .from(broadcasts)
      .where(and(eq(broadcasts.id, broadcastId), eq(broadcasts.businessId, businessId)))
      .limit(1);
  } catch (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }

  if (!row) return null;

  const recipients = await resolveBroadcastRecipients(
    businessId,
    row.audienceType as "all" | "stage" | "tags",
    row.audienceFilter as BroadcastAudienceFilter | null,
  );

  return {
    audience: {
      cappedRecipientCount: Math.min(recipients.length, MAX_BROADCAST_RECIPIENTS),
      eligibleRecipientCount: recipients.length,
      filter: row.audienceFilter,
      label: audienceLabel(row.audienceType, row.audienceFilter),
      sampleRecipients: recipients.slice(0, 8).map((recipient) => ({
        email: recipient.email,
        id: recipient.id,
        name: recipient.name,
        phone: recipient.phone,
        tags: recipient.tags,
      })),
      type: row.audienceType,
    },
    broadcast: serializeBroadcast(row),
    results: {
      deliveryRatePercent: percent(row.sentCount, row.recipientCount),
      failureRatePercent: percent(row.failedCount, row.recipientCount),
      remainingCount: Math.max(row.recipientCount - row.sentCount - row.skippedCount - row.failedCount, 0),
    },
  };
}
