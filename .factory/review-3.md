# Adversarial first-read review 3 — Family Doodle Relay

Reviewed 30 August 2026 against <https://family-doodle-relay.sociobot.in> in fresh Chromium contexts at 390×844 and 1440×900, and against repository commit `16075edd8c17b03ac95a8580c90588a865d15f44`.

## Verdict: FAIL

The first screen, one-click demo, real two-person relay, accessibility baseline, and all 15 declared claim commands work. Acceptance still fails with seven blocking findings and three minor findings. Two blocking findings are regressions of review 2 closures. The remaining blockers are an incomplete payment claim test, an incomplete privacy inventory, and four public legal/privacy assertions that are not listed and proved as claims.

## Cold first read

Before scrolling, both widths answered all three questions.

- **What it does:** two people in different places take short turns drawing and guessing the same picture.
- **Who it is for:** a child and one trusted adult who want a calm remote game between calls.
- **What to click first:** **Try it with sample data**. The adjacent result text says, “A sample relay opens next. Nothing is saved.”

At 390 px the headline, audience sentence, both actions, result text, and all three facts were visible by 678 px. At 1440 px they were visible by 776 px. There were no cold-load console errors. This check is not blocking.

## Findings

### F-2-6 — BLOCKING recurrence — the merchant-of-record claim returned without proof

**Location / exact quote:** live `/terms` and `frontend/src/main.ts`: “Sociobot and Dodo are the merchant of record.”

Review 2 required this claim to be proved or replaced. Polish 2 says it was replaced everywhere with “Payment opens on Sociobot,” but the Terms route now makes the legal assertion again. The untagged test named `regression V9-03 and V9-04` checks only that the sentence is present. `.factory/claims.json` has no merchant-of-record entry, and a visible sentence cannot prove its own legal accuracy.

**Concrete fix:** add a `merchant-of-record` manifest entry backed by a billing-contract fixture or checkout response that identifies the legal merchant. Use one singular, verified entity in the sentence. If that evidence is unavailable, remove this sentence and retain the tested wording “Payment opens on Sociobot.”

### F-2-12 — BLOCKING recurrence — the deploy copy still uses the “room owner” metaphor and now exceeds the hard limit

**Location / exact quotes:** README Deploy section: “It stages the complete Azure Files `/data` template at zero traffic, requires one healthy replica, and only then moves 100% traffic to it.” (23 words); “It retires the previous room owner after the traffic switch and checks the live build ID.”

Review 2 required the unexplained “room owner” metaphor to be replaced with the concrete app-instance/storage invariant. Polish 2 marked that complete, but the same metaphor remains. The preceding sentence is also one word over the 22-word hard cap.

**Concrete rewrite:** “Stage the Azure Files `/data` template without live traffic. Move traffic after one replica is healthy. Retire the previous app revision, then check the live build ID.”

### F-3-1 — BLOCKING — the price and checkout claim test proves only page copy and an `href`

**Location / exact claim:** `.factory/claims.json`, `one-time-price`: “The family edition costs $6 once with no subscription, and payment opens on Sociobot.”

The tagged test at `tests/product.spec.ts:280` asserts the rendered price text and checkout URL. It never follows the link or inspects a billing contract. It would pass if the destination were dead, charged another amount, or created a subscription. The live link returned a working 303 today, but that manual observation does not make the declared clean-sandbox test complete.

**Concrete fix:** make `@claim:one-time-price` exercise a recorded Sociobot checkout contract and assert a one-time USD 6 product plus the expected hosted-checkout redirect. If the sandbox cannot prove price and recurrence, narrow the claim to what it can prove.

### F-3-2 — BLOCKING — the privacy page gives an incomplete inventory of server-held room data

**Location / exact quote:** live `/privacy`: “The server holds the room code, drawing lines, and guesses in a private temporary database.”

The SQLite schema in `src/main.rs` also stores host and guest access tokens, phase, turn count, deadline, snapshots, creation/expiry times, and presence timestamps. Under the heading “What a room holds,” the shorter list reads as a complete disclosure and omits the most sensitive fields. No claims entry covers the server-side field inventory or the word “private.”

