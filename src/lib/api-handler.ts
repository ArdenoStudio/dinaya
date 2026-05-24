import { NextResponse } from "next/server";

export function jsonError(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function withApiHandler<T>(
  handler: () => Promise<T>,
  fallbackMessage = "Something went wrong.",
): Promise<T | NextResponse> {
  try {
    return await handler();
  } catch (error) {
    console.error("[api]", error);
    return jsonError(fallbackMessage, 500);
  }
}
