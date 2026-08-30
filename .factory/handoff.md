# Family Doodle Relay — verification 11 handoff

- Work order: `family-doodle-relay-verify-11`
- Verified candidate: `f2333f8187d8fae43a809e9d5c0d90cb1604673a`
- Live URL: <https://family-doodle-relay.sociobot.in>
- Result: **FAIL — DO NOT RELEASE**

## Independent verification result

The candidate's local code and declared claim tests pass, but its actual Azure
Container Apps deployment fails the mandatory backend topology contract. The
candidate image `f2333f8187d8` is revision `0000038`, active at 100% traffic,
`Unhealthy`/`ActivationFailed`, with no `/data` Azure Files mount and maximum
replicas set to three. Its log says it refused to start without the durable
mount. The publicly responsive old revision `0000037` is the only healthy
replica and `/health` returns its `3fec115…` build identity, not the candidate.

See `.factory/verification-11.md` for exact commands, successful local and
live functional evidence, claim outcomes, headers, rate-limit observation,
and the Azure control-plane evidence. Release is blocked until the candidate
is deployed with the full durable single-owner template and the live build
identity matches the candidate.

## How to verify after repair

Run `npm ci`, every command in `.factory/claims.json`, `npm test`, `npm run
lint`, `npm run build`, and `cargo build --release`. Deploy only with
`./scripts/deploy-container.sh`, then inspect the real Container App with
`scripts/deployment-contract.mjs` and `/health`; both must identify one healthy
durable candidate revision. Re-run the live two-browser relay and 20 rps
rate-limit probe.

## Superseded repair-8 notes

- Work order: `family-doodle-relay-repair-8`
- Verifier base: `b944c21801ecc5a7a71e6dbc73d75024b5b9f9ac`
- Repair commit: `3fec115406cb3e4823154277b0a4827d678c33ad`
- Live URL: <https://family-doodle-relay.sociobot.in>
- Result: **PASS — V10-01 repaired and deployed**

## Repair made

Independent verification 10 reproduced an Azure Container Apps generic-image
deployment that created revision `sf-family-doodle-relay--0000036` without the
durable room-store template. It was `ActivationFailed`, accepted 100% traffic,
allowed three replicas, and left the prior healthy revision active at 0%.

The repair adds an exact V10-01 fixture to
`tests/deployment-contract.unit.mjs`. It rejects the reported candidate image,
revision names, missing Azure Files volume, three-replica scale, not-ready
latest revision, and split revision ownership. The ownership validator now also
requires the only owner to report Azure `Healthy` plus `Running` or
`RunningAtMaxScale`; the test covers the reported `Unhealthy` /
`ActivationFailed` state even if it were the only active revision.

The repair was deployed through `scripts/deploy-container.sh`, not the generic
image deploy path. The script built the exact commit and atomically applied its
durable template before checking readiness and revision ownership.

## Production deployment evidence

- ACR build `ch19w` completed successfully in 4m49s. Image:
  `sociobotregistry.azurecr.io/sf-family-doodle-relay:3fec115406cb`
  (digest `sha256:a4c15f0b574c00cb989457f676faac1f024a1685fa1b1626b4406583fe71b5bd`).
- The live app validator accepts revision
  `sf-family-doodle-relay--0000037`, the expected image, one replica, and the
  `/data` mount.
- Revision ownership validator accepts exactly one active revision at 100%
  traffic. Azure reports `Healthy`, `RunningAtMaxScale`, and one replica.
- Template uses the `family-doodle-relay-data` Azure File volume at `/data`
  with `uid=10001,gid=10001,file_mode=0770,dir_mode=0770` and min/max replicas
  of one.
- Live `GET /health` returned `status: ok` and exact build SHA
  `3fec115406cb3e4823154277b0a4827d678c33ad`.

Future releases must continue to use `./scripts/deploy-container.sh`; the
backend intentionally refuses an Azure Container Apps process without its
durable `/data` volume.

## Verification performed

- Clean install: `npm ci` completed with 48 packages and no audit findings.
- `npm test`: passed Vite production build, TypeScript, 7 Rust tests, 8
  deployment contract tests, and 22 Chromium tests in 44.8s. This includes all
  15 manifest claims.
- `npm run typecheck`, `npm run lint`, `npm run build`, `cargo build --release`,
  and `npm audit --audit-level=high` all passed. The production bundle is
  27.03 kB JS (9.44 kB gzip) and 9.95 kB CSS (2.94 kB gzip).
- ACR performed the real multi-stage container build; a local Docker CLI was
  not available in this worker.
- Live desktop keyboard flow opened `/?demo=1`, made a sample mark with Space,
  finished with Enter, and downloaded `family-doodle-relay.png`. The focus ring
  is a 4 px press-red outline.
- Fresh live two-browser host/390 px guest flow created a room (201), validated
  an invalid invite with `aria-invalid`, joined and reloaded both players,
  showed “Both players are here”, ended for both players, and returned 404 on
  the ended-room read. No browser errors occurred.
- Live browser scan found no serious or critical Axe issue on `/`, `/demo`,
  `/play`, `/privacy`, `/terms`, or the designed 404. Each route has `lang=en`,
  one `h1`, one `main`, and complete image alt coverage. The only console entry
  was the expected browser failed-resource message when deliberately loading
  the HTTP 404 route.
- At 390 px, the demo has no horizontal overflow and no visible target under
  44 px. Reduced-motion animation durations are `0.00001s` and scroll behavior
  is `auto`.
- Fresh demo browser storage, session storage, and cookies remained empty; all
  observed requests were same-origin. It reloaded offline under an active
  service worker. A live service-worker update left one active worker with no
  waiting or installing worker.
- Live rate probes allowed 20 API and 20 page requests per trusted client;
  excess requests were 429 with `Retry-After: 1`. The Sociobot verifier's own
  observed limit was 30 then 429 with `Retry-After: 4`.
- Response policy check confirmed no-cache HTML/API and service worker,
  immutable hashed JS, CSP with `frame-ancestors 'none'`, `nosniff`,
  `no-referrer`, and disabled camera/microphone/geolocation.
- `/opt/fleet/lib/verify-url.sh` passed live in 550 ms with no console errors,
  title, language, one h1, main landmark, image alternatives, and labelled
  buttons.
- Live mobile Lighthouse: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.2 s, LCP 1.5 s, CLS 0, transfer 101 KiB, no warnings.

## Known gaps

None. This is a web-with-backend product, not a published package, so no
package-consumer test applies.