**Concrete fix:** disclose the actual categories, for example: “The server stores the room code, temporary access keys, turn and timer state, drawing panels, and guesses in SQLite.” Keep the separate tested expiry sentence. Add a `room-storage-fields` claim with a schema-level test; preferably store hashes rather than reusable access tokens.

### F-3-3 — BLOCKING — the license-token data-flow claim is unlisted

**Location / exact quotes:** live `/privacy`: “Restoring a license sends its token to api.sociobot.in to check whether the family edition is active.” and “Sociobot receives the token only for that check.”

These are privacy claims about destination, payload, and purpose. `browser-storage` proves storage placement, not what leaves the browser. The untagged V9-04 regression checks only that copy and an `href` exist.

**Concrete fix:** add a `license-check-data-flow` claim. Its Playwright test should restore a fixture license, record every request, and assert one explicit request to the documented Sociobot path containing only the license token and no other user or room data.

### F-3-4 — BLOCKING — the refund-handler claim is unlisted and unproved

**Location / exact quote:** live `/terms`: “Sociobot/Dodo handles refunds.”

This is a user-reliant purchase-support claim. The untagged test checks only that the words exist, and `.factory/claims.json` has no refund-handling entry.

**Concrete fix:** name the verified refund contact and flow from a tested billing contract, add that statement to `claims.json`, and test the observable support/refund destination. Remove the sentence until that evidence exists.

### F-3-5 — BLOCKING — refund revocation is an unlisted behavior claim

**Location / exact quote:** live `/terms`: “A refund revokes the family edition license.”

No manifest entry or test supplies a refunded fixture and confirms that it stops enabling eight-turn rooms. The existing family-edition test checks only a valid license and a forged paid boolean.

**Concrete fix:** add a `refunded-license` claim and recorded revoked-license fixture; assert that verification returns inactive and room creation remains at four turns. Otherwise remove the sentence.

### F-3-6 — Minor — a visible Privacy link returns HTTP 400

**Location / exact link:** `/privacy`, linked text “api.sociobot.in” → `https://api.sociobot.in/api/v1/products/family-doodle-relay/verify`.

The full link crawl returned 400 because the API endpoint needs a license parameter. A visitor following the link reaches an error response, contrary to the no-dead-links requirement.

**Concrete fix:** render `api.sociobot.in` as plain text or link to a public explanation that returns 200. Keep the endpoint itself in technical documentation or the tested data-flow claim.

### F-3-7 — Minor — README uses two names for the same try-out

**Location / exact quote:** README heading “Try the sandbox.” The landing page, navigation, route title, banner, and documentation otherwise call it a **demo**.

“Sandbox” is internal terminology and breaks the one-word-per-concept rule.

**Concrete rewrite:** “Try the demo.”

### F-3-8 — Minor — README inaccurately says the claim command runs only browser checks

**Location / exact quote:** README: “`npm test -- --grep @claim:` runs only those browser checks.”

The exact command also ran the production build, TypeScript check, all seven Rust tests, and all 18 deployment-contract tests before Playwright. A maintainer cannot use the sentence to predict the command’s scope.

**Concrete rewrite:** “Run `npm run test:claims` for the tagged browser claim checks.”

## Copy audit

Counts use whitespace-separated words. Repeated navigation/footer labels are listed once. The landing table includes headings, actions, labels, facts, and visible prose. No landing sentence exceeds 22 words, no banned marketing word appears, and all action buttons name their result.

### Landing page

