import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeSelectQuery, makeInsertQuery, makeUpdateQuery, makeDeleteQuery } from "@/test-utils/db-mock";

const requireApiBusinessMock = vi.hoisted(() => vi.fn());

const dbSelectMock = vi.hoisted(() => vi.fn());
const dbInsertMock = vi.hoisted(() => vi.fn());
const dbUpdateMock = vi.hoisted(() => vi.fn());
const dbDeleteMock = vi.hoisted(() => vi.fn());

const cancelPayhereSubscriptionMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const buildRecurringFormDataMock = vi.hoisted(() =>
  vi.fn().mockReturnValue({ merchant_id: "test" }),
);

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

vi.mock("@/lib/payhere-subscriptions", () => ({
  buildRecurringFormData: buildRecurringFormDataMock,
  cancelPayhereSubscription: cancelPayhereSubscriptionMock,
  PAYHERE_CHECKOUT_URL: "https://sandbox.payhere.lk/pay/checkout",
}));

import { POST } from "./route";

const authOk = {
  ok: true,
  context: {
    businessId: "00000000-0000-4000-8000-000000000001",
    userId: "00000000-0000-4000-8000-000000000002",
    user: { id: "00000000-0000-4000-8000-000000000002" },
    role: "owner",
  },
};
const authFail = { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };

describe("POST /api/billing/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiBusinessMock.mockResolvedValue(authOk);
    
    
    dbSelectMock.mockReturnValue(makeSelectQuery([]));
    dbInsertMock.mockReturnValue(makeInsertQuery([{ id: "row_1" }]));
    dbUpdateMock.mockReturnValue(makeUpdateQuery([{ id: "row_1" }]));
    dbDeleteMock.mockReturnValue(makeDeleteQuery());
  });

  describe("POST", () => {
    it("returns 401 when auth fails", async () => {
      requireApiBusinessMock.mockResolvedValue(authFail);
      const req = new NextRequest("http://localhost/api/billing/subscribe", { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns a response when authorized", async () => {
      const req = new NextRequest("http://localhost/api/billing/subscribe", { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
      const res = await POST(req);
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });

    it("upgrades by cancelling the existing lower-tier subscription instead of blocking", async () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://dinaya.lk";

      dbSelectMock
        .mockReturnValueOnce(
          makeSelectQuery([
            {
              id: authOk.context.businessId,
              name: "Test Salon",
              email: "owner@example.com",
              phone: "0771234567",
              plan: "pro",
            },
          ]),
        )
        .mockReturnValueOnce(
          makeSelectQuery([
            {
              id: "existing_sub_1",
              plan: "pro",
              status: "active",
              payhereSubscriptionId: "phsub_existing",
            },
          ]),
        )
        .mockReturnValueOnce(makeSelectQuery([{ name: "Owner Name", email: "owner@example.com" }]));

      const req = new NextRequest("http://localhost/api/billing/subscribe", {
        method: "POST",
        body: JSON.stringify({ plan: "max", interval: "monthly" }),
        headers: { "content-type": "application/json" },
      });
      const res = await POST(req);

      expect(cancelPayhereSubscriptionMock).toHaveBeenCalledWith("phsub_existing");
      expect(dbUpdateMock).toHaveBeenCalled();
      expect(dbInsertMock).toHaveBeenCalled();
      expect(res.status).toBe(200);
    });

    it("still blocks re-subscribing to the same or lower plan", async () => {
      dbSelectMock
        .mockReturnValueOnce(
          makeSelectQuery([
            {
              id: authOk.context.businessId,
              name: "Test Salon",
              email: "owner@example.com",
              phone: "0771234567",
              plan: "starter",
            },
          ]),
        )
        .mockReturnValueOnce(
          makeSelectQuery([
            {
              id: "existing_sub_1",
              plan: "pro",
              status: "active",
              payhereSubscriptionId: "phsub_existing",
            },
          ]),
        );

      const req = new NextRequest("http://localhost/api/billing/subscribe", {
        method: "POST",
        body: JSON.stringify({ plan: "pro", interval: "monthly" }),
        headers: { "content-type": "application/json" },
      });
      const res = await POST(req);

      expect(cancelPayhereSubscriptionMock).not.toHaveBeenCalled();
      expect(res.status).toBe(409);
    });
  });
});
