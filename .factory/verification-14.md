# Independent product verification 14 — PASS

Verified 30 August 2026 from a clean checkout against <https://family-doodle-relay.sociobot.in>.

- Work order: `family-doodle-relay-verify-14`
- Candidate, checkout, and `origin/main`: `e43fa445ce5748fdad4a6401d79fd4617640fe5d`
- Live `/health`: HTTP 200, `{"build_sha":"e43fa445ce5748fdad4a6401d79fd4617640fe5d","status":"ok"}`

## Verdict

**PASS.** The deployed page and health endpoint identify the requested candidate, and fresh browser/API checks complete the actual private two-person relay safely. The preceding deployment-only failure is not reproduced.

## Required first read and demo — PASS

A cold, storage-free desktop visit returned HTTP 200 with title **“Family Doodle Relay — Draw together remotely.”** Its first screen says what it does (**“Draw together from two places”**), who it is for (**“For a child and trusted adult who want a calm game between calls”**), and what to do first (**“Try it with sample data”**), with the immediate outcome **“A sample relay opens next. Nothing is saved.”** The visible primary action opened the populated `/demo` sandbox in one activation.

## Claims gate — PASS

`.factory/claims.json` exists and contains 15 entries. After clean `npm ci` (48 packages; audit: 0 vulnerabilities), every literal declared test was run individually through the shipped demo/test entry point:

| Claims | Result |
| --- | --- |
| `demo-sandbox`, `privacy-defaults`, `browser-storage` | PASS |
| `png-export`, `download-local` | PASS |
| `two-person-limit`, `room-expiry` | PASS |
| `one-time-price`, `family-edition` | PASS |
| `live-relay`, `free-core`, `host-end-room` | PASS |
| `rate-limit`, `health-build`, `deployment-topology` | PASS |

The complete `npm test` then passed: Vite build, TypeScript check, 7 Rust tests, 18 deployment-contract tests, and 22 Chromium tests. `npm run lint` (format and Clippy warnings denied), exact `npm run build`, and `BUILD_SHA=e43fa445ce5748fdad4a6401d79fd4617640fe5d cargo build --release` passed. Docker is not installed in this verifier image, so the Docker image build could not be run; the release Cargo build is the available production-build evidence.

## Fresh live product and backend evidence — PASS

- A host room create returned `201`; guest join returned `200`; a third join returned `409`. Eight concurrent authorized reads all returned `200`.
- A forged `{ "paid": true }` room remained four turns. An invalid short join code returned `404`. Fresh expiry was 14,399 seconds, consistent with the four-hour promise.
- In two independent browser contexts, host and guest connected to one private room. The host-controlled **End this room** confirmation ended the room for both; an authorized read afterward returned `404`.
- The full local browser suite independently covers the normal four-turn two-browser draw/guess/add-detail relay, blank-guess recovery and focus preservation, 80-character boundary, PNG download, mobile layout, keyboard actions, and service-worker offline demo reload.
- Fresh live rate bursts on both an API route and a rendered page produced **20** normal responses then **35 HTTP 429** responses. `Retry-After: 1` was present. `/health` remained available. A separate Sociobot license-verifier burst returned 30 `200`, then 10 `429` with `Retry-After: 4`.

## Privacy, accessibility, response policy, and performance — PASS

- The claim tests record the entire demo flow: its real-storage sentinels remain unchanged, no demo action calls the room API or a third party, and the PNG is made/downloaded locally.
- Local browser coverage scans `/`, `/demo`, `/play`, `/privacy`, `/terms`, and the 404 with Axe; no serious or critical findings. It also verifies `lang=en`, one h1, one main, alternatives, keyboard use, visible designed focus, 390 px layout, 44 px controls, reduced motion, and controlled offline demo reload.
- Fresh live headers on HTML, API 404, health, and 404 include CSP with header-delivered `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and disabled camera/microphone/geolocation. HTML/API are `no-cache`; hashed JS/CSS are `public, max-age=31536000, immutable`.
- Current assets are 27,033 B JS (9.44 kB gzip) and 9,953 B CSS (2.94 kB gzip), below the 200 kB/50 kB budgets. Hero AVIF is 143,503 B.
- Fresh SHA-256 comparison found live HTML, JS, and CSS byte-identical to local `dist/`.

## Deployment identity and persistence boundary

The public live health identity, `origin/main`, checkout, and byte-identical built assets all match `e43fa445…`. The live application creates and reads private rooms correctly. The service’s production startup guard refuses to run in a Container App without a `/data` mount; a live healthy service therefore gives runtime evidence of that required storage boundary. The verifier identity has no Azure `Microsoft.App/containerApps/revisions/read` permission, so independent control-plane enumeration of revision count/traffic weights was not possible; this is an evidence limitation, not a reproduced product failure. The repository’s deployment-topology claim and its 18 contract checks pass.

## Defects by severity

None found.

## Scope note

This is a `web-with-backend` product, not a library/CLI; consumer-package checks do not apply. No sign-in exists, so Entra tenant validation does not apply. No product code was modified during verification.
