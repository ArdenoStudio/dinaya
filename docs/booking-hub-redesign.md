# Dinaya Booking Hub — Redesign Master Plan

> Hand this whole file to Cursor (reference it as `@docs/booking-hub-redesign.md`).
> It tells you to **browse the component sites yourself, catalog everything you find,
> pull the real code, then implement it** into our booking hub. Use **real, installed
> components** — never hand-rolled CSS lookalikes.

---

## 0. Mission & golden rule

Redesign the public booking **hub** page (`/book/[slug]` with multiple services) into a
premium, animated, trustworthy experience.

**Golden rule:** every effect (border beam, spotlight/glow card, marquee, avatar stack,
testimonials carousel, shiny text, hover button, ambient background) must be a **real
component installed from its source** — not a bespoke CSS approximation. If a component
can't be installed/copied, say so and skip it; don't fake it.

---

## 1. PROCESS — do this in order

### STEP 1 — Browse every site, exhaustively

Use your web-browsing tool (`@Web` / browser) to **open and read each site below in full**.
For each site, go through its **entire** component catalog — click into every category
(backgrounds, cards, text, buttons, sections, testimonials, footers, FAQ, navbars, etc.).
**Do not stop at the first match.** Be thorough on each site before moving to the next.

For **every** component that could serve **any** hub section, record a row:

`Component name | Site | exact URL | what it does (1 line) | hub section it fits | install method`

Hub sections to keep in mind while browsing: **header/identity card · service cards ·
policy/FAQ · about/gallery · team · reviews/testimonials · primary "Book" CTA · footer ·
ambient background (CSS-only)**.

**Sites to visit (all of them):**

| Site | URL | What to mine |
|---|---|---|
| Magic UI | https://magicui.design/docs/components | Special Effects (Border Beam, Shine Border, Magic Card, Meteors), Animations (Blur Fade, Number Ticker), Text (Animated Shiny Text, Gradient Text), Marquee, Avatar Circles, Interactive Hover Button, Buttons, CSS backgrounds |
| Animated Beam (Magic UI) | https://magicui.design/docs/components/animated-beam | The bookmarked component — evaluate for connectors/visual interest |
| Aceternity UI | https://ui.aceternity.com/components | Cards (Glowing Effect, Card Spotlight, Focus Cards, Glare Card, Wobble), Testimonials (Animated Testimonials, Infinite Moving Cards, Card Stack), Animated Tooltip, Hover Border Gradient, FAQs, Footers, Team, CTA, CSS backgrounds |
| Apple Cards Carousel (Aceternity) | https://ui.aceternity.com/components/apple-cards-carousel | Bookmarked — gallery/service showcase |
| Cult UI | https://www.cult-ui.com/docs/components | Texture Card, Gradient Heading, buttons (Border Beam / Bg Animate / Metal), Hero panels |
| Hero Color Panels (Cult UI) | https://www.cult-ui.com/docs/components/hero-color-panels | Bookmarked — header background (check it's CSS, not WebGL) |
| React Bits | https://reactbits.dev/ | Text Animations (ShinyText), Components (spotlight/tilt cards, Dock), Animations, CSS Backgrounds |
| 21st.dev | https://21st.dev/ (use Explore / Components) | Community hero, pricing, testimonials, cards, footers, FAQ |
| HyperUI | https://hyperui.dev/ | Marketing Cards/CTAs/Banners, Application Accordions/Details-Lists/Badges, **Neobrutalism** set (clean Tailwind, copy-paste) |
| shadcnblocks | https://www.shadcnblocks.com/blocks | Hero, About, Testimonial, Footer, Feature, Contact (shadcn-native) |
| DaisyUI | https://daisyui.com/components/ | **Ideas only** — its own class system clashes with our shadcn tokens; do not import directly |
| Tremor | https://tremor.so/ | Charts — **likely SKIP** for a customer booking page (note it and move on) |
| Watermelon UI | search the web for it (React blocks/dashboards) | Blocks/sections if relevant |

> The user's bookmarks also include generic groups ("Footers", "FAQ Sections", "Icons",
> "Better Design Tips", "UI component library", "WebDev"). Treat "Footers"/"FAQ Sections"
> as the footer/FAQ categories on the sites above; "Icons" = an icon set (we already use
> `@hugeicons` + `bootstrap-icons`/`lucide-react` — reuse those, don't add another).

### STEP 2 — Consolidate ONE master list

After you've visited **all** the sites, output a single consolidated list, **grouped by hub
section**. For each section give your **top pick + 1–2 alternatives**, each with: name ·
source · URL · install method (registry command or "copy from Code tab"). Mark anything you
deliberately **skip** and why (WebGL-heavy, off-brand pink, charts, class-system clash).
Show me this list, then continue.

### STEP 3 — Get the real code

For each chosen component, **install it for real**:
- shadcn-registry components → run the exact `npx shadcn@latest add "<url>"` shown on the
  component's CLI tab (registry patterns: Magic UI `https://magicui.design/r/<name>`,
  Cult UI `https://www.cult-ui.com/r/<name>.json`, React Bits `https://reactbits.dev/r/<Name>-TS-TW`,
  Aceternity `https://ui.aceternity.com/registry/<name>.json` or copy its source).
- HyperUI / copy-paste components → paste the source into `src/components/ui/`.
- Install any peer deps the page lists (most need only `motion`, `clsx`, `tailwind-merge` — already present).

Then, on every installed component: switch `framer-motion` imports to `motion/react`,
recolor purple/pink defaults to **cobalt→violet**, and add `dark:` variants.

