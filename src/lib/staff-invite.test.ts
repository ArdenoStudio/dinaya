import { describe, expect, it, vi } from "vitest";
import { createStaffInviteToken, verifyStaffInviteToken } from "./staff-invite";

describe("staff invite tokens", () => {
  it("round-trips a valid invite token", () => {
    vi.stubEnv("AUTH_SECRET", "test-secret");
    const token = createStaffInviteToken({
      businessId: "11111111-1111-4111-8111-111111111111",
      businessName: "Demo Salon",
      email: "staff@example.com",
      name: "Nimal Perera",
      staffId: "22222222-2222-4222-8222-222222222222",
    });
    expect(verifyStaffInviteToken(token)).toMatchObject({
      email: "staff@example.com",
      name: "Nimal Perera",
    });
    vi.unstubAllEnvs();
  });
});
