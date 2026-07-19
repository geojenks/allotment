# Allotment

A living plan and journal for the allotment — an interactive map of the plot
where each area shows what's planted, what's planned, and what needs doing.
Built with [Astro](https://astro.build) and deployed to GitHub Pages.

## How it's structured

Everything is driven from **one data file**, [`src/data/areas.json`](src/data/areas.json),
so the same information can be shown spatially (the map), chronologically (a
calendar — coming next), and per-area (a timeline — coming next).

- `src/data/areas.json` — the single source of truth: every area, its position
  on the plot, and its plantings / tasks / notes. The shape coordinates come
  from `figures/plot_overlay.svg` so they sit exactly over the aerial photo.
- `src/lib/types.ts` — the data model (areas, plantings, families, tasks,
  timeline entries), documented inline.
- `src/components/PlotMap.astro` — the interactive map.
- `public/map/plot-base.png` — the aerial background (extracted from your SVG).

## The map

- **View** — tap any numbered area to see its details in the side panel.
- **Zoom in** — select an area then **Zoom in** (or double-click it) to focus on
  that bed. Plant icons only appear at this level.
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
live in ~1 minute. **Note** adds a dated text entry (saved locally until you Save
to website / add a photo).

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

- **Layout** — the interactive plot map (`src/data/areas.json`). Full-screen
  "planting mode" for dropping many plants on a bed from a phone.
- **Pipeline** — every sowing from packet to plate: Seed bank → Nursery →
  Growing on → Harvest, with adaptive expected dates (predicted from your
  *actual* sow date, editable per sowing) and green/amber/red status.
- **Calendar** — agenda derived from plantings, dated tasks, and actual
  sowings, plus real rainfall (past) and rain forecast from Open-Meteo, with a
  "worth a watering trip" banner.
- **Seeds** — the seed bank (`src/data/seeds.json`): packet windows, sow-now /
  harvest-now filters, and **📷 Scan packet** — photograph a seed packet and a
  Claude vision call pre-fills the form (needs an Anthropic API key, stored
  on-device like the GitHub token; ~fractions of a penny per scan).
- **Nursery** — active sowings under glass, stage tracking and plant-out.
- **Plans** — beds free vs planted, rotation reference.
- **Projects** — bigger jobs (`src/data/projects.json`).

## Roadmap

- [x] Interactive plot map (view + edit/add areas)
- [x] Per-area photo timeline
- [x] Calendar / chronological "what to do when" view
- [x] Seed bank → nursery → calendar pipeline
- [x] Pipeline board with adaptive plant-out/harvest predictions
- [x] Rainfall + watering nudge on the calendar
- [x] Seed-packet photo scanning
- [ ] Crop-rotation helper (warns when a plant family returns to a bed too soon)
- [ ] Companion-planting suggestions
