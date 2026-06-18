import { convertLkrToUsd } from "@/lib/payments/amounts";

type PaypalCapturePayload = {
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    invoice_id?: string;
    payments?: {
      captures?: Array<{
        status?: string;
        amount?: { currency_code?: string; value?: string };
      }>;
    };
  }>;
};

export function validatePaypalCaptureForBooking(input: {
  payload: unknown;
  bookingId: string;
  paymentId: string;
  amountLkr: number;
}): { ok: true } | { ok: false; error: string } {
  const data = input.payload as PaypalCapturePayload;
  const unit = data.purchase_units?.[0];
  if (!unit) {
    return { ok: false, error: "PayPal capture payload is invalid." };
  }

  const bookingRef = unit.custom_id ?? unit.reference_id;
  if (bookingRef !== input.bookingId) {
    return { ok: false, error: "PayPal order does not match this booking." };
  }

  if (unit.invoice_id && unit.invoice_id !== input.paymentId) {
    return { ok: false, error: "PayPal payment record mismatch." };
  }

  const capture = unit.payments?.captures?.[0];
  if (!capture || capture.status !== "COMPLETED") {
    return { ok: false, error: "PayPal payment was not completed." };
  }

  const expectedUsd = convertLkrToUsd(input.amountLkr).toFixed(2);
  const capturedUsd = capture.amount?.value;
  const capturedCurrency = capture.amount?.currency_code;

  if (capturedCurrency !== "USD" || capturedUsd !== expectedUsd) {
    return { ok: false, error: "PayPal payment amount does not match this booking." };
  }

  return { ok: true };
}
