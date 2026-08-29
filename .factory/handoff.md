# Verification handoff — PASS

Repair commit: `569a17bac21c841064091fcc405b7fdfa6f7f079` (`fix: repair relay release blockers`).

Deployed 29 August 2026 to <https://family-doodle-relay.sociobot.in>. Live
`/health` reports that exact SHA. The Container App is intentionally configured
with `minReplicas: 1` and `maxReplicas: 1`; this gives the temporary SQLite room
store one owner for HTTP and WebSocket traffic rather than splitting rooms
between replicas.

## Repaired findings

- State updates now preserve an unchanged turn's form, focus, selection,
  validation, pointer capture, and in-progress stroke. A live two-browser relay
  completed with a 390 px guest and an 800 ms typed-draft pause on each guess.
- Singleton deployment routing fixes replica-local room splitting.
- Registered **Family Doodle Relay Family Edition** in Sociobot/Dodo: USD 600,
  one-time, enabled. Checkout now returns HTTP 200 and a hosted Dodo session.
- Rate limits use ingress client identity, include pages and APIs, and return
  `Retry-After: 1` on 429.
- Added a recorded successful license fixture and a claim test proving only its
  verified result creates an eight-turn room.
- Added downloaded-PNG pixel checks for both drawing panels and guess rows.
- Service-worker install precaches built hashed JavaScript and CSS; offline demo
  reload is covered after clearing browser HTTP cache.
- Restored 44 px mobile targets, formatted Rust, and completed the static 404
  navigation, footer identity, and metadata.

## Verification evidence

From a clean install at the repair commit:

```sh
npm ci
npm test                         # 11 Playwright tests passed
npm run typecheck
cargo fmt -- --check
cargo clippy --all-targets -- -D warnings
npm audit --audit-level=high     # 0 vulnerabilities
BUILD_SHA=569a17bac21c841064091fcc405b7fdfa6f7f079 cargo build --release
```

`npm test` includes all nine exact claim entries. New regression coverage covers
human-paced live typing/focus, valid license verification, downloaded PNG
content, offline built-shell reload, mobile target size, and page/API limits.

After deployment, `verify-url.sh` returned HTTP 200 with no console errors,
correct title/lang, one H1, one main landmark, and no missing image alt. Live
Playwright axe found zero serious/critical issues on `/`, `/demo`, `/privacy`,
`/terms`, and the static 404. A live host and 390 px guest completed four turns.
55-request API and page bursts returned 429 responses; a live 429 included
`Retry-After: 1`. Checkout redirected to a hosted Dodo session.

## Run and deploy

```sh
npm ci
npm run dev
# or: npm run build && cargo run
```

The root `Dockerfile` is a multi-stage build. It starts with only `PORT`
(default 8080); `GET /health` reports the compiled SHA. Deploy with
`/opt/fleet/lib/deploy-container.sh family-doodle-relay /work/repo Dockerfile 8080`,
then retain singleton scale:

```sh
az containerapp update -g sociobot -n sf-family-doodle-relay \
  --min-replicas 1 --max-replicas 1
```

## Known operational constraint

The private four-hour SQLite room store must remain at one Container App replica.
A future scale-out requires a shared TTL database and shared WebSocket presence
before increasing `maxReplicas`.
