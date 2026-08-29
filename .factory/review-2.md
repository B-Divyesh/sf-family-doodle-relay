# Adversarial first-read review 2 — Family Doodle Relay

Reviewed 29 August 2026 against <https://family-doodle-relay.sociobot.in> in fresh Chromium contexts at 390×844 and 1440×900, and against repository commit `039bb253b80a2b6eee54e3a5cce8fc257961528a`.

## Verdict: FAIL

The first screen, live demo, real two-person relay, routes, and all 13 declared test commands work. Acceptance still fails because four declared claims are not fully proved by their tagged tests, four user-reliant statements are absent from the claims manifest, one mobile link misses the 44 px target, and the landing page and README still use inconsistent or needlessly internal terms. A PASS requires zero findings and no untested claim.

## Findings

### F-2-1 — BLOCKING — the demo isolation test can pass after writing real storage

**Location / exact quote:** `.factory/claims.json`, `demo-sandbox`: “The demo uses sample data, saves nothing, and makes no third-party request.” The tagged test at `tests/product.spec.ts:107` only checks `Object.keys(localStorage).filter(key => key.startsWith('demo:'))`.

The test would still pass if demo mode overwrote `relay:room:*`, `sb_license:family-doodle-relay`, or any other non-`demo:` key. It therefore does not prove either “saves nothing” or the required boundary that real data remains untouched. The separate first-screen test starts with empty storage and does not protect existing real values.

**Concrete fix:** in the tagged `@claim:demo-sandbox` test, seed realistic room, license, and license-cache values; snapshot all local/session storage and cookies; finish and reset the demo; leave with **Start for real**; and assert the complete snapshots are unchanged. Also assert that no `/api/` request occurs.

### F-2-2 — BLOCKING — half of the browser-storage claim is untested

**Location / exact quote:** `.factory/claims.json`, `browser-storage`: “This browser keeps the private room key and optional license in its storage.”

The tagged test creates a room and checks only the `relay:room:*` credential. It never enters, receives, verifies, or inspects an optional license. The command passes while the license half of the claim remains untested.

**Concrete fix:** extend `@claim:browser-storage` with the recorded license fixture. Restore a license through the UI, assert `sb_license:family-doodle-relay` and its verification cache are in local storage only, and assert neither appears in cookies or session storage.

### F-2-3 — BLOCKING — the production-topology claim is tested only against invented fixture data

**Location / exact quote:** `.factory/claims.json`, `deployment-topology`: “The production deployment uses one durable room owner.” Its exact command is `npm run test:deployment`.

`tests/deployment-contract.unit.mjs` constructs a hard-coded object named `configuredDeployment` and proves that the validator accepts it. It does not read the production Container App, revisions, replica count, or mounted storage. This command would pass if production regressed to the multi-owner topology that caused V4-01 and V4-02.

**Concrete fix:** either change the claim to the narrower, proved statement “The deployment validator accepts only one owner with the required durable mount,” or add a read-only production test that supplies the actual app and revision JSON to `scripts/deployment-contract.mjs` and verifies one ready replica, one active revision, and the `/data` mount.

### F-2-4 — BLOCKING — the privacy-defaults test checks denial copy instead of the denied features

**Location / exact quote:** `.factory/claims.json`, `privacy-defaults`: “There are no accounts, public rooms, ads, behaviour tracking, or open chat.”

The tagged test proves same-origin demo traffic and no cookies, but for public rooms and tracking it only asserts that the landing page displays “Public rooms or strangers” and “Ads or behaviour tracking.” A page can state those denials while still shipping the features. Accounts and open chat receive no behavioral assertion.

**Concrete fix:** keep the same-origin/cookie assertions, crawl every product route for authentication, public-discovery, advertising, profile, and chat controls, and add a server-route contract that rejects or omits those endpoints. If those negative features cannot be tested reliably, narrow the manifest and page copy to the privacy behavior the request log proves.

### F-2-5 — BLOCKING — the free-core claim is not listed

**Location / exact quotes:** landing purchase section, “Core four-turn play and PNG downloads stay free.” README, “The free game includes four turns and PNG download.”

No claim entry says that the four-turn flow and PNG export are free. `live-relay` and `png-export` prove the behaviors independently, while `one-time-price` covers the paid tier, but the manifest never makes or tests the no-payment requirement.

**Concrete fix:** add a `free-core` claim and one tagged browser test that starts without a license or payment state, completes four turns, and downloads the PNG without reaching checkout. Use the same wording in both locations.

### F-2-6 — BLOCKING — the merchant-of-record claim is not listed or proved

**Location / exact quote:** landing purchase section, “Sociobot is the merchant of record.” The same assertion appears in the privacy page, terms, and README with Dodo also named.

`one-time-price` asserts that this text exists and that the checkout link points at Sociobot. Neither the manifest claim nor the test proves who is legally the merchant of record.

