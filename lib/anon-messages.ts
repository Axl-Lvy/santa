import { randomUUID } from "node:crypto";

import { gifteeOf } from "./assignment";
import { box } from "./crypto";
import type { Db } from "./db";
import { ValidationError } from "./errors";
import { cleanBody } from "./group-messages";
import type { Participant } from "./participants";
import { now } from "./time";

export type AnonMessage = {
  id: string;
  gifteeId: number;
  direction: "from_santa" | "from_giftee";
  body: string;
  createdAt: string;
};

/** Sends to the viewer's giftee (as their Santa) or to the viewer's Santa (as their giftee). */
export function postAnon(
  db: Db,
  sender: Participant,
  to: "giftee" | "santa",
  body: string,
): AnonMessage {
  const giftee = gifteeOf(db, sender.id);
  if (giftee === null) throw new ValidationError("Le tirage n'a pas encore eu lieu.");
  const message: AnonMessage = {
    id: randomUUID(),
    gifteeId: to === "giftee" ? giftee : sender.id,
    direction: to === "giftee" ? "from_santa" : "from_giftee",
    body: cleanBody(body),
    createdAt: now().toISOString(),
  };
  const { id, ...payload } = message;
  // Rows carry no order (WITHOUT ROWID), so a sealed sequence number breaks timestamp ties.
  const seq = db.prepare("SELECT count(*) FROM anon_message").pluck().get() as number;
  db.prepare("INSERT INTO anon_message (id, payload_enc) VALUES (?, ?)").run(
    id,
    box().seal({ ...payload, seq }),
  );
  return message;
}

/** Every message between `gifteeId` and their Santa, oldest first; decrypts all rows in memory. */
export function listAnonThread(db: Db, gifteeId: number): AnonMessage[] {
  const rows = db.prepare("SELECT id, payload_enc FROM anon_message").all() as {
    id: string;
    payload_enc: string;
  }[];
  return rows
    .map((r) => ({
      id: r.id,
      ...box().open<Omit<AnonMessage, "id"> & { seq?: number }>(r.payload_enc),
    }))
    .filter((m) => m.gifteeId === gifteeId)
    .sort((x, y) => x.createdAt.localeCompare(y.createdAt) || (x.seq ?? 0) - (y.seq ?? 0))
    .map(({ id, gifteeId: g, direction, body, createdAt }) => ({
      id,
      gifteeId: g,
      direction,
      body,
      createdAt,
    }));
}
