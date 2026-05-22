import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createPasswordResetToken,
  isPasswordResetTokenCurrent,
  verifyPasswordResetToken,
} from "./password-reset";

const OLD_SECRET = process.env.AUTH_SECRET;

describe("password reset tokens", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret-for-password-reset";
  });

  afterEach(() => {
    if (OLD_SECRET === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = OLD_SECRET;
    }
  });

  it("binds reset tokens to the current password hash", () => {
    const token = createPasswordResetToken({
      userId: "user_1",
      email: "owner@example.com",
      passwordHash: "old-password-hash",
    });

    const payload = verifyPasswordResetToken(token);

    expect(payload).not.toBeNull();
    expect(isPasswordResetTokenCurrent(payload, "old-password-hash")).toBe(true);
    expect(isPasswordResetTokenCurrent(payload, "new-password-hash")).toBe(false);
  });
});