### STEP 4 — Implement into Dinaya

Wire the chosen components into the hub files (§4) following the section spec (§6), brand
rules (§2), guardrails (§3), and phases (§7). Verify after each phase.

---

## 2. Brand rules (hard constraints)

- Palette: **cobalt = primary**, **violet = engagement**, **amber = booking/CTA**, **emerald = availability**. **NEVER pink/rose.**
- Every library ships purple/pink defaults — **recolor to cobalt→violet** on install.
- **Dark mode required** for every new component (`.dark` ancestor; shadcn tokens or `dark:` variants). Verify both themes.
- **Respect `prefers-reduced-motion`** — gate all motion; static fallback.
- **Performance:** public, mobile-first, Sri Lanka. Protect LCP: **prefer CSS/SVG; AVOID WebGL/canvas** (no shader Auroras, Vortex, Ballpit, Liquid Metal, heavy particles). `next/dynamic` (`ssr:false`) for heavier client-only components.

## 3. Do NOT break (guardrails)

Only touch presentation. Do not modify: the wizard, slot holds, idempotent booking
creation, overlap protection; payments (PayHere/PayPal/bank) + pending-payment polling;
deals/`applyDeal`; reviews API (`/api/public/reviews/...`); URL state sync; embed mode
(`EmbedResizeReporter`). No API/DB/schema changes. No new env vars.

## 4. Files to edit

| File | Role |
|---|---|
| `src/components/booking/BookingServiceHub.tsx` | Header identity card + service list |
| `src/components/booking/BookingPageContent.tsx` | Page assembly + section order |
| `src/components/booking/BookingReviewsSection.tsx` | Reviews trigger + dialog |
| `src/components/booking/BookingTeamSection.tsx` | Team |
| `src/components/booking/BusinessRating.tsx` | Rating + count (already has `animateCount` prop) |
| `src/components/booking/BookingPolicyAccordion.tsx` | Cancellation / deposit / trust |

**Reuse (already in repo — do NOT recreate):** `src/components/ui/number-ticker.tsx` (count-up),
`src/components/ui/blur-fade.tsx` (scroll reveal). Preview at **`/book/test`** (`npm run dev`, port 3002).

## 5. Stack (do not change)

Next.js 16 App Router (`src/app`), React 19, TypeScript strict, ESLint `--max-warnings=0`.
shadcn/ui + Radix, Tailwind v3. Tokens in `src/app/globals.css`: `--primary: 220 82% 53%`
(cobalt `#2563eb`), `--radius: 0.5rem`, display font `font-cal`, body `font-sans` (Inter).
`cn()` from `src/lib/utils.ts`. Animation runtime: `motion` / `motion/react` **v12**.

## 6. Section-by-section target

- **Header / identity card** — spotlight/glow card (e.g. Magic Card or Aceternity Glowing Effect) around the header; business name with a gradient heading (cobalt→violet); keep `BusinessRating animateCount`; "Available today" via animated shiny text + emerald dot; one `BlurFade` reveal on mount.
- **Service cards** — convert rows to cards; hover glow on each; **border beam / shine border** on the most-popular service + a cobalt "Popular" pill; `BlurFade` stagger; animated chevron; keep duration/price badges (price in subtle amber).
- **Policy / trust** — keep the shadcn Accordion; make it icon-led (shield/calendar-x); HyperUI FAQ markup for structure only.
- **About / gallery** — Apple Cards Carousel or a Marquee of gallery thumbs **if** the business has photos (lazy-loaded); else a clean About card with `BlurFade`.
- **Team** — Avatar Circles + Animated Tooltip (name/role on hover); scales 1 → many.
- **Reviews** — keep the dialog + Google-style `ReviewRatingSummary`; surface a Marquee (or Animated Testimonials) of real review snippets inline; animated `4.7` / `1,500`; `BlurFade`.
- **Sticky mobile CTA (optional)** — sticky bottom Interactive Hover Button "Book now" (amber); hide on desktop.

## 7. Phases (run `npm run lint && npm run build` after each)

1. Research (Steps 1–2) → consolidated component list. 2. Install chosen components (Step 3), recolor + dark. 3. Header. 4. Service cards. 5. Reviews. 6. Team + Policy. 7. Gallery + sticky CTA. 8. Polish: dark-mode pass, 375/390px mobile, lazy-load heavy bits, reduced-motion audit, Lighthouse (LCP/CLS).

## 8. Definition of done

- [ ] Every effect is a **real installed component** (or repo's `number-ticker`/`blur-fade`) — no bespoke fakes.
- [ ] Consolidated component list (Step 2) was produced before implementing.
- [ ] `npm run lint` clean (zero warnings); `npm run build` passes.
- [ ] Light **and** dark verified on `/book/test`; 375px + 390px mobile; no horizontal scroll; touch targets ≥ 44px.
- [ ] `prefers-reduced-motion` → animation off, content fully visible.
- [ ] No pink/rose; accents cobalt/violet/amber/emerald only. No WebGL/canvas backgrounds.
- [ ] Booking, payments, deals, reviews API, embed mode untouched and working.

## 9. Notes

- Libraries usually import `framer-motion`; switch to `motion/react` (drop-in) so there's one runtime.
- Installed components are owned source — edit freely to fit tokens; remove purple defaults.
- Repo already shipped baseline polish to `BookingServiceHub`/`BusinessRating`/`BookingReviewsSection` (count-ups + accent wash) — build on top, don't regress.
- Keep `BusinessRating`'s `animateCount` opt-in (don't animate every rating on the page).
