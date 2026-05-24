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
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx tsx scripts/capture-docs-screenshots.ts
```

Outputs to `public/docs/screenshots/`. Then switch a guide step to:

```ts
visual: { type: "screenshot", src: "/docs/screenshots/dashboard-bookings.png" }
```

## Maintenance

When dashboard UI changes, update mockups in `src/components/docs/mockups/` or re-run the screenshot script.
