# Adversarial first-read review 1 — Family Doodle Relay

Reviewed 29 August 2026 against <https://family-doodle-relay.sociobot.in> from fresh Chromium contexts at 390 px and 1280 px, and against commit `19f51bc`.

## Verdict: FAIL

The core product, demo, and declared claims are working. The page is not ready for a clean first-read acceptance because it still contains six pieces of decorative or unclear copy, a repeated claim-inventory defect, and an incomplete real-404 metadata set. None blocks a person from beginning the demo, but this review may pass only with zero findings.

## Cold first read

Before scrolling, at both widths, the answer was clear:

- **What it does:** a child and an adult draw and guess together remotely.
- **Who it is for:** “a child and trusted adult.”
- **What to click first:** “Try it with sample data.”

The adjacent explanation, “A sample relay opens next. Nothing is saved.”, makes the result and privacy boundary clear. This is **not** a first-screen blocker.

## Findings

### F-1-1 — Minor — the hero image caption is a slogan, not useful copy

**Location / exact quote:** landing hero figure: “Pass the line, not the screen.”

It does not tell a first-time visitor what the image or product does, and it is a metaphor prohibited by the supplied plain-words standard. Replace it with: **“A shared drawing moves between two people.”**

### F-1-2 — Minor — the sample section heading does not name its section

**Location / exact quote:** landing preview heading: “One drawing changes hands”.

This is a mood heading. A visitor scanning headings cannot identify that this is a product preview. Replace it with: **“Sample relay”**. The following sentence can then explain that each turn stays short.

### F-1-3 — Minor — the privacy section uses an uninformative metaphor heading

**Location / exact quote:** landing privacy heading: “Only the relay belongs here”.

It does not identify the privacy/data section and gives no action or fact by itself. Replace it with: **“Private rooms and data”**.

### F-1-4 — Minor — the paid section heading does not state the offer

**Location / exact quote:** landing paid heading: “Keep longer relays in the family”.

The visitor must read several later lines to learn what is sold. Replace it with: **“Family edition: eight-turn rooms”**.

### F-1-5 — Minor — the designed 404 headline is a metaphor

**Location / exact quote:** live `404.html` and SPA unknown-route view: “This page missed the relay”; accompanying kicker: “Lost edition · 404”.

An error page must say what happened before its flavour copy. Replace the headline with **“Page not found”** and remove the kicker (or use **“Error 404”**). Keep the existing useful follow-up sentence and return action.

### F-1-6 — Minor — decorative editorial labels add no visitor information

**Location / exact quotes:** “Private play · Edition № 1”, “LIVE EDITION · 00:34”, and “A SMALL PRIVATE ROOM”.

These are brand-lore labels rather than facts. They make the page noisier for a visitor with 30 seconds and violate the instruction to delete decorative labels. Remove the first and third labels. Replace the preview label with **“Sample relay · 00:34 left”** if the timer is intended to convey a real sample state.

### F-1-7 (V3-03 recurrence) — Minor — a live privacy claim has no claims-manifest entry or dedicated observable test

**Location / exact quote:** landing privacy section: “Downloaded strips stay on your device.”

`.factory/claims.json` has `browser-storage` for room credentials and `png-export` for PNG content, but neither claim says or tests that an exported strip remains local. The demo-request test does not download a strip. This repeats the earlier claim-inventory finding V3-03: the inventory was expanded, but this claim-like landing sentence remains outside it.

Add, for example, `download-local` with the claim **“Downloading a PNG strip does not send the strip to another service.”** Its tagged Playwright test should finish the demo, capture every request through the download, and assert that the only requests are same-origin page assets (or remove the sentence). Do not imply permanence on a device: browsers and users control downloaded files.

### F-1-8 — Minor — the actual HTTP 404 omits required route metadata

**Location:** `frontend/public/404.html`, verified at `https://family-doodle-relay.sociobot.in/not-a-page` with HTTP 404.

The real 404 has a title, description, canonical, Open Graph fields, and SVG favicon, but has no `apple-touch-icon`, `twitter:title`, or `twitter:description`. This does not meet the supplied all-route metadata requirement. Add the existing `/apple-touch-icon.png` and matching Twitter title/description tags to `404.html`.

## Demo and sandbox check — PASS

`/demo` loaded directly into a realistic active sample: Sam is present, the sample drawing and “A house at sea” guess are visible, and the visitor can add a mark, undo, clear, and finish the turn. The persistent banner says “Demo — sample data, nothing is saved” and exposes both **Reset demo** and **Start for real**. Reset restored the sample timer and content.

