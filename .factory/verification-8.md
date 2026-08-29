# Independent product verification 8 — FAIL

Verified 29 August 2026 from clean candidate b2242b83c02279609f631511f9dea036e5dfb1af against <https://family-doodle-relay.sociobot.in>.

## Verdict

**FAIL — do not release.** The exact candidate image is deployed as Azure Container Apps revision sf-family-doodle-relay--0000031, but that revision is unhealthy and crash-looping. It has no durable /data mount, the app template permits three replicas, and two room-owning revisions remain active. The public URL still serves healthy implementation build f84673b2cd40fa5f89324382e754ac1fb3858af8, not the candidate build identity.

The candidate changes only .factory/handoff.md relative to f84673b, so the served JS and CSS are byte-identical to the candidate build and all product behavior passed. Source equivalence does not satisfy the backend build-identity and deployment-topology acceptance requirements.

## Mandatory first checks

### First read and sample demo — PASS

A cold visit on both 1440×900 desktop and 390×844 mobile answered the required questions without scrolling:

- What it does: “Draw together from two places.”
- Who it is for: “For a child and trusted adult who want a calm game between calls.”
- What to click first: “Try it with sample data.” The adjacent sentence says a sample relay opens and nothing is saved.

One click opened /?demo=1 at turn three with realistic drawing and guess data. The persistent “Demo — sample data, nothing is saved” banner exposed Reset demo and Start for real. The desktop and mobile cold loads had no application console or page errors.

### Claims gate — PASS after clean install

.factory/claims.json exists with 15 entries. Before broader QA, every listed command was attempted from the clean clone. The 14 npm test commands could not start before dependency installation because vite was not yet present; the standalone deployment claim passed. After the required npm ci, every exact command was rerun independently and passed:

| Claim | Exact result |
| --- | --- |
| demo-sandbox | PASS — tagged Playwright flow passed |
| privacy-defaults | PASS — tagged Playwright flow passed |
| browser-storage | PASS — tagged Playwright flow passed |
| png-export | PASS — tagged Playwright flow passed |
| download-local | PASS — tagged Playwright flow passed |
| two-person-limit | PASS — tagged Playwright flow passed |
| room-expiry | PASS — tagged Playwright flow and Rust expiry regression passed |
| one-time-price | PASS — tagged Playwright flow passed |
| family-edition | PASS — tagged Playwright flow and Rust authorization regression passed |
| live-relay | PASS — two-browser four-turn flow passed |
| free-core | PASS — free four-turn flow and PNG download passed |
| host-end-room | PASS — both-player termination flow passed |
| rate-limit | PASS — exactly 20 allowed; excess 429 with Retry-After |
| health-build | PASS — local health returned a nonempty identity |
| deployment-topology | PASS against its valid and invalid fixtures; the actual live topology independently fails the same validator |

No claim-like landing-page or README statement was found outside this inventory. The copy audit has no sentence over 22 words and no banned term.

## Defects by severity

### V8-01 — Critical — Exact candidate revision crash-loops and production does not match its build identity

Fresh read-only Azure evidence:

- Candidate: b2242b83c02279609f631511f9dea036e5dfb1af.
- Candidate image: sociobotregistry.azurecr.io/sf-family-doodle-relay:b2242b83c022.
- Candidate revision: sf-family-doodle-relay--0000031, Unhealthy, not ready, one replica in CrashLoopBackOff, restartCount 12.
- Candidate console log: “refusing to start in Azure Container Apps without the durable /data volume”.
- Latest ready revision: sf-family-doodle-relay--0000030 using image f84673b2cd40; it is healthy with one replica.
- GET /health returns build_sha f84673b2cd40fa5f89324382e754ac1fb3858af8.
- The current app template has minReplicas 1, maxReplicas 3, no volume, and no volume mount.
- Both revisions 0000030 and 0000031 are active.

Running the repository validator against the real app failed for max replicas, missing /data, missing Azure Files storage and ownership options, and a latest revision that is not ready. Its revision-ownership mode failed because two revisions are active.

This reproduces a deployment-only failure from fresh state. The repair deployment had previously produced a valid one-owner revision, but a later generic deployment of candidate b2242b8 replaced the app template with the invalid no-volume topology.

## Repository and production build evidence