**Concrete fix:** add a separate claim backed by a recorded checkout response or billing-contract fixture that identifies the merchant, or replace the legal assertion with the directly observable sentence “Payment opens on Sociobot.”

### F-2-7 — BLOCKING — the personal-data collection claim is not listed

**Location / exact quote:** README and privacy page: “The server does not ask for names, ages, email addresses, or profiles.”

`privacy-defaults` mentions profiles but does not cover the separate promise that the server never asks for names, ages, or email addresses. No tagged test inspects request bodies or accepted room fields for those data types.

**Concrete fix:** add a `minimal-personal-data` manifest entry and a tagged test that exercises create, join, turns, and license verification while recording request fields; assert that no name, age, email, or profile field is sent or stored.

### F-2-8 — BLOCKING — the no-embedded-key claim is not listed

**Location / exact quote:** README deploy section: “`FACTORY_SOCIOBOT_KEY` may be supplied to authenticate server-side license verification; it is optional and never embedded in the image.”

This is a security claim a deployer can rely on, but it has no claims entry or test. None of the current tests inspects the built container or frontend bundle for the secret.

**Concrete fix:** add a build-security claim and scan the production frontend plus container configuration/layers for known key patterns while confirming the service starts without the variable. If the container cannot be inspected in CI, remove “never embedded in the image” and document only how the runtime variable is read.

### F-2-9 — Minor — one landing-page link is only 19 px high on a phone

**Location / exact quote:** landing license panel, “Read purchase terms.” At 390×844 its live bounding box was 163×19 px.

This misses the required 44 px touch target. The existing mobile test checks selected demo, footer, and 404 links but not every landing control.

**Concrete fix:** give the link a minimum 44 px block or inline-flex height, and extend the mobile test to measure every visible `a`, `button`, `input`, and keyboard canvas on every route.

### F-2-10 — Minor — the same download has three names

**Location / exact quotes:** landing, “Download the finished relay as a PNG image”; README, “The final relay downloads as a PNG image”; README, “The free game includes four turns and PNG download.” Elsewhere the product calls the download a “PNG strip.”

The terminology table says the downloaded artifact is a **PNG strip**, but the public copy alternates among strip, relay, PNG image, and PNG download.

**Concrete fix:** use **PNG strip** consistently. Suggested rewrites: “The PNG strip includes every completed turn,” “Download the finished relay as one PNG strip,” and “The free game includes four turns and one PNG strip.”

### F-2-11 — Minor — the rate-limit sentence uses unexplained infrastructure jargon

**Location / exact quote:** README: “Every non-health route is rate limited per client by the right-most address added by the factory ingress.”

“Right-most address” and “factory ingress” require internal deployment knowledge and do not read plainly even in the architecture section.

**Concrete fix:** “Behind the factory proxy, the server uses the last trusted network address to enforce each client’s request limit.”

### F-2-12 — Minor — the deploy instruction uses an unexplained product-specific metaphor

**Location / exact quote:** README: “Use `./scripts/deploy-container.sh` so the release waits for its single durable room owner and checks the live build identity.”

“Durable room owner” is not a standard deployment term and does not explain the actual invariant.

**Concrete fix:** “Use `./scripts/deploy-container.sh` so deployment waits for one ready app instance with persistent room storage, then checks the live build ID.”

## Cold first read

Before scrolling, both widths answered all three questions:

- **What it does:** two people draw together from different places.
- **For whom:** a child and one trusted adult playing between calls.
- **First click:** **Try it with sample data**; the adjacent text says, “A sample relay opens next. Nothing is saved.”

The phone first screen also showed all three short facts. The desktop first screen showed the original newspaper-style drawing. This check passes.

## Copy audit

Counts are whitespace-separated. The landing table deliberately includes headings, labels, and actions as well as grammatical sentences. No item exceeds 22 words and no banned marketing word appears.

### Landing page

| Copy | Words | Result |
|---|---:|---|
| Family Doodle Relay | 3 | Pass |
| Demo | 1 | Pass |
| How it works | 3 | Pass |
| Privacy | 1 | Pass |
| Draw together from two places | 5 | Pass |
| For a child and trusted adult who want a calm game between calls. | 12 | Pass |
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
| Save the strip | 3 | Pass |
| Download the finished relay as a PNG image. | 8 | F-2-10 |
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
| Core four-turn play and PNG downloads stay free. | 8 | F-2-5, F-2-10 |
| Buy the family edition | 4 | Pass |
| One-time purchase. | 2 | Pass |
| Sociobot is the merchant of record. | 6 | F-2-6 |
| Already bought it? | 3 | Pass |
| Paste your license | 3 | Pass |
| Restore the family edition | 4 | Pass |
| Read purchase terms | 3 | Pass for words; F-2-9 for target size |
| Draw and guess with one trusted person. | 7 | Pass |
| Terms | 1 | Pass |
| Built by Param Factory | 4 | Pass |
| Art generated for this product | 5 | Pass; provenance is recorded in `design.md` |

