import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { withApiHandler } from "@/lib/api-handler";
import { verifyStaffInviteToken } from "@/lib/staff-invite";
import { z } from "@/lib/validation";

const acceptSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  return withApiHandler(async () => {
    const parsed = acceptSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Please check your password." }, { status: 400 });
    }

    const invite = verifyStaffInviteToken(parsed.data.token);
    if (!invite) {
      return NextResponse.json({ error: "This invite link is invalid or expired." }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, invite.email))
      .limit(1);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await db.insert(users).values({
      businessId: invite.businessId,
      name: invite.name,
      email: invite.email,
      passwordHash,
      role: "staff",
    });

    return NextResponse.json({ success: true });
  }, "Unable to accept invite.");
}
