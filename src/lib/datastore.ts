// Shared browser-side helpers for the editable JSON data files (seeds, nursery).
// The map (PlotMap.astro) has its own inline copy of the commit logic; these
// power the Seeds and Nursery pages.

export const REPO = { owner: 'geojenks', name: 'allotment', branch: 'main' };

/** Thingwall Park allotments, Fishponds, Bristol — for weather lookups. */
export const PLOT_LOCATION = { lat: 51.476, lon: -2.542 };
const GH_API = `https://api.github.com/repos/${REPO.owner}/${REPO.name}`;
const TOKEN_KEY = 'allotment:gh-token';

export type CommitFile = { path: string; text?: string; base64?: string };

export async function getToken(): Promise<string | null> {
  let t = localStorage.getItem(TOKEN_KEY);
  if (!t) {
    t = prompt(
      'Paste a GitHub token to publish.\n\nCreate a fine-grained token (github.com → Settings → Developer settings → Fine-grained tokens) limited to the "allotment" repo, with Contents: Read and write. Stored only on this device.'
    );
    if (!t) return null;
    localStorage.setItem(TOKEN_KEY, t.trim());
  }
  return t.trim();
}

/** One atomic commit for any number of files, via the git data API. */
export async function commitFiles(token: string, files: CommitFile[], message: string) {
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
  const refRes = await fetch(`${GH_API}/git/ref/heads/${REPO.branch}`, { headers });
  if (refRes.status === 401) { localStorage.removeItem(TOKEN_KEY); throw new Error('auth'); }
  if (!refRes.ok) throw new Error('ref ' + refRes.status);
  const commitSha = (await refRes.json()).object.sha;
  const baseCommit = await (await fetch(`${GH_API}/git/commits/${commitSha}`, { headers })).json();
  const tree: any[] = [];
  for (const f of files) {
    if (f.base64 != null) {
      const br = await fetch(`${GH_API}/git/blobs`, { method: 'POST', headers, body: JSON.stringify({ content: f.base64, encoding: 'base64' }) });
      if (!br.ok) throw new Error('blob ' + br.status);
      tree.push({ path: f.path, mode: '100644', type: 'blob', sha: (await br.json()).sha });
    } else tree.push({ path: f.path, mode: '100644', type: 'blob', content: f.text });
  }
  const nt = await (await fetch(`${GH_API}/git/trees`, { method: 'POST', headers, body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree }) })).json();
  const nc = await (await fetch(`${GH_API}/git/commits`, { method: 'POST', headers, body: JSON.stringify({ message, tree: nt.sha, parents: [commitSha] }) })).json();
  const upd = await fetch(`${GH_API}/git/refs/heads/${REPO.branch}`, { method: 'PATCH', headers, body: JSON.stringify({ sha: nc.sha }) });
  if (upd.status === 401 || upd.status === 403) { localStorage.removeItem(TOKEN_KEY); throw new Error('auth'); }
  if (!upd.ok) throw new Error('ref-update ' + upd.status);
}

/** localStorage overlay so edits survive refreshes before they're published. */
export function overlayLoad<T>(key: string, fileData: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return structuredClone(fileData);
}
export function overlaySave(key: string, data: unknown) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}
export function overlayClear(key: string) {
  localStorage.removeItem(key);
}

export const uid = (p: string) => p + Math.random().toString(36).slice(2, 8);
export const todayStr = () => new Date().toISOString().slice(0, 10);

// ---- Anthropic API key (for the seed-packet scanner) -----------------------
const ANTHROPIC_KEY = 'allotment:anthropic-key';
export function getAnthropicKey(): string | null {
  let k = localStorage.getItem(ANTHROPIC_KEY);
  if (!k) {
    k = prompt(
      'Paste an Anthropic API key to scan seed packets.\n\nCreate one at console.anthropic.com → API keys. Stored only on this device; each scan costs a fraction of a penny.'
    );
    if (!k) return null;
    localStorage.setItem(ANTHROPIC_KEY, k.trim());
  }
  return k.trim();
}
export function clearAnthropicKey() {
  localStorage.removeItem(ANTHROPIC_KEY);
}

/** Downscale + JPEG-encode an image file, returning base64 (without the data: prefix). */
export function compressImage(file: File, max = 1568, q = 0.85): Promise<string> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * s);
      c.height = Math.round(img.naturalHeight * s);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', q).split(',')[1]);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('could not read image')); };
    img.src = url;
  });
}

/**
 * Astro scopes `<style>` to `data-astro-cid-*` attributes it stamps on elements
 * at build time — but elements we create in client JS don't get them, so scoped
 * styles miss. Pass a static element from the page (which DOES carry the attr) to
 * get a stamper that applies the same attribute to a dynamic subtree.
 */
export function scopeStamp(staticEl: Element | null) {
  const cid = staticEl
    ? Array.from(staticEl.attributes).map((a) => a.name).find((n) => n.startsWith('data-astro-cid-'))
    : null;
  return (root: Element | null) => {
    if (!cid || !root) return root;
    root.setAttribute(cid, '');
    root.querySelectorAll('*').forEach((n) => n.setAttribute(cid, ''));
    return root;
  };
}
