# Flow Patterns — Deep-Dive Checklists

Companion to `SKILL.md`. Apply when reviewing named flow types.

---

## Forms & settings

| ID | Criterion | Pass |
|----|-----------|------|
| FM1 | ≤7 visible fields on primary form | Optional fields behind links |
| FM2 | Required **and** optional labeled explicitly | No ambiguity |
| FM3 | Inline validation on blur/change | Not submit-only |
| FM4 | Error scroll to first field | Error visible without hunt |
| FM5 | Input preserved on validation fail | Never clear user data |
| FM6 | `autocomplete` on known fields | name, email, tel, address |
| FM7 | Correct `type` / `inputmode` | Numeric pad for phone/zip |
| FM8 | Input font **≥16px** on mobile | Prevents iOS zoom-on-focus |
| FM9 | Field labels persist (not placeholder-only) | Placeholder is hint only |
| FM10 | Grouped sections with headers | Settings-style hierarchy |

**Apple mental model:** iOS Settings — grouped lists, clear section headers, destructive actions at bottom.

---

## Checkout & commerce

| ID | Criterion | Pass |
|----|-----------|------|
| CH1 | Order summary **above** fields on mobile | What you're buying visible first |
| CH2 | Completed steps collapse to summary | Not just checkmark headers |
| CH3 | Single "Name" field where possible | Split only when required |
| CH4 | Address Line 2 behind link | Reduce visual noise |
| CH5 | Billing = shipping by default | Opt-in to differ |
| CH6 | Coupon/promo behind link | Not competing with pay CTA |
| CH7 | Price visible before commit | No surprise at payment |
| CH8 | Confirm modal before external redirect | PayPal, Stripe hosted, PayHere |
| CH9 | Express pay only when saved method exists | Don't fake one-tap |
| CH10 | Post-purchase: receipt + next action | Not dead-end confirmation |

**Baymard research:** Top checkout friction = forced account, hidden costs, unclear errors, field overload.

**Apple mental model:** Apple Store — summary line, Reserve/Buy language, Wallet integration.

---

## Onboarding & auth

| ID | Criterion | Pass |
|----|-----------|------|
| ON1 | ≤3 steps to first value moment | Time-to-aha minimized |
| ON2 | Explain **why** before PII collection | Trust before data |
| ON3 | Skippable where possible | Resume later path |
| ON4 | Smart defaults over configuration | Pre-select sensible options |
| ON5 | Social auth doesn't hide email path | Equal-weight alternatives |
| ON6 | Password requirements visible upfront | Not error-after-submit |
| ON7 | Magic link / OTP: clear expiry + resend | No silent timeout |
| ON8 | Back doesn't lose entered data | Draft persistence |
| ON9 | Success state shows next action | Not generic "Success!" |
| ON10 | Account creation deferred until needed | Guest checkout pattern |

**Apple mental model:** Setup assistant — one decision per screen, progress recoverable.

---

## Scheduling & booking

| ID | Criterion | Pass |
|----|-----------|------|
| SC1 | Service + price visible before time selection | Intent before inventory |
| SC2 | Date/time on same step when possible | Apple Store scheduling pattern |
| SC3 | Selected slot in sticky summary on mobile | Context without memory |
| SC4 | Phone/email after slot selection | Data timing |
| SC5 | Slot hold timer if inventory reserved | Warn before expiry |
| SC6 | Slot taken → inline recovery | Next available action |
| SC7 | Zero slots → notify / suggest next date | Not dead end |
| SC8 | Implicit progress over numbered steps | Summary line > step numbers |
| SC9 | Post-book: calendar + directions + manage | Not email-only |
| SC10 | Calendar cells + chevrons ≥44px | Touch targets |

**Apple mental model:** Genius Bar / Apple Store pickup — availability before commit.

---

## Dashboard & data tables

| ID | Criterion | Pass |
|----|-----------|------|
| DB1 | Primary metric/action above fold | Data serves decision |
| DB2 | Empty state with populate CTA | Never blank grid |
| DB3 | Loading: skeleton rows match columns | Not spinner-only |
| DB4 | Row height ≥44px if tappable | Or explicit action column |
| DB5 | Sort/filter state visible | User knows current view |
| DB6 | Bulk actions confirm destructive | Undo where possible |
| DB7 | Pagination or virtual scroll documented | No mystery truncation |
| DB8 | Keyboard: arrow keys in data grid | Roving tabindex pattern |
| DB9 | Density toggle or responsive columns | Survives 1024px |
| DB10 | Chart data has text alternative | `aria-label` or table fallback |

**Apple mental model:** Stocks / Health — scannable numbers, deference to data, chrome recedes.

---

## Marketing & landing

