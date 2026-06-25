import { describe, expect, it, vi, beforeEach } from "vitest";

const mockSelect = vi.fn();
const mockSelectDistinct = vi.fn();

vi.mock("@/db", () => ({
  db: {
    select: mockSelect,
    selectDistinct: mockSelectDistinct,
  },
}));

vi.mock("@/lib/messaging/channels/whatsapp", () => ({
  sendWhatsApp: vi.fn(),
}));

vi.mock("@/lib/ai/copy", () => ({
  generateAiCopy: vi.fn(),
}));

function distinctChain(rows: unknown[]) {
  const where = vi.fn().mockResolvedValue(rows);
  const from = vi.fn().mockReturnValue({ where });
  return { from, where };
}

function selectChain(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const orderBy = vi.fn().mockReturnValue({ limit });
  const where = vi.fn().mockReturnValue({ orderBy, limit });
  const innerJoin = vi.fn().mockReturnValue({ where, orderBy, limit });
  const from = vi.fn().mockReturnValue({ where, innerJoin, orderBy, limit });
  return { from, where, innerJoin, orderBy, limit };
}

describe("resolveInboundBusinessId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns the only business when the phone maps to one tenant", async () => {
    const first = distinctChain([{ businessId: "biz-a" }]);
    mockSelectDistinct.mockReturnValueOnce({ from: first.from });

    const { resolveInboundBusinessId } = await import("@/lib/messaging/inbound-router");
    await expect(resolveInboundBusinessId("+94771234567")).resolves.toBe("biz-a");
  });

  it("returns null when the phone maps to multiple tenants without WhatsApp context", async () => {
    const first = distinctChain([{ businessId: "biz-a" }, { businessId: "biz-b" }]);
    const second = selectChain([]);
    const third = selectChain([]);
    mockSelectDistinct.mockReturnValueOnce({ from: first.from });
    mockSelect.mockReturnValueOnce({ from: second.from });
    mockSelect.mockReturnValueOnce({ from: third.from });

    const { resolveInboundBusinessId } = await import("@/lib/messaging/inbound-router");
    await expect(resolveInboundBusinessId("+94771234567")).resolves.toBeNull();
  });

  it("uses the most recent outbound WhatsApp business when tenants are ambiguous", async () => {
    const first = distinctChain([{ businessId: "biz-a" }, { businessId: "biz-b" }]);
    const second = selectChain([{ businessId: "biz-b" }]);
    mockSelectDistinct.mockReturnValueOnce({ from: first.from });
    mockSelect.mockReturnValueOnce({ from: second.from });

    const { resolveInboundBusinessId } = await import("@/lib/messaging/inbound-router");
    await expect(resolveInboundBusinessId("+94771234567")).resolves.toBe("biz-b");
  });
});
