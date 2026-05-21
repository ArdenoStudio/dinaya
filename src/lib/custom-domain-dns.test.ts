import { describe, expect, it } from "vitest";
import {
  expectedVerificationRecord,
  generateDomainVerificationToken,
  verificationHost,
} from "./custom-domain-dns";

describe("custom domain dns", () => {
  it("builds verification host and record", () => {
    const token = generateDomainVerificationToken();
    expect(token.length).toBeGreaterThan(10);
    expect(verificationHost("book.salon.lk")).toBe("_dinaya-verify.book.salon.lk");
    expect(expectedVerificationRecord(token)).toBe(`dinaya-verify=${token}`);
  });
});
