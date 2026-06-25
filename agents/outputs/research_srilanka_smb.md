# Sri Lanka SMB Research Brief — Salons & Beauty Studios

**Subagent:** 3 (market research)  
**Date:** 2026-06-23  
**Purpose:** Inform Dinaya onboarding design for appointment-based SMBs, with **Wax in the City** as the pilot reference (ladies salon, 2 Colombo branches).  
**Sources:** TRCSL telecom statistics (Q4 2025), DataReportal Digital 2026 Sri Lanka, PayHere/LMD merchant reporting, competitor product pages, Dinaya Phase 0 audit (`agents/outputs/AUDIT_REPORT.md`).

---

## Executive summary

Sri Lankan salon and beauty SMBs operate in a **mobile-first, WhatsApp-native** market. Customers discover and book via Instagram, WhatsApp DMs, and phone calls—not email or desktop websites. Premium Colombo waxing/beauty studios (the Wax in the City pilot profile) run **multi-branch operations**, **therapist-specific scheduling**, and increasingly expect **online deposits** to reduce no-shows—yet most still settle balances in cash or card at the counter.

Dinaya’s current onboarding (2-step register + 4-step setup wizard) seeds a single location, generic `salon_barber` presets, and WhatsApp templates—enough for a solo barber, **underspecified for a 2-branch ladies waxing pilot**. The highest-impact onboarding gaps are: multi-branch seeding, waxing-specific service catalog, deposit/PayHere guidance, Sinhala/Tamil copy paths, and explicit WhatsApp-as-primary-channel messaging.

---

## 1. Digital & mobile context (Sri Lanka)

| Signal | Figure | Onboarding implication |
|--------|--------|------------------------|
| Cellular subscriptions | ~29.5M (Q4 2025, TRCSL) | Assume every staff member and most clients have a mobile number |
| Smartphone/tablet share of devices | **70.3%** (Q4 2025) | Mobile web booking page is primary; desktop is secondary |
| Feature-phone share | **24%** | Some clients may struggle with complex web flows; WhatsApp links must be tap-friendly |
| Internet users | **13.9M** (~59.7% penetration, 2025) | ~40% of population still offline—phone/WhatsApp remains fallback |
| WhatsApp users | **~16.5M** (Dec 2025, TRCSL social-media survey) | WhatsApp is the default business channel, ahead of Instagram (~11M) |
| Facebook users | ~16.7M | Instagram bio + Facebook page are discovery surfaces; booking link belongs there |
| Mobile data consumption | ~17.7 GB/month per user (3Q 2025) | Rich booking pages acceptable; keep admin UI lightweight on 4G |
| Default timezone | `Asia/Colombo` | Already correct in Dinaya registration seed |

**Takeaway:** Onboarding copy and CTAs should assume the owner is on a phone, clients arrive via WhatsApp/Instagram, and the “share your link” step is effectively “paste this in WhatsApp status / Instagram bio.” Email is not the primary confirmation channel for this segment.

---

## 2. WhatsApp as the booking front door

### How salons actually book today

Local salon software vendors describe the dominant pattern clearly:

- Bookings arrive via **WhatsApp messages, missed calls, and walk-ins simultaneously** (රැවුල LK / Rawula LK positioning).
- Staff juggle a **notebook, WhatsApp chat, and mental queue**—no single source of truth.
- **Automatic WhatsApp confirmations and reminders** are table stakes for local booking tools (Rawula, CEYRES, SafeNet Creations salon bundles).
- AI WhatsApp agents (Sello/CognasisAI, Synthora) market specifically to **Colombo clinics and salons** with Sinhala, Tamil, Singlish, and English.

### WhatsApp Business API economics (indicative)

| Provider pattern | Setup | Monthly | Notes |
|------------------|-------|---------|-------|
| SafeNet salon bundle | LKR 65,000 | LKR 15,000/mo | Appointment flow, 24h reminders, trilingual |
| CognasisAI Sello | Varies | From ~LKR 4,990/mo | AI replies in SI/TA/EN/Singlish |
| DIY WhatsApp Business app | Free | Free | Manual replies; no automated booking |

**Dinaya position:** Registration already seeds WhatsApp confirmation + reminder templates. Onboarding should **surface WhatsApp earlier** (step 1 “your page info” already mentions WhatsApp phone)—and the share step should show a **pre-written WhatsApp broadcast snippet**, not just a URL.