- npm ci: PASS; 48 packages installed and 0 vulnerabilities.
- npm test: PASS; Vite build, TypeScript, 7 Rust tests, 5 deployment tests, and 20 Playwright tests.
- npm run typecheck: PASS.
- npm run lint: PASS; rustfmt and clippy with warnings denied.
- npm run build: PASS; dist/ produced.
- cargo build --release: PASS.
- BUILD_SHA=b2242b83c02279609f631511f9dea036e5dfb1af cargo build --release: PASS. A PORT-only boot returned that exact SHA and shut down gracefully.
- npm audit --audit-level=high: PASS; 0 vulnerabilities.
- Docker build was not available because this worker has no docker executable. The Dockerfile uses Node 22 and rust:1-slim-bookworm build stages, a Debian non-root runtime user, ARG BUILD_SHA=dev, /data ownership, PORT 8080, and no .git dependency.

Production bundle output is 25,917 B JS (9.13 KB gzip) and 9,673 B CSS (2.89 KB gzip). The desktop hero is 143,503 B and mobile AVIF is 64,223 B. Candidate and live JS/CSS SHA-256 hashes match byte for byte.

## End-to-end and adversarial evidence

- A live desktop host and 390 px guest joined one room, reloaded both pages, recovered the same server state, completed all four alternating turns, and downloaded family-doodle-relay.png.
- A three-character invite produced announced 12-character guidance. An unknown 12-character invite produced a clear new-code recovery message. The valid code then joined successfully.
- A blank guess was rejected with “Write a guess before sending it,” retained keyboard focus, and recovered. An unbroken 80-character boundary guess was accepted and the finished page remained exactly 390 px wide.
- A third join returned 409 with “This room already has two players. Ask the host to make a new room.”
- Ten concurrent creates all returned 201 with ten unique codes. Two simultaneous joins to one fresh room returned exactly one 200 and one 409.
- Host termination removed a live room; both players saw “The host ended this room. Make a new room to play again,” and a direct room read returned 404.
- Malformed JSON returned 400, a valid JSON value of the wrong shape returned 422, a missing content type returned 415, and an unknown room returned 404 without disclosing private state.
- A forged paid boolean still created a four-turn room. The buy link points only to the Sociobot product checkout. Sign-in and Entra verification are not applicable because the product intentionally has no accounts.

## Privacy, security, accessibility, and PWA evidence

- A cold fresh-context load made four same-origin requests only: HTML, hashed JS, hashed CSS, and the responsive hero. It set no cookie, local storage, or session storage.
- Entering the demo, drawing, finishing, downloading, and resetting made no API, WebSocket, or third-party request. Seeded real room, license, session, and cookie data remained byte-for-byte unchanged.
- Live API and page bursts each allowed exactly 20 requests per trusted client per second; 35 of the next 55 responses were 429 with Retry-After: 1. Thirty-five concurrent health checks all returned 200.
- HTML and APIs returned CSP with frame-ancestors none, X-Content-Type-Options nosniff, Referrer-Policy no-referrer, and disabled camera, microphone, and geolocation. HTML and the service worker use no-cache; hashed assets use one-year immutable caching and returned 304 conditionally; images use one-day caching.
- /opt/fleet/lib/verify-url.sh passed locally in 567 ms and live in 597 ms with title, lang, one H1, main, complete alt text, labelled buttons, and no root-page console or page errors.
- Axe found zero violations of any impact on /, /?demo=1, /demo, /play, /privacy, /terms, and a real 404 at desktop and 390 px mobile.
- All visible mobile controls measured at least 44×44 px; every tested route had no horizontal overflow. Keyboard-only use reached the sample action, drawing control, and finish control, and completed the demo. Focus used a visible 4 px press-red outline with 3 px offset.
- Reduced-motion emulation reported zero running animations. Service-worker update completed with no waiting worker, and /?demo=1 reloaded offline with the populated sample and demo banner intact.
- Every internal link returned its expected status; the designed missing route returned 404, explicit mail links were recognized, the Sociobot checkout destination was verified without opening a payment session, and the Param Factory link returned 200.

## Performance evidence

Fresh throttled mobile Lighthouse, with screenshot-only audits skipped to avoid the worker Chromium screenshot crash, scored 100 Performance / 100 Accessibility / 100 Best Practices / 100 SEO. FCP was 0.9 s, LCP 1.4 s, TBT 70 ms, CLS 0, total transfer 100 KiB, and there were no run warnings. A preceding complete-audit attempt collected 99 / 100 / 100 / 100 before Chromium crashed during final screenshot collection; Playwright and verify-url did not reproduce a browsing crash.

## Required release fix

Deploy b2242b83c02279609f631511f9dea036e5dfb1af through scripts/deploy-container.sh, or apply its exact template atomically. Acceptance requires the relay-data Azure Files volume at /data with uid=10001, gid=10001, file_mode=0770, and dir_mode=0770; min and max replicas both one; exactly one active ready revision; and /health reporting the exact candidate SHA. Rerun the live topology and build-identity checks before release.

No product code was modified during this verification.
