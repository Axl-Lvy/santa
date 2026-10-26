import type { Db } from "./db";
import { ValidationError } from "./errors";

export function getEvent(db: Db): { budgetEur: number | null; drawnAt: string | null } {
  const row = db.prepare("SELECT budget_eur, drawn_at FROM event WHERE id = 1").get() as {
    budget_eur: number | null;
    drawn_at: string | null;
  };
  return { budgetEur: row.budget_eur, drawnAt: row.drawn_at };
}

export function isDrawn(db: Db): boolean {
  return getEvent(db).drawnAt !== null;
}

/** Sets the budget in whole euros (0–1,000), or clears it. */
export function setBudget(db: Db, eur: number | null): void {
  if (eur !== null && (!Number.isInteger(eur) || eur < 0 || eur > 1000)) {
    throw new ValidationError("Le budget doit être un nombre entier d'euros entre 0 et 1000.");
  }
  db.prepare("UPDATE event SET budget_eur = ? WHERE id = 1").run(eur);
}
