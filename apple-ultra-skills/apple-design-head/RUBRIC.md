# Apple Design Head — Rubric Reference

Companion to `SKILL.md`. Use for deep audits; the skill file has the operational protocol.

**Scoring:** 0 = fail · 1 = partial · 2 = pass

**Targets:**
- **Fast path (Round 3):** 40 points across 8 buckets → **≥34** for Apple-quality feel
- **Full ledger:** 134 points across 67 items → **≥114** (85%) for ship candidate

---

## Apple principles

### Enduring triad
- **Clarity** — Legible type, precise icons, focus on function
- **Deference** — UI recedes; content is primary
- **Depth** — Layers and motion convey hierarchy

### WWDC26 foundations
- **Purpose** — Serves people; clear and considered
- **Agency** — User controls pace and path
- **Responsibility** — Inclusive, accessible, honest
- **Familiarity** — Same look = same behavior
- **Flexibility** — Adapts to preferences (text size, motion, theme)
- **Simplicity** — Friction removed, not decoration removed
- **Craft** — Typography, color, motion, performance
- **Delight** — Earned through the above, not gimmicks

### Liquid Glass (2025+)
- Two layers: **content** (data) vs **navigation** (chrome)
- Glass on nav/toolbars only — never glass-on-glass on content cards
- Controls float above scrolling content
- Tinting respects legibility; test with Reduce Transparency

---

## Fast-path craft scorecard (40 pts)

Use for Round 3 in most reviews. Score 0/1/2 per bucket (5 pts each).

| Bucket | 2 = Pass |
|--------|----------|
| **Typography** | ≤6 named roles; body ≥17px mobile; ≤2 weights per block; line height 1.25–1.35 |
| **Color** | 100/60/30% hierarchy; canvas ≠ card; ≥4.5:1 body; one accent per screen |
| **Spacing** | ≥90% on 4/8px grid; 16px screen margin; ≥24px section gaps |
| **Touch** | All tappables ≥44×44px hit area on mobile |
| **Materials** | Blur on chrome only; cards use fill hierarchy; ≤1 soft shadow on shell |
| **Shape** | ≤3 radii; nested radius ≈ outer − padding; consistent CTA shape |
| **Dark mode** | `#000` canvas, `#1C1C1E` cards, `#2C2C2E` elevated; not inverted light |
| **Focus/a11y** | `:focus-visible` ≥3:1; keyboard path complete; non-color selected states |

**Ship candidate:** ≥34/40 (85%)

---

## Full visual craft ledger (134 pts)

### 1. Typography (8 items · 16 pts)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| T1 | Type scale logic | Ad-hoc pixel sizes dominate | Scale exists but >3 overrides per screen | ≤8 semantic roles; modular ratio 1.2–1.333 |
| T2 | Role mapping | Headings sized arbitrarily | Roles defined but misused | Each element maps to one role token |
| T3 | Line height | Body <1.4 without reason | Mixed leading | Body 1.4–1.6; UI labels 1.2–1.35 |
| T4 | Weight discipline | 3+ weights in one component | Mostly 2 but random bold | ≤2 weights per block; semibold for emphasis |
| T5 | Size floor | Text <12px or fixed px without rem | rem used but sub-14px labels | Body ≥16px (17px mobile); min 12px only for legal |
| T6 | Measure | Paragraphs >90ch | Some >75ch | Body 45–75ch |
| T7 | Tracking & caps | Positive tracking on body | Letter-spacing only on badges | Negative tracking on ≥20px headings only |
| T8 | Fluid type | Only breakpoint jumps | Fluid on hero only | `clamp()` on display/headline |

### 2. Color (8 items · 16 pts)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| C1 | Semantic tokens | Raw hex in components | Tokens exist but locals override | 100% UI via semantic tokens |
| C2 | Text hierarchy | Random gray classes | Two families inconsistent | 100/60/30% opacity ladder both themes |
| C3 | Contrast | Body <4.5:1 | Passes one theme only | ≥4.5:1 body; ≥3:1 large type; both themes |
| C4 | Accent discipline | Multiple competing hues | One accent but gradients compete | One interactive accent per viewport |
| C5 | Destructive semantics | Red for branding/badges | Red only on delete | Destructive token only for irreversible harm |
| C6 | Surface grouping | Page = card background | Subtle difference | Canvas ≠ elevated ≠ inset field |
| C7 | Dark mode quality | invert() or low-contrast gray | Dark exists but same steps as light | Rebuilt hierarchy; accent retuned |
| C8 | State colors | Hover/focus unrelated | States exist but low contrast | Tokenized focus/hover/selected/disabled/error |

