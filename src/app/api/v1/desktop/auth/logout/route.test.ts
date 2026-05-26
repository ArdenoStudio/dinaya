import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const dbUpdateMock = vi.hoisted(() => vi.fn());
const requireDesktopReadMock = vi.hoisted(() => vi.fn());

vi.mock("@/db", () => ({
  db: {
    update: dbUpdateMock,
  },
}));

vi.mock("@/app/api/v1/desktop/_shared", () => ({
  requireDesktopRead: requireDesktopReadMock,
}));

import { POST } from "./route";

function makeUpdateQuery() {
  const query = {
    set: vi.fn(() => query),
    where: vi.fn(async () => undefined),
  };
  return query;
}

describe("POST /api/v1/desktop/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireDesktopReadMock.mockResolvedValue({
      ok: true,
      context: {
        businessId: "biz_1",
        keyId: "key_1",
      },
    });
  });

  it("revokes the authenticated desktop key", async () => {
    const query = makeUpdateQuery();
    dbUpdateMock.mockReturnValueOnce(query);

    const req = new NextRequest("http://localhost/api/v1/desktop/auth/logout", {
      method: "POST",
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(query.set).toHaveBeenCalledWith({ revokedAt: expect.any(Date) });
    expect(query.where).toHaveBeenCalled();
  });

  it("rejects missing or revoked desktop keys", async () => {
    const response = Response.json({ error: "Unauthorized" }, { status: 401 });
    requireDesktopReadMock.mockResolvedValueOnce({ ok: false, response });

    const req = new NextRequest("http://localhost/api/v1/desktop/auth/logout", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(dbUpdateMock).not.toHaveBeenCalled();
  });
});
