import { box } from "./crypto";
import type { Db } from "./db";
import { ValidationError } from "./errors";
import { now } from "./time";

export type Idea = { id: number; authorId: number; targetId: number; body: string; createdAt: string; updatedAt: string };

type Row = { id: number; author_id: number; target_id: number; body_enc: string; created_at: string; updated_at: string };

const toIdea = (r: Row): Idea => ({
  id: r.id,
  authorId: r.author_id,
  targetId: r.target_id,
  body: box().open<string>(r.body_enc),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

function cleanBody(body: string): string {
  const text = body.trim();
  if (!text) throw new ValidationError("Écris ton idée avant de l'envoyer.");
  if (text.length > 500) throw new ValidationError("Ton idée est un peu longue : 500 caractères maximum.");
  return text;
}

function getOwned(db: Db, authorId: number, id: number): Idea {
  const row = db.prepare("SELECT * FROM idea WHERE id = ?").get(id) as Row | undefined;
  if (!row || row.author_id !== authorId) throw new ValidationError("Cette idée n'est pas à toi.");
  return toIdea(row);
}

export function addIdea(db: Db, authorId: number, targetId: number, body: string): Idea {
  if (authorId === targetId) throw new ValidationError("Tu ne peux pas souffler une idée pour toi-même.");
  if (!db.prepare("SELECT 1 FROM participant WHERE id = ?").get(targetId)) {
    throw new ValidationError("Cette personne n'existe pas.");
  }
  const at = now().toISOString();
  const id = Number(
    db
      .prepare("INSERT INTO idea (author_id, target_id, body_enc, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
      .run(authorId, targetId, box().seal(cleanBody(body)), at, at).lastInsertRowid,
  );
  return getOwned(db, authorId, id);
}

export function updateIdea(db: Db, authorId: number, id: number, body: string): Idea {
  getOwned(db, authorId, id);
  db.prepare("UPDATE idea SET body_enc = ?, updated_at = ? WHERE id = ?").run(
    box().seal(cleanBody(body)),
    now().toISOString(),
    id,
  );
  return getOwned(db, authorId, id);
}

export function deleteIdea(db: Db, authorId: number, id: number): void {
  getOwned(db, authorId, id);
  db.prepare("DELETE FROM idea WHERE id = ?").run(id);
}

export function listIdeasByAuthor(db: Db, authorId: number): Idea[] {
  return (db.prepare("SELECT * FROM idea WHERE author_id = ? ORDER BY id DESC").all(authorId) as Row[]).map(toIdea);
}

export function listIdeasForTarget(db: Db, targetId: number): Idea[] {
  return (db.prepare("SELECT * FROM idea WHERE target_id = ? ORDER BY id DESC").all(targetId) as Row[]).map(toIdea);
}
