# Independent product verification 6 — PASS

Verified on 29 August 2026 from clean commit `b8044b66a2010d536294fc2e11e1a707703c9514` against <https://family-doodle-relay.sociobot.in>.

## Verdict

**PASS — release candidate accepted.** Fresh deployment evidence supersedes the earlier deployment-only concern: `GET /health` returned the exact candidate build SHA, and the live drawing room, WebSocket connection, rate limit, demo, and privacy behavior all worked.

## Required first read and demo gate

A cold desktop visit answered the three required questions in plain words:

- It does: “Draw together from two places.”
- It is for: “a child and trusted adult who want a calm game between calls.”
- Click first: **Try it with sample data**; its adjacent text says a sample relay opens next and nothing is saved.

That one click opens `/?demo=1` directly into an active relay. The persistent banner says **Demo — sample data, nothing is saved** and provides **Reset demo** and **Start for real**. Completing the sample produced `family-doodle-relay.png`.

## Mandatory claim gate — PASS

`.factory/claims.json` is present and contains 13 claims. After `npm ci` from this clean candidate, every exact command listed in it was run separately. All passed. The grouped repeat run, `npm run test:claims`, reported 11 passing browser tests (the demo and privacy claims share one test); `npm run test:deployment` passed its four contract tests.

| Claims | Result |
| --- | --- |
| `demo-sandbox`, `privacy-defaults`, `browser-storage`, `png-export`, `download-local` | PASS |
| `two-person-limit`, `room-expiry`, `one-time-price`, `family-edition` | PASS |
| `live-relay`, `rate-limit`, `health-build`, `deployment-topology` | PASS |

## Build and local checks

- `npm ci`: PASS; audit reported 0 vulnerabilities.
- `npm test`: PASS — production frontend build, TypeScript check, 7 Rust tests, 4 deployment-contract tests, and 16 Chromium tests.
- `npm run lint`: PASS — `cargo fmt -- --check` and clippy with warnings denied.
- `npm run build`: PASS — generated `dist/`.
- Default runtime: PASS — with no product configuration variables, `cargo run` listened on port 8080, returned `{"build_sha":"dev","status":"ok"}`, and shut down gracefully.
- Docker build: not runnable in this verifier container because the `docker` executable is absent. This is an environment limitation; no product source was changed.

## Live product evidence

- `https://family-doodle-relay.sociobot.in/health` returned `{"build_sha":"b8044b66a2010d536294fc2e11e1a707703c9514","status":"ok"}`.
- Fresh demo request logging observed only the product origin: document, hashed JS, and CSS. It made no third-party request, wrote no cookie, and created its PNG locally.
- Invalid invite input `bad` showed the visible, announced recovery message: “The invite code has 12 letters and numbers. Check it and try again.”
- A live host and guest established `wss` room connections and both reached “Both players are here.” A host-controlled **End this room** action propagated to the guest, which showed “The room did not open” and explained that the host ended it.
- Protected live API burst: 30 requests from one client produced **20 × 404** followed by **10 × 429**. A throttled response had `Retry-After: 1`. Observed allowance: **20 requests per second per client**.
- Service worker: live `/demo` was controlled by `/sw.js`, installed `relay-shell-v3`, removes old named caches on activation, and reloaded the sample successfully after browser cache clear and offline mode.

## Accessibility, headers, mobile, and performance

- Fresh live Axe scans on `/`, `/demo`, `/privacy`, `/terms`, and `/play`: **0 serious or critical violations**.
- All checked routes had `lang="en"`, one `<main>`, one `<h1>`, route titles, and no console/page error in the fresh demo flow.
- At 390 px, `/demo` had no horizontal overflow; the checked action was 49.5 px tall. Keyboard focus used the visible `rgb(156, 47, 36)` 4 px outline. Reduced motion reduced animation and transition duration to `0.00001s`.
- Response headers included header-delivered CSP with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and disabled camera, microphone, and geolocation. HTML uses `no-cache`; hashed JS/CSS use `public, max-age=31536000, immutable`.
- Production build: JS 26,165 B raw / 9,222 B gzip; CSS 9,565 B raw / 2,905 B gzip; mobile AVIF hero 64,223 B. All are within the stated budgets.
- Live Lighthouse mobile: **99 performance**, **100 accessibility**; LCP 1,460 ms, CLS 0, total transferred bytes 102,627.

## Defects by severity

No critical, high, medium, low, or release-blocking product defects found.

