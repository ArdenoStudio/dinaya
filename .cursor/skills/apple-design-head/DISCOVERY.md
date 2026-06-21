# Discovery — Repo Reconnaissance for Design Review

Companion to `SKILL.md`. Run Phase 0 before scoring any unfamiliar repo.

---

## 15-minute recon checklist

| Step | Action | Output |
|------|--------|--------|
| 1 | Read README, `DESIGN.md`, `CONTRIBUTING.md` | Product context |
| 2 | Map routes/pages | Page inventory |
| 3 | Find component roots | UI directory map |
| 4 | Locate token/theme sources | Token file paths |
| 5 | Identify primary user job | One-sentence JTBD |
| 6 | Grep token violations | Hardcoded value count |
| 7 | List edge-case routes | Empty, error, suspended, offline |
| 8 | Note i18n/embed flags | Locale list, embed entry points |

---

## Framework roots

| Stack | Pages / routes | Components | Tokens / theme |
|-------|----------------|------------|----------------|
| **Next.js App Router** | `src/app/`, `app/` | `src/components/`, `components/ui/` | `globals.css`, `tailwind.config.ts` |
| **Next.js Pages** | `pages/` | `components/` | same |
| **Remix** | `app/routes/` | `app/components/` | `app/tailwind.css` |
| **Vite + React** | `src/pages/`, router config | `src/components/` | `src/index.css` |
| **Vue / Nuxt** | `pages/`, `views/` | `components/` | `assets/styles/`, `nuxt.config` |
| **SvelteKit** | `src/routes/` | `src/lib/components/` | `app.css`, `tailwind.config` |
| **Angular** | `src/app/*/` routes | `src/app/shared/` | `styles.scss`, theme |
| **SwiftUI** | `Screens/`, `Features/` | `Views/`, `Components/` | `Theme/`, `DesignTokens.swift` |
| **Flutter** | `lib/screens/` | `lib/widgets/` | `lib/theme/` |
| **Rails** | `app/views/` | `app/components/` | `app/assets/stylesheets/` |
| **Static / Hugo** | `content/`, `layouts/` | `partials/` | `assets/css/` |

---

## File priority (inspect in order)

| Priority | What | Why |
|----------|------|-----|
| 1 | Global styles / CSS variables | Token source of truth |
| 2 | Tailwind / theme config | Extended design system |
| 3 | `ui/` or primitive components | Canonical button, input, dialog |
| 4 | Layout files | Shell, nav, theme provider |
| 5 | Feature components under review | Actual implementation |
| 6 | Hooks: reduced motion, theme, media | Accessibility behavior |
| 7 | Storybook stories | Documented states |
| 8 | E2E / visual tests | Existing coverage gaps |

---

## Product-type detection

| Signals in repo | Likely type | Review emphasis |
|-----------------|-------------|-----------------|
| `checkout`, `cart`, `payment`, `stripe` | Commerce | R0 summary-first; A5 confirm-before-redirect |
| `dashboard`, `admin`, `analytics` | SaaS / admin | Data density; table states; keyboard nav |
| `onboarding`, `signup`, `welcome` | Onboarding | ≤3 steps to value; progressive disclosure |
| `book`, `schedule`, `appointment` | Scheduling | Implicit progress; slot feedback; hold timers |
| `embed`, `widget`, `iframe` | Embed | F7 sticky CTA; theme bridge; CLS |
| `docs`, `blog`, `marketing` | Content | Typography measure; reading hierarchy |
| `*.swift`, `*.dart` | Native mobile | Platform HIG; safe areas; Dynamic Type |

---

## Component inventory template

For each component in scope:

```markdown
### [ComponentName] (`path/to/file`)
- **Category:** navigation | input | display | feedback | layout | media
- **Usage count:** [grep import count]
- **States implemented:** default · hover · focus · active · disabled · loading · error · empty
- **Token compliance:** yes | partial | hardcoded
- **Primitives used:** Button, Input, Dialog, etc.
```

---

## Grep patterns

