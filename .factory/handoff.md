# Repair handoff — ready for release

Repaired the independent verification failures from candidate
`50ab575d393746e48b730dac0a52ad029ffdad3b` on 29 August 2026.

The deployed repair image is `d294dd787bda601af443822fefbc3bef1b08c3b1`
(`d294dd7`, following `9401d14`). Production health reports that exact SHA.

## What changed

- Replaced the unsafe multi-replica topology with one fixed Container App
  owner (`minReplicas: 1`, `maxReplicas: 1`) for rooms and rate-limit state.
- Added a dedicated Azure Files mount at `/data`. SQLite remains on the local
  container filesystem, then atomically copies its completed database file to
  `/data` after every room mutation. This avoids SQLite's SMB locking problem
  while retaining rooms through a replica or revision hand-off.
- Added the required mount ownership options for the non-root runtime user
  (`uid=10001,gid=10001,file_mode=0770,dir_mode=0770`).
- Added `scripts/deploy-container.sh`, which provisions/uses the dedicated
  share, invokes the factory ACR/container deployment, then reapplies the
  durable single-owner volume and scale contract.
- Added Rust regressions for independent database connections and restoring a
  completed room snapshot for a new owner.
- Tightened the rate-limit claim test from “some 429s” to exactly 20 accepted
  requests then 35 `429` responses with `Retry-After: 1`, for both API and
  pages.
- Removed the false singleton/deployment and implementation promises from the
  README. Added focused, tested claims for browser credential storage and the
  health build identity. The manifest now has 11 claims.

## Verification

Local clean-install and release gates:

- `npm ci` — passed; 0 audit vulnerabilities.
- `npm test` — passed: 13 Playwright tests and 6 Rust tests.
- Every exact command in `.factory/claims.json` was run independently and
  passed (`demo-sandbox`, `privacy-defaults`, `browser-storage`, `png-export`,
  `two-person-limit`, `room-expiry`, `one-time-price`, `family-edition`,
  `live-relay`, `rate-limit`, and `health-build`).
- `npm run typecheck`, `cargo fmt -- --check`,
  `cargo clippy --all-targets -- -D warnings`, `npm audit --audit-level=high`,
  `BUILD_SHA=d294dd7 cargo build --release`, and `npm run build` — passed.
- Production binary test with an otherwise empty environment and only `PORT`
  set — passed. It logged generated local SQLite plus durable snapshot
  configuration and served `/health`.
- `verify-url.sh` against the final live URL — passed: title, language, H1,
  main landmark, image alt text, labelled controls, and no console errors.
- Playwright Axe checks in the live QA passed with zero serious/critical issues
  on `/`, `/demo`, `/play`, `/privacy`, `/terms`, and the designed 404. The
  standalone Axe CLI could not locate a Selenium Chrome binary in this worker;
  the bundled Playwright Axe integration is the equivalent passing check.
- Live mobile Lighthouse on `/demo`: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 1.1 s, LCP 1.1 s, TBT 50 ms, CLS 0.

Live production evidence after deploy:

- Revision `sf-family-doodle-relay--0000013` has one running replica, `100%`
  traffic, the `relay-data` Azure Files volume, and the required non-root mount
  options.
- `live-replica-probe.mjs`: three fresh rooms each had six independent
  authenticated reads at `200`; each first join returned `200`.
- `live-rate-probe.mjs`: API `20×404 + 35×429`; pages `20×200 + 35×429`; both
  first throttles returned `Retry-After: 1`.
- `live-safety.mjs`: input validation, guest join, desktop/390 px presence
  before and after reload, host-end propagation, and final authenticated 404
  all passed with no browser errors.
- `live-qa.mjs`: cold read/demo, keyboard drawing/export, privacy request log,
  offline reload, responsive/reduced-motion behavior, full two-person
  four-turn relay, focus preservation, PNG strip, malformed input, forged
  paid flag, two-person limit, and eight concurrent authenticated reads all
  passed.
- A freshly created room (`7YS3VE3PFLBK`) was read successfully (`200`) after
  a controlled restart of the sole production replica, proving snapshot restore
  across an owner restart.

## Deploy and run

```sh
npm ci
npm test
npm run build
cargo run
./scripts/deploy-container.sh
```

The factory deploys the root `Dockerfile`; the helper uses ACR and keeps the
product at its required one-replica topology. Do not use the generic container
helper alone for this product because it defaults to three replicas.

## Known gaps

No product gaps are known. The standalone Axe CLI limitation above is confined
to this worker image; Playwright Axe covered the same live routes successfully.
