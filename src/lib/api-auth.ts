import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasApiKeyAuth, requireApiKey } from "@/lib/api-key-auth";
import {
  businessInactiveMessage,
  getBusinessActiveStatus,
} from "@/lib/business-active";

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

async function rejectInactiveBusiness(businessId: string): Promise<NextResponse | null> {
  const status = await getBusinessActiveStatus(businessId);
  if (status === "active") return null;
  return NextResponse.json({ error: businessInactiveMessage(status) }, { status: 403 });
}

export async function requireApiBusiness({
  ownerOnly = false,
  req,
  apiKeyScope,
}: {
  ownerOnly?: boolean;
  req?: NextRequest;
  apiKeyScope?: string;
} = {}): Promise<ApiAuthResult> {
  if (req && apiKeyScope && hasApiKeyAuth(req)) {
    const keyResult = await requireApiKey(req, apiKeyScope);
    if (!keyResult.ok) return keyResult;

    const inactiveResponse = await rejectInactiveBusiness(keyResult.context.businessId);
    if (inactiveResponse) {
      return { ok: false, response: inactiveResponse };
    }

    return {
      ok: true,
      context: {
        businessId: keyResult.context.businessId,
        role: "owner",
        user: {
          id: `api-key:${keyResult.context.keyId}`,
          email: null,
          name: "API key",
        },
      },
    };
  }

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

  if (session.user.readOnlyImpersonation) {
    const method = req?.method ?? "GET";
    if (method !== "GET") {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Read-only impersonation session — mutations are blocked." },
          { status: 403 },
        ),
      };
    }
  }

  const inactiveResponse = await rejectInactiveBusiness(businessId);
  if (inactiveResponse) {
    return { ok: false, response: inactiveResponse };
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
