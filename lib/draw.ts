import { saveAssignment } from "./assignment";
import { tx, type Db } from "./db";
import { AlreadyDrawnError } from "./errors";
import { isDrawn } from "./event";
import { sendDrawEmails } from "./mail/draw-emails";
import { notifyAll } from "./notify";
import { listRules } from "./rules";
import { drawAssignment } from "./solver";
import { now } from "./time";

/** Draws once, stores it sealed, then notifies everyone and mails them in the background. */
export function runDraw(db: Db, at: Date = now(), randomInt?: (max: number) => number): void {
  tx(db, () => {
    if (isDrawn(db)) throw new AlreadyDrawnError();
    const ids = db.prepare("SELECT id FROM participant").pluck().all() as number[];
    saveAssignment(db, drawAssignment(ids, listRules(db), randomInt));
    db.prepare("UPDATE event SET drawn_at = ? WHERE id = 1").run(at.toISOString());
  });
  notifyAll(db, "draw");
  void sendDrawEmails(db);
}
