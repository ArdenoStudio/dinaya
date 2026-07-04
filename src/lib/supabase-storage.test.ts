import { describe, expect, it } from "vitest";
import { collectRemovedBusinessImageUrls } from "@/lib/business-image-storage";
import {
  BUSINESS_LOGOS_BUCKET,
  isBusinessImageStorageUrl,
  isOwnedStoragePath,
  storagePathFromPublicUrl,
} from "@/lib/supabase-storage";

const SUPABASE_URL = "https://abc123.supabase.co";

describe("storagePathFromPublicUrl", () => {
  it("parses a public object URL", () => {
    const url = `${SUPABASE_URL}/storage/v1/object/public/${BUSINESS_LOGOS_BUCKET}/biz-1/logo.webp`;
    expect(storagePathFromPublicUrl(url, SUPABASE_URL)).toBe("biz-1/logo.webp");
  });

  it("strips cache-bust query params", () => {
    const url = `${SUPABASE_URL}/storage/v1/object/public/${BUSINESS_LOGOS_BUCKET}/biz-1/gallery/uuid.webp?v=123`;
    expect(storagePathFromPublicUrl(url, SUPABASE_URL)).toBe("biz-1/gallery/uuid.webp");
  });

  it("rejects foreign origins and path traversal", () => {
    expect(storagePathFromPublicUrl("https://evil.example/logo.webp", SUPABASE_URL)).toBeNull();
    const bad = `${SUPABASE_URL}/storage/v1/object/public/${BUSINESS_LOGOS_BUCKET}/../other/logo.webp`;
    expect(storagePathFromPublicUrl(bad, SUPABASE_URL)).toBeNull();
  });
});

describe("isOwnedStoragePath", () => {
  it("accepts paths under the business prefix", () => {
    expect(isOwnedStoragePath("biz-1/logo.webp", "biz-1")).toBe(true);
    expect(isOwnedStoragePath("biz-2/logo.webp", "biz-1")).toBe(false);
  });
});

describe("isBusinessImageStorageUrl", () => {
  it("detects our bucket URLs", () => {
    const url = `${SUPABASE_URL}/storage/v1/object/public/${BUSINESS_LOGOS_BUCKET}/biz-1/banner.jpg`;
    expect(isBusinessImageStorageUrl(url, SUPABASE_URL)).toBe(true);
    expect(isBusinessImageStorageUrl("https://cdn.example.com/x.webp", SUPABASE_URL)).toBe(false);
  });
});

describe("collectRemovedBusinessImageUrls", () => {
  const storageLogo = `${SUPABASE_URL}/storage/v1/object/public/${BUSINESS_LOGOS_BUCKET}/biz-1/logo.webp`;
  const storageBanner = `${SUPABASE_URL}/storage/v1/object/public/${BUSINESS_LOGOS_BUCKET}/biz-1/gallery/a.webp`;

  it("collects removed logo and gallery URLs", () => {
    const removed = collectRemovedBusinessImageUrls(
      { logoUrl: storageLogo, galleryImages: [storageBanner, "https://cdn.example.com/x.webp"] },
      { logoUrl: null, galleryImages: ["https://cdn.example.com/x.webp"] },
      SUPABASE_URL,
    );
    expect(removed).toEqual([storageLogo, storageBanner]);
  });

  it("ignores external URLs", () => {
    const removed = collectRemovedBusinessImageUrls(
      { logoUrl: "https://cdn.example.com/old.webp" },
      { logoUrl: "https://cdn.example.com/new.webp" },
      SUPABASE_URL,
    );
    expect(removed).toEqual([]);
  });
});
