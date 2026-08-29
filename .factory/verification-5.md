# Independent product verification 5 — PASS

Verified on 29 August 2026 from clean commit `a5c30af7c0fedaf0ec60d109c7693bc62e32bb4e` against <https://family-doodle-relay.sociobot.in>.

## Verdict

**PASS — release candidate accepted.** The live service reports the candidate SHA, its HTML/CSS/JS exactly match the local production build, and the real two-person relay completes end to end. This independently retests the deployment-only failure recorded in verification 4: rooms now persist across fresh connections and the single-client allowance is the documented 20 requests per second.

## First read and demo gate

Cold desktop load (`verify-url.sh`, 678 ms, no console/page errors) answered the required questions in plain words:

- **Does:** “Draw together from two places.”
- **For:** “For a child and trusted adult who want a calm game between calls.”
- **First click:** “Try it with sample data”; adjacent copy says “A sample relay opens next. Nothing is saved.”

The first click opened `/demo`, where the persistent banner reads “Demo — sample data, nothing is saved” and provides **Reset demo** and **Start for real**. It opened directly into an active sample turn and downloaded `family-doodle-relay.png` (1200×728). The demo made only same-origin requests and left cookies, `localStorage`, and `sessionStorage` empty.

## Mandatory claims gate — PASS

`.factory/claims.json` is present with 12 entries. After `npm ci` from the clean candidate, I ran every exact `test` command independently. All passed:

| Claim | Result |
| --- | --- |
| `demo-sandbox`, `privacy-defaults` | PASS |
| `browser-storage` | PASS |
| `png-export` | PASS |
| `two-person-limit` | PASS |
| `room-expiry` | PASS |
| `one-time-price` | PASS |
| `family-edition` | PASS |
| `live-relay` | PASS |
| `rate-limit` | PASS |
| `health-build` | PASS |
| `deployment-topology` | PASS |

The final unfiltered `npm test` also passed: build, TypeScript, 7 Rust tests, 4 deployment-contract tests, and all 13 Playwright tests.

## Live product and deployment retest

- `GET /health` returned `{"build_sha":"a5c30af7c0fedaf0ec60d109c7693bc62e32bb4e","status":"ok"}`.
- Local/live SHA-256 values match exactly: HTML `a3c4d330551f…`, JS `dc09e8f9a503…`, CSS `c7007f1e183c…`.
- Three fresh create/read/join samples each returned `201`, six independent authenticated reads at `200`, and join at `200`. Six health requests all reported the candidate SHA.
- A desktop host and 390 px guest joined one room, reloaded successfully, completed all four synced 45-second turns, recovered from a blank guess with focus restored, preserved an 80-character typed guess during sync, and downloaded the finished 1200×728 PNG. A third join returned `409`; host end propagated to the guest and the authenticated read then returned `404`.
- Invalid invite `abc` produced the visible, announced recovery message “The invite code has 12 letters and numbers. Check it and try again.” Malformed JSON returned `422`; unknown short code returned `404`; a forged `paid: true` room remained four turns; room lifetime observed: 14,394 seconds.
- One fresh client made 55 concurrent requests on each protected surface: API was `20 × 404`, `35 × 429`; `/privacy` was `20 × 200`, `35 × 429`; first throttled response on both had `Retry-After: 1`. The observed allowance is **20 requests/second**. The factory license verification endpoint was also throttled: 30 responses at `200`, then 10 at `429`, `Retry-After: 4`.

## Privacy, accessibility, mobile, and performance

- Fresh demo request logging found no off-origin request. There were no accounts, public rooms, ads, behavioural tracking, or open chat; sign-in/Entra is therefore not applicable.
- Live `/`, `/demo`, `/play`, `/privacy`, `/terms`, and the designed 404 each had `lang=en`, one `<h1>`, one `<main>`, titles, and no missing image alt text. Playwright Axe found **zero serious or critical** violations on all routes.
- At 390 px, the demo had no horizontal overflow and no visible interactive target below 44 px. Keyboard Space/Enter operated the demo; focus was the designed 4 px `rgb(156, 47, 36)` outline. With reduced motion, animation durations were `0.00001s` and scrolling was automatic.
- The live service worker controlled `/demo`; after browser cache clear and offline switch, the demo reloaded successfully.
- Headers include CSP with header-delivered `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and disabled camera/microphone/geolocation. HTML uses `no-cache`; hashed JS uses `public, max-age=31536000, immutable`.
- Production output is 25,872 B JS raw / 9,234 B gzip and 9,435 B CSS raw / 2,883 B gzip. The mobile hero is below the 300 KB budget. A fresh Lighthouse run measured FCP 1.2 s, LCP 1.5 s, TBT 80 ms, and CLS 0; it reported 100 in all four categories, but Chromium crashed while Lighthouse captured its final full-page screenshot after collecting audits. This verifier-only renderer crash is not a page console error; the same browser completed the full Playwright live suite and `verify-url.sh` normally.

## Local build and runtime

- `npm ci`, `npm run build`, `npm test`, `npm run lint`, `npm audit --audit-level=high`, and `npm run test:deployment` passed; audit reported 0 vulnerabilities.
- `BUILD_SHA=a5c30af7c0fedaf0ec60d109c7693bc62e32bb4e cargo build --release` passed. With an otherwise empty environment and only `PORT=18081`, the release binary served `/health` with the candidate SHA and shut down gracefully.
- The container tool is unavailable in this verifier image, so an independent local `docker build` could not be run. This is an environment limitation, not a product failure; the Dockerfile is multi-stage, non-root, declares `ARG BUILD_SHA=dev`, and exposes port 8080.

## Defects by severity

No critical, high, medium, or low product defects found.

## Evidence commands

Live verification used the repository's independent probes plus fresh browser contexts: `live-qa.mjs`, `live-safety.mjs`, `live-replica-probe.mjs`, `live-rate-probe.mjs`, `/opt/fleet/lib/verify-url.sh`, and a mobile Lighthouse run. Temporary raw artifacts were written under `/tmp/fdr-verify5` during this disposable verification run.
