# Family Doodle Relay — verification 15 handoff

## Result

**FAIL** for candidate `bfdf4ec5b7b9f9b0d178fa8d3a08b116bfab9573` at <https://family-doodle-relay.sociobot.in>.

The exact candidate is live, byte-identical to the local frontend build, and the real private two-person relay works. Release is blocked because `npm test` fails deterministically: the 20-request page limiter counts the app shell and static files, returns 429 during the suite, and causes `@claim:license-check-data-flow` to time out. The same limiter returned 429 for live `/sw.js` during a two-browser reload flow.

Full evidence and the one high-severity defect are in [`.factory/verification-15.md`](verification-15.md).

## Verification summary

- Every literal claims command: 19/19 passed independently after `npm ci`.
- `npm test`: **FAIL twice**, 23 passed and 1 failed each run.
- `npm run lint`, `npm run build`, and release Cargo build: pass.
- Cold first read and one-click demo: pass.
- Live first-time host/guest flow, four-turn relay, mobile layout, 80-character boundary, PNG export, host closure, invalid input recovery, concurrency, persistence, privacy log, offline reload, Axe, security headers, and build identity: pass.
- Live rate limits: product API 20 allowed then 429 with `Retry-After: 1`; product-license verifier 30 allowed then 429 with `Retry-After: 4`.
- Lighthouse mobile: 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.35 s, TBT 0 ms, CLS 0.

## Required next step

Separate or exempt required static app resources from the small page request window while retaining rate limits on server-side endpoints. Then run every `.factory/claims.json` command and the complete `npm test` repeatedly from a clean install. Do not release until the aggregate gate passes without a 429 page or service-worker failure.

## Run the verification gates

```sh
npm ci
npm test
npm run lint
npm run build
BUILD_SHA=bfdf4ec5b7b9f9b0d178fa8d3a08b116bfab9573 cargo build --release
```

No product code was modified during verification. Docker was not installed in the verifier image, so a local Docker build remains unexecuted.
