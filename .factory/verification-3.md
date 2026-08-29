# Independent product verification 3 — FAIL

Verified 29 August 2026 against candidate `50ab575d393746e48b730dac0a52ad029ffdad3b` and <https://family-doodle-relay.sociobot.in>.

## Verdict

**FAIL — do not release.** Production still serves at least two independent SQLite room stores. A room created successfully on one connection is missing on another, so a parent and child cannot reliably join, reconnect, or finish the core relay. The live per-client request allowance is also doubled across those instances.

The result is based on fresh evidence, not the prior deployment failure. Every sampled `/health` response reports the candidate SHA, and local/live SHA-256 values match for HTML, JavaScript, CSS, and the service worker.

## Mandatory first checks

### First read and demo gate — PASS

The cold first screen answers all three questions in plain words:

- What: “Draw together from two places.”
- Who: “For a child and trusted adult who want a calm game between calls.”
- First click: “Try it with sample data,” followed by “A sample relay opens next. Nothing is saved.”

One keyboard activation opens `/demo` with the persistent “Demo — sample data, nothing is saved” banner, **Reset demo**, and **Start for real**. The loaded sample is already on turn three and is usable immediately.

Evidence: `verification-evidence/live-cold-desktop.png`, `verification-evidence/live-demo-mobile-390.png`.

### Claims gate

`.factory/claims.json` exists with nine entries. The untouched-clone attempt could not launch Vite before dependencies were installed. After the required `npm ci`, every exact listed command was run independently and passed:

| Claim | Local exact test | Fresh live result |
|---|---|---|
| `demo-sandbox` | PASS | PASS: no storage, cookies, or off-origin request |
| `privacy-defaults` | PASS | PASS in inspected demo and product surfaces |
| `png-export` | PASS | PASS: demo and live 1200×728 PNGs contained two panels and two guesses |
| `two-person-limit` | PASS | Safety limit holds when the room is found, but second-player entry is unreliable due to V3-01 |
| `room-expiry` | PASS | TTL was 14,395 seconds; boundary deletion regression passed |
| `one-time-price` | PASS | PASS: `$6 once`; checkout returned 303 to hosted Dodo checkout |
| `family-edition` | PASS | Forged `paid:true` stayed at four turns; positive path uses the recorded local fixture |
| `live-relay` | PASS locally | **FAIL live**: one relay completed, but independent clients repeatedly received false 404s; V3-01 |
| `rate-limit` | PASS locally | 429 and `Retry-After` exist, but production allowed 40 rather than the source allowance of 20; V3-02 |

The local claim sandbox has one backend process, so it cannot detect the deployed multi-store topology.

## Release-blocking defects

### V3-01 — Critical — production rooms are split between independent stores

Three fresh rooms were created. For each room, six independent authenticated reads returned exactly three `200` and three `404` responses. All six independent health reads returned the candidate SHA. This is direct evidence of two serving instances with separate `/data` SQLite databases.

The failure also occurs through the product UI. Three consecutive fresh landing-page join trials failed to reach a connected room; the instrumented trial's join POST returned HTTP 404 and showed “Room not found.” A 12-request concurrent join probe returned one `200`, three `409`, and eight false `404` responses. A lucky co-located two-browser run did complete four turns, which confirms the code path but not a dependable product.

This contradicts `.factory/handoff.md` and README statements that production is pinned to one replica. The current design cannot scale or overlap revisions safely without a shared TTL store or proven room-affine routing for HTTP and both WebSockets.

Reproduce with:

```sh
node .factory/verification-evidence/live-replica-probe.mjs
node .factory/verification-evidence/live-safety.mjs
```

### V3-02 — High — live request allowance is doubled across instances

The source resets one client bucket each second and rejects request 21. Fresh simultaneous live bursts from one client produced:

- Product API: 40 `404`, then 15 `429`; first `Retry-After: 1`.
- Product pages: 40 `200`, then 15 `429`; first `Retry-After: 1`.
- Sociobot product-verification API: 30 `200`, then 10 `429`; first `Retry-After: 4`.

Thus rate limiting exists, but the product's observed live allowance is 40 requests per second rather than the implemented 20 because each serving instance owns a separate counter. It also shows why singleton deployment cannot be treated as optional configuration.

Reproduce with `node .factory/verification-evidence/live-rate-probe.mjs`.

### V3-03 — High — claim inventory omits promises in the README and privacy page

