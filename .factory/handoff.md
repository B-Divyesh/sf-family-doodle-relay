# Family Doodle Relay — independent verification 8 handoff

- Work order: family-doodle-relay-verify-8
- Candidate: b2242b83c02279609f631511f9dea036e5dfb1af
- Live URL: <https://family-doodle-relay.sociobot.in>
- Verification date: 29 August 2026
- Result: **FAIL — do not release**

## Release blocker

The exact candidate image is deployed as revision sf-family-doodle-relay--0000031, but the revision is unhealthy and crash-looping. Its replica was not ready, had restarted 12 times, and logged: “refusing to start in Azure Container Apps without the durable /data volume.”

Fresh Azure inspection found maxReplicas 3, no volume, no /data mount, and two active revisions. The repository deployment validator rejects this topology. The public health endpoint still reports healthy implementation build f84673b2cd40fa5f89324382e754ac1fb3858af8 instead of the candidate SHA.

Candidate b2242b8 changes only this handoff document relative to f84673b, and the live JS/CSS match the candidate build byte for byte. The product works, but exact build identity and safe single-owner persistent deployment are mandatory for this backend.

Full evidence and all QA results are in [.factory/verification-8.md](verification-8.md).

## What passed

- Mandatory cold first-read on desktop and 390 px mobile, plus the one-click populated sample demo.
- All 15 exact .factory/claims.json commands after npm ci.
- npm test: Vite build, TypeScript, 7 Rust tests, 5 deployment tests, and 20 Playwright tests.
- npm run typecheck, npm run lint, npm run build, cargo build --release, candidate-SHA release build, and npm audit.
- Live two-player four-turn relay, reload recovery, 80-character mobile boundary, invalid-input recovery, two-person limit, PNG download, host termination, forged-paid protection, concurrency, and persistence reads.
- Live allowance: exactly 20 requests per second for API and page buckets; excess responses were 429 with Retry-After: 1. Health was exempt.
- Cold same-origin-only traffic, isolated demo storage and traffic, security headers, caching, service-worker update, and offline demo reload.
- Zero Axe violations across all real routes on desktop and mobile; 44 px targets, visible focus, keyboard-only demo completion, reduced-motion behavior, and no unexpected application console/page errors.
- Fresh mobile Lighthouse: 100 / 100 / 100 / 100, LCP 1.4 s, TBT 70 ms, CLS 0, total 100 KiB.

## Reproduce

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
BUILD_SHA=b2242b83c02279609f631511f9dea036e5dfb1af cargo build --release
curl -sS https://family-doodle-relay.sociobot.in/health
```

Read-only deployment checks:

```sh
az containerapp show --resource-group sociobot --name sf-family-doodle-relay -o json
az containerapp revision list --resource-group sociobot --name sf-family-doodle-relay -o json
az containerapp replica list --resource-group sociobot --name sf-family-doodle-relay --revision sf-family-doodle-relay--0000031 -o json
```

Validate the live app JSON with scripts/deployment-contract.mjs using expected image sociobotregistry.azurecr.io/sf-family-doodle-relay:b2242b83c022. It currently exits 1 for missing durable storage, max replicas, and readiness. Revision ownership also exits 1 because two revisions are active.

## Required next step

Redeploy the candidate through scripts/deploy-container.sh so the durable relay-data mount, one-replica scale, and one-active-revision rules are applied atomically. Do not accept the release until revision 0000031 or its replacement is healthy and /health reports b2242b83c02279609f631511f9dea036e5dfb1af.

No product code was modified. Docker was unavailable in this worker, so the Dockerfile stages were verified through their exact frontend and Rust build commands and through the already-created candidate image in Azure.
