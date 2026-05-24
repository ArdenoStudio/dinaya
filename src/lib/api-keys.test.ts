import { describe, expect, it } from "vitest";
import { generateApiKey, hashApiKey, isApiKeyFormat } from "./api-keys";

describe("api keys", () => {
  it("generates dinaya-prefixed keys and stable hashes", () => {
    const first = generateApiKey();
    expect(isApiKeyFormat(first.rawKey)).toBe(true);
    expect(hashApiKey(first.rawKey)).toBe(first.keyHash);

    const second = generateApiKey();
    expect(second.rawKey).not.toBe(first.rawKey);
  });
});
