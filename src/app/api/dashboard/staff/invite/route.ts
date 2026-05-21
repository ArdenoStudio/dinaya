import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses, staff, users } from "@/db/schema";
import { requireApiBusiness } from "@/lib/api-auth";
import { withApiHandler } from "@/lib/api-handler";
import { PlanLimitError, requirePlanLimit } from "@/lib/plan";
import { sendStaffInviteEmail } from "@/lib/resend";
import { buildStaffInviteUrl, createStaffInviteToken } from "@/lib/staff-invite";
import { z } from "@/lib/validation";

const inviteSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email(),
});

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId, user } = authResult.context;

  return withApiHandler(async () => {
    const parsed = inviteSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Please check the invite details." }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existingUser) {
      return NextResponse.json({ error: "That email already has a Dinaya account." }, { status: 409 });
    }

    const [business] = await db
      .select({ id: businesses.id, name: businesses.name })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);
    if (!business) return NextResponse.json({ error: "Business not found." }, { status: 404 });

    const staffCount = await db.select({ id: staff.id }).from(staff).where(eq(staff.businessId, businessId));
    try {
      await requirePlanLimit(businessId, "staff", staffCount.length);
    } catch (error) {
      if (error instanceof PlanLimitError) {
        return NextResponse.json({ error: error.message }, { status: 402 });
      }
      throw error;
    }

    const [member] = await db
      .insert(staff)
      .values({
        businessId,
        name: parsed.data.name,
        bio: "Team member",
        isActive: true,
      })
      .returning({ id: staff.id });

    const token = createStaffInviteToken({
      businessId,
      businessName: business.name,
      email,
      name: parsed.data.name,
      staffId: member.id,
    });

    await sendStaffInviteEmail({
      email,
      name: parsed.data.name,
      businessName: business.name,
      invitedBy: user.name ?? "Your team",
      inviteUrl: buildStaffInviteUrl(token),
    });

    return NextResponse.json({ success: true, staffId: member.id });
  }, "Unable to send invite.");
}
