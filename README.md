# ScreenSync — The midnight assembly

A silent, generative Halloween installation for ten displays. No build step, accounts, camera, or audio required. PeerJS 1.5.5 is vendored locally under its MIT license.

## Installation

Open https://karpatic.github.io/screensync/?screen=0 on the welcome display.
Arrange the other nine displays in this order, using the same URL with `?screen=N`:

```
1  2  3
4  5  6
7  8  9
```

Use matching screen aspect ratios, landscape orientation, identical browser zoom, and fullscreen (F or the Fullscreen button). Move the pointer or press H to reveal controls; controls disappear after six seconds. Avoid spanning the window across multiple monitors: each display needs its own browser window/tab. Disable device sleep for the installation.

`?preview=1` shows the whole wall, with numbered tile boundaries. No parameter opens screen 0. `?n=1` is an alias for `?screen=1`.

## The haunting

A two-minute UTC-anchored loop: a watching amber eye, a procession of mint ghosts, a glowing pumpkin, and a violet portal with bats. Each scene lasts 30 seconds, with gentle fades. All nine displays render a crop of the same 3000×1800 virtual artwork. Visuals derive from absolute time and deterministic seeds, rather than accumulated frame counts. Reloads and late arrivals join the current scene. The artwork is silent and does not use strobe effects.

## Automatic peer rooms and clocks

Every screen automatically joins room **halloween**. Existing URLs work unchanged. To use another key, add `&room=your-key` to every URL, or enter it on screen 0. Screen 0's numbered links and preview preserve that key. Keys are case-sensitive, trimmed, and limited to 64 characters. Each numbered screen can be open once per room; a duplicate reports the conflict and retries until the original leaves. Preview uses a separate observer identity.

Browsers discover each other through the public PeerJS Cloud signaling service. The room key is hashed into peer IDs; it is a grouping key, not authentication or a private password. Do not use a sensitive password. WebRTC DataChannels then carry tiny timing messages directly between browsers. Google STUN helps discover routes; no TURN relay is configured. GitHub Pages still serves the website. Initial discovery and reconnects need internet access; established channels can survive a signaling outage while their network route remains available. Restrictive firewalls, Wi-Fi client isolation, or incompatible NATs may prevent direct connections. Keep the displays on the same normal LAN when possible.

The mesh discovers numbered screens every 2.5 seconds and elects the lowest connected screen number as clock leader (normally 0). Other screens estimate their offset from that leader using a four-timestamp exchange, adjusting for round-trip delay and processing time. A rolling low-latency sample drives the animation clock. The displayed `RTT ±N ms` is half the observed network round trip, not a guarantee of physical display accuracy. If the leader leaves, peers elect the next lowest available screen; dead channels expire after 12 seconds. Joining or switching leaders may briefly adjust the animation phase.

Before peers connect, HTTP Date provides the original coarse UTC estimate. If peer discovery fails, the art keeps running on that fallback. Once a group is connected, HTTP checks do not overwrite its shared time. A surviving isolated display keeps its last correction until a subsequent UTC check. Monotonic browser clocks keep the timeline stable between adjustments. The welcome page shows the connected count and clock leader; numbered screens show them in the auto-hiding controls (H reveals controls).

Keep automatic system time enabled on all devices. If needed, `&offset=250` advances one display by 250 milliseconds; negative values delay it. This local display calibration is excluded from timing messages. Different hardware refresh rates, browser throttling, bezels, and aspect ratios can still affect seams. Peer timing improves alignment but does not synchronize physical panel refresh.

## Development and deployment

Serve this directory with any static server (for example `python3 -m http.server 8765`). GitHub Pages publishes the root of `main`. Source: HTML, CSS, and Canvas 2D JavaScript. The `window.screenSync` diagnostic exposes the current screen, corrected timestamp, sync status, and deterministic scene selection for checks.

Run `npm test` (no dependency installation required) for the simulated mesh, skew correction, room isolation, reconnect, leader failover, and malformed-message checks.

PeerJS API and signaling documentation: https://peerjs.com/client/api/peer and https://peerjs.com/client/faq
