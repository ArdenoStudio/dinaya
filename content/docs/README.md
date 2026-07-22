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

Guide walkthroughs, hub cards, and the docs hero **prefer real PNGs** from
`public/docs/screenshots/` whenever a matching mockup ID exists. React mockups
remain as a fallback (and for `/docs/preview/*` capture).

Run with the dev server up:

```bash
# Real dashboard + booking (requires DATABASE_URL) — preferred for docs assets
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 DOCS_CAPTURE_MODE=live npm run docs:screenshots

# Mockup previews only (no database)
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 DOCS_CAPTURE_MODE=preview npm run docs:screenshots
```

Live mode registers a demo business, seeds services/staff/availability, then
captures dashboard pages at desktop size and the public booking flow at phone size.

Guides can keep `visual: { type: "mockup", mockupId: "dashboard-bookings" }` —
the walkthrough renders the matching screenshot automatically. Explicit:

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
| `DocsPhoneFrame` | iPhone frame for booking flow mockups or mobile screenshots |
| `DocsSpotlight` | Dims non-highlighted areas during walkthrough steps |
| `DocsGuideThumbnail` | Scaled preview for docs hub and related-guide cards |
| `DocsHeroPreview` | Rotating hero screenshot/mockup on `/docs` |

Optional `thumbnailMockupId` on `DocsGuide` overrides the hub card preview.

## Maintenance

When dashboard UI changes:

1. Update `dashboard-nav-layout.ts` to mirror `dashboardRouteGroups` (mockup fallback).
2. Re-run **live** screenshot capture so hub/walkthrough PNGs match the real UI.
3. Optionally refresh mockup chrome in `src/components/docs/mockups/` for preview fallback.
4. Keep guide steps on `type: "mockup"` mockup IDs — screenshots are resolved automatically.

CI: trigger the **Docs screenshots** workflow manually after dashboard UI changes (requires `DATABASE_URL` and `AUTH_SECRET` secrets).
