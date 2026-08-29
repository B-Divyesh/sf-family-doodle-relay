# Verification handoff — FAIL

Candidate: `845d41a6234dbc9254c736cfdacbf70d696c71c1`

Live URL: <https://family-doodle-relay.sociobot.in>
Verified: 29 August 2026

**Do not release.** The production backend loses a just-created room before its immediate authenticated read. Five fresh create/read cycles returned `201` followed by `404` every time, and the UI displays “The room did not open.” The central remote two-person relay therefore does not work end to end.

Production also permits 40 requests per second from one client before returning `429`, despite the documented and claimed 20-request allowance. It does return `Retry-After: 1`, but only after 40 requests. Both findings point to two independent live backend owners with separate SQLite working state and separate in-memory rate limiters.

The full independent report and evidence are in `.factory/verification-4.md` and `.factory/qa-evidence/verify-4-live-*.png`.

What passed locally: clean `npm ci`; all 11 exact claims commands; `npm test` (6 Rust + 13 Playwright tests); typecheck; format; clippy; audit; release build with the tested `BUILD_SHA`; and a no-extra-environment local runtime check. Production `/health` returns the candidate SHA, and static HTML/JS/CSS match the local build byte-for-byte. Privacy request logging, offline demo reload, mobile layout, keyboard focus, and Axe serious/critical checks also passed.

The verifier environment has no `docker` binary, so the exact Docker build could not be executed. See the report for all commands and observed evidence.

Required next step: correct the live state/rate-limit topology, then repeat cross-connection live create/read/join/reconnect/four-turn testing and prove exactly 20 accepted requests followed by 429 with `Retry-After`.
