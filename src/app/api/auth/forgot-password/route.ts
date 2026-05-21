import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses, users } from "@/db/schema";
import { withApiHandler } from "@/lib/api-handler";
import { withRateLimit } from "@/lib/rate-limit";
import {
  buildPasswordResetUrl,
  createPasswordResetToken,
} from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/resend";
import { z } from "@/lib/validation";

const forgotPasswordSchema = z.object({
  email: z.email(),
});

export async function POST(req: NextRequest) {
  const limited = await withRateLimit(req, {
    scope: "forgot-password",
    limit: 5,
    windowSeconds: 300,
  });
  if (!limited.ok) return limited.response;

  return withApiHandler(async () => {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        businessId: users.businessId,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user) {
      const [business] = await db
        .select({
          isSuspended: businesses.isSuspended,
          deletedAt: businesses.deletedAt,
        })
        .from(businesses)
        .where(eq(businesses.id, user.businessId))
        .limit(1);

      if (business && !business.isSuspended && !business.deletedAt) {
        const token = createPasswordResetToken({
          userId: user.id,
          email: user.email,
        });
        const resetUrl = buildPasswordResetUrl(token);

        try {
          await sendPasswordResetEmail({
            email: user.email,
            name: user.name,
            resetUrl,
          });
        } catch (error) {
          console.error("[forgot-password] email send failed", error);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: "If an account exists for that email, we've sent password reset instructions.",
    });
  }, "Could not process password reset request.");
}
