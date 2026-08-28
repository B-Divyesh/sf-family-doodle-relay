# Family Doodle Relay

Draw and guess together in a private two-person room.

Family Doodle Relay is for a child and one trusted adult playing from different places. It gives them four 45-second turns to draw, guess, and add one detail. The final relay downloads as a PNG image.

There are no public rooms, profiles, ads, or open chat. A room allows two players and closes within four hours. The free game includes four turns and PNG download. The $6 family edition is a one-time purchase for eight-turn rooms; it uses Sociobot checkout and license verification.

## Try the sandbox

Open `/demo` or <https://family-doodle-relay.sociobot.in/demo>. It starts with a sample relay and does not save changes. See [`.factory/demo.md`](.factory/demo.md).

## Run locally

Requirements: Node 22+, npm, and Rust 1.88+.

```sh
npm install
npm run dev
```

Open <http://localhost:5173>. Vite proxies room and WebSocket traffic to the Rust service on port 8080.

## Test and build

```sh
npm test
npm run build      # browser files land in dist/
cargo build
```

The claim tests are listed in [`.factory/claims.json`](.factory/claims.json). `npm test -- --grep @claim:` runs only those browser checks.

## Run the production container

```sh
docker build --build-arg BUILD_SHA=local -t family-doodle-relay .
docker run --rm -p 8080:8080 -e PORT=8080 family-doodle-relay
```

The container needs no other environment variables. `GET /health` returns the build SHA. Room data uses process memory and disappears on restart.

## Architecture and privacy

The browser app uses Vite and TypeScript. Rust, Axum, and an in-memory SQLite connection serve the app. Live room state stays in process memory. Private room codes contain about 60 bits of randomness. Every non-health route is rate limited by the first `X-Forwarded-For` address.

Browser storage holds private room keys and an optional purchase license. The server does not ask for names, ages, email addresses, or profiles. See `/privacy` and `/terms`.

## Deploy

The factory builds the root `Dockerfile` and supplies `PORT` plus `BUILD_SHA`. DNS, billing product registration, and infrastructure stay outside this repository.

## License

[MIT](LICENSE)
