import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.hoisted(() => vi.fn());
const dbSelectMock = vi.hoisted(() => vi.fn());
const hasApiKeyAuthMock = vi.hoisted(() => vi.fn());
const requireApiBusinessMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/db", () => ({
  db: {
    select: dbSelectMock,
  },
}));

vi.mock("@/lib/api-auth", () => ({
  hasApiKeyAuth: hasApiKeyAuthMock,
  requireApiBusiness: requireApiBusinessMock,
}));

import { GET } from "./route";

describe("GET /api/calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the API key auth response immediately when an API key is present", async () => {
    hasApiKeyAuthMock.mockReturnValue(true);
    requireApiBusinessMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/calendar");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(authMock).not.toHaveBeenCalled();
    expect(dbSelectMock).not.toHaveBeenCalled();
  });

  it("falls back to session auth only when no API key is present", async () => {
    hasApiKeyAuthMock.mockReturnValue(false);
    requireApiBusinessMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });
    authMock.mockResolvedValue({
      user: {
        businessId: "00000000-0000-4000-8000-000000000001",
      },
    });

    const req = new NextRequest("http://localhost/api/calendar");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("from and to are required.");
    expect(authMock).toHaveBeenCalledTimes(1);
    expect(dbSelectMock).not.toHaveBeenCalled();
  });
});
