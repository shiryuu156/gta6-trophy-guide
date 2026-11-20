// Roadmap view: the three phases to the platinum, each with its steps and
// the trophies it earns, plus the warnings that keep a run from going wrong.
export function renderRoadmap(roadmap, trophiesById, earned) {
  document.getElementById('roadmapSummary').textContent = roadmap.summary;

  const warningsBox = document.getElementById('roadmapWarnings');
  warningsBox.replaceChildren();
  const warningsTitle = document.createElement('h3');
  warningsTitle.textContent = 'Watch out before you start';
  warningsBox.append(warningsTitle);
  const warningsList = document.createElement('ul');
  for (const warning of roadmap.warnings) {
    const item = document.createElement('li');
    item.textContent = warning;
    warningsList.append(item);
  }
  warningsBox.append(warningsList);

  const phasesEl = document.getElementById('phases');
  phasesEl.replaceChildren();
  for (const phase of roadmap.phases) {
    const card = document.createElement('article');
    card.className = 'phase-card';

    const heading = document.createElement('h3');
    heading.textContent = `Phase ${phase.phase}: ${phase.name}`;
    card.append(heading);

    const meta = document.createElement('p');
    meta.className = 'phase-meta';
    const doneCount = phase.trophies.filter((id) => earned.has(id)).length;
    meta.textContent = `${phase.time} · ${doneCount} of ${phase.trophies.length} phase trophies earned`;
    card.append(meta);

    const goal = document.createElement('p');
    goal.className = 'phase-goal';
    goal.textContent = phase.goal;
    card.append(goal);

    const steps = document.createElement('ol');
    for (const step of phase.steps) {
      const item = document.createElement('li');
      item.textContent = step;
      steps.append(item);
    }
    card.append(steps);

    const chips = document.createElement('div');
    chips.className = 'phase-trophies';
    for (const id of phase.trophies) {
      const trophy = trophiesById.get(id);
      if (!trophy) continue;
      const chip = document.createElement('span');
      chip.className = `chip${earned.has(id) ? ' done' : ''}`;
      chip.textContent = `${trophy.grade === 'platinum' ? '◆ ' : ''}${trophy.name}`;
      chips.append(chip);
    }
    card.append(chips);
    phasesEl.append(card);
  }

  const sourcesEl = document.getElementById('roadmapSources');
  sourcesEl.replaceChildren();
  const label = document.createElement('strong');
  label.textContent = 'Roadmap sources: ';
  sourcesEl.append(label, document.createTextNode(roadmap.sources.join(' · ')));
}
