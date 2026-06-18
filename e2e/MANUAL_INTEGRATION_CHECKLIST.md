# Manual integration QA checklist

Automated Playwright specs cover plan gates, limits, booking flow, and API 402 responses.
Run the full suite with:

```bash
E2E_DISABLE_RATE_LIMIT=true npm run test:e2e
```

Requires `DATABASE_URL` and `AUTH_SECRET` in `.env.local`.

## Automated (CI / e2e)

| Area | Spec | Status |
|------|------|--------|
| Free / Pro / Max UI gates | `e2e/plan-features.spec.ts` | Automated |
| Service limits (5 on Free) | `e2e/services.spec.ts` | Automated |
| Staff / location limits | `e2e/staff.spec.ts`, `e2e/locations.spec.ts` | Automated |
| AI Hub toggles (Max) | `e2e/ai-hub.spec.ts` | Automated |
| Public + dashboard booking | `e2e/booking-flow.spec.ts` | Automated |
| Calendar overlay UI + connect page | `e2e/calendar-overlay.spec.ts` | Automated when `GOOGLE_CLIENT_ID` + ticket secret set |
| API 402 gates | `e2e/manual-integration.spec.ts` | Automated |

## Manual only (needs sandbox credentials)

Create one persistent test account at `/register`, then switch plans via SQL:

```sql
UPDATE businesses SET plan = 'max', plan_expires_at = NOW() + INTERVAL '30 days'
WHERE id = (SELECT business_id FROM users WHERE email = 'your@test.com' LIMIT 1);
```

| Feature | Free | Pro | Max | Required env |
|---------|------|-----|-----|--------------|
| PayHere deposit checkout | Smoke | Smoke | Smoke | `DINAYA_PAYHERE_*`, business PayHere in settings |
| Billing upgrade (PayHere subscription) | N/A | Full flow | Full flow | PayHere sandbox + webhook |
| Google Calendar OAuth connect | Blocked | Connect | Connect | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Public booking calendar overlay | Hidden | Toggle + popup | Toggle + popup | `GOOGLE_CLIENT_ID`, canonical `NEXT_PUBLIC_APP_URL` in Google OAuth origins |
| Custom domain verify | UI only | Add domain | Add domain | `VERCEL_TOKEN`, `VERCEL_PROJECT_ID_OR_NAME` |
| WhatsApp / SMS automations send | Blocked | Channel visible | Channel visible | `META_WHATSAPP_*` or `SMS_HTTP_*` |
| AI content generation (LLM output) | Blocked | Blocked | Generate draft | `GROQ_API_KEY` |
| Voice receptionist API key + `/api/v1/` call | Blocked | Blocked | Create key + smoke | Max plan, voice provider setup |
| Resend email delivery | N/A | Automations send | Automations send | `RESEND_API_KEY` |

## Last run notes

| Item | Result | Notes |
|------|--------|-------|
| PayHere deposit | Skip | No sandbox credentials in agent environment |
| Google Calendar | Skip | No OAuth credentials |
| Custom domain | Skip | No Vercel token |
| WhatsApp / SMS | Skip | No Twilio/Meta credentials |
| AI content generation | Skip | No `GROQ_API_KEY` |
| Voice receptionist live call | Skip | Requires Max + telephony provider |
| Billing upgrade webhook | Skip | No PayHere sandbox |

API-level gates were verified in `e2e/manual-integration.spec.ts` when `DATABASE_URL` is available.
