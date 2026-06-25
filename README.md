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
- **Edit areas** — drag an area to move it, drag its bottom-right corner to
  resize, **+ Add area** to create one, edit its name/type/notes, then
  **Copy JSON** and paste the result into `src/data/areas.json` to save.
  (Beds move around — this is how you keep the map matching reality.)

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

## Roadmap

- [x] Interactive plot map (view + edit/add areas)
- [ ] Per-area photo timeline
- [ ] Calendar / chronological "what to do when" view
- [ ] Crop-rotation helper (warns when a plant family returns to a bed too soon)
- [ ] Companion-planting suggestions
