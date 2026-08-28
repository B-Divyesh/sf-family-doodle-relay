# Independent verification handoff — FAIL

Candidate `746fcede22c04d0499dec0f70318a148e1838c22` was independently tested on 28 August 2026 against `https://family-doodle-relay.sociobot.in`.

## Result

**FAIL — not releasable.** The live deployment matches the candidate, but the core private relay is broken across multiple replicas. A browser room creation returned `201`, then its immediate authenticated room read returned `404`. Repeated API sampling alternated `200/404`, and seven of eight join attempts failed because rooms live only in one process.

Other release blockers:

- Unauthenticated `{"paid":true}` creates an eight-turn room without any license.
- The production Sociobot checkout link returns `404`, so the advertised $6 edition cannot be purchased.
- Four-hour expiry is not enforced on read, join, or WebSocket access; pruning happens only when another room is created.
- Caller-controlled `X-Forwarded-For` bypasses the live rate limiter.
- Existing claim tests pass while failing to prove license validity, actual expiry, checkout availability, or complete PNG content.

The complete defect list, severities, evidence, commands, and remediation requirements are in `.factory/verification.md`. Screenshots, claim logs, Lighthouse output, and verifier output are in `.factory/qa-evidence/`.

## Verification summary

- First-read/demo gate: PASS.
- All nine exact claim commands after `npm ci`: PASS, with the semantic test gaps above.
- `npm test`: PASS (2 Rust + 10 Playwright).
- `npm run build`: PASS; `dist/` produced.
- `cargo build --release`: PASS.
- `cargo clippy --all-targets -- -D warnings`: PASS.
- `npx tsc -p frontend/tsconfig.json --noEmit`: **FAIL** at `frontend/src/main.ts:199`.
- `npm audit --audit-level=high`: PASS, zero vulnerabilities.
- Live candidate identity: PASS; `/health` returns `746fcede22c04d0499dec0f70318a148e1838c22`, and built asset hashes match.
- Live end-to-end two-person relay: **FAIL** at room reopen/join.
- Product API rate limit: 40 allowed, then 429 with `Retry-After: 1`; spoofed forwarded addresses bypass it.
- Sociobot verify rate limit: 30 of 60 allowed, 30 returned 429 with `Retry-After: 4`.
- Axe serious/critical: zero on tested routes.
- Mobile Lighthouse: 99 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.5 s, TBT 110 ms, CLS 0.
- Demo privacy and offline reload: PASS.
- Docker execution: not run because no container engine is installed; component production builds passed.

## Next step

Repair the blockers in `.factory/verification.md`, deploy the shared-room/billing changes, and perform a new independent live verification. Do not treat the current failure as deployment-only: the candidate's in-process room architecture is incompatible with the deployed multi-replica service.
