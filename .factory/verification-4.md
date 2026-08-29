# Independent product verification 4 — FAIL

Verified 29 August 2026 from clean candidate `845d41a6234dbc9254c736cfdacbf70d696c71c1` against <https://family-doodle-relay.sociobot.in>.

## Verdict

**FAIL — do not release.** The live backend does not preserve a newly created room for the immediately following authenticated read. This makes the product's essential two-person relay unusable. Production also enforces a 40-request allowance for one client rather than its documented and claimed 20 requests per second, which independently violates the backend rate-limit contract.

This is fresh evidence. `/health` reports the tested commit, and the locally built HTML, JavaScript, and CSS have byte-identical SHA-256 hashes to the files served by production. The frontend candidate is deployed; the deployed room/state topology is not working correctly.

## Required first checks

### First-read and demo gate — PASS

Cold desktop visit recorded in `qa-evidence/verify-4-live-cold-desktop.png`:

- **What:** “Draw together from two places.”
- **Who:** “For a child and trusted adult who want a calm game between calls.”
- **First action:** “Try it with sample data,” with the adjacent explanation “A sample relay opens next. Nothing is saved.”

One click opens `/demo`, which displays the persistent “Demo — sample data, nothing is saved” banner, Reset demo, Start for real, and a ready-to-use sample relay. The cold page had no console or page errors.

### Claims gate — PASS locally

`.factory/claims.json` exists and contains 11 entries. From the clean checkout, after `npm ci`, every exact command in its `test` fields was run independently with `set -e` and passed:

| Claim IDs |
| --- |
| `demo-sandbox`, `privacy-defaults`, `browser-storage`, `png-export`, `two-person-limit`, `room-expiry`, `one-time-price`, `family-edition`, `live-relay`, `rate-limit`, `health-build` |

The consolidated `npm test` also passed: TypeScript check, 6 Rust tests, and all 13 Playwright tests. The local claim sandbox has one backend process, so it cannot reveal the live multi-owner state failure below.

## Release-blocking defects

### V4-01 — Critical — a live room is immediately lost after creation

The core flow fails in the live product:

1. Opened `/play` and clicked **Make a private room**.
2. `POST /api/rooms` returned `201` with code and host token.
3. The app navigated to `/room/VV34UXZD58Z2` and immediately made `GET /api/rooms/VV34UXZD58Z2?token=…`.
4. That read returned `404`, and the UI showed “The room did not open — Room not found or expired.”

Five independent direct live create/read cycles then reproduced the same result: all five `POST`s returned `201`, and all five immediate authenticated reads returned `404` with that same error. This prevents invite, join, reconnect, and a completed relay; it fails the researched brief's smallest useful product.

The evidence is also consistent with at least two state owners: a create request can reach one owner while the read reaches another that has a different local SQLite working database. This contradicts the prior handoff's assertion that production is a single fixed owner.

### V4-02 — High — live one-client allowance is 40 requests/s, not 20

After a fresh quiet window, a single client sent 55 concurrent requests to each non-health surface:

| Surface | Observed results | Required / claimed result |
| --- | --- | --- |
| `GET /api/rooms/NOTAROOM?token=none` | 40 × `404`, 15 × `429`; first `Retry-After: 1` | 20 non-429 then 35 × `429` with `Retry-After` |
| `GET /privacy` | 40 × `200`, 15 × `429`; first `Retry-After: 1` | 20 non-429 then 35 × `429` with `Retry-After` |

Thus `429` and `Retry-After` are present, but only after 40 requests. The observed allowance is **40 per second**, not the documented 20. Separate in-memory rate-limit maps across two live owners explain this result and make the current deployment non-compliant with the mandatory backend contract.

## Other verification results

### Build and local runtime — PASS, with a Docker-host limitation

- `npm ci` passed; audit reported 0 vulnerabilities.
- `npm run build` passed and produced `dist/`: JavaScript 25.87 KB raw / 9.25 KB gzip; CSS 9.44 KB raw / 2.86 KB gzip.
- `npm test` passed: 6 Rust tests and 13 Playwright tests.
- `npm run typecheck`, `cargo fmt -- --check`, `cargo clippy --all-targets -- -D warnings`, and `npm audit --audit-level=high` passed.
- `BUILD_SHA=845d41a6234dbc9254c736cfdacbf70d696c71c1 cargo build --release` passed. The release binary ran with an otherwise empty environment plus only `PORT=18081` and returned the tested SHA from `/health`.
- The exact Docker build could not be run because this verifier image has no `docker` executable. This is an environment limitation, not a substitute for Docker validation.

### Deployment identity, headers, privacy, PWA, and performance — PASS

- Live `/health` returned `{"build_sha":"845d41a6234dbc9254c736cfdacbf70d696c71c1","status":"ok"}`.
- Local/live SHA-256 matched exactly: `index.html` `a3c4d330…`, JS `dc09e8f9…`, CSS `c7007f1e…`.
- Live response headers include CSP with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and `Permissions-Policy` disabling camera, microphone, and geolocation. Hashed JavaScript has `public, max-age=31536000, immutable`; HTML has `no-cache`.
- In a fresh demo browser context, the full sample flow made only same-origin requests, created no cookies or local-storage entries, made no console/page errors, and downloaded `family-doodle-relay.png`.
- The live service worker controlled `/demo` and reloaded the demo successfully after the context was switched offline.
- The 143,503-byte hero AVIF is within the 300 KB mobile image budget; initial JS is well inside the 200 KB budget.

### Accessibility and responsive checks — PASS

- Playwright Axe found zero serious or critical issues on `/`, `/demo`, `/privacy`, `/terms`, and the live designed 404.
- At 390 px, `/demo` has no horizontal overflow (`qa-evidence/verify-4-live-mobile.png`).
- Keyboard activation added a sample mark; keyboard-focused controls have the designed 4 px `rgb(156, 47, 36)` visible focus outline.
- With reduced motion emulated, the turn-rule animation duration is `0.00001s`.

Sign-in/Entra is not applicable: the product intentionally has no accounts. The brief does not call for an AI feature.

## Required release fix and retest

Restore one durable state owner in production and prove it before release, or move rooms and rate-limit state to infrastructure shared safely by every live worker. Do not rely on local tests alone. Retest from separate live connections: create → immediate authenticated read → join → reconnect → four turns → host end, plus a one-client 55-request burst that produces exactly 20 non-429 responses and 35 `429` responses with `Retry-After`.
