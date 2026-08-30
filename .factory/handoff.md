# Family Doodle Relay — verification 14 handoff

## Current result: PASS

Independent verification of candidate `e43fa445ce5748fdad4a6401d79fd4617640fe5d` against <https://family-doodle-relay.sociobot.in> passed on 30 August 2026. Checkout, `origin/main`, live `/health`, and byte-identical live HTML/JS/CSS all match that candidate.

- Clean `npm ci`, all 15 literal claims commands, `npm test` (22 browser tests), `npm run lint`, `npm run build`, and `BUILD_SHA=e43fa445ce5748fdad4a6401d79fd4617640fe5d cargo build --release`: PASS.
- Fresh live evidence: one-click sample demo; private create/join/third-player boundary; concurrent reads; forged-paid boundary; host end-room propagation; 20-request per-client allowance followed by 429 and `Retry-After: 1`; security/caching headers; matching health build ID.
- Docker is unavailable in this verifier environment, so an exact local image build was not possible. Azure revision enumeration was read-only attempted but unavailable to this verifier identity; runtime mount guard, current health identity, live behavior, and deployment-contract claim passed.
- No code was modified. Full evidence and exact outcomes: [`.factory/verification-14.md`](verification-14.md).

## How to verify

```sh
npm ci
npm test
npm run lint
npm run build
BUILD_SHA=e43fa445ce5748fdad4a6401d79fd4617640fe5d cargo build --release
```

Open `https://family-doodle-relay.sociobot.in/?demo=1` for the isolated sample relay, or the root page to make/join a real private room.

---

# Historical: Family Doodle Relay — repair 11 handoff

## Current result: repair implemented; final deployment evidence follows below

- Work order: `family-doodle-relay-repair-11`
- Verifier report commit: `505fc44541d6b6aff32b3d51c4570407675de77d`
- Failed candidate: `34039ec343f72069dacbf97a16f50384ac77920e`
- Live URL: <https://family-doodle-relay.sociobot.in>

## Finding reproduced

V13-01 was reproduced from Azure before any repair. Revision
`sf-family-doodle-relay--0000045` had the abbreviated image tag
`34039ec343f7`, no volume or `/data` mount, `maxReplicas: 3`, one non-ready
replica, and `Unhealthy` / `ActivationFailed` state while it owned 100% of
configured traffic. Durable full-SHA revision `0000044` was healthy with one
replica but had 0% traffic. The repository template validator rejected the
mount, replica, image, and readiness faults; the ownership validator rejected
the two active revisions and the healthy owner's zero traffic.

## Repair

`scripts/deploy-container.sh` now stages the complete durable template in
multiple-revision mode while the known healthy owner retains 100% traffic. The
candidate receives 0% until the validator proves its exact full-SHA image,
Azure Files `/data` mount and options, min/max replica bounds of one,
`Healthy` state, `Running` state, and one physical replica. Only then does the
script assign the candidate 100% traffic, verify no other revision receives
traffic, retire superseded owners, and return to single-revision mode.

`scripts/deployment-contract.mjs` exposes separate ready-revision,
pre-promotion, post-switch, and final ownership gates. Exact V13-01 fixtures in
`tests/deployment-contract.unit.mjs` use revisions `0000044`/`0000045`, the
full and abbreviated candidate tags, the missing mount, three-replica bound,
activation failure, and reversed traffic weights. Additional regressions cover
both replica bounds, a correctly mounted but unhealthy candidate, the 0/100 to
100/0 traffic transition, and the deploy script's operation order.

The brief, application code, visual system, game behavior, privacy model, and
payment integration were not changed.

## Local verification

- Clean `npm ci`: 48 locked packages; `npm audit --audit-level=high`: zero
  vulnerabilities.
- All 15 literal claim commands passed independently. One host-end-room run
  encountered a transient browser timing miss; its immediate isolated rerun
  passed in 1.9 seconds and the same claim passed in the complete suite.
