# ScreenSync — The midnight assembly

A silent, generative Halloween installation for ten displays. Static hosting; no accounts, camera, or audio required. A checked-in compatibility bundle serves older tablets. PeerJS 1.5.5 is vendored locally under its MIT license.

## Installation without editing URLs

Open https://karpatic.github.io/screensync/ on each device. The setup dialog lets you:

1. Join a named room (default: **halloween**).
2. Choose the wall screen count and arrangement, then **Save layout for this room**.
3. Choose this device's numbered position, **0 — Welcome display**, or **Preview the entire wall**, then **Use selected screen**.

Layouts are labeled explicitly as columns across and rows down:

| Wall screens | Arrangements |
| --- | --- |
| 9 | 3 across × 3 down |
| 6 | 3 across × 2 down; 2 across × 3 down; 1 across × 6 down; 6 across × 1 down |
| 4 | 2 across × 2 down |
| 5 | 5 across × 1 down; 1 across × 5 down |

Numbering runs left to right, top to bottom. Screen **0 is optional and extra**: a nine-screen wall plus welcome uses ten devices. The numbered diagram previews the arrangement. The connection counter reports wall screens only, excluding welcome and preview observers. The artwork fills the entire selected wall, so its overall proportions vary with the formation.

On the welcome page, numbered buttons immediately make this device that screen. Use **Room & screen** in the wall's controls (move the pointer or press **H**) to change rooms, layout, or device number. A new, unconfigured device is an observer until you select a position; it does not claim screen 0. Each tab remembers its selected room and screen for refreshes using session storage, so several windows on one computer can use different positions. Selecting a number in the UI removes the number from the URL. If session storage is unavailable, choose the number again after refreshing.

Use matching screen aspect ratios, landscape orientation, identical browser zoom, and fullscreen (**F** or the Fullscreen button). Each physical display needs its own browser window. Disable device sleep. Close duplicate numbered windows in a room or pick another number.

Existing `?screen=0` through `?screen=9` links still work. `?n=1` remains an alias. `?preview=1` shows the whole wall. `?room=your-name` selects a room; no URL parameters are required to configure a device.

### Shared room layouts

Save a layout once, and active peers automatically adopt it. A late-joining screen receives the room layout from connected peers. Layout settings also persist per room in browser local storage; returning browsers can restore them after all peers leave. A room opened only on entirely new/cleared browsers starts at the default 1 across × 5 down until you save another layout. GitHub Pages does not provide a permanent room database.

Room settings use revision numbers and a deterministic writer tie-break to converge after concurrent edits or disconnected groups rejoin. They survive clock-leader departure. If a smaller layout excludes a device's old screen number, that device opens setup and asks for a valid position. Separate room keys keep separate layouts and timing groups. To switch rooms, enter its key and select **Join room**, then choose this device's number.

## The midnight parade (default)

New rooms default to **1 across × 5 down**: screen 1 at the top, screen 5 at the bottom. The ghost and five other cartoons take turns travelling down the tower and back on smooth 36-second journeys, with drifting dust, faint arches, and a soft light trail. Position and character selection come directly from the shared clock, so late joiners see the same parade. Preview preserves the tall wall proportions with letterboxing.

Five- and six-screen lines automatically select the parade; grid formations retain the Halloween scene cycle below. Previously saved room layouts are preserved. Older untouched defaults migrate to the vertical tower when refreshed; refresh every screen to load the new artwork.

## The haunting

A two-minute UTC-anchored loop: a watching amber eye, a procession of mint ghosts, a glowing pumpkin, and a violet portal with bats. Each scene lasts 30 seconds, with gentle fades. All wall displays render their assigned crop of the same 3000×1800 virtual artwork. Visuals derive from absolute time and deterministic seeds, rather than accumulated frame counts. Reloads and late arrivals join the current scene. The artwork is silent and does not use strobe effects.

## Automatic peer rooms and clocks

Every screen automatically joins room **halloween**. Existing URLs work unchanged. To use another key, add `&room=your-key` to every URL, or enter it on screen 0. The on-page room selector and preview preserve that key. Keys are case-sensitive, trimmed, and limited to 64 characters. Each numbered screen can be open once per room; a duplicate reports the conflict and retries until the original leaves. Preview uses a separate observer identity.

Browsers discover each other through the public PeerJS Cloud signaling service. The room key is hashed into peer IDs; it is a grouping key, not authentication or a private password. Do not use a sensitive password. WebRTC DataChannels then carry tiny timing messages directly between browsers. Google STUN helps discover routes; no TURN relay is configured. GitHub Pages still serves the website. Initial discovery and reconnects need internet access; established channels can survive a signaling outage while their network route remains available. Restrictive firewalls, Wi-Fi client isolation, or incompatible NATs may prevent direct connections. Keep the displays on the same normal LAN when possible.

