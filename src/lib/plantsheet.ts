// The "plant sheet": one popup, openable from anywhere a crop is mentioned,
// showing everything about that crop — where it is, its story, its packet —
// with links to the page where each piece is edited.

type Win = { from: number; to: number };
type Seed = { id: string; crop: string; variety?: string; family: string; sowIndoors?: Win; sowOutdoors?: Win; harvest?: Win; spacing?: string; depth?: string; nurseryWeeks?: number };
type Sowing = {
  id: string; seedId?: string; crop: string; variety?: string; family: string; qty?: number;
  sownDate: string; location: string; underGlass: boolean; stage: string; noPlantOut?: boolean;
  destinationAreaId?: string; plantedOutDate?: string; expectedPlantOut?: string; expectedHarvestFrom?: string; notes?: string;
};
type Area = { id: string; name: string; plantings?: { crop: string; family: string; notes?: string }[] };
export type PlantSheetDeps = { seeds: { seeds: Seed[]; sowings: Sowing[] }; areas: Area[]; base: string };

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MON = MONTHS.map((m) => m.slice(0, 3));
const NURSERY_WEEKS: Record<string, number> = { brassica: 6, legume: 3, allium: 9, solanaceae: 8, apiaceae: 5, cucurbit: 4, chenopod: 4, asparagus: 10, other: 6, flower: 6 };
const LOC_LABEL: Record<string, string> = { greenhouse: 'Greenhouse', polytunnel: 'Polytunnel', nursery: 'Nursery bed', windowsill: 'Windowsill', outdoor: 'Outdoors (direct)' };

const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const readyPhrase = (iso: string) => { const d = new Date(iso + 'T00:00:00'); const p = d.getDate() <= 10 ? 'early' : d.getDate() <= 20 ? 'mid' : 'late'; return `${p} ${MONTHS[d.getMonth()]}`; };
const winText = (w?: Win) => (w ? `${MON[w.from - 1]}–${MON[w.to - 1]}` : null);

const CSS = `
#plant-sheet { border: 1px solid #e7e3d8; border-radius: 14px; padding: 0; max-width: 480px; width: 94vw; max-height: 86vh; box-shadow: 0 10px 30px -12px rgba(30,45,25,0.3); }
#plant-sheet::backdrop { background: rgba(20, 28, 18, 0.4); }
#plant-sheet .ps { padding: 1.1rem 1.2rem 1.2rem; display: flex; flex-direction: column; gap: 0.55rem; overflow-y: auto; max-height: 82vh; font-family: inherit; }
#plant-sheet h3 { margin: 0; font-size: 1.2rem; }
#plant-sheet .ps-agg { margin: 0; font-weight: 700; color: #2a5538; background: #e7efe6; border-radius: 8px; padding: 0.5rem 0.65rem; font-size: 0.92rem; }
#plant-sheet .ps-line { font: inherit; text-align: left; cursor: pointer; border: 1px solid #e7e3d8; background: #fff; border-radius: 8px; padding: 0.5rem 0.65rem; font-size: 0.86rem; color: #3c4339; text-decoration: none; display: block; }
#plant-sheet .ps-line:hover { border-color: #356a45; }
#plant-sheet .ps-packet { margin: 0; font-size: 0.84rem; color: #3c4339; background: #f3f1e9; border-radius: 8px; padding: 0.5rem 0.65rem; }
#plant-sheet .ps-links { display: flex; flex-wrap: wrap; gap: 0.7rem; font-size: 0.86rem; }
#plant-sheet .ps-links a { font-weight: 600; color: #2a5538; text-decoration: none; }
#plant-sheet .ps-menu { display: flex; justify-content: flex-end; margin-top: 0.4rem; }
#plant-sheet .ps-close { font: inherit; font-weight: 600; cursor: pointer; border: 1px solid #d8d3c5; background: #fff; padding: 0.4rem 0.9rem; border-radius: 10px; }
#plant-sheet .ps-muted { margin: 0; font-size: 0.85rem; color: #767c70; }
`;

function ensureDialog(): HTMLDialogElement {
  let d = document.getElementById('plant-sheet') as HTMLDialogElement | null;
  if (!d) {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.append(style);
    d = document.createElement('dialog');
    d.id = 'plant-sheet';
    d.addEventListener('click', (e) => { if (e.target === d) d!.close(); });
    document.body.append(d);
  }
  return d;
}

function expHarvest(s: Sowing, seed?: Seed): string {
  if (s.expectedHarvestFrom) return s.expectedHarvestFrom;
  const sowW = seed?.sowIndoors || seed?.sowOutdoors;
  if (seed?.harvest && sowW) return addDays(s.sownDate, Math.round(((seed.harvest.from - sowW.from + 12) % 12) * 30.44));
  return addDays(s.sownDate, 14 * 7);
}
function expPlantOut(s: Sowing, seed?: Seed): string {
  if (s.expectedPlantOut) return s.expectedPlantOut;
  return addDays(s.sownDate, (seed?.nurseryWeeks ?? NURSERY_WEEKS[s.family] ?? 6) * 7);
}

