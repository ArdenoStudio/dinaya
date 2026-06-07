import { and, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, clientNotes, clients, services, staff } from "@/db/schema";
import { isoDateString, nullableIsoDateString } from "@/lib/dashboard/serialization";
import { normalizeSriLankanPhone } from "@/lib/phone";
import { z } from "@/lib/validation";

export type DashboardClientDetail = Awaited<ReturnType<typeof getClientDashboardDetail>>;
export type DashboardClientsList = Awaited<ReturnType<typeof getClientsDashboardList>>;
export type DashboardClientStageFilter = "active" | "all" | "churned" | "lead" | "prospect";
export type ClientNoteCreateInput = z.infer<typeof clientNoteCreateSchema>;
export type ClientNoteCreateResult =
  | { status: "created"; note: typeof clientNotes.$inferSelect }
  | { status: "not_found"; error: string };
export type ClientDashboardUpdateInput = z.infer<typeof clientDashboardUpdateSchema>;
export type ClientDashboardUpdateResult =
  | { status: "not_found"; error: string }
  | { status: "updated"; client: typeof clients.$inferSelect };

export const dashboardClientStageFilters = ["all", "lead", "prospect", "active", "churned"] as const;

export type DashboardClientsListOptions = {
  limit?: number;
  q?: string;
  stage?: DashboardClientStageFilter;
};

export const clientNoteCreateSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export const clientDashboardUpdateSchema = z
  .object({
    communicationOptOut: z.boolean().optional(),
    email: z.union([z.email(), z.literal(""), z.null()]).optional(),
    internalNotes: z.string().trim().max(5000).optional().nullable(),
    name: z.string().trim().min(1).max(100).optional(),
    phone: z.string().trim().min(7).max(30).optional(),
    source: z.string().trim().max(100).optional().nullable(),
    stage: z.enum(["lead", "prospect", "active", "churned"]).optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).optional().nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required.",
  });

const DEFAULT_CLIENT_LIMIT = 200;
const MAX_CLIENT_LIMIT = 500;

function normalizeClientLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_CLIENT_LIMIT;
  return Math.min(MAX_CLIENT_LIMIT, Math.max(1, Math.round(limit ?? DEFAULT_CLIENT_LIMIT)));
}

export function isDashboardClientStageFilter(value: string): value is DashboardClientStageFilter {
  return dashboardClientStageFilters.includes(value as DashboardClientStageFilter);
}

async function verifyClientForBusiness(businessId: string, clientId: string) {
  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.businessId, businessId)))
    .limit(1);

  return client ?? null;
}

