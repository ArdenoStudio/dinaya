# Dinaya Visual System

## Color palette

### Primary (global UI)
- **Cobalt:** `#2563eb` — CSS `--primary: 220 82% 53%`
- Primary actions, links, brand accent

### Booking hub semantic palette (`src/lib/booking-hub-brand.ts`)
| Role | Hex | Use |
|------|-----|-----|
| Cobalt | `#2563eb` | Primary actions |
| Violet | `#7c3aed` | Engagement, reminders, gradients |
| Amber | `#f59e0b` | Booking/payment pending |
| Emerald | `#10b981` | Confirmed, availability, WhatsApp accents |

**Rule: No pink/rose on booking surfaces.**

### Marketing accents (badges only, not core tokens)
- Live orange `#F97316`, website sky `#0EA5E9`

### Dark sections (pricing showcase)
- Background `#030712`, primary glow `hsl(220 82% 53% / 0.55)`

## Typography

| Role | Token | Font |
|------|-------|------|
| Display / headings | `font-cal` | Cal Sans SemiBold |
| Body | default | Inter / system stack |
| Wordmark | SVG | 28px, weight 600, letter-spacing -0.02em |

Pattern: `font-cal text-* tracking-tight` for headings.

## Logo

- Spiral/link mark — `public/dinaya-brand-light.svg`, `dinaya-brand-dark.svg`
- Light mark `#111111` on white; dark mark `#ffffff` on dark
- Footer on booking pages: **Powered by Dinaya.lk** (Growth can remove branding)

## UI craft rules (booking hub)

- One unified card, name-first hierarchy, single hero image
- Interaction-only motion; honest signals only
- No decorative border-beam, marquee, glow stacks on hub
- Mobile-first; dark mode required
- `prefers-reduced-motion`: opacity-only or instant transitions

## Spacing & touch

- 8pt grid (4/8/16/24/32/48px)
- Screen margin 16px mobile
- Touch targets ≥44×44px on booking flows
- Input font ≥16px mobile (prevents iOS zoom)

## Token violation scan

```bash
rg '#[0-9a-fA-F]{3,8}|rgb\(|hsl\([^v]' --glob 'src/components/booking/**'
rg 'pink|rose-' --glob 'src/components/booking/**'
rg 'backdrop-blur' --glob 'src/components/booking/**'
```

Glass/blur: navigation chrome only — never on content cards.

## Handoff

Visual token issues → fix in code → run `apple-design-head` for full UI ship review.