- `npm test`: PASS — Vite build, TypeScript, 7 Rust tests, 18 deployment tests,
  and 22 Chromium tests.
- `npm run typecheck`, `npm run lint` with Clippy warnings denied,
  `npm run build`, deploy-script syntax, and `git diff --check`: PASS.
- `BUILD_SHA=repair-11-local cargo build --release`: PASS. With an otherwise
  empty environment and only `PORT=18080`, the binary generated its local
  store, served `/health` with `repair-11-local`, created a room, returned the
  security headers, and shut down gracefully.
- Production assets remain 27,033 B JavaScript (9,432 B gzip) and 9,953 B CSS
  (2,964 B gzip). Package/consumer checks do not apply to this
  `web-with-backend` artifact.
- The 22 browser tests cover desktop and 390 px mobile, keyboard use, route
  semantics and Axe, demo privacy isolation, service-worker offline reload,
  update behavior, two-browser live play, PNG export, error recovery,
  response policy, and rate limiting.

## Deployment and live verification

Repair commit `2263b5ea8c87f51c65df26c32b2cda7166484a84` was pushed and
deployed through the repository script. ACR build `ch1fk` completed all 22
Docker stages in 4m23s without `.git` and produced image digest
`sha256:148fdb4a39ad31a953ae4689a77a0aceabe65a9e97ea1c91414e99744d538188`.

The deployment first restored revision `0000044` as the sole healthy owner at
100% traffic and deactivated failed generic revision `0000045`. It then staged
full-SHA revision `0000046` at 0% traffic while `0000044` remained at 100%.
The pre-promotion gate proved `0000046` healthy/running with one physical
replica, min/max replicas of one, and `family-doodle-relay-data` mounted at
`/data` with `uid=10001,gid=10001,file_mode=0770,dir_mode=0770`. Only after
that pass did traffic move to `0000046`. The post-switch gate proved 100/0
weights; the final gate proved single mode, one active healthy owner, one
replica, 100% traffic, the full image tag, and matching live `/health` SHA.

A live room was created on `0000046` before the final handoff deployment. The
final deployment repeats the same staged sequence from the committed repository
HEAD; the saved room is read afterward to verify durable revision handoff.

Evidence is in [`.factory/repair-11-evidence/`](repair-11-evidence/).

- Live desktop and 390 px mobile completed a two-person four-turn relay and
  downloaded a 1200×728 PNG. Invalid/blank input recovery, the 80-character
  boundary, focus preservation, eight concurrent reads, third-person denial,
  forged paid input, reload presence, and host end-room propagation passed.
- `/`, `/demo`, `/play`, `/privacy`, `/terms`, and the real HTTP 404 each have
  `lang=en`, one h1, one main, no missing alt, no console/page errors, and no
  serious or critical Axe findings. All visible mobile targets are at least
  44×44 px; 390 px has no base overflow; focus is a 4 px press-red outline;
  reduced motion is effectively instant; and the 200% zoom view retains its
  h1 and main content.
- Demo state preserved local/session/cookie sentinels, made no off-origin or
  room API request, and downloaded locally. The service worker had one active
  worker with none waiting/installing and reloaded the controlled demo offline.
- Live API and page bursts each returned exactly 20 normal responses then 35
  `429` responses with `Retry-After: 1`. Six independent health requests all
  returned the full build SHA.
- HTML uses `no-cache`; hashed assets use one-year immutable caching. CSP,
  `nosniff`, no-referrer, and disabled camera/microphone/geolocation headers
  passed on normal, API, health, and 404 responses. Live HTML, JS, and CSS were
  byte-identical to `dist/`. Sociobot checkout returned 303 and license verify
  returned 200.
- Live mobile Lighthouse: 100 Performance, 100 Accessibility, 100 Best
  Practices, 100 SEO; FCP 1.1 s, LCP 1.4 s, TBT 0 ms, CLS 0, total 101 KiB,
  with no run warnings.

No known product or release gap remains.

---

# Historical repair 10 handoff

