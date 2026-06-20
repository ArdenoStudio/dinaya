# Booking Hub Redesign — Component Catalog

Consolidated picks from Step 1–2 research. All installed components live under `src/components/ui/`.

## Header / identity card

| Pick | Source | Install |
|------|--------|---------|
| **Magic Card** (spotlight border) | Magic UI | `npx shadcn@latest add @magicui/magic-card` |
| **Animated Gradient Text** (business name) | Magic UI | `@magicui/animated-gradient-text` |
| **Animated Shiny Text** + emerald dot (“Available today”) | Magic UI | `@magicui/animated-shiny-text` |
| **Blur Fade** (mount reveal) | Magic UI | `@magicui/blur-fade` |

Alternatives: Aceternity Card Spotlight, Cult UI Gradient Heading.

## Service cards

| Pick | Source | Install |
|------|--------|---------|
| **Glowing Effect** (hover border glow) | Aceternity | `@aceternity/glowing-effect` |
| **Border Beam** + **Shine Border** (popular service) | Magic UI | `@magicui/border-beam`, `@magicui/shine-border` |
| **Blur Fade** stagger | Magic UI | `@magicui/blur-fade` |

Alternatives: Aceternity Wobble Card, Magic Card per row.

## Policy / trust

| Pick | Source | Install |
|------|--------|---------|
| shadcn **Accordion** + icon-led triggers | existing + HyperUI FAQ structure | — |

Skipped: Aceternity FAQ blocks (pro-gated demos).

## About / gallery

| Pick | Source | Install |
|------|--------|---------|
| **Marquee** (gallery thumbs, lazy-loaded) | Magic UI | `@magicui/marquee` |

Alternative: Aceternity Apple Cards Carousel (`@aceternity/apple-cards-carousel` — installed, heavier).

## Team

| Pick | Source | Install |
|------|--------|---------|
| **Animated Tooltip** (name/role on hover) | Aceternity | `@aceternity/animated-tooltip` |
| **Avatar Circles** (overflow stack) | Magic UI | `@magicui/avatar-circles` |

## Reviews

| Pick | Source | Install |
|------|--------|---------|
| **Marquee** (inline snippets) | Magic UI | `@magicui/marquee` |
| **Number Ticker** (animated score/count) | Magic UI | `@magicui/number-ticker` |
| Existing dialog + `ReviewRatingSummary` | Dinaya | — |

Alternative: Aceternity Infinite Moving Cards (`@aceternity/infinite-moving-cards`).

## Sticky mobile CTA

| Pick | Source | Install |
|------|--------|---------|
| **Interactive Hover Button** (amber) | Magic UI | `@magicui/interactive-hover-button` |

## Ambient background

| Pick | Source | Install |
|------|--------|---------|
| **Dot Background** (CSS radial dots) | Aceternity pattern | `src/components/ui/dot-background.tsx` |

Skipped: Aurora/Vortex/WebGL shaders, Tremor charts, DaisyUI (class clash).

## Brand recolor

All library defaults recolored to cobalt `#2563eb` → violet `#7c3aed`; CTA amber; availability emerald. `prefers-reduced-motion` disables marquee/beam/shine animations.
