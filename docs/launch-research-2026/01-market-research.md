# 01 Market Research

Last updated: 2026-06-03, Asia/Colombo.

## Market Read

Sri Lanka is ready enough for a local booking platform, but the winning launch will not be "software for everyone." It needs to feel practical, local, and set up for the business owner.

DataReportal's Digital 2026 Sri Lanka report says Sri Lanka had 13.9 million internet users at the end of 2025, with 59.7 percent internet penetration. It also reports 30.3 million cellular mobile connections, equal to 130 percent of the population. That matters because Dinaya's first user experience should assume mobile-first discovery, sharing, and booking.

Social is the demand channel. DataReportal reports 9.00 million social media user identities in Sri Lanka in October 2025, equal to 38.7 percent of the population and 64.8 percent of the internet user base. Facebook had 9.00 million ad-reachable users, YouTube had 8.82 million, TikTok had 6.79 million adults aged 18+, and Instagram had 2.25 million users in late 2025. TikTok ad reach grew 25.5 percent between late 2024 and late 2025, while Instagram potential ad reach grew 21.6 percent.

Payments are moving in Dinaya's direction. The Central Bank's Annual Economic Review 2025 notes that tourist LANKAQR transactions through India UPI, China UnionPay, and AliPay+ enabled apps increased in 2025. The President's Media Division announced that merchant service charges for LankaQR transactions up to Rs. 5,000 were removed from 2026-04-06 to push small merchants toward digital payments. Dinaya already supports PayHere for online payments and subscriptions, which is a strong local signal.

SMEs are the right economic target. GIZ describes Sri Lankan SMEs as more than 75 percent of companies, responsible for 45 percent of jobs, and contributing about half of GDP. The Digital Sri Lanka 2030 strategy also calls out MSME digitization, including a target for 100,000 MSMEs to embrace digital solutions and 30 percent to complete digital maturity assessment. Dinaya's story should therefore be "make digital operations usable for small local businesses," not "enterprise transformation."

## Demand Signals

Local competitors already exist, which is good. It proves the category is not imaginary.

| Player | Signal | Dinaya implication |
| --- | --- | --- |
| OrderNow Bookings | Markets online booking across salons, restaurants, clinics, hotels, fitness, auto services, and tutoring. Claims 500+ Sri Lankan businesses and a 14-day free trial. | Generic appointment booking is crowded. Dinaya needs sharper positioning and better onboarding. |
| Servio.lk | Consumer-facing appointment marketplace for doctors, salons, vehicle services, and more. Emphasizes no-account booking, multilingual access, SMS/WhatsApp alerts, and free provider registration. | Directory discovery and easy consumer booking matter. Dinaya should use its public booking pages and Deals as a discovery layer. |
| Linking.lk | Service provider booking app and directory for salons, wellness centers, and family doctors. Claims online booking, online payment, reminders, merchant directory, and merchant/client apps. | App-based directories exist, but businesses may prefer a simple link they can share everywhere. |
| Glamr / BeauTech / Bookr style salon tools | Beauty-specific operations, appointments, staff, analytics, payroll/POS, notifications. | Beauty is validated, but Dinaya can win by being Sri Lanka-local, web-link-first, payment-ready, and growth-focused. |
| Global tools like Calendly / Fresha / Booksy | Strong products, but not built around Sri Lankan payment habits, local business setup, and local marketing channels. | Avoid competing feature-for-feature. Compete on local setup, PayHere, WhatsApp/SMS, Sinhala/Tamil readiness, and service-business growth workflows. |

## Best Beachhead

Start with beauty and wellness:

- Salons
- Barbers
- Nail studios
- Spas
- Bridal makeup artists
- Skin/aesthetic clinics
- Fitness/wellness studios

Why:

- They already market visually on Instagram, TikTok, Facebook, and WhatsApp.
- Appointment coordination is painful and visible in comments and DMs.
- Staff, services, add-ons, deposits, no-shows, and reviews are all real business problems.
- They can show public proof quickly through booking links, QR codes, before/after content, and customer testimonials.
- Influencers and creators in this category are easier to convert because they can use the product in their own business.

