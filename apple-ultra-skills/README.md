# Apple Ultra Skills

**Apple-quality craft × startup discipline × engineering rigor** — a Cursor skill plugin with 23 specialized personas, shared context templates, and a design-layer component discovery workflow.

Install: copy this folder into `.cursor/skills/apple-ultra-skills/` (or merge skill subfolders into `.cursor/skills/`).

Validate: `python3 scripts/validate-skills.py` (24 skills, trigger descriptions, link integrity).

**Version:** 1.1.0 · **Skills:** 24 (includes `ultra-teach` onboarding)

---

## Plugin structure

```
apple-ultra-skills/
├── README.md                 ← you are here
├── _shared/                  ← fill in before use (BRAND, VISUAL, STACK, …)
├── apple-hub/                ← skill router — start here
├── design/                   ← documented layer (skills live as siblings below)
├── executive/
├── gtm/
├── engineering/
└── infrastructure/
```

Skills are **flat folders** (Cursor discovery-friendly). Sections below group them logically.

---

## Design & craft

| Skill | Role | Use when… |
|-------|------|-----------|
| **ultra-component-discovery** | Component sourcing | Find/install UI blocks (21st, Aceternity, Magic UI, HyperUI, Tremor, …) |
| **ultra-visual-system** | Visual design lead | Design tokens, palette, typography, dark mode |
| **apple-design-head** | Head of Apple Design | UI/UX ship review, accessibility, craft, inevitability |
| **ultra-brand-voice** | Brand guardian | Copy audit, positioning, banned phrases |
| **ultra-content-review** | Content lead | Multi-channel content alignment |

**Design implementation chain:**

```
ultra-component-discovery → ultra-visual-system → apple-design-head
```

Copy/content chain: `ultra-brand-voice` → `ultra-content-review` → `apple-design-head`

---

## Executive

| Skill | Role | Use when… |
|-------|------|-----------|
| ultra-ceo | Startup CEO | Strategy, focus, beachhead, say-no |
| ultra-cpo | CPO | Feature priority, MVP scope, plan tiers |
| ultra-cto | CTO | Architecture, schema, boundaries |
| ultra-cfo | CFO | Unit economics, pricing, margins |

---

## Go-to-market

| Skill | Role | Use when… |
|-------|------|-----------|
| ultra-head-of-growth | Head of Growth | GTM, density, launch waves |
| ultra-head-of-sales | Head of Sales | Outreach, objections, close patterns |

---

## Engineering

| Skill | Role | Use when… |
|-------|------|-----------|
| ultra-scheduling-engine | Scheduling | Slots, holds, timezone, booking |
| ultra-payments | Payments | Gateway, webhooks, checkout |
| ultra-messaging | Messaging | Notifications, templates, multi-channel |
| ultra-migrations | Database | Schema, migrations, backfills |
| ultra-api-auth | API auth | Route auth, scopes, validation |
| ultra-plan-gating | Entitlements | Subscription tiers, feature gates |
| ultra-security-review | Security | Auth audit, secrets, compliance |
| ultra-pr-ship-review | Eng lead | PR merge gate, verify, conventions |
| ultra-events | Events | Ticketing, capacity, event commerce |
| ultra-integrations | Integrations | Third-party APIs, scope-locked access |

---

## Infrastructure

| Skill | Role | Use when… |
|-------|------|-----------|
| **apple-hub** | Skill router | "Which skill should I use?" |
| **ultra-teach** | Project onboarding | First setup — writes `.ultra.md` |
| dag-task-runner | Task orchestrator | Parallel subagent DAG execution |

---

## Setup: `_shared/` templates

Fill these with your project before using skills:

| File | Contents |
|------|----------|
| `_shared/BRAND.md` | Voice, CTAs, banned phrases, objections |
| `_shared/VISUAL.md` | Design tokens, palette, typography |
| `_shared/PRODUCT.md` | Pillars, plan tiers, feature labels |
| `_shared/STACK.md` | Tech stack, verify commands, boundaries |
| `_shared/PATHS.md` | Routes, API prefixes, auth patterns |
| `_shared/COMPETITORS.md` | Competitive landscape |

Example entries use fictional **Acme Scheduling** — not any real product.

---

## Review protocol (all review skills)

- **Rounds 0–4:** Weighted domain checks (sum to 100%)
- **Severity:** P0 blocker · P1 iterate · P2 polish · P3 nit
- **Grades:** A (93+) · A- (85+) · B (75+) · C (60+) · D (<60)
- **Verdicts:** SHIP (≥85, 0 P0, ≤2 P1) · ITERATE · REJECT
- **Finding format:** Severity → Location → Principle → Measure → Fix → Effort

---

## Quick start

1. Copy `apple-ultra-skills/` into your repo's `.cursor/skills/`
2. Run **`ultra-teach`** to write `.ultra.md` and fill `_shared/*.md`
3. Ask: **"Use apple-hub to route this"** or **"Apple design review the checkout"**
4. For UI blocks: **"Use ultra-component-discovery to find a footer"**
5. Before merge: **"PR ready?"** → `ultra-pr-ship-review`

---

## Competitive research

See `competitive-research/IMPROVEMENTS.md` for synthesis from 10+ research agents (GitHub + Reddit). Clone competitor repos locally via `competitive-research/README.md`.

**Registry:** `registry/skills.json` and `registry/bundles.json` for hub routing and bundle installs (design, ship-ready, executive).

---

## License

MIT
