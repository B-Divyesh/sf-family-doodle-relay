# Review handoff — Family Doodle Relay

- Work order: `family-doodle-relay-review-2`
- Reviewed repository: `039bb253b80a2b6eee54e3a5cce8fc257961528a`
- Live build reported by `/health`: `b8044b66a2010d536294fc2e11e1a707703c9514`
- Live URL: <https://family-doodle-relay.sociobot.in>
- Demo URL: <https://family-doodle-relay.sociobot.in/?demo=1>
- Result: **FAIL — 12 findings**

The cold first screen, sample demo, live two-player relay, offline reload, routing, metadata, distinct visual identity, and accessibility baseline passed. The review found four incomplete mandatory claim tests, four unlisted claims, one undersized mobile link, one terminology inconsistency, and two README clarity issues. Product code was not changed. Full findings and proposed fixes are in [`.factory/review-2.md`](review-2.md).

Verification performed:

- Installed the pinned dependencies with `npm ci`.
- Ran every exact command in `.factory/claims.json` independently from fresh clone `/tmp/family-doodle-relay-review2.OlL5v1`; all commands exited zero, with the proof gaps documented in F-2-1 through F-2-4.
- Ran `npm test`, `npm run lint`, and `npm run build`; all passed. The complete suite reported 7 Rust, 4 deployment-contract, and 16 Playwright tests passing.
- Used fresh live 390×844 and 1440×900 contexts for the first read. Used fresh route contexts for metadata, link crawling, touch targets, console errors, and Axe.
- Completed a fresh live host/guest relay. Create/read/join returned 201/200/200, a third join returned 409, entered text and focus survived state updates, both players finished, and the PNG was 1200×728.
- Verified live demo reset, no API/off-origin requests, no cookies, unchanged seeded real storage, and offline service-worker reload.
- Verified live rate limiting: API and page bursts each returned 20 allowed responses followed by 35 `429` responses with `Retry-After: 1`.

Known gaps are exactly F-2-1 through F-2-12. The next pass should add or narrow the claim tests and manifest entries first, then repair the mobile target and copy, and rerun the entire review rather than a diff-only check.
