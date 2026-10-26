import type { Db } from "./db";
import { resolveParticipant } from "./identity";
import { listRules } from "./rules";
import { isDrawPossible, possibleSantas } from "./solver";

/** The two live checks shown before the draw. */
export function adminChecks(
  db: Db,
  adminEmail: string,
): { drawPossible: boolean; mystery: { count: number; warn: boolean } | null } {
  const ids = db.prepare("SELECT id FROM participant").pluck().all() as number[];
  const rules = listRules(db);
  const admin = resolveParticipant(db, adminEmail);
  const count = admin ? possibleSantas(admin.id, ids, rules).length : null;
  return {
    drawPossible: isDrawPossible(ids, rules),
    mystery: count === null ? null : { count, warn: count <= 2 },
  };
}
