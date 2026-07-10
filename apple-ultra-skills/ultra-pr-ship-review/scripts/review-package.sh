#!/usr/bin/env bash
# Usage: review-package.sh BASE HEAD [OUTFILE]
# Writes git log + diff for subagent review. Default: .ultra-ship/review-<base7>..<head7>.diff
set -euo pipefail

BASE="${1:?usage: review-package.sh BASE HEAD [OUTFILE]}"
HEAD="${2:?usage: review-package.sh BASE HEAD [OUTFILE]}"
BASE_SHORT="${BASE:0:7}"
HEAD_SHORT="${HEAD:0:7}"
OUT="${3:-.ultra-ship/review-${BASE_SHORT}..${HEAD_SHORT}.diff}"

mkdir -p "$(dirname "$OUT")"

{
  echo "# Review package"
  echo "# Base: $BASE"
  echo "# Head: $HEAD"
  echo "# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo
  echo "## Commits"
  git log --oneline "${BASE}..${HEAD}" 2>/dev/null || true
  echo
  echo "## Diff stat"
  git diff --stat "${BASE}..${HEAD}" 2>/dev/null || true
  echo
  echo "## Diff"
  git diff -U10 "${BASE}..${HEAD}" 2>/dev/null || true
} > "$OUT"

BYTES=$(wc -c < "$OUT" | tr -d ' ')
COMMITS=$(git rev-list --count "${BASE}..${HEAD}" 2>/dev/null || echo 0)
echo "wrote ${OUT}: ${COMMITS} commits, ${BYTES} bytes"
