import { describe, expect, it } from "vitest";
import { confirmationEmailHtml } from "./templates";

describe("booking email templates", () => {
  it("escapes user controlled HTML fields", () => {
    const html = confirmationEmailHtml({
      clientName: `<img src=x onerror="alert(1)">`,
      businessName: `Salon & <script>bad()</script>`,
      serviceName: `Cut "Deluxe"`,
      staffName: `A'B`,
      startsAt: new Date("2026-01-01T10:00:00.000Z"),
      manageUrl: `https://dinaya.lk/client?next=<bad>&q="x"`,
    });

    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("Salon &amp; &lt;script&gt;bad()&lt;/script&gt;");
    expect(html).toContain("https://dinaya.lk/client?next=&lt;bad&gt;&amp;q=&quot;x&quot;");
    expect(html).not.toContain("<script>bad()</script>");
    expect(html).not.toContain("<img src=x");
  });
});
