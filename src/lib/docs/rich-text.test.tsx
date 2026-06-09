import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DocsRichText } from "./rich-text";

describe("DocsRichText", () => {
  it("renders bold, code, and links", () => {
    const html = renderToStaticMarkup(
      <DocsRichText text="Open **Settings** and paste your `Merchant ID` from [PayHere](https://payhere.lk)." />,
    );
    expect(html).toContain("<strong");
    expect(html).toContain("Settings");
    expect(html).toContain("<code");
    expect(html).toContain("Merchant ID");
    expect(html).toContain('href="https://payhere.lk"');
  });

  it("preserves line breaks as paragraphs", () => {
    const html = renderToStaticMarkup(<DocsRichText text={"Line one\nLine two"} />);
    expect(html.match(/<p/g)?.length).toBe(2);
  });
});
