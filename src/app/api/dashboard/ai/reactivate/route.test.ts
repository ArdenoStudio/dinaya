import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireApiBusinessMock = vi.hoisted(() => vi.fn());
const requireProMock = vi.hoisted(() => vi.fn());
const runManualReactivationMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/plan", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/plan")>();
  return { ...actual, requirePro: requireProMock };
});

vi.mock("@/lib/api-auth", () => ({
  requireApiBusiness: requireApiBusinessMock,
}));

vi.mock("@/lib/ai/workflows", () => ({
  runManualReactivation: runManualReactivationMock,
}));

import { POST } from "./route";

const authOk = { ok: true, context: { businessId: "00000000-0000-4000-8000-000000000001", userId: "00000000-0000-4000-8000-000000000002", role: "owner" } };
const authFail = { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };

describe("POST /api/dashboard/ai/reactivate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiBusinessMock.mockResolvedValue(authOk);
    requireProMock.mockResolvedValue(undefined);
    runManualReactivationMock.mockResolvedValue({ queued: 1 });
  });

  it("returns 401 when auth fails", async () => {
    requireApiBusinessMock.mockResolvedValue(authFail);

    const req = new NextRequest("http://localhost/api/dashboard/ai/reactivate", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid reactivation payloads", async () => {
    const req = new NextRequest("http://localhost/api/dashboard/ai/reactivate", {
      method: "POST",
      body: JSON.stringify({ clientId: "not-a-uuid" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid request.");
    expect(runManualReactivationMock).not.toHaveBeenCalled();
  });

  it("runs manual reactivation for a valid client id", async () => {
    const req = new NextRequest("http://localhost/api/dashboard/ai/reactivate", {
      method: "POST",
      body: JSON.stringify({ clientId: "00000000-0000-4000-8000-000000000003" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(runManualReactivationMock).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      { clientId: "00000000-0000-4000-8000-000000000003" },
    );
    expect(body).toEqual({ queued: 1 });
  });
});
