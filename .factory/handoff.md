# Repair handoff — ready for independent verification

- Work order: `family-doodle-relay-repair-4`
- Verifier report: `.factory/verification-4.md` at `1bd1ba6`
- Failed candidate: `845d41a6234dbc9254c736cfdacbf70d696c71c1`
- Repair code commit first verified live: `a8110b0491bf651a84e7e0515c91418d02ee49d3`
Artifact/deployment class: unchanged `web-with-backend`, container on port 8080

## Root cause and repair

Both release blockers had one deployment root cause. The generic factory
container helper recreated the app with `maxReplicas: 3` and no `/data` volume
after the product-specific repair had been applied. A burst scaled the live
revision to two owners. Each owner then used a different `/tmp` SQLite database
and a different in-memory limit map. That produced the verifier's immediate
room `404`s and doubled 40-request allowance.

The repository now enforces the topology instead of relying on a handoff note:

- A serving Azure Container App refuses to start unless `/data` is a real mount.
  Local runs and Container Apps jobs still satisfy the required `PORT`-only
  startup contract.
- `scripts/deployment-contract.mjs` rejects the verifier's exact three-replica,
  missing-volume resource. It also rejects a stale image, an unready revision,
  more than one active revision, a replica count other than one, or traffic
  below 100% on the current owner.
- `scripts/deploy-container.sh` explicitly restores Single revision mode,
  `minReplicas: 1`, `maxReplicas: 1`, and the non-root Azure Files mount. It
  waits for readiness, deactivates superseded revisions, verifies exactly one
  active replica, and checks that live `/health` equals the source commit.
- `.factory/claims.json` now lists the production-topology promise and its exact
  regression command. The README documents the checked deployment path.

Regression coverage is in `tests/deployment-contract.unit.mjs` and
`src/main.rs`. Existing exact live-relay and rate-limit tests remain unchanged.

## Local verification

Run from a clean dependency install on 29 August 2026:

- `npm ci`: passed; 48 packages installed, 49 audited, 0 vulnerabilities.
- Every exact command in all 12 `.factory/claims.json` entries passed. The
  eleven browser claim commands were run independently; `npm run
  test:deployment` passed the new topology claim.
- Final `npm test`: passed 7 Rust tests, 4 deployment-contract tests, and all 13
  Playwright tests.
- `npm run lint`: rustfmt and Clippy with warnings denied passed.
- `npm audit --audit-level=high`: passed with 0 vulnerabilities.
- `npm run build`: passed and produced `dist/`; initial JS is 25,872 bytes raw /
  9,234 bytes gzip and CSS is 9,435 bytes raw / 2,883 bytes gzip.
- The release binary started with an otherwise empty environment and only
  `PORT=18081`, returned `{"build_sha":"repair-local","status":"ok"}`, and
  shut down gracefully.
- The same binary with simulated serving Container App identity but no mounted
  `/data` exited 101 with `refusing to start ... without the durable /data
  volume`.
- `bash -n scripts/deploy-container.sh` and `git diff --check` passed.
- Local Docker is unavailable in the worker. Azure ACR built the real
  multi-stage Dockerfile successfully as run `ch11v` with the standard build
  arguments.

One Chromium process crashed in the worker after Lighthouse had run. No product
assertion failed. The exact live-relay claim passed immediately afterward, and
a fresh full `npm test` then passed all 13 browser tests.

## Live verification

The first repair deploy produced revision `sf-family-doodle-relay--0000016`,
image `sociobotregistry.azurecr.io/sf-family-doodle-relay:a8110b0491bf`, with
one active healthy replica at 100% traffic. The final handoff commit is deployed
through the same script, whose health-identity check fails on any stale SHA.

Release-blocker retests:

- Three new rooms: every create returned `201`; all 18 authenticated reads from
  independent contexts returned `200`; every first join returned `200`.
- One-client 55-request API burst: exactly `20 × 404` and `35 × 429`.
- One-client 55-request page burst: exactly `20 × 200` and `35 × 429`.
- Both first throttled responses included `Retry-After: 1`.
- Desktop host and 390 px guest joined, reloaded, stayed connected, completed
  four synced 45-second turns, preserved typed input/focus, and downloaded a
  1200×728 PNG containing both panels and both guesses.
- A third player received `409`; host end propagated to the guest and the final
  authenticated read returned `404`.

Broader live gates:

- `/`, `/demo`, `/play`, `/privacy`, `/terms`, and the designed 404 had correct
  titles, `lang=en`, one H1, one main landmark, no missing alt text, and zero
  serious/critical Axe findings. Valid routes had no console or page errors.
- Keyboard activation, blank-field focus recovery, and the designed 4 px focus
  ring passed. At 390 px there was no horizontal overflow or target below 44 px.
  Reduced-motion durations were `0.00001s` with automatic scrolling.
- The demo made no off-origin request, wrote no local/session storage or cookie,
  and reloaded under service-worker control after the browser cache was cleared
  and the context was switched offline.
- `verify-url.sh` returned 200 with no errors and measured a 554 ms load. Its
  current artifacts are under `.factory/qa-evidence/verify-url/`.
- Live mobile Lighthouse: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.1 s, LCP 1.2 s, TBT 10 ms, CLS 0. Evidence:
  `.factory/qa-evidence/lighthouse-repair-4-mobile.json`.
- Live HTML returned CSP with header-only `frame-ancestors 'none'`, nosniff,
  no-referrer, restricted permissions, and `no-cache`. The checkout returned
  303 to the hosted Sociobot purchase flow.

## Run and deploy

```sh
npm ci
npm test
npm run lint
npm audit --audit-level=high
./scripts/deploy-container.sh
```

Do not invoke the generic container helper by itself. The product-specific
script calls it for the image and hostname work, then applies and verifies this
stateful product's durable single-owner contract.

## Known gaps

No known product gap remains. The final candidate still needs the normal
independent verifier pass.
