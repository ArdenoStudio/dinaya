# Dinaya Deployment Checklist

Use this checklist before pushing production changes that touch schema, auth, payments, booking flow, or dashboard routes.

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
- Optional AI workflows: `AI_PROVIDER`, `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`
- Optional WhatsApp/social publishing: `META_WHATSAPP_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID`, `META_SOCIAL_ACCESS_TOKEN`, `META_SOCIAL_PAGE_ID`
- Optional SMS gateway: `SMS_HTTP_ENDPOINT`, `SMS_HTTP_API_KEY`, `SMS_HTTP_METHOD`, `SMS_HTTP_SENDER`

## Scheduled jobs

Scheduled jobs are invoked by GitHub Actions, not Vercel Cron. Keep `vercel.json` free of `crons` so Vercel Hobby deployments do not fail on non-daily schedules.

Configure these repository settings in GitHub:

- Repository variable or secret `DINAYA_APP_URL`: production app URL, for example `https://dinaya.lk`
- Repository secret `CRON_SECRET`: the same value configured in the app hosting environment

Current schedules use UTC:

- `.github/workflows/ai-workflows-cron.yml`: calls `/api/cron/ai-workflows` every 30 minutes
- `.github/workflows/booking-reminders-cron.yml`: calls `/api/cron/reminders` daily at `04:30 UTC`

`SECRET_ENCRYPTION_KEY` must stay stable. Rotating it without re-encrypting stored secrets will make PayHere merchant secrets unreadable.

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

3. Confirm the latest migration appears in the Drizzle migrations table.
4. Deploy the app.
5. Smoke test:
   - `GET /api/health`
   - `/auth/signin`
   - `/dashboard`
   - `/dashboard/ai`
   - one public booking page at `/book/[slug]`
   - signed review page at `/reviews/[token]`
   - a test booking conflict attempt for the same staff/time

## Production safety notes

- Public booking writes must rely on the database overlap constraint, not only client-side checks.
- PayHere secrets are write-only from the dashboard and encrypted before storage.
- Webhook secrets are shown only once on creation.
- New Sri Lanka-local fields are backward-compatible and default to English / Asia-Colombo.
