import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  insert: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: dbMock,
}));

import { publishSocialPost, sendAiMessage } from "./providers";

function selectRows(rows: unknown[]) {
  const query = {
    from: vi.fn(() => query),
    where: vi.fn(() => query),
    limit: vi.fn(async () => rows),
  };
  return query;
}

function mockInsert() {
  const query = {
    values: vi.fn(async () => undefined),
  };
  dbMock.insert.mockReturnValue(query);
  return query;
}

describe("AI provider adapters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("skips social publishing when Meta credentials are missing", async () => {
    vi.stubEnv("META_SOCIAL_PAGE_ID", "");
    vi.stubEnv("META_SOCIAL_ACCESS_TOKEN", "");

    await expect(publishSocialPost({
      caption: "Book your next appointment with Dinaya.",
      idempotencyKey: "content:item-1",
    })).resolves.toMatchObject({
      provider: "meta-social",
      status: "skipped",
    });
  });

  it("does not send duplicate idempotency keys", async () => {
    dbMock.select.mockReturnValue(selectRows([{ id: "comm_1", status: "sent" }]));

    const result = await sendAiMessage({
      businessId: "business_1",
      clientEmail: "nimal@example.com",
      feature: "reviewEngine",
      idempotencyKey: "review:booking_1",
      subject: "How was your visit?",
      body: "Please leave a review.",
    });

    expect(result).toEqual({ channel: "none", provider: null, status: "duplicate" });
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("logs a skipped send when no provider and recipient combination is ready", async () => {
    dbMock.select.mockReturnValue(selectRows([]));
    const insertQuery = mockInsert();

    const result = await sendAiMessage({
      businessId: "business_1",
      feature: "clientReactivationCampaign",
      idempotencyKey: "reactivation:client_1",
      subject: "We miss you",
      body: "Book your next appointment.",
    });

    expect(result).toMatchObject({ channel: "none", provider: null, status: "skipped" });
    expect(insertQuery.values).toHaveBeenCalledWith(expect.objectContaining({
      businessId: "business_1",
      feature: "clientReactivationCampaign",
      idempotencyKey: "reactivation:client_1",
      status: "skipped",
    }));
  });
});
