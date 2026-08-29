# Polish round 1 — cumulative finding closure

Work order: `family-doodle-relay-polish-1`  
Reviewed source: `19f51bcc0f59d116e95c911ab42f606d68733918`  
Review report: `8e484ea3d082a1202b82563f7c019072b58bc52e`  
Repair implementation: `05b48b7d651a2daec489f8f1ab42c808d2a68e98`

## Review 1 findings

| Finding | Change made | Evidence |
|---|---|---|
| F-1-1 | Replaced the metaphor caption with “A shared drawing moves between two people.” | `real routes expose complete metadata and meet the page baseline`; [.factory/polish-1-evidence/live-first-screen.png](polish-1-evidence/live-first-screen.png); cold `/` check in `live-audit.json`. |
| F-1-2 | Renamed the preview heading to “Sample relay”. | Same route-baseline test and live first-screen screenshot; cold `/` text assertion passed. |
| F-1-3 | Renamed the section “Private rooms and data”. | Same route-baseline test and live first-screen screenshot; cold `/` text assertion passed. |
| F-1-4 | Renamed the offer “Family edition: eight-turn rooms”. | `@claim:one-time-price`; `@claim:family-edition`; live first-screen screenshot; live checkout returned 303. |
| F-1-5 | Both SPA and real HTTP error pages now say “Page not found” with “Error 404”. | `route changes update focus, history, legal links, and the designed 404`; `real routes expose complete metadata and meet the page baseline`; [.factory/polish-1-evidence/live-404.png](polish-1-evidence/live-404.png); live unknown URL returned 404. |
| F-1-6 | Removed the two empty labels and changed the preview label to “Sample relay · 00:34 left”. Room/result labels were also rewritten in plain words. | Updated `.factory/copy-audit.md`; live first-screen and demo screenshots; cold `/` absence assertions for every old phrase. |
| F-1-7 / V3-03 | Replaced the permanence claim with the precise locality claim, added `download-local` to `claims.json`, and added a dedicated request-observing download test. | `@claim:download-local`; clean-clone claim result; live demo recorded only `https://family-doodle-relay.sociobot.in` requests through PNG download. |
| F-1-8 | Added apple-touch, Twitter title/description/image, Open Graph URL/type, and matching 404 copy to the real 404 file. Dynamic routes now update Open Graph and Twitter title/description too. | Route-baseline metadata assertions; live `not-a-page` status 404; [.factory/polish-1-evidence/live-404.png](polish-1-evidence/live-404.png). |

## Explicit acceptance work

| Area | Change and evidence |
|---|---|
| First screen | The job, audience, next step, and three facts remain visible without decorative labels. `.factory/copy-audit.md` has every landing string, no sentence over 22 words, and no banned word. |
| One-click demo | The primary action now opens `/?demo=1`; `/demo` remains an equivalent direct route. `first-screen sample action opens an isolated resettable query demo in one click` verifies the banner, reset, exit, and empty storage. Live mobile: [.factory/polish-1-evidence/live-demo-mobile.png](polish-1-evidence/live-demo-mobile.png). |
| Claims | All 13 exact commands in `.factory/claims.json` passed after `npm ci` in clean clone `/tmp/family-doodle-relay-claims.TRAac2`; summary: [.factory/polish-1-evidence/clean-clone-claims.json](polish-1-evidence/clean-clone-claims.json). |
| Titles and routing | Direct `/`, `/?demo=1`, `/demo`, `/play`, `/privacy`, and `/terms` return 200 with route titles and metadata. Unknown paths return a designed HTTP 404. SPA navigation and back navigation focus the H1. |
| Mobile | At 390×844 there is no horizontal overflow. Demo reset and exit controls are each 171×44 px. The banner now stacks its message above an even two-control row. |
| Accessibility | Axe found no serious or critical issue on every tested route. `verify-url.sh` found no errors, one H1, one main, English language, complete alt text, and labelled controls. Focus, keyboard drawing, 200% layout behavior, reduced motion, and 44 px targets are covered by the browser suite. |
| Privacy and offline | Demo storage and cookies remained empty, the download stayed same-origin, and the cached `/?demo=1` shell reloaded offline. |
| Performance | Local Lighthouse: 100 performance / 100 accessibility / 100 best practices / 100 SEO, LCP 1.6 s, CLS 0, TBT 20 ms. Live: 100 / 100 / 100 / 100, LCP 1.4 s, CLS 0, TBT 0 ms. Reports are in `polish-1-evidence/`. Initial JS is 26.17 KB raw (9.24 KB gzip); CSS is 9.57 KB raw (2.88 KB gzip). |

## Historical finding revalidation

| Earlier IDs | Evidence that the repair remains real |
|---|---|
| V-01, V2-01, V3-01 | `@claim:deployment-topology`; deployment revision `sf-family-doodle-relay--0000023` has one active replica and durable `/data`. A fresh live host/guest relay completed. |
| V2-02 | `@claim:live-relay` holds guess input and focus across sync updates; live cold relay preserved both typed guesses after 900 ms. |
| V-02, V2-05 | `@claim:family-edition` rejects a forged paid flag and accepts only the recorded valid fixture license. |
| V-03, V2-03 | `@claim:one-time-price`; live Sociobot checkout returned 303 to hosted checkout. |
| V-04 | `@claim:room-expiry` plus Rust `expired_room_is_deleted_on_read`. |
| V-05, V2-04, V3-02 | `@claim:rate-limit` verifies exactly 20 allowed requests followed by 429 responses with `Retry-After: 1` for API and page routes. |
| V-06, V2-05 | `@claim:png-export` inspects the 1200×728 PNG, both panels, and both quote rows. |
| V-07, V2-08 | TypeScript, Rust format/clippy, build, and the full unfiltered suite pass. |
| V-08, V2-06 | Mobile browser test verifies no overflow, keyboard drawing, footer/404 targets, and the live 390 px audit verifies the redesigned banner controls. |
| V2-07 | Local and live cold offline reloads from `/?demo=1` show “Add one surprising detail”. |
| V2-09 | Real unknown URL is HTTP 404 with the standard skeleton, return action, and complete metadata. |

## Evidence index

- Full live audit: [.factory/polish-1-evidence/live-audit.json](polish-1-evidence/live-audit.json)
- Live URL verifier: [.factory/polish-1-evidence/verify-live/verify.json](polish-1-evidence/verify-live/verify.json)
- Live demo URL verifier: [.factory/polish-1-evidence/verify-live-demo/verify.json](polish-1-evidence/verify-live-demo/verify.json)
- Live Lighthouse: [.factory/polish-1-evidence/lighthouse-live-mobile.json](polish-1-evidence/lighthouse-live-mobile.json)
- Local Lighthouse: [.factory/polish-1-evidence/lighthouse-local-mobile.json](polish-1-evidence/lighthouse-local-mobile.json)

Every current and historical finding is closed. No severity is deferred.