In a fresh context, demo storage was `{}` for local storage and session storage and there were no cookies. Its complete interaction requested only the product document, JavaScript, and CSS on the same origin. Demo actions did not make backend or third-party requests. Direct offline reload after a browser-cache clear showed “Add one surprising detail”, confirming the precached shell.

## Claims gate — PASS, except F-1-7's inventory gap

After `npm ci`, I ran each exact command declared by `.factory/claims.json` independently from this checkout:

| Claim id | Result |
| --- | --- |
| `demo-sandbox` | PASS |
| `privacy-defaults` | PASS |
| `browser-storage` | PASS |
| `png-export` | PASS |
| `two-person-limit` | PASS |
| `room-expiry` | PASS |
| `one-time-price` | PASS |
| `family-edition` | PASS |
| `live-relay` | PASS |
| `rate-limit` | PASS |
| `health-build` | PASS |
| `deployment-topology` | PASS |

The unfiltered `npm test` also passed: build, TypeScript, 7 Rust tests, 4 deployment-contract tests, and 13 Playwright tests. Live retests found a working Sociobot checkout `303`, one client received exactly 20 API responses before five `429` responses with `Retry-After: 1`, and a live host and guest completed the four-turn relay. A guest's entered guess remained focused and unchanged after 900 ms of live state updates.

## Copy audit

Word counts use whitespace-separated words. The landing table includes headings, controls, labels, and visible sentences so that it is stricter than a prose-only extraction. `F-1-1` through `F-1-6` are the flagged items; no item exceeds 22 words.

### Landing page

| Copy | Words | Result |
| --- | ---: | --- |
| Private play · Edition № 1 | 4 | F-1-6 |
| Draw together from two places | 5 | Pass |
| For a child and trusted adult who want a calm game between calls. | 12 | Pass |
| Try it with sample data | 5 | Pass |
| Make a private room | 4 | Pass |
| A sample relay opens next. | 5 | Pass |
| Nothing is saved. | 3 | Pass |
| Two people only | 3 | Pass |
| Rooms close within four hours | 5 | Pass |
| $6 once, no subscription | 4 | Pass |
| Pass the line, not the screen. | 6 | F-1-1 |
| Have an invite code? | 4 | Pass |
| Join the room | 3 | Pass |
| One drawing changes hands | 4 | F-1-2 |
| The timer keeps each turn short. | 6 | Pass |
| The finished strip keeps every surprising turn together. | 8 | Pass |
| LIVE EDITION · 00:34 | 3 | F-1-6 |
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
| Download the finished relay as a PNG image. | 8 | Pass |
| A small private room | 4 | F-1-6 |
| Only the relay belongs here | 5 | F-1-3 |
| Rooms disappear from the server within four hours. | 8 | Pass |
| Downloaded strips stay on your device. | 6 | F-1-7 |
| What this does not have | 5 | Pass |
| Public rooms or strangers | 4 | Pass |
| Profiles or follower counts | 4 | Pass |
| Ads or behaviour tracking | 4 | Pass |
| Open text chat | 3 | Pass |
| Family edition | 2 | Pass |
| Keep longer relays in the family | 6 | F-1-4 |
| $6 once | 2 | Pass |
| Eight-turn rooms are included. | 4 | Pass |
| Core four-turn play and PNG downloads stay free. | 8 | Pass |
| Buy the family edition | 4 | Pass |
| One-time purchase. | 2 | Pass |
| Sociobot is the merchant of record. | 6 | Pass |
| Already bought it? | 2 | Pass |
| Paste your license | 3 | Pass |
| Restore the family edition | 4 | Pass |
| Read purchase terms | 3 | Pass |
| Draw and guess with one trusted person. | 7 | Pass |
| Art generated for this product | 5 | Pass (provenance) |

### README

