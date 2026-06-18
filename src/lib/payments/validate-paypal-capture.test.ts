import { describe, expect, it } from "vitest";
import { validatePaypalCaptureForBooking } from "@/lib/payments/validate-paypal-capture";

const bookingId = "11111111-1111-1111-1111-111111111111";
const paymentId = "22222222-2222-2222-2222-222222222222";

function completedPayload(amountUsd: string) {
  return {
    purchase_units: [
      {
        reference_id: bookingId,
        custom_id: bookingId,
        invoice_id: paymentId,
        payments: {
          captures: [
            {
              status: "COMPLETED",
              amount: { currency_code: "USD", value: amountUsd },
            },
          ],
        },
      },
    ],
  };
}

describe("validatePaypalCaptureForBooking", () => {
  it("accepts a matching completed capture", () => {
    const result = validatePaypalCaptureForBooking({
      payload: completedPayload("3.34"),
      bookingId,
      paymentId,
      amountLkr: 1000,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects booking id mismatch", () => {
    const result = validatePaypalCaptureForBooking({
      payload: completedPayload("3.34"),
      bookingId,
      paymentId: "other-payment",
      amountLkr: 1000,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects amount mismatch", () => {
    const result = validatePaypalCaptureForBooking({
      payload: completedPayload("0.01"),
      bookingId,
      paymentId,
      amountLkr: 1000,
    });
    expect(result.ok).toBe(false);
  });
});
