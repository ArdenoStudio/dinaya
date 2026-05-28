import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, clientNotes, clients, services, staff } from "@/db/schema";
import { z } from "@/lib/validation";

export type DashboardClientDetail = Awaited<ReturnType<typeof getClientDashboardDetail>>;
export type ClientNoteCreateInput = z.infer<typeof clientNoteCreateSchema>;
export type ClientNoteCreateResult =
  | { status: "created"; note: typeof clientNotes.$inferSelect }
  | { status: "not_found"; error: string };

export const clientNoteCreateSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

async function verifyClientForBusiness(businessId: string, clientId: string) {
  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.businessId, businessId)))
    .limit(1);

  return client ?? null;
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
      createdAt: client.createdAt.toISOString(),
      lastAiContactAt: client.lastAiContactAt?.toISOString() ?? null,
    },
    bookings: bookingHistory.map((row) => ({
      ...row,
      startsAt: row.startsAt.toISOString(),
    })),
    notes: notes.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
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