| ID | Criterion | Pass |
|----|-----------|------|
| MK1 | One hero, one primary CTA | Not CTA soup |
| MK2 | Value prop in **≤10 words** above fold | Scannable headline |
| MK3 | Social proof below primary path | Doesn't compete with CTA |
| MK4 | Feature grid ≤6 items | Cut the rest |
| MK5 | Pricing: recommended tier highlighted | One obvious choice |
| MK6 | Nav ≤5 items | Deference to content |
| MK7 | Video/imagery doesn't block LCP | Poster + lazy load |
| MK8 | Mobile: CTA in thumb zone | Bottom 50% or sticky |
| MK9 | No auto-playing audio | User agency |
| MK10 | Footer: legal de-emphasized | Tertiary typography |

**Apple mental model:** apple.com product page — cinematic hero, single path forward.

---

## Embed & widget

| ID | Criterion | Pass |
|----|-----------|------|
| EM1 | Wrapper reserves space before load | CLS < 0.1 |
| EM2 | `width: 100%`; parent controls max-width | Responsive in host |
| EM3 | Theme via CSS vars or `data-theme` | Cross-boundary theming |
| EM4 | Sticky CTA not clipped at 400px height | Test short iframes |
| EM5 | No double scrollbars | Explicit scroll policy |
| EM6 | `postMessage` origin validated | Security |
| EM7 | `sandbox` for untrusted hosts | CSP `frame-src` |
| EM8 | Minimal chrome in embed mode | Content is the interface |
| EM9 | Resize observer or height postMessage | Dynamic content height |
| EM10 | Host page isolation tested | No style leakage |

---

## i18n & RTL

| ID | Criterion | Pass |
|----|-----------|------|
| I18N1 | No hardcoded UI strings in components | All via i18n layer |
| I18N2 | Buttons use `min-inline-size` not fixed width | +30–35% expansion |
| I18N3 | Dates/currency via `Intl` or locale lib | Not US-hardcoded |
| I18N4 | Longest locale tested (DE/FI) | Primary CTA + nav |
| I18N5 | Shortest locale tested (ZH/JA) | No orphaned whitespace |
| I18N6 | Pseudo-localization in dev | `Ŧĥíš ťéхŧ` or `[[ lengthened ]]` |
| RTL1 | `dir="rtl"` on root per locale | Arabic/Hebrew builds |
| RTL2 | Logical CSS properties | `margin-inline-start` not `margin-left` |
| RTL3 | Directional icons mirror | Chevrons, arrows |
| RTL4 | Non-directional icons don't mirror | Search, settings, brand |
| RTL5 | Mixed bidi: phone, URL, Latin in Arabic | `dir="ltr"` on inline spans |
| RTL6 | Arabic line-height ≥1.6 | letter-spacing: 0 |

---

## AI & agent interfaces (2024–2026)

| ID | Criterion | Pass |
|----|-----------|------|
| AI1 | Reasoning steps visible when async | Not black-box spinner |
| AI2 | User can interrupt/cancel generation | Agency |
| AI3 | Sources/citations when factual claims | Responsibility |
| AI4 | Fixed structural patterns for variable content | Familiarity |
| AI5 | Autonomy dial or confirm for destructive AI actions | Agency |
| AI6 | Error: model failure has retry + fallback | Recovery |
| AI7 | Streaming text doesn't shift layout | Skeleton or min-height |
| AI8 | Copy clearly distinguishes AI vs human | Trust |

---

## Performance perception

| Situation | Pattern | Threshold |
|-----------|---------|-----------|
| Initial load | Skeleton matching layout | Show if >300ms |
| Brief action | Button spinner | Feedback <100ms |
| Operation >1s | Progress bar or status text | Not static spinner alone |
| High-confidence toggle | Optimistic UI + rollback | Like, add-to-cart |
| Page shell | Chrome first, stream content | Frame <200ms |

| Metric | Good | Tool |
|--------|------|------|
| INP | <200ms | web-vitals |
| LCP | <2.5s | Lighthouse |
| CLS | <0.1 | Lighthouse |
| Interaction feedback | <100ms | Manual |

**Anti-patterns (P1):** full-page blocking spinner · blank white load · skeleton shape ≠ final · double-submit · optimistic UI without rollback.

---

## Apple vs typical SaaS matrix

| Dimension | Apple | Typical SaaS | Target |
|-----------|-------|--------------|--------|
| Entry | Problem/product-led | "Pick type" gate | Task = interface |
| Progress | Implicit + summary | Numbered wizard | Summary line > step numbers |
| Photography | One cinematic hero | Logo banner | Single hero moment |
| CTA | 1 primary + 1 quiet secondary | Multiple filled buttons | One filled per viewport |
| Trust | Brand + platform | Badge soup | Local trust signals only |
| Post-action | Wallet + Calendar | Email only | Actionable next step in-app |
| Settings | Grouped lists | Tab maze | iOS Settings pattern |
| Errors | Inline + recovery | Toast-only | Field + summary + action |

---

## Sources

- [Baymard checkout UX](https://baymard.com/blog/current-state-of-checkout-ux)
- [NN/G empty states](https://www.nngroup.com/articles/empty-state-interface-design/)
- [NN/G severity ratings](https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/)
- [MDN perceived performance](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/Perceived_performance)
- [Apple HIG — Buttons](https://developer.apple.com/design/human-interface-guidelines/components/menus-and-actions/buttons)
