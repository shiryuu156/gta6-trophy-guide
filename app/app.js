// Leonida Trophy Guide — boot, trophy list, spoiler masks, tabs and wiring.
// The guide is plain static files: it fetches only its own data files, and
// everything else (progress, filters, masks) runs in the browser.
import { KIND_LABELS, difficultyLabel, trophyMatches, sortTrophies } from './filters.js';
import { renderRoadmap } from './roadmap.js';
import {
  loadEarned, saveEarned, clearEarned, downloadProgress,
  readProgressFile, buildShareUrl, parseEarnedParam,
} from './tracker.js';

const params = new URLSearchParams(window.location.search);
const trophiesDoc = await (await fetch('data/trophies.json')).json();
const roadmapDoc = await (await fetch('data/roadmap.json')).json();
const trophies = sortTrophies(trophiesDoc.trophies);
const trophiesById = new Map(trophies.map((t) => [t.id, t]));

let earned = loadEarned();
if (earned.size === 0) {
  const shared = parseEarnedParam();
  if (shared.size > 0) {
    earned = shared;
    saveEarned(earned);
  }
}
let spoilerMasks = params.get('spoiler') !== 'off';
let revealed = new Set();
let openGuideId = params.get('open') ? Number(params.get('open')) : null;

const listEl = document.getElementById('trophyList');
const resultLine = document.getElementById('resultLine');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('gradeFilter');
const kindEl = document.getElementById('kindFilter');
const difficultyEl = document.getElementById('difficultyFilter');
const statusEl = document.getElementById('statusFilter');
const missableEl = document.getElementById('missableOnly');
const spoilerEl = document.getElementById('spoilerToggle');

function currentFilters() {
  return {
    query: searchEl.value.trim(),
    grade: gradeEl.value,
    kind: kindEl.value,
    difficulty: difficultyEl.value,
    status: statusEl.value,
    missableOnly: missableEl.checked,
  };
}

function isMasked(trophy) {
  return spoilerMasks && trophy.hidden && !earned.has(trophy.id) && !revealed.has(trophy.id);
}

function updateProgress() {
  const total = trophies.length;
  const pct = Math.round((earned.size / total) * 100);
  document.getElementById('platinumCount').textContent = `${earned.size} / ${total}`;
  document.getElementById('platinumPct').textContent = earned.size === total
    ? 'Platinum earned — Leonida Legend!'
    : `${pct}% to the platinum`;
  document.getElementById('progressFill').style.width = `${pct}%`;
  const counts = {};
  for (const trophy of trophies) {
    counts[trophy.grade] = counts[trophy.grade] || { earned: 0, total: 0 };
    counts[trophy.grade].total += 1;
    if (earned.has(trophy.id)) counts[trophy.grade].earned += 1;
  }
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map((grade) => {
    const c = counts[grade];
    return `${grade[0].toUpperCase()}${grade.slice(1)} ${c.earned}/${c.total}`;
  });
  const missableDone = trophies.filter((t) => t.missable && earned.has(t.id)).length;
  const missableTotal = trophies.filter((t) => t.missable).length;
  parts.push(`Missable ${missableDone}/${missableTotal}`);
  document.getElementById('tierCounts').textContent = parts.join('  ·  ');
}

function gradeBadge(trophy) {
  const badge = document.createElement('span');
  badge.className = `badge badge-${trophy.grade}`;
  badge.textContent = trophy.grade;
  return badge;
}

function renderGuideBody(card, trophy) {
  const body = document.createElement('div');
  body.className = 'guide-body';
  const text = document.createElement('p');
  text.textContent = trophy.guide;
  body.append(text);
  const stepsTitle = document.createElement('h4');
  stepsTitle.textContent = 'How to do it';
  body.append(stepsTitle);
  const steps = document.createElement('ol');
  for (const step of trophy.steps) {
    const item = document.createElement('li');
    item.textContent = step;
    steps.append(item);
  }
  body.append(steps);
  const sources = document.createElement('p');
  sources.className = 'source-line';
  const label = document.createElement('strong');
  label.textContent = 'Sources: ';
  sources.append(label, document.createTextNode(trophy.sources.join(' · ')));
  body.append(sources);
  return body;
}

