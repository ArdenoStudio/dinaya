# Fix–Score Loop

```
AUDIT → FIX (P0 then P1) → RE-SCORE → gate
```

## Gate
**SHIP** when overall **≥93** and **P0 = 0** (≤2 P1 with owners OK).

## Limits
- **Max 3** full iterations.
- New P0 from a fix → revert that fix, recount iteration.
- After 3 without SHIP → **STOP** with blocker list.

## Anti-thrash
1. Prefer monotonic score; drop &gt;3 pts → undo last fix set.
2. Max 2 attempts per finding ID.
3. Scope lock: only listed P0/P1.
4. Same rubric every re-score.
5. Cite ±pts and closed findings each iteration.

## Output
`Iteration n/3 · Score · P0/P1/P2 · Verdict SHIP|ITERATE|STOP`
