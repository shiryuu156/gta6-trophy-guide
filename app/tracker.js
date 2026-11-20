// Progress tracker: earned trophies live in localStorage, and can be
// exported to a JSON file, imported back, or shared as a link that carries
// the earned trophy ids in its address.
export const STORAGE_KEY = 'leonida-trophy-guide-v2-earned';

export function loadEarned() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(ids) ? ids.filter((id) => Number.isInteger(id)) : []);
  } catch {
    return new Set();
  }
}

export function saveEarned(earned) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

export function clearEarned() {
  localStorage.removeItem(STORAGE_KEY);
}

export function downloadProgress(earned) {
  const payload = JSON.stringify({
    app: 'leonida-trophy-guide',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
  }, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gta6-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(url);
}

export async function readProgressFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const ids = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(ids)) throw new Error('That file does not hold trophy progress.');
  const earned = new Set(ids.filter((id) => Number.isInteger(id)));
  if (earned.size === 0 && ids.length > 0) throw new Error('That file holds no valid trophy ids.');
  return earned;
}

export function buildShareUrl(earned) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  if (earned.size > 0) url.searchParams.set('earned', [...earned].sort((a, b) => a - b).join(','));
  return url.toString();
}

export function parseEarnedParam() {
  const raw = new URLSearchParams(window.location.search).get('earned');
  if (!raw) return new Set();
  return new Set(raw.split(',').map((part) => Number(part)).filter((id) => Number.isInteger(id) && id >= 1 && id <= 55));
}
