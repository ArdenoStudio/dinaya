import { createHash, randomBytes } from "node:crypto";

const KEY_PREFIX = "dinaya_";

export function generateApiKey(): { rawKey: string; keyHash: string; prefix: string } {
  const secret = randomBytes(24).toString("base64url");
  const rawKey = `${KEY_PREFIX}${secret}`;
  return {
    rawKey,
    keyHash: hashApiKey(rawKey),
    prefix: rawKey.slice(0, 12),
  };
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function isApiKeyFormat(value: string): boolean {
  return value.startsWith(KEY_PREFIX) && value.length > KEY_PREFIX.length + 8;
}
