import { unstable_rethrow } from "next/navigation";

import { UserError } from "../errors";

export type ActionResult<T = void> = { ok: true; value: T } | { ok: false; error: string };

const GENERIC = "Oups, quelque chose s'est mal passé. Réessaie dans un instant.";

/** Runs an action body, turning user errors into a French message for the screen. */
export async function attempt<T>(fn: () => T | Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, value: await fn() };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof UserError) return { ok: false, error: error.message };
    console.error(`santa: action failed: ${error instanceof Error ? error.name : "unknown"}`);
    return { ok: false, error: GENERIC };
  }
}
