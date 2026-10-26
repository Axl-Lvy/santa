"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "../db";
import { addIdea, deleteIdea, updateIdea } from "../ideas";
import { notifyIdea } from "../notify";
import { requireParticipant } from "../viewer";
import { attempt, type ActionResult } from "./result";

export async function saveIdeaAction(
  id: number | null,
  targetId: number,
  body: string,
): Promise<ActionResult> {
  const { me } = await requireParticipant();
  const db = getDb();
  const result = await attempt(() => {
    const idea = id === null ? addIdea(db, me.id, targetId, body) : updateIdea(db, me.id, id, body);
    notifyIdea(db, idea.targetId);
  });
  revalidatePath("/", "layout");
  return result;
}

export async function deleteIdeaAction(id: number): Promise<ActionResult> {
  const { me } = await requireParticipant();
  const result = await attempt(() => deleteIdea(getDb(), me.id, id));
  revalidatePath("/", "layout");
  return result;
}
