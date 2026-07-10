# Stack & Boundaries Template

> **Fill this in** with your tech stack, verify commands, and layer rules.
> Example: **Acme Scheduling** — Next.js + Postgres SaaS.

---

## Runtime

- **Runtime:** [e.g. Node.js 22]
- **Framework:** [e.g. Next.js 16 App Router, React 19, TypeScript]
- **Data:** [e.g. Postgres, Drizzle ORM]
- **Auth:** [e.g. NextAuth, session-based]
- **Deploy:** [e.g. Vercel]
- **Payments:** [e.g. Stripe, Square, Razorpay — see payment gateway module]
- **Product AI:** [e.g. OpenAI-compatible HTTP in `src/lib/ai/`]

## Import & layer rules

- Use your import alias (e.g. `@/`)
- Domain logic in `[lib path]/` — **never import UI components into lib**
- UI in `[components path]/` and `[app path]/`
- Match neighboring files; keep diffs minimal

## Never ship in production bundle

- Dev agent SDK in root `package.json` or app entry
- `.cursor/` and skill packs are dev-only

## Verification gate

```bash
# Fill in your project's verify command — examples:
npm run verify   # lint + test + build
npm test         # unit tests only
npm run db:migrate   # after schema changes
```

## Market / product constraints

- [Subdomain routing rules if applicable]
- [Custom domain verification approach]
- Availability/slots use **business timezone**
- Never log or commit payment secrets, webhook secrets, API keys, cron secrets

## Migrations

- New file: `[migrations]/00NN_descriptive_name.sql` (next sequence)
- Update `[schema file]` to match
- **Never edit** migrations already applied in production

## Testing

- Unit: [your test runner] colocated `*.test.ts`
- E2E: [your E2E runner]
- Do not weaken tests for CI green

## Core UI non-negotiables

Keep: [list invariants your product must preserve — e.g. slot holds, idempotency, dark mode]

Do not expose PII in URLs.
