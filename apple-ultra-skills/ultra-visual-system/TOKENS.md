# Ultra Visual System — Token Reference

Companion to `SKILL.md`. Grep patterns, semantic tokens, and scored ledger for deep audits.

---

## Canonical palette

### Global primary (CSS)

```css
/* src/app/globals.css — reference */
--primary: 220 82% 53%;  /* cobalt your primary color token (see _shared/VISUAL.md) */
```

| Name | Hex | HSL | Use |
|------|-----|-----|-----|
| **Cobalt** | `your primary color token (see _shared/VISUAL.md)` | `220 82% 53%` | Primary actions, links, brand |
| **Violet** | `#7c3aed` | engagement | Reminders, gradient accents |
| **Amber** | `#f59e0b` | pending | Booking/payment pending |
| **Emerald** | `#10b981` | confirmed | Confirmed, availability, messaging |

### Marketing-only accents (badges — not core booking tokens)

| Name | Hex | Use |
|------|-----|-----|
| Live orange | `#F97316` | Live badge |
| Website sky | `#0EA5E9` | Website badge |

### Dark showcase (pricing sections)

| Token | Value |
|-------|-------|
| Background | `#030712` |
| Primary glow | `hsl(220 82% 53% / 0.55)` |

---

## Booking hub source

Primary reference: ``your design tokens module` (see _shared/VISUAL.md)`

Always prefer exported constants over inline hex in `src/components/booking/**`.

---

## Typography tokens

| Role | Class / token | Font |
|------|---------------|------|
| Display / headings | `your display font token (see _shared/VISUAL.md) tracking-tight` | Cal Sans SemiBold |
| Body | default sans | Inter / system |
| Wordmark | SVG inline | 28px · 600 · -0.02em letter-spacing |

**Mobile input rule:** `text-base` (16px) minimum on inputs — prevents iOS zoom.

---

## Logo rules

| Asset | Path | Rule |
|-------|------|------|
| Light | `public/your-brand-light.svg` | Mark `#111111` on white |
| Dark | `public/your-brand-dark.svg` | Mark `#ffffff` on dark |
| Footer | Booking pages | **Powered by your product.lk** (Growth removes) |

---

## Spacing & touch

| Token | Value |
|-------|-------|
| Grid | 4 / 8 / 16 / 24 / 32 / 48 px |
| Screen margin (mobile) | 16px |
| Touch target (booking) | ≥44×44px |
| Section gap | ≥24px |

---

## Grep violation suite

Run from repo root. Triage every match — some hits are legitimate (e.g. `globals.css` definitions).

### 1. Hardcoded colors (booking components)

```bash
rg '#[0-9a-fA-F]{3,8}|rgb\(|hsl\([^v]' --glob 'src/components/booking/**'
```

**Severity:** P1 default · P0 if replaces cobalt semantic primary

### 2. Banned pink/rose (booking surfaces)

```bash
rg 'pink|rose-' --glob 'src/components/booking/**'
```

**Severity:** P0 — no exceptions on booking hub

### 3. Glass on content

```bash
rg 'backdrop-blur|backdrop-filter' --glob 'src/components/booking/**'
```

**Severity:** P0 on content cards · P1 on non-chrome misuse

### 4. Arbitrary Tailwind values

```bash
rg 'text-\[|bg-\[|rounded-\[|p-\[|m-\[|gap-\[|shadow-\[|w-\[|h-\[' \
  --glob 'src/components/booking/**'
```

**Severity:** P1 — prefer design tokens

### 5. Wrong blue family

```bash
rg '#3b82f6|#1d4ed8|#60a5fa|blue-400|blue-500|blue-600|sky-500' \
  --glob 'src/components/booking/**'
```

**Severity:** P1 — should be cobalt `your primary color token (see _shared/VISUAL.md)`

### 6. Focus stripped

```bash
rg 'outline-none|outline:\s*none' --glob 'src/components/booking/**'
```

**Severity:** P0 without `:focus-visible` replacement

### 7. Decorative anti-patterns

