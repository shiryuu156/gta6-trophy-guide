// Roadmap to the Platinum: seven steps in play order, built from the official
// descriptions, plus the Next Up picker (easiest unearned trophies first).

export const ROADMAP_STEPS = [
  {
    n: 1,
    title: 'Story, Chapters 1–2',
    blurb: 'Play the opening of the story. The opening mission, the first two chapters and the early named missions all pop as you go — nothing here needs preparation.',
    ids: [2, 3, 4, 8, 9, 10],
  },
  {
    n: 2,
    title: 'Story, Chapters 3–4 and the finale',
    blurb: 'Finish the story: Chapters 3 and 4, the late named missions and the final mission (gold). While you are at VCIA for the takedown, try Catch Me If You Can — and keep an eye out for the vague one-time moments Personal Best and Bad Luck, I Guess.',
    ids: [5, 6, 7, 11, 12, 13, 37, 47, 49],
  },
  {
    n: 3,
    title: 'Stranger strands',
    blurb: 'Work every stranger and contact strand to its final mission: Andy, Kenton, Billy, Randy, Tyrone and Bret, plus two more strangers across the state. The eighth finished strand pops Strangers & Freaks (silver).',
    ids: [22, 23, 24, 25, 26, 27, 29],
  },
  {
    n: 4,
    title: 'Activities and challenges',
    blurb: 'The activity sweep: stunts, races, drone races, the shooting range, fishing, arcade, bowling, meditation-adjacent challenges and the cocktail on Ocean Beach. The 42 gold shooting-range medals are the skill gate — leave a session for them.',
    ids: [15, 16, 17, 18, 19, 20, 21, 32, 44, 46, 48],
  },
  {
    n: 5,
    title: 'Collectibles and exploration',
    blurb: 'Sweep the state: all 52 areas, 18 meditation spots, 100 WAiNK locations, 100 vehicles, 3 card sets, 10 Scooter Bros registrations and all 8 garages. Fold the WAiNK and vehicle counts into the same sweep.',
    ids: [28, 30, 31, 35, 42, 50, 54, 55],
  },
  {
    n: 6,
    title: 'Combat, crime and money',
    blurb: 'The crime sweep: robberies, vaults, armored trucks, gang operations, Combat Focus, the wanted-level trophies with your partner, and the money trophies — $250,000 laundered, $100,000 spent.',
    ids: [33, 34, 36, 38, 39, 40, 41, 43, 45, 51, 52, 53],
  },
  {
    n: 7,
    title: 'Cleanup: 100% and the Platinum',
    blurb: 'Check the in-game stats page for what the 100% checklist still wants, finish it for A Long Road (gold), and the platinum pops with it.',
    ids: [1, 14],
  },
];

// Renders the seven steps into `el`, each with its own progress and trophy list.
export function renderRoadmapList(el, trophies, earned) {
  const byId = new Map(trophies.map((t) => [t.id, t]));
  el.replaceChildren();
  for (const step of ROADMAP_STEPS) {
    const li = document.createElement('li');
    li.className = 'road-step';
    const done = step.ids.filter((id) => earned.has(id)).length;
    const h3 = document.createElement('h3');
    h3.innerHTML = '';
    const num = document.createElement('span');
    num.className = 'step-num';
    num.textContent = `Step ${step.n} — `;
    h3.append(num, document.createTextNode(step.title));
    const p = document.createElement('p');
    p.textContent = step.blurb;
    const prog = document.createElement('p');
    prog.className = 'step-progress';
    prog.textContent = `${done} of ${step.ids.length} earned in this step`;
    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('div');
    fill.className = 'bar-fill';
    fill.style.width = `${(done / step.ids.length) * 100}%`;
    bar.append(fill);
    const ul = document.createElement('ul');
    for (const id of step.ids) {
      const t = byId.get(id);
      if (!t) continue;
      const item = document.createElement('li');
      if (earned.has(id)) item.className = 'done';
      const link = document.createElement('a');
      link.href = `#trophy-${id}`;
      link.textContent = `${earned.has(id) ? '✓ ' : ''}${t.name} (${t.grade})`;
      item.append(link);
      ul.append(item);
    }
    li.append(h3, p, prog, bar, ul);
    el.append(li);
  }
}

// Easiest unearned trophies first: earliest roadmap step first, then by kind
// (story and activities before the long grinds), the platinum and 100% last.
export function pickNextUp(trophies, earned) {
  const stepOf = new Map();
  for (const step of ROADMAP_STEPS) {
    for (const id of step.ids) stepOf.set(id, step.n);
  }
  const kindRank = { story: 0, activities: 1, side: 2, exploration: 3, collectibles: 4, combat: 5, money: 6, secrets: 7, completion: 8, platinum: 9 };
  return trophies
    .filter((t) => !earned.has(t.id))
    .sort((a, b) => {
      const sa = stepOf.get(a.id) ?? 99;
      const sb = stepOf.get(b.id) ?? 99;
      if (sa !== sb) return sa - sb;
      const ka = kindRank[a.kind] ?? 5;
      const kb = kindRank[b.kind] ?? 5;
      if (ka !== kb) return ka - kb;
      return a.id - b.id;
    });
}
