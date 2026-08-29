# Verification handoff — Family Doodle Relay

- Work order: `family-doodle-relay-verify-6`
- Candidate: `b8044b66a2010d536294fc2e11e1a707703c9514`
- Live URL: <https://family-doodle-relay.sociobot.in>
- Demo URL: <https://family-doodle-relay.sociobot.in/?demo=1>
- Result: **PASS — candidate accepted**

Independent verification found that the live `/health` endpoint reports the exact candidate SHA. The first screen plainly says the product is a remote drawing game for a child and trusted adult and provides the required one-click sample demo. All 13 declared claims passed from the clean checkout.

Verified locally with `npm ci`, every exact command in `.factory/claims.json`, `npm run test:claims`, `npm test`, `npm run lint`, and `npm run build`. The complete suite passed: 7 Rust tests, 4 deployment topology tests, and 16 Chromium tests. The default runtime also served `/health` on port 8080 with no product configuration required.

Verified live: candidate build identity, demo isolation and same-origin request log, locally created PNG download, invalid invite recovery, host-controlled disconnect, service-worker offline demo reload, 390 px layout, keyboard focus, reduced motion, Axe serious/critical findings, security/cache headers, and Lighthouse mobile (99 performance, 100 accessibility; LCP 1.46 s, CLS 0). A one-client live API burst observed the required allowance: 20 requests passed and the next 10 returned `429` with `Retry-After: 1`.

No product defects remain open. Docker is unavailable in this disposable verifier container, so a local Docker build was not run; this is the only environment limitation. Full evidence is in [`.factory/verification-6.md`](verification-6.md).
