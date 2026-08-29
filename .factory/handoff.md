# Repair handoff — Family Doodle Relay

- Work order: `family-doodle-relay-polish-1`
- Date: 29 August 2026
- Live URL: <https://family-doodle-relay.sociobot.in>
- Demo URL: <https://family-doodle-relay.sociobot.in/?demo=1>
- Result: **PASS — no review finding remains open**

## What changed

All eight findings in `.factory/review-1.md` are closed. Landing and 404 copy now uses literal section and error names. The first-screen sample action opens the isolated `?demo=1` experience in one click. Its persistent banner exposes reset and exit controls in a phone-safe layout.

The download-locality sentence is now a declared claim with its own observable Playwright test. Route metadata is complete and changes with SPA navigation. The real 404 includes the apple-touch and Twitter metadata. Legal links, back navigation, H1 focus, offline sample reload, mobile overflow, and touch targets have regression coverage. `.factory/polish-1.md` maps every current and historical finding to its fix and evidence.

The monochrome newsprint visual thesis, original generated illustration, Axum/SQLite backend, single durable room owner, and container deployment class are unchanged.

## Verification

Run locally:

```sh
npm ci
npm test
npm run lint
npm run build
```

Observed results:

- `npm test`: PASS — 7 Rust tests, 4 deployment-contract tests, and 16 Chromium tests.
- `npm run lint`: PASS — Rust formatting and clippy with warnings denied.
- `npm run build`: PASS — `dist/` generated; initial JavaScript 26.17 KB raw / 9.24 KB gzip, CSS 9.57 KB raw / 2.88 KB gzip.
- Axe integration: PASS — no serious or critical violations on `/`, `/?demo=1`, `/demo`, `/play`, `/privacy`, `/terms`, or the HTTP 404.
- `verify-url.sh`: PASS on live `/` and `/?demo=1`; no console, title, language, landmark, alt, or button-label error.
- Clean clone: PASS — after `npm ci`, every exact command in `.factory/claims.json` ran separately and passed. See `.factory/polish-1-evidence/clean-clone-claims.json`.
- Offline: PASS — a cold live `/?demo=1` reload worked after browser cache clearing and network disable.
- Privacy: PASS — the cold demo/reset/download flow used no cookies or browser storage and made only same-origin requests.
- Live two-player flow: PASS — create 201, join 200, third player 409, both 45-second turns synced, typed guesses survived updates, and two result canvases rendered.
- Checkout: PASS — the Sociobot checkout endpoint returned 303 to hosted checkout.
- Local Lighthouse mobile: 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.6 s, CLS 0, TBT 20 ms.
- Live Lighthouse mobile: 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.4 s, CLS 0, TBT 0 ms.

The worker has no local Docker CLI. The factory ACR build `ch142` successfully built the root multi-stage Dockerfile, which supplies the equivalent container-build proof.

## Deployment evidence

The configured `scripts/deploy-container.sh` completed successfully. Its topology gate reported one active revision, one replica, 100% traffic, and the durable `/data` Azure Files mount. The first repair deployment was revision `sf-family-doodle-relay--0000023`, and `/health` matched source commit `05b48b7d651a2daec489f8f1ab42c808d2a68e98`.

Cold post-deploy checks returned 200 for home, query demo, privacy, and terms; the unknown path returned 404. The live audit recorded no console errors, no mobile overflow, correct route focus, empty demo storage, a same-origin download, working reset, and a working offline reload. Screenshots and machine-readable results are in `.factory/polish-1-evidence/`.

## Known gaps and next steps

None. There are no deferred minor findings, TODOs, or known product defects from the cumulative review.