### Onboarding implications (WhatsApp)

1. **Phone number is the critical field** — more important than email for client comms; validate E.164 or local `07x` format.
2. **Show “copy WhatsApp message”** alongside booking URL in step 4 (service menu + link in one paste).
3. **Explain template vs live send** — owners may expect instant WhatsApp delivery; clarify what Dinaya automates vs what requires WhatsApp Business API integration.
4. **Trilingual template preview** — if `language` is `si` or `ta` at registration, confirmation template preview should match (audit gap G6).
5. **Compete on simplicity** — local bots cost LKR 65k+ upfront; Dinaya’s wedge is “live booking link + reminders without a dev project.”

---

## 3. PayHere adoption & payments reality

### Market position

PayHere is widely cited as **Sri Lanka’s leading local payment gateway** (Central Bank approved). Reported merchant counts range from **2,500+** (LMD/PayHere, 2020 era) to **5,000+** (recent comparisons)—still a fraction of total SMBs, but the default choice for new online businesses.

| Plan | Monthly fee | Card fee (indicative) | Limits (indicative) |
|------|-------------|----------------------|---------------------|
| Lite | **Free** | ~3.30% | Up to LKR 50k/payment, LKR 200k/month |
| Plus | LKR 3,990 | ~2.99% | Higher caps; recurring billing |
| Premium | Custom | Lower at volume | Enterprise |

**Payment methods:** Visa/Mastercard, eZ Cash, mCash, FriMi, Genie, Sampath Vishwa and other bank portals, HelaPay (~1.99%).

**Requirements to onboard PayHere:**

1. Business registration in Sri Lanka  
2. Business bank account (LKR)  
3. Online application + signed merchant agreement upload  

**Alternatives owners may mention:** WebXPay (higher volume / omnichannel), Dialog Genie (NIC-only for very small sellers), bank IPGs (Genie Business, Commercial Bank Q+).

### How premium salons use deposits

Deposit culture is strong in Colombo beauty/wellness:

| Salon pattern | Deposit | Policy |
|---------------|---------|--------|
| Studio Zee (hair) | LKR 10,000 service deposit | Non-refundable cash; credited to bill; no-show forfeiture |
| The Skinfinity | Partial/full at booking | 24–48h cancellation window |
| Generic waxing studios | LKR 2,000–5,000 or 50% | WhatsApp confirmation after transfer |

Most day-to-day salon revenue is still **cash or card at POS**; online deposits are used to **secure high-value slots** and reduce no-shows, not to replace in-salon settlement.

### Onboarding implications (PayHere)

1. **PayHere is post-wizard today** (audit G2) — acceptable for speed-to-live, but pilot salons will ask about deposits in week one; surface a **“optional: connect PayHere”** callout in step 2 (service pricing) or step 4.
2. **Lite plan is the right default narrative** — “free to start; ~3.3% per deposit.”
3. **Prerequisites checklist** — business registration + bank account; flag unregistered home salons.
4. **Deposit % per service** — Dinaya supports `depositPercent` and PayHere checkout; onboarding should **suggest 25–50% for waxing** with editable default.
5. **Cash fallback copy** — “Pay balance at the salon” must remain visible; many clients distrust card fees on small services.
6. **Fee sensitivity** — LMD quotes PayHere on reducing processing costs for small merchants; don’t hide the percentage.

---

## 4. Salon & beauty SMB segment profile

### Business types in Colombo

| Tier | Examples | Booking behaviour |
|------|----------|-------------------|
| Premium ladies waxing | BeWAXed, WaxedColombo, pilot Wax in the City | Appointments + some walk-in/express; therapist preference; deposits on premium services |
| Full-service beauty | Salon Liyo, various Colombo 03/07 salons | Consultation fees, multi-hour colour services, membership tiers |
| Neighbourhood barber/salon | High walk-in volume | Queue-first; appointments secondary |
| Spa/wellness | Hotel spas, standalone | Package bookings; longer durations |

### Operational characteristics

