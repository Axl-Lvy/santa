import { randomInt as cryptoRandomInt } from "node:crypto";

export type Rule = readonly [number, number];

export const MIN_PARTICIPANTS = 3;
const MAX_SAMPLING_ATTEMPTS = 1_000_000;

export class NoValidDrawError extends Error {
  constructor() {
    super("Aucun tirage n'est possible avec ces règles.");
  }
}

function forbiddenCheck(rules: Rule[]): (giver: number, receiver: number) => boolean {
  const ruled = new Set(rules.map(([a, b]) => (a < b ? `${a}-${b}` : `${b}-${a}`)));
  return (g, r) => g === r || ruled.has(g < r ? `${g}-${r}` : `${r}-${g}`);
}

/** Calls `visit` with each valid assignment (givers in `ids` order); stops when it returns false. */
function search(
  ids: number[],
  forbidden: (g: number, r: number) => boolean,
  visit: (receivers: number[]) => boolean,
): void {
  const receivers: number[] = [];
  const used = new Set<number>();
  const step = (i: number): boolean => {
    if (i === ids.length) return visit(receivers);
    for (const r of ids) {
      if (used.has(r) || forbidden(ids[i], r)) continue;
      used.add(r);
      receivers.push(r);
      const keepGoing = step(i + 1);
      receivers.pop();
      used.delete(r);
      if (!keepGoing) return false;
    }
    return true;
  };
  step(0);
}

function exists(ids: number[], forbidden: (g: number, r: number) => boolean): boolean {
  let found = false;
  search(ids, forbidden, () => {
    found = true;
    return false;
  });
  return found;
}

export function isDrawPossible(ids: number[], rules: Rule[]): boolean {
  return ids.length >= MIN_PARTICIPANTS && exists(ids, forbiddenCheck(rules));
}

/** Ids that give to `target` in at least one valid assignment. */
export function possibleSantas(target: number, ids: number[], rules: Rule[]): number[] {
  if (ids.length < MIN_PARTICIPANTS) return [];
  const forbidden = forbiddenCheck(rules);
  return ids.filter(
    (santa) =>
      !forbidden(santa, target) &&
      exists(ids, (g, r) => forbidden(g, r) || (g === santa) !== (r === target)),
  );
}

/** Picks a giver → receiver map uniformly among the valid assignments. */
export function drawAssignment(
  ids: number[],
  rules: Rule[],
  randomInt: (max: number) => number = cryptoRandomInt,
): Map<number, number> {
  if (!isDrawPossible(ids, rules)) throw new NoValidDrawError();
  const forbidden = forbiddenCheck(rules);
  const toMap = (receivers: number[]) => new Map(ids.map((g, i) => [g, receivers[i]]));

  // Rejection sampling: a uniform shuffle kept only when valid is uniform over valid assignments.
  for (let attempt = 0; attempt < MAX_SAMPLING_ATTEMPTS; attempt++) {
    const receivers = [...ids];
    for (let i = receivers.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
    }
    if (receivers.every((r, i) => !forbidden(ids[i], r))) return toMap(receivers);
  }

  const all: number[][] = [];
  search(ids, forbidden, (receivers) => {
    all.push([...receivers]);
    return true;
  });
  return toMap(all[randomInt(all.length)]);
}
