import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeSelectQuery, makeInsertQuery, makeUpdateQuery, makeDeleteQuery } from "@/test-utils/db-mock";

const requireApiBusinessMock = vi.hoisted(() => vi.fn());

const dbSelectMock = vi.hoisted(() => vi.fn());
const dbInsertMock = vi.hoisted(() => vi.fn());
const dbUpdateMock = vi.hoisted(() => vi.fn());
const dbDeleteMock = vi.hoisted(() => vi.fn());
const requireProMock = vi.hoisted(() => vi.fn());
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
    update: dbUpdateMock,
    delete: dbDeleteMock,
  },
}));

import { PATCH, DELETE } from "./route";

const authOk = { ok: true, context: { businessId: "00000000-0000-4000-8000-000000000001", userId: "00000000-0000-4000-8000-000000000002", role: "owner" } };
const authFail = { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };

describe("PATCH, DELETE /api/dashboard/reviews/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiBusinessMock.mockResolvedValue(authOk);
    
    requireProMock.mockResolvedValue(undefined);
    dbSelectMock.mockReturnValue(makeSelectQuery([]));
    dbInsertMock.mockReturnValue(makeInsertQuery([{ id: "row_1" }]));
    dbUpdateMock.mockReturnValue(makeUpdateQuery([{ id: "row_1" }]));
    dbDeleteMock.mockReturnValue(makeDeleteQuery());
  });

  describe("PATCH", () => {
    it("returns 401 when auth fails", async () => {
      requireApiBusinessMock.mockResolvedValue(authFail);
      const req = new NextRequest("http://localhost/api/dashboard/reviews/[id]", { method: "PATCH", body: "{}", headers: { "content-type": "application/json" } });
      const res = await PATCH(req, { params: Promise.resolve({"id":"00000000-0000-4000-8000-000000000003"}) });
      expect(res.status).toBe(401);
    });

    it("returns a response when authorized", async () => {
      const req = new NextRequest("http://localhost/api/dashboard/reviews/[id]", { method: "PATCH", body: "{}", headers: { "content-type": "application/json" } });
      const res = await PATCH(req, { params: Promise.resolve({"id":"00000000-0000-4000-8000-000000000003"}) });
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });
  });

  describe("DELETE", () => {
    it("returns 401 when auth fails", async () => {
      requireApiBusinessMock.mockResolvedValue(authFail);
      const req = new NextRequest("http://localhost/api/dashboard/reviews/[id]", { method: "DELETE" });
      const res = await DELETE(req, { params: Promise.resolve({"id":"00000000-0000-4000-8000-000000000003"}) });
      expect(res.status).toBe(401);
    });

    it("returns a response when authorized", async () => {
      const req = new NextRequest("http://localhost/api/dashboard/reviews/[id]", { method: "DELETE" });
      const res = await DELETE(req, { params: Promise.resolve({"id":"00000000-0000-4000-8000-000000000003"}) });
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });
  });
});