```bash
# Hardcoded colors
rg '#[0-9a-fA-F]{3,8}|rgb\(|hsl\([^v]' --glob '*.{tsx,jsx,vue,svelte,css,scss}'

# Arbitrary one-off values (Tailwind smell)
rg 'text-\[|rounded-\[|p-\[|m-\[|gap-\[|shadow-\[|w-\[|h-\[' 

# Glass / blur on content
rg 'backdrop-blur|backdrop-filter|bg-.*/[0-9]{1,2}' 

# Focus stripped
rg 'outline-none|outline:\s*none' 

# Motion without reduced-motion
rg 'animate-|@keyframes|transition-' --glob '*.{tsx,css}'

# Hidden labels on mobile (common P1)
rg 'hidden sm:|md:inline|sr-only' --glob '*.tsx'

# i18n gaps (hardcoded strings in JSX — heuristic)
rg '>[A-Z][a-z]+ [a-z]+<' --glob '*.tsx' 

# Duplicate button/card patterns
rg 'className=.*btn|className=.*button' --glob '*.tsx' -l
```

---

## Visual testing matrix

Capture **minimum 8 frames** per critical flow; **16+** for ship candidates.

| Dimension | Values |
|-----------|--------|
| Width | 320, 375, 768, 1024, 1280 |
| Theme | light, dark |
| Motion | default, `prefers-reduced-motion: reduce` |
| States | default, loading, error, empty, selected |

### Playwright pattern

```typescript
const viewports = [
  { width: 375, height: 812 },
  { width: 1024, height: 768 },
  { width: 1280, height: 900 },
] as const;

for (const vp of viewports) {
  await page.setViewportSize(vp);
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.screenshot({
      path: `audit/${flow}-${vp.width}-${colorScheme}.png`,
      fullPage: true,
    });
  }
}
```

### What screenshots catch that code misses

- Horizontal clip and text overflow
- Sticky CTA overlap with home indicator
- Optical misalignment
- Contrast on real imagery/gradients
- z-index stacking bugs
- Slot/grid wrapping at narrow widths

---

## Correlating code → visual defect

| Visual symptom | Likely code cause | Verify |
|----------------|-------------------|--------|
| Gray feels inconsistent | Mixed `text-gray-*` + semantic tokens | Computed color in DevTools |
| Cramped mobile | `hidden sm:inline` on critical labels | Screenshot 375px |
| Flat hierarchy | `bg-card` = `bg-background` in dark | Toggle `.dark` on root |
| Blurry / slow | Stacked `backdrop-blur` | Performance panel |
| Can't see focus | `outline-none` without `:focus-visible` | Tab through form |
| Button looks different per page | `className` override on primitive | Diff class strings |
| Layout breaks in German | Fixed-width buttons | Pseudo-locale test |

---

## Scope map template

```markdown
## Scope map — [Product name]

**Primary job:** User is here to ___
**Product type:** commerce | saas | dashboard | marketing | scheduling | embed
**Stack:** [framework]

| Surface | Routes / paths | Key files | Mental model |
|---------|----------------|-----------|--------------|
| Landing | `/` | `Hero.tsx`, `CTA.tsx` | apple.com product page |
| Checkout | `/checkout` | `CheckoutForm.tsx` | Apple Store commerce |
| Settings | `/settings` | `SettingsPanel.tsx` | iOS Settings grouped lists |

**Edge cases to test:**
- [ ] Empty cart / no results
- [ ] Payment pending / processing
- [ ] Account suspended / permission denied
- [ ] Offline / network error
- [ ] Session expired
```

---

## Optional: generate DESIGN.md

If the repo lacks design documentation, extract on first review:

```markdown
# DESIGN.md (generated)

## Tokens
- Source: [file path]
- Semantic colors: [list]
- Spacing scale: [list]
- Radii: [list]

## Primitives
- Button: [path]
- Input: [path]
- Dialog: [path]

## Typography roles
- Display: [size/weight]
- Body: [size/weight]

## Breakpoints
- [list from config]

## Known debt
- [P2 items from first audit]
```

---

## Sources

- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines)
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [web.dev embed best practices](https://web.dev/articles/embed-best-practices)
- [Container queries](https://web.dev/learn/css/container-queries)
