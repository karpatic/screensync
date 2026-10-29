# ScreenSync — The midnight assembly

A silent, generative Halloween installation for ten displays. No build step, libraries, accounts, camera, or audio required.

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

## Clock behavior and limits

Each browser estimates its offset from the same-origin server's HTTP Date header using three uncached HEAD requests and the lowest round-trip sample. It rechecks every two minutes and on returning to the tab. Between checks, a monotonic performance clock prevents local wall-clock adjustments from disrupting the artwork.

HTTP Date is only precise to one second: expected alignment is roughly ±0.5 seconds per device plus network uncertainty, **not frame-accurate video-wall synchronization**. Slow flowing scenes make this practical without a backend. The control bar shows the estimate; if network sync fails it explicitly reports device-clock fallback. Keep automatic system time enabled on all devices. If necessary, `&offset=250` advances an individual display by 250 milliseconds (negative values delay it). Different hardware refresh rates, display processing, bezels, and aspect ratios can still affect seams. No browser can guarantee simultaneous physical panel refresh here.

## Development and deployment

Serve this directory with any static server (for example `python3 -m http.server 8765`). GitHub Pages publishes the root of `main`. Source: HTML, CSS, and Canvas 2D JavaScript. The `window.screenSync` diagnostic exposes the current screen, corrected timestamp, sync status, and deterministic scene selection for checks.
