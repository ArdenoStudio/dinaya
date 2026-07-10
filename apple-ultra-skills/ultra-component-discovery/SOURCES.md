# UI Component Source Catalog

Companion to `SKILL.md`. Bookmark sites from the Ardeno UI Elements folder + extended registry list.

**Legend:** Copy = paste HTML/TSX · CLI = `npx shadcn@latest add` · npm = package install · Paid = requires license

---

## Your bookmark folder — site by site

| Bookmark | URL | Best for | Get code | Stack | License |
|----------|-----|----------|----------|-------|---------|
| **WebDev** | https://web.dev | CSS/a11y patterns, GUI Challenges — **not** a component library | Article snippets + GitHub demos | Vanilla HTML/CSS/JS | Google OSS per repo |
| **Better Design Tips** | https://www.better-design.com | 73 themed shadcn systems (Apple, Linear, Stripe…) | CLI registry | React, shadcn, Tailwind v4 | MIT |
| **HyperUI** | https://hyperui.dev | Marketing + app HTML blocks | Copy HTML | Tailwind v4, optional Alpine | MIT |
| **DaisyUI** | https://daisyui.com | Semantic component classes (`btn`, `card`) | `npm i -D daisyui` | Tailwind plugin | MIT |
| **Tremor** | https://tremor.so | Dashboard charts + filters | Copy `.tsx` or `npm i @tremor/react` | React, Recharts, Radix | Apache 2.0 |
| **Apple Cards Carousel** | https://ui.aceternity.com/components/apple-cards-carousel | Premium motion carousel | CLI `@aceternity` | React, Motion, Tailwind | Free + Pro blocks |
| **Footers** | https://ui.aceternity.com/categories/footers (also Tailark, Shadcnblocks) | Marketing footers | CLI or copy | React, Tailwind | Varies |
| **FAQ Sections** | https://www.shadcnblocks.com (search FAQ) | Accordion FAQ blocks | `@shadcnblocks` CLI | React, shadcn | Freemium |
| **Animated Beam** | https://magicui.design/docs/components/animated-beam | Node connection animations | `@magicui` CLI | React, Motion | MIT |
| **React Bits** | https://reactbits.dev | Animated text/background primitives | Copy or `reactbits.dev/r/…` CLI | React, GSAP/Motion/Three | MIT |
| **21st.dev** | https://21st.dev | Community marketplace (largest free OSS) | `21st.dev/r/author/name` | React, shadcn, Tailwind | MIT (community) |
| **UI component library** | https://ui.shadcn.com/docs/components | Primitives (button, dialog, table) | `npx shadcn@latest add button` | React, Radix, Tailwind | MIT |
| **Shadcnblocks** | https://www.shadcnblocks.com | 1,600+ marketing blocks | `@shadcnblocks` CLI | React, shadcn | Freemium / paid |
| **Icons** | https://lucide.dev (or Hugeicons, Tabler) | Icon sets | `npm i lucide-react` | SVG React components | ISC/MIT |
| **Featured 21st** | https://21st.dev (featured tab) | Curated community picks | Same as 21st | React, shadcn | MIT |
| **Hero Color Panels** | https://cult-ui.com | Texture/gradient hero sections | `@cult-ui` CLI | React, Motion, Tailwind | MIT |
| **Watermelon UI** | https://ui.watermelon.sh | 260+ free registry components | `registry.watermelon.sh` | React, shadcn, Recharts | MIT |

---

## Extended registry list (add to `components.json`)

```json
{
  "registries": {
    "@aceternity": "https://ui.aceternity.com/registry/{name}.json",
    "@magicui": "https://magicui.design/r/{name}.json",
    "@21st": "https://21st.dev/r/{name}",
    "@shadcnblocks": "https://shadcnblocks.com/r/{name}",
    "@cult-ui": "https://cult-ui.com/r/{name}.json",
    "@tailark": "https://tailark.com/r/{name}.json",
    "@kokonutui": "https://kokonutui.com/r/{name}.json",
    "@mynaui": "https://mynaui.com/r/{name}.json",
    "@watermelon": "https://registry.watermelon.sh/{name}.json",
    "@better-design": "https://better-design.com/registry/{system}/{name}.json"
  }
}
```

**Meta-discovery:** https://registry.directory · https://github.com/birobirobiro/awesome-shadcn-ui

