# Dinaya Docs Demos — Premium Design Master Plan

A reference for keeping the interactive demos inside `/docs` looking premium and
on-brand. Read this before touching anything in `src/components/docs/`.

## 1. What "premium" means here

Benchmarks: **Apple** (developer.apple.com + product pages), **Stripe**,
**Linear**, and **Vercel** docs. The recurring signals across all four:

| Signal | What they do | What we do |
|--------|--------------|------------|
| **Authenticity** | Demos look like the real product, not stylised wireframes. | Mockups mirror the real dashboard nav, cards, avatars, and stats. |
| **Restraint** | Pure backgrounds, one accent colour, generous whitespace. | White surfaces, blue/indigo primary, status colours reserved. |
| **Depth** | Layered window shadows, soft glass, real device frames. | macOS browser chrome + iPhone frame with layered shadows. |
| **Typography as hierarchy** | Tight display headings, tabular numbers for data. | `font-cal` headings, `tabular-nums` on all stats/prices. |
| **Defined motion** | Named curves + durations, never browser defaults. | One spring + one ease in `demo-theme.ts`, used everywhere. |
| **Interaction completeness** | Every control has default/hover/focus/active. | Buttons, toggles, and pills carry real states. |
| **Short guided flows** | 1–6 steps, 2–4 "a-ha" moments, beacons guide attention. | Step pills + animated cursor + "Where to click" hint. |

## 2. Design tokens (single source of truth)

All shared values live in `src/components/docs/mockups/demo-theme.ts`:

- `DEMO_SPRING` / `DEMO_EASE` — the only two motion curves demos may use.
- `stepVisualMotion` — crossfade + lift applied when a walkthrough swaps panels.
- `DEMO_WINDOW_SHADOW` — layered floating-glass shadow for frames.
- `DEMO_CARD` — standard mockup surface (rounded, hairline border, soft shadow).
- `DEMO_NUMERALS` — `tabular-nums` + tight tracking for all numeric data.
- `avatarGradient()` / `initials()` — deterministic avatars so mockups feel populated.

Colour + type tokens come from `globals.css` / `tailwind.config.ts`
(`--primary 220 82% 53%`, `font-cal` display, Inter body). Do **not** introduce
new palettes inside demos.

## 3. Component architecture

```
UiWalkthrough            ← step state, keyboard nav, ?step= deep links, motion
├─ DocsScreenshotFrame   ← premium macOS browser window (dashboard demos)
│  └─ DocsDashboardMockup← high-fidelity dashboard (sidebar + topbar + panels)
└─ DocsPhoneFrame        ← iPhone 15 device frame (booking demos)
   └─ DocsBookingMockup  ← high-fidelity public booking flow
DocsTargetHighlight      ← ring + glow attached to a real element
DocsCursor               ← animated pointer w/ glow + click ripple
```

Content stays declarative in `content/docs/guides/*.ts` — a step picks a
`mockupId` and an optional `highlightNav` / `highlightTarget`. **Adding fidelity
must never change that content contract.**

## 4. Anti-patterns (do not ship)

- New colour palettes, gradients outside the primary→indigo brand ramp.
- Status colours (emerald/amber/red) used decoratively instead of for meaning.
- Browser-default transitions, or motion that isn't `DEMO_SPRING` / `DEMO_EASE`.
- Proportional/“lining” numerals for data — always `DEMO_NUMERALS`.
- Hard-coded fake avatars instead of `avatarGradient()` + `initials()`.
- Renaming or dropping `highlightTarget` IDs — they are the content API.

## 5. Roadmap (highest leverage next)

1. **Real screenshots for top guides.** Pipeline exists
   (`npm run docs:screenshots` → `public/docs/screenshots/`). Migrate the 6
   featured guides to `type: "screenshot"` for pixel-accurate fidelity, keeping
   code mockups as the resilient fallback.
2. **Auto-play / scroll-synced walkthroughs.** Optional timed advance through
   steps using `DEMO_SPRING`, pausing on hover — mirrors Linear/Stripe demos.
3. **Dark-mode demo surfaces.** Tokens already exist in `globals.css`; add a
   dark treatment to frames + mockups for parity with the rest of the brand.
4. **Mobile docs nav.** Replace the `<select>` in `DocsMobileNav` with a proper
   drawer/accordion to match the premium desktop sidebar.
5. **Per-component metadata.** As mockups grow, document each panel variant so
   future contributors (and AI agents) extend them consistently.

## 6. Checklist before merging demo changes

- [ ] Uses only `demo-theme.ts` motion + shadow + numeral tokens.
- [ ] No new colours; status colours carry meaning only.
- [ ] All `highlightTarget` / `highlightNav` IDs still resolve.
- [ ] `npm run verify` passes (lint + unit tests + build).
- [ ] Spot-checked a dashboard guide and a booking guide visually.
