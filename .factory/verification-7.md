# Independent product verification 7 — FAIL

Verified 29 August 2026 from clean candidate `2dbeb77c46a338ee145d1dc6ad3ebe8fdde4221e` against <https://family-doodle-relay.sociobot.in>.

## Verdict

**FAIL — do not release.** The candidate image is present in Azure Container Apps, but its revision is crash-looping because the required durable `/data` mount is absent. Production is still served by the preceding build `d5df5f519368eb18adc74e23558c634edca36df2`, so the live deployment does not match the candidate. A valid 80-character guess also breaks the finished mobile page to 925 px wide at a 390 px viewport.

## Mandatory first checks

### First read and sample demo — PASS

A cold visit on desktop and 390 px mobile answered all three required questions in the first screen:

- What it does: **“Draw together from two places.”**
- Who it is for: **“For a child and trusted adult who want a calm game between calls.”**
- What to click: **“Try it with sample data.”** Adjacent copy says the sample opens next and nothing is saved.

That one click opened `/?demo=1` with the persistent **Demo — sample data, nothing is saved** banner, **Reset demo**, and **Start for real**. The sample was already on an active turn.

### Claims gate — PASS after clean install

`.factory/claims.json` exists with 14 entries. As requested, every exact command was attempted before broader QA; the pre-install attempts stopped at `vite: not found`. After the documented clean `npm ci`, every exact claim command was rerun independently and passed:

| Claim | Result |
| --- | --- |
| `demo-sandbox`, `privacy-defaults`, `browser-storage` | PASS |
| `png-export`, `download-local` | PASS |
| `two-person-limit`, `room-expiry` | PASS |
| `one-time-price`, `family-edition`, `free-core` | PASS |
| `live-relay`, `rate-limit`, `health-build` | PASS |
| `deployment-topology` | PASS against its fixtures; the actual live topology fails the same validator |

The local claim results do not override the independently observed live deployment failure below.

## Defects by severity

### V7-01 — Critical — Candidate revision crash-loops and live does not match the candidate

Fresh deployment evidence:

- Candidate under test: `2dbeb77c46a338ee145d1dc6ad3ebe8fdde4221e`.
- `GET /health`: `{"build_sha":"d5df5f519368eb18adc74e23558c634edca36df2","status":"ok"}`.
- Azure latest revision `sf-family-doodle-relay--0000029` uses image tag `2dbeb77c46a3`, is **Unhealthy**, is not ready, and has restarted 10 times in `CrashLoopBackOff`.
- Its container log says: `refusing to start in Azure Container Apps without the durable /data volume`.
- The candidate revision has no volume or volume mount and has `maxReplicas: 3`.
- The healthy revision `sf-family-doodle-relay--0000028` still uses image tag `d5df5f519368`; two revisions are active even though the app is configured for Single revision mode.
- Running the repository deployment validator against the actual app failed for `maxReplicas`, missing `/data`, missing Azure Files storage/mount options, and a latest revision that is not ready. The revision ownership check failed because two revisions are active.

The currently served HTML, JS, CSS, hero images, and service worker are byte-for-byte identical to the candidate build because the commit delta is documentation/evidence only. That does not satisfy build identity or make the candidate revision deployable.

### V7-02 — High — A valid boundary guess breaks the 390 px finished screen

The guess input and server both accept 80 characters. A real four-turn live relay used an 80-character unbroken guess, which rendered on the finished page without wrapping. At a 390 px viewport:

- `document.documentElement.clientWidth`: 390 px
- `document.documentElement.scrollWidth`: 925 px
- observed result: the quote ran far outside its result panel and required horizontal scrolling

Normal routes and ordinary guesses did not overflow. The existing mobile test checks route shells and demo controls, not a completed relay with supported boundary content.

### V7-03 — Medium — A user-facing host-disconnect claim is absent from the claim inventory

`/terms` states, **“A host may end a room at any time.”** This is a functional promise a visitor can rely on, but `.factory/claims.json` has no corresponding claim/test. Independent live QA confirmed the feature works and propagates a clear message to the guest; the finding is the required claim coverage, not the behavior.

### V7-04 — Low — Axe reports a moderate nested complementary-landmark issue

The landing and demo/room layouts use an `<aside>` within the main landmark without making it non-landmark content. Axe reports `landmark-complementary-is-top-level` with moderate impact. There were zero serious or critical Axe findings.

## End-to-end and adversarial evidence

