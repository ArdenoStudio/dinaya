# Competitive Research — Apple Ultra Skills

Local clones of competitor skill packs for gap analysis. **Do not commit clones to git** — run the commands below to reproduce.

## Clone all competitors

```bash
cd apple-ultra-skills/competitive-research
git clone --depth 1 https://github.com/laith-wallace/crisp.git
git clone --depth 1 https://github.com/dickwu/apple-design-skill.git
git clone --depth 1 https://github.com/justinwetch/HIGAgentSkills.git
git clone --depth 1 https://github.com/spencerpauly/awesome-cursor-skills.git
git clone --depth 1 https://github.com/vercel-labs/agent-skills.git
git clone --depth 1 https://github.com/alirezarezvani/claude-skills.git
git clone --depth 1 https://github.com/obra/superpowers.git
git clone --depth 1 https://github.com/charlieviettq/awesome-agent-skill.git
```

## Additional repos to study

| Repo | Why |
|------|-----|
| [vercel-labs/skills](https://github.com/vercel-labs/skills) | Official `npx skills` CLI + skills.sh |
| [anthropics/skills](https://github.com/anthropics/skills) | Canonical spec + skill-creator |
| [agentskills/agentskills](https://github.com/agentskills/agentskills) | agentskills.io open spec |
| [cursor/cookbook](https://github.com/cursor/cookbook) | dag-task-runner source |
| [getsentry/skills](https://github.com/getsentry/skills) | skill-scanner security audit |

## Synthesis

See [IMPROVEMENTS.md](./IMPROVEMENTS.md) for consolidated findings from 10+ research agents (GitHub + Reddit + file-level competitor analysis).

## Research method

- **5 parallel sub-agents** — GitHub packs, Reddit discourse, design competitors, review rubrics, architecture patterns
- **8 repos cloned** — crisp, apple-design-skill, HIGAgentSkills, awesome-cursor-skills, agent-skills, claude-skills, superpowers, awesome-agent-skill
- **Conclusion:** No public pack matches Apple Ultra's integrated hub + _shared + scored review + exec personas + component discovery. Gaps are distribution (npx skills), onboarding (.ultra.md), evals, and parallel review lenses.
