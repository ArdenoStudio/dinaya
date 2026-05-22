import { NextResponse } from "next/server";
import { captureException } from "@/lib/monitoring";

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
    await captureException(error, { component: "api-handler" });
    return jsonError(fallbackMessage, 500);
  }
}
