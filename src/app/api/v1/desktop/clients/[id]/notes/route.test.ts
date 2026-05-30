import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireDesktopWriteMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const createClientDashboardNoteMock = vi.hoisted(() => vi.fn());
const getClientDashboardDetailMock = vi.hoisted(() => vi.fn());

function validNote(value: unknown) {
  if (!value || typeof value !== "object") return { success: false };
  const input = value as { body?: unknown };
  if (typeof input.body !== "string" || !input.body.trim()) return { success: false };
  return { success: true, data: { body: input.body.trim() } };
}

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopWrite: requireDesktopWriteMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

vi.mock("@/lib/dashboard/clients", () => ({
  clientNoteCreateSchema: { safeParse: validNote },
  createClientDashboardNote: createClientDashboardNoteMock,
  getClientDashboardDetail: getClientDashboardDetailMock,
}));

import { POST } from "./route";

describe("POST /api/v1/desktop/clients/:id/notes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    withRateLimitMock.mockResolvedValue({ ok: true });
    requireDesktopWriteMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_1", deviceId: "device_1" },
    });
    getClientDashboardDetailMock.mockResolvedValue({
      bookings: [],
      client: {
        communicationOptOut: false,
        createdAt: "2026-05-01T00:00:00.000Z",
        email: "kasun@example.com",
        id: "client_1",
        internalNotes: null,
        lastAiContactAt: null,
        loyaltyTier: null,
        name: "Kasun",
        phone: "+94770000000",
        source: "booking_page",
        stage: "active",
        tags: [],
      },
      notes: [
        {
          body: "Prefers mornings",
          createdAt: "2026-05-29T04:00:00.000Z",
          id: "note_1",
        },
      ],
    });
  });

  it("requires desktop write auth", async () => {
    requireDesktopWriteMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/clients/client_1/notes", {
      body: JSON.stringify({ body: "Prefers mornings" }),
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: "client_1" }) });

    expect(res.status).toBe(401);
    expect(createClientDashboardNoteMock).not.toHaveBeenCalled();
  });

  it("creates a note and returns refreshed client detail", async () => {
    createClientDashboardNoteMock.mockResolvedValue({
      note: { id: "note_1" },
      status: "created",
    });

    const req = new NextRequest("http://localhost/api/v1/desktop/clients/client_1/notes", {
      body: JSON.stringify({ body: " Prefers mornings " }),
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: "client_1" }) });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(createClientDashboardNoteMock).toHaveBeenCalledWith("biz_1", "client_1", {
      body: "Prefers mornings",
    });
    expect(body.webUrl).toBe("/dashboard/clients/client_1");
    expect(body.notes).toHaveLength(1);
    expect(body.serverTime).toEqual(expect.any(String));
  });

  it("rejects empty notes", async () => {
    const req = new NextRequest("http://localhost/api/v1/desktop/clients/client_1/notes", {
      body: JSON.stringify({ body: "   " }),
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: "client_1" }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Note body is required.");
    expect(createClientDashboardNoteMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the client is outside the tenant", async () => {
    createClientDashboardNoteMock.mockResolvedValue({ error: "Not found", status: "not_found" });

    const req = new NextRequest("http://localhost/api/v1/desktop/clients/client_1/notes", {
      body: JSON.stringify({ body: "Call before appointment" }),
      method: "POST",
    });
    const res = await POST(req, { params: Promise.resolve({ id: "client_1" }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found");
    expect(getClientDashboardDetailMock).not.toHaveBeenCalled();
  });
});
