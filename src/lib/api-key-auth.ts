import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { hashApiKey, isApiKeyFormat } from "@/lib/api-keys";
import {
  businessInactiveMessage,
  getBusinessActiveStatus,
} from "@/lib/business-active";

export type ApiKeyContext = {
  businessId: string;
  keyId: string;
  scopes: string[];
};

type ApiKeyAuthResult =
  | { ok: true; context: ApiKeyContext }
  | { ok: false; response: NextResponse };

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

export function hasApiKeyAuth(req: NextRequest): boolean {
  const token = bearerToken(req);
  return Boolean(token && isApiKeyFormat(token));
}

export async function requireApiKey(
  req: NextRequest,
  scope: string,
): Promise<ApiKeyAuthResult> {
  const token = bearerToken(req);
  if (!token || !isApiKeyFormat(token)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const keyHash = hashApiKey(token);
  const [row] = await db
    .select({
      id: apiKeys.id,
      businessId: apiKeys.businessId,
      scopes: apiKeys.scopes,
      expiresAt: apiKeys.expiresAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  if (!row || row.revokedAt) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (row.expiresAt && row.expiresAt <= new Date()) {
    return {
      ok: false,
      response: NextResponse.json({ error: "API key expired" }, { status: 401 }),
    };
  }

  if (!row.scopes.includes(scope)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const businessStatus = await getBusinessActiveStatus(row.businessId);
  if (businessStatus !== "active") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: businessInactiveMessage(businessStatus) },
        { status: 403 },
      ),
    };
  }

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.id));

  return {
    ok: true,
    context: {
      businessId: row.businessId,
      keyId: row.id,
      scopes: row.scopes,
    },
  };
}