- **Multi-branch** is common once a brand has product-market fit (BeWAXed: 6+ SL locations; pilot WITC: 2 Colombo branches).
- **Staff = therapists/stylists** — clients often request a named person; scheduling is per-staff, not just per-chair.
- **Service duration variance** — Brazilian wax 30–45 min; full leg 45–60 min; combo packages 90+ min.
- **Ladies-only positioning** — affects marketing copy, staff bios, and possibly booking page imagery.
- **Hours** — typically 9:00–18:00 or 10:00–19:00; closed Sundays and **Poya days** (BeWAXed explicitly closes Poya).
- **Pricing** — Colombo waxing roughly LKR 2,500–8,000+ per area; premium studios higher; presets at LKR 1,500 (haircut) are wrong tier for waxing pilot.
- **Languages** — English in premium Colombo; staff often switch Sinhala/Tamil with clients.

### Competitive booking landscape

| Product | Positioning | Threat to Dinaya onboarding |
|---------|-------------|----------------------------|
| SalonReserve | Directory + booking network | Discovery play; less ops depth |
| Calendyo | Consumer beauty marketplace | Early stage (few listings) |
| Rawula LK | WhatsApp + walk-in queue | Very aligned to SL behaviour |
| CEYRES / Raxwo / Saloonix | ERP + POS + multi-branch | Heavier; longer setup |
| WhatsApp bot agencies | Trilingual automation | High setup cost; no unified calendar |

**Dinaya wedge:** Faster than ERP, more structured than WhatsApp-only, PayHere-native, subdomain `{slug}.dinaya.lk` ready at step 4.

---

## 5. Pilot reference — Wax in the City

> **Product context:** Named in Dinaya orchestration as the pilot client (ladies salon, **2 Colombo branches**). Not yet seeded in codebase (audit gap G4).

### Pilot profile (target operating model)

| Attribute | Assumed pilot shape | Source / rationale |
|-----------|---------------------|-------------------|
| Segment | Ladies waxing & beauty studio | Stated pilot brief |
| Branches | 2 in Colombo (e.g. Colombo 03 + Colombo 07 corridor) | Stated pilot brief; mirrors BeWAXed density |
| Client gender | Women-focused | Stated; comparable to BeWAXed “ladies only” |
| Services | Strip/stripless waxing, threading, brows, limited facials/nails | Category norms; BeWAXed/WaxedColombo menus |
| Staff | Certified waxers/therapists per branch | Therapist assignment expected |
| Booking style | **Hybrid** — appointments for planned visits; walk-in tolerance at studio | International WITC brand uses walk-in + “Q app” check-in; local pilots may soften this |
| Deposits | Likely on premium/long services | Colombo premium salon norm |
| Discovery | Instagram + word of mouth + WhatsApp | SL salon norm |
| Tech maturity | Willing pilot = early adopter | Needs white-glove onboarding, not self-serve only |

### International Wax in the City brand (reference model)

The global **Wax in the City** franchise (Germany-origin, `wax-in-the-city.com`) is distinct from US “Waxing the City.” Its model is instructive even if SL pilot differs:

- **No fixed appointments** — walk-in first; “Q waxing app” shows live studio busyness and next slot check-in.
- **Real-time wait estimation** — queue software, not calendar-first.
- **Vegan PURE wax** — product-led branding.
- **Franchise playbook** — standardized training (“Waxperts”), hygiene protocols.

**Implication for Dinaya:** A strict walk-in/Q-app model conflicts with Dinaya’s **appointment + availability** core. Pilot onboarding should clarify which branch uses **appointment-first** vs **walk-in queue** (potential future feature). For v1 pilot, assume **appointment-first with same-day slots** (`minimumNoticeHours: 2` default is reasonable).

### Local comparable — BeWAXed (not the pilot, but market anchor)

| Branch | Area | Phone |
|--------|------|-------|
| Colombo 03 | R.A. De Mel Mawatha / Inner Bagatelle | 076 461 6677 |
| Colombo 07 | Rosmead Place | 076 971 0777 |

BeWAXed launched Sri Lanka’s first dedicated waxing salon (2013), now 10+ branches, own **mobile booking app** (2024), loyalty, therapist selection. They set client expectations for **hygiene, ladies-only positioning, and digital booking**.

**Pilot differentiation opportunity:** Dinaya can offer multi-branch + PayHere deposits + WhatsApp reminders **without** a custom app build—if onboarding gets the waxing catalog and 2-branch seed right.

### Suggested pilot seed data (onboarding template)

For a `wax_in_the_city` pilot template (future `registerBusinessAccount` preset or admin seed):

**Branch 1 — Colombo 03 (example)**

