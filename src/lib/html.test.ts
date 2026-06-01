import { describe, expect, it } from "vitest";
import { escapeHtml, escapeHtmlAttribute } from "./html";

describe("HTML escaping", () => {
  it("escapes text content and attributes", () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;",
    );
    expect(escapeHtmlAttribute(`https://example.com/?q="x"&next=<bad>`)).toBe(
      "https://example.com/?q=&quot;x&quot;&amp;next=&lt;bad&gt;",
    );
  });
});
