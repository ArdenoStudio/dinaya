import { describe, expect, it } from "vitest";
import { normalizeSriLankanPhone, toWhatsAppPhone } from "./phone";

describe("normalizeSriLankanPhone", () => {
  it("normalizes local numbers starting with 0", () => {
    expect(normalizeSriLankanPhone("077 123 4567")).toBe("+94771234567");
  });

  it("normalizes numbers already in +94 format", () => {
    expect(normalizeSriLankanPhone("+94771234567")).toBe("+94771234567");
  });

  it("normalizes numbers starting with 94", () => {
    expect(normalizeSriLankanPhone("94771234567")).toBe("+94771234567");
  });

  it("normalizes numbers starting with 0094", () => {
    expect(normalizeSriLankanPhone("0094771234567")).toBe("+94771234567");
  });
});

describe("toWhatsAppPhone", () => {
  it("returns digits only for WhatsApp API", () => {
    expect(toWhatsAppPhone("0771234567")).toBe("94771234567");
  });
});
