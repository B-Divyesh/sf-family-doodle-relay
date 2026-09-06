# Draw together from two places — verification 16

Verified 5 September 2026 against <https://family-doodle-relay.sociobot.in>.

- Work order: `family-doodle-relay-verify-16`
- Implementation reviewed: `1a60bea4d0294133314922b1b8d05c842743016e`
- Supplied documentation and evidence: `8c8cdbc31ed600bae7b519423011f7fad8daf401`
- Documentation follow-up at the start of this review: `a7fae6ac21f4244d1445b237b81f246f2db465ec`
- Live health build: `a7fae6ac21f4244d1445b237b81f246f2db465ec`
- Live revision: `sf-family-doodle-relay--0000050`

## Verdict

**PASS. Finding count: 0. Untested claim count: 0.**

The implementation completes the private two-person drawing relay on desktop and phone. Every declared claim command passed from a clean checkout. The live demo, real relay, recovery paths, accessibility checks, offline reload, request limits, durable backend topology, and current deployment identity also passed.

Production advanced after the supplied repair evidence. Revision `0000050` reports the later documentation-only commit `a7fae6a…`, while the work order named revision `0000049` and implementation `1a60bea…`. This is not a runtime mismatch: the Git diff from `1a60bea…` through `a7fae6a…` changes only `.factory/`, all non-`.factory` files are identical, and all 17 live built files are byte-for-byte identical to a fresh build of `1a60bea…`.

## First screen before scrolling

Fresh 1440 × 900 desktop and 390 × 844 phone contexts opened at scroll position zero with no stored data.

- Job: **“Draw together from two places.”**
- Audience: **“For a child and one trusted adult who want a calm game between calls.”**
- First action: **“Try it with sample data.”**
- Next step: **“A sample relay opens next. Nothing is saved.”**
- Facts visible in the first viewport: two people only, rooms close within four hours, and $6 once with no subscription.

The headline, audience, actions, next-step text, and three facts all fit in both first viewports. Neither context had horizontal overflow or console errors.

## Clean checkout and claim commands

A new clone was detached at the exact implementation SHA. The documented prerequisites were present: Node 22.23.2, npm 10.9.8, and Rust 1.98.0. `npm ci` installed 48 packages with zero audit vulnerabilities.

Every literal `test` value in `.factory/claims.json` ran independently and passed:

| Claim | Result | Observable proof |
| --- | --- | --- |
| `demo-sandbox` | PASS | Real room, license, cache, session, and cookie sentinels stayed byte-for-byte unchanged through finish, reset, and exit; no demo API or off-origin request. |
| `privacy-defaults` | PASS | Route/control crawl, excluded-route probes, cookies, and request log found no accounts, public rooms, ads, tracking, or open chat. |
| `browser-storage` | PASS | Room credentials, license, and license cache used local storage only. |
| `png-export` | PASS | The 1200 × 728 PNG contained both result panels and both shown guesses. |
| `download-local` | PASS | The complete demo export flow made only same-origin requests. |
| `two-person-limit` | PASS | First guest joined; a third player received 409. |
| `room-expiry` | PASS | New expiry was four hours; the Rust boundary test deleted an expired room. |
| `one-time-price` | PASS | Recorded contract proved USD 600, one-time, non-recurring, and a 303 hosted-checkout redirect. The live link also returned 303 to the Dodo checkout origin. |
| `purchase-provider` | PASS | Recorded checkout and live terms identify Dodo Payments and its order/return handling. |
| `family-edition` | PASS | Forged `paid: true` stayed at four turns; only the valid fixture enabled eight. |
| `refunded-license` | PASS | A revoked fixture remained inactive and could not enable eight turns. |
| `license-check-data-flow` | PASS | One GET sent one `license` query field to the documented endpoint, with no body or room data. |
| `room-storage-fields` | PASS | The exact SQLite schema and hashed access keys passed the dedicated Rust test. |
| `live-relay` | PASS | Two isolated browsers completed all four synced 45-second turns. |
| `free-core` | PASS | Two no-license browsers completed four turns and downloaded the PNG without opening checkout. |
| `host-end-room` | PASS | Host confirmation ended the room for both players and showed a clear new-room recovery link. |
| `rate-limit` | PASS | API and WebSocket requests allowed 20 then returned 429 with `Retry-After`; 55 shell, service-worker, and script requests each stayed 200. |
| `health-build` | PASS | Health returned 200, `status: ok`, and a nonempty full build identity. |
| `deployment-topology` | PASS | All 18 contract tests passed; the same validator accepted the current live template, revision ownership, and ready revision. |

