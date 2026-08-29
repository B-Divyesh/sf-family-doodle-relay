# Family Doodle Relay — repair 6 handoff

- Work order: `family-doodle-relay-repair-6`
- Verifier report: `2796116320cba30c8aeb6b78bde632e471424bf3` (`.factory/verification-8.md`)
- Requested immutable candidate: `b2242b83c02279609f631511f9dea036e5dfb1af`
- Live URL: <https://family-doodle-relay.sociobot.in>
- Result: **REPAIRED — release topology and build identity now pass.**

## Repair

The verifier's V8-01 state was reproduced before repair. The public service
reported build `f84673b…`; candidate revision `0000031` used the requested
image but was unready, had no `/data` mount, allowed three replicas, and left
the prior revision active.

The durable deployment script was run from a clean detached checkout of the
exact requested candidate. Azure Container Registry run `ch17g` built
`sociobotregistry.azurecr.io/sf-family-doodle-relay:b2242b83c022` (digest
`sha256:3eed3c88b6dba113c4dc8bfdd647228c19c049281f88fca4d5b6e818157452aa`).
It created `sf-family-doodle-relay--0000032` and converged the service.

Current read-only Azure evidence:

- `activeRevisionsMode`: `Single`.
- Latest and latest-ready revision: `sf-family-doodle-relay--0000032`.
- Image: the exact immutable candidate tag `b2242b83c022`.
- Scale: `minReplicas: 1`, `maxReplicas: 1`.
- One active revision, `Healthy`, one ready/running replica, 100% traffic.
- Durable Azure Files volume `relay-data` is mounted at `/data`, uses
  `family-doodle-relay-data`, and has
  `uid=10001,gid=10001,file_mode=0770,dir_mode=0770`.
- Live `/health`: `{"build_sha":"b2242b83c02279609f631511f9dea036e5dfb1af","status":"ok"}`.

The source repair adds an exact V8-01 regression fixture to
`tests/deployment-contract.unit.mjs`. It preserves the verifier's candidate
image, unready revision, missing mount, and three-replica scale, and asserts
all eight contract failures. The existing valid-template test proves the
durable one-owner patch is accepted. No passing product behavior was changed.

## Verification

Ran from a clean dependency install:

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
cargo build --release
npm audit --audit-level=high
BUILD_SHA=b2242b83c02279609f631511f9dea036e5dfb1af cargo build --release
```

- `npm ci`: 48 packages, 0 vulnerabilities.
- `npm test`: PASS — Vite build, TypeScript, 7 Rust tests, 6 deployment tests
  (including V8-01), and 20 Chromium product/claim tests.
- Typecheck, rustfmt/clippy with warnings denied, production build, release
  Rust build, and audit: PASS.
- A PORT-only local candidate build returned the exact candidate SHA from
  `/health` and shut down cleanly.
- The same Dockerfile was built by ACR run `ch17g`; no local Docker daemon is
  needed. This is a web-with-backend product, not a publishable library, so a
  package-consumer test does not apply.

Browser, accessibility, privacy, and PWA checks:

- `verify-url.sh` passed both the live service and local release server:
  200 response, title, `lang=en`, one `<h1>`, `<main>`, complete image alt
  text, labelled buttons, and no page or console errors.
- The Chromium suite covers desktop, 390 px mobile, keyboard operation,
  44 px controls, focus movement, reduced motion, Axe on every real route,
  demo isolation, same-origin-only demo/download traffic, rate limiting,
  and offline demo reload. All passed.
- A live desktop + 390 px browser probe found no console errors or off-origin
  requests, zero Axe violations on the landing page, no mobile overflow, and
  both participants connected to one live room.
- A local update/offline probe found an active service worker with no waiting
  or installing worker, then reloaded the populated demo offline successfully.
- Live response headers include CSP with `frame-ancestors 'none'`, nosniff,
  no-referrer, disabled camera/microphone/geolocation, no-cache HTML/service
  worker, and one-year immutable hashed assets.
- Lighthouse emitted a complete mobile report: Performance 97, Accessibility
  100, Best Practices 100, SEO 100; FCP 1.7 s, LCP 2.5 s, TBT 0 ms, CLS 0,
  and 100 KiB transfer. Chromium reported its known final screenshot-tab
  crash after writing that report; it did not affect the scores or browser
  checks above.

Live create/join consistency after the topology repair:

- Create returned 201 and join returned 200.
- Host and guest credentials read the same private code at phase 0, with the
  correct host/guest roles.
- A host reload read the same code and phase. Browser WebSocket sessions then
  showed “Both players are here” for desktop host and 390 px guest.

Final deployment checks:

```sh
az containerapp show --resource-group sociobot --name sf-family-doodle-relay -o json \
  | node scripts/deployment-contract.mjs \
      --expected-image sociobotregistry.azurecr.io/sf-family-doodle-relay:b2242b83c022
az containerapp revision list --resource-group sociobot --name sf-family-doodle-relay -o json \
  | node scripts/deployment-contract.mjs --revisions \
      --expected-revision sf-family-doodle-relay--0000032
curl -fsS https://family-doodle-relay.sociobot.in/health
```

All three pass. Future releases must use `./scripts/deploy-container.sh`; a
generic container deploy replaces the required durable relay template and is
intentionally rejected by the runtime guard and deployment contract.

## Known gaps

None that block release. The one Lighthouse CLI screenshot-tab crash is a
worker Chromium issue after report generation, not an application failure.
