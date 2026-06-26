import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireApiBusinessMock = vi.hoisted(() => vi.fn());
const dbSelectMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-auth", () => ({
  requireApiBusiness: requireApiBusinessMock,
}));

vi.mock("@/db", () => ({
  db: {
    select: dbSelectMock,
  },
}));

import { GET } from "./route";

type QueryResult = unknown;

function makeLimitQuery(result: QueryResult) {
  const query = {
    from: vi.fn(() => query),
    innerJoin: vi.fn(() => query),
    limit: vi.fn(async () => result),
    orderBy: vi.fn(() => query),
    where: vi.fn(() => query),
  };
  return query;
}

function makeWhereQuery(result: QueryResult) {
  const query = {
    from: vi.fn(() => query),
    where: vi.fn(async () => result),
  };
  return query;
}

describe("GET /api/dashboard/desktop/poll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    requireApiBusinessMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/dashboard/desktop/poll");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(dbSelectMock).not.toHaveBeenCalled();
  });

  it("returns tenant-scoped payload and today counter", async () => {
    requireApiBusinessMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001" },
    });

    const businessQ = makeLimitQuery([{ timezone: "Asia/Colombo" }]);
    const countQ = makeWhereQuery([{ todayBookings: 4 }]);
    const upcomingQ = makeLimitQuery([
      {
        id: "bk_1",
        clientName: "Kasun Perera",
        serviceName: "Haircut",
        startsAt: new Date("2026-05-26T09:00:00.000Z"),
        status: "confirmed",
      },
    ]);

    dbSelectMock
      .mockReturnValueOnce(businessQ)
      .mockReturnValueOnce(countQ)
      .mockReturnValueOnce(upcomingQ);

    const req = new NextRequest("http://localhost/api/dashboard/desktop/poll?windowMinutes=180");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.todayBookings).toBe(4);
    expect(body.upcoming).toEqual([
      {
        id: "bk_1",
        clientName: "Kasun Perera",
        serviceName: "Haircut",
        startsAt: "2026-05-26T09:00:00.000Z",
        status: "confirmed",
      },
    ]);
  });

  it("applies since filter path and allows empty upcoming rows", async () => {
    requireApiBusinessMock.mockResolvedValue({
      ok: true,
      context: { businessId: "biz_2" },
    });

    dbSelectMock
      .mockReturnValueOnce(makeLimitQuery([{ timezone: "Asia/Colombo" }]))
      .mockReturnValueOnce(makeWhereQuery([{ todayBookings: 0 }]))
      .mockReturnValueOnce(makeLimitQuery([]));

    const req = new NextRequest(
      "http://localhost/api/dashboard/desktop/poll?since=2026-05-26T08:00:00.000Z",
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.upcoming).toEqual([]);
    expect(body.todayBookings).toBe(0);
  });

  it("returns 400 for malformed since", async () => {
    requireApiBusinessMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001" },
    });

    const req = new NextRequest(
      "http://localhost/api/dashboard/desktop/poll?since=definitely-not-a-date",
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("since");
  });

  it("returns 400 for malformed windowMinutes", async () => {
    requireApiBusinessMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001" },
    });

    const req = new NextRequest("http://localhost/api/dashboard/desktop/poll?windowMinutes=abc");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("windowMinutes");
  });

  it("clamps out-of-range windowMinutes and still returns success", async () => {
    requireApiBusinessMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001" },
    });

    dbSelectMock
      .mockReturnValueOnce(makeLimitQuery([{ timezone: "Asia/Colombo" }]))
      .mockReturnValueOnce(makeWhereQuery([{ todayBookings: 2 }]))
      .mockReturnValueOnce(makeLimitQuery([]));

    const req = new NextRequest("http://localhost/api/dashboard/desktop/poll?windowMinutes=9999");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.todayBookings).toBe(2);
    expect(body.upcoming).toEqual([]);
  });
});
