"use client";

import { useState, useTransition } from "react";

import type { ActionResult } from "@/lib/actions/result";

const LOST = "La connexion a été perdue. Recharge la page et réessaie.";

/** Runs a server action in a transition and keeps its French error message, including when the request itself fails. */
export function useAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = <T>(action: () => Promise<ActionResult<T>>, onOk?: (value: T) => void) =>
    startTransition(async () => {
      const result = await action().catch((): ActionResult<T> => ({ ok: false, error: LOST }));
      if (result.ok) {
        setError(null);
        onOk?.(result.value);
      } else {
        setError(result.error);
      }
    });
  return { pending, error, setError, run };
}
