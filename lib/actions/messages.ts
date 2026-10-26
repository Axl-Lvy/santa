"use server";

import { revalidatePath } from "next/cache";

import { postAnon } from "../anon-messages";
import { getDb } from "../db";
import { postGroupMessage } from "../group-messages";
import { notifyAnon, notifyGroup } from "../notify";
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

export async function sendAnonMessageAction(
  to: "giftee" | "santa",
  body: string,
): Promise<ActionResult> {
  const { me } = await requireParticipant();
  const db = getDb();
  const result = await attempt(() => postAnon(db, me, to, body));
  if (result.ok) notifyAnon(db, result.value);
  revalidatePath("/", "layout");
  return result.ok ? { ok: true, value: undefined } : result;
}
