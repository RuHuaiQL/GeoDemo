# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Pure static front end (React 19 + TypeScript + Vite 7 + Tailwind 4 + Zustand + three/R3F) with no backend, accounts, or persisted student data. Validated with Node.js 24.

```bash
npm ci                    # install dependencies
npm run dev               # dev server at http://127.0.0.1:5173
npm test                  # Vitest unit suite (vitest run)
npm run build             # tsc --noEmit && vite build -> dist/
npm run preview           # serve dist/ over HTTP at 127.0.0.1
npm run test:e2e          # Playwright; starts its own dev server
npx playwright install chromium   # one-time, needed before test:e2e

# single unit file / single unit test
npm test -- src/science/eclipse.test.ts
npm test -- -t "主要月相"
# single e2e file / e2e by title
npx playwright test tests/eclipse.spec.ts
npx playwright test -g "月食七节点"
```

There is no linter; `npm run build` is the type check (`strict: true`, no emit). Playwright's config uses `reuseExistingServer: false`, so stop any process already bound to `127.0.0.1:5173` before e2e. E2E screenshots land in `test-results/` (gitignored). `dist/index.html` must be served over HTTP, never opened directly.

## Architecture

### Science core is the single source of truth
`src/science/model.ts` is pure and UI-free. `calculate(days, solarTime)` returns an `AstronomyState` that every ordinary-mode view consumes: progress, elongation, sun/moon longitudes, observer longitude, light/sun/moon direction vectors, illumination, the eight-way phase name, rise/transit/set, altitude/azimuth, ENU vector, and `aboveHorizon`. Renderers only map this state to pixels — do not recompute astronomy in components.

Key invariants:
- `days` is continuous days from an ideal aligned epoch, not a calendar date. Solar longitude uses `SIDEREAL_MONTH`/`YEAR`; phase progress uses the derived `SYNODIC_MONTH = 1/(1/M − 1/Y)`. Never conflate sidereal and synodic periods.
- `solarTime` is an independent "local solar time" experiment parameter, not a timezone or UT1. Changing it freezes the orbit and phase (only the observer rotates); rise/transit/set depend solely on phase progress, with no daily orbital drift.
- `wrap` rejects non-finite input with `RangeError`; NaN/Infinity rejection is tested and expected.
- Phase names use the nearest 45° bin: `floor(progress*8+0.5) % 8`. Boundary cases fall to the next bin by design.
- Azimuth is `null` at zenith/nadir and must render as “未定义”. `aboveHorizon` means geometric altitude > 0, explicitly not naked-eye visibility.
- The coordinate contract is documented in `docs/COORDINATES.md`: geocentric right-handed, +Z north, XY orbital plane, radians internally. Three.js maps core `(x,y,z)` to scene `(x, z, -y)`; do not change the mapping or the astronomy elsewhere.

### Solar diurnal model is independent
`src/science/solar.ts` handles the “太阳视运动” module: Spencer/NOAA declination and equation of time, true solar time from date + longitude + UTC+8, altitude/azimuth, geometric sunrise/sunset, and polar day/night. It is separate from `model.ts` and must not be mixed into lunar-phase calculations. `src/store/solar.ts` holds date, time, coordinates and the selected city preset (`src/science/cities.ts`); `SolarLab.tsx` renders an independent R3F scene that maps ENU `(east, north, up)` to scene `(east, up, -north)`. Clock times are always Beijing time (UTC+8); sunrise/sunset ignore atmospheric refraction, and the module is not an almanac or local forecast.

`src/science/solarSites.ts` holds pure metrics for the five clickable landscape knowledge stations (building spacing, collector tilt, shadow length, daylight penetration, shading board); `SolarStations.tsx` holds their procedural detailed models, station anchors and camera focus presets. `SolarLab` stores the focused site locally, animates the OrbitControls camera through `CameraRig`, and shows live metrics in the controls column. Focus mode hides unrelated decorative buildings, other stations and the sky grid, and the sun-path radius is kept larger than every building/tree extent so the sun disc and path cannot intersect them. Scene dimensions are illustrative; only the panel values are physical.

