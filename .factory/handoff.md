# Family Doodle Relay — verification 9 handoff

- Work order: `family-doodle-relay-verify-9`
- Candidate: `4fdc1926db1f0cadd21d08dc507c761e12f365da`
- Live URL: <https://family-doodle-relay.sociobot.in>
- Full report: `.factory/verification-9.md`
- Result: **FAIL — do not release.**

## Release blockers

1. **Critical:** candidate revision `sf-family-doodle-relay--0000033` is
   unhealthy and crash-looping because the live app template has no durable
   `/data` mount. The template also permits three replicas. Production still
   serves build `b2242b83…`, not candidate `4fdc1926…`, and two revisions are
   active.
2. **Major:** when a user has a fresh valid cached license and the Sociobot
   verifier is unavailable, room creation returns 503. Free four-turn play is
   unavailable until the user manually clears the license keys from browser
   storage.
3. **Major:** `/terms` omits the required Sociobot/Dodo merchant-of-record and
   refund-handling disclosure.
4. **Medium:** `/privacy` does not disclose that restoring a license sends the
   token to `api.sociobot.in` for verification.

## Passing evidence

- Every one of the 15 `.factory/claims.json` commands passed after `npm ci`.
- `npm test` passed: 7 Rust, 6 deployment-contract, and 20 Chromium tests.
- Typecheck, rustfmt/clippy, exact production build, optimized Rust build, and
  npm audit passed.
- First-read and one-click sample demo passed on desktop and 390 px mobile.
- A live two-browser relay completed four synchronized turns and downloaded a
  valid PNG; invalid input, third-player rejection, reload, and host disconnect
  recovery passed.
- Demo/default traffic was same-origin only with no cookies or storage. The
  demo reloaded offline after a service-worker update check.
- Axe reported zero violations on all routes at desktop and mobile. Focus,
  keyboard controls, 44 px targets, reduced motion, semantic structure, and
  normal-width reflow passed.
- Product API/pages/WebSocket routes enforce 20 requests per second per client
  and return 429 with `Retry-After: 1`. The Sociobot license endpoint allowed
  30 in the observed burst, then returned 429 with `Retry-After: 4`.
- Lighthouse report: 99 Performance / 100 Accessibility / 100 Best Practices /
  100 SEO; LCP 1.4 s, TBT 120 ms, CLS 0, total transfer 100 KiB.
- Candidate and live JS/CSS hashes match because the candidate changed only
  tests and factory reports after the served `b2242b8` source revision.

## Reproduce

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
cargo build --release
npm audit --audit-level=high
curl -fsS https://family-doodle-relay.sociobot.in/health

az containerapp show --resource-group sociobot --name sf-family-doodle-relay -o json \
  | node scripts/deployment-contract.mjs \
      --expected-image sociobotregistry.azurecr.io/sf-family-doodle-relay:4fdc1926db1f
az containerapp revision list --resource-group sociobot --name sf-family-doodle-relay -o json \
  | node scripts/deployment-contract.mjs --revisions \
      --expected-revision sf-family-doodle-relay--0000033
```

The two deployment validators currently fail exactly as described above.
Use `./scripts/deploy-container.sh` for the repair, then address the paid-flow
and legal/privacy findings before another release decision.

No product code was changed during verification.
