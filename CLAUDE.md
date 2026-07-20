# CLAUDE.md — working on this repo

A personal allotment tracker: static Astro site on GitHub Pages, edited live
from the owner's phone. **There is no backend** — understanding the persistence
model below is prerequisite to almost any change. README.md covers what the
site does; this file covers how it works and what will bite you.

## Architecture & persistence (the core idea)

- Static build (`astro build`) → GitHub Pages via `.github/workflows/deploy.yml`
  on every push to `main`. Live in ~1 min.
- All state lives in four JSON files under `src/data/` (areas, seeds, log,
  plans), imported at build time by the pages.
- **Browser edits** go to a localStorage overlay first, then "Save to website"
  commits the JSON straight to `main` via the GitHub git-data API using a
  fine-grained PAT the owner pasted once (localStorage `allotment:gh-token`).
  Photos are compressed in-browser and committed to `public/photos/<areaId>/`
  in the same atomic commit as `areas.json`.
- Consequence #1: **`main` moves on its own** (phone commits). Always
  `git pull --rebase` before pushing; expect photo/data commits to appear
  between your commits.
- Consequence #2: any change to a data file's shape must tolerate BOTH the old
  shape in users' localStorage AND the committed file. Pattern precedent:
  `migrateMarkers()` in PlotMap (markers → per-area `stock`) runs on both the
  baseline and the loaded overlay.

### localStorage keys

| Key | Contents | Written by |
|---|---|---|
| `allotment:plot:v1` | `{areas, cropIcons, base, dirty}` overlay of areas.json | Map |
| `allotment:seeds:v1` | seeds.json overlay | Seeds, Pipeline, Nursery |
| `allotment:log:v1` | log.json overlay | Calendar |
| `allotment:plans:v1` | plans.json overlay | Plans |
| `allotment:gh-token` | GitHub fine-grained PAT | any Save/photo action |
| `allotment:anthropic-key` | Claude API key (packet scanner) | Seeds |
| `allotment:wx:recent:v1`, `allotment:wx:arch:*` | Open-Meteo cache (1 h / forever) | Calendar, Today |

Staleness rule (currently implemented **only** for `allotment:plot:v1`): the
overlay stores `base` (hash of the baseline it was saved against) and `dirty`;
on load, a clean-but-stale overlay is dropped so newly published data appears.
The other overlays don't do this yet — a known gap if multi-device editing of
seeds/plans becomes a problem.

## Page inventory

| Route | File | Notes |
|---|---|---|
| `/` | `src/pages/index.astro` | Today dashboard; redirects legacy `/#bed-id` links to `/map#bed-id` |
| `/map` | `src/pages/map.astro` → `src/components/PlotMap.astro` | ~1200 lines; the whole map lives here |
| `/pipeline` | `src/pages/pipeline.astro` | sowings board; adaptive dates; bought plants; progress photos |
| `/calendar` | `src/pages/calendar.astro` | events + weather + diary + day popup |
| `/seeds` | `src/pages/seeds.astro` | family-grouped bank; packet scanner (Claude vision) |
| `/plans` | `src/pages/plans.astro` | season timeline + next-season rotation |
| `/nursery` | kept but off the nav (Pipeline supersedes) | |
| `/projects` | static-ish | |

Navigation lives in `src/layouts/Base.astro`: top tabs on desktop, fixed
bottom bar (Today/Map/Pipeline/Calendar/⋯More) below 820px. Full-screen
surfaces add `body.plot-fs` / `body.av-open`, which also hide the bottom bar.

## Conventions & gotchas (each of these has bitten before)

1. **Astro scoped styles miss JS-created DOM.** Every page uses
   `scopeStamp()` (datastore) or `SCOPE()` (PlotMap) to stamp
   `data-astro-cid-*` onto dynamically created subtrees. Forget it and your
   elements silently render unstyled.
