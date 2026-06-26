import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const handlersGetMock = vi.hoisted(() => vi.fn());
const handlersPostMock = vi.hoisted(() => vi.fn());
const withRateLimitMock = vi.hoisted(() => vi.fn());
const getCredentialsEmailFromRequestMock = vi.hoisted(() => vi.fn());
const isCredentialsCallbackPathMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({
  handlers: {
    GET: handlersGetMock,
    POST: handlersPostMock,
  },
}));

vi.mock("@/lib/auth-rate-limit", () => ({
  CREDENTIALS_EMAIL_LIMIT: { scope: "auth-email", limit: 10, windowSeconds: 900 },
  CREDENTIALS_IP_LIMIT: { scope: "auth-ip", limit: 30, windowSeconds: 300 },
  getCredentialsEmailFromRequest: getCredentialsEmailFromRequestMock,
  isCredentialsCallbackPath: isCredentialsCallbackPathMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: withRateLimitMock,
}));

import { GET, POST } from "./route";

describe("POST /api/auth/[...nextauth]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    handlersGetMock.mockResolvedValue(Response.json({ ok: true }));
    handlersPostMock.mockResolvedValue(Response.json({ ok: true }));
    withRateLimitMock.mockResolvedValue({ ok: true });
    getCredentialsEmailFromRequestMock.mockResolvedValue("owner@example.com");
    isCredentialsCallbackPathMock.mockReturnValue(true);
  });

  it("delegates GET to NextAuth handlers", async () => {
    const req = new NextRequest("http://localhost/api/auth/session");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(handlersGetMock).toHaveBeenCalledWith(req);
  });

  it("returns 429 when the credentials callback is IP rate limited", async () => {
    withRateLimitMock.mockResolvedValueOnce({
      ok: false,
      response: Response.json({ error: "Too many requests" }, { status: 429 }),
    });

    const req = new NextRequest("http://localhost/api/auth/callback/credentials", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(429);
    expect(handlersPostMock).not.toHaveBeenCalled();
  });

  it("returns 429 when the credentials email bucket is rate limited", async () => {
    withRateLimitMock
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: false,
        response: Response.json({ error: "Too many requests" }, { status: 429 }),
      });

    const req = new NextRequest("http://localhost/api/auth/callback/credentials", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(429);
    expect(getCredentialsEmailFromRequestMock).toHaveBeenCalledWith(req);
    expect(handlersPostMock).not.toHaveBeenCalled();
  });

  it("delegates POST once credential limits pass", async () => {
    const req = new NextRequest("http://localhost/api/auth/callback/credentials", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(withRateLimitMock).toHaveBeenCalledTimes(2);
    expect(handlersPostMock).toHaveBeenCalledWith(req);
  });
});
