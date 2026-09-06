# Family Doodle Relay — independent verification 17

## Verdict: PASS

**PASS.** I found zero product findings and zero untested public claims.

- Work order: `family-doodle-relay-verify-17`
- Job: draw, guess, and add a detail together in a private two-person room.
- Audience: a child and one trusted adult playing from different places.
- First action: **Try it with sample data**; it opens a populated sample relay.
- Implementation candidate: `c2a06f834bad070d26f230594b7a72d5ccbdde68`
- Documentation SHA: `6085f35a57eea86b2a2fe5e012e63291f17f7f7e`
- Live URL: <https://family-doodle-relay.sociobot.in>
- Live `/health`: HTTP 200, `status: ok`, build identity `6085f35a57eea86b2a2fe5e012e63291f17f7f7e`.

The live build identity is the documentation SHA. Its diff from the implementation candidate changes only `.factory/copy-audit.md` and `.factory/handoff.md`; it contains no product code or built asset change. The live runtime therefore matches the last implementation candidate under the work-order rule for later report-only commits.

## Fresh checkout and claims

I cloned a new checkout, checked out the implementation candidate, ran `npm ci`, then ran every literal `test` command in `.factory/claims.json` serially. All 19 passed. The dedicated manifest test also passed, so each public claim has one tagged test and a runnable command.

| Claim | Result | Evidence |
| --- | --- | --- |
| demo-sandbox | PASS | `npm test -- --grep @claim:demo-sandbox` |
| privacy-defaults | PASS | `npm test -- --grep @claim:privacy-defaults` |
| browser-storage | PASS | `npm test -- --grep @claim:browser-storage` |
| png-export | PASS | `npm test -- --grep @claim:png-export` |
| download-local | PASS | `npm test -- --grep @claim:download-local` |
| two-person-limit | PASS | `npm test -- --grep @claim:two-person-limit` |
| room-expiry | PASS | `npm test -- --grep @claim:room-expiry` |
| one-time-price | PASS | `npm test -- --grep @claim:one-time-price` |
| purchase-provider | PASS | `npm test -- --grep @claim:purchase-provider` |
| family-edition | PASS | `npm test -- --grep @claim:family-edition` |
| refunded-license | PASS | `npm test -- --grep @claim:refunded-license` |
| license-check-data-flow | PASS | `npm test -- --grep @claim:license-check-data-flow` |
| room-storage-fields | PASS | `cargo test tests::claim_room_storage_fields -- --exact` |
| live-relay | PASS | `npm test -- --grep @claim:live-relay` |
| free-core | PASS | `npm test -- --grep @claim:free-core` |
| host-end-room | PASS | `npm test -- --grep @claim:host-end-room` |
| rate-limit | PASS | `npm test -- --grep @claim:rate-limit` |
| health-build | PASS | `npm test -- --grep @claim:health-build` |
| deployment-topology | PASS | `npm run test:deployment` |

The unfiltered `npm test` also passed: production build, TypeScript, 9 Rust tests, the claims manifest test, 18 deployment-contract tests, and 25 Chromium tests. `npm run lint`, `npm run build`, `npm audit --audit-level=high`, `BUILD_SHA=c2a06f834bad070d26f230594b7a72d5ccbdde68 cargo build --release`, and `git diff --check` passed. Audit found zero vulnerabilities. The build emitted 27.82 kB raw / 9.69 kB gzip JavaScript and 10.02 kB raw / 2.96 kB gzip CSS.

## Fresh live checks

- Fresh desktop and 390 × 664 iPhone contexts started at scroll position zero. Before scrolling, both showed the job, audience, sample action, next-step sentence, and all three facts. The phone’s third fact remained entirely visible.
- One click opened the realistic sample relay with the persistent label **“Demo — sample data, nothing is saved.”** It showed Sam, a house-at-sea guess, the active third turn, then two finished panels and two guesses. The download was `family-doodle-relay.png`; Reset demo restored the sample.
- With seeded real local storage, session storage, and a cookie, finishing, resetting, and leaving demo left all three byte-for-byte unchanged. The demo flow made no room API or off-origin request.
- A fresh desktop host and fresh 390 px phone guest completed all four synced 45-second turns. The host observed `00:44`, the phone saw the final guess without horizontal overflow, and the PNG downloaded.
- Empty guess submission says “Write a guess before sending it.” A host ending a room produced “The host ended this room. Make a new room to play again.” plus a visible Make a new room link for both players.
- A warmed, cache-cleared demo reloaded offline and showed “Add one surprising detail.” Reduced-motion media preference was active. From a deep landing scroll of 3749 px, Privacy opened at zero; Back restored exactly 3749 px and focused the landing H1; Forward focused the Privacy H1.
- `/`, `/demo`, `/play`, `/privacy`, and `/terms` returned HTTP 200 with their route-specific titles. `/not-a-page` returned the deliberate, designed HTTP 404 with its own title, H1, main landmark, and return path. The 404 response is expected, not a defect.
- Axe on all six routes found zero serious or critical violations. Each had `lang=en`, one H1, one main, and no image missing `alt`. Initial live desktop and phone loads had no console or page errors; the only console entry in the all-route scan was the browser’s expected failed-resource message for the deliberate 404 response.
- Every product, legal, factory, metadata, favicon, and social link returned 200; the checkout link returned its expected HTTP 303; support and privacy contacts are `mailto:` links. The 404 page’s skip link resolves to its designed 404 document, as expected for that route.
- Live rate bursts produced exactly 20 ordinary API responses and 35 HTTP 429 responses with `Retry-After: 1`; WebSocket handshakes gave 20 ordinary responses and 35 429 responses. Fifty-five rapid requests each to `/`, `/sw.js`, and the built JavaScript returned only 200.
- Mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1,455 ms, TBT 2 ms, CLS 0.

## Earlier findings

I reviewed `.factory/review-1.md` through `review-4.md`, `polish-1.md` through `polish-3.md`, and every prior verification report. Their findings are closed and did not recur:

| Earlier findings | Current disposition |
| --- | --- |
| V-01 through V-09; V2-01 through V2-09; V3-01 through V3-03; V4-01 and V4-02 | Closed: live two-browser completion, durable SQLite regressions, room expiry, free/paid behavior, 20-request limit, PNG output, phone controls, offline reload, and designed 404 pass. |
| V7-01 through V7-04; V8-01; V9-01 through V9-04; V10-01; V11-01; V12-01 and V12-02; V13-01; V15-01 | Closed: source identity, single-owner durable deployment gate, successful aggregate gates, static-shell limiter exemption, payment/license cases, and 404/accessibility regressions pass. |
| F-1-1 through F-1-8 | Closed: plain first-screen language, useful section headings, non-decorative labels, download-local claim coverage, and complete 404 metadata remain present. |
| F-2-1 through F-2-12 | Closed: demo isolation, local-only storage, privacy surface checks, free core, payment wording, target sizes, consistent PNG naming, plain rate/deploy copy, and deployment-contract scope remain proved. |
| F-3-1 through F-3-8 | Closed: price and provider fixtures, server-storage inventory, token-only verification flow, refund state, link crawl, consistent demo wording, and accurate claim-command documentation remain proved. |
| F-4-1 and F-4-2 | Closed: the 390 × 664 first-screen contract fits, and Back/Forward restores exact saved scroll position while focusing the new route H1. |

## Result

Finding count: **0**. Untested public claim count: **0**. No code was modified during this verification.

