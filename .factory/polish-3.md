# Polish round 3 — cumulative finding closure

Date: 30 August 2026  
Product: <https://family-doodle-relay.sociobot.in>  
Local repair commit: `cba8f0f72607b143a8183c6aa393f8047327636c`

## Review 3 findings

| Finding | Change made | Evidence |
|---|---|---|
| F-2-6 recurrence | Restored the merchant statement only after recording the public hosted-checkout contract and adding it to the claim manifest. Terms now name Dodo Payments and its responsibility precisely. | `@claim:purchase-provider`; `tests/fixtures/sociobot-checkout-contract.json`; local `/terms` verifier and [mobile capture](polish-3-evidence/local-terms/screenshot-mobile.png). |
| F-2-12 recurrence | Removed “room owner,” split the 23-word deployment sentence, and described the app revision and health handoff directly. | README copy audit; `deployment-contract.unit.mjs`; `.factory/copy-audit.md`. |
| F-3-1 | Replaced the href-only price proof with a recorded public checkout contract: 303 hosted redirect, USD 600 minor units, one-time/non-recurring price, and matching product. | `@claim:one-time-price`; recorded checkout fixture. |
| F-3-2 | The privacy page now inventories code, hashed host/guest access keys, turn and timer state, drawing panels, guesses, creation/expiry times, and presence in SQLite. Access keys are SHA-256 digests at rest; legacy plaintext rows migrate safely. | `cargo test tests::claim_room_storage_fields -- --exact`; `existing_plaintext_access_keys_are_migrated_without_breaking_clients`; local `/privacy` verifier and [mobile capture](polish-3-evidence/local-privacy/screenshot-mobile.png). |
| F-3-3 | Added the license-token flow to the manifest and copy: an explicit restore sends one token-only GET to the documented Sociobot endpoint, with no room data. | `@claim:license-check-data-flow`. |
| F-3-4 | Listed and proved the checkout’s order-question and return handler from the recorded hosted-checkout response. | `@claim:purchase-provider`. |
| F-3-5 | Listed refund revocation and added a recorded revoked-license fixture. A revoked license stays inactive and creates only a four-turn room. | `@claim:refunded-license`; `@claim:family-edition`. |
| F-3-6 | Replaced the visible raw verification hyperlink, which returned 400 without a token, with non-link endpoint text. | Route/link crawl in `real routes expose complete metadata and meet the page baseline`; local `/privacy` verifier reports zero errors. |
| F-3-7 | Standardized the try-out name to “demo” throughout README and product documentation. | `.factory/copy-audit.md`; `.factory/demo.md`; `@claim:demo-sandbox`. |
| F-3-8 | README now says each manifest command runs its dedicated check, covering browser, Rust, and deployment tests accurately. | `claims-manifest.unit.mjs`; 19/19 literal commands passed in the clean clone. |

## Review 2 findings revalidated

| Finding | Change retained or strengthened | Evidence |
|---|---|---|
| F-2-1 | Demo tests seed every real browser namespace, finish/reset/exit, and compare them byte-for-byte while recording requests. | `@claim:demo-sandbox`; `first-screen sample action opens an isolated resettable query demo in one click`; [demo mobile](polish-3-evidence/local-demo/screenshot-mobile.png). |
| F-2-2 | The restored license, check cache, and room credentials are asserted in local storage only. | `@claim:browser-storage`. |
| F-2-3 | The claim remains limited to an enforceable deployment gate for an exact pushed build, one healthy instance, and durable `/data`. | `@claim:deployment-topology`; all 18 deployment-contract tests. |
| F-2-4 | The privacy test crawls routes and controls, probes excluded server surfaces, and records cookies and requests. | `@claim:privacy-defaults`. |
| F-2-5 | A no-license two-browser room completes four turns and exports its PNG strip without checkout. | `@claim:free-core`. |
| F-2-6 | The returned merchant claim is now listed and proven from a recorded public checkout response. | `@claim:purchase-provider`. |
| F-2-7 | Public copy makes only the tested profile-free product-boundary statement. | `@claim:privacy-defaults`. |
| F-2-8 | No public “secret never embedded” claim returned; code uses an optional server environment override. | Copy audit; repository search; `npm run build`. |
| F-2-9 | Every visible control at 390 px remains at least 44×44 CSS px. | `phone layout has no horizontal overflow, 44 px controls, and keyboard actions`; [root mobile](polish-3-evidence/local-root/screenshot-mobile.png). |
| F-2-10 | “PNG strip” remains the single artifact name in UI, README, terms, and claims. | `@claim:png-export`; `@claim:download-local`; copy audit. |
| F-2-11 | README explains the 20-per-second client limit without infrastructure jargon. | `@claim:rate-limit`. |
| F-2-12 | Deployment copy now uses “app revision” and sentences below 23 words. | README and copy audit; `@claim:deployment-topology`. |

## Review 1 findings revalidated

| Finding | Change retained | Evidence |
|---|---|---|
| F-1-1 | Hero caption remains “A shared drawing moves between two people.” | Route baseline; [root desktop](polish-3-evidence/local-root/screenshot-desktop.png). |
| F-1-2 | Preview heading remains “Sample relay.” | Route baseline; root captures. |
| F-1-3 | Privacy section remains “Private rooms and data.” | Route baseline; root captures. |
| F-1-4 | Paid section remains “Family edition: eight-turn rooms.” | `@claim:one-time-price`; `@claim:family-edition`. |
| F-1-5 | SPA and HTTP error pages say “Page not found” and provide a route home. | `route changes update focus, history, legal links, and the designed 404`; route baseline. |
| F-1-6 | Decorative labels remain absent; labels describe current relay state. | Copy audit and cold root captures. |
| F-1-7 / V3-03 | The local PNG statement remains listed and tested by observing every request through download. | `@claim:download-local`. |
| F-1-8 | The real 404 retains its route-specific title, description, canonical, Open Graph/Twitter metadata, icons, h1, and main landmark. | `real routes expose complete metadata and meet the page baseline`. |

## Full evidence

- `npm test`: pass — 9 Rust, 1 claim-manifest, 18 deployment-contract, and 24 Chromium tests.
- Every literal claim command from `.factory/claims.json`: 19/19 pass in a clean clone after `npm ci`.
- `npm run lint`, `npm run build`, release build, clean-environment runtime smoke, and `git diff --check`: pass.
- Route accessibility: Playwright Axe integration reports no serious/critical issue across `/`, `/?demo=1`, `/demo`, `/play`, `/privacy`, `/terms`, and an unknown route.
- Local `verify-url.sh`: zero errors for root, demo, privacy, and terms. Evidence is in [`.factory/polish-3-evidence/`](polish-3-evidence/).
- Mobile Lighthouse: 100/100/100/100, LCP 1.6 s, TBT 0 ms, CLS 0.

## Deployment note

The repository deployment helper requires shared resources named `sociobotregistry`, `factory-env`, and a shared storage account. It was not run because this work order permits only resources named `sf-family-doodle-relay`. After the repair push, a cold public `/health` request still returned prior build `e43fa445ce5748fdad4a6401d79fd4617640fe5d`. This is an external execution boundary, not an open product finding.