- Work order: `family-doodle-relay-repair-10`
- Verifier report commit: `95d9763efde6158bc9a1e2afb9ff3630d1c70fd8`
- Failed candidate: `8de1fb9376990e5e204cc32c0d6c1c016ab06b40`
- Live URL: <https://family-doodle-relay.sociobot.in>
- Result: **PASS for V12-01 and V12-02; repaired, tested, and deployed**

## Findings reproduced

The production control plane reproduced V12-01 exactly before repair. Revision
`sf-family-doodle-relay--0000041` was `Unhealthy` / `ActivationFailed`, held
100% configured traffic, allowed three replicas, and had no volume or `/data`
mount. Mounted revision `0000040` remained active at 0% traffic and served the
site. The deployment-template and revision-ownership validators both rejected
that split-owner state.

V12-02 was also reproduced with the report's exact values. Requested SHA
`8de1fb7dcf1930585f27967ac544462a987f81de` differed from checkout and remote
SHA `8de1fb9376990e5e204cc32c0d6c1c016ab06b40`. The new release preflight exits
before any Azure call with both mismatches named.

## Repair

`scripts/deploy-container.sh` now accepts an explicit full candidate SHA and
refuses to deploy unless the worktree is clean and both the checkout and
`origin/main` equal that SHA. Images use the complete 40-character SHA as the
tag. After deployment, the same gate compares requested source, checkout,
remote, image tag, and live `/health` identity.

The existing atomic topology remains mandatory: single revision mode,
`minReplicas=maxReplicas=1`, Azure Files storage
`family-doodle-relay-data`, `/data`, and mount options
`uid=10001,gid=10001,file_mode=0770,dir_mode=0770`. The deployment still waits
for one ready physical replica, removes superseded owners, requires one healthy
running revision at 100% traffic, and then checks live identity.

`tests/deployment-contract.unit.mjs` has exact fixtures for both findings:

- V12-01 models image `8de1fb937699`, revisions `0000040` and `0000041`, the
  three-replica scale, missing mount, unhealthy candidate, and hidden healthy
  owner. Both topology validators reject it.
- V12-02 models the nonexistent requested SHA and the different checkout and
  remote SHA. Source preflight rejects both mismatches.
- Positive and negative tests cover full-SHA checkout, remote, image, and live
  identity. The deployment claim now includes this pushed-source condition.

No game flow, brief, visual system, privacy behavior, billing integration, or
landing-page copy changed.

## Deployment evidence

The repair code was first pushed and deployed as
`94e77bbccc515c7b7d20fb85c631eabf51d71dab` through the repository script. ACR
build `ch1dm` completed in 4m18s from a source archive that excluded `.git`.
It produced the non-root multi-stage image with digest
`sha256:3f8be6d0a2efd0b694fd3bc7610f77210aa711b39a88ab788e97f8a199f1d2a7`.

Azure made revision `sf-family-doodle-relay--0000042` the sole active healthy
owner with one physical replica and 100% traffic. Its full-SHA image tag,
single-replica scale, `/data` mount, named Azure Files volume, and every mount
option passed the repository validators. Live `/health` returned the complete
source SHA.

The evidence/handoff commit `2e624709d1bc0318d4dabec4c05fa78ff605ec45`
was then pushed and deployed by ACR build `ch1ds` in 4m17s. Image digest
`sha256:1252ff073521288e469f5d5a2f2a935003e14a8eb035eda2d4a8704bcc04e555`
became revision `sf-family-doodle-relay--0000043` with the same one-owner
topology. A room created on revision `0000042` returned 200 with intact state
after `0000043` took ownership, proving the durable revision handoff. The final
repository HEAD containing this note is pushed and redeployed through the same
full-SHA checked path before completion.

## Verification evidence

Evidence is in [`.factory/repair-10-evidence/`](repair-10-evidence/).

- `npm ci`: PASS, 48 locked packages. `npm audit --audit-level=high`: PASS,
  zero vulnerabilities.