There are 19 manifest entries, exactly one tagged test per claim, and no claim-like public statement was found outside the inventory. The landing page, legal pages, README, and demo documentation were cross-checked.

## Quality gates

- `npm test` passed twice consecutively: 24 browser tests, 9 Rust tests, 1 claim-manifest test, and 18 deployment-contract tests each run.
- `npm run lint` passed Rust formatting and Clippy with warnings denied.
- `npm run build` passed and produced `dist/`.
- `BUILD_SHA=1a60bea4d0294133314922b1b8d05c842743016e cargo build --release` passed.
- `git diff --check` passed.
- Built JavaScript is 26,987 bytes, CSS is 9,953 bytes, and the mobile AVIF is 64,223 bytes.
- A release-binary room remained authorized after graceful shutdown and restart against the same SQLite file; health reported the implementation SHA before restart.

This independently closes verification 15: both complete suites pass, and rapid static reloads no longer consume the room endpoint allowance.

## Live product paths

### Demo and real data

One activation of the first action opened `/?demo=1` with a realistic turn-three relay, a connected sample partner, a house-at-sea drawing, and a prior guess. The banner **“Demo — sample data, nothing is saved”** remained visible and contained **Reset demo** and **Start for real**. Finishing produced a populated two-panel PNG strip. Reset restored the sample.

A separate adversarial run seeded a real room credential, license, license cache, session value, and cookie. Finishing, resetting, and leaving the demo changed none of them. The demo interval made no room API or off-origin request.

### Real relay, invalid input, boundaries, and recovery

- A desktop host made a room through the UI. A fresh 390 px phone guest joined using the 12-character invite.
- Both saw the connected state and completed four synchronized turns. The timer began at 00:44.
- A blank guess announced **“Write a guess before sending it”** and focused the guess field.
- An 80-character unbroken guess stayed focused during refresh, completed, and wrapped without phone overflow.
- Both finished screens showed both guesses and two result canvases. The PNG download was 1200 × 728.
- A short invite produced specific correction text. Malformed JSON returned 422, an unknown room returned 404, and a third join returned 409.
- Forged paid input produced four turns. Eight concurrent authorized reads all returned 200.
- Two new rooms had distinct codes. A room key read its own room with 200 but received 404 for the other room and for a wrong token.
- A separate live host-end run propagated the end state to both browsers and gave each a **Make a new room** recovery action.
- A live invalid-license check sent only the token query to `api.sociobot.in`, stored no cookie or session value, and explained that the license was inactive.

### Routes, accessibility, privacy, and offline use

`/`, `/?demo=1`, `/demo`, `/play`, `/privacy`, and `/terms` returned 200. An unknown address deliberately returned HTTP 404 with the designed page, one H1, one main landmark, complete metadata, and a return action. The 404 response is expected behavior, not a defect.

Every route has `lang=en`, one H1, one main, its own plain title, image alternatives, a skip link, header, footer, and legal links. Local Axe checks reported zero violations. Fresh live Axe checks reported zero serious or critical violations. Keyboard Enter and Space operated demo controls; route navigation moved focus to the new H1; the focus ring was a visible 4 px press-red outline with 3 px offset. Errors use live alert/status regions. Native confirmation supplies dialog focus handling.

