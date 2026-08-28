# Independent product verification — FAIL

Verified 28 August 2026 against candidate `746fcede22c04d0499dec0f70318a148e1838c22` and `https://family-doodle-relay.sociobot.in`.

## Verdict

**FAIL — do not release.** The deployed product cannot reliably create and reopen a room, so the core two-person relay does not work end to end. The paid edition is also both unavailable through its checkout link and trivially forgeable through the room API. These are release blockers even though the repository's existing tests pass.

## Mandatory first checks

### First read

The cold first screen passes. It says what the product does (“Draw together from two places”), who it is for (“a child and trusted adult”), and what to click first (“Try it with sample data”). The action explains that a sample relay opens and nothing is saved. The three facts state the two-person limit, four-hour room life, and one-time price. The sample demo is one click away.

Evidence: `qa-evidence/live-first-read-desktop.png`, `qa-evidence/verify-url/screenshot-mobile.png`.

### Claims

`.factory/claims.json` exists with nine entries. As required, each exact command was attempted before broader inspection. Those first attempts stopped at `vite: not found` because the clean clone had not yet had dependencies installed. After `npm ci`, every exact claim command was rerun serially and passed:

| Claim | Result | Evidence |
|---|---|---|
| `demo-sandbox` | PASS | `qa-evidence/claim-demo-sandbox.log` |
| `privacy-defaults` | PASS | `qa-evidence/claim-privacy-defaults.log` |
| `png-export` | PASS | `qa-evidence/claim-png-export.log` |
| `two-person-limit` | PASS | `qa-evidence/claim-two-person-limit.log` |
| `room-expiry` | PASS in test, but test is inadequate and implementation violates the claim | `qa-evidence/claim-room-expiry.log`; defect V-04 |
| `one-time-price` | PASS in test, but live checkout is 404 | `qa-evidence/claim-one-time-price.log`; defect V-03 |
| `family-edition` | PASS in test, but test bypasses license validation | `qa-evidence/claim-family-edition.log`; defect V-02 |
| `live-relay` | PASS locally; FAIL on the deployed product | `qa-evidence/claim-live-relay.log`; defect V-01 |
| `rate-limit` | PASS | `qa-evidence/claim-rate-limit.log` |

The three misleading claim tests are themselves release-blocking under the claims contract: they do not prove the observable promises a visitor relies on.

## Defects

### V-01 — Critical — Live rooms are split across replicas and the core flow fails

The production service keeps rooms in process memory without shared storage or sticky routing. A cold browser click on “Make a private room” returned `201`, then the immediate authenticated read for that room returned `404`. The page showed “The room did not open.”

Eight fresh API rooms were sampled. Six authenticated reads per room alternated between `200` and `404`, demonstrating two independent stores. Seven of eight immediate join requests returned `404`; one happened to reach the owning replica. A parent and child therefore cannot reliably create, join, reconnect, or finish a relay on the live site.

Evidence: `qa-evidence/live-room-create-failure.png`. Source cause: `AppState.rooms` is an in-process `HashMap` in `src/main.rs`, while the deployment has more than one serving replica.

### V-02 — High — Anyone can forge the $6 family edition

`POST /api/rooms` trusts the caller's unauthenticated JSON field `{"paid":true}`. Fresh live evidence returned `201`, and the authenticated room view reported `total_turns: 8` without a license token or verification. A user can also forge the browser's local license cache.

The `family-edition` claim test codifies the bypass: it posts `paid:true` directly and never presents or validates a family-edition license. The test therefore proves the vulnerability, not the claim “A valid family edition enables eight-turn rooms.”

### V-03 — High — The live purchase action is dead

The visible “Buy the family edition” link points to the required Sociobot endpoint, but a fresh request to `https://api.sociobot.in/api/v1/products/family-doodle-relay/checkout` returned HTTP `404` with `{"error":"enabled factory product","status":404}`. A family cannot buy the advertised edition. The price claim test only checks the link string, not that checkout works.

### V-04 — High — Four-hour expiry is not enforced at the boundary

Rooms are pruned only when another room is created (`prune_rooms` is called only by `create_room`). `get_room`, `join_room`, and WebSocket entry do not reject a room based on age. A room can therefore remain accessible after four hours until unrelated creation traffic happens to prune it. This violates the privacy copy and researched brief.

The `room-expiry` claim test checks only the returned `expires_at` number. It never advances time or proves that an expired room becomes inaccessible.

### V-05 — High — Live rate limiting is bypassable with a caller-supplied forwarded address

A fixed `X-Forwarded-For` value produced 40 responses followed by 20 `429` responses with `Retry-After: 1`, so the nominal live threshold is 40 requests per one-second window. The public ingress also preserved an arbitrary caller-provided first `X-Forwarded-For` value. A simultaneous 60-request burst with 60 different supplied values returned 60 non-limited responses and no `429`. The mandatory control can therefore be bypassed by an external caller.

