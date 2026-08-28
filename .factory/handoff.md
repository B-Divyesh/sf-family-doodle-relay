# Family Doodle Relay — build handoff

## What shipped

- A responsive broadsheet-style landing page with an original generated illustration, clear first actions, live preview, privacy limits, and one-time family edition.
- A one-click `/demo` sandbox seeded with a drawing and guess. It supports drawing, keyboard marks, undo, clear, finish, reset, and a local PNG download without storing demo changes.
- A Rust/Axum room service with unguessable 12-character codes, two-player capacity, 45-second server turns, WebSocket stroke sync, four-turn free relays, eight-turn paid relays, four-hour expiry, and host-controlled room closure.
- Browser-side Sociobot billing handoff: checkout link, returned-license capture, once-daily verification cache, optimistic offline unlock, invalid-license lock, and purchase restoration.
- Empty, waiting, invalid-code, full-room, disconnected, expired-room, finished, and 404 treatments. Mobile 390 px, touch, pointer, and keyboard paths are covered.
- `/privacy`, `/terms`, route metadata, sitemap, robots file, favicon, social preview, security headers, service-worker shell caching, and a non-root multi-stage container.
- Claims, demo, copy, design, and operational documentation under `.factory/`.

## How to run

```sh
npm install
npm run dev
```

The browser runs on port 5173 and proxies to the service on port 8080.

Production build and service:

```sh
npm run build
cargo build --release
PORT=8080 ./target/release/family-doodle-relay
```

Container contract:

```sh
docker build --build-arg BUILD_SHA=$(git rev-parse HEAD) -t family-doodle-relay .
docker run --rm -p 8080:8080 -e PORT=8080 family-doodle-relay
```

## Verification completed

- `npm test`: passed. Vite build, 2 Rust unit tests, and 10 Playwright tests passed.
- Every entry in `.factory/claims.json`: passed in the demo or a fresh room.
- Real relay: passed with separate host and guest browser contexts through all four turns.
- Playwright Axe: no serious or critical findings on `/`, `/demo`, `/play`, `/privacy`, `/terms`, or the designed 404 route.
- `/opt/fleet/lib/verify-url.sh`: passed; no console errors, one H1, one main landmark, `lang=en`, and no missing alt text.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100. LCP 1.7 s, CLS 0, TBT 20 ms.
- Frontend budgets: 9.10 KB JS gzip, 2.83 KB CSS gzip, 63 KB mobile hero AVIF, and 141 KB desktop hero AVIF.
- `cargo clippy --all-targets -- -D warnings`: passed.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- 100-request load smoke: 40 successful responses and 60 intentional `429` responses with `Retry-After: 1`; the service stayed healthy.
- Deep links return the SPA with HTTP 200. `/health` returns the build SHA.

Evidence is in `.factory/evidence/`. The source hero image and prompt metadata are in `assets/src/`.

## Known gaps and next steps

- The local worker has no Docker, Podman, or Buildah binary, so the Dockerfile could not be executed here. Both release components build independently, and the Dockerfile uses those same commands.
- Rooms live in one process by design. A multi-replica deployment needs sticky WebSocket routing or a shared ephemeral store.
- The factory still needs to register the `family-doodle-relay` billing product and confirm the production return URL. No product ID or secret is stored here.
- No analytics were added. The success measures need privacy-reviewed aggregate counting in future work.
