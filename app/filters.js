// Filters and search for the trophy list: grade, kind, difficulty, status,
// missable-only, and free text matched against name, description and guide.
export const KIND_LABELS = {
  platinum: 'Platinum',
  story: 'Story',
  side: 'Side mission',
  collectible: 'Collectible',
  activity: 'Activity',
  robbery: 'Robbery',
  completion: '100% completion',
  misc: 'Miscellaneous',
};

export const DIFFICULTY_LABELS = {
  1: 'Easy',
  2: 'Moderate',
  3: 'Hard',
  4: 'Very hard',
  5: 'Long grind',
};

export function difficultyLabel(level) {
  return `${level} · ${DIFFICULTY_LABELS[level] ?? 'Unknown'}`;
}

export function trophyMatches(trophy, filters, earned) {
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.kind !== 'all' && trophy.kind !== filters.kind) return false;
  if (filters.difficulty !== 'all' && String(trophy.difficulty) !== filters.difficulty) return false;
  if (filters.missableOnly && !trophy.missable) return false;
  if (filters.status === 'earned' && !earned.has(trophy.id)) return false;
  if (filters.status === 'unearned' && earned.has(trophy.id)) return false;
  if (filters.query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.steps.join(' ')}`.toLowerCase();
    const words = filters.query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.every((word) => haystack.includes(word))) return false;
  }
  return true;
}

export function sortTrophies(trophies) {
  const gradeOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  return [...trophies].sort((a, b) => (gradeOrder[a.grade] - gradeOrder[b.grade]) || (a.id - b.id));
}
