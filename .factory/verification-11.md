# Independent product verification 11 — FAIL

Verified 30 August 2026 from clean candidate
`f2333f8187d8fae43a809e9d5c0d90cb1604673a` against
<https://family-doodle-relay.sociobot.in>.

## Verdict

**FAIL — do not release.** The candidate image was deployed, but it is not a
working durable backend deployment. Azure reports candidate revision
`sf-family-doodle-relay--0000038` as active with 100% traffic, `Unhealthy`,
and `ActivationFailed`. Its template has no Azure Files volume or `/data`
mount and permits three replicas. The process log says it panicked because it
correctly refused to start without the durable mount. Public `/health` is
instead served by previous healthy revision `0000037`, returning build
`3fec115406cb3e4823154277b0a4827d678c33ad`, not the requested candidate.

This independently reproduces the deployment-only class of failure previously
reported; it has not been repaired in the live deployment of this candidate.

## First read and demo — PASS

A cold desktop visit to the live root plainly answers the required questions:

- **What:** “Draw together from two places”.
- **For whom:** “For a child and trusted adult who want a calm game between calls.”
- **First action:** “Try it with sample data”, with “A sample relay opens next.
  Nothing is saved.” beside it.

One click opens `/?demo=1` with a populated sample relay and persistent
“Demo — sample data, nothing is saved” banner, **Reset demo**, and **Start for
real**. Fresh request capture saw only same-origin HTML, JS, CSS, and hero
image requests; demo local storage, session storage, and cookies were empty.

## Required claim tests — PASS locally

`.factory/claims.json` exists and contains 15 claims. After clean `npm ci`
(48 packages, 0 reported vulnerabilities), I ran every listed literal command
from this candidate before any other product QA. All passed:

| Claim IDs | Result |
| --- | --- |
| `demo-sandbox`, `privacy-defaults`, `browser-storage` | PASS |
| `png-export`, `download-local` | PASS |
| `two-person-limit`, `room-expiry` | PASS |
| `one-time-price`, `family-edition` | PASS |
| `live-relay`, `free-core`, `host-end-room` | PASS |
| `rate-limit`, `health-build`, `deployment-topology` | PASS against local fixtures |

Each Playwright claim invocation passed one selected test. The
`deployment-topology` fixture is not evidence for the real Azure deployment:
the real control-plane validator fails as recorded below.

## Local quality gates — PASS

- `npm test`: PASS — production Vite build, TypeScript, 7 Rust unit tests, 8
  deployment-contract tests, and 22 Chromium tests.
- `npm run typecheck`, `npm run lint`, `npm run build`, `cargo build --release`,
  and `npm audit --audit-level=high`: PASS. Audit reported 0 vulnerabilities.
- Production bundle: 27,033 B JS (9,432 B gzip) and 9,953 B CSS (2,964 B gzip).
- No library/CLI pack check applies; this is a web-with-backend product.

## Fresh live product checks — PASS except deployment

- `/opt/fleet/lib/verify-url.sh` passed: 200, 592 ms load, title and `lang`,
  one `h1`, `main`, complete image alternatives, labelled buttons, and no
  console/page errors.
- Axe found no serious or critical findings on `/`, `/?demo=1`, `/play`,
  `/privacy`, `/terms`, or the designed 404. The direct 404 navigation logs
  only the expected failed-resource console message for its HTTP 404 response.
- At 390 px: no horizontal overflow; all visible controls are at least 44 px;
  reduced motion gives `0.00001s` animation duration and `scroll-behavior:
  auto`. After a first load, the demo reloaded offline under an active service
  worker.
- Keyboard/local UI regression coverage passed in the clean Playwright suite.
  Live two-browser safety exercised room creation (201), invalid-invite error
  and `aria-invalid`, guest join, presence before and after guest reload,
  host-controlled end, recovery message, and 404 for the ended room. No
  browser errors occurred.
- The live rate probe observed the documented 20 requests/second allowance for
  both API and page buckets: 20 normal responses then 35 `429` responses with
  `Retry-After: 1`. Health remains exempt. The optional Sociobot licence
  verifier observed 30 normal then 10 `429`, `Retry-After: 4`.
- Response headers use no-cache for HTML/API, immutable caching for the hashed
  JS, CSP with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: no-referrer`, and camera/microphone/geolocation disabled.

## Deployment evidence — FAIL

Fresh read-only Azure control-plane evidence:

- Container App template image is
  `sociobotregistry.azurecr.io/sf-family-doodle-relay:f2333f8187d8`.
- Latest revision is `sf-family-doodle-relay--0000038`, while latest ready is
  `sf-family-doodle-relay--0000037`.
- The candidate template uses `minReplicas: 1`, **`maxReplicas: 3`**, and has
  neither `volumes` nor a `volumeMounts` entry.
- `0000038` is active, receives 100% traffic, has one failed replica, and is
  `Unhealthy` / `ActivationFailed`. Its log: `refusing to start in Azure
  Container Apps without the durable /data volume`.
- `0000037` is active at 0% traffic, `Healthy` / `RunningAtMaxScale`, with one
  replica and the old image `3fec115406cb`.
- `scripts/deployment-contract.mjs` rejects the candidate template for
  max-replica count, missing `/data` mount/Azure Files storage/mount options,
  and latest revision not ready. The revision-ownership validator rejects the
  two active revisions and the absence of a healthy 100%-traffic owner.
- Live `GET /health` returns `3fec115406cb3e4823154277b0a4827d678c33ad`, so
  the deployment does not match candidate `f2333f…`.

## Defects by severity

### V11-01 — Critical — candidate backend is activation-failed and public traffic falls back to an old build

The active f2333f image has no persistent room store and cannot start. It is
configured for 100% traffic while an older revision serves requests. This
violates the backend single-owner, durable-persistence, build-identity, and
deployment-topology requirements. Release must remain blocked.

### Required release work

Deploy through `scripts/deploy-container.sh` (or atomically apply its complete
durable template), then independently confirm: exactly one active healthy
ready revision at 100% traffic; `minReplicas=maxReplicas=1`; Azure Files
`family-doodle-relay-data` mounted at `/data` with all required mount options;
and `/health` returning the exact candidate SHA. Re-run the Azure template and
revision-ownership validators, the live two-browser relay, and the rate probe.

No product code was modified during this verification.
