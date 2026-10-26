"use client";

import { startTransition, useEffect, useRef, useState } from "react";

import type { ActionResult } from "@/lib/actions/result";

import { Bubble } from "./bubble";
import styles from "./chat.module.css";

type Outgoing = { key: number; body: string; status: "sending" | "failed"; error?: string };
type Saved = { text: string; outbox: Outgoing[] };

function load(storageKey: string | undefined): Saved | null {
  if (!storageKey) return null;
  try {
    const raw = sessionStorage.getItem(`composer:${storageKey}`);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function save(storageKey: string | undefined, saved: Saved): void {
  if (!storageKey) return;
  try {
    sessionStorage.setItem(`composer:${storageKey}`, JSON.stringify(saved));
  } catch {
    // Private mode or full storage: the message just isn't kept across a reload.
  }
}

/** The message box, plus the bubbles still sending or that failed; both survive a reload of the tab. */
export function ChatComposer({
  placeholder,
  onSend,
  storageKey,
}: {
  placeholder: string;
  onSend: (body: string) => Promise<ActionResult<unknown>>;
  storageKey?: string;
}) {
  const [text, setText] = useState("");
  const [outbox, setOutbox] = useState<Outgoing[]>([]);
  const restored = useRef(false);

  useEffect(() => {
    const saved = load(storageKey);
    restored.current = true;
    if (!saved) return;
    // A send interrupted by the reload is unknown: offer it again rather than lose it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText(saved.text);
    setOutbox(saved.outbox.map((o) => ({ ...o, status: "failed" })));
  }, [storageKey]);

  useEffect(() => {
    if (restored.current) save(storageKey, { text, outbox });
  }, [storageKey, text, outbox]);

  const deliver = (item: Outgoing) => {
    setOutbox((o) => [
      ...o.filter((x) => x.key !== item.key),
      { ...item, status: "sending", error: undefined },
    ]);
    startTransition(async () => {
      const result = await onSend(item.body).catch(() => ({ ok: false as const, error: "" }));
      startTransition(() =>
        setOutbox((o) =>
          result.ok
            ? o.filter((x) => x.key !== item.key)
            : o.map((x) =>
                x.key === item.key ? { ...x, status: "failed", error: result.error } : x,
              ),
        ),
      );
    });
  };

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    setText("");
    deliver({ key: Date.now(), body, status: "sending" });
  };

  return (
    <>
      <div className={styles.outbox}>
        {outbox.map((item) =>
          item.status === "failed" ? (
            <div key={item.key} className={styles.failed}>
              <Bubble mine>{item.body}</Bubble>
              {item.error && !item.error.startsWith("Oups") ? (
                <span className={styles.failedReason}>{item.error}</span>
              ) : null}
              <button type="button" className={styles.retry} onClick={() => deliver(item)}>
                Pas envoyé · Réessayer
              </button>
            </div>
          ) : (
            <Bubble key={item.key} mine sending>
              {item.body}
            </Bubble>
          ),
        )}
      </div>
      <form
        className={styles.composer}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <textarea
          className={styles.input}
          rows={1}
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label={placeholder}
        />
        <button type="submit" className={styles.send} disabled={!text.trim()} aria-label="Envoyer">
          ➤
        </button>
      </form>
    </>
  );
}
