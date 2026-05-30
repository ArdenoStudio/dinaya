# Dinaya MCP

Dinaya includes a dedicated MCP server at `apps/mcp-dinaya/server.mjs` for domain-aware coding and audits.

## Start

From repo root:

```bash
npm run mcp:dinaya
```

Quick sanity check:

```bash
npm run mcp:dinaya:self-test
```

## Tooling surface

- `workspace_summary`: repository-level health snapshot.
- `list_api_routes`, `audit_api_auth`, `audit_cron_security`: auth convention and protection checks.
- `list_server_page_guards`: `requireBusiness` / `requireOwner` coverage view.
- `plan_feature_matrix`, `find_feature_usage`: feature-plan and gate inspection.
- `db_schema_overview`, `list_migrations`, `audit_schema_migrations`: schema/migration introspection.
- `list_workflows`: scheduled workflow map.
- `check_env_readiness`: `.env.example` vs `.env.local` key readiness (keys only).
- `search_code`, `read_file`: repo exploration.
- `run_project_script`: allowlisted `npm run` execution.
- `create_migration_stub`, `scaffold_api_route`: safe scaffolding helpers.

## Resources and prompts

Resources:

- `dinaya://overview`
- `dinaya://auth-conventions`
- `dinaya://file/{path}`

Prompts:

- `dinaya-api-route-review`
- `dinaya-migration-checklist`
- `dinaya-feature-gate-check`

## MCP client config example

```json
{
  "mcpServers": {
    "dinaya": {
      "command": "npm",
      "args": ["run", "mcp:dinaya"],
      "cwd": "/absolute/path/to/Dinaya"
    }
  }
}
```

## Security model

- The server is repo-local and stdin/stdout based.
- It does not expose secret values from environment files.
- Protected route checks are convention-based static analysis, not runtime auth guarantees.
