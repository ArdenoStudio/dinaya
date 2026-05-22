import { NextRequest, NextResponse } from "next/server";
import { captureException } from "@/lib/monitoring";
import { z } from "@/lib/validation";

const clientErrorSchema = z.object({
  component: z.string().trim().max(120).optional(),
  digest: z.string().trim().max(120).optional().nullable(),
  message: z.string().trim().max(1000),
  stack: z.string().trim().max(4000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const parsed = clientErrorSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await captureException(new Error(parsed.data.message), {
    component: parsed.data.component ?? "client",
    extra: {
      digest: parsed.data.digest,
      stack: parsed.data.stack,
      userAgent: req.headers.get("user-agent"),
    },
  });

  return NextResponse.json({ ok: true });
}
