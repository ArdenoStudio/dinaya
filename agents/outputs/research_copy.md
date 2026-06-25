# Onboarding Copy Audit — Subagent 4

**Scope:** Register → `/dashboard/setup` (SetupWizard) → dashboard checklist (OnboardingWizard + `overview-data.ts`) → onboarding API errors.

**Brand lens:** Dinaya sells a **finished booking page**, not software. Tone is practical, Sri Lanka–local, outcome-first. WhatsApp is complemented, not replaced. Canonical hero: *"Get a real booking page in 5 minutes."*

**Legend:** 🔴 weak / off-brand · 🟡 acceptable but improvable · 🟢 strong (no change needed)

---

## Executive summary

| Area | Verdict |
|------|---------|
| Register left panel + trial framing | 🟢 Strong — local, outcome-led |
| Register step 2 + business-type helpers | 🔴 "Seeds…" is dev jargon; step 2 subtitle is passive |
| SetupWizard step copy | 🟡 Mostly good; label/CTA mismatches and one defensive hint |
| OnboardingWizard headline + progress | 🔴 "Grow your bookings" is generic SaaS; 6-step checklist diverges from 4-step setup |
| `overview-data.ts` step descriptions | 🟡 Several labels repeat in descriptions; staff step phrasing is awkward |
| API + client error strings | 🟡 Functional but several use vague "Something went wrong" |

**Cross-flow inconsistency (copy + UX):** SetupWizard is **4 steps** and auto-seeds service/staff. Dashboard checklist is **6 steps** and may still show incomplete items after setup finishes. Users can land on "Grow your bookings" with steps already done in setup — confusing progression story.

---

## 1. `src/app/(auth)/register/page.tsx`

### Perks (left panel)

| Line | Severity | Issue | Replacement |
|------|----------|-------|-------------|
| `Your own booking page at yourname.dinaya.lk` | 🟢 | Clear, concrete | — |
| `Online payments with PayHere — no no-shows` | 🔴 | Overclaims; PayHere/deposits are optional and don't eliminate no-shows | `Take deposits with PayHere when you're ready — fewer no-shows` |
| `Staff scheduling & availability management` | 🔴 | Feature-list SaaS speak (off-brand) | `Set who takes bookings and when clients can pick a time` |
| `14-day free trial — no credit card needed` | 🟢 | Matches canonical trial line | — |

### Hero + testimonial

| Line | Severity | Issue | Replacement |
|------|----------|-------|-------------|
| `Your business,` / `bookable in minutes.` | 🟢 | Outcome-first | — |
| `Join salons, clinics, and tutors across Sri Lanka who use Dinaya to fill their calendars — without the back-and-forth.` | 🟢 | Local, pain-led | — |
| Testimonial (Ruwani Perera) | 🟢 | Specific outcome ("stopped losing appointments to WhatsApp confusion") | — |

### Step 1 — account

| Line | Severity | Issue | Replacement |
|------|----------|-------|-------------|
| `Create your account` | 🟢 | Clear | — |
| `Start your 14-day free trial. No credit card needed.` | 🟢 | Canonical | — |
| `Password must be at least 8 characters.` | 🟢 | Direct | — |
| `Weak` / `Fair` / `Strong` + hint subcopy | 🟢 | Helpful | — |
| `Continue` (step 1 CTA) | 🟡 | Fine; step 2 uses "Start free trial" — slight mismatch | `Continue to your booking page` |
| `Something went wrong.` | 🔴 | Generic; doesn't guide recovery | `We couldn't create your account. Check your details or try a different booking URL.` |
| `Something went wrong. Please try signing in.` | 🟡 | Better, but still vague on network vs auth failure | `Your account may have been created. Try signing in — or wait a moment and try again.` |

### Step 2 — business setup

