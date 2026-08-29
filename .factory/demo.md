# Demo sandbox

- URL: `http://localhost:8080/?demo=1` (production: `https://family-doodle-relay.sociobot.in/?demo=1`). `/demo` is an equivalent direct route.
- Sample: a two-person relay on turn three. A house-at-sea drawing, one guess, and a connected sample partner are already visible.
- Actions: add a mark, undo, clear, finish the turn, and download the completed PNG strip.
- Reset: choose **Reset demo** in the persistent banner.
- Leave: choose **Start for real**. Demo state is discarded.
- Storage: the demo is held only in page memory. It does not read or write room keys, licenses, or another local storage namespace.
- Network: after `/demo` loads, demo actions do not call the room backend or any third party.
