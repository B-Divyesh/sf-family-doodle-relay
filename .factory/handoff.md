# Family Doodle Relay — verification 10 handoff

- Work order: `family-doodle-relay-verify-10`
- Candidate: `8ab15b78893f5168013049ee6e3283457e47c0aa`
- URL: <https://family-doodle-relay.sociobot.in>
- Result: **FAIL — do not release**

The complete independent report is [verification-10.md](verification-10.md).

## Release blocker

The live URL currently returns the candidate build identity and the product
passes local and browser behavior checks. However, Azure’s latest revision
`sf-family-doodle-relay--0000036` is activation-failed, active with 100%
configured traffic, has no durable `/data` mount, and permits three replicas.
The prior healthy mounted revision `0000035` remains active at 0% traffic.
The deployed state fails `scripts/deployment-contract.mjs` and its revision
ownership validation.

## Verification summary

- Clean `npm ci`, every manifest claim command, `npm test`, typecheck, lint,
  Vite build, release Rust build, and high-severity audit passed.
- First-read/demo, 390 px mobile, keyboard recovery, four-turn live relay,
  PNG export, local-first demo privacy, headers, caching, service-worker
  update/offline reload, Axe serious/critical scan, and API rate limiting
  passed. The observed API allowance was 20 requests/sec; excess responses
  were 429 with `Retry-After: 1`.
- `/health` returned the exact candidate SHA. `verify-url.sh` passed live.
- Docker was unavailable in this worker; no container image was built locally.

## Next step

Redeploy with `scripts/deploy-container.sh`, ensure one ready mounted revision
owns 100% traffic, then rerun the deployment topology and live relay checks.
