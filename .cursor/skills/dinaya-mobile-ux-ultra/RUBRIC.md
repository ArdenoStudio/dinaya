# Mobile UX Ultra — Rubric

Weights: R0 20 · R1 25 · R2 25 · R3 20 · R4 10.

| Score | Grade | Meaning |
|-------|-------|---------|
| 93–100 | A | Top 0.1% — ship |
| 85–92 | A- | Strong — ship if 0 P0 |
| 75–84 | B | Iterate |
| 60–74 | C | Major gaps |
| &lt;60 | D | Reject |

## Round checklists (pass = contribute to high score)

### R0 Purpose (20%)
- [ ] One primary job visible without scroll on 375px home/list
- [ ] Bookings = cards; no H-scroll tables
- [ ] Calendar default Day or Agenda under 1024px
- [ ] No purple/glow/pill-spam decoration

### R1 Thumb & nav (25%)
- [ ] Bottom nav ≤5 with visible labels
- [ ] More sheet: handle, groups, account, dismiss
- [ ] Primary CTA in lower third / sticky safe
- [ ] Active tab unmistakable (not color-only)

### R2 Agency (25%)
- [ ] Press feedback ≤100ms (`active:scale-[0.96]` or equiv)
- [ ] Skeleton matches layout
- [ ] Empty + one CTA
- [ ] Destructive confirm where needed
- [ ] Focus trap on sheets

### R3 Craft (20%)
- [ ] Targets ≥44×44; gaps ≥8
- [ ] Body/input ≥16px
- [ ] Safe-area on fixed chrome
- [ ] Contrast AA; status has icon/text
- [ ] `tabular-nums` on times/money

### R4 Resilience (10%)
- [ ] No accidental week-grid lock on phone
- [ ] No page-level H-scroll
- [ ] Reduced-motion honored on sheet/tab motion
- [ ] Long SI/TA labels don’t clip primary nav
