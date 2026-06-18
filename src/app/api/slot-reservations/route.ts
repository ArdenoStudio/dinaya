import { NextRequest, NextResponse } from "next/server";
import { z } from "@/lib/validation";
import {
  createSlotReservation,
  releaseSlotReservation,
  touchSlotReservation,
} from "@/lib/slot-reservations";
import { withRateLimit } from "@/lib/rate-limit";

const createSchema = z.object({
  businessId: z.string().uuid(),
  staffId: z.string().uuid(),
  serviceId: z.string().uuid(),
  locationId: z.string().uuid().optional().nullable(),
  startUtc: z.string().datetime(),
  endUtc: z.string().datetime(),
  sessionToken: z.string().min(16).max(64),
});

export async function POST(req: NextRequest) {
  const limited = await withRateLimit(req, {
    scope: "slot-reservation",
    limit: 60,
    windowSeconds: 60,
  });
  if (!limited.ok) return limited.response;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const {
    businessId,
    staffId,
    serviceId,
    locationId,
    startUtc,
    endUtc,
    sessionToken,
  } = parsed.data;
  const result = await createSlotReservation({
    businessId,
    staffId,
    serviceId,
    locationId,
    startsAt: new Date(startUtc),
    endsAt: new Date(endUtc),
    sessionToken,
  });

  if (!result.ok) {
    const status = result.reason === "invalid_request" ? 400 : 409;
    return NextResponse.json(
      {
        error: result.reason === "invalid_request" ? "Invalid request" : "Slot no longer available",
        code: result.reason,
      },
      { status },
    );
  }

  return NextResponse.json({
    reservationId: result.reservation.id,
    expiresAt: result.reservation.expiresAt.toISOString(),
  });
}

export async function PATCH(req: NextRequest) {
  const limited = await withRateLimit(req, {
    scope: "slot-reservation",
    limit: 120,
    windowSeconds: 60,
  });
  if (!limited.ok) return limited.response;

  const body = await req.json();
  const sessionToken = z.string().min(16).max(64).safeParse(body.sessionToken);
  if (!sessionToken.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const expiresAt = await touchSlotReservation(sessionToken.data);
  if (!expiresAt) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  return NextResponse.json({ expiresAt: expiresAt.toISOString() });
}

export async function DELETE(req: NextRequest) {
  const limited = await withRateLimit(req, {
    scope: "slot-reservation",
    limit: 120,
    windowSeconds: 60,
  });
  if (!limited.ok) return limited.response;

  const sessionToken = req.nextUrl.searchParams.get("sessionToken");
  if (!sessionToken) {
    return NextResponse.json({ error: "Missing sessionToken" }, { status: 400 });
  }

  await releaseSlotReservation(sessionToken);
  return NextResponse.json({ ok: true });
}
