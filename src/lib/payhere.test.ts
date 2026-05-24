import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { buildPayhereFormData, generatePayhereHash, payhereAmountMatches, verifyPayhereWebhook } from "./payhere";

function md5(str: string): string {
  return crypto.createHash("md5").update(str).digest("hex").toUpperCase();
}

describe("payhere", () => {
  const merchantId = "1211149";
  const merchantSecret = "test-secret";
  const orderId = "ORDER123";

  it("generates a stable checkout hash", () => {
    const hash = generatePayhereHash({
      merchantId,
      orderId,
      amountLkr: 1500,
      merchantSecret,
    });

    expect(hash).toMatch(/^[A-F0-9]{32}$/);
    expect(
      generatePayhereHash({ merchantId, orderId, amountLkr: 1500, merchantSecret }),
    ).toBe(hash);
  });

  it("builds checkout form data with hash", () => {
    const form = buildPayhereFormData({
      merchantId,
      merchantSecret,
      orderId,
      amountLkr: 1500,
      itemName: "Haircut",
      firstName: "Nimal",
      phone: "+94771234567",
      notifyUrl: "https://dinaya.lk/api/webhooks/payhere",
      returnUrl: "https://dinaya.lk/book/salon/confirmed",
      cancelUrl: "https://dinaya.lk/book/salon",
    });

    expect(form.hash).toMatch(/^[A-F0-9]{32}$/);
    expect(form.amount).toBe("1500.00");
    expect(form.currency).toBe("LKR");
  });

  it("verifies webhook signatures", () => {
    const amount = "1500.00";
    const currency = "LKR";
    const statusCode = "2";
    const hashedSecret = md5(merchantSecret);
    const md5sig = md5(`${merchantId}${orderId}${amount}${currency}${statusCode}${hashedSecret}`);

    expect(
      verifyPayhereWebhook({
        merchantId,
        orderId,
        payhereAmount: amount,
        payhereCurrency: currency,
        statusCode,
        md5sig,
        merchantSecret,
      }),
    ).toBe(true);

    expect(
      verifyPayhereWebhook({
        merchantId,
        orderId,
        payhereAmount: amount,
        payhereCurrency: currency,
        statusCode,
        md5sig: "INVALID",
        merchantSecret,
      }),
    ).toBe(false);
  });

  it("matches PayHere amount strings to stored LKR integers", () => {
    expect(payhereAmountMatches(1500, "1500.00")).toBe(true);
    expect(payhereAmountMatches(1500, "1500.01")).toBe(false);
  });
});