2. **PlotMap's script is `define:vars` (inline) — it cannot `import`.**
   That's why it has its own copies of helpers (commitFiles, compress,
   scope-stamper) and why `plantsheet.ts` can't be used from the map. Data is
   passed via `define:vars={{ plotData, seedsData, repo, base }}`.
3. **Deliberately duplicated constants.** `NURSERY_WEEKS`, family colours,
   `FAMILIES`, month helpers, and the expected-date maths (`expPlantOut` /
   `expHarvest`) exist in several pages (pipeline, plans, calendar, index,
   plantsheet, PlotMap "…L" variants). Pages are self-contained by design —
   if you change the prediction model or add a family, grep for all copies.
4. **Adaptive dates philosophy** (owner cares about this): expected plant-out
   = actual `sownDate` + nursery weeks; expected harvest = actual `sownDate` +
   the packet's own sow→harvest lag. Never predict from advisory calendar
   months alone. Explicit `expectedPlantOut`/`expectedHarvestFrom` on a sowing
   are user-pinned overrides — respect them.
5. **Reconciliation is soft.** Map stock vs planner counts only ever *informs*
   ("Cabbage: 9 in the planner vs 10 here") — neither side auto-wins.
6. **Inputs ≥16px font** on anything focusable, or iOS Safari zooms the page.
7. **Nothing may widen the phone layout viewport.** Long bed names in
   `<select>`s once stretched the page and pushed dialogs off-screen; cap
   widths (`max-width: 44vw` etc.) on any new select/chip row.
8. **`home-greenhouse`** is a real Area in areas.json but `OFF_PLOT` in
   PlotMap: not rendered on the SVG, excluded from bed pickers, shown as its
   own card; deep link `map#home-greenhouse` opens its dossier/journal.
9. **Crop tags** (`AreaEvent.crop`) are the "sections" mechanism: journal
   filter chips, pipeline progress-photo filtering, and the plant sheet's
   cross-place photo story all key off them (case-insensitive matching).
10. **Claude packet scanner** (seeds page): `@anthropic-ai/sdk` with
    `dangerouslyAllowBrowser`, model in `SCAN_MODEL` (claude-haiku-4-5),
    structured outputs via `output_config.format`. A 401 clears the stored key.
    Vite warns about `node:fs` externalisation from the SDK — harmless.
11. **Weather**: Open-Meteo, keyless, client-side. Plot coordinates in
    `PLOT_LOCATION` (datastore) — Thingwall Park allotments, Fishponds,
    Bristol. Beware `toISOString()` date-shifts under BST; use the local
    formatters already in calendar/index.

## Dev & verification workflow

```sh
npm install
npm run build          # must pass before committing
npm run preview        # serves dist at http://localhost:4321/allotment
```

UI changes are verified by driving the real site headless (no test suite):
install `playwright` in a scratch dir and use `chromium.launch({ channel:
'msedge' })` (uses system Edge, no browser download) with the iPhone 13 device
descriptor for touch. Established recipe: seed `localStorage` overlays (set
`dirty: true` on a synthetic plot overlay or it may be dropped as stale),
`page.reload()` after seeding, screenshot phone-width. Two traps in tests:
navigating `/#x` → `/#y` or `/` → `/#x` is hash-only (no reload — deep-link
code won't rerun; call `page.reload()`), and the API can be stubbed with
`page.route('https://api.anthropic.com/**')` (handle OPTIONS preflight + CORS
headers) to test the scanner without spending money.

Commits: one feature per commit with a thorough message (the git log is the
project's changelog — keep that standard). Push to `main` deploys; verify with
`gh run list --limit 1`.

## Current state & parked ideas

Everything in README's roadmap up to "Visual season planner" is live and
field-tested by the owner. Parked (owner-approved direction, not yet built):
draggable plan bars on the season timeline (v1 is tap-to-edit months), inline
editing inside the plant sheet (v1 links out), desktop map rotation,
staleness-hashing for the non-plot localStorage overlays, companion-planting
suggestions.
