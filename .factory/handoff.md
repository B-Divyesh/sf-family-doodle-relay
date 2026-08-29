# Verification handoff — FAIL

Candidate `50ab575d393746e48b730dac0a52ad029ffdad3b` was independently verified on 29 August 2026 against <https://family-doodle-relay.sociobot.in>.

**FAIL — do not release.** The deployed core room flow is unreliable because production serves at least two independent SQLite room stores. This is fresh evidence at the exact candidate SHA, not a stale deployment result.

## Release blockers

- **Critical:** three fresh rooms each returned three authenticated `200` and three false `404` responses across six independent connections. Three consecutive landing-page join trials failed to reach a connected room; the instrumented join returned 404. A concurrent join probe returned 1 success, 3 legitimate conflicts, and 8 false room-not-found responses.
- **High:** the source allowance is 20 requests per client per second, but live API and page bursts each allowed 40 before 429 because limits are instance-local. Live 429s do include `Retry-After: 1`. The separate Sociobot verify endpoint allowed 30 and returned `Retry-After: 4` after that.
- **High:** `.factory/claims.json` omits claim-like README/privacy promises about runtime configuration, health identity, live-control preservation, browser storage, and singleton deployment. The last is false live.

All sampled health responses report `50ab575d393746e48b730dac0a52ad029ffdad3b`, and local/live HTML, JavaScript, CSS, and service-worker hashes match. The README's claimed singleton configuration is not true of observed request routing.

## Verification summary

- First-read and one-click demo gates: PASS.
- Claims: all nine exact local commands PASS after `npm ci`; `live-relay` is false in production because cross-connection rooms intermittently disappear.
- Full local gate: 11/11 Playwright tests and 4/4 Rust tests passed; typecheck, rustfmt, Clippy with warnings denied, npm audit, candidate-stamped release build, and exact frontend build passed.
- One lucky live two-browser session completed all four turns and downloaded the complete PNG. This does not cure the repeatable 50% cross-connection 404 rate.
- Privacy request log, headers, offline demo reload, keyboard/focus, reduced motion, 390 px layout, touch targets, axe, and bundle budgets passed.
- Fresh mobile Lighthouse: 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.5 s, TBT 70 ms, CLS 0.
- Docker execution was unavailable because no Docker-compatible engine is installed; its build stages and no-extra-config runtime were exercised independently.

Detailed evidence and reproduction commands are in `.factory/verification-3.md` and `.factory/verification-evidence/`. Product code was not modified.

## Required next step

Use a shared ephemeral TTL store and shared rate limiter, or enforce and prove one durable room owner across revisions and all HTTP/WebSocket requests. Add or remove the unlisted claims. Redeploy, then rerun independent connection create/read/join/reconnect, a full four-turn relay, host disconnect, and the 20-request allowance check.
