# Draw together from two places — review 4

Reviewed 6 September 2026 against <https://family-doodle-relay.sociobot.in>.

- Work order: `family-doodle-relay-review-4`
- Implementation candidate: `1a60bea4d0294133314922b1b8d05c842743016e`
- Documentation supplied at review start: `6d5d9fc61832c13adc3e22c869a059b7eec6425a`
- Live health build: `a7fae6ac21f4244d1445b237b81f246f2db465ec`
- Live revision: `sf-family-doodle-relay--0000050`

## Verdict

**FAIL. Finding count: 2. Untested claim count: 0.**

The private two-person relay, sample demo, claims, accessibility automation, backend limits, persistence, and deployment checks pass. Two required navigation and first-screen details do not: a standard short phone viewport clips one of the three required first-screen facts, and browser Back does not restore the landing-page scroll position.

## Findings

### F-4-1 — Minor — the third required first-screen fact is clipped on a standard phone viewport

The fresh 390 × 844 phone check passes, but the Playwright iPhone 13 profile exposes a 390 × 664 browser viewport. At scroll position zero, the first screen shows the job, audience, first action, next-step text, and the first two facts. The final fact, **“$6 once, no subscription,”** starts at `y=652.375` and ends at `y=677.875`, below the 664 px viewport.

This misses the plain-words contract requiring all three short facts on the first screen. The fixed 610 px phone `.hero-copy` minimum height plus the 72 px header makes this unavoidable on that viewport.

Evidence: `/work/.evidence/review-4/first-screen-iphone13.json` and `/work/.evidence/review-4/first-screen-iphone13.png`.

Required fix: reduce the phone header/hero vertical spacing or remove the fixed minimum so all three facts fit at 390 × 664 without hiding the job, audience, action, or next-step text.

### F-4-2 — Minor — browser Back loses the reader's landing-page position

From the bottom of the live landing page, the recorded position was `y=2782`. After opening the footer Privacy link and pressing browser Back, the landing page returned at `y=0`, although focus correctly moved to its H1.

The site-structure contract requires back/forward navigation to restore scroll and focus. `route()` currently calls `window.scrollTo(0,0)` for every route, including `popstate`, so a reader loses their place on the long landing page.

Evidence: `/work/.evidence/review-4/live-back-scroll.json`.

Required fix: reset scroll for new navigation only. Preserve or restore each history entry's scroll position on back/forward while retaining the route focus announcement.

## First screen before scrolling

Fresh desktop and phone contexts started with no stored data and `scrollY=0`.

- Job: **“Draw together from two places.”**
- Audience: **“For a child and one trusted adult who want a calm game between calls.”**
- First action: **“Try it with sample data.”**
- Next step: **“A sample relay opens next. Nothing is saved.”**

At 1440 × 900 and 390 × 844, all three facts also fit. The 390 × 664 result is F-4-1.

## Clean checkout and claims

A detached clean checkout at the implementation SHA used Node 22.23.2, npm 10.9.8, and Rust 1.98.0. `npm ci` installed the locked 48 packages with zero reported vulnerabilities. Every literal `test` command in `.factory/claims.json` then ran independently.

| Claim | Result | Observable result |
| --- | --- | --- |
| `demo-sandbox` | PASS | Real storage and cookies stayed unchanged; demo actions avoided room and third-party APIs. |
| `privacy-defaults` | PASS | Route/control probes found no accounts, public rooms, ads, tracking, or open chat. |
| `browser-storage` | PASS | Room credentials, license, and license cache stayed in local storage only. |
| `png-export` | PASS | The downloaded PNG contained every finished panel and shown guess. |
| `download-local` | PASS | The export flow made only same-origin requests. |
| `two-person-limit` | PASS | The first guest joined and a third player received 409. |
| `room-expiry` | PASS | New rooms use a four-hour expiry and the boundary deletion regression passed. |
| `one-time-price` | PASS | The recorded contract proves USD 600, one-time, non-recurring checkout through Sociobot. |
| `purchase-provider` | PASS | The recorded contract and terms identify Dodo Payments and its order/return handling. |
| `family-edition` | PASS | Forged paid input stayed at four turns; only a valid fixture enabled eight. |
| `refunded-license` | PASS | A revoked fixture remained inactive and could not enable eight turns. |
| `license-check-data-flow` | PASS | One token-only GET reached the documented verification path with no room data. |
| `room-storage-fields` | PASS | The exact SQLite schema and hashed room access keys passed the Rust test. |
| `live-relay` | PASS | Two isolated browsers completed four synchronized 45-second turns. |
| `free-core` | PASS | Two no-license browsers completed four turns and downloaded the PNG without checkout. |
| `host-end-room` | PASS | Host confirmation ended the room for both players with a clear recovery action. |
| `rate-limit` | PASS | API and WebSocket requests allowed 20, then returned 429 with `Retry-After`; shell requests stayed available. |
| `health-build` | PASS | Health returned 200 with a nonempty build identity. |
| `deployment-topology` | PASS | All 18 deployment contract tests passed. |

