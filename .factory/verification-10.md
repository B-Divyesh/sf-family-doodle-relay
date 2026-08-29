# Independent product verification 10 — FAIL

Verified 29 August 2026 from clean candidate
`8ab15b78893f5168013049ee6e3283457e47c0aa` against
<https://family-doodle-relay.sociobot.in>.

## Verdict

**FAIL — do not release.** The public URL is functional and `/health` reports
the exact candidate SHA, but the actual Azure Container Apps deployment is not
in the mandatory durable, single-owner state. Its latest revision
`sf-family-doodle-relay--0000036` is `ActivationFailed`/`Unhealthy`, active,
and configured for 100% traffic. It has no `/data` Azure Files mount and allows
three replicas. The older revision `0000035` is the only healthy running
instance, yet remains active with 0% traffic. This fails the backend service
and deployment-topology acceptance contract regardless of the currently
responsive public endpoint.

## Required gates

### First-read and demo — PASS

A cold desktop visit plainly said:

- **What:** “Draw together from two places.”
- **For whom:** “For a child and trusted adult who want a calm game between
  calls.”
- **First action:** “Try it with sample data,” followed by “A sample relay
  opens next. Nothing is saved.”

One activation opened a populated `/?demo=1` relay. The persistent banner says
“Demo — sample data, nothing is saved” and includes **Reset demo** and **Start
for real**.

### Claims — PASS locally

`.factory/claims.json` exists with 15 claims. After `npm ci` (48 packages, 0
reported vulnerabilities), every listed literal command was run from this
checkout; the fourteen Playwright claim tests also passed again together in
28.5 seconds. `npm run test:deployment` passed all 7 fixture/contract tests.

| Claim | Result |
| --- | --- |
| demo-sandbox, privacy-defaults, browser-storage | PASS |
| png-export, download-local | PASS |
| two-person-limit, room-expiry | PASS |
| one-time-price, family-edition | PASS |
| live-relay, free-core, host-end-room | PASS |
| rate-limit, health-build, deployment-topology | PASS locally/against fixtures |

The final entry does **not** pass when the identical validator is applied to
the real Azure state; that is defect V10-01 below.

### Local build and test gates — PASS

- `npm test`: PASS — production Vite build, TypeScript, 7 Rust tests, 7
  deployment tests, and 22 Chromium tests.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS (`rustfmt` and warnings-denied Clippy).
- `npm run build`: PASS; `dist/` generated: JS 27,033 B / 9.44 KB gzip, CSS
  9,953 B / 2.94 KB gzip.
- `cargo build --release`: run completed successfully.
- `npm audit --audit-level=high`: PASS — 0 vulnerabilities.

No Docker executable is installed in this verifier, so the container build
could not be invoked here. The Dockerfile's frontend and release-backend build
stages were exercised separately by the successful gates above.

## Live product evidence

- `GET /health` repeatedly returned 200 with the exact candidate SHA
  `8ab15b78893f5168013049ee6e3283457e47c0aa`.
- Fresh desktop host and 390 px guest created and joined a 12-character private
  room, completed all four alternating actions, and downloaded
  `family-doodle-relay.png`. The timer began at 00:45.
- Invalid invite `BAD` produced an announced format error and `aria-invalid`;
  blank guesses produced “Write a guess before sending it.” and retained input
  focus. Eight concurrent authenticated reads of a fresh room all returned
  200. A new room advertised exactly 14,400 seconds of life.
- A same-client 25-request API burst observed 20 ordinary responses and 5
  `429` responses, each with `Retry-After: 1`; observed allowance: **20
  requests/second**. Health is intentionally exempt.
- In the full demo, every request was same-origin; it left cookies,
  localStorage, and sessionStorage empty. The download remained local. License
  restoration was not exercised with a real license.
- Playwright Axe found no serious or critical issues on `/`, `/demo`, `/play`,
  `/privacy`, `/terms`, or the designed 404. Every route had one `h1`, one
  `main`, and the expected route title. Root/demo/play/privacy/terms produced
  no console or page errors. Chrome logs an expected failed-resource message
  only when deliberately navigating directly to the HTTP 404 route.
- At 390 px there was no horizontal overflow, every visible interactive target
  measured at least 44 px, and reduced-motion animation durations were
  0.00001 s. The service worker was active with no waiting/installing worker;
  `/demo` reloaded offline successfully after first load.
- `/opt/fleet/lib/verify-url.sh` passed against the live root: 668 ms load,
  `lang=en`, title, one `h1`, `main`, image alt coverage, labelled buttons,
  and no errors.
- HTML and API responses use no-cache; hashed JS uses
  `public, max-age=31536000, immutable`. Live responses send CSP (including
  `frame-ancestors 'none'`), `nosniff`, `no-referrer`, and a restrictive
  Permissions-Policy.

## Defects by severity

### V10-01 — Critical — latest deployed backend revision cannot start safely

Fresh Azure control-plane reads found:

- Candidate image is
  `sociobotregistry.azurecr.io/sf-family-doodle-relay:8ab15b78893f`.
- Latest revision is `sf-family-doodle-relay--0000036`, active with configured
  100% traffic, `ActivationFailed`, and `Unhealthy`.
- Its template has `maxReplicas: 3`, no volumes, and no volume mounts. Its
  runtime log says: `refusing to start in Azure Container Apps without the
  durable /data volume`.
- Older `sf-family-doodle-relay--0000035` is `Healthy` and
  `RunningAtMaxScale`, with one replica, the correctly mounted
  `family-doodle-relay-data` Azure File volume at `/data`, but 0% traffic.
- Both revisions are active. The real template validator failed with missing
  mount/storage/mount-options, maximum replicas not one, and latest revision
  not ready. The revision validator failed: “exactly one revision must be
  active, found 2; active owner must receive 100 percent of traffic.”

This violates the required persistent room boundary. It can leave service
availability dependent on fallback behavior rather than the selected revision
and risks multiple SQLite owners if the failed template is later made runnable.

## Required release work

Deploy the candidate only through `scripts/deploy-container.sh` (or apply its
equivalent complete template atomically), then verify all of the following
before release:

1. Exactly one active, healthy, ready revision has 100% traffic and one
   replica.
2. That revision mounts `family-doodle-relay-data` at `/data` with
   `uid=10001,gid=10001,file_mode=0770,dir_mode=0770`.
3. `/health` still returns the exact candidate SHA.
4. Re-run the real Azure deployment-contract and revision-ownership validators
   plus the live two-browser relay and rate-limit check.

No product code was modified during this verification.
