# Independent product verification 12 — FAIL

Verified 30 August 2026 against
<https://family-doodle-relay.sociobot.in> from the clean work-order checkout.

- Requested candidate: `8de1fb7dcf1930585f27967ac544462a987f81de`
- Checkout and `origin/main`: `8de1fb9376990e5e204cc32c0d6c1c016ab06b40`
- Live `/health`: `8de1fb9376990e5e204cc32c0d6c1c016ab06b40`
- Work order: `family-doodle-relay-verify-12`

## Verdict

**FAIL — do not release.** The exact requested candidate cannot be verified:
it is absent from the clone and the Git remote rejects a direct fetch with
`not our ref`. The work-order checkout uses a different SHA.

The checkout build also has a fresh deployment-blocking failure. Azure's
latest revision `sf-family-doodle-relay--0000041` has no `/data` volume,
allows three replicas, is `Unhealthy` / `ActivationFailed`, and is assigned
100% traffic. Its process has restarted ten times and panics with
`refusing to start in Azure Container Apps without the durable /data volume`.
The older mounted revision `0000040` remains active and serves the public
site despite a configured traffic weight of zero.

This is not a failure of the product's core flow. Local gates and live
behavioral checks pass against checkout SHA `8de1fb9376…`; the release fails
because source identity and the real backend deployment do not meet the
acceptance contract.

## Mandatory first read — PASS

A cold 1440×900 browser context showed, in the first viewport:

- What: **“Draw together from two places.”**
- For whom: **“For a child and trusted adult who want a calm game between
  calls.”**
- What to click: **“Try it with sample data.”**
- What happens next: **“A sample relay opens next. Nothing is saved.”**

The primary action opened `/?demo=1` in one click. The populated relay showed
the persistent **“Demo — sample data, nothing is saved”** banner with
**Reset demo** and **Start for real**.

## Required claims gate — PASS locally

`.factory/claims.json` exists with 15 entries. After `npm ci` installed the
locked 48 packages, every literal `test` command was run individually before
the broader audit. All returned exit 0:

| Claim | Result |
| --- | --- |
| `demo-sandbox`, `privacy-defaults`, `browser-storage` | PASS |
| `png-export`, `download-local` | PASS |
| `two-person-limit`, `room-expiry` | PASS |
| `one-time-price`, `family-edition` | PASS |
| `live-relay`, `free-core`, `host-end-room` | PASS |
| `rate-limit`, `health-build`, `deployment-topology` | PASS against their local sandboxes |

The local deployment-topology fixture does not prove the live Azure state.
The repository's validator rejects the live template and revisions as
recorded below.

Landing, legal, room, result, README, and demo claims were cross-checked
against the manifest. No material unlisted product claim was found.

## Clean checkout gates — PASS

- `npm test`: PASS in 54.6 seconds — production Vite build, TypeScript, 7
  Rust tests, 9 deployment-contract tests, and 22 Chromium tests.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS — Rust format plus Clippy with warnings denied.
- `npm run build`: PASS; `dist/` produced.
- `cargo build --release`: PASS in 4m44s.
- `npm audit --audit-level=high`: PASS, 0 vulnerabilities.
- `bash -n scripts/deploy-container.sh` and `git diff --check`: PASS.
- Production assets: 27,033 B JavaScript (9.44 kB gzip) and 9,953 B CSS
  (2.94 kB gzip). The largest mobile hero is 94,842 B WebP / 64,223 B AVIF.
- Docker is not installed in this worker. The optimized binary was instead
  started with an empty environment: it listened on default port 8080,
  generated its SQLite store, served `/health` and a 201 room creation,
  emitted the required configuration log, and shut down gracefully.
- This is a web-with-backend product, so library/CLI pack installation does
  not apply. Sign-in does not apply because the product intentionally has no
  accounts.

## Independent live product checks — PASS

Evidence is in [`.factory/qa-12/`](qa-12/).

### End-to-end job and recovery

- A desktop host created a room through the UI (201); a 390 px guest first
  entered `abc`, received the specific invite-code error with
  `aria-invalid=true`, then recovered and joined (200).
- Both clients showed presence. The timer began at `00:44`, consistent with a
  45-second turn.
- A pointer-drawn first turn, blank-guess recovery, an 80-character boundary
  guess, mobile detail turn, and final host guess completed all four turns.
  Input and focus survived WebSocket updates.
- Both clients reached **“Your relay is finished.”** The result contained two
  drawing canvases and both guesses. Download produced
  `family-doodle-relay.png`, 1200×728.
- A separate room kept both players present after guest reload. Host-controlled
  ending propagated to the guest with a clear recovery action, and the ended
  room then returned 404.
- Three additional rooms each returned 201, survived six simultaneous reads,
  and accepted one guest. Eight concurrent reads of another room all returned
  200.

### Boundary and authorization checks

- Malformed JSON: 422 with a deserialization explanation.
- Unknown 12-character room: 404 with a recovery message.
- Third player: 409, “This room already has two players.”
- Forged `{paid:true}`: room remained four turns.
- Fresh room lifetime: 14,399 seconds, within the four-hour contract.
- Demo reset and exit preserved seeded real local/session/cookie sentinels
  byte-for-byte.

### Accessibility, responsive behavior, and errors

- `/opt/fleet/lib/verify-url.sh` passed in 573 ms with title, `lang=en`, one
  `<h1>`, one `<main>`, complete image alternatives, labelled buttons, and no
  console/page errors.
