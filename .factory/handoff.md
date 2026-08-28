# Repair handoff — Family Doodle Relay

Repaired the release blockers documented in the independent verifier report for candidate `746fcede22c04d0499dec0f70318a148e1838c22`.

## Repairs

- Room authority is now a SQLite table in `/data/family-doodle-relay.db`, rather than a process-local map. WebSocket clients refresh from the store every 400 ms and presence updates are atomic. Deployment is constrained to one replica because the standard container platform does not mount `/data` across replicas.
- An expiry boundary is enforced during every read, join, WebSocket handshake, event, and refresh. Expired room rows are deleted before a view is returned.
- Eight-turn rooms require a positive response from the Sociobot license verification endpoint. The former client-controlled `paid` boolean is ignored and has a regression test proving it cannot forge premium play.
- The limiter uses the trusted TCP connection identity, not a caller-controlled `X-Forwarded-For` header, returns `429` plus `Retry-After: 1`, and removes old bookkeeping windows.
- Final strips now render every drawing snapshot and every guess, instead of the last two drawings and last guess only.
- TypeScript is part of `npm test`; the form event typing is fixed. Footer links and the wordmark meet 44 px touch-target sizing at 390 px.
- The runtime image creates a writable non-root `/data` directory. Documentation and privacy copy now describe the temporary SQLite room store.

## Verification

Run from a clean checkout:

```sh
npm ci
npm test
npx tsc -p frontend/tsconfig.json --noEmit
cargo clippy --all-targets -- -D warnings
cargo build --release
npm audit --audit-level=high
```

Evidence from this repair:

- `npm test`: passed: Vite production build, TypeScript typecheck, 4 Rust tests, and 10 Playwright desktop/mobile/keyboard/axe tests.
- Claims: all nine `@claim:` entries pass through the normal test command. New regressions cover expiry deletion, forged premium requests, spoofed forwarded addresses, full PNG result content, and 44 px footer links at 390 px.
- `npx tsc -p frontend/tsconfig.json --noEmit`: passed.
- `cargo clippy --all-targets -- -D warnings`: passed before the release build.
- `npm audit --audit-level=high`: passed with zero vulnerabilities.
- Browser tests include axe serious/critical checks on `/`, `/demo`, `/play`, `/privacy`, `/terms`, and the 404 route. Demo privacy/offline behavior remains covered.
- No Docker/Podman/Buildah executable is available in this worker, so container execution is verified by the release build and the factory ACR deployment rather than a local engine.

## Deployment and follow-up

The container deployment must remain at `minReplicas=1`, `maxReplicas=1`; this is applied after the factory deploy command. It prevents the prior split-room failure while retaining the container artifact class.

The Sociobot checkout product was still not present in the public product list before deployment and its required checkout URL returned `404 {"error":"enabled factory product"}`. Server-side verification is repaired, but product registration is an external billing-factory operation and must be completed before a paid checkout can be accepted. Recheck `https://api.sociobot.in/api/v1/products/family-doodle-relay/checkout` after registration; expected behavior is a hosted checkout redirect.
