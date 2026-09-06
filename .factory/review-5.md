# Family Doodle Relay review 5 — draw together in a private room

## Verdict: PASS

**PASS.** I found **0 findings** at every severity and **0 untested public claims**.

- Work order: `family-doodle-relay-review-5`
- Job: draw, guess, and add a detail together in a private two-person room.
- Audience: a child and one trusted adult playing from different places.
- First action: **Try it with sample data**; it opens a populated sample relay.
- Implementation candidate: `c2a06f834bad070d26f230594b7a72d5ccbdde68`
- Documentation revision at review start: `34815a5880e28b695b6de9070729702d75e3432c`
- Live health build identity: `6085f35a57eea86b2a2fe5e012e63291f17f7f7e`
- Live URL: <https://family-doodle-relay.sociobot.in>

The live identity differs from the candidate only because `c2a06f8..6085f35` changes `.factory/copy-audit.md` and `.factory/handoff.md`. `6085f35..34815a5` is verification reporting only. No product source or built asset changed after the implementation candidate, so the live runtime matches `c2a06f8` under the work-order rule.

## Fresh browser checks

Fresh desktop and 390 × 664 phone contexts opened at scroll position zero. Before scrolling, both showed the job, named child-and-adult audience, sample action, next-step sentence, and three facts. There were no console or page errors.

One click opened a realistic populated relay with Sam, the `A house at sea` guess, drawing state, and the persistent **“Demo — sample data, nothing is saved”** label. **Reset demo** restored the sample. **Start for real** was present. The direct demo flow did not require or write a real room.

A separate fresh desktop host and phone guest completed all four live synced turns. The timer read `00:43`; the guest received the final `A home on a wave` guess; and the downloaded result was `family-doodle-relay.png`. A warm `/demo` reload worked after the browser was set offline.

The footer Privacy navigation reset the new route to the top, focused its H1, and browser Back restored the exact 3749 px landing position while focusing the landing H1. The skip link, visible focus treatment, keyboard canvas action, reduced-motion setting, 390 px layout, invalid/recovery paths, host ending, and 80-character guess behavior are also covered by the passing browser suite.

## Routes, links, accessibility, and privacy

- `/`, `/demo`, `/play`, `/privacy`, and `/terms` returned HTTP 200 with route-specific titles, one H1, and one main landmark.
- `/not-a-page` returned the deliberate designed HTTP 404 with title, H1, main, and return path. Its 404 network-console entry is expected and is not a defect.
- `verify-url.sh` passed on `/` and `/demo`: `lang=en`, title, main, image alternatives, labelled controls, and zero console errors.
- Playwright Axe found zero serious or critical violations on all six routes. The CLI Axe runner could not launch a system Chrome in this worker, so the installed Playwright Axe integration was used instead.
- The link crawl found 200 responses for internal, legal, metadata, and factory links. The payment link returned its expected HTTP 303 hosted-checkout redirect. Privacy and support contacts are explicit `mailto:` links. The 404 page's own skip-link URL deliberately remains HTTP 404.
- The sample flow made no off-origin room request. Public pages include no accounts, public rooms, ads, tracking, or open chat.

## Backend checks

- `/health` returned HTTP 200 with `status: ok` and the live build identity above.
- A live 55-request room API burst produced exactly 20 ordinary HTTP 404 responses and 35 HTTP 429 responses with `Retry-After: 1`.
- A live 55-request WebSocket-handshake burst produced exactly 20 ordinary HTTP 400 responses and 35 HTTP 429 responses with `Retry-After: 1`.
- The fresh two-browser relay above exercised live room creation, join, WebSocket sync, completion, and PNG download. Rust regression tests cover SQLite persistence, expiry, access-key hashing, isolation, and recovery.

## Claim commands from a clean checkout

A newly cloned detached checkout at `c2a06f8` ran `npm ci`, then every literal command in `.factory/claims.json` serially. All 19 passed.

| Claim | Result |
| --- | --- |
| `demo-sandbox` | PASS |
| `privacy-defaults` | PASS |
| `browser-storage` | PASS |
| `png-export` | PASS |
| `download-local` | PASS |
| `two-person-limit` | PASS |
| `room-expiry` | PASS |
| `one-time-price` | PASS |
| `purchase-provider` | PASS |
| `family-edition` | PASS |
| `refunded-license` | PASS |
| `license-check-data-flow` | PASS |
| `room-storage-fields` | PASS |
| `live-relay` | PASS |
| `free-core` | PASS |
| `host-end-room` | PASS |
| `rate-limit` | PASS |
| `health-build` | PASS |
| `deployment-topology` | PASS |

The same checkout also passed `npm test` (25 Chromium tests plus its build, typecheck, 9 Rust tests, manifest test, and 18 deployment-contract tests), `npm run lint`, `npm run build`, `npm audit --audit-level=high`, `BUILD_SHA=c2a06f834bad070d26f230594b7a72d5ccbdde68 cargo build --release`, and `git diff --check`. Audit reported zero vulnerabilities. Build output was 27.82 kB raw / 9.69 kB gzip JavaScript and 10.02 kB raw / 2.96 kB gzip CSS.

## Earlier findings

I inspected review 1 through review 4, polish 1 through polish 3, and all verification reports. No earlier issue recurred.

| Earlier findings | Current disposition |
| --- | --- |
| `V-01`–`V-09`, `V2-01`–`V2-09`, `V3-01`–`V3-03`, `V4-01`–`V4-02` | Closed: live two-browser completion, SQLite behavior, expiry, paid/free behavior, rate limits, PNG content, phone controls, offline reload, and designed 404 pass. |
| `V7-01`–`V7-04`, `V8-01`, `V9-01`–`V9-04`, `V10-01`, `V11-01`, `V12-01`–`V12-02`, `V13-01`, `V15-01` | Closed: build/source identity, durable single-owner deployment contract, payment and license cases, provider and privacy disclosures, aggregate gates, and static-shell rate-limit exemption pass. |
| `F-1-1`–`F-1-8` | Closed: literal first-screen and section copy, tested local PNG download, and complete designed-404 metadata remain present. |
| `F-2-1`–`F-2-12` | Closed: demo isolation, browser storage, privacy surface, free core, payment wording, 44 px targets, PNG naming, plain documentation, and deployment contract are proved. |
| `F-3-1`–`F-3-8` | Closed: checkout contract, stored-data inventory, token-only license check, refund behavior, link crawl, demo terminology, and claim-command documentation are proved. |
| `F-4-1`–`F-4-2` | Closed: the 390 × 664 first screen fits, and footer navigation preserves landing scroll on Back while focusing the route H1. |

## Evidence

- Clean-checkout commands: `/work/.evidence/review-5/claim-commands.log`, `npm-test.txt`, `npm-lint.txt`, `npm-build.txt`, `npm-audit.txt`, and `cargo-release.txt`.
- Live browser, accessibility, route, link, offline, relay, history, and rate evidence: `/work/.evidence/review-5/`.

No product code was modified in this review.
