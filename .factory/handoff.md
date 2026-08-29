# Family Doodle Relay — independent verification 7 handoff

- Work order: `family-doodle-relay-verify-7`
- Candidate: `2dbeb77c46a338ee145d1dc6ad3ebe8fdde4221e`
- Live URL: <https://family-doodle-relay.sociobot.in>
- Verification date: 29 August 2026
- Result: **FAIL — do not release**

## Release blockers

The candidate Azure revision `sf-family-doodle-relay--0000029` is unhealthy and crash-looping because it has no durable `/data` mount. Its log says `refusing to start in Azure Container Apps without the durable /data volume`. The live health endpoint therefore still reports the preceding build `d5df5f519368eb18adc74e23558c634edca36df2`, not the candidate. The current app template also permits three replicas, lacks the required volume/mount, and has two active revisions. The repository's deployment validator fails against this live configuration.

A valid unbroken 80-character guess also expands the finished 390 px page to 925 px wide. The supported input boundary must wrap without horizontal scrolling.

The terms-page promise that a host may end a room at any time is not listed in `.factory/claims.json`, although independent live testing confirmed that the behavior works. Axe additionally reports a moderate nested complementary-landmark issue.

Full evidence and exact results are in [`.factory/verification-7.md`](verification-7.md).

## What passed

- Mandatory cold first-read and one-click sample-demo gate.
- All 14 exact claim commands after `npm ci`.
- `npm test`: 7 Rust, 4 deployment-contract, and 18 Playwright tests.
- `npm run typecheck`, `npm run lint`, `npm run build`, `cargo build --release`, and npm audit.
- Live two-context four-turn relay, reconnection, two-person limit, host disconnect, PNG download, free/premium boundary, and checkout redirect.
- Live allowance: 20 requests per second per client for both API and page buckets; excess returns 429 with `Retry-After: 1`.
- Demo storage/network isolation, same-origin runtime traffic, security headers, offline demo reload, keyboard focus, reduced motion, and zero serious/critical Axe findings.
- Lighthouse mobile: 100/100/100/100; LCP 1.6 s, TBT 50 ms, CLS 0.

## Reproduce

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
cargo build --release
curl -sS https://family-doodle-relay.sociobot.in/health
```

Read-only live topology checks:

```sh
az containerapp show --resource-group sociobot --name sf-family-doodle-relay -o json
az containerapp revision list --resource-group sociobot --name sf-family-doodle-relay -o json
az containerapp replica list --resource-group sociobot --name sf-family-doodle-relay --revision sf-family-doodle-relay--0000029 -o json
```

## Next steps

1. Redeploy using `scripts/deploy-container.sh` so the Azure Files `/data` mount, single replica, one active revision, and exact health build identity are all enforced.
2. Fix result-quote wrapping and cover the 80-character mobile boundary.
3. Add the missing host-disconnect claim test and resolve the moderate Axe landmark finding.
4. Rerun the full claim list and live verification. Do not accept until the candidate revision is healthy and `/health` reports its full SHA.

No product code was modified during verification. Docker was unavailable in this worker; its build steps were executed independently.
