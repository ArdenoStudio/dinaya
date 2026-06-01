import type { LookupFunction } from "node:net";
import { request } from "node:https";
import {
  resolveSafeWebhookTarget,
  UNSAFE_WEBHOOK_DESTINATION_ERROR,
  type SafeWebhookTarget,
} from "@/lib/webhook-url";

const WEBHOOK_DELIVERY_TIMEOUT_MS = 10_000;
const MAX_WEBHOOK_RESPONSE_BODY_BYTES = 16 * 1024;

type SafeWebhookPostInput = {
  headers: Record<string, string>;
  body: string;
};

export type SafeWebhookPostResponse = {
  ok: boolean;
  status: number;
  responseBody: string | null;
};

function createPinnedLookup(target: SafeWebhookTarget): LookupFunction {
  return ((_hostname: string, options: unknown, callback?: unknown) => {
    const cb = typeof options === "function" ? options : callback;
    if (typeof cb !== "function") return;

    const wantsAll =
      typeof options === "object" &&
      options !== null &&
      "all" in options &&
      Boolean((options as { all?: boolean }).all);

    if (wantsAll) {
      cb(null, [{ address: target.address, family: target.family }]);
      return;
    }

    cb(null, target.address, target.family);
  }) as LookupFunction;
}

function cappedResponseBody(chunks: Buffer[], truncated: boolean): string | null {
  if (chunks.length === 0 && !truncated) return null;

  const text = Buffer.concat(chunks).toString("utf8");
  if (!truncated) return text;

  return `${text}\n[truncated to ${MAX_WEBHOOK_RESPONSE_BODY_BYTES} bytes]`;
}

export async function postSafeWebhook(
  url: string,
  input: SafeWebhookPostInput,
): Promise<SafeWebhookPostResponse> {
  const target = await resolveSafeWebhookTarget(url);
  if (!target) {
    throw new Error(UNSAFE_WEBHOOK_DESTINATION_ERROR);
  }

  return new Promise((resolve, reject) => {
    const req = request(
      target.url,
      {
        method: "POST",
        headers: {
          ...input.headers,
          "Content-Length": Buffer.byteLength(input.body).toString(),
        },
        lookup: createPinnedLookup(target),
        timeout: WEBHOOK_DELIVERY_TIMEOUT_MS,
      },
      (res) => {
        const chunks: Buffer[] = [];
        let storedBytes = 0;
        let totalBytes = 0;
        let truncated = false;

        res.on("data", (chunk: Buffer | string) => {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          totalBytes += buffer.length;

          if (storedBytes < MAX_WEBHOOK_RESPONSE_BODY_BYTES) {
            const remaining = MAX_WEBHOOK_RESPONSE_BODY_BYTES - storedBytes;
            const slice = buffer.subarray(0, remaining);
            chunks.push(slice);
            storedBytes += slice.length;
          }

          if (totalBytes > MAX_WEBHOOK_RESPONSE_BODY_BYTES) {
            truncated = true;
          }
        });

        res.on("end", () => {
          const status = res.statusCode ?? 0;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            responseBody: cappedResponseBody(chunks, truncated),
          });
        });

        res.on("error", reject);
      },
    );

    req.on("timeout", () => {
      req.destroy(new Error("Webhook delivery timed out."));
    });
    req.on("error", reject);
    req.end(input.body);
  });
}
