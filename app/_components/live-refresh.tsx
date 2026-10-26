"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const MAX_ERRORS = 5;
const MAX_BACKOFF_MS = 30_000;

/**
 * Refreshes the page on every server event. Reconnects with backoff when the browser gives up on the
 * stream, and reloads after repeated failures so an expired Access session goes back through login.
 */
export function LiveRefresh() {
  const router = useRouter();
  useEffect(() => {
    let source: EventSource | null = null;
    let errors = 0;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      source = new EventSource("/api/events");
      source.onopen = () => {
        errors = 0;
      };
      source.onmessage = () => router.refresh();
      source.onerror = () => {
        errors += 1;
        if (errors >= MAX_ERRORS) {
          source?.close();
          window.location.reload();
          return;
        }
        if (source?.readyState === EventSource.CLOSED) {
          source.close();
          retry = setTimeout(connect, Math.min(MAX_BACKOFF_MS, 1000 * 2 ** errors));
        }
      };
    };

    connect();
    return () => {
      clearTimeout(retry);
      source?.close();
    };
  }, [router]);
  return null;
}
