# Apple Ultra Skills — Competitive Research Synthesis

**Date:** 2026-06-27  
**Method:** 10+ parallel research agents (GitHub, Reddit, file-level competitor analysis)  
**Repos studied:** crisp, apple-design-skill, HIGAgentSkills, awesome-cursor-skills, agent-skills (Vercel), claude-skills, superpowers, awesome-agent-skill

---

## Executive summary

**No public skill pack matches Apple Ultra's integrated architecture.** Competitors excel in single dimensions (CRISP design, Superpowers TDD workflow, Vercel live guidelines, HIGAgentSkills corpus maintenance) but none combine:

- Hub router (`apple-hub`)
- Six-file shared context (`_shared/`)
- Executive + GTM + engineering + design personas
- Weighted 5-round review protocol with P0–P3 and SHIP/ITERATE/REJECT
- Component discovery chain (registry → visual → design head)

Apple Ultra is **ahead on integrated product craft**. The biggest gaps vs community expectations are **trigger engineering** (pushy descriptions), **eval fixtures**, **project onboarding** (`.ultra.md`), and **distribution** (`npx skills`, plugin.json, CI validation).

---

## Where Apple Ultra is ahead

| Advantage | vs competitors |
|-----------|----------------|
| Unified product pack | Most repos are design-only OR eng-only OR exec-only |
| `apple-design-head` depth | 5-round weighted protocol, discovery, token scans, test matrix — deeper than CRISP quick scan or single-file apple-design-skill |
| `ultra-component-discovery` | No competitor ships registry routing (21st, Aceternity, shadcn, Tremor) wired into visual → design chain |
| `_shared/` six-file model | Broader than CRISP's `.crisp.md` (design-only) |
| Consistent review protocol | Shared P0–P3, A–D grades across design + PR + security + content |
| Domain engineering skills | scheduling, payments, plan-gating — product-shaped, not generic |
| Design + ship gate chain | component-discovery → visual-system → apple-design-head → ultra-pr-ship-review |

---

## Top 10 improvements (prioritized)

### P0 — Ship next

| # | Improvement | Borrow from | Status |
|---|-------------|-------------|--------|
| 1 | **Pushy `description` fields** on all 23 skills — literal user trigger phrases | Reddit consensus, skill-creator docs | TODO |
| 2 | **`ultra-pr-ship-review` rubric pack** — RUBRIC.md, blockers.md, evals.json, subagent prompt | superpowers + apple-design-head | **DONE** |
| 3 | **`.ultra.md` project onboarding** — interview → project context file all skills read | CRISP `crisp-teach` / `.crisp.md` | TODO |
| 4 | **`apple-hub` fallback** — route when auto-trigger fails; list skills on vague prompts | Reddit pain point #1 | Partial |

### P1 — High impact

| # | Improvement | Borrow from |
|---|-------------|-------------|
| 5 | **HIG reference LOOKUP.md** — load 3–8 files per review, never whole corpus | apple-design-skill, HIGAgentSkills |
| 6 | **AI slop pre-gate** in apple-design-head Round 0 | CRISP crisp-review |
| 7 | **Parallel review lenses** — security/perf/correctness subagents for large PRs | awesome-cursor-skills |
| 8 | **evals/evals.json** per critical skill (design-head, security, pr-ship) | claude-skills pipeline |
| 9 | **Distribution toolchain** — plugin.json, validate-skills.py, bundles.json | awesome-agent-skill, superpowers |
| 10 | **HANDOFF.md + A11Y.md** modes for apple-design-head | CRISP handoff + crisp-a11y |

### P2 — Differentiators

| # | Improvement | Borrow from |
|---|-------------|-------------|
| 11 | **FUNNEL-KIT.md** for marketing block assembly | CRISP funnel kit |
| 12 | **Live guideline fetch** for web review paths | Vercel web-design-guidelines |
| 13 | **TDD for skills** — pressure scenarios before adding new skills | superpowers writing-skills |
| 14 | **Multi-platform sync script** — one source → .cursor, .claude, .agents | CRISP sync.mjs, claude-skills |
| 15 | **Quick scan mode** — A–F grade, top 3 issues | CRISP crisp-review |

---

## Competitor pattern matrix

