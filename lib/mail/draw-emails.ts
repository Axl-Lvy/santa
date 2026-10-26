import { getConfig } from "../config";
import type { Db } from "../db";
import { getEvent } from "../event";
import { getParticipant, listParticipants, type Participant } from "../participants";
import { now } from "../time";
import { drawEmail } from "./templates";
import { sendMail, type Mail } from "./transport";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function mailFor(db: Db, p: Participant): Mail {
  return { to: p.email, ...drawEmail({ firstName: p.firstName, budgetEur: getEvent(db).budgetEur, appUrl: getConfig().appUrl }) };
}

function markSent(db: Db, id: number): void {
  db.prepare("UPDATE participant SET draw_email_sent_at = ? WHERE id = ?").run(now().toISOString(), id);
}

/** Mails everyone not mailed yet, retrying after each delay in `delays`. */
export async function sendDrawEmails(
  db: Db,
  send: (m: Mail) => Promise<void> = sendMail,
  delays: number[] = [0, 2000, 10000],
): Promise<void> {
  for (const p of listParticipants(db).filter((x) => x.drawEmailSentAt === null)) {
    for (const delay of delays) {
      if (delay > 0) await sleep(delay);
      try {
        await send(mailFor(db, p));
        markSent(db, p.id);
        break;
      } catch (error) {
        console.error(`santa: draw email failed: ${error instanceof Error ? error.name : "unknown"}`);
      }
    }
  }
}

/** Sends one person's draw email again; throws when it fails. */
export async function resendDrawEmail(db: Db, id: number, send: (m: Mail) => Promise<void> = sendMail): Promise<void> {
  const p = getParticipant(db, id);
  if (!p) return;
  await send(mailFor(db, p));
  markSent(db, p.id);
}
