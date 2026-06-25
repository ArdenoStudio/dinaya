import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireApiBusiness } from "@/lib/api-auth";
import {
  createBusinessLogosStorage,
  getSupabaseStorageConfig,
  publicLogoUrl,
} from "@/lib/supabase-storage";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_KINDS = new Set(["logo", "banner", "gallery"]);

function storagePath(businessId: string, kind: string, ext: string): string {
  if (kind === "gallery") {
    return `${businessId}/gallery/${randomUUID()}.${ext}`;
  }
  return `${businessId}/${kind}.${ext}`;
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;

  const storageConfig = getSupabaseStorageConfig();
  if (!storageConfig) {
    return NextResponse.json(
      {
        error:
          "Image uploads are not configured. Add SUPABASE_SERVICE_ROLE_KEY to your environment, then redeploy.",
      },
      { status: 503 },
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const kind = String(formData.get("kind") ?? "logo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED_KINDS.has(kind)) {
    return NextResponse.json({ error: "Invalid image type." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, and GIF images are allowed." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 4 MB." }, { status: 400 });
  }

  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const path = storagePath(authResult.context.businessId, kind, ext);
  const buffer = Buffer.from(await file.arrayBuffer());

  const storage = createBusinessLogosStorage(storageConfig);
  const { error } = await storage.upload(path, buffer, {
    contentType: file.type,
    upsert: kind !== "gallery",
  });
  if (error) {
    console.error("Image upload failed:", error.message);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ url: publicLogoUrl(storage, path) });
}
