# Family Doodle Relay — verification 16 handoff

## Result

**PASS.** Independent verification found zero findings and zero untested claims.

- Implementation reviewed: `1a60bea4d0294133314922b1b8d05c842743016e`
- Supplied documentation and evidence: `8c8cdbc31ed600bae7b519423011f7fad8daf401`
- Documentation follow-up reviewed: `a7fae6ac21f4244d1445b237b81f246f2db465ec`
- Live URL: <https://family-doodle-relay.sociobot.in>
- Full report: [`.factory/verification-16.md`](verification-16.md)

## What was verified

- Fresh desktop and phone first screens state the drawing job, child-and-adult audience, and sample-data first action before scrolling.
- The one-click demo is populated, persistently labelled, resettable, and isolated from seeded real browser data.
- A live desktop host and phone guest completed all four synchronized turns and downloaded the complete PNG strip.
- Invalid invites, blank guesses, the 80-character boundary, third-player denial, forged paid input, tenant isolation, host closure, and recovery paths passed.
- Every one of the 19 literal claim commands passed from a clean checkout.
- Two consecutive `npm test` runs passed 24 browser tests, 9 Rust tests, the claim-manifest test, and 18 deployment-contract tests.
- Lint, release build, `dist/`, TypeScript, Rust formatting, Clippy, and diff checks passed.
- Live route, metadata, legal, link, keyboard, focus, phone sizing, reduced-motion, Axe, service-worker update, offline reload, privacy, and 404 checks passed.
- API and WebSocket bursts allowed 20 requests, then returned 429 with `Retry-After: 1`. Rapid shell, service-worker, and script requests remained 55/55 HTTP 200.
- The active deployment has one healthy replica, 100% traffic, one active revision, and durable `/data`. The live deployment validator passed.
- Mobile Lighthouse 12.8.2 scored 100 in Performance, Accessibility, Best Practices, and SEO.

## Build identity note

Production is now revision `sf-family-doodle-relay--0000050` and `/health` reports `a7fae6ac21f4244d1445b237b81f246f2db465ec`, a later documentation-only commit. All non-`.factory` source is identical to implementation `1a60bea…`, and all 17 served built files match the fresh implementation build. The runtime under review is therefore the implementation candidate even though the container records the later report commit.

## Run locally

```sh
npm ci
npm test
npm run lint
npm run build
BUILD_SHA=1a60bea4d0294133314922b1b8d05c842743016e cargo build --release
```

Open `http://127.0.0.1:8080/?demo=1` after starting the server. See [`.factory/demo.md`](demo.md) for sample behavior.

## Known gaps

None found. Billing registration and hosted checkout operation remain factory responsibilities outside this repository; the live checkout redirect was available during verification.
