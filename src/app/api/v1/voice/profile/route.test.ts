import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeSelectQuery } from "@/test-utils/db-mock";

const requireApiKeyMock = vi.hoisted(() => vi.fn());
const dbSelectMock = vi.hoisted(() => vi.fn());
const getBusinessPlanMock = vi.hoisted(() => vi.fn());
const canUseFeatureMock = vi.hoisted(() => vi.fn());
const serializeVoiceIntegrationMock = vi.hoisted(() => vi.fn());
const isVoiceReceptionistRolloutOpenMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-key-auth", () => ({
  requireApiKey: requireApiKeyMock,
}));

vi.mock("@/db", () => ({
  db: {
    select: dbSelectMock,
  },
}));

vi.mock("@/lib/plan", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/plan")>();
  return {
    ...actual,
    getBusinessPlan: getBusinessPlanMock,
    canUseFeature: canUseFeatureMock,
  };
});

vi.mock("@/lib/voice-receptionist", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/voice-receptionist")>();
  return {
    ...actual,
    isVoiceReceptionistRolloutOpen: isVoiceReceptionistRolloutOpenMock,
    serializeVoiceIntegration: serializeVoiceIntegrationMock,
  };
});

import { GET } from "./route";

describe("GET /api/v1/voice/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiKeyMock.mockResolvedValue({
      ok: true,
      context: { businessId: "00000000-0000-4000-8000-000000000001", scopes: ["voice:read"] },
    });
    isVoiceReceptionistRolloutOpenMock.mockReturnValue(true);
    getBusinessPlanMock.mockResolvedValue("max");
    canUseFeatureMock.mockReturnValue(true);
    serializeVoiceIntegrationMock.mockReturnValue({ provider: "twilio" });
    dbSelectMock
      .mockReturnValueOnce(makeSelectQuery([{
        id: "00000000-0000-4000-8000-000000000001",
        slug: "dinaya-salon",
        name: "Dinaya Salon",
        description: "Salon",
        phone: "+94112223344",
        email: "hello@dinaya.lk",
        address: "Kandy",
        timezone: "Asia/Colombo",
        language: "en",
        businessType: "salon",
        cancellationPolicy: null,
        depositPolicy: null,
        bankTransferInstructions: null,
        lankaqrImageUrl: null,
        websiteUrl: "https://dinaya.lk",
      }]))
      .mockReturnValueOnce(makeSelectQuery([{ businessId: "00000000-0000-4000-8000-000000000001" }]))
      .mockReturnValueOnce(makeSelectQuery([{ id: "location_1", name: "Kandy", slug: "kandy", address: "Kandy", phone: null, timezone: "Asia/Colombo", isDefault: true, sortOrder: 1 }]))
      .mockReturnValueOnce(makeSelectQuery([{ id: "service_1", name: "Haircut", description: null, durationMinutes: 45, priceLkr: 2500, requiresPayment: false, depositPercent: 0, beforeBuffer: 0, afterBuffer: 0, minimumNoticeHours: 1, dailyCapacity: null }]))
      .mockReturnValueOnce(makeSelectQuery([{ id: "staff_1", name: "Kasun", bio: null }]))
      .mockReturnValueOnce(makeSelectQuery([{ staffId: "staff_1", serviceId: "service_1", priceOverrideLkr: null }]))
      .mockReturnValueOnce(makeSelectQuery([{ staffId: "staff_1", locationId: "location_1" }]));
  });

  it("returns 401 when API key auth fails", async () => {
    requireApiKeyMock.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const req = new NextRequest("http://localhost/api/v1/voice/profile");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it("returns a voice booking profile for authorized API keys", async () => {
    const req = new NextRequest("http://localhost/api/v1/voice/profile");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.business.name).toBe("Dinaya Salon");
    expect(body.voiceIntegration).toEqual({ provider: "twilio" });
    expect(body.locations).toHaveLength(1);
    expect(body.services).toHaveLength(1);
    expect(body.staff).toHaveLength(1);
    expect(body.endpoints.bookingCreate).toMatch(/\/api\/v1\/bookings$/);
    expect(body.bookingSource).toBe("voice_agent");
  });
});
