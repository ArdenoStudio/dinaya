# Dinaya documentation content

## Structure

- `faq/` — Help center FAQ (shared with `/help`)
- `guides/` — Step-by-step guides rendered at `/docs/guides/[slug]`
- `reference/` — Short reference pages at `/docs/reference/[slug]`
- `categories.ts` — Docs hub category definitions

## Adding a guide

1. Create `guides/your-slug.ts` exporting a `DocsGuide` object.
2. Register it in `guides/index.ts`.
3. Use `visual: { type: "mockup", mockupId: "dashboard-*" }` or `booking-*` for UI snippets.
4. Add `hotspots` with `x`/`y` as percentages (0–100) and `showCursor: true` where needed.

## Screenshots

Run with the dev server up:

```bash
# Real dashboard (requires DATABASE_URL)
PLAYWRIGHT_BASE_URL=http://localhost:3000 DOCS_CAPTURE_MODE=live npx tsx scripts/capture-docs-screenshots.ts

# Mockup previews (no database)
PLAYWRIGHT_BASE_URL=http://localhost:3000 DOCS_CAPTURE_MODE=preview npx tsx scripts/capture-docs-screenshots.ts
```

Outputs to `public/docs/screenshots/`. Then switch a guide step to:

```ts
visual: { type: "screenshot", src: "/docs/screenshots/dashboard-bookings.png" }
```

## Rich text in step bodies

Step `body` strings support lightweight inline markdown:

- `**bold**`
- `` `inline code` ``
- `[link label](https://example.com)`

Rendered by `DocsRichText` in the walkthrough.

## Visual components

| Component | Purpose |
|-----------|---------|
| `DocsProductFrame` | Branded browser chrome + dashboard mockup or screenshot |
| `DocsPhoneFrame` | iPhone frame for booking flow mockups |
| `DocsSpotlight` | Dims non-highlighted areas during walkthrough steps |
| `DocsGuideThumbnail` | Scaled preview for docs hub and related-guide cards |
| `DocsHeroPreview` | Rotating hero mockup on `/docs` |

Optional `thumbnailMockupId` on `DocsGuide` overrides the hub card preview.

## Maintenance

When dashboard UI changes, update mockups in `src/components/docs/mockups/` or re-run the screenshot script.

CI: trigger the **Docs screenshots** workflow manually after dashboard UI changes (requires `DATABASE_URL` and `AUTH_SECRET` secrets).
