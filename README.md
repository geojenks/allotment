# Allotment

A living plan and journal for the allotment — an interactive map of the plot
where each area shows what's planted, what's planned, and what needs doing.
Built with [Astro](https://astro.build) and deployed to GitHub Pages.

## How it's structured

Four JSON files under `src/data/` drive everything; the pages are different
views over them. Each is edited in the browser and committed back to this repo
via an on-device GitHub token (see *Saving your changes*).

- `src/data/areas.json` — the plot: every area, its position over the aerial
  photo (`figures/plot_overlay.svg` coordinates), per-bed **stock** (crop
  counts + slug collars + condition), photo/note **timelines** (photos can be
  tagged with a crop), and `cropIcons` (emoji per crop).
- `src/data/seeds.json` — the seed bank (packets + advisory windows) and
  **sowings** (actual instances that flow through the Pipeline).
- `src/data/log.json` — the diary: watered / weeding / project-work entries
  logged from the Calendar.
- `src/data/plans.json` — bed plans painted on the Plans season timeline
  (family + crop shortlist + plant-out/clear months).
- `src/lib/types.ts` — the data model for all of the above, documented inline.
- `src/lib/datastore.ts` — shared browser helpers: GitHub commit-via-API,
  localStorage overlays, Anthropic key, image compression, plot coordinates.
- `src/lib/plantsheet.ts` — the "plant sheet" popup (crop story) used by
  Today and the Calendar.
- `src/components/PlotMap.astro` — the interactive map (largest component).
- `public/map/plot-base.png` — the aerial background (extracted from the SVG).

**CLAUDE.md documents the architecture, conventions and gotchas for anyone
(human or AI) working on the code — read it before making changes.**

## The map

- **View** — tap any numbered area to open its full-screen dossier. On phones
  the plot fills the screen width (pan up/down); ⤢ shows the whole plot.
  Zoomed-out beds show urgency-coloured headline lines ("6 cabba · 7 cauli":
  red = needs action, amber = struggling, green = harvest near/ready).
- **Zoom in** — select an area then **Zoom in** (or double-click it) to focus on
  that bed. Stock badges only appear at this level.
- **Off the plot** — the Home greenhouse lives in its own card below the map
  (same dossier/journal treatment, deep link `map#home-greenhouse`).
- **Plants per bed** — beds hold per-crop counts ("stock"), not individually
  placed icons. In planting mode, tapping a crop in the palette adds one to the
  focused bed (a − undoes it); tap a bed's "🥦 ×6" badge to fine-tune quantity,
  slug collars, and condition. The overview shows urgency-coloured headline
  lines per bed ("6 cabba · 7 cauli").
- **Edit** — drag an area to move it, drag its corner to resize, **+ Area** to
  create one, edit its name/type/notes.

### Timeline & photos

Select an area to see its **Timeline**: a date scrubber that shows the most recent
photo on or before the chosen date (with a "*N-day-old photo*" caption), notches
where photos exist, plus a dated list of photos and notes. Set an area's **Created**
date in Edit mode to anchor the start of its timeline.

**Add photo** opens your camera or photo library (multi-select). Images are
compressed in-browser (~1280px) and committed straight to `public/photos/<area>/`
via your GitHub token — so they need the same token as *Save to website* and go
live in ~1 minute. Photos can carry an optional **crop tag** (set at upload or
retro-tagged via 🏷): tagged journals grow per-crop filter chips — the
greenhouse's "sections" — and the plant sheet strings a crop's tagged photos
across all places into one progress story. **Note** adds a dated text entry
(saved locally until you Save to website / add a photo). Dates and tags of
existing entries are editable (📅 / 🏷), and photos can be moved between areas.

### Saving your changes

Edits auto-save to your browser (localStorage), so a refresh never loses them.
When you have changes not yet on the live site, a status bar appears with:

- **Save to website** — commits `areas.json` straight to GitHub via a token, so
  the live site updates in ~1 minute. The first time, you paste a token: create a
  [fine-grained token](https://github.com/settings/tokens?type=beta) scoped to the
  **allotment** repo with **Contents: Read and write**. It's stored only on your
  device. (This is the only way to persist from a phone — a static site has no
  server of its own.)
- **Download** / **Copy** — get the JSON to commit by hand instead.
- **Discard** — revert this device to the version that's live.

> The area names are an initial best guess from your description (assuming the
> **top** of the photo is the back/fence end). Open the map and correct
> anything wrong; once confirmed, untick "provisional" in Edit mode.

## Running it locally

You need [Node.js](https://nodejs.org) 18+ (install the LTS — e.g.
`winget install OpenJS.NodeJS.LTS`). Then:

```sh
npm install
npm run dev      # http://localhost:4321/allotment
npm run build    # outputs to dist/
```

## Deploying to GitHub Pages

1. Create a GitHub repo named **`allotment`** and push this code to `main`.
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds and publishes on every
   push to `main`. Your site will be at
   `https://<your-username>.github.io/allotment/`.

If you use a different repo name or a custom domain, update `site` and `base`
in [`astro.config.mjs`](astro.config.mjs).

## Sections

The site opens on **Today**; on phones a bottom bar gives Today / Map /
Pipeline / Calendar / ⋯More (Seeds, Plans, Projects, Greenhouse).

- **Today** (`/`) — dashboard: watering banner, needs-attention list (overdue
  plant-outs, last-month-to-sow packets, plan sow-by deadlines), picking
  now/soon, sow-now chips. Tapping a crop opens the **plant sheet** — counts by
  place, each sowing's story, the packet, the cross-place photo story.
- **Map** (`/map`) — the interactive plot map (`src/data/areas.json`), with
  full-screen "planting mode" for updating a bed's crop counts from a phone.
  Old `/#bed-id` bookmarks redirect here.
- **Pipeline** — every sowing from packet to plate: Seed bank → Nursery →
  Growing on → Harvest, with adaptive expected dates (predicted from your
  *actual* sow date, editable per sowing), green/amber/red status,
  "stays under cover" for greenhouse fruiters, progress photos, and
  **🛒 Add bought plants** for plugs with no packet.
- **Calendar** — agenda from plantings, tasks, sowings, bed plans and the
  diary; real rainfall + 16-day forecast from Open-Meteo with a "worth a
  watering trip" banner. Tap a day for the full card and to log
  watered / weeding / project entries (`src/data/log.json`).
- **Seeds** — the seed bank (`src/data/seeds.json`): family-grouped collapsible
  rows, sow-now / harvest-now filters, plain-English sowing method, and
  **📷 Scan packet** — a Claude vision call pre-fills the form from a photo
  (needs an Anthropic API key, stored on-device like the GitHub token;
  fractions of a penny per scan).
- **Plans** — the season timeline (`src/data/plans.json`): every bed across 18
  months, actual occupancy vs painted plans, back-propagated sow-by reminders,
  plus next-season rotation suggestions.
- **Nursery** (kept off the nav; Pipeline supersedes it) and **Projects**
  (`src/data/projects.json`).

## Roadmap

- [x] Interactive plot map (view + edit/add areas)
- [x] Per-area photo timeline, crop-tagged photos, greenhouse journal
- [x] Calendar with diary logging, weather, and day cards
- [x] Seed bank → nursery → pipeline with adaptive dates
- [x] Rainfall + watering nudge
- [x] Seed-packet photo scanning
- [x] Per-bed crop counts with collars/condition + urgency headlines
- [x] Visual season planner with rotation suggestions
- [ ] Draggable plan bars on the season timeline (v1 is tap-to-edit)
- [ ] Inline editing inside the plant sheet
- [ ] Companion-planting suggestions
