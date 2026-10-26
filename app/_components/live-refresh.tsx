"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const MAX_ERRORS = 5;

/** Refreshes the page on every server event; reloads when the stream keeps failing (expired Access session). */
export function LiveRefresh() {
  const router = useRouter();
  useEffect(() => {
    const source = new EventSource("/api/events");
    let errors = 0;
    source.onopen = () => {
      errors = 0;
    };
    source.onmessage = () => router.refresh();
    source.onerror = () => {
      errors += 1;
      if (errors >= MAX_ERRORS) {
        source.close();
        window.location.reload();
      }
    };
    return () => source.close();
  }, [router]);
  return null;
}