All buttons and primary action links use verbs that name their result. All section headings make sense outside their surrounding paragraph.

### README

| Copy | Words | Result |
|---|---:|---|
| Family Doodle Relay | 3 | Pass |
| Draw and guess together in a private two-person room. | 8 | Pass |
| Family Doodle Relay is for a child and one trusted adult playing from different places. | 15 | Pass |
| It gives them four 45-second turns to draw, guess, and add one detail. | 13 | Pass |
| The final relay downloads as a PNG image. | 8 | F-2-10 |
| There are no public rooms, profiles, ads, or open chat. | 10 | Pass for copy; claim covered by F-2-4 |
| A room allows two players and closes within four hours. | 10 | Pass |
| The free game includes four turns and PNG download. | 9 | F-2-5, F-2-10 |
| The $6 family edition is a one-time purchase for eight-turn rooms; it uses Sociobot checkout and license verification. | 18 | Pass |
| Try the sandbox | 3 | Pass |
| Open `/?demo=1` or `https://family-doodle-relay.sociobot.in/?demo=1`. | 4 | Pass |
| It starts with a sample relay and does not save changes. | 11 | Pass |
| `/demo` is an equivalent direct route. | 6 | Pass |
| See `.factory/demo.md`. | 2 | Pass |
| Run locally | 2 | Pass |
| Requirements: Node 22+, npm, and Rust 1.88+. | 6 | Necessary developer terms |
| Open `http://localhost:5173`. | 2 | Pass |
| Vite proxies room and WebSocket traffic to the Rust service on port 8080. | 12 | Necessary implementation terms |
| Test and build | 3 | Pass |
| The claim tests are listed in `.factory/claims.json`. | 7 | Pass |
| `npm test -- --grep @claim:` runs only those browser checks. | 10 | Pass |
| Run the production container | 4 | Pass |
| `GET /health` returns the running build identity. | 7 | Pass |
| Rooms are deleted at their four-hour expiry. | 7 | Pass |
| The server allows 20 requests per second for each trusted client connection on every non-health route. | 15 | Pass |
| Architecture and privacy | 3 | Pass |
| The browser app uses Vite and TypeScript. | 7 | Necessary implementation terms |
| Rust, Axum, and a short-lived SQLite room store serve the app. | 11 | Necessary implementation terms |
| Every non-health route is rate limited per client by the right-most address added by the factory ingress. | 16 | F-2-11 |
| This browser keeps private room keys and an optional purchase license in its storage. | 13 | Pass for copy; claim covered by F-2-2 |
| The server does not ask for names, ages, email addresses, or profiles. | 12 | F-2-7 |
| See `/privacy` and `/terms`. | 4 | Pass |
| Deploy | 1 | Pass |
| The factory builds the root `Dockerfile` and supplies `PORT` plus `BUILD_SHA`. | 11 | Necessary deployment terms |
| Use `./scripts/deploy-container.sh` so the release waits for its single durable room owner and checks the live build identity. | 18 | F-2-12 |
| `FACTORY_SOCIOBOT_KEY` may be supplied to authenticate server-side license verification; it is optional and never embedded in the image. | 18 | F-2-8; “image” is ambiguous here |
| DNS, billing product registration, and infrastructure stay outside this repository. | 10 | Pass |
| License | 1 | Pass |
| MIT | 1 | Pass |

Terminology is otherwise stable: **room**, **invite code**, **turn**, **relay**, **partner**, and **family edition** each have one meaning.

## Demo and sandbox

The live demo passes its behavior check, apart from the inadequate regression test in F-2-1:

- One click from the landing page opened `/?demo=1` at turn 3 of 4.
- The first phone screen showed Sam connected, a 00:45 timer, “A tiny house takes a surprising trip,” and the prior guess “A house at sea.” The drawing canvas begins at 828 px in an 844 px viewport, but the populated turn state is already visible.
- The banner remained visible after finishing the turn and offered **Reset demo** and **Start for real**.
- Reset restored turn 3, 00:45, the prompt, and the prior guess.
- A manual adversarial check seeded the real keys `relay:room:*`, `sb_license:family-doodle-relay`, and `sb_license_check:family-doodle-relay`; all three remained byte-for-byte unchanged through finish and reset.
- The flow made no `/api/` request, no off-origin request, and no cookie. An offline reload after clearing the browser cache reopened the sample under service-worker control.

## Claims run

Every exact command in `.factory/claims.json` was run independently after `npm ci` in fresh local clone `/tmp/family-doodle-relay-review2.OlL5v1`.

