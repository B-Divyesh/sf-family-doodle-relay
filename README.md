# Family Doodle Relay

Draw and guess together in a private two-person room.

Family Doodle Relay is for a child and one trusted adult playing from different places. It gives them four 45-second turns to draw, guess, and add one detail. The final relay downloads as a PNG image.

There are no public rooms, profiles, ads, or open chat. A room allows two players and closes within four hours. The free game includes four turns and PNG download. The $6 family edition is a one-time purchase for eight-turn rooms; it uses Sociobot checkout and license verification.

## Try the sandbox

Open `/?demo=1` or <https://family-doodle-relay.sociobot.in/?demo=1>. It starts with a sample relay and does not save changes. `/demo` is an equivalent direct route. See [`.factory/demo.md`](.factory/demo.md).

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
npm run lint
npm run test:deployment
```

The claim tests are listed in [`.factory/claims.json`](.factory/claims.json). `npm test -- --grep @claim:` runs only those browser checks.

## Run the production container

```sh
docker build --build-arg BUILD_SHA=local -t family-doodle-relay .
docker run --rm -p 8080:8080 -e PORT=8080 family-doodle-relay
```

`GET /health` returns the running build identity. Rooms are deleted at their four-hour expiry. The server allows 20 requests per second for each trusted client connection on every non-health route.

## Architecture and privacy

The browser app uses Vite and TypeScript. Rust, Axum, and a short-lived SQLite room store serve the app. Every non-health route is rate limited per client by the right-most address added by the factory ingress.

This browser keeps private room keys and an optional purchase license in its storage. The server does not ask for names, ages, email addresses, or profiles. See `/privacy` and `/terms`.

## Deploy

The factory builds the root `Dockerfile` and supplies `PORT` plus `BUILD_SHA`. Use `./scripts/deploy-container.sh` so the release waits for its single durable room owner and checks the live build identity. `FACTORY_SOCIOBOT_KEY` may be supplied to authenticate server-side license verification; it is optional and never embedded in the image. DNS, billing product registration, and infrastructure stay outside this repository.

## License

[MIT](LICENSE)
