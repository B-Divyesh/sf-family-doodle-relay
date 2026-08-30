# Family Doodle Relay — repair 9 handoff

- Work order: `family-doodle-relay-repair-9`
- Verifier report commit: `2958cdecd97e689dc5562729d86a719078ae16c1`
- Failed candidate: `f2333f8187d8fae43a809e9d5c0d90cb1604673a`
- Live URL: <https://family-doodle-relay.sociobot.in>
- Result: **PASS — V11-01 repaired and deployed**

## Finding reproduced

The Azure control plane reproduced V11-01 exactly. Candidate revision
`sf-family-doodle-relay--0000038` used image `f2333f8187d8`, allowed three
replicas, had no volumes or `/data` mount, and was `Unhealthy` /
`ActivationFailed` at 100% configured traffic. Healthy revision `0000037`
remained active at 0%, and public `/health` returned old build `3fec115…`.
Both the deployment-template and revision-ownership validators rejected this
state.

## Repair

The product code already had the required durable deployment path; the failed
candidate had bypassed it. The repair uses `scripts/deploy-container.sh`, which
builds the exact Git commit and atomically applies the full revision template:
single revision mode, `minReplicas=maxReplicas=1`, and Azure Files storage
`family-doodle-relay-data` mounted at `/data` with
`uid=10001,gid=10001,file_mode=0770,dir_mode=0770`. It then waits for the
candidate to become ready, confirms one physical replica, deactivates every
old owner, validates health/running state and 100% traffic, and requires live
`/health` to match the complete source commit.

`tests/deployment-contract.unit.mjs` now includes an exact V11-01 fixture. It
models image `f2333f8187d8`, revisions `0000037` and `0000038`, the absent
mount, three-replica scale, old ready fallback, and unhealthy candidate. The
test proves that both deployment validators reject that state.

No feature, brief, design, privacy, billing, or product copy changed.

## Deployment evidence

The code repair was deployed as commit
`09847af44b084f70ae86c904670bdfcd4c68502a` through the repository deployment
script. ACR build `ch1bd` completed in 4m17s and produced image digest
`sha256:e45cffdae16c5589c73f54fac2bd71e9e168bb89c393bd1370b4919ceb56d7f9`.

Azure accepted revision `sf-family-doodle-relay--0000039` with image tag
`09847af44b08`, exactly one active healthy owner, one physical replica, and
100% traffic. Its template has one minimum and maximum replica plus the named
Azure Files volume and `/data` mount with every required mount option. Live
`/health` returned the full deployed commit. The final handoff-only commit is
redeployed through the same checked path before completion, and the release
check compares its live identity directly with `git rev-parse HEAD`.

## Verification evidence

- Clean install: `npm ci` installed 48 packages; audit found 0 vulnerabilities.
- Every one of the 15 literal commands in `.factory/claims.json` passed from
  the clean install. Each browser claim ran in its own server/browser state.
- `npm test`: PASS — production Vite build, TypeScript, 7 Rust tests, 9
  deployment tests, and 22 Chromium tests in 41.7 seconds.
- `npm run typecheck`, `npm run lint` (format plus Clippy with warnings denied),
  `npm run build`, `cargo build --release`, `npm audit --audit-level=high`,
  `bash -n scripts/deploy-container.sh`, and `git diff --check`: PASS.
- Production assets: 27,033 B JavaScript (9.44 kB gzip) and 9,953 B CSS
  (2.94 kB gzip). No package/consumer check applies to this web-with-backend
  artifact. Docker was unavailable locally; ACR completed the real 22-step
  multi-stage container build from a source archive without `.git`.
- With no environment variables, the release binary started on port 8080,
  generated its local SQLite store, returned `status: ok`, served the security
  policy, and shut down gracefully. Local `verify-url.sh` passed in 588 ms with
  no console errors. Local mobile Lighthouse scored 100 Performance, 100
  Accessibility, 100 Best Practices, and 100 SEO; LCP was 1.50 s, CLS was 0,
  and transfer was 106,182 B.
- Live `verify-url.sh` passed in 551 ms with one `<h1>`, one `<main>`, `lang=en`,
  complete image alternatives, labelled buttons, and no browser errors.
- Live route scans of `/`, `/demo`, `/play`, `/privacy`, `/terms`, and the
  designed HTTP 404 found no serious or critical Axe issue. Titles, one h1,
  and one main landmark were correct on every route.
- Live desktop keyboard use opened the one-click demo, added a mark with Space,
  finished with Enter, and downloaded `family-doodle-relay.png`. The focus ring
  measured 4 px in press red.
- At 390 px there was no horizontal overflow and no visible interactive target
  below 44 px. Reduced-motion animations measured `0.00001s`, scrolling was
  instant, and 200% text resizing kept the h1 and main visible without overflow.
- The complete demo flow left local storage, session storage, and cookies empty;
  all recorded requests were same-origin. Service-worker update left one active
  worker with none waiting or installing. After browser cache clear and network
  disablement, the controlled demo reloaded with its sample state.
- A live desktop-host/390px-guest flow returned 201 for room creation, announced
  an invalid invite with `aria-invalid=true`, joined both players, preserved
  presence through guest reload, propagated host-controlled ending, and returned
  404 for the ended room. Browser error capture stayed empty.
- Three fresh live rooms each passed six concurrent reads and a join. Six health
  requests all returned the deployed build identity.
- The live API and page probes each returned 20 normal responses followed by 35
  `429` responses with `Retry-After: 1`. The Sociobot license verifier returned
  30 normal responses followed by 10 `429` responses with `Retry-After: 4`.
- Response policy is `no-cache` for HTML, API, health, and the service worker;
  hashed assets are immutable for one year. CSP includes header-only
  `frame-ancestors 'none'`; `nosniff`, `no-referrer`, and disabled camera,
  microphone, and geolocation policies are present.
- Live mobile Lighthouse scored 100 Performance, 100 Accessibility, 100 Best
  Practices, and 100 SEO; FCP was 1.09 s, LCP was 1.47 s, CLS was 0, transfer
  was 103,883 B, and there were no run warnings.

## Known gaps and next steps

None. Future releases and independent candidate staging must use
`./scripts/deploy-container.sh`; a generic Container App image replacement
removes this product's persistent room store and is deliberately rejected by
the runtime and regression suite.
