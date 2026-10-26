"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "../db";
import { postGroupMessage } from "../group-messages";
import { notifyGroup } from "../notify";
import { requireParticipant } from "../viewer";
import { attempt, type ActionResult } from "./result";

export async function sendGroupMessageAction(body: string): Promise<ActionResult> {
  const { me } = await requireParticipant();
  const db = getDb();
  const result = await attempt(() => {
    postGroupMessage(db, me, body);
  });
  if (result.ok) notifyGroup(db);
  revalidatePath("/", "layout");
  return result;
}
