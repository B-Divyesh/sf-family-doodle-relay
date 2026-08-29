# Family Doodle Relay

Draw and guess together in a private two-person room.

Family Doodle Relay is for a child and one trusted adult playing from different places. It gives them four 45-second turns to draw, guess, and add one detail. The final relay downloads as a PNG image.

There are no public rooms, profiles, ads, or open chat. A room allows two players and closes within four hours. The free game includes four turns and PNG download. The $6 family edition is a one-time purchase for eight-turn rooms; it uses Sociobot checkout and license verification.

## Try the sandbox

Open `/demo` or <https://family-doodle-relay.sociobot.in/demo>. It starts with a sample relay and does not save changes. See [`.factory/demo.md`](.factory/demo.md).

## Run locally

Requirements: Node 22+, npm, and Rust 1.88+.

```sh
npm ci
npm run dev
```

Open <http://localhost:5173>. Vite proxies room and WebSocket traffic to the Rust service on port 8080.

## Test and build

```sh
npm test
npm run build      # browser files land in dist/
cargo build
npx tsc -p frontend/tsconfig.json --noEmit
```

The claim tests are listed in [`.factory/claims.json`](.factory/claims.json). `npm test -- --grep @claim:` runs only those browser checks.

## Run the production container

```sh
docker build --build-arg BUILD_SHA=local -t family-doodle-relay .
docker run --rm -p 8080:8080 -e PORT=8080 family-doodle-relay
```

The container needs no other environment variables. `GET /health` returns the build SHA. Rooms live in `/data/family-doodle-relay.db`, are deleted at their four-hour expiry, and the container deployment is deliberately pinned to one replica so a relay stays on its private temporary store.

## Architecture and privacy

The browser app uses Vite and TypeScript. Rust, Axum, and a short-lived SQLite room store serve the app. Live state updates keep the active turn in place, so a typed guess, focus, validation message, and a pointer stroke survive sync messages. Every non-health route is rate limited per client by the right-most address added by the factory ingress.

Browser storage holds private room keys and an optional purchase license. The server does not ask for names, ages, email addresses, or profiles. See `/privacy` and `/terms`.

## Deploy

The factory builds the root `Dockerfile` and supplies `PORT` plus `BUILD_SHA`. The Azure Container App deployment is configured with `minReplicas: 1` and `maxReplicas: 1`, which is required for the container-local temporary room store. `FACTORY_SOCIOBOT_KEY` may be supplied to authenticate server-side license verification; it is optional and never embedded in the image. DNS, billing product registration, and infrastructure stay outside this repository.

## License

[MIT](LICENSE)
