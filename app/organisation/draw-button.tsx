"use client";

import { useState } from "react";

import styles from "@/app/_components/card.module.css";
import { Sheet } from "@/app/_components/sheet";
import { useAction } from "@/app/_components/use-action";
import { launchDrawAction } from "@/lib/actions/admin";

export function DrawButton({ disabled, count }: { disabled: boolean; count: number }) {
  const [open, setOpen] = useState(false);
  const { pending, error, run } = useAction();
  return (
    <>
      <button type="button" className={`${styles.button} ${styles.buttonBrick}`} disabled={disabled} onClick={() => setOpen(true)}>
        Lancer le tirage 🎲
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Lancer le tirage ?">
        <div style={{ fontSize: 40, textAlign: "center" }} aria-hidden>
          🎲
        </div>
        <p style={{ margin: 0 }}>
          C&apos;est <b>définitif</b> : les participants et les règles ne pourront plus changer.
        </p>
        <p style={{ margin: 0 }}>
          Les {count} participants recevront un email pour découvrir leur personne. Toi non plus, tu ne verras pas le résultat.
        </p>
        {error ? <p className={styles.error}>{error}</p> : null}
        <button
          type="button"
          className={`${styles.button} ${styles.buttonBrick}`}
          disabled={pending}
          onClick={() => run(() => launchDrawAction(), () => setOpen(false))}
        >
          Oui, lancer le tirage
        </button>
        <button type="button" className={`${styles.button} ${styles.buttonGhost}`} disabled={pending} onClick={() => setOpen(false)}>
          Pas encore
        </button>
      </Sheet>
    </>
  );
}