At 390 px there was no ordinary horizontal overflow and no visible target below 44 × 44 px. At 200% zoom, the H1 and main content remained available. Reduced motion changed route and turn motion to effectively instant `0.00001s` durations and automatic scroll behavior.

The service worker was active with no waiting or installing worker. After browser-cache clearing and network disablement, the controlled demo reloaded with its populated heading. The complete link crawl returned 200 for product and factory links, 303 for the checkout action, and explicit `mailto:` links for privacy and support.

`verify-url.sh` passed the live root, demo, privacy, and terms routes with no console errors. Response headers include CSP with header-delivered `frame-ancestors 'none'`, `nosniff`, no-referrer, and disabled camera, microphone, and geolocation. Hashed assets are immutable; HTML, the service worker, API output, and 404 content are not cached as immutable assets.

Mobile Lighthouse 12.8.2 scored 100 Performance, 100 Accessibility, 100 Best Practices, and 100 SEO. FCP was 1,052 ms, LCP 1,427 ms, TBT 18 ms, CLS 0, and transfer size 103,864 bytes.

## Live backend and deployment

- `/health` returned HTTP 200 and the current report-only build identity.
- API burst: 20 ordinary 404 responses, then 35 responses with 429 and `Retry-After: 1`.
- WebSocket-handshake burst: 20 ordinary 400 responses, then 35 responses with 429 and `Retry-After: 1`.
- Recovery after 1.2 seconds returned the ordinary 404 instead of another 429.
- Static bursts: 55/55 HTTP 200 for `/`, `/sw.js`, and the built JavaScript.
- The active Container App mode is Single. Revision `0000050` is the only active revision, Healthy, RunningAtMaxScale, one replica, and 100% traffic.
- Scale bounds are one and one. `relay-data` is an Azure Files volume mounted at `/data` with the required non-root ownership options.
- The repository deployment validator accepted the live app template, active ownership, and ready revision.

Only the product's own `sf-family-doodle-relay` Container App was read. No other app, database, staging slot, secret, or shared service setting was inspected or changed.

## Earlier findings

Every earlier finding was checked against current source, clean commands, or fresh live output.

| Earlier finding IDs | Current disposition and proof |
| --- | --- |
| `V-01`, `V2-01`, `V3-01`, `V4-01` | CLOSED — live host/guest completion, 8/8 concurrent reads, tenant isolation, one active replica, and durable `/data`. |
| `V-02` | CLOSED — forged paid input remained a four-turn room; valid-license behavior has a positive fixture. |
| `V-03`, `V2-03` | CLOSED — live checkout returned 303 to hosted Dodo checkout. |
| `V-04` | CLOSED — live four-hour expiry and exact Rust expiry-boundary deletion passed. |
| `V-05`, `V2-04`, `V3-02`, `V4-02` | CLOSED — spoofed-prefix live API and WebSocket probes enforced one 20-request allowance with 429 and Retry-After. |
| `V-06`, `V2-05` | CLOSED — the tagged PNG test inspected both panels and both quotes; valid paid behavior also has a positive test. |
| `V-07` | CLOSED — TypeScript checking is part of both passing aggregate runs. |
| `V-08`, `V2-06` | CLOSED — no visible control below 44 × 44 px on the live phone sweep. |
| `V-09` | CLOSED — stale rate windows are retained for at most 60 seconds; source and full regression passed. |
| `V2-02` | CLOSED — 850 ms human-paced input and focus stayed intact; the 80-character boundary completed live. |
| `V2-07` | CLOSED — a cache-cleared, service-worker-controlled demo reloaded offline. |
| `V2-08` | CLOSED — formatting and Clippy passed. |
| `V2-09` | CLOSED — the real 404 has the standard skeleton, metadata, navigation, footer, and return action. |
| `V3-03` | CLOSED — 19 listed claims, one dedicated test each, and no unlisted public promise found. |
| `V7-01`, `V8-01`, `V9-01`, `V10-01`, `V11-01`, `V12-01`, `V13-01` | CLOSED — one current healthy active revision, one replica, 100% traffic, durable mounted storage, and live validator success. |
| `V7-02` | CLOSED — an 80-character guess wrapped at 390 px with no overflow. |
| `V7-03` | CLOSED — `host-end-room` is listed and passed locally and live. |
| `V7-04` | CLOSED — Axe reported no current landmark violation. |
| `V9-02` | CLOSED — the passing regression starts a free room when license verification is unavailable and offers license removal. |
| `V9-03` | CLOSED — live terms name Dodo Payments, order/return handling, and refund revocation; dedicated claims passed. |
| `V9-04` | CLOSED — live privacy copy names `api.sociobot.in` and the exact token-only request. |
| `V12-02` | CLOSED — the full implementation SHA is available and was checked out in a fresh clone. |
| `V15-01` | CLOSED — two full suites passed; live API/WebSocket limiting and 55/55 static allowances match the repair. |