| Line | Severity | Issue | Replacement |
|------|----------|-------|-------------|
| `Set up your booking page` | 🟢 | Matches product promise | — |
| `This is your public page that clients will visit.` | 🔴 | Passive, describes mechanism not benefit | `This becomes your link for WhatsApp, Instagram, and Google — clients pick a time without messaging you.` |
| `Your booking URL` | 🟢 | Clear | — |
| `Clients will book at {slug}.dinaya.lk` | 🟢 | Concrete preview | — |
| Business-type helpers (`Seeds haircut…`, `Seeds consultation…`, etc.) | 🔴 | **"Seeds" is internal/dev language** — users don't know what gets pre-filled | Use outcome language, e.g. `We'll start you with typical salon services — you can edit them next.` / `We'll add a consultation slot you can rename.` / `We'll set up a class session template you can adjust.` |
| `Booking page language` + `You can change this later in Settings.` | 🟢 | Clear | — |
| `Creating…` / `Start free trial` (`MARKETING_CTA_PRIMARY`) | 🟢 | Canonical CTA on commit | — |
| `Secure sign-up · No credit card required` | 🟢 | Trust line | — |
| `Already have an account? Sign in` | 🟢 | Standard | — |

---

## 2. `src/components/dashboard/SetupWizard.tsx`

### Step definitions (`STEPS`)

| Line | Severity | Issue | Replacement |
|------|----------|-------|-------------|
| Label `Your page info` | 🟡 | "Page" is vague; step body mentions WhatsApp | `Your booking page details` |
| Desc `WhatsApp, address, and a short line about what you do.` | 🟢 | Concrete | — |
| CTA `Save & add your first service` | 🟢 | Action + next step | — |
| Label `What clients book` | 🟢 | Outcome language | — |
| Desc `Name, price in LKR, and how long it takes.` | 🟢 | Local (LKR) | — |
| Label `When clients can book` | 🟢 | Clear | — |
| Desc `Pick the days and times that match your shop hours.` | 🟡 | Assumes physical shop; excludes home visits / mobile services | `Pick the days and times you're available for bookings.` |
| CTA `Save hours — almost live` | 🟢 | Good urgency | — |
| Label `Share your link` | 🟢 | Clear | — |
| Desc `Your page is live — send the link on WhatsApp or drop it in your Instagram bio.` | 🟢 | Local channels, on-brand | — |
| CTA `Open my dashboard` | 🟡 | Sudden context switch; user may want to share first | `Go to dashboard` or `Finish — open dashboard` |

### Chrome + headings

| Line | Severity | Issue | Replacement |
|------|----------|-------|-------------|
| `Your booking page in 5 minutes` | 🟢 | Canonical | — |
| `{step} of 4 — booking page setup` | 🟡 | Lowercase subtitle feels like debug copy | `Step {step} of 4` (subtitle already in H1) |
| `aria-label="Setup progress"` | 🟢 | Accessible | — |

### Step 1 body copy

| Line | Severity | Issue | Replacement |
|------|----------|-------|-------------|
| `Add your WhatsApp number, address, and a short intro. These show on your booking link — so clients can reach you without another DM.` | 🟢 | Pain-led, local | — |
| Label `WhatsApp number (shown on your page)` | 🟢 | Specific | — |
| Hint `Clients use this to confirm bookings or ask a quick question. We don't spam or share it.` | 🟡 | Second sentence is defensive | `Clients use this to confirm bookings or ask a quick question.` |
| Hint `Helps clients find you. Shows on your booking page.` | 🟡 | Redundant with intro paragraph | `Shown on your booking page so clients know where to go.` |
| Label `What you offer (one line)` | 🟢 | Scannable | — |
| Placeholder `e.g. Haircuts, colour, and bridal styling in Colombo 7` | 🟢 | Local example | — |

### Step 2 body copy

| Line | Severity | Issue | Replacement |
|------|----------|-------|-------------|
| `We added a starter service for you. Change the name, LKR price, and duration to match what you actually offer.` | 🟡 | "starter service" is slightly product-internal | `We added a first service to get you started. Update the name, price (LKR), and duration to match what you charge.` |
| Label `Duration (min)` | 🟢 | Fine for dashboard density | — |
| Label `Description` (optional, no hint) | 🟡 | Missed chance to reduce blank-field anxiety | Add hint: `Optional — a short line clients see when booking.` |