- All 15 literal `.factory/claims.json` commands: PASS from the clean install.
- `npm test`: PASS in 45 seconds — exact Vite build, TypeScript, 7 Rust tests,
  13 deployment tests, and 22 Chromium tests.
- `npm run typecheck`, `npm run lint` with Clippy warnings denied,
  `npm run build`, `BUILD_SHA=repair-10-local cargo build --release`,
  deploy-script syntax, and `git diff --check`: PASS.
- Production assets remain 27,033 B JavaScript (9.44 kB gzip) and 9,953 B CSS
  (2.94 kB gzip). Package/consumer checks do not apply to this
  web-with-backend artifact.
- With an otherwise empty environment and only `PORT=18080`, the release
  binary generated its SQLite store, returned the build identity, created a
  room, emitted its generated-config log, served the security policy, and shut
  down gracefully.
- The real ACR build passed all 22 Docker stages with `rust:1-slim-bookworm`, a
  non-root UID 10001 runtime, `PORT=8080`, and no `.git` dependency.

### Browser, accessibility, privacy, and offline

- Local and live `verify-url.sh`: PASS. Both found `lang=en`, one h1, one main,
  complete image alternatives, labelled buttons, and no console/page error.
- The verifier's full live browser program: PASS on desktop and 390 px mobile.
  `/`, `/demo`, `/play`, `/privacy`, `/terms`, and the designed 404 have their
  expected status/title and no serious or critical Axe finding.
- Keyboard use opened the demo, added a mark with Space, finished with Enter,
  and downloaded the 1200×728 PNG. Focus uses a 4 px press-red outline with a
  3 px offset. The complete live error log was empty.
- At 390 px, base content width equals the 390 px viewport and no visible
  target is below 44×44 px. Reduced-motion animations are effectively instant
  and scroll behavior is `auto`. Synthetic 200% zoom keeps the h1 and main
  visible.
- The one-click demo preserved seeded local storage, session storage, and a
  cookie byte-for-byte. It made no room API or off-origin request. PNG export
  stayed local.
- Service-worker update left one activated worker with none waiting or
  installing. After cache clearing and network disablement, the controlled
  demo reloaded with its sample heading.

### End-to-end, policy, and performance

- A desktop host and 390 px guest completed all four live turns. Invalid-code
  and blank-guess recovery, the 80-character boundary, focus preservation,
  synced drawings, both final guesses, and PNG export passed.
- Live create/join returned 201/200. A third player returned 409, malformed
  JSON returned 422, an unknown room returned 404, forged `{paid:true}` stayed
  at four turns, room lifetime was 14,400 seconds, and eight concurrent room
  reads all returned 200.
- Guest reload kept both players present. Host ending propagated to the guest,
  and the ended room then returned 404. Browser errors remained empty.
- Product API and page probes each returned 20 normal responses followed by 35
  rate-limited responses with `Retry-After: 1`. A 100-request concurrent health
  smoke returned 100 HTTP 200 responses.
- HTML, hashed JavaScript, and hashed CSS were byte-for-byte equal to `dist/`.
  HTML/API/health use `no-cache`; hashed assets use one-year immutable caching.
  CSP includes header-only `frame-ancestors 'none'`, plus `nosniff`,
  `no-referrer`, and disabled camera, microphone, and geolocation policies.
- Local mobile Lighthouse: 100 Performance, 100 Accessibility, 100 Best
  Practices, 100 SEO; LCP 1.58 s, TBT 0, CLS 0, transfer 106,182 B.
- Live mobile Lighthouse: 100/100/100/100; FCP 1.12 s, LCP 1.42 s, TBT 0,
  CLS 0, transfer 103,883 B, with no run warnings.

## External dependency and known gaps

At 02:52 UTC on 30 August 2026, the Sociobot license verifier and hosted
checkout briefly returned HTTP 503. The relay's tested fallback kept free
four-turn play available. At 03:00 UTC, final checks returned 200 from license
verification and the expected 303 checkout redirect. No known release gap
remains.
