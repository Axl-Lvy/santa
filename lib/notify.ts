import { publish, type LiveKind } from "./bus";
import type { Db } from "./db";

function everyone(db: Db): number[] {
  return db.prepare("SELECT id FROM participant").pluck().all() as number[];
}

/** Tells every participant's pages, the author's other tabs included, about a family chat message. */
export function notifyGroup(db: Db): void {
  for (const id of everyone(db)) publish(id, "group");
}

export function notifyWishlistChanged(db: Db): void {
  for (const id of everyone(db)) publish(id, "wishlist");
}

export function notifyAll(db: Db, kind: LiveKind): void {
  for (const id of everyone(db)) publish(id, kind);
}