| Copy | Words | Result |
| --- | ---: | --- |
| Draw and guess together in a private two-person room. | 8 | Pass |
| Family Doodle Relay is for a child and one trusted adult playing from different places. | 15 | Pass |
| It gives them four 45-second turns to draw, guess, and add one detail. | 13 | Pass |
| The final relay downloads as a PNG image. | 8 | Pass |
| There are no public rooms, profiles, ads, or open chat. | 9 | Pass |
| A room allows two players and closes within four hours. | 10 | Pass |
| The free game includes four turns and PNG download. | 9 | Pass |
| The $6 family edition is a one-time purchase for eight-turn rooms; it uses Sociobot checkout and license verification. | 18 | Pass |
| Open `/demo` or <https://family-doodle-relay.sociobot.in/demo>. | 5 | Pass |
| It starts with a sample relay and does not save changes. | 11 | Pass |
| See `.factory/demo.md`. | 2 | Pass |
| Requirements: Node 22+, npm, and Rust 1.88+. | 6 | Pass |
| Open `http://localhost:5173`. | 1 | Pass |
| Vite proxies room and WebSocket traffic to the Rust service on port 8080. | 12 | Technical but clear |
| The claim tests are listed in `.factory/claims.json`. | 7 | Pass |
| `npm test -- --grep @claim:` runs only those browser checks. | 7 | Pass |
| `GET /health` returns the running build identity. | 6 | Pass |
| Rooms are deleted at their four-hour expiry. | 7 | Pass |
| The server allows 20 requests per second for each trusted client connection on every non-health route. | 15 | Technical but clear |
| The browser app uses Vite and TypeScript. | 7 | Pass |
| Rust, Axum, and a short-lived SQLite room store serve the app. | 11 | Technical but clear |
| Every non-health route is rate limited per client by the right-most address added by the factory ingress. | 16 | Technical but clear |
| This browser keeps private room keys and an optional purchase license in its storage. | 13 | Pass |
| The server does not ask for names, ages, email addresses, or profiles. | 12 | Pass |
| See `/privacy` and `/terms`. | 3 | Pass |
| The factory builds the root `Dockerfile` and supplies `PORT` plus `BUILD_SHA`. | 11 | Pass |
| Use `./scripts/deploy-container.sh` so the release waits for its single durable room owner and checks the live build identity. | 18 | Pass |
| `FACTORY_SOCIOBOT_KEY` may be supplied to authenticate server-side license verification; it is optional and never embedded in the image. | 17 | Pass |
| DNS, billing product registration, and infrastructure stay outside this repository. | 10 | Pass |

Terminology is otherwise consistent: the shared session is a **room**, the code sent to the other person is an **invite code**, an action period is a **turn**, the whole activity is a **relay**, and the final download is a **PNG strip**.

## History retest

There are no earlier `.factory/review-*.md` or `.factory/polish-*.md` files. I read the existing verification reports and handoff. The historical defects were checked again rather than accepted from their status labels.

| Earlier finding(s) | Live and code check | Status |
| --- | --- | --- |
| V-01, V2-01, V3-01 (split room owners) | Fresh host/guest flow completed; source uses SQLite snapshot storage and deployment contract rejects multiple owners. | Fixed |
| V2-02 (typed guesses erased) | `renderKey` prevents unchanged-turn control replacement; live 900 ms typed-input/focus retest passed. | Fixed |
| V-02 / V2-05 (forged license and weak positive test) | `paid:true` is ignored; recorded valid license makes eight turns; tagged test passed. | Fixed |
| V-03 / V2-03 (dead checkout) | Checkout endpoint now returned `303` to hosted Dodo checkout. | Fixed |
| V-04 (expiry) | `fetch_active_room` deletes expired rooms; Rust expiry test passed. | Fixed |
| V-05, V2-04, V3-02 (rate limiting) | Live 25-request burst was exactly 20 `404` then 5 `429`; source retains buckets for 60 seconds. | Fixed |
| V-06 / V2-05 (incomplete PNG proof) | Tagged test inspects downloaded 1200×728 PNG pixels and both quoted guesses. | Fixed |
| V-07, V2-08 (type/format gates) | TypeScript, Rust tests, and full `npm test` passed. | Fixed |
| V-08 / V2-06 (phone targets) | Existing Playwright test checks every 404 link and key phone targets at 44 px; full suite passed. | Fixed |
| V2-07 (offline shell) | Cache-clear, offline live `/demo` reload passed. | Fixed |
| V2-09 (404 skeleton) | Header, nav, footer, main, title, description, canonical and OG are present. F-1-8 is a separate remaining metadata omission. | Fixed with new minor gap |
| V3-03 (claim inventory) | The manifest gained entries, but F-1-7 remains unlisted. | **Unfixed / recurrence** |

## Structure, accessibility, and leverage checks

Landing, demo, play, privacy, terms, and unknown-route pages returned the expected statuses (200, with real 404 for the unknown path). Their route titles follow the product pattern, valid routes have one H1 and one main landmark, and the header/footer links crawled successfully (checkout correctly returns 303). The page has no console errors on load, no horizontal overflow at 390 px, visible focus, and a distinctive monochrome broadsheet identity rather than a generic SaaS template. Route code uses `pushState`, `popstate`, top-of-page scroll reset, and focus/announcement of the new H1.

The brief implies a two-person drawing relay, not drafting, analysis, import, or account sync. The PNG export already supplies the obvious take-away. An AI feature would not make this core job clearer and is not missing leverage.

## What would make this perfect

Remove or rewrite F-1-1 through F-1-6, add or remove the untested download-locality claim in F-1-7, and complete the real-404 metadata in F-1-8. Then rerun this entire first-read review with no findings.
