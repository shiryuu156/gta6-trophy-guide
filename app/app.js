// Leonida Trophy Guide — tracker state, checklist rendering, filters, counters,
// notes, export/import, spoiler mode, dark theme, and hash-routed views.
// All progress lives in localStorage; nothing leaves the browser.
import { ROADMAP_STEPS, renderRoadmapList, pickNextUp } from './roadmap.js';

const STORE_KEY = 'leonida-trophy-guide-v1';
const $ = (id) => document.getElementById(id);

const DEMO_STATE = {
  earned: [2, 3, 4, 8, 9, 10, 15, 16, 21, 32, 44, 46, 55],
  notes: { 15: 'Best spot so far: the highway jumps north of Vice City.' },
  counts: { 15: 87, 32: 21, 35: 41 },
  spoiler: false,
  theme: 'light',
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved && Array.isArray(saved.earned)) return saved;
  } catch { /* fall through to a fresh state */ }
  if (new URLSearchParams(location.search).has('demo')) return structuredClone(DEMO_STATE);
  return { earned: [], notes: {}, counts: {}, spoiler: false, theme: 'light' };
}

const state = loadState();
const earned = new Set(state.earned);
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));

function save() {
  state.earned = [...earned];
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme === 'dark' ? 'dark' : 'light';
  $('themeToggle').checked = state.theme === 'dark';
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function spoilerHidden(t) {
  return state.spoiler && t.kind === 'story' && !earned.has(t.id);
}

function createTrophyCard(t, { showGuide = true } = {}) {
  const li = document.createElement('li');
  li.className = 'trophy' + (earned.has(t.id) ? ' earned' : '');
  li.id = `trophy-${t.id}`;
  const hidden = spoilerHidden(t);

  const head = document.createElement('div');
  head.className = 'trophy-head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.id);
  box.setAttribute('aria-label', `Mark ${t.name} earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.id);
    else earned.delete(t.id);
    save();
    renderAll();
  });
  const title = document.createElement('div');
  title.className = 'trophy-title';
  const name = document.createElement('p');
  name.className = 'trophy-name';
  name.textContent = hidden ? `Hidden story trophy #${t.id}` : t.name;
  if (hidden) name.classList.add('spoiler-hidden');
  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  desc.textContent = hidden ? 'Spoiler-safe mode hides this story trophy until you earn it.' : t.description;
  const chips = document.createElement('div');
  chips.className = 'chips';
  const gradeChip = document.createElement('span');
  gradeChip.className = `chip ${t.grade}`;
  gradeChip.textContent = gradeLabel(t.grade);
  chips.append(gradeChip);
  if (t.kind !== t.grade) {
    const kindChip = document.createElement('span');
    kindChip.className = 'chip kind';
    kindChip.textContent = t.kind;
    chips.append(kindChip);
  }
  if (t.missable) {
    const m = document.createElement('span');
    m.className = 'chip missable';
    m.textContent = 'Missable?';
    m.title = 'Inferred from the description only — not verified in-game yet.';
    chips.append(m);
  }
  if (earned.has(t.id)) {
    const e = document.createElement('span');
    e.className = 'chip earned-chip';
    e.textContent = 'Earned';
    chips.append(e);
  }
  title.append(name, desc, chips);
  const chevron = document.createElement('span');
  chevron.className = 'chevron';
  chevron.textContent = '▸';
  head.append(box, title, chevron);
  li.append(head);

  if (showGuide && !hidden) {
    const body = document.createElement('div');
    body.className = 'trophy-body';
    body.hidden = true;
    const guideTitle = document.createElement('h4');
    guideTitle.textContent = 'Guide';
    const guideText = document.createElement('p');
    guideText.className = 'guide-text';
    guideText.textContent = t.guide;
    const sources = document.createElement('p');
    sources.className = 'sources';
    sources.textContent = `Sources: ${t.sources}`;
    body.append(guideTitle, guideText, sources);

    if (t.count) {
      const counter = document.createElement('div');
      counter.className = 'counter';
      const minus = document.createElement('button');
      minus.type = 'button';
      minus.textContent = '−';
      minus.setAttribute('aria-label', 'Decrease count');
      const value = document.createElement('span');
      value.className = 'count-value';
      const progress = document.createElement('progress');
      progress.max = t.count;
      const plus = document.createElement('button');
      plus.type = 'button';
      plus.textContent = '+';
      plus.setAttribute('aria-label', 'Increase count');
      const update = () => {
        const n = state.counts[t.id] || 0;
        value.textContent = `${n.toLocaleString()} / ${t.count.toLocaleString()} ${t.countUnit}`;
        progress.value = n;
      };
      minus.addEventListener('click', (e) => {
        e.stopPropagation();
        state.counts[t.id] = Math.max(0, (state.counts[t.id] || 0) - 1);
        save();
        update();
      });
      plus.addEventListener('click', (e) => {
        e.stopPropagation();
        state.counts[t.id] = Math.min(t.count, (state.counts[t.id] || 0) + 1);
        save();
        update();
      });
      update();
      counter.append(minus, value, progress, plus);
      body.append(counter);
    }

    const note = document.createElement('textarea');
    note.className = 'note-field';
    note.rows = 2;
    note.placeholder = 'Your own note for this trophy… (saved in your browser)';
    note.value = state.notes[t.id] || '';
    note.addEventListener('input', () => {
      if (note.value.trim()) state.notes[t.id] = note.value;
      else delete state.notes[t.id];
      save();
    });
    note.addEventListener('click', (e) => e.stopPropagation());
    body.append(note);

    head.addEventListener('click', (e) => {
      if (e.target === box) return;
      body.hidden = !body.hidden;
      chevron.textContent = body.hidden ? '▸' : '▾';
    });
    li.append(body);
    li._toggleGuide = () => {
      if (body.hidden) head.click();
    };
  }
  return li;
}

function filteredTrophies() {
  const q = $('search').value.trim().toLowerCase();
  const grade = $('gradeFilter').value;
  const kind = $('kindFilter').value;
  const status = $('statusFilter').value;
  return trophies.filter((t) => {
    if (q && !(t.name + ' ' + t.description).toLowerCase().includes(q)) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (kind !== 'all' && t.kind !== kind) return false;
    if (status === 'earned' && !earned.has(t.id)) return false;
    if (status === 'unearned' && earned.has(t.id)) return false;
    if (status === 'missable' && !t.missable) return false;
    return true;
  });
}

function renderProgress() {
  const total = trophies.length;
  $('earnedCount').textContent = earned.size;
  $('barFill').style.width = `${(earned.size / total) * 100}%`;
  const byGrade = {};
  for (const t of trophies) {
    byGrade[t.grade] = byGrade[t.grade] || { got: 0, total: 0 };
    byGrade[t.grade].total += 1;
    if (earned.has(t.id)) byGrade[t.grade].got += 1;
  }
  $('gradeCounts').textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${byGrade[g].got}/${byGrade[g].total} ${g}`)
    .join(' · ');
  const next = pickNextUp(trophies, earned)[0];
  $('nextHint').textContent = next ? `Next up: ${next.name}` : 'All 55 earned — Leonida Legend!';
}

function renderChecklist() {
  const list = filteredTrophies();
  $('trophyList').replaceChildren(...list.map((t) => createTrophyCard(t)));
  $('countLine').textContent = `Showing ${list.length} of ${trophies.length} trophies`;
}

function renderMissables() {
  const list = trophies.filter((t) => t.missable);
  $('missableList').replaceChildren(...list.map((t) => createTrophyCard(t)));
}

function renderNextUp() {
  const list = pickNextUp(trophies, earned);
  $('nextUpList').replaceChildren(...list.map((t) => createTrophyCard(t)));
}

function renderAll() {
  renderProgress();
  renderChecklist();
  renderMissables();
  renderNextUp();
  renderRoadmapList($('roadmapList'), trophies, earned);
}

const VIEWS = ['checklist', 'roadmap', 'missables', 'nextup'];

function route() {
  const hash = location.hash.replace('#', '');
  const trophyMatch = hash.match(/^trophy-(\d+)$/);
  let view = VIEWS.includes(hash) ? hash : 'checklist';
  if (trophyMatch) view = 'checklist';
  for (const v of VIEWS) {
    $(`view-${v}`).classList.toggle('hidden', v !== view);
    document.querySelector(`[data-view="${v}"]`).classList.toggle('active', v === view);
  }
  if (trophyMatch) {
    const card = $(`trophy-${trophyMatch[1]}`);
    if (card) {
      card.scrollIntoView({ block: 'center' });
      card._toggleGuide?.();
    }
  }
}

function populateKindFilter() {
  const kinds = [...new Set(trophies.map((t) => t.kind))].sort();
  for (const k of kinds) {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k.charAt(0).toUpperCase() + k.slice(1);
    $('kindFilter').append(opt);
  }
}

$('search').addEventListener('input', renderChecklist);
$('gradeFilter').addEventListener('change', renderChecklist);
$('kindFilter').addEventListener('change', renderChecklist);
$('statusFilter').addEventListener('change', renderChecklist);
$('spoilerToggle').addEventListener('change', (e) => {
  state.spoiler = e.target.checked;
  save();
  renderAll();
});
$('themeToggle').addEventListener('change', (e) => {
  state.theme = e.target.checked ? 'dark' : 'light';
  save();
  applyTheme();
});
$('exportBtn').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  a.download = 'leonida-trophy-progress.json';
  a.click();
});
$('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.earned)) throw new Error('no earned list');
    state.earned = data.earned.filter((id) => byId.has(id));
    state.notes = data.notes || {};
    state.counts = data.counts || {};
    state.spoiler = !!data.spoiler;
    state.theme = data.theme === 'dark' ? 'dark' : 'light';
    earned.clear();
    for (const id of state.earned) earned.add(id);
    save();
    $('spoilerToggle').checked = state.spoiler;
    applyTheme();
    renderAll();
  } catch {
    alert('That file is not a Leonida Trophy Guide progress export.');
  }
  e.target.value = '';
});
$('resetBtn').addEventListener('click', () => {
  if (!confirm('Reset all progress, notes and counters? This cannot be undone.')) return;
  earned.clear();
  state.notes = {};
  state.counts = {};
  save();
  renderAll();
});
window.addEventListener('hashchange', route);

populateKindFilter();
$('spoilerToggle').checked = state.spoiler;
applyTheme();
renderAll();
route();
