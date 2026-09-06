# Family Doodle Relay — repair 13 handoff

## Result

**PASS.** Both findings from review 4 are fixed, all 19 declared claims pass, and no earlier finding has recurred.

- Work order: `family-doodle-relay-repair-13`
- Implementation SHA: `c2a06f834bad070d26f230594b7a72d5ccbdde68`
- Deployed image: `sociobotregistry.azurecr.io/sf-family-doodle-relay:c2a06f834bad070d26f230594b7a72d5ccbdde68`
- Live revision: `sf-family-doodle-relay--0000051`
- Live URL: <https://family-doodle-relay.sociobot.in>
- Documentation SHA: the report-only commit containing this handoff; its exact value is recorded in `/work/.evidence/repair-13/identities.json` after commit.

## Repairs

1. **F-4-1 — closed.** The short-phone hero no longer uses a fixed 610 px minimum height. Phone spacing is compact enough to show the job, audience, first action, next step, and all three facts at 390 × 664. The third fact now ends at `y=629.875`, leaving 34 px in the viewport.
2. **F-4-2 — closed.** Each history entry stores its scroll position. New navigation starts at the top; Back and Forward restore their own positions. Route changes still focus and announce the H1 without the focus operation moving the page.

The regressions assert browser outcomes. They measure all required first-screen elements in the viewport and reproduce a deep landing scroll through Back and Forward, including exact scroll restoration and H1 focus.

## Clean checkout verification

A detached checkout of the implementation SHA used the committed lockfiles and documented setup.

```sh
npm ci
npm test
npm run lint
npm run build
npm audit --audit-level=high
BUILD_SHA=c2a06f834bad070d26f230594b7a72d5ccbdde68 cargo build --release
```

Results:

- Every literal command in `.factory/claims.json` passed independently: 19/19.
- `npm test` passed: 9 Rust tests, 1 claims-manifest test, 18 deployment-contract tests, and 25 Chromium tests.
- Formatting, Clippy with warnings denied, TypeScript, production build, audit, and `git diff --check` passed.
- Audit reported zero vulnerabilities.
- `dist/` was produced. Initial JavaScript is 27.82 kB raw / 9.69 kB gzip; CSS is 10.02 kB raw / 2.96 kB gzip.

## Fresh live browser results

- Desktop and 390 × 664 phone contexts began at `scrollY=0` and showed the job **“Draw together from two places,”** the named child/adult audience, **“Try it with sample data,”** its next step, and all three facts before scrolling.
- From landing position `y=2724`, Privacy opened on its saved entry. Browser Back returned to `y=2724` with zero error and focused the landing H1. Forward restored the Privacy entry.
- One click opened the populated sample relay. The persistent **“Demo — sample data, nothing is saved”** label remained through completion and reset. Two result panels and two realistic guesses appeared, and the PNG downloaded. Reset restored the sample. Starting for real left seeded real room, license, cache, session, and cookie data byte-for-byte unchanged. The demo interval made no room API or off-origin request.
- A fresh desktop host and phone guest completed four synchronized turns. Blank input gave the recovery message, an 80-character guess completed without phone overflow, and the PNG downloaded. Host-controlled room ending reached both players.
- A cache-cleared controlled demo reloaded offline. Reduced-motion route checks passed.
- `/`, `/demo`, `/play`, `/privacy`, and `/terms` returned 200 with route-specific titles. The designed missing route deliberately returned HTTP 404 with the product structure and return action.
- Every audited route had `lang=en`, one H1, one main, complete image alternatives, no console/page error, and zero serious or critical Axe findings.
- The live link crawl found working product, legal, factory, metadata, icon, social-image, and sitemap links. Checkout returned its expected 303 hosted-checkout redirect. Privacy and support contacts are explicit `mailto:` links.
- `verify-url.sh` passed on `/` and `/demo` with no console errors.
- Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1,455 ms, TBT 8 ms, CLS 0.
- Lighthouse desktop: all four scores 100; LCP 382 ms, TBT 0 ms, CLS 0.

## Backend and deployment

