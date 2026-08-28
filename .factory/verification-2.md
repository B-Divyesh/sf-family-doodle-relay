# Independent product verification 2 — FAIL

Verified 28 August 2026 against candidate `efb80af5de3a9d91e9bdc8f4f766f2872ab57e3b` and `https://family-doodle-relay.sociobot.in`.

## Verdict

**FAIL — do not release.** The required `live-relay` claim test fails, ordinary typing is erased during live turns, and live room state is still split across isolated serving instances. The paid checkout is also dead, and the live rate limiter is not keyed to the real client through the ingress.

The live `/health` response reports the exact candidate SHA. Local and live `index.html`, JavaScript, CSS, and service-worker hashes match, so this result is not a deployment-lag false negative.

## Mandatory first checks

### Claims gate

`.factory/claims.json` exists with nine entries. The first invocation from the untouched clone stopped at `vite: not found`, as dependencies were not installed. After `npm ci`, every exact `test` command was run independently before broader QA.

| Claim | Result | Evidence |
|---|---|---|
| `demo-sandbox` | PASS | Exact command exited 0; sample stayed in memory and same-origin. |
| `privacy-defaults` | PASS | Exact command exited 0; no cookie or off-origin demo request. |
| `png-export` | PASS in its test, but test coverage is incomplete | The test checks the download name and page DOM, not the downloaded PNG pixels/content. See V2-05. |
| `two-person-limit` | PASS locally | Exact command exited 0. Live multi-instance routing breaks consistent room lookup; see V2-01. |
| `room-expiry` | PASS | Exact command exited 0; Rust regression deletes at the expiry boundary. |
| `one-time-price` | PASS in its test, but purchase is unavailable | Copy and URL are asserted; the live URL is 404. See V2-03. |
| `family-edition` | PASS in its test, but test coverage is incomplete | It rejects `paid:true` but never proves that a valid license creates eight turns. See V2-05. |
| `live-relay` | **FAIL** | Timed out waiting for “Your relay is finished.” Reproduced in the full suite and in 2 of 3 repeat runs. See V2-02. |
| `rate-limit` | PASS locally, FAIL live | Local test observes a 429. Live ingress does not enforce one client bucket. See V2-04. |

The required full `npm test` run also failed: 9 Playwright tests passed and `@claim:live-relay` failed. A failing claim test is release-blocking under the acceptance contract.

### Cold first read

The first screen passes.

- What it does: “Draw together from two places.”
- For whom: “For a child and trusted adult who want a calm game between calls.”
- What to click: “Try it with sample data.”
- One click opens `/demo`, shows “Demo — sample data, nothing is saved,” and immediately displays “Add one surprising detail.”
- The same viewport states the two-person limit, four-hour room life, and `$6 once, no subscription`.

## Release-blocking defects

### V2-01 — Critical — live room state is split across isolated instances

Three fresh rooms were created on the live deployment. For every room, 12 authenticated reads produced exactly four `200` responses and eight `404` responses, repeating `404, 404, 200`. Two simultaneous joins to another fresh room returned `200` and `404`; a correct shared store would return `200` and `409`.

The backend writes SQLite to container-local `/data`. The README says serving processes see the same relay, but fresh live evidence shows that traffic rotates across three isolated stores. Creating, joining, reconnecting, or ending a room is therefore unreliable. This is also an unlisted and false README claim under the claims contract.

### V2-02 — Critical — live refreshes erase guesses and make the core relay flaky

Every WebSocket state message calls `update()` and replaces all of `#room-body` every 400 ms. This destroys and recreates the active form. On the deployed product:

- a guest guess was present immediately after filling, then became empty after 700 ms;
- the final host guess did the same;
- clicking after the reset left the session on “Write your guess”;
- the empty-input recovery message was itself replaced by the next state update;
- an immediate refill-and-click could finish, which explains the timing-dependent pass/fail behavior.

The retained Playwright trace shows “A home riding a wave” after `fill`, followed by a newly rendered empty textbox before the click. The exact claim failed twice in normal isolated runs; a three-repeat run produced two failures and one pass.

This makes a normal human typing pace fail the core four-turn job. Replacing the canvas on the same interval also risks interrupting a long pointer stroke and drops keyboard focus.

### V2-03 — High — the advertised paid edition cannot be bought

The visible “Buy the family edition” link points to the required Sociobot URL, but a fresh request returned:

```text
HTTP 404
{"error":"enabled factory product","status":404}
```

The page advertises `$6 once` and eight-turn rooms, but checkout is unavailable.

### V2-04 — High — live rate limiting is not enforced per real client

The source keys limits from the backend TCP peer and ignores `X-Forwarded-For`, contrary to the mandatory ingress contract. The live results from one client were:

- 30 concurrent API requests: 30 `404`, no `429`;
- 100 concurrent API requests: 40 `404`, then 60 `429`; `Retry-After: 1`;
- 400 concurrent `/privacy` requests: 400 `200`, no `429`.

The source allowances are 20 requests per second for API/WebSocket handshakes and 120 for pages, but the observed live API allowance was 40 and the page allowance was greater than 400. Proxy-side buckets are being mistaken for client buckets. Unrelated users can share a bucket, while one caller can spread across buckets.

The separate Sociobot license-verification endpoint did enforce its own allowance: a 60-request burst returned 30 `200` and 30 `429`, with `Retry-After: 4`.

### V2-05 — High — two claim tests do not prove their promises

- `family-edition` proves only that a forged Boolean does not enable eight turns. It has no recorded valid-license fixture and never exercises a positive verified-license request.
- `png-export` checks the page's canvases/text and the filename, but does not inspect the downloaded PNG to prove that every relay entry is actually present.

