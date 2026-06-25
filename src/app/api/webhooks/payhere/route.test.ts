import { beforeEach, describe, expect, it, vi } from "vitest";

const dbSelectMock = vi.hoisted(() => vi.fn());
const dbUpdateMock = vi.hoisted(() => vi.fn());
const parsePayhereWebhookFieldsMock = vi.hoisted(() => vi.fn());
const verifyPayhereWebhookMock = vi.hoisted(() => vi.fn());
const decryptSecretMock = vi.hoisted(() => vi.fn());
const releaseDealSlotForBookingMock = vi.hoisted(() => vi.fn());

vi.mock("@/db", () => ({
  db: {
    select: dbSelectMock,
    update: dbUpdateMock,
  },
}));

vi.mock("@/lib/payhere", () => ({
  payhereAmountMatches: vi.fn(() => true),
  verifyPayhereWebhook: verifyPayhereWebhookMock,
}));

vi.mock("@/lib/payhere-webhook", () => ({
  parsePayhereWebhookFields: parsePayhereWebhookFieldsMock,
}));

vi.mock("@/lib/resend", () => ({
  sendBookingNotificationToBusiness: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/messaging/booking-messages", () => ({
  sendBookingConfirmationMessage: vi.fn().mockResolvedValue(undefined),
  sendBookingNotificationToBusinessMessage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/client-tokens", () => ({
  buildClientBookingUrl: vi.fn(() => "/manage-booking"),
}));

vi.mock("@/lib/activity-log", () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/secrets", () => ({
  decryptSecret: decryptSecretMock,
}));

vi.mock("@/lib/automations/engine", () => ({
  processBookingAutomationTrigger: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/deals/claim", () => ({
  releaseDealSlotForBooking: releaseDealSlotForBookingMock,
}));

vi.mock("@/lib/receipts", () => ({
  sendPaymentReceiptEmail: vi.fn().mockResolvedValue({ status: "skipped" }),
}));

vi.mock("@/lib/after-response", () => ({
  logRejectedSettled: vi.fn(),
  runAfterResponse: vi.fn(),
}));

vi.mock("@/lib/dashboard/db-compat", () => ({
  hasPublicColumn: vi.fn().mockResolvedValue(false),
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

function makeUpdateQuery(result: unknown) {
  const query = {
    set: vi.fn(() => query),
    where: vi.fn(() => query),
    returning: vi.fn(async () => result),
  };

  return query;
}

const paymentRow = {
  id: "payment-1",
  bookingId: "booking-1",
  amountLkr: 5000,
  status: "pending",
};

const bookingRow = {
  id: "booking-1",
  businessId: "business-1",
  status: "pending",
  clientEmail: "ada@example.com",
  clientName: "Ada",
  clientPhone: "+94771234567",
  serviceId: "service-1",
  staffId: "staff-1",
  startsAt: new Date("2026-06-25T09:00:00.000Z"),
};

const businessBaseRow = {
  email: "owner@example.com",
  phone: "+94770000000",
  name: "Dinaya Salon",
  payhereMerchantId: "merchant-123",
  payhereMerchantSecret: "encrypted-secret",
  slug: "dinaya-salon",
  plan: "pro",
  language: "en",
};

describe("POST /api/webhooks/payhere", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    parsePayhereWebhookFieldsMock.mockReturnValue({
      merchantId: "merchant-123",
      orderId: "order-123",
      payhereAmount: "5000.00",
      payhereCurrency: "LKR",
      statusCode: "-1",
      md5sig: "sig-123",
    });
    verifyPayhereWebhookMock.mockReturnValue(true);
    decryptSecretMock.mockReturnValue("merchant-secret");
    releaseDealSlotForBookingMock.mockResolvedValue(undefined);
  });

  it("rejects the webhook when the business merchant id is missing", async () => {
    dbSelectMock
      .mockReturnValueOnce(makeSelectQuery([paymentRow]))
      .mockReturnValueOnce(makeSelectQuery([bookingRow]))
      .mockReturnValueOnce(makeSelectQuery([{ ...businessBaseRow, payhereMerchantId: null }]));

    const req = {
      formData: vi.fn().mockResolvedValue(new FormData()),
    } as unknown as Parameters<typeof POST>[0];

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "Invalid webhook" });
    expect(verifyPayhereWebhookMock).not.toHaveBeenCalled();
    expect(dbUpdateMock).not.toHaveBeenCalled();
  });

  it("marks the payment failed, cancels the booking, and releases the deal slot", async () => {
    dbSelectMock
      .mockReturnValueOnce(makeSelectQuery([paymentRow]))
      .mockReturnValueOnce(makeSelectQuery([bookingRow]))
      .mockReturnValueOnce(makeSelectQuery([businessBaseRow]));

    const paymentUpdate = makeUpdateQuery([{ id: paymentRow.id }]);
    const bookingUpdate = makeUpdateQuery([{ id: bookingRow.id }]);
    dbUpdateMock
      .mockReturnValueOnce(paymentUpdate)
      .mockReturnValueOnce(bookingUpdate);

    const req = {
      formData: vi.fn().mockResolvedValue(new FormData()),
    } as unknown as Parameters<typeof POST>[0];

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ received: true });
    expect(paymentUpdate.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        payherePayload: {},
      }),
    );
    expect(bookingUpdate.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "cancelled",
        cancelledAt: expect.any(Date),
        cancellationReason: "Payment not completed in time.",
      }),
    );
    expect(releaseDealSlotForBookingMock).toHaveBeenCalledWith(bookingRow.id, "pending");
  });
});
