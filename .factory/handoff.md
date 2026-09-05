# Family Doodle Relay — repair 12 handoff

## Result

**PASS.** The static-file limiter defect from verification 15 is repaired and the release is live at <https://family-doodle-relay.sociobot.in>.

- Implementation SHA: `1a60bea4d0294133314922b1b8d05c842743016e`
- Documentation and evidence SHA: `8c8cdbc31ed600bae7b519423011f7fad8daf401`.
- Live health: `{"build_sha":"1a60bea4d0294133314922b1b8d05c842743016e","status":"ok"}`.
- Live revision: `sf-family-doodle-relay--0000049`, the only active healthy revision, with one replica, 100% traffic, and the existing durable `/data` Azure Files mount.

## What changed

- Limited only stateful room API and WebSocket routes. Static HTML, JavaScript, images, and `/sw.js` no longer consume the 20-request endpoint window.
- Added an outcome-based `@claim:rate-limit` regression. It proves API and WebSocket bursts allow 20 requests then return `429` with `Retry-After: 1`, while 55 rapid requests each to the app shell, service worker, and built JavaScript all succeed.
- Narrowed the public rate-limit claim in the README and claim inventory to match the behavior.

## Verification

- Fresh clone at the implementation SHA: `npm ci` passed with zero audit vulnerabilities; all 19 literal commands from `.factory/claims.json` passed independently.
- `npm test` passed twice: once in the release checkout and once in the fresh clone (24 browser tests, 9 Rust tests, claim-manifest test, and 18 deployment-contract tests).
- `npm run lint`, `npm run build`, `BUILD_SHA=1a60bea4d0294133314922b1b8d05c842743016e cargo build --release`, and `git diff --check` passed.
- A release-binary restart test retained an authorized room: HTTP 200 before and after restart; health reported the implementation SHA both times.
- Live tenant isolation: a room’s access key read its own room (200) and could not read another room (404).
- Fresh desktop and 390 px browser contexts confirmed the first screen: job **“Draw together from two places”**; audience **“For a child and one trusted adult…”**; first action **“Try it with sample data”**; next step **“A sample relay opens next. Nothing is saved.”**
- Live demo entered in one click, showed the persistent sample banner, reset, exited without changing seeded real browser data, made no room API request, and downloaded `family-doodle-relay.png`.
- Live host and phone guest completed the real four-turn relay and downloaded the PNG strip. Invalid blank-guess recovery worked.
- Live routes `/`, `/?demo=1`, `/demo`, `/play`, `/privacy`, `/terms`, and the designed HTTP 404 had one H1/main, correct route titles, no console errors, and no Axe serious or critical findings. `verify-url.sh` passed root, demo, privacy, and terms.
- Live demo reloaded offline after service-worker control. The 390 px demo had no overflow, every visible control was at least 44 px, and reduced motion reduced transitions to `0.00001s`.
- Live rate probe: API `20` normal / `35` limited and WebSocket endpoint `20` normal / `35` limited, both with `Retry-After: 1`; static `/`, `/sw.js`, and the built JavaScript each returned 55/55 HTTP 200.
- Mobile Lighthouse: 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; FCP 1.05 s, LCP 1.43 s, TBT 22 ms, CLS 0, transfer 103 KB.

Evidence is in [`.factory/repair-12-evidence/`](repair-12-evidence/). The catalog description is copied to `/work/.evidence/catalog-description.txt` and remains a 64-character verb-first description.

## Deployment

The release used only the product container app and its `sf-family-doodle-relay` image. It staged the candidate at zero traffic with the existing `relay-data` mount, waited for one healthy replica, switched traffic, retired the prior revision, returned to single-revision mode, and verified the live SHA. No shared service settings or credentials were read or changed.

## Run locally

```sh
npm ci
npm test
npm run lint
npm run build
BUILD_SHA=$(git rev-parse HEAD) cargo build --release
```

Open `http://127.0.0.1:8080/?demo=1` after starting the server. See [`.factory/demo.md`](demo.md) for the isolated sample behavior.

## Known gaps

None found in this repair. Billing registration remains an external factory responsibility; the existing verified one-time family-edition offer and free core were preserved.
