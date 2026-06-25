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

export interface TimelineEntry {
  date: string; // ISO date
  note: string;
  photos?: string[]; // paths relative to the site base, e.g. "photos/asparagus-2026-06.jpg"
}

export interface PlotTask {
  title: string; // e.g. "Net the PSB against pigeons"
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
  notes?: string;
  plantings?: Planting[];
  timeline?: TimelineEntry[];
  tasks?: PlotTask[];
}
