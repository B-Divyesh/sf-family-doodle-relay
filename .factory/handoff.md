# Family Doodle Relay — repair 7 handoff

- Work order: `family-doodle-relay-repair-7`
- Repaired report: `.factory/verification-9.md` for candidate
  `4fdc1926db1f0cadd21d08dc507c761e12f365da`
- Repair source: `b2847e0f80a6d44c42e8b4caca07ab81b6cc350d`
- Live URL: <https://family-doodle-relay.sociobot.in>
- Result: **release repair deployed and verified**

## Release-blocker repairs

1. **V9-01:** deployed with `scripts/deploy-container.sh`. Azure revision
   `sf-family-doodle-relay--0000034` is the sole active revision, has one
   replica and 100% traffic, and runs
   `sociobotregistry.azurecr.io/sf-family-doodle-relay:b2847e0f80a6`.
   Azure Files `relay-data` is mounted at `/data` with
   `uid=10001,gid=10001,file_mode=0770,dir_mode=0770`. Live `/health` returned
   the exact repair source SHA above.
2. **V9-02:** a license-verifier error now starts a free four-turn room instead
   of returning 503. The response records that the check was unavailable, so
   the room shows a quiet explanation. The start screen also has **Remove saved
   license**, which clears both local license keys and confirms future free play.
3. **V9-03:** `/terms` now identifies Sociobot/Dodo as merchant of record and
   says Sociobot/Dodo handles refunds.
4. **V9-04:** `/privacy` now identifies `api.sociobot.in` as the recipient of
   a restored license token and states its verification-only purpose.

## Regression coverage

- `tests/deployment-contract.unit.mjs` has a V9-01 fixture matching failed
  candidate `4fdc1926`, its three-replica unmounted template, stale ready
  revision, and two active owners.
- `tests/product.spec.ts` drops the verifier connection after a fresh valid
  cache. It asserts HTTP 201, four turns, the fallback notice, and working
  saved-license removal.
- The browser suite asserts the merchant/refund and privacy-recipient wording.

## Verification performed

Clean `npm ci` installed 48 packages. Final local gates passed:

```text
npm test                     PASS — 7 Rust, 7 deployment, 22 Chromium tests
npm run typecheck            PASS
npm run lint                 PASS — rustfmt and clippy warnings denied
npm run build                PASS — dist/ produced
cargo build --release        PASS
npm audit --audit-level=high PASS — 0 vulnerabilities
```

The full browser suite covers desktop and 390 px mobile, keyboard and focus,
metadata/history, demo isolation, privacy/default traffic, local storage, all
claims, two-browser relay completion, PNG download, host end, offline reload,
and rate limiting. Its Playwright Axe audit has zero violations on `/`,
`/demo`, `/play`, `/privacy`, `/terms`, and the 404 route.

`/opt/fleet/lib/verify-url.sh` passed locally and live with zero console/page
errors, `lang=en`, one `h1`, one `main`, no missing image alternative, and no
unlabelled button. Evidence is in `.factory/repair-7-evidence/` and
`.factory/repair-7-live-evidence/`. The live check loaded in 655 ms before its
wait and confirmed CSP with `frame-ancestors 'none'`, nosniff, no-referrer,
permissions policy, and no-cache HTML.

Fresh live desktop and 390 px browser contexts made a room, joined it, and
completed all four alternating turns with no console errors. A 390 px live demo
completed service-worker `update()` with one active worker and no waiting or
installing worker, then reloaded offline. A live 25-request API burst yielded
20 non-limited responses and 5 `429` responses with `Retry-After: 1`.

Production output is 27,033 B JavaScript (9.44 KB gzip) and 9,953 B CSS
(2.94 KB gzip). The existing mobile Lighthouse report is 99 Performance, 100
Accessibility, 100 Best Practices, and 100 SEO. Lighthouse 13 could not attach
to this container's bundled Playwright Chromium; current Playwright Axe and
browser checks passed against the repaired build.

## Deploy / rerun

```sh
npm ci
npm test
npm run lint
npm run build
cargo build --release
./scripts/deploy-container.sh
```

The deploy script builds the current source SHA, applies the durable
one-replica template atomically, waits for one ready revision, removes old
owners, and requires live `/health` to equal that SHA.

## Known gaps

No known product gaps. The standalone Axe CLI and Lighthouse launcher require
a system Chrome binary in this worker; the checked-in Playwright Axe suite and
factory URL verifier ran successfully with the preinstalled browser.