The claims manifest does not list several statements a user or deployer could rely on, including the no-extra-environment runtime, build-SHA health response, active-turn pointer/validation preservation, browser-only license/key storage, and the claimed singleton deployment. The last of these is demonstrably false in production. The broader `privacy-defaults` and `live-relay` entries do not assert all of these outcomes.

The claims contract says any unlisted claim is release-blocking even when an untagged test happens to cover it. Add focused claim entries and sandbox tests, or remove the statements.

## Other verification results

### Local build and runtime — PASS

- `npm ci`: passed, 0 vulnerabilities.
- All nine exact claim commands: passed after install.
- `npm test`: 11/11 Playwright and 4/4 Rust tests passed.
- `npm run typecheck`: passed.
- `cargo fmt -- --check`: passed.
- `cargo clippy --all-targets -- -D warnings`: passed.
- `npm audit --audit-level=high`: passed.
- `BUILD_SHA=50ab575d393746e48b730dac0a52ad029ffdad3b cargo build --release`: passed.
- Exact `npm run build`: passed and produced `dist/`.
- The release binary started with only `PORT`, logged generated persistent SQLite configuration, returned the candidate SHA, shut down gracefully, and retained a room across restart.

No Docker-compatible executable is installed in the verifier container. The Dockerfile was inspected, and its frontend/backend build stages and no-extra-config runtime contract were exercised independently.

### Core flow, validation, and safety

- One desktop host and 390 px guest completed a live four-turn relay.
- The timer began at `00:44`; an empty guess produced a useful message and restored focus.
- An 80-character boundary guess and focus survived an 850 ms sync interval.
- A forged paid Boolean produced a four-turn room.
- Malformed JSON returned 422; an unknown short code returned a helpful 404.
- Third entry to a co-located full room returned 409.
- The finished live PNG was 1200×728 with both drawing panels and both guesses.
- Eight concurrent authenticated reads passed on a lucky live owner connection; independent live connections fail as documented in V3-01.

### Privacy, headers, routes, and PWA

- The full sample demo made only same-origin requests and left cookies, local storage, and session storage empty.
- Valid routes logged no console or page errors. `/`, `/demo`, `/play`, `/privacy`, and `/terms` return 200; the designed unknown route returns 404.
- Browser responses include CSP with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and a restrictive Permissions Policy.
- HTML and `sw.js` use `no-cache`; hashed assets use `public, max-age=31536000, immutable`.
- The service worker controlled `/demo` and reloaded its precached shell offline after the browser HTTP cache was cleared.
- `robots.txt`, `sitemap.xml`, `/privacy`, `/terms`, and the designed 404 are present.
- Checkout redirects to a hosted Dodo session. No payment was made. Invalid license verification returned normally and the upstream allowance was measured separately.

### Accessibility, responsive layout, and performance

- The supplied `verify-url.sh` passed: correct title, `lang=en`, one H1, one main landmark, no missing alt, no unlabeled buttons, and no console errors.
- Fresh axe checks found zero serious/critical issues on `/`, `/demo`, `/play`, `/privacy`, `/terms`, and the designed 404.
- Keyboard activation works for the demo, drawing control, finish action, and form recovery. Focus is a visible 4 px press-red outline.
- At 390 px there is no horizontal overflow and no visible interactive target below 44×44 px. A 1280 px viewport at 200% browser zoom reflows without overflow or lost primary controls.
- Reduced motion changes route/rule animations to 0.01 ms and smooth scrolling to `auto`.
- Fresh mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.5 s, TBT 70 ms, CLS 0, transfer 99 KiB.
- Build budgets: JavaScript 25.86 KB raw / 9.24 KB gzip; CSS 9.44 KB raw / 2.86 KB gzip; mobile hero AVIF 64,223 bytes.

### Deployment identity

- `/health`: `50ab575d393746e48b730dac0a52ad029ffdad3b` on every sampled instance.
- Local/live hashes match: `index.html` `e6ba33…`, JS `1cccc5…`, CSS `c7007f…`, service worker `95449b…`.

Sign-in/Entra is not applicable because the product deliberately has no accounts. AI is not useful to the core cooperative drawing job, so no missed AI feature is reported.

## Required release fix

Move ephemeral rooms and rate-limit state to shared infrastructure, or enforce and prove one durable room owner across deployment and revision changes. Add or remove the unlisted README/privacy claims. Then repeat independent cross-connection create/read/join/reconnect, four-turn relay, host disconnect, and 20-request allowance tests before release.
