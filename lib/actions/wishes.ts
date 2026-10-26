"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "../db";
import { requireParticipant } from "../viewer";
import { addWish, deleteWish, updateWish, type Wish, type WishInput } from "../wishes";
import { attempt, type ActionResult } from "./result";

export async function saveWishAction(id: number | null, input: WishInput): Promise<ActionResult<Wish>> {
  const { me } = await requireParticipant();
  const result = await attempt(() => (id === null ? addWish(getDb(), me.id, input) : updateWish(getDb(), me.id, id, input)));
  revalidatePath("/", "layout");
  return result;
}

export async function deleteWishAction(id: number): Promise<ActionResult> {
  const { me } = await requireParticipant();
  const result = await attempt(() => deleteWish(getDb(), me.id, id));
  revalidatePath("/", "layout");
  return result;
}
