import type { Db } from "./db";
import { getEvent } from "./event";
import { resolveParticipant } from "./identity";
import { listParticipants } from "./participants";
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

export type AdminStatusRow = { id: number; firstName: string; status: "revealed" | "pending" | "email-not-sent" };

/** After the draw: who has revealed, never who drew whom (privacy rule 7). */
export function adminStatus(db: Db): { drawnAt: string; rows: AdminStatusRow[] } {
  return {
    drawnAt: getEvent(db).drawnAt ?? "",
    rows: listParticipants(db).map((p) => ({
      id: p.id,
      firstName: p.firstName,
      status: p.revealedAt ? "revealed" : p.drawEmailSentAt ? "pending" : "email-not-sent",
    })),
  };
}
