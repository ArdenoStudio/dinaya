# Dinaya Deployment Checklist

Use this checklist before pushing production changes that touch schema, auth, payments, booking flow, or dashboard routes.

## CI e2e (pull requests)

The `e2e` job in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) needs these **repository secrets**:

- `DATABASE_URL` — Neon connection string for test registrations
- `AUTH_SECRET` — same value as production/staging Auth.js secret

If either secret is missing, e2e is skipped with a workflow warning (verify still runs). Add the secrets under GitHub → Settings → Secrets and variables → Actions to enable full Playwright runs on PRs.

## Required environment variables

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `SECRET_ENCRYPTION_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_DOMAIN`
- `PAYHERE_SANDBOX`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `CRON_SECRET` (same value as the GitHub Actions secret below)

Optional but recommended:

- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — distributed rate limiting (falls back to in-memory)
- `UPTIME_MONITOR_SUMMARY_URL` — full URL to `history/summary.json` for `/admin/health` (from the separate `dinaya-uptime-monitor` Upptime repo)
- `UPTIME_MONITOR_GITHUB_REPO`, `UPTIME_MONITOR_GITHUB_BRANCH`, `UPTIME_MONITOR_GITHUB_TOKEN` — alternative to the URL above; defaults to `ArdenoStudio/dinaya-uptime-monitor` @ `master`
- `VERCEL_TOKEN`, `VERCEL_PROJECT_ID_OR_NAME`, `VERCEL_TEAM_ID` or `VERCEL_TEAM_SLUG` — custom-domain provisioning for tenant-owned domains
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google Calendar OAuth on integrations
- `CONTACT_INBOX_EMAIL` — contact form destination (defaults to hello@dinaya.lk)
- `PLATFORM_ADMIN_EMAILS` — comma-separated allowlist for `/admin`
- `HEALTH_CHECK_SECRET` — dedicated secret for `/api/health/*` (falls back to `CRON_SECRET`)
- AI workflows: `AI_PROVIDER`, `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`
- WhatsApp/social publishing: `META_WHATSAPP_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID`, `META_SOCIAL_ACCESS_TOKEN`, `META_SOCIAL_PAGE_ID`
- SMS gateway: `SMS_HTTP_ENDPOINT`, `SMS_HTTP_API_KEY`, `SMS_HTTP_METHOD`, `SMS_HTTP_SENDER`

## Scheduled jobs

Scheduled jobs are invoked by GitHub Actions, not Vercel Cron. Keep `vercel.json` free of `crons` so Vercel Hobby deployments do not fail on non-daily schedules.

Configure these repository settings in GitHub:

- Repository variable or secret `DINAYA_APP_URL`: production app URL, for example `https://dinaya.lk`
- Repository secret `CRON_SECRET`: the same value configured in the Vercel/hosting environment

All cron workflows use `DINAYA_APP_URL` and `CRON_SECRET`. Schedules are UTC:

| Workflow | Endpoint | Schedule |
|----------|----------|----------|
| `ai-workflows-cron.yml` | `/api/cron/ai-workflows` | every 30 minutes |
| `automations-cron.yml` | `/api/cron/automations` | every 15 minutes |
| `webhook-retries-cron.yml` | `/api/cron/webhook-retries` | every 15 minutes |
| `google-calendar-cron.yml` | `/api/cron/google-calendar-sync` | hourly |
| `booking-reminders-cron.yml` | `/api/cron/reminders` | daily at 04:30 |

`SECRET_ENCRYPTION_KEY` must stay stable. Rotating it without re-encrypting stored secrets will make PayHere merchant secrets unreadable.

## Custom domains

Built-in tenant subdomains need `NEXT_PUBLIC_APP_DOMAIN=dinaya.lk` and a wildcard domain such as `*.dinaya.lk` assigned to the Vercel project. Vercel wildcard domains require the nameservers method so Vercel can issue wildcard SSL certificates.

Tenant-owned domains such as `book.salon.lk` require Vercel automation:

- `VERCEL_TOKEN`
- `VERCEL_PROJECT_ID_OR_NAME`
- `VERCEL_TEAM_ID` or `VERCEL_TEAM_SLUG` if the project belongs to a team

The dashboard flow is:

1. Tenant saves the domain.
2. Tenant adds the Dinaya TXT ownership record shown in `/dashboard/settings/integrations`.
3. Dinaya verifies TXT ownership.
4. Dinaya adds/checks the project domain through Vercel and shows the Vercel CNAME/A/TXT records.
5. Dinaya marks the custom domain active only after Vercel reports the project domain verified and not misconfigured.

## Local verification

```bash
npm run verify
npm run audit:high
```

The high-severity audit gate must pass before deployment. Moderate findings from dev tooling should be reviewed, but do not block a hotfix unless they affect production runtime.

## Database migration order

1. Confirm `DATABASE_URL` points at the intended database.
2. Run migrations before shipping code that depends on new columns or constraints:

```bash
npm run db:migrate
```

3. Confirm the latest migration appears in the Drizzle migrations table. Recent additions include:
   - `0011_booking_notifications.sql`
   - `0012_pro_growth.sql`
   - `0013_platform_settings.sql`
   - `0014_phase5_growth.sql`
   - `0015_security_performance_indexes.sql`
4. Deploy the app.
5. Smoke test:
   - `GET /api/health`
   - `/auth/signin`
   - `/dashboard`
   - `/dashboard/ai`
   - one public booking page at `/book/[slug]`
   - signed review page at `/reviews/[token]`
   - client booking manage link at `/client/[token]` (if enabled)
   - a test booking conflict attempt for the same staff/time

## Production safety notes

- Public booking writes must rely on the database overlap constraint, not only client-side checks.
- PayHere secrets are write-only from the dashboard and encrypted before storage.
- Webhook secrets are shown only once on creation.
- Plan config and platform announcements are stored in Postgres (`platform_settings`); a local `.dinaya/` mirror is used in development only.
- New Sri Lanka-local fields are backward-compatible and default to English / Asia/Colombo.