No public claim on the landing page, legal pages, README, or demo documentation remains outside the manifest. Untested claim count is zero.

## Build and quality gates

- `npm test`: PASS — 9 Rust tests, 1 claim-manifest test, 18 deployment-contract tests, and 24 Chromium tests.
- `npm run lint`: PASS — Rust formatting and Clippy with warnings denied.
- `npm run build`: PASS — `dist/` produced.
- `BUILD_SHA=1a60bea4d0294133314922b1b8d05c842743016e cargo build --release`: PASS.
- `npm audit --audit-level=high`: PASS — zero reported vulnerabilities.
- `git diff --check`: PASS.
- Built assets: 26,987 B JavaScript, 9,953 B CSS, and 64,223 B mobile AVIF.
- Lighthouse 12.8.2 mobile retry: 100 Performance, 100 Accessibility, 100 Best Practices, and 100 SEO; LCP 1,380 ms, TBT 0 ms, CLS 0, transfer 103,819 B.

## Live sample and product paths

One activation of the primary action opened `/?demo=1`. The populated state showed sample invite `SAMPLE-PRESS`, connected partner Sam, turn three of four, a 45-second timer, a house-at-sea drawing, and an existing guess.

The sticky banner **“Demo — sample data, nothing is saved”** remained present through reset and completion. Reset restored the sample. Completion showed two drawing panels and two realistic guesses, and downloaded `family-doodle-relay.png`. Seeded real room, license, license-cache, session, and cookie values remained byte-for-byte unchanged. During the demo interval there were no room API or off-origin requests.

A fresh live desktop host and phone guest completed four synchronized turns. Blank-guess recovery announced the error and focused the field. An 80-character unbroken guess remained focused during refresh, completed, and wrapped on the phone result. A third join returned 409. Malformed JSON returned 422. Unknown and cross-room credentials returned 404. Forged paid input stayed at four turns. Host closure propagated to both players. A live invalid-license check sent one token-only GET, used no cookie or session storage, and explained that the license was inactive.

## Accessibility, routes, privacy, and offline behavior

- `/`, `/?demo=1`, `/demo`, `/play`, `/privacy`, and `/terms` return 200 with route-specific titles. A missing address deliberately returns the designed HTTP 404 with a return action.
- Each route has `lang=en`, one H1, one main landmark, image alternatives, skip link, header, footer, legal links, and complete metadata.
- Live Axe checks found no serious or critical issue; the complete local route sweep found no Axe violation.
- The 390 × 844 sweep found no ordinary overflow or visible target below 44 × 44 px. At 200% zoom the H1, main content, and controls remained available. Reduced motion changed animated durations to `0.00001s` and scroll behavior to `auto`.
- Keyboard drawing controls, Enter/Space actions, error live regions, visible 4 px focus treatment, route focus, and the skip link worked. F-4-2 is the remaining history behavior defect.
- The active service worker had no waiting or installing worker. After browser-cache clearing and network disablement, the controlled demo reloaded with its populated state.
- The link crawl returned 200 for product and factory pages, 303 for the hosted checkout, and explicit `mailto:` contacts. The only crawled 404 was the deliberate missing-page link used to inspect the 404 design.
- Security headers include CSP with header-delivered `frame-ancestors 'none'`, `nosniff`, no-referrer, and disabled camera, microphone, and geolocation. HTML, API, health, service-worker, and 404 responses are not immutable-cached.

## Backend, persistence, and deployment identity

