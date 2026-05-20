import { NextResponse } from "next/server";
import { auth } from "@/auth";

export type ApiBusinessContext = {
  businessId: string;
  role: "owner" | "staff";
  user: {
    email?: string | null;
    id: string;
    name?: string | null;
  };
};

type ApiAuthResult =
  | { ok: true; context: ApiBusinessContext }
  | { ok: false; response: NextResponse };

export async function requireApiBusiness({
  ownerOnly = false,
}: { ownerOnly?: boolean } = {}): Promise<ApiAuthResult> {
  const session = await auth();
  const businessId = session?.user?.businessId;
  const userId = session?.user?.id;
  const role = session?.user?.role;

  if (!businessId || !userId || !role) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (ownerOnly && role !== "owner") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    context: {
      businessId,
      role,
      user: {
        email: session.user.email,
        id: userId,
        name: session.user.name,
      },
    },
  };
}