- Playwright Axe found no serious or critical finding on `/`, `/demo`,
  `/play`, `/privacy`, `/terms`, the designed HTTP 404, or the 390 px demo.
- Every scanned route has its own title, one h1, one main, `lang=en`, and no
  image missing `alt`.
- Keyboard-only use completed the demo and PNG download. The primary focus
  ring is 4 px press red with a 3 px offset. Route load focuses the h1;
  backward navigation reaches the visible skip link and header, while forward
  navigation reaches the primary task controls.
- At 390 px there is no base-layout horizontal overflow and no visible target
  below 44×44 px. Reduced-motion animations resolve to `0.00001s` and scroll
  behavior is `auto`.
- Synthetic 200% page zoom preserves all visible content and controls. It
  introduces horizontal panning (640 px content in a 390 px viewport) but no
  observed content loss.
- Browser console/page error capture stayed empty throughout route, demo,
  mobile, offline, and two-player flows.

### Privacy, headers, PWA, and performance

- The complete live demo request log contains only the product origin and no
  room API call. Demo local storage, session storage, and cookies were
  unchanged; the PNG is generated locally.
- Service-worker update showed one activated worker with none waiting or
  installing. After clearing browser cache and disabling the network, the
  controlled demo reloaded with its sample state.
- Browser response headers use `no-cache` for HTML, health, API, service
  worker, and 404 responses; hashed JS/CSS use one-year immutable caching.
- CSP contains header-only `frame-ancestors 'none'` and limits connections to
  self/WebSockets plus the Sociobot license API. Responses also set
  `nosniff`, `no-referrer`, and disable camera, microphone, and geolocation.
- All internal landing links returned their expected 200 status. The designed
  missing page returned 404.
- Live JS, CSS, and `index.html` are byte-for-byte equal to the checkout's
  `dist/` output.
- Mobile Lighthouse: 100 Performance, 100 Accessibility, 100 Best Practices,
  100 SEO; FCP 1.08 s, LCP 1.38 s, TBT 30 ms, CLS 0, transfer 103,915 B, and
  no run warnings.

### Rate limits — PASS

Fresh concurrent probes observed the documented allowances:

| Endpoint bucket | Normal responses | 429 responses | `Retry-After` |
| --- | ---: | ---: | ---: |
| Product API | 20 | 35 | 1 second |
| Product pages | 20 | 35 | 1 second |
| Sociobot product-license verifier | 30 | 10 | 4 seconds |

Health remained exempt as documented. Spoofed left-hand
`X-Forwarded-For` prefixes did not create new product buckets.

## Live build and deployment evidence — FAIL

### Source identity

`git rev-parse HEAD` and `git ls-remote origin refs/heads/main` both resolve
to `8de1fb9376990e5e204cc32c0d6c1c016ab06b40`. The requested
`8de1fb7dcf1930585f27967ac544462a987f81de` is not in the clone, is not
advertised by the remote, and direct fetch fails:

```text
fatal: remote error: upload-pack: not our ref 8de1fb7dcf1930585f27967ac544462a987f81de
```

Live `/health`, six repeated health requests, the image tag, and byte-equal
frontend assets all identify `8de1fb9376990e5e204cc32c0d6c1c016ab06b40`,
not the requested SHA.

### Azure topology

Fresh read-only Azure inspection found:

- App template image:
  `sociobotregistry.azurecr.io/sf-family-doodle-relay:8de1fb937699`.
- Latest revision: `sf-family-doodle-relay--0000041`; latest ready revision:
  `sf-family-doodle-relay--0000040`.
- `0000041`: active, 100% traffic, one not-ready replica, 10 restarts,
  `Unhealthy`, `ActivationFailed`, `minReplicas: 1`, `maxReplicas: 3`, no
  volumes, and no volume mounts.
- `0000040`: also active, configured 0% traffic, healthy and running, exactly
  one replica, with `family-doodle-relay-data` mounted at `/data` and all
  required uid/gid/mode options.
- Candidate process log: `thread 'main' panicked ... refusing to start in
  Azure Container Apps without the durable /data volume`.

The repository deployment validator fails the real app template for maximum
replicas, absent mount/storage/mount options, and latest revision not ready.
The ownership validator fails because two revisions are active and the
configured active owner is neither healthy nor running.

## Defects by severity

### V12-01 — Critical — latest production revision is activation-failed without durable room storage

The real deployment bypassed the repository's required atomic deployment
path. Its latest 100%-traffic revision cannot start, has no persistent room
store, and permits three owners. Azure is falling back to another active
revision. This violates the single-owner, durable persistence, ready revision,
and backend deployment contracts. A future fallback or scale event can split
or lose private room state.

### V12-02 — Critical release-process blocker — requested candidate SHA does not exist

The exact candidate named by the verification request cannot be obtained or
matched to the live deployment. The available checkout and live build use a
different SHA. Acceptance cannot be attached to an unavailable source object.

## Required release work

1. Resolve the candidate identity and provide a fetchable exact commit.
2. Deploy that exact commit only through `scripts/deploy-container.sh` or an
   equivalent atomic template application.
3. Confirm exactly one active, healthy, ready revision at 100% traffic;
   `minReplicas=maxReplicas=1`; the named Azure Files volume mounted at
   `/data` with all required options; and `/health` returning the exact full
   candidate SHA.
4. Re-run the live template/ownership validators, claim gate, two-browser
   relay, persistence probe, and rate-limit probe.

No product code was modified during this verification. Only verifier reports,
scripts, and evidence were added.
