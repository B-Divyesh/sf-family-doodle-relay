# Independent product verification 13 — FAIL

Verified on 30 August 2026 from a clean checkout against <https://family-doodle-relay.sociobot.in>.

- Work order: `family-doodle-relay-verify-13`
- Requested, checkout, and `origin/main`: `34039ec343f72069dacbf97a16f50384ac77920e`
- Live `/health` build identity: `34039ec343f72069dacbf97a16f50384ac77920e`

## Verdict

**FAIL — do not release.** Browser product QA and every local gate pass, and the live static files and `/health` identify the requested commit. The actual production Container App does not meet the durable single-owner backend contract: its 100%-traffic latest revision is activation-failed without `/data`, while the healthy candidate revision is active only at 0% traffic.

## Mandatory first read and demo — PASS

A fresh cold visit answered all three required questions in the first screen: **what:** “Draw together from two places”; **for whom:** “For a child and trusted adult who want a calm game between calls”; and **first click:** “Try it with sample data,” followed by “A sample relay opens next. Nothing is saved.”

That one click opened the populated demo with the persistent “Demo — sample data, nothing is saved” banner, **Reset demo**, and **Start for real**.

## Required claims gate — PASS locally

`.factory/claims.json` exists with 15 entries. After clean `npm ci` (48 locked packages; audit reported zero vulnerabilities), every literal declared command was run individually through the demo/test entry point and passed:

| Claim IDs | Result |
| --- | --- |
| `demo-sandbox`, `privacy-defaults`, `browser-storage` | PASS |
| `png-export`, `download-local` | PASS |
| `two-person-limit`, `room-expiry` | PASS |
| `one-time-price`, `family-edition` | PASS |
| `live-relay`, `free-core`, `host-end-room` | PASS |
| `rate-limit`, `health-build`, `deployment-topology` | PASS in their local sandboxes |

The full `npm test` run passed: Vite build, TypeScript, 7 Rust tests, 13 deployment-contract tests, and 22 Chromium tests. `npm run lint` (format plus Clippy warnings denied), `npm run typecheck`, `npm run build`, and `BUILD_SHA=34039ec343f72069dacbf97a16f50384ac77920e cargo build --release` passed. Docker is unavailable in this verifier, so the exact Docker build could not run; the release binary was run with an otherwise empty environment and only `PORT=18080`, returning the requested build identity and creating a room (`201`).

## Product QA — PASS

- A desktop host and 390 px guest created and joined a real live room, completed the four draw/guess turns, and downloaded `family-doodle-relay.png`; console and page-error capture stayed empty.
- Demo actions preserved seeded real local storage, session storage, and cookie sentinels, and made no room API or off-origin request while the demo was open. The sample-strip download remained local.
- Live Axe scans found no serious or critical findings on `/`, `/demo`, `/play`, `/privacy`, `/terms`, and the HTTP 404 at desktop and 390 px. Each had one h1, one main, and `lang=en`; mobile had no horizontal overflow. Keyboard sample marking worked, focused buttons used the designed `4px` press-red outline with `3px` offset, and reduced-motion transition duration was effectively zero.
- One activated service worker had no waiting/installing worker. After cache clear and offline mode, the controlled demo reloaded with sample state.
- Normal live responses set CSP including header-only `frame-ancestors 'none'`, `nosniff`, `no-referrer`, and disabled camera/microphone/geolocation. HTML uses `no-cache`; the 27,033 B JS (9.44 kB gzip) and 9,953 B CSS (2.94 kB gzip) are immutable. Local `dist/index.html`, JS, and CSS were byte-identical to live assets.
- A 45-request fresh live burst observed exactly 20 normal API responses and 25 `429` responses with `Retry-After: 1`; a spoofed left-hand `X-Forwarded-For` burst had the same result. Health remained exempt.

## Live deployment evidence — FAIL

Read-only Azure inspection and the repository's validators found:

| Item | Evidence |
| --- | --- |
| Healthy candidate revision | `sf-family-doodle-relay--0000044`; full requested image SHA; `/data` mounted from `family-doodle-relay-data`; one healthy/running replica; **0% traffic** |
| Latest traffic revision | `sf-family-doodle-relay--0000045`; short image tag `34039ec343f7`; **100% traffic**; active, `Unhealthy` / `ActivationFailed` |
| Broken revision topology | no volumes or volume mounts; `maxReplicas: 3` |
| Replica state | one non-ready replica, 9 restarts, `CrashLoopBackOff` |
| Process log | `refusing to start in Azure Container Apps without the durable /data volume` |
| Contract validation | rejects template for stale abbreviated image, three-replica scale, missing mount/storage/options, and latest revision not ready; rejects revision ownership because two revisions are active and the healthy owner has 0% traffic |

The public health endpoint is served by the prior healthy candidate revision, explaining why health/build and static-asset checks alone look correct. It does not cure the failed 100%-traffic topology.

## Defects by severity

### V13-01 — Critical — current 100%-traffic backend revision is activation-failed without durable room storage

Revision `0000045` was created after the healthy full-SHA candidate revision and replaces its template with a shortened image tag, no Azure Files `/data` mount, and `maxReplicas: 3`. It crash-loops at startup. Two active revisions remain while the only healthy durable candidate is assigned 0% traffic. This violates persistence, single-owner, ready-revision, and exact-image deployment requirements and can split or lose private room state if fallback behavior changes.

## Required release work

1. Remove/deactivate the failed generic revision and deploy the full candidate through `scripts/deploy-container.sh` (or atomically apply its complete durable template).
2. Confirm exactly one active healthy/running revision with one replica and 100% traffic, the full 40-character candidate image tag, and `family-doodle-relay-data` mounted at `/data` with every required option.
3. Re-run live deployment-contract and revision-ownership validation, persistence handoff, rate burst, and two-browser relay after convergence.

No product code was modified in this verification.
