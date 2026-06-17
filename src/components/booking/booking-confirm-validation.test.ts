import { describe, expect, it } from "vitest";
import {
  isValidEmail,
  isValidPhone,
  validateConfirmFields,
} from "@/components/booking/booking-confirm-validation";
import { buildSuccessRedirectUrl } from "@/lib/booking/success-redirect";

const messages = {
  nameRequired: "Name required",
  phoneRequired: "Phone required",
  phoneInvalid: "Phone invalid",
  emailInvalid: "Email invalid",
  intakeRequired: (label: string) => `Required: ${label}`,
};

describe("booking confirm validation", () => {
  it("accepts valid contact details", () => {
    const result = validateConfirmFields({
      clientName: "Nimal",
      clientPhone: "+94 77 123 4567",
      clientEmail: "nimal@example.com",
      intakeQuestions: [],
      intakeAnswers: {},
      messages,
    });
    expect(result.valid).toBe(true);
  });

  it("rejects invalid email and missing required intake", () => {
    const result = validateConfirmFields({
      clientName: "Nimal",
      clientPhone: "0771234567",
      clientEmail: "not-an-email",
      intakeQuestions: [{ id: "q1", label: "Symptoms", type: "text", required: true }],
      intakeAnswers: {},
      messages,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.clientEmail).toBe("Email invalid");
    expect(result.errors.intake?.q1).toBe("Required: Symptoms");
  });
});

describe("phone and email helpers", () => {
  it("validates phone digit length", () => {
    expect(isValidPhone("12345")).toBe(false);
    expect(isValidPhone("+94 77 123 4567")).toBe(true);
  });

  it("validates email format", () => {
    expect(isValidEmail("bad@")).toBe(false);
    expect(isValidEmail("good@example.com")).toBe(true);
  });
});

describe("success redirect", () => {
  it("appends safe query params to absolute URLs", () => {
    const url = buildSuccessRedirectUrl("https://example.com/thanks", {
      bookingId: "abc",
      service: "Haircut",
      staff: "Sam",
      status: "confirmed",
      startsAt: "2026-06-17T10:00:00.000Z",
    });
    expect(url).toContain("bookingId=abc");
    expect(url).toContain("service=Haircut");
    expect(url.startsWith("https://example.com/thanks")).toBe(true);
  });

  it("appends params to relative paths", () => {
    const url = buildSuccessRedirectUrl("/thank-you", {
      bookingId: "abc",
      service: "Haircut",
      staff: "Sam",
      status: "confirmed",
      startsAt: "2026-06-17T10:00:00.000Z",
    });
    expect(url.startsWith("/thank-you?")).toBe(true);
  });
});
