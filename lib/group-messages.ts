import type { Db } from "./db";
import { ValidationError } from "./errors";
import type { Participant } from "./participants";
import { now } from "./time";

export type GroupMessage = {
  id: number;
  authorId: number | null;
  authorName: string;
  body: string;
  createdAt: string;
};

export const MAX_MESSAGE = 2000;

type Row = {
  id: number;
  author_id: number | null;
  author_name: string;
  body: string;
  created_at: string;
};

const toMessage = (r: Row): GroupMessage => ({
  id: r.id,
  authorId: r.author_id,
  authorName: r.author_name,
  body: r.body,
  createdAt: r.created_at,
});

/** Trims and validates a chat message body. */
export function cleanBody(body: string): string {
  const text = body.trim();
  if (!text) throw new ValidationError("Ton message est vide.");
  if (text.length > MAX_MESSAGE)
    throw new ValidationError("Ton message est trop long (2000 caractères maximum).");
  return text;
}

/** The latest messages, oldest first. */
export function listGroupMessages(db: Db, limit = 200): GroupMessage[] {
  const rows = db
    .prepare("SELECT * FROM (SELECT * FROM group_message ORDER BY id DESC LIMIT ?) ORDER BY id")
    .all(limit) as Row[];
  return rows.map(toMessage);
}

export function postGroupMessage(db: Db, author: Participant, body: string): GroupMessage {
  const text = cleanBody(body);
  const id = Number(
    db
      .prepare(
        "INSERT INTO group_message (author_id, author_name, body, created_at) VALUES (?, ?, ?, ?)",
      )
      .run(author.id, author.firstName, text, now().toISOString()).lastInsertRowid,
  );
  return toMessage(db.prepare("SELECT * FROM group_message WHERE id = ?").get(id) as Row);
}

/** Family chat messages by others created after `since` (all of them when null). */
export function groupMessagesFromOthersSince(
  db: Db,
  meId: number,
  since: Date | null,
): GroupMessage[] {
  const rows = db
    .prepare("SELECT * FROM group_message WHERE author_id IS NOT ? AND created_at > ? ORDER BY id")
    .all(meId, since ? since.toISOString() : "") as Row[];
  return rows.map(toMessage);
}
