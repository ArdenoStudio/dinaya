import { createHash } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { bookingIdempotencyKeys } from "@/db/schema";

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export type BookingIdempotencyPayload = {
  businessId: string;
  serviceId: string;
  staffId: string;
  startsAt: string;
  endsAt: string;
  clientPhone: string;
};

export function hashBookingIdempotencyPayload(payload: BookingIdempotencyPayload): string {
  return createHash("sha256")
    .update(
      [
        payload.businessId,
        payload.serviceId,
        payload.staffId,
        payload.startsAt,
        payload.endsAt,
        payload.clientPhone,
      ].join("|"),
    )
    .digest("hex");
}

export async function purgeExpiredBookingIdempotencyKeys(): Promise<void> {
  await db
    .delete(bookingIdempotencyKeys)
    .where(lt(bookingIdempotencyKeys.expiresAt, new Date()));
}

export async function getBookingIdempotencyResponse(input: {
  businessId: string;
  idempotencyKey: string;
  requestHash: string;
}): Promise<{ status: number; body: unknown } | null> {
  await purgeExpiredBookingIdempotencyKeys();

  const [row] = await db
    .select({
      requestHash: bookingIdempotencyKeys.requestHash,
      responseStatus: bookingIdempotencyKeys.responseStatus,
      responseBody: bookingIdempotencyKeys.responseBody,
    })
    .from(bookingIdempotencyKeys)
    .where(
      and(
        eq(bookingIdempotencyKeys.businessId, input.businessId),
        eq(bookingIdempotencyKeys.idempotencyKey, input.idempotencyKey),
        gt(bookingIdempotencyKeys.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) return null;

  if (row.requestHash !== input.requestHash) {
    return { status: 409, body: { error: "Idempotency key was already used with different booking details." } };
  }

  return { status: row.responseStatus, body: row.responseBody };
}

export async function storeBookingIdempotencyResponse(input: {
  businessId: string;
  idempotencyKey: string;
  requestHash: string;
  responseStatus: number;
  responseBody: unknown;
}): Promise<void> {
  const expiresAt = new Date(Date.now() + IDEMPOTENCY_TTL_MS);

  await db
    .insert(bookingIdempotencyKeys)
    .values({
      businessId: input.businessId,
      idempotencyKey: input.idempotencyKey,
      requestHash: input.requestHash,
      responseStatus: input.responseStatus,
      responseBody: input.responseBody,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [bookingIdempotencyKeys.businessId, bookingIdempotencyKeys.idempotencyKey],
      set: {
        requestHash: input.requestHash,
        responseStatus: input.responseStatus,
        responseBody: input.responseBody,
        expiresAt,
      },
    });
}

export function resolveBookingIdempotencyKey(
  headerValue: string | null,
  sessionToken?: string | null,
): string | null {
  const trimmed = headerValue?.trim();
  if (trimmed) return trimmed.slice(0, 180);
  if (sessionToken && sessionToken.length >= 16) {
    return `session:${sessionToken.slice(0, 64)}`;
  }
  return null;
}