- Fresh live API burst: 20 ordinary responses, then 35 `429` responses with `Retry-After: 1`.
- Fresh live WebSocket handshake burst: 20 ordinary responses, then 35 `429` responses with `Retry-After: 1`.
- After two seconds, the API recovered to its ordinary 404. Root, service worker, and built-script bursts each returned 55/55 HTTP 200.
- Two fresh rooms had distinct codes. Each correct key read its own room with 200; a cross-room key and a wrong key received 404. Three other rooms each survived six concurrent independent reads and accepted one guest.
- A release binary started with only `PORT`, created a room, shut down gracefully, restarted against the same SQLite snapshot, and read the room with 200. Health reported the implementation SHA before and after restart.
- Production uses Single revision mode, min/max replicas 1/1, one healthy active revision with one replica and 100% traffic, and an Azure Files volume mounted at `/data` with the required non-root ownership options. The repository validator accepted the live template and revision ownership.

Live `/health` reports the later documentation-only SHA `a7fae6a…`. All changes from implementation `1a60bea…` through the supplied documentation SHA `6d5d9fc…` are under `.factory/`. All 17 files served from the build are byte-for-byte equal to the fresh implementation build, including the deliberate 404 response. The live runtime therefore matches the implementation candidate.

Only the product's own `sf-family-doodle-relay` Container App was inspected. No other application, database, staging slot, secret, or shared service configuration was read or changed.

## Earlier findings

Every earlier review and verification report, including minor findings, was inspected. Their fixes remain present and were reproved as follows.

| Earlier finding IDs | Current disposition |
| --- | --- |
| `V-01`, `V2-01`, `V3-01`, `V4-01` | CLOSED — real two-browser completion, independent concurrent reads, tenant isolation, one replica, and durable `/data`. |
| `V-02`, `V2-05`, `V-06` | CLOSED — forged paid input stays free, valid paid behavior has a positive fixture, and PNG contents are inspected. |
| `V-03`, `V2-03` | CLOSED — live checkout returns 303 to hosted Dodo checkout. |
| `V-04` | CLOSED — live expiry is four hours and the exact expiry-boundary test passes. |
| `V-05`, `V2-04`, `V3-02`, `V4-02` | CLOSED — fresh API and WebSocket bursts enforce the 20-request allowance with `Retry-After`. |
| `V-07`, `V2-08` | CLOSED — TypeScript, Rust format, Clippy, and aggregate gates pass. |
| `V-08`, `V2-06` | CLOSED — the 390 × 844 control sweep has no undersized target. F-4-1 concerns viewport content, not target size. |
| `V-09` | CLOSED — limiter cleanup regression passes. |
| `V2-02` | CLOSED — human-paced input and focus survive updates; the 80-character boundary completes live. |
| `V2-07` | CLOSED — cache-cleared offline demo reload passes. |
| `V2-09` | CLOSED — the HTTP 404 has the standard structure, metadata, navigation, footer, and return action. |
| `V3-03` | CLOSED — all public claims are listed and all 19 commands pass. |
| `V7-01`, `V8-01`, `V9-01`, `V10-01`, `V11-01`, `V12-01`, `V13-01` | CLOSED — the live revision is healthy, active, single-owner, durable, and byte-equal to the implementation build. |
| `V7-02` | CLOSED — the 80-character result wraps at 390 px. |
| `V7-03` | CLOSED — host room ending is listed and passes locally and live. |
| `V7-04` | CLOSED — current Axe sweeps report no landmark violation. |
| `V9-02` | CLOSED — verifier failure falls back to a free room and allows license removal. |
| `V9-03`, `V9-04` | CLOSED — provider, refund, recipient, and token-only data-flow claims are listed and pass. |
| `V12-02` | CLOSED — the full implementation SHA is available and was used in the clean checkout. |
| `V15-01` | CLOSED — aggregate tests pass and static reloads stay outside the room limiter. |
| `F-1-1` through `F-1-8` | CLOSED — copy is literal, download locality is listed, and the real 404 metadata is complete. |
| `F-2-1` through `F-2-12` | CLOSED — demo/storage assertions, privacy probes, free/provider claims, phone target size, naming, and deployment wording remain corrected. |
| `F-3-1` through `F-3-8` | CLOSED — checkout contract, storage disclosure, license/refund claims, links, terminology, and README command wording remain corrected. |

Verifications 5, 6, 14, and 16 reported no findings; their accepted product paths were re-exercised above. The new F-4-1 and F-4-2 findings are not recurrences of those earlier defects.

AI assistance is not missed leverage for this small cooperative drawing relay. Live synchronization and local PNG export cover the useful extension implied by the brief without adding child-data processing.

## Final counts

- Findings: **2**
- Untested claims: **0**
- Verdict: **FAIL**