| Copy | Words | Result |
|---|---:|---|
| Skip to main content | 4 | Pass |
| Family Doodle Relay | 3 | Pass |
| Demo | 1 | Pass |
| How it works | 3 | Pass |
| Privacy | 1 | Pass |
| Draw together from two places | 5 | Pass |
| For a child and trusted adult who want a calm game between calls. | 13 | Pass |
| Try it with sample data | 5 | Pass |
| Make a private room | 4 | Pass |
| A sample relay opens next. | 5 | Pass |
| Nothing is saved. | 3 | Pass |
| Two people only | 3 | Pass |
| Rooms close within four hours | 5 | Pass |
| $6 once, no subscription | 4 | Pass |
| A shared drawing moves between two people. | 7 | Pass |
| Have an invite code? | 4 | Pass |
| Join the room | 3 | Pass |
| Sample relay | 2 | Pass |
| The timer keeps each turn short. | 6 | Pass |
| The finished strip keeps every surprising turn together. | 8 | Pass |
| Sample relay · 00:34 left | 5 | Pass |
| Turn three of four | 4 | Pass |
| Add one detail | 3 | Pass |
| Sam guessed “a house at sea.” | 6 | Pass |
| Add to the same drawing. | 5 | Pass |
| How the relay works | 4 | Pass |
| No account is needed. | 4 | Pass |
| Share one private link with the person you know. | 9 | Pass |
| Make a room | 3 | Pass |
| Send its private invite to one person. | 7 | Pass |
| Take four turns | 3 | Pass |
| Draw, guess, then add one surprising detail. | 7 | Pass |
| Save the PNG strip | 4 | Pass |
| Download the finished relay as one PNG strip. | 8 | Pass |
| Private rooms and data | 4 | Pass |
| Rooms disappear from the server within four hours. | 8 | Pass |
| Downloading a PNG strip does not send it to another service. | 11 | Pass |
| What this does not have | 5 | Pass |
| Public rooms or strangers | 4 | Pass |
| Profiles or follower counts | 4 | Pass |
| Ads or behaviour tracking | 4 | Pass |
| Open text chat | 3 | Pass |
| Family edition: eight-turn rooms | 4 | Pass |
| $6 once | 2 | Pass |
| Eight-turn rooms are included. | 4 | Pass |
| Core four-turn play and PNG strips stay free. | 8 | Pass |
| Buy the family edition | 4 | Pass |
| One-time purchase. | 2 | Pass |
| Payment opens on Sociobot. | 4 | Pass |
| Already bought it? | 3 | Pass |
| Paste your license | 3 | Pass |
| Restore the family edition | 4 | Pass |
| Read purchase terms | 3 | Pass |
| Draw and guess with one trusted person. | 7 | Pass |
| Terms | 1 | Pass |
| Built by Param Factory ↗ | 5 | Pass |
| v1.0.2 | 1 | Pass |
| Art generated for this product | 5 | Pass |

### README

| Copy | Words | Result |
|---|---:|---|
| Family Doodle Relay | 3 | Pass |
| Draw and guess together in a private two-person room. | 9 | Pass |
| Family Doodle Relay is for a child and one trusted adult playing from different places. | 15 | Pass |
| It gives them four 45-second turns to draw, guess, and add one detail. | 13 | Pass |
| The final relay downloads as one PNG strip. | 8 | Pass |
| There are no public rooms, profiles, ads, or open chat. | 10 | Pass |
| A room allows two players and closes within four hours. | 10 | Pass |
| The free game includes four turns and one PNG strip. | 10 | Pass |
| The $6 family edition is a one-time purchase for eight-turn rooms. | 11 | Pass |
| Payment opens on Sociobot. | 4 | Pass |
| Try the sandbox | 3 | F-3-7 |
| Open `/?demo=1` or `https://family-doodle-relay.sociobot.in/?demo=1`. | 4 | Pass |
| It starts with a sample relay and does not save changes. | 11 | Pass |
| `/demo` is an equivalent direct route. | 6 | Pass |
| See `.factory/demo.md`. | 2 | Pass |
| Run locally | 2 | Pass |
| Requirements: Node 22+, npm, and Rust 1.88+. | 7 | Pass; necessary developer terms |
| Open `http://localhost:5173`. | 2 | Pass |
| Vite proxies room and WebSocket traffic to the Rust service on port 8080. | 13 | Pass; necessary developer terms |
| Test and build | 3 | Pass |
| The claim tests are listed in `.factory/claims.json`. | 7 | Pass |
| `npm test -- --grep @claim:` runs only those browser checks. | 10 | F-3-8 |
| Run the production container | 4 | Pass |
| `GET /health` returns the running build identity. | 7 | Pass |
| Rooms are deleted at their four-hour expiry. | 7 | Pass |
| The server allows 20 requests per second for each trusted client connection on every non-health route. | 16 | Pass |
| Architecture and privacy | 3 | Pass |
| The browser app uses Vite and TypeScript. | 7 | Pass; necessary developer terms |
| Rust, Axum, and a short-lived SQLite room store serve the app. | 11 | Pass; necessary developer terms |
| Behind the factory proxy, the server uses the last trusted network address to enforce each client’s request limit. | 18 | Pass; necessary deployment detail |
| This browser keeps private room keys and an optional purchase license in local storage. | 14 | Pass |
| See `/privacy` and `/terms`. | 4 | Pass |
| Deploy | 1 | Pass |
| The factory builds the root `Dockerfile` and supplies `PORT` plus `BUILD_SHA`. | 11 | Pass |
| Push a clean release commit, then run `./scripts/deploy-container.sh <full-commit-sha>`. | 9 | Pass |
| The script checks that the checkout and `origin/main` match before it touches Azure. | 13 | Pass |
| It stages the complete Azure Files `/data` template at zero traffic, requires one healthy replica, and only then moves 100% traffic to it. | 23 | F-2-12; over 22 words |
| It retires the previous room owner after the traffic switch and checks the live build ID. | 16 | F-2-12; metaphor/internal term |
| DNS, billing product registration, and infrastructure stay outside this repository. | 10 | Pass |
| License | 1 | Pass |
| MIT | 1 | Pass |