- Live API burst: 20 ordinary responses followed by 35 HTTP 429 responses with `Retry-After: 1`.
- Live WebSocket handshake burst: 20 ordinary responses followed by 35 HTTP 429 responses with `Retry-After: 1`.
- Fifty-five rapid requests each to `/`, `/sw.js`, and the built JavaScript all stayed HTTP 200.
- Rust persistence, expiry, isolation, access-key hashing, and recovery regressions passed. A fresh release process created a room, shut down gracefully, restarted on the same SQLite file, and reopened that room with HTTP 200.
- `/health` returns `status: ok` and the exact implementation SHA.
- The repository deployment validator accepts the live template, revision ownership, image, and source identity.
- Production is in Single revision mode. Revision `0000051` is the only active healthy revision, has exactly one replica and 100% traffic, and mounts the existing Azure Files `relay-data` volume at `/data`. Replica bounds remain 1/1.
- Only `sf-family-doodle-relay`, its prefixed image, and the product URL were inspected or changed. No other product, shared database, staging slot, or secret was accessed.

## Paid offer

The free four-turn relay and PNG export remain available. The advertised family edition still adds eight-turn rooms for USD $6 as a one-time purchase. The live Sociobot checkout returned 303, and its hosted page showed the exact product, amount, and non-recurring offer. No payment transaction was placed. Public operator metadata is in `/work/.evidence/billing-offer.json`.

## Earlier findings

Every earlier review and verification report was read. Current source, clean tests, and fresh live results give these dispositions:

| Finding IDs | Current disposition |
| --- | --- |
| `V-01`, `V2-01`, `V3-01`, `V4-01` | Closed: two-browser completion, isolation tests, one replica, SQLite persistence, and durable `/data` pass. |
| `V-02`, `V2-05`, `V-06` | Closed: forged paid input stays free; valid-license and complete-PNG outcome tests pass. |
| `V-03`, `V2-03` | Closed: live checkout returns 303 to the hosted checkout. |
| `V-04` | Closed: the four-hour boundary is enforced. |
| `V-05`, `V2-04`, `V3-02`, `V4-02` | Closed: fresh API and WebSocket bursts enforce 20 requests, 429, and `Retry-After`. |
| `V-07`, `V2-08`, `V-09` | Closed: type, format, lint, aggregate gates, and limiter cleanup pass. |
| `V-08`, `V2-06` | Closed: mobile controls meet the 44 px target requirement. |
| `V2-02`, `V7-02` | Closed: typed input survives refresh and the 80-character result wraps on 390 px. |
| `V2-07` | Closed: cache-cleared offline demo reload passes. |
| `V2-09`, `V7-04` | Closed: designed 404 structure and accessibility landmarks pass. |
| `V3-03`, `V7-03`, `V9-03`, `V9-04` | Closed: the claims manifest covers download, host-end, provider, refund, and token-only verification behavior. |
| `V7-01`, `V8-01`, `V9-01`, `V10-01`, `V11-01`, `V12-01`, `V13-01` | Closed: exact full-SHA image, healthy single owner, durable mount, and post-health traffic ownership pass live. |
| `V9-02` | Closed: verifier failure keeps free play available and allows license removal. |
| `V12-02` | Closed: full implementation identity is available and used. |
| `V15-01` | Closed: aggregate tests pass and static reloads remain outside the room limiter. |
| `F-1-1` through `F-1-8` | Closed: wording is literal, download locality is tested, and 404 metadata is complete. |
| `F-2-1` through `F-2-12` | Closed: sandbox isolation, storage, privacy probes, free/provider claims, touch size, naming, and deployment wording stay corrected. |
| `F-3-1` through `F-3-8` | Closed: checkout contract, storage disclosure, license/refund claims, links, terminology, and README wording stay corrected. |
| `F-4-1`, `F-4-2` | Closed by this repair and proved locally and on the deployed site. |

Verifications 5, 6, 14, and 16 had no findings; their core, demo, deployment, accessibility, and privacy paths were re-exercised. No finding remains open.

## Evidence

- Repair evidence: `/work/.evidence/repair-13/`
- Independent URL checks: `/work/.evidence/repair-13/verify-root/` and `/work/.evidence/repair-13/verify-demo/`
- Fresh screenshots and browser result: `/work/.evidence/repair-13/live/`
- Catalog description: `/work/.evidence/catalog-description.txt`
- Billing offer metadata: `/work/.evidence/billing-offer.json`

## Known gaps

No code or acceptance gap remains in this repair. A real paid transaction was not placed; purchase behavior is covered by the recorded checkout contract and the live public offer inspection.
