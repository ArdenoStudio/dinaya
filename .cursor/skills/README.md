# Dinaya Ultra Skill Pack

Dev-only Cursor agent skills for **dinaya.lk**. Not bundled for production.

## Start here

| Task | Skill |
|------|-------|
| Not sure which skill | `dinaya-hub` |
| Strategy / pivot | `dinaya-ceo` |
| Feature priority | `dinaya-cpo` |
| Architecture | `dinaya-cto` |
| Pricing / margins | `dinaya-cfo` |
| GTM / first 100 | `dinaya-head-of-growth` |
| Salon sales pitch | `dinaya-head-of-sales` |
| Copy / positioning | `dinaya-brand-voice` |
| Colors / tokens | `dinaya-visual-system` |
| UI ship review | `apple-design-head` |
| Booking / slots | `dinaya-booking-engine` |
| PayHere | `dinaya-payhere` |
| Migrations | `dinaya-migrations` |
| API auth | `dinaya-api-auth` |
| Plan gating | `dinaya-plan-gating` |
| Messaging | `dinaya-messaging` |
| Events / tickets | `dinaya-events` |
| Voice API | `dinaya-voice-api` |
| Security audit | `dinaya-security-review` |
| PR ship check | `dinaya-pr-ship-review` |
| Content / social | `dinaya-content-review` |
| Multi-agent DAG | `dag-task-runner` |

## Shared context (`_shared/`)

| File | Contents |
|------|----------|
| `BRAND.md` | Voice, CTAs, banned phrases |
| `VISUAL.md` | Colors, typography, logo |
| `PRODUCT.md` | Plans, features, nav |
| `STACK.md` | Tech boundaries, verify gate |
| `PATHS.md` | Routes and API map |
| `COMPETITORS.md` | SL positioning |

## Pack structure

- **22 skills** total (20 `dinaya-*` + `apple-design-head` + `dag-task-runner`)
- Scored skills use rounds → P0/P1/P2 → SHIP gate (≥85)
- Engineering skills end with `npm run verify`

## Master plan

`docs/superpowers/plans/2026-06-22-dinaya-skill-pack-master-plan.md`

## Invocation

Skills auto-trigger from description keywords, or ask explicitly:
- "Run dinaya-ceo on events ticketing"
- "Apple design review the checkout flow"
- "Use dinaya-hub to route this"