Terminology is otherwise stable: **room**, **invite code/link**, **turn**, **relay**, **PNG strip**, **partner**, **family edition**, and **license** each have one role. F-3-7 is the demo/sandbox exception.

## Demo and sandbox result

The demo itself passes.

- One click on **Try it with sample data** opened `/?demo=1`.
- The first 844 px already showed the persistent banner, “Add one surprising detail,” sample invite `SAMPLE-PRESS`, “Sam is here,” turn 3 of 4, the 00:45 timer, prompt, prior guess, and populated canvas.
- **Reset demo** restored turn 3, 00:45, “A house at sea,” and the sample drawing after a mark and finish.
- A complete demo produced `family-doodle-relay.png`.
- Seeded real room, license, license-cache, session, and cookie values were byte-for-byte unchanged after finish, reset, and **Start for real**.
- The complete demo interaction made no `/api/` request and no off-origin request.

## Claims run

I cloned commit `16075edd8c17b03ac95a8580c90588a865d15f44` to `/tmp/family-doodle-relay-review3.wHsujy`, ran `npm ci`, and then ran every literal command in `.factory/claims.json` independently.

| Claim | Command result | Review result |
|---|---|---|
| `demo-sandbox` | PASS | Proved storage/cookie preservation and no API or third-party request |
| `privacy-defaults` | PASS | Proved the listed excluded surfaces |
| `browser-storage` | PASS | Proved room, license, and cache placement |
| `png-export` | PASS | Proved PNG content and shown entries |
| `download-local` | PASS | Proved same-origin request log through download |
| `two-person-limit` | PASS | Proved third join returns 409 |
| `room-expiry` | PASS | Proved four-hour timestamp and expiry-boundary regression |
| `one-time-price` | PASS | Incomplete proof; F-3-1 |
| `family-edition` | PASS | Proved forged paid input stays free and fixture license enables eight turns |
| `live-relay` | PASS | Proved four synced 45-second turns |
| `free-core` | PASS | Proved no-license four-turn play and PNG download |
| `host-end-room` | PASS | Proved both players receive end state |
| `rate-limit` | PASS | Proved 20 allowed requests, then 429 with `Retry-After` |
| `health-build` | PASS | Proved nonempty running build identity |
| `deployment-topology` | PASS | Proved the validator contract with 18 deployment tests |

The unfiltered `npm test` also passed: production build, TypeScript, 7 Rust tests, 18 deployment-contract tests, and 22 Chromium tests. `npm run lint` and a final `npm run build` passed. The built JavaScript is 27.03 KB raw and 9.44 KB gzip.

The live checkout returned 303 to hosted Dodo checkout. A fresh live host and mobile guest completed all four turns and downloaded the PNG strip; typed guess focus survived sync updates. A third join returned 409, forged `paid: true` remained four turns, and a host end propagated to both players.

## History revalidation