Second wave:

- Clinics and dentists
- Tuition classes and coaching
- Consultants and agencies
- Auto service centers
- Home services
- Photography studios
- Event vendors

## Customer Pain Map

| Pain | Current workaround | Dinaya angle |
| --- | --- | --- |
| Missed DMs and calls | Manual WhatsApp replies, screenshots, handwritten calendars | "Your booking link answers the basic questions for you." |
| No-shows | Verbal confirmations, reminder calls | PayHere deposits, reminders, and confirmation flow. |
| Staff/service confusion | Owner manually checks availability | Service, staff, location, and time slot booking flow. |
| Slow days | Random discount posts | Dinaya Deals and smart deal suggestions. |
| Review collection | Ask manually after the visit | Reviews and review engine/growth workflows. |
| Repeat customers | Saved contacts and memory | CRM, broadcasts, reactivation campaigns, loyalty sequences. |
| Social marketing | Post when someone remembers | AI Content Machine as Growth upsell. |
| Owner does not want setup work | Avoids tools | Concierge setup offer: "send us your menu, we set it up." |

## Positioning

Recommended public positioning:

> Dinaya is the booking and growth platform for Sri Lankan service businesses. Get a shareable booking page, collect deposits, reduce no-shows, manage staff and clients, and fill quiet slots with local growth tools.

Short social line:

> Bookings, payments, reminders, and growth for Sri Lankan service businesses.

Avoid leading with:

- "AI platform" as the main promise.
- "All-in-one SaaS" without a concrete problem.
- "Cheapest booking tool."
- "Influencer marketplace."

Use AI as the expansion story:

- Starter: get bookings online.
- Pro: manage and grow operations.
- Growth: automate the growth work with AI.

## Pricing and Offer Read

Current default plan prices in `src/lib/plan.ts`:

- Starter monthly: LKR 1,990
- Pro monthly: LKR 3,990
- Growth monthly: LKR 6,900
- 14-day trial for new businesses

Recommended launch offers:

- Founder 50: first 50 businesses get free concierge setup and 60 days of Pro.
- Annual founder lock: early businesses can lock annual pricing for 12 months.
- Bring 3 businesses: existing business earns 1 month Pro credit per qualified paying referral.
- Creator code: creator earns commission only when a referred business becomes paid.

Do not advertise automatic promo-code redemption yet. Promo codes are not currently a shipped product feature.

## Market Risks

- Businesses may say "we already use WhatsApp." Answer: Dinaya does not replace WhatsApp; it gives WhatsApp a booking link that removes repetitive back-and-forth.
- Businesses may not trust online payments. Answer: start with optional deposits and PayHere, then expand to digital payment habits as trust grows.
- Competitors already have booking features. Answer: win with setup service, local growth tooling, Deals, PayHere, WhatsApp/SMS, and founder proximity.
- Too much AI messaging can reduce trust. Answer: sell booking reliability first, then AI as the next layer.
- Social reach does not equal active users. DataReportal repeatedly warns that ad reach and user identities are not the same as monthly active people. Treat platform numbers as media planning signals, not exact audience counts.

## Compliance Notes

- For customer and business owner data, treat the Personal Data Protection Act as a real operating constraint. Collect only what is needed, keep consent and opt-out paths clear, and avoid exporting customer lists into influencer or ad workflows without permission.
- For promotions, write clear terms: valid dates, eligible plans/services, discount amount, limits, and whether it applies to subscription fees or service bookings.
- For influencer posts, require visible disclosure such as "paid partnership", "sponsored", or "affiliate link/code" even if local practice is inconsistent.
- Avoid misleading claims like "guaranteed 40 percent more bookings" unless Dinaya has its own measured proof.

## Source Notes

- DataReportal Digital 2026: Sri Lanka was published at the end of 2025 and uses latest available data from October 2025. It is still the best current country-specific digital planning source found for June 2026.
- Competitor claims are self-published marketing claims. Use them to understand positioning, not as audited market share.
- Payment policy is moving quickly in Sri Lanka. Recheck LankaQR and PayHere fee details before publishing any payment-cost claims.

