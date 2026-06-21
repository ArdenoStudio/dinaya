import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { RegisterAccountError, registerBusinessAccount } from "@/lib/auth/register-business-account";
import { withRateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/schemas/register";

export async function POST(req: NextRequest) {
  const limited = await withRateLimit(req, {
    scope: "register",
    limit: 5,
    windowSeconds: 60 * 15,
  });
  if (!limited.ok) return limited.response;

  return withApiHandler(async () => {
    const parsed = registerSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check your registration details.", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    try {
      await registerBusinessAccount(parsed.data);
      return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
      if (error instanceof RegisterAccountError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      throw error;
    }
  }, "Unable to create account.");
}