Every earlier review finding and polish closure was checked against current live output and source.

| Earlier finding | Fresh live/code result | Status |
|---|---|---|
| F-1-1 hero metaphor | Caption is “A shared drawing moves between two people.” | Fixed |
| F-1-2 unclear sample heading | Heading is “Sample relay.” | Fixed |
| F-1-3 privacy metaphor | Heading is “Private rooms and data.” | Fixed |
| F-1-4 unclear paid heading | Heading is “Family edition: eight-turn rooms.” | Fixed |
| F-1-5 metaphorical 404 | Live SPA/static 404 says “Page not found” and returns HTTP 404. | Fixed |
| F-1-6 decorative labels | Old labels are absent; sample label gives relay/time state. | Fixed |
| F-1-7 unlisted download-local claim | `download-local` exists and its tagged request-log test passed. | Fixed |
| F-1-8 incomplete 404 metadata | Live 404 has apple-touch, Twitter, Open Graph, canonical, title, h1, and main. | Fixed |
| F-2-1 weak demo-isolation test | Tagged test seeds every real namespace and compares full snapshots; live adversarial replay also passed. | Fixed |
| F-2-2 license storage untested | Tagged fixture restores and inspects license plus verification cache. | Fixed |
| F-2-3 fixture presented as production proof | Claim now describes the deployment gate, and 18 contract tests enforce that scope. | Fixed |
| F-2-4 privacy denial checked only as copy | Tagged test crawls controls, probes excluded routes, and records requests/cookies. | Fixed |
| F-2-5 free-core claim absent | `free-core` exists and its two-browser no-license flow passed. | Fixed |
| F-2-6 merchant assertion unproved | Assertion is live again on `/terms` without a claims entry. | **Regressed; blocking** |
| F-2-7 personal-data claim unlisted | Old names/ages/email assertion remains removed; profile-free wording is covered. | Fixed |
| F-2-8 embedded-key claim unlisted | “Never embedded” assertion remains absent from public copy. | Fixed |
| F-2-9 purchase-terms target too small | Live 390 px scan found no visible target below 44×44 px. | Fixed |
| F-2-10 inconsistent PNG naming | Downloaded artifact is consistently called a PNG strip. | Fixed |
| F-2-11 rate-limit jargon | README uses the explicit factory-proxy/network-address wording. | Fixed |
| F-2-12 “room owner” deploy metaphor | “Previous room owner” remains, and adjacent copy is 23 words. | **Half-fixed; blocking** |

## Structure, accessibility, and identity

`/`, `/?demo=1`, `/demo`, `/play`, `/privacy`, `/terms`, and an unknown route have route-specific titles, descriptions, canonicals, Open Graph/Twitter metadata, favicon/apple-touch assets, one h1, one main, and consistent header/footer landmarks. The social image is 1200×630. The sitemap lists all five real routes, `robots.txt` points to it, and the designed unknown route returns HTTP 404. SPA navigation and browser back both focus the new h1. F-3-6 is the only dead link found.

At 390 px there was no horizontal overflow and no visible control below 44×44 px. Axe found no serious or critical issue on any tested route. Reduced-motion CSS was active. Security headers include CSP as a response header, `nosniff`, no-referrer, and disabled camera/microphone/geolocation.

The warm newsprint palette, serif broadsheet hierarchy, ruled layout, near-square press controls, and original hand-off illustration match `.factory/design.md` and are recognisable as this product rather than a generic SaaS template.

## Missed leverage

No AI feature is justified. The brief asks two known people to draw and guess together; generated content would distract from that interaction. The expected adjacent features—private live sync, invite sharing, free/family turn lengths, resettable sample data, and PNG export—are present. No provider key appears in the browser code.

## What would make this perfect

Close F-2-6 and F-3-1 through F-3-5 by making every payment/privacy statement precise, listed, and behaviorally tested. Rewrite the two F-2-12 deployment sentences, remove or replace the 400 link, rename the README section to “Try the demo,” and correct the claim-test command description. Then rerun the cold read, demo isolation, every literal claim command, full live relay, route/link crawl, accessibility scan, and this complete history table. A PASS requires all ten findings to be gone.
