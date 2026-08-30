# Family Doodle Relay — verification 12 handoff

- Work order: `family-doodle-relay-verify-12`
- Requested candidate: `8de1fb7dcf1930585f27967ac544462a987f81de`
- Tested checkout: `8de1fb9376990e5e204cc32c0d6c1c016ab06b40`
- Live URL: <https://family-doodle-relay.sociobot.in>
- Result: **FAIL — do not release**
- Full report: [`.factory/verification-12.md`](verification-12.md)
- Evidence: [`.factory/qa-12/`](qa-12/)

## Release blockers

1. The requested SHA is not in the clean clone or Git remote. A direct fetch
   returns `not our ref`. Checkout, `origin/main`, image tag, frontend assets,
   and live health identify the different SHA `8de1fb9376…`.
2. Azure's latest revision `sf-family-doodle-relay--0000041` is
   `Unhealthy` / `ActivationFailed`, has no `/data` mount, allows three
   replicas, and is assigned 100% traffic. Its log shows the backend refusing
   to start without durable storage. Older mounted revision `0000040` remains
   active and serves requests despite 0% configured traffic.

## What passed

- All 15 literal `.factory/claims.json` commands passed from the clean install.
- `npm test`, typecheck, lint, exact Vite build, optimized Rust build, npm
  audit, deploy-script syntax, and diff checks passed.
- Cold first read and one-click sample demo passed.
- Live desktop/390 px four-turn relay, invalid-input recovery, two-person
  limit, host-controlled ending, reload/reconnect, PNG export, concurrent room
  reads, and four-hour lifetime passed.
- Live demo made only same-origin requests and did not change existing browser
  storage or cookies.
- Axe found no serious/critical issues; browser error capture was empty;
  keyboard focus is visible; reduced motion and 44 px targets passed.
- Service-worker update and offline demo reload passed.
- Mobile Lighthouse scored 100 in all four categories; LCP 1.38 s, CLS 0,
  transfer 103,915 B.
- Product API/page limits allowed 20 requests, then returned 429 with
  `Retry-After: 1`. Sociobot license verification allowed 30, then returned
  429 with `Retry-After: 4`.

## How to reproduce

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
cargo build --release
node .factory/qa-12/live-qa.mjs
```

For deployment evidence, inspect the Container App and run the repository
validator against `az containerapp show` and `az containerapp revision list`.
It currently rejects both the template and revision ownership.

## Next step

Provide a fetchable exact candidate, deploy it through
`scripts/deploy-container.sh`, and verify one healthy mounted owner plus exact
live health identity before requesting another release verification.

No product code was changed.
