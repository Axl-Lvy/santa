"use client";

import { startTransition, useState } from "react";

import type { ActionResult } from "@/lib/actions/result";

import { Bubble } from "./bubble";
import styles from "./chat.module.css";

type Outgoing = { key: number; body: string; status: "sending" | "failed" };

/** The message box, plus the bubbles of messages still sending or that failed to send. */
export function ChatComposer({
  placeholder,
  onSend,
}: {
  placeholder: string;
  onSend: (body: string) => Promise<ActionResult<unknown>>;
}) {
  const [text, setText] = useState("");
  const [outbox, setOutbox] = useState<Outgoing[]>([]);

  const deliver = (item: Outgoing) => {
    setOutbox((o) => [...o.filter((x) => x.key !== item.key), { ...item, status: "sending" }]);
    startTransition(async () => {
      const result = await onSend(item.body).catch(() => ({ ok: false as const, error: "" }));
      startTransition(() =>
        setOutbox((o) =>
          result.ok
            ? o.filter((x) => x.key !== item.key)
            : o.map((x) => (x.key === item.key ? { ...x, status: "failed" } : x)),
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
          maxLength={2000}
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
