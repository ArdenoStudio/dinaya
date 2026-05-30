import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopReadMock = vi.hoisted(() => vi.fn());
const requireDesktopWriteMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getClientDashboardDetailMock = vi.hoisted(() => vi.fn());
const updateClientDashboardFieldsMock = vi.hoisted(() => vi.fn());

function validClientUpdate(value: unknown) {
  if (!value || typeof value !== "object") return { success: false, error: { flatten: () => ({ fieldErrors: {} }) } };
  const input = value as { name?: unknown; phone?: unknown; stage?: unknown };
  if (typeof input.name === "string" && input.name.trim()) {
    return { success: true, data: { ...value, name: input.name.trim() } };
  }
  if (typeof input.phone === "string" && input.phone.trim().length >= 7) {
    return { success: true, data: value };
  }
  if (typeof input.stage === "string" && ["lead", "prospect", "active", "churned"].includes(input.stage)) {
    return { success: true, data: value };
  }
  return { success: false, error: { flatten: () => ({ fieldErrors: { name: ["Required"] } }) } };
}

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
  requireDesktopWrite: requireDesktopWriteMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/clients", () => ({
  clientDashboardUpdateSchema: { safeParse: validClientUpdate },
  getClientDashboardDetail: getClientDashboardDetailMock,
  updateClientDashboardFields: updateClientDashboardFieldsMock,
}));

import { GET, PATCH } from "./route";

describe("GET /api/v1/desktop/clients/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });
    requireDesktopWriteMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });
  });

  it("returns auth response when desktop key is missing", async () => {
    requireDesktopReadMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/clients/client_1");
    const res = await GET(req, { params: Promise.resolve({ id: "client_1" }) });

    expect(res.status).toBe(401);
    expect(getClientDashboardDetailMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the client is outside the tenant", async () => {
    getClientDashboardDetailMock.mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/v1/desktop/clients/client_1");
    const res = await GET(req, { params: Promise.resolve({ id: "client_1" }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found.");
    expect(getClientDashboardDetailMock).toHaveBeenCalledWith("biz_1", "client_1");
  });

  it("returns client profile, booking history, and notes", async () => {
    getClientDashboardDetailMock.mockResolvedValue({
      client: {
        communicationOptOut: false,
        createdAt: "2026-05-01T00:00:00.000Z",
        email: "kasun@example.com",
        id: "client_1",
        internalNotes: "VIP",
        lastAiContactAt: null,
        loyaltyTier: "gold",
        name: "Kasun",
        phone: "+94770000000",
        source: "booking_page",
        stage: "active",
        tags: ["regular"],
      },
      bookings: [
        {
          id: "booking_1",
          serviceName: "Haircut",
          staffName: "Ashan",
          startsAt: "2026-05-28T09:00:00.000Z",
          status: "confirmed",
        },
      ],
      notes: [
        {
          body: "Prefers mornings",
          createdAt: "2026-05-20T10:00:00.000Z",
          id: "note_1",
        },
      ],
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/clients/client_1");
    const res = await GET(req, { params: Promise.resolve({ id: "client_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.webUrl).toBe("/dashboard/clients/client_1");
    expect(body.client).toMatchObject({ id: "client_1", name: "Kasun", stage: "active" });
    expect(body.bookings).toHaveLength(1);
    expect(body.notes).toHaveLength(1);
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("updates client profile fields through the desktop write bridge", async () => {
    updateClientDashboardFieldsMock.mockResolvedValue({
      client: { id: "client_1", name: "Kasun Perera" },
      status: "updated",
    });
    getClientDashboardDetailMock.mockResolvedValue({
      bookings: [],
      client: {
        communicationOptOut: true,
        createdAt: "2026-05-01T00:00:00.000Z",
        email: "kasun@example.com",
        id: "client_1",
        internalNotes: "VIP",
        lastAiContactAt: null,
        loyaltyTier: "gold",
        name: "Kasun Perera",
        phone: "+94770000000",
        source: "booking_page",
        stage: "active",
        tags: ["regular"],
      },
      notes: [],
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/clients/client_1", {
      body: JSON.stringify({
        communicationOptOut: true,
        name: " Kasun Perera ",
        phone: "0770000000",
        stage: "active",
      }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "client_1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(updateClientDashboardFieldsMock).toHaveBeenCalledWith("biz_1", "client_1", expect.objectContaining({
      communicationOptOut: true,
      name: "Kasun Perera",
      phone: "0770000000",
      stage: "active",
    }));
    expect(body.client).toMatchObject({ id: "client_1", name: "Kasun Perera", stage: "active" });
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("requires desktop write auth for client updates", async () => {
    requireDesktopWriteMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/clients/client_1", {
      body: JSON.stringify({ name: "Kasun" }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "client_1" }) });

    expect(res.status).toBe(401);
    expect(updateClientDashboardFieldsMock).not.toHaveBeenCalled();
  });

  it("rejects malformed desktop client updates", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/clients/client_1", {
      body: JSON.stringify({ name: "" }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "client_1" }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Please check the client details.");
    expect(updateClientDashboardFieldsMock).not.toHaveBeenCalled();
  });

  it("returns 404 when updating a client outside the tenant", async () => {
    updateClientDashboardFieldsMock.mockResolvedValue({ error: "Not found", status: "not_found" });

    const req = new NextRequest("http://localhost/api/v1/desktop/clients/client_1", {
      body: JSON.stringify({ name: "Kasun" }),
      method: "PATCH",
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "client_1" }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found");
  });
});
