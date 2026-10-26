"use client";

import { useState } from "react";

import styles from "@/app/_components/card.module.css";
import { useAction } from "@/app/_components/use-action";
import { addRuleAction, removeRuleAction } from "@/lib/actions/admin";

import admin from "./organisation.module.css";

type Person = { id: number; firstName: string };

export function RuleForm({ people, rules }: { people: Person[]; rules: [number, number][] }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const { pending, error, run } = useAction();
  const name = (id: number) => people.find((p) => p.id === id)?.firstName ?? "?";

  return (
    <>
      <div className={admin.sectionHead}>
        <h2>Ne se tirent pas entre eux</h2>
      </div>
      <div className={admin.list}>
        {rules.map(([x, y]) => (
          <div key={`${x}-${y}`} className={admin.item}>
            <span className={admin.pair}>
              {name(x)}
              <i>✕</i>
              {name(y)}
            </span>
            <button
              type="button"
              className={admin.icon}
              disabled={pending}
              onClick={() => run(() => removeRuleAction(x, y))}
              aria-label={`Supprimer la règle ${name(x)} et ${name(y)}`}
            >
              🗑
            </button>
          </div>
        ))}
        <div className={admin.pickers}>
          <select className={admin.select} value={a} onChange={(e) => setA(e.target.value)} aria-label="Première personne">
            <option value="">Choisir…</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName}
              </option>
            ))}
          </select>
          <span aria-hidden>✕</span>
          <select className={admin.select} value={b} onChange={(e) => setB(e.target.value)} aria-label="Deuxième personne">
            <option value="">Choisir…</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonGhost}`}
          style={{ marginBottom: 10 }}
          disabled={pending || !a || !b}
          onClick={() =>
            run(
              () => addRuleAction(Number(a), Number(b)),
              () => {
                setA("");
                setB("");
              },
            )
          }
        >
          ＋ Ajouter
        </button>
        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
    </>
  );
}
