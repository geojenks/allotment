// Single source of truth for the allotment.
//
// The whole site is built from this one shape of data, viewed three ways:
//   - spatially   -> the interactive plot map (uses `Area.shape`)
//   - chronologically -> a calendar (uses `Task` + planting harvest windows)  [future]
//   - per area    -> a timeline (uses `Area.timeline`)                          [future]
//
// Crop rotation help is computable later because every `Planting` records a
// `family` and a `year`, so we can warn when the same family returns to a bed
// too soon.

/** Botanical family — the unit that matters for crop rotation. */
export type CropFamily =
  | 'brassica' // cabbage, kale, PSB, sprouts, swede, turnip, radish
  | 'legume' // peas, beans
  | 'allium' // onion, garlic, leek, shallot
  | 'solanaceae' // potato, tomato, pepper, aubergine
  | 'apiaceae' // carrot, parsnip, celery, celeriac, fennel
  | 'cucurbit' // squash, courgette, cucumber, pumpkin
  | 'chenopod' // beetroot, chard, spinach
  | 'asparagus' // perennial — not rotated
  | 'cane-fruit' // raspberry, blackberry — perennial
  | 'bush-fruit' // currants, gooseberry — perennial
  | 'tree-fruit' // apple, pear, plum, cherry, peach — perennial
  | 'rhubarb' // perennial
  | 'flower'
  | 'other';

/** Where a planting is in its life this season. */
export type PlantingStatus =
  | 'planned' // intend to grow here
  | 'sown' // seed in the ground / in modules
  | 'growing' // established and growing
  | 'harvesting' // producing now
  | 'done' // finished / cleared
  | 'volunteer'; // self-seeded, not deliberately planted

export interface Planting {
  crop: string; // e.g. "Purple sprouting broccoli"
  variety?: string; // e.g. "Rudolph"
  family: CropFamily;
  year: number; // season this planting belongs to
  status: PlantingStatus;
  sown?: string; // ISO date
  planted?: string; // ISO date (transplanted out)
  harvestFrom?: string; // ISO date — start of expected harvest window
  harvestTo?: string; // ISO date — end of expected harvest window
  notes?: string;
}

export interface AreaPhoto {
  src: string; // path under public/, e.g. "photos/bed-asparagus/2026-06-28-ph123.jpg"
  w?: number;
  h?: number;
}

/**
 * A dated entry in an area's timeline. `photo` events carry an image; `note`
 * and `milestone` events are text (e.g. "made this bed", "resized", "cleared").
 * The scrubber shows the most recent `photo` on or before the chosen date.
 */
export interface AreaEvent {
  id: string;
  date: string; // ISO date (YYYY-MM-DD)
  kind: 'photo' | 'note' | 'milestone';
  text?: string;
  photo?: AreaPhoto;
}

/** Category of a dated job — drives the colour on the calendar. */
export type JobCategory = 'sow' | 'plant' | 'harvest' | 'prune' | 'water' | 'build' | 'job';

export interface PlotTask {
  title: string; // e.g. "Net the PSB against pigeons"
  category?: JobCategory; // defaults to 'job'
  due?: string; // ISO date (a specific day)
  windowFrom?: string; // ISO date — or a window instead of a single day
  windowTo?: string;
  done?: boolean;
  notes?: string;
}

/** What kind of thing an area is — drives its colour on the map. */
export type AreaType =
  | 'bed'
  | 'tree'
  | 'bushes'
  | 'structure'
  | 'water'
  | 'wild'
  | 'unused'
  | 'boundary';

/**
 * A rectangle on the plot, in the SAME coordinate space as the source
 * Inkscape overlay (figures/plot_overlay.svg). Numbers are millimetres in the
 * layer coordinate system (before the layer translate is applied), so they
 * line up exactly over the aerial photo with no conversion.
 */
export interface AreaShape {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Area {
  id: string; // stable slug, e.g. "bed-asparagus"
  name: string;
  type: AreaType;
  shape: AreaShape;
  /** Provisional names/positions I guessed from your description — set false once confirmed. */
  provisional?: boolean;
  created?: string; // ISO date the area was made — start of its timeline
  removed?: string; // ISO date it was cleared/removed, if it no longer exists
  notes?: string;
  plantings?: Planting[];
  events?: AreaEvent[]; // dated timeline: photos, notes, milestones
  tasks?: PlotTask[];
}

/**
 * A plant icon dropped on the map. Position is in the same coordinate space as
 * `AreaShape` (millimetres in the source overlay's layer space), and `r` is the
 * radius of its footprint / spread in those same units.
 */
export interface PlantMarker {
  id: string;
  icon: string; // emoji used as the marker glyph
  label?: string;
  x: number;
  y: number;
  r: number;
  family?: CropFamily;
  year?: number;
}

/** The whole plot file: src/data/areas.json. */
export interface PlotData {
  scaleMmPerMetre?: number;
  areas: Area[];
  markers?: PlantMarker[];
}

/** A month window, 1 = January … 12 = December. Wraps if from > to (e.g. Nov→Feb). */
export interface MonthWindow {
  from: number;
  to: number;
}

/** A seed packet in the seed bank — the catalogue + advisory sowing windows. */
export interface Seed {
  id: string;
  crop: string;
  variety?: string;
  family: CropFamily;
  sowIndoors?: MonthWindow; // "sow under glass"
  sowOutdoors?: MonthWindow; // "sow direct"
  harvest?: MonthWindow;
  spacing?: string;
  depth?: string;
  supplier?: string;
  inStock?: boolean;
  /** Typical weeks from sowing under glass to plant-out; falls back to a per-family default. */
  nurseryWeeks?: number;
  notes?: string;
}

export type NurseryLocation = 'greenhouse' | 'polytunnel' | 'nursery' | 'windowsill' | 'outdoor';

/** Stages a sowing passes through. A 'planted-out' sowing has left the nursery. */
export type SowingStage =
  | 'sown'
  | 'germinated'
  | 'potted-on'
  | 'hardening-off'
  | 'planted-out'
  | 'failed';

/**
 * An actual sowing instance. Recording one is what puts it on the real calendar
 * (as opposed to the advisory packet windows). Under-glass sowings live in the
 * nursery until 'planted-out', when they (optionally) link to an allotment area.
 */
export interface Sowing {
  id: string;
  seedId?: string; // links back to the seed-bank packet
  crop: string;
  variety?: string;
  family: CropFamily;
  sownDate: string; // ISO date
  location: NurseryLocation;
  underGlass: boolean; // started under cover (nursery) vs sown direct
  stage: SowingStage;
  qty?: number; // how many modules/plants in this sowing
  destinationAreaId?: string; // target allotment area, if any
  plantedOutDate?: string; // ISO date
  /** True for sowings that fruit where they are (e.g. greenhouse tomatoes) — no plant-out step. */
  noPlantOut?: boolean;
  /**
   * Pipeline overrides. When unset these are predicted ADAPTIVELY from the
   * actual sownDate (not the packet's advisory calendar), so sowing a month
   * late shifts every downstream date a month. Set explicitly to pin a date.
   */
  expectedPlantOut?: string; // ISO date
  expectedHarvestFrom?: string; // ISO date
  notes?: string;
}

/** The whole seeds file: src/data/seeds.json. */
export interface SeedData {
  seeds: Seed[];
  sowings: Sowing[];
}
