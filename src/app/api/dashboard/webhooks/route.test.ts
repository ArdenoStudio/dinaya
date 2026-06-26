import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeInsertQuery, makeSelectQuery } from "@/test-utils/db-mock";

const requireApiBusinessMock = vi.hoisted(() => vi.fn());

const dbSelectMock = vi.hoisted(() => vi.fn());
const dbInsertMock = vi.hoisted(() => vi.fn());
const requireProMock = vi.hoisted(() => vi.fn());
const isSafeWebhookDestinationMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/plan", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/plan")>();
  return { ...actual, requirePro: requireProMock };
});

vi.mock("@/lib/api-auth", () => ({
  requireApiBusiness: requireApiBusinessMock,
}));

vi.mock("@/db", () => ({
  db: {
    select: dbSelectMock,
    insert: dbInsertMock,
  },
}));

vi.mock("@/lib/webhook-url", () => ({
  isSafeWebhookDestination: isSafeWebhookDestinationMock,
}));

import { GET, POST } from "./route";

const authOk = { ok: true, context: { businessId: "00000000-0000-4000-8000-000000000001", userId: "00000000-0000-4000-8000-000000000002", role: "owner" } };
const authFail = { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };

describe("GET, POST /api/dashboard/webhooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiBusinessMock.mockResolvedValue(authOk);
    requireProMock.mockResolvedValue(undefined);
    dbSelectMock.mockReturnValue(makeSelectQuery([]));
    dbInsertMock.mockReturnValue(makeInsertQuery([{
      id: "hook_1",
      url: "https://example.com/webhook",
      events: ["booking.created"],
      isActive: true,
      createdAt: new Date("2026-06-01T00:00:00.000Z"),
    }]));
    isSafeWebhookDestinationMock.mockResolvedValue(true);
  });

  it("returns 401 when auth fails on GET", async () => {
    requireApiBusinessMock.mockResolvedValue(authFail);

    const req = new NextRequest("http://localhost/api/dashboard/webhooks");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("returns webhook rows with boolean secret flags", async () => {
    dbSelectMock.mockReturnValueOnce(makeSelectQuery([
      {
        id: "hook_1",
        url: "https://example.com/webhook",
        events: ["booking.created"],
        isActive: true,
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        hasSecret: "encrypted-secret",
      },
    ]));

    const req = new NextRequest("http://localhost/api/dashboard/webhooks");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([
      {
        id: "hook_1",
        url: "https://example.com/webhook",
        events: ["booking.created"],
        isActive: true,
        createdAt: "2026-06-01T00:00:00.000Z",
        hasSecret: true,
      },
    ]);
  });

  it("returns 401 when auth fails on POST", async () => {
    requireApiBusinessMock.mockResolvedValue(authFail);

    const req = new NextRequest("http://localhost/api/dashboard/webhooks", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid webhook payloads", async () => {
    const req = new NextRequest("http://localhost/api/dashboard/webhooks", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Please check the webhook details.");
    expect(dbInsertMock).not.toHaveBeenCalled();
  });
});
