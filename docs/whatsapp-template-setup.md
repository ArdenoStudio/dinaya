# WhatsApp (Meta Cloud API) — setup & template approval

This is the founder/admin checklist to take Dinaya's WhatsApp messaging live. The
code is done (outbound templates + inbound bot); these are the external steps only
**you** can do. See the build plan in
`docs/superpowers/plans/2026-06-14-messaging-and-monetization-master-plan.md`.

## 1. Meta account prerequisites

- [ ] A **Meta Business account** (business.facebook.com), verified.
- [ ] A **WhatsApp Business Platform** app in developers.facebook.com.
- [ ] A **dedicated phone number** for the WABA — one that is **not** currently
      active on the normal WhatsApp / WhatsApp Business app.
- [ ] A **permanent system-user access token** with `whatsapp_business_messaging`
      and `whatsapp_business_management` scopes.
- [ ] Note the **Phone Number ID** and **WhatsApp Business Account (WABA) ID**.

## 2. Environment variables (set in Vercel)

| Var | What |
|-----|------|
| `META_WHATSAPP_TOKEN` | Permanent access token |
| `META_WHATSAPP_PHONE_NUMBER_ID` | Phone Number ID for the WABA number |
| `META_WHATSAPP_VERIFY_TOKEN` | Any random string you choose; used for the webhook handshake |
| `META_WHATSAPP_APP_SECRET` | The Meta **app secret** (App → Settings → Basic) — verifies inbound webhook signatures |
| `MESSAGING_ENFORCE_ALLOWANCE` | Leave `false` at launch (observe usage only). Set `true` later to soft-cap WhatsApp at plan allowances. |

Also confirm `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`, and `CRON_SECRET` are set
(the last is required or the reminder cron returns 500).

## 3. Message templates (submit for approval — category: Utility)

Submit each template in **WhatsApp Manager → Message templates**, category
**Utility**. The variable order below **must match the code** in
`src/lib/messaging/booking-messages.ts`. Submit at least the English (`en`)
version; add Sinhala (`si`) and Tamil (`ta`) translations with the *same* name and
variable order to support localized businesses.

| Template name | Body (variables in order) |
|---|---|
| `booking_confirmation` | `Hi {{1}}, your {{3}} at {{2}} is confirmed for {{4}}. Manage your booking: {{5}}` |
| `booking_reminder` | `Hi {{1}}, a reminder for your {{3}} at {{2}} on {{4}}. Need to change it? {{5}}` |
| `booking_cancellation` | `Hi {{1}}, your {{3}} at {{2}} on {{4}} has been cancelled. Contact us to rebook.` |
| `booking_reschedule` | `Hi {{1}}, your {{3}} at {{2}} has been moved to {{4}}. View details: {{5}}` |
| `owner_new_booking` | `New booking at {{1}}: {{2}} — {{3}} with {{4}} on {{5}}. View: {{6}}` |

**Variable key (do not reorder):**

- `booking_confirmation` / `booking_reminder`: `{{1}}` client name · `{{2}}` business name · `{{3}}` service · `{{4}}` date & time · `{{5}}` manage link
- `booking_cancellation`: `{{1}}` client name · `{{2}}` business name · `{{3}}` service · `{{4}}` date & time
- `booking_reschedule`: `{{1}}` client name · `{{2}}` business name · `{{3}}` service · `{{4}}` new date & time · `{{5}}` manage link
- `owner_new_booking`: `{{1}}` business name · `{{2}}` client name · `{{3}}` service · `{{4}}` staff · `{{5}}` date & time · `{{6}}` dashboard link

> If Meta rejects an inline link in the body, move `{{5}}`/`{{6}}` to a **URL
> button** instead and tell the dev — the code currently passes the link as a body
> parameter (`buildWhatsAppTemplate(...)`), which would shift to a button component.

## 4. Inbound webhook (two-way bot)

In the app's **WhatsApp → Configuration → Webhook**:

- [ ] Callback URL: `https://dinaya.lk/api/webhooks/whatsapp`
- [ ] Verify token: the same value as `META_WHATSAPP_VERIFY_TOKEN`
- [ ] Subscribe to the **`messages`** field.

The bot resolves the sender to their most recent/upcoming booking, replies with
status / cancel / reschedule links or an AI answer, and — because the inbound
message opens a free 24h window — those replies are free and are **not** counted
against the plan allowance (tagged `whatsapp_inbound_reply`).

## 5. Go-live checklist

- [ ] Templates approved (status **Active** in WhatsApp Manager).
- [ ] Env vars set in Vercel; redeploy.
- [ ] Test booking → confirmation arrives on WhatsApp; row appears in `communications`.
- [ ] Trigger the reminder cron → reminder arrives.
- [ ] Send a WhatsApp message to the number → bot replies with the booking link.
- [ ] Confirm the dashboard billing page shows the **WhatsApp messages** usage meter (Pro+).
