# Visual System Template

> **Fill this in** with your design tokens, palette, and typography.
> Example: **Acme Scheduling** — cobalt primary, semantic status colors.

---

## Color palette

### Primary (global UI)
- **Primary:** `#2563eb` — CSS `--primary: 220 82% 53%` (example — replace with yours)
- Primary actions, links, brand accent

### Semantic palette (customer-facing surfaces)

| Role | Hex (example) | Use |
|------|---------------|-----|
| Primary | `#2563eb` | Primary actions |
| Secondary accent | `#7c3aed` | Engagement, reminders |
| Pending | `#f59e0b` | Pending states |
| Confirmed | `#10b981` | Confirmed, success |

**Rule:** Document banned colors on core surfaces (e.g. no pink on booking flows).

### Marketing accents (badges only, not core tokens)
- [Accent 1] · [Accent 2]

### Dark sections
- Background `[hex]` · primary glow `[hsl with alpha]`

## Typography

| Role | Token | Font |
|------|-------|------|
| Display / headings | `font-display` | [Your display font] |
| Body | default | [Inter / system stack] |
| Wordmark | SVG | [Size, weight, tracking] |

Pattern: `font-display text-* tracking-tight` for headings.

## Logo

- Mark files: `public/your-brand-light.svg`, `your-brand-dark.svg`
- Light mark on white; dark mark on dark backgrounds
- Footer on public pages: **Powered by [Your Product]** (removable on top tier)

## UI craft rules (customer-facing surfaces)

- One unified card, clear hierarchy, single hero image
- Interaction-only motion; honest signals only
- No decorative effects on core task surfaces
- Mobile-first; dark mode required
- `prefers-reduced-motion`: opacity-only or instant transitions

## Spacing & touch

- 8pt grid (4/8/16/24/32/48px)
- Screen margin 16px mobile
- Touch targets ≥44×44px on primary flows
- Input font ≥16px mobile (prevents iOS zoom)

## Token violation scan (customize paths)

```bash
rg '#[0-9a-fA-F]{3,8}|rgb\(|hsl\([^v]' --glob 'src/components/[your-surface]/**'
rg 'pink|rose-' --glob 'src/components/[your-surface]/**'
rg 'backdrop-blur' --glob 'src/components/[your-surface]/**'
```

Glass/blur: navigation chrome only — never on content cards.

## Handoff

Visual token issues → fix in code → run `apple-design-head` for full UI ship review.
