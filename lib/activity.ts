import { box } from "./crypto";
import { tx, type Db } from "./db";
import { now } from "./time";

export type Kind = "giftee" | "santa" | "group" | "ideas";

type Sealed = { lastSeenAt: string | null; lastDigestAt: string | null };

function readActivity(db: Db, participantId: number): Sealed {
  const raw = db
    .prepare("SELECT activity_enc FROM participant WHERE id = ?")
    .pluck()
    .get(participantId) as string | null | undefined;
  return raw ? box().open<Sealed>(raw) : { lastSeenAt: null, lastDigestAt: null };
}

function writeActivity(db: Db, participantId: number, change: Partial<Sealed>): void {
  tx(db, () => {
    const next = { ...readActivity(db, participantId), ...change };
    db.prepare("UPDATE participant SET activity_enc = ? WHERE id = ?").run(
      box().seal(next),
      participantId,
    );
  });
}

const toDate = (iso: string | null) => (iso ? new Date(iso) : null);

export function getActivity(
  db: Db,
  participantId: number,
): { lastSeenAt: Date | null; lastDigestAt: Date | null } {
  const a = readActivity(db, participantId);
  return { lastSeenAt: toDate(a.lastSeenAt), lastDigestAt: toDate(a.lastDigestAt) };
}

export function touchSeen(db: Db, participantId: number, at: Date = now()): void {
  writeActivity(db, participantId, { lastSeenAt: at.toISOString() });
}

export function markDigestSent(db: Db, participantId: number, at: Date = now()): void {
  writeActivity(db, participantId, { lastDigestAt: at.toISOString() });
}

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
