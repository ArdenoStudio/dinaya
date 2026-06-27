# Ultra Brand Voice — Rubric Reference

Companion to `SKILL.md`. Use for deep copy audits; the skill file has the operational protocol.

**Scoring:** 0 = fail · 1 = partial · 2 = pass

**Targets:**
- **Fast path (Round 3):** 24 points across 12 items → **≥20** (85%)
- **Full ledger:** 48 points across 24 items → **≥41** for ship candidate

---

## Positioning ledger (12 items · 24 pts)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| P1 | Lead promise | Software/platform/AI-first | Booking mentioned but buried | Finished booking page in ≤10 words |
| P2 | Pain specificity | Generic efficiency | One pain named | messaging chaos, no-shows, or after-hours DMs |
| P3 | messaging framing | "Replace primary messaging channel" | Neutral mention | Explicit complement + booking link |
| P4 | Local anchor | No SL context | local currency or SL mentioned once | local currency + payment gateway + local businesses |
| P5 | Outcome clarity | Feature list | One outcome | User knows what they get in 5 min |
| P6 | Competitor hygiene | Clone language | Implicit comparison | your product wedge without naming clones |
| P7 | Concierge offer | No setup help | Generic "support" | Menu send / free setup when relevant |
| P8 | Commission honesty | Hidden fees implied | Unclear | No commission on bookings stated where pricing |
| P9 | Trial terms | "Free" only | Trial length missing | 14-day, no card required |
| P10 | AI honesty | Overpromised AI | Vague AI | AI as growth layer; voice preview accurate |
| P11 | Domain correctness | staging-domain.com | Mixed domains | your-domain.com only in public copy |
| P12 | Primary CTA | Missing or generic | Multiple competing | One canonical CTA per viewport |

---

## Tone & language ledger (12 items · 24 pts)

| ID | Criterion | 0 | 1 | 2 |
|----|-----------|---|---|---|
| T1 | Jargon density | SaaS buzzword soup | Some jargon | Plain verbs; target customer readable |
| T2 | Sentence length | 30+ word blocks | Mixed | Avg ≤20 words; scannable |
| T3 | Active voice | Passive dominant | Mixed | Active, direct |
| T4 | Verb choice | leverage, synergy, disrupt | Some weak verbs | Book, pay, remind, grow |
| T5 | Headline/sub balance | Sub repeats headline | Partial overlap | Complementary hierarchy |
| T6 | Bullet discipline | Feature dump | Long bullets | Outcome-led bullets ≤12 words |
| T7 | Social proof | Unattributed claims | Vague "trusted by" | Named vertical or geography |
| T8 | Emoji/overpunctuation | Spammy !!! | Occasional | Restrained; channel-appropriate |
| T9 | Inclusive "you" | We-heavy corporate | Mixed | Second person on conversion copy |
| T10 | Error/empty copy | Generic "Something went wrong" | Partial context | Actionable recovery |
| T11 | Dashboard labels | Internal codenames | Close to plan.ts | Exact feature labels from PRODUCT.md |
| T12 | Bilingual awareness | Assumes US idioms | Neutral | SL-practical; no US-only references |

---

## Banned phrase auto-fail map

| Phrase pattern | Rubric IDs affected | Min severity |
|----------------|---------------------|--------------|
| `AI platform` (lead) | P1, P10 | P0 |
| `all-in-one SaaS` (no problem) | P1, T1 | P1 |
| `guaranteed \d+%` | P6, P7 | P0 |
| `staging-domain\.com` | P11 | P0 |
| `\bmax\b` (customer tier) | Dashboard labels | P1 |
| `global tool clone` / `Cal\.com` | P6 | P1 |
| `AI receptionist.*everyone` | P10 | P0 |
| `promo code.*in app` | P10 | P0 |
| `book a (product )?demo` | P12 | P1 |
| `cheapest` | P5, P8 | P1 |

```bash
rg -i 'AI platform|all-in-one SaaS|guaranteed [0-9]+%|staging-domain\.com|\bmax plan\b|global tool clone|receptionist.*everyone|promo code.*app|book a product demo|cheapest' \
  --glob '*.{tsx,ts,md}'
```

---

## CTA scoring matrix

| CTA | Context | Score 2 when |
|-----|---------|--------------|
| Start free trial | Primary conversion | Sole primary button |
| Create your booking page | Hero | Matches hero promise |
| Get started | Nav | Secondary to hero CTA |
| Get free setup | Sales/outreach | Paired with concierge pitch |
| DM YOUR_BRAND | Instagram/messaging | Channel-native |

**P1 triggers:** "Book a demo", "Schedule a call", "Contact sales" as hero primary without free trial path.

---

## Plan-tier copy checklist

| Internal | Customer copy | Price copy |
|----------|---------------|------------|
| trial | Free trial | 14 days |
| starter | Starter | local currency [starter_price]/mo |
| pro | Pro | local currency [pro_price]/mo — main plan |
| max | **Growth** | local currency [growth_price]/mo |
| expired | Expired / renew | Locked features |

Never expose `max` in user-facing strings.

---

## Compliance quick checks

| Topic | Pass |
|-------|------|
| data protection regulations | Purpose stated; marketing opt-in separate; minimal fields |
| Influencer | #ad / sponsored / paid partnership disclosed |
| Promotions | Start/end date; eligible plans; redemption steps |
| payment gateway | "payment gateway-ready" or accurate payment state — not "instant bank deposit" |

---

## Objection → approved response (sales copy)

| Objection | Approved angle |
|-----------|----------------|
| We use messaging | Booking link for messaging — not replacement |
| No time to set up | Send menu — we build the page |
| Customers call | Captures IG/after-hours bookers |
| No online pay yet | Bookings first; payment gateway deposits optional |

Score **2** on P3/P7 when outreach copy uses these patterns naturally.

---

## Fast-path scorecard (24 pts)

Sum Round 3 plan-language items B1–B12 from full ledger below. **Ship candidate: ≥20/24.**

### Plan & product language (B1–B12)

| ID | 2 = Pass |
|----|----------|
| B1 | Tier names: Starter / Pro / Growth only |
| B2 | Pro framed as main plan |
| B3 | Growth = automate growth / AI — not "enterprise max" |
| B4 | Feature names match `plan.ts` labels |
| B5 | local currency prices match PRODUCT.md or marked draft |
| B6 | Limits stated honestly (staff, primary messaging channel/mo) |
| B7 | payment gateway on correct tier (Starter+) |
| B8 | Webhooks/automations on Pro+ — not oversold on Starter |
| B9 | AI features on Growth — not promised on Starter |
| B10 | Voice receptionist = preview/managed — not GA |
| B11 | "Powered by your product" accurate for tier |
| B12 | Deals = "your product Deals" branded name |

---

## Channel-specific notes

| Channel | Extra checks |
|---------|--------------|
| Landing | Hero + one CTA + local anchor above fold |
| Pricing | Tier story + annual savings + trial CTA |
| messaging DM | ≤3 short lines; DM YOUR_BRAND; no link spam |
| Email | Subject ≤50 chars; one CTA; unsubscribe if marketing |
| Dashboard | Task verbs; no marketing tone on operational screens |
| Docs | Accurate API/plan gates; no sales hype |

---

## Handoff to content-review

When copy passes brand voice (≥85) but spans social + blog + landing:
→ `ultra-content-review` for cross-channel consistency and calendar alignment.