- Name: Wax in the City — Colombo 03  
- Slug: `colombo-03`  
- Hours: Mon–Sat 09:00–19:00 (closed Sun + Poya)  
- Phone: branch WhatsApp line  

**Branch 2 — Colombo 07 (example)**

- Name: Wax in the City — Colombo 07  
- Slug: `colombo-07`  
- Same hour pattern  

**Services (replace `salon_barber` presets)**

| Service | Duration | Price (LKR) | Deposit |
|---------|----------|-------------|---------|
| Underarm wax | 20 min | 2,500 | 0% |
| Half leg wax | 30 min | 4,500 | 25% |
| Full leg wax | 45 min | 6,500 | 25% |
| Brazilian wax | 45 min | 8,500 | 50% |
| Eyebrow threading | 15 min | 1,500 | 0% |
| Upper lip threading | 10 min | 1,000 | 0% |

**Staff:** 2–3 therapists per branch, each linked via `staff_locations` + `staff_services`.

**Policies:**

- Cancellation: 24h notice or deposit forfeited  
- Deposit policy: “50% deposit required on Brazilian and full-leg waxing; credited on arrival.”  
- Ladies-only note in business description  

---

## 6. Current Dinaya onboarding fit (baseline)

From Phase 0 audit — what exists today:

| Stage | Steps | Salon relevance |
|-------|-------|-----------------|
| Register | 2 (account + business) | `businessType: salon_barber` → haircut/beard presets (mismatched for waxing) |
| Setup wizard | 4 (page info → service → hours → share) | Single implicit location; no branch step |
| Post-setup checklist | 6 items incl. PayHere | PayHere deferred after “go live” |

**Seeded at registration:**

- 1 location (`Asia/Colombo`), Mon–Sat 09:00–17:00  
- Owner as sole staff  
- WhatsApp confirmation + reminder templates (English)  
- Trial plan  

**Gaps for WITC-shaped pilots:** G4 (no pilot template), G6 (i18n), G2 (PayHere not in wizard), G7 (6 effective steps to value).

---

## 7. Onboarding implications list

Prioritized for product/design decisions. IDs cross-reference audit gaps where applicable.

### P0 — Pilot-blocking

| ID | Implication | Detail |
|----|-------------|--------|
| O1 | **Multi-branch seeding** (G4) | Pilot has 2 Colombo branches; wizard assumes one. Add branch step or post-register seed script. |
| O2 | **Waxing service presets** | Replace haircut presets with waxing/threading catalog, realistic LKR pricing and durations. |
| O3 | **Per-branch hours & phone** | Each branch may have different WhatsApp line; step 1 fields are business-global today. |
| O4 | **Therapist/staff setup path** | Clients book people, not just slots; guide adding 2+ staff per branch early. |
| O5 | **Deposit defaults on high-value services** | Enable `requiresPayment` / `depositPercent` in setup step 2 with salon-specific guidance. |

### P1 — High impact for SL salon segment

| ID | Implication | Detail |
|----|-------------|--------|
| O6 | **WhatsApp-first share kit** (G2) | Step 4: copy-paste WhatsApp blurb + URL + optional QR. |
| O7 | **PayHere fast-track** (G2) | Optional wizard sub-step or checklist prominence: Lite plan, docs needed, link to settings. |
| O8 | **Trilingual UI** (G6) | Register captures `si`/`ta`/`en`; setup wizard still English-only. |
| O9 | **Phone validation** | Sri Lankan mobile format; phone required before complete. |
| O10 | **Poya / Sunday closure** | Availability UI hint for common closure days; avoid booking on known holidays. |
| O11 | **Reduce steps to first booking** (G7) | 6 steps today; target ≤3 for time-to-value — consider merging register + page info. |
| O12 | **Ladies-only / positioning copy** | Description templates for gender-focused studios. |

### P2 — Segment polish

| ID | Implication | Detail |
|----|-------------|--------|
| O13 | **Instagram bio helper** | Character-limited link line for step 4. |
| O14 | **Service buffers** | Waxing may need cleanup buffers (`beforeBuffer`/`afterBuffer`); advanced settings link from step 2. |
| O15 | **Minimum notice** | Default 2h may be too short for Brazilian; suggest 4–24h per service category. |
| O16 | **Directory listing category** | Map to `salon` directory category (already supported via `inferDirectoryCategory`). |
| O17 | **Competitor-aware messaging** | “No LKR 65k WhatsApp bot setup” for conversion. |
| O18 | **Walk-in / queue roadmap** | Document as future if pilot expects WITC-style walk-in; set expectations in onboarding. |
| O19 | **Cash-at-salon balance copy** | Booking confirmation should state deposit vs pay-at-visit. |
| O20 | **Subdomain branding** | `{slug}.dinaya.lk` — premium salons care about link aesthetics; show clean preview. |

