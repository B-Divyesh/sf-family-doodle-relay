# Independent product verification 9 — FAIL

Verified 29 August 2026 from clean candidate
`4fdc1926db1f0cadd21d08dc507c761e12f365da` against
<https://family-doodle-relay.sociobot.in>.

## Verdict

**FAIL — do not release.** The candidate image is deployed as Azure Container
Apps revision `sf-family-doodle-relay--0000033`, but that revision is unhealthy
and crash-looping. It has no durable `/data` mount, permits three replicas, and
is not the latest ready revision. The public URL still reports prior build
`b2242b83c02279609f631511f9dea036e5dfb1af`, not the candidate SHA.

The candidate's product behavior otherwise passes the full local suite and the
served frontend assets are byte-identical to the candidate. That equivalence
does not satisfy the backend build-identity and deployment-topology contract.

## First-read and demo gate — PASS

A cold 1440×900 and 390×844 visit answered all three required questions above
the fold:

- What it does: “Draw together from two places.”
- Who it serves: “For a child and trusted adult who want a calm game between
  calls.”
- What to click: “Try it with sample data.” The adjacent text says that a
  sample relay opens and nothing is saved.

One keyboard-activated click opened `/?demo=1` with a populated turn-three
relay. The persistent banner says “Demo — sample data, nothing is saved” and
offers **Reset demo** and **Start for real**. Evidence:
`.factory/qa-9/first-read-desktop.png` and
`.factory/qa-9/first-read-mobile-390.png`.

## Claims gate — PASS after dependency installation

`.factory/claims.json` exists and contains 15 entries. The first literal run
from the dependency-free clone stopped at `vite: not found`. After the required
`npm ci`, every exact command from the manifest was run independently and
passed:

| Claim | Result |
| --- | --- |
| `demo-sandbox` | PASS — seeded demo changed no real storage and made no API or third-party request |
| `privacy-defaults` | PASS — no account, discovery, ads, tracking, or open-chat surface |
| `browser-storage` | PASS — room key and license fixture remained in local storage only |
| `png-export` | PASS — finished relay produced a PNG containing all shown entries |
| `download-local` | PASS — finishing and downloading remained same-origin |
| `two-person-limit` | PASS — third join returned 409 |
| `room-expiry` | PASS — four-hour boundary and deletion regression passed |
| `one-time-price` | PASS — $6 once, no subscription, Sociobot checkout href |
| `family-edition` | PASS — forged paid input remained four turns |
| `live-relay` | PASS — two browsers completed four synchronized turns |
| `free-core` | PASS — four turns and PNG completed without checkout |
| `host-end-room` | PASS — both players received the ended-room recovery state |
| `rate-limit` | PASS — exactly 20 requests passed; excess returned 429 with `Retry-After` |
| `health-build` | PASS locally — candidate binary reported a nonempty exact build identity |
| `deployment-topology` | PASS on fixtures; FAIL when independently applied to the real deployment |

Landing-page and README claims map to this inventory. The checked-in copy audit
has no sentence over 22 words and no banned wording.

## Defects by severity

### V9-01 — Critical — candidate revision is crash-looping and production serves the prior build

Fresh Azure and HTTP evidence:

- Candidate image:
  `sociobotregistry.azurecr.io/sf-family-doodle-relay:4fdc1926db1f`.
- Candidate revision: `sf-family-doodle-relay--0000033`, `Unhealthy`, one
  not-ready replica in `CrashLoopBackOff`, restart count 13.
- Candidate log: “refusing to start in Azure Container Apps without the
  durable /data volume”.
- App template: `minReplicas: 1`, `maxReplicas: 3`, no volumes, and no volume
  mounts.
- Latest ready revision: `sf-family-doodle-relay--0000032`, running image
  `b2242b83c022`, healthy with one ready replica.
- Both revisions remain active; the revision-ownership validator therefore
  reports two active revisions instead of one.
- Live `GET /health` returns
  `b2242b83c02279609f631511f9dea036e5dfb1af`.
- The real app template fails `scripts/deployment-contract.mjs` for maximum
  replicas, missing `/data`, missing Azure Files storage and ownership modes,
  and latest revision not ready.

This is the same failure class reported previously, reproduced from fresh
state after the repair handoff had claimed success.

### V9-02 — Major — a billing-verifier outage blocks free play for a recent paid user

Against the exact candidate release binary, the test seeded the documented
license key and a fresh valid cached verdict, then made the configured Sociobot
verify endpoint unreachable. Clicking **Make a private room** sent the cached
license; `/api/rooms` returned 503 and the UI stayed on `/play` with “The room
could not be made.” There is no in-product action to remove the license or retry
as a free four-turn room. Manually deleting both license local-storage keys made
the next request return 201 immediately.

This violates the paid-unlock requirement that verification must never block
the free experience. A failed upstream recheck should fall back to a free
four-turn room, with a quiet notice that paid features could not be checked.

### V9-03 — Major — purchase terms omit required merchant and refund information

`/terms` states the price and that payment opens on Sociobot, but it does not
state that Sociobot/Dodo is the merchant of record or that refunds are handled
there. Those disclosures are mandatory for the one-time paid unlock contract.

### V9-04 — Medium — privacy page omits the license-verification recipient

The default and demo flows make no third-party requests. Restoring a license,
however, sends the entered token to
`https://api.sociobot.in/api/v1/products/family-doodle-relay/verify`. The privacy
page describes local license storage but does not disclose this recipient or
purpose under “Who receives data.” The observed invalid-token request returned
an inactive verdict and stored only the token and cached verdict locally.

