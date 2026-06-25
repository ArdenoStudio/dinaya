import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const dbSelectMock = vi.hoisted(() => vi.fn());
const isVoiceReceptionistRolloutOpenMock = vi.hoisted(() => vi.fn());

vi.mock("@/db", () => ({
  db: {
    select: dbSelectMock,
  },
}));

vi.mock("@/lib/voice-receptionist", () => ({
  VOICE_RECEPTIONIST_ROLLOUT: {
    shortMessage: "Coming soon.",
  },
  isVoiceReceptionistRolloutOpen: isVoiceReceptionistRolloutOpenMock,
}));

import { GET, POST } from "./route";

function makeLimitQuery(result: unknown) {
  const query = {
    from: vi.fn(() => query),
    where: vi.fn(() => query),
    limit: vi.fn(async () => result),
  };
  return query;
}

function buildSignature(url: string, fields: Record<string, string>): string {
  const payload = url + Object.entries(fields)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}${value}`)
    .join("");

  return createHmac("sha1", process.env.TWILIO_AUTH_TOKEN ?? "")
    .update(payload, "utf8")
    .digest("base64");
}

function makeTwilioRequest(url: string, fields: Record<string, string>, validSignature = true) {
  const body = new URLSearchParams(fields).toString();
  const headers = new Headers({
    "content-type": "application/x-www-form-urlencoded",
    "x-twilio-signature": validSignature ? buildSignature(url, fields) : "bad-signature",
  });

  return new NextRequest(url, {
    method: "POST",
    headers,
    body,
  });
}

describe("Twilio voice webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TWILIO_AUTH_TOKEN = "test-token";
    delete process.env.TWILIO_CONVERSATION_RELAY_WS_URL;
    isVoiceReceptionistRolloutOpenMock.mockReturnValue(true);
  });

  it("rejects requests with an invalid Twilio signature", async () => {
    const req = makeTwilioRequest(
      "http://localhost/api/v1/voice/twilio?businessId=biz_1",
      { CallSid: "CA123", From: "+94770000000" },
      false,
    );

    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(await res.text()).toBe("Invalid signature");
    expect(dbSelectMock).not.toHaveBeenCalled();
  });

  it("returns TwiML for a valid signed request", async () => {
    dbSelectMock
      .mockReturnValueOnce(makeLimitQuery([{ id: "biz_1", name: "Salon" }]))
      .mockReturnValueOnce(
        makeLimitQuery([{ fallbackMessage: "Please book online.", welcomeMessage: "Hello!" }]),
      );

    const req = makeTwilioRequest(
      "http://localhost/api/v1/voice/twilio?businessId=biz_1",
      { CallSid: "CA123", From: "+94770000000" },
    );

    const res = await POST(req);
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/xml");
    expect(body).toContain("Please book online.");
  });

  it("rejects GET requests", async () => {
    const req = new NextRequest("http://localhost/api/v1/voice/twilio?businessId=biz_1");

    const res = await GET(req);

    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("POST");
  });
});