The claims contract requires observable outcomes to be asserted, not nearby UI or implementation proxies.

## Other defects

### V2-06 — Medium — several mobile targets are below 44×44 px

At 390 px, the header Demo link is `37.4×44` px. “Read purchase terms,” “Use an invite code instead,” and email links are 19 px high. Static 404 header/footer links are 21–22 px high. These miss the attached touch-target baseline.

### V2-07 — Medium — service-worker offline reload depends on the HTTP cache

The service worker updates successfully and `/demo` reloads offline while the browser HTTP cache is intact. Its `relay-shell-v1` cache contains `/`, `/demo`, the mobile hero, and favicon, but not the built JavaScript or CSS. After clearing only the browser HTTP cache and going offline, `/demo` reloads to an empty body with no H1. The application shell is therefore not actually precached.

### V2-08 — Low — Rust formatting check fails

`cargo fmt -- --check` reports formatting differences throughout `src/main.rs`. Type checking and clippy still pass.

### V2-09 — Low — the static 404 omits the standard site skeleton

The real HTTP 404 has a wordmark but no main navigation, “Built by Param Factory” link, version/build identity, canonical, description, or social metadata. Its header/footer links also account for several undersized targets.

## What passed

- Candidate/deploy identity: live health reports `efb80af5de3a9d91e9bdc8f4f766f2872ab57e3b`. Local/live SHA-256 values match for HTML, JS, CSS, and `sw.js`.
- Clean install: `npm ci` installed 47 packages and reported zero vulnerabilities.
- Frontend type check: `npm run typecheck` passed.
- Rust unit tests: 4/4 passed.
- Rust lint: `cargo clippy --all-targets -- -D warnings` passed.
- Production builds: `npm run build` produced `dist/`; `BUILD_SHA=efb80af… cargo build --release` passed.
- Dependency audit: `npm audit --audit-level=high` reported zero vulnerabilities.
- Runtime contract: the release binary started with only `PORT`, logged generated `/data` configuration, returned the exact build SHA, created a room, shut down gracefully, and retained the room after restart.
- Host safety locally: after host confirmation, the guest saw “The host ended this room” and authenticated HTTP access returned `404`.
- Validation: malformed JSON and wrong field types returned `422`; unknown rooms returned `404`; a sequential third join returned `409`.
- Privacy: the full demo flow requested only the same-origin document, JS, and CSS; it set no cookie, local storage, or session storage. No analytics, third-party font, or third-party script request appeared.
- Security headers: CSP, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` are present on browser responses.
- Caching: hashed JS/CSS use `public, max-age=31536000, immutable`; HTML and `sw.js` use `no-cache`.
- Accessibility automation: `/`, `/demo`, `/play`, `/privacy`, `/terms`, and the 404 experience have no axe serious/critical findings. Valid routes have one H1, `lang=en`, one main landmark, labelled controls, and no missing image alt.
- Keyboard: the demo drawing can be reached by Tab, “Add a sample mark” works with Space, the visible focus outline is 4 px press-red, and the relay can be finished with Enter. The live refresh defect still breaks keyboard focus during real turns.
- Responsive/motion: desktop and 390 px layouts have no horizontal overflow. Reduced-motion emulation changes animations to `0.01 ms` and smooth scrolling to `auto`.
- Performance: fresh mobile Lighthouse scores were Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.5 s, TBT 10 ms, CLS 0, Speed Index 1.1 s.
- Budgets: JS is 25,639 B raw / 9,158 B gzip; CSS is 9,343 B raw / 2,869 B gzip; the mobile hero is 64,223 B; Lighthouse transfer total is 101,498 B.
- Metadata/assets: the social image is 1200×630, the touch icon is 180×180, and robots/sitemap endpoints return 200.
- Visual review: the monochrome broadsheet identity is distinctive, consistent with `.factory/design.md`, readable, and visually stable at desktop and phone widths.
- Sign-in/Entra: not applicable; the product intentionally has no accounts.
- AI leverage: not applicable to this cooperative drawing loop.

## Commands and scope

```sh
npm ci
# every exact .factory/claims.json test command, one by one
npm test
npm run typecheck
cargo fmt -- --check
cargo clippy --all-targets -- -D warnings
BUILD_SHA=efb80af5de3a9d91e9bdc8f4f766f2872ab57e3b cargo build --release
npm audit --audit-level=high
VERIFY_NODE_MODULES=/work/repo/node_modules /opt/fleet/lib/verify-url.sh https://family-doodle-relay.sociobot.in <temp-dir>
npx lighthouse@12.8.2 ...
```

Playwright 1.58.2 was used for cold first-read, desktop/mobile, request logging, headers, axe, keyboard, reduced motion, service worker, live two-context relay, invalid input, and concurrency checks.

No Docker, Podman, or Buildah executable is installed in this worker, so the Dockerfile could not be executed. Its frontend and backend build stages were run independently, and the runtime binary contract was exercised directly.

## Required release fixes

1. Use a genuinely shared TTL store across live replicas, or prove a deployment configuration that routes every request and both WebSockets for a room to one durable owner.
2. Stop replacing the active turn DOM on every state poll. Preserve input, selection, focus, pointer capture, validation messages, and in-progress strokes; rerun the relay claim repeatedly at human typing speed.
3. Register/enable the Sociobot product and verify the complete hosted checkout, return token, restore, and eight-turn creation path.
4. Key live limits from a trusted ingress-supplied client identity and verify exact API and page allowances from one external client.
5. Make claim tests inspect the PNG content and exercise a recorded successful license-verification fixture.
6. Precache the versioned built shell, bring every phone target to at least 44×44 px, run rustfmt, and align the static 404 with the standard skeleton.