## Build and repository gates

- Checkout identity: exact candidate `4fdc1926…`; `origin/main` matched before
  this report.
- `npm ci`: PASS — 48 packages, 0 vulnerabilities.
- `npm test`: PASS — Vite production build, TypeScript, 7 Rust tests, 6
  deployment tests, and 20 Chromium tests.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS — rustfmt and clippy with warnings denied.
- `npm run build`: PASS; `dist/` produced.
- `cargo build --release`: PASS.
- `npm audit --audit-level=high`: PASS — 0 vulnerabilities.
- `BUILD_SHA=4fdc1926… cargo build --release`: PASS. A PORT-only local boot
  returned the exact SHA and shut down gracefully.
- Docker CLI was unavailable. The candidate image is nevertheless present in
  ACR and starts far enough in revision `0000033` to emit its intentional
  missing-mount panic.

Production bundle output is 25,917 B JavaScript (9.13 KB gzip) and 9,673 B CSS
(2.89 KB gzip). The desktop AVIF hero is 143,503 B and the mobile AVIF is
64,223 B. Live JS and CSS SHA-256 hashes exactly match `dist/`.

## End-to-end, boundary, and backend evidence

- A desktop host created a room through the UI, copied its private invite, and
  a fresh 390 px browser opened the deep link with the 12-character code
  prefilled and joined. Both showed “Both players are here,” with no errors.
- A separate live desktop/390 px pair completed all four alternating turns and
  downloaded a valid 1200×728 PNG with two drawings and two guesses.
- Blank guesses were rejected and focus returned to the input. An unbroken
  80-character guess was preserved and rendered without normal-width mobile
  overflow.
- A three-character invite produced an announced format error and recovered
  with a valid code. A third participant received 409 and a specific recovery
  message.
- Host termination removed the room. Both participants received the recovery
  screen and a direct room read returned 404.
- Malformed JSON returned 400, a wrong JSON shape returned 422, and missing
  `Content-Type` returned 415.
- Ten concurrent room creates all returned 201 with ten unique codes. Two
  simultaneous joins returned exactly one 200 and one 409. Eight independent
  reads of one room all returned 200.
- A 100-request concurrent health smoke completed in 426 ms with 100 HTTP 200
  responses.
- A forged client `paid: true` value produced only a four-turn room.
- Sign-in/Entra checks do not apply because the product intentionally has no
  accounts.

## Rate limiting

- Product API: 55-request same-client burst produced 20×404 and 35×429;
  `Retry-After: 1`.
- Product pages: 55-request same-client burst produced 20×200 and 35×429;
  `Retry-After: 1`.
- WebSocket route: 30-request same-client handshake burst produced 20×400 and
  10×429; `Retry-After: 1`.
- Health is intentionally exempt: 100 concurrent requests all returned 200.
- Sociobot product-license verify endpoint: observed allowance 30 requests per
  burst; the next 10 returned 429 with `Retry-After: 4`.

Spoofed left-most `X-Forwarded-For` values did not change the product's trusted
right-most client bucket.

## Privacy, accessibility, PWA, and headers

- Cold load made four same-origin requests: HTML, hashed JS, hashed CSS, and
  the hero image. It set no cookies or browser storage.
- Demo drawing, finish, reset, and PNG download made no API, WebSocket, or
  off-origin request and left local/session storage empty.
- `/`, `/demo`, `/play`, `/privacy`, `/terms`, and a real 404 had zero Axe
  violations at desktop and 390 px mobile. All had `lang=en`, one `<h1>`, one
  `<main>`, route-specific titles, image alternatives, and no application
  console or page errors. `/opt/fleet/lib/verify-url.sh` passed in 602 ms;
  report: `.factory/qa-9/verify.json`.
- Mobile routes had no normal-width horizontal overflow; all visible controls
  were at least 44×44 px. The focus ring was a visible 4 px press-red outline.
  At forced 200% page zoom, content remained available by horizontal panning.
- Reduced-motion emulation reduced both UI animations to 0.00001 s and set
  scroll behavior to `auto`.
- Service-worker `update()` left one activated worker with no waiting or
  installing worker. `/demo` then reloaded offline with its populated sample
  and persistent demo banner.
- HTML and API responses include CSP with `frame-ancestors 'none'`, nosniff,
  no-referrer, and disabled camera/microphone/geolocation. HTTP redirects to
  HTTPS. HTML and `sw.js` use `no-cache`; hashed assets use one-year immutable
  caching and returned 304 for a conditional request; images use one-day
  caching.

## Performance

Fresh throttled mobile Lighthouse produced a complete report before the worker
Chromium process crashed during final screenshot handling: Performance 99,
Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.4 s, TBT
120 ms, CLS 0, total transfer 100 KiB, and no run warnings. Evidence:
`.factory/qa-9/lighthouse-mobile-noscreenshots.json`.

## Required release work

1. Deploy candidate `4fdc1926…` through `scripts/deploy-container.sh` or apply
   its exact durable template atomically: one replica, one active ready
   revision, and `family-doodle-relay-data` mounted at `/data` with
   `uid=10001,gid=10001,file_mode=0770,dir_mode=0770`.
2. Make license-verifier failure fall back to a free four-turn room and expose
   a normal way to remove or retry a stored license.
3. Add merchant-of-record/refund wording to `/terms` and explain license-token
   verification in `/privacy`.
4. Rerun live build identity, topology, paid-outage, claims, and end-to-end
   checks before release.

No product code was modified during this verification.
