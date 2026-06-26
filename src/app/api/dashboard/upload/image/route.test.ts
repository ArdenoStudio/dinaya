import { describe, expect, it, vi, beforeEach } from "vitest";

const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn(() => ({ data: { publicUrl: "https://cdn.example.com/biz/logo.webp" } }));

vi.mock("@/lib/api-auth", () => ({
  requireApiBusiness: vi.fn(async () => ({
    ok: true,
    context: { businessId: "00000000-0000-4000-8000-000000000001", userId: "00000000-0000-4000-8000-000000000002" },
  })),
}));

vi.mock("@/lib/supabase-storage", () => ({
  getSupabaseStorageConfig: vi.fn(() => ({
    url: "https://example.supabase.co",
    serviceRoleKey: "service-role",
  })),
  createBusinessLogosStorage: vi.fn(() => ({
    upload: mockUpload,
    getPublicUrl: mockGetPublicUrl,
  })),
  publicLogoUrl: vi.fn(() => "https://cdn.example.com/biz/logo.webp?v=1"),
}));

describe("POST /api/dashboard/upload/image", () => {
  beforeEach(() => {
    mockUpload.mockReset();
    mockUpload.mockResolvedValue({ error: null });
  });

  it("uploads a banner image for the authenticated business", async () => {
    const { POST } = await import("@/app/api/dashboard/upload/image/route");
    const file = new File([new Uint8Array([1, 2, 3])], "banner.webp", { type: "image/webp" });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", "banner");

    const req = new Request("http://localhost/api/dashboard/upload/image", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.url).toContain("https://cdn.example.com");
    const [path, data, options] = mockUpload.mock.calls[0]!;
    expect(path).toBe("00000000-0000-4000-8000-000000000001/banner.webp");
    expect(Buffer.isBuffer(data)).toBe(true);
    expect(options).toEqual(expect.objectContaining({ contentType: "image/webp", upsert: true }));
  });

  it("rejects invalid kinds", async () => {
    const { POST } = await import("@/app/api/dashboard/upload/image/route");
    const file = new File([new Uint8Array([1])], "logo.webp", { type: "image/webp" });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", "avatar");

    const req = new Request("http://localhost/api/dashboard/upload/image", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });
});
