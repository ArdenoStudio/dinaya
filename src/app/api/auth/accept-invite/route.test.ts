import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeInsertQuery, makeSelectQuery } from "@/test-utils/db-mock";

const bcryptHashMock = vi.hoisted(() => vi.fn());
const dbSelectMock = vi.hoisted(() => vi.fn());
const dbInsertMock = vi.hoisted(() => vi.fn());
const verifyStaffInviteTokenMock = vi.hoisted(() => vi.fn());

vi.mock("bcryptjs", () => ({
  default: { hash: bcryptHashMock },
}));

vi.mock("@/db", () => ({
  db: {
    select: dbSelectMock,
    insert: dbInsertMock,
  },
}));

vi.mock("@/lib/staff-invite", () => ({
  verifyStaffInviteToken: verifyStaffInviteTokenMock,
}));

import { POST } from "./route";

describe("POST /api/auth/accept-invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bcryptHashMock.mockResolvedValue("hashed-password");
    verifyStaffInviteTokenMock.mockReturnValue({
      businessId: "00000000-0000-4000-8000-000000000001",
      email: "staff@example.com",
      name: "Staff Member",
    });
    dbSelectMock.mockReturnValue(makeSelectQuery([]));
    dbInsertMock.mockReturnValue(makeInsertQuery([]));
  });

  it("returns 400 when the payload is invalid", async () => {
    const req = new NextRequest("http://localhost/api/auth/accept-invite", {
      method: "POST",
      body: JSON.stringify({ token: "short", password: "tiny" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Please check your password.");
    expect(verifyStaffInviteTokenMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the invite token is invalid", async () => {
    verifyStaffInviteTokenMock.mockReturnValue(null);

    const req = new NextRequest("http://localhost/api/auth/accept-invite", {
      method: "POST",
      body: JSON.stringify({
        token: "valid-invite-token-12345",
        password: "supersecret",
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("This invite link is invalid or expired.");
  });

  it("returns 409 when the staff member already has an account", async () => {
    dbSelectMock.mockReturnValueOnce(makeSelectQuery([{ id: "user_1" }]));

    const req = new NextRequest("http://localhost/api/auth/accept-invite", {
      method: "POST",
      body: JSON.stringify({
        token: "valid-invite-token-12345",
        password: "supersecret",
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe("An account with this email already exists.");
    expect(dbInsertMock).not.toHaveBeenCalled();
  });

  it("creates a staff account when the invite is valid", async () => {
    const req = new NextRequest("http://localhost/api/auth/accept-invite", {
      method: "POST",
      body: JSON.stringify({
        token: "valid-invite-token-12345",
        password: "supersecret",
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(bcryptHashMock).toHaveBeenCalledWith("supersecret", 12);
    expect(dbInsertMock.mock.results[0]?.value.values).toHaveBeenCalledWith({
      businessId: "00000000-0000-4000-8000-000000000001",
      name: "Staff Member",
      email: "staff@example.com",
      passwordHash: "hashed-password",
      role: "staff",
    });
  });
});
