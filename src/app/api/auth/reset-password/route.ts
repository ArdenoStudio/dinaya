import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { withApiHandler } from "@/lib/api-handler";
import { withRateLimit } from "@/lib/rate-limit";
import { isPasswordResetTokenCurrent, verifyPasswordResetToken } from "@/lib/password-reset";
import { z } from "@/lib/validation";

const resetPasswordSchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  const limited = await withRateLimit(req, {
    scope: "reset-password",
    limit: 10,
    windowSeconds: 300,
  });
  if (!limited.ok) return limited.response;

  return withApiHandler(async () => {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const payload = verifyPasswordResetToken(parsed.data.token);
    if (!payload) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const [user] = await db
      .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (
      !user ||
      user.email.toLowerCase() !== payload.email.toLowerCase() ||
      !isPasswordResetTokenCurrent(payload, user.passwordHash)
    ) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, user.id));

    return NextResponse.json({ ok: true });
  }, "Could not reset password.");
}
