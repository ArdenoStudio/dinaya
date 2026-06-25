# Dinaya Ultra Skill Pack — Master Plan

> **For agentic workers:** This plan defines how to build `.cursor/skills/dinaya-*` — a full executive + engineering + brand skill plugin for Dinaya, modeled on `apple-design-head` (scored rounds, P0/P1/P2, SHIP gate). Execute in phases; one research agent per skill before authoring.

**Goal:** A self-contained **Dinaya plugin** in `.cursor/skills/` so any agent can invoke the right persona (CEO, CPO, design head, PayHere expert) with Dinaya-specific context, scoring rubrics, and output templates — not generic advice.

**Reference skill:** `.cursor/skills/apple-design-head/` (SKILL.md + DISCOVERY + PATTERNS + RUBRIC + COMPLETE.md)

**Existing skills (keep, don't duplicate):**
| Skill | Role |
|-------|------|
| `apple-design-head` | UI/UX ship review (universal, Dinaya-scoped via `paths`) |
| `dag-task-runner` | Multi-agent DAG orchestration |

---

## 1. Architecture — the "Ultra Plugin"

```
.cursor/skills/
├── _shared/                          # NOT a skill — loaded via links
│   ├── BRAND.md                      # Voice, positioning, anti-patterns
│   ├── VISUAL.md                     # Colors, type, logo, booking hub palette
│   ├── PRODUCT.md                    # Pillars, feature names, plan tiers
│   ├── STACK.md                      # Node 22, boundaries, verify gate
│   ├── PATHS.md                      # Route map: book/, dashboard/, api/
│   └── COMPETITORS.md                # SL positioning vs OrderNow, Servio, etc.
│
├── dinaya-hub/                       # Router — start here
│   └── SKILL.md
│
├── ── BRAND LAYER (2 skills) ──
├── dinaya-brand-voice/
├── dinaya-visual-system/
│
├── ── EXECUTIVE LAYER (6 skills) ──
├── dinaya-ceo/
├── dinaya-cpo/
├── dinaya-cto/
├── dinaya-cfo/
├── dinaya-head-of-growth/
├── dinaya-head-of-sales/
│
├── ── ENGINEERING LAYER (8 skills) ──
├── dinaya-booking-engine/
├── dinaya-payhere/
├── dinaya-migrations/
├── dinaya-api-auth/
├── dinaya-plan-gating/
├── dinaya-messaging/
├── dinaya-events/
├── dinaya-voice-api/
│
├── ── REVIEW LAYER (3 skills) ──
├── dinaya-security-review/
├── dinaya-pr-ship-review/
├── dinaya-content-review/
│
├── apple-design-head/                # existing
└── dag-task-runner/                  # existing
```

**Total new skills: 20** (+ 2 existing = **22 skill pack**)

**Shared layer rule:** Every skill opens with:
```markdown
## Prerequisites
Read [_shared/BRAND.md](../_shared/BRAND.md) and relevant _shared/*.md before scoring or advising.
```

**Rules vs skills:**
- `.cursor/rules/*.mdc` = always-on invariants (stack, migrations, API auth)
- Skills = on-demand personas with scoring protocols and Dinaya context

---

## 2. Skill quality standard (copy from apple-design-head)

Every Dinaya skill MUST include:

| Element | Purpose |
|---------|---------|
| YAML frontmatter | `name`, `description` (what + when + keywords, <400 chars), optional `paths` |
| **When to use** | Trigger phrases + when NOT to use |
| **Modes table** | Full / Focused / Ship gate / Implement |
| **Protocol** | Numbered rounds with weighted scores |
| **Severity** | P0 / P1 / P2 / P3 definitions |
| **Output template** | Exact markdown structure agent must produce |
| **Ship gate** | SHIP (≥85) / ITERATE / REJECT criteria |
| **Do not** | Dinaya-specific anti-patterns |
| **Related skills** | Hub routing table |
| Companion file(s) | RUBRIC.md and/or PATTERNS.md when skill is scored or flow-heavy |
| COMPLETE.md | Optional single-file bundle for portability |

### Scoring pattern (executive + review skills)

```markdown
| Verdict | Criteria |
|---------|----------|
| SHIP | Overall ≥85; 0 P0; ≤2 P1 with fix plan |
| ITERATE | Any P0; >3 P1; missing Dinaya context |
| REJECT | Wrong market, wrong customer, violates brand |
```

### Engineering skills pattern

- Discovery checklist (files to read)
- Implementation steps with exact paths
- Verification: `npm run verify`
- Link to relevant `.cursor/rules/*.mdc`

---

## 3. Full skill catalog (20 new skills)

### Tier 0 — Hub (1)

| # | Skill | One-line job | Research agent focus |
|---|-------|--------------|----------------------|
| 0 | **dinaya-hub** | Route user to correct skill | Map all skills + triggers; Twilio hub pattern |

### Tier 1 — Brand layer (2)

| # | Skill | Persona | Rounds / output |
|---|-------|---------|-----------------|
| 1 | **dinaya-brand-voice** | Brand guardian | Copy audit: voice, positioning, banned phrases → score + rewrites |
| 2 | **dinaya-visual-system** | Visual design lead | Token audit: cobalt/violet/amber/emerald, Cal Sans, no pink → score |

### Tier 2 — Executive layer (6)

| # | Skill | Persona | Rounds / output |
|---|-------|---------|-----------------|
| 3 | **dinaya-ceo** | CEO (Ardeno) | Strategy review: beachhead, focus, say-no list → SHIP gate |
| 4 | **dinaya-cpo** | CPO | Feature prioritization: pain vs effort vs plan tier → roadmap verdict |
| 5 | **dinaya-cto** | CTO | Architecture review: schema, boundaries, scale risks → tech gate |
| 6 | **dinaya-cfo** | CFO | Unit economics: LKR pricing, WhatsApp cost, event fees → margin model |
| 7 | **dinaya-head-of-growth** | Head of Growth | GTM review: first 100, density, content, referrals → launch gate |
| 8 | **dinaya-head-of-sales** | Head of Sales | B2B salon pitch: objection handling, concierge setup → pitch score |

### Tier 3 — Engineering layer (8)

| # | Skill | Domain | `paths` scope |
|---|-------|--------|---------------|
| 9 | **dinaya-booking-engine** | Slots, holds, availability, `/book/[slug]` | `src/app/book/**`, `src/lib/availability.ts` |
| 10 | **dinaya-payhere** | PayHere checkout + webhooks | `src/lib/payhere.ts`, `**/payhere/**` |
| 11 | **dinaya-migrations** | Drizzle schema changes | `drizzle/**`, `src/db/schema.ts` |
| 12 | **dinaya-api-auth** | Dashboard, cron, v1 API keys | `src/app/api/**` |
| 13 | **dinaya-plan-gating** | Trial/Starter/Pro/Growth | `src/lib/plan*.ts`, `ProGate.tsx` |
| 14 | **dinaya-messaging** | WhatsApp/SMS/email templates | `src/lib/messaging/**` |
| 15 | **dinaya-events** | Events & ticketing (new) | `docs/.../events-ticketing-master-plan.md` + future code |
| 16 | **dinaya-voice-api** | AI voice receptionist v1 API | `src/app/api/v1/**`, voice docs |

### Tier 4 — Review layer (3)

| # | Skill | Persona | Overlap |
|---|-------|---------|---------|
| 17 | **dinaya-security-review** | Security lead | Secrets, auth, PDPA, webhook verification |
| 18 | **dinaya-pr-ship-review** | Eng manager | PR readiness: tests, migrations, plan gates, verify |
| 19 | **dinaya-content-review** | Content lead | Social, landing, docs copy → brand-voice alignment |

**Note:** UI review stays **`apple-design-head`** — add Dinaya row to its DISCOVERY.md instead of forking.

---

## 4. Shared `_shared/` files — build first

These are the "Dinaya look" foundation. **Agent 0** (brand inventory) already extracted content; distill into:

| File | Source material | Lines (target) |
|------|-----------------|----------------|
| `BRAND.md` | launch-research, marketing-copy, about page | ~150 |
| `VISUAL.md` | globals.css, booking-hub-brand.ts, brand SVGs | ~80 |
| `PRODUCT.md` | plan.ts, plan-features, dashboard-route-map | ~120 |
| `STACK.md` | AGENTS.md, dinaya-stack.mdc | ~60 |
| `PATHS.md` | AGENTS.md directory map + route grep | ~80 |
| `COMPETITORS.md` | 01-market-research.md | ~60 |

**No SKILL.md in `_shared/`** — not discoverable as a skill.

---

## 5. Per-skill research agent matrix

**Execution model:** Spawn **one subagent per skill** (20 agents) in parallel batches of 5–6. Each agent delivers a **skill brief** that the authoring agent turns into `SKILL.md` + companions.

### Agent prompt template (use for each skill)

```
You are researching skill #{N}: {skill-name} for the Dinaya Ultra Skill Pack.

Read:
- docs/superpowers/plans/2026-06-22-dinaya-skill-pack-master-plan.md (this plan)
- .cursor/skills/apple-design-head/SKILL.md (pattern to follow)
- Relevant Dinaya docs/code for this skill's domain

Deliver a SKILL BRIEF with:
1. Persona voice (3 sentences — how this executive/expert speaks)
2. Trigger phrases (10+) for description frontmatter
3. When NOT to use (5 bullets)
4. Protocol rounds (3–6 rounds with weights summing to 100%)
5. Rubric items (10–20 scored criteria)
6. P0/P1 examples specific to Dinaya
7. Output template (markdown)
8. Ship gate thresholds
9. Related skills + handoff rules
10. File paths to scope with `paths:` frontmatter
11. Companion files needed (RUBRIC.md, PATTERNS.md, etc.)
12. 3 realistic Dinaya scenarios to test the skill against

Be specific to Dinaya.lk — not generic startup advice.
```

### Batch schedule

| Batch | Skills | Agents |
|-------|--------|--------|
| **A** | `_shared/*`, dinaya-hub, dinaya-brand-voice, dinaya-visual-system | 4 |
| **B** | dinaya-ceo, dinaya-cpo, dinaya-cto, dinaya-cfo, dinaya-head-of-growth, dinaya-head-of-sales | 6 |
| **C** | dinaya-booking-engine, dinaya-payhere, dinaya-migrations, dinaya-api-auth, dinaya-plan-gating, dinaya-messaging | 6 |
| **D** | dinaya-events, dinaya-voice-api, dinaya-security-review, dinaya-pr-ship-review, dinaya-content-review | 5 |
| **E** | Update apple-design-head DISCOVERY.md with Dinaya paths; generate COMPLETE.md bundles | 1 |

**Total research agents: 22** (20 skills + shared layer + apple-design-head patch)

---

## 6. Skill brief → authoring workflow

For each skill after research agent returns:

```
1. Create .cursor/skills/{name}/SKILL.md from brief
2. Add companion files (RUBRIC.md, PATTERNS.md) if brief requires
3. Run skill against 3 test scenarios from brief
4. Score output — must hit SHIP (≥85) on scenario tests
5. If ITERATE: fix SKILL.md gaps, re-run scenarios
6. Optional: generate COMPLETE.md bundle
7. Add entry to dinaya-hub routing table
```

### Test scenarios (examples per tier)

**dinaya-ceo:**
- "Should we build events ticketing now or wait?"
- "Should we lower Pro price to beat OrderNow?"
- "Should we expand to India?"

**dinaya-brand-voice:**
- Audit landing page hero copy
- Rewrite a "AI-powered all-in-one SaaS" draft

**dinaya-visual-system:**
- Audit a new dashboard card component for token violations

**dinaya-booking-engine:**
- Debug "slot taken" race condition plan

**dinaya-cfo:**
- Model WhatsApp cost at 500 msgs/mo on Pro

Each skill brief must include 3 Dinaya-specific scenarios like these.

---

## 7. Executive skill round designs (starter specs)

These are seed specs for research agents — not final SKILL.md.

### dinaya-ceo

| Round | Weight | Question |
|-------|--------|----------|
| R0 Focus | 30% | Does this grow salon density in one cluster? |
| R1 Market | 25% | Right for Sri Lanka SME reality? |
| R2 Moat | 20% | Strengthens PayHere + local + CRM wedge? |
| R3 Execution | 15% | Can 2 founders ship with current team? |
| R4 Brand | 10% | Matches "booking page not software" positioning? |

**Reject triggers:** dilutes beachhead, competes feature-for-feature with Fresha, needs capital Dinaya doesn't have.

### dinaya-cpo

| Round | Weight | Question |
|-------|--------|----------|
| R0 Pain | 30% | Real salon owner pain or founder fantasy? |
| R1 Plan fit | 25% | Correct tier (Starter/Pro/Growth)? |
| R2 Activation | 20% | Drives first real booking? |
| R3 Scope | 15% | Minimal shippable slice? |
| R4 Cannibalization | 10% | Hurts core booking UX? |

### dinaya-cfo

| Round | Weight | Question |
|-------|--------|----------|
| R0 Unit economics | 35% | Positive margin per tenant at median usage? |
| R1 Pricing psychology | 25% | LKR price points sane for SL SMEs? |
| R2 Variable cost | 25% | WhatsApp/SMS/PayHere cost covered? |
| R3 Expansion revenue | 15% | Upsell path clear? |

### dinaya-head-of-growth

| Round | Weight | Question |
|-------|--------|----------|
| R0 Channel | 30% | Instagram/WhatsApp/in-person — realistic? |
| R1 Proof | 25% | Produces public case study or booking proof? |
| R2 Density | 25% | Adds businesses in same geographic cluster? |
| R3 CAC | 20% | Founder-time efficient? |

### dinaya-head-of-sales

| Round | Weight | Question |
|-------|--------|----------|
| R0 Hook | 30% | Opens with pain (DMs, no-shows) not features? |
| R1 Objections | 30% | Handles WhatsApp/payment/setup objections? |
| R2 Close | 25% | Clear next step (free setup call)? |
| R3 Local | 15% | Feels Sri Lankan, not Silicon Valley? |

---

## 8. Brand skills — "Dinaya look" detail

### dinaya-brand-voice

**Audits:**
- Banned phrases list (from launch research): "AI platform", "all-in-one SaaS", "guaranteed X%", "dinaya.app"
- Required anchors: `dinaya.lk`, LKR, PayHere, WhatsApp complement
- CTA canon: "Create your booking page", "Start free trial", "Get free setup"
- Plan language: Starter / Pro / Growth (not "max" in customer copy)

**Output:** Line-by-line copy edits + brand score /100

### dinaya-visual-system

**Audits:**
- Primary cobalt `#2563eb` — not random blues
- Accent palette: violet engagement, amber booking pending, emerald confirmed
- **No pink/rose** on booking surfaces
- `font-cal` headings, Inter body, ≥16px inputs on mobile
- Logo: spiral mark, "Powered by Dinaya.lk" footer rules
- Dark mode: rebuilt hierarchy not inverted light

**Companion:** `TOKENS.md` — grep patterns for violations (reuse apple-design-head token scan)

**Handoff:** Visual ITERATE → `apple-design-head` for full UI ship review

---

## 9. Hub skill routing table (dinaya-hub)

```markdown
| User intent | Skill |
|-------------|-------|
| Strategy, pivot, focus, "should we build X" | dinaya-ceo |
| Feature priority, roadmap, MVP scope | dinaya-cpo |
| Architecture, schema, scale, tech debt | dinaya-cto |
| Pricing, margins, unit economics | dinaya-cfo |
| Launch, first 100 customers, growth loops | dinaya-head-of-growth |
| Salon outreach, pitch, objections | dinaya-head-of-sales |
| Copy, positioning, landing page text | dinaya-brand-voice |
| Colors, typography, UI tokens | dinaya-visual-system |
| UI ship review, accessibility | apple-design-head |
| Booking page, slots, availability | dinaya-booking-engine |
| PayHere, payments, webhooks | dinaya-payhere |
| Database migration | dinaya-migrations |
| API routes, cron, v1 keys | dinaya-api-auth |
| Plan limits, ProGate | dinaya-plan-gating |
| WhatsApp, SMS, email | dinaya-messaging |
| Events, ticketing | dinaya-events |
| Voice receptionist API | dinaya-voice-api |
| Security audit | dinaya-security-review |
| PR ready to merge? | dinaya-pr-ship-review |
| Social/content/marketing copy | dinaya-content-review |
| Multi-step parallel work | dag-task-runner |
```

---

## 10. Phased build order

### Phase 0 — Foundation (do first)
- [ ] Write `_shared/*.md` (6 files) from brand inventory agent output
- [ ] Create `dinaya-hub/SKILL.md`
- [ ] Patch `apple-design-head/DISCOVERY.md` with Dinaya-specific paths

### Phase 1 — Brand (unlock all other skills)
- [ ] `dinaya-brand-voice` + RUBRIC.md
- [ ] `dinaya-visual-system` + TOKENS.md
- [ ] Test both against landing page + booking hub

### Phase 2 — Executive pack (6 skills)
- [ ] Spawn 6 research agents (batch B) in parallel
- [ ] Author 6 SKILL.md files + RUBRIC.md each
- [ ] Test: run CEO + CPO on "events ticketing" decision — scores should align with events master plan

### Phase 3 — Engineering pack (8 skills)
- [ ] Spawn 6+2 research agents (batch C)
- [ ] Author skills with `paths` frontmatter
- [ ] Mirror content from `.cursor/rules/*.mdc` — skills add workflow, rules stay always-on

### Phase 4 — Review pack (3 skills)
- [ ] Security, PR ship, content review skills
- [ ] Cross-link to executive + brand skills

### Phase 5 — Polish
- [ ] Generate COMPLETE.md for each executive skill
- [ ] Add `metadata.pack: dinaya` to all frontmatter
- [ ] Document in AGENTS.md under "Cursor skills"
- [ ] Optional: `.cursor/skills/README.md` pack index

---

## 11. What we already have vs what agents will research

| Already done | Agent still researches |
|--------------|------------------------|
| Brand inventory (voice, colors, competitors) | Per-skill rubrics + trigger phrases |
| apple-design-head full protocol | Dinaya-specific DISCOVERY rows |
| dag-task-runner orchestration | Hub routing only |
| .cursor/rules (stack, API, migrations) | Engineering skill workflows |
| Events master plan | dinaya-events skill brief |
| Messaging master plan | dinaya-messaging skill brief |
| Launch research 2026 | head-of-growth + head-of-sales briefs |

---

## 12. Limits and guardrails

| Topic | Guidance |
|-------|----------|
| **Skill count** | 20 new + 2 existing = 22. No hard Cursor limit; Twilio ships 55. Avoid overlap in descriptions. |
| **Description length** | 150–400 chars; max 1024. Must include what + when + keywords. |
| **SKILL.md length** | Target <400 lines; split to RUBRIC/PATTERNS if longer |
| **name** | Must match folder; lowercase `dinaya-*` |
| **Production boundary** | Skills are dev-only; never reference `@cursor/sdk` in `src/app/` |
| **Tenant AI** | Skills guide dev agents; product AI stays `src/lib/ai/` |
| **disable-model-invocation** | Only for `dag-task-runner` (expensive); keep executive skills auto-invokable |

---

## 13. Success criteria for the pack

| Metric | Target |
|--------|--------|
| Skills authored | 20/20 |
| `_shared` files | 6/6 |
| Each skill passes 3 scenario tests at SHIP (≥85) | 100% |
| Hub routes correctly in manual tests | 10/10 intent queries |
| Zero description collisions (wrong skill triggered) | <5% in spot checks |
| AGENTS.md updated | Yes |
| Executive skills align on events ticketing decision | CEO + CPO + CFO same verdict |

---

## 14. Immediate next action

**When ready to build**, run in this order:

1. **Phase 0** — Author `_shared/*.md` + `dinaya-hub` (no research agents needed; brand inventory done)
2. **Spawn Batch A agents** (4) — hub validation + brand skill briefs
3. **Spawn Batch B** (6) — executive briefs in parallel
4. **Author Phase 1–2 skills** from briefs
5. **Spawn Batch C + D** (11) — engineering + review briefs
6. **Author remaining skills**
7. **Pack integration test** — ask "should we launch events?" and verify CEO → CPO → dinaya-events → apple-design-head chain

---

## References

- Pattern skill: `.cursor/skills/apple-design-head/`
- Orchestration: `.cursor/skills/dag-task-runner/`
- Brand source: `docs/launch-research-2026/`, `src/lib/marketing-copy.ts`, `src/lib/booking-hub-brand.ts`
- Events context: `docs/superpowers/plans/2026-06-22-events-ticketing-master-plan.md`
- Cursor skills spec: [agentskills.io](https://agentskills.io/specification)
