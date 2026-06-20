# Apple Design Head — Detailed Rubric Reference

Companion to `SKILL.md`. Use for deep audits; the skill file has the operational protocol.

## Apple principles (quick reference)

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
- Two layers: **content** (booking data) vs **navigation** (chrome)
- Glass on nav/toolbars only — never glass-on-glass on content cards

---

## Visual craft checklist (40 points)

Score 0 / 1 / 2 per item. **≥34 = Apple-quality feel.**

### Typography (8)
| # | Criterion | 2 = Pass |
|---|-----------|----------|
| T1 | Role-based type scale | ≤6 named roles; body ≥17px mobile |
| T2 | Weight discipline | Semibold emphasis; ≤2 weights per block |
| T3 | Line height | Body 1.25–1.35 |
| T4 | Tracking | Negative on ≥20px headings only |

### Color (8)
| # | Criterion | 2 = Pass |
|---|-----------|----------|
| C1 | Semantic text | 100% / 60% / 30% opacity hierarchy |
| C2 | Grouped surfaces | Page canvas ≠ card in both modes |
| C3 | Contrast | Body ≥4.5:1; large type ≥3:1 |
| C4 | Accent discipline | One interactive hue; red = destructive only |

### Spacing (8)
| # | Criterion | 2 = Pass |
|---|-----------|----------|
| S1 | 8pt grid | ≥90% spacing on 4/8px multiples |
| S2 | Touch targets | ≥44×44px mobile |
| S3 | Margins | 16px screen edge; 24px between steps |
| S4 | Hierarchy | Price/time/date dominate fluff |

### Materials (6)
| # | Criterion | 2 = Pass |
|---|-----------|----------|
| M1 | Chrome blur | Sticky header ~70–85% tint + backdrop-filter |
| M2 | Card flatness | Fill hierarchy, not stacked shadows |
| M3 | Dark elevation | Modals lighten in dark mode |

### Shape (5)
| # | Criterion | 2 = Pass |
|---|-----------|----------|
| R1 | Radius system | ≤3 radii |
| R2 | Continuity | Nested radius math correct |
| R3 | CTA shape | Consistent pill or 12px across flow |

### A11y (5)
| # | Criterion | 2 = Pass |
|---|-----------|----------|
| A1 | Theme parity | Every step in light + dark |
| A2 | Non-color state | Selected slot has border/weight/icon |
| A3 | Font scaling | 200% zoom without horizontal scroll |
| A4 | Motion | `prefers-reduced-motion` honored |
| A5 | Focus | Visible ring ≥3:1; keyboard path complete |

---

## Interaction checklist (booking wizard)

### Global
- [ ] One Primary CTA per viewport
- [ ] Back = previous step, not dismiss
- [ ] Step transition 150–250ms easeOut; 0ms with reduced motion
- [ ] Safe-area padding on bottom CTAs

### Service step
- [ ] Rows ≥44px; full row tappable
- [ ] Selection feedback <100ms
- [ ] Price visible before commit (local trust)

### Date/time step
- [ ] Calendar controls adjacent to grid
- [ ] Day cells + chevrons ≥44px
- [ ] Continue gated until slot selected
- [ ] Slot refresh: skeleton or aria-busy; stale slots stay visible
- [ ] Slot taken: inline recovery

### Confirm step
- [ ] Summary above fields
- [ ] Full-width Primary on mobile
- [ ] Submit: spinner + label change + disabled <200ms
- [ ] Double-submit blocked

---

## Apple vs SaaS booking matrix

| Dimension | Apple | Typical SaaS | Dinaya target |
|-----------|-------|--------------|---------------|
| Entry | Problem/product-led | "Pick event type" | Service list / hub |
| Progress | Implicit path | Numbered steps | Summary line > step numbers |
| Photography | One cinematic hero | Logo banner | `BookingHubHeroImage` |
| CTA | 1 primary + 1 quiet secondary | Multiple filled buttons | Pill on hub; compact on confirm |
| Trust | Brand + Wallet | Badges + "Powered by" | Ratings + policies (local need) |
| Post-book | Wallet + Calendar | Email only | ICS + manage URL |

---

## Semantic CSS tokens (web reference)

```css
:root {
  --bg-grouped: #f2f2f7;
  --bg-card: #ffffff;
  --label: #000000;
  --label-secondary: rgba(60, 60, 67, 0.6);
  --label-tertiary: rgba(60, 60, 67, 0.3);
  --accent: #007aff;
  --destructive: #ff3b30;
  --radius-md: 12px;
  --radius-lg: 16px;
  --tap-min: 44px;
  --page-margin: 16px;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg-grouped: #000000;
    --bg-card: #1c1c1e;
    --label: #ffffff;
    --label-secondary: rgba(235, 235, 245, 0.6);
    --accent: #0a84ff;
  }
}
```

---

## Sources

- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines)
- [Design principles (2026)](https://developer.apple.com/design/human-interface-guidelines/design-principles)
- [UI Design Tips](https://developer.apple.com/design/tips/)
- [Adopting Liquid Glass](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass)
- [Principles of great design (WWDC26)](https://developer.apple.com/videos/play/wwdc2026/250/)
- [Designing Fluid Interfaces (WWDC18)](https://developer.apple.com/videos/play/wwdc2018/803/)
- [hig-doctor](https://github.com/raintree-technology/hig-doctor) — agent-oriented HIG patterns
