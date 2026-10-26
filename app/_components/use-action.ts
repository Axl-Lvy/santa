"use client";

import { useState, useTransition } from "react";

import type { ActionResult } from "@/lib/actions/result";

/** Runs a server action in a transition and keeps its French error message. */
export function useAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = <T>(action: () => Promise<ActionResult<T>>, onOk?: (value: T) => void) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setError(null);
        onOk?.(result.value);
      } else {
        setError(result.error);
      }
    });
  return { pending, error, setError, run };
}