### P3 — Operations & support

| ID | Implication | Detail |
|----|-------------|--------|
| O21 | **PayHere onboarding latency** | Merchant approval takes days; don’t block go-live on PayHere verified. |
| O22 | **Owner training mode** | First-week checklist: add 3 services, connect PayHere, send link to 10 WhatsApp contacts. |
| O23 | **Staff mobile usage** | Receptionist books on phone; dashboard must work on mobile Safari/Chrome. |
| O24 | **Data literacy** | Feature-phone staff may need owner-only admin; role clarity at register. |
| O25 | **Pilot white-glove path** | WITC may skip self-serve register — admin-provisioned tenant + import. |

---

## 8. Recommended onboarding narrative (WITC pilot)

**Tone:** Professional, warm, Colombo premium — not barber-shop casual. Sinhala/English mix acceptable in helper text.

**Suggested flow (target state):**

1. **Business identity** — name, slug, ladies waxing positioning, language.  
2. **Branches** — add Colombo 03 + 07 with address, WhatsApp, hours (incl. Sun/Poya closed).  
3. **Services** — waxing/threading presets with deposits on premium rows.  
4. **Team** — invite therapists; assign to branches and services.  
5. **Go live** — booking link, WhatsApp share kit, optional PayHere connect.  
6. **Post-live** — reminders on, directory opt-in, Instagram bio update.

**Time budget:** Rawula and competitors claim **15-minute setup**; Dinaya should target **under 20 minutes** for pilot with pre-seed, **under 45 minutes** self-serve.

---

## 9. Risks & open questions

| Risk | Mitigation |
|------|------------|
| Pilot expects walk-in queue like global WITC | Confirm appointment-first scope; document queue as roadmap |
| PayHere approval delay | Go live without deposits; enable when merchant active |
| WhatsApp automation expectations | Clear product boundary: templates vs API sending |
| i18n debt | English pilot acceptable if WITC staff bilingual; Sinhala/Tamil before mass market |
| BeWAXed app sets high bar | Emphasize zero app install for clients — web booking link |
| Name confusion (WITC vs BeWAXed) | Internal docs use full pilot name; customer-facing branding is tenant’s |

**Open questions for pilot kickoff:**

1. Exact branch addresses and WhatsApp numbers?  
2. Appointment-only or walk-in hybrid per branch?  
3. Which services require deposit vs pay-at-salon?  
4. Therapist count per branch at launch?  
5. PayHere merchant account already approved?  
6. Primary owner language for dashboard (`en` vs `si`)?  

---

## 10. Sources

| Source | URL / reference |
|--------|-----------------|
| TRCSL Telecom Statistics Q4 2025 | https://www.trc.gov.lk/content/files/statistics/2026/Statistics%20Report%20Q4%202025.pdf |
| DataReportal Digital 2026: Sri Lanka | https://datareportal.com/reports/digital-2026-sri-lanka |
| PayHere / LMD merchant interview | https://lmd.lk/payhere/ |
| PayHere vs WebXPay comparison | https://thetoolaudit.com/payhere-vs-webxpay-which-is-the-right-payment-gateway-for-you/ |
| Rawula LK (SL salon booking) | https://rawulalanka.vercel.app/ |
| SafeNet WhatsApp salon bundle | https://www.safenetcreations.com/whatsapp-services/ |
| CognasisAI Sello | https://cognasisai.com/products/sello |
| Wax in the City (international brand) | https://wax-in-the-city.com/en/ |
| BeWAXed (local comparable) | https://bewaxedglobal.com/about-us/ |
| Studio Zee deposit policy | https://studiozee.lk/privacy-policy/ |
| Dinaya Phase 0 audit | `agents/outputs/AUDIT_REPORT.md` |
| Dinaya registration seed | `src/lib/auth/register-business-account.ts` |

---

*End of brief. Feeds Phase 1 onboarding design and Wax in the City pilot seed specification.*
