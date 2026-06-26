import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeInsertQuery, makeUpdateQuery } from "@/test-utils/db-mock";

const requireApiBusinessMock = vi.hoisted(() => vi.fn());
const dbInsertMock = vi.hoisted(() => vi.fn());
const dbUpdateMock = vi.hoisted(() => vi.fn());
const requireProMock = vi.hoisted(() => vi.fn());
const getBroadcastsDashboardListMock = vi.hoisted(() => vi.fn());
const countMatchingRecipientsMock = vi.hoisted(() => vi.fn());
const sendBroadcastMock = vi.hoisted(() => vi.fn());
const serializeBroadcastMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/plan", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/plan")>();
  return { ...actual, requirePro: requireProMock };
});

vi.mock("@/lib/api-auth", () => ({
  requireApiBusiness: requireApiBusinessMock,
}));

vi.mock("@/db", () => ({
  db: {
    insert: dbInsertMock,
    update: dbUpdateMock,
  },
}));

vi.mock("@/lib/dashboard/broadcasts", () => ({
  getBroadcastsDashboardList: getBroadcastsDashboardListMock,
}));

vi.mock("@/lib/broadcasts", () => ({
  BROADCAST_AUDIENCE_TYPES: ["all", "stage", "tags"],
  BROADCAST_CHANNELS: ["sms", "email", "whatsapp"],
  countMatchingRecipients: countMatchingRecipientsMock,
  sendBroadcast: sendBroadcastMock,
  serializeBroadcast: serializeBroadcastMock,
}));

import { GET, POST } from "./route";

const authOk = { ok: true, context: { businessId: "00000000-0000-4000-8000-000000000001", userId: "00000000-0000-4000-8000-000000000002", role: "owner" } };
const authFail = { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };

describe("GET, POST /api/dashboard/broadcasts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiBusinessMock.mockResolvedValue(authOk);
    requireProMock.mockResolvedValue(undefined);
    getBroadcastsDashboardListMock.mockResolvedValue({
      rows: [{ id: "broadcast_1", name: "June campaign" }],
    });
    countMatchingRecipientsMock.mockResolvedValue(3);
    sendBroadcastMock.mockResolvedValue({
      recipientCount: 3,
      sentCount: 3,
      skippedCount: 0,
      failedCount: 0,
    });
    serializeBroadcastMock.mockImplementation((row) => row);
    dbInsertMock.mockReturnValue(makeInsertQuery([{ id: "broadcast_1", status: "draft" }]));
    dbUpdateMock.mockReturnValue(makeUpdateQuery([{ id: "broadcast_1", status: "sent" }]));
  });

  it("returns 401 when auth fails on GET", async () => {
    requireApiBusinessMock.mockResolvedValue(authFail);

    const req = new NextRequest("http://localhost/api/dashboard/broadcasts");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("returns broadcast rows for the dashboard list", async () => {
    const req = new NextRequest("http://localhost/api/dashboard/broadcasts");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(getBroadcastsDashboardListMock).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      { limit: 200 },
    );
    expect(body).toEqual([{ id: "broadcast_1", name: "June campaign" }]);
  });

  it("returns 401 when auth fails on POST", async () => {
    requireApiBusinessMock.mockResolvedValue(authFail);

    const req = new NextRequest("http://localhost/api/dashboard/broadcasts", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid broadcast payloads", async () => {
    const req = new NextRequest("http://localhost/api/dashboard/broadcasts", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Please check the broadcast details.");
    expect(countMatchingRecipientsMock).not.toHaveBeenCalled();
  });
});
