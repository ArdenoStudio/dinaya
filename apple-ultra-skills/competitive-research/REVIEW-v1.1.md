# Competitive Re-Review — Apple Ultra Skills v1.1

**Date:** 2026-06-27  
**Pack version:** 1.1.0 (24 skills)  
**Compared against:** CRISP, superpowers, Vercel agent-skills, apple-design-skill, HIGAgentSkills, claude-skills, awesome-cursor-skills, awesome-agent-skill

---

## Verdict: Apple Ultra is ahead on integration; now competitive on distribution primitives

After sprint v1.1, Apple Ultra Skills closes the main gaps identified in the first research pass while retaining advantages no competitor matches.

---

## Scorecard vs competitors

| Capability | CRISP | superpowers | Vercel | apple-design-skill | Apple Ultra v1.1 |
|------------|-------|-------------|--------|-------------------|------------------|
| Project onboarding file | `.crisp.md` ✅ | — | — | — | `.ultra.md` + `ultra-teach` ✅ |
| Pushy trigger descriptions | Partial | Partial | ✅ skills.sh | ✅ | ✅ all 24 skills |
| Scored ship review | A–F + P0–P3 | Critical/Minor | Rule severity | — | 0–100 + weighted rounds ✅ |
| Engineering PR gate | — | ✅ subagent | — | — | ✅ RUBRIC + blockers + evals |
| Design review depth | Good | — | Guidelines list | HIG refs | 5-round + slop gate + LOOKUP ✅ |
| Component sourcing | — | — | shadcn MCP | — | ultra-component-discovery ✅ |
| Executive personas | — | — | — | — | CEO/CPO/CTO/CFO + GTM ✅ |
| evals.json regression | — | — | — | — | ✅ design-head, security, pr-ship |
| Plugin install | — | ✅ plugin.json | ✅ npx skills | — | ✅ plugin.json |
| CI validation | — | — | — | — | ✅ validate-skills.py |
| Hub router | — | bootstrap skill | skills.sh | — | apple-hub + registry ✅ |
| Parallel review lenses | — | ✅ code review | — | — | pr-ship subagent; security parallel TBD |
| HIG corpus maintenance | — | — | — | — | LOOKUP routing ✅; crawl pipeline ❌ |
| Multi-platform sync | ✅ sync.mjs | ✅ | ✅ | — | ❌ (future) |
| TDD for skills | — | ✅ writing-skills | — | — | ❌ (future) |

**Legend:** ✅ implemented · Partial · ❌ not yet · — not in scope for that pack

---

## Where Apple Ultra v1.1 beats each competitor

### vs CRISP (laith-wallace/crisp)
- **Still ahead:** Executive + engineering + GTM skills; component discovery; deeper weighted review protocol
- **Now at parity:** `.ultra.md` onboarding (`ultra-teach`), AI slop pre-gate, quick scan mode
- **CRISP still wins:** `/crisp-funnel` section library, `/crisp-copy` microcopy specialist, multi-platform sync script

### vs superpowers (obra/superpowers)
- **Still ahead:** Design craft, brand, domain engineering (booking, payments, plan gating)
- **Now at parity:** Subagent dispatch for PR review, plugin.json, evals pattern
- **Superpowers still wins:** TDD-for-skills (`writing-skills`), subagent-driven development workflow, 220K-star community adoption

### vs Vercel agent-skills
- **Still ahead:** Integrated pack, executive personas, scored review gates
- **Vercel still wins:** Live URL guideline fetch, `npx skills` official CLI integration, skills.sh telemetry

### vs apple-design-skill (dickwu)
- **Now at parity:** Reference LOOKUP routing, platform translation table in LOOKUP.md
- **Still ahead:** 5-round weighted protocol, slop gate, component discovery chain, `.ultra.md` context
- **apple-design-skill still wins:** Bundled `references/hig/*.md` corpus files (we route but don't vendor full HIG)

### vs HIGAgentSkills
- **Still ahead:** Web-first review workflow, integration with visual-system and pr-ship
- **HIGAgentSkills still wins:** Automated HIG crawl/validate pipeline, tier-1 corpus freshness

### vs claude-skills (alirezarezvani)
- **Still ahead:** Focused 24-skill pack vs 678-file tree; product-shaped engineering skills
- **Now at parity:** evals.json on critical review skills
- **claude-skills still wins:** 13-platform sync, C-suite breadth (28 advisors), stdlib Python calculators

### vs awesome-agent-skill
- **Now at parity:** Registry JSON, bundles, validate-skills.py
- **awesome-agent-skill still wins:** skillhub recommend engine, generated quality scores, content conformance V2 spec

---

## Remaining gaps (v1.2 candidates)

| Gap | Priority | Effort |
|-----|----------|--------|
| `HANDOFF.md` + `A11Y.md` dedicated modes for apple-design-head | P1 | Medium |
| `FUNNEL-KIT.md` for marketing block assembly | P2 | Medium |
| Parallel security/perf/correctness lenses (awesome-cursor-skills pattern) | P1 | Low |
| Multi-platform sync script (CRISP sync.mjs) | P2 | Medium |
| Vendor `references/hig/*.md` subset or submodule | P2 | High |
| `writing-skills` TDD pattern for pack evolution | P2 | Medium |
| `npx skills add` publish to standalone repo | P1 | Low (ops) |

---

## Bottom line

**Apple Ultra Skills v1.1 is the most integrated product-team skill pack publicly available** — no competitor combines hub routing, project onboarding, design chain, executive personas, domain engineering, and scored dual gates (design + PR) in one coherent pack with CI validation and eval fixtures.

For **pure design intelligence**, CRISP remains excellent but narrower. For **engineering workflow**, superpowers remains the community default. For **distribution**, Vercel/skills.sh leads.

**Apple Ultra's moat:** the documented chains (`teach → discover → visual → design-head → pr-ship`) and domain depth for scheduling/SaaS products — not individual skill count.

**Recommendation:** Publish as standalone repo (`Cookie-Cat21/apple-ultra-skills` or similar) with `npx skills add` for adoption outside Dinaya.
