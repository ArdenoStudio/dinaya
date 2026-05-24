import { describe, expect, it } from "vitest";
import { createGoogleOAuthState, verifyGoogleOAuthState } from "./google-oauth-state";

describe("google-oauth-state", () => {
  it("creates and verifies state bound to business and user", () => {
    process.env.AUTH_SECRET = "test-auth-secret-for-oauth-state";

    const state = createGoogleOAuthState("business-1", "user-1");
    expect(verifyGoogleOAuthState(state)).toEqual({
      businessId: "business-1",
      userId: "user-1",
    });
  });

  it("rejects tampered state", () => {
    process.env.AUTH_SECRET = "test-auth-secret-for-oauth-state";

    const state = createGoogleOAuthState("business-1", "user-1");
    expect(verifyGoogleOAuthState(`${state}x`)).toBeNull();
  });
});
