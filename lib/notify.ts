import type { AnonMessage } from "./anon-messages";
import { santaOf } from "./assignment";
import { publish, type LiveKind } from "./bus";
import type { Db } from "./db";

function everyone(db: Db): number[] {
  return db.prepare("SELECT id FROM participant").pluck().all() as number[];
}

/** Tells every participant's pages, the author's other tabs included, about a family chat message. */
export function notifyGroup(db: Db): void {
  for (const id of everyone(db)) publish(id, "group");
}

/** A wishlist is seen only by its owner and, after the draw, their Santa. */
export function notifyWishlistChanged(db: Db, ownerId: number): void {
  publish(ownerId, "wishlist");
  const santa = santaOf(db, ownerId);
  if (santa !== null) publish(santa, "wishlist");
}

export function notifyAll(db: Db, kind: LiveKind): void {
  for (const id of everyone(db)) publish(id, kind);
}

/** Tells the other side of one Santa–giftee pair, and the sender's other tabs. */
export function notifyAnon(db: Db, m: AnonMessage): void {
  const santa = santaOf(db, m.gifteeId);
  if (santa === null) return;
  if (m.direction === "from_santa") {
    publish(m.gifteeId, "santa");
    publish(santa, "giftee");
  } else {
    publish(santa, "giftee");
    publish(m.gifteeId, "santa");
  }
}

/** Tells the target's Santa that a new idea is waiting, once the draw exists. */
export function notifyIdea(db: Db, targetId: number): void {
  const santa = santaOf(db, targetId);
  if (santa !== null) publish(santa, "ideas");
}
