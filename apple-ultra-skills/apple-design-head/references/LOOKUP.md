# Apple Design Head — Reference Lookup

Load **3–8 topic rows** per review. Never load the entire corpus at once.

For web/React projects, translate HIG terms to your stack (see platform table in SKILL.md).

## Always consult (any review)

| Topic | Load | Ultra round |
|-------|------|-------------|
| Accessibility fundamentals | `accessibility` | R4 |
| Layout & spacing | `layout` | R2 |
| Color & contrast | `color`, `dark-mode` | R3 |
| Typography | `typography` | R3 |
| Motion & reduced motion | `motion` | R2, R4 | 

## Load by surface

| User mentions… | Topics | Ultra round |
|----------------|--------|-------------|
| onboarding, welcome, first-run | onboarding, launching, offering-help | R0, R1 |
| checkout, pay, cart | entering-data, feedback, modality | R0, R1 |
| booking, schedule, calendar | onboarding, entering-data, feedback | R0, R1 |
| settings, forms, profile | entering-data, settings, focus-and-selection | R1, R2 |
| dashboard, analytics | layout, charting-data, color | R0, R2 |
| marketing, landing, hero | layout, typography, branding | R0, R3 |
| dark mode, theme toggle | dark-mode, materials, color | R3 |
| modal, sheet, dialog | modality, focus-and-selection | R1, R2 |
| empty state, error, loading | feedback, loading | R1, R4 |
| AI, chat, streaming, copilot | generative-ai, machine-learning, feedback | R0, R4 |
| search, filter | searching, entering-data | R1 |
| notifications, toast | managing-notifications, feedback | R2 |
| icons, symbols | icons, sf-symbols | R3 |
| glass, blur, materials | materials, liquid-glass | R3 |
| charts, graphs, KPIs | charting-data, color, layout | R2, R3 |
| paywall, upgrade, pricing | in-app-purchase, entering-data | R0, R1 |
| accessibility audit, WCAG, a11y | accessibility, inclusion | R4 (deep) |

## Keyword triggers (tier 3)

| Keyword in UI/code | Also load |
|--------------------|-----------|
| `sheet`, `drawer` | modality |
| `skeleton`, `shimmer` | loading, feedback |
| `tab bar`, `bottom nav` | layout, modality |
| `carousel`, `swiper` | motion, page-controls |
| `tooltip`, `popover` | offering-help, modality |
| `embed`, `iframe` | layout, privacy |

## Web stack translation

| HIG concept | React/Tailwind equivalent |
|-------------|---------------------------|
| SF Pro | system-ui, Inter, Cal Sans |
| SF Symbols | Lucide, Heroicons |
| UITabBar | bottom navigation component |
| UIColor semantic | CSS variables / Tailwind semantic tokens |
| Dynamic Type | rem + clamp(), 200% zoom test |
| Safe area | env(safe-area-inset-*), pb-safe |
| Reduce Motion | prefers-reduced-motion media query |

## Citation format

In findings, cite: `[Topic > Rule] — "principle" (LOOKUP: accessibility)`

## External references

When `references/hig/*.md` files are vendored (from apple-design-skill or HIGAgentSkills), load only files listed above. If not vendored, apply principles from RUBRIC.md and PATTERNS.md.
