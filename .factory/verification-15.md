# Independent product verification 15 — FAIL

Verified 2 September 2026 from checkout `bfdf4ec5b7b9f9b0d178fa8d3a08b116bfab9573` against <https://family-doodle-relay.sociobot.in>.

- Work order: `family-doodle-relay-verify-15`
- Candidate, checkout, `origin/main`, and live `/health`: `bfdf4ec5b7b9f9b0d178fa8d3a08b116bfab9573`
- Live health: HTTP 200, `{"build_sha":"bfdf4ec5b7b9f9b0d178fa8d3a08b116bfab9573","status":"ok"}`

## Verdict

**FAIL.** The exact candidate is deployed and its core relay works, but the required `npm test` gate fails deterministically. The server puts HTML, static assets, and the service worker in one 20-request-per-second page bucket. The complete suite exhausts that bucket before the `license-check-data-flow` claim, and a live two-browser reload exercise returned 429 for `/sw.js`. A quality-gate failure and a failing claim during the full suite are release-blocking under the acceptance contract.

## Required first read and demo — PASS

A cold, storage-free live visit returned HTTP 200. The first viewport says what it does (**“Draw together from two places”**), who it is for (**“For a child and one trusted adult who want a calm game between calls”**), and what to do first (**“Try it with sample data”**). It also explains **“A sample relay opens next. Nothing is saved.”** One activation opened `/?demo=1` with the persistent **“Demo — sample data, nothing is saved”** banner. The cold page made four same-origin requests and logged no error.

## Claims gate

`.factory/claims.json` exists with 19 entries. The mandatory invocation made before dependency installation stopped at the first command with `vite: not found`. After clean `npm ci` (48 packages, zero audit vulnerabilities), every literal declared command passed independently:

| Claims | Independent result |
| --- | --- |
| `demo-sandbox`, `privacy-defaults`, `browser-storage` | PASS |
| `png-export`, `download-local` | PASS |
| `two-person-limit`, `room-expiry` | PASS |
| `one-time-price`, `purchase-provider`, `family-edition` | PASS |
| `refunded-license`, `license-check-data-flow`, `room-storage-fields` | PASS |
| `live-relay`, `free-core`, `host-end-room` | PASS |
| `rate-limit`, `health-build`, `deployment-topology` | PASS |

The aggregate gate does not pass. Two consecutive `npm test` runs each ended with **23 passed, 1 failed**. `@claim:license-check-data-flow` timed out waiting for **Paste your license** because `/` returned the rate-limit body instead of the app:

> Too many requests. Wait one second, then try again.

The local failure artifacts were generated at `test-results/product--claim-license-che-9295c-ken-to-the-documented-check-chromium/trace.zip` and its `error-context.md`.

## Defects by severity

### High — V15-01: the page limiter breaks the shipped test gate and fast reloads

- `security_and_rate_limit` counts every non-health request and groups all HTML, JS, CSS, images, and `/sw.js` into one `page` bucket of 20 requests per second per trusted address.
- The full Chromium suite reliably receives HTTP 429 on the home page before `@claim:license-check-data-flow`; `npm test` failed twice in the same place.
- A live two-browser relay setup completed all four turns, but its console recorded `/sw.js` returning 429 and service-worker registration failing. A later fresh two-browser full-reload setup did not reach **Both players are here** within 10 seconds. The first-time one-load UI path did work without errors.
- The observed limit itself is correctly enforced: a live API burst returned 20 ordinary 404 responses and 35 HTTP 429 responses; a page burst returned 20 HTTP 200 and 35 HTTP 429. Both supplied `Retry-After: 1`.
- Required correction: keep the documented limiter on server-side/API endpoints without letting the app shell and required static resources exhaust the same small window, then make the complete `npm test` pass repeatedly.

No other product defect was found.

## Local build and runtime evidence

- `npm run lint`: PASS (`cargo fmt --check`, Clippy with warnings denied).
- Exact `npm run build`: PASS; `dist/` produced.
- `BUILD_SHA=bfdf4ec5... cargo build --release`: PASS.
- Release binary with an otherwise empty environment and only `PORT=18082`: PASS. It reported the full build SHA, created a room, shut down cleanly, restarted, and read the same room from the durable snapshot.
- Docker is unavailable in this verifier image, so the Docker image build could not be executed.
- Bundle sizes: JavaScript 26,987 B (9.45 kB gzip), CSS 9,953 B (2.94 kB gzip), mobile hero AVIF 64,223 B.

## Live product and backend evidence

- All 17 built files fetched from production are byte-identical to local `dist/`; live health and `origin/main` match the candidate SHA.
- True first-time UI flow: two fresh contexts loaded once, host made a room, guest joined by the 12-character code, both showed connected, and host closure gave both **“The host ended this room. Make a new room to play again.”** No console errors occurred.
- Full relay: four synchronized 45-second turns completed; an 80-character guess wrapped at 390 px; the PNG download was named `family-doodle-relay.png` and contained 58,369 bytes.
- API boundaries: create 201, first join 200, third join 409, malformed code 404, forged `paid: true` remained a four-turn room, and eight concurrent authorized reads all returned 200.
- Invalid invite copy explains that the code needs 12 letters and numbers. A blank guess remains on the turn, announces **“Write a guess before sending it,”** and focuses the input.
- Local restart verified persistence. Health reports build identity. No sign-in exists, so Entra validation does not apply.
- The Sociobot product-license endpoint allowed 30 requests, then returned 15 HTTP 429 responses with `Retry-After: 4`.

## Privacy, accessibility, PWA, headers, and performance

- Complete live demo flow, reset, exit, and PNG download made four same-origin requests, no room API request, no cookie, and no storage change.
- Live Axe scans of `/`, `/?demo=1`, `/demo`, `/play`, `/privacy`, `/terms`, and the 404 found no serious or critical issue. Each route has `lang=en`, one h1, one main, no 390 px overflow, and no undersized visible control.
- Keyboard focus uses a visible 4 px press-red outline. Blank-field errors are announced. Reduced motion disables meaningful transition duration.
- Service worker update check remained activated with no waiting worker. A controlled demo reloaded offline after the browser cache was cleared.
- Worker `verify-url.sh` passed `/`, `/?demo=1`, `/privacy`, and `/terms` with zero isolated console errors.
- HTML, API errors, health, and 404 responses carry CSP with header-delivered `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and disabled camera, microphone, and geolocation. HTML/API/SW are `no-cache`; hashed JS/CSS are immutable for one year.
- Mobile Lighthouse 12.8.2: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1,052 ms, LCP 1,352 ms, TBT 0 ms, CLS 0, transfer 103,855 B.

## Scope note

This is a web product with a backend and PWA behavior, not a library or CLI; consumer-package checks do not apply. Verification did not inspect or modify any other product or shared service configuration. No product code was changed.
