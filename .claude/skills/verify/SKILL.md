---
name: verify
description: Run the fast verification gate (typecheck, sim tests, production build) and report a one-line summary per step. Use before committing, after any change to src/, or when asked to "verify", "check", or "is it green".
---

# verify

Run these in order and stop at the first failure:

1. `npm run typecheck`
2. `npm test`
3. `npm run build`

Report a short table with one row per step: pass/fail plus the first error line.
On a failure, show only the relevant error lines, not the full output.
Optional, slower: `npm run e2e` (needs a build, runs the Playwright smoke test against `vite preview`).