### 3. Spacing (6 items · 12 pts)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| S1 | Grid discipline | Odd spacing throughout | ~70% on grid | ≥90% on 4/8/16/24/32/48 |
| S2 | Margins | Edge padding varies (12/16/20) | Consistent edge, uneven sections | 16px mobile; 24px+ tablet; 24–32px sections |
| S3 | Component rhythm | Card padding differs per instance | Two tiers without rules | Compact/default/spacious tiers defined |
| S4 | Vertical rhythm | Arbitrary gaps | Mostly consistent | Label→field 4–8px; field→field 16px |
| S5 | Touch targets | <44px on mobile | Some expanded | All tappables ≥44×44px |
| S6 | Safe areas | Fixed CTAs underlap home indicator | Partial safe-area | `env(safe-area-inset-bottom)` on sticky chrome |

### 4. Component consistency (10 items · 20 pts)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| K1 | Buttons | 4+ styles on one flow | Primary/secondary exist but vary | One primary, one secondary, one destructive |
| K2 | Inputs | Mixed heights/borders/focus | Shared but overridden | Single Input primitive; consistent states |
| K3 | Cards | Mix bordered/shadowed/glass | Two types no rule | Default + optional elevated variant |
| K4 | Modals | Custom overlays per feature | Shared but ad-hoc | One dialog primitive; focus trap; restore focus |
| K5 | Toasts | alert() or inline-only | Toasts vary placement | Semantic variants; aria-live |
| K6 | Loading | Blank or generic spinners | Skeleton on some pages | Skeleton matches layout; aria-busy |
| K7 | Empty/error | Missing or text-only | Message without action | Icon + headline + recovery CTA |
| K8 | Tables/lists | Row height/hover differs | Mostly shared | Shared row: min height, hover, selected |
| K9 | Badges | Rainbow without meaning | Colors map but sizes vary | Tokenized variants; one height scale |
| K10 | Primitive reuse | Feature copies button styles | Imports but forks | ui/* used before bespoke markup |

### 5. Elevation & materials (6 items · 12 pts)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| E1 | Shadow system | Unique shadow per component | 2–3 used interchangeably | ≤3 named elevation levels |
| E2 | Fill vs shadow | Cards rely on heavy shadow | Mix of both | Surface tokens first; shadow for floating only |
| E3 | Blur discipline | backdrop-blur on content | Blur on nav + one card | Blur on chrome only |
| E4 | Glass fallback | No @supports fallback | Fallback but low contrast | Solid fallback + @supports enhancement |
| E5 | Dark elevation | Same shadow as light | Slightly adjusted | Borders/lightening; reduced shadow opacity |
| E6 | Glass stacking | Multiple blurred layers nested | Rare nesting | Max one frosted layer per region |

### 6. Border radius (4 items · 8 pts)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| R1 | Scale count | 6+ distinct radii | 4–5 without roles | ≤4 radii: control/card/shell/pill |
| R2 | Nested continuity | Inner = outer radius | Sometimes correct | Inner ≈ outer − padding |
| R3 | Semantic consistency | Mixed shapes same screen | Mostly per type | Inputs ≤10px; cards 12–16px; CTAs consistent |
| R4 | Token source | arbitrary rounded-[N] | --radius exists but bypassed | var(--radius) derived from root |

### 7. Iconography (5 items · 10 pts)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| I1 | Library | Mixed icon families | One family, old icons remain | Single set across app |
| I2 | Stroke/fill | Outlined and filled mixed | Mostly outlined | One style; filled for active only |
| I3 | Size scale | w-4/w-5/w-6 arbitrary | Two sizes | 16/20/24px semantic map |
| I4 | Alignment | Optically misaligned | Centered but baseline off | inline-flex + 8px gap; decorative aria-hidden |
| I5 | Meaning | Same icon, different actions | Mostly consistent | Edit=pencil, delete=trash, close=X everywhere |

### 8. Micro-interactions (6 items · 12 pts)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| M1 | Duration | >400ms or inconsistent | Mostly 200–300ms | 150–250ms ease-out UI |
| M2 | Purpose | Decorative motion on load | Motion on primary only | Motion communicates state change |
| M3 | Hover/active | No hover or scale-bounce | Hover color only | Hover + active + disabled distinct |
| M4 | Async feedback | No response >100ms | Spinner somewhere | Button loading <200ms; double-submit blocked |
| M5 | Selection | Color-only selected | Border without icon | Border/weight/icon + aria-selected |
| M6 | Reduced motion | Ignores prefers-reduced-motion | Partial | Global media query + JS hook |

### 9. Keyboard & focus (7 items · 14 pts)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| F1 | Tab order | Illogical; positive tabindex | Mostly DOM order | Logical order; no positive tabindex |
| F2 | Focus visible | outline:none without replacement | Ring on some controls | :focus-visible ≥3:1 on all interactives |
| F3 | Focus trap | Modal doesn't trap | Trap but no restore | Trap + Escape + restore to trigger |
| F4 | Skip link | None on app shells | Broken target | Skip → #main; visible on focus |
| F5 | Roving tabindex | Grid requires 50+ tabs | Grids tab per cell | Arrow keys + roving tabindex |
| F6 | Live regions | Errors silent to SR | role=alert on some | aria-describedby; aria-live; aria-busy |
| F7 | Keyboard parity | Mouse-only features | Partial keyboard | All flows keyboard-completable |

### 10. Anti-patterns (7 items · 14 pts)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| A1 | Glassmorphism abuse | Frosted cards on frosted bg | Glass on nav + 2 content panels | Glass on chrome only |
| A2 | Gradient noise | Mesh + gradient buttons + text | One gradient accent | Gradients rare; never on body text |
| A3 | Card nesting | Cards in cards in cards | One unnecessary wrapper | Spacing/dividers instead of boxes |
| A4 | Font cliché | Inter/Roboto + weak hierarchy | System font weak hierarchy | Distinctive OR disciplined system scale |
| A5 | Animation excess | Scroll-fade every section | Hero + cards animate | ≤1 entrance per route |
| A6 | Metric theater | Fake charts / decorative KPIs | Real data decorative | Data density matches task |
| A7 | Copy decoration | Vacuous marketing subheads | Some fluff | Concrete verbs and outcomes |

---

## Severity overlay

Any **0** on these items → auto-escalate:

| Item | Escalation |
|------|------------|
| C3 (contrast on primary CTA) | **P0** |
| F2, F7 (focus / keyboard) | **P0** on primary path |
| S5 (touch targets on primary actions) | **P1** (P0 if blocks task) |
| E3, A1 (glass on content) | **P1** |
| M4 (no async feedback on checkout/auth) | **P1** |

---

## Grade mapping (full ledger)

| % of 134 | Grade | Action |
|----------|-------|--------|
| ≥90% (≥121) | A | Ship |
| ≥85% (≥114) | A- | Ship with P2 backlog |
| ≥75% (≥101) | B | One iteration |
| ≥60% (≥80) | C | Major pass |
| <60% | D | Rethink system |

---

## Nielsen heuristic crosswalk

| Heuristic | Rubric items |
|-----------|--------------|
| H1 Visibility of status | K6, M4, A8 (agency round) |
| H2 Match real world | A7, copy in R1 |
| H3 User control | F3, F7, onboarding patterns |
| H4 Consistency | K1–K10 |
| H5 Error prevention | C8, form patterns |
| H6 Recognition > recall | R1 wayfinding, summary lines |
| H7 Flexibility | T8, density options |
| H8 Minimalist | A3, A6, R0 purpose |
| H9 Error recovery | K7, live regions |
| H10 Help | K7 empty states |

---

## Semantic CSS tokens (web)

```css
:root {
  --bg-grouped: #f2f2f7;
  --bg-card: #ffffff;
  --bg-elevated: #f2f2f7;
  --label: #000000;
  --label-secondary: rgba(60, 60, 67, 0.6);
  --label-tertiary: rgba(60, 60, 67, 0.3);
  --separator: rgba(60, 60, 67, 0.29);
  --accent: #007aff;
  --destructive: #ff3b30;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --tap-min: 44px;
  --page-margin: 16px;
  --duration-fast: 150ms;
  --duration-normal: 250ms;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg-grouped: #000000;
    --bg-card: #1c1c1e;
    --bg-elevated: #2c2c2e;
    --label: #ffffff;
    --label-secondary: rgba(235, 235, 245, 0.6);
    --label-tertiary: rgba(235, 235, 245, 0.3);
    --separator: rgba(84, 84, 86, 0.6);
    --accent: #0a84ff;
    --destructive: #ff453a;
  }
}
```

---

## SF Pro / system type scale (iOS reference)

| Style | Size | Weight | Line height |
|-------|------|--------|-------------|
| Large Title | 34pt | Regular | ~41pt |
| Title 1 | 28pt | Regular | ~34pt |
| Title 2 | 22pt | Regular | ~28pt |
| Headline | 17pt | Semibold | ~22pt |
| Body | 17pt | Regular | 22pt (1.29) |
| Footnote | 13pt | Regular | ~18pt |
| Caption 2 | 11pt | Regular | ~13pt (minimum) |

---

## Motion reference

| Context | Default | Reduced motion |
|---------|---------|----------------|
| Step transition | 150–250ms ease-out | 0ms or opacity 150ms |
| Micro-feedback | 100ms | 0ms |
| Sheet/modal | 250–350ms | Fade 150ms |
| Loading spinner | OK (semantic) | OK |

Spring presets (native): perceptual duration 0.4–0.6s; bounce 0 for utility UI.

---

## Sources

- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines)
- [Design principles (2026)](https://developer.apple.com/design/human-interface-guidelines/design-principles)
- [UI Design Tips](https://developer.apple.com/design/tips/)
- [Adopting Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass)
- [Principles of great design (WWDC26)](https://developer.apple.com/videos/play/wwdc2026/250/)
- [Designing Fluid Interfaces (WWDC18)](https://developer.apple.com/videos/play/wwdc2018/803/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [NN/G glassmorphism](https://www.nngroup.com/articles/glassmorphism/)
- [Baymard checkout](https://baymard.com/blog/current-state-of-checkout-ux)
