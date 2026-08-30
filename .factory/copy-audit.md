# Landing page copy audit

Audited 30 August 2026. Counts use whitespace-separated words. The table includes headings, controls, labels, and visible sentences.

| Copy | Words | Result |
|---|---:|---|
| Family Doodle Relay | 3 | Pass |
| Demo | 1 | Pass |
| How it works | 3 | Pass |
| Privacy | 1 | Pass |
| Draw together from two places | 5 | Pass |
| For a child and one trusted adult who want a calm game between calls. | 13 | Pass |
| Try it with sample data | 5 | Pass |
| Make a private room | 4 | Pass |
| A sample relay opens next. | 5 | Pass |
| Nothing is saved. | 3 | Pass |
| Two people only | 3 | Pass |
| Rooms close within four hours | 5 | Pass |
| $6 once, no subscription | 4 | Pass |
| A shared drawing moves between two people. | 7 | Pass |
| Have an invite code? | 4 | Pass |
| Join the room | 3 | Pass |
| Sample relay | 2 | Pass |
| The timer keeps each turn short. | 6 | Pass |
| The finished strip keeps every surprising turn together. | 8 | Pass |
| Sample relay · 00:34 left | 5 | Pass |
| Turn three of four | 4 | Pass |
| Add one detail | 3 | Pass |
| Sam guessed “a house at sea.” | 6 | Pass |
| Add to the same drawing. | 5 | Pass |
| How the relay works | 4 | Pass |
| No account is needed. | 4 | Pass |
| Share one private link with the person you know. | 9 | Pass |
| Make a room | 3 | Pass |
| Send its private invite to one person. | 7 | Pass |
| Take four turns | 3 | Pass |
| Draw, guess, then add one surprising detail. | 7 | Pass |
| Save the PNG strip | 4 | Pass |
| Download the finished relay as one PNG strip. | 8 | Pass |
| Private rooms and data | 4 | Pass |
| Rooms disappear from the server within four hours. | 8 | Pass |
| Downloading a PNG strip does not send it to another service. | 11 | Pass |
| What this does not have | 5 | Pass |
| Public rooms or strangers | 4 | Pass |
| Profiles or follower counts | 4 | Pass |
| Ads or behaviour tracking | 4 | Pass |
| Open text chat | 3 | Pass |
| Family edition: eight-turn rooms | 4 | Pass |
| $6 once | 2 | Pass |
| Eight-turn rooms are included. | 4 | Pass |
| Core four-turn play and PNG strips stay free. | 8 | Pass |
| Buy the family edition | 4 | Pass |
| One-time purchase. | 2 | Pass |
| Payment opens on Sociobot. | 4 | Pass |
| Already bought it? | 3 | Pass |
| Paste your license | 3 | Pass |
| Restore the family edition | 4 | Pass |
| Read purchase terms | 3 | Pass |
| Draw and guess with one trusted person. | 7 | Pass |
| Terms | 1 | Pass |
| Built by Param Factory | 4 | Pass |
| v1.0.3 | 1 | Pass |
| Art generated for this product | 5 | Pass |

No sentence exceeds 22 words. No banned word appears. Read aloud, the first screen identifies the two-person drawing job and its sample-data first step in one breath.

## Changed privacy and terms copy

| Copy | Words | Result |
|---|---:|---|
| The server stores the room code, access-key hashes, turn and timer state, drawing panels, and guesses in SQLite. | 18 | Pass; `room-storage-fields` |
| It also stores creation, expiry, and brief presence times. | 9 | Pass; `room-storage-fields` |
| It removes the room within four hours. | 7 | Pass; `room-expiry` |
| Restoring a license sends one check to api.sociobot.in. | 8 | Pass; `license-check-data-flow` |
| The request includes the license token and no room data. | 10 | Pass; `license-check-data-flow` |
| Dodo Payments is the merchant of record. | 7 | Pass; `purchase-provider` |
| Its checkout handles order questions and returns. | 7 | Pass; `purchase-provider` |
| A refunded license cannot enable eight-turn rooms. | 7 | Pass; `refunded-license` |

The legal copy names the stored fields and tested payment behavior without the earlier unproved joint-merchant or generic refund statements.

## Terminology

| Concept | Word used |
|---|---|
| Temporary shared session | room |
| Secret entry value | invite code |
| One action period | turn |
| Whole activity | relay |
| Downloaded final image | PNG strip |
| Other participant | partner |
| Paid option | family edition |