Verifications 5, 6, and 14 reported no open findings; their accepted paths were re-exercised above.

| Review finding IDs | Current disposition and proof |
| --- | --- |
| `F-1-1` through `F-1-6` | CLOSED — the live caption, section headings, 404 headline, and state labels are literal and useful. The copy audit has no banned word or sentence over 22 words. |
| `F-1-7` | CLOSED — `download-local` is listed and passed. |
| `F-1-8` | CLOSED — the real 404 has canonical, Open Graph, Twitter, favicon, apple-touch, title, description, H1, and main metadata/structure. |
| `F-2-1` | CLOSED — the demo test snapshots all real namespaces before and after mutations, reset, and exit; the live adversarial replay passed. |
| `F-2-2` | CLOSED — browser storage coverage includes the license token and cached verdict. |
| `F-2-3` | CLOSED — the claim describes the deployment gate; 18 contract tests passed and the same validator accepted production. |
| `F-2-4` | CLOSED — the privacy test crawls controls, probes excluded routes, and records traffic/cookies. |
| `F-2-5` | CLOSED — `free-core` is listed and its complete two-browser path passed. |
| `F-2-6` | CLOSED — `purchase-provider` is listed and proved by recorded checkout plus matching live terms. |
| `F-2-7`, `F-2-8` | CLOSED — the old unproved collection and embedded-secret statements remain absent; current privacy statements are listed and tested. |
| `F-2-9` | CLOSED — no live phone target was undersized. |
| `F-2-10` | CLOSED — the interface and README consistently call the download a PNG strip. |
| `F-2-11` | CLOSED — the rate sentence names the exact limited routes, allowance, and trusted connection scope; its outcome test passed. |
| `F-2-12` | CLOSED — the deployment instructions use literal revision/traffic terms and no room-owner metaphor. |
| `F-3-1` | CLOSED — the price test asserts currency, amount, price type, recurrence, product, redirect, and matching live action. |
| `F-3-2` | CLOSED — privacy lists room code, access-key hashes, turns, timer, drawings, guesses, creation, expiry, and presence times. |
| `F-3-3` | CLOSED — `license-check-data-flow` lists and proves the only recipient and fields. |
| `F-3-4`, `F-3-5` | CLOSED — order/return and refunded-license statements have dedicated passing claims. |
| `F-3-6` | CLOSED — the current complete link crawl has no broken privacy link. |
| `F-3-7` | CLOSED — README consistently calls the sample path the demo. |
| `F-3-8` | CLOSED — README accurately distinguishes tagged browser claim checks from the complete manifest commands. |

No earlier finding is deferred. AI assistance would not improve the brief's small cooperative relay; live sync and local PNG export cover the implied useful extensions without adding child-data processing.

## Final counts

- Findings: **0**
- Untested claims: **0**
- Verdict: **PASS**