| Pattern | CRISP | superpowers | Vercel | HIGAgentSkills | Apple Ultra |
|---------|-------|-------------|--------|----------------|-------------|
| Project context file | `.crisp.md` | — | — | — | `_shared/` (pack-level only) |
| Scored review | A–F + P0–P3 | Critical/Important/Minor | Rule severity | — | 0–100 + weighted rounds |
| Subagent dispatch | — | code-reviewer.md | — | — | **NEW** ship-reviewer-prompt |
| evals.json | — | — | — | — | **NEW** pr-ship-review |
| Reference routing | — | — | Live URL fetch | routing-index.md | Inline (needs LOOKUP) |
| Hub router | — | using-superpowers | skills.sh | — | apple-hub |
| Plugin install | — | plugin.json | npx skills | — | — |
| Component sourcing | — | — | shadcn MCP | — | ultra-component-discovery |

---

## Reddit / community consensus (2025–2026)

### Skills vs .cursorrules — coexist, don't replace

| Layer | Use for |
|-------|---------|
| `AGENTS.md` | Cross-tool project truth |
| `.cursor/rules/*.mdc` | Always-on guardrails, globs |
| `.cursor/skills/` | On-demand multi-step workflows |
| MCP | External system access |

### Top pain points

1. **Auto-invocation unreliable** — descriptions are the product; spend 80% effort on triggers
2. **Bloated SKILL.md** — keep <500 lines; push detail to `references/`
3. **Duplication drift** — same rule in rules + skills + AGENTS.md causes conflicts
4. **Marketplace spam** — treat third-party skills like unvetted npm packages
5. **No eval harness** — teams want `evals.json` + CI gate

### Best packs cited

| Pack | Why |
|------|-----|
| obra/superpowers | TDD, planning, subagent dispatch (~220K stars) |
| anthropics/skills | Official reference, skill-creator |
| vercel-labs/agent-skills | skills.sh registry, web-design-guidelines |
| laith-wallace/crisp | Design intelligence, `.crisp.md` onboarding |
| Ozzeron/prompt-pack | Anti-bloat: 23 curated skills |

---

## Skill-specific recommendations

### apple-design-head

- Add `.ultra.md` load step (project context)
- Add `references/LOOKUP.md` — topic → HIG file map (3–8 files max)
- Add modes: **Quick scan**, **A11y deep**, **Handoff**
- Add AI slop disqualifier in Round 0
- Append review History to `.ultra.md`

### ultra-visual-system

- Read `.ultra.md` Named Rules + Register (Brand vs Product)
- Add `A11Y-VISUAL.md` for token-level contrast checks
- Add `LOOKUP.md` for color/typography/motion topics

### ultra-component-discovery

- Read `.ultra.md` anti-references for ranking penalty
- Add `FUNNEL-KIT.md` for marketing section assembly
- Add handoff seed in every Source/Implement output
- Expand a11y pre-install gate (reject div-buttons)

### ultra-pr-ship-review

- **Implemented:** RUBRIC.md, references/blockers.md, evals/evals.json, agents/ship-reviewer-prompt.md, scripts/review-package.sh
- Add `.ultra-ship.md` project ledger (History pattern from CRISP)
- Parallel specialists for API/migration/plan-gating on large PRs

### apple-hub

- Add `skillhub recommend` style intent matching (awesome-agent-skill)
- Bundle install: design-only, ship-ready, executive subsets
- Session bootstrap: invoke hub when user is unsure which skill

### New skill: ultra-teach

- Interview → write `.ultra.md` (Register, Named Rules, benchmarks, History)
- Validates/fills `_shared/` templates for the project
- Run once per repo; all downstream skills auto-read context

---

## Distribution roadmap

```
apple-ultra-skills/
├── registry/
│   ├── skills.json      # skill manifest + triggers
│   ├── bundles.json     # design-only, ship-ready, executive
│   └── validate-skills.py
├── .cursor-plugin/
│   └── plugin.json      # marketplace install
└── scripts/
    └── sync-platforms.mjs  # .cursor → .claude → .agents
```

---

## Research agents spawned

| Agent | Focus | Key output |
|-------|-------|------------|
| GitHub agent skills | Repo discovery + patterns | 10 repos to clone, TOP_5_IMPROVEMENTS |
| Reddit discourse | Community consensus | Skills vs rules, pain points, trigger engineering |
| Design competitors | CRISP, apple-design-skill, HIG | LOOKUP, HANDOFF, A11Y, FUNNEL-KIT file specs |
| Review rubrics | superpowers, claude-skills evals | RUBRIC.md structure, blockers catalog, subagent template |
| Architecture | awesome-agent-skill, gstack | validate-skills.py, bundles, artifact chaining |

---

## Next implementation sprint

1. `ultra-teach` skill + `.ultra.md` example schema
2. Pushy descriptions pass on all 23 SKILL.md files
3. `apple-design-head/references/LOOKUP.md` + quick scan mode
4. `registry/` + `validate-skills.py`
5. evals for `apple-design-head` and `ultra-security-review`