The separate Sociobot license verification endpoint did rate-limit: a 60-request burst produced 30 `200` and 30 `429` responses with `Retry-After: 4`.

### V-06 — Medium — The downloaded strip omits relay content

The UI says the finished strip keeps every turn together. `downloadStrip` exports only the last two drawing snapshots and only the last guess. A four-turn relay loses its first guess; an eight-turn relay also loses its earlier drawing turns. The PNG claim test checks only the filename and not the exported content.

### V-07 — Medium — TypeScript validation fails

`npx tsc -p frontend/tsconfig.json --noEmit` exits 2 at `frontend/src/main.ts:199`: `event.currentTarget` is possibly null and its inferred `EventTarget` has no `elements` property. Vite transpilation still succeeds, so the shipped test command misses this type failure.

### V-08 — Medium — Some mobile interactive targets are shorter than 44 px

At 390 px, the footer Privacy, Terms, and Param Factory links measured 21 px high; the wordmark measured 30 px high. The Demo link was also only 37.4 px wide. This misses the attached 44×44 px touch-target baseline. Keyboard focus itself is clear: the tested control had a 4 px press-red outline.

### V-09 — Low — Rate-limit bookkeeping grows without cleanup

The per-client limiter stores every observed address in a process-wide `HashMap` and never evicts old entries. Long-running public instances can accumulate stale client keys indefinitely.

## What passed

- Clean install: `npm ci` passed with zero reported vulnerabilities.
- Full repository gate: `npm test` passed — Vite production build, 2 Rust unit tests, and 10 Playwright tests.
- Rust lint: `cargo clippy --all-targets -- -D warnings` passed.
- Exact frontend build: `npm run build` passed and produced `dist/`.
- Release backend build: `cargo build --release` passed.
- `npm audit --audit-level=high` found zero vulnerabilities.
- Runtime contract: the release binary started with an empty environment plus `PORT`, logged generated configuration, served health, and shut down gracefully. A locally created room disappeared after restart, matching the documented process-memory boundary.
- Live build identity: `/health` returned the exact candidate SHA. Live `index.html`, JS, CSS, and service worker SHA-256 hashes match the local production build.
- Live security basics: CSP, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` are present. Hashed assets use one-year immutable caching; HTML and service worker use `no-cache`.
- Demo privacy: no cookies, local/session storage, off-origin requests, console errors, or page errors during the full demo interaction. The PNG downloaded successfully.
- PWA: the service worker controlled the page and `/demo` reloaded successfully offline. The product does not claim that live rooms work offline.
- Accessibility automation: the live `/`, `/demo`, `/play`, `/privacy`, `/terms`, and 404 experiences had no axe serious/critical findings. The verifier script found one H1, `lang=en`, a main landmark, alt text, and no console errors on the landing page.
- Responsive/motion: no horizontal overflow at 390 px. Reduced-motion emulation reduced route and rule animations to `0.01 ms` and disabled smooth scrolling.
- Performance: Lighthouse mobile scored Performance 99, Accessibility 100, Best Practices 100, SEO 100. LCP 1.5 s, TBT 110 ms, CLS 0. Initial JS is 25.52 KB raw/9.10 KB gzip; CSS is 9.20 KB raw/2.83 KB gzip; mobile hero AVIF is 64.2 KB.
- Visual/product identity: the documented monochrome broadsheet system is distinctive, responsive, and consistent with the supplied original-asset provenance.
- Accounts/Entra: not applicable; the product deliberately requires no sign-in.

## Limits of this verification

No Docker, Podman, or Buildah executable exists in the worker, so the Dockerfile could not be executed. Its frontend and backend build commands were run independently and passed. The live build identity and artifact hashes provide deployment equivalence evidence, but they do not cure the multi-replica state defect.

## Required release fixes

1. Put ephemeral rooms in a shared TTL store, or enforce proven sticky routing for HTTP and WebSocket traffic; rerun a live two-context four-turn relay including reconnect.
2. Verify the Sociobot license server-side before creating an eight-turn room. Do not trust a browser Boolean or local cache.
3. Register/enable the billing product and test the hosted checkout return flow.
4. Enforce expiry on every room access and add a time-controlled claim test that proves post-expiry denial.
5. Sanitize forwarded-client identity at ingress or use a trusted proxy-derived address; add a spoof-resistance test.
6. Export every drawing and guess, and assert PNG contents rather than filename alone.
7. Add typecheck to the standard gate and fix the event typing.
8. Raise every mobile interactive target to at least 44×44 px.
