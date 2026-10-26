import { box } from "./crypto";
import type { Db } from "./db";

let cache = new WeakMap<Db, Map<number, number>>();

/** Drops the in-memory copy of the draw (tests only). */
export function resetAssignmentCache(): void {
  cache = new WeakMap();
}

/** Stores the whole draw as one sealed blob. */
export function saveAssignment(db: Db, assignment: Map<number, number>): void {
  db.prepare("INSERT INTO assignment_blob (id, payload_enc) VALUES (1, ?)").run(
    box().seal(Object.fromEntries(assignment)),
  );
  cache.set(db, new Map(assignment));
}

/** The giver → receiver map, or null before the draw; decrypted once per process. */
export function loadAssignment(db: Db): Map<number, number> | null {
  const cached = cache.get(db);
  if (cached) return cached;
  const raw = db.prepare("SELECT payload_enc FROM assignment_blob WHERE id = 1").pluck().get() as
    string | undefined;
  if (!raw) return null;
  const map = new Map(
    Object.entries(box().open<Record<string, number>>(raw)).map(([g, r]) => [Number(g), r]),
  );
  cache.set(db, map);
  return map;
}

export function gifteeOf(db: Db, id: number): number | null {
  return loadAssignment(db)?.get(id) ?? null;
}

export function santaOf(db: Db, id: number): number | null {
  for (const [giver, receiver] of loadAssignment(db) ?? []) if (receiver === id) return giver;
  return null;
}
