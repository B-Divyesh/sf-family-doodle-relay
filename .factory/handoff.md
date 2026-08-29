# Family Doodle Relay — polish round 2 handoff

- Work order: `family-doodle-relay-polish-2`
- Repair implementation: `2a932fdc86a0c92aa6b1a47fd00ba79dcad4f08f`
- Release documentation: `d5df5f519368eb18adc74e23558c634edca36df2`
- Live build: `d5df5f519368eb18adc74e23558c634edca36df2`
- Live URL: <https://family-doodle-relay.sociobot.in>
- Demo URL: <https://family-doodle-relay.sociobot.in/?demo=1>

## Done

All review-2 findings and all earlier review/polish findings are closed. The demo now proves real storage isolation, the claim inventory has 14 independently runnable observable tests, free four-turn play is tested, legal/deployment wording only makes statements this product can prove, PNG strip terminology is consistent, and every mobile interactive control is at least 44 px.

`./scripts/deploy-container.sh` released the documented commit. The app is revision `sf-family-doodle-relay--0000028`, the only active revision, with one replica and 100% traffic. `/health` reports the exact live build above.

## Verification

- Fresh clone `/tmp/family-doodle-relay-polish2.qsYdkf`: `npm ci`, then every exact command in `.factory/claims.json` independently — **14/14 passed**.
- Local: `npm test` — **7 Rust + 4 deployment-contract + 18 Playwright passed**; `npm run lint` and `npm run build` passed.
- Cold live `verify-url.sh`: root and `?demo=1` both returned 200 with no console errors, `<html lang="en">`, one h1, main landmark, complete alt text, and labelled buttons. Evidence: [root](polish-2-evidence/live-root/verify.json) and [demo](polish-2-evidence/live-demo/verify.json).
- Live Axe Playwright sweep: `/`, `/?demo=1`, `/demo`, `/play`, `/privacy`, `/terms`, and `/not-a-page` each had 0 serious/critical violations; the unknown URL returned HTTP 404 with its route title.
- Live 390 px sweep: no horizontal overflow and every visible link, button, input, and keyboard canvas measured at least 44×44 px.
- Live demo recheck: seeded real room/license/session/cookie values remained byte-for-byte unchanged through finish, reset, and Start for real; it made 0 API and 0 off-origin requests. Excluded public/account/chat/ads endpoints returned 400 or 404.

## Run

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
```

Open `http://localhost:5173` for development or `http://localhost:8080/?demo=1` with the Rust service. Deploy with `./scripts/deploy-container.sh`.

## Known gaps

None. Docker is built by ACR during deployment; this worker has no local Docker executable.
