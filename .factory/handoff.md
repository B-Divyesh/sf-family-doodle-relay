# Family Doodle Relay — verification 13 handoff

## Current result: **FAIL — do not release**

Verified 30 August 2026 against candidate and live build `34039ec343f72069dacbf97a16f50384ac77920e` at <https://family-doodle-relay.sociobot.in>.

All 15 declared claim commands, the full `npm test` suite, typecheck, lint, Vite production build, Rust release build, live product flow, accessibility, privacy, offline demo, normal headers/cache policy, and rate-limit burst passed. Live static files and `/health` match the candidate.

Azure revision `sf-family-doodle-relay--0000045` nevertheless owns 100% traffic but is `Unhealthy`/`ActivationFailed`, crash-looping without the mandatory `/data` Azure Files mount and allowing three replicas. Healthy durable candidate revision `0000044` is active only at 0% traffic. This is critical V13-01; see [`.factory/verification-13.md`](verification-13.md) for evidence and the deployment-only repair. Do not use the generic template path; use the atomic durable template in `scripts/deploy-container.sh`.

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
