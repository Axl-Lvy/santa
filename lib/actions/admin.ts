"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "../db";
import { ValidationError } from "../errors";
import { setBudget } from "../event";
import { addParticipant, removeParticipant, updateParticipant } from "../participants";
import { addRule, removeRule } from "../rules";
import { requireAdmin } from "../viewer";
import { attempt, type ActionResult } from "./result";

async function adminDo(fn: () => void): Promise<ActionResult> {
  await requireAdmin();
  const result = await attempt(() => {
    fn();
    return undefined;
  });
  revalidatePath("/", "layout");
  return result;
}

export async function addParticipantAction(firstName: string, email: string): Promise<ActionResult> {
  return adminDo(() => addParticipant(getDb(), { firstName, email }));
}

export async function updateParticipantAction(id: number, firstName: string, email: string): Promise<ActionResult> {
  return adminDo(() => updateParticipant(getDb(), id, { firstName, email }));
}

export async function removeParticipantAction(id: number): Promise<ActionResult> {
  return adminDo(() => removeParticipant(getDb(), id));
}

export async function addRuleAction(a: number, b: number): Promise<ActionResult> {
  return adminDo(() => addRule(getDb(), a, b));
}

export async function removeRuleAction(a: number, b: number): Promise<ActionResult> {
  return adminDo(() => removeRule(getDb(), a, b));
}

export async function setBudgetAction(raw: string): Promise<ActionResult> {
  return adminDo(() => {
    const trimmed = raw.trim();
    if (trimmed === "") return setBudget(getDb(), null);
    if (!/^\d+$/.test(trimmed)) throw new ValidationError("Le budget doit être un nombre entier d'euros.");
    setBudget(getDb(), Number(trimmed));
  });
}
