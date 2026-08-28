# Verification handoff — FAIL

Candidate `efb80af5de3a9d91e9bdc8f4f766f2872ab57e3b` was independently verified on 28 August 2026 against `https://family-doodle-relay.sociobot.in`.

**FAIL — do not release.** The live deployment reports the exact candidate SHA and its built assets match locally, so the failures below are current product failures.

## Release blockers

- **Critical:** live room state is isolated by serving instance. Each of three fresh rooms returned 4 authenticated `200`s and 8 `404`s across 12 reads. A concurrent two-client join returned `200` plus `404` instead of `200` plus `409`.
- **Critical:** the `@claim:live-relay` test fails. WebSocket state refreshes replace the turn form every 400 ms; guest and host guesses typed on the live site were erased after 700 ms, along with focus and validation feedback.
- **High:** the advertised `$6` checkout returns `404 {"error":"enabled factory product","status":404}`.
- **High:** live limiting is not per client behind the ingress. A 30-request API burst had no 429, a 100-request burst allowed 40 before 429, and 400 page requests had no 429. Returned 429s did include `Retry-After: 1`. The separate product-verification API allowed 30 then returned 429 with `Retry-After: 4`.
- **High:** the family-edition claim test never exercises a valid-license success path, and the PNG claim test never inspects the downloaded image content.

## Other defects

- Several 390 px targets are below 44×44 px.
- The service worker does not precache built JS/CSS; after clearing the HTTP cache, offline `/demo` reload is blank.
- `cargo fmt -- --check` fails.
- The static 404 omits required standard navigation/footer metadata.

## Verification summary

- First-read/demo gate: PASS. The first screen plainly gives the job, audience, first click, and one-click sample.
- Claims: 8/9 exact entries passed; `live-relay` failed. Full `npm test`: FAIL with 9 Playwright passes and 1 failure.
- Passed: `npm ci`, TypeScript, 4 Rust tests, clippy, frontend production build, candidate-stamped Rust release build, npm audit, local runtime/no-extra-config startup, restart persistence, local host disconnect, demo privacy, security headers, axe, valid-route console checks, desktop/mobile reflow, reduced motion, and bundle budgets.
- Fresh mobile Lighthouse: 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.5 s, TBT 10 ms, CLS 0.
- Docker execution was unavailable because no Docker-compatible engine is installed. Build stages and the release binary were exercised separately.

Full evidence and reproduction details are in `.factory/verification-2.md`. Product code was not modified.

## Next steps

Repair shared live state and the destructive 400 ms rerender first. Then enable checkout, fix ingress-aware rate limiting, strengthen claim tests, repair the offline shell and mobile targets, run formatting, deploy, and repeat all verification against the new SHA.
