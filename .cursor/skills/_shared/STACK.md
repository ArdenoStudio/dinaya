# Dinaya Stack & Boundaries

## Runtime

- Node.js **22**, Next.js **16** App Router, React **19**, TypeScript
- Neon Postgres, Drizzle ORM, NextAuth, Vercel
- PayHere payments; product AI via Groq/OpenAI HTTP in `src/lib/ai/`

## Import & layer rules

- Use `@/` import alias
- Domain logic in `src/lib/` — **never import components into lib**
- UI in `src/components/` and `src/app/`
- Match neighboring files; keep diffs minimal

## Never ship in production bundle

- `@cursor/sdk` in root `package.json` or `src/app/`
- `.cursor/` and `AGENTS.md` are dev-only

## Verification gate

```bash
npm run verify   # lint + test + build — run before finishing non-trivial changes
npm test         # Vitest only
npm run db:migrate   # after schema changes
```

## Sri Lanka constraints

- Subdomains `{slug}.dinaya.lk` → `/book/[slug]` (`middleware.ts`)
- Custom domains via `src/lib/vercel-domains.ts`
- Availability/slots use **business timezone** (`src/lib/availability.ts`)
- Never log or commit PayHere secrets, webhook secrets, API keys, `CRON_SECRET`

## Migrations

- New file: `drizzle/00NN_descriptive_name.sql` (next sequence)
- Update `src/db/schema.ts`
- **Never edit** migrations already applied in production

## Testing

- Unit: Vitest colocated `*.test.ts`
- E2E: Playwright `e2e/`
- Do not weaken tests for CI green

## Booking UI non-negotiables

Keep: slot holds, idempotent booking, PayHere/PayPal/manual pay, deals, WhatsApp share, embed, client tokens, plan gating, dark mode, reduced motion.

Do not expose PII in URLs. Dinaya is not a Cal.com clone — preserve Dinaya-specific features.
