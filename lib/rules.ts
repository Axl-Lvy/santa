import { tx, type Db } from "./db";
import { ImpossibleDrawError, LockedError, ValidationError } from "./errors";
import { isDrawn } from "./event";
import { isDrawPossible, type Rule } from "./solver";

const ordered = (a: number, b: number): [number, number] => (a < b ? [a, b] : [b, a]);

export function listRules(db: Db): Rule[] {
  return (db.prepare("SELECT a_id, b_id FROM pair_rule ORDER BY a_id, b_id").all() as { a_id: number; b_id: number }[]).map(
    (r) => [r.a_id, r.b_id] as const,
  );
}

/** Adds "a and b are never each other's Santa"; refused when no draw would remain. */
export function addRule(db: Db, a: number, b: number): void {
  tx(db, () => {
    if (isDrawn(db)) throw new LockedError();
    if (a === b) throw new ValidationError("Choisis deux personnes différentes.");
    const [lo, hi] = ordered(a, b);
    const rules = listRules(db);
    if (rules.some(([x, y]) => x === lo && y === hi)) return;
    const ids = db.prepare("SELECT id FROM participant").pluck().all() as number[];
    if (!isDrawPossible(ids, [...rules, [lo, hi]])) throw new ImpossibleDrawError();
    db.prepare("INSERT INTO pair_rule (a_id, b_id) VALUES (?, ?)").run(lo, hi);
  });
}

export function removeRule(db: Db, a: number, b: number): void {
  tx(db, () => {
    if (isDrawn(db)) throw new LockedError();
    db.prepare("DELETE FROM pair_rule WHERE a_id = ? AND b_id = ?").run(...ordered(a, b));
  });
}
