import { describe, expect, it } from "vitest";
import {
  getAvailablePaymentMethods,
  isLikelySriLankanPhone,
  resolveDefaultPaymentMethod,
  resolveOnlinePaymentMethod,
} from "@/lib/payments/resolve";

const business = {
  payhereEnabled: true,
  payhereMerchantId: "mid",
  payhereMerchantSecret: "secret",
  paypalEnabled: true,
  paypalClientId: "cid",
  paypalClientSecret: "secret",
  bankTransferInstructions: null,
  lankaqrImageUrl: null,
};

describe("payment resolve", () => {
  it("detects Sri Lankan phone numbers", () => {
    expect(isLikelySriLankanPhone("+94771234567")).toBe(true);
    expect(isLikelySriLankanPhone("+14155550123")).toBe(false);
  });

  it("lists payhere and paypal when both are configured", () => {
    const methods = getAvailablePaymentMethods(business, true, 5000, true, true);
    expect(methods).toEqual(["payhere", "paypal"]);
  });

  it("defaults local customers to payhere", () => {
    const methods = getAvailablePaymentMethods(business, true, 5000, true, true);
    expect(resolveDefaultPaymentMethod(methods, "+94771234567")).toBe("payhere");
  });

  it("defaults international customers to paypal", () => {
    const methods = getAvailablePaymentMethods(business, true, 5000, true, true);
    expect(resolveOnlinePaymentMethod({
      methods,
      clientPhone: "+14155550123",
    })).toBe("paypal");
  });
});