The mesh discovers numbered screens every 2.5 seconds and elects the lowest connected screen number as clock leader (normally 0). Other screens estimate their offset from that leader using a four-timestamp exchange, adjusting for round-trip delay and processing time. A rolling low-latency sample drives the animation clock. The displayed `RTT ±N ms` is half the observed network round trip, not a guarantee of physical display accuracy. If the leader leaves, peers elect the next lowest available screen; dead channels expire after 12 seconds. Joining or switching leaders may briefly adjust the animation phase.

Before peers connect, HTTP Date provides the original coarse UTC estimate. If peer discovery fails, the art keeps running on that fallback. Once a group is connected, HTTP checks do not overwrite its shared time. A surviving isolated display keeps its last correction until a subsequent UTC check. Monotonic browser clocks keep the timeline stable between adjustments. The welcome page shows the wall connection count, formation, and clock leader; numbered screens show them in the auto-hiding controls (H reveals controls).

Keep automatic system time enabled on all devices. If needed, `&offset=250` advances one display by 250 milliseconds; negative values delay it. This local display calibration is excluded from timing messages. Different hardware refresh rates, browser throttling, bezels, and aspect ratios can still affect seams. Peer timing improves alignment but does not synchronize physical panel refresh.

## Development and deployment

Serve this directory with any static server (for example `python3 -m http.server 8765`). GitHub Pages publishes the root of `main`. Source: HTML, CSS, and Canvas 2D JavaScript. Run `npm ci` and `npm run build` after changing application modules so the checked-in Safari bundle stays current. The `window.screenSync` diagnostic exposes the current screen, room, shared layout, corrected timestamp, peer status, and deterministic scene selection for checks.

Run `npm ci` once, then `npm test` for tile coverage in all formations, shared layout propagation, late joins, clock skew correction, room isolation, reconnect, leader failover, and malformed-message checks.

PeerJS API and signaling documentation: https://peerjs.com/client/api/peer and https://peerjs.com/client/faq

## Safari 9 tablets

The ES5 loader detects older browsers and loads `app.legacy.js` instead of ES modules or PeerJS. The checked-in bundle includes required language/API polyfills; small DOM and Canvas shims adapt the setup dialog, tile selectors, and ellipse drawing. CSS has a non-Grid layout, older-color fallbacks, and touch controls. The old-tablet path renders at up to 30 fps and device pixel ratio 1. Add the page to the iPad Home Screen for a standalone display; iOS Safari does not provide the normal desktop fullscreen API.

Safari 9 has no WebRTC, so it cannot join the direct peer clock or receive live peer room-layout changes. It uses three same-origin XHR HTTP Date samples instead, with the original roughly half-second clock precision plus network uncertainty, checked every two minutes and on returning to the page. Choose the same formation on each old tablet (the five-down ghost tower is the default). The status explicitly says **Tablet mode / server clock**. Different room names on these browsers group saved settings locally; they do not establish a live room connection.

Use `?legacy=1` to force the fallback for QA on a current browser. Tests parse every legacy entry script as ES5 and cover loader selection and XHR timing. Browser QA removes modern APIs to exercise the shims, but that does not replace testing on a physical Safari 9/iOS 9 device. GitHub Pages HTTPS and certificate trust must also work on the actual tablet.

Compatibility reference: Safari first added WebRTC in Safari 11: https://webkit.org/blog/8672/on-the-road-to-webrtc-1-0-including-vp8/

## Dedicated Safari 9 page and release version

Open **https://karpatic.github.io/screensync/safari9.html** for the tablet version. It always selects compatibility mode and embeds its CSS, DOM shims, and ES5 application in one HTML file. It does not load the homepage's script or stylesheet URLs, so stale copies of those assets cannot affect this page. Server-clock requests still use the network.

The homepage and Safari page show a tiny version label at bottom right. `version.json` records that version and a source build fingerprint. To make a release, bump `package.json`'s version (for example `npm version patch --no-git-tag-version`), run `npm run build`, then `npm test`. Commit the generated HTML, bundle, and manifest. The build refreshes module/cache keys, stamps the homepage, and regenerates the self-contained Safari page. Use `safari9.html?v=VERSION-BUILD` when sharing a fresh release; a new URL avoids a cached HTML response as well. Static GitHub Pages can still cache each individual URL.

## Midnight parade (v1.1)

Five- and six-screen lines now cycle through six original cartoons: the wandering ghost, a witch on her broom, a flock of bats, a dancing skeleton, a balloon-lifted pumpkin, and a black cat on a crescent moon. Each character travels the whole installation and back before gently fading into the next. Five-screen scenes last 36 seconds and six-screen scenes last 43.2 seconds, keeping the travel speed similar. Position and character selection use the shared absolute clock; no interaction or video playback is required. Both vertical stacks and horizontal lines preserve character proportions. Other grid formations retain the original wall scenes.

For six tablets stacked top to bottom, choose **6 screens → 1 across × 6 down**, save the layout, then assign screens 1–6. On Safari 9, select that arrangement on each tablet. The default remains the five-screen stack so existing installations keep working.