export function openPlantSheet(crop: string, deps: PlantSheetDeps) {
  const { seeds, areas, base } = deps;
  const key = crop.toLowerCase();
  const areaName = (id?: string) => areas.find((a) => a.id === id)?.name;
  const dialog = ensureDialog();
  const wrap = document.createElement('div'); wrap.className = 'ps';

  const h = document.createElement('h3'); h.textContent = crop; wrap.append(h);

  const sowings = (seeds.sowings || []).filter((s) => s.crop.toLowerCase() === key && s.stage !== 'failed');
  const packet = (seeds.seeds || []).find((s) => s.crop.toLowerCase() === key);

  // aggregate: "5 in Greenhouse · 4 in Bed 2"
  if (sowings.length) {
    const byPlace = new Map<string, number>();
    for (const s of sowings) {
      const place = s.stage === 'planted-out'
        ? areaName(s.destinationAreaId) || 'the plot'
        : s.underGlass ? (LOC_LABEL[s.location] || s.location) : areaName(s.destinationAreaId) || 'the plot';
      byPlace.set(place, (byPlace.get(place) || 0) + (s.qty || 1));
    }
    const agg = document.createElement('p'); agg.className = 'ps-agg';
    agg.textContent = [...byPlace.entries()].map(([p, n]) => `${n} in ${p}`).join(' · ');
    wrap.append(agg);
  } else {
    const none = document.createElement('p'); none.className = 'ps-muted';
    none.textContent = 'Nothing of this growing in the pipeline right now.';
    wrap.append(none);
  }

  // each sowing's story → tap through to the pipeline to edit
  const beds = new Set<string>();
  for (const s of sowings) {
    const seed = (seeds.seeds || []).find((x) => x.id === s.seedId) || packet;
    const bits = [`from seed ${fmt(s.sownDate)}`];
    if (s.plantedOutDate) bits.push(`planted out ${fmt(s.plantedOutDate)}${areaName(s.destinationAreaId) ? ' in ' + areaName(s.destinationAreaId) : ''}`);
    else if (s.underGlass && s.noPlantOut) bits.push(`growing on in the ${(LOC_LABEL[s.location] || s.location).toLowerCase()}`);
    else if (s.underGlass) bits.push(`in the ${(LOC_LABEL[s.location] || s.location).toLowerCase()}, plant out ~${fmt(expPlantOut(s, seed))}`);
    else bits.push(`sown direct${areaName(s.destinationAreaId) ? ' in ' + areaName(s.destinationAreaId) : ''}`);
    const eh = expHarvest(s, seed);
    bits.push(new Date(eh + 'T00:00:00') <= new Date() ? 'ready now' : `ready ~${readyPhrase(eh)}`);
    const a = document.createElement('a'); a.className = 'ps-line'; a.href = `${base}/pipeline`;
    a.textContent = `${s.qty ? `×${s.qty} — ` : ''}${bits.join(' · ')}`;
    wrap.append(a);
    if (s.destinationAreaId) beds.add(s.destinationAreaId);
  }
  // plantings recorded directly on beds (trees, perennials)
  for (const area of areas) {
    for (const p of area.plantings || []) {
      if (p.crop.toLowerCase() !== key) continue;
      const a = document.createElement('a'); a.className = 'ps-line'; a.href = `${base}/map#${area.id}`;
      a.textContent = `in ${area.name}${p.notes ? ' — ' + p.notes : ''}`;
      wrap.append(a); beds.add(area.id);
    }
  }

  // the packet, if you have one
  if (packet) {
    const pk = document.createElement('p'); pk.className = 'ps-packet';
    const parts = [
      packet.variety && `‘${packet.variety}’`,
      winText(packet.sowIndoors) && `sow indoors ${winText(packet.sowIndoors)}`,
      winText(packet.sowOutdoors) && `sow direct ${winText(packet.sowOutdoors)}`,
      winText(packet.harvest) && `harvest ${winText(packet.harvest)}`,
      packet.spacing && `spacing ${packet.spacing}`,
    ].filter(Boolean);
    pk.textContent = `🌰 Packet: ${parts.join(' · ')}`;
    wrap.append(pk);
  }

  const links = document.createElement('div'); links.className = 'ps-links';
  const mk = (txt: string, href: string) => { const a = document.createElement('a'); a.href = href; a.textContent = txt; links.append(a); };
  if (sowings.length) mk('Edit in pipeline →', `${base}/pipeline`);
  if (packet) mk('Seed packet →', `${base}/seeds`);
  for (const b of [...beds].slice(0, 3)) mk(`${areaName(b)} →`, `${base}/map#${b}`);
  wrap.append(links);

  const menu = document.createElement('div'); menu.className = 'ps-menu';
  const close = document.createElement('button'); close.type = 'button'; close.className = 'ps-close'; close.textContent = 'Close';
  close.addEventListener('click', () => dialog.close());
  menu.append(close); wrap.append(menu);

  dialog.replaceChildren(wrap);
  if (!dialog.open) dialog.showModal();
}
