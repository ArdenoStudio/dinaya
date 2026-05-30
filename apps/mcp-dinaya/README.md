# Dinaya MCP Server

Repository-aware Model Context Protocol server for the Dinaya codebase.

## What it includes

- Route/auth convention analyzers for `/api/cron`, `/api/dashboard`, and `/api/v1`.
- Plan gating and feature usage introspection (`src/lib/plan.ts`).
- Drizzle schema + migration audits and stub migration generation.
- Secure env readiness checks (keys only, never values).
- Search/read tools for fast repository navigation.
- Route scaffolding helpers that follow Dinaya auth patterns.

## Run locally

From repo root:

```bash
npm run mcp:dinaya
```

Self-test (no transport):

```bash
npm run mcp:dinaya:self-test
```

## Dinaya-specific notes

- The MCP server only reads `.env` keys; it does not return secret values.
- `run_project_script` is intentionally allowlisted to safe project scripts.
- `scaffold_api_route` templates align with conventions in `AGENTS.md`.
