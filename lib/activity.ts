import { box } from "./crypto";
import type { Db } from "./db";
import { now } from "./time";

export type Kind = "giftee" | "santa" | "group" | "ideas";

export function getLastRead(db: Db, participantId: number, kind: Kind): Date | null {
  const raw = db
    .prepare("SELECT last_read_at_enc FROM read_state WHERE participant_id = ? AND kind = ?")
    .pluck()
    .get(participantId, kind) as string | undefined;
  return raw ? new Date(box().open<string>(raw)) : null;
}

export function markRead(db: Db, participantId: number, kind: Kind, at: Date = now()): void {
  db.prepare(
    `INSERT INTO read_state (participant_id, kind, last_read_at_enc) VALUES (?, ?, ?)
     ON CONFLICT (participant_id, kind) DO UPDATE SET last_read_at_enc = excluded.last_read_at_enc`,
  ).run(participantId, kind, box().seal(at.toISOString()));
}
