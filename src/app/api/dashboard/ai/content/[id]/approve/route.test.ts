import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireApiBusinessMock = vi.hoisted(() => vi.fn());
const requireProMock = vi.hoisted(() => vi.fn());
const approveContentItemMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/plan", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/plan")>();
  return { ...actual, requirePro: requireProMock };
});

vi.mock("@/lib/api-auth", () => ({
  requireApiBusiness: requireApiBusinessMock,
}));

vi.mock("@/lib/ai/content", () => ({
  approveContentItem: approveContentItemMock,
}));

import { POST } from "./route";

const authOk = { ok: true, context: { businessId: "00000000-0000-4000-8000-000000000001", userId: "00000000-0000-4000-8000-000000000002", role: "owner" } };
const authFail = { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };

describe("POST /api/dashboard/ai/content/[id]/approve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiBusinessMock.mockResolvedValue(authOk);
    requireProMock.mockResolvedValue(undefined);
    approveContentItemMock.mockResolvedValue({ id: "content_1", status: "approved" });
  });

  it("returns 401 when auth fails", async () => {
    requireApiBusinessMock.mockResolvedValue(authFail);

    const req = new NextRequest("http://localhost/api/dashboard/ai/content/[id]/approve", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req, { params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000003" }) });

    expect(res.status).toBe(401);
  });

  it("approves the requested content item", async () => {
    const req = new NextRequest("http://localhost/api/dashboard/ai/content/[id]/approve", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req, { params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000003" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(approveContentItemMock).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000003",
    );
    expect(body).toEqual({ item: { id: "content_1", status: "approved" } });
  });
});
