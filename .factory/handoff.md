# Family Doodle Relay — polish round 3 handoff

## Result

All findings in reviews 1–3 are repaired in the repository. The repair preserves the hand-drawn relay visual system and the Rust/SQLite container architecture. The exact finding map is in [`.factory/polish-3.md`](polish-3.md).

Repair commit: `cba8f0f72607b143a8183c6aa393f8047327636c` (documentation evidence is committed separately).

## What changed

- Added behavioral claim coverage for the $6 one-time checkout, merchant of record, license data flow, refunded licenses, and SQLite room fields.
- Stored host and guest access keys as SHA-256 digests. Existing plaintext rows migrate in place without invalidating browser credentials.
- Listed all 19 user-reliant claims and enforced one dedicated test per claim ID.
- Disclosed every SQLite room field and the exact optional license-verification flow.
- Removed the dead verification link and rewrote checkout, refund, deployment, demo, and claim-command wording in plain language.
- Kept one-click isolated `/?demo=1` and `/demo`, its persistent banner, reset, exit, separate in-memory sample state, and zero room-API writes.
- Bumped the release and service-worker cache to 1.0.3/v4.

## Verification

All local gates passed on 30 August 2026:

- `npm test`: Vite production build, TypeScript, 9 Rust tests, claim-manifest validation, 18 deployment-contract tests, and 24 Chromium tests.
- `npm run lint`, `npm run build`, and `git diff --check`: pass.
- Every literal `.factory/claims.json[].test` command: 19/19 pass independently after `npm ci` in clean clone `/tmp/family-doodle-relay-polish3.i3HFdS`.
- `BUILD_SHA=cba8f0f72607b143a8183c6aa393f8047327636c cargo build --release`: pass.
- The release binary started with an otherwise empty environment and only `PORT=18081`, generated its SQLite configuration, returned the full build SHA from `/health`, created a room, and shut down cleanly.
- Playwright covers all route metadata, real HTTP 404, navigation focus/history, Axe on every route, 390 px layout and touch targets, keyboard controls, 200% text wrapping, isolated demo reset/exit, privacy request logs, service-worker offline reload, two-browser relay, free PNG export, host room closure, license states, and 429/`Retry-After` behavior.
- Local `verify-url.sh` reports zero errors for `/`, `/?demo=1`, `/privacy`, and `/terms`; reports and desktop/mobile captures are under [`.factory/polish-3-evidence/`](polish-3-evidence/).
- Local mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.6 s, TBT 0 ms, CLS 0, 103 KiB transferred.
- Production bundles: 26,987 B JavaScript and 9,953 B CSS before gzip.

## Run locally

```sh
npm ci
npm test
npm run lint
npm run build
cargo run
```

Open <http://127.0.0.1:8080/?demo=1> for the isolated sample relay.

## Deployment boundary

The checked-in deployment helper is not run in this work order because it reads or modifies shared resources named `sociobotregistry`, `factory-env`, and a shared storage account. That conflicts with the controller’s explicit rule to access only resources named `sf-family-doodle-relay`. The repository is left committed, pushed, and buildable; public live evidence is recorded only if an allowed product-scoped deployment path becomes available.

No product-code, test, accessibility, privacy, copy, or build finding remains. Deployment is the only external action withheld by the resource-isolation rule.
