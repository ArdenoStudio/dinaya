import { NextRequest, NextResponse } from "next/server";
import { confirmPaypalPayment } from "@/lib/payments/confirm-paypal";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "@/lib/validation";

const captureSchema = z.object({
  orderId: z.string().trim().min(4).max(100),
  slug: z.string().trim().min(1).max(80).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  const limited = await withRateLimit(req, {
    scope: "bookings",
    limit: 20,
    windowSeconds: 60,
  });
  if (!limited.ok) return limited.response;

  const { id: bookingId } = await context.params;
  const parsed = captureSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid PayPal capture request." }, { status: 400 });
  }

  const result = await confirmPaypalPayment({
    bookingId,
    orderId: parsed.data.orderId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, duplicate: result.duplicate ?? false });
}
