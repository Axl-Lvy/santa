"use server";

import { getDb } from "../db";
import { isDrawn } from "../event";
import { now } from "../time";
import { requireParticipant } from "../viewer";

/** Records that the viewer has scratched their ticket; no revalidation, so the reveal stays on screen. */
export async function markRevealedAction(): Promise<void> {
  const { me } = await requireParticipant();
  const db = getDb();
  if (!isDrawn(db)) return;
  db.prepare("UPDATE participant SET revealed_at = ? WHERE id = ? AND revealed_at IS NULL").run(
    now().toISOString(),
    me.id,
  );
}