```bash
rg 'border-beam|marquee|animate-pulse.*hero|glow-' --glob 'src/components/booking/**'
```

**Severity:** P1 on booking hub — interaction-only motion

### 8. Dashboard drift (optional scope)

```bash
rg 'pink|rose-|#[0-9a-fA-F]{6}' --glob 'src/components/dashboard/**' | head -50
```

**Severity:** P2 unless customer-facing booking-adjacent UI

### 9. Marketing pages

```bash
rg 'from-purple|to-pink|gradient.*violet.*pink' --glob 'src/app/(marketing)/**'
```

**Severity:** P1 if competes with cobalt system

---

## Semantic status mapping

| State | Color | Wrong alternatives |
|-------|-------|-------------------|
| Pending booking/payment | Amber | Red, rose, yellow arbitrary |
| Confirmed / available | Emerald | Green-500 random, teal |
| Primary CTA | Cobalt | Purple, sky, indigo arbitrary |
| Engagement / reminder | Violet | Pink gradient |

---

## Dark mode checklist

| Element | Light | Dark |
|---------|-------|------|
| Canvas | grouped gray / white | `#000` or near-black |
| Card | `#ffffff` | `#1C1C1E` elevated |
| Primary text | near-black | near-white |
| Cobalt CTA | `your primary color token (see _shared/VISUAL.md)` | same hue; check contrast |

**Fail:** Inverted light theme (white cards on gray — looks washed in dark)

---

## Reduced motion

```bash
rg 'prefers-reduced-motion|useReducedMotion' --glob 'src/components/booking/**'
```

Pass: transitions degrade to opacity-only or 0ms.

---

## Full visual ledger (48 pts · 24 items)

Score 0/1/2. **Ship candidate: ≥41/48 (85%).**

| ID | Criterion | 2 = Pass |
|----|-----------|----------|
| V1 | Primary cobalt | `your primary color token (see _shared/VISUAL.md)` via token — no drift |
| V2 | Violet engagement | Used only for engagement/reminder semantics |
| V3 | Amber pending | Pending states use amber family |
| V4 | Emerald confirmed | Confirmed/available use emerald |
| V5 | No pink/rose | Zero on booking surfaces |
| V6 | Token vs hex | ≥90% colors from tokens in booking |
| V7 | your display font token (see _shared/VISUAL.md) headings | All h1–h3 use Cal Sans pattern |
| V8 | Body Inter | System/Inter stack; no exotic display on body |
| V9 | Input 16px | Mobile inputs ≥16px |
| V10 | 8pt grid | ≥90% spacing on 4/8px |
| V11 | Touch 44px | Primary booking controls ≥44px |
| V12 | One hero image | Single image on hub card |
| V13 | No glass content | Blur only on chrome |
| V14 | No decor motion | No marquee/beam on hub |
| V15 | Footer branding | Powered by your product.lk present when required |
| V16 | Logo contrast | Correct light/dark SVG variant |
| V17 | Dark hierarchy | Rebuilt elevation — not inverted |
| V18 | Reduced motion | Honored on animations |
| V19 | Focus visible | Keyboard path complete |
| V20 | 320px layout | No horizontal scroll |
| V21 | Status semantics | Colors match state meaning |
| V22 | CTA shape | ≤2 radius families on hub |
| V23 | Embed safe | Sticky/footer not clipped in embed |
| V24 | Contrast | Body text ≥4.5:1 on backgrounds |

---

## Fix patterns (preferred)

```tsx
// Bad
<button className="bg-blue-500 text-white">Book</button>
<span className="text-rose-500">Pending</span>

// Good — use booking-hub-brand or semantic Tailwind aligned to tokens
<button className="bg-primary text-primary-foreground">Book</button>
<span className="text-amber-500">Pending</span>
```

Import palette from `@/lib/booking-hub-brand` when adding new booking UI.

---

## Handoff

| Result | Next skill |
|--------|------------|
| SHIP on tokens | `apple-design-head` — full interaction + a11y |
| ITERATE on palette | Fix here first |
| Marketing only | May relax decor rules — still no pink on `/book/*` |