### Step 3 body copy

| Line | Severity | Issue | Replacement |
|------|----------|-------|-------------|
| `Set when clients can book online. You can change this later from Booking hours.` | 🟢 | Sets expectation | — |

### Step 4 + share

| Line | Severity | Issue | Replacement |
|------|----------|-------|-------------|
| `Your booking link is live` | 🟢 | Celebration moment | — |
| `Clients can book here:` | 🟡 | Functional | `Share this link — clients book without messaging you:` |
| `Preview booking page` | 🟢 | Clear | — |
| `Share on WhatsApp` | 🟢 | Local channel | — |
| WhatsApp prefill: `Book {name} online — pick a time here: {url}` | 🟡 | OK; could mirror brand pain line | `Book {name} online — no need to message, just pick a time: {url}` |
| `Stuck? Read the setup guide` | 🟢 | Helpful escape hatch | — |

### Errors + load states

| Line | Severity | Issue | Replacement |
|------|----------|-------|-------------|
| `Preview could not load in this panel.` | 🟢 | Honest + fallback CTA | — |
| `Couldn't load your booking page setup. Check your connection and try again.` | 🟢 | Actionable | — |
| `Couldn't save your page details. Check the fields and try again.` | 🟢 | Specific | — |
| `Couldn't save your progress. Refresh and try again.` | 🟡 | Repeats across steps | Keep; consider one shared string in code |
| `We couldn't find your profile for booking hours. Refresh the page and try again.` | 🟡 | "Profile" may confuse (staff record) | `We couldn't find your staff record for booking hours. Refresh and try again.` |
| `Couldn't save your booking hours. Pick at least one day and try again.` | 🟢 | Actionable | — |
| `Couldn't finish — your page may already be live. Refresh, or open your dashboard.` | 🔴 | Em-dash stack; mixes success + error | `You're all set — your page is already live. Open your dashboard to continue.` |

---

## 3. `src/components/dashboard/OnboardingWizard.tsx`

| Line | Severity | Issue | Replacement |
|------|----------|-------|-------------|
| `Your booking page in 5 minutes` | 🟢 | Consistent with setup | — |
| `Grow your bookings` | 🔴 | Generic growth SaaS; weak vs brand pain hook | `Finish your booking page` or `Almost ready to share` |
| `{n} of {total} done — your link is almost ready to share` | 🟡 | "done" informal; conflicts when user just finished 4-step setup | `{n} of {total} complete — share your link when you're ready` |
| `Do this next` | 🟢 | Clear focal point | — |
| `ctaForStep("Add your page details")` → same as label | 🔴 | CTA repeats label; not action-oriented | `Add page details` |
| `ctaForStep("Add what clients can book")` → `Add your first service` | 🟢 | Better than label | — |
| `ctaForStep("Who takes bookings")` → `Add who takes bookings` | 🔴 | Awkward grammar | `Add staff` or `Add who takes bookings` → **`Set up your team`** |
| `ctaForStep("Set booking hours")` | 🟢 | Matches task | — |
| `ctaForStep("Connect PayHere")` | 🟢 | Product name OK for SL audience | — |
| `ctaForStep("Share your booking link")` | 🟢 | Clear | — |
| `Share on WhatsApp` | 🟢 | Local | — |
| `aria-label="Growth checklist progress"` | 🔴 | "Growth" is internal plan tier name | `Onboarding checklist progress` |
| `Your live booking link:` | 🟢 | Useful anchor | — |

---

## 4. `src/lib/dashboard/overview-data.ts`

### Onboarding step labels + descriptions

