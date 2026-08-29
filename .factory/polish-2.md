# Polish round 2 — cumulative finding closure

Work order: `family-doodle-relay-polish-2`  
Repair commit: `2a932fdc86a0c92aa6b1a47fd00ba79dcad4f08f`

## Review 2 findings

| Finding | Change made | Evidence |
|---|---|---|
| F-2-1 | The demo claim now seeds real room, license, license-cache, session, and cookie values; finishes, resets, exits, and compares every snapshot while recording requests. | `@claim:demo-sandbox`; live `/?demo=1` check: unchanged snapshots, 0 API requests. [live demo](/work/repo/.factory/polish-2-evidence/live-demo/screenshot-mobile.png). |
| F-2-2 | The storage claim restores a recorded valid license through the UI and verifies room key, license, and verification cache are local-storage-only. | `@claim:browser-storage` in the clean clone. |
| F-2-3 | Narrowed the unprovable production statement to the validator’s actual contract: one ready instance and persistent `/data` storage. | `@claim:deployment-topology`; four deployment-contract tests; live revision `0000028` has one active replica. |
| F-2-4 | Separated the privacy claim from the demo claim. It crawls every product route/control, probes excluded server surfaces, and records the demo’s cookies and requests. | `@claim:privacy-defaults`; live excluded routes return 400/404 and demo has no off-origin request. |
| F-2-5 | Added the `free-core` claim and a two-browser, no-license four-turn flow that downloads a PNG strip without a checkout request. | `@claim:free-core` in the clean clone. |
| F-2-6 | Replaced the unprovable merchant-of-record assertion everywhere with the observable wording “Payment opens on Sociobot,” covered by the price/checkout claim. | `@claim:one-time-price`; live `/` cold check. [live root](/work/repo/.factory/polish-2-evidence/live-root/screenshot-desktop.png). |
| F-2-7 | Removed the untested personal-data collection assertion from public copy; the privacy page instead states the profile-free product boundary that its route/control audit verifies. | `@claim:privacy-defaults`; live `/privacy` route check. |
| F-2-8 | Removed the untested “never embedded in the image” deployment assertion. The README retains only the deploy steps that this repository can prove. | README copy audit; secret-claim wording absent from shipped public copy. |
| F-2-9 | Raised the purchase-terms link to a 44 px inline-flex target and expanded the phone test to measure every visible link, button, input, and keyboard canvas on each product route. | Phone layout test; live 390 px control audit passed. [live root mobile](/work/repo/.factory/polish-2-evidence/live-root/screenshot-mobile.png). |
| F-2-10 | Standardized the downloaded artifact as **PNG strip** across landing copy, README, terms, claims, and copy audit. | `@claim:png-export`; terminology audit. |
| F-2-11 | Rewrote the rate-limit documentation in plain language. | README copy audit; `@claim:rate-limit`. |
| F-2-12 | Rewrote the deployment instruction with the concrete ready-instance and persistent-storage invariant. | README copy audit; `@claim:deployment-topology`. |

## Earlier findings revalidated

| Finding IDs | Current evidence |
|---|---|
| F-1-1 to F-1-6 | Plain first-screen copy and designed 404 continue to pass `real routes expose complete metadata and meet the page baseline` and the cold route check. |
| F-1-7 / V3-03 | `@claim:download-local` records only same-origin requests through PNG-strip download. |
| F-1-8 | Route-baseline test checks apple-touch, Open Graph, Twitter, title, canonical, h1/main, and designed HTTP 404 metadata. |
| V-01 through V-09, V2-01 through V2-09, V3-01 through V3-03 | The unfiltered suite covers synced two-player relay, licensed eight turns, expiry boundary, rate limit, PNG content, type check, mobile/offline behavior, and designed 404; deployment validator remains tested separately. |

## Evidence and verification

- Clean clone: `/tmp/family-doodle-relay-polish2.qsYdkf` after `npm ci`; every one of the 14 exact commands in `.factory/claims.json` passed independently.
- Local quality gate: `npm test` passed (7 Rust, 4 deployment-contract, 18 Playwright); `npm run lint` and `npm run build` passed.
- Local accessibility: route baseline runs Axe on `/`, `/?demo=1`, `/demo`, `/play`, `/privacy`, `/terms`, and the HTTP 404. No serious or critical violation is accepted.
- Live deployment: `https://family-doodle-relay.sociobot.in/health` returned `d5df5f519368eb18adc74e23558c634edca36df2`; revision `sf-family-doodle-relay--0000028` is the sole active one-replica owner at 100% traffic.
- Cold URL verifier: [root report](polish-2-evidence/live-root/verify.json), [demo report](polish-2-evidence/live-demo/verify.json), and the linked root/demo screenshots. Both reports have zero console errors, English language, one h1/main, and complete image alt text.
- Live Axe/phone sweep: seven routes (`/`, `/?demo=1`, `/demo`, `/play`, `/privacy`, `/terms`, `/not-a-page`) each had 0 serious/critical Axe violations and no horizontal overflow at 390 px.

No review finding is deferred.