function renderTrophyCard(trophy) {
  const card = document.createElement('article');
  card.className = 'trophy-card';
  card.dataset.trophyId = String(trophy.id);
  if (earned.has(trophy.id)) card.classList.add('earned');
  if (trophy.missable) card.classList.add('missable-card');

  const head = document.createElement('div');
  head.className = 'trophy-head';
  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'trophy-check';
  check.checked = earned.has(trophy.id);
  check.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  check.addEventListener('change', () => {
    if (check.checked) earned.add(trophy.id);
    else earned.delete(trophy.id);
    saveEarned(earned);
    renderAll();
  });
  head.append(check);

  const main = document.createElement('div');
  main.className = 'trophy-main';
  const titleRow = document.createElement('div');
  titleRow.className = 'trophy-title-row';
  const name = document.createElement('h3');
  name.className = 'trophy-name';
  if (earned.has(trophy.id)) name.classList.add('earned-name');
  name.textContent = isMasked(trophy) ? 'Hidden story trophy' : trophy.name;
  titleRow.append(name, gradeBadge(trophy));
  if (trophy.missable) {
    const missable = document.createElement('span');
    missable.className = 'badge badge-missable';
    missable.textContent = 'Missable';
    titleRow.append(missable);
  }
  if (trophy.hidden) {
    const hidden = document.createElement('span');
    hidden.className = 'badge badge-hidden';
    hidden.textContent = 'Hidden';
    titleRow.append(hidden);
  }
  const kind = document.createElement('span');
  kind.className = 'badge badge-kind';
  kind.textContent = KIND_LABELS[trophy.kind] ?? trophy.kind;
  if (trophy.kind !== 'platinum') titleRow.append(kind);
  main.append(titleRow);

  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  if (isMasked(trophy)) {
    desc.classList.add('masked');
    desc.textContent = 'Hidden on PlayStation until earned — reveal it to read the official description and guide.';
  } else {
    desc.textContent = trophy.description;
  }
  main.append(desc);

  if (isMasked(trophy)) {
    const reveal = document.createElement('button');
    reveal.type = 'button';
    reveal.className = 'reveal-btn';
    reveal.textContent = 'Reveal this trophy (spoiler)';
    reveal.addEventListener('click', () => {
      revealed.add(trophy.id);
      renderAll();
    });
    main.append(reveal);
  } else {
    const meta = document.createElement('div');
    meta.className = 'trophy-meta';
    const difficulty = document.createElement('span');
    difficulty.append(document.createTextNode('Difficulty '));
    const difficultyValue = document.createElement('strong');
    difficultyValue.textContent = difficultyLabel(trophy.difficulty);
    difficulty.append(difficultyValue);
    const time = document.createElement('span');
    time.append(document.createTextNode('Time '));
    const timeValue = document.createElement('strong');
    timeValue.textContent = trophy.time;
    time.append(timeValue);
    meta.append(difficulty, time);
    main.append(meta);
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'guide-toggle';
    const isOpen = openGuideId === trophy.id;
    toggle.textContent = isOpen ? 'Hide guide' : 'Read guide';
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.addEventListener('click', () => {
      openGuideId = openGuideId === trophy.id ? null : trophy.id;
      renderAll();
    });
    main.append(toggle);
    if (isOpen) main.append(renderGuideBody(card, trophy));
  }

  head.append(main);
  card.append(head);
  return card;
}

function renderList() {
  const filters = currentFilters();
  const visible = trophies.filter((t) => trophyMatches(t, filters, earned));
  resultLine.textContent = `Showing ${visible.length} of ${trophies.length} trophies · ${earned.size} earned`;
  listEl.replaceChildren();
  if (visible.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No trophies match these filters. Clear the search or widen the filters.';
    listEl.append(empty);
    return;
  }
  for (const trophy of visible) listEl.append(renderTrophyCard(trophy));
}

function renderAll() {
  updateProgress();
  renderList();
  renderRoadmap(roadmapDoc, trophiesById, earned);
}

function showView(view) {
  for (const section of document.querySelectorAll('.view')) {
    section.classList.toggle('active', section.id === `view-${view}`);
  }
  for (const tab of document.querySelectorAll('.tab')) {
    tab.classList.toggle('active', tab.dataset.view === view);
  }
}

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => showView(tab.dataset.view));
}
for (const el of [searchEl, gradeEl, kindEl, difficultyEl, statusEl, missableEl]) {
  el.addEventListener('input', renderList);
  el.addEventListener('change', renderList);
}
spoilerEl.checked = spoilerMasks;
spoilerEl.addEventListener('change', () => {
  spoilerMasks = spoilerEl.checked;
  renderList();
});
document.getElementById('exportBtn').addEventListener('click', () => downloadProgress(earned));
document.getElementById('importFile').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    earned = await readProgressFile(file);
    saveEarned(earned);
    renderAll();
  } catch (err) {
    alert(`Could not import that file: ${err.message}`);
  }
  event.target.value = '';
});
document.getElementById('shareBtn').addEventListener('click', async () => {
  const url = buildShareUrl(earned);
  try {
    await navigator.clipboard.writeText(url);
    alert('Share link copied — it carries your earned trophies in its address.');
  } catch {
    prompt('Copy this share link:', url);
  }
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Clear all tracked progress? This cannot be undone. Export first if you want a backup.')) {
    earned = new Set();
    revealed = new Set();
    clearEarned();
    renderAll();
  }
});

// Deep links: ?view=roadmap|about, ?grade=, ?kind=, ?q=, ?open=<id>, ?spoiler=off, ?earned=1,2,3
if (params.get('view') && ['trophies', 'roadmap', 'about'].includes(params.get('view'))) {
  showView(params.get('view'));
}
if (params.get('grade')) gradeEl.value = params.get('grade');
if (params.get('kind')) kindEl.value = params.get('kind');
if (params.get('q')) searchEl.value = params.get('q');
if (params.get('missable') === '1') missableEl.checked = true;
renderAll();