- Real live host and 390 px guest created and joined one private room, saw **Both players are here**, completed four alternating draw/guess turns, and both reached **Your relay is finished**.
- A third player received HTTP 409 and the visible recovery text: **“This room already has two players. Ask the host to make a new room.”**
- A three-character invite code produced the announced 12-character guidance; the correct invite URL then prefilled and joined successfully.
- An empty guess produced **“Write a guess before sending it.”** An 80-character guess was accepted. Reload restored the active room from the server and local room key.
- The final PNG was `family-doodle-relay.png`, 1200×728, 60,031 bytes, with two drawing canvases and both visible guesses.
- In a separate room, **End this room** removed the room for both players; the guest saw that the host ended it and was offered a new-room path.
- Ten concurrent room creates returned ten 201 responses and ten unique codes. Simultaneous joins to one room returned exactly one 200 and one 409.
- Forged `{"paid":true}` created only a four-turn room. A fake returned license was stored locally, checked only at `api.sociobot.in`, marked inactive, stripped from the URL, and free four-turn play remained available.
- The buy link returned 303 to the hosted Dodo checkout. All product links returned expected 200/303 responses; mail links were explicit.

## Privacy, backend, and deployment checks

- Cold page requests were same-origin only: HTML, hashed JS/CSS, and the responsive hero image. There were no cookies, analytics, third-party fonts, console errors, or page errors.
- Completing, downloading, and resetting the demo made zero additional network requests and left preexisting local storage, session storage, and cookies byte-for-byte unchanged.
- The full real relay made only same-origin page, room API, and WebSocket requests. License verification contacted only the documented `https://api.sociobot.in` endpoint after an explicit license action.
- Live API and page bursts each allowed exactly **20 requests per second per client**. Requests beyond 20 returned 429 with `Retry-After: 1`.
- Malformed JSON returned 400, wrong content type returned 415, empty room code returned 404, and a wrong private token returned 404 without disclosing room existence.
- HTML and API responses included CSP with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and disabled camera/microphone/geolocation. HTML and the service worker use `no-cache`; hashed assets use one-year immutable caching; images use one-day caching.
- The backend started with an empty environment except `PORT=8099`, logged generated SQLite/durable-snapshot configuration, served health and room creation, then shut down gracefully.
- Sign-in/Entra is not applicable: this product intentionally has no accounts.

## Accessibility, PWA, mobile, and performance

- Live Axe sweep on `/`, `/?demo=1`, `/demo`, `/play`, `/privacy`, `/terms`, and a real 404 at desktop and 390 px: **0 serious/critical violations**.
- Every route had `lang="en"`, one `<main>`, one `<h1>`, and a route-specific title. All visible controls measured at least 44×44 px.
- Keyboard-only activation reached the sample action first from the H1 and showed a 4 px press-red focus outline. Demo drawing, finish, and download actions worked with Enter.
- Reduced-motion emulation collapsed route and turn animations to 0.01 ms.
- Service worker `/sw.js` was activated and controlling, `registration.update()` completed with no waiting worker, cache `relay-shell-v3` was present, and `/demo` reloaded offline with HTTP 200 and the seeded sample intact.
- Live Lighthouse mobile: **100 Performance / 100 Accessibility / 100 Best Practices / 100 SEO**; FCP 1.1 s, LCP 1.6 s, TBT 50 ms, CLS 0, total 100 KiB.
- Production build: JS 25,901 B raw / 9.13 KB gzip; CSS 9,650 B raw / 2.89 KB gzip; mobile hero AVIF 64,223 B. No font files load.

## Repository gates

- `npm ci`: PASS; 0 vulnerabilities reported.
- Every exact `.factory/claims.json` test: PASS after install, 14/14.
- `npm test`: PASS — Vite production build, TypeScript, 7 Rust tests, 4 deployment-contract tests, 18 Playwright tests.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS — Rust formatting and clippy with warnings denied.
- `npm run build`: PASS; `dist/` produced.
- `cargo build --release`: PASS.
- `npm audit --audit-level=high`: PASS; 0 vulnerabilities.
- Docker image build: not run because this worker has no Docker executable. The Dockerfile's frontend and release-backend build commands passed independently.

## Required release fixes

1. Deploy the candidate through `scripts/deploy-container.sh` (or apply its equivalent) so `/data` uses the required Azure Files mount, min/max replicas are both one, superseded revisions deactivate, and `/health` reports the exact candidate SHA.
2. Add wrapping such as `overflow-wrap: anywhere` to user-entered result text and add a 390 px completed-relay test using the 80-character boundary.
3. Add a claim entry and tagged observable test for host-controlled room termination.
4. Resolve the moderate complementary-landmark semantics, then rerun Axe.
