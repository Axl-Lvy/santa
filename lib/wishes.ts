import type { Db } from "./db";
import { ValidationError } from "./errors";
import { now } from "./time";

export type Wish = {
  id: number;
  ownerId: number;
  title: string;
  detail: string | null;
  url: string | null;
  position: number;
};

export type WishInput = { title: string; detail: string; url: string };

type Row = { id: number; owner_id: number; title: string; detail: string | null; url: string | null; position: number };

const toWish = (r: Row): Wish => ({
  id: r.id,
  ownerId: r.owner_id,
  title: r.title,
  detail: r.detail,
  url: r.url,
  position: r.position,
});

function clean(input: WishInput): { title: string; detail: string | null; url: string | null } {
  const title = input.title.trim();
  const detail = input.detail.trim();
  const url = input.url.trim();
  if (!title) throw new ValidationError("Dis-nous ce qui te ferait plaisir.");
  if (title.length > 200) throw new ValidationError("C'est un peu long : 200 caractères maximum.");
  if (detail.length > 500) throw new ValidationError("Le détail est un peu long : 500 caractères maximum.");
  if (url && (url.length > 2000 || !/^https?:\/\/\S+$/i.test(url))) {
    throw new ValidationError("Le lien doit commencer par http:// ou https://");
  }
  return { title, detail: detail || null, url: url || null };
}

export function listWishes(db: Db, ownerId: number): Wish[] {
  return (db.prepare("SELECT * FROM wish WHERE owner_id = ? ORDER BY position, id").all(ownerId) as Row[]).map(toWish);
}

function getOwned(db: Db, ownerId: number, id: number): Wish {
  const row = db.prepare("SELECT * FROM wish WHERE id = ?").get(id) as Row | undefined;
  if (!row || row.owner_id !== ownerId) throw new ValidationError("Cette envie n'est pas à toi.");
  return toWish(row);
}

export function addWish(db: Db, ownerId: number, input: WishInput): Wish {
  const { title, detail, url } = clean(input);
  const at = now().toISOString();
  const position =
    (db.prepare("SELECT coalesce(max(position) + 1, 0) FROM wish WHERE owner_id = ?").pluck().get(ownerId) as number) ?? 0;
  const id = Number(
    db
      .prepare(
        "INSERT INTO wish (owner_id, title, detail, url, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run(ownerId, title, detail, url, position, at, at).lastInsertRowid,
  );
  return getOwned(db, ownerId, id);
}

export function updateWish(db: Db, ownerId: number, id: number, input: WishInput): Wish {
  getOwned(db, ownerId, id);
  const { title, detail, url } = clean(input);
  db.prepare("UPDATE wish SET title = ?, detail = ?, url = ?, updated_at = ? WHERE id = ?").run(
    title,
    detail,
    url,
    now().toISOString(),
    id,
  );
  return getOwned(db, ownerId, id);
}

export function deleteWish(db: Db, ownerId: number, id: number): void {
  getOwned(db, ownerId, id);
  db.prepare("DELETE FROM wish WHERE id = ?").run(id);
}