| Step | Current | Severity | Replacement |
|------|---------|----------|-------------|
| Label | `Add your page details` | 🟢 | — |
| Desc | `WhatsApp, address, and a one-line intro — shown on your booking link.` | 🟢 | — |
| Label | `Add what clients can book` | 🟢 | — |
| Desc | `Add what clients can book — name, price in LKR, and duration.` | 🔴 | Label repeated verbatim in description | `Name your service, set the price in LKR, and how long it takes.` |
| Label | `Who takes bookings` | 🔴 | Unclear for solo owners | `Who clients book with` |
| Desc | `Add yourself (or your team) so appointments land on the right person.` | 🟢 | Explains why step exists | — |
| Label | `Set booking hours` | 🟢 | — |
| Desc | `Set the days and times clients can pick online — same as your shop hours.` | 🟡 | "Shop hours" excludes non-retail | `Set the days and times clients can book online.` |
| Label | `Connect PayHere` | 🟢 | — |
| Desc | `Optional: turn on PayHere when you're ready for card payments.` | 🟢 | Correctly optional | — |
| Label | `Share your booking link` | 🟢 | — |
| Desc | `Send your link on WhatsApp Status, drop it in your Instagram bio, or share it in a chat — so bookings don't get lost in DMs.` | 🟢 | Best line in the checklist — keep | — |

### Generated share strings

| Line | Severity | Issue | Replacement |
|------|----------|-------|-------------|
| `Book online with {business.name}: {bookingUrl}` | 🟡 | Weaker than SetupWizard prefill; no pain/outcome | `Book {business.name} online — pick a time here: {bookingUrl}` |

*(Stats labels like "Today revenue" are post-onboarding dashboard copy — out of scope unless shown during onboarding gate.)*

---

## 5. `src/app/api/dashboard/onboarding/route.ts` — errors

| Line | HTTP | Severity | Issue | Replacement |
|------|------|----------|-------|-------------|
| `We couldn't load your business. Sign out and sign back in, or contact support if this keeps happening.` | 404 | 🟡 | Long; "business" is admin-speak | `We couldn't load your account. Sign out and sign back in. If it keeps happening, contact support.` |
| `Something went wrong saving your progress. Refresh and try again.` | 400 | 🔴 | "Something went wrong" — brand anti-pattern | `We couldn't save your progress. Refresh the page and try again.` |

*Note: `requireApiBusiness` auth failures return their own messages from `@/lib/api-auth` — not duplicated here.*

---

## 6. Related register API errors (onboarding path)

From `register-business-account.ts` (surfaced on register step 2):

| Line | Severity | Replacement |
|------|----------|-------------|
| `That URL is already taken. Try a different one.` | 🟢 | — |
| `An account with this email already exists.` | 🟢 | — |
| `That URL or email is already taken. Please try again.` | 🟡 | `That booking URL or email is already in use. Try another.` |
| `Please check your registration details.` (validation) | 🟡 | `Check the highlighted fields and try again.` |
| `Unable to create account.` (handler fallback) | 🔴 | `We couldn't create your account right now. Try again in a moment.` |

---

## Priority rewrite batch (highest impact, smallest diff)

1. **Register business-type helpers** — remove all "Seeds…" strings (🔴 user-facing jargon).
2. **OnboardingWizard** — replace `Grow your bookings` headline (🔴 off-brand).
3. **`overview-data.ts`** — fix duplicated service-step description; rename `Who takes bookings` (🔴 clarity).
4. **Register step 2 subtitle** — benefit-led rewrite (🔴 weak hook).
5. **Perk line** — soften PayHere/no-show claim (🔴 overclaim).
6. **API PATCH error** — drop "Something went wrong" (🔴).
7. **SetupWizard finish error** — reframe as success when already live (🔴 confusing).

---

## Copy consistency checklist (for parent orchestrator)

- [ ] Align **4-step setup** story with **6-step dashboard checklist** (copy + completion logic).
- [ ] Unify WhatsApp prefill template across SetupWizard and `overview-data.ts`.
- [ ] Use **booking page** / **booking link** consistently (avoid bare "page").
- [ ] Avoid **Growth** / **Seeds** / **Something went wrong** in user-facing onboarding strings.
- [ ] Keep **LKR**, **WhatsApp**, **PayHere**, and **14-day trial** mentions — on-brand for Sri Lanka.

---

*Audit completed by Subagent 4 — copy research only; no code changes applied.*