---

## Intent → source routing

| User wants | Start here | Fallback |
|------------|------------|----------|
| Footer, FAQ, pricing, hero (marketing) | Shadcnblocks → Tailark → 21st.dev → HyperUI (HTML) | Aceternity blocks (Pro) |
| Apple-style carousel, beams, motion | Aceternity → Magic UI → React Bits | Cult UI |
| Dashboard chart, KPI, filter | Tremor → Watermelon (charts) | shadcn charts block |
| Button, dialog, form primitive | shadcn/ui → DaisyUI classes | MynaUI |
| Themed design system (Apple/Linear) | better-design.com | Cult UI Pro |
| Plain HTML / no React | HyperUI | web.dev patterns |
| Animated text/background only | React Bits → Animata | Kokonut UI |
| App layout (sidebar, data table) | shadcn blocks → ReUI → Watermelon | Tremor UI |
| Icons | lucide.dev | Hugeicons (Watermelon default) |

---

## Per-site browse URLs

### HyperUI
- Application: https://hyperui.dev/components/application
- Marketing: https://hyperui.dev/components/marketing
- Pattern: `/components/{collection}/{slug}` → Copy button

### DaisyUI
- All components: https://daisyui.com/components/
- Pattern: `/components/{name}/` → copy HTML with class names

### Tremor
- Charts: https://www.tremor.so/docs/visualizations/area-chart
- Inputs: https://www.tremor.so/docs/inputs/select
- Setup once: https://tremor.so/docs/getting-started/installation/next

### Aceternity UI
- Components: https://ui.aceternity.com/components
- Blocks: https://ui.aceternity.com/blocks
- Categories: https://ui.aceternity.com/categories/footers

### Magic UI
- Index: https://magicui.design/docs/components
- Animated Beam: https://magicui.design/docs/components/animated-beam

### React Bits
- Home: https://reactbits.dev
- CLI names: see GitHub `llms.txt` in DavidHDev/react-bits

### 21st.dev
- Home: https://21st.dev
- Search: `⌘K` / `Ctrl+K`
- Install: `npx shadcn@latest add "https://21st.dev/r/{author}/{component}"`

### Shadcnblocks
- Blocks: https://www.shadcnblocks.com/blocks
- Explorer: https://www.shadcnblocks.com/explorer
- Pro requires `SHADCNBLOCKS_API_KEY`

### Cult UI
- Components: https://cult-ui.com
- Search: `npx shadcn@latest search @cult-ui --query "hero"`

### Watermelon UI
- Home: https://ui.watermelon.sh
- Search: `⌘K` on site

### Better Design
- Components hub: https://www.better-design.com/components
- Design systems: https://www.better-design.com/design-systems
- Install: `npx shadcn@latest add https://better-design.com/registry/apple/button.json`

### Tailark
- Kits: https://tailark.com (Dusk/Mist/Veil/Quartz)
- Pattern: `/dusk/hero-section`, `/mist/footer`

### web.dev (reference only)
- GUI Challenges: https://web.dev/shows/gui-challenges
- Use for a11y/technique — not copy-paste React blocks

---

## Common peer dependencies (install when needed)

| Package | Used by |
|---------|---------|
| `motion` / `framer-motion` | Aceternity, Magic UI, Cult UI, React Bits, Kokonut |
| `recharts` | Tremor, Watermelon charts |
| `gsap` | React Bits (many text animations) |
| `three` / `ogl` | React Bits backgrounds, Aceternity 3D |
| `@radix-ui/*` | shadcn, most registries |
| `lucide-react` | shadcn default icons |
| `clsx` + `tailwind-merge` | Nearly all registries |
| `alpinejs` | HyperUI interactive variants |

---

## License quick reference

| Source | Commercial use | Resell/redistribute |
|--------|------------------|---------------------|
| HyperUI, DaisyUI, React Bits, Magic UI, Cult UI OSS, Watermelon, 21st community | ✅ MIT | ❌ Don't republish as competing library |
| Tremor Raw | ✅ Apache 2.0 | Attribution in copies |
| Shadcnblocks Pro | ✅ Paid license | ❌ Explicitly forbidden |
| Aceternity Pro blocks | ✅ Paid | Per terms |
| web.dev demos | Per-repo license | Check each repo |