| Claim | Command result | Review result |
|---|---|---|
| `demo-sandbox` | PASS | Incomplete assertion; F-2-1 |
| `privacy-defaults` | PASS | Incomplete assertion; F-2-4 |
| `browser-storage` | PASS | License half untested; F-2-2 |
| `png-export` | PASS | Proved 1200×728 PNG, two canvases, and both guesses |
| `download-local` | PASS | Proved same-origin requests through download |
| `two-person-limit` | PASS | First join succeeded; third player received 409 |
| `room-expiry` | PASS | Four-hour timestamp and expiry-boundary Rust regression passed |
| `one-time-price` | PASS | Price/copy/link asserted; merchant claim remains F-2-6 |
| `family-edition` | PASS | Forged paid flag stayed at four turns; fixture license enabled eight |
| `live-relay` | PASS | Two contexts completed four synced turns |
| `rate-limit` | PASS | Local API and page bursts allowed exactly 20, then returned 429 |
| `health-build` | PASS | Health returned a nonempty build identity |
| `deployment-topology` | PASS | Fixture-only; does not prove production; F-2-3 |

The unfiltered `npm test` also passed all 7 Rust tests, 4 deployment tests, and 16 Playwright tests. `npm run lint` and a final `npm run build` passed; `dist/` contains 26,165 B of JavaScript (9.24 kB gzip).

Fresh live checks returned build `b8044b66a2010d536294fc2e11e1a707703c9514`, created/read/joined a room with statuses 201/200/200, rejected a third player with 409, preserved a typed guess and focus across updates, completed both players' four turns, and downloaded a 1200×728 PNG. A forged `paid: true` room remained at four turns. Live API and page bursts each allowed exactly 20 requests and then returned 35 `429` responses with `Retry-After: 1`.

## History revalidation

Every finding in `.factory/review-1.md` and every closure in `.factory/polish-1.md` was checked against live output and source rather than accepted from its status label.

| Earlier finding | Fresh result |
|---|---|
| F-1-1 hero metaphor | Fixed: live caption is “A shared drawing moves between two people.” |
| F-1-2 unclear sample heading | Fixed: “Sample relay.” |
| F-1-3 privacy metaphor | Fixed: “Private rooms and data.” |
| F-1-4 unclear paid heading | Fixed: “Family edition: eight-turn rooms.” |
| F-1-5 metaphorical 404 | Fixed in SPA and HTTP 404: “Page not found” and “Error 404.” |
| F-1-6 decorative labels | Fixed: all three old labels are absent; preview says “Sample relay · 00:34 left.” |
| F-1-7 / V3-03 local-download claim | Fixed: `download-local` exists and its same-origin download test passed. |
| F-1-8 404 metadata | Fixed: apple-touch and Twitter/Open Graph fields are present live and in source. |

The older defects summarized by review 1 were also rechecked. The fresh live two-browser relay closes V-01/V2-01/V3-01 and V2-02; forged payment stayed at four turns; checkout returned 303; room lifetime was 14,399 seconds; live rate limiting was exactly 20+35; the PNG contained both entries; all build/type/format gates passed; offline demo reload worked; and the real unknown route returned a designed HTTP 404. F-2-3 is a new claim-proof defect: working live behavior still does not make the declared fixture-only production test truthful.

## Structure, accessibility, and visual identity

Fresh live checks of `/`, `/?demo=1`, `/demo`, `/play`, `/privacy`, `/terms`, and an unknown URL found route-specific titles, one H1, one main, descriptions, canonicals, Open Graph/Twitter metadata, favicon/apple-touch assets, and consistent headers/footers. The unknown URL returned HTTP 404. All crawled product links returned 200; checkout returned the expected 303; the factory link returned 200; mail links were exempt. SPA navigation and back navigation focused and announced the new H1 after the route render.

At 390 px there was no horizontal overflow. Axe reported zero serious or critical findings on every route. Reduced-motion behavior, keyboard controls, and security headers were present. F-2-9 is the one touch-target failure found by measuring every visible interactive element.

The monochrome broadsheet, warm newsprint palette, editorial rules, nearly square controls, and original hand-off illustration are specific to this product and match `.factory/design.md`; this is not a generic SaaS template.

## Missed leverage

No additional AI feature is justified. The brief calls for synchronous family drawing and guessing, and model-generated content would not improve that core job. Real-time sync, private invites, four/eight-turn modes, and local PNG export cover the obvious implied features. No provider key is embedded in the browser bundle.

## What would make this perfect

Close F-2-1 through F-2-8 so every user-reliant claim has a test that proves the whole statement, raise the purchase-terms link to a 44 px target, standardize **PNG strip**, and replace the two internal deployment phrases. Then rerun the full cold-read, demo, claims, live two-player, route, mobile, accessibility, and history checks from fresh contexts.
