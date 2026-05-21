import { NextRequest, NextResponse } from "next/server";
import { z } from "@/lib/validation";
import { withApiHandler } from "@/lib/api-handler";
import { withRateLimit } from "@/lib/rate-limit";
import { sendContactFormEmail } from "@/lib/resend";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(10).max(5000),
});

export async function POST(req: NextRequest) {
  const limited = await withRateLimit(req, {
    scope: "contact",
    limit: 5,
    windowSeconds: 60 * 15,
  });
  if (!limited.ok) return limited.response;

  return withApiHandler(async () => {
    const parsed = contactSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Please check your message details." }, { status: 400 });
    }

    await sendContactFormEmail(parsed.data);
    return NextResponse.json({ success: true });
  }, "Unable to send message.");
}
