# Family Doodle Relay — review 4 handoff

## Result

**FAIL.** Review 4 found two minor defects and zero untested claims.

- Implementation reviewed: `1a60bea4d0294133314922b1b8d05c842743016e`
- Documentation supplied at review start: `6d5d9fc61832c13adc3e22c869a059b7eec6425a`
- Live health build: `a7fae6ac21f4244d1445b237b81f246f2db465ec`
- Live URL: <https://family-doodle-relay.sociobot.in>
- Full report: [`.factory/review-4.md`](review-4.md)

## Findings to fix

1. At the standard Playwright iPhone 13 viewport (390 × 664), the third required first-screen fact is clipped below the fold. Reduce phone header/hero spacing or the fixed hero minimum height.
2. Browser Back resets the long landing page to the top. Restore the prior scroll position on `popstate` while keeping route focus and announcements.

## What passed

- All 19 literal claim commands passed independently after `npm ci` in a detached clean checkout.
- `npm test`, `npm run lint`, `npm run build`, the candidate release build, `npm audit --audit-level=high`, and `git diff --check` passed.
- The live one-click demo is populated, persistently labelled, resettable, downloadable, and isolated from seeded real browser data.
- A live host and phone guest completed four synchronized turns. Invalid, boundary, third-player, forged-paid, room-isolation, host-end, and recovery paths passed.
- Live routes, titles, legal pages, links, 404 design, keyboard actions, focus treatment, reduced motion, offline reload, privacy flow, and Axe checks passed apart from the two findings above.
- Live API and WebSocket bursts each allowed 20 requests, then returned 429 with `Retry-After: 1`; static shell requests remained available.
- Local restart persistence passed. Production has one healthy active replica, durable `/data`, and 100% traffic; the live deployment validator passed.
- All 17 served build files match the implementation candidate byte for byte.
- Lighthouse 12.8.2 scored 100 in Performance, Accessibility, Best Practices, and SEO.

## Run locally

```sh
npm ci
npm test
npm run lint
npm run build
BUILD_SHA=1a60bea4d0294133314922b1b8d05c842743016e cargo build --release
```

Open `http://127.0.0.1:8080/?demo=1` after starting the server. See [`.factory/demo.md`](demo.md) for the sample behavior.

## Evidence

Detailed evidence is in `/work/.evidence/review-4/`. The required report copy and machine result are `/work/.evidence/qa-report.md` and `/work/.evidence/qa-result.json`.

## Next step

Repair F-4-1 and F-4-2 in product code, deploy the resulting implementation, and rerun the complete review. No earlier finding is deferred.
