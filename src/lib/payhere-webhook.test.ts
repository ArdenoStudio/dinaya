import { describe, expect, it } from "vitest";
import { parsePayhereWebhookFields } from "./payhere-webhook";

describe("parsePayhereWebhookFields", () => {
  it("returns parsed fields for a complete PayHere callback", () => {
    const form = new FormData();
    form.set("merchant_id", "1211149");
    form.set("order_id", "ORDER123");
    form.set("payhere_amount", "1500.00");
    form.set("payhere_currency", "LKR");
    form.set("status_code", "2");
    form.set("md5sig", "ABC123");

    expect(parsePayhereWebhookFields(form)).toEqual({
      merchantId: "1211149",
      orderId: "ORDER123",
      payhereAmount: "1500.00",
      payhereCurrency: "LKR",
      statusCode: "2",
      md5sig: "ABC123",
    });
  });

  it("returns null when required fields are missing", () => {
    const form = new FormData();
    form.set("merchant_id", "1211149");
    expect(parsePayhereWebhookFields(form)).toBeNull();
  });
});