### State and experiment semantics
`src/store/lab.ts` stores days, phase playback, speed, and preview visibility. At normal speed a synodic month takes 30 seconds. The lunar-day slider and phase diagram both use `setDays` and pause playback. The lunar panel displays ideal local solar times derived from elongation.

### Composition and views
`src/App.tsx` composes the single page in one of three modes (`phase`, `eclipse`, `solar`). `SpaceView`, `EclipseLab` and `SolarLab` are lazy-loaded; `EclipseLab` is a whole-mode swap with its own internal time state and does not touch the lab store, so returning to “月相实验” restores the previous phase parameters. `SolarLab` keeps its settings in `src/store/solar.ts`, so date/city/time survive mode switches. The header's layout reset clears `localStorage` panel keys and bumps a `layout` key to remount the floating panels.
- `FloatingPanel` persists open/closed state in `localStorage` under its `id`; panels overlay the stage and must not change `.main-stage` dimensions.
- `MoonDisc` renders the moon into a 320×320 canvas by orthographic sphere sampling from `moonLight`, with a runtime fallback to a gray disc if `/textures/moon.jpg` fails. The near-side texture stays fixed relative to the observer; `SpaceView` instead rotates the texture with sidereal longitude toward Earth.
- `PhaseView` memoizes on `hidden`/`elongation`; its exported `phaseStrips` is the analytical terminator used by tests to verify illuminated area equals `illumination`.
- `LunarPanels` pairs the eight projected lunar appearances with their orbital positions and explains rise, transit, and set times.
- Eclipse replay (`src/science/eclipse.ts`, `EclipseLab.tsx`) is a separate model: 2025-09-07 total lunar eclipse from EclipseWise contact times (UT1), equal-shadow-circle interpolation, ×600 playback, seven unequally spaced contacts, plus an off-node geometric counterexample. It is not a full ephemeris; do not feed local solar time into it or treat ordinary full moon as an eclipse.

### Domain constraints to preserve
The lunar teaching model is equatorial, coplanar, circular, zero-declination, with parallel sunlight and no refraction/parallax/libration. It must never be presented as a local astronomical forecast, and “above horizon” must not be equated with visibility. Lunar phases come from illuminated-area geometry, not Earth's shadow; the eclipse module is the only shadow story. The solar module uses a separate date/latitude/longitude model in Beijing time with geometric rise/set (no refraction) and must not be described as an almanac. `docs/SCIENCE_MODEL.md`, `docs/SOLAR_MODEL.md`, `docs/COORDINATES.md`, and `docs/ECLIPSE_MODEL.md` are the authoritative specs; `docs/ACCEPTANCE.md` and `docs/FINAL_REPORT.md` record verified behavior. Update docs and tests together when model claims or behavior change.

### Tests pin behavior
Vitest files are colocated in `src/**/*.test.ts` (config only includes `.ts`): model phases/periods/time normalization, projection area vs illumination (1e-4), observation windows vs `aboveHorizon`, eclipse contact timings/tangencies/ratios, solar declination/rise/set/polar cases/path, landscape-site formulas, and both stores. Playwright covers the UI flows in `tests/lab.spec.ts`, `tests/eclipse.spec.ts`, and `tests/solar.spec.ts`, including panel persistence without stage resize, keyboard sliders, narrow layouts, eclipse entry/exit, the 3D transit-marker click, polar day/night, station focus via panel and via the projected scene dot, and winter/summer presets.

### Style
UI copy and docs are Simplified Chinese. Source is intentionally dense (frequent single-line JSX/statements) and styled in `src/style.css` with Tailwind 4 plus custom classes, rather than per-component style files. Keep edits in that style, and keep comments sparse unless explaining model assumptions.
