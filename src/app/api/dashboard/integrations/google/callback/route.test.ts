import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.hoisted(() => vi.fn());
const dbInsertMock = vi.hoisted(() => vi.fn());
const dbSelectMock = vi.hoisted(() => vi.fn());
const dbUpdateMock = vi.hoisted(() => vi.fn());
const encryptSecretMock = vi.hoisted(() => vi.fn());
const exchangeGoogleCodeMock = vi.hoisted(() => vi.fn());
const verifyGoogleOAuthStateMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/db", () => ({
  db: {
    insert: dbInsertMock,
    select: dbSelectMock,
    update: dbUpdateMock,
  },
}));

vi.mock("@/lib/google-calendar", () => ({
  GOOGLE_PROVIDER: "google_calendar",
  exchangeGoogleCode: exchangeGoogleCodeMock,
}));

vi.mock("@/lib/google-oauth-state", () => ({
  verifyGoogleOAuthState: verifyGoogleOAuthStateMock,
}));

vi.mock("@/lib/secrets", () => ({
  encryptSecret: encryptSecretMock,
}));

import { GET, POST } from "./route";

function makeSelectQuery(result: unknown) {
  const query = {
    from: vi.fn(() => query),
    limit: vi.fn(async () => result),
    where: vi.fn(() => query),
  };
  return query;
}

function makeUpdateQuery() {
  const query = {
    set: vi.fn(() => query),
    where: vi.fn(async () => undefined),
  };
  return query;
}

function makeInsertQuery() {
  return {
    values: vi.fn(async () => undefined),
  };
}

function makePostRequest(body: Record<string, string>) {
  return new NextRequest("http://localhost/api/dashboard/integrations/google/callback", {
    body: new URLSearchParams(body),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
  });
}

describe("Google OAuth callback route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: {
        businessId: "00000000-0000-4000-8000-000000000001",
        id: "00000000-0000-4000-8000-000000000002",
        role: "owner",
      },
    });
    encryptSecretMock.mockImplementation((value: string) => `encrypted:${value}`);
    exchangeGoogleCodeMock.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    verifyGoogleOAuthStateMock.mockReturnValue({
      businessId: "00000000-0000-4000-8000-000000000001",
      userId: "00000000-0000-4000-8000-000000000002",
    });
    dbSelectMock.mockReturnValue(makeSelectQuery([{ id: "connection_1" }]));
    dbUpdateMock.mockReturnValue(makeUpdateQuery());
    dbInsertMock.mockReturnValue(makeInsertQuery());
  });

  it("keeps the OAuth provider GET callback free of token exchange and database writes", async () => {
    const req = new NextRequest(
      "http://localhost/api/dashboard/integrations/google/callback?code=code_1&state=state_1",
    );

    const res = await GET(req);
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(html).toContain('method="post"');
    expect(html).toContain('name="code" value="code_1"');
    expect(html).toContain('name="state" value="state_1"');
    expect(authMock).not.toHaveBeenCalled();
    expect(exchangeGoogleCodeMock).not.toHaveBeenCalled();
    expect(dbSelectMock).not.toHaveBeenCalled();
    expect(dbUpdateMock).not.toHaveBeenCalled();
    expect(dbInsertMock).not.toHaveBeenCalled();
  });

  it("rejects POST callbacks with invalid state before exchanging the code", async () => {
    verifyGoogleOAuthStateMock.mockReturnValue(null);

    const res = await POST(makePostRequest({ code: "code_1", state: "bad_state" }));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("google=error");
    expect(exchangeGoogleCodeMock).not.toHaveBeenCalled();
    expect(dbSelectMock).not.toHaveBeenCalled();
  });

  it("finalizes a valid callback over POST for the signed owner session", async () => {
    const res = await POST(makePostRequest({ code: "code_1", state: "state_1" }));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("google=connected");
    expect(exchangeGoogleCodeMock).toHaveBeenCalledWith("code_1");
    expect(dbUpdateMock).toHaveBeenCalled();
    expect(dbInsertMock).not.toHaveBeenCalled();
    expect(dbUpdateMock.mock.results[0].value.set).toHaveBeenCalledWith(
      expect.objectContaining({
        accessTokenEncrypted: "encrypted:access-token",
        isActive: true,
        meta: { refreshTokenEncrypted: "encrypted:refresh-token" },
      }),
    );
  });
});