export async function getClientsDashboardList(
  businessId: string,
  options: DashboardClientsListOptions = {},
) {
  const query = options.q?.trim().toLowerCase() ?? "";
  const stage = options.stage ?? "all";
  const limit = normalizeClientLimit(options.limit);
  const conditions = [
    eq(clients.businessId, businessId),
    stage !== "all" ? eq(clients.stage, stage) : undefined,
    query
      ? or(
          ilike(clients.name, `%${query}%`),
          ilike(clients.phone, `%${query}%`),
          ilike(clients.email, `%${query}%`),
          ilike(clients.source, `%${query}%`),
        )
      : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  const [summaryRows, rows] = await Promise.all([
    db
      .select({
        activeClients: sql<number>`coalesce(count(*) filter (where ${clients.stage} = 'active'), 0)::int`,
        churnedClients: sql<number>`coalesce(count(*) filter (where ${clients.stage} = 'churned'), 0)::int`,
        leads: sql<number>`coalesce(count(*) filter (where ${clients.stage} = 'lead'), 0)::int`,
        optedOutClients: sql<number>`coalesce(count(*) filter (where ${clients.communicationOptOut} = true), 0)::int`,
        prospects: sql<number>`coalesce(count(*) filter (where ${clients.stage} = 'prospect'), 0)::int`,
        totalClients: count(),
        withEmail: sql<number>`coalesce(count(*) filter (where ${clients.email} is not null), 0)::int`,
      })
      .from(clients)
      .where(eq(clients.businessId, businessId)),
    db
      .select({
        communicationOptOut: clients.communicationOptOut,
        createdAt: clients.createdAt,
        email: clients.email,
        id: clients.id,
        lastAiContactAt: clients.lastAiContactAt,
        loyaltyTier: clients.loyaltyTier,
        name: clients.name,
        phone: clients.phone,
        source: clients.source,
        stage: clients.stage,
        tags: clients.tags,
      })
      .from(clients)
      .where(and(...conditions))
      .orderBy(desc(clients.createdAt))
      .limit(limit),
  ]);

  const summary = summaryRows[0];
  const clientIds = rows.map((row) => row.id);
  const bookingSummary = clientIds.length
    ? await db
        .select({
          bookingCount: count(),
          clientId: bookings.clientId,
          completedBookings: sql<number>`coalesce(count(*) filter (where ${bookings.status} = 'completed'), 0)::int`,
          lastBookingAt: sql<Date | null>`max(${bookings.startsAt})`,
        })
        .from(bookings)
        .where(and(eq(bookings.businessId, businessId), inArray(bookings.clientId, clientIds)))
        .groupBy(bookings.clientId)
    : [];

  const bookingSummaryByClient = new Map(bookingSummary.map((row) => [row.clientId, row]));

  return {
    filters: {
      limit,
      q: query,
      stage,
    },
    rows: rows.map((row) => {
      const rowSummary = bookingSummaryByClient.get(row.id);
      return {
        ...row,
        bookingCount: Number(rowSummary?.bookingCount ?? 0),
        completedBookings: Number(rowSummary?.completedBookings ?? 0),
        createdAt: isoDateString(row.createdAt),
        lastAiContactAt: nullableIsoDateString(row.lastAiContactAt),
        lastBookingAt: nullableIsoDateString(rowSummary?.lastBookingAt),
      };
    }),
    summary: {
      activeClients: Number(summary?.activeClients ?? 0),
      churnedClients: Number(summary?.churnedClients ?? 0),
      leads: Number(summary?.leads ?? 0),
      optedOutClients: Number(summary?.optedOutClients ?? 0),
      prospects: Number(summary?.prospects ?? 0),
      totalClients: Number(summary?.totalClients ?? 0),
      withEmail: Number(summary?.withEmail ?? 0),
    },
  };
}

export async function getClientDashboardDetail(businessId: string, clientId: string) {
  const [client] = await db
    .select({
      communicationOptOut: clients.communicationOptOut,
      createdAt: clients.createdAt,
      email: clients.email,
      id: clients.id,
      internalNotes: clients.internalNotes,
      lastAiContactAt: clients.lastAiContactAt,
      loyaltyTier: clients.loyaltyTier,
      name: clients.name,
      phone: clients.phone,
      source: clients.source,
      stage: clients.stage,
      tags: clients.tags,
    })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.businessId, businessId)))
    .limit(1);

  if (!client) return null;

  const bookingHistory = await db
    .select({
      id: bookings.id,
      serviceName: services.name,
      staffName: staff.name,
      startsAt: bookings.startsAt,
      status: bookings.status,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(staff, eq(bookings.staffId, staff.id))
    .where(and(eq(bookings.clientId, clientId), eq(bookings.businessId, businessId)))
    .orderBy(desc(bookings.startsAt))
    .limit(50);

  const notes = await db
    .select({
      body: clientNotes.body,
      createdAt: clientNotes.createdAt,
      id: clientNotes.id,
    })
    .from(clientNotes)
    .where(eq(clientNotes.clientId, clientId))
    .orderBy(desc(clientNotes.createdAt))
    .limit(50);

  return {
    client: {
      ...client,
      createdAt: isoDateString(client.createdAt),
      lastAiContactAt: nullableIsoDateString(client.lastAiContactAt),
    },
    bookings: bookingHistory.map((row) => ({
      ...row,
      startsAt: isoDateString(row.startsAt),
    })),
    notes: notes.map((row) => ({
      ...row,
      createdAt: isoDateString(row.createdAt),
    })),
  };
}

export async function createClientDashboardNote(
  businessId: string,
  clientId: string,
  input: ClientNoteCreateInput,
): Promise<ClientNoteCreateResult> {
  const client = await verifyClientForBusiness(businessId, clientId);
  if (!client) return { status: "not_found", error: "Not found" };

  const [note] = await db
    .insert(clientNotes)
    .values({
      body: input.body.trim(),
      clientId,
    })
    .returning();

  return { status: "created", note };
}

export async function updateClientDashboardFields(
  businessId: string,
  clientId: string,
  body: ClientDashboardUpdateInput,
): Promise<ClientDashboardUpdateResult> {
  const updateValues: Partial<typeof clients.$inferInsert> = {};

  if (body.communicationOptOut !== undefined) updateValues.communicationOptOut = body.communicationOptOut;
  if (body.email !== undefined) updateValues.email = body.email ? body.email : null;
  if (body.internalNotes !== undefined) updateValues.internalNotes = body.internalNotes?.trim() || null;
  if (body.name !== undefined) updateValues.name = body.name;
  if (body.phone !== undefined) updateValues.phone = normalizeSriLankanPhone(body.phone);
  if (body.source !== undefined) updateValues.source = body.source?.trim() || null;
  if (body.stage !== undefined) updateValues.stage = body.stage;
  if (body.tags !== undefined) {
    updateValues.tags = body.tags === null
      ? null
      : Array.from(new Set(body.tags.map((tag) => tag.trim()).filter(Boolean)));
  }

  const [updated] = await db
    .update(clients)
    .set(updateValues)
    .where(and(eq(clients.id, clientId), eq(clients.businessId, businessId)))
    .returning();

  if (!updated) return { status: "not_found", error: "Not found" };
  return { status: "updated", client: updated };
}
