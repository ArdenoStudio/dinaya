import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeSelectQuery, makeUpdateQuery } from "@/test-utils/db-mock";

const dbSelectMock = vi.hoisted(() => vi.fn());
const dbUpdateMock = vi.hoisted(() => vi.fn());
const sendBookingReminderMessageMock = vi.hoisted(() => vi.fn());
const buildClientBookingUrlMock = vi.hoisted(() => vi.fn());
const parseLocationAiConfigMock = vi.hoisted(() => vi.fn());

vi.mock("@/db", () => ({
  db: {
    select: dbSelectMock,
    update: dbUpdateMock,
  },
}));

vi.mock("@/lib/messaging/booking-messages", () => ({
  sendBookingReminderMessage: sendBookingReminderMessageMock,
}));

vi.mock("@/lib/client-tokens", () => ({
  buildClientBookingUrl: buildClientBookingUrlMock,
}));

vi.mock("@/lib/locations", () => ({
  parseLocationAiConfig: parseLocationAiConfigMock,
}));

import { GET } from "./route";

describe("GET /api/cron/reminders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-test-secret";
    dbUpdateMock.mockReturnValue(makeUpdateQuery(undefined));
    sendBookingReminderMessageMock.mockResolvedValue({ status: "sent" });
    buildClientBookingUrlMock.mockReturnValue("https://dinaya.lk/manage/bk_1");
    parseLocationAiConfigMock.mockReturnValue({});
  });

  it("returns 401 without bearer token", async () => {
    const req = new NextRequest("http://localhost/api/cron/reminders");
    const res = await GET(req);

    expect(res.status).toBe(401);
    expect(sendBookingReminderMessageMock).not.toHaveBeenCalled();
  });

  it("returns zero counts when no upcoming reminders are due", async () => {
    dbSelectMock.mockReturnValueOnce(makeSelectQuery([]));

    const req = new NextRequest("http://localhost/api/cron/reminders", {
      headers: { authorization: "Bearer cron-test-secret" },
    });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ sent: 0, checked: 0 });
    expect(sendBookingReminderMessageMock).not.toHaveBeenCalled();
  });

  it("sends reminders and marks bookings after successful delivery", async () => {
    dbSelectMock
      .mockReturnValueOnce(makeSelectQuery([
        {
          id: "bk_1",
          clientName: "Ama",
          clientEmail: "ama@example.com",
          clientPhone: "+94770000000",
          startsAt: new Date("2026-07-01T10:00:00.000Z"),
          businessId: "00000000-0000-4000-8000-000000000001",
          serviceId: "service_1",
          staffId: "staff_1",
          locationId: null,
          clientId: "client_1",
        },
      ]))
      .mockReturnValueOnce(makeSelectQuery([
        {
          id: "00000000-0000-4000-8000-000000000001",
          name: "Dinaya Salon",
          slug: "dinaya-salon",
          plan: "pro",
          language: "en",
        },
      ]))
      .mockReturnValueOnce(makeSelectQuery([{ id: "service_1", name: "Haircut" }]))
      .mockReturnValueOnce(makeSelectQuery([{ id: "staff_1", name: "Kasun" }]))
      .mockReturnValueOnce(makeSelectQuery([]));

    const req = new NextRequest("http://localhost/api/cron/reminders", {
      headers: { authorization: "Bearer cron-test-secret" },
    });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ sent: 1, skipped: 0, checked: 1 });
    expect(sendBookingReminderMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: "bk_1",
        businessId: "00000000-0000-4000-8000-000000000001",
        serviceName: "Haircut",
        staffName: "Kasun",
      }),
    );
    expect(dbUpdateMock).toHaveBeenCalledTimes(1);
  });

  it("skips a booking when reminder delivery throws", async () => {
    dbSelectMock
      .mockReturnValueOnce(makeSelectQuery([
        {
          id: "bk_1",
          clientName: "Ama",
          clientEmail: "ama@example.com",
          clientPhone: "+94770000000",
          startsAt: new Date("2026-07-01T10:00:00.000Z"),
          businessId: "00000000-0000-4000-8000-000000000001",
          serviceId: "service_1",
          staffId: "staff_1",
          locationId: null,
          clientId: "client_1",
        },
      ]))
      .mockReturnValueOnce(makeSelectQuery([
        {
          id: "00000000-0000-4000-8000-000000000001",
          name: "Dinaya Salon",
          slug: "dinaya-salon",
          plan: "pro",
          language: "en",
        },
      ]))
      .mockReturnValueOnce(makeSelectQuery([{ id: "service_1", name: "Haircut" }]))
      .mockReturnValueOnce(makeSelectQuery([{ id: "staff_1", name: "Kasun" }]))
      .mockReturnValueOnce(makeSelectQuery([]));
    sendBookingReminderMessageMock.mockRejectedValueOnce(new Error("twilio failed"));

    const req = new NextRequest("http://localhost/api/cron/reminders", {
      headers: { authorization: "Bearer cron-test-secret" },
    });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ sent: 0, skipped: 1, checked: 1 });
    expect(dbUpdateMock).not.toHaveBeenCalled();
  });
});
