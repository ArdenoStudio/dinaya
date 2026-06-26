import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/messaging/inbound-router", () => ({
  handleInboundWhatsApp: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/after-response", () => ({ runAfterResponse: vi.fn() }));

import { GET, POST } from "./route";

describe("GET, POST /api/webhooks/whatsapp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.META_WHATSAPP_VERIFY_TOKEN = "verify-token";
    process.env.META_WHATSAPP_APP_SECRET = "app-secret";
  });

  it("rejects webhook verification without token", async () => {
    const req = new NextRequest("http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=bad");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("accepts webhook verification challenge", async () => {
    const req = new NextRequest("http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=verify-token&hub.challenge=12345");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("12345");
  });

  it("rejects POST without valid signature", async () => {
    const req = new NextRequest("http://localhost/api/webhooks/whatsapp", {
      method: "POST",
      body: "{}",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
