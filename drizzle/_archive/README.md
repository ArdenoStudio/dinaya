# Drizzle Migrations Archive

This folder is for **deprecated or superseded migrations and snapshots** that
we want to keep for historical reference but should never run again.

Drizzle-kit ignores it because the folder name doesn't match its `NNNN_*.sql`
pattern, so nothing here will be picked up by `drizzle-kit generate` or
`drizzle-kit migrate`.

## Convention

Each archived artifact gets its own dated subfolder:

```
_archive/
  YYYY-MM-<short-slug>/
    README.md            ← why it was archived + what replaced it
    <original-files>     ← exact files as they existed at archive time
```

The folder slug should be short and obvious in `git log`:

- `2026-05-deprecated-migrations` — stale numbered migrations replaced by a re-sequenced set
- `2026-08-dodo-payment-stub` — old payment provider integration before the PayHere migration

## When to archive (vs delete)

**Archive** anything that:
- Was applied to a real database (even briefly) — the SQL is a historical record of what your schema once looked like
- Documented a decision or workflow that future contributors might wonder about
- Was non-trivial work even if it never shipped

**Delete outright** anything that:
- Is a build artifact regeneratable from source (e.g. `meta/_journal.json`)
- Never ran anywhere and contains no information you couldn't reconstruct from the schema

When in doubt, archive. Disk is cheap; lost context isn't.
