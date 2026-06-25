import { beforeEach, describe, expect, it, vi } from "vitest";

const dbSelectMock = vi.hoisted(() => vi.fn());
const dbUpdateMock = vi.hoisted(() => vi.fn());
const verifyRecurringWebhookMock = vi.hoisted(() => vi.fn());

vi.mock("@/db", () => ({
  db: {
    select: dbSelectMock,
    update: dbUpdateMock,
  },
}));

vi.mock("@/lib/payhere-subscriptions", () => ({
  verifyRecurringWebhook: verifyRecurringWebhookMock,
}));

vi.mock("@/lib/payhere", () => ({
  payhereAmountMatches: vi.fn(() => true),
}));

import { POST } from "./route";

function makeSelectQuery(result: unknown) {
  const query = {
    from: vi.fn(() => query),
    where: vi.fn(() => query),
    limit: vi.fn(async () => result),
  };

  return query;
}

function makeUpdateQuery() {
  const query = {
    set: vi.fn(() => query),
    where: vi.fn(async () => undefined),
  };

  return query;
}

function makeWebhookRequest() {
  const form = new FormData();
  form.set("merchant_id", "platform-merchant");
  form.set("order_id", "sub-order-1");
  form.set("payhere_amount", "9900.00");
  form.set("payhere_currency", "LKR");
  form.set("status_code", "-1");
  form.set("md5sig", "sig-123");

  return {
    formData: vi.fn().mockResolvedValue(form),
  } as Parameters<typeof POST>[0];
}

describe("POST /api/webhooks/payhere-subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DINAYA_PAYHERE_MERCHANT_ID = "platform-merchant";
    process.env.DINAYA_PAYHERE_MERCHANT_SECRET = "platform-secret";
    verifyRecurringWebhookMock.mockReturnValue(true);
  });

  it("keeps the subscribed plan until the current period end when cancellation arrives", async () => {
    const currentPeriodEnd = new Date("2026-07-25T00:00:00.000Z");

    dbSelectMock.mockReturnValueOnce(makeSelectQuery([{
      id: "sub-1",
      businessId: "business-1",
      plan: "pro",
      status: "active",
      amountLkr: 9900,
      billingInterval: "monthly",
      currentPeriodEnd,
      lastPaymentId: "payment-1",
      payhereSubscriptionId: "payhere-sub-1",
    }]));

    const subscriptionUpdate = makeUpdateQuery();
    const businessUpdate = makeUpdateQuery();
    dbUpdateMock
      .mockReturnValueOnce(subscriptionUpdate)
      .mockReturnValueOnce(businessUpdate);

    const res = await POST(makeWebhookRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(subscriptionUpdate.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "cancelled",
        cancelledAt: expect.any(Date),
      }),
    );
    expect(businessUpdate.set).toHaveBeenCalledWith({
      plan: "pro",
      planExpiresAt: currentPeriodEnd,
    });
  });

  it("expires the business immediately when cancellation has no period end", async () => {
    dbSelectMock.mockReturnValueOnce(makeSelectQuery([{
      id: "sub-2",
      businessId: "business-2",
      plan: "pro",
      status: "pending",
      amountLkr: 9900,
      billingInterval: "monthly",
      currentPeriodEnd: null,
      lastPaymentId: null,
      payhereSubscriptionId: null,
    }]));

    const subscriptionUpdate = makeUpdateQuery();
    const businessUpdate = makeUpdateQuery();
    dbUpdateMock
      .mockReturnValueOnce(subscriptionUpdate)
      .mockReturnValueOnce(businessUpdate);

    const res = await POST(makeWebhookRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(businessUpdate.set).toHaveBeenCalledWith({
      plan: "expired",
      planExpiresAt: null,
    });
  });
});
