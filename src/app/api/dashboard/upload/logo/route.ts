import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireApiBusiness } from "@/lib/api-auth";

const BUCKET = "business-logos";
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);

function getStorage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key).storage;
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, GIF, and SVG images are allowed." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 2 MB." }, { status: 400 });
  }

  const ext = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1];
  const path = `${authResult.context.businessId}/logo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const storage = getStorage();
  const { error } = await storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (error) {
    console.error("Logo upload failed:", error.message);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  const { data } = storage.from(BUCKET).getPublicUrl(path);
  // Bust cache by appending a version timestamp
  const url = `${data.publicUrl}?v=${Date.now()}`;
  return NextResponse.json({ url });
}
