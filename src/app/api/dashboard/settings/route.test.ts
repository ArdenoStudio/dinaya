import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeUpdateQuery } from "@/test-utils/db-mock";

const requireApiBusinessMock = vi.hoisted(() => vi.fn());
const dbUpdateMock = vi.hoisted(() => vi.fn());
const logActivityMock = vi.hoisted(() => vi.fn());
const syncBusinessPrimaryLocationMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-auth", () => ({
  requireApiBusiness: requireApiBusinessMock,
}));

vi.mock("@/db", () => ({
  db: {
    update: dbUpdateMock,
  },
}));

vi.mock("@/lib/activity-log", () => ({
  logActivity: logActivityMock,
}));

vi.mock("@/lib/locations", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/locations")>();
  return {
    ...actual,
    syncBusinessPrimaryLocation: syncBusinessPrimaryLocationMock,
  };
});

import { PATCH } from "./route";

const authOk = {
  ok: true,
  context: {
    businessId: "00000000-0000-4000-8000-000000000001",
    userId: "00000000-0000-4000-8000-000000000002",
    role: "owner",
    user: { id: "00000000-0000-4000-8000-000000000002" },
  },
};
const authFail = { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };

describe("PATCH /api/dashboard/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiBusinessMock.mockResolvedValue(authOk);
    dbUpdateMock.mockReturnValue(makeUpdateQuery(undefined));
    syncBusinessPrimaryLocationMock.mockResolvedValue(undefined);
    logActivityMock.mockResolvedValue(undefined);
  });

  it("returns 401 when auth fails", async () => {
    requireApiBusinessMock.mockResolvedValue(authFail);

    const req = new NextRequest("http://localhost/api/dashboard/settings", {
      method: "PATCH",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req);

    expect(res.status).toBe(401);
  });

  it("updates business settings for the authorized owner", async () => {
    const req = new NextRequest("http://localhost/api/dashboard/settings", {
      method: "PATCH",
      body: JSON.stringify({
        name: "Dinaya Salon",
        phone: "+94770000000",
        websiteUrl: "https://dinaya.lk",
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: { id: "00000000-0000-4000-8000-000000000001" },
    });
    expect(dbUpdateMock).toHaveBeenCalledTimes(1);
    expect(syncBusinessPrimaryLocationMock).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      {
        name: "Dinaya Salon",
        phone: "+94770000000",
      },
    );
    expect(logActivityMock).toHaveBeenCalledTimes(1);
  });
});
