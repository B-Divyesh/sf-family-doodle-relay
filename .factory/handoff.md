# Family Doodle Relay — repair handoff

- Work order: `family-doodle-relay-repair-5`
- Verifier base/candidate: `9a7dd7af5fc6738b4a84930127b8682dafb9a511` / `2dbeb77c46a338ee145d1dc6ad3ebe8fdde4221e`
- Repair implementation commit: `f84673b2cd40fa5f89324382e754ac1fb3858af8`
- Deployed image: `sociobotregistry.azurecr.io/sf-family-doodle-relay:f84673b2cd40`
- Live revision: `sf-family-doodle-relay--0000030`
- Live URL: <https://family-doodle-relay.sociobot.in>
- Repair date: 29 August 2026
- Result: **PASS — deployed and verified**

## Fixed verifier findings

1. **V7-01 deployment crash loop:** `scripts/deploy-container.sh` now builds the ACR image directly and patches the complete durable revision template in the same deployment operation. It never sends this backend through the generic three-replica/no-volume deployer. The generated template is unit-tested to require single-revision mode, one replica, the Azure Files `relay-data` volume at `/data`, and its ownership mount options.
2. **V7-02 mobile result overflow:** unbroken user guesses now use `overflow-wrap: anywhere`. A real two-browser, completed 390 px relay test submits the supported 80-character boundary guess and asserts that `scrollWidth <= 390`.
3. **V7-03 missing claim:** added `host-end-room` to `.factory/claims.json`. Its tagged browser test confirms a host can end an active room, both players get the clear recovery message, and both get a new-room path.
4. **V7-04 landmark semantics:** converted layout-only asides to ordinary containers, made the persistent demo notice a labelled region, and placed the skip link inside the header landmark. The route sweep now requires zero Axe violations (including moderate), not only zero serious/critical ones.

## Verification

Fresh local setup and gates:

```sh
npm ci                         # 0 vulnerabilities
npm test                       # pass: Vite build, TypeScript, 7 Rust, 5 deployment, 20 Playwright
npm run typecheck              # pass
npm run lint                   # pass: rustfmt + clippy -D warnings
npm run build                  # pass; dist/ produced
cargo build --release          # pass
npm audit --audit-level=high   # pass: 0 vulnerabilities
```

- Every exact command in the 15-entry `.factory/claims.json` passed independently after `npm ci`, including the new `@claim:host-end-room` command and deployment topology claim.
- The browser suite covers desktop and 390 px mobile, keyboard activation, 44 px targets, keyboard canvas action, focus, the finished 80-character result, reduced motion, privacy/request recording, offline demo reload/service worker, and end-to-end two-player relays.
- Axe via `@axe-core/playwright` found **zero violations** for `/`, `/?demo=1`, `/demo`, `/play`, `/privacy`, `/terms`, and a real 404. `/opt/fleet/lib/verify-url.sh` passed locally and live: English language, route title, one H1/main, complete image alt text, labelled controls, and no browser console/page errors.
- Local response-policy probe returned `Content-Security-Policy` with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, disabled camera/microphone/geolocation permissions, and `Cache-Control: no-cache` for HTML.
- Local mobile Lighthouse collected **96 Performance / 100 Accessibility / 100 Best Practices / 100 SEO**, LCP 1.7 s, CLS 0. The bundled Chromium crashed only while collecting Lighthouse’s final full-page screenshot after the audits had completed; Playwright and verify-url had no browser errors.

Live deployment evidence:

```text
GET /health
{"build_sha":"f84673b2cd40fa5f89324382e754ac1fb3858af8","status":"ok"}

deployment contract
{"revision":"sf-family-doodle-relay--0000030","image":"sociobotregistry.azurecr.io/sf-family-doodle-relay:f84673b2cd40","replicas":1,"dataMount":"/data"}

revision ownership
{"revision":"sf-family-doodle-relay--0000030","activeRevisions":1,"replicas":1,"trafficWeight":100}
```

- Azure reports the revision healthy, one active revision, one replica, 100% traffic, `minReplicas=maxReplicas=1`, and the required Azure Files `/data` mount with `uid=10001,gid=10001,file_mode=0770,dir_mode=0770`.
- Live browser safety flow passed: valid join and reload preserved both-player presence; a host end removed the room (`404`) and showed the guest **“The host ended this room. Make a new room to play again.”** with no console/page errors.
- Live `verify-url.sh` passed in 568 ms with no console errors and the expected title, language, H1, main landmark, alt text, and labelled controls.

## Run and deploy

```sh
npm ci
npm test
npm run lint
npm run build
./scripts/deploy-container.sh
```

The deploy script builds the image in ACR, creates the durable one-owner revision, waits for it to be ready, deactivates superseded owners, and verifies the exact live `/health` build SHA.

## Known gaps

There are no known product or deployment gaps. The only tooling limitation observed was the Lighthouse Chromium final-screenshot crash described above; it occurred after audits were collected and did not reproduce in Playwright or `verify-url.sh`.
